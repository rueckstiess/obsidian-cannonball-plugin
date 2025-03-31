# LLM Helper for Obsidian

This plugin integrates LLM capabilities directly into Obsidian. Use a trigger phrase (default: `!!`) to open a prompt, send it to an LLM, and insert the response at your cursor position.

## Features

- Trigger LLM assistance with a customizable trigger phrase
- Full document context sent to the LLM for relevant responses
- Configurable OpenAI model settings
- Simple and intuitive interface

## Installation

### From Obsidian Community Plugins

1. Open Obsidian Settings
2. Go to Community Plugins
3. Search for "LLM Helper"
4. Click Install, then Enable

### Manual Installation

1. Download the latest release from the GitHub releases page
2. Extract the files to your Obsidian plugins folder: `[vault]/.obsidian/plugins/llm-helper/`
3. Restart Obsidian
4. Enable the plugin in Obsidian settings > Community Plugins

## Setup

1. Get an API key from OpenAI: https://platform.openai.com/account/api-keys
2. Open Obsidian Settings > LLM Helper
3. Enter your OpenAI API key
4. Configure other settings as desired

## Usage

1. Type `!!` (or your custom trigger phrase) in any note
2. Click "Open LLM Prompt" from the suggestion popup
3. Enter your prompt in the modal dialog
4. Click "Submit to LLM"
5. The LLM's response will be inserted at your cursor position

## Settings

- **API Key**: Your OpenAI API key
- **Model**: Select which OpenAI model to use
- **Trigger Phrase**: Custom phrase to trigger the LLM prompt
- **Max Tokens**: Maximum response length
- **Temperature**: Controls randomness of responses

## Security Note

Your API key is stored locally in your vault's data. Never share your vault or plugin settings with others if you have your API key stored.

## License

MIT