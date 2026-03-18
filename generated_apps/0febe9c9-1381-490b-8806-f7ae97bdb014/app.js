document.addEventListener('DOMContentLoaded', function() {
    // Set timestamp
    document.getElementById('timestamp').textContent = new Date().toLocaleString();
    
    // Check if we have patient data
    if (!window.PATIENT_DATA) {
        showError('No patient data available');
        return;
    }

    const data = window.PATIENT_DATA;
    
    // Handle all patients view
    if (data.patient && data.patient.id === 'all') {
        showAllPatientsView();
        return;
    }
    
    // Single patient view
    if (data.patient) {
        generateSBARSummary(data);
    } else {
        showError('Patient information not available');
    }
});

function showAllPatientsView() {
    document.getElementById('all-patients-view').classList.remove('d-none');
    document.querySelector('.row.g-4').classList.add('d-none');
    
    const patientList = document.getElementById('patient-list');
    const patients = window.PATIENT_DATA.patients || [];
    
    if (patients.length === 0) {
        patientList.innerHTML = '<div class="col-12"><div class="no-data">No patients available</div></div>';
        return;
    }
    
    patientList.innerHTML = patients.map(patient => `
        <div class="col-12 col-md-6 col-lg-4">
            <div class="card patient-card" onclick="selectPatient('${patient.id}')">
                <div class="card-body">
                    <h6 class="card-title mb-1">${patient.name || 'Unknown Patient'}</h6>
                    <p class="text-muted mb-2">
                        ${patient.gender || 'Unknown'} • 
                        ${patient.birthDate ? calculateAge(patient.birthDate) + ' years' : 'Age unknown'}
                    </p>
                    <small class="text-muted">
                        ${getPatientConditionCount(patient)} conditions • 
                        ${getPatientMedicationCount(patient)} medications
                    </small>
                </div>
            </div>
        </div>
    `).join('');
}

function selectPatient(patientId) {
    // In a real app, this would navigate to the specific patient
    alert(`Navigate to patient ${patientId} for SBAR summary`);
}

function generateSBARSummary(data) {
    const patient = data.patient;
    
    // Update header
    const age = patient.birthDate ? calculateAge(patient.birthDate) : 'Unknown age';
    document.getElementById('patient-header').textContent = 
        `${patient.name || 'Unknown Patient'} • ${patient.gender || 'Unknown'} • ${age}`;
    
    // Generate each SBAR section
    generateSituation(data);
    generateBackground(data);
    generateAssessment(data);
    generateRecommendation(data);
}

function generateSituation(data) {
    const content = document.getElementById('situation-content');
    const conditions = data.condition?.summary || [];
    const encounters = data.encounter?.summary || [];
    
    if (conditions.length === 0 && encounters.length === 0) {
        content.innerHTML = '<div class="no-data">No admission or encounter data available</div>';
        return;
    }
    
    let html = '<div class="list-group list-group-flush">';
    
    // Current admission reason
    if (conditions.length > 0) {
        const primaryCondition = conditions[0];
        html += `
            <div class="list-group-item">
                <div class="sbar-label">Primary Admission Diagnosis</div>
                <div class="sbar-value">${primaryCondition.name || 'Not specified'}</div>
            </div>
        `;
    }
    
    // Encounter information
    if (encounters.length > 0) {
        const latestEncounter = encounters[0];
        const admissionDate = latestEncounter.date ? new Date(latestEncounter.date) : null;
        const daysAdmitted = admissionDate ? Math.floor((new Date() - admissionDate) / (1000 * 60 * 60 * 24)) : null;
        
        html += `
            <div class="list-group-item">
                <div class="sbar-label">Length of Stay</div>
                <div class="sbar-value">
                    ${daysAdmitted !== null ? `${daysAdmitted} days` : 'Unknown duration'}
                    ${admissionDate ? `(since ${admissionDate.toLocaleDateString()})` : ''}
                </div>
            </div>
        `;
    }
    
    // Current status
    html += `
        <div class="list-group-item">
            <div class="sbar-label">Current Status</div>
            <div class="sbar-value">
                ${encounters.length > 0 && encounters[0].status ? encounters[0].status : 'Active care'}
                ${conditions.length > 1 ? ` • ${conditions.length} active conditions` : ''}
            </div>
        </div>
    `;
    
    html += '</div>';
    content.innerHTML = html;
}

