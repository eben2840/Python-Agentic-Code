document.addEventListener('DOMContentLoaded', function() {
    // Wait for patient data to be available
    function initializeApp() {
        if (typeof window.PATIENT_DATA === 'undefined') {
            setTimeout(initializeApp, 100);
            return;
        }
        
        const data = window.PATIENT_DATA;
        
        if (data.patient && data.patient.id === 'all') {
            renderAllPatientsConditions(data);
        } else {
            renderSinglePatientConditions(data);
        }
    }
    
    function renderSinglePatientConditions(data) {
        // Update patient info
        const patientInfo = document.getElementById('patient-info');
        if (data.patient) {
            const birthDate = data.patient.birthDate ? new Date(data.patient.birthDate).toLocaleDateString() : 'Unknown';
            patientInfo.textContent = `${data.patient.name || 'Unknown Patient'} • ${data.patient.gender || 'Unknown'} • Born ${birthDate}`;
        }
        
        // Render conditions
        const container = document.getElementById('conditions-container');
        const conditions = data.conditions?.summary || [];
        
        if (conditions.length === 0) {
            container.innerHTML = `
                <div class="card no-data-card">
                    <div class="no-data-icon">
                        <i class="fas fa-clipboard-list"></i>
                    </div>
                    <h3 class="h5 mb-2">No Conditions Found</h3>
                    <p class="text-muted mb-0">No condition data available for this patient.</p>
                </div>
            `;
            return;
        }
        
        const conditionsHtml = conditions.map(condition => {
            const statusClass = getStatusClass(condition.status);
            const conditionDate = condition.date ? new Date(condition.date).toLocaleDateString() : 'Date unknown';
            
            return `
                <div class="col-12 col-md-6 col-lg-4 mb-3">
                    <div class="card condition-card h-100">
                        <div class="card-body">
                            <div class="d-flex align-items-start">
                                <div class="condition-icon me-3">
                                    <i class="fas fa-notes-medical"></i>
                                </div>
                                <div class="flex-grow-1">
                                    <div class="condition-title">${escapeHtml(condition.name || 'Unknown Condition')}</div>
                                    <div class="condition-date mb-2">${conditionDate}</div>
                                    <span class="status-badge ${statusClass}">
                                        ${condition.status || 'Unknown'}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            `;
        }).join('');
        
        container.innerHTML = `
            <div class="row">
                ${conditionsHtml}
            </div>
        `;
    }
    
    function renderAllPatientsConditions(data) {
        // Hide single patient container
        document.getElementById('conditions-container').style.display = 'none';
        
        // Update header
        const patientInfo = document.getElementById('patient-info');
        patientInfo.textContent = `Viewing conditions for all patients (${data.patients?.length || 0} patients)`;
        
        // Show all patients container
        const allPatientsContainer = document.getElementById('all-patients-container');
        allPatientsContainer.style.display = 'block';
        
        const patients = data.patients || [];
        
        if (patients.length === 0) {
            allPatientsContainer.innerHTML = `
                <div class="card no-data-card">
                    <div class="no-data-icon">
                        <i class="fas fa-users"></i>
                    </div>
                    <h3 class="h5 mb-2">No Patients Found</h3>
                    <p class="text-muted mb-0">No patient data available.</p>
                </div>
            `;
            return;
        }
        
        let allPatientsHtml = '';
        
        patients.forEach(patient => {
            const birthDate = patient.birthDate ? new Date(patient.birthDate).toLocaleDateString() : 'Unknown';
            let patientConditions = [];
            
            // Extract conditions from patient data
            if (patient.data && patient.data.conditions) {
                patientConditions = patient.data.conditions || [];
            }
            
            const conditionsHtml = patientConditions.length > 0 ? 
                patientConditions.map(condition => {
                    const statusClass = getStatusClass(condition.status);
                    const conditionDate = condition.date ? new Date(condition.date).toLocaleDateString() : 'Date unknown';
                    
                    return `
                        <div class="col-12 col-md-6 col-lg-4 mb-3">
                            <div class="card condition-card h-100">
                                <div class="card-body">
                                    <div class="d-flex align-items-start">
                                        <div class="condition-icon me-3">
                                            <i class="fas fa-notes-medical"></i>
                                        </div>
                                        <div class="flex-grow-1">
                                            <div class="condition-title">${escapeHtml(condition.name || 'Unknown Condition')}</div>
                                            <div class="condition-date mb-2">${conditionDate}</div>
                                            <span class="status-badge ${statusClass}">
                                                ${condition.status || 'Unknown'}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    `;
                }).join('') :
                `
                    <div class="col-12">
                        <div class="card">
                            <div class="card-body text-center py-4">
                                <i class="fas fa-clipboard-list text-muted mb-2" style="font-size: 2rem;"></i>
                                <p class="text-muted mb-0">No conditions found for this patient</p>
                            </div>
                        </div>
                    </div>
                `;
            
            allPatientsHtml += `
                <div class="card patient-header mb-4">
                    <div class="card-body">
                        <div class="patient-name">${escapeHtml(patient.name || 'Unknown Patient')}</div>
                        <div class="patient-details">${patient.gender || 'Unknown'} • Born ${birthDate} • ${patientConditions.length} condition(s)</div>
                    </div>
                </div>
                <div class="row mb-5">
                    ${conditionsHtml}
                </div>
            `;
        });
        
        allPatientsContainer.innerHTML = allPatientsHtml;
    }
    
    function getStatusClass(status) {
        if (!status) return 'status-inactive';
        
        const statusLower = status.toLowerCase();
        if (statusLower.includes('active') || statusLower.includes('current')) {
            return 'status-active';
        } else if (statusLower.includes('resolved') || statusLower.includes('inactive')) {
            return 'status-resolved';
        }
        return 'status-inactive';
    }
    
    function escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
    
    // Initialize the app
    initializeApp();
});