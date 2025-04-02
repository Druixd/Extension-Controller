// popup.js
let rules = {};
let managedExtensions = {};
let extensionsList = [];
let activeUrls = [];

// Load data when popup opens
document.addEventListener("DOMContentLoaded", () => {
    loadData();
    
    // Save button handler
    document.getElementById("save-btn").addEventListener("click", saveRules);
    
    // Refresh button handler
    document.getElementById("refresh-btn").addEventListener("click", () => {
      chrome.runtime.sendMessage({ action: "forceUpdate" }, (response) => {
        if (response.success) {
          const status = document.getElementById("status");
          status.textContent = "Refreshed extension states!";
          setTimeout(() => { status.textContent = ""; }, 2000);
          
          // Reload the active URLs display
          loadData();
        }
      });
    });
  });

function loadData() {
  // Get active URLs
  chrome.runtime.sendMessage({ action: "getActiveUrls" }, (response) => {
    activeUrls = response.activeUrls || [];
    renderActiveUrls();
  });

  // Get all extensions
  chrome.runtime.sendMessage({ action: "getExtensions" }, (response) => {
    extensionsList = response.extensions.filter(
      (ext) => ext.id !== chrome.runtime.id && !ext.isApp
    );
    
    // Get saved rules
    chrome.runtime.sendMessage({ action: "getRules" }, (response) => {
      rules = response.rules || {};
      managedExtensions = response.managedExtensions || {};
      renderExtensionsList();
    });
  });
}

// Render active URLs
function renderActiveUrls() {
  const container = document.getElementById("active-sites-container");
  container.innerHTML = "";
  
  if (activeUrls.length === 0) {
    container.textContent = "No sites detected in open tabs.";
    return;
  }
  
  activeUrls.forEach(url => {
    const urlSpan = document.createElement("span");
    urlSpan.className = "active-site";
    urlSpan.textContent = url;
    
    // Add click to copy functionality
    urlSpan.title = "Click to copy to clipboard";
    urlSpan.style.cursor = "pointer";
    urlSpan.addEventListener("click", () => {
      navigator.clipboard.writeText(url).then(() => {
        const status = document.getElementById("status");
        status.textContent = `Copied: ${url}`;
        setTimeout(() => { status.textContent = ""; }, 2000);
      });
    });
    
    container.appendChild(urlSpan);
  });
}

