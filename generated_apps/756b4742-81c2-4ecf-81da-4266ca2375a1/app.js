document.addEventListener('DOMContentLoaded', function() {
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
});

function showSinglePatientView(data) {
    document.getElementById('single-patient-view').classList.remove('d-none');
    
    // Populate patient header
    populatePatientHeader(data.patient);
    
    // Populate SBAR sections
    populateSituation(data);
    populateBackground(data);
    populateAssessment(data);
    populateRecommendation(data);
}

function showAllPatientsView(data) {
    document.getElementById('all-patients-view').classList.remove('d-none');
    
    // Update header for all patients
    const headerElement = document.getElementById('patient-header');
    headerElement.innerHTML = `
        <h4><i class="fas fa-users me-2"></i>All Patients</h4>
        <p class="mb-0 text-muted">Select an individual patient to generate their SBAR handover summary</p>
    `;
    
    // Populate patients list
    populatePatientsList(data.patients || []);
}

function showNoDataView() {
    document.getElementById('no-data-view').classList.remove('d-none');
}

function populatePatientHeader(patient) {
    const age = calculateAge(patient.birthDate);
    const headerElement = document.getElementById('patient-header');
    
    headerElement.innerHTML = `
        <h4><i class="fas fa-user me-2"></i>${patient.name || 'Unknown Patient'}</h4>
        <div class="patient-details">
            <div class="patient-detail">
                <i class="fas fa-venus-mars"></i>
                <span>${patient.gender || 'Unknown'}</span>
            </div>
            <div class="patient-detail">
                <i class="fas fa-birthday-cake"></i>
                <span>${age} years old</span>
            </div>
            <div class="patient-detail">
                <i class="fas fa-calendar"></i>
                <span>DOB: ${formatDate(patient.birthDate) || 'Unknown'}</span>
            </div>
        </div>
    `;
}

function populateSituation(data) {
    const content = document.getElementById('situation-content');
    let html = '';
    
    // Current admission reason from conditions
    const conditions = data.condition || [];
    const encounters = data.encounter || [];
    
    if (conditions.length > 0) {
        const primaryCondition = conditions[0];
        html += `
            <div class="clinical-item">
                <div class="clinical-label">Primary Admission Reason</div>
                <div class="clinical-value">${primaryCondition.name || 'Not specified'}</div>
                ${primaryCondition.date ? `<div class="clinical-date">Since: ${formatDate(primaryCondition.date)}</div>` : ''}
            </div>
        `;
    }
    
    // Length of stay from encounters
    if (encounters.length > 0) {
        const latestEncounter = encounters[0];
        if (latestEncounter.date) {
            const daysSince = calculateDaysSince(latestEncounter.date);
            html += `
                <div class="clinical-item">
                    <div class="clinical-label">Length of Stay</div>
                    <div class="clinical-value">${daysSince} days</div>
                    <div class="clinical-date">Admitted: ${formatDate(latestEncounter.date)}</div>
                </div>
            `;
        }
    }
    
    // Current status from latest observations
    const observations = data.observation || [];
    if (observations.length > 0) {
        const latestObs = observations[0];
        html += `
            <div class="clinical-item">
                <div class="clinical-label">Current Status</div>
                <div class="clinical-value">${latestObs.name || 'Stable'}</div>
                ${latestObs.date ? `<div class="clinical-date">Last updated: ${formatDateTime(latestObs.date)}</div>` : ''}
            </div>
        `;
    }
    
    content.innerHTML = html || '<div class="no-data">No admission data available</div>';
}

function populateBackground(data) {
    const content = document.getElementById('background-content');
    let html = '';
    
    // Medical history from conditions
    const conditions = data.condition || [];
    if (conditions.length > 0) {
        html += `
            <div class="clinical-item">
                <div class="clinical-label">Active Diagnoses</div>
                <div class="clinical-value">
                    ${conditions.map(c => c.name || 'Unknown condition').join(', ')}
                </div>
            </div>
        `;
    }
    
    // Current medications
    const medications = data.medicationrequest || [];
    if (medications.length > 0) {
        html += `
            <div class="clinical-item">
                <div class="clinical-label">Current Medications</div>
                <div class="clinical-value">
                    ${medications.map(med => {
                        const name = med.name || 'Unknown medication';
                        const dosage = med.value || med.status || '';
                        return dosage ? `${name} (${dosage})` : name;
                    }).join('<br>')}
                </div>
            </div>
        `;
    }
    
    // Allergies (if available in data)
    html += `
        <div class="clinical-item">
            <div class="clinical-label">Known Allergies</div>
            <div class="clinical-value">No known allergies documented</div>
        </div>
    `;
    
    content.innerHTML = html || '<div class="no-data">No background data available</div>';
}

