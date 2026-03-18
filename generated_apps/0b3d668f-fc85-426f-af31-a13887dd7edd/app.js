document.addEventListener('DOMContentLoaded', function() {
    if (!window.PATIENT_DATA) {
        showNoDataMessage();
        return;
    }

    const data = window.PATIENT_DATA;
    
    // Handle "all patients" case
    if (data.patient && data.patient.id === 'all') {
        showAllPatientsMessage();
        return;
    }

    // Single patient case
    if (!data.patient) {
        showNoDataMessage();
        return;
    }

    renderPatientInfo(data.patient);
    renderSBARSummary(data);
});

function renderPatientInfo(patient) {
    const patientInfoEl = document.getElementById('patient-info');
    const age = calculateAge(patient.birthDate);
    const ageText = age !== null ? ` (${age} years)` : '';
    patientInfoEl.textContent = `${patient.name || 'Unknown Patient'} • ${patient.gender || 'Unknown'}${ageText}`;
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

function renderSBARSummary(data) {
    const contentEl = document.getElementById('sbar-content');
    
    const sbarSections = [
        {
            id: 'situation',
            title: 'Situation',
            icon: 'fas fa-hospital',
            class: 'situation',
            content: generateSituationContent(data)
        },
        {
            id: 'background',
            title: 'Background',
            icon: 'fas fa-history',
            class: 'background',
            content: generateBackgroundContent(data)
        },
        {
            id: 'assessment',
            title: 'Assessment',
            icon: 'fas fa-stethoscope',
            class: 'assessment',
            content: generateAssessmentContent(data)
        },
        {
            id: 'recommendation',
            title: 'Recommendation',
            icon: 'fas fa-exclamation-triangle',
            class: 'recommendation',
            content: generateRecommendationContent(data)
        }
    ];

    contentEl.innerHTML = sbarSections.map(section => `
        <div class="sbar-section">
            <div class="sbar-header">
                <div class="sbar-icon ${section.class}">
                    <i class="${section.icon}"></i>
                </div>
                <h3 class="sbar-title">${section.title}</h3>
            </div>
            <div class="sbar-body">
                ${section.content}
            </div>
        </div>
    `).join('');
}

function generateSituationContent(data) {
    const encounters = data.encounter?.summary || [];
    const conditions = data.condition?.summary || [];
    
    let content = '';
    
    // Current admission status
    if (encounters.length > 0) {
        const latestEncounter = encounters[0];
        const admissionDate = latestEncounter.date ? formatDate(latestEncounter.date) : 'Unknown date';
        const daysSince = latestEncounter.date ? calculateDaysSince(latestEncounter.date) : null;
        const daysText = daysSince !== null ? ` (${daysSince} days ago)` : '';
        
        content += `
            <div class="clinical-item">
                <span class="clinical-label">Admission:</span>
                <span class="clinical-value">${admissionDate}${daysText}</span>
            </div>
        `;
    }
    
    // Primary condition/reason for admission
    if (conditions.length > 0) {
        const primaryCondition = conditions[0];
        content += `
            <div class="clinical-item">
                <span class="clinical-label">Primary Diagnosis:</span>
                <span class="clinical-value">${primaryCondition.name || 'Not specified'}</span>
            </div>
        `;
        
        if (primaryCondition.status) {
            content += `
                <div class="clinical-item">
                    <span class="clinical-label">Status:</span>
                    <span class="clinical-value">${primaryCondition.status}</span>
                </div>
            `;
        }
    }
    
    if (!content) {
        content = '<p class="no-data">No admission or diagnostic information available</p>';
    }
    
    return content;
}

function generateBackgroundContent(data) {
    const conditions = data.condition?.summary || [];
    const medications = data.medicationrequest?.summary || [];
    
    let content = '';
    
    // Active diagnoses
    if (conditions.length > 0) {
        content += '<h6 class="mb-2 text-muted">Active Diagnoses:</h6>';
        conditions.forEach(condition => {
            const dateText = condition.date ? ` (${formatDate(condition.date)})` : '';
            content += `
                <div class="clinical-item">
                    <span class="clinical-label">${condition.name || 'Unknown condition'}</span>
                    <span class="clinical-value">${condition.status || 'Active'}${dateText}</span>
                </div>
            `;
        });
    }
    
    // Current medications
    if (medications.length > 0) {
        content += '<h6 class="mb-2 text-muted mt-3">Current Medications:</h6>';
        medications.forEach(med => {
            content += `
                <div class="clinical-item">
                    <span class="clinical-label">${med.name || 'Unknown medication'}</span>
                    <span class="clinical-value">${med.value || 'Dosage not specified'}</span>
                </div>
            `;
        });
    }
    
    if (!content) {
        content = '<p class="no-data">No background medical information available</p>';
    }
    
    return content;
}

function generateAssessmentContent(data) {
    const vitals = data.vital_signs?.summary || [];
    const observations = data.observation?.summary || [];
    
    let content = '';
    
    // Latest vitals
    if (vitals.length > 0) {
        content += '<h6 class="mb-2 text-muted">Latest Vital Signs:</h6>';
        vitals.forEach(vital => {
            const badge = getVitalBadge(vital.name, vital.value);
            const dateText = vital.date ? ` (${formatDateTime(vital.date)})` : '';
            content += `
                <div class="clinical-item">
                    <span class="clinical-label">${vital.name || 'Unknown vital'}</span>
                    <span class="clinical-value">
                        ${vital.value || 'No value'}${dateText}
                        ${badge ? `<span class="badge ${badge.class} ms-2">${badge.text}</span>` : ''}
                    </span>
                </div>
            `;
        });
    }
    
    // Recent observations/lab results
    if (observations.length > 0) {
        content += '<h6 class="mb-2 text-muted mt-3">Recent Observations:</h6>';
        observations.forEach(obs => {
            const badge = getObservationBadge(obs.name, obs.value);
            const dateText = obs.date ? ` (${formatDateTime(obs.date)})` : '';
            content += `
                <div class="clinical-item">
                    <span class="clinical-label">${obs.name || 'Unknown observation'}</span>
                    <span class="clinical-value">
                        ${obs.value || 'No value'}${dateText}
                        ${badge ? `<span class="badge ${badge.class} ms-2">${badge.text}</span>` : ''}
                    </span>
                </div>
            `;
        });
    }
    
    if (!content) {
        content = '<p class="no-data">No assessment data available</p>';
    }
    
    return content;
}

function generateRecommendationContent(data) {
    const medications = data.medicationrequest?.summary || [];
    const conditions = data.condition?.summary || [];
    const vitals = data.vital_signs?.summary || [];
    
    let content = '';
    let recommendations = [];
    
    // Medication management
    if (medications.length > 0) {
        recommendations.push({
            priority: 'routine',
            text: `Continue current medications as prescribed (${medications.length} active orders)`
        });
    }
    
    // Condition monitoring
    if (conditions.length > 0) {
        conditions.forEach(condition => {
            if (condition.name) {
                const priority = getConditionPriority(condition.name);
                recommendations.push({
                    priority: priority,
                    text: `Monitor ${condition.name} - ${getConditionRecommendation(condition.name)}`
                });
            }
        });
    }
    
    // Vital signs monitoring
    if (vitals.length > 0) {
        vitals.forEach(vital => {
            const vitalRec = getVitalRecommendation(vital.name, vital.value);
            if (vitalRec) {
                recommendations.push(vitalRec);
            }
        });
    }
    
    // Sort by priority (urgent first)
    recommendations.sort((a, b) => {
        const priorityOrder = { urgent: 0, abnormal: 1, routine: 2 };
        return priorityOrder[a.priority] - priorityOrder[b.priority];
    });
    
    if (recommendations.length > 0) {
        recommendations.forEach(rec => {
            const badgeClass = rec.priority === 'urgent' ? 'badge-urgent' : 
                              rec.priority === 'abnormal' ? 'badge-abnormal' : 'badge-normal';
            const badgeText = rec.priority === 'urgent' ? 'URGENT' : 
                             rec.priority === 'abnormal' ? 'ABNORMAL' : 'ROUTINE';
            
            content += `
                <div class="clinical-item">
                    <span class="clinical-value">
                        <span class="badge ${badgeClass} me-2">${badgeText}</span>
                        ${rec.text}
                    </span>
                </div>
            `;
        });
    } else {
        content = '<p class="no-data">No specific recommendations available - continue routine care</p>';
    }
    
    return content;
}

function getVitalBadge(name, value) {
    if (!name || !value) return null;
    
    const nameUpper = name.toUpperCase();
    const valueStr = value.toString().toUpperCase();
    
    // Blood pressure
    if (nameUpper.includes('BP') || nameUpper.includes('BLOOD PRESSURE')) {
        if (valueStr.includes('140') || valueStr.includes('90')) {
            return { class: 'badge-abnormal', text: 'HIGH' };
        }
    }
    
    // Temperature
    if (nameUpper.includes('TEMP')) {
        if (valueStr.includes('39') || valueStr.includes('38.5')) {
            return { class: 'badge-abnormal', text: 'FEVER' };
        }
    }
    
    // Pain
    if (nameUpper.includes('PAIN')) {
        if (valueStr.includes('8') || valueStr.includes('9') || valueStr.includes('10')) {
            return { class: 'badge-urgent', text: 'SEVERE' };
        }
    }
    
    return null;
}

function getObservationBadge(name, value) {
    if (!name || !value) return null;
    
    const nameUpper = name.toUpperCase();
    const valueStr = value.toString().toUpperCase();
    
    // Various abnormal indicators
    if (valueStr.includes('ABNORMAL') || valueStr.includes('HIGH') || valueStr.includes('POSITIVE')) {
        return { class: 'badge-abnormal', text: 'ABNORMAL' };
    }
    
    return null;
}

function getConditionPriority(conditionName) {
    const urgent = ['SEPSIS', 'CHEST PAIN', 'FRACTURED'];
    const abnormal = ['CANCER', 'DIABETES', 'HYPERTENSION'];
    
    const nameUpper = conditionName.toUpperCase();
    
    if (urgent.some(term => nameUpper.includes(term))) return 'urgent';
    if (abnormal.some(term => nameUpper.includes(term))) return 'abnormal';
    return 'routine';
}

function getConditionRecommendation(conditionName) {
    const nameUpper = conditionName.toUpperCase();
    
    if (nameUpper.includes('SEPSIS')) return 'vital signs q1h, blood cultures pending';
    if (nameUpper.includes('CHEST PAIN')) return 'cardiac monitoring, serial ECGs';
    if (nameUpper.includes('FRACTURED')) return 'pain management, mobility assessment';
    if (nameUpper.includes('DIABETES')) return 'blood glucose monitoring q6h';
    if (nameUpper.includes('HYPERTENSION')) return 'BP monitoring, medication compliance';
    
    return 'routine monitoring as per care plan';
}

function getVitalRecommendation(name, value) {
    if (!name || !value) return null;
    
    const nameUpper = name.toUpperCase();
    const valueStr = value.toString().toUpperCase();
    
    if (nameUpper.includes('PAIN') && (valueStr.includes('8') || valueStr.includes('9'))) {
        return { priority: 'urgent', text: 'Severe pain - review analgesia immediately' };
    }
    
    if (nameUpper.includes('TEMP') && valueStr.includes('39')) {
        return { priority: 'abnormal', text: 'Fever - consider sepsis workup' };
    }
    
    return null;
}

function formatDate(dateString) {
    if (!dateString) return 'Unknown date';
    try {
        return new Date(dateString).toLocaleDateString();
    } catch {
        return 'Invalid date';
    }
}

function formatDateTime(dateString) {
    if (!dateString) return 'Unknown time';
    try {
        return new Date(dateString).toLocaleString();
    } catch {
        return 'Invalid date';
    }
}

function calculateDaysSince(dateString) {
    if (!dateString) return null;
    try {
        const date = new Date(dateString);
        const today = new Date();
        const diffTime = Math.abs(today - date);
        return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    } catch {
        return null;
    }
}

function showNoDataMessage() {
    document.getElementById('patient-info').textContent = 'No patient data available';
    document.getElementById('sbar-content').style.display = 'none';
    document.getElementById('no-data-message').style.display = 'block';
}

function showAllPatientsMessage() {
    document.getElementById('patient-info').textContent = 'SBAR handover requires individual patient selection';
    document.getElementById('sbar-content').innerHTML = `
        <div class="card">
            <div class="card-body text-center py-4">
                <i class="fas fa-users text-muted mb-3" style="font-size: 2rem;"></i>
                <h5 class="text-muted">Multiple Patients Selected</h5>
                <p class="text-muted mb-0">SBAR handover summary requires a single patient. Please select an individual patient to generate their handover report.</p>
            </div>
        </div>
    `;
}