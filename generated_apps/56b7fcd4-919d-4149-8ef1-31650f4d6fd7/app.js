document.addEventListener('DOMContentLoaded', function() {
    if (!window.PATIENT_DATA) {
        showError('No patient data available');
        return;
    }

    const data = window.PATIENT_DATA;
    
    if (data.patient && data.patient.id !== 'all') {
        showError('This app requires all patients data');
        return;
    }

    if (!data.patients || !Array.isArray(data.patients)) {
        showError('No patients data available');
        return;
    }

    assessEmergencies();
});

function assessEmergencies() {
    const data = window.PATIENT_DATA;
    const emergencies = [];

    data.patients.forEach(patient => {
        if (!patient.data) return;

        const emergency = assessPatientRisk(patient);
        if (emergency) {
            emergencies.push(emergency);
        }
    });

    // Sort by priority: Critical > High > Monitor
    emergencies.sort((a, b) => {
        const priorityOrder = { 'critical': 0, 'high': 1, 'monitor': 2 };
        return priorityOrder[a.priority] - priorityOrder[b.priority];
    });

    displayEmergencies(emergencies);
}

function assessPatientRisk(patient) {
    const risks = [];
    
    // Check vital signs for critical values
    if (patient.data.vital_signs) {
        patient.data.vital_signs.forEach(vital => {
            const risk = assessVitalRisk(vital, patient);
            if (risk) risks.push(risk);
        });
    }

    // Check observations for abnormal values
    if (patient.data.observation) {
        patient.data.observation.forEach(obs => {
            const risk = assessObservationRisk(obs, patient);
            if (risk) risks.push(risk);
        });
    }

    // Check conditions for high-risk diagnoses
    if (patient.data.condition) {
        patient.data.condition.forEach(condition => {
            const risk = assessConditionRisk(condition, patient);
            if (risk) risks.push(risk);
        });
    }

    // Return highest priority risk
    if (risks.length === 0) return null;
    
    risks.sort((a, b) => {
        const priorityOrder = { 'critical': 0, 'high': 1, 'monitor': 2 };
        return priorityOrder[a.priority] - priorityOrder[b.priority];
    });

    return {
        patient: patient,
        priority: risks[0].priority,
        concern: risks[0].concern,
        observations: getRelevantObservations(patient),
        action: risks[0].action,
        assignee: risks[0].assignee
    };
}

function assessVitalRisk(vital, patient) {
    const name = vital.name || '';
    const value = vital.value || '';
    
    // Blood pressure assessment
    if (name.toLowerCase().includes('bp') || name.toLowerCase().includes('blood pressure')) {
        if (value.includes('140/90') || value.includes('160/') || value.includes('/100')) {
            return {
                priority: 'high',
                concern: 'Hypertensive crisis risk - BP trending dangerously high',
                action: 'Immediate BP recheck, consider antihypertensive medication review',
                assignee: 'Attending physician'
            };
        }
    }

    // Temperature assessment
    if (name.toLowerCase().includes('temp')) {
        if (value.includes('39.2') || parseFloat(value) > 39) {
            return {
                priority: 'critical',
                concern: 'Severe hyperthermia - sepsis protocol indicated',
                action: 'Blood cultures, IV antibiotics, sepsis bundle within 1 hour',
                assignee: 'ICU team'
            };
        }
    }

    // Pain assessment
    if (name.toLowerCase().includes('pain')) {
        if (value.includes('8/10') || value.includes('9/10') || value.includes('10/10')) {
            return {
                priority: 'high',
                concern: 'Severe uncontrolled pain - risk of complications',
                action: 'Pain reassessment, analgesic review, consider specialist consult',
                assignee: 'Pain management team'
            };
        }
    }

    return null;
}

function assessObservationRisk(obs, patient) {
    const name = obs.name || '';
    const value = obs.value || '';
    
    // Cardiac markers
    if (name.toLowerCase().includes('ecg') && value.toLowerCase().includes('abnormal')) {
        return {
            priority: 'critical',
            concern: 'Abnormal ECG - acute cardiac event possible',
            action: 'Cardiology consult, serial troponins, continuous monitoring',
            assignee: 'Cardiology team'
        };
    }

    // Kidney function
    if (name.toLowerCase().includes('egfr') && value.includes('22')) {
        return {
            priority: 'high',
            concern: 'Severe renal impairment - dialysis consideration',
            action: 'Nephrology urgent consult, fluid balance monitoring',
            assignee: 'Nephrology team'
        };
    }

    // Respiratory function
    if (name.toLowerCase().includes('fev1') && value.includes('45%')) {
        return {
            priority: 'monitor',
            concern: 'Moderate COPD exacerbation risk',
            action: 'Respiratory assessment, bronchodilator optimization',
            assignee: 'Respiratory therapist'
        };
    }

    // Hemoglobin
    if (name.toLowerCase().includes('hb') && value.includes('8.2')) {
        return {
            priority: 'high',
            concern: 'Severe anemia - transfusion consideration',
            action: 'Type and crossmatch, hematology consult if bleeding source unclear',
            assignee: 'Hematology team'
        };
    }

    return null;
}

