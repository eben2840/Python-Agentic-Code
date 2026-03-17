document.addEventListener('DOMContentLoaded', function() {
    initializeSBARApp();
});

function initializeSBARApp() {
    if (!window.PATIENT_DATA) {
        showNoDataView();
        return;
    }

    const data = window.PATIENT_DATA;
    
    if (data.patient && data.patient.id === 'all') {
        showAllPatientsView(data);
    } else if (data.patient) {
        showSinglePatientView(data);
    } else {
        showNoDataView();
    }
}

function showSinglePatientView(data) {
    const patient = data.patient;
    
    // Update patient info header
    const patientInfo = document.getElementById('patient-info');
    const age = calculateAge(patient.birthDate);
    const ageText = age !== null ? ` (${age} years old)` : '';
    patientInfo.textContent = `${patient.name || 'Unknown Patient'} • ${patient.gender || 'Unknown'} • ${formatDate(patient.birthDate) || 'DOB Unknown'}${ageText}`;
    
    // Generate SBAR content
    generateSituation(data);
    generateBackground(data);
    generateAssessment(data);
    generateRecommendation(data);
    
    // Show single patient view
    document.getElementById('single-patient-view').classList.remove('d-none');
    document.getElementById('all-patients-view').classList.add('d-none');
    document.getElementById('no-data-view').classList.add('d-none');
}

function showAllPatientsView(data) {
    document.getElementById('patient-info').textContent = 'Multiple patients available - select one for SBAR handover';
    
    const patientList = document.getElementById('patient-list');
    patientList.innerHTML = '';
    
    if (data.patients && data.patients.length > 0) {
        data.patients.forEach(patient => {
            if (patient.id === 'all') return; // Skip the "all" entry
            
            const patientCard = createPatientCard(patient);
            patientList.appendChild(patientCard);
        });
    } else {
        patientList.innerHTML = '<div class="col-12"><p class="no-data-text">No individual patients available</p></div>';
    }
    
    document.getElementById('all-patients-view').classList.remove('d-none');
    document.getElementById('single-patient-view').classList.add('d-none');
    document.getElementById('no-data-view').classList.add('d-none');
}

function showNoDataView() {
    document.getElementById('patient-info').textContent = 'No patient data available';
    document.getElementById('no-data-view').classList.remove('d-none');
    document.getElementById('single-patient-view').classList.add('d-none');
    document.getElementById('all-patients-view').classList.add('d-none');
}

function createPatientCard(patient) {
    const col = document.createElement('div');
    col.className = 'col-md-6 col-lg-4';
    
    const age = calculateAge(patient.birthDate);
    const ageText = age !== null ? ` (${age}y)` : '';
    
    // Get conditions for this patient
    const conditions = [];
    if (patient.data && patient.data.condition) {
        patient.data.condition.forEach(condition => {
            if (condition.name) {
                conditions.push(condition.name);
            }
        });
    }
    
    const conditionBadges = conditions.map(condition => 
        `<span class="condition-badge">${condition}</span>`
    ).join('');
    
    col.innerHTML = `
        <div class="patient-card">
            <div class="patient-name">${patient.name || 'Unknown Patient'}</div>
            <div class="patient-details">
                ${patient.gender || 'Unknown'} • ${formatDate(patient.birthDate) || 'DOB Unknown'}${ageText}
            </div>
            ${conditionBadges ? `<div class="mt-2">${conditionBadges}</div>` : ''}
        </div>
    `;
    
    return col;
}

function generateSituation(data) {
    const content = document.getElementById('situation-content');
    let html = '';
    
    // Current admission reason and status
    const conditions = data.condition || [];
    const encounters = data.encounter || [];
    
    if (conditions.length > 0) {
        const primaryCondition = conditions[0];
        html += `<div class="clinical-item">
            <div class="clinical-label">Primary Diagnosis</div>
            <div class="clinical-value">${primaryCondition.name || 'Unknown condition'}</div>
        </div>`;
        
        if (primaryCondition.date) {
            const daysSinceAdmission = calculateDaysSince(primaryCondition.date);
            html += `<div class="clinical-item">
                <div class="clinical-label">Time Since Diagnosis</div>
                <div class="clinical-value">${daysSinceAdmission} days (${formatDate(primaryCondition.date)})</div>
            </div>`;
        }
    }
    
    if (encounters.length > 0) {
        const recentEncounter = encounters[0];
        if (recentEncounter.date) {
            const daysSinceEncounter = calculateDaysSince(recentEncounter.date);
            html += `<div class="clinical-item">
                <div class="clinical-label">Current Encounter</div>
                <div class="clinical-value">${daysSinceEncounter} days since admission (${formatDate(recentEncounter.date)})</div>
            </div>`;
        }
    }
    
    // Current status based on latest observations
    const observations = data.observation || [];
    if (observations.length > 0) {
        const latestObs = observations[0];
        const isAbnormal = checkIfAbnormal(latestObs.name, latestObs.value);
        html += `<div class="clinical-item ${isAbnormal ? 'abnormal' : 'normal'}">
            <div class="clinical-label">Current Status</div>
            <div class="clinical-value">
                Latest: ${latestObs.name || 'Unknown'} - ${latestObs.value || 'No value'}
                ${isAbnormal ? '<span class="abnormal-flag"><i class="fas fa-exclamation-triangle me-1"></i>ABNORMAL</span>' : ''}
            </div>
        </div>`;
    }
    
    if (!html) {
        html = '<p class="no-data-text">No current situation data available</p>';
    }
    
    content.innerHTML = html;
}

