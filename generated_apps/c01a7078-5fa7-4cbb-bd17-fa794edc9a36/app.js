document.addEventListener('DOMContentLoaded', function() {
    if (!window.PATIENT_DATA) {
        console.error('PATIENT_DATA not available');
        showNoData();
        return;
    }

    const data = window.PATIENT_DATA;
    
    // Check if we have all patients data
    if (data.patient && data.patient.id === 'all' && data.patients) {
        renderAllPatientsWards(data.patients);
    } else {
        // Single patient - check if they have location data
        renderSinglePatientWard(data);
    }
});

function renderAllPatientsWards(patients) {
    const wardsMap = new Map();
    let totalPatients = 0;
    let totalConditions = 0;

    // Group patients by ward
    patients.forEach(patient => {
        totalPatients++;
        
        // Get patient's location/ward from locations data
        let ward = 'Unassigned Ward';
        if (patient.data && patient.data.locations) {
            patient.data.locations.forEach(location => {
                if (location.value) {
                    ward = location.value;
                }
            });
        }

        if (!wardsMap.has(ward)) {
            wardsMap.set(ward, []);
        }

        // Get patient conditions
        const conditions = [];
        if (patient.data && patient.data.condition) {
            patient.data.condition.forEach(condition => {
                conditions.push(condition);
                totalConditions++;
            });
        }

        wardsMap.get(ward).push({
            ...patient,
            conditions: conditions
        });
    });

    // Update stats
    updateStats(wardsMap.size, totalPatients, totalConditions);

    // Render wards
    if (wardsMap.size === 0) {
        showNoData();
        return;
    }

    const container = document.getElementById('wardsContainer');
    container.innerHTML = '';

    wardsMap.forEach((patients, wardName) => {
        const wardCard = createWardCard(wardName, patients);
        container.appendChild(wardCard);
    });
}

function renderSinglePatientWard(data) {
    let ward = 'Current Ward';
    let totalConditions = 0;

    // Get ward from locations
    if (data.locations && data.locations.summary) {
        data.locations.summary.forEach(location => {
            if (location.value) {
                ward = location.value;
            }
        });
    }

    // Get conditions
    const conditions = [];
    if (data.condition && data.condition.summary) {
        data.condition.summary.forEach(condition => {
            conditions.push(condition);
            totalConditions++;
        });
    }

    const patient = {
        id: data.patient.id,
        name: data.patient.name,
        gender: data.patient.gender,
        birthDate: data.patient.birthDate,
        conditions: conditions
    };

    // Update stats
    updateStats(1, 1, totalConditions);

    // Render single ward
    const container = document.getElementById('wardsContainer');
    container.innerHTML = '';
    
    const wardCard = createWardCard(ward, [patient]);
    container.appendChild(wardCard);
}

function createWardCard(wardName, patients) {
    const wardDiv = document.createElement('div');
    wardDiv.className = 'col-12';

    const totalConditions = patients.reduce((sum, p) => sum + (p.conditions?.length || 0), 0);

    wardDiv.innerHTML = `
        <div class="ward-card">
            <div class="ward-header">
                <div class="ward-title">
                    <i class="fas fa-hospital-alt me-2"></i>
                    ${escapeHtml(wardName)}
                </div>
                <div class="ward-subtitle">
                    ${patients.length} patient${patients.length !== 1 ? 's' : ''} • ${totalConditions} condition${totalConditions !== 1 ? 's' : ''}
                </div>
            </div>
            <div class="ward-body">
                ${patients.length === 0 ? 
                    '<div class="empty-state"><i class="fas fa-user-slash mb-2"></i><br>No patients in this ward</div>' :
                    patients.map(patient => createPatientItem(patient)).join('')
                }
            </div>
        </div>
    `;

    return wardDiv;
}

function createPatientItem(patient) {
    const initials = getPatientInitials(patient.name);
    const age = calculateAge(patient.birthDate);
    const genderIcon = patient.gender === 'male' ? 'fas fa-mars' : patient.gender === 'female' ? 'fas fa-venus' : 'fas fa-user';

    return `
        <div class="patient-item">
            <div class="patient-header">
                <div class="patient-info">
                    <div class="patient-avatar">
                        ${initials}
                    </div>
                    <div class="patient-details">
                        <h4>${escapeHtml(patient.name || 'Unknown Patient')}</h4>
                        <div class="patient-meta">
                            <i class="${genderIcon} me-1"></i>
                            ${patient.gender || 'Unknown'} • Age ${age}
                        </div>
                    </div>
                </div>
                <div class="patient-stats">
                    <div class="stat-badge">
                        <i class="fas fa-clipboard-list me-1"></i>
                        ${patient.conditions?.length || 0} condition${(patient.conditions?.length || 0) !== 1 ? 's' : ''}
                    </div>
                </div>
            </div>
            
            ${(patient.conditions && patient.conditions.length > 0) ? `
                <div class="conditions-list">
                    ${patient.conditions.map(condition => createConditionItem(condition)).join('')}
                </div>
            ` : `
                <div class="empty-state" style="padding: 1rem 0; font-size: 0.875rem;">
                    <i class="fas fa-check-circle text-success me-1"></i>
                    No active conditions documented
                </div>
            `}
        </div>
    `;
}

function createConditionItem(condition) {
    const conditionName = condition.name || 'Unknown Condition';
    const conditionDate = condition.date ? formatDate(condition.date) : 'No date';
    const conditionStatus = condition.status || 'Active';

    return `
        <div class="condition-item">
            <div class="condition-header">
                <div class="condition-name">
                    <i class="fas fa-stethoscope me-2"></i>
                    ${escapeHtml(conditionName)}
                </div>
                <div class="condition-status">
                    ${escapeHtml(conditionStatus)}
                </div>
            </div>
            <div class="condition-date">
                <i class="fas fa-calendar-alt me-1"></i>
                Documented: ${conditionDate}
            </div>
        </div>
    `;
}

function updateStats(totalWards, totalPatients, totalConditions) {
    document.getElementById('totalWards').textContent = totalWards;
    document.getElementById('totalPatients').textContent = totalPatients;
    document.getElementById('totalConditions').textContent = totalConditions;
}

function showNoData() {
    document.getElementById('wardsContainer').style.display = 'none';
    document.getElementById('noDataContainer').style.display = 'block';
    updateStats(0, 0, 0);
}

function getPatientInitials(name) {
    if (!name) return '?';
    const parts = name.split(' ');
    if (parts.length >= 2) {
        return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
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

function formatDate(dateString) {
    if (!dateString) return 'No date';
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

function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}