// Mock patient data structure matching the FHIR data provided
window.PATIENT_DATA = {
    patient: {
        id: 'pat-0a70a8f4',
        name: 'Jane Doe',
        gender: 'female',
        birthDate: '1980-02-15'
    },
    locations: {
        summary: [
            {
                name: 'Room 205',
                value: 'Oncology Ward',
                status: 'active'
            }
        ]
    },
    observation: {
        summary: [
            {
                name: 'Tumor Marker CA15-3',
                value: 'Tumor Marker CA15-3',
                date: '2026-03-05T12:00:00Z',
                status: 'final'
            }
        ]
    },
    vital_signs: {
        summary: [
            {
                name: 'Tumor Marker CA15-3',
                value: 'Tumor Marker CA15-3',
                date: '2026-03-05T12:00:00Z',
                status: 'final'
            }
        ]
    },
    medicationrequest: {
        summary: [
            {
                name: 'Treatment for Breast Cancer',
                value: '1 tablet daily',
                status: 'active'
            }
        ]
    },
    encounter: {
        summary: [
            {
                name: '',
                value: '',
                date: '2026-03-01T08:00:00Z',
                status: 'in-progress'
            }
        ]
    },
    condition: {
        summary: [
            {
                name: 'Breast Cancer',
                date: '2026-03-01T09:00:00Z'
            }
        ]
    }
};

class PatientDashboard {
    constructor() {
        this.patientData = window.PATIENT_DATA;
        this.init();
    }

    init() {
        this.loadPatientInfo();
        this.loadLocations();
        this.loadObservations();
        this.loadMedications();
        this.loadEncounters();
    }

    loadPatientInfo() {
        const patient = this.patientData.patient;
        
        document.getElementById('patientName').textContent = patient.name || 'Unknown Patient';
        document.getElementById('patientGender').innerHTML = `<i class="fas fa-venus-mars me-1"></i>${this.capitalizeFirst(patient.gender) || 'Unknown'}`;
        document.getElementById('patientDob').innerHTML = `<i class="fas fa-calendar me-1"></i>${this.formatDate(patient.birthDate) || 'Unknown'}`;
        document.getElementById('patientId').innerHTML = `<i class="fas fa-id-card me-1"></i>${patient.id || 'Unknown'}`;
    }

    loadLocations() {
        const locationSection = document.getElementById('locationSection');
        const locations = this.patientData.locations?.summary || [];

        if (locations.length === 0) {
            locationSection.innerHTML = '<div class="no-data">No location data available</div>';
            return;
        }

        let html = '';
        locations.forEach(location => {
            const statusClass = this.getStatusClass(location.status);
            html += `
                <div class="location-item">
                    <div class="d-flex justify-content-between align-items-start">
                        <div>
                            <div class="location-room">
                                <i class="fas fa-door-open text-primary me-2"></i>
                                ${location.name || 'Unknown Room'}
                            </div>
                            <div class="location-ward mt-1">
                                <i class="fas fa-hospital text-muted me-2"></i>
                                ${location.value || 'Unknown Ward'}
                            </div>
                        </div>
                        <span class="status-badge ${statusClass}">
                            ${location.status || 'unknown'}
                        </span>
                    </div>
                </div>
            `;
        });

        locationSection.innerHTML = html;
    }

