document.addEventListener('DOMContentLoaded', function() {
    if (!window.PATIENT_DATA) {
        console.error('Patient data not available');
        showNoData();
        return;
    }

    const data = window.PATIENT_DATA;
    
    // Check if we have all patients data
    if (data.patient.id !== 'all' || !data.patients) {
        showNoData();
        return;
    }

    // Filter patients who might be in ICU based on critical conditions
    const icuConditions = [
        'sepsis', 'chest pain', 'fractured femur', 'breast cancer', 
        'copd', 'ckd stage 4', 'tb', 'dementia'
    ];
    
    const icuPatients = data.patients.filter(patient => {
        if (!patient.data || !patient.data.condition) return false;
        
        return patient.data.condition.some(condition => {
            const conditionName = condition.name?.toLowerCase() || '';
            return icuConditions.some(icuCondition => 
                conditionName.includes(icuCondition)
            );
        });
    });

    if (icuPatients.length === 0) {
        showNoData();
        return;
    }

    displayPatients(icuPatients);
    updateStats(icuPatients);
});

function displayPatients(patients) {
    const container = document.getElementById('patientsContainer');
    container.innerHTML = '';

    patients.forEach(patient => {
        const patientCard = createPatientCard(patient);
        container.appendChild(patientCard);
    });
}

function createPatientCard(patient) {
    const col = document.createElement('div');
    col.className = 'col-lg-6 col-xl-4';

    const severity = determineSeverity(patient);
    const age = calculateAge(patient.birthDate);
    
    col.innerHTML = `
        <div class="patient-card">
            <div class="patient-header">
                <div class="patient-info">
                    <h5>${patient.name || 'Unknown Patient'}</h5>
                    <div class="patient-details">
                        <i class="fas fa-user me-1"></i>
                        ${patient.gender || 'Unknown'} • Age ${age} • ID: ${patient.id}
                    </div>
                </div>
                <span class="severity-badge severity-${severity.toLowerCase()}">
                    ${severity}
                </span>
            </div>
            
            <div class="condition-list">
                <h6 class="mb-2">
                    <i class="fas fa-stethoscope text-primary me-2"></i>
                    Active Conditions
                </h6>
                ${createConditionsList(patient.data.condition || [])}
            </div>
            
            ${createVitalsSection(patient.data.vital_signs || [])}
        </div>
    `;

    return col;
}

function createConditionsList(conditions) {
    if (!conditions || conditions.length === 0) {
        return '<p class="text-muted mb-0">No conditions recorded</p>';
    }

    return conditions.map(condition => {
        const severity = getConditionSeverity(condition.name);
        const date = condition.date ? new Date(condition.date).toLocaleDateString() : 'No date';
        
        return `
            <div class="condition-item">
                <div class="condition-icon ${severity}">
                    <i class="fas fa-exclamation-triangle"></i>
                </div>
                <div class="flex-grow-1">
                    <div class="condition-name">${condition.name || 'Unknown condition'}</div>
                    <div class="condition-date">Recorded: ${date}</div>
                </div>
            </div>
        `;
    }).join('');
}

function createVitalsSection(vitals) {
    if (!vitals || vitals.length === 0) {
        return `
            <div class="mt-3">
                <h6 class="mb-2">
                    <i class="fas fa-heartbeat text-danger me-2"></i>
                    Latest Vitals
                </h6>
                <p class="text-muted mb-0">No vital signs recorded</p>
            </div>
        `;
    }

    const vitalsGrid = vitals.map(vital => `
        <div class="vital-item">
            <div class="vital-value">${vital.value || vital.name || 'N/A'}</div>
            <div class="vital-label">${getVitalLabel(vital.name)}</div>
        </div>
    `).join('');

    return `
        <div class="mt-3">
            <h6 class="mb-2">
                <i class="fas fa-heartbeat text-danger me-2"></i>
                Latest Vitals
            </h6>
            <div class="vitals-grid">
                ${vitalsGrid}
            </div>
        </div>
    `;
}

function determineSeverity(patient) {
    if (!patient.data || !patient.data.condition) return 'Stable';
    
    const criticalConditions = ['sepsis', 'chest pain', 'fractured femur', 'breast cancer', 'ckd stage 4', 'tb'];
    const moderateConditions = ['copd', 'dementia'];
    
    const hasCondition = (conditionList) => {
        return patient.data.condition.some(condition => {
            const name = condition.name?.toLowerCase() || '';
            return conditionList.some(cond => name.includes(cond));
        });
    };
    
    if (hasCondition(criticalConditions)) return 'Critical';
    if (hasCondition(moderateConditions)) return 'Moderate';
    return 'Stable';
}

function getConditionSeverity(conditionName) {
    if (!conditionName) return 'stable';
    
    const name = conditionName.toLowerCase();
    const criticalConditions = ['sepsis', 'chest pain', 'fractured femur', 'breast cancer', 'ckd stage 4', 'tb'];
    
    if (criticalConditions.some(cond => name.includes(cond))) {
        return 'critical';
    }
    return 'stable';
}

function getVitalLabel(vitalName) {
    if (!vitalName) return 'Vital';
    
    const name = vitalName.toLowerCase();
    if (name.includes('bp')) return 'Blood Pressure';
    if (name.includes('temp')) return 'Temperature';
    if (name.includes('glucose')) return 'Glucose';
    if (name.includes('pain')) return 'Pain Level';
    if (name.includes('flow')) return 'Peak Flow';
    if (name.includes('fev')) return 'Lung Function';
    if (name.includes('egfr')) return 'Kidney Function';
    if (name.includes('hb')) return 'Hemoglobin';
    if (name.includes('iop')) return 'Eye Pressure';
    if (name.includes('wbc')) return 'White Blood Cells';
    
    return 'Vital Sign';
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

function updateStats(patients) {
    const totalPatients = patients.length;
    const criticalPatients = patients.filter(p => determineSeverity(p) === 'Critical').length;
    const stablePatients = patients.filter(p => determineSeverity(p) === 'Stable').length;
    
    document.getElementById('totalPatients').textContent = totalPatients;
    document.getElementById('criticalPatients').textContent = criticalPatients;
    document.getElementById('stablePatients').textContent = stablePatients;
}

function showNoData() {
    document.getElementById('patientsContainer').style.display = 'none';
    document.getElementById('noDataMessage').style.display = 'block';
    
    // Update stats to show zero
    document.getElementById('totalPatients').textContent = '0';
    document.getElementById('criticalPatients').textContent = '0';
    document.getElementById('stablePatients').textContent = '0';
}