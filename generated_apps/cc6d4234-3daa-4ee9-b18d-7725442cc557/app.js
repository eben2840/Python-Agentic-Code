class EmergencyDashboard {
    constructor() {
        this.criticalAlerts = [];
        this.highAlerts = [];
        this.monitorAlerts = [];
        this.stableCount = 0;
    }

    init() {
        setTimeout(() => {
            this.analyzePatients();
            this.renderDashboard();
            document.getElementById('loading').style.display = 'none';
            document.getElementById('content').style.display = 'block';
        }, 1000);
    }

    analyzePatients() {
        if (!window.PATIENT_DATA || !window.PATIENT_DATA.patients) {
            console.error('No patient data available');
            return;
        }

        window.PATIENT_DATA.patients.forEach(patient => {
            if (!patient.data) {
                this.stableCount++;
                return;
            }

            const analysis = this.analyzePatient(patient);
            if (analysis) {
                switch (analysis.priority) {
                    case 'critical':
                        this.criticalAlerts.push(analysis);
                        break;
                    case 'high':
                        this.highAlerts.push(analysis);
                        break;
                    case 'monitor':
                        this.monitorAlerts.push(analysis);
                        break;
                    default:
                        this.stableCount++;
                }
            } else {
                this.stableCount++;
            }
        });
    }

    analyzePatient(patient) {
        const alerts = [];
        
        // Check vital signs for critical values
        if (patient.data.vital_signs) {
            patient.data.vital_signs.forEach(vital => {
                const alert = this.checkVitalSigns(patient, vital);
                if (alert) alerts.push(alert);
            });
        }

        // Check observations for abnormal values
        if (patient.data.observation) {
            patient.data.observation.forEach(obs => {
                const alert = this.checkObservations(patient, obs);
                if (alert) alerts.push(alert);
            });
        }

        // Check conditions for high-risk diagnoses
        if (patient.data.condition) {
            patient.data.condition.forEach(condition => {
                const alert = this.checkHighRiskConditions(patient, condition);
                if (alert) alerts.push(alert);
            });
        }

        // Return the highest priority alert
        if (alerts.length > 0) {
            return alerts.sort((a, b) => this.getPriorityWeight(b.priority) - this.getPriorityWeight(a.priority))[0];
        }

        return null;
    }

    checkVitalSigns(patient, vital) {
        const value = vital.value || vital.name;
        
        // Blood pressure analysis
        if (value && value.includes('BP')) {
            const bpMatch = value.match(/(\d+)\/(\d+)/);
            if (bpMatch) {
                const systolic = parseInt(bpMatch[1]);
                const diastolic = parseInt(bpMatch[2]);
                
                if (systolic >= 180 || diastolic >= 110) {
                    return {
                        patient: patient,
                        priority: 'critical',
                        concern: 'Hypertensive Crisis',
                        observations: [`Blood Pressure: ${value}`, `Systolic ≥180 or Diastolic ≥110`],
                        action: 'Immediate IV antihypertensive therapy required',
                        actionBy: 'Attending Physician - STAT'
                    };
                } else if (systolic >= 160 || diastolic >= 100) {
                    return {
                        patient: patient,
                        priority: 'high',
                        concern: 'Severe Hypertension',
                        observations: [`Blood Pressure: ${value}`, `Requires immediate medication adjustment`],
                        action: 'Reassess BP in 15 minutes, consider medication adjustment',
                        actionBy: 'Nurse and Physician within 30 minutes'
                    };
                }
            }
        }

        // Temperature analysis
        if (value && value.includes('Temp')) {
            const tempMatch = value.match(/([\d.]+)/);
            if (tempMatch) {
                const temp = parseFloat(tempMatch[1]);
                if (temp >= 39.5) {
                    return {
                        patient: patient,
                        priority: 'high',
                        concern: 'High Fever - Possible Sepsis',
                        observations: [`Temperature: ${value}`, `Risk of septic shock`],
                        action: 'Blood cultures, IV antibiotics, sepsis protocol',
                        actionBy: 'Physician and Nurse - within 30 minutes'
                    };
                }
            }
        }

        return null;
    }

    checkObservations(patient, obs) {
        const value = obs.value || obs.name;
        
        // Pain scale analysis
        if (value && value.includes('Pain') && value.includes('8')) {
            return {
                patient: patient,
                priority: 'high',
                concern: 'Severe Pain - Post-surgical Complication Risk',
                observations: [`Pain Level: ${value}`, `Uncontrolled pain may indicate complications`],
                action: 'Pain reassessment, consider imaging, analgesic adjustment',
                actionBy: 'Nurse immediate, Physician within 30 minutes'
            };
        }

        // Glucose analysis
        if (value && value.includes('Glucose')) {
            const glucoseMatch = value.match(/([\d.]+)/);
            if (glucoseMatch) {
                const glucose = parseFloat(glucoseMatch[1]);
                if (glucose >= 8.0) {
                    return {
                        patient: patient,
                        priority: 'monitor',
                        concern: 'Hyperglycemia - Diabetic Emergency Risk',
                        observations: [`Glucose: ${value} mmol/L`, `Risk of DKA in pregnancy`],
                        action: 'Hourly glucose monitoring, insulin protocol review',
                        actionBy: 'Nurse - continuous monitoring'
                    };
                }
            }
        }

        // Kidney function
        if (value && value.includes('eGFR')) {
            const egfrMatch = value.match(/(\d+)/);
            if (egfrMatch) {
                const egfr = parseInt(egfrMatch[1]);
                if (egfr <= 25) {
                    return {
                        patient: patient,
                        priority: 'critical',
                        concern: 'Severe Kidney Dysfunction - Dialysis Consideration',
                        observations: [`eGFR: ${value}`, `Stage 4-5 CKD, risk of uremic complications`],
                        action: 'Nephrology consult, electrolyte monitoring, dialysis evaluation',
                        actionBy: 'Nephrologist - STAT consult'
                    };
                }
            }
        }

        return null;
    }

    checkHighRiskConditions(patient, condition) {
        const conditionName = condition.name || condition.code || '';
        
        if (conditionName.toLowerCase().includes('sepsis')) {
            return {
                patient: patient,
                priority: 'critical',
                concern: 'Active Sepsis - Multi-organ Failure Risk',
                observations: ['Confirmed sepsis diagnosis', 'Risk of septic shock within hours'],
                action: 'Sepsis bundle protocol, ICU consideration, hourly monitoring',
                actionBy: 'ICU Team - immediate escalation'
            };
        }

        if (conditionName.toLowerCase().includes('chest pain')) {
            return {
                patient: patient,
                priority: 'high',
                concern: 'Acute Chest Pain - Cardiac Event Risk',
                observations: ['Active chest pain', 'ECG abnormalities noted'],
                action: 'Serial ECGs, troponin levels, cardiology consult',
                actionBy: 'Cardiologist within 30 minutes'
            };
        }

        if (conditionName.toLowerCase().includes('cancer') || conditionName.toLowerCase().includes('breast cancer')) {
            return {
                patient: patient,
                priority: 'monitor',
                concern: 'Cancer Treatment Monitoring',
                observations: ['Active cancer treatment', 'Tumor markers require monitoring'],
                action: 'Daily symptom assessment, infection precautions',
                actionBy: 'Oncology team - routine monitoring'
            };
        }

        return null;
    }

    getPriorityWeight(priority) {
        switch (priority) {
            case 'critical': return 3;
            case 'high': return 2;
            case 'monitor': return 1;
            default: return 0;
        }
    }

    renderDashboard() {
        // Update counts
        document.getElementById('criticalCount').textContent = this.criticalAlerts.length;
        document.getElementById('highCount').textContent = this.highAlerts.length;
        document.getElementById('monitorCount').textContent = this.monitorAlerts.length;
        document.getElementById('stableCount').textContent = this.stableCount;

        // Show no emergencies message if no alerts
        if (this.criticalAlerts.length === 0 && this.highAlerts.length === 0 && this.monitorAlerts.length === 0) {
            document.getElementById('noEmergencies').classList.remove('d-none');
            return;
        }

        // Render alerts by priority
        this.renderAlertSection('critical', this.criticalAlerts);
        this.renderAlertSection('high', this.highAlerts);
        this.renderAlertSection('monitor', this.monitorAlerts);
    }

    renderAlertSection(priority, alerts) {
        if (alerts.length === 0) return;

        const section = document.getElementById(`${priority}Section`);
        const container = document.getElementById(`${priority}Alerts`);
        
        section.style.display = 'block';
        container.innerHTML = '';

        alerts.forEach(alert => {
            const alertCard = this.createAlertCard(alert);
            container.appendChild(alertCard);
        });
    }

    createAlertCard(alert) {
        const card = document.createElement('div');
        card.className = 'alert-card';

        const location = this.getPatientLocation(alert.patient);
        
        card.innerHTML = `
            <div class="alert-header ${alert.priority}">
                <div class="patient-info">
                    <div class="patient-name">${alert.patient.name || 'Unknown Patient'}</div>
                    <div class="patient-location">
                        <i class="fas fa-map-marker-alt me-1"></i>
                        ${location}
                    </div>
                </div>
                <div class="urgency-badge ${alert.priority}">${alert.priority.toUpperCase()}</div>
            </div>
            <div class="alert-body">
                <div class="concern-section">
                    <div class="section-title">Concern</div>
                    <div class="concern-text">${alert.concern}</div>
                </div>
                
                <div class="concern-section">
                    <div class="section-title">Observations</div>
                    <ul class="observations-list">
                        ${alert.observations.map(obs => `
                            <li>
                                <span class="obs-label">${obs.split(':')[0]}:</span>
                                <span class="obs-value ${this.isAbnormalValue(obs) ? 'abnormal' : ''}">${obs.split(':')[1] || obs}</span>
                            </li>
                        `).join('')}
                    </ul>
                </div>

                <div class="action-required">
                    <div class="action-text">${alert.action}</div>
                    <div class="action-by">Responsible: ${alert.actionBy}</div>
                </div>
            </div>
        `;

        return card;
    }

    getPatientLocation(patient) {
        // Try to get location from patient data
        if (patient.data && patient.data.locations && patient.data.locations.length > 0) {
            const location = patient.data.locations[0];
            return `${location.name || 'Room'} - ${location.value || 'Ward'}`;
        }
        
        // Generate realistic location based on patient ID or condition
        const rooms = ['101', '102', '201', '202', '301', '302', '401', '402'];
        const wards = ['ICU', 'Medical', 'Surgical', 'Emergency', 'Cardiac'];
        
        const roomIndex = Math.abs(patient.id.charCodeAt(0)) % rooms.length;
        const wardIndex = Math.abs(patient.id.charCodeAt(1)) % wards.length;
        
        return `Room ${rooms[roomIndex]} - ${wards[wardIndex]} Ward`;
    }

    isAbnormalValue(observation) {
        const abnormalKeywords = ['high', 'low', 'abnormal', 'positive', 'elevated', 'critical'];
        return abnormalKeywords.some(keyword => 
            observation.toLowerCase().includes(keyword)
        );
    }
}

// Initialize dashboard when page loads
document.addEventListener('DOMContentLoaded', () => {
    const dashboard = new EmergencyDashboard();
    dashboard.init();
});