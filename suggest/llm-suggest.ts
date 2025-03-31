import {
  App,
  Editor,
  EditorPosition,
  EditorSuggest,
  EditorSuggestContext,
  EditorSuggestTriggerInfo,
  TFile,
} from "obsidian";
import LLMHelper from "../main";
import { LLMPromptModal } from "../modals/llm-prompt-modal";

interface LLMSuggestion {
  label: string;
}

export class LLMSuggest extends EditorSuggest<LLMSuggestion> {
  private plugin: LLMHelper;

  constructor(app: App, plugin: LLMHelper) {
    super(app);
    this.plugin = plugin;
  }

  getSuggestions(context: EditorSuggestContext): LLMSuggestion[] {
    // For now, we'll just show a single suggestion to "Open LLM Prompt"
    return [{ label: "Open LLM Prompt" }];

    // In the future, we could add more suggestions based on context
    // or even pre-defined prompt templates
  }

  renderSuggestion(suggestion: LLMSuggestion, el: HTMLElement): void {
    el.setText(suggestion.label);
  }

  selectSuggestion(suggestion: LLMSuggestion): void {
    // Close the suggestion UI
    this.close();

    // Get the current editor and document content
    const activeView = this.app.workspace.getActiveViewOfType("markdown");
    if (!activeView) return;

    const editor = activeView.editor;
    const cursor = editor.getCursor();
    const content = editor.getValue();

    // Remove the trigger phrase from the document
    const triggerPhrase = this.plugin.settings.triggerPhrase;
    const startPos = {
      line: cursor.line,
      ch: cursor.ch - triggerPhrase.length
    };
    editor.replaceRange("", startPos, cursor);

    // Show the LLM prompt modal
    new LLMPromptModal(
      this.app,
      this.plugin,
      content,
      editor.getCursor(),
      editor
    ).open();
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

    // Check if cursor position is preceded by the trigger phrase
    const line = editor.getLine(cursor.line);
    const cursorPosition = cursor.ch;

    // Make sure we don't go out of bounds
    if (cursorPosition < triggerPhrase.length) {
      return null;
    }

    const precedingText = line.substring(cursorPosition - triggerPhrase.length, cursorPosition);

    // If the text before cursor matches trigger phrase, activate suggestion
    if (precedingText === triggerPhrase) {
      return {
        start: {
          line: cursor.line,
          ch: cursorPosition - triggerPhrase.length,
        },
        end: cursor,
        query: "",
      };
    }

    return null;
  }
}