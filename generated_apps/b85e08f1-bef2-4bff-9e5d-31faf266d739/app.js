document.addEventListener('DOMContentLoaded', function() {
    const data = window.PATIENT_DATA;
    if (!data) { 
        document.body.innerHTML = '<div class="container mt-5"><div class="alert alert-warning text-center">No patient data available</div></div>'; 
        return; 
    }

    // Display patient info
    document.getElementById('patientName').textContent = data.patient.name || 'Unknown Patient';
    document.getElementById('patientInfo').textContent = `Patient ID: ${data.patient.id || 'N/A'} • ${data.patient.gender || 'Unknown'} • Born: ${data.patient.birthDate || 'Unknown'}`;

    // Process encounters
    const encounters = data.encounters?.summary || [];
    
    // Calculate statistics
    const stats = {
        total: encounters.length,
        inpatient: encounters.filter(e => e.class?.toLowerCase().includes('inpatient')).length,
        outpatient: encounters.filter(e => e.class?.toLowerCase().includes('outpatient')).length,
        emergency: encounters.filter(e => e.class?.toLowerCase().includes('emergency')).length
    };

    // Update statistics
    document.getElementById('totalEncounters').textContent = stats.total;
    document.getElementById('inpatientCount').textContent = stats.inpatient;
    document.getElementById('outpatientCount').textContent = stats.outpatient;
    document.getElementById('emergencyCount').textContent = stats.emergency;

    // Render encounters timeline
    const timelineContainer = document.getElementById('encountersTimeline');
    
    if (encounters.length === 0) {
        timelineContainer.innerHTML = `
            <div class="text-center py-5">
                <i class="fas fa-calendar-times text-muted" style="font-size: 3rem;"></i>
                <h3 class="mt-3 text-muted">No Encounters Found</h3>
                <p class="text-muted">This patient has no recorded encounters.</p>
            </div>
        `;
        return;
    }

    // Sort encounters by date (newest first)
    const sortedEncounters = encounters.sort((a, b) => new Date(b.period?.start || 0) - new Date(a.period?.start || 0));

    const timelineHTML = sortedEncounters.map(encounter => {
        const encounterClass = encounter.class?.toLowerCase() || 'unknown';
        const status = encounter.status || 'unknown';
        const startDate = encounter.period?.start ? new Date(encounter.period.start).toLocaleDateString() : 'Unknown';
        const endDate = encounter.period?.end ? new Date(encounter.period.end).toLocaleDateString() : 'Ongoing';
        const reasonCode = encounter.reasonCode?.[0]?.display || encounter.reasonReference?.[0]?.display || 'No reason specified';
        
        return `
            <div class="timeline-item">
                <div class="card encounter-card ${encounterClass}">
                    <div class="card-body">
                        <div class="d-flex justify-content-between align-items-start mb-2">
                            <div>
                                <h3 class="mb-1">${encounter.type?.[0]?.display || 'General Encounter'}</h3>
                                <div class="d-flex gap-2 mb-2">
                                    <span class="encounter-type">${encounter.class || 'Unknown Type'}</span>
                                    <span class="status-badge status-${status.toLowerCase().replace(/[^a-z]/g, '-')}">${status}</span>
                                </div>
                            </div>
                            <div class="text-end encounter-meta">
                                <div><i class="fas fa-calendar me-1"></i>${startDate}</div>
                                ${endDate !== 'Ongoing' ? `<div><i class="fas fa-calendar-check me-1"></i>${endDate}</div>` : '<div class="text-warning"><i class="fas fa-clock me-1"></i>Ongoing</div>'}
                            </div>
                        </div>
                        
                        <p class="mb-2"><strong>Reason:</strong> ${reasonCode}</p>
                        
                        ${encounter.serviceProvider?.display ? `<p class="mb-2"><strong>Provider:</strong> ${encounter.serviceProvider.display}</p>` : ''}
                        
                        ${encounter.location?.[0]?.location?.display ? `<p class="mb-0 encounter-meta"><i class="fas fa-map-marker-alt me-1"></i>${encounter.location[0].location.display}</p>` : ''}
                    </div>
                </div>
            </div>
        `;
    }).join('');

    timelineContainer.innerHTML = timelineHTML;
});