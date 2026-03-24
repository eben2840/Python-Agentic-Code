document.addEventListener('DOMContentLoaded', function() {
    if (!window.PATIENT_DATA) {
        console.error('Patient data not available');
        return;
    }

    const data = window.PATIENT_DATA;
    
    if (data.patient && data.patient.id !== 'all') {
        console.error('This app requires all patients data');
        return;
    }

    const emergencyAlerts = [];
    let criticalCount = 0;
    let highCount = 0;
    let monitorCount = 0;

    // Process all patients for emergency assessment
    if (data.patients && Array.isArray(data.patients)) {
        data.patients.forEach(patient => {
            const alert = assessPatientEmergency(patient);
            if (alert) {
                emergencyAlerts.push(alert);
                
                switch(alert.priority) {
                    case 'critical':
                        criticalCount++;
                        break;
                    case 'high':
                        highCount++;
                        break;
                    case 'monitor':
                        monitorCount++;
                        break;
                }
            }
        });
    }

    // Update summary counts
    document.getElementById('criticalCount').textContent = criticalCount;
    document.getElementById('highCount').textContent = highCount;
    document.getElementById('monitorCount').textContent = monitorCount;

    // Render alerts
    renderEmergencyAlerts(emergencyAlerts);
});

function assessPatientEmergency(patient) {
    const patientData = patient.data || {};
    const alerts = [];

    // Check vital signs for critical values
    if (patientData.vital_signs) {
        patientData.vital_signs.forEach(vital => {
            const alert = assessVitalSigns(patient, vital);
            if (alert) alerts.push(alert);
        });
    }

    // Check observations for abnormal values
    if (patientData.observation) {
        patientData.observation.forEach(obs => {
            const alert = assessObservation(patient, obs);
            if (alert) alerts.push(alert);
        });
    }

    // Check conditions for severity
    if (patientData.condition) {
        patientData.condition.forEach(condition => {
            const alert = assessCondition(patient, condition);
            if (alert) alerts.push(alert);
        });
    }

    // Return highest priority alert for this patient
    if (alerts.length > 0) {
        return alerts.sort((a, b) => getPriorityWeight(b.priority) - getPriorityWeight(a.priority))[0];
    }

    return null;
}

function assessVitalSigns(patient, vital) {
    const name = vital.name || '';
    const value = vital.value || '';
    
    // Blood pressure assessment
    if (name.toLowerCase().includes('bp') || name.toLowerCase().includes('blood pressure')) {
        const bpMatch = value.match(/(\d+)\/(\d+)/);
        if (bpMatch) {
            const systolic = parseInt(bpMatch[1]);
            const diastolic = parseInt(bpMatch[2]);
            
            if (systolic >= 180 || diastolic >= 110) {
                return createAlert(patient, 'critical', 'Hypertensive Crisis', 
                    `Blood pressure ${value} indicates hypertensive emergency`,
                    [{ label: 'Blood Pressure', value: value, date: vital.date }],
                    'Immediate IV antihypertensive therapy required. Contact physician immediately.',
                    'Physician/ICU Team'
                );
            } else if (systolic >= 160 || diastolic >= 100) {
                return createAlert(patient, 'high', 'Severe Hypertension',
                    `Elevated blood pressure ${value} requires urgent management`,
                    [{ label: 'Blood Pressure', value: value, date: vital.date }],
                    'Administer prescribed antihypertensive. Recheck in 30 minutes.',
                    'Nursing Staff'
                );
            }
        }
    }

    // Temperature assessment
    if (name.toLowerCase().includes('temp')) {
        const tempMatch = value.match(/([\d.]+)/);
        if (tempMatch) {
            const temp = parseFloat(tempMatch[1]);
            if (temp >= 39.5) {
                return createAlert(patient, 'high', 'High Fever',
                    `Temperature ${value} indicates severe hyperthermia`,
                    [{ label: 'Temperature', value: value, date: vital.date }],
                    'Administer antipyretics, cooling measures. Blood cultures if indicated.',
                    'Nursing Staff'
                );
            }
        }
    }

    return null;
}

function assessObservation(patient, obs) {
    const name = obs.name || '';
    const value = obs.value || '';

    // Pain assessment
    if (name.toLowerCase().includes('pain')) {
        const painMatch = value.match(/(\d+)/);
        if (painMatch) {
            const painScore = parseInt(painMatch[1]);
            if (painScore >= 8) {
                return createAlert(patient, 'high', 'Severe Pain',
                    `Pain score ${painScore}/10 requires immediate intervention`,
                    [{ label: 'Pain Score', value: value, date: obs.date }],
                    'Administer prescribed analgesics. Reassess in 30 minutes.',
                    'Nursing Staff'
                );
            }
        }
    }

    // Glucose assessment
    if (name.toLowerCase().includes('glucose')) {
        const glucoseMatch = value.match(/([\d.]+)/);
        if (glucoseMatch) {
            const glucose = parseFloat(glucoseMatch[1]);
            if (glucose >= 15.0) {
                return createAlert(patient, 'critical', 'Severe Hyperglycemia',
                    `Glucose ${value} mmol/L indicates diabetic emergency`,
                    [{ label: 'Blood Glucose', value: value, date: obs.date }],
                    'Check ketones, start insulin protocol. Contact endocrinologist.',
                    'Physician'
                );
            }
        }
    }

    // eGFR assessment
    if (name.toLowerCase().includes('egfr')) {
        const egfrMatch = value.match(/(\d+)/);
        if (egfrMatch) {
            const egfr = parseInt(egfrMatch[1]);
            if (egfr <= 15) {
                return createAlert(patient, 'high', 'Severe Renal Impairment',
                    `eGFR ${value} indicates end-stage renal disease`,
                    [{ label: 'eGFR', value: value, date: obs.date }],
                    'Review medications for renal dosing. Consider nephrology consult.',
                    'Physician'
                );
            }
        }
    }

    return null;
}