// Render the list of extensions
function renderExtensionsList() {
  const container = document.getElementById("extensions-container");
  container.innerHTML = "";
  
  extensionsList.forEach((ext) => {
    const extDiv = document.createElement("div");
    extDiv.className = "extension-item";
    
    // Checkbox to manage this extension
    const manageCheck = document.createElement("input");
    manageCheck.type = "checkbox";
    manageCheck.id = `manage-${ext.id}`;
    manageCheck.checked = !!managedExtensions[ext.id];
    manageCheck.addEventListener("change", () => {
      if (manageCheck.checked) {
        managedExtensions[ext.id] = {
          name: ext.name,
          enabled: ext.enabled,
        };
        if (!rules[ext.id]) {
          rules[ext.id] = {
            sites: [],
            enableMode: "any"
          };
        }
      } else {
        delete managedExtensions[ext.id];
      }
      renderExtensionsList();
    });
    
    const label = document.createElement("label");
    label.htmlFor = `manage-${ext.id}`;
    label.textContent = `${ext.name} (${ext.enabled ? "Enabled" : "Disabled"})`;
    
    extDiv.appendChild(manageCheck);
    extDiv.appendChild(label);
    
    // Only show site configuration if extension is managed
    if (managedExtensions[ext.id]) {
      // Enable mode selector
      const enableModeDiv = document.createElement("div");
      enableModeDiv.className = "enable-mode";
      
      const enableModeLabel = document.createElement("span");
      enableModeLabel.textContent = "Enable when: ";
      
      const enableModeSelect = document.createElement("select");
      enableModeSelect.id = `mode-${ext.id}`;
      
      const anyOption = document.createElement("option");
      anyOption.value = "any";
      anyOption.textContent = "ANY of these sites are open";
      
      const allOption = document.createElement("option");
      allOption.value = "all";
      allOption.textContent = "ALL of these sites are open";
      
      enableModeSelect.appendChild(anyOption);
      enableModeSelect.appendChild(allOption);
      
      // Set current value
      if (rules[ext.id] && rules[ext.id].enableMode) {
        enableModeSelect.value = rules[ext.id].enableMode;
      }
      
      enableModeSelect.addEventListener("change", () => {
        if (!rules[ext.id]) {
          rules[ext.id] = { sites: [] };
        }
        rules[ext.id].enableMode = enableModeSelect.value;
      });
      
      enableModeDiv.appendChild(enableModeLabel);
      enableModeDiv.appendChild(enableModeSelect);
      extDiv.appendChild(enableModeDiv);
      
      // Sites list
      const sitesDiv = document.createElement("div");
      sitesDiv.className = "site-list";
      
      const sitesLabel = document.createElement("div");
      sitesLabel.textContent = "Sites:";
      sitesDiv.appendChild(sitesLabel);
      
      // Show current sites
      if (rules[ext.id] && rules[ext.id].sites && rules[ext.id].sites.length > 0) {
        rules[ext.id].sites.forEach((site, index) => {
          const siteItem = createSiteItem(ext.id, site, index);
          sitesDiv.appendChild(siteItem);
        });
      } else {
        const noSitesMsg = document.createElement("div");
        noSitesMsg.textContent = "No sites added yet.";
        noSitesMsg.style.fontStyle = "italic";
        sitesDiv.appendChild(noSitesMsg);
      }
      
      // Add new site input
      const newSiteDiv = document.createElement("div");
      newSiteDiv.className = "site-item";
      newSiteDiv.style.marginTop = "10px";
      
      const newSiteInput = document.createElement("input");
      newSiteInput.type = "text";
      newSiteInput.placeholder = "example.com";
      
      const addBtn = document.createElement("button");
      addBtn.textContent = "Add";
      addBtn.addEventListener("click", () => {
        const site = newSiteInput.value.trim();
        if (site) {
          if (!rules[ext.id]) {
            rules[ext.id] = { sites: [], enableMode: "any" };
          }
          if (!rules[ext.id].sites) {
            rules[ext.id].sites = [];
          }
          rules[ext.id].sites.push(site);
          newSiteInput.value = "";
          renderExtensionsList();
        }
      });
      
      newSiteDiv.appendChild(newSiteInput);
      newSiteDiv.appendChild(addBtn);
      sitesDiv.appendChild(newSiteDiv);
      extDiv.appendChild(sitesDiv);
    }
    
    container.appendChild(extDiv);
  });
}

// Create a site item with remove button
function createSiteItem(extId, site, index) {
  const siteDiv = document.createElement("div");
  siteDiv.className = "site-item";
  
  const siteText = document.createElement("span");
  siteText.textContent = site;
  siteText.style.flex = "1";
  
  // Highlight if site is currently active
  if (activeUrls.includes(site)) {
    siteText.style.fontWeight = "bold";
    siteText.style.color = "#4285f4";
  }
  
  const removeBtn = document.createElement("button");
  removeBtn.textContent = "Remove";
  removeBtn.addEventListener("click", () => {
    rules[extId].sites.splice(index, 1);
    renderExtensionsList();
  });
  
  siteDiv.appendChild(siteText);
  siteDiv.appendChild(removeBtn);
  
  return siteDiv;
}

// Save rules to background script
function saveRules() {
  chrome.runtime.sendMessage(
    {
      action: "saveRules",
      rules: rules,
      managedExtensions: managedExtensions,
    },
    (response) => {
      if (response.success) {
        const status = document.getElementById("status");
        status.textContent = "Configuration saved!";
        setTimeout(() => { status.textContent = ""; }, 2000);
      }
    }
  );
}
