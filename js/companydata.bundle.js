const CompanyType  = {
    greenhouse: 'greenhouse',
    lever: 'lever',
    linkedin: 'linkedin'
}

class CompanyData{
    constructor(currentUrl, exeManager){
        this.currentUrl = currentUrl;
        this.job_portal_type = this.getJobPortalName();
        this.company_name = this.getCompanyName();
        exeManager.change();
    }

    getCompanyName(){
        if (this.job_portal_type === 'greenhouse'){
            return this.currentUrl.split('/')[3];
        }
        if (this.job_portal_type === 'lever'){
            return this.currentUrl.split('/')[3];
        }
        if (this.job_portal_type === 'linkedin'){
            // LinkedIn job URLs typically contain the company name in the path
            const pathParts = this.currentUrl.split('/');
            const jobIndex = pathParts.findIndex(part => part === 'jobs');
            if (jobIndex !== -1 && jobIndex > 0) {
                return pathParts[jobIndex - 1];
            }
            return null;
        }
    }

    getJobPortalName(){
        if (this.currentUrl.includes('greenhouse')){
            return CompanyType.greenhouse;
        }
        if (this.currentUrl.includes('lever')){
            return CompanyType.lever;
        }
        if (this.currentUrl.includes('linkedin.com/jobs')){
            return CompanyType.linkedin;
        }
    }

    printCompanyData(){
        console.log(`Company Name: ${this.company_name}`);
        console.log(`Portal Name: ${this.job_portal_type}`);
    }
}