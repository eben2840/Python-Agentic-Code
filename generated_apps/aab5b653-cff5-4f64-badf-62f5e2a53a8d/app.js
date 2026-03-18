document.addEventListener('DOMContentLoaded', function() {
    if (typeof window.PATIENT_DATA === 'undefined') {
        console.error('PATIENT_DATA not available');
        return;
    }

    const data = window.PATIENT_DATA;
    
    if (data.patient && data.patient.id === 'all') {
        showAllPatientsView();
    } else {
        showSinglePatientView();
    }
});

function showSinglePatientView() {
    document.getElementById('single-patient-view').classList.remove('d-none');
    document.getElementById('all-patients-view').classList.add('d-none');
    
    const data = window.PATIENT_DATA;
    const patient = data.patient;
    
    // Patient header
    document.getElementById('patient-name').textContent = patient.name || 'Unknown Patient';
    document.getElementById('patient-gender').textContent = patient.gender || 'Unknown';
    
    if (patient.birthDate) {
        const age = calculateAge(patient.birthDate);
        document.getElementById('patient-age').textContent = `Age: ${age}`;
    } else {
        document.getElementById('patient-age').textContent = 'Age: Unknown';
    }
    
    // Conditions
    renderSinglePatientConditions(data.condition || {});
    
    // Medications
    renderSinglePatientMedications(data.medicationrequest || {});
    
    // Observations
    renderSinglePatientObservations(data.observation || {});
}

function showAllPatientsView() {
    document.getElementById('all-patients-view').classList.remove('d-none');
    document.getElementById('single-patient-view').classList.add('d-none');
    
    const data = window.PATIENT_DATA;
    const patients = data.patients || [];
    
    // Calculate metrics
    const totalPatients = patients.length;
    let criticalConditions = 0;
    let totalQualityScore = 0;
    let qualityCount = 0;
    
    const criticalConditionNames = ['sepsis', 'cancer', 'heart', 'stroke', 'trauma', 'ckd', 'copd', 'tb'];
    
    patients.forEach(patient => {
        if (patient.data && patient.data.condition) {
            patient.data.condition.forEach(condition => {
                const conditionName = (condition.name || '').toLowerCase();
                if (criticalConditionNames.some(critical => conditionName.includes(critical))) {
                    criticalConditions++;
                }
            });
        }
        
        if (patient.data && patient.data.observation) {
            patient.data.observation.forEach(obs => {
                const score = extractQualityScore(obs.name, obs.value);
                if (score !== null) {
                    totalQualityScore += score;
                    qualityCount++;
                }
            });
        }
    });
    
    const survivalRate = totalPatients > 0 ? Math.round((totalPatients / totalPatients) * 100) : 0;
    const avgQualityScore = qualityCount > 0 ? Math.round(totalQualityScore / qualityCount) : 0;
    
    // Update metrics
    document.getElementById('total-patients').textContent = totalPatients;
    document.getElementById('critical-conditions').textContent = criticalConditions;
    document.getElementById('survival-rate').textContent = `${survivalRate}%`;
    document.getElementById('quality-score').textContent = avgQualityScore;
    
    // Render patients table
    renderPatientsTable(patients);
}

function renderSinglePatientConditions(conditionData) {
    const container = document.getElementById('single-conditions');
    const conditions = conditionData.summary || [];
    
    if (conditions.length === 0) {
        container.innerHTML = '<p class="no-data">No conditions available</p>';
        return;
    }
    
    const html = conditions.map(condition => `
        <div class="condition-item">
            <div class="condition-name">${condition.name || 'Unknown Condition'}</div>
            <div class="condition-status">${condition.status || 'Status unknown'}</div>
            ${condition.date ? `<div class="condition-date">Since: ${formatDate(condition.date)}</div>` : ''}
        </div>
    `).join('');
    
    container.innerHTML = html;
}

function renderSinglePatientMedications(medicationData) {
    const container = document.getElementById('single-medications');
    const medications = medicationData.summary || [];
    
    if (medications.length === 0) {
        container.innerHTML = '<p class="no-data">No medications available</p>';
        return;
    }
    
    const html = medications.map(medication => `
        <div class="medication-item">
            <div class="medication-name">${medication.name || 'Unknown Medication'}</div>
            <div class="medication-dosage">${medication.value || 'Dosage not specified'}</div>
            <div class="condition-status">${medication.status || 'Active'}</div>
        </div>
    `).join('');
    
    container.innerHTML = html;
}

