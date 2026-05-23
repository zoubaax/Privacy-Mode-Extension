const DEFAULT_SETTINGS = {
  enabled: true,
  blurMessages: true,
  blurSidebar: true,
  apps: {
    chatgpt: true,
    gemini: true,
    claude: true,
    perplexity: true,
    deepseek: true,
    kimi: true,
    qwen: true,
    whatsapp: true
  }
};

const APPS = [
  { key: 'chatgpt', label: 'ChatGPT', hosts: ['chatgpt.com', 'chat.openai.com'] },
  { key: 'gemini', label: 'Gemini', hosts: ['gemini.google.com'] },
  { key: 'claude', label: 'Claude', hosts: ['claude.ai'] },
  { key: 'perplexity', label: 'Perplexity', hosts: ['perplexity.ai'] },
  { key: 'deepseek', label: 'DeepSeek', hosts: ['chat.deepseek.com', 'deepseek.com'] },
  { key: 'kimi', label: 'Kimi', hosts: ['kimi.moonshot.cn', 'moonshot.cn', 'kimi.com'] },
  { key: 'qwen', label: 'Qwen', hosts: ['qwen.ai'] },
  { key: 'whatsapp', label: 'WhatsApp', hosts: ['web.whatsapp.com'] }
];

const enabledInput = document.getElementById('enabled');
const blurMessagesInput = document.getElementById('blurMessages');
const blurSidebarInput = document.getElementById('blurSidebar');
const appsContainer = document.getElementById('apps');
const siteStatus = document.getElementById('siteStatus');
const protectionState = document.getElementById('protectionState');

let settings = DEFAULT_SETTINGS;
const hasChromeApi = typeof chrome !== 'undefined' && chrome.storage && chrome.tabs;

function mergeSettings(saved) {
  return {
    ...DEFAULT_SETTINGS,
    ...saved,
    apps: {
      ...DEFAULT_SETTINGS.apps,
      ...(saved && saved.apps ? saved.apps : {})
    }
  };
}

function appFromUrl(url) {
  if (!url) return null;

  try {
    const host = new URL(url).hostname.replace(/^www\./, '');
    return APPS.find((app) => app.hosts.some((allowedHost) => host === allowedHost || host.endsWith(`.${allowedHost}`)));
  } catch (e) {
    return null;
  }
}

function saveSettings(partial) {
  settings = mergeSettings({
    ...settings,
    ...partial
  });
  if (hasChromeApi) {
    chrome.storage.sync.set(partial);
  }
}

function renderApps() {
  appsContainer.textContent = '';

  for (const app of APPS) {
    const label = document.createElement('label');
    label.className = 'app-row';

    const name = document.createElement('span');
    name.className = 'app-name';

    const badge = document.createElement('span');
    badge.className = 'app-badge';
    badge.textContent = app.label.slice(0, 1);

    const text = document.createElement('strong');
    text.textContent = app.label;

    name.append(badge, text);

    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.checked = Boolean(settings.apps[app.key]);
    checkbox.addEventListener('change', () => {
      saveSettings({
        apps: {
          ...settings.apps,
          [app.key]: checkbox.checked
        }
      });
    });

    label.append(name, checkbox);
    appsContainer.append(label);
  }
}

function renderSettings() {
  enabledInput.checked = Boolean(settings.enabled);
  blurMessagesInput.checked = Boolean(settings.blurMessages);
  blurSidebarInput.checked = Boolean(settings.blurSidebar);
  protectionState.textContent = settings.enabled ? 'On' : 'Off';
  document.body.classList.toggle('is-disabled', !settings.enabled);
  renderApps();
}

enabledInput.addEventListener('change', () => {
  saveSettings({ enabled: enabledInput.checked });
  renderSettings();
});
blurMessagesInput.addEventListener('change', () => {
  saveSettings({ blurMessages: blurMessagesInput.checked });
  renderSettings();
});
blurSidebarInput.addEventListener('change', () => {
  saveSettings({ blurSidebar: blurSidebarInput.checked });
  renderSettings();
});

if (hasChromeApi) {
  chrome.storage.sync.get(DEFAULT_SETTINGS, (saved) => {
    settings = mergeSettings(saved);
    renderSettings();
  });

  chrome.tabs.query({ active: true, currentWindow: true }, ([tab]) => {
    const app = appFromUrl(tab && tab.url);

    if (app) {
      siteStatus.textContent = `Active on ${app.label}`;
      return;
    }

    siteStatus.textContent = 'Only works on supported chat sites';
    siteStatus.classList.add('unsupported');
  });
} else {
  siteStatus.textContent = 'Preview mode';
  renderSettings();
}
