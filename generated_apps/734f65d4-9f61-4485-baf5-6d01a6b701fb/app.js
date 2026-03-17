function calculateAge(birthDate) {
    if (!birthDate) return null;
    const birth = new Date(birthDate);
    const today = new Date();
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
        age--;
    }
    return age;
}

function formatDate(dateString) {
    if (!dateString) return 'No date';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
}

function formatDateTime(dateString) {
    if (!dateString) return 'No date';
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

function findPatient(searchTerm) {
    if (!window.PATIENT_DATA || !window.PATIENT_DATA.patients) {
        return null;
    }
    
    const searchLower = searchTerm.toLowerCase().trim();
    return window.PATIENT_DATA.patients.find(patient => 
        patient.name && patient.name.toLowerCase().includes(searchLower)
    );
}

function renderPatientProfile(patient) {
    const age = calculateAge(patient.birthDate);
    const profileHtml = `
        <div class="col-md-4 mb-3">
            <div class="patient-profile-card">
                <div class="profile-avatar">
                    <i class="fas fa-user"></i>
                </div>
                <div class="profile-info">
                    <h3>${patient.name || 'Unknown Name'}</h3>
                    <p class="mb-0">Patient ID: ${patient.id || 'N/A'}</p>
                </div>
            </div>
        </div>
        <div class="col-md-8">
            <div class="row">
                <div class="col-md-4 mb-3">
                    <div class="profile-detail">
                        <div class="profile-detail-label">Age</div>
                        <div class="profile-detail-value">${age || 'Unknown'} years old</div>
                    </div>
                </div>
                <div class="col-md-4 mb-3">
                    <div class="profile-detail">
                        <div class="profile-detail-label">Gender</div>
                        <div class="profile-detail-value">
                            <i class="fas fa-${patient.gender === 'male' ? 'mars' : patient.gender === 'female' ? 'venus' : 'question'} me-2"></i>
                            ${patient.gender ? patient.gender.charAt(0).toUpperCase() + patient.gender.slice(1) : 'Unknown'}
                        </div>
                    </div>
                </div>
                <div class="col-md-4 mb-3">
                    <div class="profile-detail">
                        <div class="profile-detail-label">Birth Date</div>
                        <div class="profile-detail-value">${formatDate(patient.birthDate)}</div>
                    </div>
                </div>
                <div class="col-md-6 mb-3">
                    <div class="profile-detail">
                        <div class="profile-detail-label">Race</div>
                        <div class="profile-detail-value">${patient.race || 'Not specified'}</div>
                    </div>
                </div>
                <div class="col-md-6 mb-3">
                    <div class="profile-detail">
                        <div class="profile-detail-label">Ethnicity</div>
                        <div class="profile-detail-value">${patient.ethnicity || 'Not specified'}</div>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    document.getElementById('patientBasicInfo').innerHTML = profileHtml;
}

function renderConditions(conditions) {
    if (!conditions || conditions.length === 0) {
        document.getElementById('conditionsList').innerHTML = 
            '<p class="text-muted">No medical conditions recorded.</p>';
        return;
    }

    const conditionsHtml = conditions.map(condition => `
        <div class="detail-item">
            <div class="detail-item-header">
                <div class="detail-item-title">
                    <i class="fas fa-circle-dot text-danger me-2"></i>
                    ${condition.name || 'Unknown Condition'}
                </div>
                <div class="detail-item-date">${formatDate(condition.date)}</div>
            </div>
            <div class="detail-item-content">
                <div class="row">
                    <div class="col-md-6">
                        <strong>Status:</strong> 
                        <span class="status-badge status-active">${condition.status || 'Active'}</span>
                    </div>
                    <div class="col-md-6">
                        <strong>Code:</strong> ${condition.code || 'N/A'}
                    </div>
                </div>
                ${condition.description ? `<div class="mt-2"><strong>Description:</strong> ${condition.description}</div>` : ''}
            </div>
        </div>
    `).join('');

    document.getElementById('conditionsList').innerHTML = conditionsHtml;
}

function renderVitals(vitals) {
    if (!vitals || vitals.length === 0) {
        document.getElementById('vitalsList').innerHTML = 
            '<p class="text-muted">No vital signs recorded.</p>';
        return;
    }

    const getVitalIcon = (name) => {
        const nameLower = (name || '').toLowerCase();
        if (nameLower.includes('blood pressure') || nameLower.includes('bp')) return 'vital-bp';
        if (nameLower.includes('heart rate') || nameLower.includes('pulse')) return 'vital-hr';
        if (nameLower.includes('temperature')) return 'vital-temp';
        if (nameLower.includes('weight')) return 'vital-weight';
        if (nameLower.includes('height')) return 'vital-height';
        return 'vital-bp';
    };

    const getVitalIconName = (name) => {
        const nameLower = (name || '').toLowerCase();
        if (nameLower.includes('blood pressure') || nameLower.includes('bp')) return 'heart';
        if (nameLower.includes('heart rate') || nameLower.includes('pulse')) return 'heartbeat';
        if (nameLower.includes('temperature')) return 'thermometer-half';
        if (nameLower.includes('weight')) return 'weight';
        if (nameLower.includes('height')) return 'ruler-vertical';
        return 'heartbeat';
    };

    const vitalsHtml = vitals.map(vital => `
        <div class="vital-reading">
            <div class="vital-icon ${getVitalIcon(vital.name)}">
                <i class="fas fa-${getVitalIconName(vital.name)}"></i>
            </div>
            <div class="vital-info">
                <div class="vital-name">${vital.name || 'Unknown Vital'}</div>
                <div class="vital-value">${vital.value || 'N/A'} ${vital.unit || ''}</div>
                <div class="vital-date">${formatDateTime(vital.date)}</div>
            </div>
        </div>
    `).join('');

    document.getElementById('vitalsList').innerHTML = vitalsHtml;
}

function renderMedications(medications) {
    if (!medications || medications.length === 0) {
        document.getElementById('medicationsList').innerHTML = 
            '<p class="text-muted">No medications recorded.</p>';
        return;
    }

    const medicationsHtml = medications.map(med => `
        <div class="medication-item">
            <div class="medication-header">
                <div class="medication-name">
                    <i class="fas fa-pills text-warning me-2"></i>
                    ${med.name || 'Unknown Medication'}
                </div>
                <div class="medication-dosage">${med.dosage || 'Dosage not specified'}</div>
            </div>
            <div class="medication-details">
                <div class="medication-detail">
                    <span class="medication-detail-label">Status:</span>
                    <span class="medication-detail-value">${med.status || 'Active'}</span>
                </div>
                <div class="medication-detail">
                    <span class="medication-detail-label">Start Date:</span>
                    <span class="medication-detail-value">${formatDate(med.date)}</span>
                </div>
                <div class="medication-detail">
                    <span class="medication-detail-label">Frequency:</span>
                    <span class="medication-detail-value">${med.frequency || 'Not specified'}</span>
                </div>
                <div class="medication-detail">
                    <span class="medication-detail-label">Code:</span>
                    <span class="medication-detail-value">${med.code || 'N/A'}</span>
                </div>
            </div>
            ${med.instructions ? `<div class="mt-2"><strong>Instructions:</strong> ${med.instructions}</div>` : ''}
        </div>
    `).join('');

    document.getElementById('medicationsList').innerHTML = medicationsHtml;
}

function renderProcedures(procedures) {
    if (!procedures || procedures.length === 0) {
        document.getElementById('proceduresList').innerHTML = 
            '<p class="text-muted">No procedures recorded.</p>';
        return;
    }

    const proceduresHtml = procedures.map(procedure => `
        <div class="detail-item">
            <div class="detail-item-header">
                <div class="detail-item-title">
                    <i class="fas fa-medical text-secondary me-2"></i>
                    ${procedure.name || 'Unknown Procedure'}
                </div>
                <div class="detail-item-date">${formatDate(procedure.date)}</div>
            </div>
            <div class="detail-item-content">
                <div class="row">
                    <div class="col-md-6">
                        <strong>Status:</strong> 
                        <span class="status-badge status-completed">${procedure.status || 'Completed'}</span>
                    </div>
                    <div class="col-md-6">
                        <strong>Code:</strong> ${procedure.code || 'N/A'}
                    </div>
                </div>
                ${procedure.description ? `<div class="mt-2"><strong>Description:</strong> ${procedure.description}</div>` : ''}
                ${procedure.location ? `<div class="mt-1"><strong>Location:</strong> ${procedure.location}</div>` : ''}
            </div>
        </div>
    `).join('');

    document.getElementById('proceduresList').innerHTML = proceduresHtml;
}

function renderObservations(observations) {
    if (!observations || observations.length === 0) {
        document.getElementById('observationsList').innerHTML = 
            '<p class="text-muted">No observations or lab results recorded.</p>';
        return;
    }

    const observationsHtml = observations.map(obs => `
        <div class="detail-item">
            <div class="detail-item-header">
                <div class="detail-item-title">
                    <i class="fas fa-microscope text-primary me-2"></i>
                    ${obs.name || 'Unknown Observation'}
                </div>
                <div class="detail-item-date">${formatDateTime(obs.date)}</div>
            </div>
            <div class="detail-item-content">
                <div class="row">
                    <div class="col-md-4">
                        <strong>Value:</strong> ${obs.value || 'N/A'} ${obs.unit || ''}
                    </div>
                    <div class="col-md-4">
                        <strong>Status:</strong> ${obs.status || 'Final'}
                    </div>
                    <div class="col-md-4">
                        <strong>Category:</strong> ${obs.category || 'General'}
                    </div>
                </div>
                ${obs.interpretation ? `<div class="mt-2"><strong>Interpretation:</strong> ${obs.interpretation}</div>` : ''}
                ${obs.referenceRange ? `<div class="mt-1"><strong>Reference Range:</strong> ${obs.referenceRange}</div>` : ''}
            </div>
        </div>
    `).join('');

    document.getElementById('observationsList').innerHTML = observationsHtml;
}

function renderEncounters(encounters) {
    if (!encounters || encounters.length === 0) {
        document.getElementById('encountersList').innerHTML = 
            '<p class="text-muted">No medical encounters recorded.</p>';
        return;
    }

    const encountersHtml = encounters.map(encounter => `
        <div class="timeline-item">
            <div class="timeline-marker"></div>
            <div class="detail-item">
                <div class="detail-item-header">
                    <div class="detail-item-title">
                        <i class="fas fa-hospital text-info me-2"></i>
                        ${encounter.name || encounter.type || 'Medical Visit'}
                    </div>
                    <div class="detail-item-date">${formatDateTime(encounter.date)}</div>
                </div>
                <div class="detail-item-content">
                    <div class="row">
                        <div class="col-md-4">
                            <strong>Type:</strong> ${encounter.type || 'Outpatient'}
                        </div>
                        <div class="col-md-4">
                            <strong>Status:</strong> 
                            <span class="status-badge status-completed">${encounter.status || 'Completed'}</span>
                        </div>
                        <div class="col-md-4">
                            <strong>Duration:</strong> ${encounter.duration || 'N/A'}
                        </div>
                    </div>
                    ${encounter.location ? `<div class="mt-2"><strong>Location:</strong> ${encounter.location}</div>` : ''}
                    ${encounter.provider ? `<div class="mt-1"><strong>Provider:</strong> ${encounter.provider}</div>` : ''}
                    ${encounter.reasonForVisit ? `<div class="mt-1"><strong>Reason:</strong> ${encounter.reasonForVisit}</div>` : ''}
                </div>
            </div>
        </div>
    `).join('');

    document.getElementById('encountersList').innerHTML = encountersHtml;
}

function showPatientDetails