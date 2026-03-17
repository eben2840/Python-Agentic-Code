class PatientDashboard {
    constructor() {
        this.patients = [];
        this.filteredPatients = [];
        this.currentFilters = {
            search: '',
            gender: '',
            condition: '',
            viewMode: 'overview'
        };
        
        this.init();
    }

    init() {
        this.loadPatientData();
        this.setupEventListeners();
        this.populateFilters();
        this.renderDashboard();
    }

    loadPatientData() {
        if (!window.PATIENT_DATA || !window.PATIENT_DATA.patients) {
            console.error('No patient data available');
            return;
        }

        this.patients = window.PATIENT_DATA.patients.filter(patient => 
            patient.id !== 'all' && patient.name && patient.name !== 'All Patients'
        );
        
        this.filteredPatients = [...this.patients];
    }

    setupEventListeners() {
        document.getElementById('searchInput').addEventListener('input', (e) => {
            this.currentFilters.search = e.target.value.toLowerCase();
            this.applyFilters();
        });

        document.getElementById('genderFilter').addEventListener('change', (e) => {
            this.currentFilters.gender = e.target.value;
            this.applyFilters();
        });

        document.getElementById('conditionFilter').addEventListener('change', (e) => {
            this.currentFilters.condition = e.target.value;
            this.applyFilters();
        });

        document.getElementById('viewMode').addEventListener('change', (e) => {
            this.currentFilters.viewMode = e.target.value;
            this.renderPatients();
        });

        document.getElementById('clearFilters').addEventListener('click', () => {
            this.clearFilters();
        });
    }

    populateFilters() {
        const conditionFilter = document.getElementById('conditionFilter');
        const conditions = new Set();

        this.patients.forEach(patient => {
            if (patient.data && patient.data.condition) {
                patient.data.condition.forEach(condition => {
                    if (condition.name) {
                        conditions.add(condition.name);
                    }
                });
            }
        });

        Array.from(conditions).sort().forEach(condition => {
            const option = document.createElement('option');
            option.value = condition;
            option.textContent = condition;
            conditionFilter.appendChild(option);
        });
    }

    applyFilters() {
        this.filteredPatients = this.patients.filter(patient => {
            // Search filter
            if (this.currentFilters.search) {
                const searchTerm = this.currentFilters.search;
                const matchesName = patient.name.toLowerCase().includes(searchTerm);
                const matchesCondition = patient.data && patient.data.condition && 
                    patient.data.condition.some(c => c.name && c.name.toLowerCase().includes(searchTerm));
                
                if (!matchesName && !matchesCondition) {
                    return false;
                }
            }

            // Gender filter
            if (this.currentFilters.gender && patient.gender !== this.currentFilters.gender) {
                return false;
            }

            // Condition filter
            if (this.currentFilters.condition) {
                if (!patient.data || !patient.data.condition || 
                    !patient.data.condition.some(c => c.name === this.currentFilters.condition)) {
                    return false;
                }
            }

            return true;
        });

        this.renderDashboard();
    }

    clearFilters() {
        document.getElementById('searchInput').value = '';
        document.getElementById('genderFilter').value = '';
        document.getElementById('conditionFilter').value = '';
        document.getElementById('viewMode').value = 'overview';
        
        this.currentFilters = {
            search: '',
            gender: '',
            condition: '',
            viewMode: 'overview'
        };
        
        this.filteredPatients = [...this.patients];
        this.renderDashboard();
    }

    renderDashboard() {
        this.renderSummaryStats();
        this.renderPatients();
    }

    renderSummaryStats() {
        const totalObservations = this.filteredPatients.reduce((sum, patient) => {
            return sum + (patient.data && patient.data.observation ? patient.data.observation.length : 0);
        }, 0);

        const totalEncounters = this.filteredPatients.reduce((sum, patient) => {
            return sum + (patient.data && patient.data.encounter ? patient.data.encounter.length : 0);
        }, 0);

        const totalLocations = this.filteredPatients.reduce((sum, patient) => {
            return sum + (patient.data && patient.data.locations ? patient.data.locations.length : 0);
        }, 0);

        document.getElementById('totalPatients').textContent = this.filteredPatients.length;
        document.getElementById('totalObservations').textContent = totalObservations;
        document.getElementById('totalEncounters').textContent = totalEncounters;
        document.getElementById('totalLocations').textContent = totalLocations;
    }

    renderPatients() {
        const container = document.getElementById('patientContainer');
        const noResults = document.getElementById('noResults');

        if (this.filteredPatients.length === 0) {
            container.innerHTML = '';
            noResults.classList.remove('d-none');
            return;
        }

        noResults.classList.add('d-none');
        container.innerHTML = this.filteredPatients.map(patient => this.createPatientCard(patient)).join('');
    }

    createPatientCard(patient) {
        const age = this.calculateAge(patient.birthDate);
        const isDetailed = this.currentFilters.viewMode === 'detailed';

        return `
            <div class="col-12">
                <div class="patient-card">
                    <div class="patient-header">
                        <h3 class="patient-name">${patient.name || 'Unknown Patient'}</h3>
                        <div class="patient-info">
                            <div class="info-item">
                                <i class="fas fa-id-card"></i>
                                <span>ID: ${patient.id || 'N/A'}</span>
                            </div>
                            <div class="info-item">
                                <i class="fas fa-venus-mars"></i>
                                <span>${this.formatGender(patient.gender)}</span>
                            </div>
                            <div class="info-item">
                                <i class="fas fa-birthday-cake"></i>
                                <span>${age} years old</span>
                            </div>
                            <div class="info-item">
                                <i class="fas fa-calendar"></i>
                                <span>DOB: ${this.formatDate(patient.birthDate)}</span>
                            </div>
                        </div>
                    </div>
                    <div class="patient-body">
                        ${isDetailed ? this.createDetailedView(patient) : this.createOverviewSections(patient)}
                    </div>
                </div>
            </div>
        `;
    }

    createOverviewSections(patient) {
        return `
            <div class="section-grid">
                ${this.createConditionsSection(patient.data)}
                ${this.createObservationsSection(patient.data)}
                ${this.createEncountersSection(patient.data)}
                ${this.createLocationsSection(patient.data)}
            </div>
        `;
    }

    createDetailedView(patient) {
        return `
            <div class="row">
                <div class="col-md-6 mb-3">
                    ${this.createConditionsSection(patient.data, true)}
                </div>
                <div class="col-md-6 mb-3">
                    ${this.createObservationsSection(patient.data, true)}
                </div>
                <div class="col-md-6 mb-3">
                    ${this.createEncountersSection(patient.data, true)}
                </div>
                <div class="col-md-6 mb-3">
                    ${this.createLocationsSection(patient.data, true)}
                </div>
                <div class="col-md-6 mb-3">
                    ${this.createMedicationsSection(patient.data, true)}
                </div>
                <div class="col-md-6 mb-3">
                    ${this.createVitalSignsSection(patient.data, true)}
                </div>
            </div>
        `;
    }

    createConditionsSection(data, detailed = false) {
        const conditions = data && data.condition ? data.condition : [];
        
        return `
            <div class="section-card">
                <h4 class="section-title">
                    <i class="fas fa-diagnoses"></i>
                    Conditions (${conditions.length})
                </h4>
                <div class="data-list">
                    ${conditions.length > 0 ? 
                        conditions.map(condition => `
                            <div class="data-item">
                                <div class="data-item-header">
                                    <div class="data-item-name">${condition.name || 'Unknown Condition'}</div>
                                    ${condition.date ? `<div class="data-item-date">${this.formatDate(condition.date)}</div>` : ''}
                                </div>
                                ${condition.status ? `<span class="status-badge status-${condition.status.toLowerCase()}">${condition.status}</span>` : ''}
                            </div>
                        `).join('') : 
                        '<div class="text-muted">No conditions recorded</div>'
                    }
                </div>
            </div>
        `;
    }

    createObservationsSection(data, detailed = false) {
        const observations = data && data.observation ? data.observation : [];
        
        return `
            <div class="section-card">
                <h4 class="section-title">
                    <i class="fas fa-stethoscope"></i>
                    Observations (${observations.length})
                </h4>
                <div class="data-list">
                    ${observations.length > 0 ? 
                        observations.map(obs => `
                            <div class="data-item">
                                <div class="data-item-header">
                                    <div class="data-item-name">${obs.name || 'Unknown Observation'}</div>
                                    ${obs.date ? `<div class="data-item-date">${this.formatDate(obs.date)}</div>` : ''}
                                </div>
                                ${obs.value ? `<div class="data-item-value">Value: ${obs.value}</div>` : ''}
                                ${obs.status ? `<span class="status-badge status-${obs.status.toLowerCase()}">${obs.status}</span>` : ''}
                            </div>
                        `).join('') : 
                        '<div class="text-muted">No observations recorded</div>'
                    }
                </div>
            </div>
        `;
    }

    createEncountersSection(data, detailed = false) {
        const encounters = data && data.encounter ? data.encounter : [];
        
        return `
            <div class="section-card">
                <h4 class="section-title">
                    <i class="fas fa-calendar-check"></i>
                    Encounters (${encounters.length})
                </h4>
                <div class="data-list">
                    ${encounters.length > 0 ? 
                        encounters.map(encounter => `
                            <div class="data-item">
                                <div class="data-item-header">
                                    <div class="data-item-name">${encounter.name || 'Medical Encounter'}</div>
                                    ${encounter.date ? `<div class="data-item-date">${this.formatDate(encounter.date)}</div>` : ''}
                                </div>
                                ${encounter.value ? `<div class="data-item-value">${encounter.value}</div>` : ''}
                                ${encounter.status ? `<span class="status-badge status-${encounter.status.toLowerCase()}">${encounter.status}</span>` : ''}
                            </div>
                        `).join('') : 
                        '<div class="text-muted">No encounters recorded</div>'
                    }
                </div>
            </div>
        `;
    }

    createLocationsSection(data, detailed = false) {
        const locations = data && data.locations ? data.locations : [];
        
        return `
            <div class="section-card">
                <h4 class="section-title">
                    <i class="fas fa-map-marker-alt"></i>
                    Locations (${locations.length})
                </h4>
                <div class="data-list">
                    ${locations.length > 0 ? 
                        locations.map(location => `
                            <div class="data-item">
                                <div class="data-item-header">
                                    <div class="data-item-name">${location.name || 'Unknown Location'}</div>
                                </div>
                                ${location.value ? `<div class="data-item-value">Ward: ${location.value}</div>` : ''}
                                ${location.status ? `<span class="status-badge status-${location.status.toLowerCase()}">${location.status}</span>` : ''}
                            </div>
                        `).join('') : 
                        '<div class="text-muted">No locations recorded</div>'
                    }
                </div>
            </div>
        `;
    }

    createMedicationsSection(data, detailed = false) {
        const medications = data && data.medicationrequest ? data.medicationrequest : [];
        
        return `
            <div class="section-card">
                <h4 class="section-title">
                    <i class="fas fa-pills"></i>
                    Medications (${medications.length})
                </h4>
                <div class="data-list">
                    ${medications.length > 0 ? 
                        medications.map(med => `
                            <div class="data-item">
                                <div class="data-item-header">
                                    <div class="data-item-name">${med.name || 'Unknown Medication'}</div>
                                    ${med.date ? `<div class="data-item-date">${this.formatDate(med.date)}</div>` : ''}
                                </div>
                                ${med.value ? `<div class="data-item-value">Dosage: ${med.value}</div>` : ''}
                                ${med.status ? `<span class="status-badge status-${med.status.toLowerCase()}">${med.status}</span>` : ''}
                            </div>
                        `).join('') : 
                        '<div class="text-muted">No medications recorded</div>'
                    }
                </div>
            </div>
        `;
    }

    createVitalSignsSection(data, detailed = false) {
        const vitals = data && data.vital_signs ? data.vital_signs : [];
        
        return `
            <div class="section-card">
                <h4 class="section-title">
                    <i class="fas fa-heartbeat"></i>
                    Vital Signs (${vitals.length})
                </h4>
                <div class="data-list">
                    ${vitals.length > 0 ? 
                        vitals.map(vital => `
                            <div class="data-item">
                                <div class="data-item-header">
                                    <div class="data-item-name">${vital.name || 'Unknown Vital'}</div>
                                    ${vital.date ? `<div class="data-item-date">${this.formatDate(vital.date)}</div>` : ''}
                                </div>
                                ${vital.value ? `<div class="data-item-value">Reading: ${vital.value}</div>` : ''}
                                ${vital.status ? `<span class="status-badge status-${vital.status.toLowerCase()}">${vital.status}</span>` : ''}
                            </div>
                        `).join('') : 
                        '<div class="text-muted">No vital signs recorded</div>'
                    }
                </div>
            </div>
        `;
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

    formatDate(dateString) {
        if (!dateString) return 'N/A';
        
        try {
            const date = new Date(dateString);
            return date.toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'short',
                day: 'numeric'
            });
        } catch (e) {
            return dateString;
        }
    }

    formatGender(gender) {
        if (!gender) return 'Not specified';
        return gender.charAt(0).toUpperCase() + gender.slice(1);
    }