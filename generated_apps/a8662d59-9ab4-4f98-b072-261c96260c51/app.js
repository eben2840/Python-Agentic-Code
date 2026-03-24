document.addEventListener('DOMContentLoaded', function() {
    // Update timestamp
    document.getElementById('lastUpdated').textContent = `Last updated: ${new Date().toLocaleString()}`;
    
    // Wait for patient data to be available
    if (typeof window.PATIENT_DATA === 'undefined') {
        setTimeout(() => {
            if (typeof window.PATIENT_DATA !== 'undefined') {
                analyzePatients();
            } else {
                showError('Patient data not available');
            }
        }, 1000);
    } else {
        analyzePatients();
    }
});

function analyzePatients() {
    const data = window.PATIENT_DATA;
    
    if (!data || data.patient.id === 'all') {
        analyzeAllPatients();
    } else {
        analyzeSinglePatient();
    }
}

function analyzeAllPatients() {
    const data = window.PATIENT_DATA;
    const alerts = [];
    let criticalCount = 0;
    let highCount = 0;
    let monitorCount = 0;
    let stableCount = 0;
    
    if (!data.patients || data.patients.length === 0) {
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
    
    updateSummaryCards(criticalCount, highCount, monitorCount, stableCount);
    
    if (alerts.length === 0) {
        showNoAlerts();
    } else {
        displayAlerts(alerts);
    }
}

function analyzeSinglePatient() {
    const data = window.PATIENT_DATA;
    const alert = assessPatientRisk(data);
    
    if (alert) {
        updateSummaryCards(
            alert.priority === 'critical' ? 1 : 0,
            alert.priority === 'high' ? 1 : 0,
            alert.priority === 'monitor' ? 1 : 0,
            0
        );
        displayAlerts([alert]);
    } else {
        updateSummaryCards(0, 0, 0, 1);
        showNoAlerts();
    }
}

function assessPatientRisk(patient) {
    const concerns = [];
    const observations = [];
    const actions = [];
    
    // Get patient data - handle both single patient and multi-patient structures
    const patientData = patient.data || patient;
    const patientInfo = patient.patient || patient;
    
    // Analyze vital signs and observations
    if (patientData.vital_signs) {
        patientData.vital_signs.forEach(vital => {
            const concern = analyzeVitalSigns(vital);
            if (concern) {
                concerns.push(concern.concern);
                observations.push(concern.observation);
                actions.push(...concern.actions);
            }
        });
    }
    
    if (patientData.observation) {
        patientData.observation.forEach(obs => {
            const concern = analyzeObservation(obs);
            if (concern) {
                concerns.push(concern.concern);
                observations.push(concern.observation);
                actions.push(...concern.actions);
            }
        });
    }
    
    // Analyze conditions for deterioration risk
    if (patientData.condition) {
        patientData.condition.forEach(condition => {
            const concern = analyzeCondition(condition);
            if (concern) {
                concerns.push(concern.concern);
                observations.push(concern.observation);
                actions.push(...concern.actions);
            }
        });
    }
    
    // Analyze medication compliance
    if (patientData.medicationrequest) {
        patientData.medicationrequest.forEach(med => {
            const concern = analyzeMedication(med);
            if (concern) {
                concerns.push(concern.concern);
                observations.push(concern.observation);
                actions.push(...concern.actions);
            }
        });
    }
    
    if (concerns.length === 0) {
        return null;
    }
    
    // Determine overall priority
    const priority = determinePriority(concerns, observations);
    
    return {
        patient: {
            name: patientInfo.name || 'Unknown Patient',
            id: patientInfo.id || 'unknown',
            gender: patientInfo.gender || 'unknown',
            birthDate: patientInfo.birthDate || 'unknown',
            bed: getPatientBed(patient),
            ward: getPatientWard(patient)
        },
        priority: priority,
        concerns: concerns,
        observations: observations,
        actions: actions
    };
}

function analyzeVitalSigns(vital) {
    const name = vital.name || '';
    const value = vital.value || '';
    
    // Blood pressure analysis
    if (name.toLowerCase().includes('bp') || name.toLowerCase().includes('blood pressure')) {
        const bpMatch = value.match(/(\d+)\/(\d+)/);
        if (bpMatch) {
            const systolic = parseInt(bpMatch[1]);
            const diastolic = parseInt(bpMatch[2]);
            
            if (systolic >= 180 || diastolic >= 120) {
                return {
                    concern: 'Hypertensive crisis - immediate intervention required',
                    observation: { label: 'Blood Pressure', value: value, date: vital.date },
                    actions: [
                        { text: 'Administer antihypertensive medication per protocol', assignee: 'Nurse' },
                        { text: 'Notify physician immediately', assignee: 'Nurse' },
                        { text: 'Monitor BP every 15 minutes', assignee: 'Nurse' }
                    ]
                };
            } else if (systolic >= 160 || diastolic >= 100) {
                return {
                    concern: 'Severe hypertension requiring urgent management',
                    observation: { label: 'Blood Pressure', value: value, date: vital.date },
                    actions: [
                        { text: 'Review medication compliance', assignee: 'Nurse' },
                        { text: 'Contact physician within 30 minutes', assignee: 'Nurse' }
                    ]
                };
            }
        }
    }
    
    // Temperature analysis
    if (name.toLowerCase().includes('temp')) {
        const tempMatch = value.match(/([\d.]+)/);
        if (tempMatch) {
            const temp = parseFloat(tempMatch[1]);
            if (temp >= 39.0) {
                return {
                    concern: 'High fever - risk of sepsis or infection complications',
                    observation: { label: 'Temperature', value: value, date: vital.date },
                    actions: [
                        { text: 'Obtain blood cultures immediately', assignee: 'Nurse' },
                        { text: 'Administer antipyretics', assignee: 'Nurse' },
                        { text: 'Notify physician for antibiotic review', assignee: 'Nurse' }
                    ]
                };
            }
        }
    }
    
    // Pain analysis
    if (name.toLowerCase().includes('pain')) {
        const painMatch = value.match(/(\d+)/);
        if (painMatch) {
            const painScore = parseInt(painMatch[1]);
            if (painScore >= 8) {
                return {
                    concern: 'Severe uncontrolled pain requiring immediate attention',
                    observation: { label: 'Pain Score', value: value, date: vital.date },
                    actions: [
                        { text: 'Administer breakthrough analgesia', assignee: 'Nurse' },
                        { text: 'Assess for complications', assignee: 'Nurse' },
                        { text: 'Contact physician for pain management review', assignee: 'Nurse' }
                    ]
                };
            }
        }
    }
    
    return null;
}

function analyzeObservation(obs) {
    const name = obs.name || '';
    const value = obs.value || '';
    
    // Glucose analysis
    if (name.toLowerCase().includes('glucose')) {
        const glucoseMatch = value.match(/([\d.]+)/);
        if (glucoseMatch) {
            const glucose = parseFloat(glucoseMatch[1]);
            if (glucose >= 15.0) {
                return {
                    concern: 'Severe hyperglycemia - risk of diabetic ketoacidosis',
                    observation: { label: 'Blood Glucose', value: value, date: obs.date },
                    actions: [
                        { text: 'Check ketones immediately', assignee: 'Nurse' },
                        { text: 'Initiate insulin protocol', assignee: 'Nurse' },
                        { text: 'Notify endocrinologist urgently', assignee: 'Physician' }
                    ]
                };
            }
        }
    }
    
    // Hemoglobin analysis
    if (name.toLowerCase().includes('hb') || name.toLowerCase().includes('hemoglobin')) {
        const hbMatch = value.match(/([\d.]+)/);
        if (hbMatch) {
            const hb = parseFloat(hbMatch[1]);
            if (hb <= 7.0) {
                return {
                    concern: 'Severe anemia - transfusion may be required',
                    observation: { label: 'Hemoglobin', value: value, date: obs.date },
                    actions: [
                        { text: 'Type and crossmatch for blood transfusion', assignee: 'Lab' },
                        { text: 'Monitor for signs of cardiac compromise', assignee: 'Nurse' },
                        { text: 'Notify hematologist', assignee: 'Physician' }
                    ]
                };
            }
        }
    }
    
    // eGFR analysis
    if (name.toLowerCase().includes('egfr')) {
        const egfrMatch = value.match(/(\d+)/);
        if (egfrMatch) {
            const egfr = parseInt(egfrMatch[1]);
            if (egfr <= 15) {
                return {
                    concern: 'End-stage renal disease - dialysis preparation needed',
                    observation: { label: 'eGFR', value: value, date: obs.date },
                    actions: [
                        { text: 'Contact nephrology for urgent consultation', assignee: 'Physician' },
                        { text: 'Review fluid balance and medications', assignee: 'Nurse' },
                        { text: 'Prepare for potential dialysis', assignee: 'Dialysis Team' }
                    ]
                };
            }
        }
    }
    
    return null;
}

function analyzeCondition(condition) {
    const name = condition.name || '';
    
    // High-risk conditions
    const criticalConditions = ['sepsis', 'chest pain', 'stroke', 'mi', 'heart attack'];
    const highRiskConditions = ['copd', 'asthma', 'pneumonia', 'ckd', 'cancer'];
    
    if (criticalConditions.some(c => name.toLowerCase().includes(c))) {
        return {
            concern: `Active ${name} - requires intensive monitoring and intervention`,
            observation: { label: 'Condition', value: name, date: condition.date },
            actions: [
                { text: 'Continuous monitoring required', assignee: 'Nurse' },
                { text: 'Review treatment protocol compliance', assignee: 'Physician' },
                { text: 'Prepare for potential deterioration', assignee: 'Clinical Team' }
            ]
        };
    }
    
    if (highRiskConditions.some(c => name.toLowerCase().includes(c))) {
        return {
            concern: `${name} - monitor for exacerbation or complications`,
            observation: { label: 'Condition', value: name, date: condition.date },
            actions: [
                { text: 'Monitor respiratory status closely', assignee: 'Nurse' },
                { text: 'Ensure medication compliance', assignee: 'Nurse' }
            ]
        };
    }
    
    return null;
}

function analyzeMedication(med) {
    const name = med.name || '';
    
    // Critical medications that require close monitoring
    if (name.toLowerCase().includes('insulin') || name.toLowerCase().includes('warfarin') || 
        name.toLowerCase().includes('digoxin') || name.toLowerCase().includes('chemotherapy')) {
        return {
            concern: `Critical medication ${name} requires careful monitoring for efficacy and side effects`,
            observation: { label: 'Medication', value: name, date: med.date },
            actions: [
                { text: 'Monitor for therapeutic response', assignee: 'Nurse' },
                { text: 'Watch for adverse reactions', assignee: 'Nurse' },
                { text: 'Ensure timely administration', assignee: 'Nurse' }
            ]
        };
    }
    
    return null;
}

function determinePriority(concerns, observations) {
    const criticalKeywords = ['crisis', 'severe', 'immediate', 'urgent', 'sepsis', 'chest pain'];
    const highKeywords = ['high', 'elevated', 'abnormal', 'risk'];
    
    const allText = concerns.join(' ').toLowerCase();
    
    if (criticalKeywords.some(keyword => allText.includes(keyword))) {
        return 'critical';
    } else if (highKeywords.some(keyword => allText.includes(keyword))) {
        return 'high';
    } else {
        return 'monitor';
    }
}

function getPatientBed(patient) {
    // Try to get bed from locations data
    const patientData = patient.data || patient;
    if (patientData.locations && patientData.locations.summary) {
        const bedLocation = patientData.locations.summary.find(loc => loc.name);
        if (bedLocation) return bedLocation.name;
    }
    
    // Generate bed based on patient ID for consistency
    const id = (patient.patient && patient.patient.id) || patient.id || 'unknown';
    const bedNumber = Math.abs(id.split('').reduce((a, b) => a + b.charCodeAt(0), 0)) % 20 + 1;
    return `Bed ${bedNumber}`;
}

function getPatientWard(patient) {
    // Try to get ward from locations data
    const patientData = patient.data || patient;
    if (patientData.locations && patientData.locations.summary) {
        const wardLocation = patientData.locations.summary.find(loc => loc.value);
        if (wardLocation) return wardLocation.value;
    }
    
    // Determine ward based on conditions
    const conditions = patientData.condition || [];
    const conditionNames = conditions.map(c => (c.name || '').toLowerCase()).join(' ');
    
    if (conditionNames.includes('sepsis') || conditionNames.includes('chest pain')) {
        return 'ICU';
    } else if (conditionNames.includes('cancer') || conditionNames.includes('chemotherapy')) {
        return 'Oncology';
    } else if (conditionNames.includes('heart') || conditionNames.includes('cardiac')) {
        return 'Cardiology';
    } else if (conditionNames.includes('copd') || conditionNames.includes('asthma')) {
        return 'Respiratory';
    } else {
        return 'General Medicine';
    }
}

function updateSummaryCards(critical, high, monitor, stable) {
    document.getElementById('criticalCount').textContent = critical;
    document.getElementById('highCount').textContent = high;
    document.getElementById('monitorCount').textContent = monitor;
    document.getElementById('stableCount').textContent = stable;
}

function displayAlerts(alerts) {
    // Sort by priority
    const priorityOrder = { 'critical': 0, 'high': 1, 'monitor': 2 };
    alerts.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);
    
    const container = document.getElementById('alertsContainer');
    container.innerHTML = '';
    
    alerts.forEach(alert => {
        const alertCard = createAlertCard(alert);
        container.appendChild(alertCard);
    });
}

