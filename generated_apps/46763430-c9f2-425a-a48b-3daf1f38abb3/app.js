// SHORT JavaScript - display REAL patient data
document.addEventListener('DOMContentLoaded', function() {
    const data = window.PATIENT_DATA;
    if (!data) { 
        document.body.innerHTML = '<div class="container mt-5"><div class="alert alert-warning text-center">No patient data available</div></div>'; 
        return; 
    }

    // Display patient basic info
    if (data.patient) {
        document.getElementById('patientName').textContent = data.patient.name || 'Unknown Patient';
        document.getElementById('patientInfo').textContent = `Healthcare Dashboard`;
        document.getElementById('patientGender').textContent = data.patient.gender || 'Not specified';
        document.getElementById('patientBirth').textContent = data.patient.birthDate || 'Not specified';
        document.getElementById('patientId').textContent = data.patient.id || 'N/A';
    }

    // Display vital signs
    if (data.vital_signs && data.vital_signs.summary && data.vital_signs.summary.length > 0) {
        const vitalContainer = document.getElementById('vitalSigns');
        vitalContainer.innerHTML = '';
        
        data.vital_signs.summary.slice(0, 4).forEach(vital => {
            const vitalDiv = document.createElement('div');
            vitalDiv.className = 'observation-item';
            vitalDiv.innerHTML = `
                <div class="d-flex justify-content-between align-items-center">
                    <span class="text-muted">${vital.display}</span>
                    <span class="value-highlight">${vital.value} ${vital.unit || ''}</span>
                </div>
                <div class="date-small">${vital.date || 'No date'}</div>
            `;
            vitalContainer.appendChild(vitalDiv);
        });
    }

    // Display observations
    if (data.observations && data.observations.summary && data.observations.summary.length > 0) {
        const obsContainer = document.getElementById('observations');
        obsContainer.innerHTML = '';
        
        data.observations.summary.slice(0, 4).forEach(obs => {
            const obsDiv = document.createElement('div');
            obsDiv.className = 'observation-item';
            obsDiv.innerHTML = `
                <div class="d-flex justify-content-between align-items-center">
                    <span class="text-muted">${obs.display}</span>
                    <span class="value-highlight">${obs.value} ${obs.unit || ''}</span>
                </div>
                <div class="date-small">${obs.date || 'No date'}</div>
            `;
            obsContainer.appendChild(obsDiv);
        });
    }

    // Display conditions
    if (data.conditions && data.conditions.summary && data.conditions.summary.length > 0) {
        const condContainer = document.getElementById('conditions');
        condContainer.innerHTML = '';
        
        data.conditions.summary.forEach(condition => {
            const condDiv = document.createElement('div');
            condDiv.className = 'observation-item';
            condDiv.innerHTML = `
                <div class="d-flex justify-content-between align-items-center mb-1">
                    <span class="fw-medium">${condition.condition}</span>
                    <span class="badge badge-warning">${condition.status || 'Active'}</span>
                </div>
                <div class="date-small">Onset: ${condition.onset || 'Unknown'}</div>
            `;
            condContainer.appendChild(condDiv);
        });
    }

    // Display medications
    if (data.medications && data.medications.summary && data.medications.summary.length > 0) {
        const medContainer = document.getElementById('medications');
        medContainer.innerHTML = '';
        
        data.medications.summary.forEach(med => {
            const medDiv = document.createElement('div');
            medDiv.className = 'observation-item';
            medDiv.innerHTML = `
                <div class="d-flex justify-content-between align-items-center mb-1">
                    <span class="fw-medium">${med.medication}</span>
                    <span class="badge badge-info">${med.status || 'Active'}</span>
                </div>
                <div class="text-muted small">${med.dosage || 'No dosage specified'}</div>
                <div class="date-small">Prescribed: ${med.authoredOn || 'Unknown'}</div>
            `;
            medContainer.appendChild(medDiv);
        });
    }
});