document.addEventListener('DOMContentLoaded', function() {
    if (!window.PATIENT_DATA) {
        console.error('Patient data not available');
        showNoData();
        return;
    }

    const data = window.PATIENT_DATA;
    
    // Check if we have all patients data
    if (data.patient && data.patient.id === 'all' && data.patients) {
        loadAllPatientsData();
    } else {
        showNoData();
    }
});

function loadAllPatientsData() {
    const data = window.PATIENT_DATA;
    
    // Find ENT ward locations
    const entLocations = findENTLocations();
    
    // Find patients in ENT ward (this is a simplified approach since we don't have location assignments)
    // We'll show all patients and their conditions for this demo
    const entPatients = data.patients || [];
    
    // Update statistics
    updateStatistics(entPatients, entLocations);
    
    // Render patient list
    renderPatientList(entPatients);
}

function findENTLocations() {
    const data = window.PATIENT_DATA;
    const entRooms = [];
    
    // Look for ENT-related locations
    if (data.locations && data.locations.summary) {
        data.locations.summary.forEach(location => {
            if (location.name && location.name.toLowerCase().includes('ent')) {
                entRooms.push(location);
            }
        });
    }
    
    return entRooms;
}

function updateStatistics(patients, entLocations) {
    // Count patients with conditions (active ENT patients)
    const patientsWithConditions = patients.filter(patient => 
        patient.data && patient.data.condition && patient.data.condition.length > 0
    );
    
    // Count total conditions
    let totalConditions = 0;
    patients.forEach(patient => {
        if (patient.data && patient.data.condition) {
            totalConditions += patient.data.condition.length;
        }
    });
    
    // Update DOM
    document.getElementById('totalPatients').textContent = patientsWithConditions.length;
    document.getElementById('totalConditions').textContent = totalConditions;
    document.getElementById('entRooms').textContent = entLocations.length;
}

function renderPatientList(patients) {
    const patientListContainer = document.getElementById('patientList');
    const noDataContainer = document.getElementById('noData');
    
    // Filter patients who have conditions (representing ENT ward patients)
    const entPatients = patients.filter(patient => 
        patient.data && patient.data.condition && patient.data.condition.length > 0
    );
    
    if (entPatients.length === 0) {
        patientListContainer.style.display = 'none';
        noDataContainer.style.display = 'block';
        return;
    }
    
    patientListContainer.style.display = 'block';
    noDataContainer.style.display = 'none';
    
    let html = '';
    
    entPatients.forEach(patient => {
        const conditions = patient.data.condition || [];
        const patientInitials = getPatientInitials(patient.name);
        const age = calculateAge(patient.birthDate);
        const genderIcon = patient.gender === 'male' ? 'fa-mars' : 'fa-venus';
        
        html += `
            <div class="col-12 col-lg-6 mb-3">
                <div class="patient-card">
                    <div class="patient-header">
                        <div class="patient-avatar">
                            <i class="fas fa-user"></i>
                        </div>
                        <div class="patient-info flex-grow-1">
                            <h6>${escapeHtml(patient.name || 'Unknown Patient')}</h6>
                            <div class="patient-meta">
                                <i class="fas ${genderIcon} me-1"></i>
                                ${escapeHtml(patient.gender || 'Unknown')} • 
                                Age ${age} • 
                                ID: ${escapeHtml(patient.id || 'N/A')}
                            </div>
                        </div>
                    </div>
                    <div class="conditions-section">
                        <h6 class="mb-2">
                            <i class="fas fa-stethoscope me-2"></i>
                            Active Conditions (${conditions.length})
                        </h6>
                        <div class="conditions-list">
                            ${renderConditions(conditions)}
                        </div>
                    </div>
                </div>
            </div>
        `;
    });
    
    patientListContainer.innerHTML = html;
}

function renderConditions(conditions) {
    if (!conditions || conditions.length === 0) {
        return '<span class="no-conditions">No active conditions recorded</span>';
    }
    
    return conditions.map(condition => {
        const conditionName = condition.name || condition.code || 'Unknown Condition';
        return `<span class="condition-badge">${escapeHtml(conditionName)}</span>`;
    }).join('');
}

function getPatientInitials(name) {
    if (!name) return 'UN';
    const parts = name.split(' ');
    if (parts.length >= 2) {
        return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
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

function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function showNoData() {
    document.getElementById('totalPatients').textContent = '0';
    document.getElementById('totalConditions').textContent = '0';
    document.getElementById('entRooms').textContent = '0';
    document.getElementById('patientList').style.display = 'none';
    document.getElementById('noData').style.display = 'block';
}