class PatientConditionsDashboard {
    constructor() {
        this.patients = [];
        this.filteredPatients = [];
        this.currentFilter = 'all';
        this.currentSearch = '';
        
        this.init();
    }

    init() {
        this.loadPatientData();
        this.setupEventListeners();
        this.renderDashboard();
    }

    loadPatientData() {
        if (!window.PATIENT_DATA) {
            console.error('Patient data not available');
            return;
        }

        const data = window.PATIENT_DATA;
        
        if (data.patient && data.patient.id === 'all' && data.patients) {
            // All patients view
            this.patients = data.patients.map(patient => this.processPatientData(patient));
        } else if (data.patient && data.patient.id !== 'all') {
            // Single patient view
            this.patients = [this.processPatientData({
                id: data.patient.id,
                name: data.patient.name,
                gender: data.patient.gender,
                birthDate: data.patient.birthDate,
                data: data
            })];
        }

        this.filteredPatients = [...this.patients];
    }

    processPatientData(patient) {
        const processedPatient = {
            id: patient.id,
            name: patient.name || 'Unknown Patient',
            gender: patient.gender || 'Unknown',
            birthDate: patient.birthDate || null,
            age: this.calculateAge(patient.birthDate),
            conditions: [],
            observations: [],
            severity: 'low'
        };

        // Process patient data
        const patientData = patient.data || {};
        
        // Extract conditions
        Object.entries(patientData).forEach(([resourceType, records]) => {
            if (!Array.isArray(records)) return;
            
            records.forEach(record => {
                if (resourceType === 'condition') {
                    processedPatient.conditions.push({
                        name: record.name || 'Unknown Condition',
                        date: record.date || null,
                        status: record.status || 'active'
                    });
                } else if (resourceType === 'observation' || resourceType === 'vital_signs') {
                    processedPatient.observations.push({
                        name: record.name || 'Unknown Observation',
                        value: record.value || record.name || 'No value',
                        date: record.date || null
                    });
                }
            });
        });

        // Determine severity based on conditions and observations
        processedPatient.severity = this.determineSeverity(processedPatient);

        return processedPatient;
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

    determineSeverity(patient) {
        const criticalConditions = [
            'sepsis', 'cancer', 'breast cancer', 'chest pain', 'fractured femur',
            'copd', 'ckd stage 4', 'tb', 'dementia'
        ];
        
        const criticalObservations = [
            'temp 39.2c', 'ecg abnormal', 'pain scale 8/10', 'fev1 45%',
            'egfr 22', 'sputum positive', 'mmse 18/30'
        ];

        // Check conditions
        for (const condition of patient.conditions) {
            if (criticalConditions.some(critical => 
                condition.name.toLowerCase().includes(critical))) {
                return 'critical';
            }
        }

        // Check observations
        for (const obs of patient.observations) {
            if (criticalObservations.some(critical => 
                obs.name.toLowerCase().includes(critical) || 
                obs.value.toLowerCase().includes(critical))) {
                return 'critical';
            }
        }

        return 'low';
    }

    setupEventListeners() {
        const severityFilter = document.getElementById('severityFilter');
        const searchInput = document.getElementById('searchInput');
        const clearFilters = document.getElementById('clearFilters');

        severityFilter.addEventListener('change', (e) => {
            this.currentFilter = e.target.value;
            this.applyFilters();
        });

        searchInput.addEventListener('input', (e) => {
            this.currentSearch = e.target.value.toLowerCase();
            this.applyFilters();
        });

        clearFilters.addEventListener('click', () => {
            this.currentFilter = 'all';
            this.currentSearch = '';
            severityFilter.value = 'all';
            searchInput.value = '';
            this.applyFilters();
        });
    }

    applyFilters() {
        this.filteredPatients = this.patients.filter(patient => {
            // Severity filter
            if (this.currentFilter !== 'all' && patient.severity !== this.currentFilter) {
                return false;
            }

            // Search filter
            if (this.currentSearch) {
                const searchTerm = this.currentSearch;
                const matchesName = patient.name.toLowerCase().includes(searchTerm);
                const matchesCondition = patient.conditions.some(condition => 
                    condition.name.toLowerCase().includes(searchTerm));
                const matchesObservation = patient.observations.some(obs => 
                    obs.name.toLowerCase().includes(searchTerm) || 
                    obs.value.toLowerCase().includes(searchTerm));
                
                if (!matchesName && !matchesCondition && !matchesObservation) {
                    return false;
                }
            }

            return true;
        });

        this.renderPatients();
        this.updateStats();
    }

    renderDashboard() {
        this.updateStats();
        this.renderPatients();
    }

    updateStats() {
        const totalPatients = this.patients.length;
        const criticalCount = this.patients.filter(p => p.severity === 'critical').length;

        document.getElementById('totalPatients').textContent = totalPatients;
        document.getElementById('criticalCount').textContent = criticalCount;
    }

    renderPatients() {
        const grid = document.getElementById('patientsGrid');
        const noResults = document.getElementById('noResults');

        if (this.filteredPatients.length === 0) {
            grid.innerHTML = '';
            noResults.style.display = 'block';
            return;
        }

        noResults.style.display = 'none';
        
        grid.innerHTML = this.filteredPatients.map(patient => this.createPatientCard(patient)).join('');
    }

    createPatientCard(patient) {
        const ageText = patient.age !== null ? `${patient.age} years old` : 'Age unknown';
        const genderIcon = patient.gender === 'male' ? 'fa-mars' : 
                          patient.gender === 'female' ? 'fa-venus' : 'fa-user';

        const conditionsHtml = patient.conditions.length > 0 
            ? patient.conditions.map(condition => `
                <div class="condition-item">
                    <div class="d-flex align-items-center">
                        <div class="condition-icon ${patient.severity}">
                            <i class="fas fa-stethoscope"></i>
                        </div>
                        <div>
                            <div class="condition-name">${condition.name}</div>
                            ${condition.date ? `<div class="condition-date">Since: ${new Date(condition.date).toLocaleDateString()}</div>` : ''}
                        </div>
                    </div>
                </div>
            `).join('')
            : '<div class="no-conditions"><i class="fas fa-check-circle"></i><br>No active conditions</div>';

        const observationsHtml = patient.observations.length > 0
            ? patient.observations.slice(0, 3).map(obs => `
                <div class="condition-item">
                    <div class="d-flex align-items-center">
                        <div class="condition-icon ${patient.severity}">
                            <i class="fas fa-chart-line"></i>
                        </div>
                        <div>
                            <div class="condition-name">${obs.name}</div>
                            <div class="observation-value">${obs.value}</div>
                            ${obs.date ? `<div class="condition-date">${new Date(obs.date).toLocaleDateString()}</div>` : ''}
                        </div>
                    </div>
                </div>
            `).join('')
            : '';

        return `
            <div class="col-lg-4 col-md-6 mb-4">
                <div class="patient-card">
                    <div class="patient-header">
                        <div class="d-flex align-items-center justify-content-between mb-2">
                            <h3 class="patient-name">${patient.name}</h3>
                            <span class="severity-badge severity-${patient.severity}">
                                ${patient.severity === 'critical' ? 'Critical' : 'Low Risk'}
                            </span>
                        </div>
                        <div class="patient-info">
                            <span><i class="fas ${genderIcon} me-1"></i>${patient.gender}</span>
                            <span><i class="fas fa-birthday-cake me-1"></i>${ageText}</span>
                        </div>
                    </div>
                    <div class="conditions-list">
                        ${conditionsHtml}
                        ${observationsHtml}
                    </div>
                </div>
            </div>
        `;
    }
}

// Initialize the dashboard when the DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new PatientConditionsDashboard();
});