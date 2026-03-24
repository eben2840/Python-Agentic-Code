class ObservationsDashboard {
    constructor() {
        this.observations = [];
        this.filteredObservations = [];
        this.currentFilter = 'all';
        this.init();
    }

    init() {
        this.loadObservations();
        this.setupEventListeners();
        this.render();
    }

    loadObservations() {
        if (!window.PATIENT_DATA) {
            console.error('No patient data available');
            return;
        }

        const data = window.PATIENT_DATA;
        this.observations = [];

        if (data.patient && data.patient.id === 'all') {
            // All patients view
            if (data.patients && Array.isArray(data.patients)) {
                data.patients.forEach(patient => {
                    if (patient.data) {
                        Object.entries(patient.data).forEach(([resourceType, records]) => {
                            if ((resourceType === 'observation' || resourceType === 'vital_signs') && Array.isArray(records)) {
                                records.forEach(record => {
                                    this.observations.push({
                                        patientId: patient.id,
                                        patientName: patient.name || 'Unknown Patient',
                                        patientGender: patient.gender || 'Unknown',
                                        patientBirthDate: patient.birthDate || null,
                                        type: resourceType,
                                        name: record.name || 'Unknown Observation',
                                        value: record.value || record.name || 'No value',
                                        status: record.status || 'unknown',
                                        date: record.date || null
                                    });
                                });
                            }
                        });
                    }
                });
            }
        } else {
            // Single patient view
            const patient = data.patient;
            if (patient) {
                ['observation', 'vital_signs'].forEach(resourceType => {
                    if (data[resourceType] && data[resourceType].summary && Array.isArray(data[resourceType].summary)) {
                        data[resourceType].summary.forEach(record => {
                            this.observations.push({
                                patientId: patient.id,
                                patientName: patient.name || 'Unknown Patient',
                                patientGender: patient.gender || 'Unknown',
                                patientBirthDate: patient.birthDate || null,
                                type: resourceType,
                                name: record.name || 'Unknown Observation',
                                value: record.value || record.name || 'No value',
                                status: record.status || 'unknown',
                                date: record.date || null
                            });
                        });
                    }
                });
            }
        }

        this.filteredObservations = [...this.observations];
        this.updateStats();
    }

    setupEventListeners() {
        const filterSelect = document.getElementById('filterType');
        if (filterSelect) {
            filterSelect.addEventListener('change', (e) => {
                this.currentFilter = e.target.value;
                this.applyFilter();
                this.render();
            });
        }
    }

    applyFilter() {
        if (this.currentFilter === 'all') {
            this.filteredObservations = [...this.observations];
        } else {
            this.filteredObservations = this.observations.filter(obs => obs.type === this.currentFilter);
        }
    }

    updateStats() {
        const totalObservations = this.observations.length;
        const uniquePatients = new Set(this.observations.map(obs => obs.patientId)).size;
        
        // Calculate recent observations (last 24 hours)
        const now = new Date();
        const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        const recentObservations = this.observations.filter(obs => {
            if (!obs.date) return false;
            const obsDate = new Date(obs.date);
            return obsDate >= yesterday;
        }).length;

        document.getElementById('totalObservations').textContent = totalObservations;
        document.getElementById('totalPatients').textContent = uniquePatients;
        document.getElementById('recentObservations').textContent = recentObservations;
    }

    formatDate(dateString) {
        if (!dateString) return 'No date';
        try {
            const date = new Date(dateString);
            return date.toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            });
        } catch (e) {
            return 'Invalid date';
        }
    }

    formatPatientAge(birthDate) {
        if (!birthDate) return '';
        try {
            const birth = new Date(birthDate);
            const now = new Date();
            const age = Math.floor((now - birth) / (365.25 * 24 * 60 * 60 * 1000));
            return `, ${age}y`;
        } catch (e) {
            return '';
        }
    }

    getTypeClass(type) {
        return type === 'vital_signs' ? 'type-vital' : 'type-lab';
    }

    getTypeLabel(type) {
        return type === 'vital_signs' ? 'Vital Signs' : 'Lab Result';
    }

    getStatusClass(status) {
        const statusLower = (status || '').toLowerCase();
        if (statusLower.includes('normal') || statusLower.includes('stable')) {
            return 'status-normal';
        } else if (statusLower.includes('critical') || statusLower.includes('severe')) {
            return 'status-critical';
        } else if (statusLower.includes('abnormal') || statusLower.includes('high') || statusLower.includes('low')) {
            return 'status-abnormal';
        }
        return 'status-normal';
    }

    getStatusLabel(status) {
        if (!status || status === 'unknown') return 'Unknown';
        return status.charAt(0).toUpperCase() + status.slice(1);
    }

    render() {
        const container = document.getElementById('observationsContainer');
        const noDataState = document.getElementById('noDataState');

        if (this.filteredObservations.length === 0) {
            container.innerHTML = '';
            noDataState.classList.remove('d-none');
            return;
        }

        noDataState.classList.add('d-none');

        let html = `
            <div class="grid-header">
                <div>Patient</div>
                <div>Observation</div>
                <div>Value</div>
                <div>Type</div>
                <div>Date</div>
            </div>
        `;

        this.filteredObservations.forEach(obs => {
            html += `
                <div class="observation-row">
                    <div class="patient-info">
                        <h5>${obs.patientName}</h5>
                        <div class="patient-meta">
                            ${obs.patientGender}${this.formatPatientAge(obs.patientBirthDate)}
                        </div>
                    </div>
                    <div class="observation-details">
                        <h6>${obs.name}</h6>
                    </div>
                    <div class="observation-value">
                        ${obs.value}
                    </div>
                    <div>
                        <span class="type-badge ${this.getTypeClass(obs.type)}">
                            ${this.getTypeLabel(obs.type)}
                        </span>
                    </div>
                    <div class="observation-date">
                        ${this.formatDate(obs.date)}
                    </div>
                </div>
            `;
        });

        container.innerHTML = html;
    }
}

// Initialize the dashboard when the DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new ObservationsDashboard();
});