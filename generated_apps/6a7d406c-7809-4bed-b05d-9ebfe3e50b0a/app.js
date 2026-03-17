document.addEventListener('DOMContentLoaded', function() {
    // Check if patient data exists
    if (typeof window.PATIENT_DATA === 'undefined' || !window.PATIENT_DATA) {
        console.warn('No patient data available');
        showNoDataState();
        return;
    }

    const data = window.PATIENT_DATA;
    
    // Load patient information
    loadPatientInfo(data);
    
    // Load different sections
    loadVitalSigns(data);
    loadObservations(data);
    loadConditions(data);
    loadLocation(data);
});

function loadPatientInfo(data) {
    const patientInfoElement = document.getElementById('patient-info');
    
    if (data.patient && data.patient.id !== 'all') {
        const name = data.patient.name || 'Unbekannt';
        const gender = data.patient.gender || 'Nicht angegeben';
        const birthDate = data.patient.birthDate || 'Nicht angegeben';
        
        patientInfoElement.innerHTML = `
            <strong>${name}</strong> • Geschlecht: ${gender} • Geboren: ${formatDate(birthDate)}
        `;
    } else {
        patientInfoElement.innerHTML = 'Neugeborenen-Assessment - Allgemeine Ansicht';
    }
}

function loadVitalSigns(data) {
    const container = document.getElementById('vital-signs-content');
    
    if (data.vital_signs && data.vital_signs.summary && data.vital_signs.summary.length > 0) {
        let html = '';
        
        data.vital_signs.summary.forEach(vital => {
            const status = getStatusBadge(vital.status);
            const icon = getVitalSignIcon(vital.name);
            
            html += `
                <div class="data-item">
                    <div class="d-flex align-items-center">
                        <i class="${icon} text-red me-2"></i>
                        <div>
                            <div class="data-label">${vital.name || 'Unbekannt'}</div>
                            <div class="data-date">${formatDate(vital.date)}</div>
                        </div>
                    </div>
                    <div class="text-end">
                        <div class="data-value">${vital.value || 'Kein Wert'}</div>
                        ${status}
                    </div>
                </div>
            `;
        });
        
        container.innerHTML = html;
    } else {
        container.innerHTML = '<div class="no-data"><i class="fas fa-heartbeat"></i><p>Keine Vitalzeichen verfügbar</p></div>';
    }
}

function loadObservations(data) {
    const container = document.getElementById('observations-content');
    
    if (data.observation && data.observation.summary && data.observation.summary.length > 0) {
        let html = '';
        
        data.observation.summary.forEach(obs => {
            const status = getStatusBadge(obs.status);
            const icon = getObservationIcon(obs.name);
            
            html += `
                <div class="data-item">
                    <div class="d-flex align-items-center">
                        <i class="${icon} text-blue me-2"></i>
                        <div>
                            <div class="data-label">${obs.name || 'Unbekannt'}</div>
                            <div class="data-date">${formatDate(obs.date)}</div>
                        </div>
                    </div>
                    <div class="text-end">
                        <div class="data-value">${obs.value || 'Kein Wert'}</div>
                        ${status}
                    </div>
                </div>
            `;
        });
        
        container.innerHTML = html;
    } else {
        container.innerHTML = '<div class="no-data"><i class="fas fa-stethoscope"></i><p>Keine Untersuchungsdaten verfügbar</p></div>';
    }
}

function loadConditions(data) {
    const container = document.getElementById('conditions-content');
    
    if (data.condition && data.condition.summary && data.condition.summary.length > 0) {
        let html = '';
        
        data.condition.summary.forEach(condition => {
            const status = getStatusBadge(condition.status);
            
            html += `
                <div class="data-item">
                    <div class="d-flex align-items-center">
                        <i class="fas fa-notes-medical text-orange me-2"></i>
                        <div>
                            <div class="data-label">${condition.name || 'Unbekannt'}</div>
                            <div class="data-date">${formatDate(condition.date)}</div>
                        </div>
                    </div>
                    <div class="text-end">
                        ${status}
                    </div>
                </div>
            `;
        });
        
        container.innerHTML = html;
    } else {
        container.innerHTML = '<div class="no-data"><i class="fas fa-notes-medical"></i><p>Keine Diagnosen verfügbar</p></div>';
    }
}