function populateAssessment(data) {
    const content = document.getElementById('assessment-content');
    let html = '';
    
    // Latest vitals
    const vitals = data.vital_signs || [];
    const observations = data.observation || [];
    
    if (vitals.length > 0 || observations.length > 0) {
        const allReadings = [...vitals, ...observations];
        
        allReadings.forEach(reading => {
            const isAbnormal = checkIfAbnormal(reading.name, reading.value);
            const itemClass = isAbnormal ? 'clinical-item abnormal' : 'clinical-item normal';
            
            html += `
                <div class="${itemClass}">
                    <div class="clinical-label">
                        ${reading.name || 'Unknown reading'}
                        ${isAbnormal ? '<span class="badge-abnormal ms-2">ABNORMAL</span>' : '<span class="badge-normal ms-2">NORMAL</span>'}
                    </div>
                    <div class="clinical-value">${reading.value || 'No value recorded'}</div>
                    ${reading.date ? `<div class="clinical-date">Recorded: ${formatDateTime(reading.date)}</div>` : ''}
                </div>
            `;
        });
    }
    
    content.innerHTML = html || '<div class="no-data">No assessment data available</div>';
}

function populateRecommendation(data) {
    const content = document.getElementById('recommendation-content');
    let html = '';
    
    // Medication due times
    const medications = data.medicationrequest || [];
    if (medications.length > 0) {
        html += `
            <div class="clinical-item priority-medium">
                <div class="clinical-label">Medications Due</div>
                <div class="clinical-value">
                    ${medications.map(med => {
                        const name = med.name || 'Unknown medication';
                        const schedule = med.value || med.status || 'As prescribed';
                        return `${name} - ${schedule}`;
                    }).join('<br>')}
                </div>
            </div>
        `;
    }
    
    // Monitoring requirements based on conditions
    const conditions = data.condition || [];
    if (conditions.length > 0) {
        const monitoringNeeds = generateMonitoringRecommendations(conditions);
        if (monitoringNeeds.length > 0) {
            html += `
                <div class="clinical-item priority-high">
                    <div class="clinical-label">Monitoring Requirements</div>
                    <div class="clinical-value">
                        ${monitoringNeeds.join('<br>')}
                    </div>
                </div>
            `;
        }
    }
    
    // Follow-up actions
    const observations = data.observation || [];
    if (observations.length > 0) {
        const followUpActions = generateFollowUpActions(observations);
        if (followUpActions.length > 0) {
            html += `
                <div class="clinical-item priority-medium">
                    <div class="clinical-label">Follow-up Actions</div>
                    <div class="clinical-value">
                        ${followUpActions.join('<br>')}
                    </div>
                </div>
            `;
        }
    }
    
    // General priorities
    html += `
        <div class="clinical-item priority-low">
            <div class="clinical-label">General Priorities</div>
            <div class="clinical-value">
                • Continue current treatment plan<br>
                • Monitor for any changes in condition<br>
                • Ensure patient comfort and safety
            </div>
        </div>
    `;
    
    content.innerHTML = html || '<div class="no-data">No specific recommendations at this time</div>';
}

