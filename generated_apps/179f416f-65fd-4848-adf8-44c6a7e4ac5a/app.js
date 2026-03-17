document.addEventListener('DOMContentLoaded', function() {
    if (!window.PATIENT_DATA) {
        document.getElementById('no-data').style.display = 'block';
        return;
    }

    const data = window.PATIENT_DATA;
    
    // Handle all patients view
    if (data.patient && data.patient.id === 'all') {
        generateAllPatientsHandover();
        return;
    }
    
    // Handle single patient view
    if (data.patient) {
        generateSinglePatientHandover();
    } else {
        document.getElementById('no-data').style.display = 'block';
    }
});

function generateSinglePatientHandover() {
    const data = window.PATIENT_DATA;
    const patient = data.patient;
    
    // Update patient info
    const patientInfo = document.getElementById('patient-info');
    const age = calculateAge(patient.birthDate);
    patientInfo.textContent = `${patient.name} • ${patient.gender} • ${age} years old`;
    
    // Generate SBAR sections
    const sbarContent = document.getElementById('sbar-content');
    sbarContent.innerHTML = `
        ${generateSituationSection()}
        ${generateBackgroundSection()}
        ${generateAssessmentSection()}
        ${generateRecommendationSection()}
    `;
}

function generateAllPatientsHandover() {
    const data = window.PATIENT_DATA;
    
    // Update header for all patients
    const patientInfo = document.getElementById('patient-info');
    patientInfo.textContent = `Handover Summary for ${data.patients ? data.patients.length : 0} patients`;
    
    const sbarContent = document.getElementById('sbar-content');
    let content = '';
    
    if (data.patients && data.patients.length > 0) {
        data.patients.forEach(patient => {
            content += generatePatientHandoverCard(patient);
        });
    } else {
        content = '<div class="text-center py-4"><p class="text-muted">No patients available for handover.</p></div>';
    }
    
    sbarContent.innerHTML = content;
}

function generatePatientHandoverCard(patient) {
    const age = calculateAge(patient.birthDate);
    
    return `
        <div class="sbar-section mb-4">
            <div class="sbar-header situation">
                <div class="icon"><i class="fas fa-user"></i></div>
                <h2>${patient.name} • ${patient.gender} • ${age} years</h2>
            </div>
            <div class="sbar-content">
                ${generatePatientSBAR(patient)}
            </div>
        </div>
    `;
}

function generatePatientSBAR(patient) {
    const patientData = patient.data || {};
    
    return `
        <div class="row">
            <div class="col-md-6">
                <h4 class="mb-3">Situation</h4>
                ${generatePatientSituation(patientData)}
            </div>
            <div class="col-md-6">
                <h4 class="mb-3">Background</h4>
                ${generatePatientBackground(patientData)}
            </div>
        </div>
        <div class="row mt-3">
            <div class="col-md-6">
                <h4 class="mb-3">Assessment</h4>
                ${generatePatientAssessment(patientData)}
            </div>
            <div class="col-md-6">
                <h4 class="mb-3">Recommendations</h4>
                ${generatePatientRecommendations(patientData)}
            </div>
        </div>
    `;
}

function generateSituationSection() {
    const data = window.PATIENT_DATA;
    
    return `
        <div class="sbar-section">
            <div class="sbar-header situation">
                <div class="icon"><i class="fas fa-info-circle"></i></div>
                <h2>Situation</h2>
            </div>
            <div class="sbar-content">
                ${generateSituationContent(data)}
            </div>
        </div>
    `;
}

function generateBackgroundSection() {
    const data = window.PATIENT_DATA;
    
    return `
        <div class="sbar-section">
            <div class="sbar-header background">
                <div class="icon"><i class="fas fa-history"></i></div>
                <h2>Background</h2>
            </div>
            <div class="sbar-content">
                ${generateBackgroundContent(data)}
            </div>
        </div>
    `;
}

function generateAssessmentSection() {
    const data = window.PATIENT_DATA;
    
    return `
        <div class="sbar-section">
            <div class="sbar-header assessment">
                <div class="icon"><i class="fas fa-stethoscope"></i></div>
                <h2>Assessment</h2>
            </div>
            <div class="sbar-content">
                ${generateAssessmentContent(data)}
            </div>
        </div>
    `;
}

function generateRecommendationSection() {
    const data = window.PATIENT_DATA;
    
    return `
        <div class="sbar-section">
            <div class="sbar-header recommendation">
                <div class="icon"><i class="fas fa-tasks"></i></div>
                <h2>Recommendations</h2>
            </div>
            <div class="sbar-content">
                ${generateRecommendationContent(data)}
            </div>
        </div>
    `;
}

