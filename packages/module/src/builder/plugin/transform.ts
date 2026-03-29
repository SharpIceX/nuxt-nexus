import path from 'node:path/posix';
import { createUnplugin } from 'unplugin';
import type { ModuleOptions } from '~/src/types';

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

			// TODO 可能要忽略 raw 等查询参数
			async transform(code, id) {
				const [purePath, query] = id.split('?');
				const searchParams = new URLSearchParams(query);
				const extName = path.extname(purePath || '');

				// 忽略 Vue 内部处理请求
				const isVueInternal = searchParams.has('vue') || searchParams.has('type');
				if (isVueInternal) return;

				// 找到对应的 loader
				const matchedLoader = moduleOptions.loader?.find((loader) => {
					const exts = Array.isArray(loader.extensions) ? loader.extensions : [loader.extensions];
					return exts.some((ext) => (ext.startsWith('.') ? ext : `.${ext}`) === extName);
				});

				if (matchedLoader) {
					const TransformResult = await matchedLoader.transformPage(code, id);

					// 带有宏请求时
					if (searchParams.get('macro') === 'true') {
						// TODO !
					}

					if (!TransformResult) return code;

					if (typeof TransformResult === 'string') {
						return {
							map: { mappings: '' },
							code: TransformResult,
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
