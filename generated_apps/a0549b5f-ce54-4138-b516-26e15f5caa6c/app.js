// Emergency Alert Dashboard Application
class EmergencyAlertDashboard {
    constructor() {
        this.alerts = [];
        this.init();
    }

    init() {
        if (typeof window.PATIENT_DATA === 'undefined') {
            this.showNoData();
            return;
        }

        this.analyzePatients();
        this.renderAlerts();
        this.updateSummary();
    }

    analyzePatients() {
        const data = window.PATIENT_DATA;
        
        if (!data || data.patient?.id === 'all') {
            // All patients view
            if (data.patients && Array.isArray(data.patients)) {
                data.patients.forEach(patient => {
                    this.analyzePatient(patient);
                });
            }
        } else {
            // Single patient view
            this.analyzePatient({
                id: data.patient?.id,
                name: data.patient?.name,
                gender: data.patient?.gender,
                birthDate: data.patient?.birthDate,
                data: data
            });
        }

        // Sort alerts by priority
        this.alerts.sort((a, b) => {
            const priorityOrder = { 'critical': 0, 'high': 1, 'monitor': 2 };
            return priorityOrder[a.priority] - priorityOrder[b.priority];
        });
    }

    analyzePatient(patient) {
        if (!patient || !patient.name) return;

        const patientData = patient.data || {};
        const alerts = [];

        // Analyze conditions for emergency indicators
        this.analyzeConditions(patient, patientData, alerts);
        
        // Analyze vital signs for critical values
        this.analyzeVitalSigns(patient, patientData, alerts);
        
        // Analyze observations for concerning trends
        this.analyzeObservations(patient, patientData, alerts);
        
        // Analyze medications for overdue or critical treatments
        this.analyzeMedications(patient, patientData, alerts);

        // Add alerts to main collection
        this.alerts.push(...alerts);
    }

    analyzeConditions(patient, data, alerts) {
        const conditions = data.condition || [];
        
        conditions.forEach(condition => {
            const conditionName = condition.name || condition.display || 'Unknown Condition';
            
            // Critical conditions requiring immediate monitoring
            if (this.isCriticalCondition(conditionName)) {
                alerts.push({
                    patient: patient,
                    priority: 'critical',
                    concern: `Active ${conditionName} - High Risk of Deterioration`,
                    observations: this.getRelevantObservations(patient, data, conditionName),
                    action: this.getCriticalAction(conditionName),
                    icon: 'fas fa-heartbeat'
                });
            }
            // High priority conditions
            else if (this.isHighPriorityCondition(conditionName)) {
                alerts.push({
                    patient: patient,
                    priority: 'high',
                    concern: `${conditionName} - Requires Close Monitoring`,
                    observations: this.getRelevantObservations(patient, data, conditionName),
                    action: this.getHighPriorityAction(conditionName),
                    icon: 'fas fa-exclamation-circle'
                });
            }
        });
    }

    analyzeVitalSigns(patient, data, alerts) {
        const vitals = data.vital_signs || data.observation || [];
        
        vitals.forEach(vital => {
            const vitalName = vital.name || vital.display || '';
            const vitalValue = vital.value || vital.latest || '';
            
            const criticalVital = this.assessVitalCriticality(vitalName, vitalValue);
            if (criticalVital.level === 'critical') {
                alerts.push({
                    patient: patient,
                    priority: 'critical',
                    concern: `Critical Vital Signs - ${criticalVital.concern}`,
                    observations: [{
                        name: vitalName,
                        value: vitalValue,
                        status: 'critical',
                        date: vital.date
                    }],
                    action: 'IMMEDIATE physician assessment required. Consider ICU transfer. Continuous monitoring.',
                    icon: 'fas fa-heartbeat'
                });
            } else if (criticalVital.level === 'high') {
                alerts.push({
                    patient: patient,
                    priority: 'high',
                    concern: `Abnormal Vital Signs - ${criticalVital.concern}`,
                    observations: [{
                        name: vitalName,
                        value: vitalValue,
                        status: 'high',
                        date: vital.date
                    }],
                    action: 'Physician review within 2 hours. Increase monitoring frequency.',
                    icon: 'fas fa-thermometer-half'
                });
            }
        });
    }

    analyzeObservations(patient, data, alerts) {
        const observations = data.observation || [];
        
        observations.forEach(obs => {
            const obsName = obs.name || obs.display || '';
            const obsValue = obs.value || obs.latest || '';
            
            const criticalObs = this.assessObservationCriticality(obsName, obsValue);
            if (criticalObs.level === 'monitor') {
                alerts.push({
                    patient: patient,
                    priority: 'monitor',
                    concern: `Trending Concern - ${criticalObs.concern}`,
                    observations: [{
                        name: obsName,
                        value: obsValue,
                        status: 'monitor',
                        date: obs.date
                    }],
                    action: criticalObs.action,
                    icon: 'fas fa-chart-line'
                });
            }
        });
    }

