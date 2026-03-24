class DeliriumRiskApp {
    constructor() {
        this.patients = [];
        this.filteredPatients = [];
        this.init();
    }

    init() {
        this.loadPatientData();
        this.setupEventListeners();
        this.renderPatients();
        this.updateStats();
    }

    loadPatientData() {
        if (!window.PATIENT_DATA || !window.PATIENT_DATA.patients) {
            console.warn('No patient data available');
            return;
        }

        this.patients = window.PATIENT_DATA.patients.map(patient => {
            const riskAssessment = this.assessDeliriumRisk(patient);
            return {
                ...patient,
                riskLevel: riskAssessment.level,
                riskFactors: riskAssessment.factors,
                riskScore: riskAssessment.score,
                age: this.calculateAge(patient.birthDate)
            };
        });

        this.filteredPatients = [...this.patients];
    }

    calculateAge(birthDate) {
        if (!birthDate) return 0;
        const today = new Date();
        const birth = new Date(birthDate);
        let age = today.getFullYear() - birth.getFullYear();
        const monthDiff = today.getMonth() - birth.getMonth();
        if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
            age--;
        }
        return age;
    }

    assessDeliriumRisk(patient) {
        const factors = [];
        let score = 0;

        // Age factor (>65 years = high risk)
        if (this.calculateAge(patient.birthDate) >= 65) {
            factors.push('Advanced Age (65+)');
            score += 3;
        }

        // Check conditions for delirium risk factors
        if (patient.data && patient.data.condition) {
            patient.data.condition.forEach(condition => {
                const conditionName = condition.name?.toLowerCase() || '';
                
                if (conditionName.includes('dementia')) {
                    factors.push('Dementia');
                    score += 4;
                } else if (conditionName.includes('depression')) {
                    factors.push('Depression');
                    score += 2;
                } else if (conditionName.includes('sepsis')) {
                    factors.push('Sepsis');
                    score += 3;
                } else if (conditionName.includes('ckd') || conditionName.includes('kidney')) {
                    factors.push('Kidney Disease');
                    score += 2;
                } else if (conditionName.includes('copd')) {
                    factors.push('COPD');
                    score += 2;
                }
            });
        }

        // Check vital signs and observations for risk indicators
        if (patient.data && patient.data.observation) {
            patient.data.observation.forEach(obs => {
                const obsName = obs.name?.toLowerCase() || '';
                const obsValue = obs.value?.toLowerCase() || '';
                
                if (obsName.includes('temp') && obsValue.includes('39')) {
                    factors.push('High Fever');
                    score += 2;
                } else if (obsName.includes('mmse')) {
                    factors.push('Cognitive Impairment');
                    score += 3;
                } else if (obsName.includes('pain') && obsValue.includes('8')) {
                    factors.push('Severe Pain');
                    score += 2;
                } else if (obsName.includes('glucose') && obsValue.includes('8.5')) {
                    factors.push('Hyperglycemia');
                    score += 1;
                }
            });
        }

        // Check medications for polypharmacy risk
        if (patient.data && patient.data.medicationrequest && patient.data.medicationrequest.length > 3) {
            factors.push('Polypharmacy');
            score += 2;
        }

        // Determine risk level based on score
        let level;
        if (score >= 6) {
            level = 'high';
        } else if (score >= 3) {
            level = 'moderate';
        } else {
            level = 'low';
        }

        // Add default factors if none found
        if (factors.length === 0) {
            factors.push('No specific risk factors identified');
        }

        return { level, factors, score };
    }

    setupEventListeners() {
        document.getElementById('riskFilter').addEventListener('change', () => this.applyFilters());
        document.getElementById('ageFilter').addEventListener('change', () => this.applyFilters());
        document.getElementById('searchInput').addEventListener('input', () => this.applyFilters());
    }

    applyFilters() {
        const riskFilter = document.getElementById('riskFilter').value;
        const ageFilter = document.getElementById('ageFilter').value;
        const searchTerm = document.getElementById('searchInput').value.toLowerCase();

        this.filteredPatients = this.patients.filter(patient => {
            // Risk level filter
            if (riskFilter !== 'all' && patient.riskLevel !== riskFilter) {
                return false;
            }

            // Age filter
            if (ageFilter === 'elderly' && patient.age < 65) {
                return false;
            }
            if (ageFilter === 'adult' && (patient.age < 18 || patient.age >= 65)) {
                return false;
            }

            // Search filter
            if (searchTerm && !patient.name.toLowerCase().includes(searchTerm)) {
                return false;
            }

            return true;
        });

        this.renderPatients();
        this.updateStats();
    }

    updateStats() {
        const total = this.patients.length;
        const high = this.patients.filter(p => p.riskLevel === 'high').length;
        const moderate = this.patients.filter(p => p.riskLevel === 'moderate').length;
        const low = this.patients.filter(p => p.riskLevel === 'low').length;

        document.getElementById('totalPatients').textContent = total;
        document.getElementById('highRiskCount').textContent = high;
        document.getElementById('moderateRiskCount').textContent = moderate;
        document.getElementById('lowRiskCount').textContent = low;
    }

    renderPatients() {
        const container = document.getElementById('patientsContainer');
        const noDataContainer = document.getElementById('noDataContainer');

        if (this.filteredPatients.length === 0) {
            container.innerHTML = '';
            noDataContainer.style.display = 'block';
            return;
        }

        noDataContainer.style.display = 'none';
        
        container.innerHTML = this.filteredPatients.map(patient => `
            <div class="col-lg-6 col-xl-4">
                <div class="patient-card">
                    <div class="patient-header">
                        <div class="patient-info">
                            <h3>${patient.name || 'Unknown Patient'}</h3>
                            <div class="patient-meta">
                                <i class="fas fa-user me-1"></i>
                                ${patient.gender || 'Unknown'} • ${patient.age} years
                                <br>
                                <i class="fas fa-calendar me-1"></i>
                                DOB: ${patient.birthDate ? new Date(patient.birthDate).toLocaleDateString() : 'Unknown'}
                            </div>
                        </div>
                        <span class="risk-badge risk-${patient.riskLevel}">
                            ${patient.riskLevel.toUpperCase()} RISK
                        </span>
                    </div>

                    <div class="risk-factors">
                        <h4><i class="fas fa-exclamation-triangle me-1"></i>Risk Factors</h4>
                        <div class="factor-list">
                            ${patient.riskFactors.map(factor => `
                                <span class="factor-tag">${factor}</span>
                            `).join('')}
                        </div>
                    </div>

                    ${this.renderClinicalData(patient)}
                </div>
            </div>
        `).join('');
    }

    renderClinicalData(patient) {
        if (!patient.data) return '';

        const dataItems = [];

        // Add condition count
        if (patient.data.condition) {
            dataItems.push({
                label: 'Active Conditions',
                value: patient.data.condition.length
            });
        }

        // Add medication count
        if (patient.data.medicationrequest) {
            dataItems.push({
                label: 'Medications',
                value: patient.data.medicationrequest.length
            });
        }

        // Add recent observations
        if (patient.data.observation && patient.data.observation.length > 0) {
            const recentObs = patient.data.observation[0];
            dataItems.push({
                label: 'Latest Observation',
                value: recentObs.name || 'N/A'
            });
        }

        // Add risk score
        dataItems.push({
            label: 'Risk Score',
            value: patient.riskScore
        });

        if (dataItems.length === 0) return '';

        return `
            <div class="clinical-data">
                <div class="data-grid">
                    ${dataItems.map(item => `
                        <div class="data-item">
                            <div class="data-value">${item.value}</div>
                            <div class="data-label">${item.label}</div>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
    }
}

// Initialize the app when the DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new DeliriumRiskApp();
});