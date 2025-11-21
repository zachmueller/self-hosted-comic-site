import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    name: 'integration',
    environment: 'node',
    testTimeout: 30000, // 30s for DynamoDB Local operations
    hookTimeout: 30000,
    globals: true,
    setupFiles: [],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/**',
        '**/*.config.ts',
        '**/*.d.ts',
      ],
    },
  },
});
