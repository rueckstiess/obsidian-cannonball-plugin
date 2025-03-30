import { App, Editor, MarkdownView, Modal, Notice, Plugin, PluginSettingTab, Setting } from 'obsidian';
import { SYSTEM_PROMPT, GENERIC_NODE_PROMPT } from './prompts';


interface MyPluginSettings {
	apiKey: string;
}

const DEFAULT_SETTINGS: MyPluginSettings = {
	apiKey: ''
}

export default class MyPlugin extends Plugin {
	settings: MyPluginSettings;

	async onload() {
		await this.loadSettings();

		// This creates an icon in the left ribbon.
		const ribbonIconEl = this.addRibbonIcon('dice', 'Sample Plugin', (evt: MouseEvent) => {
			// Called when the user clicks the icon.
			new Notice('This is a notice!');
		});
		// Perform additional things with the ribbon
		ribbonIconEl.addClass('my-plugin-ribbon-class');

		// This adds a status bar item to the bottom of the app. Does not work on mobile apps.
		const statusBarItemEl = this.addStatusBarItem();
		statusBarItemEl.setText('Status Bar Text');

		this.addCommand({
			id: 'ask-openai',
			name: 'Ask OpenAI a question',
			hotkeys: [{ modifiers: ['Mod', 'Shift'], key: 'c' }],
			editorCallback: (editor) => this.askLLM(editor),
		});

		// This adds a settings tab so the user can configure various aspects of the plugin
		this.addSettingTab(new SampleSettingTab(this.app, this));

		// If the plugin hooks up any global DOM events (on parts of the app that doesn't belong to this plugin)
		// Using this function will automatically remove the event listener when this plugin is disabled.
		// this.registerDomEvent(document, 'click', (evt: MouseEvent) => {
		// 	console.log('click', evt);
		// });

		// When registering intervals, this function will automatically clear the interval when the plugin is disabled.
		// this.registerInterval(window.setInterval(() => console.log('setInterval'), 5 * 60 * 1000));
	}

	async askLLM(editor: Editor): Promise<void> {
		if (!this.settings.apiKey) {
			new Notice('OpenAI API key not set!');
			return;
		}

		const markdownContent = editor.getValue(); // Full note content
		const cursor = editor.getCursor();
		const line = editor.getLine(cursor.line);

		// Extract node content from line
		const match = line.match(/^- *(?:\[\w?\])? *(.*)/);
		const nodeContent = match ? match[1].trim() : line.trim();

		const nodeType = 'Task'; // hardcoded for now

		const systemPrompt = SYSTEM_PROMPT(markdownContent);
		const userPrompt = GENERIC_NODE_PROMPT(nodeType, nodeContent, markdownContent);

		console.log('[Cannonball Plugin] === Prompt Debug ===');
		console.log('System Prompt:\n', systemPrompt);
		console.log('User Prompt:\n', userPrompt);

		try {
			const res = await fetch('https://api.openai.com/v1/chat/completions', {
				method: 'POST',
				headers: {
					'Authorization': `Bearer ${this.settings.apiKey}`,
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({
					model: 'gpt-4o',
					messages: [
						{ role: 'system', content: systemPrompt },
						{ role: 'user', content: userPrompt }
					]
				}),
			});

			const data = await res.json();
			const reply = data.choices?.[0]?.message?.content?.trim() || '[No response]';

			new Notice(`LLM response:\n${reply}`);
			console.log('[Cannonball Plugin] === LLM Response ===');
			console.log(reply);
		} catch (err) {
			console.error(err);
			new Notice('[Error calling OpenAI]');
		}
	}

	onunload() {

	}

	async loadSettings() {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}
}

class SampleModal extends Modal {
	constructor(app: App) {
		super(app);
	}

	onOpen() {
		const { contentEl } = this;
		contentEl.setText('Woah!');
	}

	onClose() {
		const { contentEl } = this;
		contentEl.empty();
	}
}

class SampleSettingTab extends PluginSettingTab {
	plugin: MyPlugin;

	constructor(app: App, plugin: MyPlugin) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const { containerEl } = this;

		containerEl.empty();

		new Setting(containerEl)
			.setName('OpenAI API Key')
			.setDesc('Enter your OpenAI API key to use the plugin.')
			.addText(text => text
				.setPlaceholder('Enter OpenAI API Key')
				.setValue(this.plugin.settings.apiKey)
				.onChange(async (value) => {
					this.plugin.settings.apiKey = value;
					await this.plugin.saveSettings();
				}));
	}
}
