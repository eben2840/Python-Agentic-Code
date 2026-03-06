// Initialize the app when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    loadPatientData();
});

function loadPatientData() {
    // Check if patient data is available
    if (!window.PATIENT_DATA) {
        showError('Patient data not available');
        return;
    }

    const data = window.PATIENT_DATA;
    
    // Load patient basic info
    loadPatientInfo(data.patient);
    
    // Load room information
    loadRoomInfo(data.locations);
}

function loadPatientInfo(patient) {
    if (!patient) {
        document.getElementById('patientName').textContent = 'No data available';
        return;
    }

    // Set patient name
    document.getElementById('patientName').textContent = patient.name || 'No data available';
    
    // Set patient gender
    document.getElementById('patientGender').textContent = 
        patient.gender ? capitalizeFirst(patient.gender) : '-';
    
    // Calculate and set age
    if (patient.birthDate) {
        const age = calculateAge(patient.birthDate);
        document.getElementById('patientAge').textContent = `${age} years old`;
    } else {
        document.getElementById('patientAge').textContent = '-';
    }
    
    // Set patient ID
    document.getElementById('patientId').textContent = patient.id || '-';
}

function loadRoomInfo(locations) {
    const roomInfoContainer = document.getElementById('roomInfo');
    
    if (!locations || !locations.summary || locations.summary.length === 0) {
        roomInfoContainer.innerHTML = '<div class="no-data">No room assignment data available</div>';
        return;
    }

    // Get the first (and likely only) location
    const location = locations.summary[0];
    
    if (!location.name) {
        roomInfoContainer.innerHTML = '<div class="no-data">No room assignment data available</div>';
        return;
    }

    // Create room display
    const roomHtml = `
        <div class="room-display">
            <div class="room-number">${location.name}</div>
            <div class="ward-name">${location.value || 'Ward information not available'}</div>
            <div class="mt-3">
                <span class="status-badge ${getStatusClass(location.status)}">
                    <i class="fas fa-circle me-1" style="font-size: 0.5rem;"></i>
                    ${capitalizeFirst(location.status || 'unknown')}
                </span>
            </div>
        </div>
    `;
    
    roomInfoContainer.innerHTML = roomHtml;
}

function calculateAge(birthDate) {
    if (!birthDate) return 0;
    
    const birth = new Date(birthDate);
    const today = new Date();
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
        age--;
    }
    
    return age;
}

function capitalizeFirst(str) {
    if (!str) return '';
    return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
}

function getStatusClass(status) {
    switch (status?.toLowerCase()) {
        case 'active':
            return 'status-active';
        default:
            return 'status-active'; // Default to active styling
    }
}

function showError(message) {
    document.getElementById('patientName').textContent = 'Error loading data';
    document.getElementById('roomInfo').innerHTML = `<div class="no-data">${message}</div>`;
}