function generateBackground(data) {
    const content = document.getElementById('background-content');
    const conditions = data.condition?.summary || [];
    const medications = data.medicationrequest?.summary || [];
    const allergies = data.allergyintolerance?.summary || [];
    
    let html = '<div class="list-group list-group-flush">';
    
    // Medical history / diagnoses
    html += `
        <div class="list-group-item">
            <div class="sbar-label">Active Diagnoses</div>
            <div class="sbar-value">
                ${conditions.length > 0 ? 
                    conditions.map(c => c.name).join(', ') : 
                    'No active diagnoses recorded'
                }
            </div>
        </div>
    `;
    
    // Allergies
    html += `
        <div class="list-group-item">
            <div class="sbar-label">Known Allergies</div>
            <div class="sbar-value">
                ${allergies.length > 0 ? 
                    allergies.map(a => a.name).join(', ') : 
                    'NKDA (No Known Drug Allergies)'
                }
            </div>
        </div>
    `;
    
    // Current medications
    html += `
        <div class="list-group-item">
            <div class="sbar-label">Current Medications</div>
            <div class="sbar-value">
                ${medications.length > 0 ? 
                    medications.map(m => `${m.name}${m.value ? ` (${m.value})` : ''}`).join('<br>') : 
                    'No medications recorded'
                }
            </div>
        </div>
    `;
    
    html += '</div>';
    content.innerHTML = html;
}

function generateAssessment(data) {
    const content = document.getElementById('assessment-content');
    const vitals = data.vital_signs?.summary || [];
    const observations = data.observation?.summary || [];
    
    if (vitals.length === 0 && observations.length === 0) {
        content.innerHTML = '<div class="no-data">No vital signs or observations recorded</div>';
        return;
    }
    
    let html = '<div class="list-group list-group-flush">';
    
    // Latest vitals
    if (vitals.length > 0) {
        html += `
            <div class="list-group-item">
                <div class="sbar-label">Latest Vital Signs</div>
                <div class="sbar-value">
        `;
        
        vitals.forEach(vital => {
            const isAbnormal = checkIfAbnormal(vital.name, vital.value);
            const badge = isAbnormal ? '<span class="badge-abnormal ms-2">ABNORMAL</span>' : '';
            const recordedDate = vital.date ? new Date(vital.date).toLocaleString() : '';
            
            html += `
                <div class="d-flex justify-content-between align-items-center mb-1">
                    <span>${vital.name}: ${vital.value || 'No value'} ${badge}</span>
                    <small class="text-muted">${recordedDate}</small>
                </div>
            `;
        });
        
        html += `
                </div>
            </div>
        `;
    }
    
    // Recent observations/lab results
    if (observations.length > 0) {
        html += `
            <div class="list-group-item">
                <div class="sbar-label">Recent Observations</div>
                <div class="sbar-value">
        `;
        
        observations.forEach(obs => {
            const isAbnormal = checkIfAbnormal(obs.name, obs.value);
            const badge = isAbnormal ? '<span class="badge-abnormal ms-2">REVIEW</span>' : '';
            const recordedDate = obs.date ? new Date(obs.date).toLocaleString() : '';
            
            html += `
                <div class="d-flex justify-content-between align-items-center mb-1">
                    <span>${obs.name}: ${obs.value || 'Pending'} ${badge}</span>
                    <small class="text-muted">${recordedDate}</small>
                </div>
            `;
        });
        
        html += `
                </div>
            </div>
        `;
    }
    
    html += '</div>';
    content.innerHTML = html;
}

