class AutoFill {
    constructor(resume_json, resume_file, cover_letter=null, job_portal_type=0, manager=null) {
        this.resume_json = resume_json;
        this.resume_file = resume_file;
        this.cover_letter = cover_letter;
        this.job_portal_type = job_portal_type;
        this.manager = manager;
        this.forms = null;
        this.form = null;
    }

    get_forms(){
        this.forms = document.forms;
        this.form = document.forms[0];
    }

    fill_text_field(field, label){
        for(var key in this.resume_json){
            if (label.toLowerCase().includes(key.toLowerCase())){
                field.value = this.resume_json[key];
                field.dispatchEvent(new Event("change", { bubbles: !0, cancelable: !1 }));
                return;
            }
        }
    }

    fill_select_field(field, label){
        for(var key in this.resume_json){
            if (label.toLowerCase().includes(key.toLowerCase())){
                if (field.type == "select-one"){
                    for(var i = 0; i < field.options.length; i++){
                        if (Array.isArray(this.resume_json[key])){
                            this.resume_json[key].forEach(value => {
                                if(field.options[i].value != ""){
                                    if(field.options[i].text.toLowerCase().includes(value.toLowerCase())){
                                        field.options[i].selected = true;
                                        field.options[i].dispatchEvent(new Event("change", { bubbles: !0, cancelable: !1 }));
                                        return;
                                    }
                                }
                            });
                        }else{
                            if(field.options[i].value != ""){
                                if(field.options[i].text.toLowerCase().includes(this.resume_json[key].toLowerCase())){
                                    field.options[i].selected = true;
                                    field.options[i].dispatchEvent(new Event("change", { bubbles: !0, cancelable: !1 }));
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
                                field.checked = true;
                                field.dispatchEvent(new Event("change", { bubbles: !0, cancelable: !1 }));
                                return;
                            }
                        });
                    }else{
                        if (field.parentNode.innerText.toLowerCase().trim() == this.resume_json[key].toLowerCase().trim()){
                            field.checked = true;
                            field.dispatchEvent(new Event("change", { bubbles: !0, cancelable: !1 }));
                            return;
                        }
                    }
                }
            }
        }
    }

    upload_files(){
        switch(this.job_portal_type){
            case CompanyType.greenhouse:
                this.upload_greenhouse();
                break;
            case CompanyType.lever:
                this.upload_lever();
                break;
            case CompanyType.linkedin:
                this.upload_linkedin();
                break;
        }   
        
    }

    fill_resume() {
        this.get_forms();
        
        // Handle LinkedIn specific form filling
        if (this.job_portal_type === CompanyType.linkedin) {
            this.fill_linkedin_fields();
            return;
        }

        // Original form filling logic for other job portals
        var labels = this.form.getElementsByTagName("label");
        for (var i = 0; i < labels.length; i++) {
            var label = labels[i].parentNode.innerText.split("\n")[0]
            var elements = labels[i].parentNode.getElementsByTagName("input");
            for(var j = 0; j < elements.length; j++){
                var element = elements[j];
                if(element != null && element.type != 'hidden') {
                    if (element.type == "text" || element.type == "email"){
                        this.fill_text_field(element, label);
                    }
                    else if (element.type == "radio" || element.type == "checkbox"){
                        this.fill_select_field(element, label);
                    }
                }
            }
            var elements = labels[i].parentNode.getElementsByTagName("select");
            for(var j = 0; j < elements.length; j++){
                var element = elements[j];
                if(element != null && element.type != 'hidden') {
                    this.fill_select_field(element, label);
                }
            }
        }
        this.check_fill_education();
        this.upload_files();
    }

