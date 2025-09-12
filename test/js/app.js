// Static Resume Builder JavaScript for GitHub Pages
// Uses localStorage for data persistence

// Global variables
let resumeData = {};
let currentFilename = null;

// Initialize the application
document.addEventListener('DOMContentLoaded', function () {
    initializeEventListeners();
    loadFromStorage();
    updateCurrentFilename();
    populateFormFields();
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

    // Auto-save on input changes
    document.addEventListener('input', scheduleAutoSave);
    document.addEventListener('change', scheduleAutoSave);

    // Modal reset handlers
    const workModal = document.getElementById('workModal');
    if (workModal) {
        workModal.addEventListener('hidden.bs.modal', function () {
            const form = document.getElementById('workForm');
            form.reset();
            document.getElementById('workId').value = '';
            document.getElementById('endDate').disabled = false;
        });
    }

    const educationModal = document.getElementById('educationModal');
    if (educationModal) {
        educationModal.addEventListener('hidden.bs.modal', function () {
            const form = document.getElementById('educationForm');
            form.reset();
            document.getElementById('educationId').value = '';
            document.getElementById('eduEndDate').disabled = false;
        });
    }
}

// Initialize empty resume data structure
function initializeEmptyResume() {
    return {
        basics: {
            name: "",
            label: "",
            email: "",
            phone: "",
            summary: "",
            objective: "",
            location: { city: "" },
            profiles: []
        },
        work: [],
        skills: { technologies: [] },
        education: []
    };
}

// Load data from localStorage
function loadFromStorage() {
    try {
        const stored = localStorage.getItem('resumeBuilder_currentData');
        const storedFilename = localStorage.getItem('resumeBuilder_currentFilename');

        if (stored) {
            resumeData = JSON.parse(stored);
        } else {
            resumeData = initializeEmptyResume();
        }

        currentFilename = storedFilename;

        // Sort data after loading
        sortWorkByDate();
        sortEducationByDate();
    } catch (error) {
        console.error('Error loading from storage:', error);
        resumeData = initializeEmptyResume();
    }
}

// Save data to localStorage
function saveToStorage() {
    try {
        localStorage.setItem('resumeBuilder_currentData', JSON.stringify(resumeData));
        if (currentFilename) {
            localStorage.setItem('resumeBuilder_currentFilename', currentFilename);
        }
    } catch (error) {
        console.error('Error saving to storage:', error);
        showToast('Error saving data locally', 'error');
    }
}

// Generate unique ID
function generateId() {
    return 'id_' + Math.random().toString(36).substr(2, 16) + Date.now().toString(36);
}

// Sort work experience by date
function sortWorkByDate() {
    if (!resumeData.work) return;

    resumeData.work.sort((a, b) => {
        // Current jobs first
        if (a.isWorkingHere && !b.isWorkingHere) return -1;
        if (!a.isWorkingHere && b.isWorkingHere) return 1;

        // Then by start date (newest first)
        const dateA = a.startDate ? new Date(a.startDate) : new Date('1900-01-01');
        const dateB = b.startDate ? new Date(b.startDate) : new Date('1900-01-01');

        return dateB - dateA;
    });
}

// Sort education by date
function sortEducationByDate() {
    if (!resumeData.education) return;

    resumeData.education.sort((a, b) => {
        // Current studies first
        if (a.isStudyingHere && !b.isStudyingHere) return -1;
        if (!a.isStudyingHere && b.isStudyingHere) return 1;

        // Then by start date (newest first)
        const dateA = a.startDate ? new Date(a.startDate) : new Date('1900-01-01');
        const dateB = b.startDate ? new Date(b.startDate) : new Date('1900-01-01');

        return dateB - dateA;
    });
}

// Format date for display
function formatDate(dateString) {
    if (!dateString) return '';
    try {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', { year: 'numeric', month: 'long' });
    } catch (error) {
        return dateString;
    }
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

// Populate form fields with data
function populateFormFields() {
    if (!resumeData || Object.keys(resumeData).length === 0) {
        return;
    }

    const basics = resumeData.basics || {};

    // Populate basic information fields
    const fields = ['name', 'label', 'email', 'phone', 'summary', 'objective'];
    fields.forEach(field => {
        const element = document.getElementById(field);
        if (element) {
            element.value = basics[field] || '';
        }
    });

    // City field
    const cityField = document.getElementById('city');
    if (cityField) {
        cityField.value = (basics.location && basics.location.city) || '';
    }

    // Update display sections
    updateWorkExperienceDisplay();
    updateSkillsDisplay();
    updateEducationDisplay();
}

// Update work experience display
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

    workList.innerHTML = '';
    workItems.forEach(work => {
        const workElement = document.createElement('div');
        workElement.className = 'work-item card mb-3 border-start border-primary border-4';
        workElement.setAttribute('data-id', work.id);

        const startDate = formatDate(work.startDate);
        const endDate = work.endDate ? formatDate(work.endDate) : 'Present';

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
                    ${startDate || 'Not specified'} - ${endDate}
                </p>
                <p class="card-text">${work.summary || 'No description provided.'}</p>
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

// Update education display
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

    educationList.innerHTML = '';
    educationItems.forEach(education => {
        const educationElement = document.createElement('div');
        educationElement.className = 'education-item card mb-3 border-start border-success border-4';
        educationElement.setAttribute('data-id', education.id);

        const startDate = formatDate(education.startDate);
        const endDate = education.endDate ? formatDate(education.endDate) : 'Present';

        let degreeInfo = '';
        if (education.studyType && education.area) {
            degreeInfo = `${education.studyType} in ${education.area}`;
        } else if (education.area) {
            degreeInfo = education.area;
        } else if (education.studyType) {
            degreeInfo = education.studyType;
        }

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
                    ${startDate || 'Not specified'} - ${endDate}
                </p>
                ${education.summary ? `<p class="card-text">${education.summary}</p>` : ''}
                ${coursesHtml}
            </div>
        `;

        educationList.appendChild(educationElement);
    });
}

// Resume Management Functions
function createNewResume() {
    if (!confirm('Are you sure you want to create a new resume? Any unsaved changes will be lost.')) {
        return;
    }

    resumeData = initializeEmptyResume();
    currentFilename = null;
    saveToStorage();
    updateCurrentFilename();
    populateFormFields();
    showToast('New resume created successfully!');
}

// Get available resumes from localStorage
function getAvailableResumes() {
    const resumes = [];

    for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith('resumeBuilder_file_')) {
            try {
                const filename = key.replace('resumeBuilder_file_', '');
                const data = JSON.parse(localStorage.getItem(key));
                const name = data.basics?.name || 'Untitled Resume';
                const modified = data.lastModified || new Date().toISOString();

                resumes.push({
                    filename: filename,
                    name: name,
                    modified: new Date(modified).toLocaleString(),
                    data: data
                });
            } catch (error) {
                console.error('Error parsing resume:', error);
            }
        }
    }

    return resumes.sort((a, b) => new Date(b.modified) - new Date(a.modified));
}

// Show load resume modal
function showLoadResumeModal() {
    const resumes = getAvailableResumes();
    const resumesList = document.getElementById('resumesList');
    const noResumesMessage = document.getElementById('noResumesMessage');

    if (resumes.length === 0) {
        resumesList.classList.add('d-none');
        noResumesMessage.classList.remove('d-none');
    } else {
        resumesList.classList.remove('d-none');
        noResumesMessage.classList.add('d-none');

        resumesList.innerHTML = '';

        resumes.forEach(resume => {
            const isCurrentFile = resume.filename === currentFilename;
            const listItem = document.createElement('div');
            listItem.className = `list-group-item list-group-item-action ${isCurrentFile ? 'active' : ''}`;

            listItem.innerHTML = `
                <div class="d-flex w-100 justify-content-between align-items-center">
                    <div>
                        <h6 class="mb-1">${resume.name}</h6>
                        <small>${resume.filename}</small>
                    </div>
                    <div class="text-end">
                        <small class="text-muted d-block">Modified: ${resume.modified}</small>
                        <div class="btn-group btn-group-sm mt-1">
                            <button class="btn btn-outline-primary" onclick="loadResume('${resume.filename}')" ${isCurrentFile ? 'disabled' : ''}>
                                <i class="bi bi-folder-open"></i> ${isCurrentFile ? 'Current' : 'Load'}
                            </button>
                            <button class="btn btn-outline-danger" onclick="deleteStoredResume('${resume.filename}')">
                                <i class="bi bi-trash"></i>
                            </button>
                        </div>
                    </div>
                </div>
            `;

            resumesList.appendChild(listItem);
        });
    }

    const modal = new bootstrap.Modal(document.getElementById('loadResumeModal'));
    modal.show();
}

// Load specific resume
function loadResume(filename) {
    try {
        const key = `resumeBuilder_file_${filename}`;
        const stored = localStorage.getItem(key);

        if (stored) {
            resumeData = JSON.parse(stored);
            currentFilename = filename;
            saveToStorage();
            updateCurrentFilename();
            populateFormFields();

            const modal = bootstrap.Modal.getInstance(document.getElementById('loadResumeModal'));
            modal.hide();

            showToast(`Resume "${filename}" loaded successfully!`);
        } else {
            showToast('Resume not found!', 'error');
        }
    } catch (error) {
        console.error('Error loading resume:', error);
        showToast('Error loading resume', 'error');
    }
}

// Save current resume
function saveCurrentResume() {
    let filename = currentFilename;

    if (!filename) {
        const name = resumeData.basics?.name || 'Resume';
        const cleanName = name.replace(/[^\w\s-]/g, '').trim().replace(/[-\s]+/g, '_');
        const timestamp = new Date().toISOString().slice(0, 19).replace(/[:-]/g, '_');
        filename = `${cleanName}_${timestamp}.json`;
    }

    try {
        const dataToSave = { ...resumeData, lastModified: new Date().toISOString() };
        localStorage.setItem(`resumeBuilder_file_${filename}`, JSON.stringify(dataToSave));

        currentFilename = filename;
        saveToStorage();
        updateCurrentFilename();

        showToast(`Resume saved as "${filename}"`);
    } catch (error) {
        console.error('Error saving resume:', error);
        showToast('Error saving resume', 'error');
    }
}

// Show save as modal
function showSaveAsModal() {
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
function saveAsResume() {
    const filenameInput = document.getElementById('saveAsFilename');
    let filename = filenameInput.value.trim();

    if (!filename) {
        showToast('Please enter a filename', 'error');
        return;
    }

    if (!filename.endsWith('.json')) {
        filename += '.json';
    }

    try {
        const dataToSave = { ...resumeData, lastModified: new Date().toISOString() };
        localStorage.setItem(`resumeBuilder_file_${filename}`, JSON.stringify(dataToSave));

        currentFilename = filename;
        saveToStorage();
        updateCurrentFilename();

        const modal = bootstrap.Modal.getInstance(document.getElementById('saveAsModal'));
        modal.hide();

        filenameInput.value = '';
        showToast(`Resume saved as "${filename}"`);
    } catch (error) {
        console.error('Error saving resume:', error);
        showToast('Error saving resume', 'error');
    }
}

// Delete stored resume
function deleteStoredResume(filename) {
    if (!confirm(`Are you sure you want to delete "${filename}"? This action cannot be undone.`)) {
        return;
    }

    try {
        localStorage.removeItem(`resumeBuilder_file_${filename}`);
        showToast(`Resume "${filename}" deleted successfully`);
        showLoadResumeModal(); // Refresh the modal
    } catch (error) {
        console.error('Error deleting resume:', error);
        showToast('Error deleting resume', 'error');
    }
}

// Save basic information
function saveBasics(e) {
    e.preventDefault();

    const form = e.target;
    const submitBtn = form.querySelector('button[type="submit"]');

    // Show loading state
    submitBtn.classList.add('btn-loading');
    submitBtn.disabled = true;

    const formData = new FormData(form);
    const data = Object.fromEntries(formData);

    if (!resumeData.basics) {
        resumeData.basics = {};
    }

    Object.assign(resumeData.basics, {
        name: data.name || '',
        label: data.label || '',
        email: data.email || '',
        phone: data.phone || '',
        summary: data.summary || '',
        objective: data.objective || ''
    });

    if (!resumeData.basics.location) {
        resumeData.basics.location = {};
    }
    resumeData.basics.location.city = data.city || '';

    saveToStorage();

    setTimeout(() => {
        submitBtn.classList.remove('btn-loading');
        submitBtn.disabled = false;
        showToast('Personal information saved successfully!');
    }, 500);
}

// Save work experience
function saveWork() {
    const form = document.getElementById('workForm');
    const formData = new FormData(form);
    const data = Object.fromEntries(formData);

    data.currentlyWorking = document.getElementById('currentlyWorking').checked;

    if (!resumeData.work) {
        resumeData.work = [];
    }

    const workItem = {
        id: data.id || generateId(),
        name: data.company || '',
        position: data.position || '',
        startDate: data.startDate || '',
        endDate: data.currentlyWorking ? null : data.endDate || '',
        isWorkingHere: data.currentlyWorking,
        summary: data.summary || ''
    };

    // Check if updating existing item
    const existingIndex = resumeData.work.findIndex(work => work.id === workItem.id);
    if (existingIndex !== -1) {
        resumeData.work[existingIndex] = workItem;
    } else {
        resumeData.work.push(workItem);
    }

    sortWorkByDate();
    saveToStorage();
    updateWorkExperienceDisplay();

    const modal = bootstrap.Modal.getInstance(document.getElementById('workModal'));
    modal.hide();
    form.reset();

    showToast('Work experience saved successfully!');
}

// Edit work experience
function editWork(workId) {
    const workItem = resumeData.work?.find(work => work.id === workId);
    if (!workItem) return;

    document.getElementById('workId').value = workItem.id;
    document.getElementById('company').value = workItem.name || '';
    document.getElementById('position').value = workItem.position || '';
    document.getElementById('startDate').value = workItem.startDate || '';
    document.getElementById('endDate').value = workItem.endDate || '';
    document.getElementById('currentlyWorking').checked = workItem.isWorkingHere || false;
    document.getElementById('workSummary').value = workItem.summary || '';

    document.getElementById('endDate').disabled = workItem.isWorkingHere || false;

    const modal = new bootstrap.Modal(document.getElementById('workModal'));
    modal.show();
}

// Delete work experience
function deleteWork(workId) {
    if (!confirm('Are you sure you want to delete this work experience?')) {
        return;
    }

    if (resumeData.work) {
        resumeData.work = resumeData.work.filter(work => work.id !== workId);
        saveToStorage();
        updateWorkExperienceDisplay();
        showToast('Work experience deleted successfully!');
    }
}

// Save education
function saveEducation() {
    const form = document.getElementById('educationForm');
    const formData = new FormData(form);
    const data = Object.fromEntries(formData);

    data.currentlyStudying = document.getElementById('currentlyStudying').checked;

    if (!resumeData.education) {
        resumeData.education = [];
    }

    const educationItem = {
        id: data.id || generateId(),
        institution: data.institution || '',
        area: data.area || '',
        studyType: data.studyType || '',
        startDate: data.startDate || '',
        endDate: data.currentlyStudying ? null : data.endDate || '',
        isStudyingHere: data.currentlyStudying,
        gpa: data.gpa || '',
        courses: data.courses ? data.courses.split(',').map(c => c.trim()).filter(c => c) : [],
        summary: data.summary || ''
    };

    // Check if updating existing item
    const existingIndex = resumeData.education.findIndex(edu => edu.id === educationItem.id);
    if (existingIndex !== -1) {
        resumeData.education[existingIndex] = educationItem;
    } else {
        resumeData.education.push(educationItem);
    }

    sortEducationByDate();
    saveToStorage();
    updateEducationDisplay();

    const modal = bootstrap.Modal.getInstance(document.getElementById('educationModal'));
    modal.hide();
    form.reset();

    showToast('Education entry saved successfully!');
}

// Edit education
function editEducation(eduId) {
    const eduItem = resumeData.education?.find(edu => edu.id === eduId);
    if (!eduItem) return;

    document.getElementById('educationId').value = eduItem.id;
    document.getElementById('institution').value = eduItem.institution || '';
    document.getElementById('studyType').value = eduItem.studyType || '';
    document.getElementById('area').value = eduItem.area || '';
    document.getElementById('gpa').value = eduItem.gpa || '';
    document.getElementById('eduStartDate').value = eduItem.startDate || '';
    document.getElementById('eduEndDate').value = eduItem.endDate || '';
    document.getElementById('currentlyStudying').checked = eduItem.isStudyingHere || false;
    document.getElementById('educationSummary').value = eduItem.summary || '';

    if (eduItem.courses && Array.isArray(eduItem.courses)) {
        document.getElementById('courses').value = eduItem.courses.join(', ');
    }

    document.getElementById('eduEndDate').disabled = eduItem.isStudyingHere || false;

    const modal = new bootstrap.Modal(document.getElementById('educationModal'));
    modal.show();
}

// Delete education
function deleteEducation(eduId) {
    if (!confirm('Are you sure you want to delete this education entry?')) {
        return;
    }

    if (resumeData.education) {
        resumeData.education = resumeData.education.filter(edu => edu.id !== eduId);
        saveToStorage();
        updateEducationDisplay();
        showToast('Education entry deleted successfully!');
    }
}

// Skills Management Functions
function addSkill() {
    const skillName = prompt('Enter skill name:');
    if (!skillName || skillName.trim() === '') return;

    if (!resumeData.skills) {
        resumeData.skills = { technologies: [] };
    }
    if (!resumeData.skills.technologies) {
        resumeData.skills.technologies = [];
    }

    // Check if skill already exists
    const existingSkills = resumeData.skills.technologies.map(tech => tech.name.toLowerCase());
    if (existingSkills.includes(skillName.toLowerCase())) {
        showToast('Skill already exists!', 'error');
        return;
    }

    resumeData.skills.technologies.push({
        name: skillName.trim(),
        level: 0
    });

    saveToStorage();
    updateSkillsDisplay();
    showToast('Skill added successfully!');
}

// Delete skill
function deleteSkill(skillIndex) {
    if (!confirm('Are you sure you want to delete this skill?')) {
        return;
    }

    if (resumeData.skills && resumeData.skills.technologies && resumeData.skills.technologies[skillIndex]) {
        resumeData.skills.technologies.splice(skillIndex, 1);
        saveToStorage();
        updateSkillsDisplay();
        showToast('Skill deleted successfully!');
    }
}

// Export Functions using jsPDF
function exportPDF() {
    const btn = event.target.closest('button');
    btn.classList.add('btn-loading');
    btn.disabled = true;

    try {
        showToast('Generating PDF...', 'info');

        // Import jsPDF from the global window object
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF();

        // Set up fonts and colors
        const primaryColor = [37, 99, 235]; // RGB for #2563eb
        const darkColor = [44, 62, 80]; // RGB for #2c3e50
        let yPos = 20;

        const basics = resumeData.basics || {};

        // Header section
        if (basics.name) {
            doc.setFontSize(24);
            doc.setTextColor(...primaryColor);
            doc.text(basics.name.toUpperCase(), 20, yPos);
            yPos += 10;
        }

        if (basics.label) {
            doc.setFontSize(14);
            doc.setTextColor(...darkColor);
            doc.text(basics.label, 20, yPos);
            yPos += 8;
        }

        // Contact information
        doc.setFontSize(10);
        let contactInfo = [];
        if (basics.email) contactInfo.push(basics.email);
        if (basics.phone) contactInfo.push(basics.phone);
        if (basics.location?.city) contactInfo.push(basics.location.city);

        if (contactInfo.length > 0) {
            doc.text(contactInfo.join(' • '), 20, yPos);
            yPos += 15;
        }

        // Professional Summary
        if (basics.summary) {
            doc.setFontSize(12);
            doc.setTextColor(...primaryColor);
            doc.text('PROFESSIONAL SUMMARY', 20, yPos);
            yPos += 8;

            doc.setFontSize(10);
            doc.setTextColor(...darkColor);
            const summaryLines = doc.splitTextToSize(basics.summary, 170);
            doc.text(summaryLines, 20, yPos);
            yPos += (summaryLines.length * 5) + 10;
        }

        // Work Experience
        const workItems = resumeData.work || [];
        if (workItems.length > 0) {
            doc.setFontSize(12);
            doc.setTextColor(...primaryColor);
            doc.text('PROFESSIONAL EXPERIENCE', 20, yPos);
            yPos += 10;

            workItems.forEach(work => {
                if (yPos > 250) {
                    doc.addPage();
                    yPos = 20;
                }

                doc.setFontSize(11);
                doc.setTextColor(...darkColor);
                doc.text(work.position || 'Position', 20, yPos);
                yPos += 6;

                doc.setFontSize(10);
                doc.setTextColor(...primaryColor);
                doc.text(work.name || 'Company', 20, yPos);
                yPos += 5;

                // Date range
                const startDate = work.startDate ? formatDate(work.startDate) : '';
                const endDate = work.endDate ? formatDate(work.endDate) : 'Present';
                if (startDate) {
                    doc.setTextColor(100, 100, 100);
                    doc.text(`${startDate} - ${endDate}`, 20, yPos);
                    yPos += 6;
                }

                // Job description
                if (work.summary) {
                    doc.setTextColor(...darkColor);
                    const summaryLines = doc.splitTextToSize(work.summary, 170);
                    doc.text(summaryLines, 20, yPos);
                    yPos += (summaryLines.length * 4) + 8;
                }
            });

            yPos += 5;
        }

        // Education
        const educationItems = resumeData.education || [];
        if (educationItems.length > 0) {
            if (yPos > 230) {
                doc.addPage();
                yPos = 20;
            }

            doc.setFontSize(12);
            doc.setTextColor(...primaryColor);
            doc.text('EDUCATION', 20, yPos);
            yPos += 10;

            educationItems.forEach(education => {
                if (yPos > 250) {
                    doc.addPage();
                    yPos = 20;
                }

                doc.setFontSize(11);
                doc.setTextColor(...darkColor);
                doc.text(education.institution || 'Institution', 20, yPos);
                yPos += 6;

                let degreeInfo = '';
                if (education.studyType && education.area) {
                    degreeInfo = `${education.studyType} in ${education.area}`;
                } else if (education.area) {
                    degreeInfo = education.area;
                } else if (education.studyType) {
                    degreeInfo = education.studyType;
                }

                if (degreeInfo) {
                    doc.setFontSize(10);
                    doc.setTextColor(...primaryColor);
                    doc.text(degreeInfo, 20, yPos);
                    yPos += 5;
                }

                // Date range and GPA
                const startDate = education.startDate ? formatDate(education.startDate) : '';
                const endDate = education.endDate ? formatDate(education.endDate) : 'Present';
                let dateGpaText = '';
                if (startDate) {
                    dateGpaText = `${startDate} - ${endDate}`;
                }
                if (education.gpa) {
                    dateGpaText += dateGpaText ? ` • GPA: ${education.gpa}` : `GPA: ${education.gpa}`;
                }

                if (dateGpaText) {
                    doc.setTextColor(100, 100, 100);
                    doc.text(dateGpaText, 20, yPos);
                    yPos += 8;
                }
            });

            yPos += 5;
        }

        // Technical Skills
        const skills = resumeData.skills?.technologies || [];
        if (skills.length > 0) {
            if (yPos > 240) {
                doc.addPage();
                yPos = 20;
            }

            doc.setFontSize(12);
            doc.setTextColor(...primaryColor);
            doc.text('TECHNICAL SKILLS', 20, yPos);
            yPos += 8;

            const skillNames = skills.map(skill => skill.name).join(' • ');
            doc.setFontSize(10);
            doc.setTextColor(...darkColor);
            const skillLines = doc.splitTextToSize(skillNames, 170);
            doc.text(skillLines, 20, yPos);
        }

        // Generate filename
        let pdfName = 'resume.pdf';
        if (currentFilename) {
            const baseName = currentFilename.replace('.json', '');
            pdfName = `${baseName}.pdf`;
        } else if (basics.name) {
            const cleanName = basics.name.replace(/[^\w\s-]/g, '').trim().replace(/[-\s]+/g, '_');
            pdfName = `${cleanName}_resume.pdf`;
        }

        doc.save(pdfName);
        showToast('PDF exported successfully!');

    } catch (error) {
        console.error('Error exporting PDF:', error);
        showToast('Error exporting PDF. Please try again.', 'error');
    } finally {
        btn.classList.remove('btn-loading');
        btn.disabled = false;
    }
}

// Export to HTML
function exportHTML() {
    const btn = event.target.closest('button');
    btn.classList.add('btn-loading');
    btn.disabled = true;

    try {
        showToast('Generating HTML...', 'info');

        const basics = resumeData.basics || {};

        // Generate HTML content
        let htmlContent = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${basics.name || 'Resume'} - Resume</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            line-height: 1.6;
            color: #2c3e50;
            background-color: #ffffff;
            padding: 40px 20px;
            max-width: 800px;
            margin: 0 auto;
        }
        
        .header {
            text-align: center;
            margin-bottom: 40px;
            border-bottom: 2px solid #3498db;
            padding-bottom: 30px;
        }
        
        .name {
            font-size: 2.5em;
            font-weight: bold;
            color: #2c3e50;
            margin-bottom: 10px;
            letter-spacing: 1px;
        }
        
        .title {
            font-size: 1.3em;
            color: #3498db;
            margin-bottom: 15px;
            font-weight: 500;
        }
        
        .contact-info {
            color: #7f8c8d;
            font-size: 1em;
        }
        
        .section {
            margin-bottom: 35px;
        }
        
        .section-title {
            font-size: 1.4em;
            font-weight: bold;
            color: #2c3e50;
            margin-bottom: 20px;
            text-transform: uppercase;
            letter-spacing: 1px;
            position: relative;
            padding-bottom: 8px;
        }
        
        .section-title::after {
            content: '';
            position: absolute;
            bottom: 0;
            left: 0;
            width: 60px;
            height: 3px;
            background: #3498db;
        }
        
        .job, .education-item {
            margin-bottom: 25px;
            padding-left: 20px;
            border-left: 3px solid #3498db;
        }
        
        .job-title, .edu-title {
            font-size: 1.2em;
            font-weight: bold;
            color: #2c3e50;
            margin-bottom: 5px;
        }
        
        .company, .institution {
            font-size: 1em;
            color: #3498db;
            font-weight: 600;
            margin-bottom: 5px;
        }
        
        .date-range {
            font-size: 0.9em;
            color: #7f8c8d;
            font-style: italic;
            margin-bottom: 10px;
        }
        
        .current-badge {
            background: #27ae60;
            color: white;
            padding: 2px 8px;
            border-radius: 12px;
            font-size: 0.75em;
            font-weight: bold;
            margin-left: 10px;
        }
        
        .skills-list {
            color: #2c3e50;
        }
        
        @media (max-width: 600px) {
            body { padding: 20px 15px; }
            .name { font-size: 2em; }
        }
    </style>
</head>
<body>
    <header class="header">`;

        // Add name, title, contact info
        if (basics.name) {
            htmlContent += `\n        <h1 class="name">${basics.name}</h1>`;
        }

        if (basics.label) {
            htmlContent += `\n        <div class="title">${basics.label}</div>`;
        }

        // Contact info
        let contactInfo = [];
        if (basics.email) contactInfo.push(basics.email);
        if (basics.phone) contactInfo.push(basics.phone);
        if (basics.location?.city) contactInfo.push(basics.location.city);

        if (contactInfo.length > 0) {
            htmlContent += `\n        <div class="contact-info">${contactInfo.join(' • ')}</div>`;
        }

        htmlContent += '\n    </header>\n';

        // Professional Summary
        if (basics.summary && basics.summary.trim()) {
            htmlContent += `\n    <section class="section">
        <h2 class="section-title">Professional Summary</h2>
        <div>${basics.summary}</div>
    </section>`;
        }

        // Career Objective
        if (basics.objective && basics.objective.trim()) {
            htmlContent += `\n    <section class="section">
        <h2 class="section-title">Career Objective</h2>
        <div>${basics.objective}</div>
    </section>`;
        }

        // Work Experience
        const workItems = resumeData.work || [];
        if (workItems.length > 0) {
            htmlContent += '\n    <section class="section">\n        <h2 class="section-title">Professional Experience</h2>';

            workItems.forEach(work => {
                const currentBadge = work.isWorkingHere ? '<span class="current-badge">Current</span>' : '';
                const startDate = formatDate(work.startDate);
                const endDate = work.endDate ? formatDate(work.endDate) : 'Present';

                htmlContent += `\n        <div class="job">
            <div class="job-title">${work.position || 'Position'}${currentBadge}</div>
            <div class="company">${work.name || 'Company'}</div>`;

                if (startDate) {
                    htmlContent += `\n            <div class="date-range">${startDate} - ${endDate}</div>`;
                }

                if (work.summary && work.summary.trim()) {
                    htmlContent += `\n            <div>${work.summary}</div>`;
                }

                htmlContent += '\n        </div>';
            });

            htmlContent += '\n    </section>';
        }

        // Education
        const educationItems = resumeData.education || [];
        if (educationItems.length > 0) {
            htmlContent += '\n    <section class="section">\n        <h2 class="section-title">Education</h2>';

            educationItems.forEach(education => {
                const currentBadge = education.isStudyingHere ? '<span class="current-badge">Current</span>' : '';
                const startDate = formatDate(education.startDate);
                const endDate = education.endDate ? formatDate(education.endDate) : 'Present';

                let degreeInfo = '';
                if (education.studyType && education.area) {
                    degreeInfo = `${education.studyType} in ${education.area}`;
                } else if (education.area) {
                    degreeInfo = education.area;
                } else if (education.studyType) {
                    degreeInfo = education.studyType;
                }

                htmlContent += `\n        <div class="education-item">
            <div class="edu-title">${education.institution || 'Institution'}${currentBadge}</div>`;

                if (degreeInfo) {
                    htmlContent += `\n            <div class="institution">${degreeInfo}</div>`;
                }

                if (startDate) {
                    htmlContent += `\n            <div class="date-range">${startDate} - ${endDate}</div>`;
                }

                if (education.gpa) {
                    htmlContent += `\n            <div>GPA: ${education.gpa}</div>`;
                }

                if (education.summary && education.summary.trim()) {
                    htmlContent += `\n            <div>${education.summary}</div>`;
                }

                if (education.courses && education.courses.length > 0) {
                    const validCourses = education.courses.filter(course => course && course.trim());
                    if (validCourses.length > 0) {
                        htmlContent += `\n            <div><strong>Relevant Courses:</strong> ${validCourses.join(', ')}</div>`;
                    }
                }

                htmlContent += '\n        </div>';
            });

            htmlContent += '\n    </section>';
        }

        // Skills
        const skills = resumeData.skills?.technologies || [];
        if (skills.length > 0) {
            htmlContent += `\n    <section class="section">
        <h2 class="section-title">Technical Skills</h2>
        <div class="skills-list">`;

            const skillNames = skills.map(skill => skill.name);
            htmlContent += skillNames.join(' • ');

            htmlContent += '\n        </div>\n    </section>';
        }

        // Close HTML
        htmlContent += '\n</body>\n</html>';

        // Create and download the file
        const blob = new Blob([htmlContent], { type: 'text/html' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.style.display = 'none';
        a.href = url;

        // Generate filename
        let htmlName = 'resume.html';
        if (currentFilename) {
            const baseName = currentFilename.replace('.json', '');
            htmlName = `${baseName}.html`;
        } else if (basics.name) {
            const cleanName = basics.name.replace(/[^\w\s-]/g, '').trim().replace(/[-\s]+/g, '_');
            htmlName = `${cleanName}_resume.html`;
        }

        a.download = htmlName;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);

        showToast('HTML exported successfully!');

    } catch (error) {
        console.error('Error exporting HTML:', error);
        showToast('Error exporting HTML. Please try again.', 'error');
    } finally {
        btn.classList.remove('btn-loading');
        btn.disabled = false;
    }
}

// Auto-save functionality
let autoSaveTimeout;
function scheduleAutoSave() {
    clearTimeout(autoSaveTimeout);
    autoSaveTimeout = setTimeout(() => {
        if (currentFilename) {
            saveToStorage();
        }
    }, 30000); // Auto-save every 30 seconds
}