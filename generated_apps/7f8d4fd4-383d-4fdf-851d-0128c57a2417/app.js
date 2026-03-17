// SHORT JavaScript - display REAL patient data
document.addEventListener('DOMContentLoaded', function() {
    const data = window.PATIENT_DATA;
    if (!data) { 
        document.body.innerHTML = '<div class="container mt-5"><div class="alert alert-warning text-center">No patient data available</div></div>'; 
        return; 
    }

    // Update stats
    const totalObservations = data.observations?.summary?.length || 0;
    const totalConditions = data.conditions?.summary?.length || 0;
    const totalMedications = data.medications?.summary?.length || 0;
    const totalAllergies = data.allergies?.summary?.length || 0;

    document.getElementById('patientCount').textContent = '1';
    document.getElementById('totalObservations').textContent = totalObservations;
    document.getElementById('totalConditions').textContent = totalConditions;
    document.getElementById('totalMedications').textContent = totalMedications;
    document.getElementById('totalAllergies').textContent = totalAllergies;

    // Display patient information
    const patientsList = document.getElementById('patientsList');
    const patient = data.patient;
    
    let patientHtml = `
        <div class="patient-item">
            <div class="patient-header">
                <div>
                    <div class="patient-name">
                        <i class="fas fa-user-circle text-primary me-2"></i>
                        ${patient?.name || 'Unknown Patient'}
                    </div>
                    <div class="patient-info">
                        ${patient?.gender || 'Unknown'} • Born: ${patient?.birthDate || 'Unknown'}
                    </div>
                </div>
            </div>
    `;

    // Latest Observations
    if (data.observations?.summary?.length > 0) {
        patientHtml += '<div class="section-title">Latest Observations</div>';
        data.observations.summary.slice(0, 6).forEach(obs => {
            patientHtml += `
                <span class="observation-badge">
                    ${obs.display}: ${obs.value} ${obs.unit || ''}
                </span>
            `;
        });
    }

    // Active Conditions
    if (data.conditions?.summary?.length > 0) {
        patientHtml += '<div class="section-title">Active Conditions</div>';
        data.conditions.summary.slice(0, 4).forEach(condition => {
            patientHtml += `
                <span class="condition-badge">
                    ${condition.condition}
                </span>
            `;
        });
    }

    // Current Medications
    if (data.medications?.summary?.length > 0) {
        patientHtml += '<div class="section-title">Current Medications</div>';
        data.medications.summary.slice(0, 4).forEach(med => {
            patientHtml += `
                <span class="observation-badge">
                    ${med.medication}
                </span>
            `;
        });
    }

    // Known Allergies
    if (data.allergies?.summary?.length > 0) {
        patientHtml += '<div class="section-title">Known Allergies</div>';
        data.allergies.summary.forEach(allergy => {
            patientHtml += `
                <span class="condition-badge" style="background: #fef2f2; color: #dc2626;">
                    ${allergy.allergen}
                </span>
            `;
        });
    }

    patientHtml += '</div>';
    patientsList.innerHTML = patientHtml;
});