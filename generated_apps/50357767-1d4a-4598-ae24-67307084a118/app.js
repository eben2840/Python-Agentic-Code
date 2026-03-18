document.addEventListener('DOMContentLoaded', function() {
    // Check if patient data is available
    if (!window.PATIENT_DATA) {
        console.error('Patient data not available');
        showError();
        return;
    }

    const data = window.PATIENT_DATA;
    
    // Load patient information
    loadPatientInfo(data);
    
    // Load observations
    loadObservations(data);
    
    // Load medications
    loadMedications(data);
    
    // Load encounters
    loadEncounters(data);
    
    // Load room information
    loadRoomInfo(data);
});

function loadPatientInfo(data) {
    const patientName = document.getElementById('patientName');
    const patientGender = document.getElementById('patientGender');
    const patientDOB = document.getElementById('patientDOB');
    const patientID = document.getElementById('patientID');
    
    if (data.patient) {
        patientName.textContent = data.patient.name || 'Unknown';
        patientGender.textContent = data.patient.gender || 'Unknown';
        patientDOB.textContent = formatDate(data.patient.birthDate) || 'Unknown';
        patientID.textContent = data.patient.id || 'Unknown';
    }
}

function loadObservations(data) {
    const container = document.getElementById('observationsList');
    
    if (data.observation && data.observation.summary && data.observation.summary.length > 0) {
        const html = data.observation.summary.map(obs => `
            <div class="observation-item">
                <div class="item-title">${obs.name || 'Unknown Observation'}</div>
                <div class="item-value">${obs.value || 'No value'}</div>
                <div class="item-date">
                    <i class="fas fa-clock me-1"></i>
                    ${formatDateTime(obs.date)}
                </div>
                ${obs.status ? `<span class="status-badge status-${obs.status}">${obs.status}</span>` : ''}
            </div>
        `).join('');
        container.innerHTML = html;
    } else {
        container.innerHTML = '<div class="no-data">No observations available</div>';
    }
}

function loadMedications(data) {
    const container = document.getElementById('medicationsList');
    
    if (data.medicationrequest && data.medicationrequest.summary && data.medicationrequest.summary.length > 0) {
        const html = data.medicationrequest.summary.map(med => `
            <div class="medication-item">
                <div class="item-title">${med.name || 'Unknown Medication'}</div>
                <div class="item-value">${med.value || 'No dosage specified'}</div>
                <div class="item-date">
                    <i class="fas fa-calendar me-1"></i>
                    ${formatDateTime(med.date)}
                </div>
                ${med.status ? `<span class="status-badge status-${med.status}">${med.status}</span>` : ''}
            </div>
        `).join('');
        container.innerHTML = html;
    } else {
        container.innerHTML = '<div class="no-data">No medications available</div>';
    }
}

function loadEncounters(data) {
    const container = document.getElementById('encountersList');
    
    if (data.encounter && data.encounter.summary && data.encounter.summary.length > 0) {
        const html = data.encounter.summary.map(enc => `
            <div class="encounter-item">
                <div class="item-title">${enc.name || 'Healthcare Encounter'}</div>
                <div class="item-date">
                    <i class="fas fa-calendar-alt me-1"></i>
                    ${formatDateTime(enc.date)}
                </div>
                ${enc.status ? `<span class="status-badge status-${enc.status}">${enc.status}</span>` : ''}
            </div>
        `).join('');
        container.innerHTML = html;
    } else {
        container.innerHTML = '<div class="no-data">No encounters available</div>';
    }
}

function loadRoomInfo(data) {
    const container = document.getElementById('roomInfo');
    
    // Look for room information in encounters or other data
    let roomInfo = null;
    
    // Check if encounter has location/room data
    if (data.encounter && data.encounter.summary && data.encounter.summary.length > 0) {
        const encounter = data.encounter.summary[0];
        // Look for room in encounter name or other fields
        if (encounter.name && encounter.name.toLowerCase().includes('room')) {
            const roomMatch = encounter.name.match(/room\s*(\d+)/i);
            if (roomMatch) {
                roomInfo = roomMatch[1];
            }
        }
    }
    
    // If no room found in encounters, check other sources or show default
    if (roomInfo) {
        container.innerHTML = `
            <div class="room-display">
                <div class="room-number">Room ${roomInfo}</div>
                <div class="room-label">Current Location</div>
            </div>
        `;
    } else {
        // Since no room data is available in the provided FHIR data, show appropriate message
        container.innerHTML = '<div class="no-data">Room information not available</div>';
    }
}

function formatDate(dateString) {
    if (!dateString) return 'Unknown';
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
    if (!dateString) return 'Unknown';
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

function showError() {
    document.body.innerHTML = `
        <div class="container mt-5">
            <div class="alert alert-danger text-center">
                <h4>Error Loading Patient Data</h4>
                <p>Unable to load patient information. Please refresh the page or contact support.</p>
            </div>
        </div>
    `;
}