// Chronic conditions list for classification
const CHRONIC_CONDITIONS = [
    'hypertension', 'diabetes', 'asthma', 'copd', 'depression', 'dementia',
    'hypothyroidism', 'rheumatoid arthritis', 'ra', 'ckd', 'chronic kidney disease',
    'psoriasis', 'ulcerative colitis', 'glaucoma', 'anemia', 'gestational diabetes'
];

// Emergency/acute conditions
const EMERGENCY_CONDITIONS = [
    'sepsis', 'chest pain', 'fractured femur', 'tb', 'tuberculosis'
];

function isChronicCondition(conditionName) {
    if (!conditionName) return false;
    const name = conditionName.toLowerCase();
    return CHRONIC_CONDITIONS.some(chronic => name.includes(chronic));
}

function isEmergencyCondition(conditionName) {
    if (!conditionName) return false;
    const name = conditionName.toLowerCase();
    return EMERGENCY_CONDITIONS.some(emergency => name.includes(emergency));
}

function getConditionClass(conditionName) {
    if (isEmergencyCondition(conditionName)) return 'condition-emergency';
    if (isChronicCondition(conditionName)) return 'condition-chronic';
    return 'condition-acute';
}

function calculateAge(birthDate) {
    if (!birthDate) return 'Unknown';
    const today = new Date();
    const birth = new Date(birthDate);
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
        age--;
    }
    return age;
}

function formatGender(gender) {
    if (!gender) return 'Unknown';
    return gender.charAt(0).toUpperCase() + gender.slice(1);
}

function renderERPatients(patients) {
    const container = document.getElementById('erPatientsList');
    
    if (!patients || patients.length === 0) {
        container.innerHTML = `
            <div class="no-data">
                <i class="fas fa-hospital"></i>
                <div>No ER patients available</div>
            </div>
        `;
        return;
    }

    // For this demo, we'll show all patients as potential ER patients
    // In a real system, this would filter by location/encounter type
    const erPatients = patients.slice(0, 8); // Show first 8 as ER patients

    const html = erPatients.map(patient => {
        const age = calculateAge(patient.birthDate);
        const gender = formatGender(patient.gender);
        const conditions = patient.data?.condition || [];
        const vitals = patient.data?.vital_signs || [];
        
        const conditionBadges = conditions.map(condition => 
            `<span class="condition-badge ${getConditionClass(condition.name)}">${condition.name || 'Unknown'}</span>`
        ).join('');

        const latestVital = vitals.length > 0 ? vitals[0] : null;

        return `
            <div class="patient-item">
                <div class="patient-name">
                    <i class="fas fa-user-circle me-2 text-muted"></i>
                    ${patient.name || 'Unknown Patient'}
                </div>
                <div class="patient-info">
                    Age: ${age} • Gender: ${gender} • ID: ${patient.id}
                </div>
                ${conditionBadges ? `<div class="mb-2">${conditionBadges}</div>` : ''}
                ${latestVital ? `<div class="vital-sign"><i class="fas fa-heartbeat me-1"></i>${latestVital.name || 'Vital signs available'}</div>` : ''}
            </div>
        `;
    }).join('');

    container.innerHTML = html;
}

function renderChronicDiseases(patients) {
    const container = document.getElementById('chronicDiseaseList');
    
    if (!patients || patients.length === 0) {
        container.innerHTML = `
            <div class="no-data">
                <i class="fas fa-chart-pie"></i>
                <div>No chronic disease data available</div>
            </div>
        `;
        return;
    }

    // Count chronic conditions
    const diseaseCount = {};
    
    patients.forEach(patient => {
        const conditions = patient.data?.condition || [];
        conditions.forEach(condition => {
            if (condition.name && isChronicCondition(condition.name)) {
                const name = condition.name;
                diseaseCount[name] = (diseaseCount[name] || 0) + 1;
            }
        });
    });

    const sortedDiseases = Object.entries(diseaseCount)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 10); // Top 10

    if (sortedDiseases.length === 0) {
        container.innerHTML = `
            <div class="no-data">
                <i class="fas fa-heartbeat"></i>
                <div>No chronic conditions found</div>
            </div>
        `;
        return;
    }

    const html = sortedDiseases.map(([disease, count]) => `
        <div class="disease-item">
            <div class="disease-name">${disease}</div>
            <div class="disease-count">${count}</div>
        </div>
    `).join('');

    container.innerHTML = html;
}

