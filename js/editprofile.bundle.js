var add_employment = document.getElementById("addemployment");
var add_education = document.getElementById("addeducation");
var inputemployment = document.getElementById("inputemployment");
var inputeducation = document.getElementById("inputeducation");
var profileSelector = document.getElementById("profileSelector");
var newProfileName = document.getElementById("newProfileName");
var createProfile = document.getElementById("createProfile");
var deleteProfile = document.getElementById("deleteProfile");

// Current active profile
var currentProfile = "default";
var profilesList = [];

// Add event listeners for profile management
createProfile.addEventListener("click", createNewProfile);
deleteProfile.addEventListener("click", deleteCurrentProfile);
profileSelector.addEventListener("change", loadSelectedProfile);

add_employment.addEventListener("click", add_employment_function);
add_education.addEventListener("click", add_education_function)
var school_data = null;
var school_list = null;

function get_school_data() {
    fetch(chrome.runtime.getURL("data/schools.json")).then(function (response) {
        return response.json();
    }).then(function (data) {
        school_data = data;
        school_list = Object.keys(school_data);
        loadProfilesList(); // Load the profile list first
    });
}
get_school_data();

var employment_count = 0;

function add_employment_function() {
    employment_count += 1;
    var company_num = employment_count.toString();
    const new_employment = document.createElement("div");
    new_employment.id = 'employment' + company_num;
    new_employment.classList.add("my-2", "employment");
    var employmentHtml = '';
    employmentHtml += '<div class="form-row">';
    employmentHtml += '<div class="form-group col-md-4">';
    employmentHtml += '<label for="inputcompany">Company Name</label>';
    employmentHtml += '<input type="text" data-type='+new_employment.id+' class="form-control form-control-sm" id="inputcompany" placeholder="Company Name" required>';
    employmentHtml += '</div>';
    employmentHtml += '<div class="form-group col-md-4">';
    employmentHtml += '<label for="inputpositiontitle">Position Title</label>';
    employmentHtml += '<input type="text" data-type='+new_employment.id+' class="form-control form-control-sm" id="inputpositiontitle" placeholder="Position Title" required>';
    employmentHtml += '</div>';
    employmentHtml += '<div class="form-group col-md-4">';
    employmentHtml += '<label for="inputlocation">Location</label>';
    employmentHtml += '<input type="text" data-type='+new_employment.id+' class="form-control form-control-sm" id="inputlocation" placeholder="Location" required>';
    employmentHtml += '</div>';
    employmentHtml += '</div>';
    employmentHtml += '<div class="form-row">';
    employmentHtml += '<div class="form-group col-md-4">';
    employmentHtml += '<label for="inputstartdate">Start Date</label>';
    employmentHtml += '<input type="month" data-type='+new_employment.id+' class="form-control form-control-sm" id="inputstartdate" required>';
    employmentHtml += '</div>';
    employmentHtml += '<div class="form-group col-md-4">';
    employmentHtml += '<label for="inputenddate">End Date</label>';
    employmentHtml += '<input type="month" data-type='+new_employment.id+' class="form-control form-control-sm" id="inputenddate">';
    employmentHtml += '</div>';
    employmentHtml += '<div class="form-group col-md-4">';
    employmentHtml += '<label for="inputexperiencetype">Experience Type</label>';
    employmentHtml += '<select id="inputexperiencetype" data-type='+new_employment.id+' class="form-control form-control-sm" required>';
    employmentHtml += '<option value="" selected>Choose...</option>';
    employmentHtml += '<option value="Full Time" >Full Time</option>';
    employmentHtml += '<option value="Part Time">Part Time</option>';
    employmentHtml += '<option value="Internship">Internship</option>';
    employmentHtml += '</select>';
    employmentHtml += '</div>';
    employmentHtml += '</div>';
    employmentHtml += '<div class="form-row">';
    employmentHtml += '<div class="form-group col-md-10">';
    employmentHtml += '<label for="inputdescription">Description</label>';
    employmentHtml += '<textarea data-type='+new_employment.id+' class="form-control form-control-sm" id="inputdescription" rows="3"></textarea>';
    employmentHtml += '</div>';
    employmentHtml += '<div class="form-group col-md-2 d-flex align-items-end mt-2">';
    employmentHtml += '<button type="button" class="btn btn-secondary btn-sm col-md-12" id="delete'+new_employment.id+'">Delete</button>';
    employmentHtml += '</div>';
    employmentHtml += '</div>';
    new_employment.innerHTML = employmentHtml;
    inputemployment.appendChild(new_employment);
    var delete_company = document.getElementById("delete"+new_employment.id);
    delete_company.id = new_employment.id;
    delete_company.addEventListener("click", delete_company_function);
}

