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

const SITE_CONFIGS = {
  chatgpt: {
    hosts: ['chatgpt.com', 'chat.openai.com'],
    messageSelectors: ['[data-message-author-role]', '[data-testid*="conversation-turn" i]', 'article'],
    sidebarSelectors: ['[aria-label="Chat history" i]', 'nav', 'aside']
  },
  gemini: {
    hosts: ['gemini.google.com'],
    messageSelectors: ['message-content', '[class*="conversation" i] [class*="message" i]', '[class*="response" i]'],
    sidebarSelectors: ['bard-sidenav', 'side-navigation', 'nav', 'aside']
  },
  claude: {
    hosts: ['claude.ai'],
    messageSelectors: ['[data-testid*="message" i]', '[class*="message" i]', 'article'],
    sidebarSelectors: ['[data-testid*="sidebar" i]', 'nav', 'aside']
  },
  perplexity: {
    hosts: ['perplexity.ai'],
    messageSelectors: ['[data-testid*="thread" i]', '[class*="message" i]', 'article'],
    sidebarSelectors: ['[class*="sidebar" i]', 'nav', 'aside']
  },
  deepseek: {
    hosts: ['chat.deepseek.com', 'deepseek.com'],
    messageSelectors: ['[class*="message" i]', '[class*="chat" i] [class*="content" i]', '[class*="ds-markdown" i]', '[class*="markdown" i]', 'article'],
    sidebarSelectors: ['[class*="sidebar" i]', '[class*="sider" i]', '[class*="history" i]', 'nav', 'aside'],
    useChatAreaFallback: true,
    useSidebarPositionFallback: true
  },
  kimi: {
    hosts: ['kimi.moonshot.cn', 'moonshot.cn', 'kimi.com'],
    messageSelectors: ['[class*="message" i]', '[class*="chat" i] [class*="content" i]', '[class*="markdown" i]', '[class*="segment" i]', 'article'],
    sidebarSelectors: ['[class*="sidebar" i]', '[class*="sider" i]', '[class*="history" i]', 'nav', 'aside'],
    useChatAreaFallback: true,
    useSidebarPositionFallback: true
  },
  qwen: {
    hosts: ['qwen.ai'],
    messageSelectors: ['[class*="message" i]', '[class*="chat" i] [class*="content" i]', 'article'],
    sidebarSelectors: ['[class*="sidebar" i]', 'nav', 'aside']
  },
  whatsapp: {
    hosts: ['web.whatsapp.com'],
    messageSelectors: [
      '.message-in [data-pre-plain-text]',
      '.message-out [data-pre-plain-text]',
      '.message-in .copyable-text',
      '.message-out .copyable-text',
      '[data-testid="msg-container"]'
    ],
    sidebarSelectors: [
      '#pane-side',
      '[aria-label="Chat list" i]',
      '[data-testid="chat-list"]',
      '[role="grid" i]'
    ]
  }
};

let settings = DEFAULT_SETTINGS;
let observer = null;
let cachedSidebar = null;
let scheduled = false;

const blockTags = new Set(['DIV', 'P', 'UL', 'OL', 'LI', 'TABLE', 'TR', 'TD', 'FORM', 'HEADER', 'FOOTER', 'ARTICLE', 'SECTION', 'ASIDE', 'MAIN', 'NAV', 'FIGURE', 'BLOCKQUOTE']);
const siteKey = getCurrentSiteKey();
const siteConfig = siteKey ? SITE_CONFIGS[siteKey] : null;

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

function getCurrentSiteKey() {
  const host = window.location.hostname.replace(/^www\./, '');

  for (const [key, config] of Object.entries(SITE_CONFIGS)) {
    if (config.hosts.some((allowedHost) => host === allowedHost || host.endsWith(`.${allowedHost}`))) {
      return key;
    }
  }

  return null;
}

function isSiteEnabled() {
  return Boolean(siteKey && settings.enabled && settings.apps[siteKey]);
}

function applyRootClasses() {
  document.documentElement.classList.toggle('privacy-mode-enabled', isSiteEnabled());
  document.documentElement.classList.toggle('privacy-blur-messages-enabled', Boolean(settings.blurMessages));
  document.documentElement.classList.toggle('privacy-blur-sidebar-enabled', Boolean(settings.blurSidebar));
}

