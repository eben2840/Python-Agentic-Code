// Mock patient data structure for development
window.PATIENT_DATA = {
    patient: {
        id: 'pat-0a70a8f4',
        name: 'Jane Doe',
        gender: 'female',
        birthDate: '1980-02-15'
    },
    condition: {
        summary: [
            {
                name: 'Breast Cancer',
                status: 'active',
                date: '2026-03-01T09:00:00Z',
                value: 'Breast Cancer'
            }
        ]
    },
    medicationrequest: {
        summary: [
            {
                name: 'Treatment for Breast Cancer',
                status: 'active',
                date: '',
                value: '1 tablet daily'
            }
        ]
    },
    observation: {
        summary: [
            {
                name: 'Tumor Marker CA15-3',
                status: 'final',
                date: '2026-03-05T12:00:00Z',
                value: 'Tumor Marker CA15-3'
            }
        ]
    },
    vital_signs: {
        summary: [
            {
                name: 'Tumor Marker CA15-3',
                status: 'final',
                date: '2026-03-05T12:00:00Z',
                value: 'Tumor Marker CA15-3'
            }
        ]
    },
    encounter: {
        summary: [
            {
                name: '',
                status: 'in-progress',
                date: '2026-03-01T08:00:00Z',
                value: ''
            }
        ]
    },
    locations: {
        summary: [
            {
                name: 'Room 205',
                value: 'Oncology Ward',
                status: 'active'
            }
        ]
    }
};

document.addEventListener('DOMContentLoaded', function() {
    loadPatientInfo();
    loadConditions();
    loadMedications();
    loadObservations();
    loadLocation();
    loadEncounter();
    generateCareGoals();
});

function loadPatientInfo() {
    const patientInfoEl = document.getElementById('patient-info');
    
    if (!window.PATIENT_DATA || !window.PATIENT_DATA.patient) {
        patientInfoEl.textContent = 'No patient data available';
        return;
    }

    const patient = window.PATIENT_DATA.patient;
    const age = calculateAge(patient.birthDate);
    patientInfoEl.innerHTML = `
        <strong>${patient.name}</strong> • ${patient.gender} • Age ${age} • ID: ${patient.id}
    `;
}

function loadConditions() {
    const conditionsEl = document.getElementById('conditions-list');
    
    if (!window.PATIENT_DATA?.condition?.summary || window.PATIENT_DATA.condition.summary.length === 0) {
        conditionsEl.innerHTML = '<div class="no-data">No conditions available</div>';
        return;
    }

    const conditionsHtml = window.PATIENT_DATA.condition.summary.map(condition => `
        <div class="condition-item">
            <div class="item-header">
                <i class="fas fa-circle text-danger me-2" style="font-size: 0.5rem;"></i>
                ${condition.name || 'Unknown Condition'}
            </div>
            <div class="item-details">
                Status: <span class="badge badge-warning">${condition.status || 'Unknown'}</span>
                ${condition.date ? `<br>Diagnosed: ${formatDate(condition.date)}` : ''}
            </div>
        </div>
    `).join('');

    conditionsEl.innerHTML = conditionsHtml;
}

function loadMedications() {
    const medicationsEl = document.getElementById('medications-list');
    
    if (!window.PATIENT_DATA?.medicationrequest?.summary || window.PATIENT_DATA.medicationrequest.summary.length === 0) {
        medicationsEl.innerHTML = '<div class="no-data">No medications available</div>';
        return;
    }

    const medicationsHtml = window.PATIENT_DATA.medicationrequest.summary.map(medication => `
        <div class="medication-item">
            <div class="item-header">
                <i class="fas fa-pill text-success me-2"></i>
                ${medication.name || 'Unknown Medication'}
            </div>
            <div class="item-details">
                Dosage: ${medication.value || 'Not specified'}<br>
                Status: <span class="badge badge-success">${medication.status || 'Unknown'}</span>
            </div>
        </div>
    `).join('');

    medicationsEl.innerHTML = medicationsHtml;
}

function loadObservations() {
    const observationsEl = document.getElementById('observations-list');
    
    if (!window.PATIENT_DATA?.observation?.summary || window.PATIENT_DATA.observation.summary.length === 0) {
        observationsEl.innerHTML = '<div class="no-data">No observations available</div>';
        return;
    }

    const observationsHtml = window.PATIENT_DATA.observation.summary.map(observation => `
        <div class="observation-item">
            <div class="item-header">
                <i class="fas fa-chart-bar text-info me-2"></i>
                ${observation.name || 'Unknown Observation'}
            </div>
            <div class="item-details">
                Result: ${observation.value || 'Not specified'}<br>
                Status: <span class="badge badge-info">${observation.status || 'Unknown'}</span>
                ${observation.date ? `<br>Date: ${formatDate(observation.date)}` : ''}
            </div>
        </div>
    `).join('');

    observationsEl.innerHTML = observationsHtml;
}

