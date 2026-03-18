// Mock patient data structure for ER dashboard
window.PATIENT_DATA = {
    patient: { id: 'all' },
    patients: [
        {
            id: '22a7bf93-3575-4e4a-90e6-8939717115a4',
            name: 'Bud Spencer',
            gender: 'male',
            birthDate: '1929-10-30',
            data: {}
        },
        {
            id: '19f4bd8b-6365-4378-831d-409b8ff16033',
            name: 'Anna Müller',
            gender: 'female',
            birthDate: '1980-01-15',
            data: {
                encounter: [{ name: '', status: '', date: '' }, { name: '', status: '', date: '' }]
            }
        },
        {
            id: 'pat-8af3af30',
            name: 'John Smith',
            gender: 'male',
            birthDate: '1980-01-15',
            data: {
                condition: [{ name: 'Hypertension', status: '', date: '2026-03-01T09:00:00Z' }],
                encounter: [{ name: '', status: '', date: '2026-03-01T08:00:00Z' }],
                medicationrequest: [{ name: 'Treatment for Hypertension', status: '1 tablet daily', date: '' }],
                observation: [{ name: 'BP 140/90', status: 'Latest: BP 140/90', date: '2026-03-05T12:00:00Z' }],
                vital_signs: [{ name: 'BP 140/90', status: 'Latest: BP 140/90', date: '2026-03-05T12:00:00Z' }]
            }
        },
        {
            id: 'pat-0a70a8f4',
            name: 'Jane Doe',
            gender: 'female',
            birthDate: '1980-02-15',
            data: {
                condition: [{ name: 'Breast Cancer', status: '', date: '2026-03-01T09:00:00Z' }],
                encounter: [{ name: '', status: '', date: '2026-03-01T08:00:00Z' }],
                medicationrequest: [{ name: 'Treatment for Breast Cancer', status: '1 tablet daily', date: '' }],
                observation: [{ name: 'Tumor Marker CA15-3', status: 'Latest: Tumor Marker CA15-3', date: '2026-03-05T12:00:00Z' }],
                vital_signs: [{ name: 'Tumor Marker CA15-3', status: 'Latest: Tumor Marker CA15-3', date: '2026-03-05T12:00:00Z' }]
            }
        },
        {
            id: 'pat-3d19853a',
            name: 'Alice Johnson',
            gender: 'male',
            birthDate: '1980-03-15',
            data: {
                condition: [{ name: 'Fractured Femur', status: '', date: '2026-03-01T09:00:00Z' }],
                encounter: [{ name: '', status: '', date: '2026-03-01T08:00:00Z' }],
                medicationrequest: [{ name: 'Treatment for Fractured Femur', status: '1 tablet daily', date: '' }],
                observation: [{ name: 'Pain Scale 8/10', status: 'Latest: Pain Scale 8/10', date: '2026-03-05T12:00:00Z' }],
                vital_signs: [{ name: 'Pain Scale 8/10', status: 'Latest: Pain Scale 8/10', date: '2026-03-05T12:00:00Z' }]
            }
        },
        {
            id: 'pat-ec64299d',
            name: 'Bob Wilson',
            gender: 'female',
            birthDate: '1980-04-15',
            data: {
                condition: [{ name: 'Migraine', status: '', date: '2026-03-01T09:00:00Z' }],
                encounter: [{ name: '', status: '', date: '2026-03-01T08:00:00Z' }],
                medicationrequest: [{ name: 'Treatment for Migraine', status: '1 tablet daily', date: '' }],
                observation: [{ name: 'Headache VAS 7', status: 'Latest: Headache VAS 7', date: '2026-03-05T12:00:00Z' }],
                vital_signs: [{ name: 'Headache VAS 7', status: 'Latest: Headache VAS 7', date: '2026-03-05T12:00:00Z' }]
            }
        },
        {
            id: 'pat-fed00c36',
            name: 'Carol Davis',
            gender: 'male',
            birthDate: '1980-05-15',
            data: {
                condition: [{ name: 'Asthma', status: '', date: '2026-03-01T09:00:00Z' }],
                encounter: [{ name: '', status: '', date: '2026-03-01T08:00:00Z' }],
                medicationrequest: [{ name: 'Treatment for Asthma', status: '1 tablet daily', date: '' }],
                observation: [{ name: 'Peak Flow 250', status: 'Latest: Peak Flow 250', date: '2026-03-05T12:00:00Z' }],
                vital_signs: [{ name: 'Peak Flow 250', status: 'Latest: Peak Flow 250', date: '2026-03-05T12:00:00Z' }]
            }
        },
        {
            id: 'pat-3c5b8c5e',
            name: 'David Brown',
            gender: 'female',
            birthDate: '1990-01-15',
            data: {
                condition: [{ name: 'Sepsis', status: '', date: '2026-03-01T09:00:00Z' }],
                encounter: [{ name: '', status: '', date: '2026-03-01T08:00:00Z' }],
                medicationrequest: [{ name: 'Treatment for Sepsis', status: '1 tablet daily', date: '' }],
                observation: [{ name: 'Temp 39.2C', status: 'Latest: Temp 39.2C', date: '2026-03-05T12:00:00Z' }],
                vital_signs: [{ name: 'Temp 39.2C', status: 'Latest: Temp 39.2C', date: '2026-03-05T12:00:00Z' }]
            }
        },
        {
            id: 'pat-3a28d6dd',
            name: 'Eve Green',
            gender: 'male',
            birthDate: '1990-02-15',
            data: {
                condition: [{ name: 'Gestational Diabetes', status: '', date: '2026-03-01T09:00:00Z' }],
                encounter: [{ name: '', status: '', date: '2026-03-01T08:00:00Z' }],
                medicationrequest: [{ name: 'Treatment for Gestational Diabetes', status: '1 tablet daily', date: '' }],
                observation: [{ name: 'Glucose 8.5', status: 'Latest: Glucose 8.5', date: '2026-03-05T12:00:00Z' }],
                vital_signs: [{ name: 'Glucose 8.5', status: 'Latest: Glucose 8.5', date: '2026-03-05T12:00:00Z' }]
            }
        },
        {
            id: 'pat-e5c0644a',
            name: 'Frank Miller',
            gender: 'female',
            birthDate: '1990-03-15',
            data: {
                condition: [{ name: 'Dementia', status: '', date: '2026-03-01T09:00:00Z' }],
                encounter: [{ name: '', status: '', date: '2026-03-01T08:00:00Z' }],
                medicationrequest: [{ name: 'Treatment for Dementia', status: '1 tablet daily', date: '' }],
                observation: [{ name: 'MMSE 18/30', status: 'Latest: MMSE 18/30', date: '2026-03-05T12:00:00Z' }],
                vital_signs: [{ name: 'MMSE 18/30', status: 'Latest: MMSE 18/30', date: '2026-03-05T12:00:00Z' }]
            }
        }
    ]
};

