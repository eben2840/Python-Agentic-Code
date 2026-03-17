document.addEventListener('DOMContentLoaded', function() {
    const data = window.PATIENT_DATA;
    if (!data) { 
        document.body.innerHTML = '<div class="container mt-5"><div class="alert alert-warning text-center">No patient data available</div></div>'; 
        return; 
    }

    // Display patient info
    document.getElementById('patientName').textContent = data.patient.name || 'Unknown Patient';
    document.getElementById('patientInfo').textContent = `Patient ID: ${data.patient.id || 'N/A'} | Gender: ${data.patient.gender || 'N/A'} | DOB: ${data.patient.birthDate || 'N/A'}`;

    // Process encounters data
    const encounters = data.encounters?.summary || [];
    
    // Calculate statistics
    const totalEncounters = encounters.length;
    const finishedEncounters = encounters.filter(enc => enc.status === 'finished').length;
    const inProgressEncounters = encounters.filter(enc => enc.status === 'in-progress').length;
    
    // Find last encounter date
    let lastEncounterDate = '-';
    if (encounters.length > 0) {
        const sortedEncounters = encounters.sort((a, b) => new Date(b.period?.start || b.date) - new Date(a.period?.start || a.date));
        const lastEnc = sortedEncounters[0];
        if (lastEnc.period?.start || lastEnc.date) {
            const date = new Date(lastEnc.period?.start || lastEnc.date);
            lastEncounterDate = date.toLocaleDateString();
        }
    }

    // Update statistics
    document.getElementById('totalEncounters').textContent = totalEncounters;
    document.getElementById('finishedEncounters').textContent = finishedEncounters;
    document.getElementById('inProgressEncounters').textContent = inProgressEncounters;
    document.getElementById('lastEncounter').textContent = lastEncounterDate;

    // Display encounters list
    const encountersList = document.getElementById('encountersList');
    
    if (encounters.length === 0) {
        encountersList.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-calendar-times"></i>
                <h3>No Encounters Found</h3>
                <p>No encounter records are available for this patient.</p>
            </div>
        `;
        return;
    }

    // Sort encounters by date (most recent first)
    const sortedEncounters = encounters.sort((a, b) => {
        const dateA = new Date(a.period?.start || a.date || '1900-01-01');
        const dateB = new Date(b.period?.start || b.date || '1900-01-01');
        return dateB - dateA;
    });

    encountersList.innerHTML = sortedEncounters.map(encounter => {
        const startDate = encounter.period?.start || encounter.date;
        const endDate = encounter.period?.end;
        const status = encounter.status || 'unknown';
        const type = encounter.type || encounter.class || 'Unknown Type';
        const reasonCode = encounter.reasonCode || encounter.reason;
        const serviceProvider = encounter.serviceProvider || encounter.location;

        let statusClass = 'status-badge ';
        switch(status.toLowerCase()) {
            case 'finished': statusClass += 'status-finished'; break;
            case 'in-progress': statusClass += 'status-in-progress'; break;
            case 'planned': statusClass += 'status-planned'; break;
            case 'cancelled': statusClass += 'status-cancelled'; break;
            default: statusClass += 'status-planned';
        }

        return `
            <div class="encounter-item">
                <div class="encounter-header">
                    <div>
                        <div class="encounter-type">${type}</div>
                        <div class="encounter-date">
                            ${startDate ? new Date(startDate).toLocaleDateString() : 'Date not available'}
                            ${endDate ? ` - ${new Date(endDate).toLocaleDateString()}` : ''}
                        </div>
                    </div>
                    <span class="${statusClass}">${status}</span>
                </div>
                
                <div class="encounter-details">
                    ${reasonCode ? `
                        <div class="encounter-detail">
                            <i class="fas fa-stethoscope text-primary"></i>
                            <span>Reason: ${reasonCode}</span>
                        </div>
                    ` : ''}
                    
                    ${serviceProvider ? `
                        <div class="encounter-detail">
                            <i class="fas fa-hospital text-info"></i>
                            <span>Provider: ${serviceProvider}</span>
                        </div>
                    ` : ''}
                    
                    ${encounter.id ? `
                        <div class="encounter-detail">
                            <i class="fas fa-hashtag text-muted"></i>
                            <span>ID: ${encounter.id}</span>
                        </div>
                    ` : ''}
                </div>
            </div>
        `;
    }).join('');
});