function loadLocation() {
    const locationEl = document.getElementById('location-info');
    
    if (!window.PATIENT_DATA?.locations?.summary || window.PATIENT_DATA.locations.summary.length === 0) {
        locationEl.innerHTML = '<div class="no-data">No location data available</div>';
        return;
    }

    const location = window.PATIENT_DATA.locations.summary[0];
    locationEl.innerHTML = `
        <div class="location-card">
            <div class="d-flex align-items-center">
                <i class="fas fa-bed text-warning me-3 fs-4"></i>
                <div>
                    <div class="item-header">${location.name || 'Unknown Room'}</div>
                    <div class="item-details">
                        Ward: ${location.value || 'Unknown Ward'}<br>
                        Status: <span class="badge badge-primary">${location.status || 'Unknown'}</span>
                    </div>
                </div>
            </div>
        </div>
    `;
}

function loadEncounter() {
    const encounterEl = document.getElementById('encounter-status');
    
    if (!window.PATIENT_DATA?.encounter?.summary || window.PATIENT_DATA.encounter.summary.length === 0) {
        encounterEl.innerHTML = '<div class="no-data">No encounter data available</div>';
        return;
    }

    const encounter = window.PATIENT_DATA.encounter.summary[0];
    encounterEl.innerHTML = `
        <div class="encounter-card">
            <div class="d-flex align-items-center">
                <i class="fas fa-calendar-check text-teal me-3 fs-4"></i>
                <div>
                    <div class="item-header">Current Encounter</div>
                    <div class="item-details">
                        Status: <span class="badge badge-success">${encounter.status || 'Unknown'}</span>
                        ${encounter.date ? `<br>Started: ${formatDate(encounter.date)}` : ''}
                    </div>
                </div>
            </div>
        </div>
    `;
}

function generateCareGoals() {
    const careGoalsEl = document.getElementById('care-goals');
    
    // Generate care goals based on available patient data
    const goals = [];
    
    // Check for conditions and create relevant goals
    if (window.PATIENT_DATA?.condition?.summary) {
        window.PATIENT_DATA.condition.summary.forEach(condition => {
            if (condition.name && condition.name.toLowerCase().includes('cancer')) {
                goals.push({
                    title: 'Monitor Cancer Treatment Progress',
                    description: 'Regular monitoring of treatment response and side effects',
                    priority: 'high',
                    actions: ['Schedule regular oncology appointments', 'Monitor tumor markers', 'Assess treatment tolerance']
                });
                goals.push({
                    title: 'Manage Treatment Side Effects',
                    description: 'Proactive management of chemotherapy-related side effects',
                    priority: 'medium',
                    actions: ['Monitor for nausea and fatigue', 'Nutritional support', 'Symptom assessment']
                });
            }
        });
    }

    // Check for medications and create adherence goals
    if (window.PATIENT_DATA?.medicationrequest?.summary) {
        goals.push({
            title: 'Ensure Medication Adherence',
            description: 'Monitor and support patient compliance with prescribed medications',
            priority: 'high',
            actions: ['Daily medication review', 'Patient education on importance', 'Side effect monitoring']
        });
    }

    // Check for observations and create monitoring goals
    if (window.PATIENT_DATA?.observation?.summary) {
        goals.push({
            title: 'Continue Laboratory Monitoring',
            description: 'Regular monitoring of key laboratory values and tumor markers',
            priority: 'medium',
            actions: ['Schedule follow-up labs', 'Trend analysis', 'Alert for critical values']
        });
    }

    // Default goal if no specific conditions found
    if (goals.length === 0) {
        goals.push({
            title: 'Comprehensive Care Assessment',
            description: 'Complete evaluation of patient needs and care requirements',
            priority: 'low',
            actions: ['Review medical history', 'Assess current symptoms', 'Develop care plan']
        });
    }

    const goalsHtml = goals.map(goal => `
        <div class="goal-item goal-priority-${goal.priority}">
            <div class="item-header">
                <i class="fas fa-bullseye text-primary me-2"></i>
                ${goal.title}
                <span class="badge badge-${goal.priority === 'high' ? 'warning' : goal.priority === 'medium' ? 'info' : 'success'} ms-2">
                    ${goal.priority.toUpperCase()} PRIORITY
                </span>
            </div>
            <div class="item-details mb-2">${goal.description}</div>
            <div class="item-details">
                <strong>Actions:</strong>
                <ul class="mb-0 mt-1">
                    ${goal.actions.map(action => `<li>${action}</li>`).join('')}
                </ul>
            </div>
        </div>
    `).join('');

    careGoalsEl.innerHTML = goalsHtml;
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
    if (!dateString) return 'Unknown';
    
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}