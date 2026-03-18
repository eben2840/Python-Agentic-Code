// SHORT JavaScript - display REAL patient data
document.addEventListener('DOMContentLoaded', function() {
    const data = window.PATIENT_DATA;
    if (!data) { 
        document.body.innerHTML = '<div class="container mt-5"><div class="alert alert-warning text-center">No patient data available</div></div>'; 
        return; 
    }

    // Display patient info
    document.getElementById('patientName').textContent = data.patient.name || 'Unknown Patient';
    document.getElementById('patientInfo').textContent = `Patient ID: ${data.patient.id || 'N/A'}`;

    // Display conditions
    const conditionsContainer = document.getElementById('conditionsContainer');
    if (data.conditions && data.conditions.summary && data.conditions.summary.length > 0) {
        conditionsContainer.innerHTML = '';
        data.conditions.summary.forEach(condition => {
            const conditionDiv = document.createElement('div');
            conditionDiv.className = 'condition-item';
            conditionDiv.innerHTML = `
                <div class="d-flex justify-content-between align-items-start">
                    <div>
                        <h3 class="mb-1">${condition.condition || 'Unknown Condition'}</h3>
                        <p class="text-muted mb-0">Status: ${condition.status || 'Unknown'}</p>
                        ${condition.onset ? `<p class="text-muted mb-0">Onset: ${condition.onset}</p>` : ''}
                    </div>
                    <span class="status-badge status-active">Active</span>
                </div>
            `;
            conditionsContainer.appendChild(conditionDiv);
        });
    } else {
        conditionsContainer.innerHTML = '<div class="no-data"><i class="fas fa-info-circle mb-2"></i><p>No conditions recorded</p></div>';
    }

    // Display medications
    const medicationsContainer = document.getElementById('medicationsContainer');
    if (data.medications && data.medications.summary && data.medications.summary.length > 0) {
        medicationsContainer.innerHTML = '';
        data.medications.summary.forEach(medication => {
            const medicationDiv = document.createElement('div');
            medicationDiv.className = 'medication-item';
            medicationDiv.innerHTML = `
                <div class="d-flex justify-content-between align-items-start">
                    <div>
                        <h3 class="mb-1">${medication.medication || 'Unknown Medication'}</h3>
                        <p class="text-muted mb-0">Status: ${medication.status || 'Unknown'}</p>
                        ${medication.dosage ? `<p class="text-muted mb-0">Dosage: ${medication.dosage}</p>` : ''}
                        ${medication.authoredOn ? `<p class="text-muted mb-0">Prescribed: ${medication.authoredOn}</p>` : ''}
                    </div>
                    <span class="status-badge status-active">Prescribed</span>
                </div>
            `;
            medicationsContainer.appendChild(medicationDiv);
        });
    } else {
        medicationsContainer.innerHTML = '<div class="no-data"><i class="fas fa-info-circle mb-2"></i><p>No medications recorded</p></div>';
    }

    // Display observations
    const observationsContainer = document.getElementById('observationsContainer');
    if (data.observations && data.observations.summary && data.observations.summary.length > 0) {
        observationsContainer.innerHTML = '';
        data.observations.summary.forEach(obs => {
            const obsDiv = document.createElement('div');
            obsDiv.className = 'observation-item';
            obsDiv.innerHTML = `
                <div class="d-flex justify-content-between align-items-start">
                    <div>
                        <h3 class="mb-1">${obs.display || obs.code || 'Unknown Observation'}</h3>
                        <p class="mb-0">
                            <span class="value-highlight">${obs.value || 'No value'}</span>
                            ${obs.unit ? ` ${obs.unit}` : ''}
                        </p>
                        ${obs.date ? `<p class="text-muted mb-0">Date: ${obs.date}</p>` : ''}
                    </div>
                    <span class="status-badge ${obs.status === 'final' ? 'status-active' : 'status-inactive'}">${obs.status || 'Unknown'}</span>
                </div>
            `;
            observationsContainer.appendChild(obsDiv);
        });
    } else {
        observationsContainer.innerHTML = '<div class="no-data"><i class="fas fa-info-circle mb-2"></i><p>No observations recorded</p></div>';
    }
});