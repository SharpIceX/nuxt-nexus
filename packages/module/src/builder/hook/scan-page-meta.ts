import path from 'node:path';
import fs from 'node:fs/promises';
import type { NuxtHooks } from 'nuxt/schema';
import type { ModuleOptions } from '../../types';

const createScanPageMetaHook = (options: ModuleOptions, includesSet: Set<string>): Partial<NuxtHooks> => {
	return {
		'pages:resolved': async (pages) => {
			for (const page of pages) {
				if (!page.file) continue;

				const extName = path.extname(page.file);
				if (!includesSet.has(extName)) continue;

				// 找到对应的 loader
				const matchedLoader = options.loader?.find((loader) => {
					const exts = Array.isArray(loader.extensions) ? loader.extensions : [loader.extensions];
					return exts.some((ext) => (ext.startsWith('.') ? ext : `.${ext}`) === extName);
				});

				if (matchedLoader?.resolvePagesRoutes) {
					const code = await fs.readFile(page.file, 'utf-8');
					const result = await matchedLoader.resolvePagesRoutes(code, page.file);

					page.meta = {
						...(page.meta || {}),
						...result,
					};
				}
			}
		},
	};
};

export { createScanPageMetaHook };
