// Mock patient data structure matching the FHIR data provided
window.PATIENT_DATA = {
    patient: {
        id: "pat-0a70a8f4",
        name: "Jane Doe",
        gender: "female",
        birthDate: "1980-02-15"
    },
    observation: {
        summary: [
            {
                name: "Tumor Marker CA15-3",
                value: "Tumor Marker CA15-3",
                date: "2026-03-05T12:00:00Z",
                status: "final"
            }
        ]
    },
    encounter: {
        summary: [
            {
                name: "Hospital Visit",
                date: "2026-03-01T08:00:00Z",
                status: "finished",
                value: "Outpatient"
            }
        ]
    },
    medicationrequest: {
        summary: [
            {
                name: "Treatment for Breast Cancer",
                value: "1 tablet daily",
                status: "active",
                date: "2026-03-01T09:00:00Z"
            }
        ]
    }
};

document.addEventListener('DOMContentLoaded', function() {
    loadPatientData();
});

function loadPatientData() {
    const data = window.PATIENT_DATA;
    
    if (!data || !data.patient) {
        showPatientNotFound();
        return;
    }

    // Check if this is Jane (case insensitive)
    if (!data.patient.name.toLowerCase().includes('jane')) {
        showPatientNotFound();
        return;
    }

    // Load patient header
    loadPatientHeader(data.patient);
    
    // Load observations
    loadObservations(data.observation);
    
    // Load encounters
    loadEncounters(data.encounter);
    
    // Load medications
    loadMedications(data.medicationrequest);
}

function loadPatientHeader(patient) {
    document.getElementById('patientName').textContent = patient.name || 'Unknown Patient';
    
    const genderElement = document.getElementById('patientGender');
    genderElement.innerHTML = `<i class="fas fa-venus-mars me-1"></i>${patient.gender || 'Unknown'}`;
    
    const dobElement = document.getElementById('patientDOB');
    const formattedDOB = patient.birthDate ? formatDate(patient.birthDate) : 'Unknown';
    dobElement.innerHTML = `<i class="fas fa-calendar me-1"></i>${formattedDOB}`;
}

function loadObservations(observationData) {
    const container = document.getElementById('observationsList');
    
    if (!observationData || !observationData.summary || observationData.summary.length === 0) {
        container.innerHTML = '<div class="no-data">No observations available</div>';
        return;
    }
    
    let html = '';
    observationData.summary.forEach(obs => {
        html += `
            <div class="observation-item">
                <div class="observation-value">${obs.name || 'Unknown Observation'}</div>
                <div class="observation-date">
                    <i class="fas fa-clock me-1"></i>
                    ${obs.date ? formatDateTime(obs.date) : 'Date not available'}
                </div>
                ${obs.value && obs.value !== obs.name ? `<div class="mt-1"><small class="text-muted">${obs.value}</small></div>` : ''}
            </div>
        `;
    });
    
    container.innerHTML = html;
}

function loadEncounters(encounterData) {
    const container = document.getElementById('encountersList');
    
    if (!encounterData || !encounterData.summary || encounterData.summary.length === 0) {
        container.innerHTML = '<div class="no-data">No encounters available</div>';
        return;
    }
    
    let html = '';
    encounterData.summary.forEach(encounter => {
        const statusClass = encounter.status === 'active' ? 'status-active' : 'status-finished';
        html += `
            <div class="encounter-item">
                <div class="d-flex justify-content-between align-items-start">
                    <div>
                        <div class="fw-semibold">${encounter.name || 'Hospital Visit'}</div>
                        <div class="encounter-date">
                            <i class="fas fa-calendar me-1"></i>
                            ${encounter.date ? formatDateTime(encounter.date) : 'Date not available'}
                        </div>
                        ${encounter.value ? `<div class="mt-1"><small class="text-muted">${encounter.value}</small></div>` : ''}
                    </div>
                    <span class="encounter-status ${statusClass}">
                        ${encounter.status || 'unknown'}
                    </span>
                </div>
            </div>
        `;
    });
    
    container.innerHTML = html;
}

function loadMedications(medicationData) {
    const container = document.getElementById('medicationsList');
    
    if (!medicationData || !medicationData.summary || medicationData.summary.length === 0) {
        container.innerHTML = '<div class="no-data">No medications available</div>';
        return;
    }
    
    let html = '';
    medicationData.summary.forEach(med => {
        html += `
            <div class="medication-item">
                <div class="medication-name">${med.name || 'Unknown Medication'}</div>
                ${med.value ? `<div class="medication-dosage">
                    <i class="fas fa-prescription-bottle me-1"></i>
                    ${med.value}
                </div>` : ''}
                ${med.date ? `<div class="medication-dosage">
                    <i class="fas fa-clock me-1"></i>
                    Prescribed: ${formatDateTime(med.date)}
                </div>` : ''}
                ${med.status ? `<div class="mt-1">
                    <span class="badge ${med.status === 'active' ? 'bg-success' : 'bg-secondary'} text-white">
                        ${med.status}
                    </span>
                </div>` : ''}
            </div>
        `;
    });
    
    container.innerHTML = html;
}

function showPatientNotFound() {
    document.getElementById('patientNotFound').style.display = 'block';
    document.getElementById('patientName').textContent = 'Patient Not Found';
    document.getElementById('patientGender').innerHTML = '<i class="fas fa-venus-mars me-1"></i>Unknown';
    document.getElementById('patientDOB').innerHTML = '<i class="fas fa-calendar me-1"></i>Unknown';
    
    // Clear all sections
    document.getElementById('observationsList').innerHTML = '<div class="no-data">Patient not found</div>';
    document.getElementById('encountersList').innerHTML = '<div class="no-data">Patient not found</div>';
    document.getElementById('medicationsList').innerHTML = '<div class="no-data">Patient not found</div>';
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