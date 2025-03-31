/**
 * Mock for Obsidian API used in tests
 */

// Mock the requestUrl function used in llm-service.ts
export const requestUrl = jest.fn().mockResolvedValue({
  json: {
    id: 'mock-response-id',
    object: 'chat.completion',
    created: 1234567890,
    model: 'gpt-4o',
    choices: [
      {
        message: {
          role: 'assistant',
          content: 'This is a mock response from the LLM.'
        },
        index: 0,
        finish_reason: 'stop'
      }
    ],
    usage: {
      prompt_tokens: 100,
      completion_tokens: 50,
      total_tokens: 150
    }
  }
});

// Add any other Obsidian API functions that need to be mocked here
export class Plugin {}
export class PluginSettingTab {}
export class Modal {}
export class App {}
export class Editor {}
export class MarkdownView {}
export class Notice {}
export class Setting {}
export class FuzzySuggestModal {}

// Add other Obsidian API functions/classes as needed by the tests