function generateBackground(data) {
    const content = document.getElementById('background-content');
    let html = '';
    
    // Medical history and diagnoses
    const conditions = data.condition || [];
    if (conditions.length > 0) {
        html += '<div class="clinical-item"><div class="clinical-label">Active Diagnoses</div>';
        conditions.forEach(condition => {
            html += `<div class="clinical-value">• ${condition.name || 'Unknown condition'}${condition.date ? ` (${formatDate(condition.date)})` : ''}</div>`;
        });
        html += '</div>';
    }
    
    // Current medications
    const medications = data.medicationrequest || [];
    if (medications.length > 0) {
        html += '<div class="clinical-item"><div class="clinical-label">Current Medications</div>';
        medications.forEach(med => {
            html += `<div class="clinical-value">• ${med.name || 'Unknown medication'}${med.dosage ? ` - ${med.dosage}` : ''}</div>`;
        });
        html += '</div>';
    }
    
    // Patient demographics
    const patient = data.patient;
    if (patient) {
        const age = calculateAge(patient.birthDate);
        html += `<div class="clinical-item">
            <div class="clinical-label">Patient Demographics</div>
            <div class="clinical-value">${patient.gender || 'Unknown'} • ${age !== null ? `${age} years old` : 'Age unknown'}</div>
        </div>`;
    }
    
    if (!html) {
        html = '<p class="no-data-text">No background data available</p>';
    }
    
    content.innerHTML = html;
}

function generateAssessment(data) {
    const content = document.getElementById('assessment-content');
    let html = '';
    
    // Latest vitals and observations
    const observations = data.observation || [];
    const vitalSigns = data.vital_signs || [];
    
    // Combine and deduplicate observations
    const allObservations = [...observations, ...vitalSigns];
    const uniqueObservations = allObservations.filter((obs, index, self) => 
        index === self.findIndex(o => o.name === obs.name && o.date === obs.date)
    );
    
    if (uniqueObservations.length > 0) {
        html += '<div class="clinical-item"><div class="clinical-label">Latest Observations</div>';
        uniqueObservations.forEach(obs => {
            const isAbnormal = checkIfAbnormal(obs.name, obs.value);
            const isUrgent = checkIfUrgent(obs.name, obs.value);
            
            html += `<div class="clinical-value">
                • ${obs.name || 'Unknown'}: ${obs.value || 'No value'}
                ${obs.date ? ` (${formatDateTime(obs.date)})` : ''}
                ${isUrgent ? '<span class="urgent-flag"><i class="fas fa-exclamation-circle me-1"></i>URGENT</span>' : 
                  isAbnormal ? '<span class="abnormal-flag"><i class="fas fa-exclamation-triangle me-1"></i>ABNORMAL</span>' : ''}
            </div>`;
        });
        html += '</div>';
    }
    
    // Clinical trends and concerns
    if (uniqueObservations.length > 1) {
        html += '<div class="clinical-item"><div class="clinical-label">Clinical Trends</div>';
        html += '<div class="clinical-value">Multiple observations recorded - monitor for trends</div>';
        html += '</div>';
    }
    
    if (!html) {
        html = '<p class="no-data-text">No assessment data available</p>';
    }
    
    content.innerHTML = html;
}

