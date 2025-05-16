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
            
            // Check if this might be a Greenhouse page
            this.isGreenhousePage = this.checkIfGreenhousePage();
            if (this.isGreenhousePage) {
                this.log("Greenhouse job application page detected in ExeManager");
            }
            
            this.log("ExeManager initialized with URL:", currentUrl);
        } catch (error) {
            this.logError("constructor", error);
        }
    }
    
    // Helper method to check if the current page is a Greenhouse job application
    checkIfGreenhousePage() {
        try {
            // Special handling for job-boards.greenhouse.io domain
            if (this.currentUrl.includes('job-boards.greenhouse.io')) {
                console.log("Direct match for job-boards.greenhouse.io domain");
                return true;
            }
            
            // Check URL patterns first
            if (this.currentUrl.includes('greenhouse.io') || 
                this.currentUrl.includes('boards.greenhouse.io') ||
                this.currentUrl.includes('job_app?for=')) {
                console.log("Greenhouse detected via URL pattern:", this.currentUrl);
                return true;
            }
            
            // Check for Greenhouse elements in the DOM
            if (typeof document !== 'undefined') {
                // Check for Apply button (common in job-boards.greenhouse.io)
                const applyButton = document.querySelector('button[aria-label="Apply"], button.btn--pill');
                if (applyButton) {
                    console.log("Greenhouse detected via Apply button");
                    return true;
                }
                
                // Check for Greenhouse scripts and links
                const greenhouseElements = document.querySelectorAll(
                    'script[src*="greenhouse.io"], link[href*="greenhouse.io"], iframe[src*="greenhouse.io"]'
                );
                if (greenhouseElements.length > 0) {
                    console.log("Greenhouse detected via page elements");
                    return true;
                }
                
                // Check for Greenhouse forms and buttons
                const greenhouseForms = document.querySelectorAll(
                    'form[action*="greenhouse.io"], #s3_upload_for_resume, #s3_upload_for_cover_letter, ' +
                    'button[aria-label="Apply"], .gh-button'
                );
                if (greenhouseForms.length > 0) {
                    console.log("Greenhouse detected via form elements");
                    return true;
                }
                
                // Check for Greenhouse content in the page
                const pageContent = document.body ? document.body.textContent : '';
                if (pageContent && (
                    pageContent.includes('Powered by Greenhouse') || 
                    document.querySelector('footer svg[aria-label="Greenhouse logo"]')
                )) {
                    console.log("Greenhouse detected via page content");
                    return true;
                }
            }
            
            return false;
        } catch (error) {
            console.error("Error checking for Greenhouse page:", error);
            return false;
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
                
                // If we already detected a Greenhouse page, set the job portal type directly
                if (this.isGreenhousePage) {
                    this.log("Using pre-detected Greenhouse job portal type");
                    this.companyData = {
                        job_portal_type: 'greenhouse',
                        company_name: this.extractCompanyNameFromUrl(),
                        currentUrl: this.currentUrl
                    };
                    return this.change(); // Continue with the next step
                }
                
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
                } else if (this.isGreenhousePage) {
                    portalType = 'greenhouse';
                    this.log("Using pre-detected Greenhouse job portal type");
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
    
    // Helper method to extract company name from URL for Greenhouse pages
    extractCompanyNameFromUrl() {
        try {
            if (this.currentUrl.includes('boards.greenhouse.io/')) {
                // Format: boards.greenhouse.io/companyname
                return this.currentUrl.split('boards.greenhouse.io/')[1].split('/')[0];
            }
            
            if (this.currentUrl.includes('job_app?for=')) {
                // Format: job_app?for=companyname
                return this.currentUrl.split('job_app?for=')[1].split('&')[0];
            }
            
            // Default to hostname if we can't extract company name
            const urlObj = new URL(this.currentUrl);
            return urlObj.hostname;
        } catch (e) {
            return 'unknown';
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