class Popup {
    constructor(manager=null) {
        this.auto_fill_btn = null;
        this.auto_fill_edit_btn = null;
        this.profileSelectorPopup = null;
        this.currentProfile = "default";
        this.profilesList = [];
        console.log("Creating popup UI");
        this.popup = this.create_popup();
        this.hide_popup();
        this.manager = manager;
    }

    create_popup() {
        let popup = document.createElement("div");
        popup.id = "popup_toast";
        popup.style = "top: 18px; right: 18px; position: fixed; z-index: 10000000000000; padding-right: 0rem !important; padding-left: 0rem !important; width: 32rem; border: 1px solid #ccc; background-color: white; box-shadow: 0 2px 10px rgba(0,0,0,0.2);";
        popup.classList.add("autofill_toast", "autofill_d-none");
        popup.setAttribute("data-autohide", "false");
        document.body.appendChild(popup);
        console.log("Popup element created and appended to body");

        fetch(chrome.runtime.getURL('popup.html'))
            .then(response => response.text())
            .then(data => {
                popup.innerHTML = data;
                this.auto_fill_btn = document.getElementById("auto_fill_btn");
                this.auto_fill_edit_btn = document.getElementById("auto_fill_edit_btn");
                this.profileSelectorPopup = document.getElementById("profileSelectorPopup");
                
                if (!this.auto_fill_btn || !this.auto_fill_edit_btn || !this.profileSelectorPopup) {
                    console.error("Failed to find popup elements:", {
                        auto_fill_btn: !!this.auto_fill_btn,
                        auto_fill_edit_btn: !!this.auto_fill_edit_btn,
                        profileSelectorPopup: !!this.profileSelectorPopup
                    });
                    
                    // Add fallback content if needed
                    if (!popup.innerText.trim()) {
                        this.addFallbackPopupContent(popup);
                    }
                } else {
                    console.log("Popup elements found, loading profiles");
                    this.loadProfilesList();
                    this.add_event_listeners();
                }
            })
            .catch(error => {
                console.error("Error loading popup.html:", error);
                this.addFallbackPopupContent(popup);
            });
        
        return popup;
    }
    
    addFallbackPopupContent(popup) {
        console.log("Adding fallback popup content");
        popup.innerHTML = `
            <div style="padding: 20px; font-family: Arial, sans-serif;">
                <h3 style="margin-top: 0;">AutoFill</h3>
                <div style="margin-bottom: 15px;">
                    <label for="profileSelectorPopup">Profile:</label>
                    <select id="profileSelectorPopup" style="margin-left: 10px; padding: 5px; width: 150px;"></select>
                </div>
                <div style="display: flex; justify-content: space-between;">
                    <button id="auto_fill_btn" style="padding: 8px 15px; background-color: #4285F4; color: white; border: none; border-radius: 4px; cursor: pointer;">Auto Fill</button>
                    <button id="auto_fill_edit_btn" style="padding: 8px 15px; background-color: #f1f1f1; border: 1px solid #ccc; border-radius: 4px; cursor: pointer;">Edit Profile</button>
                </div>
            </div>
        `;
        
        this.auto_fill_btn = document.getElementById("auto_fill_btn");
        this.auto_fill_edit_btn = document.getElementById("auto_fill_edit_btn");
        this.profileSelectorPopup = document.getElementById("profileSelectorPopup");
        
        if (this.auto_fill_btn && this.auto_fill_edit_btn && this.profileSelectorPopup) {
            this.loadProfilesList();
            this.add_event_listeners();
        }
    }

    add_event_listeners() {
        console.log("Adding event listeners to popup buttons");
        if (this.auto_fill_btn) {
            this.auto_fill_btn.addEventListener("click", this.autoFillButtonClicked.bind(this), false);
        }
        if (this.auto_fill_edit_btn) {
            this.auto_fill_edit_btn.addEventListener("click", this.autoFillEditButtonButtonClicked.bind(this), false);
        }
        if (this.profileSelectorPopup) {
            this.profileSelectorPopup.addEventListener("change", this.profileChanged.bind(this), false);
        }
    }

    show_popup() {
        console.log("Showing popup");
        if (!this.popup) {
            console.error("Popup element not found");
            return;
        }
        
        // Force popup to be visible by removing all hiding classes
        this.popup.classList.remove("autofill_d-none");
        this.popup.style.display = "block";
        
        try {
            $('#popup_toast').toast('show');
        } catch (error) {
            console.error("Error showing toast:", error);
        }
        
        // Refresh the profile list when showing popup
        this.loadProfilesList();
    }

    hide_popup() {
        if (!this.popup) return;
        
        try {
            $('#popup_toast').toast('hide');
        } catch (error) {
            console.error("Error hiding toast:", error);
            // Fallback method
            this.popup.style.display = "none";
            this.popup.classList.add("autofill_d-none");
        }
    }

    autoFillButtonClicked(event) {
        event.preventDefault();
        console.log("Autofill button clicked");
        
        if (!this.profileSelectorPopup || !this.manager) {
            console.error("Missing required elements for autofill");
            return;
        }
        
        // Save the selected profile as last selected
        let selectedProfile = this.profileSelectorPopup.value;
        chrome.storage.local.set({lastSelectedProfile: selectedProfile}, () => {
            // Then initiate autofill
            console.log("Profile saved, starting autofill");
            this.hide_popup();
            this.manager.change();
        });
    }

    autoFillEditButtonButtonClicked(event) {
        event.preventDefault();
        console.log("Edit button clicked");
        
        if (!this.profileSelectorPopup) {
            console.error("Profile selector not found");
            chrome.runtime.sendMessage({message: "open edit page"});
            return;
        }
        
        // Save the selected profile before opening edit page
        let selectedProfile = this.profileSelectorPopup.value;
        chrome.storage.local.set({lastSelectedProfile: selectedProfile}, () => {
            chrome.runtime.sendMessage({message: "open edit page"});
        });
    }

    profileChanged(event) {
        let selectedProfile = event.target.value;
        if (selectedProfile) {
            console.log("Profile changed to:", selectedProfile);
            this.currentProfile = selectedProfile;
        }
    }

    loadProfilesList() {
        let self = this;
        console.log("Loading profiles list");
        
        if (!this.profileSelectorPopup) {
            console.error("Profile selector not found when loading profiles");
            return;
        }
        
        chrome.storage.local.get(["profilesList", "lastSelectedProfile"], function(result) {
            if (result.profilesList && Array.isArray(result.profilesList)) {
                self.profilesList = result.profilesList;
                console.log("Profiles loaded:", self.profilesList);
            } else {
                // Initialize with default profile if none exists
                self.profilesList = ["default"];
                console.log("No profiles found, initializing with default");
                chrome.storage.local.set({profilesList: self.profilesList});
            }
            
            // Clear existing options
            while (self.profileSelectorPopup.firstChild) {
                self.profileSelectorPopup.removeChild(self.profileSelectorPopup.firstChild);
            }
            
            // Add options for each profile
            self.profilesList.forEach(function(profile) {
                let option = document.createElement("option");
                option.value = profile;
                option.text = profile;
                self.profileSelectorPopup.appendChild(option);
            });
            
            // Set current selected profile
            if (result.lastSelectedProfile && self.profilesList.includes(result.lastSelectedProfile)) {
                self.currentProfile = result.lastSelectedProfile;
                self.profileSelectorPopup.value = self.currentProfile;
            } else if (self.profilesList.length > 0) {
                self.currentProfile = self.profilesList[0];
                self.profileSelectorPopup.value = self.currentProfile;
            }
        });
    }
}