function assessConditionRisk(condition, patient) {
    const name = condition.name || '';
    
    // High-risk conditions
    if (name.toLowerCase().includes('sepsis')) {
        return {
            priority: 'critical',
            concern: 'Active sepsis - organ failure risk',
            action: 'Hourly vitals, lactate monitoring, ICU consideration',
            assignee: 'ICU team'
        };
    }

    if (name.toLowerCase().includes('breast cancer')) {
        return {
            priority: 'monitor',
            concern: 'Oncology patient - treatment complications monitoring',
            action: 'Monitor for chemotherapy side effects, infection screening',
            assignee: 'Oncology team'
        };
    }

    if (name.toLowerCase().includes('fractured femur')) {
        return {
            priority: 'high',
            concern: 'Post-surgical complications - DVT/PE risk',
            action: 'DVT prophylaxis, mobility assessment, pain management',
            assignee: 'Orthopedic team'
        };
    }

    return null;
}

function getRelevantObservations(patient) {
    const observations = [];
    
    if (patient.data.vital_signs) {
        patient.data.vital_signs.forEach(vital => {
            observations.push({
                label: vital.name || 'Vital Sign',
                value: vital.value || 'No data',
                date: vital.date || 'Unknown'
            });
        });
    }

    if (patient.data.observation) {
        patient.data.observation.forEach(obs => {
            observations.push({
                label: obs.name || 'Observation',
                value: obs.value || 'No data',
                date: obs.date || 'Unknown'
            });
        });
    }

    return observations;
}

function displayEmergencies(emergencies) {
    const summaryEl = document.getElementById('summary-text');
    const alertsContainer = document.getElementById('emergency-alerts');
    const noEmergenciesEl = document.getElementById('no-emergencies');

    if (emergencies.length === 0) {
        summaryEl.innerHTML = '<i class="fas fa-check-circle text-success me-2"></i>No active clinical emergencies identified';
        noEmergenciesEl.style.display = 'block';
        return;
    }

    const criticalCount = emergencies.filter(e => e.priority === 'critical').length;
    const highCount = emergencies.filter(e => e.priority === 'high').length;
    const monitorCount = emergencies.filter(e => e.priority === 'monitor').length;

    summaryEl.innerHTML = `
        <i class="fas fa-exclamation-triangle text-warning me-2"></i>
        ${emergencies.length} patients require attention: 
        ${criticalCount > 0 ? `<span class="text-danger fw-bold">${criticalCount} Critical</span>` : ''}
        ${criticalCount > 0 && (highCount > 0 || monitorCount > 0) ? ', ' : ''}
        ${highCount > 0 ? `<span class="text-warning fw-bold">${highCount} High</span>` : ''}
        ${highCount > 0 && monitorCount > 0 ? ', ' : ''}
        ${monitorCount > 0 ? `<span class="text-info fw-bold">${monitorCount} Monitor</span>` : ''}
    `;

    emergencies.forEach(emergency => {
        const card = createEmergencyCard(emergency);
        alertsContainer.appendChild(card);
    });
}

function createEmergencyCard(emergency) {
    const col = document.createElement('div');
    col.className = 'col-12';
    
    const patient = emergency.patient;
    const initials = patient.name ? patient.name.split(' ').map(n => n[0]).join('') : 'UK';
    
    // Get location info if available
    let locationInfo = 'Location not specified';
    if (patient.data && patient.data.locations && patient.data.locations.length > 0) {
        const location = patient.data.locations[0];
        locationInfo = `${location.name || 'Room'} - ${location.value || 'Ward'}`;
    }

    col.innerHTML = `
        <div class="emergency-card ${emergency.priority}">
            <div class="emergency-header">
                <div class="d-flex justify-content-between align-items-start">
                    <div class="patient-info">
                        <div class="patient-avatar">${initials}</div>
                        <div class="patient-details">
                            <h3>${patient.name || 'Unknown Patient'}</h3>
                            <div class="location-info">
                                <i class="fas fa-map-marker-alt me-1"></i>
                                ${locationInfo}
                            </div>
                        </div>
                    </div>
                    <span class="badge priority-badge ${getPriorityClass(emergency.priority)}">
                        ${emergency.priority.toUpperCase()}
                    </span>
                </div>
            </div>
            
            <div class="emergency-body">
                <div class="concern-section">
                    <h4><i class="fas fa-exclamation-circle me-2"></i>Concern</h4>
                    <div class="concern-content">
                        ${emergency.concern}
                    </div>
                </div>

                <div class="concern-section">
                    <h4><i class="fas fa-chart-line me-2"></i>Latest Observations</h4>
                    <div class="observations-grid">
                        ${emergency.observations.map(obs => `
                            <div class="observation-item">
                                <div class="observation-value">${obs.value}</div>
                                <div class="observation-label">${obs.label}</div>
                            </div>
                        `).join('')}
                    </div>
                </div>

                <div class="concern-section">
                    <h4><i class="fas fa-tasks me-2"></i>Action Required</h4>
                    <div class="action-required ${emergency.priority}">
                        <div class="action-text">${emergency.action}</div>
                        <div class="action-assignee">
                            <i class="fas fa-user-md me-1"></i>
                            Assigned to: ${emergency.assignee}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;

    return col;
}

function getPriorityClass(priority) {
    switch (priority) {
        case 'critical': return 'bg-danger';
        case 'high': return 'bg-warning';
        case 'monitor': return 'bg-info';
        default: return 'bg-secondary';
    }
}

function showError(message) {
    const container = document.querySelector('.container-fluid');
    container.innerHTML = `
        <div class="row justify-content-center">
            <div class="col-md-6">
                <div class="no-data-card">
                    <div class="text-center">
                        <i class="fas fa-exclamation-triangle text-warning mb-3" style="font-size: 3rem;"></i>
                        <h3>Unable to Load Data</h3>
                        <p class="text-muted">${message}</p>
                    </div>
                </div>
            </div>
        </div>
    `;
}