document.addEventListener('DOMContentLoaded', function() {
    const data = window.PATIENT_DATA;
    
    if (!data) {
        document.getElementById('patientName').textContent = 'No Patient Data';
        document.getElementById('patientInfo').textContent = 'Unable to load patient information';
        document.getElementById('observationsGrid').innerHTML = `
            <div class="col-12 no-data">
                <i class="fas fa-exclamation-triangle"></i>
                <h3>No Data Available</h3>
                <p>Patient data could not be loaded.</p>
            </div>
        `;
        return;
    }

    // Display patient info
    document.getElementById('patientName').textContent = data.patient.name || 'Unknown Patient';
    document.getElementById('patientInfo').textContent = `ID: ${data.patient.id || 'N/A'} • ${data.patient.gender || 'Unknown'} • Born: ${data.patient.birthDate || 'Unknown'}`;

    // Display observations
    const observationsGrid = document.getElementById('observationsGrid');
    
    if (!data.observations || !data.observations.summary || data.observations.summary.length === 0) {
        observationsGrid.innerHTML = `
            <div class="col-12 no-data">
                <i class="fas fa-chart-line"></i>
                <h3>No Observations</h3>
                <p>No observation data available for this patient.</p>
            </div>
        `;
        return;
    }

    let observationsHTML = '';
    
    data.observations.summary.forEach(obs => {
        const displayValue = obs.value || 'N/A';
        const displayUnit = obs.unit || '';
        const displayDate = obs.date ? new Date(obs.date).toLocaleDateString() : 'Unknown date';
        const status = obs.status || 'unknown';
        
        observationsHTML += `
            <div class="col-lg-4 col-md-6 mb-4">
                <div class="observation-card">
                    <div class="observation-label">${obs.display || obs.code || 'Unknown Observation'}</div>
                    <div class="d-flex align-items-baseline mb-2">
                        <span class="observation-value">${displayValue}</span>
                        <span class="observation-unit ms-2">${displayUnit}</span>
                    </div>
                    <div class="d-flex justify-content-between align-items-center">
                        <span class="observation-date">${displayDate}</span>
                        <span class="status-badge status-${status.toLowerCase()}">${status}</span>
                    </div>
                </div>
            </div>
        `;
    });
    
    observationsGrid.innerHTML = observationsHTML;
});