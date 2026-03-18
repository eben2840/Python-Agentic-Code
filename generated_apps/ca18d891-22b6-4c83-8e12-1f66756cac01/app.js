document.addEventListener('DOMContentLoaded', function() {
    // Check if patient data is available
    if (!window.PATIENT_DATA) {
        console.error('Patient data not available');
        showNoData();
        return;
    }

    const data = window.PATIENT_DATA;
    
    // Check if this is single patient mode and if it's John Smith
    if (data.patient && data.patient.id !== 'all') {
        if (data.patient.name === 'John Smith') {
            displayPatientInfo(data.patient);
            displayObservations(data.observation);
        } else {
            showWrongPatient();
        }
    } else if (data.patient && data.patient.id === 'all') {
        // Find John Smith in the patients array
        const johnSmith = data.patients?.find(p => p.name === 'John Smith');
        if (johnSmith) {
            displayPatientInfo(johnSmith);
            displayObservations(johnSmith.data?.observation);
        } else {
            showPatientNotFound();
        }
    } else {
        showNoData();
    }
});

function displayPatientInfo(patient) {
    document.getElementById('patientName').textContent = patient.name || 'Unknown Patient';
    document.getElementById('patientGender').textContent = capitalizeFirst(patient.gender) || 'Unknown';
    
    // Calculate age from birth date
    const age = calculateAge(patient.birthDate);
    document.getElementById('patientAge').textContent = age ? `${age} years old` : 'Age unknown';
}

function displayObservations(observations) {
    const container = document.getElementById('observationsContainer');
    const countBadge = document.getElementById('observationCount');
    const noDataMessage = document.getElementById('noDataMessage');
    
    if (!observations || !observations.summary || observations.summary.length === 0) {
        container.innerHTML = '';
        countBadge.textContent = '0';
        noDataMessage.style.display = 'block';
        return;
    }
    
    countBadge.textContent = observations.summary.length;
    noDataMessage.style.display = 'none';
    
    const observationsHtml = observations.summary.map(obs => {
        const statusClass = getStatusClass(obs.status);
        const iconClass = getObservationIcon(obs.name);
        const formattedDate = formatDate(obs.date);
        
        return `
            <div class="observation-item">
                <div class="d-flex justify-content-between align-items-start">
                    <div class="flex-grow-1">
                        <div class="d-flex align-items-center mb-2">
                            <i class="${iconClass} me-2"></i>
                            <div class="observation-name">${escapeHtml(obs.name || 'Unknown Observation')}</div>
                            ${obs.status ? `<span class="observation-status ${statusClass} ms-2">${escapeHtml(obs.status)}</span>` : ''}
                        </div>
                        <div class="observation-value mb-1">${escapeHtml(obs.value || 'No value recorded')}</div>
                        ${formattedDate ? `<div class="observation-date">${formattedDate}</div>` : ''}
                    </div>
                </div>
            </div>
        `;
    }).join('');
    
    container.innerHTML = observationsHtml;
}

function getObservationIcon(name) {
    if (!name) return 'fas fa-chart-line text-primary';
    
    const nameLower = name.toLowerCase();
    if (nameLower.includes('bp') || nameLower.includes('blood pressure')) return 'fas fa-heartbeat text-danger';
    if (nameLower.includes('temp') || nameLower.includes('temperature')) return 'fas fa-thermometer-half text-warning';
    if (nameLower.includes('glucose') || nameLower.includes('sugar')) return 'fas fa-tint text-info';
    if (nameLower.includes('pain')) return 'fas fa-exclamation-triangle text-warning';
    if (nameLower.includes('ecg') || nameLower.includes('ekg')) return 'fas fa-wave-square text-primary';
    if (nameLower.includes('weight')) return 'fas fa-weight text-secondary';
    if (nameLower.includes('height')) return 'fas fa-ruler-vertical text-secondary';
    return 'fas fa-chart-line text-primary';
}

function getStatusClass(status) {
    if (!status) return 'status-unknown';
    
    const statusLower = status.toLowerCase();
    if (statusLower.includes('active') || statusLower.includes('current')) return 'status-active';
    if (statusLower.includes('completed') || statusLower.includes('final')) return 'status-completed';
    return 'status-unknown';
}

function calculateAge(birthDate) {
    if (!birthDate) return null;
    
    const birth = new Date(birthDate);
    const today = new Date();
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
        age--;
    }
    
    return age;
}

function formatDate(dateString) {
    if (!dateString) return null;
    
    try {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    } catch (error) {
        return dateString;
    }
}

function capitalizeFirst(str) {
    if (!str) return '';
    return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
}

function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function showNoData() {
    document.getElementById('patientName').textContent = 'No Data Available';
    document.getElementById('patientInfo').innerHTML = '<span class="text-muted">Patient data not found</span>';
    document.getElementById('observationsContainer').innerHTML = '';
    document.getElementById('observationCount').textContent = '0';
    document.getElementById('noDataMessage').style.display = 'block';
}

function showWrongPatient() {
    document.getElementById('observationsContainer').innerHTML = `
        <div class="text-center py-4">
            <i class="fas fa-user-times text-muted mb-3" style="font-size: 2rem;"></i>
            <h6 class="text-muted">Wrong Patient</h6>
            <p class="text-muted small mb-0">This view is for John Smith only.</p>
        </div>
    `;
    document.getElementById('observationCount').textContent = '0';
}

function showPatientNotFound() {
    document.getElementById('patientName').textContent = 'John Smith';
    document.getElementById('patientInfo').innerHTML = '<span class="text-muted">Patient not found</span>';
    document.getElementById('observationsContainer').innerHTML = `
        <div class="text-center py-4">
            <i class="fas fa-user-slash text-muted mb-3" style="font-size: 2rem;"></i>
            <h6 class="text-muted">Patient Not Found</h6>
            <p class="text-muted small mb-0">John Smith was not found in the patient data.</p>
        </div>
    `;
    document.getElementById('observationCount').textContent = '0';
}