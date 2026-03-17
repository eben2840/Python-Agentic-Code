// Mock patient data structure with detailed observations
window.PATIENT_DATA = {
    patient: {
        id: 'pat-9f93d195',
        name: 'Regina Hall',
        gender: 'female',
        birthDate: '1985-07-22'
    },
    observation: {
        summary: [
            {
                id: 'obs-001',
                name: 'Blood Pressure',
                value: '135/85 mmHg',
                status: 'final',
                date: '2024-03-15T10:30:00Z',
                category: 'vital-signs',
                performer: 'Dr. Smith',
                method: 'Automated cuff',
                bodySite: 'Right arm',
                interpretation: 'Elevated - Stage 1 Hypertension',
                referenceRange: 'Normal: <120/80 mmHg'
            },
            {
                id: 'obs-002',
                name: 'HbA1c',
                value: '7.2%',
                status: 'final',
                date: '2024-03-15T10:45:00Z',
                category: 'laboratory',
                performer: 'Lab Technician',
                method: 'HPLC',
                specimen: 'Venous blood',
                interpretation: 'Above target - Poor diabetic control',
                referenceRange: 'Target for diabetes: <7.0%'
            },
            {
                id: 'obs-003',
                name: 'Total Cholesterol',
                value: '180 mg/dL',
                status: 'final',
                date: '2024-03-15T11:00:00Z',
                category: 'laboratory',
                performer: 'Lab Technician',
                method: 'Enzymatic assay',
                specimen: 'Serum',
                interpretation: 'Desirable level',
                referenceRange: 'Desirable: <200 mg/dL'
            },
            {
                id: 'obs-004',
                name: 'Body Weight',
                value: '68.5 kg',
                status: 'final',
                date: '2024-03-15T09:45:00Z',
                category: 'vital-signs',
                performer: 'Nurse Johnson',
                method: 'Digital scale',
                interpretation: 'Within normal range',
                referenceRange: 'BMI calculation needed'
            },
            {
                id: 'obs-005',
                name: 'Heart Rate',
                value: '78 bpm',
                status: 'final',
                date: '2024-03-15T10:30:00Z',
                category: 'vital-signs',
                performer: 'Dr. Smith',
                method: 'Pulse oximeter',
                interpretation: 'Normal resting heart rate',
                referenceRange: 'Normal: 60-100 bpm'
            },
            {
                id: 'obs-006',
                name: 'Oxygen Saturation',
                value: '98%',
                status: 'final',
                date: '2024-03-15T10:30:00Z',
                category: 'vital-signs',
                performer: 'Dr. Smith',
                method: 'Pulse oximeter',
                bodySite: 'Index finger',
                interpretation: 'Normal oxygen saturation',
                referenceRange: 'Normal: >95%'
            }
        ]
    }
};

function formatDate(dateString) {
    if (!dateString) return 'No date';
    
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
        return 'Invalid date';
    }
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
            return 'status-badge bg-light text-dark';
    }
}

function calculateAge(birthDate) {
    if (!birthDate) return 'Unknown age';
    
    try {
        const birth = new Date(birthDate);
        const today = new Date();
        let age = today.getFullYear() - birth.getFullYear();
        const monthDiff = today.getMonth() - birth.getMonth();
        
        if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
            age--;
        }
        
        return `${age} years old`;
    } catch (e) {
        return 'Unknown age';
    }
}

function loadPatientInfo() {
    const data = window.PATIENT_DATA;
    
    if (!data || !data.patient) {
        document.getElementById('patientName').textContent = 'No patient data';
        return;
    }
    
    document.getElementById('patientName').textContent = data.patient.name || 'Unknown Patient';
    document.getElementById('patientGender').textContent = data.patient.gender || '-';
    document.getElementById('patientDob').textContent = calculateAge(data.patient.birthDate);
    document.getElementById('patientId').textContent = `ID: ${data.patient.id || 'Unknown'}`;
}

function loadObservations() {
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
                <div class="item-title">${obs.name || 'Unnamed Observation'}</div>
                ${obs.value && obs.value !== obs.name ? `<div class="item-subtitle value-highlight">${obs.value}</div>` : ''}
                
                <div class="observation-details">
                    ${obs.interpretation ? `<div class="item-detail"><strong>Interpretation:</strong> ${obs.interpretation}</div>` : ''}
                    ${obs.referenceRange ? `<div class="item-detail"><strong>Reference Range:</strong> ${obs.referenceRange}</div>` : ''}
                    ${obs.category ? `<div class="item-detail"><strong>Category:</strong> ${obs.category.replace('-', ' ')}</div>` : ''}
                    ${obs.performer ? `<div class="item-detail"><strong>Performed by:</strong> ${obs.performer}</div>` : ''}
                    ${obs.method ? `<div class="item-detail"><strong>Method:</strong> ${obs.method}</div>` : ''}
                    ${obs.bodySite ? `<div class="item-detail"><strong>Body Site:</strong> ${obs.bodySite}</div>` : ''}
                    ${obs.specimen ? `<div class="item-detail"><strong>Specimen:</strong> ${obs.specimen}</div>` : ''}
                </div>
                
                <div class="d-flex justify-content-between align-items-center mt-2">
                    ${obs.status ? `<span class="${getStatusBadgeClass(obs.status)}">${obs.status}</span>` : ''}
                    ${obs.date ? `<span class="item-meta">${formatDate(obs.date)}</span>` : ''}
                </div>
            </div>
        `;
    });
    
    container.innerHTML = html;
}

// Initialize the application
document.addEventListener('DOMContentLoaded', function() {
    loadPatientInfo();
    loadObservations();
});