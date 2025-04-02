// background.js
let rules = {};
let managedExtensions = {};
let activeTabUrls = new Set();

// Load saved rules
chrome.storage.local.get(["rules", "managedExtensions"], (result) => {
  rules = result.rules || {};
  managedExtensions = result.managedExtensions || {};
  // Important: Check all open tabs when extension loads
  updateActiveUrls();
});

// Listen for tab updates - this catches navigation within a tab
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  // We need to check on various stages of loading, not just "complete"
  if (changeInfo.status && tab.url) {
    updateActiveUrls();
  }
});

// Listen for tab activation - when user switches tabs
chrome.tabs.onActivated.addListener(() => {
  updateActiveUrls();
});

// Listen for tab creation - when new tabs are opened
chrome.tabs.onCreated.addListener(() => {
  updateActiveUrls();
});

// Listen for tab removal - when tabs are closed
chrome.tabs.onRemoved.addListener(() => {
  updateActiveUrls();
});

// Listen for window focus changes
chrome.windows.onFocusChanged.addListener(() => {
  updateActiveUrls();
});

// Update the set of active URLs and manage extensions accordingly
function updateActiveUrls() {
  chrome.tabs.query({}, (tabs) => {
    // Clear and rebuild the set of active URLs
    activeTabUrls.clear();
    
    // Debug logging
    console.log("Checking tabs:", tabs.length);
    
    tabs.forEach((tab) => {
      if (tab.url) {
        try {
          const url = new URL(tab.url);
          const hostname = url.hostname;
          
          // Debug logging
          console.log("Found URL:", hostname);
          
          // Store just the hostname
          activeTabUrls.add(hostname);
          
          // Also store domain without subdomain (e.g., "example.com" from "www.example.com")
          const domainParts = hostname.split('.');
          if (domainParts.length > 2) {
            const mainDomain = domainParts.slice(-2).join('.');
            activeTabUrls.add(mainDomain);
          }
        } catch (e) {
          // Handle invalid URLs
          console.error("Invalid URL:", tab.url, e);
        }
      }
    });
    
    // Debug logging
    console.log("Active URLs:", Array.from(activeTabUrls));
    
    // Update extension states based on active URLs
    updateExtensionStates();
  });
}

// Enable/disable extensions based on active URLs
function updateExtensionStates() {
  Object.entries(managedExtensions).forEach(([extId, extInfo]) => {
    let shouldBeEnabled = false;
    
    // Skip if no rules for this extension
    if (!rules[extId] || !rules[extId].sites) {
      console.log(`No rules for extension ${extId}`);
      return;
    }
    
    const extRules = rules[extId];
    const enableMode = extRules.enableMode || "any"; // "any" or "all"
    
    // Debug logging
    console.log(`Checking extension ${extId} with mode ${enableMode}`);
    console.log(`Sites:`, extRules.sites);
    
    if (enableMode === "any") {
      // Enable if ANY matching site is open
      for (const site of extRules.sites) {
        // Check if the site is in our active URLs
        if (activeTabUrls.has(site)) {
          shouldBeEnabled = true;
          console.log(`Match found for ${site}, enabling extension`);
          break;
        }
      }
    } else if (enableMode === "all") {
      // Enable only if ALL matching sites are open
      shouldBeEnabled = extRules.sites.length > 0 && 
        extRules.sites.every(site => activeTabUrls.has(site));
    }
    
    // Get current state to avoid unnecessary API calls
    chrome.management.get(extId, (extensionInfo) => {
      if (extensionInfo && extensionInfo.enabled !== shouldBeEnabled) {
        console.log(`Setting extension ${extId} to ${shouldBeEnabled ? "enabled" : "disabled"}`);
        chrome.management.setEnabled(extId, shouldBeEnabled);
      }
    });
  });
}

// Listen for messages from the popup
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === "saveRules") {
    rules = message.rules;
    managedExtensions = message.managedExtensions;
    chrome.storage.local.set({ rules, managedExtensions });
    // Important: Check all tabs immediately after saving rules
    updateActiveUrls();
    sendResponse({ success: true });
  } else if (message.action === "getRules") {
    sendResponse({ rules, managedExtensions });
  } else if (message.action === "getExtensions") {
    chrome.management.getAll((extensions) => {
      sendResponse({ extensions });
    });
    return true; // Required for async response
  } else if (message.action === "getActiveUrls") {
    sendResponse({ activeUrls: Array.from(activeTabUrls) });
    return true;
  } else if (message.action === "forceUpdate") {
    updateActiveUrls();
    sendResponse({ success: true });
  }
});

// Run an initial check when the extension starts
updateActiveUrls();
