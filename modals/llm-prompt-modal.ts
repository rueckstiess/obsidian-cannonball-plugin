import { App, Modal, Setting, Editor } from "obsidian";
import CannonballPlugin from "../main";

export class LLMPromptModal extends Modal {
  private plugin: CannonballPlugin;
  private documentContent: string;
  private cursorPosition: { line: number, ch: number };
  private editor: Editor;
  private promptValue = "";
  private initialPrompt = "";

  constructor(
    app: App,
    plugin: CannonballPlugin,
    documentContent: string,
    cursorPosition: { line: number, ch: number },
    editor: Editor,
    initialPrompt = ""
  ) {
    super(app);
    this.plugin = plugin;
    this.documentContent = documentContent;
    this.cursorPosition = cursorPosition;
    this.editor = editor;
    this.initialPrompt = initialPrompt;
    this.promptValue = initialPrompt; // Set initial value
  }

  onOpen() {
    const { contentEl } = this;

    contentEl.createEl("h2", { text: "Enter Prompt for LLM" });

    // Create a description of what this modal does
    contentEl.createEl("p", {
      text: "Enter your prompt for the LLM. The current document content and cursor position will be provided as context."
    });

    // Create a text area for the prompt
    const promptContainer = contentEl.createDiv("prompt-container");
    const promptTextarea = promptContainer.createEl("textarea", {
      attr: {
        placeholder: "Enter your prompt here...",
        rows: "6"
      },
      cls: "prompt-textarea"
    });

    // Set initial value if provided
    if (this.initialPrompt) {
      promptTextarea.value = this.initialPrompt;
      this.promptValue = this.initialPrompt;
    }

    // Add a style to make the textarea width 100%
    promptTextarea.style.width = "100%";
    promptTextarea.style.marginBottom = "1em";

    // Capture input changes
    promptTextarea.addEventListener("input", (e) => {
      this.promptValue = (e.target as HTMLTextAreaElement).value;
    });

    // Focus the textarea when the modal opens and place cursor at the end
    setTimeout(() => {
      promptTextarea.focus();
      promptTextarea.setSelectionRange(
        this.initialPrompt.length,
        this.initialPrompt.length
      );
    }, 10);

    // Add a setting for showing a preview of the context (togglable)
    let showContext = false;
    const contextPreview = contentEl.createDiv({ cls: "context-preview" });
    contextPreview.style.display = "none";
    contextPreview.style.maxHeight = "200px";
    contextPreview.style.overflow = "auto";
    contextPreview.style.border = "1px solid var(--background-modifier-border)";
    contextPreview.style.padding = "8px";
    contextPreview.style.marginBottom = "1em";

    new Setting(contentEl)
      .setName("Show document context")
      .setDesc("Toggle to view the document context that will be sent to the LLM")
      .addToggle(toggle => {
        toggle.onChange(value => {
          showContext = value;
          contextPreview.style.display = showContext ? "block" : "none";
          if (showContext) {
            contextPreview.setText(this.documentContent);
          }
        });
      });

    // Add buttons for cancel and submit
    const buttonContainer = contentEl.createDiv("button-container");
    buttonContainer.style.display = "flex";
    buttonContainer.style.justifyContent = "flex-end";
    buttonContainer.style.gap = "8px";

    const cancelButton = buttonContainer.createEl("button", { text: "Cancel" });
    cancelButton.addEventListener("click", () => {
      this.close();
    });

    const submitButton = buttonContainer.createEl("button", {
      text: "Submit to LLM",
      cls: "mod-cta"
    });
    submitButton.addEventListener("click", async () => {
      if (!this.promptValue.trim()) {
        // Show an error if prompt is empty
        const errorDiv = contentEl.createDiv({ cls: "error-message" });
        errorDiv.setText("Please enter a prompt");
        errorDiv.style.color = "var(--text-error)";
        setTimeout(() => errorDiv.remove(), 3000);
        return;
      }

      // Show loading state
      submitButton.setText("Processing...");
      submitButton.disabled = true;

      try {
        // Process with LLM
        await this.plugin.processWithLLM(
          this.promptValue,
          this.documentContent,
          this.cursorPosition,
          this.editor
        );

        // Close the modal after processing
        this.close();
      } catch (error) {
        console.error("Error submitting to LLM:", error);

        // Show error and reset button
        const errorDiv = contentEl.createDiv({ cls: "error-message" });
        errorDiv.setText(`Error: ${error.message || "Failed to process with LLM"}`);
        errorDiv.style.color = "var(--text-error)";

        submitButton.setText("Submit to LLM");
        submitButton.disabled = false;
      }
    });
  }

  onClose() {
    const { contentEl } = this;
    contentEl.empty();
  }
}