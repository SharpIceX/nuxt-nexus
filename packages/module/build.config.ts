import { defineBuildConfig } from 'unbuild';

export default defineBuildConfig({
	clean: true,
	sourcemap: true,
	entries: ['./src/module'],
	rollup: {
		emitCJS: true,
		cjsBridge: true,
	},
	externals: ['unplugin', 'magic-string', 'oxc-parser', '@vue/compiler-sfc', 'vite'],
});
