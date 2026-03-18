class CriticalCareMonitor {
    constructor() {
        this.patients = [];
        this.selectedPatient = null;
        this.sortBy = 'severity';
        this.alertCount = 0;
        
        this.init();
    }

    init() {
        this.loadPatientData();
        this.setupEventListeners();
        this.updateLastUpdateTime();
        this.startAutoRefresh();
    }

    loadPatientData() {
        if (!window.PATIENT_DATA) {
            console.error('Patient data not available');
            return;
        }

        const data = window.PATIENT_DATA;
        
        if (data.patient && data.patient.id === 'all' && data.patients) {
            this.patients = data.patients.map(patient => this.processPatientData(patient));
        } else {
            this.patients = [];
        }

        this.renderPatientGrid();
        this.updateMetrics();
    }

    processPatientData(patient) {
        const processed = {
            id: patient.id,
            name: patient.name || 'Unknown Patient',
            gender: patient.gender || 'Unknown',
            birthDate: patient.birthDate || null,
            age: this.calculateAge(patient.birthDate),
            severity: this.calculateSeverity(patient),
            conditions: [],
            medications: [],
            observations: [],
            vitalSigns: [],
            lastUpdate: new Date()
        };

        // Process conditions
        if (patient.data && patient.data.condition && patient.data.condition.summary) {
            processed.conditions = patient.data.condition.summary.map(condition => ({
                name: condition.name || 'Unknown Condition',
                status: condition.status || '',
                date: condition.date || null
            }));
        }

        // Process medications
        if (patient.data && patient.data.medicationrequest && patient.data.medicationrequest.summary) {
            processed.medications = patient.data.medicationrequest.summary.map(med => ({
                name: med.name || 'Unknown Medication',
                dosage: med.value || 'Unknown dosage',
                status: med.status || ''
            }));
        }

        // Process observations/vital signs
        if (patient.data && patient.data.vital_signs && patient.data.vital_signs.summary) {
            processed.vitalSigns = patient.data.vital_signs.summary.map(vital => ({
                name: vital.name || 'Unknown Vital',
                value: vital.value || 'No data',
                date: vital.date || null,
                status: this.getVitalStatus(vital.name, vital.value)
            }));
        }

        if (patient.data && patient.data.observation && patient.data.observation.summary) {
            processed.observations = patient.data.observation.summary.map(obs => ({
                name: obs.name || 'Unknown Observation',
                value: obs.value || 'No data',
                date: obs.date || null
            }));
        }

        return processed;
    }

    calculateAge(birthDate) {
        if (!birthDate) return 'Unknown';
        const birth = new Date(birthDate);
        const today = new Date();
        const age = today.getFullYear() - birth.getFullYear();
        return age;
    }

    calculateSeverity(patient) {
        // Simple severity calculation based on conditions
        if (!patient.data || !patient.data.condition || !patient.data.condition.summary) {
            return 'low';
        }

        const conditions = patient.data.condition.summary;
        const criticalConditions = ['Sepsis', 'Chest Pain', 'TB', 'CKD Stage 4', 'Breast Cancer'];
        const moderateConditions = ['Hypertension', 'Asthma', 'COPD', 'Depression', 'Dementia'];

        for (let condition of conditions) {
            if (criticalConditions.some(critical => condition.name && condition.name.includes(critical))) {
                return 'high';
            }
            if (moderateConditions.some(moderate => condition.name && condition.name.includes(moderate))) {
                return 'medium';
            }
        }

        return 'low';
    }

    getVitalStatus(name, value) {
        if (!name || !value) return 'normal';
        
        const vitalName = name.toLowerCase();
        
        // Simple vital sign status logic
        if (vitalName.includes('bp') || vitalName.includes('blood pressure')) {
            if (value.includes('140') || value.includes('90')) return 'warning';
        }
        if (vitalName.includes('temp')) {
            if (value.includes('39')) return 'critical';
        }
        if (vitalName.includes('pain')) {
            if (value.includes('8') || value.includes('7')) return 'warning';
        }
        
        return 'normal';
    }

    setupEventListeners() {
        document.getElementById('sortBy').addEventListener('change', (e) => {
            this.sortBy = e.target.value;
            this.renderPatientGrid();
        });

        document.getElementById('refreshBtn').addEventListener('click', () => {
            this.loadPatientData();
            this.updateLastUpdateTime();
        });
    }

    renderPatientGrid() {
        const grid = document.getElementById('patientGrid');
        if (!grid) return;

        if (this.patients.length === 0) {
            grid.innerHTML = `
                <div class="text-center py-4">
                    <i class="fas fa-users text-muted mb-3" style="font-size: 2rem;"></i>
                    <h3 class="text-muted">No Critical Patients</h3>
                    <p class="text-muted">No patients requiring critical care monitoring at this time.</p>
                </div>
            `;
            return;
        }

        const sortedPatients = this.sortPatients(this.patients);
        
        grid.innerHTML = sortedPatients.map(patient => `
            <div class="patient-card severity-${patient.severity} ${this.selectedPatient?.id === patient.id ? 'selected' : ''}" 
                 data-patient-id="${patient.id}">
                <div class="patient-header">
                    <div class="flex-grow-1">
                        <div class="patient-name">${patient.name}</div>
                        <div class="patient-info">
                            ${patient.gender} • Age ${patient.age} • ID: ${patient.id.substring(0, 8)}
                        </div>
                    </div>
                    <div class="severity-badge severity-${patient.severity}">
                        ${patient.severity.toUpperCase()}
                    </div>
                </div>
                
                <div class="vital-signs">
                    ${this.renderVitalSigns(patient.vitalSigns)}
                </div>
                
                <div class="mt-2 d-flex justify-content-between align-items-center">
                    <small class="text-muted">
                        <i class="fas fa-clock me-1"></i>
                        Updated ${this.formatTime(patient.lastUpdate)}
                    </small>
                    <small class="text-muted">
                        ${patient.conditions.length} conditions
                    </small>
                </div>
            </div>
        `).join('');

        // Add click listeners
        grid.querySelectorAll('.patient-card').forEach(card => {
            card.addEventListener('click', () => {
                const patientId = card.dataset.patientId;
                this.selectPatient(patientId);
            });
        });
    }

    renderVitalSigns(vitalSigns) {
        if (!vitalSigns || vitalSigns.length === 0) {
            return '<div class="vital-item"><div class="vital-value">--</div><div class="vital-label">No Data</div></div>';
        }

        return vitalSigns.slice(0, 4).map(vital => `
            <div class="vital-item vital-${vital.status}">
                <div class="vital-value">${vital.value}</div>
                <div class="vital-label">${vital.name}</div>
            </div>
        `).join('');
    }

    sortPatients(patients) {
        const sorted = [...patients];
        
        switch (this.sortBy) {
            case 'severity':
                return sorted.sort((a, b) => {
                    const severityOrder = { high: 3, medium: 2, low: 1 };
                    return severityOrder[b.severity] - severityOrder[a.severity];
                });
            case 'name':
                return sorted.sort((a, b) => a.name.localeCompare(b.name));
            case 'room':
                return sorted.sort((a, b) => a.id.localeCompare(b.id));
            case 'admission':
                return sorted.sort((a, b) => new Date(b.lastUpdate) - new Date(a.lastUpdate));
            default:
                return sorted;
        }
    }

    selectPatient(patientId) {
        this.selectedPatient = this.patients.find(p => p.id === patientId);
        this.renderPatientGrid(); // Re-render to show selection
        this.renderPatientDetail();
    }

    renderPatientDetail() {
        const panel = document.getElementById('detailPanel');
        if (!panel || !this.selectedPatient) return;

        const patient = this.selectedPatient;

        panel.innerHTML = `
            <div class="patient-detail-header">
                <div class="d-flex justify-content-between align-items-start">
                    <div>
                        <h3 class="mb-1">${patient.name}</h3>
                        <p class="text-muted mb-0">${patient.gender} • Age ${patient.age} • ID: ${patient.id}</p>
                    </div>
                    <span class="severity-badge severity-${patient.severity}">
                        ${patient.severity.toUpperCase()} RISK
                    </span>
                </div>
            </div>

            <div class="detail-section">
                <h4><i class="fas fa-stethoscope me-2"></i>Active Conditions</h4>
                ${patient.conditions.length > 0 ? 
                    patient.conditions.map(condition => `
                        <div class="condition-item">
                            <h5>${condition.name}</h5>
                            <p>Status: ${condition.status || 'Active'} ${condition.date ? `• Since: ${this.formatDate(condition.date)}` : ''}</p>
                        </div>
                    `).join('') : 
                    '<p class="text-muted">No active conditions recorded</p>'
                }
            </div>

            <div class="detail-section">
                <h4><i class="fas fa-pills me-2"></i>Current Medications</h4>
                ${patient.medications.length > 0 ? 
                    patient.medications.map(med => `
                        <div class="medication-item">
                            <h5>${med.name}</h5>
                            <p>Dosage: ${med.dosage}</p>
                        </div>
                    `).join('') : 
                    '<p class="text-muted">No medications recorded</p>'
                }
            </div>

            <div class="detail-section">
                <h4><i class="fas fa-chart-line me-2"></i>Recent Observations</h4>
                ${patient.observations.length > 0 ? 
                    patient.observations.map(obs => `
                        <div class="observation-item">
                            <h5>${obs.name}</h5>
                            <p>Value: ${obs.value} ${obs.date ? `• ${this.formatDate(obs.date)}` : ''}</p>
                        </div>
                    `).join('') : 
                    '<p class="text-muted">No recent observations</p>'
                }
            </div>

            <div class="detail-section">
                <h4><i class="fas fa-heartbeat me-2"></i>Vital Signs</h4>
                <div class="row g-2">
                    ${patient.vitalSigns.length > 0 ? 
                        patient.vitalSigns.map(vital => `
                            <div class="col-6">
                                <div class="vital-item vital-${vital.status}">
                                    <div class="vital-value">${vital.value}</div>
                                    <div class="vital-label">${vital.name}</div>
                                </div>
                            </div>
                        `).join('') : 
                        '<div class="col-12"><p class="text-muted">No vital signs recorded</p></div>'
                    }
                </div>
            </div>
        `;
    }

    updateMetrics() {
        const highRisk = this.patients.filter(p => p.severity === 'high').length;
        const monitoring = this.patients.filter(p => p.severity === 'medium').length;
        const total = this.patients.length;

        document.getElementById('highRiskCount').textContent = highRisk;
        document.getElementById('monitoringCount').textContent = monitoring;
        document.getElementById('totalPatientsCount').textContent = total;
        document.getElementById('criticalCount').textContent = total;
        
        // Calculate alert count (high risk + critical vitals)
        this.alertCount = highRisk + this.patients.filter(p => 
            p.vitalSigns.some(v => v.status === 'critical')
        ).length;
        
        document.getElementById('alertCount').textContent = this.alertCount;
        document.getElementById('avgResponseTime').textContent = '2.3min';
    }

    updateLastUpdateTime() {
        const now = new Date();
        document.getElementById('lastUpdate').textContent = now.toLocaleTimeString();
    }

    formatTime(date) {
        return new Date(date).toLocaleTimeString();
    }

    formatDate(dateString) {
        if (!dateString) return 'Unknown';
        return new Date(dateString).toLocaleDateString();
    }

    startAutoRefresh() {
        // Refresh every 30 seconds
        setInterval(() => {
            this.loadPatientData();
            this.updateLastUpdateTime();
        }, 30000);
    }
}

// Initialize the application when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new CriticalCareMonitor();
});