function delete_company_function() {
    var delete_company = document.getElementById(this.id);
    inputemployment.removeChild(delete_company);
}

var education_count = 0;

function add_education_function() {
    education_count += 1;
    var school_num = education_count.toString();
    const new_education = document.createElement("div");
    new_education.id = 'education' + school_num;
    new_education.classList.add("my-2", "education");
    var educationHtml = '';
    educationHtml += '<div class="form-row">';
    educationHtml += '<div class="form-group col-md-4">';
    educationHtml += '<label for="inputschool">School</label>';
    educationHtml += '<input type="text" data-type='+new_education.id+' class="form-control form-control-sm school" id="inputschool" placeholder="School" required>';
    educationHtml += '</div>';
    educationHtml += '<div class="form-group col-md-4">';
    educationHtml += '<label for="inputmajor">Major</label>';
    educationHtml += '<input type="text" data-type='+new_education.id+' class="form-control form-control-sm" id="inputmajor" placeholder="Major" required>';
    educationHtml += '</div>';
    educationHtml += '<div class="form-group col-md-4">';
    educationHtml += '<label for="inputdegreetype">Degree Type</label>';
    educationHtml += '<select id="inputdegreetype" data-type='+new_education.id+' class="form-control form-control-sm" required>';
    educationHtml += '<option value="" selected>Choose...</option>';
    educationHtml += '<option value="Bachelor">Bachelor\'s</option>';
    educationHtml += '<option value="Master">Master\'s</option>';
    educationHtml += '<option value="PhD">PhD</option>';
    educationHtml += '<option value="MBA">MBA</option>';
    educationHtml += '</select>';
    educationHtml += '</div>';
    educationHtml += '</div>';
    educationHtml += '<div class="form-row">';
    educationHtml += '<div class="form-group col-md-4">';
    educationHtml += '<label for="inputstartdate">Start Date</label>';
    educationHtml += '<input type="month" data-type='+new_education.id+' class="form-control form-control-sm" id="inputstartdate" required>';
    educationHtml += '</div>';
    educationHtml += '<div class="form-group col-md-4">';
    educationHtml += '<label for="inputenddate">End Date</label>';
    educationHtml += '<input type="month" data-type='+new_education.id+' class="form-control form-control-sm" id="inputenddate">';
    educationHtml += '</div>';
    educationHtml += '<div class="form-group col-md-2">';
    educationHtml += '<label for="inputgpa">GPA</label>';
    educationHtml += '<input type="text" data-type='+new_education.id+' class="form-control form-control-sm" id="inputgpa" placeholder="GPA">';
    educationHtml += '</div>';
    educationHtml += '<div class="form-group col-md-2 d-flex align-items-end mt-2">';
    educationHtml += '<button type="button" class="btn btn-secondary btn-sm col-md-12" id="delete'+new_education.id+'">Delete</button>';
    educationHtml += '</div>';
    educationHtml += '</div>';
    new_education.innerHTML = educationHtml;
    inputeducation.appendChild(new_education);
    var delete_education = document.getElementById("delete"+new_education.id);
    delete_education.id = new_education.id;
    delete_education.addEventListener("click", delete_education_function);
    $(".school").on("focus", function(){
        $(this).autocomplete({
            minLength: 3,
            source: school_list
        });
    });
}

function delete_education_function() {
    var delete_education = document.getElementById(this.id);
    inputeducation.removeChild(delete_education);
}

