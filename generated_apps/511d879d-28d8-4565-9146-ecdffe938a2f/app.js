class FallRiskDashboard {
    constructor() {
        this.patients = [];
        this.currentFilter = 'all';
        this.init();
    }

    init() {
        this.loadPatientData();
        this.setupEventListeners();
        this.renderDashboard();
    }

    loadPatientData() {
        if (!window.PATIENT_DATA) {
            console.error('No patient data available');
            return;
        }

        const data = window.PATIENT_DATA;
        
        if (data.patient && data.patient.id === 'all' && data.patients) {
            this.patients = data.patients.map(patient => this.processPatientData(patient));
        } else {
            this.patients = [];
        }
    }

    processPatientData(patient) {
        const processedPatient = {
            id: patient.id,
            name: patient.name || 'Unbekannt',
            gender: patient.gender || 'Unbekannt',
            birthDate: patient.birthDate,
            age: this.calculateAge(patient.birthDate),
            fallRisk: 'unknown',
            currentFall: false,
            lastAssessment: null,
            fallRiskScore: null,
            fallIncident: null
        };

        // Check observations and vital signs for fall risk indicators
        if (patient.data) {
            // Check observations for fall risk assessments
            if (patient.data.observation) {
                patient.data.observation.forEach(obs => {
                    if (obs.name) {
                        const obsName = obs.name.toLowerCase();
                        
                        // Look for fall risk indicators in observation names
                        if (obsName.includes('fall') || obsName.includes('sturz')) {
                            if (obsName.includes('risk') || obsName.includes('risiko')) {
                                processedPatient.fallRiskScore = obs.value || obs.name;
                                processedPatient.lastAssessment = obs.date;
                                processedPatient.fallRisk = this.determineFallRisk(obs.name, obs.value);
                            }
                            
                            if (obsName.includes('incident') || obsName.includes('ereignis') || 
                                obsName.includes('injury') || obsName.includes('verletzung')) {
                                processedPatient.currentFall = true;
                                processedPatient.fallIncident = obs.name;
                            }
                        }

                        // Check for pain scales that might indicate falls
                        if (obsName.includes('pain') || obsName.includes('schmerz')) {
                            if (obs.value && this.extractNumericValue(obs.value) >= 7) {
                                processedPatient.currentFall = true;
                                processedPatient.fallIncident = obs.name;
                            }
                        }
                    }
                });
            }

            // Check vital signs for fall-related indicators
            if (patient.data.vital_signs) {
                patient.data.vital_signs.forEach(vital => {
                    if (vital.name) {
                        const vitalName = vital.name.toLowerCase();
                        
                        if (vitalName.includes('fall') || vitalName.includes('sturz')) {
                            processedPatient.fallRiskScore = vital.value || vital.name;
                            processedPatient.lastAssessment = vital.date;
                            processedPatient.fallRisk = this.determineFallRisk(vital.name, vital.value);
                        }
                    }
                });
            }

            // Check conditions for fall-related diagnoses
            if (patient.data.condition) {
                patient.data.condition.forEach(condition => {
                    if (condition.name) {
                        const conditionName = condition.name.toLowerCase();
                        
                        // Conditions that increase fall risk
                        if (conditionName.includes('fractur') || conditionName.includes('bruch') ||
                            conditionName.includes('dementia') || conditionName.includes('demenz') ||
                            conditionName.includes('migraine') || conditionName.includes('migräne')) {
                            if (processedPatient.fallRisk === 'unknown') {
                                processedPatient.fallRisk = 'high';
                            }
                        }
                    }
                });
            }
        }

        // If no specific fall risk data found, infer from age and conditions
        if (processedPatient.fallRisk === 'unknown') {
            processedPatient.fallRisk = this.inferFallRisk(processedPatient.age, patient.data);
        }

        return processedPatient;
    }

    calculateAge(birthDate) {
        if (!birthDate) return 'Unbekannt';
        
        const birth = new Date(birthDate);
        const today = new Date();
        let age = today.getFullYear() - birth.getFullYear();
        const monthDiff = today.getMonth() - birth.getMonth();
        
        if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
            age--;
        }
        
        return age;
    }

    determineFallRisk(name, value) {
        if (!name && !value) return 'unknown';
        
        const text = (name + ' ' + (value || '')).toLowerCase();
        
        // High risk indicators
        if (text.includes('high') || text.includes('hoch') || 
            text.includes('severe') || text.includes('schwer') ||
            (value && this.extractNumericValue(value) >= 8)) {
            return 'high';
        }
        
        // Medium risk indicators
        if (text.includes('medium') || text.includes('mittel') || 
            text.includes('moderate') || text.includes('mäßig') ||
            (value && this.extractNumericValue(value) >= 4)) {
            return 'medium';
        }
        
        // Low risk indicators
        if (text.includes('low') || text.includes('niedrig') || 
            text.includes('minimal') || text.includes('gering')) {
            return 'low';
        }
        
        return 'unknown';
    }

    inferFallRisk(age, patientData) {
        // Age-based risk assessment
        if (age >= 75) return 'high';
        if (age >= 65) return 'medium';
        if (age >= 50) return 'low';
        return 'low';
    }

    extractNumericValue(value) {
        if (!value) return 0;
        const match = value.toString().match(/(\d+\.?\d*)/);
        return match ? parseFloat(match[1]) : 0;
    }

    setupEventListeners() {
        document.getElementById('filterAll').addEventListener('click', () => {
            this.currentFilter = 'all';
            this.updateFilterButtons();
            this.renderPatientsTable();
        });

        document.getElementById('filterHighRisk').addEventListener('click', () => {
            this.currentFilter = 'high-risk';
            this.updateFilterButtons();
            this.renderPatientsTable();
        });

        document.getElementById('filterCurrentFalls').addEventListener('click', () => {
            this.currentFilter = 'current-falls';
            this.updateFilterButtons();
            this.renderPatientsTable();
        });
    }

    updateFilterButtons() {
        document.querySelectorAll('.btn-outline-secondary, .btn-outline-danger, .btn-outline-info').forEach(btn => {
            btn.classList.remove('active');
        });

        if (this.currentFilter === 'all') {
            document.getElementById('filterAll').classList.add('active');
        } else if (this.currentFilter === 'high-risk') {
            document.getElementById('filterHighRisk').classList.add('active');
        } else if (this.currentFilter === 'current-falls') {
            document.getElementById('filterCurrentFalls').classList.add('active');
        }
    }

    renderDashboard() {
        this.renderStatistics();
        this.renderPatientsTable();
    }

    renderStatistics() {
        const stats = {
            high: this.patients.filter(p => p.fallRisk === 'high').length,
            medium: this.patients.filter(p => p.fallRisk === 'medium').length,
            low: this.patients.filter(p => p.fallRisk === 'low').length,
            currentFalls: this.patients.filter(p => p.currentFall).length
        };

        document.getElementById('highRiskCount').textContent = stats.high;
        document.getElementById('mediumRiskCount').textContent = stats.medium;
        document.getElementById('lowRiskCount').textContent = stats.low;
        document.getElementById('currentFallCount').textContent = stats.currentFalls;
    }

    renderPatientsTable() {
        const tbody = document.getElementById('patientsTable');
        const noDataMessage = document.getElementById('noDataMessage');
        
        let filteredPatients = this.patients;

        // Apply filters
        if (this.currentFilter === 'high-risk') {
            filteredPatients = this.patients.filter(p => p.fallRisk === 'high');
        } else if (this.currentFilter === 'current-falls') {
            filteredPatients = this.patients.filter(p => p.currentFall);
        }

        if (filteredPatients.length === 0) {
            tbody.innerHTML = '';
            noDataMessage.style.display = 'block';
            return;
        }

        noDataMessage.style.display = 'none';
        
        tbody.innerHTML = filteredPatients.map(patient => `
            <tr>
                <td>
                    <div class="patient-name">${patient.name}</div>
                    <div class="patient-id">ID: ${patient.id}</div>
                </td>
                <td>
                    <span class="age-display">${patient.age}</span>
                </td>
                <td>
                    <span class="gender-display">${this.formatGender(patient.gender)}</span>
                </td>
                <td>
                    <span class="risk-badge risk-${patient.fallRisk}">
                        ${this.formatFallRisk(patient.fallRisk)}
                    </span>
                </td>
                <td>
                    <span class="fall-status fall-${patient.currentFall ? 'yes' : 'no'}">
                        <i class="fas fa-${patient.currentFall ? 'exclamation-triangle' : 'check'} me-1"></i>
                        ${patient.currentFall ? 'Ja' : 'Nein'}
                    </span>
                </td>
                <td>
                    <span class="date-display">
                        ${patient.lastAssessment ? this.formatDate(patient.lastAssessment) : 'Keine Daten'}
                    </span>
                </td>
                <td>
                    <button class="btn btn-outline-primary btn-action" onclick="alert('Patientendetails für ${patient.name}')">
                        <i class="fas fa-eye me-1"></i>Details
                    </button>
                </td>
            </tr>
        `).join('');
    }

    formatGender(gender) {
        const genderMap = {
            'male': 'Männlich',
            'female': 'Weiblich',
            'other': 'Andere',
            'unknown': 'Unbekannt'
        };
        return genderMap[gender] || gender;
    }

    formatFallRisk(risk) {
        const riskMap = {
            'high': 'Hoch',
            'medium': 'Mittel',
            'low': 'Niedrig',
            'unknown': 'Unbekannt'
        };
        return riskMap[risk] || risk;
    }

    formatDate(dateString) {
        if (!dateString) return 'Unbekannt';
        
        try {
            const date = new Date(dateString);
            return date.toLocaleDateString('de-DE', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric'
            });
        } catch (error) {
            return 'Ungültiges Datum';
        }
    }
}

// Initialize the dashboard when the page loads
document.addEventListener('DOMContentLoaded', () => {
    new FallRiskDashboard();
});