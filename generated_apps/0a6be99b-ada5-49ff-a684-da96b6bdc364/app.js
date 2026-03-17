class PatientDashboard {
    constructor() {
        this.patients = [];
        this.filteredPatients = [];
        this.init();
    }

    init() {
        this.loadPatients();
        this.setupEventListeners();
        this.updateStats();
        this.renderPatients();
    }

    loadPatients() {
        if (!window.PATIENT_DATA || !window.PATIENT_DATA.patients) {
            console.error('No patient data available');
            return;
        }
        
        this.patients = window.PATIENT_DATA.patients.filter(p => p.id !== 'all');
        this.filteredPatients = [...this.patients];
        
        document.getElementById('patient-count').textContent = 
            `${this.patients.length} patients in system`;
    }

    setupEventListeners() {
        document.getElementById('search-input').addEventListener('input', () => this.applyFilters());
        document.getElementById('gender-filter').addEventListener('change', () => this.applyFilters());
        document.getElementById('age-filter').addEventListener('change', () => this.applyFilters());
        document.getElementById('clear-filters').addEventListener('click', () => this.clearFilters());
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

    applyFilters() {
        const searchTerm = document.getElementById('search-input').value.toLowerCase();
        const genderFilter = document.getElementById('gender-filter').value;
        const ageFilter = document.getElementById('age-filter').value;

        this.filteredPatients = this.patients.filter(patient => {
            // Search filter
            const matchesSearch = !searchTerm || 
                patient.name.toLowerCase().includes(searchTerm) ||
                (patient.data.condition && patient.data.condition.some(c => 
                    c.name && c.name.toLowerCase().includes(searchTerm)
                ));

            // Gender filter
            const matchesGender = !genderFilter || patient.gender === genderFilter;

            // Age filter
            let matchesAge = true;
            if (ageFilter) {
                const age = this.calculateAge(patient.birthDate);
                switch (ageFilter) {
                    case '0-18':
                        matchesAge = age >= 0 && age <= 18;
                        break;
                    case '19-35':
                        matchesAge = age >= 19 && age <= 35;
                        break;
                    case '36-65':
                        matchesAge = age >= 36 && age <= 65;
                        break;
                    case '65+':
                        matchesAge = age > 65;
                        break;
                }
            }

            return matchesSearch && matchesGender && matchesAge;
        });

        this.renderPatients();
        this.updateStats();
    }

    clearFilters() {
        document.getElementById('search-input').value = '';
        document.getElementById('gender-filter').value = '';
        document.getElementById('age-filter').value = '';
        this.filteredPatients = [...this.patients];
        this.renderPatients();
        this.updateStats();
    }

    updateStats() {
        const totalPatients = this.filteredPatients.length;
        const activeConditions = this.filteredPatients.reduce((sum, p) => 
            sum + (p.data.condition ? p.data.condition.length : 0), 0);
        const activeMedications = this.filteredPatients.reduce((sum, p) => 
            sum + (p.data.medicationrequest ? p.data.medicationrequest.length : 0), 0);
        const recentObservations = this.filteredPatients.reduce((sum, p) => 
            sum + (p.data.observation ? p.data.observation.length : 0), 0);

        document.getElementById('total-patients').textContent = totalPatients;
        document.getElementById('active-conditions').textContent = activeConditions;
        document.getElementById('active-medications').textContent = activeMedications;
        document.getElementById('recent-observations').textContent = recentObservations;
    }

    getPatientAvatar(name) {
        if (!name) return 'P';
        const parts = name.split(' ');
        return parts.length > 1 ? 
            parts[0][0] + parts[1][0] : 
            name.substring(0, 2);
    }

    getAvatarColor(name) {
        const colors = ['#3b82f6', '#22c55e', '#f59e0b', '#ef4444', '#8b5cf6', '#14b8a6'];
        const hash = name.split('').reduce((a, b) => a + b.charCodeAt(0), 0);
        return colors[hash % colors.length];
    }

    getConditionSeverity(condition) {
        const highSeverity = ['cancer', 'sepsis', 'tb', 'ckd stage 4'];
        const mediumSeverity = ['hypertension', 'diabetes', 'copd', 'dementia'];
        
        const conditionLower = condition.toLowerCase();
        if (highSeverity.some(s => conditionLower.includes(s))) return 'high';
        if (mediumSeverity.some(s => conditionLower.includes(s))) return 'medium';
        return 'low';
    }

    renderPatients() {
        const container = document.getElementById('patients-container');
        const noResults = document.getElementById('no-results');

        if (this.filteredPatients.length === 0) {
            container.innerHTML = '';
            noResults.classList.remove('d-none');
            return;
        }

        noResults.classList.add('d-none');
        
        container.innerHTML = this.filteredPatients.map(patient => {
            const age = this.calculateAge(patient.birthDate);
            const avatar = this.getPatientAvatar(patient.name);
            const avatarColor = this.getAvatarColor(patient.name);
            
            const conditions = patient.data.condition || [];
            const observations = patient.data.observation || [];
            const medications = patient.data.medicationrequest || [];

            return `
                <div class="col-lg-6 col-xl-4">
                    <div class="patient-card">
                        <div class="patient-header">
                            <div class="patient-avatar" style="background-color: ${avatarColor}">
                                ${avatar}
                            </div>
                            <div class="flex-grow-1">
                                <h3 class="patient-name">${patient.name || 'Unknown'}</h3>
                                <div class="patient-details">
                                    <span class="gender-badge gender-${patient.gender}">
                                        <i class="fas fa-${patient.gender === 'male' ? 'mars' : 'venus'} me-1"></i>
                                        ${patient.gender || 'Unknown'}
                                    </span>
                                    <span class="ms-2">${age} years old</span>
                                </div>
                            </div>
                        </div>

                        ${conditions.length > 0 ? `
                            <div class="mb-3">
                                <div class="section-title">
                                    <i class="fas fa-stethoscope text-danger"></i>
                                    Conditions
                                </div>
                                <div>
                                    ${conditions.slice(0, 3).map(condition => `
                                        <span class="condition-badge condition-${this.getConditionSeverity(condition.name || '')}">
                                            ${condition.name || 'Unknown condition'}
                                        </span>
                                    `).join('')}
                                    ${conditions.length > 3 ? `<span class="text-muted">+${conditions.length - 3} more</span>` : ''}
                                </div>
                            </div>
                        ` : ''}

                        ${observations.length > 0 ? `
                            <div class="mb-3">
                                <div class="section-title">
                                    <i class="fas fa-chart-line text-info"></i>
                                    Latest Observation
                                </div>
                                <div class="info-item">
                                    <span class="info-value">${observations[0].name || 'No data available'}</span>
                                </div>
                            </div>
                        ` : ''}

                        ${medications.length > 0 ? `
                            <div class="mb-0">
                                <div class="section-title">
                                    <i class="fas fa-pills text-warning"></i>
                                    Active Medications
                                </div>
                                <div class="info-item">
                                    <span class="info-value">${medications.length} active prescription${medications.length > 1 ? 's' : ''}</span>
                                </div>
                            </div>
                        ` : ''}
                    </div>
                </div>
            `;
        }).join('');
    }
}

// Initialize the dashboard when the page loads
document.addEventListener('DOMContentLoaded', () => {
    new PatientDashboard();
});