function renderChronicPatients(patients) {
    const container = document.getElementById('chronicPatientsList');
    
    if (!patients || patients.length === 0) {
        container.innerHTML = `
            <div class="no-data">
                <i class="fas fa-users"></i>
                <div>No patients with chronic conditions</div>
            </div>
        `;
        return;
    }

    // Filter patients with chronic conditions
    const chronicPatients = patients.filter(patient => {
        const conditions = patient.data?.condition || [];
        return conditions.some(condition => isChronicCondition(condition.name));
    });

    if (chronicPatients.length === 0) {
        container.innerHTML = `
            <div class="no-data">
                <i class="fas fa-heartbeat"></i>
                <div>No patients with chronic conditions found</div>
            </div>
        `;
        return;
    }

    const html = chronicPatients.map(patient => {
        const age = calculateAge(patient.birthDate);
        const gender = formatGender(patient.gender);
        const conditions = patient.data?.condition || [];
        const medications = patient.data?.medicationrequest || [];
        const observations = patient.data?.observation || [];

        const chronicConditions = conditions.filter(c => isChronicCondition(c.name));
        const conditionBadges = chronicConditions.map(condition => 
            `<span class="condition-badge condition-chronic">${condition.name}</span>`
        ).join('');

        const latestObs = observations.length > 0 ? observations[0] : null;
        const activeMeds = medications.length;

        return `
            <div class="patient-item">
                <div class="patient-name">
                    <i class="fas fa-user-circle me-2 text-muted"></i>
                    ${patient.name || 'Unknown Patient'}
                </div>
                <div class="patient-info">
                    Age: ${age} • Gender: ${gender} • ID: ${patient.id}
                </div>
                <div class="mb-2">${conditionBadges}</div>
                <div class="patient-details">
                    <div class="detail-row">
                        <span class="detail-label">Chronic Conditions:</span>
                        <span class="detail-value">${chronicConditions.length}</span>
                    </div>
                    <div class="detail-row">
                        <span class="detail-label">Active Medications:</span>
                        <span class="detail-value">${activeMeds}</span>
                    </div>
                    ${latestObs ? `
                    <div class="detail-row">
                        <span class="detail-label">Latest Reading:</span>
                        <span class="detail-value">${latestObs.name}</span>
                    </div>
                    ` : ''}
                </div>
            </div>
        `;
    }).join('');

    container.innerHTML = html;
    document.getElementById('chronicPatientsCount').textContent = `${chronicPatients.length} patients`;
}

function updateStats(patients) {
    if (!patients) {
        document.getElementById('totalPatients').textContent = '0';
        document.getElementById('erPatients').textContent = '0';
        document.getElementById('chronicPatients').textContent = '0';
        document.getElementById('activeConditions').textContent = '0';
        return;
    }

    const totalPatients = patients.length;
    const erPatients = Math.min(8, totalPatients); // Simulated ER count
    
    const chronicPatients = patients.filter(patient => {
        const conditions = patient.data?.condition || [];
        return conditions.some(condition => isChronicCondition(condition.name));
    }).length;

    const totalConditions = patients.reduce((sum, patient) => {
        const conditions = patient.data?.condition || [];
        return sum + conditions.length;
    }, 0);

    document.getElementById('totalPatients').textContent = totalPatients;
    document.getElementById('erPatients').textContent = erPatients;
    document.getElementById('chronicPatients').textContent = chronicPatients;
    document.getElementById('activeConditions').textContent = totalConditions;
}

function initializeDashboard() {
    if (!window.PATIENT_DATA) {
        console.error('No patient data available');
        return;
    }

    const data = window.PATIENT_DATA;
    
    if (data.patient && data.patient.id === 'all' && data.patients) {
        // All patients mode
        const patients = data.patients;
        
        updateStats(patients);
        renderERPatients(patients);
        renderChronicDiseases(patients);
        renderChronicPatients(patients);
    } else {
        // Single patient mode - show message
        document.getElementById('erPatientsList').innerHTML = `
            <div class="no-data">
                <i class="fas fa-info-circle"></i>
                <div>This dashboard requires all patients data</div>
            </div>
        `;
        document.getElementById('chronicDiseaseList').innerHTML = `
            <div class="no-data">
                <i class="fas fa-info-circle"></i>
                <div>This dashboard requires all patients data</div>
            </div>
        `;
        document.getElementById('chronicPatientsList').innerHTML = `
            <div class="no-data">
                <i class="fas fa-info-circle"></i>
                <div>This dashboard requires all patients data</div>
            </div>
        `;
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    // Small delay to ensure PATIENT_DATA is loaded
    setTimeout(initializeDashboard, 100);
});