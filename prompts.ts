// Define interfaces for different prompt types
interface CursorPosition {
  line: number;
  ch: number;
}

// Type definition for prompt template functions
type PromptTemplate = (
  markdownContent: string,
  prompt: string,
  cursorPos: CursorPosition
) => string;

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

Your response will be inserted in the document verbatim at the <CURSOR> position.
`;

const END_OF_LINE_RULE = "If the user invoked you at the end of a list item or task, e.g. \" - Some text <CURSOR>\", first start a new line with \"\\n\"";
const NESTING_RULE = "Maintain the correct nesting level as per the current line";

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
 */
const GENERIC_TEXT_PROMPT: PromptTemplate = (
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
};

/**
 * Specialized prompt for task list management
 */
const TASK_LIST_PROMPT: PromptTemplate = (
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

RULES:
1. Focus on task management operations like creating new tasks, breaking down tasks, etc.
2. Format tasks using standard Markdown task syntax: "- [ ] Task description"
3. Remember, your response will be inserted at the <CURSOR> position. If the user already started the current line with the task marker, 
e.g. "- [ ] <CURSOR>", do not repeat it but finish this particular line with just the task text. 
4. ${END_OF_LINE_RULE}.
5. ${NESTING_RULE}
`;
};

/**
 * Specialized prompt for handling questions
 */
const QUESTION_PROMPT: PromptTemplate = (
  markdownContent: string,
  prompt: string,
  cursorPos: CursorPosition
): string => {
  const contentWithCursor = insertCursorMarker(markdownContent, cursorPos);

  return `
The current document contains a question node marked with "- [?]":
\`\`\`markdown
${contentWithCursor}
\`\`\`

The user prompt is: ${prompt}

RULES:
1. Focus on exploring the question, providing possible answers, or suggestign ways to find answers.
2. Format your response as bullet points starting with "- " if suggesting multiple points.
3. Remember, your response will be inserted at the <CURSOR> position. If the user invoked you at the end of a line, 
e.g. "- [?] Some question <CURSOR>", first start a new line with "\\n" before adding your bulleted response.
4. ${NESTING_RULE}
`;
};

/**
 * Specialized prompt for handling decisions
 */
const DECISION_PROMPT: PromptTemplate = (
  markdownContent: string,
  prompt: string,
  cursorPos: CursorPosition
): string => {
  const contentWithCursor = insertCursorMarker(markdownContent, cursorPos);

  return `
The current document contains a decision node marked with "- [d]" or "- [D]":
\`\`\`markdown
${contentWithCursor}
\`\`\`

The user prompt is: ${prompt}

Focus on evaluating options, weighing pros and cons, or suggesting decision criteria.
Format options as bullet points with "- " and use indentation for sub-points.
Your response will be inserted at the <CURSOR> position.
`;
};

/**
 * Specialized prompt for bullet lists
 */
const BULLET_LIST_PROMPT: PromptTemplate = (
  markdownContent: string,
  prompt: string,
  cursorPos: CursorPosition
): string => {
  const contentWithCursor = insertCursorMarker(markdownContent, cursorPos);

  return `
The current document contains a bullet list:
\`\`\`markdown
${contentWithCursor}
\`\`\`

The user prompt is: ${prompt}

RULES:
1. Structure your output as a bullet list.
2. Format bullets using standard Markdown task syntax: "- Another bullet"
3. Remember, your response will be inserted at the <CURSOR> position. If the user already started the current line with the bullet marker, 
e.g. "- <CURSOR>", do not repeat it but finish this particular line with just the bullet point text. 
4. ${END_OF_LINE_RULE}.
5. ${NESTING_RULE}.
`;
};

/**
 * Map of prompt types to their corresponding template functions
 * This makes it easy to add new prompt types without modifying the sendToLLM function
 */
export const PROMPT_TEMPLATES: { [key: string]: PromptTemplate } = {
  GENERIC_TEXT: GENERIC_TEXT_PROMPT,
  TASK_LIST: TASK_LIST_PROMPT,
  QUESTION: QUESTION_PROMPT,
  DECISION: DECISION_PROMPT,
  BULLET_LIST: BULLET_LIST_PROMPT,
  // Add more prompt templates as needed
};

// Export a function to get the appropriate prompt template
export function getPromptTemplate(promptType: string): PromptTemplate {
  return PROMPT_TEMPLATES[promptType] || GENERIC_TEXT_PROMPT;
}