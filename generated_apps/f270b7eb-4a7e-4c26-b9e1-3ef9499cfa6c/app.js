document.addEventListener('DOMContentLoaded', function() {
    loadPatientData();
    initializeCube();
});

let currentRotationX = -15;
let currentRotationY = -15;

function initializeCube() {
    const cube = document.getElementById('medicalCube');
    if (cube) {
        cube.style.transform = `rotateX(${currentRotationX}deg) rotateY(${currentRotationY}deg)`;
    }
}

function rotateCube(direction) {
    const cube = document.getElementById('medicalCube');
    if (!cube) return;
    
    if (direction === 'rotateX') {
        currentRotationX += 90;
    } else if (direction === 'rotateY') {
        currentRotationY += 90;
    }
    
    cube.style.transform = `rotateX(${currentRotationX}deg) rotateY(${currentRotationY}deg)`;
}

function resetCube() {
    const cube = document.getElementById('medicalCube');
    if (!cube) return;
    
    currentRotationX = -15;
    currentRotationY = -15;
    cube.style.transform = `rotateX(${currentRotationX}deg) rotateY(${currentRotationY}deg)`;
}

function loadPatientData() {
    // For Eve Green, we'll load static data showing her medical conditions
    loadPatientHeader({
        name: 'Eve Green',
        id: 'P-2024-001',
        gender: 'female',
        birthDate: '1975-01-15'
    });
    
    // Load sample clinical data for Eve Green
    loadObservations([
        {
            name: 'Blood Pressure',
            value: '165/95 mmHg',
            date: '2024-12-15T10:30:00Z',
            status: 'final'
        },
        {
            name: 'HbA1c',
            value: '8.2%',
            date: '2024-12-10T14:15:00Z',
            status: 'final'
        },
        {
            name: 'Creatinine',
            value: '1.8 mg/dL',
            date: '2024-12-10T14:15:00Z',
            status: 'final'
        }
    ]);
    
    loadMedications([
        {
            name: 'Lisinopril',
            value: '10mg daily',
            date: '2024-12-01T09:00:00Z',
            status: 'active'
        },
        {
            name: 'Metformin',
            value: '1000mg twice daily',
            date: '2024-11-15T11:30:00Z',
            status: 'active'
        },
        {
            name: 'Warfarin',
            value: '5mg daily',
            date: '2024-11-20T15:45:00Z',
            status: 'active'
        }
    ]);
    
    loadEncounters([
        {
            name: 'Cardiology Consultation',
            value: 'Dr. Smith - Heart Rhythm Evaluation',
            date: '2024-12-15T10:00:00Z',
            status: 'finished'
        },
        {
            name: 'Emergency Visit',
            value: 'Chest Pain - Ruled out MI',
            date: '2024-12-10T20:30:00Z',
            status: 'finished'
        },
        {
            name: 'Primary Care Visit',
            value: 'Routine Follow-up - Diabetes',
            date: '2024-11-15T14:00:00Z',
            status: 'finished'
        }
    ]);
}

function loadPatientHeader(patient) {
    if (!patient) {
        document.getElementById('patientName').textContent = 'Unknown Patient';
        document.getElementById('patientId').textContent = 'No ID';
        document.getElementById('patientGender').textContent = 'Unknown';
        document.getElementById('patientDob').textContent = 'Unknown';
        return;
    }

    document.getElementById('patientName').textContent = patient.name || 'Unknown Patient';
    document.getElementById('patientId').textContent = patient.id || 'No ID';
    document.getElementById('patientGender').textContent = formatGender(patient.gender);
    document.getElementById('patientDob').textContent = formatDate(patient.birthDate);
}

function loadObservations(observations) {
    const container = document.getElementById('observationsContent');
    
    if (!observations || observations.length === 0) {
        container.innerHTML = '<div class="no-data">No observations available</div>';
        return;
    }

    let html = '';
    observations.forEach(obs => {
        html += `
            <div class="clinical-item">
                <div class="clinical-item-name">${obs.name || 'Unknown Observation'}</div>
                ${obs.value ? `<div class="clinical-item-value observation-value">${obs.value}</div>` : ''}
                <div class="d-flex justify-content-between align-items-center">
                    <div class="clinical-item-date">${formatDateTime(obs.date)}</div>
                    ${obs.status ? `<span class="badge status-badge status-${obs.status}">${obs.status}</span>` : ''}
                </div>
            </div>
        `;
    });
    
    container.innerHTML = html;
}

function loadMedications(medications) {
    const container = document.getElementById('medicationsContent');
    
    if (!medications || medications.length === 0) {
        container.innerHTML = '<div class="no-data">No medications available</div>';
        return;
    }

    let html = '';
    medications.forEach(med