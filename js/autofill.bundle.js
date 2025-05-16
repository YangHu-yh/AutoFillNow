class AutoFill {
    constructor(resume_json, resume_file, cover_letter=null, job_portal_type=null, manager=null) {
        try {
            this.resume_json = resume_json;
            this.resume_file = resume_file;
            this.cover_letter = cover_letter;
            this.job_portal_type = job_portal_type;
            this.manager = manager;
            this.forms = null;
            this.form = null;
            this.newLinkedInValues = {};
            this.debugInfo = {
                fieldsAttempted: 0,
                fieldsSuccessfullyFilled: 0,
                matchedFields: []
            };
            
            // Debug the profile data
            if (this.resume_json) {
                console.log("AutoFill initialized with resume data:", 
                    Object.keys(this.resume_json).reduce((obj, key) => {
                        // Show only a sample of the data to avoid huge logs
                        const value = this.resume_json[key];
                        if (typeof value === 'string') {
                            obj[key] = value.substring(0, 20) + (value.length > 20 ? '...' : '');
                        } else {
                            obj[key] = value;
                        }
                        return obj;
                    }, {}));
            } else {
                console.error("No resume data provided to AutoFill");
            }
            
            console.log("AutoFill initialized with job portal type:", job_portal_type);
        } catch (error) {
            console.error("Error initializing AutoFill:", error);
            this.logError(error);
        }
    }
    
    // Helper to log detailed error information
    logError(error, context = "") {
        console.error(`AutoFill Error${context ? ` in ${context}` : ''}:`, error.message || String(error));
        console.error("Stack trace:", error.stack || "No stack trace available");
        
        // Safely stringify the current state
        let stateInfo;
        try {
            stateInfo = {
                hasResumeData: !!this.resume_json,
                hasResumeFile: !!this.resume_file,
                hasCoverLetter: !!this.cover_letter,
                jobPortalType: this.job_portal_type,
                hasManager: !!this.manager,
                hasForm: !!this.form,
                debugInfo: this.debugInfo,
                url: window.location.href
            };
        } catch (e) {
            stateInfo = { stringifyError: e.message };
        }
        
        console.error("Current state:", stateInfo);
        
        // If AutoFillDebug is available, use it
        if (window.AutoFillDebug) {
            const errorObj = error instanceof Error ? error : new Error(String(error));
            window.AutoFillDebug.logError(context || 'AutoFill', errorObj, stateInfo);
        }
    }

    get_forms() {
        try {
            const allForms = document.forms;
            this.forms = allForms;
            if (allForms && allForms.length > 0) {
                this.form = allForms[0];
                console.log(`Found ${allForms.length} form(s) on the page`);
            } else {
                console.log("No forms found on page, searching for input fields directly");
            }
        } catch (error) {
            console.error("Error getting forms:", error);
            this.logError(error, "get_forms");
        }
    }

    fill_text_field(field, label){
        try {
            this.debugInfo.fieldsAttempted++;
            
            // Don't override existing values
            if(field.value && field.value.trim() !== "") {
                console.log(`Skipping field with label "${label}" as it already has value: ${field.value}`);
                return;
            }
            
            if (!this.resume_json) {
                console.error("No resume data available for autofill");
                return;
            }
            
            let filled = false;
            
            // Try matching by label first
            for(var key in this.resume_json){
                if (label.toLowerCase().includes(key.toLowerCase()) || key.toLowerCase().includes(label.toLowerCase())){
                    const value = this.resume_json[key];
                    if (value) {
                        console.log(`Filling field with label "${label}" with value from key "${key}": ${value.substring ? value.substring(0, 20) + '...' : value}`);
                        field.value = value;
                        field.dispatchEvent(new Event("change", { bubbles: true, cancelable: false }));
                        field.dispatchEvent(new Event("input", { bubbles: true, cancelable: false }));
                        filled = true;
                        this.debugInfo.fieldsSuccessfullyFilled++;
                        this.debugInfo.matchedFields.push({ field: label, key, value: String(value).substring(0, 20) + '...' });
                        return;
                    }
                }
            }
            
            // If no direct match, try to infer based on field attributes
            const nameAttr = field.getAttribute('name');
            const idAttr = field.getAttribute('id');
            const placeholderAttr = field.getAttribute('placeholder');
            
            if (nameAttr || idAttr || placeholderAttr) {
                const attrs = [nameAttr, idAttr, placeholderAttr].filter(Boolean);
                for (const attr of attrs) {
                    for (var key in this.resume_json) {
                        const value = this.resume_json[key];
                        if (!value) continue;
                        
                        if (attr.toLowerCase().includes(key.toLowerCase()) || key.toLowerCase().includes(attr.toLowerCase())) {
                            console.log(`Filling field with attribute "${attr}" with value from key "${key}": ${value.substring ? value.substring(0, 20) + '...' : value}`);
                            field.value = value;
                            field.dispatchEvent(new Event("change", { bubbles: true, cancelable: false }));
                            field.dispatchEvent(new Event("input", { bubbles: true, cancelable: false }));
                            filled = true;
                            this.debugInfo.fieldsSuccessfullyFilled++;
                            this.debugInfo.matchedFields.push({ field: attr, key, value: String(value).substring(0, 20) + '...' });
                            return;
                        }
                    }
                }
            }
            
            if (!filled) {
                console.log(`Could not find a matching key for field with label "${label}"`);
            }
        } catch (error) {
            console.error(`Error filling text field with label "${label}":`, error);
            this.logError(error, "fill_text_field");
        }
    }

    fill_select_field(field, label){
        // Don't override existing values for select-one if already selected
        if(field.type == "select-one" && field.value && field.value !== "" && field.value !== "Select an option") {
            console.log(`Skipping select field with label "${label}" as it already has value: ${field.value}`);
            return;
        }
        
        if (!this.resume_json) {
            console.error("No resume data available for autofill");
            return;
        }
        
        for(var key in this.resume_json){
            if (label.toLowerCase().includes(key.toLowerCase()) || key.toLowerCase().includes(label.toLowerCase())){
                if (field.type == "select-one"){
                    console.log(`Trying to fill select field with label "${label}" from key "${key}"`);
                    for(var i = 0; i < field.options.length; i++){
                        if (Array.isArray(this.resume_json[key])){
                            this.resume_json[key].forEach(value => {
                                if(field.options[i].value != ""){
                                    if(field.options[i].text.toLowerCase().includes(value.toLowerCase())){
                                        console.log(`Selected option: ${field.options[i].text}`);
                                        field.options[i].selected = true;
                                        field.dispatchEvent(new Event("change", { bubbles: true, cancelable: false }));
                                        return;
                                    }
                                }
                            });
                        }else{
                            if(field.options[i].value != ""){
                                if(field.options[i].text.toLowerCase().includes(this.resume_json[key].toLowerCase())){
                                    console.log(`Selected option: ${field.options[i].text}`);
                                    field.options[i].selected = true;
                                    field.dispatchEvent(new Event("change", { bubbles: true, cancelable: false }));
                                    return;
                                }
                            }
                        }
                    }
                }
                else {
                    if (Array.isArray(this.resume_json[key])){
                        this.resume_json[key].forEach(value => {
                            if (field.parentNode.innerText.toLowerCase().includes(value.toLowerCase())){
                                console.log(`Checked radio/checkbox for: ${value}`);
                                field.checked = true;
                                field.dispatchEvent(new Event("change", { bubbles: true, cancelable: false }));
                                return;
                            }
                        });
                    }else{
                        if (field.parentNode.innerText.toLowerCase().trim() == this.resume_json[key].toLowerCase().trim()){
                            console.log(`Checked radio/checkbox for: ${this.resume_json[key]}`);
                            field.checked = true;
                            field.dispatchEvent(new Event("change", { bubbles: true, cancelable: false }));
                            return;
                        }
                    }
                }
            }
        }
        
        // Try to match based on field attributes if label matching failed
        const nameAttr = field.getAttribute('name');
        const idAttr = field.getAttribute('id');
        
        if (nameAttr || idAttr) {
            const attrs = [nameAttr, idAttr].filter(Boolean);
            for (const attr of attrs) {
                for (var key in this.resume_json) {
                    if (attr.toLowerCase().includes(key.toLowerCase()) || key.toLowerCase().includes(attr.toLowerCase())) {
                        if (field.type == "select-one") {
                            for(var i = 0; i < field.options.length; i++){
                                const valueToMatch = Array.isArray(this.resume_json[key]) ? 
                                    this.resume_json[key] : [this.resume_json[key]];
                                
                                for (const value of valueToMatch) {
                                    if(field.options[i].value != "" && 
                                      field.options[i].text.toLowerCase().includes(String(value).toLowerCase())){
                                        console.log(`Selected option based on attribute: ${field.options[i].text}`);
                                        field.options[i].selected = true;
                                        field.dispatchEvent(new Event("change", { bubbles: true, cancelable: false }));
                                        return;
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }
    }

    upload_files(){
        if (this.job_portal_type === CompanyType.greenhouse) {
            this.upload_greenhouse();
        } else if (this.job_portal_type === CompanyType.lever) {
            this.upload_lever();
        }
    }

    fill_resume() {
        this.get_forms();
        
        // Special handling for LinkedIn
        if(this.job_portal_type === CompanyType.linkedin) {
            this.handle_linkedin();
            return;
        }
        
        // Special handling for Greenhouse
        if(this.job_portal_type === CompanyType.greenhouse) {
            console.log("Greenhouse job portal detected, using enhanced form handling");
            this.handle_greenhouse();
            return;
        }
        
        // Generic form filling for other sites
        this.fill_generic_form();
    }
    
    // Handle Greenhouse job application forms
    handle_greenhouse() {
        try {
            console.log("Starting Greenhouse form handling");
            
            // Special handling for job-boards.greenhouse.io domain
            if (window.location.href.includes('job-boards.greenhouse.io')) {
                console.log("Using specialized handler for job-boards.greenhouse.io domain");
                this.handle_greenhouse_job_boards();
                return;
            }
            
            // Check if we're on a job listing page by looking for the Apply button
            // Use more specific selectors for job-boards.greenhouse.io
            const applyButton = document.querySelector('button[aria-label="Apply"], .btn[aria-label="Apply"], button.btn--pill, button[type="button"][aria-label="Apply"]');
            
            if (applyButton) {
                console.log("Found Apply button on Greenhouse job listing, clicking it");
                // Add a small delay before clicking to ensure the page is fully loaded
                setTimeout(() => {
                    applyButton.click();
                    console.log("Apply button clicked");
                    
                    // Wait for the form to load after clicking Apply
                    setTimeout(() => {
                        console.log("Filling form after clicking Apply button");
                        this.fill_greenhouse_form();
                    }, 2000); // Longer delay to ensure form loads
                }, 500);
                return;
            }
            
            // If we're already on the application form page, fill it directly
            console.log("No Apply button found, assuming we're already on the application form");
            this.fill_greenhouse_form();
            
        } catch (error) {
            console.error("Error in handle_greenhouse:", error);
            this.logError(error, "greenhouse_handling");
        }
    }
    
    // Special handler for job-boards.greenhouse.io domain
    handle_greenhouse_job_boards() {
        try {
            console.log("Special handler for job-boards.greenhouse.io activated");
            
            // First, try to find and click the Apply button
            const applyButton = document.querySelector('button.btn--pill, button[type="button"][aria-label="Apply"], button[aria-label="Apply"]');
            
            if (applyButton) {
                console.log("Found Apply button on job-boards.greenhouse.io, clicking it");
                
                // Click the button
                applyButton.click();
                
                // Wait for the form to appear and then fill it
                setTimeout(() => {
                    console.log("Looking for form fields after clicking Apply");
                    
                    // Find and fill first name field
                    const firstNameField = document.querySelector('input#first_name, input[name="first_name"]');
                    if (firstNameField) {
                        firstNameField.value = this.resume_json["first name"] || "";
                        firstNameField.dispatchEvent(new Event("input", { bubbles: true }));
                        firstNameField.dispatchEvent(new Event("change", { bubbles: true }));
                        console.log("Filled first name field");
                    }
                    
                    // Find and fill last name field
                    const lastNameField = document.querySelector('input#last_name, input[name="last_name"]');
                    if (lastNameField) {
                        lastNameField.value = this.resume_json["last name"] || "";
                        lastNameField.dispatchEvent(new Event("input", { bubbles: true }));
                        lastNameField.dispatchEvent(new Event("change", { bubbles: true }));
                        console.log("Filled last name field");
                    }
                    
                    // Find and fill email field
                    const emailField = document.querySelector('input#email, input[name="email"], input[type="email"]');
                    if (emailField) {
                        emailField.value = this.resume_json["email"] || "";
                        emailField.dispatchEvent(new Event("input", { bubbles: true }));
                        emailField.dispatchEvent(new Event("change", { bubbles: true }));
                        console.log("Filled email field");
                    }
                    
                    // Find and fill phone field
                    const phoneField = document.querySelector('input#phone, input[name="phone"]');
                    if (phoneField) {
                        phoneField.value = this.resume_json["phone"] || "";
                        phoneField.dispatchEvent(new Event("input", { bubbles: true }));
                        phoneField.dispatchEvent(new Event("change", { bubbles: true }));
                        console.log("Filled phone field");
                    }
                    
                    // Handle resume upload
                    this.handle_greenhouse_resume_upload();
                    
                    // Try to find and fill other fields
                    this.fill_greenhouse_form();
                    
                }, 3000); // Longer delay for job-boards.greenhouse.io
            } else {
                console.log("No Apply button found on job-boards.greenhouse.io, trying to fill form directly");
                this.fill_greenhouse_form();
            }
        } catch (error) {
            console.error("Error in handle_greenhouse_job_boards:", error);
            this.logError(error, "greenhouse_job_boards_handling");
        }
    }
    
    // Fill out Greenhouse application form
    fill_greenhouse_form() {
        try {
            console.log("Filling Greenhouse application form");
            
            // Track fields we've filled
            let filledFields = 0;
            
            // First name field
            const firstNameField = document.querySelector('input[id="first_name"], input[name="first_name"]');
            if (firstNameField) {
                this.fill_input(firstNameField, this.resume_json["first name"]);
                filledFields++;
            }
            
            // Last name field
            const lastNameField = document.querySelector('input[id="last_name"], input[name="last_name"]');
            if (lastNameField) {
                this.fill_input(lastNameField, this.resume_json["last name"]);
                filledFields++;
            }
            
            // Email field
            const emailField = document.querySelector('input[id="email"], input[name="email"], input[type="email"]');
            if (emailField) {
                this.fill_input(emailField, this.resume_json["email"]);
                filledFields++;
            }
            
            // Phone field
            const phoneField = document.querySelector('input[id="phone"], input[name="phone"]');
            if (phoneField) {
                this.fill_input(phoneField, this.resume_json["phone"]);
                filledFields++;
            }
            
            // LinkedIn field
            const linkedinField = document.querySelector('input[id*="linkedin"], input[name*="linkedin"]');
            if (linkedinField) {
                this.fill_input(linkedinField, this.resume_json["linkedin"]);
                filledFields++;
            }
            
            // Website field
            const websiteField = document.querySelector('input[id*="website"], input[name*="website"]');
            if (websiteField) {
                this.fill_input(websiteField, this.resume_json["website"]);
                filledFields++;
            }
            
            console.log(`Filled ${filledFields} fields in Greenhouse form`);
            
            // Handle resume upload if available
            this.handle_greenhouse_resume_upload();
            
        } catch (error) {
            console.error("Error filling Greenhouse form:", error);
            this.logError(error, "greenhouse_form_filling");
        }
    }
    
    // Helper method to fill an input field with a value
    fill_input(field, value) {
        if (!field || !value) return;
        
        try {
            field.value = value;
            field.dispatchEvent(new Event("change", { bubbles: true }));
            field.dispatchEvent(new Event("input", { bubbles: true }));
            console.log(`Filled field ${field.name || field.id} with value`);
        } catch (error) {
            console.error("Error filling input:", error);
            this.logError(error, "fill_input");
        }
    }
    
    // Handle resume upload for Greenhouse
    handle_greenhouse_resume_upload() {
        try {
            // Look for resume upload field
            const resumeUploadField = document.querySelector('input[name="resume"], input[name="cover_letter"], input[type="file"]');
            
            if (resumeUploadField && this.resume_file) {
                console.log("Found resume upload field, attempting to upload resume");
                
                try {
                    // Create a File object from the resume data
                    const resumeBlob = this.dataURItoBlob(this.resume_file);
                    if (!resumeBlob) {
                        console.error("Failed to create blob from resume data");
                        return;
                    }
                    
                    const resumeFile = new File([resumeBlob], "resume.pdf", { type: "application/pdf" });
                    
                    // Create a DataTransfer object to set the file
                    const dataTransfer = new DataTransfer();
                    dataTransfer.items.add(resumeFile);
                    resumeUploadField.files = dataTransfer.files;
                    
                    // Trigger change event
                    const event = new Event('change', { bubbles: true });
                    resumeUploadField.dispatchEvent(event);
                    
                    console.log("Resume upload attempted");
                    
                    // Special handling for job-boards.greenhouse.io
                    if (window.location.href.includes('job-boards.greenhouse.io')) {
                        // Look for upload buttons that might need to be clicked
                        setTimeout(() => {
                            const uploadButtons = document.querySelectorAll('button[aria-label="Upload"], button.upload-button, button[type="button"]:not([aria-label="Apply"])');
                            if (uploadButtons.length > 0) {
                                console.log("Found upload button, clicking it");
                                uploadButtons[0].click();
                            }
                        }, 1000);
                    }
                } catch (uploadError) {
                    console.error("Error during file upload process:", uploadError);
                    this.logError(uploadError, "resume_file_upload_process");
                    
                    // Fallback for job-boards.greenhouse.io
                    if (window.location.href.includes('job-boards.greenhouse.io')) {
                        console.log("Using fallback upload method for job-boards.greenhouse.io");
                        this.tryAlternativeUploadMethod(resumeUploadField);
                    }
                }
            } else {
                console.log("Resume upload field not found or resume file not available");
            }
        } catch (error) {
            console.error("Error handling Greenhouse resume upload:", error);
            this.logError(error, "greenhouse_resume_upload");
        }
    }
    
    // Alternative upload method for job-boards.greenhouse.io
    tryAlternativeUploadMethod(uploadField) {
        try {
            if (!uploadField || !this.resume_file) return;
            
            console.log("Trying alternative upload method");
            
            // Try to trigger click on the upload field to open file dialog
            uploadField.click();
            
            // Look for Dropbox/Google Drive buttons as alternatives
            setTimeout(() => {
                const alternativeButtons = document.querySelectorAll('button[aria-label="Dropbox"], button[aria-label="Google Drive"]');
                if (alternativeButtons.length > 0) {
                    console.log("Found alternative upload buttons, but can't automate external services");
                }
            }, 1000);
            
        } catch (error) {
            console.error("Error in alternative upload method:", error);
            this.logError(error, "alternative_upload_method");
        }
    }
    
    // Helper function to convert data URI to Blob
    dataURItoBlob(dataURI) {
        if (!dataURI) return null;
        
        // Convert base64 to raw binary data held in a string
        const byteString = atob(dataURI.split(',')[1]);
        
        // Separate out the mime component
        const mimeString = dataURI.split(',')[0].split(':')[1].split(';')[0];
        
        // Write the bytes of the string to an ArrayBuffer
        const ab = new ArrayBuffer(byteString.length);
        const ia = new Uint8Array(ab);
        for (let i = 0; i < byteString.length; i++) {
            ia[i] = byteString.charCodeAt(i);
        }
        
        return new Blob([ab], { type: mimeString });
    }
    
    // Generic form filling for non-specific sites
    fill_generic_form() {
        // If we have form(s), try to fill them using label-based approach
        if (this.form) {
            console.log("Starting form-based autofill");
            var labels = document.getElementsByTagName("label");
            console.log(`Found ${labels.length} labels on the page`);
            
            for (var i = 0; i < labels.length; i++) {
                // Get label text
                var labelElement = labels[i];
                var label = '';
                
                if (labelElement.innerText) {
                    label = labelElement.innerText.split("\n")[0].trim();
                }
                
                // If label is empty, try to get it from aria-label
                if (!label) {
                    label = labelElement.getAttribute('aria-label') || '';
                }
                
                if (!label) continue;
                
                console.log(`Processing label: "${label}"`);
                
                // Find corresponding inputs
                // Method 1: Check if label has a 'for' attribute
                if (labelElement.htmlFor) {
                    const element = document.getElementById(labelElement.htmlFor);
                    if (element && element.tagName === 'INPUT') {
                        if (element.type === 'text' || element.type === 'email' || element.type === 'tel') {
                            this.fill_text_field(element, label);
                        } else if (element.type === 'radio' || element.type === 'checkbox') {
                            this.fill_select_field(element, label);
                        }
                    } else if (element && element.tagName === 'SELECT') {
                        this.fill_select_field(element, label);
                    }
                    continue;
                }
                
                // Method 2: Check parent node for inputs
                var elements = labelElement.parentNode.getElementsByTagName("input");
                for(var j = 0; j < elements.length; j++){
                    var element = elements[j];
                    if(element != null && element.type != 'hidden') {
                        if (element.type == "text" || element.type == "email" || element.type === 'tel'){
                            this.fill_text_field(element, label);
                        }
                        else if (element.type == "radio" || element.type == "checkbox"){
                            this.fill_select_field(element, label);
                        }
                    }
                }
                
                // Check for select fields
                var elements = labelElement.parentNode.getElementsByTagName("select");
                for(var j = 0; j < elements.length; j++){
                    var element = elements[j];
                    if(element != null && element.type != 'hidden') {
                        this.fill_select_field(element, label);
                    }
                }
            }
        }
        
        // If no labels found or additional inputs need to be filled, try a direct approach
        console.log("Trying direct field identification");
        this.fill_all_inputs_directly();
        
        // As a final step, try our enhanced form handler which works for any job portal
        console.log("Applying universal form handling");
        this.handle_job_portal_form();
        
        // Check for education and experience fields
        this.check_fill_education();
        this.check_fill_experience();
        
        // Try to upload resume/cover letter files
        this.upload_files();
    }
    
    fill_all_inputs_directly() {
        // Get all input fields directly
        const allInputs = document.querySelectorAll('input:not([type="hidden"]):not([type="submit"]):not([type="button"]):not([type="password"])');
        const allSelects = document.querySelectorAll('select');
        const allTextareas = document.querySelectorAll('textarea');
        
        console.log(`Found ${allInputs.length} inputs, ${allSelects.length} selects, and ${allTextareas.length} textareas for direct filling`);
        
        // Process text inputs
        allInputs.forEach(input => {
            if (input.type === 'text' || input.type === 'email' || input.type === 'tel') {
                // Try to determine the field's purpose from surrounding text
                let label = '';
                
                // Method 1: Check if it has an aria-label
                label = input.getAttribute('aria-label') || '';
                
                // Method 2: Check if there's a label near the input
                if (!label) {
                    const parentText = input.parentElement.innerText;
                    if (parentText && parentText.length < 100) { // Avoid capturing large text blocks
                        label = parentText.trim();
                    }
                }
                
                // Method 3: Use name or id
                if (!label) {
                    label = input.name || input.id || '';
                }
                
                if (label) {
                    this.fill_text_field(input, label);
                }
            } else if (input.type === 'radio' || input.type === 'checkbox') {
                let label = '';
                
                // Method 1: Check parent text
                const parentText = input.parentElement.innerText;
                if (parentText && parentText.length < 100) {
                    label = parentText.trim();
                }
                
                // Method 2: Use name or id
                if (!label) {
                    label = input.name || input.id || '';
                }
                
                if (label) {
                    this.fill_select_field(input, label);
                }
            }
        });
        
        // Process select elements
        allSelects.forEach(select => {
            let label = '';
            
            // Method 1: Check if it has an aria-label
            label = select.getAttribute('aria-label') || '';
            
            // Method 2: Check parent text
            if (!label) {
                const parentText = select.parentElement.innerText;
                if (parentText && parentText.length < 100) {
                    label = parentText.trim();
                }
            }
            
            // Method 3: Use name or id
            if (!label) {
                label = select.name || select.id || '';
            }
            
            if (label) {
                this.fill_select_field(select, label);
            }
        });
        
        // Process textareas
        allTextareas.forEach(textarea => {
            let label = '';
            
            // Method 1: Check if it has an aria-label
            label = textarea.getAttribute('aria-label') || '';
            
            // Method 2: Check parent text
            if (!label) {
                const parentText = textarea.parentElement.innerText;
                if (parentText && parentText.length < 100) {
                    label = parentText.trim();
                }
            }
            
            // Method 3: Use name or id
            if (!label) {
                label = textarea.name || textarea.id || '';
            }
            
            if (label) {
                this.fill_text_field(textarea, label);
            }
        });
    }

    /**
     * Handle form filling for any job portal with enhanced detection methods
     * This supports Greenhouse, Lever, LinkedIn, and other job portal types
     */
    handle_job_portal_form() {
        try {
            console.log(`Handling job portal form for type: ${this.job_portal_type}`);
            
            if (!this.resume_json) {
                console.error("No resume data available for form filling");
                return;
            }
            
            // Upload fields: look for file inputs for resume and cover letter
            this.find_and_fill_upload_fields();
            
            // Try to locate and fill personal information fields
            this.fill_personal_info_fields();
            
            // Handle job-specific fields 
            this.handle_job_specific_fields();
            
            console.log("Job portal form handling completed");
        } catch (error) {
            console.error("Error in handle_job_portal_form:", error);
            this.logError(error, "handle_job_portal_form");
        }
    }
    
    /**
     * Find and fill upload fields for resume and cover letter
     */
    find_and_fill_upload_fields() {
        try {
            console.log("Looking for file upload fields");
            
            // Try common patterns for resume upload fields
            const resumeSelectors = [
                "input[type='file'][name*='resume']",
                "input[type='file'][id*='resume']", 
                "input[type='file'][aria-label*='resume']",
                "input[type='file'][accept*='pdf']",
                "input[type='file'][data-qa*='resume']"
            ];
            
            // Try common patterns for cover letter upload fields
            const coverLetterSelectors = [
                "input[type='file'][name*='cover']",
                "input[type='file'][id*='cover']",
                "input[type='file'][aria-label*='cover']",
                "input[type='file'][data-qa*='cover']"
            ];
            
            // Find and fill resume uploads
            if (this.resume_file) {
                const resumeSelector = resumeSelectors.join(", ");
                const resumeInputs = document.querySelectorAll(resumeSelector);
                
                if (resumeInputs.length > 0) {
                    console.log(`Found ${resumeInputs.length} potential resume upload fields`);
                    resumeInputs[0].files = this.resume_file.files;
                    resumeInputs[0].dispatchEvent(new Event("change", { bubbles: true, cancelable: false }));
                    console.log("Resume uploaded to field:", resumeInputs[0].name || resumeInputs[0].id);
                } else {
                    // Try a more general approach - any file input
                    const fileInputs = document.querySelectorAll("input[type='file']");
                    if (fileInputs.length > 0) {
                        console.log("No specific resume field found, trying first file input");
                        fileInputs[0].files = this.resume_file.files;
                        fileInputs[0].dispatchEvent(new Event("change", { bubbles: true, cancelable: false }));
                    } else {
                        console.log("No file inputs found for resume upload");
                    }
                }
            }
            
            // Find and fill cover letter uploads
            if (this.cover_letter) {
                const coverLetterSelector = coverLetterSelectors.join(", ");
                const coverLetterInputs = document.querySelectorAll(coverLetterSelector);
                
                if (coverLetterInputs.length > 0) {
                    console.log(`Found ${coverLetterInputs.length} potential cover letter upload fields`);
                    coverLetterInputs[0].files = this.cover_letter.files;
                    coverLetterInputs[0].dispatchEvent(new Event("change", { bubbles: true, cancelable: false }));
                    console.log("Cover letter uploaded to field:", coverLetterInputs[0].name || coverLetterInputs[0].id);
                } else if (document.querySelectorAll("input[type='file']").length > 1) {
                    // If there's more than one file input and we already used one for resume
                    const fileInputs = document.querySelectorAll("input[type='file']");
                    console.log("No specific cover letter field found, trying second file input");
                    fileInputs[1].files = this.cover_letter.files;
                    fileInputs[1].dispatchEvent(new Event("change", { bubbles: true, cancelable: false }));
                } else {
                    console.log("No file inputs found for cover letter upload");
                }
            }
        } catch (error) {
            console.error("Error in find_and_fill_upload_fields:", error);
            this.logError(error, "find_and_fill_upload_fields");
        }
    }
    
    /**
     * Fill personal information fields in the form
     */
    fill_personal_info_fields() {
        try {
            console.log("Filling personal information fields");
            
            // Define common field name patterns and corresponding resume keys
            const fieldMappings = [
                { pattern: "first.*name", key: "first name" },
                { pattern: "last.*name", key: "last name" },
                { pattern: "full.*name", key: ["first name", "last name"] },
                { pattern: "email", key: "email" },
                { pattern: "phone", key: "phone" },
                { pattern: "address", key: "address" },
                { pattern: "city", key: "city" },
                { pattern: "state|province", key: "state" },
                { pattern: "zip|postal", key: "zip" },
                { pattern: "country", key: "country" },
                { pattern: "linkedin", key: "linkedin" },
                { pattern: "github", key: "github" },
                { pattern: "website|portfolio", key: "website" }
            ];
            
            // Find text inputs, selects and textareas
            const textInputs = document.querySelectorAll("input[type='text'], input[type='email'], input[type='tel'], input[type='url']");
            const selects = document.querySelectorAll("select");
            const textareas = document.querySelectorAll("textarea");
            
            // Process inputs
            textInputs.forEach(input => {
                // Skip if already has a value
                if (input.value && input.value.trim() !== "") return;
                
                const inputName = (input.name || "").toLowerCase();
                const inputId = (input.id || "").toLowerCase();
                const inputLabel = input.getAttribute("aria-label") || "";
                const inputPlaceholder = input.getAttribute("placeholder") || "";
                
                // Try to match this input to a resume field
                for (const mapping of fieldMappings) {
                    const regex = new RegExp(mapping.pattern, "i");
                    if (regex.test(inputName) || regex.test(inputId) || 
                        regex.test(inputLabel) || regex.test(inputPlaceholder)) {
                        
                        const keys = Array.isArray(mapping.key) ? mapping.key : [mapping.key];
                        let value = "";
                        
                        // For composite fields like "full name"
                        if (keys.length > 1) {
                            value = keys.map(k => this.resume_json[k] || "").join(" ").trim();
                        } else {
                            value = this.resume_json[keys[0]] || "";
                        }
                        
                        if (value) {
                            console.log(`Filling ${inputName || inputId} with ${keys.join('/')} value`);
                            input.value = value;
                            input.dispatchEvent(new Event("change", { bubbles: true, cancelable: false }));
                            input.dispatchEvent(new Event("input", { bubbles: true, cancelable: false }));
                        }
                        break;
                    }
                }
            });
            
            // Process selects similar to inputs
            selects.forEach(select => {
                // Skip if already has a non-default value
                if (select.value && select.value !== "" && 
                    select.value !== "Select" && 
                    select.selectedIndex !== 0) return;
                
                const selectName = (select.name || "").toLowerCase();
                const selectId = (select.id || "").toLowerCase();
                const selectLabel = select.getAttribute("aria-label") || "";
                
                // Try to match this select to a resume field
                for (const mapping of fieldMappings) {
                    const regex = new RegExp(mapping.pattern, "i");
                    if (regex.test(selectName) || regex.test(selectId) || regex.test(selectLabel)) {
                        
                        const keys = Array.isArray(mapping.key) ? mapping.key : [mapping.key];
                        let value = "";
                        
                        if (keys.length > 1) {
                            value = keys.map(k => this.resume_json[k] || "").join(" ").trim();
                        } else {
                            value = this.resume_json[keys[0]] || "";
                        }
                        
                        if (value) {
                            // Try to find a matching option
                            for (let i = 0; i < select.options.length; i++) {
                                const option = select.options[i];
                                if (option.text.toLowerCase().includes(value.toLowerCase()) || 
                                    value.toLowerCase().includes(option.text.toLowerCase())) {
                                    select.selectedIndex = i;
                                    select.dispatchEvent(new Event("change", { bubbles: true, cancelable: false }));
                                    console.log(`Selected option "${option.text}" for ${selectName || selectId}`);
                                    break;
                                }
                            }
                        }
                        break;
                    }
                }
            });
            
            // Process textareas (for longer form content)
            textareas.forEach(textarea => {
                // Skip if already has a value
                if (textarea.value && textarea.value.trim() !== "") return;
                
                const textareaName = (textarea.name || "").toLowerCase();
                const textareaId = (textarea.id || "").toLowerCase();
                const textareaLabel = textarea.getAttribute("aria-label") || "";
                const textareaPlaceholder = textarea.getAttribute("placeholder") || "";
                
                // Cover letter specific handling
                if (textareaName.includes("cover") || textareaId.includes("cover") || 
                    textareaLabel.includes("cover") || textareaPlaceholder.includes("cover")) {
                    
                    if (this.resume_json["cover_letter_text"]) {
                        textarea.value = this.resume_json["cover_letter_text"];
                        textarea.dispatchEvent(new Event("change", { bubbles: true, cancelable: false }));
                        textarea.dispatchEvent(new Event("input", { bubbles: true, cancelable: false }));
                        console.log("Filled cover letter text field");
                    }
                }
                
                // Introduction/profile field handling
                if (textareaName.includes("intro") || textareaId.includes("intro") || 
                    textareaName.includes("profile") || textareaId.includes("profile") ||
                    textareaLabel.includes("introduce") || textareaPlaceholder.includes("about yourself")) {
                    
                    if (this.resume_json["summary"] || this.resume_json["profile"]) {
                        textarea.value = this.resume_json["summary"] || this.resume_json["profile"] || "";
                        textarea.dispatchEvent(new Event("change", { bubbles: true, cancelable: false }));
                        textarea.dispatchEvent(new Event("input", { bubbles: true, cancelable: false }));
                        console.log("Filled profile/introduction field");
                    }
                }
            });
            
            console.log("Personal information fields filled");
        } catch (error) {
            console.error("Error in fill_personal_info_fields:", error);
            this.logError(error, "fill_personal_info_fields");
        }
    }
    
    /**
     * Handle job-specific fields like salary expectations, start date, etc.
     */
    handle_job_specific_fields() {
        try {
            console.log("Handling job-specific fields");
            
            // Common job application questions
            const salaryFields = document.querySelectorAll(
                "input[name*='salary'], input[id*='salary'], " +
                "input[placeholder*='salary'], input[aria-label*='salary'], " +
                "select[name*='salary'], select[id*='salary']"
            );
            
            const startDateFields = document.querySelectorAll(
                "input[name*='start'], input[id*='start'], " +
                "input[placeholder*='start'], input[aria-label*='start'], " +
                "select[name*='start'], select[id*='start']"
            );
            
            const workAuthFields = document.querySelectorAll(
                "select[name*='authorization'], select[id*='authorization'], " +
                "select[name*='eligible'], select[id*='eligible'], " +
                "select[name*='citizen'], select[id*='citizen'], " +
                "select[name*='sponsor'], select[id*='sponsor']"
            );
            
            // Fill salary expectations if we have them
            if (salaryFields.length > 0 && this.resume_json["salary_expectation"]) {
                salaryFields.forEach(field => {
                    if (!field.value || field.value.trim() === "") {
                        if (field.tagName === 'SELECT') {
                            // Try to find an option with the salary expectation
                            for (let i = 0; i < field.options.length; i++) {
                                const option = field.options[i];
                                if (option.text.includes(this.resume_json["salary_expectation"])) {
                                    field.selectedIndex = i;
                                    field.dispatchEvent(new Event("change", { bubbles: true, cancelable: false }));
                                    console.log("Selected salary expectation from dropdown");
                                    break;
                                }
                            }
                        } else {
                            field.value = this.resume_json["salary_expectation"];
                            field.dispatchEvent(new Event("change", { bubbles: true, cancelable: false }));
                            field.dispatchEvent(new Event("input", { bubbles: true, cancelable: false }));
                            console.log("Filled salary expectation field");
                        }
                    }
                });
            }
            
            // Fill start date availability
            if (startDateFields.length > 0 && this.resume_json["start_date"]) {
                startDateFields.forEach(field => {
                    if (!field.value || field.value.trim() === "") {
                        if (field.tagName === 'SELECT') {
                            // Try to find an option with the start date
                            for (let i = 0; i < field.options.length; i++) {
                                const option = field.options[i];
                                if (option.text.includes(this.resume_json["start_date"])) {
                                    field.selectedIndex = i;
                                    field.dispatchEvent(new Event("change", { bubbles: true, cancelable: false }));
                                    console.log("Selected start date from dropdown");
                                    break;
                                }
                            }
                        } else {
                            field.value = this.resume_json["start_date"];
                            field.dispatchEvent(new Event("change", { bubbles: true, cancelable: false }));
                            field.dispatchEvent(new Event("input", { bubbles: true, cancelable: false }));
                            console.log("Filled start date field");
                        }
                    }
                });
            }
            
            // Handle work authorization dropdowns
            if (workAuthFields.length > 0 && this.resume_json["work_authorization"]) {
                workAuthFields.forEach(field => {
                    if (!field.value || field.value === "" || field.selectedIndex === 0) {
                        const auth = this.resume_json["work_authorization"].toLowerCase();
                        let authOption = -1;
                        
                        // Look for a matching option based on authorization status
                        for (let i = 0; i < field.options.length; i++) {
                            const option = field.options[i];
                            const optionText = option.text.toLowerCase();
                            
                            if (auth === "yes" || auth === "true" || auth.includes("citizen") || auth.includes("permanent")) {
                                // For authorized workers
                                if (optionText.includes("yes") || optionText.includes("citizen") || 
                                    optionText.includes("permanent") || optionText.includes("authorized")) {
                                    authOption = i;
                                    break;
                                }
                            } else if (auth === "no" || auth === "false" || auth.includes("visa") || auth.includes("sponsor")) {
                                // For those needing sponsorship
                                if (optionText.includes("no") || optionText.includes("visa") || 
                                    optionText.includes("sponsor") || optionText.includes("not authorized")) {
                                    authOption = i;
                                    break;
                                }
                            }
                        }
                        
                        if (authOption >= 0) {
                            field.selectedIndex = authOption;
                            field.dispatchEvent(new Event("change", { bubbles: true, cancelable: false }));
                            console.log("Selected work authorization option:", field.options[authOption].text);
                        }
                    }
                });
            }
            
            console.log("Job-specific fields handled");
        } catch (error) {
            console.error("Error in handle_job_specific_fields:", error);
            this.logError(error, "handle_job_specific_fields");
        }
    }

    resume_task() {
        try {
            console.log("Starting autofill resume task");
            this.debugInfo = {
                fieldsAttempted: 0,
                fieldsSuccessfullyFilled: 0,
                matchedFields: []
            };
            
            if (this.resume_json !== null) {
                console.log("Resume JSON data available, starting autofill");
                this.fill_resume();
                
                // Log a summary of the autofill process
                console.log("Autofill completed. Summary:", {
                    fieldsAttempted: this.debugInfo.fieldsAttempted,
                    fieldsSuccessfullyFilled: this.debugInfo.fieldsSuccessfullyFilled,
                    matchedFields: this.debugInfo.matchedFields
                });
            } else {
                console.error("No resume JSON data available");
            }
        } catch (error) {
            console.error("Error in resume_task:", error);
            this.logError(error, "resume_task");
        }
    }

    // Helper method to select an option by text
    selectOptionByText(selectElement, textToMatch, select2Element = null) {
        if (!selectElement || !textToMatch) return;
        
        console.log(`Trying to select option with text containing: ${textToMatch}`);
        for (let i = 0; i < selectElement.options.length; i++) {
            if (selectElement.options[i].value !== "" && 
                selectElement.options[i].text.toLowerCase().includes(textToMatch.toLowerCase())) {
                
                selectElement.options[i].selected = true;
                selectElement.dispatchEvent(new Event("change", { bubbles: true, cancelable: false }));
                
                // Update Select2 if present
                if (select2Element) {
                    const selected = select2Element.getElementsByClassName("select2-chosen");
                    if (selected.length > 0) {
                        selected[0].innerText = selectElement.options[i].text;
                        selected[0].dispatchEvent(new Event("change", { bubbles: true, cancelable: false }));
                    }
                }
                
                console.log(`Selected option: ${selectElement.options[i].text}`);
                return true;
            }
        }
        console.log(`No matching option found for text: ${textToMatch}`);
        return false;
    }

    fill_education_greenhouse(education, idx) {
        try {
            console.log(`Filling education ${idx} for Greenhouse`);
            
            // Try to add education if needed
            if (idx > 0) {
                const addButton = document.getElementById("add_education");
                if (addButton) {
                    console.log("Clicking add education button");
                    addButton.click();
                    // Small delay to allow the form to update
                    setTimeout(() => this.fillEducationFields(education, idx), 300);
                } else {
                    console.log("Add education button not found, attempting direct fill");
                    this.fillEducationFields(education, idx);
                }
            } else {
                this.fillEducationFields(education, idx);
            }
        } catch (error) {
            console.error(`Error filling education ${idx}:`, error);
            this.logError(error, "fill_education_greenhouse");
        }
    }
    
    fillEducationFields(education, idx) {
        try {
            // Method 1: Traditional Greenhouse form
            let schoolNameField = document.getElementById(`education_school_name_${idx}`);
            if (schoolNameField) {
                // Fill school name
                schoolNameField.value = education['school_value'] || education['school'];
                schoolNameField.dispatchEvent(new Event("change", { bubbles: true, cancelable: false }));
                
                // Update Select2 if present
                let schoolNameUpdate = document.getElementById(`s2id_education_school_name_${idx}`);
                if (schoolNameUpdate) {
                    const selected = schoolNameUpdate.getElementsByClassName("select2-chosen");
                    if (selected.length > 0) {
                        selected[0].innerText = education['school'];
                        selected[0].dispatchEvent(new Event("change", { bubbles: true, cancelable: false }));
                    }
                }
                
                // Fill degree
                let degreeField = document.getElementById(`education_degree_${idx}`);
                if (degreeField) {
                    this.selectOptionByText(degreeField, education['degreetype'], 
                        document.getElementById(`s2id_education_degree_${idx}`));
                }
                
                // Fill discipline/major
                let disciplineField = document.getElementById(`education_discipline_${idx}`);
                if (disciplineField) {
                    this.selectOptionByText(disciplineField, education['major'], 
                        document.getElementById(`s2id_education_discipline_${idx}`));
                }
                
                // Fill dates
                let parent = schoolNameField.closest('div.education');
                if (!parent) parent = schoolNameField.parentNode.parentNode;
                
                let startDate = parent.querySelector('.start-date-year');
                let endDate = parent.querySelector('.end-date-year');
                
                if (startDate && education['startdate']) {
                    startDate.value = education['startdate'].substring(0, startDate.maxLength);
                    startDate.dispatchEvent(new Event("change", { bubbles: true, cancelable: false }));
                }
                
                if (endDate && education['enddate']) {
                    endDate.value = education['enddate'].substring(0, endDate.maxLength);
                    endDate.dispatchEvent(new Event("change", { bubbles: true, cancelable: false }));
                }
                
                console.log(`Successfully filled education ${idx} using traditional fields`);
            } else {
                // Method 2: Alternative form structure, look for fields by name/attribute pattern
                console.log(`Traditional fields not found for education ${idx}, trying alternative approach`);
                
                // Look for school field by various patterns
                const schoolFields = document.querySelectorAll(`[id*='school'][id*='${idx}'], [name*='school'][name*='${idx}'], [id*='education'][id*='${idx}'][id*='institution']`);
                if (schoolFields.length > 0) {
                    schoolFields[0].value = education['school_value'] || education['school'];
                    schoolFields[0].dispatchEvent(new Event("change", { bubbles: true, cancelable: false }));
                    console.log(`Filled school name for education ${idx} using alternative field`);
                }
                
                // Look for degree field
                const degreeFields = document.querySelectorAll(`[id*='degree'][id*='${idx}'], [name*='degree'][name*='${idx}']`);
                if (degreeFields.length > 0 && degreeFields[0].tagName === 'SELECT') {
                    this.selectOptionByText(degreeFields[0], education['degreetype']);
                    console.log(`Filled degree for education ${idx} using alternative field`);
                }
                
                // Look for major/discipline field
                const majorFields = document.querySelectorAll(`[id*='major'][id*='${idx}'], [id*='discipline'][id*='${idx}'], [name*='major'][name*='${idx}'], [name*='discipline'][name*='${idx}']`);
                if (majorFields.length > 0 && majorFields[0].tagName === 'SELECT') {
                    this.selectOptionByText(majorFields[0], education['major']);
                    console.log(`Filled major for education ${idx} using alternative field`);
                }
                
                // Look for start/end date fields
                const dateFields = document.querySelectorAll(`[id*='date'][id*='${idx}'], [name*='date'][name*='${idx}'], [id*='year'][id*='${idx}'], [name*='year'][name*='${idx}']`);
                if (dateFields.length > 0) {
                    dateFields.forEach(field => {
                        if (field.id.toLowerCase().includes('start') || field.name.toLowerCase().includes('start')) {
                            field.value = education['startdate'] ? education['startdate'].substring(0, field.maxLength || 4) : '';
                            field.dispatchEvent(new Event("change", { bubbles: true, cancelable: false }));
                            console.log(`Filled start date for education ${idx}`);
                        } else if (field.id.toLowerCase().includes('end') || field.name.toLowerCase().includes('end')) {
                            field.value = education['enddate'] ? education['enddate'].substring(0, field.maxLength || 4) : '';
                            field.dispatchEvent(new Event("change", { bubbles: true, cancelable: false }));
                            console.log(`Filled end date for education ${idx}`);
                        }
                    });
                }
            }
        } catch (error) {
            console.error(`Error filling education fields for ${idx}:`, error);
            this.logError(error, "fillEducationFields");
        }
    }

    fill_experience_greenhouse(experience, idx) {
        try {
            console.log(`Filling experience ${idx} for Greenhouse`);
            
            // Try to add experience if needed
            if (idx > 0) {
                const addButton = document.getElementById("add_experience");
                if (addButton) {
                    console.log("Clicking add experience button");
                    addButton.click();
                    // Small delay to allow the form to update
                    setTimeout(() => this.fillExperienceFields(experience, idx), 300);
                } else {
                    console.log("Add experience button not found, attempting direct fill");
                    this.fillExperienceFields(experience, idx);
                }
            } else {
                this.fillExperienceFields(experience, idx);
            }
        } catch (error) {
            console.error(`Error filling experience ${idx}:`, error);
            this.logError(error, "fill_experience_greenhouse");
        }
    }
    
    fillExperienceFields(experience, idx) {
        try {
            // Method 1: Traditional Greenhouse form
            let companyNameField = document.getElementById(`experience_company_name_${idx}`);
            let titleField = document.getElementById(`experience_title_${idx}`);
            
            if (companyNameField && titleField) {
                // Fill company name
                companyNameField.value = experience['company'] || '';
                companyNameField.dispatchEvent(new Event("change", { bubbles: true, cancelable: false }));
                
                // Fill title
                if (titleField.tagName === 'SELECT') {
                    // Select title from dropdown
                    this.selectOptionByText(titleField, experience['title'], 
                        document.getElementById(`s2id_experience_title_${idx}`));
                } else {
                    // Direct input for title
                    titleField.value = experience['title'] || '';
                    titleField.dispatchEvent(new Event("change", { bubbles: true, cancelable: false }));
                }
                
                // Fill dates
                let parent = companyNameField.closest('div.experience');
                if (!parent) parent = companyNameField.parentNode.parentNode;
                
                let startDate = parent.querySelector('.start-date-year');
                let endDate = parent.querySelector('.end-date-year');
                
                if (startDate && experience['startdate']) {
                    startDate.value = experience['startdate'].substring(0, startDate.maxLength);
                    startDate.dispatchEvent(new Event("change", { bubbles: true, cancelable: false }));
                }
                
                if (endDate && experience['enddate']) {
                    endDate.value = experience['enddate'].substring(0, endDate.maxLength);
                    endDate.dispatchEvent(new Event("change", { bubbles: true, cancelable: false }));
                }
                
                console.log(`Successfully filled experience ${idx} using traditional fields`);
            } else {
                // Method 2: Alternative form structure, look for fields by name/attribute pattern
                console.log(`Traditional fields not found for experience ${idx}, trying alternative approach`);
                
                // Look for company field by various patterns
                const companyFields = document.querySelectorAll(`[id*='company'][id*='${idx}'], [name*='company'][name*='${idx}'], [id*='employer'][id*='${idx}'], [name*='employer'][name*='${idx}']`);
                if (companyFields.length > 0) {
                    companyFields[0].value = experience['company'] || '';
                    companyFields[0].dispatchEvent(new Event("change", { bubbles: true, cancelable: false }));
                    console.log(`Filled company name for experience ${idx} using alternative field`);
                }
                
                // Look for title field
                const titleFields = document.querySelectorAll(`[id*='title'][id*='${idx}'], [name*='title'][name*='${idx}'], [id*='position'][id*='${idx}'], [name*='position'][name*='${idx}']`);
                if (titleFields.length > 0) {
                    if (titleFields[0].tagName === 'SELECT') {
                        this.selectOptionByText(titleFields[0], experience['title']);
                    } else {
                        titleFields[0].value = experience['title'] || '';
                        titleFields[0].dispatchEvent(new Event("change", { bubbles: true, cancelable: false }));
                    }
                    console.log(`Filled title for experience ${idx} using alternative field`);
                }
                
                // Look for start/end date fields
                const dateFields = document.querySelectorAll(`[id*='date'][id*='${idx}'], [name*='date'][name*='${idx}'], [id*='year'][id*='${idx}'], [name*='year'][name*='${idx}']`);
                if (dateFields.length > 0) {
                    dateFields.forEach(field => {
                        if (field.id.toLowerCase().includes('start') || field.name.toLowerCase().includes('start')) {
                            field.value = experience['startdate'] ? experience['startdate'].substring(0, field.maxLength || 4) : '';
                            field.dispatchEvent(new Event("change", { bubbles: true, cancelable: false }));
                            console.log(`Filled start date for experience ${idx}`);
                        } else if (field.id.toLowerCase().includes('end') || field.name.toLowerCase().includes('end')) {
                            field.value = experience['enddate'] ? experience['enddate'].substring(0, field.maxLength || 4) : '';
                            field.dispatchEvent(new Event("change", { bubbles: true, cancelable: false }));
                            console.log(`Filled end date for experience ${idx}`);
                        }
                    });
                }
            }
        } catch (error) {
            console.error(`Error filling experience fields for ${idx}:`, error);
            this.logError(error, "fillExperienceFields");
        }
    }

    check_fill_experience() {
        for(var i = 0; i < this.resume_json['experiences'].length; i++){
            var experience = this.resume_json['experiences'][i];
            switch(this.job_portal_type){
                case CompanyType.greenhouse:
                    this.fill_experience_greenhouse(experience, i);
                    break;
            }
        }
    }

    check_fill_education() {
        for(var i = 0; i < this.resume_json['educations'].length; i++){
            var education = this.resume_json['educations'][i];
            switch(this.job_portal_type){
                case CompanyType.greenhouse:
                    this.fill_education_greenhouse(education, i);
                    break;
            }
        }
    }

    upload_greenhouse() {
        try {
            console.log("Attempting to upload files to Greenhouse form");
            
            // Method 1: Standard Greenhouse form
            let resumeForm = document.getElementById("s3_upload_for_resume");
            if (resumeForm && this.resume_file) {
                let fileInput = resumeForm.querySelector("input[type='file']");
                if (fileInput) {
                    console.log("Found standard resume upload field, uploading resume");
                    fileInput.files = this.resume_file.files;
                    fileInput.dispatchEvent(new Event("change", { bubbles: true, cancelable: false }));
                }
            } else {
                // Method 2: Try to find resume upload by attribute or class
                let resumeInputs = document.querySelectorAll("input[type='file'][name*='resume'], input[type='file'][id*='resume'], input[type='file'][aria-label*='resume'], input[type='file'][accept*='pdf']");
                if (resumeInputs.length > 0 && this.resume_file) {
                    console.log("Found alternative resume upload field, uploading resume");
                    resumeInputs[0].files = this.resume_file.files;
                    resumeInputs[0].dispatchEvent(new Event("change", { bubbles: true, cancelable: false }));
                } else {
                    // Method 3: Try any file input if nothing else worked
                    console.log("No specific resume field found, looking for any file input");
                    let anyFileInputs = document.querySelectorAll("input[type='file']");
                    if (anyFileInputs.length > 0 && this.resume_file) {
                        console.log("Using generic file input for resume");
                        anyFileInputs[0].files = this.resume_file.files;
                        anyFileInputs[0].dispatchEvent(new Event("change", { bubbles: true, cancelable: false }));
                    } else {
                        console.log("No file inputs found for resume upload");
                    }
                }
            }
            
            // Cover letter upload - standard method
            let coverLetterForm = document.getElementById("s3_upload_for_cover_letter");
            if (coverLetterForm && this.cover_letter) {
                let fileInput = coverLetterForm.querySelector("input[type='file']");
                if (fileInput) {
                    console.log("Found standard cover letter upload field, uploading cover letter");
                    fileInput.files = this.cover_letter.files;
                    fileInput.dispatchEvent(new Event("change", { bubbles: true, cancelable: false }));
                }
            } else {
                // Method 2: Try to find cover letter upload by attribute or class
                let coverLetterInputs = document.querySelectorAll("input[type='file'][name*='cover'], input[type='file'][id*='cover'], input[type='file'][aria-label*='cover']");
                if (coverLetterInputs.length > 0 && this.cover_letter) {
                    console.log("Found alternative cover letter upload field, uploading cover letter");
                    coverLetterInputs[0].files = this.cover_letter.files;
                    coverLetterInputs[0].dispatchEvent(new Event("change", { bubbles: true, cancelable: false }));
                } else if (document.querySelectorAll("input[type='file']").length > 1 && this.cover_letter) {
                    // If there's more than one file input and we already used one for resume
                    const fileInputs = document.querySelectorAll("input[type='file']");
                    console.log("No specific cover letter field found, trying second file input");
                    fileInputs[1].files = this.cover_letter.files;
                    fileInputs[1].dispatchEvent(new Event("change", { bubbles: true, cancelable: false }));
                } else {
                    console.log("No file inputs found for cover letter upload");
                }
            }
            
            // After uploading files, look for and click any "Continue" or "Submit" buttons
            setTimeout(() => {
                const continueButtons = Array.from(document.querySelectorAll('button, input[type="submit"], input[type="button"], a.button'))
                    .filter(el => {
                        const text = el.textContent || el.value || '';
                        return text.toLowerCase().includes('continue') || 
                               text.toLowerCase().includes('submit') || 
                               text.toLowerCase().includes('next') ||
                               text.toLowerCase().includes('apply');
                    });
                
                if (continueButtons.length > 0) {
                    console.log("Found continue/submit button, clicking");
                    continueButtons[0].click();
                }
            }, 1000);
            
        } catch (error) {
            console.error("Error in upload_greenhouse:", error);
            this.logError(error, "upload_greenhouse");
        }
    }

    upload_lever() {
        Array.from(this.form.elements).forEach(element => {
            // Upload resume
            if (element.type == "file" && element.name == "resume"){
                element.files = this.resume_file.files;
                element.dispatchEvent(new Event("change", { bubbles: !0, cancelable: !1 }));
            }
            // Upload cover letter
            if (element.type == "file" && element.name == "coverLetter"){
                element.files = this.cover_letter.files;
                element.dispatchEvent(new Event("change", { bubbles: !0, cancelable: !1 }));
            }
        });
    }
    
    // LinkedIn specific methods
    handle_linkedin() {
        console.log("LinkedIn detected, handling Easy Apply");
        // First click on "Easy Apply" button if present
        this.click_easy_apply();
        
        // Set up event listeners for LinkedIn form submission buttons
        this.setup_linkedin_form_listeners();
        
        // Wait a moment for the Easy Apply form to load and try filling
        setTimeout(() => {
            console.log("Attempting to fill LinkedIn form");
            this.fill_linkedin_form();
        }, 1500);
    }
    
    click_easy_apply() {
        // Find and click the "Easy Apply" button
        console.log("Looking for Easy Apply button");
        
        try {
            // Try different selectors for the Easy Apply button
            let easyApplyButton = null;
            
            // Method 1: Find by text content
            const allButtons = Array.from(document.querySelectorAll('button'));
            easyApplyButton = allButtons.find(button => {
                const buttonText = button.textContent.trim().toLowerCase();
                return buttonText === 'easy apply' || buttonText.includes('easy apply');
            });
            
            // Method 2: Find by class/attributes (common LinkedIn selectors)
            if (!easyApplyButton) {
                easyApplyButton = document.querySelector('.jobs-apply-button');
            }
            
            // Method 3: Find by aria-label
            if (!easyApplyButton) {
                easyApplyButton = allButtons.find(button => {
                    const ariaLabel = button.getAttribute('aria-label');
                    return ariaLabel && (ariaLabel.toLowerCase().includes('apply') || ariaLabel.toLowerCase().includes('easy apply'));
                });
            }
            
            if (easyApplyButton) {
                console.log("Easy Apply button found, clicking");
                easyApplyButton.click();
                
                // Try again after a short delay if the button exists but might not be fully loaded
                setTimeout(() => {
                    if (!document.querySelector('.jobs-easy-apply-content')) {
                        console.log("Trying again to click Easy Apply");
                        easyApplyButton.click();
                    }
                }, 500);
            } else {
                console.log("Easy Apply button not found");
            }
        } catch (error) {
            console.error("Error in click_easy_apply:", error);
            this.logError(error, "click_easy_apply");
        }
    }
    
    fill_linkedin_form() {
        try {
            // Find all form fields in the LinkedIn application modal
            const modal = document.querySelector('.jobs-easy-apply-content, .jobs-easy-apply-modal');
            if (!modal) {
                console.log("LinkedIn application modal not found");
                return;
            }
            
            console.log("LinkedIn form modal found, filling fields");
            
            // Get input fields
            const formFields = modal.querySelectorAll('input, select, textarea');
            formFields.forEach(field => {
                try {
                    // Skip fields that already have a value
                    if ((field.value && field.value.trim() !== "") || 
                        (field.type === 'checkbox' && field.checked) || 
                        field.type === 'hidden' || 
                        field.readOnly) {
                        return;
                    }
                    
                    // Get the label for the field
                    let labelText = '';
                    const fieldId = field.id;
                    if (fieldId) {
                        const label = document.querySelector(`label[for="${fieldId}"]`);
                        if (label) {
                            labelText = label.textContent.trim();
                        }
                    }
                    
                    // If no direct label found, try to get label from parent elements
                    if (!labelText) {
                        let parent = field.parentElement;
                        while (parent && !labelText && parent !== modal) {
                            const labels = parent.querySelectorAll('label, .artdeco-text-input__label, .t-14, .t-bold');
                            if (labels.length > 0) {
                                labelText = labels[0].textContent.trim();
                            }
                            parent = parent.parentElement;
                        }
                    }
                    
                    if (!labelText) {
                        // Try to get aria-label
                        labelText = field.getAttribute('aria-label') || '';
                    }
                    
                    console.log(`Filling field with label: ${labelText}`);
                    
                    // Fill the field based on type
                    if (field.tagName === 'INPUT') {
                        if (field.type === 'text' || field.type === 'email' || field.type === 'tel') {
                            this.fill_text_field(field, labelText);
                        } else if (field.type === 'radio' || field.type === 'checkbox') {
                            this.fill_select_field(field, labelText);
                        }
                    } else if (field.tagName === 'SELECT') {
                        this.fill_select_field(field, labelText);
                    } else if (field.tagName === 'TEXTAREA') {
                        this.fill_text_field(field, labelText);
                    }
                } catch (fieldError) {
                    console.error(`Error processing field:`, fieldError);
                    this.logError(fieldError, `fill_linkedin_form_field_${field.id || field.name || "unknown"}`);
                }
            });
        } catch (error) {
            console.error("Error in fill_linkedin_form:", error);
            this.logError(error, "fill_linkedin_form");
        }
    }
    
    setup_linkedin_form_listeners() {
        try {
            // Listen for clicks on continue/submit buttons to collect data
            document.addEventListener('click', (e) => {
                try {
                    if (e.target.tagName === 'BUTTON' && 
                        (e.target.textContent.includes('Continue') || e.target.textContent.includes('Submit') || 
                         e.target.textContent.includes('Review') || e.target.textContent.includes('Next'))) {
                        
                        // Collect form values before submission
                        this.collect_linkedin_form_values();
                    }
                } catch (buttonError) {
                    console.error("Error in LinkedIn button click handler:", buttonError);
                    this.logError(buttonError, "linkedin_button_click");
                }
            }, true);
        } catch (error) {
            console.error("Error setting up LinkedIn form listeners:", error);
            this.logError(error, "setup_linkedin_form_listeners");
        }
    }
    
    collect_linkedin_form_values() {
        try {
            const modal = document.querySelector('.jobs-easy-apply-content');
            if (!modal) return;
            
            const formFields = modal.querySelectorAll('input, select, textarea');
            formFields.forEach(field => {
                try {
                    // Skip fields that don't have values or are hidden
                    if (!field.value || field.type === 'hidden') return;
                    
                    // Get the label for the field
                    let labelText = '';
                    const fieldId = field.id;
                    if (fieldId) {
                        const label = document.querySelector(`label[for="${fieldId}"]`);
                        if (label) {
                            labelText = label.textContent.trim();
                        }
                    }
                    
                    // If no direct label found, try to get label from parent elements
                    if (!labelText) {
                        let parent = field.parentElement;
                        while (parent && !labelText && parent !== modal) {
                            const labels = parent.querySelectorAll('label, .artdeco-text-input__label');
                            if (labels.length > 0) {
                                labelText = labels[0].textContent.trim();
                            }
                            parent = parent.parentElement;
                        }
                    }
                    
                    if (!labelText) {
                        // Try to get aria-label
                        labelText = field.getAttribute('aria-label') || field.name || field.id || 'unknown_field';
                    }
                    
                    // Store the value
                    let value = '';
                    if (field.type === 'select-one') {
                        value = field.options[field.selectedIndex].text;
                    } else if (field.type === 'checkbox' || field.type === 'radio') {
                        value = field.checked ? (field.value || 'true') : '';
                        if (!value) return; // Skip unchecked boxes
                    } else {
                        value = field.value;
                    }
                    
                    // Add to newLinkedInValues object
                    this.newLinkedInValues[labelText] = value;
                } catch (fieldError) {
                    console.error("Error collecting LinkedIn field value:", fieldError);
                    this.logError(fieldError, "collect_linkedin_field_value");
                }
            });
            
            console.log("Collected LinkedIn form values:", Object.keys(this.newLinkedInValues).length, "fields");
            
            // Consider updating the profile with these values
            if (Object.keys(this.newLinkedInValues).length > 0) {
                this.update_profile_with_linkedin_values();
            }
        } catch (error) {
            console.error("Error collecting LinkedIn form values:", error);
            this.logError(error, "collect_linkedin_form_values");
        }
    }
    
    update_profile_with_linkedin_values() {
        try {
            if (Object.keys(this.newLinkedInValues).length === 0) return;
            
            console.log("Considering updating profile with LinkedIn values");
            
            // Get the current profile
            chrome.storage.local.get(["lastSelectedProfile", "profilesList"], (profileResult) => {
                try {
                    let currentProfile = "default";
                    
                    if (profileResult.lastSelectedProfile && 
                        profileResult.profilesList && 
                        profileResult.profilesList.includes(profileResult.lastSelectedProfile)) {
                        currentProfile = profileResult.lastSelectedProfile;
                    }
                    
                    // Now get data for the current profile
                    let userDataKey = "userdata_" + currentProfile;
                    
                    chrome.storage.local.get([userDataKey, "userdata"], (result) => {
                        try {
                            let userData = result[userDataKey] || (currentProfile === "default" ? result.userdata : null);
                            
                            if (!userData) {
                                console.error("No user data found for profile update");
                                return;
                            }
                            
                            // Parse the userData if it's a string
                            if (typeof userData === 'string') {
                                try {
                                    userData = JSON.parse(userData);
                                } catch (e) {
                                    console.error("Failed to parse userData for update:", e);
                                    return;
                                }
                            }
                            
                            // Only update fields that don't already have values
                            let updatedFields = [];
                            
                            for (const [key, value] of Object.entries(this.newLinkedInValues)) {
                                // Simple mapping for now
                                let userDataKey = key.toLowerCase();
                                
                                // Check if we should update this field
                                if (!userData[userDataKey] && value) {
                                    userData[userDataKey] = value;
                                    updatedFields.push(userDataKey);
                                }
                            }
                            
                            // If we have updates, save them
                            if (updatedFields.length > 0) {
                                console.log(`Updating profile with ${updatedFields.length} new fields:`, updatedFields);
                                
                                // Save the updated data
                                const dataToSave = {};
                                dataToSave[userDataKey] = userData;
                                chrome.storage.local.set(dataToSave, function() {
                                    console.log("Profile updated with LinkedIn values");
                                });
                            } else {
                                console.log("No new LinkedIn values to update in profile");
                            }
                        } catch (storageError) {
                            console.error("Error in storage callback for profile update:", storageError);
                            this.logError(storageError, "update_profile_storage_callback");
                        }
                    });
                } catch (profileError) {
                    console.error("Error in profile result callback:", profileError);
                    this.logError(profileError, "update_profile_result_callback");
                }
            });
        } catch (error) {
            console.error("Error updating profile with LinkedIn values:", error);
            this.logError(error, "update_profile_with_linkedin_values");
        }
    }
}