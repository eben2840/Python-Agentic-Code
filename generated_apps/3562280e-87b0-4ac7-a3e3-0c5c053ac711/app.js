document.addEventListener('DOMContentLoaded', function() {
    if (!window.PATIENT_DATA) {
        showNoDataMessage();
        return;
    }

    const data = window.PATIENT_DATA;
    
    if (data.patient && data.patient.id === 'all') {
        renderAllPatientsHandover();
    } else if (data.patient) {
        renderSinglePatientHandover();
    } else {
        showNoDataMessage();
    }
});

function renderAllPatientsHandover() {
    const data = window.PATIENT_DATA;
    const allPatientsView = document.getElementById('all-patients-view');
    const singlePatientView = document.getElementById('single-patient-view');
    const noDataMessage = document.getElementById('no-data-message');
    const patientInfo = document.getElementById('patient-info');
    const patientsContainer = document.getElementById('patients-container');

    allPatientsView.classList.remove('d-none');
    singlePatientView.classList.add('d-none');
    noDataMessage.classList.add('d-none');

    patientInfo.textContent = `SBAR Handover for ${data.patients ? data.patients.length : 0} patients`;

    if (!data.patients || data.patients.length === 0) {
        patientsContainer.innerHTML = '<div class="alert alert-warning"><i class="fas fa-exclamation-triangle me-2"></i>No patients found in the system.</div>';
        return;
    }

    let html = '';
    data.patients.forEach(patient => {
        html += generatePatientSBARCard(patient);
    });

    patientsContainer.innerHTML = html;
}

function renderSinglePatientHandover() {
    const data = window.PATIENT_DATA;
    const allPatientsView = document.getElementById('all-patients-view');
    const singlePatientView = document.getElementById('single-patient-view');
    const noDataMessage = document.getElementById('no-data-message');
    const patientInfo = document.getElementById('patient-info');

    allPatientsView.classList.add('d-none');
    singlePatientView.classList.remove('d-none');
    noDataMessage.classList.add('d-none');

    const patient = data.patient;
    const age = calculateAge(patient.birthDate);
    patientInfo.innerHTML = `<strong>${patient.name || 'Unknown Patient'}</strong> • ${patient.gender || 'Unknown'} • ${age} years old`;

    // Generate SBAR content
    generateSituationContent(data);
    generateBackgroundContent(data);
    generateAssessmentContent(data);
    generateRecommendationContent(data);
}

