// Find Grace Lee's data from the patient list
function findGraceLeeData() {
    if (!window.PATIENT_DATA) {
        console.error('No patient data available');
        return null;
    }

    const data = window.PATIENT_DATA;
    
    // If we're in all patients mode, find Grace Lee
    if (data.patient && data.patient.id === 'all' && data.patients) {
        const graceLee = data.patients.find(p => 
            p.name && p.name.toLowerCase().includes('grace lee')
        );
        return graceLee;
    }
    
    // If we're in single patient mode and it's Grace Lee
    if (data.patient && data.patient.name && 
        data.patient.name.toLowerCase().includes('grace lee')) {
        return {
            id: data.patient.id,
            name: data.patient.name,
            gender: data.patient.gender,
            birthDate: data.patient.birthDate,
            data: data
        };
    }
    
    return null;
}

function calculateAge(birthDate) {
    if (!birthDate) return 'Unknown';
    const birth = new Date(birthDate);
    const today = new Date();
    const age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
        return age - 1;
    }
    return age;
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

function formatDateTime(dateString) {
    if (!dateString) return 'No date';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

function renderPatientHeader(patient) {
    document.getElementById('patientName').textContent = patient.name || 'Unknown Patient';
    
    const genderElement = document.getElementById('patientGender');
    const gender = patient.gender || 'Unknown';
    genderElement.innerHTML = `<i class="fas fa-venus-mars me-1"></i>${gender}`;
    
    const ageElement = document.getElementById('patientAge');
    const age = calculateAge(patient.birthDate);
    ageElement.innerHTML = `<i class="fas fa-calendar me-1"></i>Age ${age}`;
    
    const idElement = document.getElementById('patientId');
    idElement.innerHTML = `<i class="fas fa-id-card me-1"></i>${patient.id || 'Unknown ID'}`;
}

function renderAnalytics(patientData) {
    const conditions = patientData.condition || [];
    const observations = patientData.observation || [];
    const medications = patientData.medicationrequest || [];
    const encounters = patientData.encounter || [];
    
    document.getElementById('conditionsCount').textContent = conditions.length;
    document.getElementById('observationsCount').textContent = observations.length;
    document.getElementById('medicationsCount').textContent = medications.length;
    document.getElementById('encountersCount').textContent = encounters.length;
}

function renderConditions(conditions) {
    const container = document.getElementById('conditionsList');
    
    if (!conditions || conditions.length === 0) {
        container.innerHTML = '<div class="text-muted">No conditions recorded</div>';
        return;
    }
    
    const html = conditions.map(condition => `
        <div class="condition-item">
            <div class="item-name">${condition.name || 'Unknown Condition'}</div>
            ${condition.status ? `<div class="item-value">Status: ${condition.status}</div>` : ''}
            ${condition.date ? `<div class="item-date">Recorded: ${formatDate(condition.date)}</div>` : ''}
        </div>
    `).join('');
    
    container.innerHTML = html;
}

function renderObservations(observations) {
    const container = document.getElementById('observationsList');
    
    if (!observations || observations.length === 0) {
        container.innerHTML = '<div class="text-muted">No observations recorded</div>';
        return;
    }
    
    const html = observations.map(obs => `
        <div class="observation-item">
            <div class="item-name">${obs.name || 'Unknown Observation'}</div>
            ${obs.value ? `<div class="item-value">Value: ${obs.value}</div>` : ''}
            ${obs.date ? `<div class="item-date">Recorded: ${formatDateTime(obs.date)}</div>` : ''}
        </div>
    `).join('');
    
    container.innerHTML = html;
}

function renderMedications(medications) {
    const container = document.getElementById('medicationsList');
    
    if (!medications || medications.length === 0) {
        container.innerHTML = '<div class="text-muted">No medications prescribed</div>';
        return;
    }
    
    const html = medications.map(med => `
        <div class="medication-item">
            <div class="item-name">${med.name || 'Unknown Medication'}</div>
            ${med.dosage ? `<div class="item-value">Dosage: ${med.dosage}</div>` : ''}
            ${med.status ? `<div class="item-value">Status: ${med.status}</div>` : ''}
            ${med.date ? `<div class="item-date">Prescribed: ${formatDate(med.date)}</div>` : ''}
        </div>
    `).join('');
    
    container.innerHTML = html;
}

function renderEncounters(encounters) {
    const container = document.getElementById('encountersList');
    
    if (!encounters || encounters.length === 0) {
        container.innerHTML = '<div class="text-muted">No encounters recorded</div>';
        return;
    }
    
    const html = `
        <div class="encounter-timeline">
            ${encounters.map(encounter => `
                <div class="encounter-timeline-item">
                    <div class="item-name">${encounter.name || 'Healthcare Encounter'}</div>
                    ${encounter.status ? `<div class="item-value">Status: ${encounter.status}</div>` : ''}
                    ${encounter.date ? `<div class="item-date">${formatDateTime(encounter.date)}</div>` : ''}
                </div>
            `).join('')}
        </div>
    `;
    
    container.innerHTML = html;
}

function renderVitalSigns(vitalSigns) {
    const container = document.getElementById('vitalSignsList');
    
    if (!vitalSigns || vitalSigns.length === 0) {
        container.innerHTML = '<div class="text-muted">No vital signs recorded</div>';
        return;
    }
    
    const html = vitalSigns.map(vital => `
        <div class="vital-item">
            <div class="item-name">${vital.name || 'Unknown Vital Sign'}</div>
            ${vital.value ? `<div class="item-value">Value: ${vital.value}</div>` : ''}
            ${vital.date ? `<div class="item-date">Recorded: ${formatDateTime(vital.date)}</div>` : ''}
        </div>
    `).join('');
    
    container.innerHTML = html;
}

function initializeDashboard() {
    const graceLeeData = findGraceLeeData();
    
    if (!graceLeeData) {
        console.error('Grace Lee not found in patient data');
        document.getElementById('patientName').textContent = 'Grace Lee - Patient Not Found';
        return;
    }
    
    // Render patient header
    renderPatientHeader(graceLeeData);
    
    // Get patient's medical data
    const patientData = graceLeeData.data || {};
    
    // Render analytics overview
    renderAnalytics(patientData);
    
    // Render all sections
    renderConditions(patientData.condition);
    renderObservations(patientData.observation);
    renderMedications(patientData.medicationrequest);
    renderEncounters(patientData.encounter);
    renderVitalSigns(patientData.vital_signs);
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    // Wait a bit for PATIENT_DATA to be available
    setTimeout(initializeDashboard, 100);
});

// Also try to initialize immediately if data is already available
if (window.PATIENT_DATA) {
    initializeDashboard();
}