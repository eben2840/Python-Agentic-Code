document.addEventListener('DOMContentLoaded', function() {
    if (!window.PATIENT_DATA) {
        showError('No patient data available');
        return;
    }

    const data = window.PATIENT_DATA;
    
    // Check if we're in "all patients" mode
    if (data.patient && data.patient.id === 'all' && data.patients) {
        loadENTPatients(data.patients);
    } else {
        showError('This view requires all patients data');
    }
});

function loadENTPatients(patients) {
    // Filter patients who are in ENT Ward
    const entPatients = patients.filter(patient => {
        // Check if patient has location data indicating ENT Ward
        if (patient.data && patient.data.locations && patient.data.locations.summary) {
            return patient.data.locations.summary.some(location => 
                location.value && location.value.toLowerCase().includes('ent')
            );
        }
        return false;
    });

    // Update summary statistics
    updateSummaryStats(entPatients);

    // Display patients
    displayPatients(entPatients);
}

function updateSummaryStats(patients) {
    const totalPatients = patients.length;
    let totalObservations = 0;

    patients.forEach(patient => {
        if (patient.data && patient.data.observation && patient.data.observation.summary) {
            totalObservations += patient.data.observation.summary.length;
        }
    });

    document.getElementById('totalPatients').textContent = totalPatients;
    document.getElementById('totalObservations').textContent = totalObservations;
}

function displayPatients(patients) {
    const container = document.getElementById('patientsContainer');
    
    if (patients.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-hospital"></i>
                <h3>No ENT Ward Patients Found</h3>
                <p>No patients are currently assigned to the ENT Ward or location data is not available.</p>
            </div>
        `;
        return;
    }

    const patientsHTML = patients.map(patient => {
        const patientInfo = getPatientInfo(patient);
        const location = getPatientLocation(patient);
        const observations = getPatientObservations(patient);
        
        return `
            <div class="patient-item">
                <div class="patient-header">
                    <div>
                        <h3 class="patient-name">
                            <i class="fas fa-user-circle text-teal me-2"></i>
                            ${patientInfo.name}
                        </h3>
                        <p class="patient-info">
                            ${patientInfo.gender} • ${patientInfo.age} • ID: ${patient.id}
                        </p>
                    </div>
                    <div>
                        <span class="location-badge">
                            <i class="fas fa-map-marker-alt me-1"></i>
                            ${location}
                        </span>
                    </div>
                </div>
                
                <div class="observations-section">
                    <h4 class="mb-3">
                        <i class="fas fa-chart-line text-blue me-2"></i>
                        Latest Observations
                    </h4>
                    ${observations}
                </div>
            </div>
        `;
    }).join('');

    container.innerHTML = patientsHTML;
}

function getPatientInfo(patient) {
    const name = patient.name || 'Unknown Patient';
    const gender = patient.gender || 'Unknown';
    
    let age = 'Unknown age';
    if (patient.birthDate) {
        const birthYear = new Date(patient.birthDate).getFullYear();
        const currentYear = new Date().getFullYear();
        age = `${currentYear - birthYear} years old`;
    }
    
    return { name, gender, age };
}

function getPatientLocation(patient) {
    if (patient.data && patient.data.locations && patient.data.locations.summary) {
        const entLocation = patient.data.locations.summary.find(location => 
            location.value && location.value.toLowerCase().includes('ent')
        );
        if (entLocation) {
            return `${entLocation.name} - ${entLocation.value}`;
        }
    }
    return 'ENT Ward';
}

function getPatientObservations(patient) {
    if (!patient.data || !patient.data.observation || !patient.data.observation.summary) {
        return `
            <div class="no-data">
                <i class="fas fa-chart-line"></i>
                <p>No observations available</p>
            </div>
        `;
    }

    const observations = patient.data.observation.summary;
    
    if (observations.length === 0) {
        return `
            <div class="no-data">
                <i class="fas fa-chart-line"></i>
                <p>No observations recorded</p>
            </div>
        `;
    }

    const observationsHTML = observations.map(obs => {
        const iconClass = getObservationIcon(obs.name);
        const iconColor = getObservationColor(obs.name);
        const formattedDate = formatDate(obs.date);
        
        return `
            <div class="observation-card">
                <div class="observation-header">
                    <div class="observation-icon ${iconColor}">
                        <i class="${iconClass}"></i>
                    </div>
                    <div>
                        <p class="observation-name">${obs.name || 'Unknown Observation'}</p>
                    </div>
                </div>
                <p class="observation-value">${obs.value || obs.name || 'No value'}</p>
                <p class="observation-date">
                    <i class="fas fa-clock me-1"></i>
                    ${formattedDate}
                </p>
            </div>
        `;
    }).join('');

    return `<div class="observations-grid">${observationsHTML}</div>`;
}

function getObservationIcon(name) {
    if (!name) return 'fas fa-chart-line';
    
    const nameLower = name.toLowerCase();
    if (nameLower.includes('bp') || nameLower.includes('blood pressure')) return 'fas fa-heartbeat';
    if (nameLower.includes('temp') || nameLower.includes('temperature')) return 'fas fa-thermometer-half';
    if (nameLower.includes('pain')) return 'fas fa-exclamation-triangle';
    if (nameLower.includes('glucose') || nameLower.includes('sugar')) return 'fas fa-tint';
    if (nameLower.includes('weight')) return 'fas fa-weight';
    if (nameLower.includes('height')) return 'fas fa-ruler-vertical';
    if (nameLower.includes('heart') || nameLower.includes('pulse')) return 'fas fa-heart';
    if (nameLower.includes('oxygen') || nameLower.includes('spo2')) return 'fas fa-lungs';
    return 'fas fa-chart-line';
}

function getObservationColor(name) {
    if (!name) return 'bg-blue';
    
    const nameLower = name.toLowerCase();
    if (nameLower.includes('bp') || nameLower.includes('blood pressure')) return 'bg-teal';
    if (nameLower.includes('temp') || nameLower.includes('temperature')) return 'bg-orange';
    if (nameLower.includes('pain')) return 'bg-red';
    if (nameLower.includes('glucose') || nameLower.includes('sugar')) return 'bg-purple';
    return 'bg-blue';
}

function formatDate(dateString) {
    if (!dateString) return 'No date';
    
    try {
        const date = new Date(dateString);
        return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
    } catch (e) {
        return dateString;
    }
}

function showError(message) {
    const container = document.getElementById('patientsContainer');
    container.innerHTML = `
        <div class="empty-state">
            <i class="fas fa-exclamation-triangle"></i>
            <h3>Error</h3>
            <p>${message}</p>
        </div>
    `;
}

// Add missing CSS classes
const style = document.createElement('style');
style.textContent = `
    .bg-orange { background-color: #f97316; }
    .bg-red { background-color: #ef4444; }
    .bg-purple { background-color: #8b5cf6; }
`;
document.head.appendChild(style);