class ERDashboard {
    constructor() {
        this.patients = [];
        this.filteredPatients = [];
        this.init();
    }

    init() {
        this.loadPatients();
        this.setupEventListeners();
        this.populateFilters();
        this.renderPatients();
        this.updateStats();
    }

    loadPatients() {
        if (window.PATIENT_DATA && window.PATIENT_DATA.patients) {
            this.patients = window.PATIENT_DATA.patients;
            this.filteredPatients = [...this.patients];
        }
    }

    setupEventListeners() {
        document.getElementById('conditionFilter').addEventListener('change', () => this.applyFilters());
        document.getElementById('genderFilter').addEventListener('change', () => this.applyFilters());
        document.getElementById('ageFilter').addEventListener('change', () => this.applyFilters());
        document.getElementById('clearFilters').addEventListener('click', () => this.clearFilters());
    }

    populateFilters() {
        const conditionFilter = document.getElementById('conditionFilter');
        const conditions = new Set();

        this.patients.forEach(patient => {
            if (patient.data.condition) {
                patient.data.condition.forEach(condition => {
                    if (condition.name) {
                        conditions.add(condition.name);
                    }
                });
            }
        });

        conditions.forEach(condition => {
            const option = document.createElement('option');
            option.value = condition;
            option.textContent = condition;
            conditionFilter.appendChild(option);
        });
    }

