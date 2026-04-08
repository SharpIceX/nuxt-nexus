import path from 'node:path';

export default defineNuxtConfig({
	compatibilityDate: 'latest',
	srcDir: path.resolve(import.meta.dirname, './src'),
	modules: ['../module/src/module.ts', '@nuxtjs/seo'],
	nexus: {
		loader: [
			{
				extensions: 'md',
				transformPage: (code: string, id: string) => {
					return `
<template>
    <p>${id}</p>
    <p>
	${code}
	</p>
</template>
`;
				},

				resolvePagesRoutes: (code: string, id: string) => {
					return {
						title: code.split('\n')[0] || 'Not Ttitle',
						description: id,
					};
				},
			},
		],
	},
	app: {
		head: {
			titleTemplate: '%s - nuxt',
		},
	},
});
