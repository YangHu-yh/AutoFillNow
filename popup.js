console.log('This is a popup!');

document.addEventListener('DOMContentLoaded', function() {
    // Load available profiles
    loadProfiles();
    
    // Set up event listeners
    document.getElementById('auto_fill_btn').addEventListener('click', function() {
        handleAutofill();
    });
    
    document.getElementById('auto_fill_edit_btn').addEventListener('click', function() {
        openProfileEditor();
    });
});

// Load the available profiles
function loadProfiles() {
    chrome.storage.local.get(['profilesList', 'lastSelectedProfile'], function(result) {
        const profileSelector = document.getElementById('profileSelectorPopup');
        profileSelector.innerHTML = ''; // Clear existing options
        
        const profiles = result.profilesList || ['default'];
        const lastSelected = result.lastSelectedProfile || 'default';
        
        profiles.forEach(profile => {
            const option = document.createElement('option');
            option.value = profile;
            option.textContent = profile;
            option.selected = profile === lastSelected;
            profileSelector.appendChild(option);
        });
    });
}

// Handle the autofill button click
function handleAutofill() {
    const selectedProfile = document.getElementById('profileSelectorPopup').value;
    
    // Save the selected profile
    chrome.storage.local.set({lastSelectedProfile: selectedProfile}, function() {
        console.log(`Profile set to: ${selectedProfile}`);
        
        // Send message to content script to trigger autofill
        chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
            if (tabs && tabs[0]) {
                chrome.tabs.sendMessage(tabs[0].id, {
                    action: 'autofill',
                    profile: selectedProfile
                });
            }
        });
        
        // Close the popup
        window.close();
    });
}

// Open the profile editor
function openProfileEditor() {
    chrome.runtime.sendMessage({message: 'open edit page'});
    window.close();
}