function generateRecommendation(data) {
    const content = document.getElementById('recommendation-content');
    let html = '';
    
    // Medication schedule
    const medications = data.medicationrequest || [];
    if (medications.length > 0) {
        html += '<div class="clinical-item"><div class="clinical-label">Medication Management</div>';
        medications.forEach(med => {
            html += `<div class="clinical-value">• Continue ${med.name || 'Unknown medication'}${med.dosage ? ` - ${med.dosage}` : ''}</div>`;
        });
        html += '</div>';
    }
    
    // Monitoring requirements based on conditions
    const conditions = data.condition || [];
    if (conditions.length > 0) {
        html += '<div class="clinical-item"><div class="clinical-label">Monitoring Requirements</div>';
        conditions.forEach(condition => {
            const monitoring = getMonitoringRecommendations(condition.name);
            if (monitoring) {
                html += `<div class="clinical-value">• ${condition.name}: ${monitoring}</div>`;
            }
        });
        html += '</div>';
    }
    
    // Urgent actions based on abnormal values
    const observations = data.observation || [];
    const vitalSigns = data.vital_signs || [];
    const allObservations = [...observations, ...vitalSigns];
    
    const urgentActions = [];
    allObservations.forEach(obs => {
        if (checkIfUrgent(obs.name, obs.value)) {
            urgentActions.push(`Immediate attention required for ${obs.name}: ${obs.value}`);
        }
    });
    
    if (urgentActions.length > 0) {
        html += '<div class="clinical-item urgent"><div class="clinical-label">URGENT ACTIONS REQUIRED <span class="urgent-flag"><i class="fas fa-exclamation-circle me-1"></i>PRIORITY</span></div>';
        urgentActions.forEach(action => {
            html += `<div class="clinical-value">• ${action}</div>`;
        });
        html += '</div>';
    }
    
    // General recommendations
    html += '<div class="clinical-item"><div class="clinical-label">General Care Plan</div>';
    html += '<div class="clinical-value">• Continue current treatment plan</div>';
    html += '<div class="clinical-value">• Monitor patient response to interventions</div>';
    html += '<div class="clinical-value">• Escalate any concerns to attending physician</div>';
    html += '</div>';
    
    content.innerHTML = html;
}

function checkIfAbnormal(observationName, value) {
    if (!observationName || !value) return false;
    
    const name = observationName.toLowerCase();
    const val = value.toString().toLowerCase();
    
    // Define abnormal patterns
    const abnormalPatterns = [
        'abnormal', 'high', 'low', 'elevated', 'decreased',
        'positive', 'negative', 'critical'
    ];
    
    // Specific value checks
    if (name.includes('bp') || name.includes('blood pressure')) {
        const match = val.match(/(\d+)\/(\d+)/);
        if (match) {
            const systolic = parseInt(match[1]);
            const diastolic = parseInt(match[2]);
            return systolic > 140 || systolic < 90 || diastolic > 90 || diastolic < 60;
        }
    }
    
    if (name.includes('temp')) {
        const temp = parseFloat(val);
        if (!isNaN(temp)) {
            return temp > 38.0 || temp < 36.0;
        }
    }
    
    // Pattern matching
    return abnormalPatterns.some(pattern => val.includes(pattern));
}

function checkIfUrgent(observationName, value) {
    if (!observationName || !value) return false;
    
    const name = observationName.toLowerCase();
    const val = value.toString().toLowerCase();
    
    // Critical values that require immediate attention
    if (name.includes('bp') || name.includes('blood pressure')) {
        const match = val.match(/(\d+)\/(\d+)/);
        if (match) {
            const systolic = parseInt(match[1]);
            const diastolic = parseInt(match[2]);
            return systolic > 180 || systolic < 70 || diastolic > 110 || diastolic < 40;
        }
    }
    
    if (name.includes('temp')) {
        const temp = parseFloat(val);
        if (!isNaN(temp)) {
            return temp > 39.5 || temp < 35.0;
        }
    }
    
    // Pattern matching for urgent indicators
    const urgentPatterns = ['critical', 'severe', 'emergency', 'urgent'];
    return urgentPatterns.some(pattern => val.includes(pattern));
}

function getMonitoringRecommendations(conditionName) {
    if (!conditionName) return null;
    
    const condition = conditionName.toLowerCase();
    
    const recommendations = {
        'hypertension': 'Monitor BP q4h, check for headache/dizziness',
        'diabetes': 'Monitor blood glucose q6h, watch for hypo/hyperglycemia',
        'asthma': 'Monitor respiratory rate, peak flow, oxygen saturation',
        'copd': 'Monitor O2 sats, respiratory effort, sputum production',
        'sepsis': 'Monitor vital signs q1h, urine output, mental status',
        'pneumonia': 'Monitor temperature, respiratory status, oxygen needs',
        'heart failure': 'Monitor daily weights, fluid balance, respiratory status',
        'depression': 'Monitor mood, suicide risk, medication compliance',
        'dementia': 'Monitor cognitive status, safety, behavioral changes',
        'cancer': 'Monitor pain levels, treatment side effects, nutritional status'
    };
    
    for (const [key, value] of Object.entries(recommendations)) {
        if (condition.includes(key)) {
            return value;
        }
    }
    
    return 'Monitor condition-specific parameters as per care plan';
}

function calculateAge(birthDate) {
    if (!birthDate) return null;
    
    const birth = new Date(birthDate);
    const today = new Date();
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
        age--;
    }
    
    return age;
}

function calculateDaysSince(dateString) {
    if (!dateString) return 0;
    
    const date = new Date(dateString);
    const today = new Date();
    const diffTime = Math.abs(today - date);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    return diffDays;
}

function formatDate(dateString) {
    if (!dateString) return null;
    
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    });
}

function formatDateTime(dateString) {
    if (!dateString) return null;
    
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}