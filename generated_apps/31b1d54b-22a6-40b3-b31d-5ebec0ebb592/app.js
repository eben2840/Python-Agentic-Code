// Mock patient data structure for development
window.PATIENT_DATA = {
    patient: { id: 'all' },
    patients: [
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
        }
    ]
};

class AsthmaPatientsDashboard {
    constructor() {
        this.asthmaPatients = [];
        this.init();
    }

    init() {
        this.loadAsthmaPatients();
        this.updateStats();
        this.renderPatients();
    }

    loadAsthmaPatients() {
        if (!window.PATIENT_DATA || !window.PATIENT_DATA.patients) {
            console.error('Patient data not available');
            return;
        }

        // Filter patients with asthma condition
        this.asthmaPatients = window.PATIENT_DATA.patients.filter(patient => {
            return patient.data && 
                   patient.data.condition && 
                   patient.data.condition.some(condition => 
                       condition.name && condition.name.toLowerCase().includes('asthma')
                   );
        });
    }

    updateStats() {
        const totalPatients = this.asthmaPatients.length;
        let activeConditions = 0;
        let activeMedications = 0;
        let recentObservations = 0;

        this.asthmaPatients.forEach(patient => {
            if (patient.data.condition) {
                activeConditions += patient.data.condition.length;
            }
            if (patient.data.medicationrequest) {
                activeMedications += patient.data.medicationrequest.length;
            }
            if (patient.data.observation) {
                recentObservations += patient.data.observation.length;
            }
        });

        document.getElementById('totalPatients').textContent = totalPatients;
        document.getElementById('activeConditions').textContent = activeConditions;
        document.getElementById('activeMedications').textContent = activeMedications;
        document.getElementById('recentObservations').textContent = recentObservations;
    }

    renderPatients() {
        const container = document.getElementById('patientsContainer');
        
        if (this.asthmaPatients.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-lungs"></i>
                    <h3>No Asthma Patients Found</h3>
                    <p>No patients with asthma conditions are currently in the system.</p>
                </div>
            `;
            return;
        }

        const patientsHTML = this.asthmaPatients.map(patient => this.createPatientCard(patient)).join('');
        container.innerHTML = patientsHTML;
    }

    createPatientCard(patient) {
        const initials = this.getPatientInitials(patient.name);
        const age = this.calculateAge(patient.birthDate);
        const genderIcon = patient.gender === 'male' ? 'fas fa-mars' : 'fas fa-venus';

        return `
            <div class="patient-card">
                <div class="patient-header">
                    <div class="patient-avatar">
                        ${initials}
                    </div>
                    <div class="patient-info">
                        <h4>${patient.name}</h4>
                        <p><i class="${genderIcon} me-1"></i>${this.capitalizeFirst(patient.gender)} • Age ${age} • ID: ${patient.id}</p>
                    </div>
                </div>
                
                <div class="patient-details">
                    <div class="row">
                        <div class="col-md-6">
                            ${this.renderConditions(patient.data.condition)}
                            ${this.renderMedications(patient.data.medicationrequest)}
                        </div>
                        <div class="col-md-6">
                            ${this.renderObservations(patient.data.observation)}
                            ${this.renderEncounters(patient.data.encounter)}
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    renderConditions(conditions) {
        if (!conditions || conditions.length === 0) {
            return `
                <div class="detail-section">
                    <h6><i class="fas fa-stethoscope"></i>Conditions</h6>
                    <div class="no-data">No conditions available</div>
                </div>
            `;
        }

        const conditionsHTML = conditions.map(condition => `
            <div class="detail-item">
                <strong>${condition.name || 'Unknown Condition'}</strong>
                ${condition.date ? `<br><span><i class="fas fa-calendar me-1"></i>${this.formatDate(condition.date)}</span>` : ''}
            </div>
        `).join('');

        return `
            <div class="detail-section">
                <h6><i class="fas fa-stethoscope"></i>Conditions</h6>
                ${conditionsHTML}
            </div>
        `;
    }

    renderMedications(medications) {
        if (!medications || medications.length === 0) {
            return `
                <div class="detail-section">
                    <h6><i class="fas fa-pills"></i>Medications</h6>
                    <div class="no-data">No medications available</div>
                </div>
            `;
        }

        const medicationsHTML = medications.map(medication => `
            <div class="detail-item">
                <strong>${medication.name || 'Unknown Medication'}</strong>
                ${medication.status ? `<br><span><i class="fas fa-info-circle me-1"></i>${medication.status}</span>` : ''}
            </div>
        `).join('');

        return `
            <div class="detail-section">
                <h6><i class="fas fa-pills"></i>Medications</h6>
                ${medicationsHTML}
            </div>
        `;
    }

    renderObservations(observations) {
        if (!observations || observations.length === 0) {
            return `
                <div class="detail-section">
                    <h6><i class="fas fa-chart-line"></i>Latest Observations</h6>
                    <div class="no-data">No observations available</div>
                </div>
            `;
        }

        const observationsHTML = observations.map(observation => `
            <div class="detail-item">
                <strong>${observation.name || 'Unknown Observation'}</strong>
                ${observation.date ? `<br><span><i class="fas fa-clock me-1"></i>${this.formatDate(observation.date)}</span>` : ''}
            </div>
        `).join('');

        return `
            <div class="detail-section">
                <h6><i class="fas fa-chart-line"></i>Latest Observations</h6>
                ${observationsHTML}
            </div>
        `;
    }

    renderEncounters(encounters) {
        if (!encounters || encounters.length === 0) {
            return `
                <div class="detail-section">
                    <h6><i class="fas fa-hospital"></i>Recent Encounters</h6>
                    <div class="no-data">No encounters available</div>
                </div>
            `;
        }

        const encountersHTML = encounters.map(encounter => `
            <div class="detail-item">
                <strong>Healthcare Encounter</strong>
                ${encounter.date ? `<br><span><i class="fas fa-calendar me-1"></i>${this.formatDate(encounter.date)}</span>` : ''}
            </div>
        `).join('');

        return `
            <div class="detail-section">
                <h6><i class="fas fa-hospital"></i>Recent Encounters</h6>
                ${encountersHTML}
            </div>
        `;
    }

    getPatientInitials(name) {
        if (!name) return '?';
        return name.split(' ').map(n => n.charAt(0)).join('').toUpperCase().substring(0, 2);
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

    capitalizeFirst(str) {
        if (!str) return '';
        return str.charAt(0).toUpperCase() + str.slice(1);
    }

    formatDate(dateString) {
        if (!dateString) return 'Unknown date';
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
document.addEventListener('DOMContentLoaded', function() {
    new AsthmaPatientsDashboard();
});