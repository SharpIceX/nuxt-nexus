import type { Rollup } from 'vite';
import path from 'node:path/posix';
import { parseSync } from 'oxc-parser';
import MagicString from 'magic-string';
import { createUnplugin } from 'unplugin';
import type { ModuleOptions, NexusPageMeta } from '~/src/types';
import { parse as vueParse, type SFCScriptBlock } from '@vue/compiler-sfc';

const IGNORE_QUERY_PARAMETERS = new Set([
	// Vue 内部
	'vue',
	'type',
	// Vite 内部
	'raw',
	'url',
	'worker',
	'sharedworker',
	'init',
	'inline',
	'no-inline',
	'component',
]);

/**
 * 检查脚本内容中是否包含 definePageMeta 宏
 * @param script Vue 解析器解析出的脚本块对象
 */
const checkDefinePageMeta = (script: SFCScriptBlock): boolean => {
	const { program } = parseSync(`file.${script.lang || 'js'}`, script.content);
	return program.body.some((node) => {
		return (
			node.type === 'ExpressionStatement' &&
			node.expression.type === 'CallExpression' &&
			node.expression.callee.type === 'Identifier' &&
			node.expression.callee.name === 'definePageMeta'
		);
	});
};

/**
 * 为 vue 添加 definePageMeta 宏
 * @param code vue 字符串
 * @param meta 待添加的 meta
 * @param id 文件路径
 * @returns 若已存在则则直接返回原始内容，否则返回添加后的结果
 */
const addDefinePageMeta = (code: string, meta: NexusPageMeta, id: string): Rollup.TransformResult => {
	const { descriptor } = vueParse(code);
	const definePageMetaStr = `\ndefinePageMeta(${JSON.stringify(meta)});\n`;

	const script = descriptor.scriptSetup || descriptor.script;

	// 没有任何 script 的情况下
	if (!script) return `<script setup>${definePageMetaStr}</script>\n\n${code}`;

	// 检查是否已存在宏
	const hasInSetup = descriptor.scriptSetup ? checkDefinePageMeta(descriptor.scriptSetup) : false;
	const hasInNormal = descriptor.script ? checkDefinePageMeta(descriptor.script) : false;
	if (hasInSetup || hasInNormal) return code;

	// 不存在宏
	const { loc } = script;
	const s = new MagicString(code);
	s.appendRight(loc.start.offset, definePageMetaStr);

	return {
		code: s.toString(),
		map: s.generateMap({
			hires: true,
			source: id,
			includeContent: true,
		}),
	};
};

const createNexusTransformPlugin = (moduleOptions: ModuleOptions, includesSet: Set<string>) => {
	return createUnplugin((_options) => {
		return {
			name: 'nuxt-nexus-transform',
			enforce: 'pre',

			transformInclude(id) {
				const [pathName] = id.split('?');
				if (!pathName) return;

				const extName = path.extname(pathName);
				return includesSet.has(extName);
			},

			async transform(code, id) {
				const [purePath, query] = id.split('?');
				const searchParams = new URLSearchParams(query);
				const extName = path.extname(purePath || '');

				const shouldIgnore = Array.from(searchParams.keys()).some((key) => IGNORE_QUERY_PARAMETERS.has(key));
				if (shouldIgnore) return;

				// 找到对应的 loader
				const matchedLoader = moduleOptions.loader?.find((loader) => {
					const exts = Array.isArray(loader.extensions) ? loader.extensions : [loader.extensions];
					return exts.some((ext) => (ext.startsWith('.') ? ext : `.${ext}`) === extName);
				});

				if (matchedLoader) {
					let TransformResult = await matchedLoader.transformPage(code, id);

					// 带有宏请求时
					if (searchParams.get('macro') === 'true' && matchedLoader.resolvePagesRoutes) {
						const currentCode =
							typeof TransformResult === 'string' ? TransformResult : (TransformResult?.code ?? code);

						const pageMeta = await matchedLoader.resolvePagesRoutes(code, id);
						TransformResult = addDefinePageMeta(currentCode, pageMeta, id);
					}

					if (!TransformResult) return code;

					if (typeof TransformResult === 'string') {
						return {
							code: TransformResult,
							map: { mappings: '' },
						};
					} else {
						return {
							// 默认参数
							map: { mappings: '' },

							...TransformResult,
							code: TransformResult.code ?? code,
						};
					}
				}

				return code;
			},
		};
	});
};

export { createNexusTransformPlugin };
