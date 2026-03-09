// Mock patient data structure for Rose Hall
window.PATIENT_DATA = {
    patient: {
        id: "pat-9f93d195",
        name: "Rose Hall",
        gender: "female",
        birthDate: "2010-05-15"
    },
    encounter: {
        summary: [
            {
                name: "Outpatient Visit",
                status: "completed",
                date: "2026-03-01T08:00:00Z",
                value: "ENT Consultation"
            }
        ]
    },
    observation: {
        summary: [
            {
                name: "WBC 14",
                status: "final",
                date: "2026-03-05T12:00:00Z",
                value: "14 x10³/μL"
            }
        ]
    },
    medicationrequest: {
        summary: [
            {
                name: "Treatment for Tonsillitis",
                status: "active",
                date: "2026-03-01T09:00:00Z",
                value: "1 tablet daily"
            }
        ]
    }
};

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
    if (!dateString) return 'Unknown';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    });
}

function formatDateTime(dateString) {
    if (!dateString) return 'Unknown';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

function renderPatientHeader() {
    const data = window.PATIENT_DATA;
    if (!data || !data.patient) return;

    document.getElementById('patientName').textContent = data.patient.name || 'Unknown Patient';
    document.getElementById('patientGender').textContent = data.patient.gender || 'Unknown';
    document.getElementById('patientAge').textContent = calculateAge(data.patient.birthDate) + ' years old';
    document.getElementById('patientDOB').textContent = formatDate(data.patient.birthDate);
}

function renderEncounters() {
    const container = document.getElementById('encountersContent');
    const data = window.PATIENT_DATA;
    
    if (!data || !data.encounter || !data.encounter.summary || data.encounter.summary.length === 0) {
        container.innerHTML = '<div class="no-data">No encounters available</div>';
        return;
    }

    let html = '';
    data.encounter.summary.forEach(encounter => {
        const statusClass = encounter.status === 'completed' ? 'status-completed' : 'status-active';
        html += `
            <div class="encounter-item">
                <div class="encounter-date">${encounter.name || 'Encounter'}</div>
                <div class="d-flex justify-content-between align-items-center mt-1">
                    <span class="text-muted small">${formatDateTime(encounter.date)}</span>
                    <span class="status-badge ${statusClass}">${encounter.status || 'unknown'}</span>
                </div>
                ${encounter.value ? `<div class="text-muted small mt-1">${encounter.value}</div>` : ''}
            </div>
        `;
    });
    
    container.innerHTML = html;
}

function renderObservations() {
    const container = document.getElementById('observationsContent');
    const data = window.PATIENT_DATA;
    
    if (!data || !data.observation || !data.observation.summary || data.observation.summary.length === 0) {
        container.innerHTML = '<div class="no-data">No observations available</div>';
        return;
    }

    let html = '';
    data.observation.summary.forEach(obs => {
        html += `
            <div class="observation-item">
                <div class="observation-value">${obs.name || 'Unknown Observation'}</div>
                ${obs.value ? `<div class="text-muted small mt-1">${obs.value}</div>` : ''}
                <div class="observation-date">${formatDateTime(obs.date)}</div>
            </div>
        `;
    });
    
    container.innerHTML = html;
}

function renderMedications() {
    const container = document.getElementById('medicationsContent');
    const data = window.PATIENT_DATA;
    
    if (!data || !data.medicationrequest || !data.medicationrequest.summary || data.medicationrequest.summary.length === 0) {
        container.innerHTML = '<div class="no-data">No medications available</div>';
        return;
    }

    let html = '';
    data.medicationrequest.summary.forEach(med => {
        const statusClass = med.status === 'active' ? 'status-active' : 'status-completed';
        html += `
            <div class="medication-item">
                <div class="medication-name">${med.name || 'Unknown Medication'}</div>
                ${med.value ? `<div class="medication-dosage">${med.value}</div>` : ''}
                <div class="d-flex justify-content-between align-items-center mt-1">
                    <span class="text-muted small">${formatDate(med.date)}</span>
                    <span class="status-badge ${statusClass}">${med.status || 'unknown'}</span>
                </div>
            </div>
        `;
    });
    
    container.innerHTML = html;
}

// Initialize the app
document.addEventListener('DOMContentLoaded', function() {
    renderPatientHeader();
    renderEncounters();
    renderObservations();
    renderMedications();
});