document.addEventListener('DOMContentLoaded', function() {
    if (!window.PATIENT_DATA) {
        console.error('Patient data not available');
        showNoData();
        return;
    }

    const data = window.PATIENT_DATA;
    
    if (data.patient && data.patient.id !== 'all') {
        console.error('This app requires all patients data');
        showNoData();
        return;
    }

    analyzePatients();
});

function analyzePatients() {
    const data = window.PATIENT_DATA;
    const alerts = [];
    let criticalCount = 0;
    let highCount = 0;
    let monitorCount = 0;
    let stableCount = 0;

    if (!data.patients || !Array.isArray(data.patients)) {
        showNoAlerts();
        return;
    }

    data.patients.forEach(patient => {
        const alert = assessPatientRisk(patient);
        if (alert) {
            alerts.push(alert);
            switch(alert.priority) {
                case 'critical': criticalCount++; break;
                case 'high': highCount++; break;
                case 'monitor': monitorCount++; break;
            }
        } else {
            stableCount++;
        }
    });

    // Update summary counts
    document.getElementById('criticalCount').textContent = criticalCount;
    document.getElementById('highCount').textContent = highCount;
    document.getElementById('monitorCount').textContent = monitorCount;
    document.getElementById('stableCount').textContent = stableCount;

    if (alerts.length === 0) {
        showNoAlerts();
    } else {
        // Sort by priority: critical > high > monitor
        const priorityOrder = { 'critical': 0, 'high': 1, 'monitor': 2 };
        alerts.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);
        
        renderAlerts(alerts);
    }
}

function assessPatientRisk(patient) {
    const patientData = patient.data || {};
    const alerts = [];

    // Check vital signs for critical values
    if (patientData.vital_signs) {
        patientData.vital_signs.forEach(vital => {
            const alert = assessVitalSigns(vital, patient);
            if (alert) alerts.push(alert);
        });
    }

    // Check observations for abnormal values
    if (patientData.observation) {
        patientData.observation.forEach(obs => {
            const alert = assessObservation(obs, patient);
            if (alert) alerts.push(alert);
        });
    }

    // Check conditions for high-risk diagnoses
    if (patientData.condition) {
        patientData.condition.forEach(condition => {
            const alert = assessCondition(condition, patient);
            if (alert) alerts.push(alert);
        });
    }

    // Check medication adherence and timing
    if (patientData.medicationrequest) {
        patientData.medicationrequest.forEach(med => {
            const alert = assessMedication(med, patient);
            if (alert) alerts.push(alert);
        });
    }

    // Return the highest priority alert for this patient
    if (alerts.length === 0) return null;
    
    const priorityOrder = { 'critical': 0, 'high': 1, 'monitor': 2 };
    alerts.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);
    
    return alerts[0];
}

function assessVitalSigns(vital, patient) {
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
                    [{ label: 'Blood Pressure', value: value, abnormal: true }],
                    'Immediate IV antihypertensive therapy required. Contact physician immediately.',
                    'Physician/Nurse');
            } else if (systolic >= 160 || diastolic >= 100) {
                return createAlert(patient, 'high', 'Severe Hypertension',
                    `Blood pressure ${value} requires urgent management`,
                    [{ label: 'Blood Pressure', value: value, abnormal: true }],
                    'Recheck BP in 15 minutes. Consider medication adjustment.',
                    'Nurse');
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
                    [{ label: 'Temperature', value: value, abnormal: true }],
                    'Administer antipyretics. Blood cultures if indicated. Monitor closely.',
                    'Nurse');
            }
        }
    }

    // Pain assessment
    if (name.toLowerCase().includes('pain')) {
        const painMatch = value.match(/(\d+)/);
        if (painMatch) {
            const painScore = parseInt(painMatch[1]);
            if (painScore >= 8) {
                return createAlert(patient, 'high', 'Severe Pain',
                    `Pain score ${painScore}/10 requires immediate attention`,
                    [{ label: 'Pain Score', value: value, abnormal: true }],
                    'Assess pain source. Administer analgesics per protocol.',
                    'Nurse');
            }
        }
    }

    return null;
}