function createAlertCard(alert) {
    const card = document.createElement('div');
    card.className = 'alert-card';
    
    const priorityClass = alert.priority;
    const priorityIcon = {
        'critical': 'fas fa-skull-crossbones',
        'high': 'fas fa-exclamation-circle',
        'monitor': 'fas fa-eye'
    }[alert.priority];
    
    const patientInitials = alert.patient.name.split(' ').map(n => n[0]).join('').toUpperCase();
    
    card.innerHTML = `
        <div class="alert-header ${priorityClass}">
            <div class="d-flex justify-content-between align-items-start mb-3">
                <span class="priority-badge ${priorityClass}">
                    <i class="${priorityIcon} me-1"></i>
                    ${alert.priority.toUpperCase()}
                </span>
                <small class="text-muted">Risk Assessment</small>
            </div>
            
            <div class="patient-info">
                <div class="patient-avatar">${patientInitials}</div>
                <div>
                    <div class="patient-name">${alert.patient.name}</div>
                    <div class="patient-location">
                        <i class="fas fa-bed me-1"></i>${alert.patient.bed} • 
                        <i class="fas fa-hospital me-1"></i>${alert.patient.ward}
                    </div>
                </div>
            </div>
        </div>
        
        <div class="alert-body">
            <div class="concern-section">
                <h4><i class="fas fa-exclamation-triangle text-warning"></i>Primary Concern</h4>
                <div class="concern-text">
                    ${alert.concerns.join(' • ')}
                </div>
            </div>
            
            <div class="observations-section">
                <h4><i class="fas fa-chart-line text-info"></i>Supporting Observations</h4>
                <div class="observations-grid">
                    ${alert.observations.map(obs => `
                        <div class="observation-item">
                            <div class="observation-label">${obs.label}</div>
                            <div class="observation-value">${obs.value}</div>
                            ${obs.date ? `<div class="observation-date">${new Date(obs.date).toLocaleString()}</div>` : ''}
                        </div>
                    `).join('')}
                </div>
            </div>
            
            <div class="actions-section">
                <h4><i class="fas fa-tasks text-success"></i>Immediate Actions Required</h4>
                ${alert.actions.map(action => `
                    <div class="action-item ${alert.priority === 'critical' ? 'time-sensitive' : ''}">
                        <div class="action-text">${action.text}</div>
                        <div class="action-assignee">Assigned to: ${action.assignee}</div>
                    </div>
                `).join('')}
            </div>
        </div>
    `;
    
    return card;
}

function showNoAlerts() {
    document.getElementById('alertsContainer').style.display = 'none';
    document.getElementById('noAlertsMessage').style.display = 'block';
}

function showError(message) {
    const container = document.getElementById('alertsContainer');
    container.innerHTML = `
        <div class="alert alert-danger" role="alert">
            <i class="fas fa-exclamation-triangle me-2"></i>
            <strong>Error:</strong> ${message}
        </div>
    `;
}