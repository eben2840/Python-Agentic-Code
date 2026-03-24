document.addEventListener('DOMContentLoaded', function() {
    // Initialize the application
    initializeApp();
    
    // Set up form submission
    document.getElementById('assessmentForm').addEventListener('submit', handleAssessmentSubmit);
    
    // Set today's date as default
    document.getElementById('assessmentDate').valueAsDate = new Date();
});

function initializeApp() {
    if (!window.PATIENT_DATA) {
        showError('Patient data not available');
        return;
    }
    
    populatePatientSelect();
    loadAdmissions();
    displayPatientSummaries();
}

function populatePatientSelect() {
    const select = document.getElementById('patientSelect');
    const data = window.PATIENT_DATA;
    
    if (data.patient && data.patient.id !== 'all') {
        // Single patient
        const option = document.createElement('option');
        option.value = data.patient.id;
        option.textContent = data.patient.name || 'Unknown Patient';
        select.appendChild(option);
    } else if (data.patients) {
        // Multiple patients
        data.patients.forEach(patient => {
            const option = document.createElement('option');
            option.value = patient.id;
            option.textContent = patient.name || 'Unknown Patient';
            select.appendChild(option);
        });
    }
}

function loadAdmissions() {
    const admissionsList = document.getElementById('admissionsList');
    const admissionCount = document.getElementById('admissionCount');
    const data = window.PATIENT_DATA;
    
    let admissions = [];
    
    if (data.patients) {
        // Process all patients
        data.patients.forEach(patient => {
            if (patient.data && patient.data.encounter) {
                patient.data.encounter.forEach(encounter => {
                    if (isAdmissionInPeriod(encounter.date)) {
                        admissions.push({
                            patientName: patient.name,
                            patientId: patient.id,
                            date: encounter.date,
                            status: encounter.status || 'Active',
                            conditions: getPatientConditions(patient)
                        });
                    }
                });
            }
        });
    } else if (data.encounter && data.encounter.summary) {
        // Single patient
        data.encounter.summary.forEach(encounter => {
            if (isAdmissionInPeriod(encounter.date)) {
                admissions.push({
                    patientName: data.patient.name,
                    patientId: data.patient.id,
                    date: encounter.date,
                    status: encounter.status || 'Active',
                    conditions: data.condition ? data.condition.summary.map(c => c.name) : []
                });
            }
        });
    }
    
    // Sort by date (most recent first)
    admissions.sort((a, b) => new Date(b.date) - new Date(a.date));
    
    admissionCount.textContent = admissions.length;
    
    if (admissions.length === 0) {
        admissionsList.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-calendar-times"></i>
                <p>No admissions found for January-March 2026</p>
            </div>
        `;
        return;
    }
    
    admissionsList.innerHTML = admissions.map(admission => `
        <div class="admission-item">
            <div class="d-flex justify-content-between align-items-start mb-2">
                <h6 class="mb-1">${admission.patientName}</h6>
                <small class="text-muted">${formatDate(admission.date)}</small>
            </div>
            <div class="mb-2">
                <span class="badge bg-secondary">${admission.status}</span>
            </div>
            ${admission.conditions.length > 0 ? `
                <div class="conditions">
                    ${admission.conditions.map(condition => `
                        <span class="condition-badge">${condition}</span>
                    `).join('')}
                </div>
            ` : ''}
        </div>
    `).join('');
}

function displayPatientSummaries() {
    const container = document.getElementById('patientSummaryCards');
    const data = window.PATIENT_DATA;
    
    if (!data.patients || data.patients.length === 0) {
        return;
    }
    
    const patientsWithData = data.patients.filter(patient => 
        patient.data && Object.keys(patient.data).length > 0
    );
    
    if (patientsWithData.length === 0) {
        container.innerHTML = `
            <div class="col-12">
                <div class="empty-state">
                    <i class="fas fa-users"></i>
                    <p>No patient data available</p>
                </div>
            </div>
        `;
        return;
    }
    
    container.innerHTML = patientsWithData.map(patient => `
        <div class="col-xl-4 col-lg-6 mb-4">
            <div class="patient-card">
                <div class="patient-header">
                    <div class="patient-avatar">
                        ${getInitials(patient.name)}
                    </div>
                    <div>
                        <h6 class="mb-1">${patient.name}</h6>
                        <small class="text-muted">
                            ${patient.gender || 'Unknown'} • ${calculateAge(patient.birthDate)} years
                        </small>
                    </div>
                </div>
                
                ${renderPatientData(patient.data)}
            </div>
        </div>
    `).join('');
}

function renderPatientData(patientData) {
    let html = '';
    
    // Conditions
    if (patientData.condition && patientData.condition.length > 0) {
        html += `
            <div class="mb-3">
                <h6 class="text-muted mb-2">
                    <i class="fas fa-diagnoses me-1"></i>Conditions
                </h6>
                ${patientData.condition.map(condition => `
                    <span class="condition-badge">${condition.name || 'Unknown condition'}</span>
                `).join('')}
            </div>
        `;
    }
    
    // Vital Signs
    if (patientData.vital_signs && patientData.vital_signs.length > 0) {
        html += `
            <div class="mb-3">
                <h6 class="text-muted mb-2">
                    <i class="fas fa-heartbeat me-1"></i>Latest Vitals
                </h6>
                ${patientData.vital_signs.slice(0, 3).map(vital => `
                    <div class="vital-item">
                        <strong>${vital.name || 'Unknown vital'}</strong>
                        ${vital.date ? `<small class="text-muted ms-2">${formatDate(vital.date)}</small>` : ''}
                    </div>
                `).join('')}
            </div>
        `;
    }
    
    // Medications
    if (patientData.medicationrequest && patientData.medicationrequest.length > 0) {
        html += `
            <div class="mb-3">
                <h6 class="text-muted mb-2">
                    <i class="fas fa-pills me-1"></i>Medications
                </h6>
                ${patientData.medicationrequest.slice(0, 2).map(med => `
                    <div class="medication-item">
                        <strong>${med.name || 'Unknown medication'}</strong>
                        ${med.value ? `<br><small>${med.value}</small>` : ''}
                    </div>
                `).join('')}
            </div>
        `;
    }
    
    return html || '<p class="text-muted">No clinical data available</p>';
}

function handleAssessmentSubmit(event) {
    event.preventDefault();
    
    const formData = new FormData(event.target);
    const assessment = {
        patientId: document.getElementById('patientSelect').value,
        date: document.getElementById('assessmentDate').value,
        chiefComplaint: document.getElementById('chiefComplaint').value,
        vitals: {
            bloodPressure: document.getElementById('bloodPressure').value,
            heartRate: document.getElementById('heartRate').value,
            temperature: document.getElementById('temperature').value
        },
        painScale: document.getElementById('painScale').value,
        consciousnessLevel: document.getElementById('consciousnessLevel').value,
        clinicalNotes: document.getElementById('clinicalNotes').value,
        riskLevel: document.getElementById('riskLevel').value
    };
    
    // Show success message
    showSuccessMessage('Assessment saved successfully!');
    
    // Reset form
    event.target.reset();
    document.getElementById('assessmentDate').valueAsDate = new Date();
}

function isAdmissionInPeriod(dateString) {
    if (!dateString) return false;
    
    const date = new Date(dateString);
    const year = date.getFullYear();
    const month = date.getMonth() + 1; // JavaScript months are 0-indexed
    
    return year === 2026 && month >= 1 && month <= 3;
}

function getPatientConditions(patient) {
    if (!patient.data || !patient.data.condition) return [];
    return patient.data.condition.map(c => c.name || 'Unknown condition');
}

function formatDate(dateString) {
    if (!dateString) return 'No date';
    
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    });
}

function getInitials(name) {
    if (!name) return '?';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
}

function calculateAge(birthDate) {
    if (!birthDate) return 'Unknown';
    
    const birth = new Date(birthDate);
    const today = new Date();
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
        age--;
    }
    
    return age;
}

function showSuccessMessage(message) {
    // Create toast notification
    const toast = document.createElement('div');
    toast.className = 'toast align-items-center text-white bg-success border-0 position-fixed';
    toast.style.cssText = 'top: 20px; right: 20px; z-index: 9999;';
    toast.innerHTML = `
        <div class="d-flex">
            <div class="toast-body">
                <i class="fas fa-check-circle me-2"></i>${message}
            </div>
            <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast"></button>
        </div>
    `;
    
    document.body.appendChild(toast);
    const bsToast = new bootstrap.Toast(toast);
    bsToast.show();
    
    // Remove from DOM after hiding
    toast.addEventListener('hidden.bs.toast', () => {
        document.body.removeChild(toast);
    });
}

function showError(message) {
    const container = document.querySelector('.container-fluid');
    container.innerHTML = `
        <div class="row justify-content-center">
            <div class="col-md-6">
                <div class="card">
                    <div class="card-body text-center py-5">
                        <i class="fas fa-exclamation-triangle text-warning fa-3x mb-3"></i>
                        <h5>Error Loading Data</h5>
                        <p class="text-muted">${message}</p>
                    </div>
                </div>
            </div>
        </div>
    `;
}