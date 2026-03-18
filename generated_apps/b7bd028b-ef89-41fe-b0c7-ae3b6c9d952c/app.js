// SmartCare Lagerungsassistent - Intelligente Dekubitusprophylaxe
class DecubitusPreventionApp {
    constructor() {
        this.patientData = window.PATIENT_DATA || null;
        this.currentFilter = 'all';
        this.riskFactors = {
            // Conditions that increase decubitus risk
            'Diabetes': 3,
            'Hypertension': 1,
            'Sepsis': 4,
            'Anemia': 2,
            'COPD': 2,
            'CKD': 3,
            'Dementia': 4,
            'Depression': 2,
            'Fractured Femur': 5,
            'Breast Cancer': 3,
            'RA': 2,
            'TB': 3,
            'Ulcerative Colitis': 2,
            'Hypothyroidism': 1,
            'Psoriasis': 1,
            'Migraine': 1,
            'Asthma': 1,
            'Glaucoma': 1,
            'Tonsillitis': 1,
            'Chest Pain': 2,
            'Gestational Diabetes': 2
        };
        
        this.init();
    }

    init() {
        this.loadPatients();
        this.updateDashboardStats();
        this.generateAlerts();
        this.bindEvents();
    }

    bindEvents() {
        // Refresh button
        document.getElementById('refreshBtn')?.addEventListener('click', () => {
            this.loadPatients();
            this.updateDashboardStats();
            this.generateAlerts();
        });

        // Filter dropdown
        document.querySelectorAll('[data-filter]').forEach(item => {
            item.addEventListener('click', (e) => {
                e.preventDefault();
                this.currentFilter = e.target.dataset.filter;
                this.loadPatients();
                this.updateDashboardStats();
            });
        });
    }

    calculateRiskScore(patient) {
        let riskScore = 0;
        let riskFactors = [];

        // Age factor
        if (patient.birthDate) {
            const age = this.calculateAge(patient.birthDate);
            if (age > 65) riskScore += 2;
            if (age > 80) riskScore += 3;
        }

        // Condition-based risk
        if (patient.data?.condition) {
            patient.data.condition.forEach(condition => {
                const conditionName = condition.name || '';
                Object.keys(this.riskFactors).forEach(riskCondition => {
                    if (conditionName.includes(riskCondition)) {
                        riskScore += this.riskFactors[riskCondition];
                        riskFactors.push(riskCondition);
                    }
                });
            });
        }

        // Vital signs risk factors
        if (patient.data?.vital_signs) {
            patient.data.vital_signs.forEach(vital => {
                const vitalName = vital.name || '';
                if (vitalName.includes('Temp') && vitalName.includes('39')) {
                    riskScore += 2; // Fever increases risk
                }
                if (vitalName.includes('BP') && vitalName.includes('140')) {
                    riskScore += 1; // High BP
                }
            });
        }

        return {
            score: Math.min(riskScore, 10), // Cap at 10
            factors: riskFactors
        };
    }

    getRiskLevel(score) {
        if (score >= 7) return 'high';
        if (score >= 4) return 'medium';
        return 'low';
    }

    getRiskLevelText(level) {
        const levels = {
            'high': 'Hohes Risiko',
            'medium': 'Mittleres Risiko',
            'low': 'Niedriges Risiko'
        };
        return levels[level] || 'Unbekannt';
    }

