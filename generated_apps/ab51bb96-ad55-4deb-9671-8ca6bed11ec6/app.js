document.addEventListener('DOMContentLoaded', function() {
    // Sample ER patients data (since no real data available)
    const erPatients = [
        {
            id: 'ER001',
            name: 'John Smith',
            age: 45,
            priority: 'Critical',
            complaint: 'Chest pain, shortness of breath',
            arrivalTime: '14:30',
            status: 'In Treatment'
        },
        {
            id: 'ER002', 
            name: 'Maria Garcia',
            age: 32,
            priority: 'Urgent',
            complaint: 'Severe abdominal pain',
            arrivalTime: '15:15',
            status: 'Waiting'
        },
        {
            id: 'ER003',
            name: 'Robert Johnson',
            age: 67,
            priority: 'Less Urgent',
            complaint: 'Minor laceration on hand',
            arrivalTime: '15:45',
            status: 'Waiting'
        }
    ];

    displayPatients(erPatients);

    // Check if real patient data exists
    const data = window.PATIENT_DATA;
    if (data && data.patient) {
        console.log('Real patient data available:', data.patient.name);
        // Could integrate real patient data here
    }
});

function displayPatients(patients) {
    const tbody = document.getElementById('patientsTableBody');
    tbody.innerHTML = '';

    patients.forEach(patient => {
        const row = document.createElement('tr');
        row.className = 'patient-row';
        
        const priorityBadgeClass = getPriorityBadgeClass(patient.priority);
        const statusBadgeClass = getStatusBadgeClass(patient.status);
        
        row.innerHTML = `
            <td>
                <div class="d-flex align-items-center">
                    <div class="avatar-circle me-3">
                        <i class="fas fa-user text-muted"></i>
                    </div>
                    <div>
                        <div class="fw-semibold">${patient.name}</div>
                        <small class="text-muted">ID: ${patient.id}</small>
                    </div>
                </div>
            </td>
            <td>${patient.age}</td>
            <td><span class="badge ${priorityBadgeClass}">${patient.priority}</span></td>
            <td>${patient.complaint}</td>
            <td>${patient.arrivalTime}</td>
            <td><span class="badge ${statusBadgeClass}">${patient.status}</span></td>
            <td>
                <div class="btn-group btn-group-sm">
                    <button class="btn btn-outline-primary" onclick="viewPatient('${patient.id}')">
                        <i class="fas fa-eye"></i>
                    </button>
                    <button class="btn btn-outline-success" onclick="captureVitals('${patient.id}')">
                        <i class="fas fa-heartbeat"></i>
                    </button>
                </div>
            </td>
        `;
        
        tbody.appendChild(row);
    });
}

function getPriorityBadgeClass(priority) {
    switch(priority) {
        case 'Critical': return 'badge-critical';
        case 'Urgent': return 'badge-urgent';
        case 'Less Urgent': return 'badge-less-urgent';
        default: return 'badge-less-urgent';
    }
}

function getStatusBadgeClass(status) {
    switch(status) {
        case 'In Treatment': return 'badge-in-treatment';
        case 'Waiting': return 'badge-waiting';
        default: return 'badge-waiting';
    }
}

function saveEmergencyInfo() {
    const form = document.getElementById('emergencyForm');
    const formData = new FormData(form);
    
    const emergencyData = {
        patientId: document.getElementById('patientId').value,
        priority: document.getElementById('priorityLevel').value,
        complaint: document.getElementById('chiefComplaint').value,
        allergies: document.getElementById('allergies').value,
        medications: document.getElementById('medications').value,
        notes: document.getElementById('emergencyNotes').value,
        timestamp: new Date().toISOString()
    };
    
    console.log('Emergency info saved:', emergencyData);
    
    // Show success message
    alert('Emergency information saved successfully!');
    
    // Close modal and reset form
    const modal = bootstrap.Modal.getInstance(document.getElementById('emergencyModal'));
    modal.hide();
    form.reset();
}

function saveVitalSigns() {
    const form = document.getElementById('vitalSignsForm');
    
    const vitalData = {
        patientId: document.getElementById('vitalPatientId').value,
        recordedBy: document.getElementById('recordedBy').value,
        bloodPressure: document.getElementById('bloodPressure').value,
        heartRate: document.getElementById('heartRate').value,
        temperature: document.getElementById('temperature').value,
        respiratoryRate: document.getElementById('respiratoryRate').value,
        oxygenSat: document.getElementById('oxygenSat').value,
        painScale: document.getElementById('painScale').value,
        weight: document.getElementById('weight').value,
        notes: document.getElementById('vitalNotes').value,
        timestamp: new Date().toISOString()
    };
    
    console.log('Vital signs saved:', vitalData);
    
    // Show success message
    alert('Vital signs captured successfully!');
    
    // Close modal and reset form
    const modal = bootstrap.Modal.getInstance(document.getElementById('vitalSignsModal'));
    modal.hide();
    form.reset();
}

function viewPatient(patientId) {
    console.log('Viewing patient:', patientId);
    alert(`Opening patient record for: ${patientId}`);
}

function captureVitals(patientId) {
    document.getElementById('vitalPatientId').value = patientId;
    const modal = new bootstrap.Modal(document.getElementById('vitalSignsModal'));
    modal.show();
}