    loadObservations() {
        const observationSection = document.getElementById('observationSection');
        const observations = this.patientData.observation?.summary || [];
        const vitalSigns = this.patientData.vital_signs?.summary || [];
        
        // Combine observations and vital signs
        const allObservations = [...observations, ...vitalSigns];
        
        // Remove duplicates based on name and date
        const uniqueObservations = allObservations.filter((obs, index, self) => 
            index === self.findIndex(o => o.name === obs.name && o.date === obs.date)
        );

        if (uniqueObservations.length === 0) {
            observationSection.innerHTML = '<div class="no-data">No observation data available</div>';
            return;
        }

        let html = '';
        uniqueObservations.forEach(obs => {
            const statusClass = this.getStatusClass(obs.status);
            html += `
                <div class="observation-item">
                    <div class="item-name">
                        <i class="fas fa-chart-line text-success me-2"></i>
                        ${obs.name || 'Unknown Observation'}
                    </div>
                    ${obs.value ? `<div class="item-value">${obs.value}</div>` : ''}
                    <div class="d-flex justify-content-between align-items-center mt-2">
                        <div class="item-date">
                            <i class="fas fa-clock me-1"></i>
                            ${this.formatDateTime(obs.date) || 'Unknown date'}
                        </div>
                        <span class="status-badge ${statusClass}">
                            ${obs.status || 'unknown'}
                        </span>
                    </div>
                </div>
            `;
        });

        observationSection.innerHTML = html;
    }

    loadMedications() {
        const medicationSection = document.getElementById('medicationSection');
        const medications = this.patientData.medicationrequest?.summary || [];

        if (medications.length === 0) {
            medicationSection.innerHTML = '<div class="no-data">No medication data available</div>';
            return;
        }

        let html = '';
        medications.forEach(med => {
            const statusClass = this.getStatusClass(med.status);
            html += `
                <div class="medication-item">
                    <div class="item-name">
                        <i class="fas fa-pills text-warning me-2"></i>
                        ${med.name || 'Unknown Medication'}
                    </div>
                    ${med.value ? `<div class="item-value">Dosage: ${med.value}</div>` : ''}
                    <div class="d-flex justify-content-between align-items-center mt-2">
                        <div class="item-date">
                            <i class="fas fa-prescription-bottle me-1"></i>
                            Prescription
                        </div>
                        <span class="status-badge ${statusClass}">
                            ${med.status || 'unknown'}
                        </span>
                    </div>
                </div>
            `;
        });

        medicationSection.innerHTML = html;
    }

    loadEncounters() {
        const encounterSection = document.getElementById('encounterSection');
        const encounters = this.patientData.encounter?.summary || [];

        if (encounters.length === 0) {
            encounterSection.innerHTML = '<div class="no-data">No encounter data available</div>';
            return;
        }

        let html = '';
        encounters.forEach(encounter => {
            const statusClass = this.getStatusClass(encounter.status);
            const encounterName = encounter.name || 'Medical Encounter';
            html += `
                <div class="encounter-item">
                    <div class="item-name">
                        <i class="fas fa-calendar-check text-info me-2"></i>
                        ${encounterName}
                    </div>
                    ${encounter.value ? `<div class="item-value">${encounter.value}</div>` : ''}
                    <div class="d-flex justify-content-between align-items-center mt-2">
                        <div class="item-date">
                            <i class="fas fa-clock me-1"></i>
                            ${this.formatDateTime(encounter.date) || 'Unknown date'}
                        </div>
                        <span class="status-badge ${statusClass}">
                            ${encounter.status || 'unknown'}
                        </span>
                    </div>
                </div>
            `;
        });

        encounterSection.innerHTML = html;
    }

    getStatusClass(status) {
        switch (status?.toLowerCase()) {
            case 'active':
                return 'status-active';
            case 'final':
                return 'status-final';
            case 'in-progress':
                return 'status-in-progress';
            default:
                return 'status-active';
        }
    }

    capitalizeFirst(str) {
        if (!str) return '';
        return str.charAt(0).toUpperCase() + str.slice(1);
    }

    formatDate(dateString) {
        if (!dateString) return '';
        try {
            const date = new Date(dateString);
            return date.toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            });
        } catch (e) {
            return dateString;
        }
    }

    formatDateTime(dateString) {
        if (!dateString) return '';
        try {
            const date = new Date(dateString);
            return date.toLocaleString('en-US', {
                year: 'numeric',
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            });
        } catch (e) {
            return dateString;
        }
    }
}

// Initialize the dashboard when the page loads
document.addEventListener('DOMContentLoaded', () => {
    new PatientDashboard();
});