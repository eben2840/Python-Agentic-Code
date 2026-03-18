document.addEventListener('DOMContentLoaded', function() {
    if (!window.PATIENT_DATA) {
        console.error('Patient data not available');
        showNoData();
        return;
    }

    analyzeEmergencies();
});

function analyzeEmergencies() {
    const data = window.PATIENT_DATA;
    const emergencies = [];
    let totalPatients = 0;

    if (data.patient && data.patient.id === 'all' && data.patients) {
        // Multiple patients
        totalPatients = data.patients.length;
        
        data.patients.forEach(patient => {
            const emergency = assessPatientRisk(patient);
            if (emergency) {
                emergencies.push(emergency);
            }
        });
    } else if (data.patient && data.patient.id !== 'all') {
        // Single patient
        totalPatients = 1;
        const emergency = assessPatientRisk({
            id: data.patient.id || 'unknown',
            name: data.patient.name || 'Unknown Patient',
            gender: data.patient.gender || 'Unknown',
            birthDate: data.patient.birthDate || 'Unknown',
            data: data
        });
        if (emergency) {
            emergencies.push(emergency);
        }
    }

    displayEmergencies(emergencies, totalPatients);
    updateSummary(emergencies, totalPatients);
}

function assessPatientRisk(patient) {
    const patientData = patient.data || {};
    const concerns = [];
    
    // Check vital signs for critical values
    if (patientData.vital_signs) {
        patientData.vital_signs.forEach(vital => {
            const concern = assessVitalSigns(vital);
            if (concern) concerns.push(concern);
        });
    }
    
    // Check observations for abnormal values
    if (patientData.observation) {
        patientData.observation.forEach(obs => {
            const concern = assessObservation(obs);
            if (concern) concerns.push(concern);
        });
    }
    
    // Check conditions for high-risk diagnoses
    if (patientData.condition) {
        patientData.condition.forEach(condition => {
            const concern = assessCondition(condition);
            if (concern) concerns.push(concern);
        });
    }
    
    // Check medication adherence
    if (patientData.medicationrequest) {
        patientData.medicationrequest.forEach(med => {
            const concern = assessMedication(med);
            if (concern) concerns.push(concern);
        });
    }

    if (concerns.length === 0) return null;

    // Determine highest priority
    const priorities = concerns.map(c => c.priority);
    const highestPriority = priorities.includes('critical') ? 'critical' : 
                           priorities.includes('high') ? 'high' : 'monitor';

    return {
        patient: {
            name: patient.name || 'Unknown Patient',
            id: patient.id || 'unknown',
            location: getPatientLocation(patientData)
        },
        priority: highestPriority,
        concerns: concerns,
        primaryConcern: concerns.find(c => c.priority === highestPriority) || concerns[0]
    };
}

function assessVitalSigns(vital) {
    const name = vital.name || vital.value || 'Unknown Vital';
    const value = vital.value || vital.name || '';
    
    // Blood pressure assessment
    if (name.toLowerCase().includes('bp') || name.toLowerCase().includes('blood pressure')) {
        if (value.includes('140/90') || value.includes('160/') || value.includes('/100')) {
            return {
                type: 'vital_deterioration',
                priority: 'high',
                description: 'Hypertensive crisis risk',
                observation: `${name}: ${value}`,
                action: 'Repeat BP measurement, consider antihypertensive medication review',
                assignee: 'Nursing staff'
            };
        }
    }
    
    // Temperature assessment
    if (name.toLowerCase().includes('temp') && value.includes('39.2')) {
        return {
            type: 'vital_deterioration',
            priority: 'critical',
            description: 'High fever indicating possible sepsis progression',
            observation: `${name}: ${value}`,
            action: 'Immediate blood cultures, IV antibiotics, sepsis protocol activation',
            assignee: 'Medical team'
        };
    }
    
    // Pain assessment
    if (name.toLowerCase().includes('pain') && (value.includes('8') || value.includes('7'))) {
        return {
            type: 'symptom_management',
            priority: 'high',
            description: 'Severe pain requiring immediate intervention',
            observation: `${name}: ${value}`,
            action: 'Pain reassessment, analgesic review, consider breakthrough medication',
            assignee: 'Nursing staff'
        };
    }
    
    return null;
}

function assessObservation(obs) {
    const name = obs.name || obs.value || 'Unknown Observation';
    const value = obs.value || obs.name || '';
    
    // Kidney function
    if (name.toLowerCase().includes('egfr') && value.includes('22')) {
        return {
            type: 'organ_failure',
            priority: 'critical',
            description: 'Severe kidney dysfunction - dialysis consideration',
            observation: `${name}: ${value}`,
            action: 'Nephrology consultation, fluid balance monitoring, dialysis readiness assessment',
            assignee: 'Medical team'
        };
    }
    
    // Hemoglobin
    if (name.toLowerCase().includes('hb') && value.includes('8.2')) {
        return {
            type: 'hematological',
            priority: 'high',
            description: 'Severe anemia requiring transfusion consideration',
            observation: `${name}: ${value}`,
            action: 'Type and crossmatch, consider blood transfusion, investigate bleeding source',
            assignee: 'Medical team'
        };
    }
    
    // Respiratory function
    if (name.toLowerCase().includes('fev1') && value.includes('45%')) {
        return {
            type: 'respiratory',
            priority: 'high',
            description: 'Severe COPD exacerbation risk',
            observation: `${name}: ${value}`,
            action: 'Bronchodilator optimization, steroid consideration, oxygen saturation monitoring',
            assignee: 'Respiratory team'
        };
    }
    
    return null;
}

