// SHORT JavaScript - display REAL patient data
document.addEventListener('DOMContentLoaded', function() {
    const data = window.PATIENT_DATA;
    if (!data) { 
        document.body.innerHTML = '<div class="container mt-5"><div class="alert alert-warning text-center">No patient data available</div></div>'; 
        return; 
    }

    // Display patient info
    document.getElementById('patientName').textContent = data.patient.name || 'Unknown Patient';
    document.getElementById('patientInfo').textContent = `${data.patient.gender || 'Unknown'} • Born ${data.patient.birthDate || 'Unknown'}`;

    // Update dashboard stats
    document.getElementById('totalEncounters').textContent = data.encounters?.summary?.length || 0;
    document.getElementById('totalObservations').textContent = data.observations?.summary?.length || 0;
    document.getElementById('totalMedications').textContent = data.medications?.summary?.length || 0;
    document.getElementById('totalConditions').textContent = data.conditions?.summary?.length || 0;

    // Display encounters
    const encountersList = document.getElementById('encountersList');
    if (data.encounters?.summary?.length > 0) {
        encountersList.innerHTML = data.encounters.summary.map(encounter => `
            <div class="encounter-item">
                <div class="d-flex justify-content-between align-items-start mb-2">
                    <div class="encounter-type">${encounter.type || 'Medical Encounter'}</div>
                    <span class="encounter-status status-${(encounter.status || 'finished').toLowerCase().replace(' ', '-')}">
                        ${encounter.status || 'Finished'}
                    </span>
                </div>
                <div class="encounter-date">
                    <i class="fas fa-calendar-alt me-1"></i>
                    ${encounter.date ? new Date(encounter.date).toLocaleDateString() : 'Date not available'}
                </div>
                ${encounter.provider ? `<div class="mt-1"><i class="fas fa-user-md me-1"></i>${encounter.provider}</div>` : ''}
            </div>
        `).join('');
    } else {
        encountersList.innerHTML = '<div class="text-center py-4 text-muted">No encounters found</div>';
    }

    // Display recent observations
    const observationsList = document.getElementById('observationsList');
    if (data.observations?.summary?.length > 0) {
        const recentObs = data.observations.summary.slice(0, 8);
        observationsList.innerHTML = recentObs.map(obs => `
            <div class="observation-item">
                <div class="observation-label">${obs.display || obs.code || 'Unknown'}</div>
                <div class="observation-value">${obs.value || 'N/A'} ${obs.unit || ''}</div>
                <div class="observation-date">
                    ${obs.date ? new Date(obs.date).toLocaleDateString() : 'Date not available'}
                </div>
            </div>
        `).join('');
    } else {
        observationsList.innerHTML = '<div class="text-center py-4 text-muted">No observations found</div>';
    }
});