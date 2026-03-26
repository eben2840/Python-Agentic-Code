class RiskAssessment {
    constructor() {
        this.patients = [];
        this.riskCategories = {
            critical: [],
            highRisk: [],
            moderateRisk: [],
            lowRisk: []
        };
        this.currentFilter = 'all';
        this.init();
    }

    init() {
        this.loadPatientData();
        this.assessRisks();
        this.renderStatistics();
        this.renderPatients();
        this.renderRiskAnalysis();
        this.setupEventListeners();
    }

    loadPatientData() {
        if (!window.PATIENT_DATA) {
            console.error('Patient data not available');
            return;
        }

        const data = window.PATIENT_DATA;
        
        if (data.patient && data.patient.id === 'all' && data.patients) {
            this.patients = data.patients.map(patient => ({
                id: patient.id,
                name: patient.name || 'Unknown Patient',
                gender: patient.gender || 'Unknown',
                birthDate: patient.birthDate || 'Unknown',
                age: this.calculateAge(patient.birthDate),
                conditions: this.extractConditions(patient.data),
                observations: this.extractObservations(patient.data),
                medications: this.extractMedications(patient.data),
                encounters: this.extractEncounters(patient.data)
            }));
        } else {
            // Single patient
            this.patients = [{
                id: data.patient?.id || 'unknown',
                name: data.patient?.name || 'Unknown Patient',
                gender: data.patient?.gender || 'Unknown',
                birthDate: data.patient?.birthDate || 'Unknown',
                age: this.calculateAge(data.patient?.birthDate),
                conditions: this.extractConditions(data),
                observations: this.extractObservations(data),
                medications: this.extractMedications(data),
                encounters: this.extractEncounters(data)
            }];
        }
    }

    extractConditions(patientData) {
        const conditions = [];
        if (patientData && patientData.condition) {
            patientData.condition.forEach(cond => {
                conditions.push({
                    name: cond.name || 'Unknown Condition',
                    status: cond.status || 'Active',
                    date: cond.date || 'Unknown Date'
                });
            });
        }
        return conditions;
    }

    extractObservations(patientData) {
        const observations = [];
        if (patientData && patientData.observation) {
            patientData.observation.forEach(obs => {
                observations.push({
                    name: obs.name || 'Unknown Observation',
                    value: obs.value || 'No Value',
                    date: obs.date || 'Unknown Date'
                });
            });
        }
        if (patientData && patientData.vital_signs) {
            patientData.vital_signs.forEach(vital => {
                observations.push({
                    name: vital.name || 'Unknown Vital',
                    value: vital.value || 'No Value',
                    date: vital.date || 'Unknown Date'
                });
            });
        }
        return observations;
    }

    extractMedications(patientData) {
        const medications = [];
        if (patientData && patientData.medicationrequest) {
            patientData.medicationrequest.forEach(med => {
                medications.push({
                    name: med.name || 'Unknown Medication',
                    dosage: med.value || 'Unknown Dosage',
                    date: med.date || 'Unknown Date'
                });
            });
        }
        return medications;
    }

    extractEncounters(patientData) {
        const encounters = [];
        if (patientData && patientData.encounter) {
            patientData.encounter.forEach(enc => {
                encounters.push({
                    type: enc.name || 'Unknown Encounter',
                    date: enc.date || 'Unknown Date'
                });
            });
        }
        return encounters;
    }

    calculateAge(birthDate) {
        if (!birthDate || birthDate === 'Unknown') return 'Unknown';
        const birth = new Date(birthDate);
        const today = new Date();
        const age = today.getFullYear() - birth.getFullYear();
        return age;
    }

    assessRisks() {
        this.patients.forEach(patient => {
            const riskScore = this.calculateRiskScore(patient);
            patient.riskScore = riskScore;
            patient.riskLevel = this.getRiskLevel(riskScore);
            patient.riskPercentage = Math.min(100, Math.max(0, riskScore));
            
            // Categorize patients
            switch(patient.riskLevel) {
                case 'critical':
                    this.riskCategories.critical.push(patient);
                    break;
                case 'high-risk':
                    this.riskCategories.highRisk.push(patient);
                    break;
                case 'moderate-risk':
                    this.riskCategories.moderateRisk.push(patient);
                    break;
                default:
                    this.riskCategories.lowRisk.push(patient);
            }
        });
    }

    calculateRiskScore(patient) {
        let score = 0;
        
        // Age factor
        const age = parseInt(patient.age);
        if (!isNaN(age)) {
            if (age > 80) score += 30;
            else if (age > 65) score += 20;
            else if (age > 50) score += 10;
        }

        // Condition-based risk scoring
        const criticalConditions = [
            'sepsis', 'cancer', 'breast cancer', 'dementia', 'copd', 'ckd stage 4', 
            'tuberculosis', 'tb', 'chest pain', 'fractured femur'
        ];
        
        const highRiskConditions = [
            'hypertension', 'diabetes', 'gestational diabetes', 'depression', 
            'ulcerative colitis', 'rheumatoid arthritis', 'ra'
        ];

        patient.conditions.forEach(condition => {
            const conditionName = condition.name.toLowerCase();
            if (criticalConditions.some(crit => conditionName.includes(crit))) {
                score += 40;
            } else if (highRiskConditions.some(high => conditionName.includes(high))) {
                score += 25;
            } else {
                score += 15;
            }
        });

        // Observation-based risk factors
        patient.observations.forEach(obs => {
            const obsName = obs.name.toLowerCase();
            const obsValue = obs.value.toLowerCase();
            
            if (obsName.includes('temp') && obsValue.includes('39')) score += 20;
            if (obsName.includes('bp') && obsValue.includes('140')) score += 15;
            if (obsName.includes('pain') && obsValue.includes('8')) score += 15;
            if (obsName.includes('glucose') && obsValue.includes('8.5')) score += 15;
            if (obsName.includes('egfr') && obsValue.includes('22')) score += 25;
            if (obsName.includes('phq') && obsValue.includes('15')) score += 20;
        });

        // Multiple conditions increase risk
        if (patient.conditions.length > 2) score += 15;
        if (patient.conditions.length > 4) score += 25;

        return Math.min(100, score);
    }

    getRiskLevel(score) {
        if (score >= 80) return 'critical';
        if (score >= 60) return 'high-risk';
        if (score >= 40) return 'moderate-risk';
        return 'low-risk';
    }

    renderStatistics() {
        document.getElementById('criticalCount').textContent = this.riskCategories.critical.length;
        document.getElementById('highRiskCount').textContent = this.riskCategories.highRisk.length;
        document.getElementById('moderateRiskCount').textContent = this.riskCategories.moderateRisk.length;
        document.getElementById('lowRiskCount').textContent = this.riskCategories.lowRisk.length;
    }

    renderPatients() {
        const container = document.getElementById('patientsContainer');
        if (!container) return;

        let patientsToShow = this.patients;
        
        if (this.currentFilter !== 'all') {
            patientsToShow = this.patients.filter(patient => {
                switch(this.currentFilter) {
                    case 'critical': return patient.riskLevel === 'critical';
                    case 'high': return patient.riskLevel === 'high-risk';
                    default: return true;
                }
            });
        }

        if (patientsToShow.length === 0) {
            container.innerHTML = '<div class="col-12"><p class="text-center text-muted">No data available</p></div>';
            return;
        }

        container.innerHTML = patientsToShow.map(patient => `
            <div class="col-lg-6 col-xl-4">
                <div class="patient-card ${patient.riskLevel}">
                    <div class="risk-badge ${patient.riskLevel}">
                        ${patient.riskLevel.replace('-', ' ')}
                    </div>
                    
                    <div class="patient-header">
                        <div class="patient-name">
                            <i class="fas fa-user me-2"></i>${patient.name}
                        </div>
                        <div class="patient-info">
                            ${patient.gender} • Age: ${patient.age} • ID: ${patient.id}
                        </div>
                    </div>

                    <div class="condition-list">
                        <h6><i class="fas fa-stethoscope me-2"></i>Conditions:</h6>
                        ${patient.conditions.length > 0 ? 
                            patient.conditions.map(condition => `
                                <div class="condition-item">
                                    <span class="condition-name">${condition.name}</span>
                                    <span class="condition-date">${this.formatDate(condition.date)}</span>
                                </div>
                            `).join('') : 
                            '<div class="condition-item"><span class="condition-name">No conditions recorded</span></div>'
                        }
                    </div>

                    ${patient.observations.length > 0 ? `
                        <div class="observations-section">
                            <h6><i class="fas fa-chart-line me-2"></i>Latest Observations:</h6>
                            ${patient.observations.slice(0, 3).map(obs => `
                                <div class="observation-item">
                                    <span class="observation-value">${obs.name}:</span> ${obs.value}
                                </div>
                            `).join('')}
                        </div>
                    ` : ''}

                    <div class="risk-percentage">
                        <div class="risk-circle ${patient.riskLevel}">
                            ${patient.riskPercentage}%
                        </div>
                        <div class="risk-label">Risk Score</div>
                    </div>
                </div>
            </div>
        `).join('');
    }

    renderRiskAnalysis() {
        const container = document.getElementById('riskAnalysis');
        if (!container) return;

        const totalPatients = this.patients.length;
        if (totalPatients === 0) {
            container.innerHTML = '<p class="text-center text-muted">No data available</p>';
            return;
        }

        const analysisData = [
            {
                label: 'Critical Risk',
                count: this.riskCategories.critical.length,
                percentage: Math.round((this.riskCategories.critical.length / totalPatients) * 100),
                color: '#dc3545',
                icon: 'fas fa-exclamation-triangle'
            },
            {
                label: 'High Risk',
                count: this.riskCategories.highRisk.length,
                percentage: Math.round((this.riskCategories.highRisk.length / totalPatients) * 100),
                color: '#fd7e14',
                icon: 'fas fa-exclamation-circle'
            },
            {
                label: 'Moderate Risk',
                count: this.riskCategories.moderateRisk.length,
                percentage: Math.round((this.riskCategories.moderateRisk.length / totalPatients) * 100),
                color: '#0dcaf0',
                icon: 'fas fa-info-circle'
            },
            {
                label: 'Low Risk',
                count: this.riskCategories.lowRisk.length,
                percentage: Math.round((this.riskCategories.lowRisk.length / totalPatients) * 100),
                color: '#198754',
                icon: 'fas fa-check-circle'
            }
        ];

        container.innerHTML = analysisData.map(item => `
            <div class="analysis-item">
                <div class="analysis-chart" style="background: ${item.color};">
                    <i class="${item.icon}"></i>
                </div>
                <h4>${item.percentage}%</h4>
                <p class="mb-1">${item.label}</p>
                <small class="text-muted">${item.count} of ${totalPatients} patients</small>
            </div>
        `).join('');
    }

    setupEventListeners() {
        // Filter buttons
        document.getElementById('allFilter')?.addEventListener('click', () => {
            this.setFilter('all');
        });
        
        document.getElementById('criticalFilter')?.addEventListener('click', () => {
            this.setFilter('critical');
        });
        
        document.getElementById('highFilter')?.addEventListener('click', () => {
            this.setFilter('high');
        });
    }

    setFilter(filter) {
        this.currentFilter = filter;
        
        // Update button states
        document.querySelectorAll('.btn-group .btn').forEach(btn => {
            btn.classList.remove('active');
        });
        
        const activeButton = filter === 'all' ? 'allFilter' : 
                           filter === 'critical' ? 'criticalFilter' : 'highFilter';
        document.getElementById(activeButton)?.classList.add('active');
        
        this.renderPatients();
    }

    formatDate(dateString) {
        if (!dateString || dateString === 'Unknown Date') return 'Unknown';
        try {
            const date = new Date(dateString);
            return date.toLocaleDateString();
        } catch (e) {
            return dateString;
        }
    }
}

// Initialize the application when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new RiskAssessment();
});