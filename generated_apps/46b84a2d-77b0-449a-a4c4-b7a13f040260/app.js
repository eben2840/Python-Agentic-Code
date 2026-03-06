document.addEventListener('DOMContentLoaded', function() {
    // Check if patient data is available
    if (!window.PATIENT_DATA) {
        console.error('Patient data not available');
        showError('Patient data not available');
        return;
    }

    const data = window.PATIENT_DATA;
    
    // Load patient basic information
    loadPatientInfo(data);
    
    // Load location information from encounter data
    loadLocationInfo(data);
    
    // Load encounter details
    loadEncounterInfo(data);
    
    // Load additional context
    loadAdditionalInfo(data);
});

function loadPatientInfo(data) {
    const patientNameEl = document.getElementById('patientName');
    const patientInfoEl = document.getElementById('patientInfo');
    
    if (data.patient) {
        patientNameEl.textContent = data.patient.name || 'Unknown Patient';
        
        const age = data.patient.birthDate ? calculateAge(data.patient.birthDate) : 'Unknown';
        const gender = data.patient.gender || 'Unknown';
        patientInfoEl.textContent = `${gender.charAt(0).toUpperCase() + gender.slice(1)} • Age ${age} • ID: ${data.patient.id || 'Unknown'}`;
    } else {
        patientNameEl.textContent = 'Unknown Patient';
        patientInfoEl.textContent = 'Patient information not available';
    }
}

function loadLocationInfo(data) {
    const wardInfoEl = document.getElementById('wardInfo');
    const roomInfoEl = document.getElementById('roomInfo');
    
    // Check encounter data for location information
    if (data.encounter && data.encounter.summary && data.encounter.summary.length > 0) {
        const encounter = data.encounter.summary[0];
        
        // Look for location data in encounter
        // Since the actual FHIR data doesn't contain location details,
        // we'll show what's available or indicate no data
        wardInfoEl.textContent = 'No ward data available';
        roomInfoEl.textContent = 'No room data available';
        
        // If there were location extensions or references in the encounter,
        // we would parse them here. For now, showing the limitation.
    } else {
        wardInfoEl.textContent = 'No data available';
        roomInfoEl.textContent = 'No data available';
    }
}

function loadEncounterInfo(data) {
    const encounterInfoEl = document.getElementById('encounterInfo');
    
    if (data.encounter && data.encounter.summary && data.encounter.summary.length > 0) {
        const encounter = data.encounter.summary[0];
        
        const encounterHtml = `
            <div class="encounter-details">
                <div class="row">
                    <div class="col-md-6">
                        <h6>Status</h6>
                        <p><span class="status-badge ${getStatusClass(encounter.status)}">${encounter.status || 'Unknown'}</span></p>
                    </div>
                    <div class="col-md-6">
                        <h6>Date</h6>
                        <p>${encounter.date ? formatDate(encounter.date) : 'No date available'}</p>
                    </div>
                    <div class="col-12">
                        <h6>Type</h6>
                        <p>${encounter.name || 'Standard encounter'}</p>
                    </div>
                </div>
            </div>
        `;
        
        encounterInfoEl.innerHTML = encounterHtml;
    } else {
        encounterInfoEl.innerHTML = '<p class="text-muted mb-0">No encounter data available</p>';
    }
}

function loadAdditionalInfo(data) {
    const additionalInfoEl = document.getElementById('additionalInfo');
    
    let infoItems = [];
    
    // Check for active conditions
    if (data.condition && data.condition.summary && data.condition.summary.length > 0) {
        const activeConditions = data.condition.summary.filter(c => c.status !== 'resolved');
        if (activeConditions.length > 0) {
            infoItems.push(`<strong>Active Conditions:</strong> ${activeConditions.map(c => c.name).join(', ')}`);
        }
    }
    
    // Check for active medications
    if (data.medicationrequest && data.medicationrequest.summary && data.medicationrequest.summary.length > 0) {
        const activeMeds = data.medicationrequest.summary.filter(m => m.status === 'active');
        if (activeMeds.length > 0) {
            infoItems.push(`<strong>Active Medications:</strong> ${activeMeds.map(m => m.name).join(', ')}`);
        }
    }
    
    // Check for recent observations
    if (data.observation && data.observation.summary && data.observation.summary.length > 0) {
        const recentObs = data.observation.summary.slice(0, 2);
        infoItems.push(`<strong>Recent Observations:</strong> ${recentObs.map(o => `${o.name} (${o.value})`).join(', ')}`);
    }
    
    if (infoItems.length > 0) {
        additionalInfoEl.innerHTML = infoItems.map(item => `<p class="mb-2">${item}</p>`).join('');
    } else {
        additionalInfoEl.innerHTML = '<p class="text-muted mb-0">No additional information available</p>';
    }
}

function calculateAge(birthDate) {
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

function formatDate(dateString) {
    if (!dateString) return 'No date';
    
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

function getStatusClass(status) {
    if (!status) return '';
    
    const statusLower = status.toLowerCase();
    if (statusLower.includes('active') || statusLower.includes('current')) {
        return 'status-active';
    } else if (statusLower.includes('progress')) {
        return 'status-in-progress';
    }
    return '';
}

function showError(message) {
    document.body.innerHTML = `
        <div class="container mt-5">
            <div class="alert alert-danger" role="alert">
                <h4 class="alert-heading">Error</h4>
                <p>${message}</p>
            </div>
        </div>
    `;
}