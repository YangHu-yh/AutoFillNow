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
    
    // Special handling for Greenhouse websites
    const isGreenhouseSite = url.includes('greenhouse.io') || url.includes('job-boards.greenhouse.io');
    console.log("Is Greenhouse site:", isGreenhouseSite);
    
    // First attempt to inject our content script if needed
    chrome.scripting.executeScript({
        target: {tabId: tab.id},
        function: injectContentScript,
        args: [isGreenhouseSite]  // Pass information about Greenhouse sites
    }).then(() => {
        console.log("Content script injection successful");
        
        // Then execute the main function with a longer delay for Greenhouse sites
        setTimeout(() => {
            chrome.scripting.executeScript({
                target: {tabId: tab.id},
                function: main,
                args: [isGreenhouseSite]  // Pass information about Greenhouse sites
            }).then(() => {
                console.log("Main script executed successfully");
            }).catch(error => {
                console.error("Error executing main script:", error);
                // Special handling for Greenhouse sites
                if (isGreenhouseSite) {
                    console.log("Attempting alternative injection for Greenhouse site");
                    chrome.scripting.executeScript({
                        target: {tabId: tab.id},
                        function: greenhouseDirectInjection,
                        args: []
                    }).catch(err => {
                        console.error("Alternative injection also failed:", err);
                        handleFallback(tab);
                    });
                } else {
                    handleFallback(tab);
                }
            });
        }, isGreenhouseSite ? 1000 : 500); // Longer delay for Greenhouse sites
    }).catch(error => {
        console.error("Error injecting content script:", error);
        handleFallback(tab);
    });
});

function injectContentScript(isGreenhouseSite = false) {
    // Check if autofill_manager already exists
    if (!window.autofill_manager) {
        console.log("Autofill manager not found, initializing...");
        
        // Log the current URL for debugging
        console.log("Current page URL:", document.URL);
        
        // Enhanced Greenhouse detection - special handling for job-boards.greenhouse.io
        const isGreenhousePage = 
            document.URL.includes('greenhouse.io') || 
            document.URL.includes('job-boards.greenhouse.io') ||
            document.URL.includes('boards.greenhouse.io') ||
            document.URL.includes('job_app?for=') ||
            document.querySelectorAll('script[src*="greenhouse.io"], link[href*="greenhouse.io"], iframe[src*="greenhouse.io"]').length > 0 ||
            document.querySelectorAll('form[action*="greenhouse.io"], #s3_upload_for_resume, #s3_upload_for_cover_letter').length > 0 ||
            document.querySelectorAll('button[aria-label="Apply"], button.btn--pill').length > 0 ||
            (document.body && document.body.textContent && document.body.textContent.includes('Powered by Greenhouse'));
        
        if (isGreenhousePage || isGreenhouseSite) {
            console.log("Greenhouse job application page detected!");
            
            // For Greenhouse pages, we need to wait for the form to fully load
            setTimeout(() => {
                try {
                    // Create the manager with the current URL
                    window.autofill_manager = new ExeManager(document.URL);
                    window.autofill_manager.create_popup();
                    console.log("Autofill manager initialized for Greenhouse page with delay");
                    
                    // Special handling for job-boards.greenhouse.io
                    if (document.URL.includes('job-boards.greenhouse.io')) {
                        console.log("Special handling for job-boards.greenhouse.io domain");
                        // Additional delay for job-boards.greenhouse.io to ensure everything is loaded
                        setTimeout(() => {
                            if (window.autofill_manager && window.autofill_manager.popup) {
                                window.autofill_manager.popup.show_popup();
                                console.log("Popup shown for job-boards.greenhouse.io");
                            } else {
                                console.error("Failed to show popup for job-boards.greenhouse.io");
                            }
                        }, 1500);
                    }
                } catch (err) {
                    console.error("Error initializing Greenhouse page:", err);
                }
            }, 2000); // Increased delay for Greenhouse pages
            return;
        }
        
        // Create the manager with the current URL (for non-Greenhouse pages)
        try {
            window.autofill_manager = new ExeManager(document.URL);
            window.autofill_manager.create_popup();
        } catch (err) {
            console.error("Error initializing autofill manager:", err);
        }
    } else {
        console.log("Autofill manager already exists");
    }
}

