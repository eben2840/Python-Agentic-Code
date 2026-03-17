// SHORT JavaScript - display REAL patient data
document.addEventListener('DOMContentLoaded', function() {
    const data = window.PATIENT_DATA;
    if (!data) { 
        document.body.innerHTML = '<div class="container mt-5"><div class="alert alert-warning text-center">Keine Patientendaten verfügbar</div></div>'; 
        return; 
    }

    // Display patient info
    const patientName = data.patient?.name || 'Unbekannter Patient';
    document.getElementById('patientName').textContent = patientName;

    // Get vital signs data
    const vitalSigns = data.vital_signs?.summary || [];
    const observations = data.observations?.summary || [];
    
    // Combine vital signs and relevant observations
    const allVitals = [...vitalSigns, ...observations.filter(obs => 
        obs.display?.toLowerCase().includes('blood pressure') ||
        obs.display?.toLowerCase().includes('heart rate') ||
        obs.display?.toLowerCase().includes('temperature') ||
        obs.display?.toLowerCase().includes('oxygen') ||
        obs.display?.toLowerCase().includes('weight') ||
        obs.display?.toLowerCase().includes('height')
    )];

    if (allVitals.length === 0) {
        document.getElementById('noDataMessage').style.display = 'block';
        return;
    }

    // Create vital signs cards
    const grid = document.getElementById('vitalSignsGrid');
    
    allVitals.forEach(vital => {
        const card = createVitalCard(vital);
        grid.appendChild(card);
    });
});

function createVitalCard(vital) {
    const col = document.createElement('div');
    col.className = 'col-lg-4 col-md-6 mb-4';
    
    const iconClass = getVitalIcon(vital.display);
    const bgClass = getVitalBgClass(vital.display);
    const statusClass = getStatusClass(vital.value, vital.display);
    
    col.innerHTML = `
        <div class="card vital-card">
            <div class="card-body text-center">
                <div class="vital-icon ${bgClass}">
                    <i class="${iconClass}"></i>
                </div>
                <div class="vital-label">${vital.display || vital.code}</div>
                <div class="vital-value">${vital.value || 'N/A'}</div>
                <div class="vital-unit">${vital.unit || ''}</div>
                <div class="mt-2">
                    <span class="status-badge ${statusClass}">${vital.status || 'Normal'}</span>
                </div>
                <div class="vital-date mt-2">${formatDate(vital.date)}</div>
            </div>
        </div>
    `;
    
    return col;
}

function getVitalIcon(display) {
    const displayLower = (display || '').toLowerCase();
    if (displayLower.includes('heart') || displayLower.includes('pulse')) return 'fas fa-heartbeat';
    if (displayLower.includes('blood pressure')) return 'fas fa-tachometer-alt';
    if (displayLower.includes('temperature')) return 'fas fa-thermometer-half';
    if (displayLower.includes('oxygen')) return 'fas fa-lungs';
    if (displayLower.includes('weight')) return 'fas fa-weight';
    if (displayLower.includes('height')) return 'fas fa-ruler-vertical';
    return 'fas fa-chart-line';
}

function getVitalBgClass(display) {
    const displayLower = (display || '').toLowerCase();
    if (displayLower.includes('heart') || displayLower.includes('pulse')) return 'bg-heart';
    if (displayLower.includes('blood pressure')) return 'bg-pressure';
    if (displayLower.includes('temperature')) return 'bg-temp';
    if (displayLower.includes('oxygen')) return 'bg-oxygen';
    if (displayLower.includes('weight')) return 'bg-weight';
    if (displayLower.includes('height')) return 'bg-height';
    return 'bg-default';
}

function getStatusClass(value, display) {
    if (!value || !display) return 'status-normal';
    
    const displayLower = display.toLowerCase();
    const numValue = parseFloat(value);
    
    if (displayLower.includes('heart rate')) {
        if (numValue > 100) return 'status-high';
        if (numValue < 60) return 'status-low';
    } else if (displayLower.includes('temperature')) {
        if (numValue > 37.5) return 'status-high';
        if (numValue < 36) return 'status-low';
    } else if (displayLower.includes('oxygen')) {
        if (numValue < 95) return 'status-low';
    }
    
    return 'status-normal';
}

function formatDate(dateString) {
    if (!dateString) return 'Kein Datum';
    
    try {
        const date = new Date(dateString);
        return date.toLocaleDateString('de-DE', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    } catch (e) {
        return dateString;
    }
}