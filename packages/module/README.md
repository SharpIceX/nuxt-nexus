<!-- markdownlint-disable MD041 -->

Transform any file into a Nuxt page with custom compilers and Nuxt metadata pre-scanning.

## Install

```shell
npx nuxi@latest module add nuxt-nexus

# or install manually:

npm add nuxt-nexus
yarn add nuxt-nexus
pnpm add nuxt-nexus
```

## Usage

```typescript
// nuxt.config.ts
export default defineNuxtConfig({
  modules: ['nuxt-nexus'],
  nexus: {
    loader: [
      {
        extensions: ['md'],

        // Transform raw content into a Vue component
        transformPage(code, id) {
          return `<template><section class="markdown-body">${code}</section></template>`;
        },

        // Extract metadata for Nuxt Route Middleware & Head
        resolvePagesRoutes(code, id) {
          return {
            layout: 'docs',
            title: 'My Custom Page',
          };
        },
      },
    ],
  },
});
```

## Options

### NexusOptions

| Property | Type             | Description                                               |
| :------- | :--------------- | :-------------------------------------------------------- |
| `loader` | `LoaderOption[]` | An array of custom file loaders to process non-Vue files. |

---

### LoaderOption

| Property             | Type                                                      | Description                                                                                                                                              |
| :------------------- | :-------------------------------------------------------- | :------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `extensions`         | `string \| string[]`                                      | Specifies which file extensions this loader should handle (e.g., `'md'` or `['md', 'mdc']`).                                                             |
| `transformPage`      | `(code: string, id: string) => string \| Promise<string>` | A hook to transform raw file content into a valid Vue Single File Component (SFC) string.                                                                |
| `resolvePagesRoutes` | `(code: string, id: string) => Record<string, any>`       | An optional hook to extract metadata from the source code. The returned object will be injected into the route's `meta` field (e.g., `title`, `layout`). |
