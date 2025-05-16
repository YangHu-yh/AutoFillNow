chrome.action.onClicked.addListener((tab) => {
    console.log("Extension icon clicked for tab:", tab.url);
    
    // Check if the URL is valid for content script injection
    const url = tab.url || '';
    const restrictedProtocols = ['chrome:', 'edge:', 'about:', 'file:', 'chrome-extension:', 'devtools:'];
    const isRestricted = restrictedProtocols.some(protocol => url.startsWith(protocol));
    
    if (isRestricted) {
        console.log("Cannot inject scripts into restricted URL:", url);
        handleFallback(tab);
        return;
    }
    
    // First attempt to inject our content script if needed
    chrome.scripting.executeScript({
        target: {tabId: tab.id},
        function: injectContentScript,
        args: []
    }).then(() => {
        // Then execute the main function
        setTimeout(() => {
            chrome.scripting.executeScript({
                target: {tabId: tab.id},
                function: main,
                args: []
            }).then(() => {
                console.log("Script executed successfully");
            }).catch(error => {
                console.error("Error executing main script:", error);
                handleFallback(tab);
            });
        }, 500); // Give time for the content script to initialize
    }).catch(error => {
        console.error("Error injecting content script:", error);
        handleFallback(tab);
    });
});

function injectContentScript() {
    // Check if autofill_manager already exists
    if (!window.autofill_manager) {
        console.log("Autofill manager not found, initializing...");
        // Create the manager with the current URL
        window.autofill_manager = new ExeManager(document.URL);
        window.autofill_manager.create_popup();
    } else {
        console.log("Autofill manager already exists");
    }
}

function main() {
    console.log("Main function triggered");
    if (window.autofill_manager) {
        console.log("Autofill manager found");
        // Ensure popup is recreated if it doesn't exist
        if (!window.autofill_manager.popup) {
            console.log("Popup not found, creating it");
            window.autofill_manager.create_popup();
            setTimeout(() => {
                if (window.autofill_manager.popup) {
                    window.autofill_manager.popup.show_popup();
                } else {
                    console.error("Failed to create popup");
                    alert("Could not create the AutoFill popup. Please try refreshing the page.");
                }
            }, 500);
        } else {
            console.log("Popup found, showing it");
            window.autofill_manager.popup.show_popup();
        }
    } else {
        console.error("Autofill manager not found");
        alert("AutoFill not initialized properly. Please reload the page and try again.");
    }
}

function handleFallback(tab) {
    // If we couldn't execute the script, open the edit page
    console.log("Using fallback: opening edit page");
    
    // Show a notification to the user
    chrome.notifications.create({
        type: 'basic',
        iconUrl: chrome.runtime.getURL('img/logo.png'),
        title: 'AutoFill Extension',
        message: 'Cannot run AutoFill on this page. Opening the profile editor instead.'
    });
    
    // Open the editor page
    chrome.tabs.create({url: chrome.runtime.getURL('index.html')});
}

// Create a context menu for the extension icon
chrome.runtime.onInstalled.addListener(() => {
    // Create context menu items
    chrome.contextMenus.create({
        id: "openEditor",
        title: "Edit Profile",
        contexts: ["action"]
    });
    
    chrome.contextMenus.create({
        id: "openDebugger",
        title: "Open Debugger",
        contexts: ["action"]
    });
    
    // Add a context menu item for manually triggering autofill on web pages
    chrome.contextMenus.create({
        id: "manualAutofill",
        title: "AutoFill This Form",
        contexts: ["page"]
    });
    
    console.log("Context menu items created");
});

// Handle context menu clicks
chrome.contextMenus.onClicked.addListener((info, tab) => {
    if (info.menuItemId === "openEditor") {
        chrome.tabs.create({url: chrome.runtime.getURL('index.html')});
    } else if (info.menuItemId === "openDebugger") {
        chrome.tabs.create({url: chrome.runtime.getURL('debug.html')});
    } else if (info.menuItemId === "manualAutofill") {
        // Attempt to run the autofill on the current page
        const url = tab.url || '';
        const restrictedProtocols = ['chrome:', 'edge:', 'about:', 'file:', 'chrome-extension:', 'devtools:'];
        const isRestricted = restrictedProtocols.some(protocol => url.startsWith(protocol));
        
        if (isRestricted) {
            chrome.notifications.create({
                type: 'basic',
                iconUrl: chrome.runtime.getURL('img/logo.png'),
                title: 'AutoFill Extension',
                message: 'Cannot run AutoFill on this page type.'
            });
            return;
        }
        
        // Try executing the content script
        chrome.scripting.executeScript({
            target: {tabId: tab.id},
            function: triggerManualAutofill,
            args: []
        }).catch(error => {
            console.error("Error executing manual autofill:", error);
            chrome.notifications.create({
                type: 'basic',
                iconUrl: chrome.runtime.getURL('img/logo.png'),
                title: 'AutoFill Error',
                message: 'Could not run AutoFill on this page. Please check the extension permissions.'
            });
        });
    }
});

// Function to trigger manual autofill
function triggerManualAutofill() {
    console.log("Manual autofill triggered");
    
    if (!window.autofill_manager) {
        // Create the manager if it doesn't exist
        window.autofill_manager = new ExeManager(document.URL);
    }
    
    // Run the autofill process
    window.autofill_manager.change();
    
    // Notify success
    console.log("Autofill process initiated");
}

chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
    console.log("Message received:", request);
    if (request.message === "open edit page") {
        chrome.tabs.create({url: chrome.runtime.getURL('index.html')});
    } else if (request.message === "open debug page") {
        chrome.tabs.create({url: chrome.runtime.getURL('debug.html')});
    }
});

// Update badge when tabs change
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
    if (changeInfo.status === 'complete' && tab.url) {
        updateBadge(tab);
    }
});

chrome.tabs.onActivated.addListener((activeInfo) => {
    chrome.tabs.get(activeInfo.tabId, (tab) => {
        updateBadge(tab);
    });
});

// Function to update badge based on URL restrictions
function updateBadge(tab) {
    const url = tab.url || '';
    const restrictedProtocols = ['chrome:', 'edge:', 'about:', 'file:', 'chrome-extension:', 'devtools:'];
    const isRestricted = restrictedProtocols.some(protocol => url.startsWith(protocol));
    
    if (isRestricted) {
        // Set a badge for restricted sites
        chrome.action.setBadgeText({ text: "X", tabId: tab.id });
        chrome.action.setBadgeBackgroundColor({ color: "#CC0000", tabId: tab.id });
        chrome.action.setTitle({ title: "AutoFill doesn't work on this page", tabId: tab.id });
    } else {
        // Clear badge for normal sites
        chrome.action.setBadgeText({ text: "", tabId: tab.id });
        chrome.action.setTitle({ title: "Click to AutoFill this page", tabId: tab.id });
    }
}