class UserData{
    constructor(exeManager){
        this.resume_json = null;
        this.resume_file = null;
        this.cover_letter = null;
        this.exeManager = exeManager;
        this.currentProfile = "default";
        this.get_user_data();
    }
    
    async get_user_data(){
        var tempSelf = this;
        
        // First get the last selected profile
        return chrome.storage.local.get(["lastSelectedProfile", "profilesList"], function(profileResult) {
            // Set current profile (use default if nothing is saved)
            if (profileResult.lastSelectedProfile && 
                profileResult.profilesList && 
                profileResult.profilesList.includes(profileResult.lastSelectedProfile)) {
                tempSelf.currentProfile = profileResult.lastSelectedProfile;
            }
            
            // Now get data for the current profile
            let resumeKey = "resume_" + tempSelf.currentProfile;
            let coverletterKey = "coverletter_" + tempSelf.currentProfile;
            let userDataKey = "userdata_" + tempSelf.currentProfile;
            
            chrome.storage.local.get([userDataKey, resumeKey, coverletterKey, "userdata", "resume", "coverletter"], function (result) {
                // Try to get profile-specific data first, fall back to legacy keys for default profile
                var userData = result[userDataKey] || (tempSelf.currentProfile === "default" ? result.userdata : null);
                var resume = result[resumeKey] || (tempSelf.currentProfile === "default" ? result.resume : null);
                var coverletter = result[coverletterKey] || (tempSelf.currentProfile === "default" ? result.coverletter : null);
                
                var BASE64_MARKER = ';base64,';
                if (userData) {
                    tempSelf.resume_json = userData;
                    console.log("Loaded profile: " + tempSelf.currentProfile);
                }
                if (resume) {
                    var base64Index = resume["text"].indexOf(BASE64_MARKER) + BASE64_MARKER.length;
                    var base64 = resume["text"].substring(base64Index);
                    var binary_string = window.atob(base64);
                    var bytes = new Uint8Array(binary_string.length);
                    for (var i = 0; i < binary_string.length; i++) {
                        bytes[i] = binary_string.charCodeAt(i);
                    }
                    var dataTransfer = new DataTransfer();
                    dataTransfer.items.add(new File([new Blob([bytes], {type: "application/pdf"})], resume["name"], {type: "application/pdf", lastModified: resume["lastModified"], lastModifiedDate: resume["lastModifiedDate"]}));
                    tempSelf.resume_file = dataTransfer;
                }
                if (coverletter) {
                    var base64Index = coverletter["text"].indexOf(BASE64_MARKER) + BASE64_MARKER.length;
                    var base64 = coverletter["text"].substring(base64Index);
                    var binary_string = window.atob(base64);
                    var bytes = new Uint8Array(binary_string.length);
                    for (var i = 0; i < binary_string.length; i++) {
                        bytes[i] = binary_string.charCodeAt(i);
                    }
                    var dataTransfer = new DataTransfer();
                    dataTransfer.items.add(new File([new Blob([bytes], {type: "application/pdf"})], coverletter["name"], {type: "application/pdf", lastModified: coverletter["lastModified"], lastModifiedDate: coverletter["lastModifiedDate"]}));
                    tempSelf.cover_letter = dataTransfer;
                }
                tempSelf.exeManager.change();
            });
        });
    }

    printUserData(){
        console.log(`User data: ${this.resume_json} (Profile: ${this.currentProfile})`);
    }
}