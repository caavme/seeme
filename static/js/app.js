// Resume Builder Web App JavaScript

// Global variables
let resumeData = {};
let currentFilename = null;

// Initialize the application
document.addEventListener('DOMContentLoaded', function () {
    loadData();
    initializeEventListeners();
    updateCurrentFilename();
    populateFormFields(); // Add this to populate fields on page load
});

// Initialize event listeners
function initializeEventListeners() {
    // Basics form submission
    document.getElementById('basicsForm').addEventListener('submit', saveBasics);

    // Work form submission
    document.getElementById('workForm').addEventListener('submit', function (e) {
        e.preventDefault();
        saveWork();
    });

    // Currently working checkbox
    document.getElementById('currentlyWorking').addEventListener('change', function () {
        const endDateInput = document.getElementById('endDate');
        if (this.checked) {
            endDateInput.disabled = true;
            endDateInput.value = '';
        } else {
            endDateInput.disabled = false;
        }
    });

    // Education form submission
    document.getElementById('educationForm').addEventListener('submit', function (e) {
        e.preventDefault();
        saveEducation();
    });

    // Currently studying checkbox
    document.getElementById('currentlyStudying').addEventListener('change', function () {
        const endDateInput = document.getElementById('eduEndDate');
        if (this.checked) {
            endDateInput.disabled = true;
            endDateInput.value = '';
        } else {
            endDateInput.disabled = false;
        }
    });

    // Save As form submission
    document.getElementById('saveAsForm').addEventListener('submit', function (e) {
        e.preventDefault();
        saveAsResume();
    });
}

// Sort work experience by date (current jobs first, then by start date desc)
function sortWorkByDate(workItems) {
    return workItems.sort((a, b) => {
        // Current jobs (isWorkingHere = true) should appear first
        if (a.isWorkingHere && !b.isWorkingHere) return -1;
        if (!a.isWorkingHere && b.isWorkingHere) return 1;
        
        // If both are current or both are past, sort by start date (newest first)
        const dateA = a.startDate ? new Date(a.startDate) : new Date('1900-01-01');
        const dateB = b.startDate ? new Date(b.startDate) : new Date('1900-01-01');
        
        return dateB - dateA; // Descending order (newest first)
    });
}

// Sort education by date (current studies first, then by start date desc)
function sortEducationByDate(educationItems) {
    return educationItems.sort((a, b) => {
        // Current studies should appear first
        if (a.isStudyingHere && !b.isStudyingHere) return -1;
        if (!a.isStudyingHere && b.isStudyingHere) return 1;
        
        // If both are current or both are past, sort by start date (newest first)
        const dateA = a.startDate ? new Date(a.startDate) : new Date('1900-01-01');
        const dateB = b.startDate ? new Date(b.startDate) : new Date('1900-01-01');
        
        return dateB - dateA; // Descending order (newest first)
    });
}

// Populate form fields with loaded data
function populateFormFields() {
    if (!resumeData || Object.keys(resumeData).length === 0) {
        return;
    }

    const basics = resumeData.basics || {};
    
    // Populate basic information fields
    const nameField = document.getElementById('name');
    const labelField = document.getElementById('label');
    const emailField = document.getElementById('email');
    const phoneField = document.getElementById('phone');
    const cityField = document.getElementById('city');
    const summaryField = document.getElementById('summary');
    const objectiveField = document.getElementById('objective');

    if (nameField) nameField.value = basics.name || '';
    if (labelField) labelField.value = basics.label || '';
    if (emailField) emailField.value = basics.email || '';
    if (phoneField) phoneField.value = basics.phone || '';
    if (cityField) cityField.value = (basics.location && basics.location.city) || '';
    if (summaryField) summaryField.value = cleanHTML(basics.summary || '');
    if (objectiveField) objectiveField.value = cleanHTML(basics.objective || '');

    // Update work experience list
    updateWorkExperienceDisplay();

    // Update skills list
    updateSkillsDisplay();

    // Update education list
    updateEducationDisplay();
}

