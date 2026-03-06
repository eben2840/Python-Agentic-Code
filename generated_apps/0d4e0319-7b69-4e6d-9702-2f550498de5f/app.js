document.addEventListener('DOMContentLoaded', function() {
    const data = window.PATIENT_DATA;
    
    // Initialize forms
    initializeForms();
    
    // Load patient data
    if (data && data.patient) {
        displaySinglePatient(data);
    } else {
        displayNoPatients();
    }
});

function initializeForms() {
    // Emergency form handler
    document.getElementById('emergencyForm').addEventListener('submit', function(e) {
        e.preventDefault();
        saveEmergencyInfo();
    });
    
    // Vital signs form handler
    document.getElementById('vitalSignsForm').addEventListener('submit', function(e) {
        e.preventDefault();
        recordVitalSigns();
    });
}

function displaySinglePatient(data) {
    const patientsList = document.getElementById('patientsList');
    const patientCount = document.getElementById('patientCount');
    
    // Update patient count
    patientCount.textContent = '1';
    
    // Get latest vital signs
    const latestVitals = getLatestVitalSigns(data);
    const priorityLevel = determinePriority(latestVitals);
    
    patientsList.innerHTML = `
        <table class="table table-hover mb-0">
            <thead>
                <tr>
                    <th>Patient</th>
                    <th>Age/Gender</th>
                    <th>Priority</th>
                    <th>Vital Signs</th>
                    <th>Conditions</th>
                    <th>Last Updated</th>
                    <th>Actions</th>
                </tr>
            </thead>
            <tbody>
                <tr class="patient-row">
                    <td>
                        <div class="d-flex align-items-center">
                            <div class="vital-indicator ${getVitalStatus(latestVitals)}"></div>
                            <div>
                                <div class="fw-semibold">${data.patient.name || 'Unknown Patient'}</div>
                                <small class="text-muted">ID: ${data.patient.id || 'N/A'}</small>
                            </div>
                        </div>
                    </td>
                    <td>
                        <div>${calculateAge(data.patient.birthDate)} years</div>
                        <small class="text-muted">${data.patient.gender || 'Unknown'}</small>
                    </td>
                    <td>
                        <span class="badge priority-${priorityLevel.toLowerCase()}">${priorityLevel}</span>
                    </td>
                    <td>
                        <div class="small">
                            ${formatVitalSigns(latestVitals)}
                        </div>
                    </td>
                    <td>
                        <div class="small">
                            ${formatConditions(data.conditions)}
                        </div>
                    </td>
                    <td>
                        <small class="text-muted">${new Date().toLocaleTimeString()}</small>
                    </td>
                    <td>
                        <div class="btn-group btn-group-sm">
                            <button class="btn btn-outline-primary" onclick="viewPatientDetails()">
                                <i class="fas fa-eye"></i>
                            </button>
                            <button class="btn btn-outline-success" onclick="updateVitals()">
                                <i class="fas fa-heartbeat"></i>
                            </button>
                        </div>
                    </td>
                </tr>
            </tbody>
        </table>
    `;
}

function displayNoPatients() {
    const patientsList = document.getElementById('patientsList');
    const patientCount = document.getElementById('patientCount');
    
    patientCount.textContent = '0';
    
    patientsList.innerHTML = `
        <div class="text-center py-5">
            <i class="fas fa-user-injured text-muted fa-3x mb-3"></i>
            <h4 class="text-muted">No Patients in Emergency Room</h4>
            <p class="text-muted">Patient data will appear here when available</p>
        </div>
    `;
}

function getLatestVitalSigns(data) {
    const vitals = {};
    
    if (data.vital_signs && data.vital_signs.summary) {
        data.vital_signs.summary.forEach(vital => {
            if (vital.code === 'blood-pressure') {
                vitals.bloodPressure = vital.value;
            } else if (vital.code === 'heart-rate') {
                vitals.heartRate = vital.value;
            } else if (vital.code === 'body-temperature') {
                vitals.temperature = vital.value;
            } else if (vital.code === 'oxygen-saturation') {
                vitals.oxygenSat = vital.value;
            }
        });
    }
    
    return vitals;
}