function clearTargets() {
  document
    .querySelectorAll('.privacy-blur-target, .privacy-blur-message, .privacy-blur-sidebar')
    .forEach((el) => {
      el.classList.remove('privacy-blur-target', 'privacy-blur-message', 'privacy-blur-sidebar');
    });
}

function getHeuristicSidebar() {
  if (cachedSidebar && document.body.contains(cachedSidebar)) {
    return cachedSidebar;
  }

  const screenHeight = window.innerHeight;
  const layoutContainers = document.querySelectorAll('div, aside, nav, section, menu');

  for (const el of layoutContainers) {
    try {
      const rect = el.getBoundingClientRect();

      if (rect.left <= 10 && rect.width >= 50 && rect.width <= 450 && rect.height > screenHeight * 0.6) {
        cachedSidebar = el;
        return el;
      }
    } catch (e) {}
  }

  return null;
}

function isInsideSidebar(el) {
  const siteSelectors = siteConfig.sidebarSelectors.join(', ');
  const genericSelectors = [
    siteSelectors,
    '[class*="sidebar" i]',
    '[id*="sidebar" i]',
    '[class*="sidenav" i]',
    '[id*="sidenav" i]',
    '[class*="drawer" i]',
    '[id*="drawer" i]',
    '[role="navigation" i]'
  ].join(', ');

  const container = el.closest(genericSelectors);

  if (container) {
    try {
      const rect = container.getBoundingClientRect();
      const screenHeight = window.innerHeight;
      const screenWidth = window.innerWidth;

      if (rect.height < screenHeight * 0.3) return false;
      if (rect.width > Math.max(450, screenWidth * 0.5)) return false;
    } catch (e) {}

    return true;
  }

  const hSidebar = getHeuristicSidebar();
  if (hSidebar && hSidebar.contains(el)) return true;

  return Boolean(siteConfig.useSidebarPositionFallback && isInLeftSidebarZone(el));
}

function isChatMessage(el) {
  if (!settings.blurMessages || !siteConfig) return false;
  if (el.closest('nav, aside, [role="navigation" i], [class*="sidebar" i], [id*="sidebar" i]')) return false;
  if (siteConfig.sidebarSelectors.some((selector) => el.closest(selector))) return false;
  if (el.closest('textarea, input, [contenteditable="true"], [role="textbox" i]')) return false;
  if (siteKey === 'whatsapp' && containsMedia(el)) return false;
  if (siteConfig.messageSelectors.some((selector) => el.matches(selector) || el.closest(selector))) return true;
  return Boolean(siteConfig.useChatAreaFallback && isLikelyChatText(el));
}

function isSidebarHistory(el) {
  if (!settings.blurSidebar || !siteConfig) return false;
  if (!isInsideSidebar(el)) return false;
  if (el.closest('button, input, textarea, [contenteditable="true"], [role="textbox" i]')) return false;
  if (siteKey === 'whatsapp' && containsMedia(el)) return false;

  const text = el.textContent ? el.textContent.trim() : '';
  if (text.length <= 3) return false;

  for (const child of el.children) {
    if (blockTags.has(child.tagName)) return false;
  }

  return true;
}

function containsMedia(el) {
  return Boolean(el.querySelector('img, picture, video, canvas, svg'));
}

function isInLeftSidebarZone(el) {
  try {
    const rect = el.getBoundingClientRect();
    const screenWidth = window.innerWidth;
    const screenHeight = window.innerHeight;
    const maxSidebarRight = Math.min(460, screenWidth * 0.48);

    if (rect.width < 20 || rect.height < 8) return false;
    if (rect.left < 0 || rect.right > maxSidebarRight) return false;
    if (rect.top < 90 || rect.bottom > screenHeight - 24) return false;
  } catch (e) {
    return false;
  }

  return true;
}