// Update work experience display (sorted by date)
function updateWorkExperienceDisplay() {
    const workList = document.getElementById('workExperienceList');
    if (!workList) return;

    const workItems = resumeData.work || [];
    
    if (workItems.length === 0) {
        workList.innerHTML = `
            <div class="text-center py-5">
                <i class="bi bi-briefcase display-1 text-muted"></i>
                <h5 class="text-muted mt-3">No work experience added yet</h5>
                <p class="text-muted">Click "Add Experience" to get started!</p>
            </div>
        `;
        return;
    }

    // Sort work items by date before displaying
    const sortedWorkItems = sortWorkByDate([...workItems]);

    workList.innerHTML = '';
    sortedWorkItems.forEach(work => {
        const workElement = document.createElement('div');
        workElement.className = 'work-item card mb-3 border-start border-primary border-4';
        workElement.setAttribute('data-id', work.id);
        
        const startDate = work.startDate ? work.startDate.substring(0, 10) : 'Not specified';
        const endDate = work.endDate ? work.endDate.substring(0, 10) : 'Present';
        
        // Add visual indicator for current job
        const currentBadge = work.isWorkingHere ? '<span class="badge bg-success ms-2">Current</span>' : '';
        
        workElement.innerHTML = `
            <div class="card-body">
                <div class="d-flex justify-content-between align-items-start mb-2">
                    <div>
                        <h5 class="card-title text-primary mb-1">
                            ${work.position || 'Unknown Position'}
                            ${currentBadge}
                        </h5>
                        <h6 class="card-subtitle text-muted">${work.name || 'Unknown Company'}</h6>
                    </div>
                    <div class="btn-group">
                        <button class="btn btn-outline-primary btn-sm" onclick="editWork('${work.id}')">
                            <i class="bi bi-pencil"></i>
                        </button>
                        <button class="btn btn-outline-danger btn-sm" onclick="deleteWork('${work.id}')">
                            <i class="bi bi-trash"></i>
                        </button>
                    </div>
                </div>
                <p class="text-muted small mb-2">
                    <i class="bi bi-calendar me-1"></i>
                    ${startDate} - ${endDate}
                </p>
                <p class="card-text">${cleanHTML(work.summary) || 'No description provided.'}</p>
            </div>
        `;
        
        workList.appendChild(workElement);
    });
}

// Update skills display
function updateSkillsDisplay() {
    const skillsList = document.getElementById('skillsList');
    if (!skillsList) return;

    const skills = resumeData.skills && resumeData.skills.technologies ? resumeData.skills.technologies : [];
    
    if (skills.length === 0) {
        skillsList.innerHTML = `
            <div class="text-center py-5">
                <i class="bi bi-tools display-1 text-muted"></i>
                <h5 class="text-muted mt-3">No skills added yet</h5>
                <p class="text-muted">Click "Add Skill" to showcase your expertise!</p>
            </div>
        `;
        return;
    }

    skillsList.innerHTML = '';
    skills.forEach((skill, index) => {
        const skillElement = document.createElement('div');
        skillElement.className = 'col-auto skill-badge';
        skillElement.setAttribute('data-index', index);
        
        skillElement.innerHTML = `
            <span class="badge bg-primary fs-6 p-2 position-relative">
                ${skill.name}
                <button class="btn-close btn-close-white ms-2" onclick="deleteSkill(${index})"></button>
            </span>
        `;
        
        skillsList.appendChild(skillElement);
    });
}