function generateSituationContent(data) {
    let content = '';
    
    // Current admission reason
    if (data.condition && data.condition.summary && data.condition.summary.length > 0) {
        const primaryCondition = data.condition.summary[0];
        content += `
            <div class="info-item">
                <div class="info-label">Primary Diagnosis:</div>
                <div class="info-value">${primaryCondition.name}${isUrgentCondition(primaryCondition.name) ? '<span class="urgent-flag">URGENT</span>' : ''}</div>
            </div>
        `;
        
        if (primaryCondition.date) {
            const admissionDays = calculateDaysSince(primaryCondition.date);
            content += `
                <div class="info-item">
                    <div class="info-label">Length of Stay:</div>
                    <div class="info-value">${admissionDays} days</div>
                </div>
            `;
        }
    }
    
    // Current status from encounters
    if (data.encounter && data.encounter.summary && data.encounter.summary.length > 0) {
        const latestEncounter = data.encounter.summary[0];
        content += `
            <div class="info-item">
                <div class="info-label">Current Status:</div>
                <div class="info-value">${latestEncounter.status || 'Active'}</div>
            </div>
        `;
    }
    
    // Location if available
    if (data.locations && data.locations.summary && data.locations.summary.length > 0) {
        const location = data.locations.summary[0];
        content += `
            <div class="info-item">
                <div class="info-label">Location:</div>
                <div class="info-value">${location.name} - ${location.value}</div>
            </div>
        `;
    }
    
    return content || '<p class="text-muted">No current situation data available.</p>';
}

function generateBackgroundContent(data) {
    let content = '';
    
    // Active diagnoses
    if (data.condition && data.condition.summary && data.condition.summary.length > 0) {
        content += '<div class="info-item"><div class="info-label">Active Diagnoses:</div>';
        data.condition.summary.forEach(condition => {
            content += `<div class="info-value">• ${condition.name}</div>`;
        });
        content += '</div>';
    }
    
    // Current medications
    if (data.medicationrequest && data.medicationrequest.summary && data.medicationrequest.summary.length > 0) {
        content += '<div class="info-item"><div class="info-label">Current Medications:</div>';
        content += '<ul class="medication-list">';
        data.medicationrequest.summary.forEach(med => {
            content += `
                <li class="medication-item">
                    <div class="medication-name">${med.name}</div>
                    <div class="medication-dose">${med.value || 'Dose not specified'}</div>
                </li>
            `;
        });
        content += '</ul></div>';
    }
    
    // Allergies (if available in observations or other data)
    content += `
        <div class="info-item">
            <div class="info-label">Known Allergies:</div>
            <div class="info-value">No known allergies documented</div>
        </div>
    `;
    
    return content || '<p class="text-muted">No background data available.</p>';
}

function generateAssessmentContent(data) {
    let content = '';
    
    // Latest vitals
    if (data.vital_signs && data.vital_signs.summary && data.vital_signs.summary.length > 0) {
        content += '<div class="info-item"><div class="info-label">Latest Vital Signs:</div>';
        content += '<div class="vital-grid">';
        data.vital_signs.summary.forEach(vital => {
            const isAbnormal = isAbnormalVital(vital.name, vital.value);
            content += `
                <div class="vital-item">
                    <div class="vital-value">${vital.value}${isAbnormal ? '<span class="abnormal-flag">ABNORMAL</span>' : ''}</div>
                    <div class="vital-label">${vital.name}</div>
                    ${vital.date ? `<div class="vital-label">${formatDate(vital.date)}</div>` : ''}
                </div>
            `;
        });
        content += '</div></div>';
    }
    
    // Lab results from observations
    if (data.observation && data.observation.summary && data.observation.summary.length > 0) {
        content += '<div class="info-item"><div class="info-label">Recent Lab Results:</div>';
        data.observation.summary.forEach(obs => {
            const isAbnormal = isAbnormalLab(obs.name, obs.value);
            content += `
                <div class="info-value">• ${obs.name}: ${obs.value}${isAbnormal ? '<span class="abnormal-flag">ABNORMAL</span>' : ''}
                ${obs.date ? ` (${formatDate(obs.date)})` : ''}</div>
            `;
        });
        content += '</div>';
    }
    
    return content || '<p class="text-muted">No assessment data available.</p>';
}

function generateRecommendationContent(data) {
    let content = '';
    
    // Medication due times
    if (data.medicationrequest && data.medicationrequest.summary && data.medicationrequest.summary.length > 0) {
        content += `
            <div class="info-item priority-high">
                <div class="info-label">Medications Due:</div>
                <div class="info-value">Review medication schedule and ensure timely administration</div>
            </div>
        `;
    }
    
    // Monitoring based on conditions
    if (data.condition && data.condition.summary && data.condition.summary.length > 0) {
        const condition = data.condition.summary[0];
        const monitoring = getMonitoringRecommendations(condition.name);
        if (monitoring) {
            content += `
                <div class="info-item priority-medium">
                    <div class="info-label">Monitoring Required:</div>
                    <div class="info-value">${monitoring}</div>
                </div>
            `;
        }
    }
    
    // Escalation criteria
    content += `
        <div class="info-item priority-high">
            <div class="info-label">Escalation Criteria:</div>
            <div class="info-value">Contact physician if vital signs deteriorate, pain increases, or patient condition changes</div>
        </div>
    `;
    
    // Follow-up tasks
    content += `
        <div class="info-item priority-low">
            <div class="info-label">Routine Tasks:</div>
            <div class="info-value">Continue current care plan, document progress notes, ensure patient comfort</div>
        </div>
    `;
    
    return content || '<p class="text-muted">No specific recommendations at this time.</p>';
}

