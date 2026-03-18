document.addEventListener('DOMContentLoaded', function() {
    const patientData = window.PATIENT_DATA;
    
    if (!patientData) {
        showNoData();
        return;
    }

    if (patientData.patient && patientData.patient.id === 'all') {
        showAllPatientsOverview();
    } else if (patientData.patient) {
        showSinglePatientSBAR();
    } else {
        showNoData();
    }
});

function showNoData() {
    document.getElementById('no-data-message').classList.remove('d-none');
    document.getElementById('patient-header').innerHTML = '<p class="no-data">No patient data available</p>';
}

function showAllPatientsOverview() {
    const patients = window.PATIENT_DATA.patients || [];
    
    document.getElementById('patient-header').innerHTML = `
        <h2><i class="fas fa-users me-2"></i>All Patients Overview</h2>
        <div class="patient-details">
            <span><strong>${patients.length}</strong> patients in system</span>
        </div>
    `;
    
    const patientsList = document.getElementById('patients-list');
    
    if (patients.length === 0) {
        patientsList.innerHTML = '<div class="col-12"><p class="no-data text-center">No patients available</p></div>';
    } else {
        patientsList.innerHTML = patients.map(patient => {
            const conditions = getPatientConditions(patient);
            const age = calculateAge(patient.birthDate);
            
            return `
                <div class="col-12 col-md-6 col-lg-4">
                    <div class="patient-card" onclick="selectPatient('${patient.id}')">
                        <h4>${patient.name || 'Unknown Patient'}</h4>
                        <div class="patient-meta">
                            <span><i class="fas fa-user me-1"></i>${patient.gender || 'Unknown'}</span>
                            <span><i class="fas fa-birthday-cake me-1"></i>Age ${age}</span>
                        </div>
                        <div class="condition-badges">
                            ${conditions.length > 0 ? 
                                conditions.slice(0, 3).map(c => `<span class="condition-badge">${c}</span>`).join('') :
                                '<span class="no-data">No active conditions</span>'
                            }
                            ${conditions.length > 3 ? `<span class="condition-badge">+${conditions.length - 3} more</span>` : ''}
                        </div>
                    </div>
                </div>
            `;
        }).join('');
    }
    
    document.getElementById('all-patients-overview').classList.remove('d-none');
}

function showSinglePatientSBAR() {
    const patient = window.PATIENT_DATA.patient;
    const age = calculateAge(patient.birthDate);
    
    document.getElementById('patient-header').innerHTML = `
        <h2>${patient.name || 'Unknown Patient'}</h2>
        <div class="patient-details">
            <span><strong>Gender:</strong> ${patient.gender || 'Unknown'}</span>
            <span><strong>Age:</strong> ${age}</span>
            <span><strong>DOB:</strong> ${formatDate(patient.birthDate) || 'Unknown'}</span>
            <span><strong>ID:</strong> ${patient.id || 'Unknown'}</span>
        </div>
    `;
    
    generateSituationSection();
    generateBackgroundSection();
    generateAssessmentSection();
    generateRecommendationSection();
    
    document.getElementById('single-patient-sbar').classList.remove('d-none');
}

function generateSituationSection() {
    const data = window.PATIENT_DATA;
    const encounters = data.encounter?.summary || [];
    const conditions = data.condition?.summary || [];
    
    let content = '<div class="sbar-section">';
    
    if (conditions.length > 0) {
        const primaryCondition = conditions[0];
        content += `<h4>Current Status</h4>`;
        content += `<p><strong>Primary concern:</strong> ${primaryCondition.name}</p>`;
        
        if (primaryCondition.date) {
            const daysSince = calculateDaysSince(primaryCondition.date);
            content += `<p><strong>Duration:</strong> ${daysSince} days since onset/admission</p>`;
        }
        
        if (primaryCondition.status) {
            content += `<p><strong>Status:</strong> ${primaryCondition.status}</p>`;
        }
    } else {
        content += `<p class="no-data">No current conditions documented</p>`;
    }
    
    if (encounters.length > 0) {
        const recentEncounter = encounters[0];
        if (recentEncounter.date) {
            const daysSince = calculateDaysSince(recentEncounter.date);
            content += `<p><strong>Last encounter:</strong> ${daysSince} days ago</p>`;
        }
    }
    
    content += '</div>';
    document.getElementById('situation-content').innerHTML = content;
}

