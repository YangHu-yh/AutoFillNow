const CompanyType  = {
    greenhouse: 'greenhouse',
    lever: 'lever',
    linkedin: 'linkedin',
    generic: 'generic'
}

class CompanyData{
    constructor(currentUrl, exeManager){
        this.currentUrl = currentUrl;
        console.log("Analyzing URL:", currentUrl);
        this.job_portal_type = this.getJobPortalName();
        this.company_name = this.getCompanyName();
        console.log(`Detected job portal: ${this.job_portal_type}, company: ${this.company_name}`);
        exeManager.change();
    }

    getCompanyName(){
        if (this.job_portal_type === CompanyType.greenhouse){
            try {
                return this.currentUrl.split('/')[3];
            } catch (e) {
                return 'unknown';
            }
        }
        if (this.job_portal_type === CompanyType.lever){
            try {
                return this.currentUrl.split('/')[3];
            } catch (e) {
                return 'unknown';
            }
        }
        if (this.job_portal_type === CompanyType.linkedin){
            // For LinkedIn, we'll extract company name if available or return 'linkedin'
            try {
                if (this.currentUrl.includes('/company/')) {
                    return this.currentUrl.split('/company/')[1].split('/')[0];
                }
                if (this.currentUrl.includes('/jobs/view/')) {
                    return 'linkedin-job';
                }
            } catch (e) {
                // If we fail to parse the URL, just return linkedin
            }
            return 'linkedin';
        }
        // If the job portal type is generic or unknown, try to extract domain
        try {
            const urlObj = new URL(this.currentUrl);
            return urlObj.hostname;
        } catch (e) {
            return 'unknown';
        }
    }

    getJobPortalName(){
        // Special handling for job-boards.greenhouse.io domain
        if (this.currentUrl.includes('job-boards.greenhouse.io')) {
            console.log("Direct match for job-boards.greenhouse.io domain - high priority detection");
            return CompanyType.greenhouse;
        }
        
        // Check for specific job portals first
        
        // Check for Greenhouse - expanded URL patterns
        if (this.currentUrl.includes('greenhouse.io') || 
            this.currentUrl.includes('boards.greenhouse.io') || 
            this.currentUrl.includes('job_app?for=') || 
            this.currentUrl.includes('greenhouse.io/embed')){
            console.log("Detected Greenhouse job portal via URL pattern");
            return CompanyType.greenhouse;
        }
        
        // Check for company career pages that use Greenhouse
        try {
            // Check for Apply button (common in job-boards.greenhouse.io)
            const applyButton = document.querySelector('button[aria-label="Apply"], button.btn--pill');
            if (applyButton) {
                console.log("Detected Greenhouse job portal via Apply button");
                return CompanyType.greenhouse;
            }
            
            // Look for Greenhouse scripts or elements in the page
            const greenhouseElements = document.querySelectorAll(
                'script[src*="greenhouse.io"], link[href*="greenhouse.io"], iframe[src*="greenhouse.io"]'
            );
            if (greenhouseElements.length > 0) {
                console.log("Detected Greenhouse job portal via page elements");
                return CompanyType.greenhouse;
            }
            
            // Check for specific Greenhouse form elements
            const greenhouseForms = document.querySelectorAll(
                'form[action*="greenhouse.io"], #s3_upload_for_resume, #s3_upload_for_cover_letter, ' +
                'button[aria-label="Apply"], .gh-button'
            );
            if (greenhouseForms.length > 0) {
                console.log("Detected Greenhouse job portal via form elements");
                return CompanyType.greenhouse;
            }
            
            // Check for Greenhouse content in the page
            const pageContent = document.body ? document.body.textContent : '';
            if (pageContent && (
                pageContent.includes('Powered by Greenhouse') || 
                pageContent.includes('greenhouse.io') ||
                document.querySelector('footer svg[aria-label="Greenhouse logo"]')
            )) {
                console.log("Detected Greenhouse job portal via page content");
                return CompanyType.greenhouse;
            }
        } catch (e) {
            console.error("Error checking for Greenhouse elements:", e);
        }
        
        if (this.currentUrl.includes('lever.co')){
            return CompanyType.lever;
        }
        if (this.currentUrl.includes('linkedin.com')){
            return CompanyType.linkedin;
        }
        
        // If we can't identify a specific job portal, use generic handling
        // This will enable autofill to work on all websites
        return CompanyType.generic;
    }

    printCompanyData(){
        console.log(`Company Name: ${this.company_name}`);
        console.log(`Portal Name: ${this.job_portal_type}`);
    }
}