function get_form_data() {
    var data = {};
    var editprofileform = document.forms["editprofileform"];
    data["first name"] = editprofileform["inputfirstname"].value;
    data["last name"] = editprofileform["inputlastname"].value;
    data["email"] = editprofileform["inputemail"].value;
    data["phone"] = editprofileform["inputphone"].value;
    data["address"] = editprofileform["inputaddress"].value;
    data["city"] = editprofileform["inputcity"].value;
    data["state"] = editprofileform["inputstate"].value;
    data["zip"] = editprofileform["inputzip"].value;
    data["linkedin"] = editprofileform["inputlinkedin"].value;
    data["github"] = editprofileform["inputgithub"].value;
    data["website"] = editprofileform["inputwebsite"].value;
    data["ethnicity"] = editprofileform["inputethnicity"].value;
    data["gender"] = editprofileform["inputgender"].value;
    data["lgbtq"] = editprofileform["inputlgbtq"].value;
    data["authorization"] = editprofileform["inputauthorization"].value;
    data["sponsorship"] = editprofileform["inputsponsorship"].value;
    data["disability"] = editprofileform["inputdisability"].value;
    data["veteran"] = editprofileform["inputveteran"].value;
    var employments = editprofileform.getElementsByClassName("employment");
    var employment_data = [];
    for (var i = 0; i < employments.length; i++) {
        var employeeData = {};
        var employment = employments[i];
        employeeData["company"] = employment.querySelector("#inputcompany").value;
        employeeData["position"] = employment.querySelector("#inputpositiontitle").value;
        employeeData["location"] = employment.querySelector("#inputlocation").value;
        employeeData["startdate"] = employment.querySelector("#inputstartdate").value;
        employeeData["enddate"] = employment.querySelector("#inputenddate").value;
        employeeData["experienceType"] = employment.querySelector("#inputexperiencetype").value;
        employeeData["description"] = employment.querySelector("#inputdescription").value;
        employment_data.push(employeeData);
    }
    data["employments"] = employment_data;
    var educations = editprofileform.getElementsByClassName("education");
    var education_data = [];
    for (var i = 0; i < educations.length; i++) {
        var educationData = {};
        var education = educations[i];
        educationData["school"] = education.querySelector("#inputschool").value;
        educationData["major"] = education.querySelector("#inputmajor").value;
        educationData["degreetype"] = education.querySelector("#inputdegreetype").value;
        educationData["startdate"] = education.querySelector("#inputstartdate").value;
        educationData["enddate"] = education.querySelector("#inputenddate").value;
        educationData["gpa"] = education.querySelector("#inputgpa").value;
        education_data.push(educationData);
    }
    if (editprofileform["inputresume"].files.length > 0) {
        var resume_file = editprofileform["inputresume"].files[0];
        const reader = new FileReader();
        reader.onload = (e) => {
            var fileData = {}
            fileData["name"] = resume_file.name;
            fileData["type"] = resume_file.type;
            fileData["size"] = resume_file.size;
            fileData["lastModified"] = resume_file.lastModified;
            fileData["lastModifiedDate"] = resume_file.lastModifiedDate;
            fileData["text"] = e.target.result;
            
            // Save with profile-specific key
            let resumeKey = "resume_" + currentProfile;
            let resumeData = {};
            resumeData[resumeKey] = fileData;
            chrome.storage.local.set(resumeData, function () {
                console.log("Resume saved for profile: " + currentProfile);
                
                // Save to default key for compatibility
                if (currentProfile === "default") {
                    chrome.storage.local.set({"resume": fileData});
                }
            });
        };
        reader.readAsDataURL(resume_file);
    }
    if (editprofileform["inputcoverletter"].files.length > 0) {
        var cover_letter_file = editprofileform["inputcoverletter"].files[0];
        const reader2 = new FileReader();
        reader2.onload = (e) => {
            var fileData = {}
            fileData["name"] = cover_letter_file.name;
            fileData["type"] = cover_letter_file.type;
            fileData["size"] = cover_letter_file.size;
            fileData["lastModified"] = cover_letter_file.lastModified;
            fileData["lastModifiedDate"] = cover_letter_file.lastModifiedDate;
            fileData["text"] = e.target.result;
            
            // Save with profile-specific key
            let coverletterKey = "coverletter_" + currentProfile;
            let coverletterData = {};
            coverletterData[coverletterKey] = fileData;
            chrome.storage.local.set(coverletterData, function () {
                console.log("Cover letter saved for profile: " + currentProfile);
                
                // Save to default key for compatibility
                if (currentProfile === "default") {
                    chrome.storage.local.set({"coverletter": fileData});
                }
            });
        };
        reader2.readAsDataURL(cover_letter_file);
    }
    data["educations"] = education_data;
    return data;
}