function generatePatientSituation(patientData) {
    let content = '';
    
    Object.entries(patientData).forEach(([resourceType, records]) => {
        if (resourceType === 'condition' && records && records.length > 0) {
            const primaryCondition = records[0];
            content += `<p><strong>Primary:</strong> ${primaryCondition.name || 'Unknown condition'}</p>`;
        }
    });
    
    return content || '<p class="text-muted">No situation data</p>';
}

function generatePatientBackground(patientData) {
    let content = '';
    
    Object.entries(patientData).forEach(([resourceType, records]) => {
        if (resourceType === 'condition' && records && records.length > 0) {
            content += '<p><strong>Diagnoses:</strong></p><ul>';
            records.forEach(condition => {
                content += `<li>${condition.name || 'Unknown'}</li>`;
            });
            content += '</ul>';
        }
        
        if (resourceType === 'medicationrequest' && records && records.length > 0) {
            content += '<p><strong>Medications:</strong></p><ul>';
            records.forEach(med => {
                content += `<li>${med.name || 'Unknown medication'} - ${med.value || 'Dose not specified'}</li>`;
            });
            content += '</ul>';
        }
    });
    
    return content || '<p class="text-muted">No background data</p>';
}

function generatePatientAssessment(patientData) {
    let content = '';
    
    Object.entries(patientData).forEach(([resourceType, records]) => {
        if ((resourceType === 'vital_signs' || resourceType === 'observation') && records && records.length > 0) {
            content += `<p><strong>${resourceType === 'vital_signs' ? 'Vitals' : 'Labs'}:</strong></p><ul>`;
            records.forEach(item => {
                content += `<li>${item.name || 'Unknown'}: ${item.value || 'No value'}</li>`;
            });
            content += '</ul>';
        }
    });
    
    return content || '<p class="text-muted">No assessment data</p>';
}

function generatePatientRecommendations(patientData) {
    let content = '<ul>';
    content += '<li>Continue current medications as prescribed</li>';
    content += '<li>Monitor vital signs regularly</li>';
    content += '<li>Escalate if condition deteriorates</li>';
    content += '</ul>';
    
    return content;
}

// Helper functions
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

function calculateDaysSince(dateString) {
    if (!dateString) return 'Unknown';
    const date = new Date(dateString);
    const today = new Date();
    const diffTime = Math.abs(today - date);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
}

function formatDate(dateString) {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
}

function isUrgentCondition(condition) {
    const urgentConditions = ['sepsis', 'chest pain', 'stroke', 'heart attack', 'respiratory distress'];
    return urgentConditions.some(urgent => condition.toLowerCase().includes(urgent));
}

function isAbnormalVital(name, value) {
    const vitalName = name.toLowerCase();
    const numValue = parseFloat(value);
    
    if (vitalName.includes('bp') || vitalName.includes('blood pressure')) {
        return numValue > 140 || numValue < 90;
    }
    if (vitalName.includes('temp')) {
        return numValue > 38 || numValue < 36;
    }
    if (vitalName.includes('heart rate') || vitalName.includes('hr')) {
        return numValue > 100 || numValue < 60;
    }
    
    return false;
}

function isAbnormalLab(name, value) {
    const labName = name.toLowerCase();
    const numValue = parseFloat(value);
    
    if (labName.includes('glucose')) {
        return numValue > 7.8 || numValue < 4.0;
    }
    if (labName.includes('hb') || labName.includes('hemoglobin')) {
        return numValue < 12;
    }
    
    return false;
}

function getMonitoringRecommendations(condition) {
    const conditionLower = condition.toLowerCase();
    
    if (conditionLower.includes('hypertension')) {
        return 'Monitor BP every 4 hours, watch for headache or dizziness';
    }
    if (conditionLower.includes('diabetes')) {
        return 'Check blood glucose before meals and at bedtime';
    }
    if (conditionLower.includes('heart') || conditionLower.includes('cardiac')) {
        return 'Monitor heart rate and rhythm, watch for chest pain';
    }
    if (conditionLower.includes('respiratory') || conditionLower.includes('copd') || conditionLower.includes('asthma')) {
        return 'Monitor oxygen saturation, assess breathing effort';
    }
    
    return 'Monitor vital signs and general condition';
}