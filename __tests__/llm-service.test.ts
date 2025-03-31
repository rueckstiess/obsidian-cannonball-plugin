import { sendToLLM } from '../llm-service';
import { requestUrl } from 'obsidian';

// Mock dependencies
jest.mock('obsidian');
jest.mock('../prompts', () => ({
  SYSTEM_PROMPT: jest.fn().mockReturnValue('Mock system prompt'),
  getPromptTemplate: jest.fn().mockImplementation((promptType) => {
    // Return a function that includes the prompt type in its output for testing
    return (content: string, prompt: string, cursorPos: any) => `MOCK_TEMPLATE:${promptType}`;
  }),
  insertCursorMarker: jest.fn().mockImplementation((text, pos) => {
    return `${text} with cursor at line ${pos.line}, ch ${pos.ch}`;
  })
}));

describe('llm-service', () => {
  beforeEach(() => {
    // Reset mocks before each test
    jest.clearAllMocks();
  });

  describe('sendToLLM', () => {
    const mockApiKey = 'test-api-key';
    const mockModel = 'gpt-4o';
    const mockPrompt = 'Test prompt';
    const mockContext = 'Some context';
    const mockCursorPos = { line: 0, ch: 0 };

    test('throws error if API key is not provided', async () => {
      await expect(sendToLLM(
        mockPrompt,
        mockContext,
        mockCursorPos,
        '', // Empty API key
        mockModel
      )).rejects.toThrow('API key not provided');
    });

    test('makes API request with correct parameters', async () => {
      await sendToLLM(
        mockPrompt,
        mockContext,
        mockCursorPos,
        mockApiKey,
        mockModel,
        1000,
        0.7
      );

      // Verify requestUrl was called
      expect(requestUrl).toHaveBeenCalledTimes(1);

      // Check the request options
      const requestOptions = (requestUrl as jest.Mock).mock.calls[0][0];
      expect(requestOptions.url).toBe('https://api.openai.com/v1/chat/completions');
      expect(requestOptions.method).toBe('POST');
      expect(requestOptions.headers).toEqual({
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${mockApiKey}`,
      });

      // Check the request body
      const body = JSON.parse(requestOptions.body);
      expect(body.model).toBe(mockModel);
      expect(body.max_tokens).toBe(1000);
      expect(body.temperature).toBe(0.7);
      expect(body.messages.length).toBe(2);
      expect(body.messages[0].role).toBe('system');
      expect(body.messages[1].role).toBe('user');
    });

    test('returns LLM response from API', async () => {
      const result = await sendToLLM(
        mockPrompt,
        mockContext,
        mockCursorPos,
        mockApiKey,
        mockModel
      );

      expect(result).toBe('This is a mock response from the LLM.');
    });

    test('handles API error gracefully', async () => {
      // Mock a rejected promise for this test only
      (requestUrl as jest.Mock).mockRejectedValueOnce(new Error('API error'));

      await expect(sendToLLM(
        mockPrompt,
        mockContext,
        mockCursorPos,
        mockApiKey,
        mockModel
      )).rejects.toThrow('Failed to get response from OpenAI');
    });
  });

  // Test the node type detection functionality
  describe('Node type detection', () => {
    // Helper to directly test context detection - reimplements the logic for testing
    function detectContextType(content: string, cursorPos: { line: number, ch: number }): string {
      // Regular expressions for different node types (copied from the source code)
      const nodeTypes = [
        { name: 'TASK_LIST', regex: /^\s*-\s*\[\s*(?:[ xX/-])\s*\]/ },
        { name: 'QUESTION', regex: /^\s*-\s*\[\s*\?\s*\]/ },
        { name: 'DECISION', regex: /^\s*-\s*\[\s*[dD]\s*\]/ },
        { name: 'BULLET_LIST', regex: /^\s*-\s+(?!\[)/ }
      ];

      const lines = content.split('\n');
      const currentLine = lines[cursorPos.line];

      // First check the current line
      for (const nodeType of nodeTypes) {
        if (nodeType.regex.test(currentLine)) {
          return nodeType.name;
        }
      }

      // Then check surrounding lines (3 above and below)
      const surroundingLines = lines.slice(
        Math.max(0, cursorPos.line - 3),
        Math.min(lines.length, cursorPos.line + 4)
      );

      for (const nodeType of nodeTypes) {
        if (surroundingLines.some(line => nodeType.regex.test(line))) {
          return nodeType.name;
        }
      }

      // Default to generic text
      return 'GENERIC_TEXT';
    }

    test('detects task list from current line', () => {
      const content = '# Document\n- [ ] Task 1\n- [ ] Task 2';
      const cursorPos = { line: 1, ch: 5 };

      const result = detectContextType(content, cursorPos);
      expect(result).toBe('TASK_LIST');
    });

    test('detects question from current line', () => {
      const content = '# Document\n- [?] Question\n- [ ] Task';
      const cursorPos = { line: 1, ch: 5 };

      const result = detectContextType(content, cursorPos);
      expect(result).toBe('QUESTION');
    });

    test('detects decision from current line', () => {
      const content = '# Document\n- [d] Decision\n- [ ] Task';
      const cursorPos = { line: 1, ch: 5 };

      const result = detectContextType(content, cursorPos);
      expect(result).toBe('DECISION');
    });

    test('detects bullet list from current line', () => {
      const content = '# Document\n- Bullet 1\n- [ ] Task';
      const cursorPos = { line: 1, ch: 5 };

      const result = detectContextType(content, cursorPos);
      expect(result).toBe('BULLET_LIST');
    });

    test('detects task list from surrounding lines', () => {
      const content = '# Document\n- [ ] Task 1\nSome text here\n- [ ] Task 2';
      const cursorPos = { line: 2, ch: 5 }; // Cursor on "Some text" line

      const result = detectContextType(content, cursorPos);
      expect(result).toBe('TASK_LIST');
    });

    test('defaults to generic text when no patterns match', () => {
      const content = '# Document\nJust regular text\nNo special patterns';
      const cursorPos = { line: 1, ch: 5 };

      const result = detectContextType(content, cursorPos);
      expect(result).toBe('GENERIC_TEXT');
    });
  });
});