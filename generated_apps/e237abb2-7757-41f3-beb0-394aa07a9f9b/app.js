// Healthcare Conditions Dashboard Application
class HealthcareConditionsDashboard {
    constructor() {
        this.patientData = null;
        this.conditionStats = new Map();
        this.chronicConditions = ['Hypertension', 'Diabetes', 'Heart Disease', 'COPD', 'Asthma', 'Depression', 'Dementia'];
        this.init();
    }

    init() {
        // Wait for DOM to be ready
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.loadData());
        } else {
            this.loadData();
        }
    }

    loadData() {
        try {
            this.patientData = window.PATIENT_DATA;
            if (!this.patientData) {
                this.showError('No patient data available');
                return;
            }

            this.processData();
            this.renderDashboard();
        } catch (error) {
            console.error('Error loading data:', error);
            this.showError('Error loading patient data');
        }
    }

    processData() {
        if (this.patientData.patient?.id === 'all') {
            this.processAllPatientsData();
        } else {
            this.processSinglePatientData();
        }
    }

    processAllPatientsData() {
        const patients = this.patientData.patients || [];
        this.conditionStats.clear();
        
        patients.forEach(patient => {
            if (patient.data && patient.data.condition) {
                patient.data.condition.forEach(condition => {
                    const conditionName = condition.name || 'Unknown Condition';
                    if (!this.conditionStats.has(conditionName)) {
                        this.conditionStats.set(conditionName, {
                            count: 0,
                            patients: new Set(),
                            severity: condition.severity || 'moderate'
                        });
                    }
                    const stats = this.conditionStats.get(conditionName);
                    stats.count++;
                    stats.patients.add(patient.id);
                });
            }
        });
    }

    processSinglePatientData() {
        // For single patient, create minimal stats
        this.conditionStats.clear();
        const conditions = this.patientData.condition?.summary || [];
        
        conditions.forEach(condition => {
            const conditionName = condition.name || 'Unknown Condition';
            this.conditionStats.set(conditionName, {
                count: 1,
                patients: new Set([this.patientData.patient.id]),
                severity: 'moderate'
            });
        });
    }

    renderDashboard() {
        this.renderSummaryCards();
        this.renderConditionHeatmap();
        this.renderRiskStratification();
        this.renderChronicDiseasePanel();
        this.renderHealthTrends();
        this.renderPatientDetailsTable();
        this.renderInsightsPanel();
    }

    renderSummaryCards() {
        const patients = this.patientData.patient?.id === 'all' 
            ? (this.patientData.patients || [])
            : [this.patientData.patient];

        let totalConditions = 0;
        let totalMedications = 0;
        let highRiskPatients = 0;

        if (this.patientData.patient?.id === 'all') {
            patients.forEach(patient => {
                const conditions = patient.data?.condition || [];
                const medications = patient.data?.medicationrequest || [];
                
                totalConditions += conditions.length;
                totalMedications += medications.length;
                
                // Consider high-risk if multiple conditions or specific conditions
                if (conditions.length > 2 || 
                    conditions.some(c => ['Sepsis', 'Chest Pain', 'CKD Stage 4'].includes(c.name))) {
                    highRiskPatients++;
                }
            });
        } else {
            totalConditions = this.patientData.condition?.summary?.length || 0;
            totalMedications = this.patientData.medicationrequest?.summary?.length || 0;
            highRiskPatients = totalConditions > 2 ? 1 : 0;
        }

        document.getElementById('total-patients').textContent = patients.length;
        document.getElementById('total-conditions').textContent = totalConditions;
        document.getElementById('total-medications').textContent = totalMedications;
        document.getElementById('high-risk-patients').textContent = highRiskPatients;
    }

    renderConditionHeatmap() {
        const container = document.getElementById('condition-heatmap');
        
        if (this.conditionStats.size === 0) {
            container.innerHTML = this.getEmptyState('No conditions data available');
            return;
        }

        const totalPatients = this.patientData.patient?.id === 'all' 
            ? (this.patientData.patients || []).length 
            : 1;

        // Sort conditions by prevalence
        const sortedConditions = Array.from(this.conditionStats.entries())
            .sort((a, b) => b[1].count - a[1].count)
            .slice(0, 12); // Show top 12 conditions

        container.innerHTML = sortedConditions.map(([name, stats]) => {
            const percentage = ((stats.count / totalPatients) * 100).toFixed(1);
            const prevalenceClass = this.getPrevalenceClass(parseFloat(percentage));
            
            return `
                <div class="condition-tile ${prevalenceClass}" onclick="dashboard.showConditionDetails('${name}')">
                    <div class="condition-name">${name}</div>
                    <div class="condition-count">${stats.count}</div>
                    <div class="condition-percentage">${percentage}% of patients</div>
                </div>
            `;
        }).join('');
    }

    getPrevalenceClass(percentage) {
        if (percentage >= 20) return 'high-prevalence';
        if (percentage >= 10) return 'medium-prevalence';
        return 'low-prevalence';
    }

    renderRiskStratification() {
        const container = document.getElementById('risk-chart');
        
        if (this.patientData.patient?.id !== 'all') {
            container.innerHTML = this.getEmptyState('Risk stratification requires multiple patients');
            return;
        }

        const patients = this.patientData.patients || [];
        let highRisk = 0, mediumRisk = 0, lowRisk = 0;

        patients.forEach(patient => {
            const conditions = patient.data?.condition || [];
            const conditionCount = conditions.length;
            
            if (conditionCount >= 3 || conditions.some(c => ['Sepsis', 'Chest Pain', 'CKD Stage 4', 'TB'].includes(c.name))) {
                highRisk++;
            } else if (conditionCount >= 2) {
                mediumRisk++;
            } else {
                lowRisk++;
            }
        });

        container.innerHTML = `
            <div class="risk-level high-risk">
                <div class="risk-label">
                    <i class="fas fa-exclamation-triangle me-2"></i>High Risk
                </div>
                <div class="risk-count">${highRisk}</div>
            </div>
            <div class="risk-level medium-risk">
                <div class="risk-label">
                    <i class="fas fa-exclamation-circle me-2"></i>Medium Risk
                </div>
                <div class="risk-count">${mediumRisk}</div>
            </div>
            <div class="risk-level low-risk">
                <div class="risk-label">
                    <i class="fas fa-check-circle me-2"></i>Low Risk
                </div>
                <div class="risk-count">${lowRisk}</div>
            </div>
        `;
    }

    renderChronicDiseasePanel() {
        const container = document.getElementById('chronic-conditions');
        
        const chronicStats = new Map();
        
        if (this.patientData.patient?.id === 'all') {
            const patients = this.patientData.patients || [];
            patients.forEach(patient => {
                const conditions = patient.data?.condition || [];
                conditions.forEach(condition => {
                    const name = condition.name;
                    if (this.chronicConditions.some(chronic => name.toLowerCase().includes(chronic.toLowerCase()))) {
                        if (!chronicStats.has(name)) {
                            chronicStats.set(name, 0);
                        }
                        chronicStats.set(name, chronicStats.get(name) + 1);
                    }
                });
            });
        } else {
            const conditions = this.patientData.condition?.summary || [];
            conditions.forEach(condition => {
                const name = condition.name;
                if (this.chronicConditions.some(chronic => name.toLowerCase().includes(chronic.toLowerCase()))) {
                    chronicStats.set(name, 1);
                }
            });
        }

        if (chronicStats.size === 0) {
            container.innerHTML = this.getEmptyState('No chronic conditions found');
            return;
        }

        container.innerHTML = Array.from(chronicStats.entries())
            .sort((a, b) => b[1] - a[1])
            .slice(0, 6)
            .map(([name, count]) => {
                const iconClass = this.getConditionIcon(name);
                const colorClass = this.getConditionColor(name);
                
                return `
                    <div class="chronic-condition">
                        <div class="condition-info">
                            <div class="condition-icon ${colorClass}">
                                <i class="${iconClass}"></i>
                            </div>
                            <div class="condition-details">
                                <h6>${name}</h6>
                                <p>Chronic condition requiring ongoing management</p>
                            </div>
                        </div>
                        <div class="condition-stats">
                            <div class="count">${count}</div>
                            <div class="label">patients</div>
                        </div>
                    </div>
                `;
            }).join('');
    }

    getConditionIcon(condition) {
        const name = condition.toLowerCase();
        if (name.includes('hypertension') || name.includes('blood pressure')) return 'fas fa-heartbeat';
        if (name.includes('diabetes')) return 'fas fa-tint';
        if (name.includes('heart')) return 'fas fa-heart';
        if (name.includes('asthma') || name.includes('copd')) return 'fas fa-lungs';
        if (name.includes('depression')) return 'fas fa-brain';
        if (name.includes('dementia')) return 'fas fa-head-side-virus';
        return 'fas fa-stethoscope';
    }

    getConditionColor(condition) {
        const name = condition.toLowerCase();
        if (name.includes('hypertension')) return 'bg-danger';
        if (name.includes('diabetes')) return 'bg-warning';
        if (name.includes('heart')) return 'bg-danger';
        if (name.includes('asthma') || name.includes('copd')) return 'bg-info';
        if (name.includes('depression')) return 'bg-secondary';
        if (name.includes('dementia')) return 'bg-dark';
        return 'bg-primary';
    }

    renderHealthTrends() {
        const container = document.getElementById('health-trends');
        container.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-chart-line"></i>
                <h6>Trends Analysis</h6>
                <p>Historical trend data would be displayed here with time-series visualization</p>
            </div>
        `;
    }

    renderPatientDetailsTable() {
        const tbody = document.getElementById('patient-details-table');
        
        if (this.patientData.patient?.id !== 'all') {
            tbody.innerHTML = `
                <tr>
                    <td colspan="7" class="text-center text-muted">
                        Patient details table requires multiple patients view
                    </td>
                </tr>
            `;
            return;
        }

        const patients = this.patientData.patients || [];
        
        if (patients.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="7" class="text-center text-muted">No patient data available</td>
                </tr>
            `;
            return;
        }

        tbody.innerHTML = patients.slice(0, 20).map(patient => {
            const age = this.calculateAge(patient.birthDate);
            const conditions = patient.data?.condition || [];
            const medications = patient.data?.medicationrequest || [];
            const observations = patient.data?.observation || [];
            
            const primaryCondition = conditions.length > 0 ? conditions[0].name : 'None';
            const medicationCount = medications.length;
            const lastObservation = observations.length > 0 ? observations[0].name : 'None';
            
            const riskLevel = this.calculateRiskLevel(conditions);
            const riskBadge = this.getRiskBadge(riskLevel);
            
            return `
                <tr>
                    <td><strong>${patient.name}</strong></td>
                    <td>${age}</td>
                    <td><span class="text-capitalize">${patient.gender}</span></td>
                    <td>${primaryCondition}</td>
                    <td>${medicationCount} active</td>
                    <td>${lastObservation}</td>
                    <td>${riskBadge}</td>
                </tr>
            `;
        }).join('');
    }

    calculateAge(birthDate) {
        if (!birthDate) return 'Unknown';
        const birth = new Date(birthDate);
        const today = new Date();
        const age = today.getFullYear() - birth.getFullYear();
        return age;
    }

    calculateRiskLevel(conditions) {
        const conditionCount = conditions.length;
        const highRiskConditions = ['Sepsis', 'Chest Pain', 'CKD Stage 4', 'TB'];
        
        if (conditionCount >= 3 || conditions.some(c => highRiskConditions.includes(c.name))) {
            return 'high';
        } else if (conditionCount >= 2) {
            return 'medium';
        }
        return 'low';
    }

    getRiskBadge(riskLevel) {
        const badges = {
            high: '<span class="badge bg-danger">High Risk</span>',
            medium: '<span class="badge bg-warning">Medium Risk</span>',
            low: '<span class="badge bg-success">Low Risk</span>'
        };
        return badges[riskLevel] || badges.low;
    }

    renderInsightsPanel() {
        const container = document.getElementById('insights-panel');
        
        const insights = this.generateInsights();
        
        if (insights.length === 0) {
            container.innerHTML = this.getEmptyState('No actionable insights available');
            return;
        }

        container.innerHTML = insights.map(insight => `
            <div class="insight-card">
                <div class="insight-header">
                    <i class="${insight.icon} text-${insight.color}"></i>
                    <span class="insight-title">${insight.title}</span>
                </div>
                <div class="insight-content">${insight.content}</div>
            </div>
        `).join('');
    }

    generateInsights() {
        const insights = [];
        
        if (this.patientData.patient?.id === 'all') {
            const patients = this.patientData.patients || [];
            const totalPatients = patients.length;
            
            // High prevalence conditions insight
            const topCondition = Array.from(this.conditionStats.entries())
                .sort((a, b) => b[1].count - a[1].count)[0];
            
            if (topCondition) {
                const [name, stats] = topCondition;
                const percentage = ((stats.count / totalPatients) * 100).toFixed(1);
                
                insights.push({
                    icon: 'fas fa-exclamation-triangle',
                    color: 'warning',
                    title: 'High Prevalence Alert',
                    content: `${name} affects ${percentage}% of patients (${stats.count} patients). Consider population health interventions.`
                });
            }
            
            // Medication management insight
            const patientsWithMultipleMeds = patients.filter(p => 
                (p.data?.medicationrequest || []).length >= 3
            ).length;
            
            if (patientsWithMultipleMeds > 0) {
                insights.push({
                    icon: 'fas fa-pills',
                    color: 'info',
                    title: 'Medication Management',
                    content: `${patientsWithMultipleMeds} patients are on 3+ medications. Review for potential drug interactions and adherence issues.`
                });
            }
            
            // Care coordination insight
            const chronicPatients = patients.filter(p => {
                const conditions = p.data?.condition || [];
                return conditions.some(c => 
                    this.chronicConditions.some(chronic => 
                        c.name.toLowerCase().includes(chronic.toLowerCase())
                    )
                );
            }).length;
            
            if (chronicPatients > 0) {
                insights.push({
                    icon: 'fas fa-users-cog',
                    color: 'success',
                    title: 'Care Coordination Opportunity',
                    content: `${chronicPatients} patients have chronic conditions requiring coordinated care management and regular follow-ups.`
                });
            }
        } else {
            // Single patient insights
            const conditions = this.patientData.condition?.summary || [];
            const medications = this.patientData.medicationrequest?.summary || [];
            
            if (conditions.length > 0) {
                insights.push({
                    icon: 'fas fa-user-md',
                    color: 'primary',
                    title: 'Patient Care Plan',
                    content: `Patient has ${conditions.length} active condition(s). Ensure comprehensive care coordination and regular monitoring.`
                });
            }
            
            if (medications.length > 0) {
                insights.push({
                    icon: 'fas fa-prescription-bottle-alt',
                    color: 'info',
                    title: 'Medication Review',
                    content: `Patient is on ${medications.length} medication(s). Schedule regular medication review for efficacy and side effects.`
                });
            }
        }
        
        return insights;
    }

    showConditionDetails(conditionName) {
        const stats = this.conditionStats.get(conditionName);
        if (!stats) return;
        
        alert(`${conditionName}\n\nPatients affected: ${stats.count}\nPrevalence: ${((stats.count / (this.patientData.patients?.length || 1)) * 100).toFixed(1)}%`);
    }

    getEmptyState(message) {
        return `
            <div class="empty-state">
                <i class="fas fa-chart-bar"></i>
                <h6>No Data Available</h6>
                <p>${message}</p>
            </div>
        `;
    }

    showError(message) {
        document.body.innerHTML = `
            <div class="container-fluid p-4">
                <div class="alert alert-danger" role="alert">
                    <i class="fas fa-exclamation-triangle me-2"></i>
                    <strong>Error:</strong> ${message}
                </div>
            </div>
        `;
    }
}

// Initialize the dashboard
const dashboard = new HealthcareConditionsDashboard();