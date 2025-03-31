import {
  App,
  Editor,
  EditorPosition,
  EditorSuggest,
  EditorSuggestContext,
  EditorSuggestTriggerInfo,
  TFile,
  MarkdownView
} from "obsidian";
import LLMHelper from "../main";
import { LLMPromptModal } from "../modals/llm-prompt-modal";

interface LLMSuggestion {
  label: string;
  action: "direct" | "modal";
}

export class LLMSuggest extends EditorSuggest<LLMSuggestion> {
  private plugin: LLMHelper;

  constructor(app: App, plugin: LLMHelper) {
    super(app);
    this.plugin = plugin;

    // Register Ctrl+Enter to open the modal
    // @ts-ignore - The type definitions don't include this but it works
    this.scope.register(["Ctrl"], "Enter", (evt: KeyboardEvent) => {
      // Get the current context
      if (!this.context) {
        return false;
      }

      // Get the current editor and document content
      const activeView = this.app.workspace.getActiveViewOfType(MarkdownView);
      if (!activeView) {
        return false;
      }

      const editor = activeView.editor;
      const content = editor.getValue();

      // Get the user's input (the text after the trigger phrase)
      const userInput = this.context.query || "";

      // Remove the trigger phrase and query from the document
      if (this.context.start && this.context.end) {
        editor.replaceRange("", this.context.start, this.context.end);
      }

      // Close the suggestion UI
      this.close();

      // Open the modal with the text pre-filled
      const modal = new LLMPromptModal(
        this.app,
        this.plugin,
        content,
        editor.getCursor(),
        editor,
        userInput
      );

      modal.open();

      return false; // Prevent default behavior
    });

    // Add instruction text at the bottom of suggestions
    this.setInstructions([
      { command: "↵", purpose: "to use prompt directly" },
      { command: "Ctrl+↵", purpose: "to open prompt modal" }
    ]);
  }

  getSuggestions(context: EditorSuggestContext): LLMSuggestion[] {
    const suggestions: LLMSuggestion[] = [];

    // If there's text after the trigger phrase, add it as the first suggestion
    if (context.query.trim().length > 0) {
      suggestions.push({
        label: context.query,
        action: "direct"
      });
    }

    // Always add "Open LLM Prompt" as an option
    suggestions.push({
      label: "Open LLM Prompt",
      action: "modal"
    });

    return suggestions;
  }

  renderSuggestion(suggestion: LLMSuggestion, el: HTMLElement): void {
    el.setText(suggestion.label);
  }

  selectSuggestion(suggestion: LLMSuggestion): void {
    if (!this.context) {
      return;
    }

    // Get the current editor and document content
    const activeView = this.app.workspace.getActiveViewOfType(MarkdownView);
    if (!activeView) {
      return;
    }

    const editor = activeView.editor;

    // Get the user's input (the text after the trigger phrase)
    const userInput = this.context.query || "";

    // Remove the trigger phrase and query from the document
    if (this.context.start && this.context.end) {
      editor.replaceRange("", this.context.start, this.context.end);
    }

    // Get the updated content after removing the trigger phrase
    const updatedContent = editor.getValue();

    // Close the suggestion UI
    this.close();

    if (suggestion.action === "direct") {
      // Get the current cursor position
      const cursorPos = editor.getCursor();

      // Process with LLM using the updated content (without trigger phrase)
      this.plugin.processWithLLM(
        userInput,
        updatedContent,
        cursorPos,
        editor
      ).catch(error => {
        // Handle error by showing error message at cursor
        editor.replaceRange(
          `⚠️ Error: ${error.message || "Failed to process with LLM"}`,
          cursorPos
        );
      });
    } else {
      // Show the LLM prompt modal with the typed text pre-filled
      const modal = new LLMPromptModal(
        this.app,
        this.plugin,
        updatedContent, // Use updated content without trigger phrase
        editor.getCursor(),
        editor,
        userInput // Pass the user's input to pre-fill the modal
      );

      modal.open();
    }
  }

  onTrigger(
    cursor: EditorPosition,
    editor: Editor,
    file: TFile
  ): EditorSuggestTriggerInfo | null {
    // Check if the feature is enabled
    if (!this.plugin.settings.isEnabled) {
      return null;
    }

    const triggerPhrase = this.plugin.settings.triggerPhrase;

    // Get the line text up to the cursor
    const line = editor.getLine(cursor.line);
    const textUntilCursor = line.substring(0, cursor.ch);

    // Check for the trigger phrase
    const triggerIndex = textUntilCursor.lastIndexOf(triggerPhrase);

    if (triggerIndex >= 0) {
      // We found the trigger phrase
      const startPos = {
        line: cursor.line,
        ch: triggerIndex,
      };

      const query = textUntilCursor.substring(triggerIndex + triggerPhrase.length);

      return {
        start: startPos,
        end: cursor,
        query: query,
      };
    }

    return null;
  }
}