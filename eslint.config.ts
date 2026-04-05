import { createConfigForNuxt } from '@nuxt/eslint-config/flat';
import eslintConfigPrettier from 'eslint-config-prettier/flat';

export default createConfigForNuxt({
	features: {
		tooling: true,
		stylistic: true,
	},
	dirs: {
		src: ['./packages/playground-common', './packages/playground-vite'],
	},
}).append(eslintConfigPrettier, {
	rules: {
		eqeqeq: 'error',
		'nuxt/nuxt-config-keys-order': 'off',
	},
});
