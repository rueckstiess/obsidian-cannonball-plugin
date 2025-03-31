import { requestUrl } from "obsidian";
import { SYSTEM_PROMPT, getPromptTemplate } from "./prompts";

interface OpenAIResponse {
  id: string;
  object: string;
  created: number;
  model: string;
  choices: {
    message: {
      role: string;
      content: string;
    };
    index: number;
    finish_reason: string;
  }[];
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

interface CursorPosition {
  line: number;
  ch: number;
}

/**
 * Node type definitions with associated markers
 */
interface NodeType {
  name: string;
  regex: RegExp;
}

/**
 * Registry of node types to make it easy to add new ones
 */
const NODE_TYPES: NodeType[] = [
  // Task nodes (including standard, completed, in-progress, and cancelled)
  {
    name: "TASK_LIST",
    regex: /^\s*-\s*\[\s*(?:[ xX/-])\s*\]/
  },
  // Question nodes
  {
    name: "QUESTION",
    regex: /^\s*-\s*\[\s*\?\s*\]/
  },
  // Decision nodes
  {
    name: "DECISION",
    regex: /^\s*-\s*\[\s*[dD]\s*\]/
  },
  // Regular bullet points
  {
    name: "BULLET_LIST",
    regex: /^\s*-\s+(?!\[)/
  }
  // Add more node types here as needed:
  // { name: "GOAL", regex: /^\s*-\s*\[\s*[gG]\s*\]/ },
  // { name: "ARTIFACT", regex: /^\s*-\s*\[\s*[aA]\s*\]/ },
];

/**
 * Determines which prompt type to use based on context
 * @param context The document content
 * @param cursorPos Cursor position
 * @returns The name of the prompt type to use
 */
function determinePromptType(context: string, cursorPos: CursorPosition): string {
  // Get surrounding lines for context (3 lines above and below)
  const lines = context.split('\n');
  const surroundingLines = lines.slice(
    Math.max(0, cursorPos.line - 3),
    Math.min(lines.length, cursorPos.line + 4)
  );

  // Get the current line (where the cursor is)
  const currentLine = lines[cursorPos.line];

  // First check if the current line matches any node type
  for (const nodeType of NODE_TYPES) {
    if (nodeType.regex.test(currentLine)) {
      return nodeType.name;
    }
  }

  // Then check surrounding lines to determine context
  for (const nodeType of NODE_TYPES) {
    if (surroundingLines.some(line => nodeType.regex.test(line))) {
      return nodeType.name;
    }
  }

  // Default to generic text if no specific context is detected
  return "GENERIC_TEXT";
}

/**
 * Sends the prompt and context to OpenAI's API
 * 
 * @param prompt The user's prompt for the LLM
 * @param context The document content for context
 * @param cursorPos The cursor position
 * @param apiKey OpenAI API key
 * @param model The OpenAI model to use
 * @param maxTokens Maximum number of tokens in the response
 * @param temperature Controls randomness from 0 (deterministic) to 2 (very random)
 * @returns The LLM's response text
 */
export async function sendToLLM(
  prompt: string,
  context: string,
  cursorPos: CursorPosition,
  apiKey: string,
  model: string,
  maxTokens = 1000,
  temperature = 0.7
): Promise<string> {
  if (!apiKey) {
    throw new Error("API key not provided. Please add it in the plugin settings.");
  }

  try {
    // Determine which prompt type to use
    const promptType = determinePromptType(context, cursorPos);

    // Get the appropriate prompt template function
    const promptTemplate = getPromptTemplate(promptType);

    // Generate the user prompt using the selected template
    const userPrompt = promptTemplate(context, prompt, cursorPos);

    // Format the messages to send to OpenAI
    const messages = [
      {
        role: "system",
        content: SYSTEM_PROMPT(),
      },
      {
        role: "user",
        content: userPrompt,
      },
    ];

    // create body
    const body = {
      model: model,
      messages: messages,
      max_tokens: maxTokens,
      temperature: temperature,
    };

    console.log("Sending request to OpenAI API:");
    console.log("System prompt:\n", body.messages[0].content);
    console.log("User prompt:\n", body.messages[1].content);

    // Make the API request
    const response = await requestUrl({
      url: "https://api.openai.com/v1/chat/completions",
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`,
      },
      body: JSON.stringify(body),
    });

    // Parse the response
    const responseData = response.json as OpenAIResponse;

    if (responseData.choices && responseData.choices.length > 0) {
      const response = responseData.choices[0].message.content.trimEnd();
      console.log("Received response from OpenAI API:", response);
      return response;
    } else {
      throw new Error("Received empty response from OpenAI");
    }
  } catch (error) {
    console.error("Error calling OpenAI API:", error);
    throw new Error(`Failed to get response from OpenAI: ${error.message}`);
  }
}