// Update education display (sorted by date)
function updateEducationDisplay() {
    const educationList = document.getElementById('educationList');
    if (!educationList) return;

    const educationItems = resumeData.education || [];
    
    if (educationItems.length === 0) {
        educationList.innerHTML = `
            <div class="text-center py-5">
                <i class="bi bi-mortarboard display-1 text-muted"></i>
                <h5 class="text-muted mt-3">No education entries added yet</h5>
                <p class="text-muted">Click "Add Education" to showcase your academic background!</p>
            </div>
        `;
        return;
    }

    // Sort education items by date before displaying
    const sortedEducationItems = sortEducationByDate([...educationItems]);

    educationList.innerHTML = '';
    sortedEducationItems.forEach(education => {
        const educationElement = document.createElement('div');
        educationElement.className = 'education-item card mb-3 border-start border-success border-4';
        educationElement.setAttribute('data-id', education.id);
        
        const startDate = education.startDate ? education.startDate.substring(0, 10) : 'Not specified';
        const endDate = education.endDate ? education.endDate.substring(0, 10) : 'Present';
        
        let degreeInfo = '';
        if (education.studyType && education.area) {
            degreeInfo = `${education.studyType} in ${education.area}`;
        } else if (education.area) {
            degreeInfo = education.area;
        } else if (education.studyType) {
            degreeInfo = education.studyType;
        }
        
        // Add visual indicator for current studies
        const currentBadge = education.isStudyingHere ? '<span class="badge bg-success ms-2">Current</span>' : '';
        
        let coursesHtml = '';
        if (education.courses && education.courses.length > 0) {
            const validCourses = education.courses.filter(course => course && course.trim());
            if (validCourses.length > 0) {
                coursesHtml = `
                    <div class="mt-2">
                        <small class="text-muted fw-semibold">Relevant Courses:</small>
                        <div class="mt-1">
                            ${validCourses.map(course => `<span class="badge bg-light text-dark me-1 mb-1">${course.trim()}</span>`).join('')}
                        </div>
                    </div>
                `;
            }
        }
        
        educationElement.innerHTML = `
            <div class="card-body">
                <div class="d-flex justify-content-between align-items-start mb-2">
                    <div>
                        <h5 class="card-title text-success mb-1">
                            ${education.institution || 'Unknown Institution'}
                            ${currentBadge}
                        </h5>
                        ${degreeInfo ? `<h6 class="card-subtitle text-muted mb-1">${degreeInfo}</h6>` : ''}
                        ${education.gpa ? `<small class="text-muted">GPA: ${education.gpa}</small>` : ''}
                    </div>
                    <div class="btn-group">
                        <button class="btn btn-outline-success btn-sm" onclick="editEducation('${education.id}')">
                            <i class="bi bi-pencil"></i>
                        </button>
                        <button class="btn btn-outline-danger btn-sm" onclick="deleteEducation('${education.id}')">
                            <i class="bi bi-trash"></i>
                        </button>
                    </div>
                </div>
                <p class="text-muted small mb-2">
                    <i class="bi bi-calendar me-1"></i>
                    ${startDate} - ${endDate}
                </p>
                ${education.summary ? `<p class="card-text">${cleanHTML(education.summary)}</p>` : ''}
                ${coursesHtml}
            </div>
        `;
        
        educationList.appendChild(educationElement);
    });
}

// Update current filename display
function updateCurrentFilename() {
    const filenameElement = document.getElementById('currentFileName');
    if (filenameElement) {
        if (currentFilename) {
            filenameElement.textContent = `Current: ${currentFilename}`;
        } else {
            filenameElement.textContent = 'No file loaded';
        }
    }
}

// Show toast notification
function showToast(message, type = 'success') {
    const toast = document.getElementById('toast');
    const toastMessage = document.getElementById('toast-message');
    const toastHeader = toast.querySelector('.toast-header i');

    // Update icon based on type
    if (type === 'success') {
        toastHeader.className = 'bi bi-check-circle-fill text-success me-2';
    } else if (type === 'error') {
        toastHeader.className = 'bi bi-exclamation-triangle-fill text-danger me-2';
    } else if (type === 'info') {
        toastHeader.className = 'bi bi-info-circle-fill text-info me-2';
    }

    toastMessage.textContent = message;

    const bsToast = new bootstrap.Toast(toast);
    bsToast.show();
}

// Load resume data
async function loadData() {
    try {
        const response = await fetch('/api/data');
        if (response.ok) {
            resumeData = await response.json();
            console.log('Resume data loaded:', resumeData);
            // Populate fields after data is loaded
            populateFormFields();
        }
    } catch (error) {
        console.error('Error loading data:', error);
        showToast('Error loading resume data', 'error');
    }
}