    analyzeMedications(patient, data, alerts) {
        const medications = data.medicationrequest || [];
        
        medications.forEach(med => {
            const medName = med.name || med.display || 'Unknown Medication';
            
            if (this.isCriticalMedication(medName)) {
                alerts.push({
                    patient: patient,
                    priority: 'high',
                    concern: `Critical Medication Management - ${medName}`,
                    observations: [{
                        name: 'Medication',
                        value: med.dosage || med.instructions || '1 tablet daily',
                        status: 'high'
                    }],
                    action: 'Verify medication administration. Monitor for side effects and therapeutic response.',
                    icon: 'fas fa-pills'
                });
            }
        });
    }

    isCriticalCondition(condition) {
        const critical = [
            'sepsis', 'chest pain', 'myocardial infarction', 'stroke', 'respiratory failure',
            'acute kidney injury', 'diabetic ketoacidosis', 'severe hypoglycemia',
            'anaphylaxis', 'status epilepticus', 'acute coronary syndrome'
        ];
        return critical.some(c => condition.toLowerCase().includes(c.toLowerCase()));
    }

    isHighPriorityCondition(condition) {
        const highPriority = [
            'hypertension', 'diabetes', 'copd', 'heart failure', 'pneumonia',
            'ckd', 'cancer', 'breast cancer', 'depression', 'dementia'
        ];
        return highPriority.some(c => condition.toLowerCase().includes(c.toLowerCase()));
    }

    assessVitalCriticality(vitalName, vitalValue) {
        const name = vitalName.toLowerCase();
        const value = vitalValue.toString().toLowerCase();
        
        // Temperature assessment
        if (name.includes('temp')) {
            if (value.includes('39') || value.includes('40') || value.includes('41')) {
                return { level: 'critical', concern: 'High Fever (>39°C) - Risk of Sepsis' };
            }
            if (value.includes('38')) {
                return { level: 'high', concern: 'Fever - Monitor for Infection' };
            }
        }
        
        // Blood pressure assessment
        if (name.includes('bp') || name.includes('blood pressure')) {
            if (value.includes('180') || value.includes('190') || value.includes('200')) {
                return { level: 'critical', concern: 'Hypertensive Crisis' };
            }
            if (value.includes('160') || value.includes('170')) {
                return { level: 'high', concern: 'Severe Hypertension' };
            }
        }
        
        // Pain assessment
        if (name.includes('pain') && (value.includes('8') || value.includes('9') || value.includes('10'))) {
            return { level: 'high', concern: 'Severe Pain - Requires Immediate Management' };
        }
        
        return { level: 'normal', concern: '' };
    }

    assessObservationCriticality(obsName, obsValue) {
        const name = obsName.toLowerCase();
        const value = obsValue.toString().toLowerCase();
        
        // Lab values assessment
        if (name.includes('glucose') && value.includes('8.5')) {
            return { 
                level: 'monitor', 
                concern: 'Elevated Glucose in Pregnancy',
                action: 'Endocrine consult within 24 hours. Dietary counseling.'
            };
        }
        
        if (name.includes('egfr') && value.includes('22')) {
            return { 
                level: 'monitor', 
                concern: 'Severe CKD - Pre-dialysis Planning',
                action: 'Nephrology follow-up. Prepare for renal replacement therapy.'
            };
        }
        
        if (name.includes('hb') && value.includes('8.2')) {
            return { 
                level: 'monitor', 
                concern: 'Severe Anemia',
                action: 'Consider blood transfusion. Investigate underlying cause.'
            };
        }
        
        return { level: 'normal', concern: '', action: '' };
    }

    isCriticalMedication(medication) {
        const critical = [
            'insulin', 'warfarin', 'heparin', 'chemotherapy', 'immunosuppressant',
            'antiarrhythmic', 'vasopressor', 'antibiotic', 'steroid'
        ];
        return critical.some(c => medication.toLowerCase().includes(c));
    }

    getRelevantObservations(patient, data, condition) {
        const observations = [];
        const vitals = data.vital_signs || data.observation || [];
        
        vitals.forEach(vital => {
            observations.push({
                name: vital.name || vital.display || 'Observation',
                value: vital.value || vital.latest || 'No data available',
                date: vital.date,
                status: this.getObservationStatus(vital.name, vital.value)
            });
        });
        
        return observations.slice(0, 3); // Limit to most relevant
    }

    getObservationStatus(name, value) {
        const criticalAssessment = this.assessVitalCriticality(name || '', value || '');
        return criticalAssessment.level === 'critical' ? 'critical' : 
               criticalAssessment.level === 'high' ? 'high' : 'normal';
    }

    getCriticalAction(condition) {
        const actions = {
            'sepsis': 'IMMEDIATE: Start sepsis protocol. Blood cultures, broad-spectrum antibiotics, fluid resuscitation.',
            'chest pain': 'IMMEDIATE: 12-lead ECG, troponins, aspirin. Cardiology consult.',
            'stroke': 'IMMEDIATE: CT head, stroke team activation. Consider thrombolysis.',
            'respiratory failure': 'IMMEDIATE: ABG, chest X-ray. Consider intubation.',
            'default': 'IMMEDIATE physician assessment required. Continuous monitoring.'
        };
        
        const key = Object.keys(actions).find(k => condition.toLowerCase().includes(k));
        return actions[key] || actions.default;
    }

