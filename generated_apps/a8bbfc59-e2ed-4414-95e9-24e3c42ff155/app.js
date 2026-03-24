document.addEventListener('DOMContentLoaded', function() {
    // Set timestamp
    document.getElementById('timestamp').textContent = new Date().toLocaleString();
    
    // Check if we have patient data
    if (!window.PATIENT_DATA) {
        showError('No patient data available');
        return;
    }
    
    const data = window.PATIENT_DATA;
    
    // Check if this is all patients view
    if (data.patient && data.patient.id === 'all') {
        showAllPatientsView();
        return;
    }
    
    // Single patient view
    showSinglePatientView(data);
});

function showAllPatientsView() {
    document.getElementById('all-patients-view').classList.remove('d-none');
    document.getElementById('single-patient-view').classList.add('d-none');
    document.getElementById('patient-info').textContent = 'All Patients - Select specific patient for SBAR handover';
}

function showSinglePatientView(data) {
    const patient = data.patient;
    if (!patient) {
        showError('Patient information not available');
        return;
    }
    
    // Update patient info
    document.getElementById('patient-info').textContent = 
        `${patient.name || 'Unknown Patient'} • ${patient.gender || 'Unknown'} • DOB: ${formatDate(patient.birthDate) || 'Unknown'}`;
    
    // Generate SBAR sections
    generateSituation(data);
    generateBackground(data);
    generateAssessment(data);
    generateRecommendation(data);
}

function generateSituation(data) {
    const content = document.getElementById('situation-content');
    let html = '';
    
    // Current admission reason and status
    const conditions = data.condition?.summary || [];
    const encounters = data.encounter?.summary || [];
    
    if (conditions.length > 0) {
        const primaryCondition = conditions[0];
        html += `<div class="info-item">`;
        html += `<div class="info-label">Primary Diagnosis</div>`;
        html += `<p class="info-value">${primaryCondition.name || 'Not specified'}</p>`;
        html += `</div>`;
        
        if (primaryCondition.date) {
            const admissionDate = new Date(primaryCondition.date);
            const daysSince = Math.floor((new Date() - admissionDate) / (1000 * 60 * 60 * 24));
            html += `<div class="info-item">`;
            html += `<div class="info-label">Length of Stay</div>`;
            html += `<p class="info-value">${daysSince} days (admitted ${formatDate(primaryCondition.date)})</p>`;
            html += `</div>`;
        }
    }
    
    // Current status from encounters
    if (encounters.length > 0) {
        const recentEncounter = encounters[0];
        html += `<div class="info-item">`;
        html += `<div class="info-label">Current Status</div>`;
        html += `<p class="info-value">${recentEncounter.status || 'Active care'}</p>`;
        html += `</div>`;
    }
    
    if (!html) {
        html = '<div class="no-data"><i class="fas fa-info-circle"></i><p>No admission information available</p></div>';
    }
    
    content.innerHTML = html;
}

function generateBackground(data) {
    const content = document.getElementById('background-content');
    let html = '';
    
    // Medical history from conditions
    const conditions = data.condition?.summary || [];
    if (conditions.length > 0) {
        html += `<div class="info-item">`;
        html += `<div class="info-label">Active Diagnoses</div>`;
        html += '<ul class="mb-0">';
        conditions.forEach(condition => {
            html += `<li>${condition.name || 'Unspecified condition'}`;
            if (condition.date) {
                html += ` (${formatDate(condition.date)})`;
            }
            html += '</li>';
        });
        html += '</ul>';
        html += `</div>`;
    }
    
    // Current medications
    const medications = data.medicationrequest?.summary || [];
    if (medications.length > 0) {
        html += `<div class="info-item">`;
        html += `<div class="info-label">Current Medications</div>`;
        html += '<ul class="mb-0">';
        medications.forEach(med => {
            html += `<li>${med.name || 'Unspecified medication'}`;
            if (med.value) {
                html += ` - ${med.value}`;
            }
            html += '</li>';
        });
        html += '</ul>';
        html += `</div>`;
    }
    
    // Allergies (if available in patient data)
    html += `<div class="info-item">`;
    html += `<div class="info-label">Known Allergies</div>`;
    html += `<p class="info-value">No known allergies documented</p>`;
    html += `</div>`;
    
    if (!conditions.length && !medications.length) {
        html = '<div class="no-data"><i class="fas fa-history"></i><p>No background information available</p></div>';
    }
    
    content.innerHTML = html;
}

function generateAssessment(data) {
    const content = document.getElementById('assessment-content');
    let html = '';
    
    // Latest vitals
    const vitals = data.vital_signs?.summary || [];
    const observations = data.observation?.summary || [];
    
    if (vitals.length > 0 || observations.length > 0) {
        html += `<div class="info-item">`;
        html += `<div class="info-label">Latest Recorded Values</div>`;
        html += `<div class="vital-grid">`;
        
        // Process vitals
        vitals.forEach(vital => {
            const isAbnormal = checkIfAbnormal(vital.name, vital.value);
            html += `<div class="vital-item">`;
            html += `<div class="vital-label">${vital.name || 'Unknown'}</div>`;
            html += `<div class="vital-value">${vital.value || 'No data'}</div>`;
            if (isAbnormal) {
                html += `<div class="alert-badge alert-abnormal mt-2">`;
                html += `<i class="fas fa-exclamation-triangle"></i>Abnormal`;
                html += `</div>`;
            }
            html += `</div>`;
        });
        
        // Process observations
        observations.forEach(obs => {
            const isAbnormal = checkIfAbnormal(obs.name, obs.value);
            html += `<div class="vital-item">`;
            html += `<div class="vital-label">${obs.name || 'Unknown'}</div>`;
            html += `<div class="vital-value">${obs.value || 'No data'}</div>`;
            if (isAbnormal) {
                html += `<div class="alert-badge alert-abnormal mt-2">`;
                html += `<i class="fas fa-exclamation-triangle"></i>Abnormal`;
                html += `</div>`;
            }
            html += `</div>`;
        });
        
        html += `</div>`;
        html += `</div>`;
        
        // Trends and alerts
        const abnormalCount = [...vitals, ...observations].filter(item => 
            checkIfAbnormal(item.name, item.value)
        ).length;
        
        if (abnormalCount > 0) {
            html += `<div class="alert-badge alert-urgent">`;
            html += `<i class="fas fa-exclamation-circle"></i>`;
            html += `${abnormalCount} abnormal value${abnormalCount > 1 ? 's' : ''} require attention`;
            html += `</div>`;
        }
    }
    
    if (!html) {
        html = '<div class="no-data"><i class="fas fa-stethoscope"></i><p>No assessment data available</p></div>';
    }
    
    content.innerHTML = html;
}