// Resume Management Functions

// Create new resume
async function createNewResume() {
    if (!confirm('Are you sure you want to create a new resume? Any unsaved changes will be lost.')) {
        return;
    }

    try {
        showToast('Creating new resume...', 'info');

        const response = await fetch('/api/resume/new', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            }
        });

        const result = await response.json();

        if (result.success) {
            showToast('New resume created successfully!');
            currentFilename = null;
            updateCurrentFilename();
            // Reload page to show empty form
            setTimeout(() => {
                window.location.reload();
            }, 1000);
        } else {
            showToast('Error creating new resume', 'error');
        }
    } catch (error) {
        console.error('Error:', error);
        showToast('Network error occurred', 'error');
    }
}

// Show load resume modal
async function showLoadResumeModal() {
    try {
        const response = await fetch('/api/resumes');
        const result = await response.json();

        if (result.success) {
            const resumesList = document.getElementById('resumesList');
            const noResumesMessage = document.getElementById('noResumesMessage');

            if (result.resumes.length === 0) {
                resumesList.classList.add('d-none');
                noResumesMessage.classList.remove('d-none');
            } else {
                resumesList.classList.remove('d-none');
                noResumesMessage.classList.add('d-none');

                // Clear existing list
                resumesList.innerHTML = '';

                // Add resume items
                result.resumes.forEach(resume => {
                    const isCurrentFile = resume.filename === result.current_filename;
                    const listItem = document.createElement('div');
                    listItem.className = `list-group-item list-group-item-action ${isCurrentFile ? 'active' : ''}`;

                    listItem.innerHTML = `
                        <div class="d-flex w-100 justify-content-between align-items-center">
                            <div>
                                <h6 class="mb-1">${resume.name || 'Untitled Resume'}</h6>
                                <small>${resume.filename}</small>
                            </div>
                            <div class="text-end">
                                <small class="text-muted d-block">Modified: ${resume.modified}</small>
                                <div class="btn-group btn-group-sm mt-1">
                                    <button class="btn btn-outline-primary" onclick="loadResume('${resume.filename}')" ${isCurrentFile ? 'disabled' : ''}>
                                        <i class="bi bi-folder-open"></i> ${isCurrentFile ? 'Current' : 'Load'}
                                    </button>
                                    <button class="btn btn-outline-danger" onclick="deleteResume('${resume.filename}')">
                                        <i class="bi bi-trash"></i>
                                    </button>
                                </div>
                            </div>
                        </div>
                    `;

                    resumesList.appendChild(listItem);
                });
            }

            // Show modal
            const modal = new bootstrap.Modal(document.getElementById('loadResumeModal'));
            modal.show();
        }
    } catch (error) {
        console.error('Error:', error);
        showToast('Error loading resume list', 'error');
    }
}

// Load specific resume
async function loadResume(filename) {
    try {
        showToast('Loading resume...', 'info');

        const response = await fetch('/api/resume/load', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ filename: filename }),
        });

        const result = await response.json();

        if (result.success) {
            showToast(result.message);
            currentFilename = result.current_filename;
            resumeData = result.resume_data; // Update local data
            updateCurrentFilename();

            // Close modal
            const modal = bootstrap.Modal.getInstance(document.getElementById('loadResumeModal'));
            modal.hide();

            // Populate form fields with loaded data instead of reloading page
            populateFormFields();
        } else {
            showToast(result.message, 'error');
        }
    } catch (error) {
        console.error('Error:', error);
        showToast('Network error occurred', 'error');
    }
}

// Save current resume
async function saveCurrentResume() {
    try {
        showToast('Saving resume...', 'info');

        const response = await fetch('/api/resume/save', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({}),
        });

        const result = await response.json();

        if (result.success) {
            showToast(result.message);
            currentFilename = result.filename;
            updateCurrentFilename();
        } else {
            showToast(result.message, 'error');
        }
    } catch (error) {
        console.error('Error:', error);
        showToast('Network error occurred', 'error');
    }
}

