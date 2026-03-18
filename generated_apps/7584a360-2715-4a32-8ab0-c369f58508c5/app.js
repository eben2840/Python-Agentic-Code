document.addEventListener('DOMContentLoaded', function() {
    if (!window.PATIENT_DATA) {
        console.error('PATIENT_DATA not available');
        showError('Patient data not available');
        return;
    }

    const data = window.PATIENT_DATA;
    
    if (data.patient && data.patient.id === 'all') {
        showAllPatientsView();
    } else {
        showSinglePatientSBAR();
    }
});

function showSinglePatientSBAR() {
    const data = window.PATIENT_DATA;
    
    // Update header
    const patientHeader = document.getElementById('patient-header');
    if (data.patient) {
        const age = calculateAge(data.patient.birthDate);
        patientHeader.textContent = `${data.patient.name} • ${data.patient.gender} • ${age} years old`;
    }

    // Populate SBAR sections
    populateSituation();
    populateBackground();
    populateAssessment();
    populateRecommendation();
}

function showAllPatientsView() {
    document.querySelector('.row.g-4').classList.add('d-none');
    document.getElementById('all-patients-view').classList.remove('d-none');
    
    const patientsGrid = document.getElementById('patients-grid');
    const data = window.PATIENT_DATA;
    
    if (!data.patients || data.patients.length === 0) {
        patientsGrid.innerHTML = '<div class="col-12"><div class="no-data">No patients available</div></div>';
        return;
    }
    
    patientsGrid.innerHTML = data.patients.map(patient => {
        const age = calculateAge(patient.birthDate);
        const conditions = [];
        
        // Collect conditions from patient data
        if (patient.data) {
            Object.entries(patient.data).forEach(([resourceType, records]) => {
                if (resourceType === 'condition' && Array.isArray(records)) {
                    records.forEach(condition => {
                        if (condition.name) {
                            conditions.push(condition.name);
                        }
                    });
                }
            });
        }
        
        return `
            <div class="col-12 col-md-6 col-lg-4">
                <div class="patient-summary-card">
                    <div class="patient-name">${patient.name || 'Unknown'}</div>
                    <div class="patient-info">
                        ${patient.gender || 'Unknown'} • ${age} years old
                    </div>
                    <div class="conditions">
                        ${conditions.length > 0 
                            ? conditions.map(condition => `<span class="condition-badge">${condition}</span>`).join('')
                            : '<span class="text-muted">No active conditions</span>'
                        }
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

function populateSituation() {
    const content = document.getElementById('situation-content');
    const data = window.PATIENT_DATA;
    
    let html = '';
    
    // Current admission reason
    if (data.condition && data.condition.summary && data.condition.summary.length > 0) {
        const primaryCondition = data.condition.summary[0];
        html += `
            <div class="info-item">
                <div class="info-label">Admission Reason</div>
                <div class="info-value">${primaryCondition.name}</div>
            </div>
        `;
        
        if (primaryCondition.date) {
            const admissionDate = new Date(primaryCondition.date);
            const daysAdmitted = Math.floor((new Date() - admissionDate) / (1000 * 60 * 60 * 24));
            html += `
                <div class="info-item">
                    <div class="info-label">Length of Stay</div>
                    <div class="info-value">${daysAdmitted} days (admitted ${formatDate(admissionDate)})</div>
                </div>
            `;
        }
    }
    
    // Current status from latest encounter
    if (data.encounter && data.encounter.summary && data.encounter.summary.length > 0) {
        const latestEncounter = data.encounter.summary[0];
        html += `
            <div class="info-item">
                <div class="info-label">Current Status</div>
                <div class="info-value">${latestEncounter.status || 'Active'}</div>
            </div>
        `;
    }
    
    if (!html) {
        html = '<div class="no-data">No admission information available</div>';
    }
    
    content.innerHTML = html;
}

function populateBackground() {
    const content = document.getElementById('background-content');
    const data = window.PATIENT_DATA;
    
    let html = '';
    
    // Medical history and diagnoses
    if (data.condition && data.condition.summary && data.condition.summary.length > 0) {
        html += `
            <div class="info-item">
                <div class="info-label">Active Diagnoses</div>
                <div class="info-value">
                    ${data.condition.summary.map(condition => 
                        `<div class="mb-1">• ${condition.name}${condition.status ? ` (${condition.status})` : ''}</div>`
                    ).join('')}
                </div>
            </div>
        `;
    }
    
    // Current medications
    if (data.medicationrequest && data.medicationrequest.summary && data.medicationrequest.summary.length > 0) {
        html += `
            <div class="info-item">
                <div class="info-label">Current Medications</div>
                <div class="info-value">
                    ${data.medicationrequest.summary.map(med => `
                        <div class="medication-item">
                            <div class="medication-name">${med.name}</div>
                            <div class="medication-dose">${med.value || 'Dose not specified'}</div>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
    }
    
    // Allergies (if available in patient data)
    html += `
        <div class="info-item">
            <div class="info-label">Known Allergies</div>
            <div class="info-value text-muted">No allergies documented</div>
        </div>
    `;
    
    if (!html) {
        html = '<div class="no-data">No background information available</div>';
    }
    
    content.innerHTML = html;
}

function populateAssessment() {
    const content = document.getElementById('assessment-content');
    const data = window.PATIENT_DATA;
    
    let html = '';
    
    // Latest vitals
    if (data.vital_signs && data.vital_signs.summary && data.vital_signs.summary.length > 0) {
        html += `
            <div class="info-item">
                <div class="info-label">Latest Vital Signs</div>
                <div class="info-value">
                    ${data.vital_signs.summary.map(vital => {
                        const isAbnormal = checkIfAbnormal(vital.name, vital.value);
                        return `
                            <div class="vital-item">
                                <span class="vital-name">${vital.name}</span>
                                <div class="vital-value">
                                    <span>${vital.value}</span>
                                    ${isAbnormal ? '<span class="badge-abnormal">Abnormal</span>' : '<span class="badge-normal">Normal</span>'}
                                </div>
                            </div>
                        `;
                    }).join('')}
                </div>
            </div>
        `;
        
        if (data.vital_signs.summary[0].date) {
            html += `
                <div class="info-item">
                    <div class="info-label">Last Recorded</div>
                    <div class="info-value">${formatDateTime(data.vital_signs.summary[0].date)}</div>
                </div>
            `;
        }
    }
    
    // Recent observations/lab results
    if (data.observation && data.observation.summary && data.observation.summary.length > 0) {
        html += `
            <div class="info-item">
                <div class="info-label">Recent Lab Results</div>
                <div class="info-value">
                    ${data.observation.summary.map(obs => {
                        const isAbnormal = checkIfAbnormal(obs.name, obs.value);
                        return `
                            <div class="vital-item">
                                <span class="vital-name">${obs.name}</span>
                                <div class="vital-value">
                                    <span>${obs.value}</span>
                                    ${isAbnormal ? '<span class="badge-abnormal">Abnormal</span>' : '<span class="badge-normal">Normal</span>'}
                                </div>
                            </div>
                        `;
                    }).join('')}
                </div>
            </div>
        `;
    }
    
    if (!html) {
        html = '<div class="no-data">No assessment data available</div>';
    }
    
    content.innerHTML = html;
}

function populateRecommendation() {
    const content = document.getElementById('recommendation-content');
    const data = window.PATIENT_DATA;
    
    let html = '';
    let hasUrgentItems = false;
    
    // Medication due times
    if (data.medicationrequest && data.medicationrequest.summary && data.medicationrequest.summary.length > 0) {
        html += `
            <div class="task-item">
                <i class="fas fa-pills task-icon text-primary"></i>
                <div class="task-content">
                    <div class="task-title">Medications Due</div>
                    <div class="task-description">
                        ${data.medicationrequest.summary.map(med => 
                            `${med.name} - ${med.value || 'as prescribed'}`
                        ).join('<br>')}
                    </div>
                </div>
            </div>
        `;
    }
    
    // Monitoring based on conditions
    if (data.condition && data.condition.summary && data.condition.summary.length > 0) {
        const monitoringTasks = generateMonitoringTasks(data.condition.summary);
        if (monitoringTasks.length > 0) {
            html += monitoringTasks.map(task => `
                <div class="task-item">
                    <i class="fas ${task.urgent ? 'fa-exclamation-triangle text-danger' : 'fa-eye text-warning'} task-icon"></i>
                    <div class="task-content">
                        <div class="task-title">
                            ${task.title}
                            ${task.urgent ? '<span class="badge-urgent ms-2">Urgent</span>' : ''}
                        </div>
                        <div class="task-description">${task.description}</div>
                    </div>
                </div>
            `).join('');
            
            if (monitoringTasks.some(task => task.urgent)) {
                hasUrgentItems = true;
            }
        }
    }
    
    // Check for abnormal vitals requiring escalation
    if (data.vital_signs && data.vital_signs.summary && data.vital_signs.summary.length > 0) {
        const abnormalVitals = data.vital_signs.summary.filter(vital => checkIfAbnormal(vital.name, vital.value));
        if (abnormalVitals.length > 0) {
            html += `
                <div class="task-item">
                    <i class="fas fa-exclamation-triangle task-icon text-danger"></i>
                    <div class="task-content">
                        <div class="task-title">
                            Escalation Required
                            <span class="badge-urgent ms-2">Urgent</span>
                        </div>
                        <div class="task-description">
                            Abnormal vitals detected: ${abnormalVitals.map(v => v.name).join(', ')}. 
                            Consider medical review.
                        </div>
                    </div>
                </div>
            `;
            hasUrgentItems = true;
        }
    }
    
    // General follow-up
    html += `
        <div class="task-item">
            <i class="fas fa-clock task-icon text-info"></i>
            <div class="task-content">
                <div class="task-title">Routine Monitoring</div>
                <div class="task-description">Continue regular vital signs monitoring and document any changes in condition</div>
            </div>
        </div>
    `;
    
    if (hasUrgentItems) {
        html = `
            <div class="alert alert-danger d-flex align-items-center mb-3">
                <i class="fas fa-exclamation-triangle me-2"></i>
                <span><strong>Priority Actions Required</strong> - Review urgent items below immediately</span>
            </div>
        ` + html;
    }
    
    if (!html) {
        html = '<div class="no-data">No specific recommendations at this time</div>';
    }
    
    content.innerHTML = html;
}

function generateMonitoringTasks(conditions) {
    const tasks = [];
    
    conditions.forEach(condition => {
        const conditionName = condition.name.toLowerCase();
        
        if (conditionName.includes('hypertension') || conditionName.includes('bp')) {
            tasks.push({
                title: 'Blood Pressure Monitoring',
                description: 'Monitor BP every 4 hours. Target <140/90. Notify if >160/100.',
                urgent: false
            });
        }
        
        if (conditionName.includes('diabetes') || conditionName.includes('glucose')) {
            tasks.push({
                title: 'Blood Glucose Monitoring',
                description: 'Check BGL before meals and at bedtime. Target 4-8 mmol/L.',
                urgent: false
            });
        }
        
        if (conditionName.includes('sepsis')) {
            tasks.push({
                title: 'Sepsis Monitoring',
                description: 'Hourly obs, fluid balance, lactate levels. Escalate any deterioration immediately.',
                urgent: true
            });
        }
        
        if (conditionName.includes('chest pain') || conditionName.includes('cardiac')) {
            tasks.push({
                title: 'Cardiac Monitoring',
                description: 'Continuous ECG monitoring. Serial troponins. Chest pain assessment.',
                urgent: true
            });
        }
        
        if (conditionName.includes('copd') || conditionName.includes('asthma')) {
            tasks.push({
                title: 'Respiratory Monitoring',
                description: 'Monitor oxygen saturation, respiratory rate, peak flow if applicable.',
                urgent: false
            });
        }
    });
    
    return tasks;
}

function checkIfAbnormal(vitalName, value) {
    const name = vitalName.toLowerCase();
    const numValue = parseFloat(value);
    
    if (name.includes('bp') || name.includes('blood pressure')) {
        // Simple BP check - look for numbers >140 or >90
        const bpMatch = value.match(/(\d+)\/(\d+)/);
        if (bpMatch) {
            const systolic = parseInt(bpMatch[1]);
            const diastolic = parseInt(bpMatch[2]);
            return systolic > 140 || diastolic > 90;
        }
    }
    
    if (name.includes('temp') && !isNaN(numValue)) {
        return numValue > 38.0 || numValue < 36.0;
    }
    
    if (name.includes('glucose') && !isNaN(numValue)) {
        return numValue > 10.0 || numValue < 4.0;
    }
    
    if (name.includes('pain') && !isNaN(numValue)) {
        return numValue > 7;
    }
    
    // Default to checking for certain keywords that indicate abnormality
    const abnormalKeywords = ['high', 'low', 'abnormal', 'positive', 'elevated'];
    return abnormalKeywords.some(keyword => value.toLowerCase().includes(keyword));
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

function formatDate(date) {
    return new Date(date).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    });
}

function formatDateTime(date) {
    return new Date(date).toLocaleString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

function showError(message) {
    document.body.innerHTML = `
        <div class="container-fluid py-4">
            <div class="row justify-content-center">
                <div class="col-12 col-md-6">
                    <div class="alert alert-danger text-center">
                        <i class="fas fa-exclamation-triangle mb-2"></i>
                        <h4>Error</h4>
                        <p>${message}</p>
                    </div>
                </div>
            </div>
        </div>
    `;
}