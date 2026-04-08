let isPrivacyModeEnabled = true;

// 1. Initialize master switch
if (isPrivacyModeEnabled) {
  document.documentElement.classList.add('privacy-mode-enabled');
}

// 2. Setup Shortcut Toggle
document.addEventListener('keydown', (e) => {
  // Ctrl + H
  if (e.ctrlKey && e.key.toLowerCase() === 'h') {
    e.preventDefault(); 
    isPrivacyModeEnabled = !isPrivacyModeEnabled;
    document.documentElement.classList.toggle('privacy-mode-enabled', isPrivacyModeEnabled);
  }
});

const blockTags = new Set(['DIV', 'P', 'UL', 'OL', 'LI', 'TABLE', 'TR', 'TD', 'FORM', 'HEADER', 'FOOTER', 'ARTICLE', 'SECTION', 'ASIDE', 'MAIN', 'NAV', 'FIGURE', 'BLOCKQUOTE']);

function isInsideSidebar(el) {
  const selectors = [
    'nav', 'aside',
    '[class*="sidebar" i]', '[id*="sidebar" i]',
    '[class*="sidenav" i]', '[id*="sidenav" i]',
    '[class*="drawer" i]', '[id*="drawer" i]',
    '[class*="history" i]', '[id*="history" i]',
    '#pane-side', // WhatsApp
    '[aria-label*="chat" i]', // Messenger & Gemini
    '[aria-label*="drawer" i]', 
    '[aria-label*="recent" i]',
    '[aria-label*="history" i]',
    '[aria-label*="conversation" i]',
    '[role="navigation" i]'
  ].join(', ');

  return el.closest(selectors) !== null;
}

function shouldBlur(el) {
  if (!el || el.nodeType !== Node.ELEMENT_NODE) return false;
  
  const tag = el.tagName;
  
  // Core ignore list
  if (tag === 'SCRIPT' || tag === 'STYLE' || tag === 'NOSCRIPT' || tag === 'BODY' || tag === 'HTML' || tag === 'IMG' || tag === 'VIDEO' || tag === 'SVG' || tag === 'PATH') {
    return false;
  }

  // Ignore popups, tooltips, and dialogs (like the 'Memory full' bar)
  if (el.closest('[role="dialog"], [role="alert"], [role="tooltip"], [role="status"]')) {
    return false;
  }

  // --- CRUCIAL CHANGE ---
  // If the element is NOT inside a sidebar or a navigation pane, DO NOT blur it!
  // This keeps the main active chat / main context completely clear and readable.
  if (!isInsideSidebar(el)) {
    return false; 
  }

  // Use textContent instead of innerText since it's much faster and prevents browser lag
  const text = el.textContent;
  
  // Lower tolerance since sidebars often have short history logs (like names)
  if (!text || text.trim().length <= 3) return false;

  // To prevent entire huge wrappers from blurring, we only blur leaf elements 
  for (const child of el.children) {
    if (blockTags.has(child.tagName)) {
      return false; 
    }
  }

  return true;
}

// 4. Initial DOM processor
function processNode(node) {
  if (node.nodeType === Node.ELEMENT_NODE) {
    if (shouldBlur(node)) {
      node.classList.add('privacy-blur-target');
    } else {
      for (const child of node.children) {
        processNode(child);
      }
    }
  }
}
processNode(document.body);

// 5. Dynamic Observer for dynamic chat platforms
const observer = new MutationObserver((mutations) => {
  for (const mutation of mutations) {
    for (const node of mutation.addedNodes) {
      if (node.nodeType === Node.ELEMENT_NODE) {
        processNode(node);
      } else if (node.nodeType === Node.TEXT_NODE) {
        if (node.parentElement && shouldBlur(node.parentElement)) {
          node.parentElement.classList.add('privacy-blur-target');
        }
      }
    }
  }
});

observer.observe(document.body, {
  childList: true,
  subtree: true
});