// Show save as modal
function showSaveAsModal() {
    // Pre-populate with current name if available
    const nameInput = document.getElementById('name');
    const saveAsInput = document.getElementById('saveAsFilename');

    if (nameInput && nameInput.value) {
        const cleanName = nameInput.value.replace(/[^\w\s-]/g, '').trim().replace(/[-\s]+/g, '_');
        const timestamp = new Date().toISOString().slice(0, 19).replace(/[:-]/g, '_');
        saveAsInput.value = `${cleanName}_${timestamp}`;
    }

    const modal = new bootstrap.Modal(document.getElementById('saveAsModal'));
    modal.show();
}

// Save as new resume
async function saveAsResume() {
    const filenameInput = document.getElementById('saveAsFilename');
    const filename = filenameInput.value.trim();

    if (!filename) {
        showToast('Please enter a filename', 'error');
        return;
    }

    // Add .json extension if not present
    const fullFilename = filename.endsWith('.json') ? filename : `${filename}.json`;

    try {
        showToast('Saving resume...', 'info');

        const response = await fetch('/api/resume/save', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                filename: fullFilename,
                save_as: true
            }),
        });

        const result = await response.json();

        if (result.success) {
            showToast(result.message);
            currentFilename = result.filename;
            updateCurrentFilename();

            // Close modal
            const modal = bootstrap.Modal.getInstance(document.getElementById('saveAsModal'));
            modal.hide();

            // Clear form
            filenameInput.value = '';
        } else {
            showToast(result.message, 'error');
        }
    } catch (error) {
        console.error('Error:', error);
        showToast('Network error occurred', 'error');
    }
}

// Delete resume
async function deleteResume(filename) {
    if (!confirm(`Are you sure you want to delete "${filename}"? This action cannot be undone.`)) {
        return;
    }

    try {
        const response = await fetch('/api/resume/delete', {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ filename: filename }),
        });

        const result = await response.json();

        if (result.success) {
            showToast(result.message);
            // Refresh the modal content
            showLoadResumeModal();
        } else {
            showToast(result.message, 'error');
        }
    } catch (error) {
        console.error('Error:', error);
        showToast('Network error occurred', 'error');
    }
}

// Save basic information
async function saveBasics(e) {
    e.preventDefault();

    const form = e.target;
    const submitBtn = form.querySelector('button[type="submit"]');

    // Show loading state
    submitBtn.classList.add('btn-loading');
    submitBtn.disabled = true;

    const formData = new FormData(form);
    const data = Object.fromEntries(formData);

    try {
        const response = await fetch('/api/basics', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(data),
        });

        const result = await response.json();

        if (result.success) {
            showToast('Personal information saved successfully!');
            await loadData(); // Refresh data
        } else {
            showToast('Error saving information', 'error');
        }
    } catch (error) {
        console.error('Error:', error);
        showToast('Network error occurred', 'error');
    } finally {
        // Remove loading state
        submitBtn.classList.remove('btn-loading');
        submitBtn.disabled = false;
    }
}

// Save work experience
async function saveWork() {
    const form = document.getElementById('workForm');
    const formData = new FormData(form);
    const data = Object.fromEntries(formData);

    // Convert checkbox to boolean
    data.currentlyWorking = document.getElementById('currentlyWorking').checked;

    try {
        const response = await fetch('/api/work', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(data),
        });

        const result = await response.json();

        if (result.success) {
            showToast('Work experience saved successfully!');

            // Close modal
            const modal = bootstrap.Modal.getInstance(document.getElementById('workModal'));
            modal.hide();

            // Reset form
            form.reset();

            // Refresh data and update display
            await loadData();
            updateWorkExperienceDisplay();
        } else {
            showToast('Error saving work experience', 'error');
        }
    } catch (error) {
        console.error('Error:', error);
        showToast('Network error occurred', 'error');
    }
}

