class SBARHandoverApp {
    constructor() {
        this.patientData = null;
        this.init();
    }

    init() {
        this.updateTimestamp();
        setInterval(() => this.updateTimestamp(), 60000);
        
        setTimeout(() => {
            this.loadPatientData();
        }, 100);
    }

    updateTimestamp() {
        const now = new Date();
        const timeString = now.toLocaleString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
        document.getElementById('current-time').textContent = timeString;
    }

    loadPatientData() {
        if (!window.PATIENT_DATA) {
            this.showNoDataView();
            return;
        }

        this.patientData = window.PATIENT_DATA;
        
        if (this.patientData.patient && this.patientData.patient.id === 'all') {
            this.showAllPatientsView();
        } else if (this.patientData.patient) {
            this.showSinglePatientView();
        } else {
            this.showNoDataView();
        }
    }

    showSinglePatientView() {
        const patient = this.patientData.patient;
        document.getElementById('patient-info').textContent = 
            `${patient.name || 'Unknown Patient'} • ${this.formatAge(patient.birthDate)} • ${this.formatGender(patient.gender)}`;
        
        document.getElementById('single-patient-view').classList.remove('d-none');
        document.getElementById('all-patients-view').classList.add('d-none');
        document.getElementById('no-data-view').classList.add('d-none');

        this.generateSBARContent();
    }

    showAllPatientsView() {
        document.getElementById('patient-info').textContent = 'Multiple patients available - select one for SBAR handover';
        document.getElementById('single-patient-view').classList.add('d-none');
        document.getElementById('all-patients-view').classList.remove('d-none');
        document.getElementById('no-data-view').classList.add('d-none');

        this.renderPatientsList();
    }

    showNoDataView() {
        document.getElementById('patient-info').textContent = 'No patient data available';
        document.getElementById('single-patient-view').classList.add('d-none');
        document.getElementById('all-patients-view').classList.add('d-none');
        document.getElementById('no-data-view').classList.remove('d-none');
    }

    renderPatientsList() {
        const container = document.getElementById('patients-list');
        if (!this.patientData.patients || this.patientData.patients.length === 0) {
            container.innerHTML = '<div class="no-data-text">No patients available</div>';
            return;
        }

        container.innerHTML = this.patientData.patients.map(patient => {
            const conditions = this.getPatientConditions(patient);
            const conditionText = conditions.length > 0 ? conditions[0].name : 'No active conditions';
            
            return `
                <div class="patient-card" onclick="window.location.href='?patient=${patient.id}'">
                    <div class="patient-name">${patient.name || 'Unknown Patient'}</div>
                    <div class="patient-details">
                        ${this.formatAge(patient.birthDate)} • ${this.formatGender(patient.gender)}
                    </div>
                    <div class="condition-badge">${conditionText}</div>
                </div>
            `;
        }).join('');
    }

    getPatientConditions(patient) {
        if (!patient.data || !patient.data.condition) return [];
        return patient.data.condition || [];
    }

    generateSBARContent() {
        this.generateSituation();
        this.generateBackground();
        this.generateAssessment();
        this.generateRecommendation();
    }

    generateSituation() {
        const container = document.getElementById('situation-content');
        const conditions = this.patientData.condition?.summary || [];
        const encounters = this.patientData.encounter?.summary || [];
        const locations = this.patientData.locations?.summary || [];

        let content = '';
        let hasUrgent = false;

        // Current admission reason
        if (conditions.length > 0) {
            const primaryCondition = conditions[0];
            content += `
                <div class="sbar-item">
                    <div class="sbar-label">Primary Condition</div>
                    <div class="sbar-value">${primaryCondition.name}</div>
                </div>
            `;

            // Check for urgent conditions
            const urgentConditions = ['Sepsis', 'Chest Pain', 'Fractured Femur'];
            if (urgentConditions.some(urgent => primaryCondition.name.includes(urgent))) {
                hasUrgent = true;
            }
        }

        // Current location
        if (locations.length > 0) {
            const location = locations[0];
            content += `
                <div class="sbar-item">
                    <div class="sbar-label">Current Location</div>
                    <div class="sbar-value">${location.name} (${location.value})</div>
                </div>
            `;
        }

        // Admission duration
        if (encounters.length > 0 && encounters[0].date) {
            const admissionDate = new Date(encounters[0].date);
            const daysSince = Math.floor((new Date() - admissionDate) / (1000 * 60 * 60 * 24));
            content += `
                <div class="sbar-item">
                    <div class="sbar-label">Length of Stay</div>
                    <div class="sbar-value">${daysSince} days (admitted ${this.formatDate(encounters[0].date)})</div>
                </div>
            `;
        }

        if (hasUrgent) {
            content = `
                <div class="urgent-flag">
                    <i class="fas fa-exclamation-triangle"></i>
                    <span class="urgent-text">URGENT CONDITION</span> - Requires immediate attention
                </div>
            ` + content;
        }

        if (!content) {
            content = '<div class="no-data-text">No admission information available</div>';
        }

        container.innerHTML = content;
    }

