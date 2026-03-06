document.addEventListener('DOMContentLoaded', function() {
    const data = window.PATIENT_DATA;
    if (!data) { 
        document.body.innerHTML = '<div class="container mt-5"><div class="alert alert-warning text-center">No patient data available</div></div>'; 
        return; 
    }

    // Display patient information
    const patientName = document.getElementById('patientName');
    const patientId = document.getElementById('patientId');
    
    if (data.patient) {
        patientName.textContent = data.patient.name || 'Sienna Adams';
        patientId.textContent = `Patient ID: ${data.patient.id || '17a4369b-2ea2-4b63-9681-4660498aafdc'}`;
    }

    // Display conditions
    const conditionsList = document.getElementById('conditionsList');
    if (data.conditions && data.conditions.summary && data.conditions.summary.length > 0) {
        conditionsList.innerHTML = '';
        data.conditions.summary.forEach(condition => {
            const conditionDiv = document.createElement('div');
            conditionDiv.className = 'condition-item';
            conditionDiv.innerHTML = `
                <div class="condition-name">${condition.condition || condition.display || 'Unknown Condition'}</div>
                <div class="text-muted small mt-1">
                    Status: <span class="status-badge status-active">${condition.status || 'Active'}</span>
                    ${condition.onset ? `<span class="ms-2">Onset: ${condition.onset}</span>` : ''}
                </div>
            `;
            conditionsList.appendChild(conditionDiv);
        });
    } else {
        conditionsList.innerHTML = '<div class="empty-state"><i class="fas fa-notes-medical"></i>No conditions recorded</div>';
    }

    // Display medications
    const medicationsList = document.getElementById('medicationsList');
    if (data.medications && data.medications.summary && data.medications.summary.length > 0) {
        medicationsList.innerHTML = '';
        const hasValidMedications = data.medications.summary.some(med => med.medication && med.medication !== 'None');
        
        if (hasValidMedications) {
            data.medications.summary.forEach(medication => {
                if (medication.medication && medication.medication !== 'None') {
                    const medicationDiv = document.createElement('div');
                    medicationDiv.className = 'medication-item';
                    medicationDiv.innerHTML = `
                        <div class="medication-name">${medication.medication}</div>
                        <div class="text-muted small mt-1">
                            ${medication.dosage ? `Dosage: ${medication.dosage}` : ''}
                            ${medication.status ? `<span class="ms-2">Status: <span class="status-badge status-active">${medication.status}</span></span>` : ''}
                        </div>
                    `;
                    medicationsList.appendChild(medicationDiv);
                }
            });
        } else {
            medicationsList.innerHTML = '<div class="empty-state"><i class="fas fa-pills"></i>No medications recorded</div>';
        }
    } else {
        medicationsList.innerHTML = '<div class="empty-state"><i class="fas fa-pills"></i>No medications recorded</div>';
    }

    // Display observations
    const observationsList = document.getElementById('observationsList');
    if (data.observations && data.observations.summary && data.observations.summary.length > 0) {
        observationsList.innerHTML = '';
        data.observations.summary.forEach(obs => {
            const observationDiv = document.createElement('div');
            observationDiv.className = 'observation-item';
            observationDiv.innerHTML = `
                <div>
                    <div class="observation-name">${obs.display || obs.code || 'Unknown Observation'}</div>
                    ${obs.date ? `<div class="text-muted small">Date: ${obs.date}</div>` : ''}
                </div>
                <div class="observation-value">
                    ${obs.value ? `${obs.value} ${obs.unit || ''}` : 'No value'}
                </div>
            `;
            observationsList.appendChild(observationDiv);
        });
    } else {
        observationsList.innerHTML = '<div class="empty-state"><i class="fas fa-chart-line"></i>No observations recorded</div>';
    }
});