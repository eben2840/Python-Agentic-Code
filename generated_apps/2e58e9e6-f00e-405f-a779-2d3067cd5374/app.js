// Mock patient data structure
window.PATIENT_DATA = {
    patient: {
        id: 'pat-9f93d195',
        name: 'Rose Hall',
        gender: 'female',
        birthDate: '2010-05-15'
    },
    condition: {
        summary: [
            {
                name: 'Tonsillitis',
                status: 'active',
                date: '2026-03-01T09:00:00Z'
            }
        ]
    },
    encounter: {
        summary: [
            {
                name: 'Current Visit',
                status: 'in-progress',
                date: '2026-03-01T08:00:00Z'
            }
        ]
    },
    medicationrequest: {
        summary: [
            {
                name: 'Treatment for Tonsillitis',
                value: '1 tablet daily',
                status: 'active'
            }
        ]
    },
    observation: {
        summary: [
            {
                name: 'WBC 14',
                value: 'WBC 14',
                date: '2026-03-05T12:00:00Z',
                status: 'final'
            }
        ]
    },
    vital_signs: {
        summary: [
            {
                name: 'WBC 14',
                value: 'WBC 14',
                date: '2026-03-05T12:00:00Z',
                status: 'final'
            }
        ]
    },
    locations: {
        summary: [
            {
                name: 'Room 1811',
                value: 'ENT Ward',
                status: 'active'
            }
        ]
    }
};

function formatDate(dateString) {
    if (!dateString) return 'No date available';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

function getStatusBadgeClass(status) {
    switch (status?.toLowerCase()) {
        case 'active':
            return 'status-badge status-active';
        case 'in-progress':
            return 'status-badge status-in-progress';
        case 'final':
            return 'status-badge status-final';
        default:
            return 'status-badge';
    }
}

function calculateAge(birthDate) {
    if (!birthDate) return 'Unknown age';
    const birth = new Date(birthDate);
    const today = new Date();
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
        age--;
    }
    return `${age} years old`;
}

function loadPatientHeader() {
    const data = window.PATIENT_DATA;
    
    if (!data || !data.patient) {
        document.getElementById('patientName').textContent = 'No patient data available';
        document.getElementById('patientDetails').textContent = '';
        return;
    }

    const patient = data.patient;
    document.getElementById('patientName').textContent = patient.name || 'Unknown Patient';
    
    const details = [];
    if (patient.gender) details.push(`Gender: ${patient.gender}`);
    if (patient.birthDate) details.push(calculateAge(patient.birthDate));
    if (patient.id) details.push(`ID: ${patient.id}`);
    
    document.getElementById('patientDetails').textContent = details.join(' • ');
}

function loadConditions() {
    const data = window.PATIENT_DATA;
    const container = document.getElementById('conditionsContent');
    
    if (!data?.condition?.summary || data.condition.summary.length === 0) {
        container.innerHTML = '<div class="no-data">No conditions available</div>';
        return;
    }

    const html = data.condition.summary.map(condition => `
        <div class="info-item">
            <div class="d-flex justify-content-between align-items-start">
                <div>
                    <div class="info-label">${condition.name || 'Unknown condition'}</div>
                    ${condition.date ? `<div class="info-date">Diagnosed: ${formatDate(condition.date)}</div>` : ''}
                </div>
                ${condition.status ? `<span class="${getStatusBadgeClass(condition.status)}">${condition.status}</span>` : ''}
            </div>
        </div>
    `).join('');
    
    container.innerHTML = html;
}

function loadMedications() {
    const data = window.PATIENT_DATA;
    const container = document.getElementById('medicationsContent');
    
    if (!data?.medicationrequest?.summary || data.medicationrequest.summary.length === 0) {
        container.innerHTML = '<div class="no-data">No medications available</div>';
        return;
    }

    const html = data.medicationrequest.summary.map(med => `
        <div class="info-item">
            <div class="d-flex justify-content-between align-items-start">
                <div>
                    <div class="info-label">${med.name || 'Unknown medication'}</div>
                    ${med.value ? `<div class="info-value">${med.value}</div>` : ''}
                </div>
                ${med.status ? `<span class="${getStatusBadgeClass(med.status)}">${med.status}</span>` : ''}
            </div>
        </div>
    `).join('');
    
    container.innerHTML = html;
}

function loadObservations() {
    const data = window.PATIENT_DATA;
    const container = document.getElementById('observationsContent');
    
    if (!data?.observation?.summary || data.observation.summary.length === 0) {
        container.innerHTML = '<div class="no-data">No observations available</div>';
        return;
    }

    const html = data.observation.summary.map(obs => `
        <div class="info-item">
            <div class="d-flex justify-content-between align-items-start">
                <div>
                    <div class="info-label">${obs.name || 'Unknown test'}</div>
                    ${obs.value ? `<div class="info-value">Result: ${obs.value}</div>` : ''}
                    ${obs.date ? `<div class="info-date">${formatDate(obs.date)}</div>` : ''}
                </div>
                ${obs.status ? `<span class="${getStatusBadgeClass(obs.status)}">${obs.status}</span>` : ''}
            </div>
        </div>
    `).join('');
    
    container.innerHTML = html;
}

function loadRoomInformation() {
    const data = window.PATIENT_DATA;
    const container = document.getElementById('roomContent');
    
    if (!data?.locations?.summary || data.locations.summary.length === 0) {
        container.innerHTML = '<div class="no-data">No room information available</div>';
        return;
    }

    const location = data.locations.summary[0];
    const html = `
        <div class="room-display">
            <div class="room-icon">
                <i class="fas fa-bed"></i>
            </div>
            <div class="room-number">${location.name || 'Unknown Room'}</div>
            <div class="ward-name">${location.value || 'Unknown Ward'}</div>
            ${location.status ? `<div class="mt-2"><span class="${getStatusBadgeClass(location.status)}">${location.status}</span></div>` : ''}
        </div>
    `;
    
    container.innerHTML = html;
}

function loadEncounterStatus() {
    const data = window.PATIENT_DATA;
    const container = document.getElementById('encounterContent');
    
    if (!data?.encounter?.summary || data.encounter.summary.length === 0) {
        container.innerHTML = '<div class="no-data">No encounter information available</div>';
        return;
    }

    const encounter = data.encounter.summary[0];
    const html = `
        <div class="text-center">
            <div class="info-label mb-2">Current Visit</div>
            ${encounter.status ? `<div class="mb-2"><span class="${getStatusBadgeClass(encounter.status)}">${encounter.status}</span></div>` : ''}
            ${encounter.date ? `<div class="info-date">Started: ${formatDate(encounter.date)}</div>` : ''}
        </div>
    `;
    
    container.innerHTML = html;
}

// Initialize the application
document.addEventListener('DOMContentLoaded', function() {
    loadPatientHeader();
    loadConditions();
    loadMedications();
    loadObservations();
    loadRoomInformation();
    loadEncounterStatus();
});