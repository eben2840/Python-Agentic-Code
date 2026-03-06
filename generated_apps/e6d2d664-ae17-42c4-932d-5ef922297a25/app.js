// Healthcare Mini-App - Patient Dashboard
document.addEventListener('DOMContentLoaded', function() {
    // Check if patient data is available
    if (typeof window.PATIENT_DATA === 'undefined') {
        console.error('Patient data not available');
        showError('Patient data not available');
        return;
    }

    const data = window.PATIENT_DATA;
    
    // Load patient information
    loadPatientInfo(data);
    
    // Load all sections
    loadObservations(data);
    loadEncounters(data);
    loadMedications(data);
    loadWardRoom(data);
    loadConditions(data);
});

function loadPatientInfo(data) {
    const patient = data.patient;
    
    // Update patient name
    document.getElementById('patientName').textContent = patient.name || 'Unknown Patient';
    
    // Update gender
    const genderElement = document.getElementById('patientGender');
    const genderIcon = patient.gender === 'female' ? 'fa-venus' : patient.gender === 'male' ? 'fa-mars' : 'fa-venus-mars';
    genderElement.innerHTML = `<i class="fas ${genderIcon} me-1"></i>${capitalizeFirst(patient.gender) || 'Unknown'}`;
    
    // Calculate and update age
    const ageElement = document.getElementById('patientAge');
    if (patient.birthDate) {
        const age = calculateAge(patient.birthDate);
        ageElement.innerHTML = `<i class="fas fa-calendar me-1"></i>${age} years old`;
    } else {
        ageElement.innerHTML = `<i class="fas fa-calendar me-1"></i>Age unknown`;
    }
    
    // Update patient ID
    document.getElementById('patientId').innerHTML = `<i class="fas fa-id-card me-1"></i>${patient.id || 'Unknown ID'}`;
}

function loadObservations(data) {
    const container = document.getElementById('observationsContent');
    const observations = data.observation?.summary || [];
    
    if (observations.length === 0) {
        container.innerHTML = '<div class="no-data-state">No observations available</div>';
        return;
    }
    
    let html = '';
    observations.forEach(obs => {
        const value = obs.value || obs.name || 'No value';
        const date = obs.date ? formatDate(obs.date) : 'No date';
        const status = obs.status || 'unknown';
        
        html += `
            <div class="data-item">
                <div>
                    <div class="data-item-label">${obs.name || 'Unknown Observation'}</div>
                    <div class="data-item-value">
                        <span class="observation-value">${value}</span>
                    </div>
                    <div class="data-item-date">${date}</div>
                </div>
                <div>
                    <span class="status-badge status-${status}">${status}</span>
                </div>
            </div>
        `;
    });
    
    container.innerHTML = html;
}

function loadEncounters(data) {
    const container = document.getElementById('encountersContent');
    const encounters = data.encounter?.summary || [];
    
    if (encounters.length === 0) {
        container.innerHTML = '<div class="no-data-state">No encounters available</div>';
        return;
    }
    
    let html = '';
    encounters.forEach(enc => {
        const date = enc.date ? formatDate(enc.date) : 'No date';
        const status = enc.status || 'unknown';
        const name = enc.name || 'Hospital Visit';
        
        html += `
            <div class="data-item">
                <div>
                    <div class="data-item-label">${name}</div>
                    <div class="data-item-date">${date}</div>
                </div>
                <div>
                    <span class="status-badge status-${status.replace('-', '_')}">${status}</span>
                </div>
            </div>
        `;
    });
    
    container.innerHTML = html;
}

function loadMedications(data) {
    const container = document.getElementById('medicationsContent');
    const medications = data.medicationrequest?.summary || [];
    
    if (medications.length === 0) {
        container.innerHTML = '<div class="no-data-state">No medications available</div>';
        return;
    }
    
    let html = '';
    medications.forEach(med => {
        const status = med.status || 'unknown';
        const dosage = med.value || 'Dosage not specified';
        
        html += `
            <div class="data-item">
                <div>
                    <div class="data-item-label">${med.name || 'Unknown Medication'}</div>
                    <div class="medication-dosage">${dosage}</div>
                </div>
                <div>
                    <span class="status-badge status-${status}">${status}</span>
                </div>
            </div>
        `;
    });
    
    container.innerHTML = html;
}

function loadWardRoom(data) {
    const container = document.getElementById('wardRoomContent');
    
    // Check encounters for location information
    const encounters = data.encounter?.summary || [];
    
    // Look for location data in encounters or other sources
    let locationFound = false;
    let html = '';
    
    encounters.forEach(enc => {
        if (enc.location || enc.ward || enc.room) {
            locationFound = true;
            html += `
                <div class="data-item">
                    <div>
                        <div class="data-item-label">Current Location</div>
                        <div class="data-item-value">
                            ${enc.ward ? `Ward: ${enc.ward}` : ''}
                            ${enc.room ? `Room: ${enc.room}` : ''}
                            ${enc.location ? `Location: ${enc.location}` : ''}
                        </div>
                    </div>
                </div>
            `;
        }
    });
    
    if (!locationFound) {
        // Check if patient has active encounter (might indicate current admission)
        const activeEncounter = encounters.find(enc => enc.status === 'in-progress');
        if (activeEncounter) {
            html = `
                <div class="data-item">
                    <div>
                        <div class="data-item-label">Current Status</div>
                        <div class="data-item-value">Patient has active encounter</div>
                        <div class="data-item-date">Ward/Room information not available</div>
                    </div>
                    <div>
                        <span class="status-badge status-in-progress">in-progress</span>
                    </div>
                </div>
            `;
        } else {
            html = '<div class="no-data-state">No ward or room information available</div>';
        }
    }
    
    container.innerHTML = html;
}

function loadConditions(data) {
    const container = document.getElementById('conditionsContent');
    const conditions = data.condition?.summary || [];
    
    if (conditions.length === 0) {
        container.innerHTML = '<div class="no-data-state">No conditions available</div>';
        return;
    }
    
    let html = '';
    conditions.forEach(condition => {
        const date = condition.date ? formatDate(condition.date) : 'No date';
        const status = condition.status || 'active';
        
        html += `
            <div class="data-item">
                <div>
                    <div class="data-item-label">${condition.name || 'Unknown Condition'}</div>
                    <div class="data-item-date">Diagnosed: ${date}</div>
                </div>
                <div>
                    <span class="status-badge status-${status}">${status}</span>
                </div>
            </div>
        `;
    });
    
    container.innerHTML = html;
}

// Utility Functions
function calculateAge(birthDate) {
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
        return 'Invalid date';
    }
}

function capitalizeFirst(str) {
    if (!str) return '';
    return str.charAt(0).toUpperCase() + str.slice(1);
}

function showError(message) {
    document.body.innerHTML = `
        <div class="container mt-5">
            <div class="alert alert-danger" role="alert">
                <i class="fas fa-exclamation-triangle me-2"></i>
                ${message}
            </div>
        </div>
    `;
}