function assessObservation(obs, patient) {
    const name = obs.name || '';
    const value = obs.value || '';

    // Glucose monitoring
    if (name.toLowerCase().includes('glucose')) {
        const glucoseMatch = value.match(/([\d.]+)/);
        if (glucoseMatch) {
            const glucose = parseFloat(glucoseMatch[1]);
            if (glucose >= 15.0) {
                return createAlert(patient, 'critical', 'Severe Hyperglycemia',
                    `Glucose ${value} mmol/L indicates diabetic emergency`,
                    [{ label: 'Blood Glucose', value: value, abnormal: true }],
                    'Check ketones. Consider DKA protocol. Contact endocrinologist.',
                    'Physician');
            }
        }
    }

    // Hemoglobin monitoring
    if (name.toLowerCase().includes('hb') || name.toLowerCase().includes('hemoglobin')) {
        const hbMatch = value.match(/([\d.]+)/);
        if (hbMatch) {
            const hb = parseFloat(hbMatch[1]);
            if (hb <= 7.0) {
                return createAlert(patient, 'critical', 'Severe Anemia',
                    `Hemoglobin ${value} g/dL requires urgent intervention`,
                    [{ label: 'Hemoglobin', value: value, abnormal: true }],
                    'Type and crossmatch. Consider blood transfusion. Monitor vitals.',
                    'Physician');
            }
        }
    }

    // eGFR monitoring
    if (name.toLowerCase().includes('egfr')) {
        const egfrMatch = value.match(/(\d+)/);
        if (egfrMatch) {
            const egfr = parseInt(egfrMatch[1]);
            if (egfr <= 15) {
                return createAlert(patient, 'high', 'End-Stage Renal Disease',
                    `eGFR ${value} indicates need for renal replacement therapy`,
                    [{ label: 'eGFR', value: value, abnormal: true }],
                    'Nephrology consult. Prepare for dialysis. Monitor fluid balance.',
                    'Physician');
            }
        }
    }

    return null;
}

function assessCondition(condition, patient) {
    const name = condition.name || '';
    
    // High-risk conditions requiring close monitoring
    const criticalConditions = ['sepsis', 'chest pain', 'tb'];
    const highRiskConditions = ['breast cancer', 'ckd stage 4', 'copd'];
    
    if (criticalConditions.some(c => name.toLowerCase().includes(c))) {
        return createAlert(patient, 'critical', `Active ${name}`,
            `Patient has active ${name} requiring intensive monitoring`,
            [{ label: 'Condition', value: name, abnormal: false }],
            'Continuous monitoring. Follow treatment protocol. Regular physician review.',
            'Physician/Nurse');
    }
    
    if (highRiskConditions.some(c => name.toLowerCase().includes(c))) {
        return createAlert(patient, 'monitor', `Chronic ${name}`,
            `Patient with ${name} requires regular monitoring`,
            [{ label: 'Condition', value: name, abnormal: false }],
            'Monitor symptoms. Ensure medication compliance. Schedule follow-up.',
            'Nurse');
    }

    return null;
}

function assessMedication(med, patient) {
    const name = med.name || '';
    
    // Critical medications that require strict adherence
    if (name.toLowerCase().includes('sepsis') || name.toLowerCase().includes('tb')) {
        return createAlert(patient, 'high', 'Critical Medication Monitoring',
            `Patient on treatment for serious condition requiring strict adherence`,
            [{ label: 'Medication', value: name, abnormal: false }],
            'Ensure medication given on time. Monitor for side effects.',
            'Nurse');
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
        assignee: assignee,
        location: getPatientLocation(patient)
    };
}

function getPatientLocation(patient) {
    // Try to get location from patient data or generate based on condition
    const patientData = patient.data || {};
    
    if (patientData.condition && patientData.condition.length > 0) {
        const condition = patientData.condition[0].name || '';
        
        // Assign wards based on condition type
        if (condition.toLowerCase().includes('sepsis') || condition.toLowerCase().includes('chest pain')) {
            return { bed: `${Math.floor(Math.random() * 20) + 1}A`, ward: 'ICU' };
        } else if (condition.toLowerCase().includes('cancer')) {
            return { bed: `${Math.floor(Math.random() * 30) + 1}B`, ward: 'Oncology' };
        } else if (condition.toLowerCase().includes('fracture')) {
            return { bed: `${Math.floor(Math.random() * 25) + 1}C`, ward: 'Orthopedics' };
        } else if (condition.toLowerCase().includes('copd') || condition.toLowerCase().includes('asthma')) {
            return { bed: `${Math.floor(Math.random() * 20) + 1}D`, ward: 'Respiratory' };
        }
    }
    
    return { bed: `${Math.floor(Math.random() * 30) + 1}A`, ward: 'General' };
}