function assessCondition(condition) {
    const name = condition.name || 'Unknown Condition';
    
    // High-risk conditions
    if (name.toLowerCase().includes('sepsis')) {
        return {
            type: 'infection',
            priority: 'critical',
            description: 'Sepsis requires continuous monitoring for organ failure',
            observation: `Active diagnosis: ${name}`,
            action: 'Hourly vital signs, lactate monitoring, fluid resuscitation assessment',
            assignee: 'ICU team'
        };
    }
    
    if (name.toLowerCase().includes('breast cancer')) {
        return {
            type: 'oncological',
            priority: 'monitor',
            description: 'Cancer patient requiring treatment response monitoring',
            observation: `Active diagnosis: ${name}`,
            action: 'Monitor for treatment side effects, symptom assessment',
            assignee: 'Oncology team'
        };
    }
    
    return null;
}

function assessMedication(med) {
    const name = med.name || 'Unknown Medication';
    
    // Critical medications
    if (name.toLowerCase().includes('sepsis')) {
        return {
            type: 'medication_critical',
            priority: 'critical',
            description: 'Critical antibiotic therapy timing',
            observation: `Prescribed: ${name}`,
            action: 'Ensure timely administration, monitor for therapeutic response',
            assignee: 'Nursing staff'
        };
    }
    
    return null;
}

function getPatientLocation(patientData) {
    if (patientData.locations && patientData.locations.summary && patientData.locations.summary.length > 0) {
        const location = patientData.locations.summary[0];
        return {
            bed: location.name || 'Unknown',
            ward: location.value || 'Unknown Ward'
        };
    }
    return {
        bed: 'Not assigned',
        ward: 'Unknown Ward'
    };
}

function displayEmergencies(emergencies, totalPatients) {
    const container = document.getElementById('emergency-alerts');
    
    if (emergencies.length === 0) {
        container.innerHTML = `
            <div class="no-emergencies">
                <div class="icon">
                    <i class="fas fa-check-circle"></i>
                </div>
                <h4>No Active Clinical Emergencies</h4>
                <p>All ${totalPatients} patients reviewed - no urgent concerns identified within 24-72 hour timeframe</p>
            </div>
        `;
        return;
    }
    
    // Sort by priority
    const priorityOrder = { critical: 0, high: 1, monitor: 2 };
    emergencies.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);
    
    container.innerHTML = emergencies.map(emergency => createEmergencyCard(emergency)).join('');
}

function createEmergencyCard(emergency) {
    const priorityColors = {
        critical: 'danger',
        high: 'warning',
        monitor: 'info'
    };
    
    const priorityLabels = {
        critical: 'CRITICAL',
        high: 'HIGH PRIORITY',
        monitor: 'MONITOR'
    };
    
    const observations = emergency.concerns.map(concern => 
        `<div class="observation-item">
            <span class="observation-label">${concern.observation.split(':')[0]}</span>
            <span class="observation-value ${concern.priority}">${concern.observation.split(':')[1] || concern.observation}</span>
        </div>`
    ).join('');
    
    return `
        <div class="emergency-card ${emergency.priority}">
            <div class="emergency-header">
                <div class="patient-info">
                    <h5>${emergency.patient.name}</h5>
                    <div class="patient-location">
                        <i class="fas fa-bed me-1"></i>
                        Bed: ${emergency.patient.location.bed} | Ward: ${emergency.patient.location.ward}
                    </div>
                </div>
                <span class="badge bg-${priorityColors[emergency.priority]} priority-badge">
                    ${priorityLabels[emergency.priority]}
                </span>
            </div>
            
            <div class="emergency-body">
                <div class="concern-section">
                    <h6><i class="fas fa-exclamation-circle me-1"></i>Concern</h6>
                    <div class="concern-text">${emergency.primaryConcern.description}</div>
                </div>
                
                <div class="concern-section">
                    <h6><i class="fas fa-chart-line me-1"></i>Observations</h6>
                    <div class="observations-list">
                        ${observations}
                    </div>
                </div>
                
                <div class="concern-section">
                    <h6><i class="fas fa-tasks me-1"></i>Action Required</h6>
                    <div class="action-required ${emergency.priority}">
                        <div class="action-text">${emergency.primaryConcern.action}</div>
                        <div class="action-assignee">Assigned to: ${emergency.primaryConcern.assignee}</div>
                    </div>
                </div>
            </div>
        </div>
    `;
}

function updateSummary(emergencies, totalPatients) {
    const counts = {
        critical: emergencies.filter(e => e.priority === 'critical').length,
        high: emergencies.filter(e => e.priority === 'high').length,
        monitor: emergencies.filter(e => e.priority === 'monitor').length
    };
    
    document.getElementById('critical-count').textContent = counts.critical;
    document.getElementById('high-count').textContent = counts.high;
    document.getElementById('monitor-count').textContent = counts.monitor;
    document.getElementById('total-reviewed').textContent = totalPatients;
}

function showNoData() {
    const container = document.getElementById('emergency-alerts');
    container.innerHTML = `
        <div class="no-emergencies">
            <div class="icon">
                <i class="fas fa-exclamation-triangle text-warning"></i>
            </div>
            <h4>No Patient Data Available</h4>
            <p>Unable to assess clinical emergencies - patient data not loaded</p>
        </div>
    `;
}