function processData(data) {
    data["full name"] = data["first name"] + " " + data["last name"];
    data["your name"] = data["full name"];
    if (data["ethnicity"].includes("Asian")) {
        data["race"] = ["asian", data["ethnicity"]];
        data["Hispanic/Latino"] = "No";
    } else if (data["ethnicity"] === "Hispanic / latino") {
        data["Hispanic/Latino"] = "Yes";
    }
    else{
        data["race"] = [data["ethnicity"]];
        data["Hispanic/Latino"] = "No";
    }
    data["authorized to work"] = data["authorization"];
    for (var i = 0; i<data["employments"].length; i++){
        var tempStart = [];
        tempStart.push(data["employments"][i]["startdate"]);
        tempStart.push(data["employments"][i]["startdate"].split("-")[0]);
        data["employments"][i]["start"] = tempStart;
        var tempEnd = [];
        tempEnd.push(data["employments"][i]["enddate"]);
        tempEnd.push(data["employments"][i]["enddate"].split("-")[0]);
        data["employments"][i]["end"] = tempEnd;
    }
    for (var i = 0; i<data["educations"].length; i++){
        var tempStart = [];
        tempStart.push(data["educations"][i]["startdate"]);
        tempStart.push(data["educations"][i]["startdate"].split("-")[0]);
        data["educations"][i]["start"] = tempStart;
        var tempEnd = [];
        tempEnd.push(data["educations"][i]["enddate"]);
        tempEnd.push(data["educations"][i]["enddate"].split("-")[0]);
        data["educations"][i]["end"] = tempEnd;
        data["educations"][i]["school_value"] = school_data[data["educations"][i]["school"]];
    }
    return data;
}

let save = document.getElementById("save");
save.addEventListener("click", saveFormData);

function saveFormData(e) {
    e.preventDefault();
    var editprofileform = document.forms["editprofileform"];
    var data = get_form_data();
    data = processData(data);
    
    // Save data with profile-specific key
    let userdataKey = "userdata_" + currentProfile;
    let userdataObj = {};
    userdataObj[userdataKey] = data;
    chrome.storage.local.set(userdataObj, function () {
        console.log("Data saved for profile: " + currentProfile);
        
        // Also save a copy in the default userdata key for compatibility
        if (currentProfile === "default") {
            chrome.storage.local.set({"userdata": data});
        }
        
        alert("Profile saved: " + currentProfile);
    });
}

function checkAndLoadData() {
    // Load user data for current profile
    chrome.storage.local.get("userdata_" + currentProfile, function (result) {
        var userData = result["userdata_" + currentProfile];
        
        // If no data exists for this profile but it's the default, try to get from legacy storage
        if (!userData && currentProfile === "default") {
            chrome.storage.local.get("userdata", function(legacyResult) {
                if (legacyResult.userdata) {
                    userData = legacyResult.userdata;
                    populateForm(userData);
                } else {
                    clearForm();
                }
            });
        } else if (userData) {
            populateForm(userData);
        } else {
            clearForm();
        }
    });
    
    // Load resume for current profile
    chrome.storage.local.get("resume_" + currentProfile, function (result) {
        var resume = result["resume_" + currentProfile];
        
        // Try legacy storage for default profile
        if (!resume && currentProfile === "default") {
            chrome.storage.local.get("resume", function(legacyResult) {
                if (legacyResult.resume) {
                    resume = legacyResult.resume;
                    loadResumeFile(resume);
                }
            });
        } else if (resume) {
            loadResumeFile(resume);
        }
    });
    
    // Load cover letter for current profile
    chrome.storage.local.get("coverletter_" + currentProfile, function (result) {
        var coverletter = result["coverletter_" + currentProfile];
        
        // Try legacy storage for default profile
        if (!coverletter && currentProfile === "default") {
            chrome.storage.local.get("coverletter", function(legacyResult) {
                if (legacyResult.coverletter) {
                    coverletter = legacyResult.coverletter;
                    loadCoverLetterFile(coverletter);
                }
            });
        } else if (coverletter) {
            loadCoverLetterFile(coverletter);
        }
    });
}

