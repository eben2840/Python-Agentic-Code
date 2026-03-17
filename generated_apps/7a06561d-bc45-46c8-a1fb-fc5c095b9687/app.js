document.addEventListener('DOMContentLoaded', function() {
    const data = window.PATIENT_DATA;
    if (!data) { 
        document.body.innerHTML = '<div class="container"><div class="alert alert-warning mt-5">No patient data available</div></div>'; 
        return; 
    }

    // Display patient info
    document.getElementById('patientName').textContent = data.patient.name || 'Unknown Patient';
    document.getElementById('patientInfo').textContent = `Patient ID: ${data.patient.id || 'N/A'} • ${data.patient.gender || 'N/A'} • Born: ${data.patient.birthDate || 'N/A'}`;

    // Calculate dashboard stats
    const encounters = data.encounters?.summary || [];
    const conditions = data.conditions?.summary || [];
    const medications = data.medications?.summary || [];
    const observations = data.observations?.summary || [];

    document.getElementById('totalEncounters').textContent = encounters.length;
    document.getElementById('activeConditions').textContent = conditions.filter(c => c.status === 'active').length;
    document.getElementById('activeMedications').textContent = medications.filter(m => m.status === 'active').length;
    document.getElementById('recentObservations').textContent = observations.length;

    // Create timeline
    createTimeline(encounters, conditions, medications, observations);

    // Display conditions
    displayConditions(conditions);

    // Display medications
    displayMedications(medications);
});

function createTimeline(encounters, conditions, medications, observations) {
    const timelineContent = document.getElementById('timelineContent');
    
    // Combine all events with dates
    const events = [];
    
    encounters.forEach(enc => {
        events.push({
            type: 'encounter',
            date: enc.period?.start || enc.date,
            title: enc.type || 'Medical Encounter',
            description: `Class: ${enc.class || 'Unknown'}`,
            status: enc.status,
            icon: 'fas fa-hospital'
        });
    });

    conditions.forEach(cond => {
        events.push({
            type: 'condition',
            date: cond.onset || cond.recordedDate,
            title: cond.condition || 'Medical Condition',
            description: `Status: ${cond.status || 'Unknown'}`,
            status: cond.status,
            icon: 'fas fa-stethoscope'
        });
    });

    medications.forEach(med => {
        events.push({
            type: 'medication',
            date: med.authoredOn || med.effectiveDateTime,
            title: med.medication || 'Medication',
            description: med.dosage || 'Dosage not specified',
            status: med.status,
            icon: 'fas fa-pills'
        });
    });

    // Sort events by date
    events.sort((a, b) => new Date(b.date) - new Date(a.date));

    if (events.length === 0) {
        timelineContent.innerHTML = '<div class="text-center py-4"><p class="text-muted">No encounter data available</p></div>';
        return;
    }

    let timelineHTML = '';
    events.forEach((event, index) => {
        const formattedDate = event.date ? new Date(event.date).toLocaleDateString() : 'Date unknown';
        
        timelineHTML += `
            <div class="timeline-item">
                <div class="timeline-dot ${event.type}"></div>
                <div class="timeline-content">
                    <div class="d-flex align-items-start justify-content-between mb-2">
                        <div>
                            <h4 class="mb-1">
                                <i class="${event.icon} text-${getTypeColor(event.type)} me-2"></i>
                                ${event.title}
                            </h4>
                            <small class="text-muted">${formattedDate}</small>
                        </div>
                        <span class="encounter-type ${event.type}">${event.type}</span>
                    </div>
                    <p class="mb-1">${event.description}</p>
                    ${event.status ? `<span class="status-badge status-${event.status}">${event.status}</span>` : ''}
                </div>
            </div>
        `;
    });

    timelineContent.innerHTML = timelineHTML;
}

function displayConditions(conditions) {
    const conditionsList = document.getElementById('conditionsList');
    
    if (conditions.length === 0) {
        conditionsList.innerHTML = '<p class="text-muted">No conditions recorded</p>';
        return;
    }

    let conditionsHTML = '';
    conditions.slice(0, 5).forEach(condition => {
        const isActive = condition.status === 'active';
        conditionsHTML += `
            <div class="condition-item ${isActive ? 'active' : ''}">
                <div class="d-flex justify-content-between align-items-start">
                    <div>
                        <h5 class="mb-1">${condition.condition || 'Unknown Condition'}</h5>
                        <small class="text-muted">Onset: ${condition.onset || 'Unknown'}</small>
                    </div>
                    <span class="status-badge status-${condition.status || 'unknown'}">${condition.status || 'Unknown'}</span>
                </div>
                ${condition.severity ? `<p class="mb-0 mt-1"><small>Severity: ${condition.severity}</small></p>` : ''}
            </div>
        `;
    });

    conditionsList.innerHTML = conditionsHTML;
}

function displayMedications(medications) {
    const medicationsList = document.getElementById('medicationsList');
    
    if (medications.length === 0) {
        medicationsList.innerHTML = '<p class="text-muted">No medications recorded</p>';
        return;
    }

    let medicationsHTML = '';
    medications.slice(0, 5).forEach(medication => {
        const isActive = medication.status === 'active';
        medicationsHTML += `
            <div class="medication-item ${isActive ? 'active' : ''}">
                <div class="d-flex justify-content-between align-items-start">
                    <div>
                        <h5 class="mb-1">${medication.medication || 'Unknown Medication'}</h5>
                        <small class="text-muted">Prescribed: ${medication.authoredOn || 'Unknown'}</small>
                    </div>
                    <span class="status-badge status-${medication.status || 'unknown'}">${medication.status || 'Unknown'}</span>
                </div>
                ${medication.dosage ? `<p class="mb-0 mt-1"><small>Dosage: ${medication.dosage}</small></p>` : ''}
            </div>
        `;
    });

    medicationsList.innerHTML = medicationsHTML;
}

function getTypeColor(type) {
    switch(type) {
        case 'encounter': return 'primary';
        case 'condition': return 'success';
        case 'medication': return 'warning';
        case 'observation': return 'info';
        default: return 'secondary';
    }
}