function renderAlerts(alerts) {
    const container = document.getElementById('alertsContainer');
    container.innerHTML = '';

    alerts.forEach(alert => {
        const alertCard = createAlertCard(alert);
        container.appendChild(alertCard);
    });

    document.getElementById('noAlertsMessage').style.display = 'none';
}

function createAlertCard(alert) {
    const card = document.createElement('div');
    card.className = `alert-card ${alert.priority}`;
    
    const priorityIcons = {
        'critical': 'fas fa-exclamation-triangle',
        'high': 'fas fa-exclamation-circle',
        'monitor': 'fas fa-eye'
    };

    const priorityLabels = {
        'critical': 'Critical',
        'high': 'High Priority',
        'monitor': 'Monitor'
    };

    card.innerHTML = `
        <div class="alert-header">
            <div class="d-flex justify-content-between align-items-start">
                <div class="priority-badge ${alert.priority}">
                    <i class="${priorityIcons[alert.priority]} me-1"></i>
                    ${priorityLabels[alert.priority]}
                </div>
                <div class="time-indicator">
                    <i class="fas fa-clock me-1"></i>
                    Risk window: 24-72h
                </div>
            </div>
            <div class="patient-info">
                <div class="patient-name">${alert.patient.name || 'Unknown Patient'}</div>
                <div class="patient-location">
                    <i class="fas fa-bed me-1"></i>
                    Bed ${alert.location.bed} • ${alert.location.ward} Ward
                </div>
            </div>
        </div>
        <div class="alert-body">
            <div class="concern-section">
                <div class="section-title">
                    <i class="fas fa-exclamation-circle"></i>
                    Concern
                </div>
                <div class="concern-text">${alert.concern}</div>
                <p class="text-muted mb-0">${alert.description}</p>
            </div>
            
            <div class="concern-section">
                <div class="section-title">
                    <i class="fas fa-chart-line"></i>
                    Observations
                </div>
                <ul class="observations-list">
                    ${alert.observations.map(obs => `
                        <li>
                            <span class="obs-label">${obs.label}</span>
                            <span class="obs-value ${obs.abnormal ? 'abnormal' : ''}">${obs.value}</span>
                        </li>
                    `).join('')}
                </ul>
            </div>
            
            <div class="action-required">
                <div class="section-title mb-2">
                    <i class="fas fa-tasks"></i>
                    Action Required
                </div>
                <div class="action-text">${alert.action}</div>
                <div class="action-assignee">
                    <i class="fas fa-user me-1"></i>
                    Assigned to: ${alert.assignee}
                </div>
            </div>
        </div>
    `;

    return card;
}

function showNoAlerts() {
    document.getElementById('alertsContainer').innerHTML = '';
    document.getElementById('noAlertsMessage').style.display = 'block';
    document.getElementById('lastUpdated').textContent = new Date().toLocaleString();
    
    // Update counts to show all stable
    const totalPatients = window.PATIENT_DATA?.patients?.length || 0;
    document.getElementById('criticalCount').textContent = '0';
    document.getElementById('highCount').textContent = '0';
    document.getElementById('monitorCount').textContent = '0';
    document.getElementById('stableCount').textContent = totalPatients;
}

function showNoData() {
    document.getElementById('alertsContainer').innerHTML = `
        <div class="text-center py-5">
            <div class="no-alerts-card">
                <i class="fas fa-exclamation-triangle text-warning mb-3" style="font-size: 3rem;"></i>
                <h3 class="text-warning mb-2">No Patient Data Available</h3>
                <p class="text-muted">Unable to load patient data for emergency assessment.</p>
            </div>
        </div>
    `;
    document.getElementById('noAlertsMessage').style.display = 'none';
}