function determinePriority(vitals) {
    if (!vitals.heartRate && !vitals.bloodPressure) return 'Standard';
    
    if (vitals.heartRate > 120 || vitals.heartRate < 50) return 'Critical';
    if (vitals.oxygenSat && vitals.oxygenSat < 90) return 'Critical';
    if (vitals.heartRate > 100 || (vitals.oxygenSat && vitals.oxygenSat < 95)) return 'Urgent';
    
    return 'Standard';
}

function getVitalStatus(vitals) {
    if (!vitals.heartRate && !vitals.bloodPressure) return 'vital-normal';
    
    if (vitals.heartRate > 120 || vitals.heartRate < 50) return 'vital-critical';
    if (vitals.oxygenSat && vitals.oxygenSat < 90) return 'vital-critical';
    if (vitals.heartRate > 100 || (vitals.oxygenSat && vitals.oxygenSat < 95)) return 'vital-warning';
    
    return 'vital-normal';
}

function formatVitalSigns(vitals) {
    const signs = [];
    if (vitals.bloodPressure) signs.push(`BP: ${vitals.bloodPressure}`);
    if (vitals.heartRate) signs.push(`HR: ${vitals.heartRate} bpm`);
    if (vitals.temperature) signs.push(`Temp: ${vitals.temperature}°F`);
    if (vitals.oxygenSat) signs.push(`O2: ${vitals.oxygenSat}%`);
    
    return signs.length > 0 ? signs.join('<br>') : 'No vitals recorded';
}

function formatConditions(conditions) {
    if (!conditions || !conditions.summary || conditions.summary.length === 0) {
        return 'No active conditions';
    }
    
    return conditions.summary.slice(0, 2).map(condition => 
        `<div>${condition.condition}</div>`
    ).join('');
}

function calculateAge(birthDate) {
    if (!birthDate) return 'Unknown';
    const today = new Date();
    const birth = new Date(birthDate);
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
        age--;
    }
    return age;
}

function saveEmergencyInfo() {
    const formData = {
        emergencyType: document.getElementById('emergencyType').value,
        priorityLevel: document.getElementById('priorityLevel').value,
        attendingPhysician: document.getElementById('attendingPhysician').value,
        emergencyNotes: document.getElementById('emergencyNotes').value,
        timestamp: new Date().toISOString()
    };
    
    // Simulate saving
    console.log('Emergency info saved:', formData);
    
    // Show success message
    showAlert('Emergency information saved successfully!', 'success');
    
    // Reset form
    document.getElementById('emergencyForm').reset();
}

function recordVitalSigns() {
    const vitalSigns = {
        systolic: document.getElementById('systolic').value,
        diastolic: document.getElementById('diastolic').value,
        heartRate: document.getElementById('heartRate').value,
        temperature: document.getElementById('temperature').value,
        oxygenSat: document.getElementById('oxygenSat').value,
        respiratoryRate: document.getElementById('respiratoryRate').value,
        painScale: document.getElementById('painScale').value,
        timestamp: new Date().toISOString()
    };
    
    // Simulate recording
    console.log('Vital signs recorded:', vitalSigns);
    
    // Show success message
    showAlert('Vital signs recorded successfully!', 'success');
    
    // Reset form
    document.getElementById('vitalSignsForm').reset();
    document.getElementById('painValue').textContent = '0';
}

function updatePainValue(value) {
    document.getElementById('painValue').textContent = value;
}

function showAlert(message, type) {
    const alertDiv = document.createElement('div');
    alertDiv.className = `alert alert-${type} alert-dismissible fade show position-fixed`;
    alertDiv.style.cssText = 'top: 20px; right: 20px; z-index: 1050; min-width: 300px;';
    alertDiv.innerHTML = `
        ${message}
        <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
    `;
    
    document.body.appendChild(alertDiv);
    
    setTimeout(() => {
        if (alertDiv.parentNode) {
            alertDiv.parentNode.removeChild(alertDiv);
        }
    }, 5000);
}

function refreshPatients() {
    location.reload();
}

function viewPatientDetails() {
    showAlert('Patient details view would open here', 'info');
}

function updateVitals() {
    document.getElementById('vitalSignsForm').scrollIntoView({ behavior: 'smooth' });
}