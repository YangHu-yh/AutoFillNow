class Popup {
    constructor(manager=null) {
        this.auto_fill_btn = null;
        this.auto_fill_edit_btn = null;
        this.profileSelectorPopup = null;
        this.currentProfile = "default";
        this.profilesList = [];
        this.popup = this.create_popup();
        this.hide_popup();
        this.manager = manager;
    }

    create_popup() {
        let popup = document.createElement("div");
        popup.id = "popup_toast";
        popup.style = "top: 18px; right: 18px; position: fixed; z-index: 10000000000000; padding-right: 0rem !important; padding-left: 0rem !important; width: 32rem;";
        popup.classList.add("autofill_toast", "autofill_d-none");
        popup.setAttribute("data-autohide", "false");
        document.body.appendChild(popup);

        fetch(chrome.runtime.getURL('popup.html')).then(response => response.text()).then(data => {
            popup.innerHTML = data;
            this.auto_fill_btn = document.getElementById("auto_fill_btn");
            this.auto_fill_edit_btn = document.getElementById("auto_fill_edit_btn");
            this.profileSelectorPopup = document.getElementById("profileSelectorPopup");
            this.loadProfilesList();
            this.add_event_listeners();
        });
        return popup;
    }

    add_event_listeners() {
        let self = this;
        this.auto_fill_btn.addEventListener("click", this.autoFillButtonClicked.bind(this), false);
        this.auto_fill_edit_btn.addEventListener("click", this.autoFillEditButtonButtonClicked.bind(this), false);
        this.profileSelectorPopup.addEventListener("change", this.profileChanged.bind(this), false);
    }

    show_popup() {
        this.popup.classList.remove("autofill_d-none");
        $('#popup_toast').toast('show');
        // Refresh the profile list when showing popup
        this.loadProfilesList();
    }

    hide_popup() {
        $('#popup_toast').toast('hide');
    }

    autoFillButtonClicked(event) {
        event.preventDefault();
        // Save the selected profile as last selected
        let selectedProfile = this.profileSelectorPopup.value;
        chrome.storage.local.set({lastSelectedProfile: selectedProfile}, function() {
            // Then initiate autofill
            this.manager.change();
            this.hide_popup();
        }.bind(this));
    }

    autoFillEditButtonButtonClicked(event) {
        event.preventDefault();
        // Save the selected profile before opening edit page
        let selectedProfile = this.profileSelectorPopup.value;
        chrome.storage.local.set({lastSelectedProfile: selectedProfile}, function() {
            chrome.runtime.sendMessage({message: "open edit page"});
        });
    }

    profileChanged(event) {
        let selectedProfile = event.target.value;
        if (selectedProfile) {
            this.currentProfile = selectedProfile;
        }
    }

    loadProfilesList() {
        let self = this;
        chrome.storage.local.get(["profilesList", "lastSelectedProfile"], function(result) {
            if (result.profilesList) {
                self.profilesList = result.profilesList;
            } else {
                // Initialize with default profile if none exists
                self.profilesList = ["default"];
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