function generateRecommendation(data) {
    const content = document.getElementById('recommendation-content');
    let html = '';
    
    // Generate recommendations based on available data
    const tasks = [];
    
    // Check medications due
    const medications = data.medicationrequest?.summary || [];
    if (medications.length > 0) {
        tasks.push({
            title: 'Medication Administration',
            details: `Review and administer ${medications.length} prescribed medication${medications.length > 1 ? 's' : ''}`,
            priority: 'medium'
        });
    }
    
    // Check for abnormal vitals
    const vitals = data.vital_signs?.summary || [];
    const observations = data.observation?.summary || [];
    const abnormalValues = [...vitals, ...observations].filter(item => 
        checkIfAbnormal(item.name, item.value)
    );
    
    if (abnormalValues.length > 0) {
        tasks.push({
            title: 'Monitor Abnormal Values',
            details: `${abnormalValues.length} abnormal reading${abnormalValues.length > 1 ? 's' : ''} requiring close monitoring`,
            priority: 'high'
        });
    }
    
    // Check conditions requiring follow-up
    const conditions = data.condition?.summary || [];
    if (conditions.length > 0) {
        tasks.push({
            title: 'Condition Monitoring',
            details: `Continue monitoring for ${conditions[0].name || 'primary condition'}`,
            priority: 'medium'
        });
    }
    
    // Standard nursing tasks
    tasks.push({
        title: 'Routine Assessments',
        details: 'Complete routine vital signs, pain assessment, and safety checks',
        priority: 'low'
    });
    
    tasks.push({
        title: 'Documentation',
        details: 'Update nursing notes and care plan as needed',
        priority: 'low'
    });
    
    if (tasks.length > 0) {
        html += `<ul class="task-list">`;
        tasks.forEach(task => {
            html += `<li class="task-item">`;
            html += `<div class="task-priority priority-${task.priority}"></div>`;
            html += `<div class="task-content">`;
            html += `<div class="task-title">${task.title}</div>`;
            html += `<p class="task-details">${task.details}</p>`;
            html += `</div>`;
            html += `</li>`;
        });
        html += `</ul>`;
        
        // Priority summary
        const highPriority = tasks.filter(t => t.priority === 'high').length;
        if (highPriority > 0) {
            html += `<div class="alert-badge alert-urgent mt-3">`;
            html += `<i class="fas fa-exclamation-circle"></i>`;
            html += `${highPriority} high priority task${highPriority > 1 ? 's' : ''} require immediate attention`;
            html += `</div>`;
        }
    }
    
    if (!html) {
        html = '<div class="no-data"><i class="fas fa-tasks"></i><p>No specific recommendations at this time</p></div>';
    }
    
    content.innerHTML = html;
}

function checkIfAbnormal(name, value) {
    if (!name || !value) return false;
    
    const nameUpper = name.toUpperCase();
    const valueStr = value.toString().toUpperCase();
    
    // Check for obvious abnormal indicators
    if (valueStr.includes('ABNORMAL') || valueStr.includes('HIGH') || valueStr.includes('LOW') || 
        valueStr.includes('POSITIVE') || valueStr.includes('ELEVATED')) {
        return true;
    }
    
    // Check specific vital ranges (basic examples)
    if (nameUpper.includes('BP') || nameUpper.includes('BLOOD PRESSURE')) {
        const bpMatch = value.match(/(\d+)\/(\d+)/);
        if (bpMatch) {
            const systolic = parseInt(bpMatch[1]);
            const diastolic = parseInt(bpMatch[2]);
            return systolic > 140 || systolic < 90 || diastolic > 90 || diastolic < 60;
        }
    }
    
    if (nameUpper.includes('TEMP')) {
        const temp = parseFloat(value);
        if (!isNaN(temp)) {
            return temp > 38.0 || temp < 36.0;
        }
    }
    
    return false;
}

function formatDate(dateString) {
    if (!dateString) return null;
    try {
        return new Date(dateString).toLocaleDateString();
    } catch (e) {
        return dateString;
    }
}

function showError(message) {
    document.getElementById('patient-info').textContent = 'Error loading patient data';
    document.getElementById('situation-content').innerHTML = 
        `<div class="no-data"><i class="fas fa-exclamation-triangle"></i><p>${message}</p></div>`;
    document.getElementById('background-content').innerHTML = 
        `<div class="no-data"><i class="fas fa-exclamation-triangle"></i><p>${message}</p></div>`;
    document.getElementById('assessment-content').innerHTML = 
        `<div class="no-data"><i class="fas fa-exclamation-triangle"></i><p>${message}</p></div>`;
    document.getElementById('recommendation-content').innerHTML = 
        `<div class="no-data"><i class="fas fa-exclamation-triangle"></i><p>${message}</p></div>`;
}