function renderSinglePatientObservations(observationData) {
    const container = document.getElementById('single-observations');
    const observations = observationData.summary || [];
    
    if (observations.length === 0) {
        container.innerHTML = '<p class="no-data">No observations available</p>';
        return;
    }
    
    const html = observations.map(observation => `
        <div class="observation-item">
            <div class="observation-name">${observation.name || 'Unknown Observation'}</div>
            <div class="observation-value">${observation.value || 'Value not recorded'}</div>
            ${observation.date ? `<div class="observation-date">Recorded: ${formatDate(observation.date)}</div>` : ''}
        </div>
    `).join('');
    
    container.innerHTML = html;
}

function renderPatientsTable(patients) {
    const tbody = document.getElementById('patients-table');
    
    if (patients.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" class="text-center text-muted">No patient data available</td></tr>';
        return;
    }
    
    const rows = patients.map(patient => {
        const age = patient.birthDate ? calculateAge(patient.birthDate) : 'Unknown';
        const primaryCondition = getPrimaryCondition(patient.data);
        const treatmentStatus = getTreatmentStatus(patient.data);
        const qualityIndicator = getQualityIndicator(patient.data);
        const outcome = getOutcome(patient.data);
        
        return `
            <tr>
                <td>
                    <strong>${patient.name || 'Unknown'}</strong><br>
                    <small class="text-muted">${patient.gender || 'Unknown'}</small>
                </td>
                <td>${age}</td>
                <td>${primaryCondition}</td>
                <td><span class="status-badge ${getStatusClass(treatmentStatus)}">${treatmentStatus}</span></td>
                <td>${qualityIndicator}</td>
                <td><span class="status-badge ${getOutcomeClass(outcome)}">${outcome}</span></td>
            </tr>
        `;
    }).join('');
    
    tbody.innerHTML = rows;
}

function getPrimaryCondition(patientData) {
    if (!patientData || !patientData.condition || patientData.condition.length === 0) {
        return 'No conditions recorded';
    }
    return patientData.condition[0].name || 'Unknown condition';
}

function getTreatmentStatus(patientData) {
    if (!patientData || !patientData.medicationrequest || patientData.medicationrequest.length === 0) {
        return 'No treatment';
    }
    return 'Active treatment';
}

function getQualityIndicator(patientData) {
    if (!patientData || !patientData.observation || patientData.observation.length === 0) {
        return 'No data';
    }
    
    const obs = patientData.observation[0];
    return obs.value || obs.name || 'Monitoring';
}

function getOutcome(patientData) {
    if (!patientData) return 'Unknown';
    
    const hasCondition = patientData.condition && patientData.condition.length > 0;
    const hasTreatment = patientData.medicationrequest && patientData.medicationrequest.length > 0;
    const hasMonitoring = patientData.observation && patientData.observation.length > 0;
    
    if (hasCondition && hasTreatment && hasMonitoring) {
        return 'Stable';
    } else if (hasCondition && hasTreatment) {
        return 'Improving';
    } else if (hasCondition) {
        return 'Monitoring';
    } else {
        return 'Healthy';
    }
}

function getStatusClass(status) {
    switch (status.toLowerCase()) {
        case 'active treatment': return 'status-active';
        case 'critical': return 'status-critical';
        case 'stable': return 'status-stable';
        case 'improving': return 'status-improving';
        default: return 'status-stable';
    }
}

function getOutcomeClass(outcome) {
    switch (outcome.toLowerCase()) {
        case 'healthy': return 'outcome-excellent';
        case 'stable': return 'outcome-good';
        case 'improving': return 'outcome-good';
        case 'monitoring': return 'outcome-fair';
        default: return 'outcome-fair';
    }
}

function extractQualityScore(name, value) {
    const nameStr = (name || '').toLowerCase();
    const valueStr = (value || '').toLowerCase();
    
    // Extract numeric values for quality scoring
    if (nameStr.includes('phq') || nameStr.includes('depression')) {
        const match = valueStr.match(/(\d+)/);
        return match ? parseInt(match[1]) : null;
    }
    
    if (nameStr.includes('pain')) {
        const match = valueStr.match(/(\d+)/);
        return match ? parseInt(match[1]) : null;
    }
    
    if (nameStr.includes('mmse')) {
        const match = valueStr.match(/(\d+)/);
        return match ? parseInt(match[1]) : null;
    }
    
    return null;
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

function formatDate(dateString) {
    if (!dateString) return 'Unknown date';
    
    try {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    } catch (e) {
        return 'Invalid date';
    }
}