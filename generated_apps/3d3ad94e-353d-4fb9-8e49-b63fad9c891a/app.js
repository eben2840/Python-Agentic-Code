document.addEventListener('DOMContentLoaded', function() {
    const data = window.PATIENT_DATA;
    if (!data) { 
        document.body.innerHTML = '<div class="container mt-5"><div class="alert alert-warning text-center">No patient data available</div></div>'; 
        return; 
    }

    // Display patient information
    const patientName = document.getElementById('patientName');
    const patientInfo = document.getElementById('patientInfo');
    
    if (data.patient) {
        patientName.textContent = `Assessment - ${data.patient.name || 'Unknown Patient'}`;
        const age = data.patient.birthDate ? calculateAge(data.patient.birthDate) : 'Unknown';
        const gender = data.patient.gender || 'Unknown';
        patientInfo.textContent = `${gender} • Age ${age} • ID: ${data.patient.id || 'N/A'}`;
    }

    // Display current observations
    const observationsContainer = document.getElementById('currentObservations');
    
    if (data.observations && data.observations.summary && data.observations.summary.length > 0) {
        data.observations.summary.forEach(obs => {
            const observationCard = createObservationCard(obs);
            observationsContainer.appendChild(observationCard);
        });
    } else {
        observationsContainer.innerHTML = '<div class="col-12"><div class="alert alert-info">No current observations available</div></div>';
    }

    // Handle form submission
    const form = document.getElementById('assessmentForm');
    form.addEventListener('submit', function(e) {
        e.preventDefault();
        
        // Show success message
        const alert = document.createElement('div');
        alert.className = 'alert alert-success alert-dismissible fade show mt-3';
        alert.innerHTML = `
            <i class="fas fa-check-circle me-2"></i>
            Assessment completed successfully!
            <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
        `;
        
        form.appendChild(alert);
        
        // Scroll to top
        window.scrollTo({ top: 0, behavior: 'smooth' });
    });
});

function createObservationCard(obs) {
    const col = document.createElement('div');
    col.className = 'col-md-6 col-lg-4';
    
    const status = determineStatus(obs.value, obs.code);
    const statusClass = getStatusClass(status);
    
    col.innerHTML = `
        <div class="observation-card">
            <div class="d-flex justify-content-between align-items-start mb-2">
                <div class="observation-label">${obs.display || obs.code}</div>
                <span class="status-badge ${statusClass}">${status}</span>
            </div>
            <div class="observation-value">
                ${obs.value || 'N/A'}
                <span class="observation-unit">${obs.unit || ''}</span>
            </div>
            <div class="observation-date mt-1">
                ${obs.date ? formatDate(obs.date) : 'No date'}
            </div>
        </div>
    `;
    
    return col;
}

function determineStatus(value, code) {
    if (!value || isNaN(value)) return 'Unknown';
    
    const numValue = parseFloat(value);
    
    // Basic ranges for common observations
    if (code && code.includes('blood-pressure')) {
        return numValue > 140 ? 'High' : numValue < 90 ? 'Low' : 'Normal';
    } else if (code && code.includes('heart-rate')) {
        return numValue > 100 ? 'High' : numValue < 60 ? 'Low' : 'Normal';
    } else if (code && code.includes('temperature')) {
        return numValue > 37.5 ? 'Elevated' : numValue < 36 ? 'Low' : 'Normal';
    }
    
    return 'Normal';
}

function getStatusClass(status) {
    switch (status.toLowerCase()) {
        case 'normal': return 'status-normal';
        case 'high': case 'elevated': case 'low': return 'status-abnormal';
        case 'critical': return 'status-critical';
        default: return 'status-normal';
    }
}

function calculateAge(birthDate) {
    const today = new Date();
    const birth = new Date(birthDate);
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
        age--;
    }
    
    return age;
}

function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'short', 
        day: 'numeric' 
    });
}