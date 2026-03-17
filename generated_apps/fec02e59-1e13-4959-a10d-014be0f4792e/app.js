// SHORT JavaScript - display REAL patient data
document.addEventListener('DOMContentLoaded', function() {
    const data = window.PATIENT_DATA;
    if (!data) { 
        document.body.innerHTML = '<div class="container mt-5"><div class="alert alert-warning text-center">No patient data available</div></div>'; 
        return; 
    }

    // Display patient information
    if (data.patient) {
        document.getElementById('patientName').textContent = data.patient.name || 'Unknown Patient';
        document.getElementById('patientFullName').textContent = data.patient.name || '-';
        document.getElementById('patientGender').textContent = data.patient.gender || '-';
        document.getElementById('patientBirth').textContent = data.patient.birthDate || '-';
        document.getElementById('patientId').textContent = data.patient.id || '-';
    }

    // Display observations
    if (data.observations && data.observations.summary) {
        const obsCount = data.observations.summary.length;
        document.getElementById('obsCount').textContent = `${obsCount} observation${obsCount !== 1 ? 's' : ''}`;
        
        const observationsList = document.getElementById('observationsList');
        if (obsCount === 0) {
            observationsList.innerHTML = '<div class="text-center py-3 text-muted"><i class="fas fa-info-circle me-2"></i>No observations recorded</div>';
        } else {
            observationsList.innerHTML = data.observations.summary.map(obs => `
                <div class="observation-item">
                    <div class="observation-title">${obs.display || obs.code || 'Unknown Observation'}</div>
                    <div class="observation-value">${obs.value || 'No value'} ${obs.unit || ''}</div>
                    <div class="observation-date">${obs.date || 'Date not specified'}</div>
                </div>
            `).join('');
        }
    }

    // Display conditions
    if (data.conditions && data.conditions.summary) {
        const conditionsList = document.getElementById('conditionsList');
        if (data.conditions.summary.length === 0) {
            conditionsList.innerHTML = '<div class="text-center py-3 text-muted"><i class="fas fa-info-circle me-2"></i>No conditions recorded</div>';
        } else {
            conditionsList.innerHTML = data.conditions.summary.map(condition => `
                <div class="condition-item">
                    <div class="d-flex justify-content-between align-items-start">
                        <div>
                            <div class="fw-semibold">${condition.condition || 'Unknown Condition'}</div>
                            <small class="text-muted">${condition.onset || 'Onset not specified'}</small>
                        </div>
                        <span class="status-badge ${condition.status === 'active' ? 'status-active' : 'status-inactive'}">
                            ${condition.status || 'Unknown'}
                        </span>
                    </div>
                </div>
            `).join('');
        }
    }

    // Display medications
    if (data.medications && data.medications.summary) {
        const medicationsList = document.getElementById('medicationsList');
        if (data.medications.summary.length === 0) {
            medicationsList.innerHTML = '<div class="text-center py-3 text-muted"><i class="fas fa-info-circle me-2"></i>No medications recorded</div>';
        } else {
            medicationsList.innerHTML = data.medications.summary.map(med => `
                <div class="medication-item">
                    <div class="d-flex justify-content-between align-items-start">
                        <div>
                            <div class="fw-semibold">${med.medication || 'Unknown Medication'}</div>
                            <small class="text-muted">${med.dosage || 'Dosage not specified'}</small>
                        </div>
                        <span class="status-badge ${med.status === 'active' ? 'status-active' : 'status-inactive'}">
                            ${med.status || 'Unknown'}
                        </span>
                    </div>
                </div>
            `).join('');
        }
    }
});