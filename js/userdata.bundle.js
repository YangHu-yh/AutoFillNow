class UserData{
    constructor(exeManager){
        try {
            this.resume_json = null;
            this.resume_file = null;
            this.cover_letter = null;
            this.exeManager = exeManager;
            this.currentProfile = "default";
            this.loading = true;
            this.errors = [];
            this.loadingAttempts = 0;
            this.loadedData = {
                userDataKey: null,
                resumeKey: null,
                coverletterKey: null
            };
            
            console.log("UserData initialization started");
            this.get_user_data();
        } catch (error) {
            this.logError("constructor", error);
            this.loading = false;
            if (this.exeManager) {
                this.exeManager.change();
            }
        }
    }
    
    logError(method, error) {
        const errorInfo = {
            method,
            message: error.message || String(error),
            stack: error.stack,
            timestamp: new Date().toISOString()
        };
        this.errors.push(errorInfo);
        console.error(`UserData Error in ${method}:`, error);
        console.error("Current state:", {
            currentProfile: this.currentProfile,
            loading: this.loading,
            hasResumeJson: !!this.resume_json,
            hasResumeFile: !!this.resume_file,
            hasCoverLetter: !!this.cover_letter,
            loadingAttempts: this.loadingAttempts,
            loadedData: this.loadedData
        });
    }
    
    async get_user_data(){
        var tempSelf = this;
        console.log("Loading user data");
        this.loadingAttempts++;
        
        // First get the last selected profile
        try {
            chrome.storage.local.get(["lastSelectedProfile", "profilesList"], function(profileResult) {
                try {
                    // Set current profile (use default if nothing is saved)
                    if (profileResult.lastSelectedProfile && 
                        profileResult.profilesList && 
                        profileResult.profilesList.includes(profileResult.lastSelectedProfile)) {
                        tempSelf.currentProfile = profileResult.lastSelectedProfile;
                    }
                    
                    console.log(`Loading profile: ${tempSelf.currentProfile}`);
                    
                    // Now get data for the current profile
                    let resumeKey = "resume_" + tempSelf.currentProfile;
                    let coverletterKey = "coverletter_" + tempSelf.currentProfile;
                    let userDataKey = "userdata_" + tempSelf.currentProfile;
                    
                    tempSelf.loadedData = {
                        userDataKey,
                        resumeKey,
                        coverletterKey
                    };
                    
                    chrome.storage.local.get([userDataKey, resumeKey, coverletterKey, "userdata", "resume", "coverletter"], function (result) {
                        try {
                            // Debug the results
                            console.log("Storage data retrieved:", {
                                [userDataKey]: result[userDataKey] ? "exists" : "missing",
                                [resumeKey]: result[resumeKey] ? "exists" : "missing",
                                [coverletterKey]: result[coverletterKey] ? "exists" : "missing",
                                "userdata": result.userdata ? "exists" : "missing", 
                                "resume": result.resume ? "exists" : "missing",
                                "coverletter": result.coverletter ? "exists" : "missing"
                            });
                            
                            // Try to get profile-specific data first, fall back to legacy keys for default profile
                            var userData = result[userDataKey] || (tempSelf.currentProfile === "default" ? result.userdata : null);
                            var resume = result[resumeKey] || (tempSelf.currentProfile === "default" ? result.resume : null);
                            var coverletter = result[coverletterKey] || (tempSelf.currentProfile === "default" ? result.coverletter : null);
                            
                            if (userData) {
                                // Ensure we have a proper object to work with
                                try {
                                    if (typeof userData === 'string') {
                                        userData = JSON.parse(userData);
                                        console.log("Parsed user data from string");
                                    }
                                    
                                    // Validate the user data structure
                                    if (userData && typeof userData === 'object') {
                                        tempSelf.resume_json = userData;
                                        console.log(`User data loaded successfully for profile: ${tempSelf.currentProfile}`);
                                        console.log("User data keys:", Object.keys(userData));
                                        
                                        // Print some sample values to verify data is correct
                                        const sampleData = {};
                                        for (const key in userData) {
                                            if (typeof userData[key] === 'string') {
                                                sampleData[key] = userData[key].substring(0, 30) + (userData[key].length > 30 ? '...' : '');
                                            } else if (Array.isArray(userData[key])) {
                                                sampleData[key] = `Array with ${userData[key].length} items`;
                                            } else if (userData[key] && typeof userData[key] === 'object') {
                                                sampleData[key] = `Object with keys: ${Object.keys(userData[key]).join(', ')}`;
                                            } else {
                                                sampleData[key] = userData[key];
                                            }
                                        }
                                        console.log("Sample user data values:", sampleData);
                                        
                                        // Fill in some default data if not already present
                                        if (!tempSelf.resume_json.educations) {
                                            tempSelf.resume_json.educations = [];
                                            console.log("Added empty educations array");
                                        }
                                        if (!tempSelf.resume_json.experiences) {
                                            tempSelf.resume_json.experiences = [];
                                            console.log("Added empty experiences array");
                                        }
                                        
                                        // Create a fallback object if no resume data
                                        if (Object.keys(tempSelf.resume_json).length === 0) {
                                            console.warn("Empty user data, creating fallback data");
                                            tempSelf.createFallbackResumeData();
                                        }
                                    } else {
                                        console.error("User data is not a valid object:", userData);
                                        tempSelf.createFallbackResumeData();
                                    }
                                } catch (e) {
                                    tempSelf.logError("parse_user_data", e);
                                    tempSelf.createFallbackResumeData();
                                }
                            } else {
                                console.log(`No user data found for profile: ${tempSelf.currentProfile}`);
                                tempSelf.createFallbackResumeData();
                            }
                            
                            var BASE64_MARKER = ';base64,';
                            if (resume) {
                                try {
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
                                    console.log("Resume file loaded successfully");
                                } catch (error) {
                                    tempSelf.logError("load_resume_file", error);
                                }
                            } else {
                                console.log("No resume file found");
                            }
                            
                            if (coverletter) {
                                try {
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
                                    console.log("Cover letter loaded successfully");
                                } catch (error) {
                                    tempSelf.logError("load_cover_letter", error);
                                }
                            } else {
                                console.log("No cover letter found");
                            }
                            
                            // Continue with autofill process
                            tempSelf.loading = false;
                            if (tempSelf.exeManager) {
                                tempSelf.exeManager.change();
                            }
                        } catch (error) {
                            tempSelf.logError("process_storage_data", error);
                            tempSelf.loading = false;
                            
                            // Try to continue anyway
                            tempSelf.createFallbackResumeData();
                            if (tempSelf.exeManager) {
                                tempSelf.exeManager.change();
                            }
                        }
                    });
                } catch (error) {
                    tempSelf.logError("process_profile_result", error);
                    tempSelf.loading = false;
                    tempSelf.createFallbackResumeData();
                    if (tempSelf.exeManager) {
                        tempSelf.exeManager.change();
                    }
                }
            });
        } catch (error) {
            this.logError("get_user_data", error);
            this.createFallbackResumeData();
            this.loading = false;
            if (this.exeManager) {
                this.exeManager.change();
            }
        }
    }
    
    createFallbackResumeData() {
        console.log("Creating fallback resume data");
        // Create a minimal valid resume_json to prevent errors
        this.resume_json = {
            "first name": "",
            "last name": "",
            "email": "",
            "phone": "",
            "address": "",
            "city": "",
            "state": "",
            "zip": "",
            "linkedin": "",
            "github": "",
            "website": "",
            "educations": [],
            "experiences": []
        };
    }

    printUserData(){
        console.log(`User data: ${this.resume_json ? 'loaded' : 'not loaded'} (Profile: ${this.currentProfile})`);
        if (this.resume_json) {
            console.log("User data keys:", Object.keys(this.resume_json));
            
            // Print a few sample values
            if (this.resume_json["first name"]) {
                console.log("First name:", this.resume_json["first name"]);
            }
            if (this.resume_json["email"]) {
                console.log("Email:", this.resume_json["email"]);
            }
        }
        if (this.errors.length > 0) {
            console.log(`Encountered ${this.errors.length} errors while loading user data`);
        }
    }
}