function generateBackgroundSection() {
    const data = window.PATIENT_DATA;
    const conditions = data.condition?.summary || [];
    const medications = data.medicationrequest?.summary || [];
    const allergies = data.allergyintolerance?.summary || [];
    
    let content = '';
    
    // Medical History
    content += '<div class="sbar-section">';
    content += '<h4>Active Diagnoses</h4>';
    if (conditions.length > 0) {
        content += '<ul>';
        conditions.forEach(condition => {
            content += `<li>${condition.name}`;
            if (condition.status) content += ` (${condition.status})`;
            content += '</li>';
        });
        content += '</ul>';
    } else {
        content += '<p class="no-data">No active diagnoses documented</p>';
    }
    content += '</div>';
    
    // Allergies
    content += '<div class="sbar-section">';
    content += '<h4>Known Allergies</h4>';
    if (allergies.length > 0) {
        content += '<ul>';
        allergies.forEach(allergy => {
            content += `<li>${allergy.name}`;
            if (allergy.status) content += ` <span class="urgent-flag"><i class="fas fa-exclamation-triangle me-1"></i>${allergy.status}</span>`;
            content += '</li>';
        });
        content += '</ul>';
    } else {
        content += '<p>No known allergies documented</p>';
    }
    content += '</div>';
    
    // Current Medications
    content += '<div class="sbar-section">';
    content += '<h4>Current Medications</h4>';
    if (medications.length > 0) {
        content += '<ul>';
        medications.forEach(med => {
            content += `<li><strong>${med.name}</strong>`;
            if (med.value) content += ` - ${med.value}`;
            if (med.status) content += ` (${med.status})`;
            content += '</li>';
        });
        content += '</ul>';
    } else {
        content += '<p class="no-data">No current medications documented</p>';
    }
    content += '</div>';
    
    document.getElementById('background-content').innerHTML = content;
}

function generateAssessmentSection() {
    const data = window.PATIENT_DATA;
    const vitals = data.vital_signs?.summary || [];
    const observations = data.observation?.summary || [];
    const labs = data.diagnosticreport?.summary || [];
    
    let content = '';
    
    // Latest Vitals
    content += '<div class="sbar-section">';
    content += '<h4>Latest Vital Signs</h4>';
    if (vitals.length > 0) {
        content += '<ul>';
        vitals.forEach(vital => {
            const isAbnormal = checkIfAbnormal(vital.name, vital.value);
            const valueClass = isAbnormal ? 'abnormal-value' : 'normal-value';
            
            content += `<li><strong>${vital.name}:</strong> <span class="${valueClass}">${vital.value}</span>`;
            if (vital.date) content += ` (${formatDateTime(vital.date)})`;
            if (isAbnormal) content += ` <span class="urgent-flag"><i class="fas fa-exclamation-triangle me-1"></i>ABNORMAL</span>`;
            content += '</li>';
        });
        content += '</ul>';
    } else {
        content += '<p class="no-data">No vital signs recorded</p>';
    }
    content += '</div>';
    
    // Recent Observations
    if (observations.length > 0) {
        content += '<div class="sbar-section">';
        content += '<h4>Recent Observations</h4>';
        content += '<ul>';
        observations.forEach(obs => {
            const isAbnormal = checkIfAbnormal(obs.name, obs.value);
            const valueClass = isAbnormal ? 'abnormal-value' : 'normal-value';
            
            content += `<li><strong>${obs.name}:</strong> <span class="${valueClass}">${obs.value}</span>`;
            if (obs.date) content += ` (${formatDateTime(obs.date)})`;
            if (isAbnormal) content += ` <span class="urgent-flag"><i class="fas fa-exclamation-triangle me-1"></i>ABNORMAL</span>`;
            content += '</li>';
        });
        content += '</ul>';
        content += '</div>';
    }
    
    // Lab Results
    if (labs.length > 0) {
        content += '<div class="sbar-section">';
        content += '<h4>Recent Lab Results</h4>';
        content += '<ul>';
        labs.forEach(lab => {
            content += `<li><strong>${lab.name}:</strong> ${lab.value || 'Result pending'}`;
            if (lab.date) content += ` (${formatDateTime(lab.date)})`;
            if (lab.status && lab.status.toLowerCase().includes('abnormal')) {
                content += ` <span class="urgent-flag"><i class="fas fa-exclamation-triangle me-1"></i>ABNORMAL</span>`;
            }
            content += '</li>';
        });
        content += '</ul>';
        content += '</div>';
    }
    
    if (!vitals.length && !observations.length && !labs.length) {
        content += '<p class="no-data">No assessment data available</p>';
    }
    
    document.getElementById('assessment-content').innerHTML = content;
}

