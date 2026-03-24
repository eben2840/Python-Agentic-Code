document.addEventListener('DOMContentLoaded', function() {
    // Check if patient data is available
    if (!window.PATIENT_DATA) {
        console.error('Patient data not available');
        return;
    }

    const data = window.PATIENT_DATA;
    
    // Handle single patient view
    if (data.patient && data.patient.id !== 'all') {
        renderSinglePatient(data);
    } else if (data.patient && data.patient.id === 'all') {
        // For "all patients" view, we'll show the first patient's data as an example
        // In a real app, this might show a different interface
        if (data.patients && data.patients.length > 0) {
            const firstPatient = data.patients[0];
            const singlePatientData = {
                patient: {
                    name: firstPatient.name,
                    gender: firstPatient.gender,
                    birthDate: firstPatient.birthDate,
                    id: firstPatient.id
                },
                ...firstPatient.data
            };
            renderSinglePatient(singlePatientData);
        }
    }
});

function renderSinglePatient(data) {
    // Update patient info in header
    const patientInfo = document.getElementById('patient-info');
    if (data.patient) {
        patientInfo.textContent = `${data.patient.name || 'Unknown Patient'} - Clinical Assessment`;
    }

    // Render patient details
    renderPatientDetails(data.patient);
    
    // Render location information
    renderLocationInfo(data.locations);
    
    // Render encounters
    renderEncounters(data.encounter);
}

function renderPatientDetails(patient) {
    const container = document.getElementById('patient-details');
    
    if (!patient) {
        container.innerHTML = '<p class="text-muted">No patient data available</p>';
        return;
    }

    const details = [
        { label: 'Name', value: patient.name || 'No data available' },
        { label: 'Gender', value: patient.gender || 'No data available' },
        { label: 'Date of Birth', value: patient.birthDate || 'No data available' },
        { label: 'Patient ID', value: patient.id || 'No data available' }
    ];

    container.innerHTML = details.map(detail => `
        <div class="patient-detail">
            <span class="patient-detail-label">${detail.label}</span>
            <span class="patient-detail-value">${detail.value}</span>
        </div>
    `).join('');
}

function renderLocationInfo(locations) {
    const container = document.getElementById('location-info');
    
    if (!locations || !locations.summary || locations.summary.length === 0) {
        container.innerHTML = '<p class="text-muted">No location data available</p>';
        return;
    }

    container.innerHTML = locations.summary.map(location => `
        <div class="location-item">
            <div class="location-name">
                <i class="fas fa-bed me-2"></i>
                ${location.name || 'No data available'}
            </div>
            <div class="location-ward">${location.value || 'No data available'}</div>
            <div class="location-status">${location.status || 'No data available'}</div>
        </div>
    `).join('');
}

function renderEncounters(encounters) {
    const container = document.getElementById('encounters-list');
    
    if (!encounters || !encounters.summary || encounters.summary.length === 0) {
        container.innerHTML = '<p class="text-muted">No encounter data available</p>';
        return;
    }

    container.innerHTML = encounters.summary.map((encounter, index) => `
        <div class="encounter-item">
            <div class="d-flex justify-content-between align-items-start">
                <div>
                    <div class="fw-semibold">
                        <i class="fas fa-calendar-alt me-2"></i>
                        Encounter ${index + 1}
                    </div>
                    <div class="text-muted small mt-1">
                        ${encounter.date || 'No date available'}
                    </div>
                </div>
                <div class="encounter-status">
                    ${encounter.status || 'No data available'}
                </div>
            </div>
            ${encounter.name ? `<div class="mt-2 small text-muted">${encounter.name}</div>` : ''}
        </div>
    `).join('');
}

// Add some interactivity for better UX
document.addEventListener('click', function(e) {
    // Add click handlers for any interactive elements if needed
    if (e.target.classList.contains('assessment-item')) {
        e.target.style.transform = 'scale(0.98)';
        setTimeout(() => {
            e.target.style.transform = 'scale(1)';
        }, 150);
    }
});

// Add smooth transitions
document.querySelectorAll('.clinical-card, .assessment-item').forEach(element => {
    element.style.transition = 'transform 0.2s ease, box-shadow 0.2s ease';
});