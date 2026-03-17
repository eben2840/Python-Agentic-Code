class DiabeticCancerDashboard {
    constructor() {
        this.diabeticPatients = [];
        this.cancerPatients = [];
        this.allPatients = [];
        this.init();
    }

    init() {
        this.loadPatients();
        this.renderSummaryCards();
        this.renderCharts();
        this.renderPatientsList();
        this.setupFilters();
    }

    loadPatients() {
        if (!window.PATIENT_DATA || window.PATIENT_DATA.patient.id !== 'all') {
            return;
        }

        // Filter patients with diabetes-related conditions
        this.diabeticPatients = window.PATIENT_DATA.patients.filter(patient => {
            if (!patient.data.condition) return false;
            
            return patient.data.condition.some(condition => 
                condition.name && (
                    condition.name.toLowerCase().includes('diabetes') ||
                    condition.name.toLowerCase().includes('gestational diabetes')
                )
            );
        });

        // Filter patients with cancer-related conditions
        this.cancerPatients = window.PATIENT_DATA.patients.filter(patient => {
            if (!patient.data.condition) return false;
            
            return patient.data.condition.some(condition => 
                condition.name && condition.name.toLowerCase().includes('cancer')
            );
        });

        // Combine all patients (remove duplicates if any patient has both conditions)
        const allIds = new Set();
        this.allPatients = [];
        
        [...this.diabeticPatients, ...this.cancerPatients].forEach(patient => {
            if (!allIds.has(patient.id)) {
                allIds.add(patient.id);
                this.allPatients.push(patient);
            }
        });
    }

    calculateAge(birthDate) {
        if (!birthDate) return null;
        const today = new Date();
        const birth = new Date(birthDate);
        let age = today.getFullYear() - birth.getFullYear();
        const monthDiff = today.getMonth() - birth.getMonth();
        if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
            age--;
        }
        return age;
    }

    getGlucoseValue(patient) {
        if (!patient.data.observation && !patient.data.vital_signs) return null;
        
        const observations = [...(patient.data.observation || []), ...(patient.data.vital_signs || [])];
        const glucoseObs = observations.find(obs => 
            obs.name && obs.name.toLowerCase().includes('glucose')
        );
        
        if (glucoseObs && glucoseObs.value) {
            const match = glucoseObs.value.match(/(\d+\.?\d*)/);
            return match ? parseFloat(match[1]) : null;
        }
        return null;
    }

    hasDiabetes(patient) {
        if (!patient.data.condition) return false;
        return patient.data.condition.some(condition => 
            condition.name && (
                condition.name.toLowerCase().includes('diabetes') ||
                condition.name.toLowerCase().includes('gestational diabetes')
            )
        );
    }

    hasCancer(patient) {
        if (!patient.data.condition) return false;
        return patient.data.condition.some(condition => 
            condition.name && condition.name.toLowerCase().includes('cancer')
        );
    }

    isHighRisk(patient) {
        // High risk for diabetes patients with glucose > 7.0
        if (this.hasDiabetes(patient)) {
            const glucose = this.getGlucoseValue(patient);
            if (glucose && glucose > 7.0) return true;
        }
        
        // High risk for cancer patients (all cancer patients considered high risk)
        if (this.hasCancer(patient)) {
            return true;
        }
        
        return false;
    }

    hasActiveTreatment(patient) {
        return patient.data.medicationrequest && patient.data.medicationrequest.length > 0;
    }

    renderSummaryCards() {
        const totalDiabeticPatients = this.diabeticPatients.length;
        const totalCancerPatients = this.cancerPatients.length;
        const highRiskCount = this.allPatients.filter(p => this.isHighRisk(p)).length;
        const onMedicationCount = this.allPatients.filter(p => this.hasActiveTreatment(p)).length;

        document.getElementById('totalPatients').textContent = totalDiabeticPatients;
        document.getElementById('totalCancerPatients').textContent = totalCancerPatients;
        document.getElementById('highRiskCount').textContent = highRiskCount;
        document.getElementById('onMedication').textContent = onMedicationCount;
    }

    renderCharts() {
        this.renderConditionTypesChart();
        this.renderAgeDistributionChart();
    }

    renderConditionTypesChart() {
        const container = document.getElementById('conditionTypesChart');
        
        if (this.allPatients.length === 0) {
            container.innerHTML = '<div class="no-data">No condition type data available</div>';
            return;
        }

        const types = {};
        this.allPatients.forEach(patient => {
            if (patient.data.condition) {
                patient.data.condition.forEach(condition => {
                    if (condition.name) {
                        if (condition.name.toLowerCase().includes('diabetes')) {
                            const type = condition.name.includes('Gestational') ? 'Gestational Diabetes' : 'Diabetes';
                            types[type] = (types[type] || 0) + 1;
                        } else if (condition.name.toLowerCase().includes('cancer')) {
                            const type = condition.name;
                            types[type] = (types[type] || 0) + 1;
                        }
                    }
                });
            }
        });

        const total = Object.values(types).reduce((a, b) => a + b, 0);
        const colors = ['#3b82f6', '#dc2626', '#f59e0b', '#22c55e', '#14b8a6', '#8b5cf6'];
        
        let html = '';
        Object.entries(types).forEach(([type, count], index) => {
            const percentage = ((count / total) * 100).toFixed(1);
            html += `
                <div class="chart-label">
                    <span><i class="fas fa-circle" style="color: ${colors[index % colors.length]}"></i> ${type}</span>
                    <span>${count} (${percentage}%)</span>
                </div>
                <div class="chart-bar">
                    <div class="chart-bar-fill" style="width: ${percentage}%; background-color: ${colors[index % colors.length]}"></div>
                </div>
            `;
        });

        container.innerHTML = html;
    }

    renderAgeDistributionChart() {
        const container = document.getElementById('ageDistributionChart');
        
        if (this.allPatients.length === 0) {
            container.innerHTML = '<div class="no-data">No age data available</div>';
            return;
        }

        const ageGroups = {
            '0-30': 0,
            '31-50': 0,
            '51-70': 0,
            '70+': 0
        };

        this.allPatients.forEach(patient => {
            const age = this.calculateAge(patient.birthDate);
            if (age !== null) {
                if (age <= 30) ageGroups['0-30']++;
                else if (age <= 50) ageGroups['31-50']++;
                else if (age <= 70) ageGroups['51-70']++;
                else ageGroups['70+']++;
            }
        });

        const total = Object.values(ageGroups).reduce((a, b) => a + b, 0);
        const colors = ['#3b82f6', '#22c55e', '#f59e0b', '#14b8a6'];
        
        let html = '';
        Object.entries(ageGroups).forEach(([group, count], index) => {
            const percentage = total > 0 ? ((count / total) * 100).toFixed(1) : 0;
            html += `
                <div class="chart-label">
                    <span><i class="fas fa-circle" style="color: ${colors[index]}"></i> ${group} years</span>
                    <span>${count} (${percentage}%)</span>
                </div>
                <div class="chart-bar">
                    <div class="chart-bar-fill" style="width: ${percentage}%; background-color: ${colors[index]}"></div>
                </div>
            `;
        });

        container.innerHTML = html;
    }

    renderPatientsList(filteredPatients = null) {
        const container = document.getElementById('patientsList');
        const patients = filteredPatients || this.allPatients;
        
        if (patients.length === 0) {
            container.innerHTML = '<div class="no-data">No patients found</div>';
            return;
        }

        let html = '';
        patients.forEach(patient => {
            const age = this.calculateAge(patient.birthDate);
            const glucose = this.getGlucoseValue(patient);
            const isHighRisk = this.isHighRisk(patient);
            const hasActiveTreatment = this.hasActiveTreatment(patient);
            const hasDiabetes = this.hasDiabetes(patient);
            const hasCancer = this.hasCancer(patient);
            
            // Get primary condition
            let primaryCondition = 'Unknown';
            let conditionBadgeClass = '';
            if (patient.data.condition && patient.data.condition.length > 0) {
                if (hasDiabetes) {
                    const diabetesCondition = patient.data.condition.find(c => 
                        c.name && c.name.toLowerCase().includes('diabetes')
                    );
                    primaryCondition = diabetesCondition?.name || 'Diabetes';
                    conditionBadgeClass = 'condition-diabetes';
                } else if (hasCancer) {
                    const cancerCondition = patient.data.condition.find(c => 
                        c.name && c.name.toLowerCase().includes('cancer')
                    );
                    primaryCondition = cancerCondition?.name || 'Cancer';
                    conditionBadgeClass = 'condition-cancer';
                }
            }

            html += `
                <div class="patient-item">
                    <div class="patient-header">
                        <div>
                            <div class="patient-name">${patient.name || 'Unknown'}</div>
                            <div class="patient-id">ID: ${patient.id}</div>
                        </div>
                        <div class="risk-badge ${isHighRisk ? 'risk-high' : 'risk-normal'}">
                            ${isHighRisk ? 'High Risk' : 'Normal Risk'}
                        </div>
                    </div>
                    <div class="patient-details">
                        <div class="detail-item">
                            <i class="fas fa-user detail-icon"></i>
                            <span>${patient.gender || 'Unknown'}, ${age ? `${age} years` : 'Age unknown'}</span>
                        </div>
                        <div class="detail-item">
                            <i class="fas fa-heartbeat detail-icon"></i>
                            <span>Condition: <span class="condition-badge ${conditionBadgeClass}">${primaryCondition}</span></span>
                        </div>
                        ${glucose ? `
                        <div class="detail-item">
                            <i class="fas fa-tint detail-icon"></i>
                            <span>Glucose: <span class="glucose-value ${glucose > 7.0 ? 'glucose-high' : 'glucose-normal'}">${glucose} mmol/L</span></span>
                        </div>
                        ` : ''}
                        <div class="detail-item">
                            <i class="fas fa-pills detail-icon"></i>
                            <span>Treatment: ${hasActiveTreatment ? 'Active' : 'None recorded'}</span>
                        </div>
                    </div>
                </div>
            `;
        });

        container.innerHTML = html;
    }

    setupFilters() {
        const conditionFilter = document.getElementById('conditionFilter');
        const riskFilter = document.getElementById('riskFilter');

        const applyFilters = () => {
            const conditionValue = conditionFilter.value;
            const riskValue = riskFilter.value;
            
            let filteredPatients = this.allPatients;

            // Filter by condition type
            if (conditionValue === 'diabetes') {
                filteredPatients = this.diabeticPatients;
            } else if (conditionValue === 'cancer') {
                filteredPatients = this.cancerPatients;
            }

            // Filter by risk level
            if (riskValue === 'high') {
                filteredPatients = filteredPatients.filter(p => this.isHighRisk(p));
            } else if (riskValue === 'normal') {
                filteredPatients = filteredPatients.filter(p => !this.isHighRisk(p));
            }

            this.renderPatientsList(filteredPatients);
        };

        conditionFilter.addEventListener('change', applyFilters);
        riskFilter.addEventListener('change', applyFilters);
    }
}

// Initialize dashboard when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new DiabeticCancerDashboard();
});