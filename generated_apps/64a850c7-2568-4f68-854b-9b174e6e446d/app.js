// Mock patient data structure for development
window.PATIENT_DATA = {
    patient: {
        id: 'pat-0a70a8f4',
        name: 'Jane Doe',
        gender: 'female',
        birthDate: '1980-02-15'
    },
    observation: {
        summary: [
            {
                name: 'Tumor Marker CA15-3',
                value: 'Tumor Marker CA15-3',
                date: '2026-03-05T12:00:00Z',
                status: 'final'
            },
            {
                name: 'Blood Pressure',
                value: '120/80 mmHg',
                date: '2026-03-04T10:30:00Z',
                status: 'final'
            },
            {
                name: 'Heart Rate',
                value: '72 bpm',
                date: '2026-03-04T10:30:00Z',
                status: 'final'
            }
        ]
    },
    medicationrequest: {
        summary: [
            {
                name: 'Treatment for Breast Cancer',
                value: '1 tablet daily',
                date: '',
                status: 'active'
            }
        ]
    }
};

class PatientClinicalApp {
    constructor() {
        this.patientData = window.PATIENT_DATA;
        this.allObservations = this.patientData.observation?.summary || [];
        this.filteredObservations = [...this.allObservations];
        this.init();
    }

    init() {
        this.renderPatientHeader();
        this.setupObservationFilter();
        this.renderObservations();
        this.renderMedications();
    }

    renderPatientHeader() {
        const patient = this.patientData.patient;
        
        document.getElementById('patientName').textContent = patient.name || 'Unknown Patient';
        document.getElementById('patientGender').textContent = this.capitalizeFirst(patient.gender) || '-';
        document.getElementById('patientAge').textContent = this.calculateAge(patient.birthDate) || '-';
        document.getElementById('patientId').textContent = patient.id || '-';
    }

    setupObservationFilter() {
        const filterSelect = document.getElementById('observationFilter');
        const uniqueObservations = [...new Set(this.allObservations.map(obs => obs.name))];
        
        // Populate filter options
        uniqueObservations.forEach(obsName => {
            const option = document.createElement('option');
            option.value = obsName;
            option.textContent = obsName;
            filterSelect.appendChild(option);
        });

        // Add event listener for filter changes
        filterSelect.addEventListener('change', (e) => {
            this.filterObservations(e.target.value);
        });
    }

    filterObservations(filterValue) {
        if (filterValue === '') {
            this.filteredObservations = [...this.allObservations];
        } else {
            this.filteredObservations = this.allObservations.filter(obs => obs.name === filterValue);
        }
        this.renderObservations();
    }

    renderObservations() {
        const container = document.getElementById('observationsContent');
        const observations = this.filteredObservations;

        if (observations.length === 0) {
            container.innerHTML = '<div class="no-data">No data available</div>';
            return;
        }

        const html = observations.map(obs => `
            <div class="clinical-item">
                <div class="clinical-item-name">${obs.name || 'Unknown Observation'}</div>
                ${obs.value ? `<div class="clinical-item-value">${obs.value}</div>` : ''}
                <div class="d-flex justify-content-between align-items-center">
                    <div class="clinical-item-date">${this.formatDate(obs.date)}</div>
                    ${obs.status ? `<span class="status-badge status-${obs.status}">${obs.status}</span>` : ''}
                </div>
            </div>
        `).join('');

        container.innerHTML = html;
    }

    renderMedications() {
        const container = document.getElementById('medicationsContent');
        const medications = this.patientData.medicationrequest?.summary || [];

        if (medications.length === 0) {
            container.innerHTML = '<div class="no-data">No data available</div>';
            return;
        }

        const html = medications.map(med => `
            <div class="clinical-item">
                <div class="clinical-item-name">${med.name || 'Unknown Medication'}</div>
                ${med.value ? `<div class="clinical-item-value">${med.value}</div>` : ''}
                <div class="d-flex justify-content-between align-items-center">
                    <div class="clinical-item-date">${this.formatDate(med.date)}</div>
                    ${med.status ? `<span class="status-badge status-${med.status}">${med.status}</span>` : ''}
                </div>
            </div>
        `).join('');

        container.innerHTML = html;
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
        
        return `${age} years`;
    }

    formatDate(dateString) {
        if (!dateString) return '-';
        
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    }

    capitalizeFirst(str) {
        if (!str) return '';
        return str.charAt(0).toUpperCase() + str.slice(1);
    }
}

// Initialize the app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new PatientClinicalApp();
});