function assessCondition(patient, condition) {
    const name = condition.name || '';
    
    // High-risk conditions requiring monitoring
    const criticalConditions = ['sepsis', 'chest pain', 'stroke'];
    const highRiskConditions = ['copd', 'heart failure', 'pneumonia'];
    
    if (criticalConditions.some(c => name.toLowerCase().includes(c))) {
        return createAlert(patient, 'critical', 'High-Risk Condition',
            `Active ${name} requires intensive monitoring`,
            [{ label: 'Condition', value: name, date: condition.date }],
            'Continuous monitoring, frequent vital signs, early warning score assessment.',
            'ICU Team'
        );
    }
    
    if (highRiskConditions.some(c => name.toLowerCase().includes(c))) {
        return createAlert(patient, 'monitor', 'Condition Monitoring',
            `${name} requires regular assessment for deterioration`,
            [{ label: 'Condition', value: name, date: condition.date }],
            'Monitor respiratory status, oxygen saturation. Review treatment response.',
            'Nursing Staff'
        );
    }

    return null;
}

function createAlert(patient, priority, concern, description, observations, action, assignee) {
    return {
        patient: patient,
        priority: priority,
        concern: concern,
        description: description,
        observations: observations,
        action: action,
        assignee: assignee
    };
}

function getPriorityWeight(priority) {
    switch(priority) {
        case 'critical': return 3;
        case 'high': return 2;
        case 'monitor': return 1;
        default: return 0;
    }
}

function renderEmergencyAlerts(alerts) {
    const container = document.getElementById('emergencyAlerts');
    const noAlertsMessage = document.getElementById('noAlertsMessage');
    
    if (alerts.length === 0) {
        container.innerHTML = '';
        noAlertsMessage.style.display = 'block';
        return;
    }

    noAlertsMessage.style.display = 'none';
    
    // Sort by priority
    alerts.sort((a, b) => getPriorityWeight(b.priority) - getPriorityWeight(a.priority));
    
    container.innerHTML = alerts.map(alert => `
        <div class="emergency-card ${alert.priority}">
            <div class="emergency-header">
                <div class="d-flex justify-content-between align-items-start">
                    <span class="priority-badge ${alert.priority}">
                        <i class="fas ${getPriorityIcon(alert.priority)} me-1"></i>
                        ${alert.priority.toUpperCase()}
                    </span>
                    <div class="time-indicator">
                        <i class="fas fa-clock"></i>
                        <span>Next 24-72h</span>
                    </div>
                </div>
                
                <div class="patient-info">
                    <div class="patient-avatar">
                        <i class="fas fa-user"></i>
                    </div>
                    <div class="patient-details">
                        <h3>${alert.patient.name || 'Unknown Patient'}</h3>
                        <div class="patient-meta">
                            <span><i class="fas fa-bed me-1"></i>Bed: Not specified</span>
                            <span class="ms-3"><i class="fas fa-hospital me-1"></i>Ward: Not specified</span>
                        </div>
                    </div>
                </div>
            </div>
            
            <div class="emergency-content">
                <div class="concern-section">
                    <h4>
                        <i class="fas fa-exclamation-triangle text-warning"></i>
                        Concern
                    </h4>
                    <div class="concern-text">
                        <strong>${alert.concern}</strong><br>
                        ${alert.description}
                    </div>
                </div>
                
                <div class="concern-section">
                    <h4>
                        <i class="fas fa-chart-line text-info"></i>
                        Observations
                    </h4>
                    <div class="observations-grid">
                        ${alert.observations.map(obs => `
                            <div class="observation-item">
                                <div class="observation-label">${obs.label}</div>
                                <div class="observation-value">${obs.value}</div>
                                ${obs.date ? `<div class="observation-date">${formatDate(obs.date)}</div>` : ''}
                            </div>
                        `).join('')}
                    </div>
                </div>
                
                <div class="concern-section">
                    <h4>
                        <i class="fas fa-tasks text-success"></i>
                        Action Required
                    </h4>
                    <div class="action-required">
                        <div class="action-text">${alert.action}</div>
                        <div class="action-assignee">Assigned to: ${alert.assignee}</div>
                    </div>
                </div>
            </div>
        </div>
    `).join('');
}

function getPriorityIcon(priority) {
    switch(priority) {
        case 'critical': return 'fa-exclamation-circle';
        case 'high': return 'fa-exclamation-triangle';
        case 'monitor': return 'fa-eye';
        default: return 'fa-info-circle';
    }
}

function formatDate(dateString) {
    if (!dateString) return 'No date';
    
    try {
        const date = new Date(dateString);
        return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
    } catch (e) {
        return dateString;
    }
}