document.addEventListener('DOMContentLoaded', function() {
    // Check if patient data is available
    if (!window.PATIENT_DATA) {
        console.error('Patient data not available');
        showError('Patient data not available');
        return;
    }

    const data = window.PATIENT_DATA;
    
    // Load patient information
    loadPatientInfo(data);
    
    // Load encounter details
    loadEncounterDetails(data);
    
    // Load related information
    loadLocationInfo(data);
    loadConditionsInfo(data);
});

function loadPatientInfo(data) {
    const patientNameEl = document.getElementById('patientName');
    const patientInfoEl = document.getElementById('patientInfo');
    
    if (data.patient) {
        patientNameEl.textContent = data.patient.name || 'Unknown Patient';
        
        const gender = data.patient.gender || 'Unknown';
        const birthDate = data.patient.birthDate ? formatDate(data.patient.birthDate) : 'Unknown';
        const patientId = data.patient.id || 'Unknown';
        
        patientInfoEl.textContent = `${gender.charAt(0).toUpperCase() + gender.slice(1)} • DOB: ${birthDate} • ID: ${patientId}`;
    } else {
        patientNameEl.textContent = 'Unknown Patient';
        patientInfoEl.textContent = 'Patient information not available';
    }
}

function loadEncounterDetails(data) {
    const encounterContentEl = document.getElementById('encounterContent');
    
    if (!data.encounter || !data.encounter.summary || data.encounter.summary.length === 0) {
        encounterContentEl.innerHTML = '<div class="no-data">No encounter data available</div>';
        return;
    }
    
    const encounters = data.encounter.summary;
    let encounterHtml = '<div class="encounter-details">';
    
    encounters.forEach(encounter => {
        const status = encounter.status || 'unknown';
        const date = encounter.date ? formatDateTime(encounter.date) : 'Date not available';
        const name = encounter.name || 'Encounter';
        
        encounterHtml += `
            <div class="encounter-item">
                <div class="d-flex justify-content-between align-items-start mb-2">
                    <div class="encounter-item-label">Encounter Type</div>
                    <span class="status-badge ${status.toLowerCase()}">${status}</span>
                </div>
                <div class="encounter-item-value mb-2">${name}</div>
                <div class="encounter-item-label">Date & Time</div>
                <div class="encounter-item-value">${date}</div>
            </div>
        `;
    });
    
    encounterHtml += '</div>';
    encounterContentEl.innerHTML = encounterHtml;
}

function loadLocationInfo(data) {
    const locationContentEl = document.getElementById('locationContent');
    
    if (!data.locations || !data.locations.summary || data.locations.summary.length === 0) {
        locationContentEl.innerHTML = '<div class="no-data">No location data available</div>';
        return;
    }
    
    const locations = data.locations.summary;
    let locationHtml = '';
    
    locations.forEach(location => {
        const roomName = location.name || 'Unknown Room';
        const wardName = location.value || 'Unknown Ward';
        const status = location.status || 'unknown';
        
        locationHtml += `
            <div class="location-item">
                <div class="d-flex justify-content-between align-items-center mb-1">
                    <strong>${roomName}</strong>
                    <span class="status-badge ${status.toLowerCase()}">${status}</span>
                </div>
                <div class="text-muted">${wardName}</div>
            </div>
        `;
    });
    
    locationContentEl.innerHTML = locationHtml;
}

function loadConditionsInfo(data) {
    const conditionsContentEl = document.getElementById('conditionsContent');
    
    if (!data.condition || !data.condition.summary || data.condition.summary.length === 0) {
        conditionsContentEl.innerHTML = '<div class="no-data">No active conditions</div>';
        return;
    }
    
    const conditions = data.condition.summary;
    let conditionsHtml = '';
    
    conditions.forEach(condition => {
        const name = condition.name || 'Unknown Condition';
        const date = condition.date ? formatDate(condition.date) : 'Date not available';
        const status = condition.status || 'unknown';
        
        conditionsHtml += `
            <div class="condition-item">
                <div class="d-flex justify-content-between align-items-center mb-1">
                    <strong>${name}</strong>
                    <span class="status-badge ${status.toLowerCase()}">${status}</span>
                </div>
                <div class="text-muted">Diagnosed: ${date}</div>
            </div>
        `;
    });
    
    conditionsContentEl.innerHTML = conditionsHtml;
}

function formatDate(dateString) {
    try {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    } catch (error) {
        return dateString;
    }
}

function formatDateTime(dateString) {
    try {
        const date = new Date(dateString);
        return date.toLocaleString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            hour12: true
        });
    } catch (error) {
        return dateString;
    }
}

function showError(message) {
    const encounterContentEl = document.getElementById('encounterContent');
    const locationContentEl = document.getElementById('locationContent');
    const conditionsContentEl = document.getElementById('conditionsContent');
    
    const errorHtml = `<div class="no-data text-danger">${message}</div>`;
    
    if (encounterContentEl) encounterContentEl.innerHTML = errorHtml;
    if (locationContentEl) locationContentEl.innerHTML = errorHtml;
    if (conditionsContentEl) conditionsContentEl.innerHTML = errorHtml;
}