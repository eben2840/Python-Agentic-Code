document.addEventListener('DOMContentLoaded', function() {
    loadMedications();
});

function loadMedications() {
    try {
        const data = window.PATIENT_DATA;
        
        if (!data) {
            showError('No patient data available');
            return;
        }

        // Handle single patient vs all patients
        if (data.patient && data.patient.id !== 'all') {
            loadSinglePatientMedications(data);
        } else if (data.patients) {
            loadAllPatientsMedications(data);
        } else {
            showError('Invalid patient data structure');
        }
    } catch (error) {
        console.error('Error loading medications:', error);
        showError('Error loading medication data');
    }
}

function loadSinglePatientMedications(data) {
    // Update patient name
    const patientNameEl = document.getElementById('patientName');
    patientNameEl.textContent = data.patient.name || 'Unknown Patient';

    // Get medications
    const medications = data.medicationrequest?.summary || [];
    
    if (medications.length === 0) {
        showNoData();
        return;
    }

    renderMedications(medications);
}

function loadAllPatientsMedications(data) {
    // Update header for all patients view
    const patientNameEl = document.getElementById('patientName');
    patientNameEl.textContent = 'All Patients';

    const allMedications = [];

    // Collect medications from all patients
    data.patients.forEach(patient => {
        if (patient.data && patient.data.medicationrequest) {
            patient.data.medicationrequest.forEach(med => {
                allMedications.push({
                    ...med,
                    patientName: patient.name || 'Unknown Patient',
                    patientId: patient.id
                });
            });
        }
    });

    if (allMedications.length === 0) {
        showNoData();
        return;
    }

    renderMedications(allMedications, true);
}

function renderMedications(medications, showPatientNames = false) {
    const container = document.getElementById('medicationsContainer');
    
    let html = '';
    
    medications.forEach((med, index) => {
        const statusClass = getStatusClass(med.status);
        
        html += `
            <div class="card medication-card mb-3">
                <div class="card-body">
                    <div class="medication-header">
                        <div class="medication-icon">
                            <i class="fas fa-pills"></i>
                        </div>
                        <div class="flex-grow-1">
                            <h3 class="medication-name">${med.name || 'No medication name available'}</h3>
                            ${showPatientNames ? `<p class="text-muted mb-0 small">Patient: ${med.patientName || 'Unknown'}</p>` : ''}
                        </div>
                        <span class="status-badge ${statusClass}">
                            ${med.status || 'Unknown'}
                        </span>
                    </div>
                    
                    <div class="medication-details">
                        ${med.value ? `
                            <div class="detail-row">
                                <span class="detail-label">Dosage</span>
                                <span class="detail-value">${med.value}</span>
                            </div>
                        ` : ''}
                        
                        ${med.date ? `
                            <div class="detail-row">
                                <span class="detail-label">Date Prescribed</span>
                                <span class="detail-value">${formatDate(med.date)}</span>
                            </div>
                        ` : ''}
                        
                        ${med.status ? `
                            <div class="detail-row">
                                <span class="detail-label">Status</span>
                                <span class="detail-value status-badge ${statusClass}">
                                    ${med.status}
                                </span>
                            </div>
                        ` : ''}
                    </div>
                </div>
            </div>
        `;
    });
    
    container.innerHTML = html;
}

function getStatusClass(status) {
    if (!status) return 'status-inactive';
    
    const statusLower = status.toLowerCase();
    
    if (statusLower.includes('active')) return 'status-active';
    if (statusLower.includes('completed')) return 'status-completed';
    if (statusLower.includes('inactive') || statusLower.includes('stopped')) return 'status-inactive';
    
    return 'status-active'; // default for unknown statuses
}

function formatDate(dateString) {
    if (!dateString) return 'No date available';
    
    try {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    } catch (error) {
        return dateString; // return original if parsing fails
    }
}

function showNoData() {
    document.getElementById('medicationsContainer').classList.add('d-none');
    document.getElementById('noDataMessage').classList.remove('d-none');
}

function showError(message) {
    const container = document.getElementById('medicationsContainer');
    container.innerHTML = `
        <div class="card">
            <div class="card-body text-center py-5">
                <i class="fas fa-exclamation-triangle text-warning mb-3" style="font-size: 3rem;"></i>
                <h4 class="text-muted">Error Loading Data</h4>
                <p class="text-muted mb-0">${message}</p>
            </div>
        </div>
    `;
}