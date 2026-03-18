// Critical Care Dashboard Application
class CriticalCareDashboard {
    constructor() {
        this.patients = [];
        this.filteredPatients = [];
        this.currentSort = 'severity';
        this.searchTerm = '';
        
        this.init();
    }

    init() {
        this.loadPatientData();
        this.setupEventListeners();
        this.renderDashboard();
        
        // Auto-refresh every 5 minutes
        setInterval(() => {
            this.loadPatientData();
            this.renderDashboard();
        }, 300000);
    }

    loadPatientData() {
        if (!window.PATIENT_DATA) {
            console.error('Patient data not available');
            return;
        }

        const data = window.PATIENT_DATA;
        
        if (data.patient && data.patient.id === 'all') {
            // All patients view
            this.patients = this.processAllPatients(data.patients || []);
        } else {
            // Single patient view
            this.patients = this.processSinglePatient(data);
        }
        
        this.filteredPatients = [...this.patients];
        this.updateSummaryCards();
    }

    processAllPatients(patientsData) {
        const processedPatients = [];
        
        patientsData.forEach(patient => {
            if (!patient.data) return;
            
            const patientInfo = {
                id: patient.id,
                name: patient.name || 'Unknown Patient',
                gender: patient.gender || 'Unknown',
                birthDate: patient.birthDate || null,
                age: this.calculateAge(patient.birthDate),
                conditions: [],
                medications: [],
                observations: [],
                encounters: [],
                severity: 'monitoring'
            };

            // Process all resource types dynamically
            Object.entries(patient.data).forEach(([resourceType, records]) => {
                if (!Array.isArray(records)) return;
                
                records.forEach(record => {
                    switch (resourceType) {
                        case 'condition':
                            patientInfo.conditions.push({
                                name: record.name || 'Unknown Condition',
                                status: record.status || '',
                                date: record.date || null
                            });
                            break;
                        case 'medicationrequest':
                            patientInfo.medications.push({
                                name: record.name || 'Unknown Medication',
                                dosage: record.value || 'Unknown dosage',
                                status: record.status || ''
                            });
                            break;
                        case 'observation':
                        case 'vital_signs':
                            patientInfo.observations.push({
                                name: record.name || 'Unknown Observation',
                                value: record.value || 'No value',
                                date: record.date || null
                            });
                            break;
                        case 'encounter':
                            patientInfo.encounters.push({
                                date: record.date || null,
                                status: record.status || ''
                            });
                            break;
                    }
                });
            });

            // Determine severity based on conditions
            patientInfo.severity = this.determineSeverity(patientInfo.conditions);
            
            // Only include patients with conditions (critical care focus)
            if (patientInfo.conditions.length > 0) {
                processedPatients.push(patientInfo);
            }
        });
        
        return processedPatients;
    }

    processSinglePatient(data) {
        if (!data.patient || data.patient.id === 'all') return [];
        
        const patientInfo = {
            id: data.patient.id,
            name: data.patient.name || 'Unknown Patient',
            gender: data.patient.gender || 'Unknown',
            birthDate: data.patient.birthDate || null,
            age: this.calculateAge(data.patient.birthDate),
            conditions: [],
            medications: [],
            observations: [],
            encounters: [],
            severity: 'monitoring'
        };

        // Process conditions
        if (data.condition && data.condition.summary) {
            patientInfo.conditions = data.condition.summary.map(c => ({
                name: c.name || 'Unknown Condition',
                status: c.status || '',
                date: c.date || null
            }));
        }

        // Process medications
        if (data.medicationrequest && data.medicationrequest.summary) {
            patientInfo.medications = data.medicationrequest.summary.map(m => ({
                name: m.name || 'Unknown Medication',
                dosage: m.value || 'Unknown dosage',
                status: m.status || ''
            }));
        }

        // Process observations
        if (data.observation && data.observation.summary) {
            patientInfo.observations = data.observation.summary.map(o => ({
                name: o.name || 'Unknown Observation',
                value: o.value || 'No value',
                date: o.date || null
            }));
        }

        // Process encounters
        if (data.encounter && data.encounter.summary) {
            patientInfo.encounters = data.encounter.summary.map(e => ({
                date: e.date || null,
                status: e.status || ''
            }));
        }

        // Determine severity
        patientInfo.severity = this.determineSeverity(patientInfo.conditions);
        
        return patientInfo.conditions.length > 0 ? [patientInfo] : [];
    }

