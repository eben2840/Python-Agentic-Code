// Initialize the app when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    initializeLagerungsplan();
});

function initializeLagerungsplan() {
    loadPatientInfo();
    updateCurrentTime();
    generatePositioningSchedule();
    loadDocumentationLog();
    
    // Update time every minute
    setInterval(updateCurrentTime, 60000);
    
    // Add event listener for documentation button
    document.getElementById('add-documentation').addEventListener('click', addDocumentationEntry);
}

function loadPatientInfo() {
    const patientInfoElement = document.getElementById('patient-info');
    
    if (window.PATIENT_DATA && window.PATIENT_DATA.patient) {
        const patient = window.PATIENT_DATA.patient;
        
        if (patient.id === 'all') {
            patientInfoElement.textContent = 'Alle Patienten - Lagerungsplan Übersicht';
        } else {
            const name = patient.name || 'Unbekannt';
            const gender = patient.gender || 'Nicht angegeben';
            const birthDate = patient.birthDate || 'Nicht angegeben';
            
            patientInfoElement.textContent = `Patient: ${name} | Geschlecht: ${gender} | Geburtsdatum: ${birthDate}`;
        }
    } else {
        patientInfoElement.textContent = 'Keine Patientendaten verfügbar';
    }
}

function updateCurrentTime() {
    const now = new Date();
    const timeString = now.toLocaleTimeString('de-DE', { 
        hour: '2-digit', 
        minute: '2-digit' 
    });
    
    document.getElementById('current-time').textContent = timeString;
    
    // Calculate next change time (example: every 2 hours)
    const nextChange = new Date(now.getTime() + (2 * 60 * 60 * 1000));
    const timeDiff = nextChange - now;
    const hoursLeft = Math.floor(timeDiff / (1000 * 60 * 60));
    const minutesLeft = Math.floor((timeDiff % (1000 * 60 * 60)) / (1000 * 60));
    
    document.getElementById('next-change').textContent = `${hoursLeft}h ${minutesLeft}m`;
}

function generatePositioningSchedule() {
    const scheduleContainer = document.getElementById('positioning-schedule');
    const now = new Date();
    
    const positions = [
        { name: 'Rückenlage', icon: 'fas fa-user', class: 'back' },
        { name: 'Linksseitenlage', icon: 'fas fa-user', class: 'left' },
        { name: 'Rückenlage', icon: 'fas fa-user', class: 'back' },
        { name: 'Rechtsseitenlage', icon: 'fas fa-user', class: 'right' },
        { name: 'Rückenlage', icon: 'fas fa-user', class: 'back' },
        { name: 'Linksseitenlage', icon: 'fas fa-user', class: 'left' }
    ];
    
    let scheduleHTML = '';
    
    for (let i = 0; i < 12; i++) {
        const scheduleTime = new Date(now);
        scheduleTime.setHours(now.getHours() + (i * 2), 0, 0, 0);
        
        const position = positions[i % positions.length];
        const timeString = scheduleTime.toLocaleTimeString('de-DE', { 
            hour: '2-digit', 
            minute: '2-digit' 
        });
        
        const isPast = scheduleTime < now;
        const isCurrent = Math.abs(scheduleTime - now) < (2 * 60 * 60 * 1000) && scheduleTime <= now;
        
        let statusClass = '';
        let statusIcon = '';
        let statusText = '';
        
        if (isPast) {
            statusClass = 'completed';
            statusIcon = 'fas fa-check-circle text-success';
            statusText = 'Durchgeführt';
        } else if (isCurrent) {
            statusClass = 'current';
            statusIcon = 'fas fa-clock text-warning';
            statusText = 'Aktuell';
        } else {
            statusIcon = 'fas fa-clock text-muted';
            statusText = 'Geplant';
        }
        
        scheduleHTML += `
            <div class="schedule-item ${statusClass}">
                <div class="d-flex align-items-center justify-content-between">
                    <div class="d-flex align-items-center">
                        <div class="position-icon ${position.class} me-3">
                            <i class="${position.icon}"></i>
                        </div>
                        <div>
                            <h6 class="mb-1">${position.name}</h6>
                            <small class="text-muted">${timeString} Uhr</small>
                        </div>
                    </div>
                    <div class="text-end">
                        <i class="${statusIcon} me-1"></i>
                        <small>${statusText}</small>
                    </div>
                </div>
            </div>
        `;
    }
    
    scheduleContainer.innerHTML = scheduleHTML;
}

function loadDocumentationLog() {
    const documentationContainer = document.getElementById('documentation-log');
    
    // Sample documentation entries (in real app, this would come from patient data)
    const entries = [
        {
            time: '14:30',
            date: 'Heute',
            position: 'Linksseitenlage',
            notes: 'Haut intakt, keine Rötungen',
            staff: 'Pflegekraft'
        },
        {
            time: '12:30',
            date: 'Heute',
            position: 'Rückenlage',
            notes: 'Druckentlastung Fersen durchgeführt',
            staff: 'Pflegekraft'
        },
        {
            time: '10:30',
            date: 'Heute',
            position: 'Rechtsseitenlage',
            notes: 'Patient kooperativ, keine Beschwerden',
            staff: 'Pflegekraft'
        }
    ];
    
    let documentationHTML = '';
    
    if (entries.length === 0) {
        documentationHTML = '<p class="text-muted">Keine Dokumentationseinträge verfügbar</p>';
    } else {
        entries.forEach(entry => {
            documentationHTML += `
                <div class="documentation-entry">
                    <div class="d-flex justify-content-between align-items-start">
                        <div>
                            <h6 class="mb-1">${entry.position}</h6>
                            <p class="mb-1">${entry.notes}</p>
                            <small class="text-muted">Durchgeführt von: ${entry.staff}</small>
                        </div>
                        <div class="text-end">
                            <div class="timestamp">${entry.date}</div>
                            <div class="timestamp">${entry.time}</div>
                        </div>
                    </div>
                </div>
            `;
        });
    }
    
    documentationContainer.innerHTML = documentationHTML;
}

function addDocumentationEntry() {
    // In a real application, this would open a modal or form
    // For now, we'll just show an alert
    alert('Dokumentationsformular würde hier geöffnet werden.\n\nFelder:\n- Lagerungsposition\n- Hautzustand\n- Besonderheiten\n- Durchführende Person');
    
    // Refresh the documentation log
    setTimeout(() => {
        loadDocumentationLog();
    }, 100);
}

// Helper function to check if patient data is available
function hasPatientData() {
    return window.PATIENT_DATA && window.PATIENT_DATA.patient;
}

// Helper function to get patient-specific positioning requirements
function getPatientPositioningRequirements() {
    if (!hasPatientData()) {
        return null;
    }
    
    // In a real application, this would analyze patient conditions
    // and return specific positioning requirements
    const conditions = window.PATIENT_DATA.condition?.summary || [];
    
    // Example logic for positioning based on conditions
    const requirements = {
        interval: 2, // hours
        specialNotes: [],
        riskLevel: 'medium'
    };
    
    conditions.forEach(condition => {
        if (condition.name && condition.name.toLowerCase().includes('diabetes')) {
            requirements.riskLevel = 'high';
            requirements.interval = 2;
            requirements.specialNotes.push('Erhöhtes Dekubitus-Risiko durch Diabetes');
        }
        
        if (condition.name && condition.name.toLowerCase().includes('immobil')) {
            requirements.riskLevel = 'high';
            requirements.interval = 1.5;
            requirements.specialNotes.push('Vollständige Immobilität - häufigere Umlagerung');
        }
    });
    
    return requirements;
}