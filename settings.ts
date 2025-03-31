import { App, PluginSettingTab, Setting } from "obsidian";
import LLMHelper from "./main";

export interface LLMSettings {
  apiKey: string;
  model: string;
  triggerPhrase: string;
  isEnabled: boolean;
  maxTokens: number;
  temperature: number;
}

export const DEFAULT_SETTINGS: LLMSettings = {
  apiKey: "",
  model: "gpt-4o",
  triggerPhrase: "!!",
  isEnabled: true,
  maxTokens: 1000,
  temperature: 0.7
};

export class LLMSettingsTab extends PluginSettingTab {
  plugin: LLMHelper;

  constructor(app: App, plugin: LLMHelper) {
    super(app, plugin);
    this.plugin = plugin;
  }

  display(): void {
    const { containerEl } = this;
    containerEl.empty();

    containerEl.createEl("h2", { text: "Cannonball LLM Settings" });

    // API Key Setting
    new Setting(containerEl)
      .setName("OpenAI API Key")
      .setDesc("Enter your OpenAI API key for accessing the API")
      .addText((text) => {
        text
          .setPlaceholder("sk-...")
          .setValue(this.plugin.settings.apiKey)
          .onChange(async (value) => {
            this.plugin.settings.apiKey = value;
            await this.plugin.saveSettings();
          });
        // For security, use password type to hide the API key
        text.inputEl.type = "password";
      });

    // Model Selection
    new Setting(containerEl)
      .setName("OpenAI Model")
      .setDesc("Select which OpenAI model to use")
      .addDropdown((dropdown) => {
        dropdown
          .addOption("gpt-3.5-turbo", "GPT-3.5 Turbo")
          .addOption("gpt-4o", "GPT-4o")
          .addOption("gpt-4-turbo", "GPT-4 Turbo")
          .setValue(this.plugin.settings.model)
          .onChange(async (value) => {
            this.plugin.settings.model = value;
            await this.plugin.saveSettings();
          });
      });

    // Trigger Phrase
    new Setting(containerEl)
      .setName("Trigger Phrase")
      .setDesc("Character sequence that triggers the LLM prompt")
      .addText((text) => {
        text
          .setPlaceholder("!!")
          .setValue(this.plugin.settings.triggerPhrase)
          .onChange(async (value) => {
            this.plugin.settings.triggerPhrase = value;
            await this.plugin.saveSettings();
          });
      });

    // Enable/Disable
    new Setting(containerEl)
      .setName("Enable Auto-suggest")
      .setDesc("Turn on/off the auto-suggest functionality")
      .addToggle((toggle) => {
        toggle
          .setValue(this.plugin.settings.isEnabled)
          .onChange(async (value) => {
            this.plugin.settings.isEnabled = value;
            await this.plugin.saveSettings();
          });
      });

    // Max Tokens
    new Setting(containerEl)
      .setName("Max Tokens")
      .setDesc("Maximum number of tokens in the response")
      .addSlider((slider) => {
        slider
          .setLimits(100, 4000, 100)
          .setValue(this.plugin.settings.maxTokens)
          .setDynamicTooltip()
          .onChange(async (value) => {
            this.plugin.settings.maxTokens = value;
            await this.plugin.saveSettings();
          });
      });

    // Temperature
    new Setting(containerEl)
      .setName("Temperature")
      .setDesc("Controls randomness: 0 is deterministic, 1 is more creative")
      .addSlider((slider) => {
        slider
          .setLimits(0, 2, 0.1)
          .setValue(this.plugin.settings.temperature)
          .setDynamicTooltip()
          .onChange(async (value) => {
            this.plugin.settings.temperature = value;
            await this.plugin.saveSettings();
          });
      });
  }
}