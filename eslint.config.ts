import { createConfigForNuxt } from '@nuxt/eslint-config/flat';
import eslintConfigPrettier from 'eslint-config-prettier/flat';

export default createConfigForNuxt({
	features: {
		tooling: true,
		stylistic: true,
	},
	dirs: {
		// 可能需要加入 Webpack 或 Rspack
		src: ['./packages/playground-common', './packages/playground-vite'],
	},
}).append(eslintConfigPrettier, {
	rules: {
		eqeqeq: 'error',
		'nuxt/nuxt-config-keys-order': 'off',
	},
});
