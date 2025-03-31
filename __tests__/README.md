# Testing Strategy

This folder contains unit tests for the Obsidian Cannonball Plugin. Due to the complexities of testing UI components that rely heavily on the Obsidian API, we're focusing our testing efforts on the core logic of the plugin.

## What we're testing

1. **Core logic**: The functions that don't rely heavily on Obsidian's UI API
   - `prompts.ts`: Testing cursor marker insertion and prompt template generation
   - `llm-service.ts`: Testing the context detection and LLM service

## What we're not testing (yet)

1. **UI Components**: These are difficult to test because they rely heavily on Obsidian's API
   - `LLMPromptModal`: The modal UI for entering prompts
   - `LLMSuggest`: The suggestion UI for the trigger phrase

2. **Plugin initialization**: These tests require more complex mocking of the Obsidian API
   - The `onload` method
   - Settings loading/saving

## Running tests

```bash
# Run all tests
npm test

# Run tests with coverage report
npm run test:coverage

# Run tests in watch mode during development
npm run test:watch
```

Future work: consider adding integration tests using a mocked Obsidian environment.