    calculateAge(birthDate) {
        if (!birthDate) return null;
        const birth = new Date(birthDate);
        const today = new Date();
        let age = today.getFullYear() - birth.getFullYear();
        const monthDiff = today.getMonth() - birth.getMonth();
        if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
            age--;
        }
        return age;
    }

    getAgeGroup(age) {
        if (age === null) return null;
        if (age <= 18) return '0-18';
        if (age <= 35) return '19-35';
        if (age <= 65) return '36-65';
        return '65+';
    }

    getConditionSeverity(conditionName) {
        const critical = ['Sepsis', 'Breast Cancer', 'Fractured Femur', 'TB', 'CKD Stage 4'];
        const moderate = ['Hypertension', 'Migraine', 'Asthma', 'COPD', 'Depression', 'Chest Pain'];
        
        if (critical.some(c => conditionName?.includes(c))) return 'critical';
        if (moderate.some(c => conditionName?.includes(c))) return 'moderate';
        return 'stable';
    }

    applyFilters() {
        const conditionFilter = document.getElementById('conditionFilter').value;
        const genderFilter = document.getElementById('genderFilter').value;
        const ageFilter = document.getElementById('ageFilter').value;

        this.filteredPatients = this.patients.filter(patient => {
            // Condition filter
            if (conditionFilter) {
                const hasCondition = patient.data.condition?.some(c => c.name?.includes(conditionFilter));
                if (!hasCondition) return false;
            }

            // Gender filter
            if (genderFilter && patient.gender !== genderFilter) {
                return false;
            }

            // Age filter
            if (ageFilter) {
                const age = this.calculateAge(patient.birthDate);
                const ageGroup = this.getAgeGroup(age);
                if (ageGroup !== ageFilter) return false;
            }

            return true;
        });

        this.renderPatients();
        this.updateStats();
    }

    clearFilters() {
        document.getElementById('conditionFilter').value = '';
        document.getElementById('genderFilter').value = '';
        document.getElementById('ageFilter').value = '';
        this.filteredPatients = [...this.patients];
        this.renderPatients();
        this.updateStats();
    }

    renderPatients() {
        const grid = document.getElementById('patientGrid');
        const noDataMessage = document.getElementById('noDataMessage');

        if (this.filteredPatients.length === 0) {
            grid.innerHTML = '';
            noDataMessage.classList.remove('d-none');
            return;
        }

        noDataMessage.classList.add('d-none');
        
        grid.innerHTML = this.filteredPatients.map(patient => {
            const age = this.calculateAge(patient.birthDate);
            const primaryCondition = patient.data.condition?.[0];
            const severity = primaryCondition ? this.getConditionSeverity(primaryCondition.name) : 'stable';
            const vitals = patient.data.vital_signs?.[0];
            const treatment = patient.data.medicationrequest?.[0];

            return `
                <div class="col-lg-4 col-md-6 mb-4">
                    <div class="patient-card">
                        <div class="patient-header">
                            <div class="patient-avatar ${patient.gender}">
                                ${patient.name ? patient.name.charAt(0).toUpperCase() : '?'}
                            </div>
                            <div class="patient-info">
                                <h5>${patient.name || 'Unknown Patient'}</h5>
                                <div class="patient-meta">
                                    <i class="fas fa-venus-mars me-1"></i>
                                    ${patient.gender || 'Unknown'}
                                    ${age !== null ? `<span class="age-badge">${age} years</span>` : ''}
                                </div>
                            </div>
                        </div>

                        ${primaryCondition ? `
                            <div class="condition-badge condition-${severity}">
                                <i class="fas fa-stethoscope me-1"></i>
                                ${primaryCondition.name}
                            </div>
                        ` : ''}

                        ${vitals ? `
                            <div class="vital-signs">
                                <div class="vital-item">
                                    <i class="fas fa-heartbeat"></i>
                                    <div class="vital-value">${vitals.name}</div>
                                </div>
                                <div class="vital-item">
                                    <i class="fas fa-clock"></i>
                                    <div class="vital-value">
                                        ${vitals.date ? new Date(vitals.date).toLocaleDateString() : 'No date'}
                                    </div>
                                </div>
                            </div>
                        ` : `
                            <div class="text-muted" style="font-size: 12px;">
                                <i class="fas fa-info-circle me-1"></i>
                                No vital signs available
                            </div>
                        `}

                        ${treatment ? `
                            <div class="treatment-info">
                                <div class="treatment-item">
                                    <i class="fas fa-pills"></i>
                                    <span>${treatment.name}</span>
                                </div>
                                ${treatment.status ? `
                                    <div class="treatment-item mt-1">
                                        <i class="fas fa-prescription"></i>
                                        <span>${treatment.status}</span>
                                    </div>
                                ` : ''}
                            </div>
                        ` : ''}
                    </div>
                </div>
            `;
        }).join('');
    }

    updateStats() {
        const totalPatients = this.filteredPatients.length;
        const criticalPatients = this.filteredPatients.filter(patient => {
            const condition = patient.data.condition?.[0];
            return condition && this.getConditionSeverity(condition.name) === 'critical';
        }).length;
        const activeTreatments = this.filteredPatients.filter(patient => 
            patient.data.medicationrequest?.length > 0
        ).length;

        document.getElementById('totalPatients').textContent = totalPatients;
        document.getElementById('criticalPatients').textContent = criticalPatients;
        document.getElementById('activeTreatments').textContent = activeTreatments;
    }
}

// Initialize dashboard when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new ERDashboard();
});