function populatePatientsList(patients) {
    const listElement = document.getElementById('patients-list');
    
    if (!patients || patients.length === 0) {
        listElement.innerHTML = '<div class="no-data">No patients available</div>';
        return;
    }
    
    const html = patients.map(patient => {
        const age = calculateAge(patient.birthDate);
        const conditions = [];
        
        // Extract conditions from patient data
        if (patient.data) {
            Object.entries(patient.data).forEach(([resourceType, records]) => {
                if (resourceType === 'condition' && Array.isArray(records)) {
                    records.forEach(record => {
                        if (record.name) conditions.push(record.name);
                    });
                }
            });
        }
        
        return `
            <div class="patient-summary-card">
                <div class="patient-name">${patient.name || 'Unknown Patient'}</div>
                <div class="patient-details">
                    <div class="patient-detail">
                        <i class="fas fa-venus-mars"></i>
                        <span>${patient.gender || 'Unknown'}</span>
                    </div>
                    <div class="patient-detail">
                        <i class="fas fa-birthday-cake"></i>
                        <span>${age} years</span>
                    </div>
                </div>
                ${conditions.length > 0 ? `
                    <div class="patient-conditions">
                        ${conditions.slice(0, 3).map(condition => 
                            `<span class="condition-badge">${condition}</span>`
                        ).join('')}
                        ${conditions.length > 3 ? `<span class="condition-badge">+${conditions.length - 3} more</span>` : ''}
                    </div>
                ` : ''}
            </div>
        `;
    }).join('');
    
    listElement.innerHTML = html;
}

function checkIfAbnormal(name, value) {
    if (!name || !value) return false;
    
    const nameUpper = name.toUpperCase();
    const valueStr = value.toString().toUpperCase();
    
    // Check for specific abnormal indicators
    const abnormalKeywords = [
        'HIGH', 'LOW', 'ABNORMAL', 'ELEVATED', 'DECREASED',
        'POSITIVE', 'NEGATIVE', 'CRITICAL', 'URGENT'
    ];
    
    // Check for specific vital sign ranges
    if (nameUpper.includes('BP') || nameUpper.includes('BLOOD PRESSURE')) {
        const bpMatch = value.match(/(\d+)\/(\d+)/);
        if (bpMatch) {
            const systolic = parseInt(bpMatch[1]);
            const diastolic = parseInt(bpMatch[2]);
            return systolic > 140 || systolic < 90 || diastolic > 90 || diastolic < 60;
        }
    }
    
    if (nameUpper.includes('TEMP')) {
        const tempMatch = value.match(/(\d+\.?\d*)/);
        if (tempMatch) {
            const temp = parseFloat(tempMatch[1]);
            return temp > 38.0 || temp < 36.0;
        }
    }
    
    return abnormalKeywords.some(keyword => valueStr.includes(keyword));
}

function generateMonitoringRecommendations(conditions) {
    const recommendations = [];
    
    conditions.forEach(condition => {
        const name = (condition.name || '').toLowerCase();
        
        if (name.includes('hypertension') || name.includes('blood pressure')) {
            recommendations.push('• Monitor BP every 4 hours');
        }
        if (name.includes('diabetes')) {
            recommendations.push('• Check blood glucose QID');
        }
        if (name.includes('heart') || name.includes('cardiac')) {
            recommendations.push('• Continuous cardiac monitoring');
        }
        if (name.includes('sepsis')) {
            recommendations.push('• Hourly vital signs, monitor for deterioration');
        }
        if (name.includes('pain')) {
            recommendations.push('• Pain assessment every 2 hours');
        }
    });
    
    return [...new Set(recommendations)]; // Remove duplicates
}

function generateFollowUpActions(observations) {
    const actions = [];
    
    observations.forEach(obs => {
        const name = (obs.name || '').toLowerCase();
        const value = (obs.value || '').toLowerCase();
        
        if (name.includes('lab') || name.includes('blood')) {
            actions.push('• Review lab results with physician');
        }
        if (value.includes('abnormal') || value.includes('high') || value.includes('low')) {
            actions.push('• Notify physician of abnormal results');
        }
        if (name.includes('pain') && value.includes('8')) {
            actions.push('• Consider pain management review');
        }
    });
    
    return [...new Set(actions)]; // Remove duplicates
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

function calculateDaysSince(date) {
    if (!date) return 0;
    
    const startDate = new Date(date);
    const today = new Date();
    const timeDiff = today.getTime() - startDate.getTime();
    const daysDiff = Math.ceil(timeDiff / (1000 * 3600 * 24));
    
    return Math.max(0, daysDiff);
}

function formatDate(dateString) {
    if (!dateString) return '';
    
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    });
}

function formatDateTime(dateString) {
    if (!dateString) return '';
    
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}