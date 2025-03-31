import { requestUrl } from "obsidian";
import { SYSTEM_PROMPT, GENERIC_TEXT_PROMPT, TASK_LIST_PROMPT } from "./prompts";

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
 * Determines which prompt type to use based on context
 * @param context The document content
 * @param cursorPos Cursor position
 * @returns The name of the prompt type to use
 */
function determinePromptType(context: string, cursorPos: CursorPosition): string {
  // Get the current line
  const lines = context.split('\n');

  // Check if we're in a task list context
  const taskListRegex = /^(\s*)-\s*\[\s*[\]xX]\s/;
  const surroundingLines = lines.slice(
    Math.max(0, cursorPos.line - 3),
    Math.min(lines.length, cursorPos.line + 4)
  );

  if (surroundingLines.some(line => taskListRegex.test(line))) {
    return "TASK_LIST";
  }

  // Default to generic text prompt
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

    // Generate the appropriate user prompt
    let userPrompt = "";

    switch (promptType) {
      case "TASK_LIST":
        // Import dynamically to avoid circular dependencies
        userPrompt = TASK_LIST_PROMPT(context, prompt, cursorPos);
        break;
      case "GENERIC_TEXT":
      default:
        userPrompt = GENERIC_TEXT_PROMPT(context, prompt, cursorPos);
        break;
    }

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

    console.log("Sending request to OpenAI API with body:", body);

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
      const response = responseData.choices[0].message.content.trim();
      console.log("Received response from OpenAI API:", response);
      return response
    } else {
      throw new Error("Received empty response from OpenAI");
    }
  } catch (error) {
    console.error("Error calling OpenAI API:", error);
    throw new Error(`Failed to get response from OpenAI: ${error.message}`);
  }
}