function generatePatientSBARCard(patient) {
    const age = calculateAge(patient.birthDate);
    const patientData = patient.data || {};
    
    return `
        <div class="card patient-card">
            <div class="patient-header">
                <div class="patient-name">${patient.name || 'Unknown Patient'}</div>
                <div class="patient-details">
                    ${patient.gender || 'Unknown'} • ${age} years old • ID: ${patient.id}
                </div>
            </div>
            <div class="card-body p-0">
                <div class="sbar-grid">
                    <div class="sbar-section">
                        <div class="sbar-section-header bg-situation">
                            <i class="fas fa-hospital me-2"></i>Situation
                        </div>
                        <div class="sbar-section-body">
                            ${generateSituationForPatient(patientData)}
                        </div>
                    </div>
                    <div class="sbar-section">
                        <div class="sbar-section-header bg-background">
                            <i class="fas fa-history me-2"></i>Background
                        </div>
                        <div class="sbar-section-body">
                            ${generateBackgroundForPatient(patientData)}
                        </div>
                    </div>
                    <div class="sbar-section">
                        <div class="sbar-section-header bg-assessment">
                            <i class="fas fa-stethoscope me-2"></i>Assessment
                        </div>
                        <div class="sbar-section-body">
                            ${generateAssessmentForPatient(patientData)}
                        </div>
                    </div>
                    <div class="sbar-section">
                        <div class="sbar-section-header bg-recommendation">
                            <i class="fas fa-tasks me-2"></i>Recommendation
                        </div>
                        <div class="sbar-section-body">
                            ${generateRecommendationForPatient(patientData)}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;
}

function generateSituationContent(data) {
    const container = document.getElementById('situation-content');
    const content = generateSituationForPatient(data);
    container.innerHTML = content;
}

function generateSituationForPatient(data) {
    let html = '';
    
    // Current conditions/admission reason
    if (data.condition && data.condition.length > 0) {
        const activeConditions = data.condition.filter(c => c.name);
        if (activeConditions.length > 0) {
            html += '<div class="sbar-item">';
            html += '<div class="sbar-label">Current Conditions</div>';
            html += '<ul class="list-unstyled mb-0">';
            activeConditions.forEach(condition => {
                const dateStr = condition.date ? formatDate(condition.date) : 'Date unknown';
                html += `<li><i class="fas fa-circle text-danger me-2" style="font-size: 0.5rem;"></i>${condition.name} <small class="text-muted">(${dateStr})</small></li>`;
            });
            html += '</ul>';
            html += '</div>';
        }
    }

    // Recent encounters
    if (data.encounter && data.encounter.length > 0) {
        const recentEncounters = data.encounter.filter(e => e.date).sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 3);
        if (recentEncounters.length > 0) {
            html += '<div class="sbar-item">';
            html += '<div class="sbar-label">Recent Encounters</div>';
            html += '<ul class="list-unstyled mb-0">';
            recentEncounters.forEach(encounter => {
                const dateStr = formatDate(encounter.date);
                html += `<li><i class="fas fa-calendar me-2 text-info"></i>${encounter.name || 'Encounter'} <small class="text-muted">(${dateStr})</small></li>`;
            });
            html += '</ul>';
            html += '</div>';
        }
    }

    if (!html) {
        html = '<p class="text-muted mb-0">No current situation data available</p>';
    }

    return html;
}

function generateBackgroundContent(data) {
    const container = document.getElementById('background-content');
    const content = generateBackgroundForPatient(data);
    container.innerHTML = content;
}

function generateBackgroundForPatient(data) {
    let html = '';

    // Medical history (conditions)
    if (data.condition && data.condition.length > 0) {
        html += '<div class="sbar-item">';
        html += '<div class="sbar-label">Medical History</div>';
        html += '<ul class="list-unstyled mb-0">';
        data.condition.forEach(condition => {
            html += `<li><i class="fas fa-history me-2 text-secondary"></i>${condition.name || 'Unknown condition'}</li>`;
        });
        html += '</ul>';
        html += '</div>';
    }

    // Current medications
    if (data.medicationrequest && data.medicationrequest.length > 0) {
        html += '<div class="sbar-item">';
        html += '<div class="sbar-label">Current Medications</div>';
        html += '<ul class="list-unstyled mb-0">';
        data.medicationrequest.forEach(med => {
            const dosage = med.status || med.value || 'Dosage not specified';
            html += `<li><i class="fas fa-pills me-2 text-primary"></i>${med.name || 'Unknown medication'} <small class="text-muted">(${dosage})</small></li>`;
        });
        html += '</ul>';
        html += '</div>';
    }

    // Allergies (if available in other resources)
    if (data.allergyintolerance && data.allergyintolerance.length > 0) {
        html += '<div class="sbar-item">';
        html += '<div class="sbar-label"><i class="fas fa-exclamation-triangle text-danger me-1"></i>Known Allergies</div>';
        html += '<ul class="list-unstyled mb-0">';
        data.allergyintolerance.forEach(allergy => {
            html += `<li><span class="abnormal-value">${allergy.name || 'Unknown allergen'}</span></li>`;
        });
        html += '</ul>';
        html += '</div>';
    }

    if (!html) {
        html = '<p class="text-muted mb-0">No background data available</p>';
    }

    return html;
}

function generateAssessmentContent(data) {
    const container = document.getElementById('assessment-content');
    const content = generateAssessmentForPatient(data);
    container.innerHTML = content;
}

function generateAssessmentForPatient(data) {
    let html = '';
    let hasUrgentFindings = false;

    // Latest vital signs
    if (data.vital_signs && data.vital_signs.length > 0) {
        html += '<div class="sbar-item">';
        html += '<div class="sbar-label">Latest Vital Signs</div>';
        html += '<ul class="list-unstyled mb-0">';
        data.vital_signs.forEach(vital => {
            const dateStr = vital.date ? formatDate(vital.date) : 'Date unknown';
            const isAbnormal = checkIfAbnormal(vital.name, vital.value);
            if (isAbnormal) hasUrgentFindings = true;
            
            html += `<li><i class="fas fa-heartbeat me-2 text-danger"></i>`;
            if (isAbnormal) {
                html += `<span class="abnormal-value">${vital.name || vital.value || 'Unknown vital'}</span>`;
            } else {
                html += `${vital.name || vital.value || 'Unknown vital'}`;
            }
            html += ` <small class="text-muted">(${dateStr})</small></li>`;
        });
        html += '</ul>';
        html += '</div>';
    }

    // Latest observations/lab results
    if (data.observation && data.observation.length > 0) {
        const labResults = data.observation.filter(obs => obs.name !== (data.vital_signs?.[0]?.name));
        if (labResults.length > 0) {
            html += '<div class="sbar-item">';
            html += '<div class="sbar-label">Latest Lab Results</div>';
            html += '<ul class="list-unstyled mb-0">';
            labResults.forEach(obs => {
                const dateStr = obs.date ? formatDate(obs.date) : 'Date unknown';
                const isAbnormal = checkIfAbnormal(obs.name, obs.value);
                if (isAbnormal) hasUrgentFindings = true;
                
                html += `<li><i class="fas fa-flask me-2 text-info"></i>`;
                if (isAbnormal) {
                    html += `<span class="abnormal-value">${obs.name || obs.value || 'Unknown result'}</span>`;
                } else {
                    html += `${obs.name || obs.value || 'Unknown result'}`;
                }
                html += ` <small class="text-muted">(${dateStr})</small></li>`;
            });
            html += '</ul>';
            html += '</div>';
        }
    }

    // Add urgent flag if abnormal values found
    if (hasUrgentFindings) {
        html = `<div class="urgent-flag">
            <i class="fas fa-exclamation-triangle me-2"></i>
            <span class="urgent-text">ABNORMAL VALUES DETECTED - Review immediately</span>
        </div>` + html;
    }

    if (!html) {
        html = '<p class="text-muted mb-0">No assessment data available</p>';
    }

    return html;
}

function generateRecommendationContent(data) {
    const container = document.getElementById('recommendation-content');
    const content = generateRecommendationForPatient(data);
    container.innerHTML = content;
}

function generateRecommendationForPatient(data) {
    let html = '';

    // Medication due
    if (data.medicationrequest && data.medicationrequest.length > 0) {
        html += '<div class="sbar-item">';
        html += '<div class="sbar-label">Medications to Monitor</div>';
        html += '<ul class="list-unstyled mb-0">';
        data.medicationrequest.forEach(med => {
            html += `<li><i class="fas fa-clock me-2 text-warning"></i>Continue ${med.name || 'Unknown medication'} - ${med.status || med.value || 'Monitor compliance'}</li>`;
        });
        html += '</ul>';
        html += '</div>';
    }

    // Follow-up on abnormal results
    const abnormalResults = [];
    if (data.vital_signs) {
        data.vital_signs.forEach(vital => {
            if (checkIfAbnormal(vital.name, vital.value)) {
                abnormalResults.push(`Monitor ${vital.name || vital.value}`);
            }
        });
    }
    if (data.observation) {
        data.observation.forEach(obs => {
            if (checkIfAbnormal(obs.name, obs.value)) {
                abnormalResults.push(`Follow up on ${obs.name || obs.value}`);
            }
        });
    }

    if (abnormalResults.length > 0) {
        html += '<div class="sbar-item">';
        html += '<div class="sbar-label"><i class="fas fa-exclamation-circle text-danger me-1"></i>Priority Actions</div>';
        html += '<ul class="list-unstyled mb-0">';
        abnormalResults.forEach(action => {
            html += `<li><i class="fas fa-arrow-right me-2 text-danger"></i><span class="urgent-text">${action}</span></li>`;
        });
        html += '</ul>';
        html += '</div>';
    }

    // General recommendations based on conditions
    if (data.condition && data.condition.length > 0) {
        html += '<div class="sbar-item">';
        html += '<div class="sbar-label">Ongoing Care</div>';
        html += '<ul class="list-unstyled mb-0">';
        data.condition.forEach(condition => {
            html += `<li><i class="fas fa-user-md me-2 text-success"></i>Continue monitoring for ${condition.name || 'condition'}</li>`;
        });
        html += '</ul>';
        html += '</div>';
    }

    if (!html) {
        html = '<div class="sbar-item"><div class="sbar-label">General Care</div><p class="sbar-value">Continue routine monitoring and care as per standard protocols.</p></div>';
    }

    return html;
}

function checkIfAbnormal(name, value) {
    if (!name && !value) return false;
    
    const text = (name || value || '').toLowerCase();
    
    // Common abnormal indicators
    const abnormalKeywords = [
        'high', 'low', 'elevated', 'abnormal', 'critical', 'urgent',
        'positive', 'negative', 'severe', 'acute', 'emergency'
    ];
    
    // Specific value patterns that might indicate abnormality
    const abnormalPatterns = [
        /\b(140|150|160|170|180|190)\/\d+/, // High BP
        /\b\d+\/\d+\b.*high/i,
        /temp.*3[89]\.\d/i, // High temperature
        /glucose.*[89]\.\d/i, // High glucose
        /pain.*[789]\/10/i, // High pain scores
        /\b(tsh|tsh.*)\s*(1[0-9]|[2-9][0-9])/i, // High TSH
        /\bfev1.*[1-4][0-9]%/i // Low FEV1
    ];
    
    return abnormalKeywords.some(keyword => text.includes(keyword)) ||
           abnormalPatterns.some(pattern => pattern.test(text));
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
    if (!dateString) return 'Unknown date';
    
    try {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    } catch (e) {
        return 'Invalid date';
    }
}

function showNoDataMessage() {
    const allPatientsView = document.getElementById('all-patients-view');
    const singlePatientView = document.getElementById('single-patient-view');
    const noDataMessage = document.getElementById('no-data-message');
    
    allPatientsView.classList.add('d-none');
    singlePatientView.classList.add('d-none');
    noDataMessage.classList.remove('d-none');
}