function populateForm(userData) {
    var editprofileform = document.forms["editprofileform"];
    
    // Clear existing entries
    clearForm();
    
    // Populate general fields
    editprofileform["inputfirstname"].value = userData["first name"] || "";
    editprofileform["inputlastname"].value = userData["last name"] || "";
    editprofileform["inputemail"].value = userData["email"] || "";
    editprofileform["inputphone"].value = userData["phone"] || "";
    editprofileform["inputaddress"].value = userData["address"] || "";
    editprofileform["inputcity"].value = userData["city"] || "";
    editprofileform["inputstate"].value = userData["state"] || "";
    editprofileform["inputzip"].value = userData["zip"] || "";
    editprofileform["inputlinkedin"].value = userData["linkedin"] || "";
    editprofileform["inputgithub"].value = userData["github"] || "";
    editprofileform["inputwebsite"].value = userData["website"] || "";
    editprofileform["inputethnicity"].value = userData["ethnicity"] || "";
    editprofileform["inputgender"].value = userData["gender"] || "";
    editprofileform["inputlgbtq"].value = userData["lgbtq"] || "";
    editprofileform["inputauthorization"].value = userData["authorization"] || "";
    editprofileform["inputsponsorship"].value = userData["sponsorship"] || "";
    editprofileform["inputdisability"].value = userData["disability"] || "";
    editprofileform["inputveteran"].value = userData["veteran"] || "";
    
    // Populate employment sections
    var employments = userData["employments"] || [];
    for (var i = 0; i < employments.length; i++) {
        add_employment_function();
    }
    var employmentsfield = editprofileform.getElementsByClassName("employment");
    for (var i = 0; i < employmentsfield.length; i++) {
        var employment = employmentsfield[i];
        employment.querySelector("#inputcompany").value = employments[i]["company"] || "";
        employment.querySelector("#inputpositiontitle").value = employments[i]["position"] || "";
        employment.querySelector("#inputlocation").value = employments[i]["location"] || "";
        employment.querySelector("#inputstartdate").value = employments[i]["startdate"] || "";
        employment.querySelector("#inputenddate").value = employments[i]["enddate"] || "";
        employment.querySelector("#inputexperiencetype").value = employments[i]["experienceType"] || "";
        employment.querySelector("#inputdescription").value = employments[i]["description"] || "";
    }
    
    // Populate education sections
    var educations = userData["educations"] || [];
    for (var i = 0; i < educations.length; i++) {
        add_education_function();
    }
    var educationsField = editprofileform.getElementsByClassName("education");
    for (var i = 0; i < educationsField.length; i++) {
        var education = educationsField[i];
        education.querySelector("#inputschool").value = educations[i]["school"] || "";
        education.querySelector("#inputmajor").value = educations[i]["major"] || "";
        education.querySelector("#inputdegreetype").value = educations[i]["degreetype"] || "";
        education.querySelector("#inputstartdate").value = educations[i]["startdate"] || "";
        education.querySelector("#inputenddate").value = educations[i]["enddate"] || "";
        education.querySelector("#inputgpa").value = educations[i]["gpa"] || "";
    }
}

function loadResumeFile(resume) {
    if (resume) {
        var editprofileform = document.forms["editprofileform"];
        var dataTransfer = new DataTransfer();
        dataTransfer.items.add(new File([resume["text"]], resume["name"], {type: "application/pdf"}));
        editprofileform["inputresume"].files = dataTransfer.files;
    }
}

