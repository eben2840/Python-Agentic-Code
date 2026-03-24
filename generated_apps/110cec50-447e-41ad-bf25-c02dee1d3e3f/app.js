class WardRiskDashboard {
    constructor() {
        this.wardData = new Map();
        this.highRiskConditions = new Set([
            'sepsis', 'chest pain', 'breast cancer', 'fractured femur', 
            'copd', 'ckd stage 4', 'tb', 'dementia', 'depression'
        ]);
        this.init();
    }

    init() {
        if (typeof window.PATIENT_DATA === 'undefined') {
            this.showNoData();
            return;
        }

        this.processPatientData();
        this.renderDashboard();
    }

    processPatientData() {
        const data = window.PATIENT_DATA;
        
        if (!data.patients || !Array.isArray(data.patients)) {
            return;
        }

        data.patients.forEach(patient => {
            if (!patient.data) return;

            // Get patient's ward from locations
            let ward = 'General Ward';
            if (patient.data.locations && Array.isArray(patient.data.locations)) {
                const location = patient.data.locations[0];
                if (location && location.value) {
                    ward = location.value;
                }
            }

            // Check if patient has high-risk conditions
            const patientConditions = this.getPatientConditions(patient);
            const hasHighRiskCondition = patientConditions.some(condition => 
                this.isHighRiskCondition(condition.name)
            );

            if (hasHighRiskCondition) {
                if (!this.wardData.has(ward)) {
                    this.wardData.set(ward, {
                        name: ward,
                        patients: [],
                        totalSeverity: 0,
                        conditionCount: 0
                    });
                }

                const wardInfo = this.wardData.get(ward);
                const patientRiskData = this.calculatePatientRisk(patient, patientConditions);
                
                wardInfo.patients.push(patientRiskData);
                wardInfo.totalSeverity += patientRiskData.averageSeverity;
                wardInfo.conditionCount += patientConditions.length;
            }
        });
    }

    getPatientConditions(patient) {
        const conditions = [];
        
        if (patient.data.condition && Array.isArray(patient.data.condition)) {
            patient.data.condition.forEach(condition => {
                conditions.push({
                    name: condition.name || 'Unknown Condition',
                    status: condition.status || '',
                    date: condition.date || ''
                });
            });
        }

        return conditions;
    }

    isHighRiskCondition(conditionName) {
        if (!conditionName) return false;
        const normalized = conditionName.toLowerCase().trim();
        return Array.from(this.highRiskConditions).some(riskCondition => 
            normalized.includes(riskCondition)
        );
    }

    calculatePatientRisk(patient, conditions) {
        const severityMap = {
            'sepsis': 95,
            'chest pain': 85,
            'breast cancer': 80,
            'fractured femur': 75,
            'copd': 70,
            'ckd stage 4': 85,
            'tb': 75,
            'dementia': 65,
            'depression': 60,
            'hypertension': 45,
            'migraine': 35,
            'asthma': 40,
            'gestational diabetes': 50,
            'psoriasis': 25,
            'ulcerative colitis': 55,
            'hypothyroidism': 30,
            'ra': 60,
            'anemia': 45,
            'glaucoma': 40,
            'tonsillitis': 20
        };

        const conditionsWithSeverity = conditions.map(condition => {
            const normalized = condition.name.toLowerCase().trim();
            let severity = 30; // default

            for (const [key, value] of Object.entries(severityMap)) {
                if (normalized.includes(key)) {
                    severity = value;
                    break;
                }
            }

            return {
                ...condition,
                severity
            };
        });

        const totalSeverity = conditionsWithSeverity.reduce((sum, c) => sum + c.severity, 0);
        const averageSeverity = conditions.length > 0 ? Math.round(totalSeverity / conditions.length) : 0;

        let riskLevel = 'moderate';
        if (averageSeverity >= 80) riskLevel = 'critical';
        else if (averageSeverity >= 60) riskLevel = 'high';

        return {
            id: patient.id,
            name: patient.name || 'Unknown Patient',
            gender: patient.gender || 'Unknown',
            birthDate: patient.birthDate || '',
            conditions: conditionsWithSeverity,
            averageSeverity,
            riskLevel
        };
    }

    renderDashboard() {
        this.updateStats();
        this.renderWards();
    }

    updateStats() {
        const totalWards = this.wardData.size;
        const totalHighRiskPatients = Array.from(this.wardData.values())
            .reduce((sum, ward) => sum + ward.patients.length, 0);
        
        const totalSeverity = Array.from(this.wardData.values())
            .reduce((sum, ward) => sum + ward.totalSeverity, 0);
        const avgSeverity = totalHighRiskPatients > 0 ? 
            Math.round(totalSeverity / totalHighRiskPatients) : 0;

        document.getElementById('total-wards').textContent = totalWards;
        document.getElementById('high-risk-patients').textContent = totalHighRiskPatients;
        document.getElementById('avg-severity').textContent = `${avgSeverity}%`;
    }

    renderWards() {
        const container = document.getElementById('wards-container');
        
        if (this.wardData.size === 0) {
            container.innerHTML = `
                <div class="no-data">
                    <i class="fas fa-hospital-alt"></i>
                    <h3>No High-Risk Patients Found</h3>
                    <p>No patients with high-risk conditions were found in any wards.</p>
                </div>
            `;
            return;
        }

        const wardsArray = Array.from(this.wardData.values())
            .sort((a, b) => b.totalSeverity / b.patients.length - a.totalSeverity / a.patients.length);

        container.innerHTML = wardsArray.map(ward => this.renderWardCard(ward)).join('');
    }

    renderWardCard(ward) {
        const avgSeverity = Math.round(ward.totalSeverity / ward.patients.length);
        const criticalCount = ward.patients.filter(p => p.riskLevel === 'critical').length;
        const highCount = ward.patients.filter(p => p.riskLevel === 'high').length;

        return `
            <div class="ward-card">
                <div class="ward-header">
                    <div class="ward-title">
                        <i class="fas fa-building"></i>
                        <h3>${ward.name}</h3>
                    </div>
                    <div class="ward-stats">
                        <div class="ward-stat">
                            <div class="ward-stat-number">${ward.patients.length}</div>
                            <div class="ward-stat-label">High-Risk Patients</div>
                        </div>
                        <div class="ward-stat">
                            <div class="ward-stat-number">${avgSeverity}%</div>
                            <div class="ward-stat-label">Avg Severity</div>
                        </div>
                        <div class="ward-stat">
                            <div class="ward-stat-number">${criticalCount + highCount}</div>
                            <div class="ward-stat-label">Critical/High</div>
                        </div>
                    </div>
                </div>
                <div class="patients-grid">
                    ${ward.patients.map(patient => this.renderPatientCard(patient)).join('')}
                </div>
            </div>
        `;
    }

    renderPatientCard(patient) {
        const age = this.calculateAge(patient.birthDate);
        
        return `
            <div class="patient-card">
                <div class="patient-header">
                    <div class="patient-info">
                        <h4>${patient.name}</h4>
                        <div class="patient-meta">
                            ${patient.gender} • Age ${age} • ${patient.conditions.length} condition${patient.conditions.length !== 1 ? 's' : ''}
                        </div>
                    </div>
                    <div class="risk-badge risk-${patient.riskLevel}">
                        ${patient.riskLevel} Risk
                    </div>
                </div>
                <div class="conditions-list">
                    ${patient.conditions.map(condition => this.renderConditionItem(condition)).join('')}
                </div>
            </div>
        `;
    }

    renderConditionItem(condition) {
        const severityClass = this.getSeverityClass(condition.severity);
        
        return `
            <div class="condition-item">
                <div class="condition-name">${condition.name}</div>
                <div class="severity-indicator">
                    <div class="severity-bar">
                        <div class="severity-fill ${severityClass}" style="width: ${condition.severity}%"></div>
                    </div>
                    <div class="severity-percentage">${condition.severity}%</div>
                </div>
            </div>
        `;
    }

    getSeverityClass(severity) {
        if (severity >= 80) return 'critical';
        if (severity >= 60) return 'high';
        if (severity >= 40) return 'moderate';
        return 'low';
    }

    calculateAge(birthDate) {
        if (!birthDate) return 'Unknown';
        
        const birth = new Date(birthDate);
        const today = new Date();
        let age = today.getFullYear() - birth.getFullYear();
        const monthDiff = today.getMonth() - birth.getMonth();
        
        if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
            age--;
        }
        
        return age;
    }

    showNoData() {
        document.getElementById('wards-container').innerHTML = `
            <div class="no-data">
                <i class="fas fa-exclamation-circle"></i>
                <h3>No Patient Data Available</h3>
                <p>Unable to load patient data for ward risk assessment.</p>
            </div>
        `;
    }
}

// Initialize the dashboard when the page loads
document.addEventListener('DOMContentLoaded', () => {
    new WardRiskDashboard();
});