function generateRecommendationSection() {
    const data = window.PATIENT_DATA;
    const medications = data.medicationrequest?.summary || [];
    const conditions = data.condition?.summary || [];
    const vitals = data.vital_signs?.summary || [];
    const observations = data.observation?.summary || [];
    
    let content = '';
    let hasUrgentItems = false;
    
    // Medication Due
    content += '<div class="sbar-section">';
    content += '<h4>Medications Due</h4>';
    if (medications.length > 0) {
        content += '<ul>';
        medications.forEach(med => {
            content += `<li>Continue <strong>${med.name}</strong>`;
            if (med.value) content += ` - ${med.value}`;
            content += '</li>';
        });
        content += '</ul>';
    } else {
        content += '<p>No scheduled medications</p>';
    }
    content += '</div>';
    
    // Monitoring Requirements
    content += '<div class="sbar-section">';
    content += '<h4>Monitoring Requirements</h4>';
    content += '<ul>';
    
    // Check for abnormal vitals that need monitoring
    vitals.concat(observations).forEach(item => {
        if (checkIfAbnormal(item.name, item.value)) {
            content += `<li>Monitor ${item.name} - currently abnormal at ${item.value}</li>`;
            hasUrgentItems = true;
        }
    });
    
    // Condition-specific monitoring
    conditions.forEach(condition => {
        const monitoring = getMonitoringForCondition(condition.name);
        if (monitoring) {
            content += `<li>${monitoring}</li>`;
        }
    });
    
    if (!hasUrgentItems && conditions.length === 0) {
        content += '<li>Continue routine monitoring as per protocol</li>';
    }
    
    content += '</ul>';
    content += '</div>';
    
    // Priority Actions
    content += '<div class="sbar-section">';
    content += '<h4>Priority Actions</h4>';
    content += '<ul>';
    
    if (hasUrgentItems) {
        content += '<li><strong>URGENT:</strong> Review abnormal values and consider intervention</li>';
    }
    
    content += '<li>Complete routine assessments</li>';
    content += '<li>Document any changes in patient condition</li>';
    content += '<li>Ensure medication compliance</li>';
    
    // Condition-specific priorities
    conditions.forEach(condition => {
        const priority = getPriorityForCondition(condition.name);
        if (priority) {
            content += `<li>${priority}</li>';
        }
    });
    
    content += '</ul>';
    content += '</div>';
    
    document.getElementById('recommendation-content').innerHTML = content;
}

function getPatientConditions(patient) {
    const conditions = [];
    if (patient.data && patient.data.condition) {
        patient.data.condition.forEach(condition => {
            if (condition.name) {
                conditions.push(condition.name);
            }
        });
    }
    return conditions;
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

function calculateDaysSince(dateString) {
    if (!dateString) return 'Unknown';
    const date = new Date(dateString);
    const today = new Date();
    const diffTime = Math.abs(today - date);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
}

function formatDate(dateString) {
    if (!dateString) return null;
    return new Date(dateString).toLocaleDateString();
}

function formatDateTime(dateString) {
    if (!dateString) return null;
    return new Date(dateString).toLocaleString();
}

function checkIfAbnormal(name, value) {
    if (!name || !value) return false;
    
    const nameUpper = name.toUpperCase();
    const valueStr = value.toString().toUpperCase();
    
    // Blood pressure
    if (nameUpper.includes('BP') || nameUpper.includes('BLOOD PRESSURE')) {
        const match = value.match(/(\d+)\/(\d+)/);
        if (match) {
            const systolic = parseInt(match[1]);
            const diastolic = parseInt(match[2]);
            return systolic > 140 || systolic < 90 || diastolic > 90 || diastolic < 60;
        }
    }
    
    // Temperature
    if (nameUpper.includes('TEMP')) {
        const temp = parseFloat(value);
        return temp > 38.0 || temp < 36.0;
    }
    
    // Pain scales
    if (nameUpper.includes('PAIN') && nameUpper.includes('SCALE')) {
        const pain = parseInt(value);
        return pain > 7;
    }
    
    // Look for explicit abnormal indicators
    return valueStr.includes('ABNORMAL') || valueStr.includes('HIGH') || valueStr.includes('LOW') || 
           valueStr.includes('CRITICAL') || valueStr.includes('URGENT');
}

function getMonitoringForCondition(condition) {
    const conditionUpper = condition.toUpperCase();
    
    if (conditionUpper.includes('HYPERTENSION')) return 'Monitor BP q4h';
    if (conditionUpper.includes('DIABETES')) return 'Monitor blood glucose q6h';
    if (conditionUpper.includes('SEPSIS')) return 'Monitor vital signs q1h, watch for deterioration';
    if (conditionUpper.includes('ASTHMA') || conditionUpper.includes('COPD')) return 'Monitor respiratory status, peak flow';
    if (conditionUpper.includes('PAIN')) return 'Assess pain levels q4h';
    if (conditionUpper.includes('DEPRESSION')) return 'Monitor mood and safety risk';
    
    return null;
}

function getPriorityForCondition(condition) {
    const conditionUpper = condition.toUpperCase();
    
    if (conditionUpper.includes('SEPSIS')) return 'URGENT: Monitor for septic shock, ensure IV access';
    if (conditionUpper.includes('CHEST PAIN')) return 'Monitor cardiac status, have emergency equipment ready';
    if (conditionUpper.includes('FRACTURE')) return 'Assess pain management, monitor for complications';
    if (conditionUpper.includes('CANCER')) return 'Monitor for treatment side effects';
    
    return null;
}

function selectPatient(patientId) {
    // In a real application, this would navigate to the specific patient
    alert(`Navigate to patient ${patientId} for detailed SBAR handover`);
}