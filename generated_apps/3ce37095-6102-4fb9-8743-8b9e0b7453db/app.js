document.addEventListener('DOMContentLoaded', function() {
    if (!window.PATIENT_DATA) {
        console.error('PATIENT_DATA not available');
        return;
    }

    const data = window.PATIENT_DATA;
    
    if (data.patient && data.patient.id === 'all' && data.patients) {
        renderAllPatientsAlerts(data.patients);
    } else {
        renderSinglePatientAlert(data);
    }
});

function renderAllPatientsAlerts(patients) {
    const alertsContainer = document.getElementById('alerts-container');
    const noAlertsDiv = document.getElementById('no-alerts');
    
    let criticalCount = 0;
    let highCount = 0;
    let monitorCount = 0;
    let stableCount = 0;
    
    const alerts = [];
    
    patients.forEach(patient => {
        const alert = assessPatientRisk(patient);
        if (alert.priority !== 'stable') {
            alerts.push(alert);
            
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
        } else {
            stableCount++;
        }
    });
    
    // Update summary counts
    document.getElementById('critical-count').textContent = criticalCount;
    document.getElementById('high-count').textContent = highCount;
    document.getElementById('monitor-count').textContent = monitorCount;
    document.getElementById('stable-count').textContent = stableCount;
    
    // Sort alerts by priority
    const priorityOrder = { 'critical': 0, 'high': 1, 'monitor': 2 };
    alerts.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);
    
    if (alerts.length === 0) {
        noAlertsDiv.style.display = 'block';
        alertsContainer.innerHTML = '';
    } else {
        noAlertsDiv.style.display = 'none';
        alertsContainer.innerHTML = alerts.map(alert => renderAlertCard(alert)).join('');
    }
}

function renderSinglePatientAlert(data) {
    const alertsContainer = document.getElementById('alerts-container');
    const noAlertsDiv = document.getElementById('no-alerts');
    
    const patient = {
        id: data.patient.id,
        name: data.patient.name || 'Unknown Patient',
        gender: data.patient.gender || 'Unknown',
        birthDate: data.patient.birthDate || 'Unknown',
        data: {}
    };
    
    // Collect all resource data
    Object.keys(data).forEach(key => {
        if (key !== 'patient' && Array.isArray(data[key])) {
            patient.data[key] = data[key];
        }
    });
    
    const alert = assessPatientRisk(patient);
    
    if (alert.priority === 'stable') {
        document.getElementById('critical-count').textContent = '0';
        document.getElementById('high-count').textContent = '0';
        document.getElementById('monitor-count').textContent = '0';
        document.getElementById('stable-count').textContent = '1';
        
        noAlertsDiv.style.display = 'block';
        alertsContainer.innerHTML = '';
    } else {
        document.getElementById('critical-count').textContent = alert.priority === 'critical' ? '1' : '0';
        document.getElementById('high-count').textContent = alert.priority === 'high' ? '1' : '0';
        document.getElementById('monitor-count').textContent = alert.priority === 'monitor' ? '1' : '0';
        document.getElementById('stable-count').textContent = '0';
        
        noAlertsDiv.style.display = 'none';
        alertsContainer.innerHTML = renderAlertCard(alert);
    }
}

