chrome.action.onClicked.addListener((tab) => {
    console.log("Extension icon clicked for tab:", tab.url);
    
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
    
    console.log("Context menu items created");
});

// Handle context menu clicks
chrome.contextMenus.onClicked.addListener((info, tab) => {
    if (info.menuItemId === "openEditor") {
        chrome.tabs.create({url: chrome.runtime.getURL('index.html')});
    } else if (info.menuItemId === "openDebugger") {
        chrome.tabs.create({url: chrome.runtime.getURL('debug.html')});
    }
});

chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
    console.log("Message received:", request);
    if (request.message === "open edit page") {
        chrome.tabs.create({url: chrome.runtime.getURL('index.html')});
    } else if (request.message === "open debug page") {
        chrome.tabs.create({url: chrome.runtime.getURL('debug.html')});
    }
});