function ignoreElement(el) {
  const tag = el.tagName;

  if (['SCRIPT', 'STYLE', 'NOSCRIPT', 'BODY', 'HTML', 'IMG', 'VIDEO', 'SVG', 'PATH'].includes(tag)) {
    return true;
  }

  return Boolean(el.closest('[role="dialog"], [role="alert"], [role="tooltip"], [role="status"], [class*="toast" i], [id*="toast" i], [class*="popup" i], [class*="popover" i]'));
}

function isLikelyChatText(el) {
  if (isInsideSidebar(el)) return false;
  if (el.closest('button, a, select, label, summary, menu, header, footer')) return false;
  if (el.children.length > 2) return false;

  const text = el.textContent ? el.textContent.trim() : '';
  if (text.length < 12) return false;

  for (const child of el.children) {
    if (blockTags.has(child.tagName) && child.textContent && child.textContent.trim().length > 0) {
      return false;
    }
  }

  try {
    const rect = el.getBoundingClientRect();
    const screenWidth = window.innerWidth;
    const screenHeight = window.innerHeight;

    if (rect.width < 80 || rect.height < 12) return false;
    if (rect.width > screenWidth * 0.9 || rect.height > screenHeight * 0.45) return false;
    if (rect.top < 48 || rect.bottom > screenHeight - 72) return false;
    if (rect.left < Math.min(260, screenWidth * 0.22)) return false;
  } catch (e) {
    return false;
  }

  return true;
}

function markNode(el) {
  if (!el || el.nodeType !== Node.ELEMENT_NODE) return false;

  if (isWhatsAppAvatar(el)) {
    el.classList.add('privacy-blur-target', 'privacy-blur-sidebar');
    return true;
  }

  if (ignoreElement(el)) return false;

  if (isChatMessage(el)) {
    el.classList.add('privacy-blur-target', 'privacy-blur-message');
    return true;
  }

  if (isSidebarHistory(el)) {
    el.classList.add('privacy-blur-target', 'privacy-blur-sidebar');
    return true;
  }

  return false;
}

function isWhatsAppAvatar(el) {
  if (siteKey !== 'whatsapp' || !settings.blurSidebar) return false;
  if (!el.matches('img')) return false;
  if (!el.closest('#pane-side, [data-testid="chat-list"], [aria-label="Chat list" i], header')) return false;

  try {
    const rect = el.getBoundingClientRect();
    if (rect.width < 20 || rect.height < 20) return false;
    if (rect.width > 96 || rect.height > 96) return false;
  } catch (e) {
    return false;
  }

  return true;
}

function processNode(node) {
  if (!node || node.nodeType !== Node.ELEMENT_NODE) return;
  if (markNode(node)) return;

  for (const child of node.children) {
    processNode(child);
  }
}

function refreshTargets() {
  scheduled = false;
  cachedSidebar = null;
  applyRootClasses();
  clearTargets();

  if (!isSiteEnabled() || (!settings.blurMessages && !settings.blurSidebar)) {
    return;
  }

  processNode(document.body);
}

function scheduleRefresh() {
  if (scheduled) return;
  scheduled = true;
  window.setTimeout(refreshTargets, 100);
}

function startObserver() {
  if (observer || !document.body) return;

  observer = new MutationObserver(() => {
    if (isSiteEnabled()) scheduleRefresh();
  });

  observer.observe(document.body, {
    childList: true,
    subtree: true
  });
}

function loadSettings() {
  chrome.storage.sync.get(DEFAULT_SETTINGS, (saved) => {
    settings = mergeSettings(saved);
    refreshTargets();
    startObserver();
  });
}

if (siteConfig) {
  loadSettings();

  chrome.storage.onChanged.addListener((changes, areaName) => {
    if (areaName !== 'sync') return;

    const next = {};
    for (const [key, change] of Object.entries(changes)) {
      next[key] = change.newValue;
    }

    settings = mergeSettings({
      ...settings,
      ...next
    });
    refreshTargets();
  });

  document.addEventListener('keydown', (e) => {
    if (e.ctrlKey && e.key.toLowerCase() === 'h') {
      e.preventDefault();
      settings = {
        ...settings,
        enabled: !settings.enabled
      };
      chrome.storage.sync.set({ enabled: settings.enabled });
      refreshTargets();
    }
  });
}
