document.addEventListener('DOMContentLoaded', function() {
    if (!window.PATIENT_DATA) {
        console.error('Patient data not available');
        showNoDataMessage();
        return;
    }

    const data = window.PATIENT_DATA;
    
    // ENT-related conditions and terms
    const entConditions = [
        'tonsillitis', 'tonsil', 'throat', 'ear', 'nose', 'sinus', 'hearing', 
        'vertigo', 'dizziness', 'rhinitis', 'laryngitis', 'pharyngitis',
        'otitis', 'sinusitis', 'adenoid', 'vocal', 'voice', 'hoarse',
        'nasal', 'congestion', 'polyp', 'deviated septum', 'sleep apnea'
    ];

    let entPatients = [];

    if (data.patient && data.patient.id === 'all' && data.patients) {
        // Filter patients with ENT-related conditions
        entPatients = data.patients.filter(patient => {
            if (!patient.data) return false;
            
            // Check conditions
            if (patient.data.condition) {
                const hasEntCondition = patient.data.condition.some(condition => {
                    if (!condition.name) return false;
                    const conditionName = condition.name.toLowerCase();
                    return entConditions.some(entTerm => conditionName.includes(entTerm));
                });
                if (hasEntCondition) return true;
            }
            
            // Check observations for ENT-related measurements
            if (patient.data.observation) {
                const hasEntObservation = patient.data.observation.some(obs => {
                    if (!obs.name) return false;
                    const obsName = obs.name.toLowerCase();
                    return entConditions.some(entTerm => obsName.includes(entTerm));
                });
                if (hasEntObservation) return true;
            }
            
            return false;
        });
    }

    // Update summary statistics
    updateSummaryStats(entPatients);
    
    // Display patients
    if (entPatients.length > 0) {
        displayPatients(entPatients);
    } else {
        showNoDataMessage();
    }
});

function updateSummaryStats(patients) {
    const totalPatients = patients.length;
    let activeConditions = 0;
    let activeMedications = 0;
    let recentObservations = 0;

    patients.forEach(patient => {
        if (patient.data.condition) {
            activeConditions += patient.data.condition.length;
        }
        if (patient.data.medicationrequest) {
            activeMedications += patient.data.medicationrequest.length;
        }
        if (patient.data.observation) {
            recentObservations += patient.data.observation.length;
        }
    });

    document.getElementById('totalPatients').textContent = totalPatients;
    document.getElementById('activeConditions').textContent = activeConditions;
    document.getElementById('activeMedications').textContent = activeMedications;
    document.getElementById('recentObservations').textContent = recentObservations;
}

function displayPatients(patients) {
    const container = document.getElementById('patientsContainer');
    container.innerHTML = '';

    patients.forEach(patient => {
        const patientElement = createPatientElement(patient);
        container.appendChild(patientElement);
    });
}

function createPatientElement(patient) {
    const div = document.createElement('div');
    div.className = 'patient-item';

    // Calculate age
    const age = calculateAge(patient.birthDate);
    
    // Get gender badge class
    const genderBadgeClass = patient.gender === 'male' ? 'badge-gender-male' : 'badge-gender-female';
    
    div.innerHTML = `
        <div class="patient-header">
            <h6 class="patient-name">${patient.name || 'Unknown'}</h6>
            <span class="patient-id">ID: ${patient.id || 'N/A'}</span>
        </div>
        
        <div class="patient-info">
            <div class="info-item">
                <i class="fas fa-venus-mars"></i>
                <span class="badge ${genderBadgeClass}">${patient.gender || 'Unknown'}</span>
            </div>
            <div class="info-item">
                <i class="fas fa-birthday-cake"></i>
                ${patient.birthDate || 'Unknown'} (${age} years)
            </div>
        </div>

        <div class="patient-details">
            ${createConditionsSection(patient.data.condition)}
            ${createMedicationsSection(patient.data.medicationrequest)}
            ${createObservationsSection(patient.data.observation)}
            ${createVitalSignsSection(patient.data.vital_signs)}
        </div>
    `;

    return div;
}

