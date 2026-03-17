class ClinicalEmergencyAnalyzer {
    constructor() {
        this.criticalThresholds = {
            // Vital signs
            systolic_bp_high: 180,
            systolic_bp_low: 90,
            diastolic_bp_high: 110,
            temperature_high: 39.0,
            temperature_low: 35.0,
            heart_rate_high: 120,
            heart_rate_low: 50,
            respiratory_rate_high: 24,
            respiratory_rate_low: 8,
            oxygen_sat_low: 90,
            
            // Lab values
            glucose_high: 15.0,
            glucose_low: 3.0,
            hemoglobin_low: 7.0,
            wbc_high: 15.0,
            egfr_critical: 15,
            
            // Specialty scores
            pain_scale_high: 8,
            mmse_low: 15,
            phq9_high: 15,
            das28_high: 5.1,
            pasi_high: 12,
            fev1_low: 30,
            iop_high: 21
        };
        
        this.alerts = [];
        this.init();
    }

    init() {
        document.addEventListener('DOMContentLoaded', () => {
            this.updateTimestamp();
            this.analyzePatients();
            this.renderAlerts();
        });
    }

    updateTimestamp() {
        const now = new Date();
        const timestamp = now.toLocaleString('en-US', {
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
        document.getElementById('lastUpdated').textContent = timestamp;
    }

    analyzePatients() {
        if (!window.PATIENT_DATA) {
            console.error('Patient data not available');
            return;
        }

        const data = window.PATIENT_DATA;
        
        if (data.patient && data.patient.id === 'all' && data.patients) {
            // Analyze all patients
            data.patients.forEach(patient => {
                if (patient.data) {
                    this.analyzePatientData(patient);
                }
            });
        } else if (data.patient && data.patient.id !== 'all') {
            // Single patient analysis
            this.analyzePatientData({
                id: data.patient.id,
                name: data.patient.name,
                gender: data.patient.gender,
                birthDate: data.patient.birthDate,
                data: data
            });
        }

        // Sort alerts by priority
        this.alerts.sort((a, b) => {
            const priorityOrder = { 'critical': 3, 'high': 2, 'monitor': 1 };
            return priorityOrder[b.priority] - priorityOrder[a.priority];
        });
    }

    analyzePatientData(patient) {
        const patientData = patient.data || {};
        const alerts = [];

        // Analyze each resource type
        Object.entries(patientData).forEach(([resourceType, records]) => {
            if (Array.isArray(records)) {
                records.forEach(record => {
                    const alert = this.analyzeRecord(patient, resourceType, record);
                    if (alert) {
                        alerts.push(alert);
                    }
                });
            }
        });

        // Add patient-specific alerts to main collection
        this.alerts.push(...alerts);
    }

    analyzeRecord(patient, resourceType, record) {
        const patientInfo = {
            name: patient.name || 'Unknown Patient',
            id: patient.id,
            location: this.getPatientLocation(patient)
        };

        switch (resourceType) {
            case 'vital_signs':
            case 'observation':
                return this.analyzeVitalSigns(patientInfo, record);
            
            case 'condition':
                return this.analyzeCondition(patientInfo, record);
            
            case 'medicationrequest':
                return this.analyzeMedication(patientInfo, record);
            
            default:
                return null;
        }
    }

    getPatientLocation(patient) {
        // Try to get location from patient data
        if (patient.data && patient.data.locations && patient.data.locations.length > 0) {
            const location = patient.data.locations[0];
            return `${location.name || 'Unknown Room'}, ${location.value || 'Unknown Ward'}`;
        }
        return 'Location not specified';
    }

    analyzeVitalSigns(patientInfo, record) {
        const value = record.value || record.name || '';
        const name = record.name || '';
        
        // Blood pressure analysis
        if (name.toLowerCase().includes('bp') || value.includes('/')) {
            const bpMatch = value.match(/(\d+)\/(\d+)/);
            if (bpMatch) {
                const systolic = parseInt(bpMatch[1]);
                const diastolic = parseInt(bpMatch[2]);
                
                if (systolic >= this.criticalThresholds.systolic_bp_high || 
                    diastolic >= this.criticalThresholds.diastolic_bp_high) {
                    return {
                        patient: patientInfo,
                        priority: 'critical',
                        concern: 'Hypertensive Crisis',
                        observations: [`Blood Pressure: ${value}`, `Recorded: ${record.date || 'Recent'}`],
                        action: 'IMMEDIATE: Administer antihypertensive medication. Notify physician immediately. Monitor every 15 minutes.',
                        icon: 'heart-pulse'
                    };
                }
                
                if (systolic <= this.criticalThresholds.systolic_bp_low) {
                    return {
                        patient: patientInfo,
                        priority: 'high',
                        concern: 'Hypotension Risk',
                        observations: [`Blood Pressure: ${value}`, `Recorded: ${record.date || 'Recent'}`],
                        action: 'Within 30 minutes: Assess fluid status. Consider IV fluids. Notify physician.',
                        icon: 'heart-pulse'
                    };
                }
            }
        }

        // Temperature analysis
        if (name.toLowerCase().includes('temp') || value.includes('°') || value.includes('C')) {
            const tempMatch = value.match(/(\d+\.?\d*)/);
            if (tempMatch) {
                const temp = parseFloat(tempMatch[1]);
                if (temp >= this.criticalThresholds.temperature_high) {
                    return {
                        patient: patientInfo,
                        priority: 'critical',
                        concern: 'Severe Hyperthermia',
                        observations: [`Temperature: ${value}`, `Recorded: ${record.date || 'Recent'}`],
                        action: 'IMMEDIATE: Cooling measures. Blood cultures. Antipyretics. Notify physician.',
                        icon: 'thermometer-full'
                    };
                }
            }
        }

        // Glucose analysis
        if (name.toLowerCase().includes('glucose') || name.toLowerCase().includes('sugar')) {
            const glucoseMatch = value.match(/(\d+\.?\d*)/);
            if (glucoseMatch) {
                const glucose = parseFloat(glucoseMatch[1]);
                if (glucose >= this.criticalThresholds.glucose_high) {
                    return {
                        patient: patientInfo,
                        priority: 'critical',
                        concern: 'Severe Hyperglycemia',
                        observations: [`Glucose: ${value}`, `Recorded: ${record.date || 'Recent'}`],
                        action: 'IMMEDIATE: Check ketones. Insulin protocol. IV fluids. Notify endocrinologist.',
                        icon: 'vial'
                    };
                }
                if (glucose <= this.criticalThresholds.glucose_low) {
                    return {
                        patient: patientInfo,
                        priority: 'critical',
                        concern: 'Severe Hypoglycemia',
                        observations: [`Glucose: ${value}`, `Recorded: ${record.date || 'Recent'}`],
                        action: 'IMMEDIATE: Dextrose 50% IV push. Continuous glucose monitoring. Notify physician.',
                        icon: 'vial'
                    };
                }
            }
        }

        // Pain scale analysis
        if (name.toLowerCase().includes('pain') && value.includes('/10')) {
            const painMatch = value.match(/(\d+)\/10/);
            if (painMatch) {
                const pain = parseInt(painMatch[1]);
                if (pain >= this.criticalThresholds.pain_scale_high) {
                    return {
                        patient: patientInfo,
                        priority: 'high',
                        concern: 'Severe Pain Crisis',
                        observations: [`Pain Score: ${value}`, `Recorded: ${record.date || 'Recent'}`],
                        action: 'Within 30 minutes: Pain assessment. Analgesic review. Consider breakthrough medication.',
                        icon: 'hand-dots'
                    };
                }
            }
        }

        // eGFR analysis
        if (name.toLowerCase().includes('egfr')) {
            const egfrMatch = value.match(/(\d+)/);
            if (egfrMatch) {
                const egfr = parseInt(egfrMatch[1]);
                if (egfr <= this.criticalThresholds.egfr_critical) {
                    return {
                        patient: patientInfo,
                        priority: 'high',
                        concern: 'End-Stage Renal Disease',
                        observations: [`eGFR: ${value}`, `Recorded: ${record.date || 'Recent'}`],
                        action: 'Within 30 minutes: Nephrology consult. Dialysis assessment. Fluid restriction.',
                        icon: 'kidneys'
                    };
                }
            }
        }

        return null;
    }

    analyzeCondition(patientInfo, record) {
        const condition = (record.name || '').toLowerCase();
        
        // High-risk conditions requiring monitoring
        const criticalConditions = ['sepsis', 'chest pain', 'stroke', 'mi', 'heart attack'];
        const highRiskConditions = ['copd', 'asthma', 'pneumonia', 'ckd', 'cancer'];
        
        if (criticalConditions.some(c => condition.includes(c))) {
            return {
                patient: patientInfo,
                priority: 'critical',
                concern: `Active ${record.name} - High Risk`,
                observations: [`Condition: ${record.name}`, `Onset: ${record.date || 'Recent'}`],
                action: 'IMMEDIATE: Continuous monitoring. Vital signs q15min. Physician notification.',
                icon: 'exclamation-triangle'
            };
        }
        
        if (highRiskConditions.some(c => condition.includes(c))) {
            return {
                patient: patientInfo,
                priority: 'monitor',
                concern: `${record.name} - Requires Monitoring`,
                observations: [`Condition: ${record.name}`, `Status: Active`],
                action: 'Monitor closely. Assess for deterioration. Follow treatment protocol.',
                icon: 'eye'
            };
        }

        return null;
    }

    analyzeMedication(patientInfo, record) {
        const medication = (record.name || '').toLowerCase();
        
        // High-risk medications requiring monitoring
        if (medication.includes('warfarin') || medication.includes('heparin')) {
            return {
                patient: patientInfo,
                priority: 'monitor',
                concern: 'Anticoagulation Monitoring Required',
                observations: [`Medication: ${record.name}`, `Dosing: ${record.status || 'As prescribed'}`],
                action: 'Monitor for bleeding signs. Check coagulation studies. Assess fall risk.',
                icon: 'pills'
            };
        }

        return null;
    }

    renderAlerts() {
        const container = document.getElementById('alertsContainer');
        const noAlertsMessage = document.getElementById('noAlertsMessage');
        
        // Update summary counts
        const criticalCount = this.alerts.filter(a => a.priority === 'critical').length;
        const highCount = this.alerts.filter(a => a.priority === 'high').length;
        const monitorCount = this.alerts.filter(a => a.priority === 'monitor').length;
        
        document.getElementById('criticalCount').textContent = criticalCount;
        document.getElementById('highCount').textContent = highCount;
        document.getElementById('monitorCount').textContent = monitorCount;

        if (this.alerts.length === 0) {
            container.style.display = 'none';
            noAlertsMessage.style.display = 'block';
            return;
        }

        container.innerHTML = this.alerts.map(alert => this.renderAlert(alert)).join('');
        container.style.display = 'block';
        noAlertsMessage.style.display = 'none';
    }

    renderAlert(alert) {
        const priorityColors = {
            critical: 'critical',
            high: 'high',
            monitor: 'monitor'
        };

        const observations = alert.observations.map(obs => 
            `<div class="observation-item">
                <div class="value">${obs}</div>
            </div>`
        ).join('');

        return `
            <div class="alert-card ${priorityColors[alert.priority]}">
                <div class="patient-header">
                    <div class="patient-info">
                        <h3>${alert.patient.name}</h3>
                        <div class="location">
                            <i class="fas fa-map-marker-alt me-1"></i>
                            ${alert.patient.location}
                        </div>
                    </div>
                    <div class="priority-badge ${priorityColors[alert.priority]}">
                        <i class="fas fa-exclamation-circle me-1"></i>
                        ${alert.priority.toUpperCase()}
                    </div>
                </div>

                <div class="concern-section">
                    <h4>
                        <i class="fas fa-${alert.icon}"></i>
                        Concern
                    </h4>
                    <div class="content">${alert.concern}</div>
                </div>

                <div class="concern-section">
                    <h4>
                        <i class="fas fa-chart-line"></i>
                        Observations
                    </h4>
                    <div class="observations-grid">
                        ${observations}
                    </div>
                </div>

                <div class="action-required ${priorityColors[alert.priority]}">
                    <div class="urgency">Action Required</div>
                    <div class="content">${alert.action}</div>
                </div>
            </div>
        `;
    }
}

// Initialize the analyzer
new ClinicalEmergencyAnalyzer();