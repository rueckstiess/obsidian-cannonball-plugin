import { Plugin, Editor } from "obsidian";
import { LLMSuggest } from "./suggest/llm-suggest";
import { LLMSettings, LLMSettingsTab, DEFAULT_SETTINGS } from "./settings";
import { sendToLLM } from "./llm-service";
import { LLMPromptModal } from "./modals/llm-prompt-modal";
import { parseMarkdownToAST, astToMarkdown } from "./markdown";
import { CustomTask } from "remark-custom-tasks";
import { inspect } from "unist-util-inspect";
import { visit } from 'unist-util-visit'

export default class CannonballPlugin extends Plugin {
	public settings: LLMSettings;

	async onload(): Promise<void> {
		await this.loadSettings();

		// Register the suggestion functionality
		this.registerEditorSuggest(new LLMSuggest(this.app, this));

		// Add settings tab
		this.addSettingTab(new LLMSettingsTab(this.app, this));

		// Add a command to open the LLM prompt manually
		this.addCommand({
			id: "open-llm-prompt",
			name: "Open LLM Prompt",
			editorCallback: (editor, view) => {
				const currentContent = editor.getValue();
				const cursorPos = editor.getCursor();

				// We'll implement this function to show a modal for the prompt
				this.showLLMPromptModal(editor, view, currentContent, cursorPos);
			}
		});

		// create an LLMModal
		// this.

		// Add a command to parse the current document to AST
		this.addCommand({
			id: "parse-markdown-ast",
			name: "Parse current document to AST",
			editorCallback: async (editor) => {
				try {
					// Get current editor content
					const content = editor.getValue();

					// Step 1: Parse to AST
					const ast = await parseMarkdownToAST(content);

					visit(ast, 'customTask', (node: CustomTask) => {
						console.log('custom task node', node.marker)
					});

					// Step 2: Log the AST to console
					console.log('Markdown AST:');
					console.log(inspect(ast));

					// Step 3: Stringify the AST back to markdown
					const newContent = await astToMarkdown(ast);

					// Step 4: Update the editor with the stringified content
					editor.setValue(newContent);
				} catch (error) {
					console.error("Error processing markdown:", error);
				}
			}
		});
		console.log("LLM Helper plugin loaded");
	}

	onunload(): void {
		console.log("LLM Helper plugin unloaded");
	}

	async loadSettings(): Promise<void> {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
	}

	async saveSettings(): Promise<void> {
		await this.saveData(this.settings);
	}

	// Shows a modal for entering an LLM prompt
	private showLLMPromptModal(editor: Editor, view: unknown, content: string, cursorPos: { line: number, ch: number }): void {
		new LLMPromptModal(
			this.app,
			this,
			content,
			cursorPos,
			editor
		).open();
	}

	// Function to process content with LLM and insert the result
	async processWithLLM(
		prompt: string,
		context: string,
		cursorPosition: { line: number, ch: number },
		editor: Editor
	): Promise<void> {
		try {
			// Check if API key is set
			if (!this.settings.apiKey) {
				throw new Error("OpenAI API key not set. Please add it in the plugin settings.");
			}

			// Send to LLM with cursor position
			const response = await sendToLLM(
				prompt,
				context,
				cursorPosition, // Pass the cursor position
				this.settings.apiKey,
				this.settings.model,
				this.settings.maxTokens,
				this.settings.temperature
			);

			// Insert the response at the cursor position
			editor.replaceRange(response, cursorPosition);

			return Promise.resolve();
		} catch (error) {
			console.error("Error processing with LLM:", error);
			return Promise.reject(error);
		}
	}
}