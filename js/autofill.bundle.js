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
        console.error(`AutoFill Error${context ? ` in ${context}` : ''}:`, error.message || error);
        console.error("Stack trace:", error.stack || "No stack trace available");
        console.error("Current state:", {
            hasResumeData: !!this.resume_json,
            hasResumeFile: !!this.resume_file,
            hasCoverLetter: !!this.cover_letter,
            jobPortalType: this.job_portal_type,
            hasManager: !!this.manager,
            hasForm: !!this.form,
            debugInfo: this.debugInfo
        });
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

    fill_education_greenhouse(education, idx){
        if(idx != 0){
            document.getElementById("add_education").click();
        }
        var school_name = document.getElementById("education_school_name_" + idx);
        school_name.value = education['school_value'];
        school_name.dispatchEvent(new Event("change", { bubbles: !0, cancelable: !1 }));
        var school_name_update = document.getElementById("s2id_education_school_name_" + idx);
        school_name_update.getElementsByClassName("select2-chosen")[0].innerText = education['school'];
        school_name_update.getElementsByClassName("select2-chosen")[0].dispatchEvent(new Event("change", { bubbles: !0, cancelable: !1 }));
        var degree = document.getElementById("education_degree_" + idx);
        var degreeUpdate = document.getElementById("s2id_education_degree_" + idx);
        for(var i = 0; i < degree.options.length; i++){
            if(degree.options[i].value != ""){
                if(degree.options[i].text.toLowerCase().includes(education['degreetype'].toLowerCase())){
                    degree.options[i].selected = true;
                    degree.options[i].dispatchEvent(new Event("change", { bubbles: !0, cancelable: !1 }));
                    degreeUpdate.getElementsByClassName("select2-chosen")[0].innerText = degree.options[i].text;
                    degreeUpdate.getElementsByClassName("select2-chosen")[0].dispatchEvent(new Event("change", { bubbles: !0, cancelable: !1 }));
                    break;
                }
            }
        }
        var discipline = document.getElementById("education_discipline_" + idx);
        var disciplineUpdate = document.getElementById("s2id_education_discipline_" + idx);
        for(var i = 0; i < discipline.options.length; i++){
            if(discipline.options[i].value != ""){
                if(discipline.options[i].text.toLowerCase().includes(education['major'].toLowerCase())){
                    discipline.options[i].selected = true;
                    discipline.options[i].dispatchEvent(new Event("change", { bubbles: !0, cancelable: !1 }));
                    disciplineUpdate.getElementsByClassName("select2-chosen")[0].innerText = discipline.options[i].text;
                    disciplineUpdate.getElementsByClassName("select2-chosen")[0].dispatchEvent(new Event("change", { bubbles: !0, cancelable: !1 }));
                    break;
                }
            }
        }
        var parent = school_name.parentNode.parentNode;
        var start_date = parent.getElementsByClassName("start-date-year")[0];
        var end_date = parent.getElementsByClassName("end-date-year")[0];
        start_date.value = education['startdate'].substring(0, start_date.maxLength);
        start_date.dispatchEvent(new Event("change", { bubbles: !0, cancelable: !1 }));
        end_date.value = education['enddate'].substring(0, end_date.maxLength);
        end_date.dispatchEvent(new Event("change", { bubbles: !0, cancelable: !1 }));
    }

    fill_experience_greenhouse(experience, idx){
        if(idx != 0){
            document.getElementById("add_experience").click();
        }
        var company_name = document.getElementById("experience_company_name_" + idx);
        var title = document.getElementById("experience_title_" + idx);
        var titleUpdate = document.getElementById("s2id_experience_title_" + idx);
        for(var i = 0; i < title.options.length; i++){
            if(title.options[i].value != ""){
                if(title.options[i].text.toLowerCase().includes(experience['title'].toLowerCase())){
                    title.options[i].selected = true;
                    title.options[i].dispatchEvent(new Event("change", { bubbles: !0, cancelable: !1 }));
                    titleUpdate.getElementsByClassName("select2-chosen")[0].innerText = title.options[i].text;
                    titleUpdate.getElementsByClassName("select2-chosen")[0].dispatchEvent(new Event("change", { bubbles: !0, cancelable: !1 }));
                    break;
                }
            }
        }
        var parent = company_name.parentNode.parentNode;
        var start_date = parent.getElementsByClassName("start-date-year")[0];
        var end_date = parent.getElementsByClassName("end-date-year")[0];
        start_date.value = experience['startdate'].substring(0, start_date.maxLength);
        start_date.dispatchEvent(new Event("change", { bubbles: !0, cancelable: !1 }));
        end_date.value = experience['enddate'].substring(0, end_date.maxLength);
        end_date.dispatchEvent(new Event("change", { bubbles: !0, cancelable: !1 }));
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
        // Upload resume
        if (this.resume_file !== null) {
            var _form = document.getElementById("s3_upload_for_resume");
            var _file_input = _form.querySelector("input[type='file']");
            _file_input.files = this.resume_file.files;
            _file_input.dispatchEvent(new Event("change", { bubbles: !0, cancelable: !1 }));
        }

        // Upload cover letter
        if (this.cover_letter !== null) {
            var _form = document.getElementById("s3_upload_for_cover_letter");
            var _file_input = _form.querySelector("input[type='file']");
            _file_input.files = this.cover_letter.files;
            _file_input.dispatchEvent(new Event("change", { bubbles: !0, cancelable: !1 }));
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
    }
    
    fill_linkedin_form() {
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
        });
    }
    
    setup_linkedin_form_listeners() {
        // Listen for clicks on continue/submit buttons to collect data
        document.addEventListener('click', (e) => {
            if (e.target.tagName === 'BUTTON' && 
                (e.target.textContent.includes('Continue') || e.target.textContent.includes('Submit') || 
                 e.target.textContent.includes('Review') || e.target.textContent.includes('Next'))) {
                
                // Collect form values before submission
                this.collect_linkedin_form_values();
            }
        }, true);
    }
    
    collect_linkedin_form_values() {
        const modal = document.querySelector('.jobs-easy-apply-content');
        if (!modal) return;
        
        const formFields = modal.querySelectorAll('input, select, textarea');
        formFields.forEach(field => {
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
            
            // Update the values collection
            if (value && labelText) {
                this.newLinkedInValues[labelText] = value;
            }
        });
        
        // After collecting all values, update the user's profile data
        this.update_profile_with_linkedin_values();
    }
    
    update_profile_with_linkedin_values() {
        if (Object.keys(this.newLinkedInValues).length === 0) return;
        
        // Get current profile
        chrome.storage.local.get(["lastSelectedProfile", "profilesList"], (profileResult) => {
            let currentProfile = "default";
            
            // Set current profile
            if (profileResult.lastSelectedProfile && 
                profileResult.profilesList && 
                profileResult.profilesList.includes(profileResult.lastSelectedProfile)) {
                currentProfile = profileResult.lastSelectedProfile;
            }
            
            // Get the user data for the current profile
            const userDataKey = "userdata_" + currentProfile;
            
            chrome.storage.local.get([userDataKey, "userdata"], (result) => {
                let userData = result[userDataKey] || (currentProfile === "default" ? result.userdata : null);
                
                if (userData) {
                    // Update userData with new values
                    let updatedData = false;
                    
                    for (const [key, value] of Object.entries(this.newLinkedInValues)) {
                        // Look for matching keys in userData
                        for (const userKey in userData) {
                            if (key.toLowerCase().includes(userKey.toLowerCase()) || 
                                userKey.toLowerCase().includes(key.toLowerCase())) {
                                // Don't override existing values unless they're empty
                                if (!userData[userKey] || userData[userKey] === "") {
                                    userData[userKey] = value;
                                    updatedData = true;
                                }
                            }
                        }
                        
                        // If no matching key found, add as a new field
                        if (!updatedData) {
                            const newKey = key.toLowerCase().replace(/[^a-z0-9]/g, ' ').trim().replace(/\s+/g, ' ');
                            if (newKey && !userData[newKey]) {
                                userData[newKey] = value;
                                updatedData = true;
                            }
                        }
                    }
                    
                    // Save updated user data back to storage
                    if (updatedData) {
                        const dataToSave = {};
                        dataToSave[userDataKey] = userData;
                        chrome.storage.local.set(dataToSave, () => {
                            console.log("Profile updated with LinkedIn form values");
                        });
                    }
                }
            });
        });
    }
}