function loadCoverLetterFile(coverletter) {
    if (coverletter) {
        var editprofileform = document.forms["editprofileform"];
        var dataTransfer = new DataTransfer();
        dataTransfer.items.add(new File([coverletter['text']], coverletter["name"], {type: "application/pdf"}));
        editprofileform["inputcoverletter"].files = dataTransfer.files;
    }
}

function clearForm() {
    var editprofileform = document.forms["editprofileform"];
    editprofileform.reset();
    
    // Clear employment sections
    while (inputemployment.firstChild) {
        inputemployment.removeChild(inputemployment.firstChild);
    }
    
    // Clear education sections
    while (inputeducation.firstChild) {
        inputeducation.removeChild(inputeducation.firstChild);
    }
    
    employment_count = 0;
    education_count = 0;
}

// Profile Management Functions
function loadProfilesList() {
    chrome.storage.local.get(["profilesList"], function(result) {
        if (result.profilesList) {
            profilesList = result.profilesList;
        } else {
            // Initialize with the default profile if none exists
            profilesList = ["default"];
            chrome.storage.local.set({profilesList: profilesList});
        }
        
        // Populate the dropdown
        updateProfilesDropdown();
        
        // Load the default or last selected profile
        chrome.storage.local.get(["lastSelectedProfile"], function(result) {
            if (result.lastSelectedProfile && profilesList.includes(result.lastSelectedProfile)) {
                currentProfile = result.lastSelectedProfile;
                profileSelector.value = currentProfile;
            } else {
                currentProfile = profilesList[0];
                profileSelector.value = currentProfile;
            }
            checkAndLoadData();
        });
    });
}

function updateProfilesDropdown() {
    // Clear existing options except the placeholder
    while (profileSelector.options.length > 1) {
        profileSelector.remove(1);
    }
    
    // Add profiles to dropdown
    profilesList.forEach(function(profile) {
        var option = document.createElement("option");
        option.value = profile;
        option.text = profile;
        profileSelector.add(option);
    });
}

function createNewProfile() {
    var profileName = newProfileName.value.trim();
    
    if (!profileName) {
        alert("Please enter a profile name");
        return;
    }
    
    if (profilesList.includes(profileName)) {
        alert("A profile with this name already exists");
        return;
    }
    
    // Add new profile to list
    profilesList.push(profileName);
    chrome.storage.local.set({profilesList: profilesList}, function() {
        // Update dropdown
        updateProfilesDropdown();
        
        // Switch to new profile
        currentProfile = profileName;
        profileSelector.value = currentProfile;
        
        // Save current profile as last selected
        chrome.storage.local.set({lastSelectedProfile: currentProfile});
        
        // Clear form for new profile
        clearForm();
        
        alert("New profile created: " + profileName);
    });
}

function deleteCurrentProfile() {
    if (profilesList.length <= 1) {
        alert("You cannot delete the only profile");
        return;
    }
    
    if (confirm("Are you sure you want to delete the profile: " + currentProfile + "?")) {
        // Remove from list
        var index = profilesList.indexOf(currentProfile);
        if (index > -1) {
            profilesList.splice(index, 1);
        }
        
        // Delete profile data
        chrome.storage.local.remove([
            "userdata_" + currentProfile,
            "resume_" + currentProfile,
            "coverletter_" + currentProfile
        ]);
        
        // Update storage
        chrome.storage.local.set({profilesList: profilesList}, function() {
            // Update dropdown
            updateProfilesDropdown();
            
            // Switch to first profile
            currentProfile = profilesList[0];
            profileSelector.value = currentProfile;
            
            // Save current profile as last selected
            chrome.storage.local.set({lastSelectedProfile: currentProfile});
            
            // Load selected profile data
            checkAndLoadData();
            
            alert("Profile deleted");
        });
    }
}

function loadSelectedProfile() {
    var selectedProfile = profileSelector.value;
    
    if (!selectedProfile) return;
    
    currentProfile = selectedProfile;
    
    // Save as last selected
    chrome.storage.local.set({lastSelectedProfile: currentProfile}, function() {
        // Load profile data
        checkAndLoadData();
    });
}