    determineSeverity(conditions) {
        const criticalConditions = [
            'sepsis', 'cardiac arrest', 'stroke', 'myocardial infarction', 
            'respiratory failure', 'shock', 'coma', 'severe trauma'
        ];
        
        const seriousConditions = [
            'cancer', 'breast cancer', 'pneumonia', 'heart failure', 
            'kidney failure', 'liver failure', 'copd', 'tuberculosis', 'tb'
        ];

        for (const condition of conditions) {
            const conditionName = (condition.name || '').toLowerCase();
            
            if (criticalConditions.some(critical => conditionName.includes(critical))) {
                return 'critical';
            }
            
            if (seriousConditions.some(serious => conditionName.includes(serious))) {
                return 'serious';
            }
        }
        
        return 'monitoring';
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

    setupEventListeners() {
        // Search functionality
        document.getElementById('searchInput').addEventListener('input', (e) => {
            this.searchTerm = e.target.value.toLowerCase();
            this.filterAndSortPatients();
        });

        // Sort functionality
        document.getElementById('sortSelect').addEventListener('change', (e) => {
            this.currentSort = e.target.value;
            this.filterAndSortPatients();
        });

        // Refresh button
        document.getElementById('refreshBtn').addEventListener('click', () => {
            this.loadPatientData();
            this.renderDashboard();
        });
    }

    filterAndSortPatients() {
        // Filter by search term
        this.filteredPatients = this.patients.filter(patient => {
            if (!this.searchTerm) return true;
            
            const searchableText = [
                patient.name,
                ...patient.conditions.map(c => c.name)
            ].join(' ').toLowerCase();
            
            return searchableText.includes(this.searchTerm);
        });

        // Sort patients
        this.filteredPatients.sort((a, b) => {
            switch (this.currentSort) {
                case 'severity':
                    const severityOrder = { critical: 0, serious: 1, monitoring: 2 };
                    return severityOrder[a.severity] - severityOrder[b.severity];
                case 'name':
                    return a.name.localeCompare(b.name);
                case 'date':
                    const aDate = this.getLatestEncounterDate(a);
                    const bDate = this.getLatestEncounterDate(b);
                    return new Date(bDate) - new Date(aDate);
                default:
                    return 0;
            }
        });

        this.renderPatientGrid();
        this.updateSummaryCards();
    }

    getLatestEncounterDate(patient) {
        if (!patient.encounters.length) return '1900-01-01';
        
        const dates = patient.encounters
            .map(e => e.date)
            .filter(date => date)
            .sort((a, b) => new Date(b) - new Date(a));
            
        return dates[0] || '1900-01-01';
    }

    renderDashboard() {
        this.filterAndSortPatients();
        this.updatePatientCount();
    }

    updatePatientCount() {
        document.getElementById('totalPatients').textContent = this.patients.length;
    }

    updateSummaryCards() {
        const criticalCount = this.filteredPatients.filter(p => p.severity === 'critical').length;
        const seriousCount = this.filteredPatients.filter(p => p.severity === 'serious').length;
        const monitoringCount = this.filteredPatients.filter(p => p.severity === 'monitoring').length;
        const activeMedsCount = this.filteredPatients.reduce((sum, p) => sum + p.medications.length, 0);

        document.getElementById('criticalCount').textContent = criticalCount;
        document.getElementById('seriousCount').textContent = seriousCount;
        document.getElementById('monitoringCount').textContent = monitoringCount;
        document.getElementById('activeMedsCount').textContent = activeMedsCount;
    }

    renderPatientGrid() {
        const grid = document.getElementById('patientGrid');
        const noDataMessage = document.getElementById('noDataMessage');
        
        if (this.filteredPatients.length === 0) {
            grid.style.display = 'none';
            noDataMessage.style.display = 'block';
            return;
        }
        
        grid.style.display = 'grid';
        noDataMessage.style.display = 'none';
        
        grid.innerHTML = this.filteredPatients.map(patient => this.createPatientCard(patient)).join('');
        
        // Add click listeners to patient cards
        grid.querySelectorAll('.patient-card').forEach((card, index) => {
            card.addEventListener('click', () => {
                this.showPatientModal(this.filteredPatients[index]);
            });
        });
    }

    createPatientCard(patient) {
        const primaryCondition = patient.conditions[0] || { name: 'No conditions', date: null };
        const latestObservation = patient.observations[0] || { name: 'No recent observations', value: '' };
        const medicationCount = patient.medications.length;
        const encounterCount = patient.encounters.length;

        return `
            <div class="patient-card ${patient.severity}" data-patient-id="${patient.id}">
                <div class="severity-badge ${patient.severity}">${patient.severity}</div>
                
                <div class="patient-header">
                    <h3 class="patient-name">${patient.name}</h3>
                    <div class="patient-demographics">
                        <span><i class="fas fa-user me-1"></i>${patient.gender}</span>
                        <span><i class="fas fa-birthday-cake me-1"></i>Age ${patient.age}</span>
                    </div>
                </div>
                
                <div class="condition-info">
                    <div class="primary-condition">${primaryCondition.name}</div>
                    ${primaryCondition.date ? `<div class="condition-date">Since: ${this.formatDate(primaryCondition.date)}</div>` : ''}
                </div>
                
                <div class="patient-metrics">
                    <div class="metric-item">
                        <i class="fas fa-pills metric-icon"></i>
                        <span class="metric-value">${medicationCount}</span>
                        <span class="metric-label">Medications</span>
                    </div>
                    <div class="metric-item">
                        <i class="fas fa-calendar-check metric-icon"></i>
                        <span class="metric-value">${encounterCount}</span>
                        <span class="metric-label">Encounters</span>
                    </div>
                    <div class="metric-item">
                        <i class="fas fa-chart-line metric-icon"></i>
                        <span class="metric-value">${latestObservation.value}</span>
                        <span class="metric-label">${latestObservation.name}</span>
                    </div>
                </div>
            </div>
        `;
    }

    showPatientModal(patient) {
        const modal = new bootstrap.Modal(document.getElementById('patientModal'));
        const modalTitle = document.getElementById('modalPatientName');
        const modalBody = document.getElementById('modalBody');
        
        modalTitle.textContent = patient.name;
        modalBody.innerHTML = this.createPatientModalContent(patient);
        
        modal.show();
    }

    createPatientModalContent(patient) {
        return `
            <div class="detail-section">
                <h6><i class="fas fa-user me-2"></i>Patient Information</h6>
                <ul class="detail-list">
                    <li>
                        <span class="detail-label">Name</span>
                        <span class="detail-value">${patient.name}</span>
                    </li>
                    <li>
                        <span class="detail-label">Gender</span>
                        <span class="detail-value">${patient.gender}</span>
                    </li>
                    <li>
                        <span class="detail-label">Age</span>
                        <span class="detail-value">${patient.age} years</span>
                    </li>
                    <li>
                        <span class="detail-label">Severity Level</span>
                        <span class="detail-value">
                            <span class="severity-badge ${patient.severity}">${patient.severity}</span>
                        </span>
                    </li>
                </ul>
            </div>
            
            <div class="detail-section">
                <h6><i class="fas fa-stethoscope me-2"></i>Conditions</h6>
                <ul class="detail-list">
                    ${patient.conditions.length > 0 ? 
                        patient.conditions.map(condition => `
                            <li>
                                <span class="detail-label">${condition.name}</span>
                                <span class="detail-value">${condition.date ? this.formatDate(condition.date) : 'No date'}</span>
                            </li>
                        `).join('') : 
                        '<li><span class="detail-label">No conditions recorded</span></li>'
                    }
                </ul>
            </div>
            
            <div class="detail-section">
                <h6><i class="fas fa-pills me-2"></i>Current Medications</h6>
                <ul class="detail-list">
                    ${patient.medications.length > 0 ? 
                        patient.medications.map(medication => `
                            <li>
                                <span class="detail-label">${medication.name}</span>
                                <span class="detail-value">${medication.dosage}</span>
                            </li>
                        `).join('') : 
                        '<li><span class="detail-label">No medications recorded</span></li>'
                    }
                </ul>
            </div>
            
            <div class="detail-section">
                <h6><i class="fas fa-chart-line me-2"></i>Recent Observations</h6>
                <ul class="detail-list">
                    ${patient.observations.length > 0 ? 
                        patient.observations.slice(0, 5).map(observation => `
                            <li>
                                <span class="detail-label">${observation.name}</span>
                                <span class="detail-value">${observation.value} ${observation.date ? `(${this.formatDate(observation.date)})` : ''}</span>
                            </li>
                        `).join('') : 
                        '<li><span class="detail-label">No observations recorded</span></li>'
                    }
                </ul>
            </div>
        `;
    }

    formatDate(dateString) {
        if (!dateString) return 'No date';
        
        try {
            const date = new Date(dateString);
            return date.toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'short',
                day: 'numeric'
            });
        } catch (error) {
            return 'Invalid date';
        }
    }
}

// Initialize the dashboard when the page loads
document.addEventListener('DOMContentLoaded', () => {
    new CriticalCareDashboard();
});