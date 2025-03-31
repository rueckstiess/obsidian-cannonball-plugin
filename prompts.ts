// Define interfaces for different prompt types
interface CursorPosition {
  line: number;
  ch: number;
}

/**
 * System prompt that defines the assistant's role and behavior
 * This is sent with every request to establish context
 */
export const SYSTEM_PROMPT = (): string => `
You are a helpful AI assistant embedded in an Obsidian note-taking application.
The user will provide a document with the current cursor position, indicated with "<CURSOR>", 
and a user prompt.

Respond to the user prompt while considering the document content as context. Do not wrap your response in a
code fence. Do not repeat the entire document, just provide the relevant information or suggestions considering the 
cursor position.

Your response will be inserted in the document verbatim at the cursor position. For example, if you are invoked in a 
bullet point context, return additional bullet points (optionally with preceding newline if required).
`;

/**
 * Inserts a cursor marker at the specified position in the text
 * @param text The document content
 * @param position The cursor position
 * @returns The text with cursor marker inserted
 */
export function insertCursorMarker(text: string, position: CursorPosition): string {
  const lines = text.split('\n');

  // Ensure the position is within bounds
  const line = Math.min(position.line, lines.length - 1);
  const ch = Math.min(position.ch, lines[line].length);

  // Insert the cursor marker
  const before = lines[line].substring(0, ch);
  const after = lines[line].substring(ch);
  lines[line] = before + "<CURSOR>" + after;

  return lines.join('\n');
}

/**
 * Generic text prompt for general text editing and completion
 * @param markdownContent The document content
 * @param prompt The user's prompt
 * @param cursorPos The cursor position
 * @returns Formatted prompt with cursor marker
 */
export const GENERIC_TEXT_PROMPT = (
  markdownContent: string,
  prompt: string,
  cursorPos: CursorPosition
): string => {
  // Insert the cursor marker at the current position
  const contentWithCursor = insertCursorMarker(markdownContent, cursorPos);

  return `
The current document content is:
\`\`\`markdown
${contentWithCursor}
\`\`\`

The user prompt is: ${prompt}

Remember that your response will be inserted at the <CURSOR> position. Format your response appropriately for the context.
`;
}

/**
 * Specialized prompt for task list management
 * @param markdownContent The document content
 * @param prompt The user's prompt
 * @param cursorPos The cursor position
 * @returns Formatted prompt with cursor marker for task-related operations
 */
export const TASK_LIST_PROMPT = (
  markdownContent: string,
  prompt: string,
  cursorPos: CursorPosition
): string => {
  // Insert the cursor marker at the current position
  const contentWithCursor = insertCursorMarker(markdownContent, cursorPos);

  return `
The current document contains a task list:
\`\`\`markdown
${contentWithCursor}
\`\`\`

The user prompt is: ${prompt}

Focus on task management operations like creating new tasks, breaking down tasks, prioritizing, or marking tasks complete.
Format tasks using standard Markdown task syntax: "- [ ] Task description"
Your response will be inserted at the <CURSOR> position.
`;
}

// You can add more specialized prompts here as needed