function main(isGreenhouseSite = false) {
    console.log("Main function triggered");
    if (window.autofill_manager) {
        console.log("Autofill manager found");
        
        // Enhanced Greenhouse detection - special handling for job-boards.greenhouse.io
        const isGreenhousePage = 
            document.URL.includes('greenhouse.io') || 
            document.URL.includes('job-boards.greenhouse.io') ||
            document.URL.includes('boards.greenhouse.io') ||
            document.URL.includes('job_app?for=') ||
            document.querySelectorAll('script[src*="greenhouse.io"], link[href*="greenhouse.io"], iframe[src*="greenhouse.io"]').length > 0 ||
            document.querySelectorAll('form[action*="greenhouse.io"], #s3_upload_for_resume, #s3_upload_for_cover_letter').length > 0 ||
            document.querySelectorAll('button[aria-label="Apply"], button.btn--pill').length > 0 ||
            (document.body && document.body.textContent && document.body.textContent.includes('Powered by Greenhouse'));
        
        // For Greenhouse pages, we might need to wait longer for the form to load
        if (isGreenhousePage || isGreenhouseSite) {
            console.log("Greenhouse job application detected, using extended wait time");
            
            // Special handling for job-boards.greenhouse.io
            const isJobBoardsPage = document.URL.includes('job-boards.greenhouse.io');
            if (isJobBoardsPage) {
                console.log("Special handling for job-boards.greenhouse.io domain");
            }
            
            setTimeout(() => {
                try {
                    if (!window.autofill_manager.popup) {
                        console.log("Creating popup for Greenhouse page");
                        window.autofill_manager.create_popup();
                    }
                    window.autofill_manager.popup.show_popup();
                    console.log("Popup shown for Greenhouse page");
                } catch (err) {
                    console.error("Error showing popup for Greenhouse page:", err);
                }
            }, isJobBoardsPage ? 3000 : 2000); // Even longer delay for job-boards.greenhouse.io
            return;
        }
        
        // Ensure popup is recreated if it doesn't exist
        if (!window.autofill_manager.popup) {
            console.log("Popup not found, creating it");
            window.autofill_manager.create_popup();
            setTimeout(() => {
                try {
                    if (window.autofill_manager.popup) {
                        window.autofill_manager.popup.show_popup();
                    } else {
                        console.error("Failed to create popup");
                        alert("Could not create the AutoFill popup. Please try refreshing the page.");
                    }
                } catch (err) {
                    console.error("Error showing popup:", err);
                }
            }, 500);
        } else {
            console.log("Popup found, showing it");
            try {
                window.autofill_manager.popup.show_popup();
            } catch (err) {
                console.error("Error showing existing popup:", err);
            }
        }
    } else {
        console.error("Autofill manager not found");
        alert("AutoFill not initialized properly. Please reload the page and try again.");
    }
}

