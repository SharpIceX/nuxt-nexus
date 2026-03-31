import type { Rollup } from 'vite';
import type { PageMeta } from 'nuxt/app';

// TODO ? 可能 IDE 的智能提示会失效，但可能仍可进行`跳转到类型定义`
type NexusPageMeta = Omit<PageMeta, 'meta' | '_sync' | 'file'> & {
	[key: string]: unknown;
};

interface LoaderOption {
	/**
	 * Specifies the file patterns to include.
	 * Can be a single regular expression or an array of regular expressions.
	 *
	 * @example
	 * ```ts
	 * // Single pattern
	 * include: "md"
	 *
	 * // Multiple patterns
	 * include: ["md"], "adoc"]
	 * ```
	 */
	extensions: string | string[];

	/**
	 * Route Resolution Hook: Invoked during the Nuxt route scanning phase.
	 * Responsible for parsing the file source (e.g., extracting Frontmatter)
	 * and returning a route configuration object.
	 *
	 * @param code - The raw source code of the file.
	 * @param id - The absolute file path of the resource. Note: This ID may include query parameters (e.g., `?macro=true`).
	 * @returns A {@link NexusPageMeta} object to be injected into the Nuxt route tree.
	 */
	resolvePagesRoutes?: (code: string, id: string) => NexusPageMeta | Promise<NexusPageMeta>;

	/**
	 * Transformation Hook: Invoked during the build phase (Vite/Webpack).
	 * Responsible for converting non-standard formats (like Markdown) into
	 * standard Vue Single File Component (SFC) code.
	 *
	 * @param code - The raw source code of the file.
	 * @param id - The absolute file path (ID) of the resource.
	 * @returns A standard Rollup transformation result. If a string is returned,
	 * it is treated as the transformed source code.
	 */
	transformPage: (code: string, id: string) => Promise<Rollup.TransformResult> | Rollup.TransformResult;
}

interface ModuleOptions {
	loader?: LoaderOption[];
}

export type { LoaderOption, ModuleOptions, NexusPageMeta };
