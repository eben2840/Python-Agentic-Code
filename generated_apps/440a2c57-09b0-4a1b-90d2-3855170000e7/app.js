// SHORT JavaScript - display REAL patient data
document.addEventListener('DOMContentLoaded', function() {
    const data = window.PATIENT_DATA;
    if (!data) { 
        document.body.innerHTML = '<div class="container mt-5"><div class="alert alert-warning text-center">No patient data available</div></div>'; 
        return; 
    }

    // Display patient info
    const patientInfo = document.getElementById('patientInfo');
    if (data.patient) {
        patientInfo.textContent = `${data.patient.name || 'Unknown Patient'} • ${data.patient.gender || 'N/A'} • Born: ${data.patient.birthDate || 'N/A'}`;
    }

    // Vital signs mapping with icons and colors
    const vitalIcons = {
        'Body Height': { icon: 'fas fa-ruler-vertical', color: 'text-info' },
        'Body Weight': { icon: 'fas fa-weight', color: 'text-success' },
        'Body Mass Index': { icon: 'fas fa-calculator', color: 'text-warning' },
        'Blood Pressure': { icon: 'fas fa-heartbeat', color: 'text-danger' },
        'Heart Rate': { icon: 'fas fa-heart', color: 'text-danger' },
        'Body Temperature': { icon: 'fas fa-thermometer-half', color: 'text-warning' },
        'Respiratory Rate': { icon: 'fas fa-lungs', color: 'text-primary' },
        'Oxygen Saturation': { icon: 'fas fa-wind', color: 'text-info' }
    };

    // Render vital signs cards
    const vitalsGrid = document.getElementById('vitalsGrid');
    const vitalSigns = data.vital_signs?.summary || [];
    
    vitalSigns.forEach(vital => {
        const iconInfo = vitalIcons[vital.display] || { icon: 'fas fa-chart-line', color: 'text-secondary' };
        const statusClass = getStatusClass(vital.status);
        
        const vitalCard = `
            <div class="col-lg-3 col-md-4 col-sm-6">
                <div class="card vital-card">
                    <div class="vital-icon ${iconInfo.color}">
                        <i class="${iconInfo.icon}"></i>
                    </div>
                    <div class="vital-label">${vital.display}</div>
                    <div class="vital-value">${vital.value || 'N/A'}</div>
                    <div class="vital-unit">${vital.unit || ''}</div>
                    <div class="vital-date">${formatDate(vital.date)}</div>
                    <div class="mt-2">
                        <span class="status-badge ${statusClass}">${vital.status || 'Unknown'}</span>
                    </div>
                </div>
            </div>
        `;
        vitalsGrid.innerHTML += vitalCard;
    });

    // Render observations table
    const observationsTable = document.getElementById('observationsTable');
    const observations = data.observations?.summary || [];
    
    observations.forEach(obs => {
        const statusClass = getStatusClass(obs.status);
        const row = `
            <tr>
                <td>
                    <strong>${obs.display}</strong>
                    <br><small class="text-muted">${obs.code}</small>
                </td>
                <td>
                    <span class="fw-bold">${obs.value || 'N/A'}</span>
                    <small class="text-muted ms-1">${obs.unit || ''}</small>
                </td>
                <td>${formatDate(obs.date)}</td>
                <td>
                    <span class="status-badge ${statusClass}">${obs.status || 'Unknown'}</span>
                </td>
            </tr>
        `;
        observationsTable.innerHTML += row;
    });

    function getStatusClass(status) {
        if (!status) return 'status-normal';
        const statusLower = status.toLowerCase();
        if (statusLower.includes('high') || statusLower.includes('elevated')) return 'status-high';
        if (statusLower.includes('low')) return 'status-low';
        return 'status-normal';
    }

    function formatDate(dateString) {
        if (!dateString) return 'N/A';
        try {
            return new Date(dateString).toLocaleDateString();
        } catch {
            return dateString;
        }
    }
});