// Edit work experience
function editWork(workId) {
    const workItem = resumeData.work?.find(work => work.id === workId);
    if (!workItem) return;

    // Populate form with existing data
    document.getElementById('workId').value = workItem.id;
    document.getElementById('company').value = workItem.name || '';
    document.getElementById('position').value = workItem.position || '';

    // Format dates for input
    if (workItem.startDate) {
        document.getElementById('startDate').value = workItem.startDate.split('T')[0];
    }
    if (workItem.endDate) {
        document.getElementById('endDate').value = workItem.endDate.split('T')[0];
    }

    document.getElementById('currentlyWorking').checked = workItem.isWorkingHere || false;
    document.getElementById('workSummary').value = cleanHTML(workItem.summary || '');

    // Disable end date if currently working
    document.getElementById('endDate').disabled = workItem.isWorkingHere || false;

    // Show modal
    const modal = new bootstrap.Modal(document.getElementById('workModal'));
    modal.show();
}

// Delete work experience
async function deleteWork(workId) {
    if (!confirm('Are you sure you want to delete this work experience?')) {
        return;
    }

    try {
        const response = await fetch(`/api/work/${workId}`, {
            method: 'DELETE',
        });

        const result = await response.json();

        if (result.success) {
            showToast('Work experience deleted successfully!');

            // Refresh data and update display
            await loadData();
            updateWorkExperienceDisplay();
        } else {
            showToast('Error deleting work experience', 'error');
        }
    } catch (error) {
        console.error('Error:', error);
        showToast('Network error occurred', 'error');
    }
}

// Education Management Functions

// Save education
async function saveEducation() {
    const form = document.getElementById('educationForm');
    const formData = new FormData(form);
    const data = Object.fromEntries(formData);

    // Convert checkbox to boolean
    data.currentlyStudying = document.getElementById('currentlyStudying').checked;

    try {
        const response = await fetch('/api/education', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(data),
        });

        const result = await response.json();

        if (result.success) {
            showToast('Education entry saved successfully!');

            // Close modal
            const modal = bootstrap.Modal.getInstance(document.getElementById('educationModal'));
            modal.hide();

            // Reset form
            form.reset();

            // Refresh data and update display
            await loadData();
            updateEducationDisplay();
        } else {
            showToast('Error saving education entry', 'error');
        }
    } catch (error) {
        console.error('Error:', error);
        showToast('Network error occurred', 'error');
    }
}

// Edit education
function editEducation(eduId) {
    const eduItem = resumeData.education?.find(edu => edu.id === eduId);
    if (!eduItem) return;

    // Populate form with existing data
    document.getElementById('educationId').value = eduItem.id;
    document.getElementById('institution').value = eduItem.institution || '';
    document.getElementById('studyType').value = eduItem.studyType || '';
    document.getElementById('area').value = eduItem.area || '';
    document.getElementById('gpa').value = eduItem.gpa || '';

    // Format dates for input
    if (eduItem.startDate) {
        document.getElementById('eduStartDate').value = eduItem.startDate.split('T')[0];
    }
    if (eduItem.endDate) {
        document.getElementById('eduEndDate').value = eduItem.endDate.split('T')[0];
    }

    document.getElementById('currentlyStudying').checked = eduItem.isStudyingHere || false;
    document.getElementById('educationSummary').value = cleanHTML(eduItem.summary || '');
    
    // Handle courses array
    if (eduItem.courses && Array.isArray(eduItem.courses)) {
        document.getElementById('courses').value = eduItem.courses.join(', ');
    }

    // Disable end date if currently studying
    document.getElementById('eduEndDate').disabled = eduItem.isStudyingHere || false;

    // Show modal
    const modal = new bootstrap.Modal(document.getElementById('educationModal'));
    modal.show();
}

// Delete education
async function deleteEducation(eduId) {
    if (!confirm('Are you sure you want to delete this education entry?')) {
        return;
    }

    try {
        const response = await fetch(`/api/education/${eduId}`, {
            method: 'DELETE',
        });

        const result = await response.json();

        if (result.success) {
            showToast('Education entry deleted successfully!');

            // Refresh data and update display
            await loadData();
            updateEducationDisplay();
        } else {
            showToast('Error deleting education entry', 'error');
        }
    } catch (error) {
        console.error('Error:', error);
        showToast('Network error occurred', 'error');
    }
}

