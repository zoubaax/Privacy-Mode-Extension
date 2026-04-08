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

let cachedSidebar = null;
function getHeuristicSidebar() {
  if (cachedSidebar && document.body.contains(cachedSidebar)) {
    return cachedSidebar;
  }
  
  const screenHeight = window.innerHeight;
  // DeepSeek and others often nest the sidebar deeply inside complex React layout trees.
  // We scan structural structural elements once to find the one matching the physical geometry of a sidebar.
  const layoutContainers = document.querySelectorAll('div, aside, nav, section, menu');
  
  for (const el of layoutContainers) {
    try {
      const rect = el.getBoundingClientRect();
      // A standard sidebar sits on the far left, is narrow (50-450px), and spans most of the screen height.
      if (rect.left <= 10 && rect.width >= 50 && rect.width <= 450 && rect.height > screenHeight * 0.6) {
        cachedSidebar = el;
        return el;
      }
    } catch(e) {}
  }
  return null;
}

function isInsideSidebar(el) {
  const genericSelectors = [
    'nav', 'aside',
    '[class*="sidebar" i]', '[id*="sidebar" i]',
    '[class*="sidenav" i]', '[id*="sidenav" i]',
    '[class*="drawer" i]', '[id*="drawer" i]',
    'mat-sidenav', 
    '[role="navigation" i]'
  ].join(', ');
  
  const container = el.closest(genericSelectors);
  if (container) {
    try {
       const rect = container.getBoundingClientRect();
       const screenHeight = window.innerHeight;
       const screenWidth = window.innerWidth;
       
       // 1. Reject fake sidebars that are too short (like top navbars, bottom toast boxes)
       if (rect.height < screenHeight * 0.3) {
           return false;
       }
       
       // 2. Reject fake sidebars that span the majority of the screen (like main chat windows or body.sidebar-open classes)
       // Absolute max width of a desktop sidebar is strictly < 500px, or 50% of the screen width.
       if (rect.width > Math.max(450, screenWidth * 0.5)) {
           return false;
       }
    } catch(e) {}
    
    return true;
  }

  // Spatial Fallback for deeply obfuscated UI frameworks (like DeepSeek)
  const hSidebar = getHeuristicSidebar();
  if (hSidebar && hSidebar.contains(el)) {
    return true;
  }

  return false;
}

function isExactHistoryList(el) {
  // 1. App-specific exact wrappers for the ACTUAL list of chats (Fast path)
  const exactHistoryContainers = [
    '#pane-side', // WhatsApp
    '[aria-label="Chats" i]', // Messenger
    '[aria-label="Chat history" i]' // ChatGPT
  ].join(', ');

  if (el.closest(exactHistoryContainers)) {
    return true;
  }

  // 2. Standard lists deep within a known sidebar structure
  if (isInsideSidebar(el) && el.closest('ul, ol')) {
    return true;
  }

  return false;
}

function shouldBlur(el) {
  if (!el || el.nodeType !== Node.ELEMENT_NODE) return false;
  
  const tag = el.tagName;
  
  // Core ignore list
  if (tag === 'SCRIPT' || tag === 'STYLE' || tag === 'NOSCRIPT' || tag === 'BODY' || tag === 'HTML' || tag === 'IMG' || tag === 'VIDEO' || tag === 'SVG' || tag === 'PATH') {
    return false;
  }

  // Ignore popups, tooltips, dialogs, and toasts (like the 'Memory full' bar)
  if (el.closest('[role="dialog"], [role="alert"], [role="tooltip"], [role="status"], [class*="toast" i], [id*="toast" i], [class*="popup" i], [class*="popover" i]')) {
    return false;
  }

  // --- CRUCIAL CHANGE ---
  // If the element is NOT inside a sidebar or a navigation pane, DO NOT blur it!
  if (!isInsideSidebar(el)) {
    return false; 
  }

  // Use textContent instead of innerText since it's much faster and prevents browser lag
  const text = el.textContent;
  if (!text) return false;
  
  const trimmed = text.trim();

  // If we are strictly confident it's a history list (ChatGPT, WhatsApp)
  // we blur everything > 3 characters.
  if (isExactHistoryList(el)) {
    if (trimmed.length <= 3) return false;
  } else {
    // GEMINI FALLBACK: It is in a generic sidebar, but not a strict list.
    // To avoid blurring short static buttons like "New chat", "My stuff", "Gems"
    // we require history entries to be longer than 15 characters.
    if (trimmed.length <= 15) return false;
  }

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
