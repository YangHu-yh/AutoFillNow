class ExeManager {
    constructor(currentUrl) {
        try {
            this.currentUrl = currentUrl;
            this.isCompanyDataAvailable = false;
            this.isUserDataAvailable = false;
            this.companyData = null;
            this.userData = null;
            this.auto_fill = null;
            this.popup = null;
            this.errors = [];
            this.debugMode = true; // Set to true to enable detailed logging
            
            this.log("ExeManager initialized with URL:", currentUrl);
        } catch (error) {
            this.logError("constructor", error);
        }
    }
    
    log(...args) {
        if (this.debugMode) {
            console.log(...args);
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
        console.error(`ExeManager Error in ${method}:`, error);
    }

    change() {
        try {
            if (!this.isCompanyDataAvailable && this.companyData === null){
                this.log("Loading company data");
                this.isCompanyDataAvailable = true;
                this.companyData = new CompanyData(this.currentUrl, this);
                return;
            }
            if (!this.isUserDataAvailable && this.userData === null){
                this.log("Loading user data");
                this.isUserDataAvailable = true;
                this.userData = new UserData(this);
                return;
            }
            if (this.isUserDataAvailable && this.userData !== null) {
                // If userData is still loading, wait for it
                if (this.userData.loading) {
                    this.log("User data is still loading, waiting...");
                    setTimeout(() => this.change(), 500);
                    return;
                }
                
                this.log("Creating AutoFill object");
                
                // Get job portal type if available
                let portalType = null;
                if (this.isCompanyDataAvailable && this.companyData !== null && this.companyData.job_portal_type) {
                    portalType = this.companyData.job_portal_type;
                    this.log("Using detected job portal type:", portalType);
                } else {
                    this.log("No specific job portal detected, using generic autofill");
                }
                
                if (this.userData.resume_json === null) {
                    console.error("resume_json is null, please make sure your profile is set up correctly");
                    alert("Your profile data is missing. Please set up your profile in the extension.");
                    return;
                }
                
                // Debug: print the user data that will be used
                this.debugUserData();
                
                this.auto_fill = new AutoFill(
                    this.userData.resume_json, 
                    this.userData.resume_file, 
                    this.userData.cover_letter,
                    portalType,
                    this
                );
                
                this.log("Starting autofill task");
                this.auto_fill.resume_task();
            }
            else {
                console.error("Could not start autofill due to missing data");
                if (!this.isUserDataAvailable || this.userData === null) {
                    console.error("User data not available");
                }
                
                if (this.errors.length > 0) {
                    console.error(`${this.errors.length} errors encountered during the autofill process`);
                }
            } 
        } catch (error) {
            this.logError("change", error);
            console.error("Error in ExeManager.change():", error);
        }
    }
    
    debugUserData() {
        if (!this.userData || !this.userData.resume_json) {
            console.error("No user data available for debugging");
            return;
        }
        
        const userData = this.userData.resume_json;
        console.log("User data that will be used for autofill:");
        
        // Print selected fields for debugging
        const keysToDebug = [
            "first name", "last name", "email", "phone", "address", 
            "city", "state", "zip", "linkedin", "github", "website"
        ];
        
        const debugData = {};
        keysToDebug.forEach(key => {
            if (key in userData) {
                debugData[key] = userData[key];
            } else {
                debugData[key] = "MISSING";
            }
        });
        
        console.log("Basic user data:", debugData);
        console.log("Has educations:", Array.isArray(userData.educations), 
            userData.educations ? `(${userData.educations.length} items)` : "");
        console.log("Has experiences:", Array.isArray(userData.experiences), 
            userData.experiences ? `(${userData.experiences.length} items)` : "");
    }

    create_popup() {
        this.log("Creating popup");
        try {
            this.popup = new Popup(this);
        } catch (error) {
            this.logError("create_popup", error);
            console.error("Error creating popup:", error);
        }
    }

    remove_popup() {
        this.popup = null;
    }
}

// Create the global manager instance
try {
    var autofill_manager = new ExeManager(document.URL);
    autofill_manager.create_popup();
    console.log("AutoFill manager initialized successfully");
} catch (error) {
    console.error("Failed to initialize AutoFill manager:", error);
}