function createConditionsSection(conditions) {
    if (!conditions || conditions.length === 0) {
        return `
            <div class="detail-section">
                <div class="detail-title">
                    <i class="fas fa-stethoscope"></i>
                    Conditions
                </div>
                <div class="text-muted" style="font-size: 12px;">No conditions recorded</div>
            </div>
        `;
    }

    const conditionsList = conditions.map(condition => `
        <li class="detail-item">
            <strong>${condition.name || 'Unknown condition'}</strong>
            ${condition.date ? `<br><small>Date: ${formatDate(condition.date)}</small>` : ''}
        </li>
    `).join('');

    return `
        <div class="detail-section">
            <div class="detail-title">
                <i class="fas fa-stethoscope"></i>
                Conditions (${conditions.length})
            </div>
            <ul class="detail-list">
                ${conditionsList}
            </ul>
        </div>
    `;
}

function createMedicationsSection(medications) {
    if (!medications || medications.length === 0) {
        return `
            <div class="detail-section">
                <div class="detail-title">
                    <i class="fas fa-pills"></i>
                    Medications
                </div>
                <div class="text-muted" style="font-size: 12px;">No medications recorded</div>
            </div>
        `;
    }

    const medicationsList = medications.map(med => `
        <li class="detail-item">
            <strong>${med.name || 'Unknown medication'}</strong>
            ${med.value ? `<br><small>Dosage: ${med.value}</small>` : ''}
        </li>
    `).join('');

    return `
        <div class="detail-section">
            <div class="detail-title">
                <i class="fas fa-pills"></i>
                Medications (${medications.length})
            </div>
            <ul class="detail-list">
                ${medicationsList}
            </ul>
        </div>
    `;
}

function createObservationsSection(observations) {
    if (!observations || observations.length === 0) {
        return `
            <div class="detail-section">
                <div class="detail-title">
                    <i class="fas fa-chart-line"></i>
                    Observations
                </div>
                <div class="text-muted" style="font-size: 12px;">No observations recorded</div>
            </div>
        `;
    }

    const observationsList = observations.map(obs => `
        <li class="detail-item">
            <strong>${obs.name || 'Unknown observation'}</strong>
            ${obs.value ? `<br><small>Value: ${obs.value}</small>` : ''}
            ${obs.date ? `<br><small>Date: ${formatDate(obs.date)}</small>` : ''}
        </li>
    `).join('');

    return `
        <div class="detail-section">
            <div class="detail-title">
                <i class="fas fa-chart-line"></i>
                Observations (${observations.length})
            </div>
            <ul class="detail-list">
                ${observationsList}
            </ul>
        </div>
    `;
}

function createVitalSignsSection(vitalSigns) {
    if (!vitalSigns || vitalSigns.length === 0) {
        return `
            <div class="detail-section">
                <div class="detail-title">
                    <i class="fas fa-heartbeat"></i>
                    Vital Signs
                </div>
                <div class="text-muted" style="font-size: 12px;">No vital signs recorded</div>
            </div>
        `;
    }

    const vitalSignsList = vitalSigns.map(vital => `
        <li class="detail-item">
            <strong>${vital.name || 'Unknown vital sign'}</strong>
            ${vital.value ? `<br><small>Value: ${vital.value}</small>` : ''}
            ${vital.date ? `<br><small>Date: ${formatDate(vital.date)}</small>` : ''}
        </li>
    `).join('');

    return `
        <div class="detail-section">
            <div class="detail-title">
                <i class="fas fa-heartbeat"></i>
                Vital Signs (${vitalSigns.length})
            </div>
            <ul class="detail-list">
                ${vitalSignsList}
            </ul>
        </div>
    `;
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
    
    try {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    } catch (error) {
        return dateString;
    }
}

function showNoDataMessage() {
    document.getElementById('patientsContainer').style.display = 'none';
    document.getElementById('noDataMessage').style.display = 'block';
}