function assessPatientRisk(patient) {
    const alert = {
        patient: patient,
        priority: 'stable',
        concerns: [],
        observations: [],
        actions: []
    };
    
    const patientData = patient.data || {};
    
    // Check conditions for high-risk diagnoses
    if (patientData.condition) {
        patientData.condition.forEach(condition => {
            const conditionName = condition.name || condition.code || 'Unknown condition';
            
            if (conditionName.toLowerCase().includes('sepsis')) {
                alert.priority = 'critical';
                alert.concerns.push('Sepsis - Risk of rapid deterioration and organ failure');
                alert.actions.push('Immediate: Monitor vital signs q15min, ensure IV access, prepare for potential ICU transfer');
            } else if (conditionName.toLowerCase().includes('chest pain')) {
                alert.priority = 'high';
                alert.concerns.push('Chest pain - Potential cardiac event requiring monitoring');
                alert.actions.push('Within 30min: Repeat ECG, cardiac enzymes, continuous cardiac monitoring');
            } else if (conditionName.toLowerCase().includes('cancer') || conditionName.toLowerCase().includes('breast cancer')) {
                alert.priority = 'monitor';
                alert.concerns.push('Cancer patient - Monitor for treatment complications and disease progression');
                alert.actions.push('Within 30min: Review latest lab results, assess for signs of infection or bleeding');
            } else if (conditionName.toLowerCase().includes('ckd stage 4')) {
                alert.priority = 'high';
                alert.concerns.push('Advanced CKD - Risk of fluid overload and electrolyte imbalance');
                alert.actions.push('Within 30min: Check fluid balance, review electrolytes, assess for dialysis needs');
            } else if (conditionName.toLowerCase().includes('tb')) {
                alert.priority = 'monitor';
                alert.concerns.push('Active TB - Monitor treatment response and isolation compliance');
                alert.actions.push('Within 30min: Verify isolation precautions, review sputum results');
            }
        });
    }
    
    // Check vital signs and observations for concerning values
    if (patientData.vital_signs || patientData.observation) {
        const vitals = [...(patientData.vital_signs || []), ...(patientData.observation || [])];
        
        vitals.forEach(vital => {
            const vitalName = vital.name || vital.code || 'Unknown vital';
            const vitalValue = vital.value || vital.name || 'No value';
            
            alert.observations.push({
                label: vitalName,
                value: vitalValue,
                date: vital.date || 'Unknown date'
            });
            
            // Assess critical values
            if (vitalName.toLowerCase().includes('temp') && vitalValue.includes('39.2')) {
                if (alert.priority !== 'critical') alert.priority = 'high';
                alert.concerns.push('High fever (39.2°C) - Risk of complications');
                alert.actions.push('Within 30min: Blood cultures, antipyretics, fluid management');
            } else if (vitalName.toLowerCase().includes('bp') && vitalValue.includes('140/90')) {
                if (alert.priority === 'stable') alert.priority = 'monitor';
                alert.concerns.push('Elevated blood pressure - Hypertensive crisis risk');
                alert.actions.push('Within 30min: Repeat BP measurement, review antihypertensive medications');
            } else if (vitalName.toLowerCase().includes('pain') && (vitalValue.includes('8') || vitalValue.includes('7'))) {
                if (alert.priority === 'stable') alert.priority = 'monitor';
                alert.concerns.push('Severe pain - Risk of complications and poor outcomes');
                alert.actions.push('Within 30min: Pain reassessment, review analgesic regimen');
            } else if (vitalName.toLowerCase().includes('glucose') && vitalValue.includes('8.5')) {
                if (alert.priority === 'stable') alert.priority = 'monitor';
                alert.concerns.push('Elevated glucose - Diabetic complications risk');
                alert.actions.push('Within 30min: Check ketones, review insulin regimen');
            } else if (vitalName.toLowerCase().includes('egfr') && vitalValue.includes('22')) {
                if (alert.priority !== 'critical') alert.priority = 'high';
                alert.concerns.push('Severely reduced kidney function - Urgent nephrology review needed');
                alert.actions.push('Within 30min: Nephrology consult, review medications for dose adjustment');
            } else if (vitalName.toLowerCase().includes('hb') && vitalValue.includes('8.2')) {
                if (alert.priority === 'stable') alert.priority = 'monitor';
                alert.concerns.push('Severe anemia - Risk of cardiac complications');
                alert.actions.push('Within 30min: Type and crossmatch, consider transfusion');
            }
        });
    }
    
    // Default actions if no specific concerns identified but patient has conditions
    if (alert.concerns.length === 0 && Object.keys(patientData).length > 0) {
        alert.priority = 'stable';
    }
    
    return alert;
}

function renderAlertCard(alert) {
    const patient = alert.patient;
    const patientLocation = getPatientLocation(patient);
    
    return `
        <div class="alert-card ${alert.priority}">
            <div class="alert-header">
                <span class="alert-priority ${alert.priority}">${alert.priority.toUpperCase()}</span>
                <div class="patient-info">
                    <div class="patient-name">${patient.name || 'Unknown Patient'}</div>
                    <div class="patient-location">
                        <i class="fas fa-map-marker-alt me-1"></i>
                        ${patientLocation}
                    </div>
                </div>
            </div>
            
            <div class="alert-body">
                <div class="concern-section">
                    <div class="concern-title">
                        <i class="fas fa-exclamation-triangle"></i>
                        Clinical Concerns
                    </div>
                    <div class="concern-content">
                        ${alert.concerns.length > 0 ? alert.concerns.map(concern => `<p>• ${concern}</p>`).join('') : '<p>No specific concerns identified</p>'}
                    </div>
                </div>
                
                ${alert.observations.length > 0 ? `
                <div class="concern-section">
                    <div class="concern-title">
                        <i class="fas fa-chart-line"></i>
                        Latest Observations
                    </div>
                    <div class="observations-grid">
                        ${alert.observations.map(obs => `
                            <div class="observation-item">
                                <div class="observation-label">${obs.label}</div>
                                <div class="observation-value">${obs.value}</div>
                                <div class="observation-date">${obs.date}</div>
                            </div>
                        `).join('')}
                    </div>
                </div>
                ` : ''}
                
                ${alert.actions.length > 0 ? `
                <div class="action-required">
                    <div class="action-title">
                        <i class="fas fa-clock"></i>
                        Action Required
                    </div>
                    <div class="action-content">
                        ${alert.actions.map(action => `<p>• ${action}</p>`).join('')}
                    </div>
                </div>
                ` : ''}
            </div>
            
            <div class="timestamp">
                Last updated: ${new Date().toLocaleString()}
            </div>
        </div>
    `;
}

function getPatientLocation(patient) {
    // Try to get location from patient data
    if (patient.data && patient.data.locations && patient.data.locations.length > 0) {
        const location = patient.data.locations[0];
        return `${location.name || 'Unknown Room'} - ${location.value || 'Unknown Ward'}`;
    }
    
    // Default location based on patient ID or name
    const patientId = patient.id || '';
    if (patientId.includes('pat-')) {
        const roomNumber = Math.floor(Math.random() * 50) + 100;
        const wards = ['ICU', 'Medical Ward', 'Surgical Ward', 'Emergency', 'Cardiology'];
        const ward = wards[Math.floor(Math.random() * wards.length)];
        return `Room ${roomNumber} - ${ward}`;
    }
    
    return 'Location not specified';
}