// Skills Management Functions

// Add skill
async function addSkill() {
    const skillName = prompt('Enter skill name:');
    if (!skillName || skillName.trim() === '') return;

    try {
        const response = await fetch('/api/skills', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ name: skillName.trim() }),
        });

        const result = await response.json();

        if (result.success) {
            showToast('Skill added successfully!');

            // Refresh data and update display
            await loadData();
            updateSkillsDisplay();
        } else {
            showToast(result.message || 'Error adding skill', 'error');
        }
    } catch (error) {
        console.error('Error:', error);
        showToast('Network error occurred', 'error');
    }
}

// Delete skill
async function deleteSkill(skillIndex) {
    if (!confirm('Are you sure you want to delete this skill?')) {
        return;
    }

    try {
        const response = await fetch(`/api/skills/${skillIndex}`, {
            method: 'DELETE',
        });

        const result = await response.json();

        if (result.success) {
            showToast('Skill deleted successfully!');

            // Refresh data and update display
            await loadData();
            updateSkillsDisplay();
        } else {
            showToast('Error deleting skill', 'error');
        }
    } catch (error) {
        console.error('Error:', error);
        showToast('Network error occurred', 'error');
    }
}

// Export to PDF
async function exportPDF() {
    const btn = event.target.closest('button');
    btn.classList.add('btn-loading');
    btn.disabled = true;

    try {
        showToast('Generating PDF...', 'info');

        const response = await fetch('/api/export/pdf');

        if (response.ok) {
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.style.display = 'none';
            a.href = url;

            // Use current filename for PDF name
            let pdfName = 'resume.pdf';
            if (currentFilename) {
                const baseName = currentFilename.replace('.json', '');
                pdfName = `${baseName}.pdf`;
            }

            a.download = pdfName;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);

            showToast('PDF exported successfully!');
        } else {
            throw new Error('Export failed');
        }
    } catch (error) {
        console.error('Error:', error);
        showToast('Error exporting PDF. Make sure ReportLab is installed.', 'error');
    } finally {
        btn.classList.remove('btn-loading');
        btn.disabled = false;
    }
}

// Utility function to clean HTML
function cleanHTML(text) {
    if (!text) return '';
    return text.replace(/<p>|<\/p>|<br>|&nbsp;/g, '').trim();
}

// Modal reset event listeners
document.addEventListener('DOMContentLoaded', function() {
    // Reset work modal when it's hidden
    const workModal = document.getElementById('workModal');
    if (workModal) {
        workModal.addEventListener('hidden.bs.modal', function () {
            const form = document.getElementById('workForm');
            form.reset();
            document.getElementById('workId').value = '';
            document.getElementById('endDate').disabled = false;
        });
    }

    // Reset education modal when it's hidden
    const educationModal = document.getElementById('educationModal');
    if (educationModal) {
        educationModal.addEventListener('hidden.bs.modal', function () {
            const form = document.getElementById('educationForm');
            form.reset();
            document.getElementById('educationId').value = '';
            document.getElementById('eduEndDate').disabled = false;
        });
    }

    // Handle form validation
    document.querySelectorAll('form').forEach(form => {
        form.addEventListener('submit', function (e) {
            if (!form.checkValidity()) {
                e.preventDefault();
                e.stopPropagation();
            }
            form.classList.add('was-validated');
        });
    });
});

// Auto-save functionality (optional)
let autoSaveTimeout;
function scheduleAutoSave() {
    clearTimeout(autoSaveTimeout);
    autoSaveTimeout = setTimeout(() => {
        if (currentFilename) {
            saveCurrentResume();
        }
    }, 30000); // Auto-save every 30 seconds if a file is loaded
}

// Trigger auto-save on form changes
document.addEventListener('input', scheduleAutoSave);
document.addEventListener('change', scheduleAutoSave);