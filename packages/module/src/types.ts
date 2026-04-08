import type { Rollup } from 'vite';
import type { RouteMeta } from 'vue-router';
import type { NuxtHooks } from 'nuxt/schema';

/**
 * Extract the individual page object type from the 'pages:resolved' Nuxt hook.
 */
type RawNuxtPage = Parameters<NuxtHooks['pages:resolved']>[0][number];

/**
 * Basic route properties (path, name, alias, etc.) from NuxtPage,
 * excluding internal and recursive fields.
 */
type NexusRouteBase = {
	[K in keyof RawNuxtPage as K extends 'meta' | '_sync' | 'file' ? never : K]?: RawNuxtPage[K] | undefined;
};

/**
 * Standard Vue Router metadata (layout, middleware, etc.),
 * made partial to ensure compatibility with strict optional types.
 */
type NexusStandardMeta = Partial<RouteMeta>;

type NexusPageMeta = NexusRouteBase &
	NexusStandardMeta & {
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
	 * extensions: "md"
	 *
	 * // Multiple patterns
	 * extensions: ["md", "adoc"]
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
	 * Transformation Hook: Invoked during the build phase.
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
