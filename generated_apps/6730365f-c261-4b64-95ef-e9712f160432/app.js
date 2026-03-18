class ConditionDashboard {
    constructor() {
        this.patientData = null;
        this.init();
    }

    init() {
        // Wait for DOM to be ready
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.loadData());
        } else {
            this.loadData();
        }
    }

    loadData() {
        // Check if patient data is available
        if (typeof window.PATIENT_DATA === 'undefined') {
            console.warn('Patient data not available, using fallback');
            this.showEmptyState();
            return;
        }

        this.patientData = window.PATIENT_DATA;
        this.renderDashboard();
    }

    renderDashboard() {
        if (!this.patientData) {
            this.showEmptyState();
            return;
        }

        // Handle both single patient and all patients data
        if (this.patientData.patient && this.patientData.patient.id !== 'all') {
            this.renderSinglePatient();
        } else if (this.patientData.patients) {
            this.renderAllPatients();
        } else {
            this.showEmptyState();
        }
    }

    renderSinglePatient() {
        const data = this.patientData;
        
        // Update patient info
        this.updatePatientInfo(data.patient);
        
        // Update counts
        this.updateCounts(data);
        
        // Render conditions
        this.renderConditions(data.condition?.summary || []);
        
        // Render medications
        this.renderMedications(data.medicationrequest?.summary || []);
        
        // Render observations
        this.renderObservations(data.observation?.summary || []);
        
        // Render location
        this.renderLocation(data.locations?.summary || []);
    }

    renderAllPatients() {
        const patients = this.patientData.patients || [];
        
        // Update header for all patients view
        document.getElementById('patient-info').textContent = `Viewing ${patients.length} patients`;
        
        let allConditions = [];
        let allMedications = [];
        let allObservations = [];
        let allLocations = [];
        
        // Aggregate data from all patients
        patients.forEach(patient => {
            if (patient.data) {
                // Add conditions
                if (patient.data.condition) {
                    patient.data.condition.forEach(condition => {
                        allConditions.push({
                            ...condition,
                            patientName: patient.name,
                            patientId: patient.id
                        });
                    });
                }
                
                // Add medications
                if (patient.data.medicationrequest) {
                    patient.data.medicationrequest.forEach(med => {
                        allMedications.push({
                            ...med,
                            patientName: patient.name,
                            patientId: patient.id
                        });
                    });
                }
                
                // Add observations
                if (patient.data.observation) {
                    patient.data.observation.forEach(obs => {
                        allObservations.push({
                            ...obs,
                            patientName: patient.name,
                            patientId: patient.id
                        });
                    });
                }
                
                // Add locations
                if (patient.data.locations) {
                    patient.data.locations.forEach(loc => {
                        allLocations.push({
                            ...loc,
                            patientName: patient.name,
                            patientId: patient.id
                        });
                    });
                }
            }
        });
        
        // Update counts
        document.getElementById('condition-count').textContent = allConditions.length;
        document.getElementById('medication-count').textContent = allMedications.length;
        document.getElementById('observation-count').textContent = allObservations.length;
        document.getElementById('encounter-count').textContent = '0'; // No encounter data in structure
        
        // Render aggregated data
        this.renderConditions(allConditions);
        this.renderMedications(allMedications);
        this.renderObservations(allObservations);
        this.renderAllPatientsLocation(allLocations);
    }

    updatePatientInfo(patient) {
        if (!patient) return;
        
        const age = this.calculateAge(patient.birthDate);
        const patientInfo = `${patient.name} • ${patient.gender} • Age ${age}`;
        document.getElementById('patient-info').textContent = patientInfo;
    }

    updateCounts(data) {
        document.getElementById('condition-count').textContent = (data.condition?.summary || []).length;
        document.getElementById('medication-count').textContent = (data.medicationrequest?.summary || []).length;
        document.getElementById('observation-count').textContent = (data.observation?.summary || []).length;
        document.getElementById('encounter-count').textContent = (data.encounter?.summary || []).length;
    }

    renderConditions(conditions) {
        const container = document.getElementById('conditions-container');
        
        if (!conditions || conditions.length === 0) {
            container.innerHTML = `
                <div class="col-12">
                    <div class="empty-state">
                        <i class="fas fa-notes-medical"></i>
                        <p>No conditions available</p>
                    </div>
                </div>
            `;
            return;
        }

        container.innerHTML = conditions.map(condition => `
            <div class="col-12 col-md-6 col-lg-4">
                <div class="condition-card" onclick="conditionDashboard.showConditionDetail('${condition.name || 'Unknown Condition'}')">
                    <div class="condition-title">${condition.name || 'Unknown Condition'}</div>
                    ${condition.patientName ? `<div class="condition-meta">Patient: ${condition.patientName}</div>` : ''}
                    <div class="condition-meta">
                        <i class="fas fa-calendar-alt me-1"></i>
                        ${this.formatDate(condition.date) || 'Date not available'}
                    </div>
                    <div class="mt-2">
                        <span class="condition-status ${this.getStatusClass(condition.status)}">
                            ${condition.status || 'Active'}
                        </span>
                    </div>
                </div>
            </div>
        `).join('');
    }

    renderMedications(medications) {
        const container = document.getElementById('medications-list');
        
        if (!medications || medications.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-pills"></i>
                    <p>No medications available</p>
                </div>
            `;
            return;
        }

        container.innerHTML = medications.map(med => `
            <div class="list-item">
                <div class="list-icon bg-primary">
                    <i class="fas fa-pills"></i>
                </div>
                <div class="list-content">
                    <div class="list-title">${med.name || 'Unknown Medication'}</div>
                    <div class="list-subtitle">${med.value || 'Dosage not specified'}</div>
                    ${med.patientName ? `<div class="list-subtitle">Patient: ${med.patientName}</div>` : ''}
                </div>
                <div class="list-meta">
                    <span class="badge bg-success">${med.status || 'Active'}</span>
                </div>
            </div>
        `).join('');
    }

    renderObservations(observations) {
        const container = document.getElementById('observations-list');
        
        if (!observations || observations.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-flask"></i>
                    <p>No observations available</p>
                </div>
            `;
            return;
        }

        container.innerHTML = observations.map(obs => `
            <div class="list-item">
                <div class="list-icon bg-success">
                    <i class="fas fa-microscope"></i>
                </div>
                <div class="list-content">
                    <div class="list-title">${obs.name || 'Unknown Observation'}</div>
                    <div class="list-subtitle">${obs.value || 'Value not available'}</div>
                    ${obs.patientName ? `<div class="list-subtitle">Patient: ${obs.patientName}</div>` : ''}
                </div>
                <div class="list-meta">
                    <div>${this.formatDate(obs.date) || 'Date not available'}</div>
                    <span class="badge bg-info">${obs.status || 'Final'}</span>
                </div>
            </div>
        `).join('');
    }

    renderLocation(locations) {
        const container = document.getElementById('location-info');
        
        if (!locations || locations.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-map-marker-alt"></i>
                    <p>No location available</p>
                </div>
            `;
            return;
        }

        const location = locations[0]; // Show first location
        container.innerHTML = `
            <div class="location-card">
                <div class="location-room">
                    <i class="fas fa-door-open me-2"></i>
                    ${location.name || 'Unknown Room'}
                </div>
                <div class="location-ward">${location.value || 'Unknown Ward'}</div>
                <div class="mt-2">
                    <span class="badge bg-light text-dark">${location.status || 'Active'}</span>
                </div>
            </div>
        `;
    }

    renderAllPatientsLocation(locations) {
        const container = document.getElementById('location-info');
        
        if (!locations || locations.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-map-marker-alt"></i>
                    <p>No locations available</p>
                </div>
            `;
            return;
        }

        // Group locations by room/ward
        const locationGroups = {};
        locations.forEach(loc => {
            const key = `${loc.name || 'Unknown'} - ${loc.value || 'Unknown'}`;
            if (!locationGroups[key]) {
                locationGroups[key] = [];
            }
            locationGroups[key].push(loc);
        });

        container.innerHTML = Object.entries(locationGroups).map(([location, patients]) => `
            <div class="mb-3">
                <div class="fw-bold">${location}</div>
                <div class="text-muted small">
                    ${patients.map(p => p.patientName).join(', ')}
                </div>
            </div>
        `).join('');
    }

    showConditionDetail(conditionName) {
        const modalContent = document.getElementById('modal-content');
        modalContent.innerHTML = `
            <div class="row">
                <div class="col-12">
                    <h6 class="text-primary mb-3">Condition Information</h6>
                    <div class="mb-3">
                        <strong>Condition:</strong> ${conditionName}
                    </div>
                    <div class="mb-3">
                        <strong>Status:</strong> <span class="badge bg-danger">Active</span>
                    </div>
                    <div class="mb-3">
                        <strong>Clinical Notes:</strong>
                        <p class="text-muted mt-1">Detailed clinical information would be displayed here based on the selected condition.</p>
                    </div>
                    <div class="mb-3">
                        <strong>Related Resources:</strong>
                        <ul class="list-unstyled mt-2">
                            <li><i class="fas fa-pills text-primary me-2"></i>Associated medications</li>
                            <li><i class="fas fa-flask text-success me-2"></i>Related lab results</li>
                            <li><i class="fas fa-notes-medical text-info me-2"></i>Clinical observations</li>
                        </ul>
                    </div>
                </div>
            </div>
        `;
        
        const modal = new bootstrap.Modal(document.getElementById('conditionModal'));
        modal.show();
    }

    showEmptyState() {
        // Update patient info
        document.getElementById('patient-info').textContent = 'No patient data available';
        
        // Reset counts
        document.getElementById('condition-count').textContent = '0';
        document.getElementById('medication-count').textContent = '0';
        document.getElementById('observation-count').textContent = '0';
        document.getElementById('encounter-count').textContent = '0';
        
        // Show empty states
        document.getElementById('conditions-container').innerHTML = `
            <div class="col-12">
                <div class="empty-state">
                    <i class="fas fa-notes-medical"></i>
                    <p>No patient data available</p>
                </div>
            </div>
        `;
        
        document.getElementById('medications-list').innerHTML = `
            <div class="empty-state">
                <i class="fas fa-pills"></i>
                <p>No data available</p>
            </div>
        `;
        
        document.getElementById('observations-list').innerHTML = `
            <div class="empty-state">
                <i class="fas fa-flask"></i>
                <p>No data available</p>
            </div>
        `;
        
        document.getElementById('location-info').innerHTML = `
            <div class="empty-state">
                <i class="fas fa-map-marker-alt"></i>
                <p>No data available</p>
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
        if (!dateString) return null;
        
        try {
            const date = new Date(dateString);
            return date.toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'short',
                day: 'numeric'
            });
        } catch (e) {
            return 'Invalid date';
        }
    }

    getStatusClass(status) {
        if (!status) return 'status-active';
        
        const statusLower = status.toLowerCase();
        if (statusLower.includes('resolved') || statusLower.includes('inactive')) {
            return 'status-resolved';
        } else if (statusLower.includes('chronic')) {
            return 'status-chronic';
        }
        return 'status-active';
    }
}

// Initialize the dashboard
const conditionDashboard = new ConditionDashboard();