function loadLocation(data) {
    const container = document.getElementById('location-content');
    
    if (data.locations && data.locations.summary && data.locations.summary.length > 0) {
        let html = '';
        
        data.locations.summary.forEach(location => {
            const status = getStatusBadge(location.status);
            
            html += `
                <div class="data-item">
                    <div class="d-flex align-items-center">
                        <i class="fas fa-bed text-purple me-2"></i>
                        <div>
                            <div class="data-label">${location.name || 'Unbekannt'}</div>
                            <div class="data-value">${location.value || 'Keine Station'}</div>
                        </div>
                    </div>
                    <div class="text-end">
                        ${status}
                    </div>
                </div>
            `;
        });
        
        container.innerHTML = html;
    } else {
        container.innerHTML = '<div class="no-data"><i class="fas fa-bed"></i><p>Keine Standortdaten verfügbar</p></div>';
    }
}

function getVitalSignIcon(name) {
    if (!name) return 'fas fa-heartbeat';
    
    const lowerName = name.toLowerCase();
    if (lowerName.includes('heart') || lowerName.includes('herz') || lowerName.includes('puls')) {
        return 'fas fa-heartbeat';
    } else if (lowerName.includes('blood') || lowerName.includes('blut') || lowerName.includes('pressure')) {
        return 'fas fa-tint';
    } else if (lowerName.includes('temperature') || lowerName.includes('temperatur')) {
        return 'fas fa-thermometer-half';
    } else if (lowerName.includes('oxygen') || lowerName.includes('sauerstoff')) {
        return 'fas fa-lungs';
    } else if (lowerName.includes('weight') || lowerName.includes('gewicht')) {
        return 'fas fa-weight';
    }
    return 'fas fa-heartbeat';
}

function getObservationIcon(name) {
    if (!name) return 'fas fa-eye';
    
    const lowerName = name.toLowerCase();
    if (lowerName.includes('skin') || lowerName.includes('haut')) {
        return 'fas fa-hand-paper';
    } else if (lowerName.includes('reflex') || lowerName.includes('reflex')) {
        return 'fas fa-brain';
    } else if (lowerName.includes('length') || lowerName.includes('länge') || lowerName.includes('size')) {
        return 'fas fa-ruler';
    }
    return 'fas fa-eye';
}

function getStatusBadge(status) {
    if (!status) return '<span class="badge badge-secondary">Unbekannt</span>';
    
    const lowerStatus = status.toLowerCase();
    if (lowerStatus.includes('active') || lowerStatus.includes('aktiv')) {
        return '<span class="badge badge-success">Aktiv</span>';
    } else if (lowerStatus.includes('final') || lowerStatus.includes('abgeschlossen')) {
        return '<span class="badge badge-info">Abgeschlossen</span>';
    } else if (lowerStatus.includes('preliminary') || lowerStatus.includes('vorläufig')) {
        return '<span class="badge badge-warning">Vorläufig</span>';
    } else if (lowerStatus.includes('cancelled') || lowerStatus.includes('abgebrochen')) {
        return '<span class="badge badge-danger">Abgebrochen</span>';
    }
    return `<span class="badge badge-secondary">${status}</span>`;
}

function formatDate(dateString) {
    if (!dateString) return 'Kein Datum';
    
    try {
        const date = new Date(dateString);
        return date.toLocaleDateString('de-DE', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit'
        });
    } catch (error) {
        return dateString;
    }
}

function showNoDataState() {
    const containers = [
        'patient-info',
        'vital-signs-content',
        'observations-content',
        'conditions-content',
        'location-content'
    ];
    
    document.getElementById('patient-info').innerHTML = 'Keine Patientendaten verfügbar';
    
    containers.slice(1).forEach(containerId => {
        const container = document.getElementById(containerId);
        if (container) {
            container.innerHTML = '<div class="no-data"><i class="fas fa-exclamation-circle"></i><p>Keine Daten verfügbar</p></div>';
        }
    });
}