    generateBackground() {
        const container = document.getElementById('background-content');
        const conditions = this.patientData.condition?.summary || [];
        const medications = this.patientData.medicationrequest?.summary || [];
        const allergies = this.patientData.allergyintolerance?.summary || [];

        let content = '';

        // Active diagnoses
        if (conditions.length > 0) {
            content += `
                <div class="sbar-item">
                    <div class="sbar-label">Active Diagnoses</div>
                    <div class="sbar-value">
                        ${conditions.map(c => c.name).join(', ')}
                    </div>
                </div>
            `;
        }

        // Current medications
        if (medications.length > 0) {
            content += `
                <div class="sbar-item">
                    <div class="sbar-label">Current Medications</div>
                    <div class="sbar-value">
                        ${medications.map(m => `${m.name} (${m.status || 'as prescribed'})`).join('<br>')}
                    </div>
                </div>
            `;
        }

        // Allergies
        if (allergies.length > 0) {
            content += `
                <div class="sbar-item">
                    <div class="sbar-label">Known Allergies</div>
                    <div class="sbar-value">
                        ${allergies.map(a => a.name).join(', ')}
                    </div>
                </div>
            `;
        } else {
            content += `
                <div class="sbar-item">
                    <div class="sbar-label">Known Allergies</div>
                    <div class="sbar-value">NKDA (No Known Drug Allergies)</div>
                </div>
            `;
        }

        if (!content) {
            content = '<div class="no-data-text">No background information available</div>';
        }

        container.innerHTML = content;
    }

    generateAssessment() {
        const container = document.getElementById('assessment-content');
        const vitals = this.patientData.vital_signs?.summary || [];
        const observations = this.patientData.observation?.summary || [];

        let content = '';
        let hasAbnormal = false;

        // Latest vitals and observations
        const allReadings = [...vitals, ...observations];
        
        if (allReadings.length > 0) {
            allReadings.forEach(reading => {
                const { isAbnormal, isCritical } = this.assessValue(reading.name, reading.value);
                if (isAbnormal || isCritical) hasAbnormal = true;

                const valueClass = isCritical ? 'critical-value' : 
                                 isAbnormal ? 'abnormal-value' : 'normal-value';

                content += `
                    <div class="sbar-item">
                        <div class="sbar-label">${reading.name}</div>
                        <div class="sbar-value">
                            <span class="${valueClass}">${reading.value}</span>
                            ${reading.date ? `<br><small class="text-muted">Recorded: ${this.formatDateTime(reading.date)}</small>` : ''}
                        </div>
                    </div>
                `;
            });
        }

        if (hasAbnormal) {
            content = `
                <div class="urgent-flag">
                    <i class="fas fa-exclamation-triangle"></i>
                    <span class="urgent-text">ABNORMAL VALUES DETECTED</span> - Review immediately
                </div>
            ` + content;
        }

        if (!content) {
            content = '<div class="no-data-text">No assessment data available</div>';
        }

        container.innerHTML = content;
    }

