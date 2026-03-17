document.addEventListener('DOMContentLoaded', function() {
    if (typeof window.PATIENT_DATA === 'undefined') {
        showError('No patient data available');
        return;
    }

    const data = window.PATIENT_DATA;
    
    if (data.patient.id === 'all') {
        showAllPatientsView(data);
    } else {
        showSinglePatientView(data);
    }
});

function showSinglePatientView(data) {
    // Update patient header
    updatePatientHeader(data.patient);
    
    // Show conditions
    displayConditions(data.condition?.summary || []);
    
    // Show observations
    displayObservations(data.observation?.summary || []);
    
    // Hide all patients view
    document.getElementById('allPatientsView').style.display = 'none';
}

function showAllPatientsView(data) {
    // Update header for all patients
    document.getElementById('patientName').textContent = 'All Patients';
    document.getElementById('patientInfo').textContent = 'Conditions and Observations Overview';
    
    // Hide single patient cards
    document.querySelector('.row.g-4').style.display = 'none';
    
    // Show all patients view
    document.getElementById('allPatientsView').style.display = 'block';
    
    displayAllPatients(data.patients || []);
}

function updatePatientHeader(patient) {
    document.getElementById('patientName').textContent = patient.name || 'Unknown Patient';
    
    const info = [];
    if (patient.gender) info.push(capitalizeFirst(patient.gender));
    if (patient.birthDate) info.push(`DOB: ${formatDate(patient.birthDate)}`);
    if (patient.id) info.push(`ID: ${patient.id}`);
    
    document.getElementById('patientInfo').textContent = info.join(' • ') || 'No additional information';
}

function displayConditions(conditions) {
    const container = document.getElementById('conditionsList');
    const countBadge = document.getElementById('conditionsCount');
    
    countBadge.textContent = conditions.length;
    
    if (conditions.length === 0) {
        container.innerHTML = `
            <div class="no-data">
                <i class="fas fa-notes-medical"></i>
                <p>No conditions available</p>
            </div>
        `;
        return;
    }
    
    container.innerHTML = conditions.map(condition => `
        <div class="condition-item">
            <div class="condition-name">${escapeHtml(condition.name || 'Unknown Condition')}</div>
            <div class="d-flex justify-content-between align-items-center mt-2">
                <div class="condition-date">
                    ${condition.date ? formatDateTime(condition.date) : 'Date not specified'}
                </div>
                ${condition.status ? `<span class="status-badge status-${getStatusClass(condition.status)}">${condition.status}</span>` : ''}
            </div>
        </div>
    `).join('');
}

function displayObservations(observations) {
    const container = document.getElementById('observationsList');
    const countBadge = document.getElementById('observationsCount');
    
    countBadge.textContent = observations.length;
    
    if (observations.length === 0) {
        container.innerHTML = `
            <div class="no-data">
                <i class="fas fa-chart-bar"></i>
                <p>No observations available</p>
            </div>
        `;
        return;
    }
    
    container.innerHTML = observations.map(observation => `
        <div class="observation-item">
            <div class="observation-name">${escapeHtml(observation.name || 'Unknown Observation')}</div>
            <div class="observation-value mt-1">
                ${observation.value ? escapeHtml(observation.value) : 'Value not recorded'}
            </div>
            <div class="observation-date mt-2">
                ${observation.date ? formatDateTime(observation.date) : 'Date not specified'}
            </div>
        </div>
    `).join('');
}

function displayAllPatients(patients) {
    const container = document.getElementById('allPatientsList');
    const countBadge = document.getElementById('totalPatientsCount');
    
    // Filter patients that have conditions or observations
    const patientsWithData = patients.filter(patient => 
        (patient.data?.condition?.length > 0) || (patient.data?.observation?.length > 0)
    );
    
    countBadge.textContent = patientsWithData.length;
    
    if (patientsWithData.length === 0) {
        container.innerHTML = `
            <div class="no-data">
                <i class="fas fa-users"></i>
                <p>No patients with conditions or observations found</p>
            </div>
        `;
        return;
    }
    
    container.innerHTML = patientsWithData.map(patient => {
        const conditionsCount = patient.data?.condition?.length || 0;
        const observationsCount = patient.data?.observation?.length || 0;
        
        return `
            <div class="patient-item">
                <div class="d-flex justify-content-between align-items-start">
                    <div>
                        <div class="patient-name">${escapeHtml(patient.name || 'Unknown Patient')}</div>
                        <div class="text-muted">
                            ${patient.gender ? capitalizeFirst(patient.gender) : ''} 
                            ${patient.birthDate ? `• DOB: ${formatDate(patient.birthDate)}` : ''}
                        </div>
                    </div>
                    <div class="text-end">
                        <span class="badge bg-danger me-1">${conditionsCount} Conditions</span>
                        <span class="badge bg-success">${observationsCount} Observations</span>
                    </div>
                </div>
                
                ${(conditionsCount > 0 || observationsCount > 0) ? `
                    <div class="patient-summary">
                        ${conditionsCount > 0 ? `
                            <div class="summary-item">
                                <span class="summary-label">Latest Condition:</span>
                                <span class="summary-value">${escapeHtml(patient.data.condition[0]?.name || 'Unknown')}</span>
                            </div>
                        ` : ''}
                        ${observationsCount > 0 ? `
                            <div class="summary-item">
                                <span class="summary-label">Latest Observation:</span>
                                <span class="summary-value">${escapeHtml(patient.data.observation[0]?.name || 'Unknown')}</span>
                            </div>
                        ` : ''}
                    </div>
                ` : ''}
            </div>
        `;
    }).join('');
}

function formatDate(dateString) {
    if (!dateString) return 'Unknown';
    try {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', { 
            year: 'numeric', 
            month: 'short', 
            day: 'numeric' 
        });
    } catch (e) {
        return dateString;
    }
}

function formatDateTime(dateString) {
    if (!dateString) return 'Unknown';
    try {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', { 
            year: 'numeric', 
            month: 'short', 
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    } catch (e) {
        return dateString;
    }
}

function capitalizeFirst(str) {
    if (!str) return '';
    return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
}

function getStatusClass(status) {
    if (!status) return 'inactive';
    const statusLower = status.toLowerCase();
    if (statusLower.includes('active')) return 'active';
    if (statusLower.includes('resolved') || statusLower.includes('completed')) return 'resolved';
    return 'inactive';
}

function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function showError(message) {
    document.getElementById('patientName').textContent = 'Error';
    document.getElementById('patientInfo').textContent = message;
    
    document.getElementById('conditionsList').innerHTML = `
        <div class="no-data">
            <i class="fas fa-exclamation-triangle text-warning"></i>
            <p>${message}</p>
        </div>
    `;
    
    document.getElementById('observationsList').innerHTML = `
        <div class="no-data">
            <i class="fas fa-exclamation-triangle text-warning"></i>
            <p>${message}</p>
        </div>
    `;
}