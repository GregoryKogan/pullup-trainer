import { fileURLToPath } from 'node:url'
import { mergeConfig, defineConfig } from 'vitest/config'
import viteConfig from './vite.config'

export default mergeConfig(
  viteConfig,
  defineConfig({
    test: {
      environment: 'jsdom',
      globals: true,
      setupFiles: ['./src/test/setup.ts'],
      exclude: ['**/node_modules/**', '**/dist/**', 'e2e/**'],
      coverage: {
        provider: 'v8',
        reporter: ['text', 'html', 'lcov'],
        reportsDirectory: './coverage',
        include: [
          'src/domain/**/*.ts',
          'src/utils/**/*.ts',
          'src/stores/**/*.ts',
          'src/composables/**/*.ts',
          'src/db/**/*.ts',
          'src/constants/**/*.ts',
          'src/i18n/**/*.ts',
        ],
        exclude: ['src/**/*.{test,spec}.ts', 'src/domain/types.ts'],
        thresholds: {
          lines: 55,
          functions: 70,
          branches: 75,
          statements: 55,
          'src/domain/**': {
            lines: 85,
            functions: 85,
            branches: 80,
            statements: 85,
          },
          'src/db/**': {
            lines: 55,
            functions: 95,
            branches: 65,
            statements: 55,
          },
        },
      },
    },
    resolve: {
      alias: {
        '@': fileURLToPath(new URL('./src', import.meta.url)),
      },
    },
  }),
)
