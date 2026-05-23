# Privacy Mode Extension

A lightweight Chrome extension that protects private conversations in public spaces. It blurs chat messages and sidebar history only on supported chat apps.

## Features

- **Fixed supported sites**: The extension only runs on known chat domains.
- **Chat message blur**: Obscures the main conversation area when enabled.
- **Sidebar history blur**: Obscures previous chat titles in the sidebar when enabled.
- **Simple panel**: Turn protection, message blur, sidebar blur, and each supported app on or off.
- **Hover-to-reveal**: Hover a blurred item to reveal it temporarily.
- **Quick toggle**: Press `Ctrl + H` on a supported app to turn privacy mode on or off.
- **No backend**: Settings stay in Chrome storage. No account or login is required.

## Supported Platforms

- ChatGPT
- Google Gemini
- Claude
- Perplexity
- DeepSeek
- Kimi
- Qwen
- WhatsApp Web

## How to Install & Run Locally

If you want to use this extension or modify it, follow these steps to load it into Chrome:

1. Download or clone this folder.
2. Open `chrome://extensions/`.
3. Enable **Developer mode**.
4. Click **Load unpacked**.
5. Select the folder that contains `manifest.json`.

## Usage

- **Open the panel**: Click the extension icon.
- **Choose blur targets**: Enable chat messages, sidebar history, or both.
- **Choose apps**: Enable or disable each supported chat app.
- **Reveal temporarily**: Hover over blurred content.
- **Toggle protection**: Press `Ctrl + H` on a supported chat app.

## Architecture Notes

The manifest injects the content script only on supported chat domains. `content.js` then applies two independent target classes: one for chat messages and one for sidebar history. This keeps normal websites like Wikipedia, Classroom, Gmail, and search pages untouched.
