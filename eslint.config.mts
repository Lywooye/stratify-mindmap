import obsidianmd from 'eslint-plugin-obsidianmd';
import globals from 'globals';
import { defineConfig, globalIgnores } from 'eslint/config';

export default defineConfig(
  globalIgnores([
    'node_modules',
    'main.js',
    'package-lock.json',
    'versions.json',
    'esbuild.config.mjs',
    'version-bump.mjs',
    'scripts/**/*.mjs',
    'test-persistence.cjs',
  ]),
  {
    languageOptions: {
      globals: {
        ...globals.browser,
        ...globals.node,
      },
      parserOptions: {
        projectService: {
          allowDefaultProject: [
            'eslint.config.mts',
            'manifest.json',
          ],
        },
        tsconfigRootDir: import.meta.dirname,
        extraFileExtensions: ['.json'],
      },
    },
  },
  ...obsidianmd.configs.recommended,
  {
    files: ['src/**/*.ts'],
    rules: {
      'obsidianmd/ui/sentence-case': ['warn', {
        brands: ['Stratify Mindmap', 'Markdown', 'PNG'],
        acronyms: ['PNG'],
        enforceCamelCaseLower: true,
      }],
    },
  },
);