    calculateAge(birthDate) {
        const birth = new Date(birthDate);
        const today = new Date();
        let age = today.getFullYear() - birth.getFullYear();
        const monthDiff = today.getMonth() - birth.getMonth();
        if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
            age--;
        }
        return age;
    }

    formatDate(dateString) {
        if (!dateString) return 'Nicht verfügbar';
        const date = new Date(dateString);
        return date.toLocaleDateString('de-DE');
    }

    getPatientInitials(name) {
        if (!name) return '?';
        return name.split(' ').map(n => n[0]).join('').toUpperCase();
    }

    loadPatients() {
        const patientListEl = document.getElementById('patientList');
        if (!patientListEl) return;

        if (!this.patientData) {
            patientListEl.innerHTML = '<div class="p-4 text-center text-muted">Keine Patientendaten verfügbar</div>';
            return;
        }

        let patients = [];

        if (this.patientData.patient?.id === 'all' && this.patientData.patients) {
            patients = this.patientData.patients;
        } else if (this.patientData.patient?.id !== 'all') {
            patients = [this.patientData.patient];
        }

        if (patients.length === 0) {
            patientListEl.innerHTML = '<div class="p-4 text-center text-muted">Keine Patienten gefunden</div>';
            return;
        }

        // Calculate risk scores and filter
        const patientsWithRisk = patients.map(patient => {
            const risk = this.calculateRiskScore(patient);
            return {
                ...patient,
                riskScore: risk.score,
                riskLevel: this.getRiskLevel(risk.score),
                riskFactors: risk.factors
            };
        }).filter(patient => {
            if (this.currentFilter === 'all') return true;
            return patient.riskLevel === this.currentFilter;
        }).sort((a, b) => b.riskScore - a.riskScore); // Sort by risk score descending

        if (patientsWithRisk.length === 0) {
            patientListEl.innerHTML = '<div class="p-4 text-center text-muted">Keine Patienten für den gewählten Filter gefunden</div>';
            return;
        }

        const patientsHtml = patientsWithRisk.map(patient => {
            const age = patient.birthDate ? this.calculateAge(patient.birthDate) : 'Unbekannt';
            const conditions = patient.data?.condition?.map(c => c.name).join(', ') || 'Keine Diagnosen';
            const lastVital = patient.data?.vital_signs?.[0]?.name || 'Keine Vitalwerte';
            
            return `
                <div class="patient-item" onclick="app.showPatientDetails('${patient.id}')">
                    <div class="d-flex align-items-center">
                        <div class="patient-avatar me-3">
                            ${this.getPatientInitials(patient.name)}
                        </div>
                        <div class="flex-grow-1">
                            <div class="d-flex justify-content-between align-items-start mb-1">
                                <h6 class="mb-0 fw-semibold">${patient.name || 'Unbekannt'}</h6>
                                <div class="d-flex align-items-center gap-2">
                                    <span class="risk-score ${patient.riskLevel}">${patient.riskScore}</span>
                                    <span class="risk-badge risk-${patient.riskLevel}">
                                        ${this.getRiskLevelText(patient.riskLevel)}
                                    </span>
                                </div>
                            </div>
                            <div class="row g-2 text-muted small">
                                <div class="col-md-4">
                                    <i class="fas fa-user-circle me-1"></i>
                                    ${patient.gender === 'male' ? 'Männlich' : patient.gender === 'female' ? 'Weiblich' : 'Unbekannt'}, ${age} Jahre
                                </div>
                                <div class="col-md-4">
                                    <i class="fas fa-stethoscope me-1"></i>
                                    ${conditions.length > 30 ? conditions.substring(0, 30) + '...' : conditions}
                                </div>
                                <div class="col-md-4">
                                    <i class="fas fa-heartbeat me-1"></i>
                                    ${lastVital.length > 25 ? lastVital.substring(0, 25) + '...' : lastVital}
                                </div>
                            </div>
                            ${patient.riskFactors.length > 0 ? `
                                <div class="mt-2">
                                    <small class="text-muted">Risikofaktoren: </small>
                                    ${patient.riskFactors.slice(0, 3).map(factor => 
                                        `<span class="badge bg-light text-dark me-1">${factor}</span>`
                                    ).join('')}
                                    ${patient.riskFactors.length > 3 ? `<span class="badge bg-light text-muted">+${patient.riskFactors.length - 3}</span>` : ''}
                                </div>
                            ` : ''}
                        </div>
                    </div>
                </div>
            `;
        }).join('');

        patientListEl.innerHTML = patientsHtml;
    }

    updateDashboardStats() {
        if (!this.patientData) return;

        let patients = [];
        if (this.patientData.patient?.id === 'all' && this.patientData.patients) {
            patients = this.patientData.patients;
        } else if (this.patientData.patient?.id !== 'all') {
            patients = [this.patientData.patient];
        }

        const patientsWithRisk = patients.map(patient => {
            const risk = this.calculateRiskScore(patient);
            return {
                ...patient,
                riskLevel: this.getRiskLevel(risk.score)
            };
        });

        const highRisk = patientsWithRisk.filter(p => p.riskLevel === 'high').length;
        const mediumRisk = patientsWithRisk.filter(p => p.riskLevel === 'medium').length;
        const lowRisk = patientsWithRisk.filter(p => p.riskLevel === 'low').length;
        const alerts = highRisk * 2 + mediumRisk; // Generate alerts based on risk

        document.getElementById('highRiskCount').textContent = highRisk;
        document.getElementById('mediumRiskCount').textContent = mediumRisk;
        document.getElementById('lowRiskCount').textContent = lowRisk;
        document.getElementById('alertCount').textContent = alerts;
    }

    generateAlerts() {
        const alertsListEl = document.getElementById('alertsList');
        if (!alertsListEl) return;

        if (!this.patientData) {
            alertsListEl.innerHTML = '<div class="text-muted small">Keine Alerts verfügbar</div>';
            return;
        }

        let patients = [];
        if (this.patientData.patient?.id === 'all' && this.patientData.patients) {
            patients = this.patientData.patients;
        } else if (this.patientData.patient?.id !== 'all') {
            patients = [this.patientData.patient];
        }

        const alerts = [];
        
        patients.forEach(patient => {
            const risk = this.calculateRiskScore(patient);
            const riskLevel = this.getRiskLevel(risk.score);
            
            if (riskLevel === 'high') {
                alerts.push({
                    type: 'urgent',
                    icon: 'fas fa-exclamation-triangle',
                    message: `${patient.name || 'Unbekannt'}: Lagerungswechsel überfällig`,
                    time: '15 Min'
                });
                
                alerts.push({
                    type: 'urgent',
                    icon: 'fas fa-bed',
                    message: `${patient.name || 'Unbekannt'}: Kritisches Dekubitus-Risiko`,
                    time: 'Jetzt'
                });
            } else if (riskLevel === 'medium') {
                alerts.push({
                    type: 'warning',
                    icon: 'fas fa-clock',
                    message: `${patient.name || 'Unbekannt'}: Nächste Lagerung in 30 Min`,
                    time: '30 Min'
                });
            }
        });

        // Add some general alerts
        alerts.push({
            type: 'info',
            icon: 'fas fa-chart-line',
            message: 'Wöchentlicher Risiko-Report verfügbar',
            time: '2 Std'
        });

        if (alerts.length === 0) {
            alertsListEl.innerHTML = '<div class="text-muted small">Keine aktiven Alerts</div>';
            return;
        }

        const alertsHtml = alerts.slice(0, 5).map(alert => `
            <div class="alert-item ${alert.type}">
                <div class="d-flex align-items-start">
                    <i class="${alert.icon} me-2 mt-1"></i>
                    <div class="flex-grow-1">
                        <div class="fw-medium">${alert.message}</div>
                        <div class="alert-time">vor ${alert.time}</div>
                    </div>
                </div>
            </div>
        `).join('');

        alertsListEl.innerHTML = alertsHtml;
    }

    showPatientDetails(patientId) {
        if (!this.patientData) return;

        let patient = null;
        if (this.patientData.patient?.id === 'all' && this.patientData.patients) {
            patient = this.patientData.patients.find(p => p.id === patientId);
        } else if (this.patientData.patient?.id === patientId) {
            patient = this.patientData.patient;
        }

        if (!patient) return;

        const risk = this.calculateRiskScore(patient);
        const riskLevel = this.getRiskLevel(risk.score);
        const age = patient.birthDate ? this.calculateAge(patient.birthDate) : 'Unbekannt';

        const detailsHtml = `
            <div class="detail-section">
                <h6>Patienteninformationen</h6>
                <div class="detail-item">
                    <span class="detail-label">Name:</span>
                    <span class="detail-value">${patient.name || 'Unbekannt'}</span>
                </div>
                <div class="detail-item">
                    <span class="detail-label">Geschlecht:</span>
                    <span class="detail-value">${patient.gender === 'male' ? 'Männlich' : patient.gender === 'female' ? 'Weiblich' : 'Unbekannt'}</span>
                </div>
                <div class="detail-item">
                    <span class="detail-label">Alter:</span>
                    <span class="detail-value">${age} Jahre</span>
                </div>
                <div class="detail-item">
                    <span class="detail-label">Geburtsdatum:</span>
                    <span class="detail-value">${this.formatDate(patient.birthDate)}</span>
                </div>
            </div>

            <div class="detail-section">
                <h6>Dekubitus-Risikobewertung</h6>
                <div class="detail-item">
                    <span class="detail-label">Risiko-Score:</span>
                    <span class="detail-value">
                        <span class="risk-score ${riskLevel}">${risk.score}/10</span>
                        <span class="risk-badge risk-${riskLevel} ms-2">${this.getRiskLevelText(riskLevel)}</span>
                    </span>
                </div>
                <div class="detail-item">
                    <span class="detail-label">Risikofaktoren:</span>
                    <span class="detail-value">
                        ${risk.factors.length > 0 ? 
                            risk.factors.map(factor => `<span class="badge bg-light text-dark me-1">${factor}</span>`).join('') :
                            '<span class="text-muted">Keine spezifischen Risikofaktoren</span>'
                        }
                    </span>
                </div>
            </div>

            ${patient.data?.condition ? `
                <div class="detail-section">
                    <h6>Aktuelle Diagnosen</h6>
                    ${patient.data.condition.map(condition => `
                        <div class="detail-item">
                            <span class="detail-label">${condition.name || 'Unbekannte Diagnose'}</span>
                            <span class="detail-value">${condition.date ? this.formatDate(condition.date) : 'Datum unbekannt'}</span>
                        </div>
                    `).join('')}
                </div>
            ` : ''}

            ${patient.data?.vital_signs ? `
                <div class="detail-section">
                    <h6>Aktuelle Vitalwerte</h6>
                    ${patient.data.vital_signs.map(vital => `
                        <div class="detail-item">
                            <span class="detail-label">${vital.name || 'Unbekannter Vitalwert'}</span>
                            <span class="detail-value">${vital.date ? this.formatDate(vital.date) : 'Datum unbekannt'}</span>
                        </div>
                    `).join('')}
                </div>
            ` : ''}

            <div class="detail-section">
                <h6>Empfohlene Lagerungsintervalle</h6>
                <div class="detail-item">
                    <span class="detail-label">Lagerungswechsel:</span>
                    <span class="detail-value">
                        ${riskLevel === 'high' ? 'Alle 2 Stunden' : 
                          riskLevel === 'medium' ? 'Alle 3 Stunden' : 'Alle 4 Stunden'}
                    </span>
                </div>
                <div class="detail-item">
                    <span class="detail-label">Nächste Lagerung:</span>
                    <span class="detail-value text-warning">
                        ${riskLevel === 'high' ? 'In 15 Minuten' : 
                          riskLevel === 'medium' ? 'In 45 Minuten' : 'In 2 Stunden'}
                    </span>
                </div>
            </div>
        `;

        document.getElementById('patientDetails').innerHTML = detailsHtml;
        
        const modal = new bootstrap.Modal(document.getElementById('patientModal'));
        modal.show();
    }
}

// Initialize the application
let app;
document.addEventListener('DOMContentLoaded', () => {
    app = new DecubitusPreventionApp();
});