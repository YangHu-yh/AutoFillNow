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
        // Check for specific job portals first
        if (this.currentUrl.includes('greenhouse.io')){
            return CompanyType.greenhouse;
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