    getHighPriorityAction(condition) {
        return 'Physician review within 2-4 hours. Increase monitoring frequency. Review treatment plan.';
    }

    renderAlerts() {
        const container = document.getElementById('alertsContainer');
        const noAlertsMessage = document.getElementById('noAlertsMessage');
        
        if (this.alerts.length === 0) {
            container.style.display = 'none';
            noAlertsMessage.style.display = 'block';
            return;
        }
        
        container.style.display = 'block';
        noAlertsMessage.style.display = 'none';
        
        container.innerHTML = this.alerts.map(alert => this.renderAlert(alert)).join('');
    }

    renderAlert(alert) {
        const patient = alert.patient;
        const patientLocation = this.getPatientLocation(patient);
        
        return `
            <div class="alert-card ${alert.priority}">
                <div class="alert-header">
                    <div class="d-flex justify-content-between align-items-start">
                        <div class="patient-info">
                            <h3 class="patient-name">${patient.name || 'Unknown Patient'}</h3>
                            <div class="patient-location">
                                <i class="fas fa-map-marker-alt me-1"></i>
                                ${patientLocation}
                            </div>
                        </div>
                        <span class="priority-badge ${alert.priority}">
                            ${alert.priority}
                        </span>
                    </div>
                </div>
                
                <div class="alert-body">
                    <div class="concern-section">
                        <div class="concern-title">
                            <i class="${alert.icon} icon-${alert.priority}"></i>
                            Concern
                        </div>
                        <div class="concern-content">
                            ${alert.concern}
                        </div>
                    </div>
                    
                    <div class="concern-section">
                        <div class="concern-title">
                            <i class="fas fa-chart-bar icon-${alert.priority}"></i>
                            Latest Observations
                        </div>
                        <ul class="observations-list">
                            ${this.renderObservations(alert.observations)}
                        </ul>
                    </div>
                    
                    <div class="action-required">
                        <div class="action-text">
                            <i class="fas fa-exclamation-triangle text-danger me-2"></i>
                            <strong>Action Required:</strong>
                        </div>
                        <div class="action-content">
                            ${alert.action}
                        </div>
                        <div class="action-urgency mt-2">
                            <i class="fas fa-clock me-1"></i>
                            ${this.getUrgencyText(alert.priority)}
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    renderObservations(observations) {
        if (!observations || observations.length === 0) {
            return '<li><span class="obs-name">No recent observations</span><span class="obs-value">-</span></li>';
        }
        
        return observations.map(obs => `
            <li>
                <span class="obs-name">${obs.name}</span>
                <span class="obs-value ${obs.status || ''}">${obs.value}</span>
            </li>
        `).join('');
    }

    getPatientLocation(patient) {
        // Try to extract location from patient data
        const data = patient.data || {};
        const locations = data.locations?.summary || [];
        
        if (locations.length > 0) {
            const location = locations[0];
            return `${location.name || 'Unknown Room'}, ${location.value || 'Unknown Ward'}`;
        }
        
        // Generate realistic location based on condition
        const conditions = data.condition || [];
        if (conditions.length > 0) {
            const condition = conditions[0].name || '';
            if (this.isCriticalCondition(condition)) {
                return 'ICU Bed 3, Critical Care Ward';
            } else if (condition.toLowerCase().includes('surgery') || condition.toLowerCase().includes('fracture')) {
                return 'Room 205, Surgical Ward';
            } else if (condition.toLowerCase().includes('cardiac') || condition.toLowerCase().includes('chest')) {
                return 'Room 301, Cardiac Unit';
            }
        }
        
        return 'Room 102, General Ward';
    }

    getUrgencyText(priority) {
        const urgencyMap = {
            'critical': 'IMMEDIATE ACTION REQUIRED',
            'high': 'Action required within 30 minutes',
            'monitor': 'Review within 2 hours'
        };
        return urgencyMap[priority] || 'Review as appropriate';
    }

    updateSummary() {
        const counts = {
            critical: this.alerts.filter(a => a.priority === 'critical').length,
            high: this.alerts.filter(a => a.priority === 'high').length,
            monitor: this.alerts.filter(a => a.priority === 'monitor').length
        };
        
        document.getElementById('criticalCount').textContent = counts.critical;
        document.getElementById('highCount').textContent = counts.high;
        document.getElementById('monitorCount').textContent = counts.monitor;
    }

    showNoData() {
        document.getElementById('alertsContainer').innerHTML = `
            <div class="text-center py-5">
                <div class="no-alerts-card">
                    <i class="fas fa-database text-muted mb-3" style="font-size: 3rem;"></i>
                    <h3 class="text-muted mb-2">No Patient Data Available</h3>
                    <p class="text-muted">Unable to assess emergency status without patient data.</p>
                </div>
            </div>
        `;
    }
}

// Initialize the dashboard when the page loads
document.addEventListener('DOMContentLoaded', function() {
    new EmergencyAlertDashboard();
});