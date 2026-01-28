import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    projects: [
      {
        test: {
          name: 'unitary',
          include: ['src/**/*.spec.ts'],
          environment: 'node',
          testTimeout: 5000,
        },
      },
      {
        test: {
          name: 'integration',
          include: ['src/**/*.test.ts'],
          exclude: ['**/*.e2e.test.ts'],
          environment: 'node',
          testTimeout: 30000,
        },
      },
      {
        test: {
          name: 'e2e',
          include: ['**/*.e2e.test.ts'],
          environment: 'node',
          testTimeout: 60000,
        },
      },
    ],
  },
})