    resume_task() {
        if (this.resume_json !== null && this.resume_file !== null) {
            this.fill_resume();
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

    upload_linkedin() {
        // LinkedIn's file upload is handled through their own interface
        // We'll focus on filling the form fields
        Array.from(this.form.elements).forEach(element => {
            if (element.type === "file") {
                if (element.name.toLowerCase().includes("resume")) {
                    element.files = this.resume_file.files;
                    element.dispatchEvent(new Event("change", { bubbles: true, cancelable: true }));
                }
                if (element.name.toLowerCase().includes("cover") && this.cover_letter !== null) {
                    element.files = this.cover_letter.files;
                    element.dispatchEvent(new Event("change", { bubbles: true, cancelable: true }));
                }
            }
        });
    }

    fill_linkedin_fields() {
        // LinkedIn specific field mapping
        const fieldMappings = {
            'first-name': 'firstname',
            'last-name': 'lastname',
            'email': 'email',
            'phone': 'phone',
            'city': 'city',
            'state': 'state',
            'zip': 'zip',
            'country': 'country',
            'job-title': 'title',
            'company': 'company',
            'school': 'school',
            'degree': 'degree',
            'field-of-study': 'major'
        };

        // Find all input fields
        const inputs = this.form.querySelectorAll('input, select, textarea');
        inputs.forEach(input => {
            const fieldName = input.name || input.id;
            if (!fieldName) return;

            // Check if this field has a mapping
            for (const [linkedinField, resumeField] of Object.entries(fieldMappings)) {
                if (fieldName.toLowerCase().includes(linkedinField)) {
                    if (input.type === 'text' || input.type === 'email' || input.type === 'tel') {
                        this.fill_text_field(input, resumeField);
                    } else if (input.type === 'select-one') {
                        this.fill_select_field(input, resumeField);
                    }
                    break;
                }
            }
        });

        // Handle LinkedIn's dynamic form sections
        this.fill_linkedin_experience();
        this.fill_linkedin_education();
    }

    fill_linkedin_experience() {
        if (!this.resume_json.experiences) return;

        // Find the experience section
        const experienceSection = this.form.querySelector('[data-form-name="experience"]');
        if (!experienceSection) return;

        this.resume_json.experiences.forEach((experience, index) => {
            if (index > 0) {
                // Click "Add experience" button if not the first experience
                const addButton = experienceSection.querySelector('button[aria-label*="Add experience"]');
                if (addButton) addButton.click();
            }

            // Wait for the form to be ready
            setTimeout(() => {
                const inputs = experienceSection.querySelectorAll('input, select');
                inputs.forEach(input => {
                    const fieldName = input.name || input.id;
                    if (!fieldName) return;

                    if (fieldName.toLowerCase().includes('title')) {
                        this.fill_text_field(input, 'title');
                    } else if (fieldName.toLowerCase().includes('company')) {
                        this.fill_text_field(input, 'company');
                    } else if (fieldName.toLowerCase().includes('start-date')) {
                        input.value = experience.startdate;
                        input.dispatchEvent(new Event("change", { bubbles: true, cancelable: true }));
                    } else if (fieldName.toLowerCase().includes('end-date')) {
                        input.value = experience.enddate;
                        input.dispatchEvent(new Event("change", { bubbles: true, cancelable: true }));
                    }
                });
            }, 500 * index); // Add delay for each experience to allow form to update
        });
    }

    fill_linkedin_education() {
        if (!this.resume_json.educations) return;

        // Find the education section
        const educationSection = this.form.querySelector('[data-form-name="education"]');
        if (!educationSection) return;

        this.resume_json.educations.forEach((education, index) => {
            if (index > 0) {
                // Click "Add education" button if not the first education
                const addButton = educationSection.querySelector('button[aria-label*="Add education"]');
                if (addButton) addButton.click();
            }

            // Wait for the form to be ready
            setTimeout(() => {
                const inputs = educationSection.querySelectorAll('input, select');
                inputs.forEach(input => {
                    const fieldName = input.name || input.id;
                    if (!fieldName) return;

                    if (fieldName.toLowerCase().includes('school')) {
                        this.fill_text_field(input, 'school');
                    } else if (fieldName.toLowerCase().includes('degree')) {
                        this.fill_text_field(input, 'degreetype');
                    } else if (fieldName.toLowerCase().includes('field-of-study')) {
                        this.fill_text_field(input, 'major');
                    } else if (fieldName.toLowerCase().includes('start-date')) {
                        input.value = education.startdate;
                        input.dispatchEvent(new Event("change", { bubbles: true, cancelable: true }));
                    } else if (fieldName.toLowerCase().includes('end-date')) {
                        input.value = education.enddate;
                        input.dispatchEvent(new Event("change", { bubbles: true, cancelable: true }));
                    }
                });
            }, 500 * index); // Add delay for each education to allow form to update
        });
    }
}