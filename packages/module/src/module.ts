import type { ModuleOptions } from './types';
import { createScanPageMetaHook } from './builder/hook/scan-page-meta';
import { defineNuxtModule, addBuildPlugin, useLogger } from '@nuxt/kit';
import { createNexusTransformPlugin } from './builder/plugin/transform';

const regExpVue = /\.vue$/;
const logger = useLogger('nuxt-nexus');

export default defineNuxtModule<ModuleOptions>({
	meta: {
		name: 'nuxt-nexus',
		configKey: 'nexus',
		compatibility: {
			nuxt: '^4.0.0',
			builder: {
				webpack: false,
				rspack: false,
			},
		},
	},
	setup(options, nuxt) {
		const loaders = options.loader;

		// 没有 loader 就是没启用
		if (!loaders?.length) return;

		// 整理出 includes
		const includesSet = new Set<string>();
		for (const [index, loader] of loaders.entries()) {
			const rawExtensions = Array.isArray(loader.extensions) ? loader.extensions : [loader.extensions];

			for (const ext of rawExtensions) {
				if (!ext) continue;

				const normalized = ext.startsWith('.') ? ext : `.${ext}`;

				if (includesSet.has(normalized)) {
					logger.fail(`Duplicate extension "${normalized}" found in loader[${index}].`);
					return;
				}
				includesSet.add(normalized);
			}
		}
		const includes = Array.from(includesSet);

		// 转换为正则
		const includesRegExp: RegExp[] = includes.map((ext) => {
			return new RegExp(`\\${ext}$`);
		});

		// 扩展识别
		nuxt.options.extensions.push(...includes);

		// Nuxt 自动导入
		const transform = (nuxt.options.imports.transform ||= {});
		const include = (transform.include ||= [regExpVue]);
		if (Array.isArray(include)) include.push(...includesRegExp);

		// Nuxt 组件
		const components = nuxt.options.components;
		if (components && typeof components === 'object' && !Array.isArray(components)) {
			const transform = components.transform || (components.transform = {});
			const existingInclude = transform.include || [];
			const includeArray = Array.isArray(existingInclude) ? existingInclude : [existingInclude];
			transform.include = [...new Set([...includeArray, ...includesRegExp, regExpVue])];
		}

		// Vite 构建器
		if (nuxt.options.builder === '@nuxt/vite-builder' || nuxt.options.vite) {
			nuxt.options.vite.vue ||= {};
			const existingInclude = nuxt.options.vite.vue.include || [regExpVue];
			const includeArray = Array.isArray(existingInclude) ? existingInclude : [existingInclude];
			nuxt.options.vite.vue.include = [...new Set([...includeArray, ...includesRegExp])];
		}

		/*
		// Webpack 构建器
		if (nuxt.options.builder === '@nuxt/webpack-builder') {
			nuxt.hook('webpack:config', (configs) => {
				for (const config of configs) {
					// TODO
				}
			});
		}

		// TODO ! 上下这两个也许可以合并

		// Rspack 构建器
		if (nuxt.options.builder === '@nuxt/rspack-builder') {
			nuxt.hook('rspack:config', (configs) => {
				for (const config of configs) {
					// TODO
				}
			});
		}
		*/

		// 元数据扫描
		nuxt.addHooks(createScanPageMetaHook(options, includesSet));

		// 构建器插件
		nuxt.hook('modules:done', () => {
			addBuildPlugin({
				vite: () => createNexusTransformPlugin(options, includesSet).vite(options),
				// webpack: () => createNexusTransformPlugin(options, includesSet).webpack(options),
				// rspack: () => createNexusTransformPlugin(options, includesSet).rspack(options),
			});
		});
	},
});

export type * from './types';
