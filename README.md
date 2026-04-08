# Privacy Mode Extension 🛡️

A lightweight, highly advanced Chrome Extension designed to protect your privacy when using AI chat applications or messaging platforms in public spaces. It automatically blurs out your sensitive chat histories and conversation titles in the sidebar, while keeping your main chat interface completely readable and unaffected.

## ✨ Features
- **Instant History Blur**: Automatically obscures sidebars and chat history titles across the web.
- **Hover-to-Reveal**: Need to check a past chat? Simply hover your mouse over the blurred text to instantly reveal it.
- **Quick Toggle (Ctrl + H)**: Instantly turn the privacy mode ON or OFF using the `Ctrl + H` keyboard shortcut.
- **Advanced Spatial Detection**: Uses a custom-built geometry algorithm to flawlessly identify sidebars—even on highly obfuscated platforms (like DeepSeek, Google Gemini, and Kimi) that try to hide their HTML structure.
- **No Backend**: 100% pure JavaScript and CSS. No data ever leaves your browser.

## 🚀 Supported Platforms
This extension uses intelligent bounding-box heuristics, meaning it works automatically on almost all modern web apps. It has been specifically fine-tuned for:
- ChatGPT
- Google Gemini
- DeepSeek
- Kimi
- WhatsApp Web
- Messenger

## ⚙️ How to Install & Run Locally

If you want to use this extension or modify it, follow these steps to load it into your Chrome browser:

1. **Clone or Download the Repository**
   Download the project folder containing the extension files (`manifest.json`, `content.js`, `content.css`) to your local machine.

2. **Open Chrome Extensions Page**
   Open Google Chrome and type `chrome://extensions/` into the URL bar, then press Enter.

3. **Enable Developer Mode**
   In the top right corner of the Extensions page, toggle the **Developer mode** switch to "ON".

4. **Load the Extension**
   - Click the **Load unpacked** button that appears in the top left corner.
   - Select the folder that contains this extension's files (the folder containing `manifest.json`).

5. **Done!**
   The extension is now active. Whenever you visit a supported web app, your sidebars will be automatically blurred!

## 🛠️ Usage
- **Blurring**: Happens automatically on page load.
- **Unblurring a specific chat**: Just hover your mouse over the blurred text.
- **Toggle entire extension**: Press `Ctrl + H` anywhere on the page to disable or re-enable the blur effect entirely.

## 🧬 Architecture Notes
The core engine (`content.js`) relies on two fallback layers:
1. **Semantic DOM Matching**: Safely matches strict HTML standard tags (like `<nav>`, `<aside>`) but measures their physical height/width to ensure they aren't rogue popup boxes or full-screen wrappers.
2. **Physical Geography Heuristics**: For platforms built with obfuscated CSS frameworks (like Tailwind in DeepSeek or Kimi), it mathematically calculates screen coordinates to find containers locked strictly to the far-left edge that are tall and narrow.
