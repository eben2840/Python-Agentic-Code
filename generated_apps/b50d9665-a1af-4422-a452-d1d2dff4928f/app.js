document.addEventListener('DOMContentLoaded', function() {
    // Check if patient data is available
    if (!window.PATIENT_DATA) {
        console.error('Patient data not available');
        showError('Patient data not available');
        return;
    }

    const data = window.PATIENT_DATA;
    
    // Find Rose Hall patient
    let roseHallPatient = null;
    
    if (data.patient && data.patient.id === 'all' && data.patients) {
        // All patients mode - find Rose Hall
        roseHallPatient = data.patients.find(p => 
            p.name && p.name.toLowerCase().includes('rose hall')
        );
    } else if (data.patient && data.patient.name && 
               data.patient.name.toLowerCase().includes('rose hall')) {
        // Single patient mode - check if it's Rose Hall
        roseHallPatient = {
            id: data.patient.id,
            name: data.patient.name,
            gender: data.patient.gender,
            birthDate: data.patient.birthDate,
            data: {
                observation: data.observation || {}
            }
        };
    }

    if (!roseHallPatient) {
        showError('Rose Hall patient not found in the data');
        return;
    }

    // Display patient information
    displayPatientInfo(roseHallPatient);
    
    // Display observations
    displayObservations(roseHallPatient);
});

function displayPatientInfo(patient) {
    document.getElementById('patientName').textContent = patient.name || 'Unknown';
    document.getElementById('patientGender').textContent = 
        patient.gender ? capitalizeFirst(patient.gender) : 'Unknown';
    
    if (patient.birthDate) {
        document.getElementById('patientDOB').textContent = formatDate(patient.birthDate);
        document.getElementById('patientAge').textContent = calculateAge(patient.birthDate) + ' years';
    } else {
        document.getElementById('patientDOB').textContent = 'Unknown';
        document.getElementById('patientAge').textContent = 'Unknown';
    }
}

function displayObservations(patient) {
    const container = document.getElementById('observationsContainer');
    
    // Get observations from patient data
    const observations = patient.data?.observation?.summary || [];
    
    if (observations.length === 0) {
        container.innerHTML = `
            <div class="no-data">
                <i class="fas fa-chart-line"></i>
                <h6>No observations available</h6>
                <p class="mb-0">No observation data found for this patient.</p>
            </div>
        `;
        return;
    }

    // Create observations HTML
    let observationsHTML = '';
    
    observations.forEach(obs => {
        const statusClass = getStatusClass(obs.status);
        const iconClass = getObservationIcon(obs.name);
        
        observationsHTML += `
            <div class="observation-item">
                <div class="d-flex align-items-start">
                    <div class="icon-circle me-3">
                        <i class="${iconClass}"></i>
                    </div>
                    <div class="flex-grow-1">
                        <div class="observation-name">${escapeHtml(obs.name || 'Unknown Observation')}</div>
                        ${obs.value ? `<div class="observation-value"><strong>Value:</strong> ${escapeHtml(obs.value)}</div>` : ''}
                        ${obs.date ? `<div class="observation-date"><i class="fas fa-calendar-alt me-1"></i>${formatDateTime(obs.date)}</div>` : ''}
                        ${obs.status ? `<span class="status-badge ${statusClass}">${escapeHtml(obs.status)}</span>` : ''}
                    </div>
                </div>
            </div>
        `;
    });
    
    container.innerHTML = observationsHTML;
}

function getObservationIcon(name) {
    if (!name) return 'fas fa-chart-line text-primary';
    
    const nameLower = name.toLowerCase();
    
    if (nameLower.includes('blood') || nameLower.includes('bp')) {
        return 'fas fa-heartbeat text-danger';
    } else if (nameLower.includes('temp') || nameLower.includes('temperature')) {
        return 'fas fa-thermometer-half text-warning';
    } else if (nameLower.includes('weight') || nameLower.includes('bmi')) {
        return 'fas fa-weight text-info';
    } else if (nameLower.includes('glucose') || nameLower.includes('sugar')) {
        return 'fas fa-tint text-primary';
    } else if (nameLower.includes('wbc') || nameLower.includes('white blood')) {
        return 'fas fa-microscope text-success';
    } else {
        return 'fas fa-chart-line text-primary';
    }
}

function getStatusClass(status) {
    if (!status) return '';
    
    const statusLower = status.toLowerCase();
    
    if (statusLower.includes('active') || statusLower.includes('current')) {
        return 'status-active';
    } else if (statusLower.includes('completed') || statusLower.includes('final')) {
        return 'status-completed';
    } else if (statusLower.includes('pending') || statusLower.includes('preliminary')) {
        return 'status-pending';
    } else {
        return 'status-active';
    }
}

function showError(message) {
    const container = document.getElementById('observationsContainer');
    container.innerHTML = `
        <div class="no-data">
            <i class="fas fa-exclamation-triangle text-warning"></i>
            <h6>Error</h6>
            <p class="mb-0">${escapeHtml(message)}</p>
        </div>
    `;
    
    document.getElementById('patientName').textContent = 'Error';
    document.getElementById('patientGender').textContent = '-';
    document.getElementById('patientAge').textContent = '-';
    document.getElementById('patientDOB').textContent = '-';
}

// Utility functions
function capitalizeFirst(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
}

function formatDate(dateString) {
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

function formatDateTime(dateString) {
    try {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
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

function calculateAge(birthDate) {
    try {
        const today = new Date();
        const birth = new Date(birthDate);
        let age = today.getFullYear() - birth.getFullYear();
        const monthDiff = today.getMonth() - birth.getMonth();
        
        if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
            age--;
        }
        
        return age;
    } catch (e) {
        return 'Unknown';
    }
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}