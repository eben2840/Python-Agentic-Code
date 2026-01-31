// SHORT JavaScript - display REAL patient data
document.addEventListener('DOMContentLoaded', function() {
    const data = window.PATIENT_DATA;
    if (!data) { 
        document.body.innerHTML = '<div class="container mt-5"><div class="alert alert-warning text-center"><i class="fas fa-exclamation-triangle me-2"></i>No patient data available</div></div>'; 
        return; 
    }

    // Display patient info
    document.getElementById('patientName').textContent = data.patient.name || 'Unknown Patient';
    document.getElementById('patientInfo').textContent = `Patient ID: ${data.patient.id || 'N/A'} • ${data.patient.gender || 'N/A'} • Born: ${data.patient.birthDate || 'N/A'}`;

    // Display observations count
    const observationCount = data.observations.summary.length;
    document.getElementById('observationCount').textContent = `${observationCount} items`;

    // Populate observations table
    const tableBody = document.getElementById('observationsTable');
    tableBody.innerHTML = '';

    if (observationCount === 0) {
        tableBody.innerHTML = '<tr><td colspan="5" class="text-center py-5 text-muted"><i class="fas fa-info-circle me-2"></i>No observations found</td></tr>';
        return;
    }

    data.observations.summary.forEach(obs => {
        const row = document.createElement('tr');
        
        const statusClass = obs.status === 'final' ? 'status-final' : 'status-preliminary';
        const formattedDate = obs.date ? new Date(obs.date).toLocaleDateString() : 'N/A';
        const displayValue = obs.value !== undefined ? obs.value : 'N/A';
        const displayUnit = obs.unit || '';
        
        row.innerHTML = `
            <td class="ps-4">
                <div class="observation-name">${obs.display || obs.code || 'Unknown'}</div>
            </td>
            <td>
                <span class="observation-value">${displayValue}</span>
            </td>
            <td class="text-muted">${displayUnit}</td>
            <td class="text-muted">${formattedDate}</td>
            <td class="pe-4">
                <span class="status-badge ${statusClass}">${obs.status || 'unknown'}</span>
            </td>
        `;
        
        tableBody.appendChild(row);
    });

    // Create summary cards for key metrics
    const summaryCards = document.getElementById('summaryCards');
    const keyMetrics = data.observations.summary.filter(obs => 
        obs.display && (
            obs.display.includes('Height') || 
            obs.display.includes('Weight') || 
            obs.display.includes('BMI') || 
            obs.display.includes('Body Mass Index')
        )
    );

    keyMetrics.forEach(metric => {
        let iconClass = 'fas fa-chart-bar';
        let iconColorClass = 'icon-height';
        
        if (metric.display.includes('Weight')) {
            iconClass = 'fas fa-weight';
            iconColorClass = 'icon-weight';
        } else if (metric.display.includes('BMI') || metric.display.includes('Body Mass Index')) {
            iconClass = 'fas fa-calculator';
            iconColorClass = 'icon-bmi';
        } else if (metric.display.includes('Height')) {
            iconClass = 'fas fa-ruler-vertical';
            iconColorClass = 'icon-height';
        }

        const cardCol = document.createElement('div');
        cardCol.className = 'col-md-4 mb-3';
        cardCol.innerHTML = `
            <div class="card summary-card h-100">
                <div class="card-body text-center">
                    <div class="summary-icon ${iconColorClass} mx-auto mb-3">
                        <i class="${iconClass}"></i>
                    </div>
                    <h3 class="mb-1">${metric.value || 'N/A'} ${metric.unit || ''}</h3>
                    <p class="text-muted mb-0">${metric.display}</p>
                </div>
            </div>
        `;
        summaryCards.appendChild(cardCol);
    });
});