    generateRecommendation() {
        const container = document.getElementById('recommendation-content');
        const conditions = this.patientData.condition?.summary || [];
        const medications = this.patientData.medicationrequest?.summary || [];
        const vitals = this.patientData.vital_signs?.summary || [];
        const observations = this.patientData.observation?.summary || [];

        let content = '';
        let priorities = [];

        // Generate recommendations based on conditions and values
        conditions.forEach(condition => {
            const recommendations = this.getConditionRecommendations(condition.name);
            priorities.push(...recommendations);
        });

        // Check for abnormal values requiring follow-up
        [...vitals, ...observations].forEach(reading => {
            const { isAbnormal, isCritical } = this.assessValue(reading.name, reading.value);
            if (isCritical) {
                priorities.unshift(`URGENT: Address critical ${reading.name} value (${reading.value})`);
            } else if (isAbnormal) {
                priorities.push(`Monitor ${reading.name} - currently ${reading.value}`);
            }
        });

        // Medication due times
        if (medications.length > 0) {
            priorities.push('Review medication administration schedule');
            priorities.push('Ensure medication compliance and monitor for side effects');
        }

        // General monitoring
        priorities.push('Continue routine vital signs monitoring');
        priorities.push('Assess pain levels and comfort measures');

        if (priorities.length > 0) {
            content += `
                <div class="sbar-item">
                    <div class="sbar-label">Priority Actions</div>
                    <div class="sbar-value">
                        <ol style="margin: 0; padding-left: 20px;">
                            ${priorities.slice(0, 6).map(p => `<li>${p}</li>`).join('')}
                        </ol>
                    </div>
                </div>
            `;
        }

        // Escalation criteria
        content += `
            <div class="sbar-item">
                <div class="sbar-label">Escalation Criteria</div>
                <div class="sbar-value">
                    Contact physician if:<br>
                    • Vital signs deteriorate<br>
                    • Patient reports increased pain/discomfort<br>
                    • New symptoms develop<br>
                    • Medication reactions occur
                </div>
            </div>
        `;

        if (!content) {
            content = '<div class="no-data-text">No specific recommendations available</div>';
        }

        container.innerHTML = content;
    }

    getConditionRecommendations(conditionName) {
        const recommendations = {
            'Hypertension': ['Monitor BP q4h', 'Ensure antihypertensive compliance'],
            'Breast Cancer': ['Monitor for chemotherapy side effects', 'Assess pain and nausea'],
            'Fractured Femur': ['URGENT: Monitor for compartment syndrome', 'Pain management priority'],
            'Migraine': ['Maintain quiet environment', 'Monitor headache severity'],
            'Asthma': ['Monitor respiratory status', 'Ensure inhaler technique'],
            'Sepsis': ['URGENT: Monitor for septic shock', 'Strict I&O monitoring'],
            'Gestational Diabetes': ['Monitor blood glucose q6h', 'Fetal monitoring if applicable'],
            'Dementia': ['Ensure safety measures', 'Monitor for confusion/agitation'],
            'Chest Pain': ['URGENT: Continuous cardiac monitoring', 'Serial ECGs'],
            'Depression': ['Suicide risk assessment', 'Monitor mood and behavior'],
            'COPD': ['Monitor oxygen saturation', 'Assess respiratory effort'],
            'TB': ['Isolation precautions', 'Monitor sputum production'],
            'CKD Stage 4': ['Monitor fluid balance', 'Prepare for dialysis discussion'],
            'Anemia': ['Monitor Hb levels', 'Assess for bleeding sources']
        };

        return recommendations[conditionName] || [`Monitor ${conditionName} symptoms`];
    }

    assessValue(name, value) {
        const criticalRanges = {
            'BP': (v) => {
                const match = v.match(/(\d+)\/(\d+)/);
                if (match) {
                    const systolic = parseInt(match[1]);
                    const diastolic = parseInt(match[2]);
                    return { 
                        isCritical: systolic > 180 || systolic < 90 || diastolic > 110 || diastolic < 60,
                        isAbnormal: systolic > 140 || diastolic > 90
                    };
                }
                return { isCritical: false, isAbnormal: false };
            },
            'Temp': (v) => {
                const temp = parseFloat(v);
                return {
                    isCritical: temp > 39.5 || temp < 35,
                    isAbnormal: temp > 38 || temp < 36
                };
            },
            'Pain': (v) => {
                const pain = parseInt(v);
                return {
                    isCritical: pain >= 8,
                    isAbnormal: pain >= 6
                };
            }
        };

        // Check if this is a known critical parameter
        for (const [key, assessFn] of Object.entries(criticalRanges)) {
            if (name.includes(key)) {
                return assessFn(value);
            }
        }

        // Default assessment for unknown values
        return { isCritical: false, isAbnormal: false };
    }

    formatAge(birthDate) {
        if (!birthDate) return 'Age unknown';
        const age = Math.floor((new Date() - new Date(birthDate)) / (365.25 * 24 * 60 * 60 * 1000));
        return `${age}y`;
    }

    formatGender(gender) {
        if (!gender) return 'Gender unknown';
        return gender.charAt(0).toUpperCase() + gender.slice(1);
    }

    formatDate(dateString) {
        if (!dateString) return 'Date unknown';
        return new Date(dateString).toLocaleDateString();
    }

    formatDateTime(dateString) {
        if (!dateString) return 'Time unknown';
        return new Date(dateString).toLocaleString();
    }
}

// Initialize the app when the page loads
document.addEventListener('DOMContentLoaded', () => {
    new SBARHandoverApp();
});