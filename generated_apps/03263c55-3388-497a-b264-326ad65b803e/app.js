// SHORT JavaScript - display REAL patient data
document.addEventListener('DOMContentLoaded', function() {
    const data = window.PATIENT_DATA;
    if (!data) { 
        document.body.innerHTML = '<div class="container mt-5"><div class="alert alert-warning text-center"><i class="fas fa-exclamation-triangle me-2"></i>No patient data available</div></div>'; 
        return; 
    }

    // Display patient information
    const patientInfo = document.getElementById('patient-info');
    if (data.patient) {
        const birthDate = data.patient.birthDate ? new Date(data.patient.birthDate).toLocaleDateString() : 'Unknown';
        patientInfo.innerHTML = `
            <div class="mb-2"><strong>Name:</strong> ${data.patient.name || 'Unknown'}</div>
            <div class="mb-2"><strong>Gender:</strong> ${data.patient.gender || 'Unknown'}</div>
            <div><strong>Birth Date:</strong> ${birthDate}</div>
        `;
    }

    // Display vital signs
    const vitalSigns = document.getElementById('vital-signs');
    if (data.vital_signs && data.vital_signs.summary && data.vital_signs.summary.length > 0) {
        vitalSigns.innerHTML = data.vital_signs.summary.map(vital => `
            <div class="col-md-6 col-lg-4">
                <div class="vital-card">
                    <div class="vital-value">${vital.value || 'N/A'} ${vital.unit || ''}</div>
                    <div class="vital-label">${vital.display || vital.code}</div>
                    <small class="text-muted">${vital.date ? new Date(vital.date).toLocaleDateString() : ''}</small>
                </div>
            </div>
        `).join('');
    } else {
        vitalSigns.innerHTML = '<p class="text-muted">No vital signs available</p>';
    }

    // Display observations
    const observations = document.getElementById('observations');
    if (data.observations && data.observations.summary && data.observations.summary.length > 0) {
        observations.innerHTML = data.observations.summary.slice(0, 5).map(obs => `
            <div class="list-item">
                <div class="d-flex justify-content-between align-items-start">
                    <div>
                        <div class="fw-medium">${obs.display || obs.code}</div>
                        <div class="text-muted small">${obs.value || 'N/A'} ${obs.unit || ''}</div>
                    </div>
                    <div class="text-end">
                        <span class="status-badge status-${obs.status || 'final'}">${obs.status || 'Final'}</span>
                        <div class="text-muted small mt-1">${obs.date ? new Date(obs.date).toLocaleDateString() : ''}</div>
                    </div>
                </div>
            </div>
        `).join('');
    } else {
        observations.innerHTML = '<p class="text-muted">No observations available</p>';
    }

    // Display conditions
    const conditions = document.getElementById('conditions');
    if (data.conditions && data.conditions.summary && data.conditions.summary.length > 0) {
        conditions.innerHTML = data.conditions.summary.map(condition => `
            <div class="list-item">
                <div class="d-flex justify-content-between align-items-start">
                    <div>
                        <div class="fw-medium">${condition.condition}</div>
                        <div class="text-muted small">${condition.onset ? 'Since: ' + new Date(condition.onset).toLocaleDateString() : ''}</div>
                    </div>
                    <span class="status-badge status-${condition.status || 'active'}">${condition.status || 'Active'}</span>
                </div>
            </div>
        `).join('');
    } else {
        conditions.innerHTML = '<p class="text-muted">No conditions available</p>';
    }

    // Display medications
    const medications = document.getElementById('medications');
    if (data.medications && data.medications.summary && data.medications.summary.length > 0) {
        medications.innerHTML = data.medications.summary.map(med => `
            <div class="list-item">
                <div class="d-flex justify-content-between align-items-start">
                    <div>
                        <div class="fw-medium">${med.medication}</div>
                        <div class="text-muted small">${med.dosage || ''}</div>
                    </div>
                    <div class="text-end">
                        <span class="status-badge status-${med.status || 'active'}">${med.status || 'Active'}</span>
                        <div class="text-muted small mt-1">${med.authoredOn ? new Date(med.authoredOn).toLocaleDateString() : ''}</div>
                    </div>
                </div>
            </div>
        `).join('');
    } else {
        medications.innerHTML = '<p class="text-muted">No medications available</p>';
    }

    // Display allergies
    const allergies = document.getElementById('allergies');
    if (data.allergies && data.allergies.summary && data.allergies.summary.length > 0) {
        allergies.innerHTML = data.allergies.summary.map(allergy => `
            <div class="list-item">
                <div class="d-flex justify-content-between align-items-start">
                    <div>
                        <div class="fw-medium">${allergy.allergen}</div>
                        <div class="text-muted small">${allergy.type || ''} ${allergy.criticality ? '• ' + allergy.criticality : ''}</div>
                    </div>
                    <span class="status-badge status-${allergy.status || 'active'}">${allergy.status || 'Active'}</span>
                </div>
            </div>
        `).join('');
    } else {
        allergies.innerHTML = '<p class="text-muted">No allergies available</p>';
    }
});