// Direct injection for Greenhouse sites when other methods fail
function greenhouseDirectInjection() {
    console.log("Attempting direct injection for Greenhouse site");
    
    try {
        // Create a simple popup directly
        const popupDiv = document.createElement('div');
        popupDiv.id = 'autofill_direct_popup';
        popupDiv.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: white;
            border: 1px solid #ccc;
            padding: 15px;
            border-radius: 5px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.2);
            z-index: 10000000;
            font-family: Arial, sans-serif;
        `;
        
        popupDiv.innerHTML = `
            <h3 style="margin-top: 0; margin-bottom: 15px;">AutoFill</h3>
            <div style="margin-bottom: 15px;">
                <label for="autofill_direct_profile">Profile:</label>
                <select id="autofill_direct_profile" style="margin-left: 10px; padding: 5px; width: 150px;"></select>
            </div>
            <button id="autofill_direct_btn" style="padding: 8px 15px; background-color: #4285F4; color: white; border: none; border-radius: 4px; cursor: pointer; margin-right: 10px;">Auto Fill</button>
            <button id="autofill_direct_close" style="padding: 8px 15px; background-color: #f1f1f1; border: 1px solid #ccc; border-radius: 4px; cursor: pointer;">Close</button>
        `;
        
        document.body.appendChild(popupDiv);
        
        // Load profiles into dropdown
        const profileSelector = document.getElementById('autofill_direct_profile');
        
        // Get profiles from storage
        chrome.storage.local.get(["profilesList", "lastSelectedProfile"], function(result) {
            let profilesList = result.profilesList || ["default"];
            let lastSelected = result.lastSelectedProfile || "default";
            
            // Add options for each profile
            profilesList.forEach(function(profile) {
                let option = document.createElement("option");
                option.value = profile;
                option.text = profile;
                profileSelector.appendChild(option);
            });
            
            // Set current selected profile
            if (lastSelected && profilesList.includes(lastSelected)) {
                profileSelector.value = lastSelected;
            } else if (profilesList.length > 0) {
                profileSelector.value = profilesList[0];
            }
        });
        
        // Add event listeners
        document.getElementById('autofill_direct_btn').addEventListener('click', function() {
            console.log("Direct autofill button clicked");
            
            // Save the selected profile
            const selectedProfile = profileSelector.value;
            chrome.storage.local.set({lastSelectedProfile: selectedProfile}, () => {
                console.log("Selected profile saved:", selectedProfile);
            });
            
            // Try to detect if this is a Greenhouse page and handle accordingly
            if (document.URL.includes('greenhouse.io') || document.URL.includes('job-boards.greenhouse.io')) {
                console.log("Greenhouse page detected, looking for Apply button");
                
                // Look for Apply button with comprehensive selectors
                const applySelectors = [
                    'button[aria-label="Apply"]', 
                    '.btn[aria-label="Apply"]', 
                    'button.btn--pill', 
                    'button[type="button"][aria-label="Apply"]',
                    'a.postings-btn', 
                    'a.button[href*="application"]',
                    'a.button--primary',
                    'a[href*="application"]',
                    'button.btn-apply',
                    'button.apply-button',
                    'button[data-qa="btn-apply"]',
                    'button:contains("Apply")',
                    'a:contains("Apply")'
                ].join(', ');
                
                const applyButton = document.querySelector(applySelectors);
                if (applyButton) {
                    console.log("Apply button found, clicking it");
                    applyButton.click();
                    
                    // Wait for form to appear with progressive delays
                    setTimeout(() => {
                        fillGreenhouseForm(selectedProfile);
                    }, 2000);
                    
                    // Try again with a longer delay if needed
                    setTimeout(() => {
                        if (!document.querySelector('input#first_name, input[name="first_name"]')) {
                            console.log("Form not found after first attempt, trying again");
                            fillGreenhouseForm(selectedProfile);
                        }
                    }, 4000);
                } else {
                    console.log("No Apply button found, trying to fill form directly");
                    fillGreenhouseForm(selectedProfile);
                }
            }
            
            // Hide the popup
            popupDiv.style.display = 'none';
        });
        
        document.getElementById('autofill_direct_close').addEventListener('click', function() {
            popupDiv.style.display = 'none';
        });
        
        console.log("Direct injection popup created");
    } catch (err) {
        console.error("Error in direct injection:", err);
        // Fallback notification
        try {
            const notificationDiv = document.createElement('div');
            notificationDiv.style.cssText = `
                position: fixed;
                top: 20px;
                right: 20px;
                background: #f8d7da;
                color: #721c24;
                padding: 10px;
                border-radius: 5px;
                z-index: 10000000;
                font-family: Arial, sans-serif;
            `;
            notificationDiv.textContent = "AutoFill encountered an error. Please try refreshing the page.";
            document.body.appendChild(notificationDiv);
            
            setTimeout(() => {
                notificationDiv.style.display = 'none';
            }, 5000);
        } catch (e) {
            console.error("Even fallback notification failed:", e);
        }
    }
}

// Helper function to fill Greenhouse forms directly
function fillGreenhouseForm(selectedProfile) {
    console.log("Attempting to fill Greenhouse form directly");
    
    try {
        // Get user data from storage
        chrome.storage.local.get(["profilesList", "lastSelectedProfile"], function(result) {
            let profilesList = result.profilesList || ["default"];
            let lastSelected = result.lastSelectedProfile || "default";
            
            if (selectedProfile && profilesList.includes(selectedProfile)) {
                lastSelected = selectedProfile;
            }
            
            // Now get data for the current profile
            let userDataKey = "userdata_" + lastSelected;
            
            chrome.storage.local.get([userDataKey, "userdata"], function(result) {
                let userData = result[userDataKey] || (lastSelected === "default" ? result.userdata : null);
                
                if (!userData) {
                    console.error("No user data found");
                    return;
                }
                
                // Parse the userData if it's a string
                if (typeof userData === 'string') {
                    try {
                        userData = JSON.parse(userData);
                    } catch (e) {
                        console.error("Failed to parse userData:", e);
                        return;
                    }
                }
                
                // Fill form fields
                const firstNameField = document.querySelector('input#first_name, input[name="first_name"]');
                if (firstNameField && userData["first name"]) {
                    firstNameField.value = userData["first name"];
                    firstNameField.dispatchEvent(new Event("input", { bubbles: true }));
                    firstNameField.dispatchEvent(new Event("change", { bubbles: true }));
                }
                
                const lastNameField = document.querySelector('input#last_name, input[name="last_name"]');
                if (lastNameField && userData["last name"]) {
                    lastNameField.value = userData["last name"];
                    lastNameField.dispatchEvent(new Event("input", { bubbles: true }));
                    lastNameField.dispatchEvent(new Event("change", { bubbles: true }));
                }
                
                const emailField = document.querySelector('input#email, input[name="email"], input[type="email"]');
                if (emailField && userData["email"]) {
                    emailField.value = userData["email"];
                    emailField.dispatchEvent(new Event("input", { bubbles: true }));
                    emailField.dispatchEvent(new Event("change", { bubbles: true }));
                }
                
                const phoneField = document.querySelector('input#phone, input[name="phone"]');
                if (phoneField && userData["phone"]) {
                    phoneField.value = userData["phone"];
                    phoneField.dispatchEvent(new Event("input", { bubbles: true }));
                    phoneField.dispatchEvent(new Event("change", { bubbles: true }));
                }
                
                console.log("Form fields filled directly");
            });
        });
    } catch (err) {
        console.error("Error filling Greenhouse form directly:", err);
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