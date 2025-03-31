import { requestUrl } from "obsidian";
import { SYSTEM_PROMPT } from "prompts";
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

/**
 * Sends the prompt and context to OpenAI's API
 * 
 * @param prompt The user's prompt for the LLM
 * @param context The document content for context
 * @param apiKey OpenAI API key
 * @param model The OpenAI model to use
 * @param maxTokens Maximum number of tokens in the response
 * @param temperature Controls randomness from 0 (deterministic) to 2 (very random)
 * @returns The LLM's response text
 */
export async function sendToLLM(
  prompt: string,
  context: string,
  apiKey: string,
  model: string,
  maxTokens = 1000,
  temperature = 0.7
): Promise<string> {
  if (!apiKey) {
    throw new Error("API key not provided. Please add it in the plugin settings.");
  }

  try {
    // Format the messages to send to OpenAI
    const messages = [
      {
        role: "system",
        content: SYSTEM_PROMPT(),
      },
      // TODO: Extract this into prompts.ts
      {
        role: "user",
        content: `Document Content:
        \`\`\`
        ${context}
        \`\`\`
        
        Prompt: ${prompt}`,
      },
    ];

    // Make the API request
    const response = await requestUrl({
      url: "https://api.openai.com/v1/chat/completions",
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: model,
        messages: messages,
        max_tokens: maxTokens,
        temperature: temperature,
      }),
    });

    // Parse the response
    const responseData = response.json as OpenAIResponse;

    if (responseData.choices && responseData.choices.length > 0) {
      return responseData.choices[0].message.content.trim();
    } else {
      throw new Error("Received empty response from OpenAI");
    }
  } catch (error) {
    console.error("Error calling OpenAI API:", error);
    throw new Error(`Failed to get response from OpenAI: ${error.message}`);
  }
}