function generateRecommendation(data) {
    const content = document.getElementById('recommendation-content');
    const medications = data.medicationrequest?.summary || [];
    const conditions = data.condition?.summary || [];
    const vitals = data.vital_signs?.summary || [];
    
    let html = '<div class="list-group list-group-flush">';
    
    // Medication schedule
    if (medications.length > 0) {
        html += `
            <div class="list-group-item">
                <div class="sbar-label">Medications Due</div>
                <div class="sbar-value">
                    ${medications.map(m => 
                        `• ${m.name}${m.value ? ` - ${m.value}` : ''}`
                    ).join('<br>')}
                </div>
            </div>
        `;
    }
    
    // Monitoring requirements
    const abnormalVitals = vitals.filter(v => checkIfAbnormal(v.name, v.value));
    if (abnormalVitals.length > 0) {
        html += `
            <div class="list-group-item">
                <div class="sbar-label">
                    <span class="text-urgent">Priority Monitoring</span>
                    <span class="badge-urgent ms-2">URGENT</span>
                </div>
                <div class="sbar-value">
                    ${abnormalVitals.map(v => 
                        `• Monitor ${v.name} - currently ${v.value}`
                    ).join('<br>')}
                </div>
            </div>
        `;
    }
    
    // Condition-specific tasks
    html += `
        <div class="list-group-item">
            <div class="sbar-label">Outstanding Tasks</div>
            <div class="sbar-value">
                ${generateConditionTasks(conditions)}
            </div>
        </div>
    `;
    
    // Escalation criteria
    html += `
        <div class="list-group-item">
            <div class="sbar-label">Escalate If</div>
            <div class="sbar-value">
                ${generateEscalationCriteria(conditions, abnormalVitals)}
            </div>
        </div>
    `;
    
    html += '</div>';
    content.innerHTML = html;
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
    
    // Heart rate
    if (nameUpper.includes('HR') || nameUpper.includes('HEART RATE')) {
        const hr = parseInt(value);
        return hr > 100 || hr < 60;
    }
    
    // Pain scale
    if (nameUpper.includes('PAIN')) {
        const pain = parseInt(value);
        return pain >= 7;
    }
    
    // Look for common abnormal indicators
    return valueStr.includes('HIGH') || valueStr.includes('LOW') || 
           valueStr.includes('ABNORMAL') || valueStr.includes('CRITICAL') ||
           valueStr.includes('POSITIVE') && nameUpper.includes('SPUTUM');
}

function generateConditionTasks(conditions) {
    if (conditions.length === 0) return 'No specific tasks identified';
    
    const tasks = [];
    
    conditions.forEach(condition => {
        const name = condition.name?.toUpperCase() || '';
        
        if (name.includes('HYPERTENSION')) {
            tasks.push('• Monitor BP q4h, review antihypertensive therapy');
        } else if (name.includes('DIABETES')) {
            tasks.push('• Check BGL q6h, review insulin sliding scale');
        } else if (name.includes('ASTHMA') || name.includes('COPD')) {
            tasks.push('• Monitor respiratory status, peak flow measurements');
        } else if (name.includes('SEPSIS')) {
            tasks.push('• Continue sepsis bundle, monitor lactate and cultures');
        } else if (name.includes('PAIN')) {
            tasks.push('• Regular pain assessment, review analgesia effectiveness');
        } else {
            tasks.push(`• Continue monitoring for ${condition.name}`);
        }
    });
    
    return tasks.length > 0 ? tasks.join('<br>') : 'Continue routine monitoring';
}

function generateEscalationCriteria(conditions, abnormalVitals) {
    const criteria = [
        '• Deteriorating vital signs or consciousness',
        '• New onset chest pain or shortness of breath',
        '• Temperature >38.5°C or <36°C',
        '• Systolic BP <90 or >180 mmHg'
    ];
    
    conditions.forEach(condition => {
        const name = condition.name?.toUpperCase() || '';
        
        if (name.includes('SEPSIS')) {
            criteria.push('• Signs of septic shock or organ dysfunction');
        } else if (name.includes('ASTHMA') || name.includes('COPD')) {
            criteria.push('• Increasing respiratory distress or O2 requirements');
        } else if (name.includes('CHEST PAIN')) {
            criteria.push('• Recurrent chest pain or ECG changes');
        }
    });
    
    return criteria.join('<br>');
}

function calculateAge(birthDate) {
    const today = new Date();
    const birth = new Date(birthDate);
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
        age--;
    }
    
    return age;
}

function getPatientConditionCount(patient) {
    return patient.data?.condition?.length || 0;
}

function getPatientMedicationCount(patient) {
    return patient.data?.medicationrequest?.length || 0;
}

function showError(message) {
    document.querySelector('.container-fluid').innerHTML = `
        <div class="row justify-content-center">
            <div class="col-12 col-md-6">
                <div class="card">
                    <div class="card-body text-center">
                        <i class="fas fa-exclamation-triangle text-warning mb-3" style="font-size: 2rem;"></i>
                        <h5>Unable to Generate SBAR Summary</h5>
                        <p class="text-muted">${message}</p>
                    </div>
                </div>
            </div>
        </div>
    `;
}