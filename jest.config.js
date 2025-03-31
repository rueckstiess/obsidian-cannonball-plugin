/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  transform: {
    '^.+\\.tsx?$': ['ts-jest', {
      tsconfig: 'tsconfig.json',
    }],
  },
  moduleNameMapper: {
    // Mock Obsidian API
    'obsidian': '<rootDir>/__mocks__/obsidian.ts',
  },
  testMatch: ['**/__tests__/**/*.ts?(x)', '**/?(*.)+(spec|test).ts?(x)'],
  collectCoverageFrom: [
    'prompts.ts',
    'llm-service.ts',
    'main.ts',
    'suggest/llm-suggest.ts',
    'modals/llm-prompt-modal.ts',
    '!**/node_modules/**',
    '!**/vendor/**',
  ],
  // Set up global test environment
  setupFilesAfterEnv: ['<rootDir>/__tests__/test-setup.ts'],
};