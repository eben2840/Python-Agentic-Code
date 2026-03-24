document.addEventListener('DOMContentLoaded', function() {
    if (!window.PATIENT_DATA) {
        console.error('Patient data not available');
        return;
    }

    const data = window.PATIENT_DATA;
    
    // Load patient basic information
    loadPatientInfo(data.patient);
    
    // Load all clinical data sections
    loadLocationData(data.locations);
    loadConditionData(data.condition);
    loadEncounterData(data.encounter);
    loadMedicationData(data.medicationrequest);
    loadObservationData(data.observation, data.vital_signs);
});

function loadPatientInfo(patient) {
    if (!patient) return;
    
    document.getElementById('patientName').textContent = patient.name || 'Unknown Patient';
    document.getElementById('patientGender').textContent = patient.gender || '-';
    
    if (patient.birthDate) {
        const birthDate = new Date(patient.birthDate);
        const age = calculateAge(birthDate);
        document.getElementById('patientAge').textContent = `Age ${age}`;
        document.getElementById('patientDob').textContent = `(DOB: ${formatDate(birthDate)})`;
    }
}

function loadLocationData(locations) {
    const container = document.getElementById('locationDetails');
    
    if (!locations || !locations.summary || locations.summary.length === 0) {
        container.innerHTML = '<div class="no-data">No location data available</div>';
        return;
    }
    
    const location = locations.summary[0];
    container.innerHTML = `
        <div class="detail-item">
            <div class="detail-label">Room</div>
            <div class="detail-value">${location.name || 'Not specified'}</div>
        </div>
        <div class="detail-item">
            <div class="detail-label">Ward</div>
            <div class="detail-value">${location.value || 'Not specified'}</div>
        </div>
        <div class="detail-item">
            <div class="detail-label">Status</div>
            <div class="detail-value">
                <span class="status-badge status-${location.status || 'unknown'}">${location.status || 'Unknown'}</span>
            </div>
        </div>
    `;
}

function loadConditionData(conditions) {
    const container = document.getElementById('conditionDetails');
    
    if (!conditions || !conditions.summary || conditions.summary.length === 0) {
        container.innerHTML = '<div class="no-data">No condition data available</div>';
        return;
    }
    
    let html = '';
    conditions.summary.forEach(condition => {
        html += `
            <div class="detail-item">
                <div class="detail-label">${condition.name || 'Unknown Condition'}</div>
                <div class="detail-value">
                    ${condition.date ? `Diagnosed: ${formatDate(new Date(condition.date))}` : 'Date not specified'}
                </div>
            </div>
        `;
    });
    
    container.innerHTML = html;
}

function loadEncounterData(encounters) {
    const container = document.getElementById('encounterDetails');
    
    if (!encounters || !encounters.summary || encounters.summary.length === 0) {
        container.innerHTML = '<div class="no-data">No encounter data available</div>';
        return;
    }
    
    const encounter = encounters.summary[0];
    container.innerHTML = `
        <div class="detail-item">
            <div class="detail-label">Status</div>
            <div class="detail-value">
                <span class="status-badge status-${encounter.status || 'unknown'}">${encounter.status || 'Unknown'}</span>
            </div>
        </div>
        <div class="detail-item">
            <div class="detail-label">Start Time</div>
            <div class="detail-value">${encounter.date ? formatDateTime(new Date(encounter.date)) : 'Not specified'}</div>
        </div>
    `;
}

function loadMedicationData(medications) {
    const container = document.getElementById('medicationDetails');
    
    if (!medications || !medications.summary || medications.summary.length === 0) {
        container.innerHTML = '<div class="no-data">No medication data available</div>';
        return;
    }
    
    let html = '';
    medications.summary.forEach(med => {
        html += `
            <div class="medication-item">
                <div class="medication-name">${med.name || 'Unknown Medication'}</div>
                <div class="medication-dosage">${med.value || 'Dosage not specified'}</div>
                <div class="mt-2">
                    <span class="status-badge status-${med.status || 'unknown'}">${med.status || 'Unknown'}</span>
                </div>
            </div>
        `;
    });
    
    container.innerHTML = html;
}

function loadObservationData(observations, vitalSigns) {
    const container = document.getElementById('observationDetails');
    
    // Combine observations and vital signs
    let allObservations = [];
    
    if (observations && observations.summary) {
        allObservations = allObservations.concat(observations.summary);
    }
    
    if (vitalSigns && vitalSigns.summary) {
        allObservations = allObservations.concat(vitalSigns.summary);
    }
    
    if (allObservations.length === 0) {
        container.innerHTML = '<div class="no-data">No observation data available</div>';
        return;
    }
    
    let html = '';
    allObservations.forEach(obs => {
        html += `
            <div class="observation-item">
                <div>
                    <div class="observation-name">${obs.name || 'Unknown Observation'}</div>
                    ${obs.date ? `<div class="observation-date">${formatDateTime(new Date(obs.date))}</div>` : ''}
                </div>
                <div class="observation-value">${obs.value || 'No value'}</div>
            </div>
        `;
    });
    
    container.innerHTML = html;
}

function calculateAge(birthDate) {
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
        age--;
    }
    
    return age;
}

function formatDate(date) {
    return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    });
}

function formatDateTime(date) {
    return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}