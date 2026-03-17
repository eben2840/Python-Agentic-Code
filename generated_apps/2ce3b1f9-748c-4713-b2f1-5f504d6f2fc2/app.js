class MedicationChecklist {
    constructor() {
        this.medications = [];
        this.filteredMedications = [];
        this.completedMedications = new Set();
        
        this.init();
    }

    init() {
        this.loadMedications();
        this.bindEvents();
        this.render();
        this.updateStats();
    }

    loadMedications() {
        if (!window.PATIENT_DATA) {
            console.warn('No patient data available');
            return;
        }

        const data = window.PATIENT_DATA;
        
        if (data.patient && data.patient.id === 'all' && data.patients) {
            // All patients mode
            data.patients.forEach(patient => {
                if (patient.data && patient.data.medicationrequest) {
                    patient.data.medicationrequest.forEach(med => {
                        this.medications.push({
                            id: `${patient.id}-${med.name || 'Unknown'}`,
                            patientId: patient.id,
                            patientName: patient.name || 'Unknown Patient',
                            patientGender: patient.gender || 'unknown',
                            medicationName: med.name || 'Unknown Medication',
                            dosage: med.value || 'Dosage not specified',
                            status: med.status || 'active',
                            date: med.date || new Date().toISOString()
                        });
                    });
                }
            });
        } else if (data.patient && data.medicationrequest) {
            // Single patient mode
            data.medicationrequest.summary.forEach(med => {
                this.medications.push({
                    id: `${data.patient.id}-${med.name || 'Unknown'}`,
                    patientId: data.patient.id,
                    patientName: data.patient.name || 'Unknown Patient',
                    patientGender: data.patient.gender || 'unknown',
                    medicationName: med.name || 'Unknown Medication',
                    dosage: med.value || 'Dosage not specified',
                    status: med.status || 'active',
                    date: med.date || new Date().toISOString()
                });
            });
        }

        this.filteredMedications = [...this.medications];
    }

    bindEvents() {
        // Status filter
        document.getElementById('statusFilter').addEventListener('change', (e) => {
            this.filterMedications();
        });

        // Patient search
        document.getElementById('patientSearch').addEventListener('input', (e) => {
            this.filterMedications();
        });

        // Reset filters
        document.getElementById('resetFilters').addEventListener('click', () => {
            document.getElementById('statusFilter').value = 'all';
            document.getElementById('patientSearch').value = '';
            this.filterMedications();
        });

        // Medication administration checkboxes
        document.addEventListener('change', (e) => {
            if (e.target.classList.contains('medication-checkbox')) {
                const medicationId = e.target.dataset.medicationId;
                if (e.target.checked) {
                    this.completedMedications.add(medicationId);
                } else {
                    this.completedMedications.delete(medicationId);
                }
                this.updateMedicationStatus(medicationId);
                this.updateStats();
            }
        });
    }

    filterMedications() {
        const statusFilter = document.getElementById('statusFilter').value;
        const searchTerm = document.getElementById('patientSearch').value.toLowerCase();

        this.filteredMedications = this.medications.filter(med => {
            const matchesStatus = statusFilter === 'all' || 
                (statusFilter === 'completed' && this.completedMedications.has(med.id)) ||
                (statusFilter === 'pending' && !this.completedMedications.has(med.id));
            
            const matchesSearch = searchTerm === '' || 
                med.patientName.toLowerCase().includes(searchTerm) ||
                med.medicationName.toLowerCase().includes(searchTerm);

            return matchesStatus && matchesSearch;
        });

        this.render();
    }

    updateMedicationStatus(medicationId) {
        const card = document.querySelector(`[data-medication-id="${medicationId}"]`).closest('.medication-card');
        const statusBadge = card.querySelector('.status-badge');
        
        if (this.completedMedications.has(medicationId)) {
            card.classList.add('completed');
            card.classList.remove('pending');
            statusBadge.textContent = 'Completed';
            statusBadge.className = 'status-badge status-completed';
        } else {
            card.classList.remove('completed');
            card.classList.add('pending');
            statusBadge.textContent = 'Pending';
            statusBadge.className = 'status-badge status-pending';
        }
    }

    updateStats() {
        const total = this.medications.length;
        const completed = this.completedMedications.size;
        const pending = total - completed;

        document.getElementById('totalMeds').textContent = total;
        document.getElementById('completedMeds').textContent = completed;
        document.getElementById('pendingMeds').textContent = pending;
    }

    getPatientInitials(name) {
        if (!name) return '?';
        return name.split(' ')
            .map(word => word.charAt(0))
            .join('')
            .toUpperCase()
            .substring(0, 2);
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

    render() {
        const container = document.getElementById('medicationList');
        const noDataMessage = document.getElementById('noDataMessage');

        if (this.filteredMedications.length === 0) {
            container.innerHTML = '';
            noDataMessage.style.display = 'block';
            return;
        }

        noDataMessage.style.display = 'none';

        const html = this.filteredMedications.map(med => {
            const isCompleted = this.completedMedications.has(med.id);
            const statusClass = isCompleted ? 'completed' : 'pending';
            const statusText = isCompleted ? 'Completed' : 'Pending';
            const statusBadgeClass = isCompleted ? 'status-completed' : 'status-pending';

            return `
                <div class="col-lg-6 col-xl-4">
                    <div class="medication-card ${statusClass}">
                        <div class="card-header">
                            <div class="d-flex align-items-center justify-content-between">
                                <div class="patient-info">
                                    <div class="patient-avatar">
                                        ${this.getPatientInitials(med.patientName)}
                                    </div>
                                    <div class="patient-details">
                                        <h6>${med.patientName}</h6>
                                        <p class="patient-id">ID: ${med.patientId}</p>
                                    </div>
                                </div>
                                <span class="status-badge ${statusBadgeClass}">${statusText}</span>
                            </div>
                        </div>
                        <div class="card-body">
                            <div class="medication-info">
                                <div class="medication-name">${med.medicationName}</div>
                                <p class="medication-dosage">${med.dosage}</p>
                            </div>
                            <div class="medication-actions">
                                <div class="time-info">
                                    <i class="fas fa-clock me-1"></i>
                                    Prescribed: ${this.formatDate(med.date)}
                                </div>
                                <div class="admin-checkbox">
                                    <input 
                                        type="checkbox" 
                                        class="form-check-input medication-checkbox" 
                                        data-medication-id="${med.id}"
                                        ${isCompleted ? 'checked' : ''}
                                    >
                                    <label class="form-check-label">
                                        Mark as administered
                                    </label>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            `;
        }).join('');

        container.innerHTML = html;
    }
}

// Initialize the application when the DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new MedicationChecklist();
});