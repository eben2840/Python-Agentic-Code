document.addEventListener('DOMContentLoaded', function() {
    if (!window.PATIENT_DATA) {
        showNoData();
        return;
    }

    const data = window.PATIENT_DATA;
    
    // Check if we have all patients data and find Eve Green
    if (data.patient.id !== 'all' || !data.patients) {
        showNoData();
        return;
    }

    // Find Eve Green by name (case insensitive)
    const eveGreen = data.patients.find(patient => 
        patient.name && patient.name.toLowerCase().includes('eve green')
    );

    if (!eveGreen) {
        showNoData();
        return;
    }

    // Render detailed breakdown
    renderPatientDetail(eveGreen);
});

function calculateAge(birthDate) {
    if (!birthDate) return 'Unknown';
    
    const birth = new Date(birthDate);
    const today = new Date();
    const age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    
    const actualAge = monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate()) ? age - 1 : age;
    return actualAge;
}

function formatDate(dateString) {
    if (!dateString) return 'Not specified';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
}

function formatDateTime(dateString) {
    if (!dateString) return 'Not specified';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

function renderPatientDetail(patient) {
    const container = document.getElementById('patientDetailContainer');
    const age = calculateAge(patient.birthDate);
    const genderIcon = patient.gender === 'male' ? 'fa-mars' : 'fa-venus';
    const avatarClass = patient.gender === 'male' ? 'avatar-male' : 'avatar-female';

    container.innerHTML = `
        <!-- Patient Overview -->
        <div class="row">
            <div class="col-12">
                <div class="patient-overview">
                    <div class="patient-header">
                        <div class="patient-avatar ${avatarClass}">
                            <i class="fas ${genderIcon}"></i>
                        </div>
                        <div>
                            <h2 class="patient-name">${patient.name || 'Unknown Patient'}</h2>
                            <div class="patient-id">Patient ID: ${patient.id}</div>
                        </div>
                    </div>
                    
                    <div class="demographics-grid">
                        <div class="demo-item">
                            <div class="demo-label">Age</div>
                            <div class="demo-value">${age} years</div>
                        </div>
                        <div class="demo-item">
                            <div class="demo-label">Gender</div>
                            <div class="demo-value">${patient.gender || 'Not specified'}</div>
                        </div>
                        <div class="demo-item">
                            <div class="demo-label">Date of Birth</div>
                            <div class="demo-value">${formatDate(patient.birthDate)}</div>
                        </div>
                        <div class="demo-item">
                            <div class="demo-label">Patient ID</div>
                            <div class="demo-value" style="font-size: 0.9rem; font-family: 'Courier New', monospace;">${patient.id}</div>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <!-- Medical Conditions -->
        <div class="row">
            <div class="col-12">
                <div class="detail-section">
                    <div class="section-header">
                        <div class="section-icon condition-icon">
                            <i class="fas fa-stethoscope"></i>
                        </div>
                        <div>
                            <h3 class="section-title">Medical Conditions</h3>
                            <p class="section-count">${patient.data.condition ? patient.data.condition.length : 0} condition(s) on record</p>
                        </div>
                    </div>
                    
                    ${renderConditions(patient.data.condition)}
                </div>
            </div>
        </div>

        <!-- Encounters -->
        <div class="row">
            <div class="col-12">
                <div class="detail-section">
                    <div class="section-header">
                        <div class="section-icon encounter-icon">
                            <i class="fas fa-calendar-check"></i>
                        </div>
                        <div>
                            <h3 class="section-title">Healthcare Encounters</h3>
                            <p class="section-count">${patient.data.encounter ? patient.data.encounter.length : 0} encounter(s) recorded</p>
                        </div>
                    </div>
                    
                    ${renderEncounters(patient.data.encounter)}
                </div>
            </div>
        </div>

        <!-- Medications -->
        <div class="row">
            <div class="col-12">
                <div class="detail-section">
                    <div class="section-header">
                        <div class="section-icon medication-icon">
                            <i class="fas fa-pills"></i>
                        </div>
                        <div>
                            <h3 class="section-title">Medication Requests</h3>
                            <p class="section-count">${patient.data.medicationrequest ? patient.data.medicationrequest.length : 0} medication(s) prescribed</p>
                        </div>
                    </div>
                    
                    ${renderMedications(patient.data.medicationrequest)}
                </div>
            </div>
        </div>

        <!-- Observations -->
        <div class="row">
            <div class="col-12">
                <div class="detail-section">
                    <div class="section-header">
                        <div class="section-icon observation-icon">
                            <i class="fas fa-microscope"></i>
                        </div>
                        <div>
                            <h3 class="section-title">Clinical Observations</h3>
                            <p class="section-count">${patient.data.observation ? patient.data.observation.length : 0} observation(s) recorded</p>
                        </div>
                    </div>
                    
                    ${renderObservations(patient.data.observation)}
                </div>
            </div>
        </div>

        <!-- Vital Signs -->
        <div class="row">
            <div class="col-12">
                <div class="detail-section">
                    <div class="section-header">
                        <div class="section-icon vital-icon">
                            <i class="fas fa-heartbeat"></i>
                        </div>
                        <div>
                            <h3 class="section-title">Vital Signs</h3>
                            <p class="section-count">${patient.data.vital_signs ? patient.data.vital_signs.length : 0} vital sign(s) recorded</p>
                        </div>
                    </div>
                    
                    ${renderVitalSigns(patient.data.vital_signs)}
                </div>
            </div>
        </div>
    `;
}

function renderConditions(conditions) {
    if (!conditions || conditions.length === 0) {
        return '<div class="no-records">No medical conditions recorded</div>';
    }

    return conditions.map(condition => `
        <div class="record-item">
            <div class="record-header">
                <h4 class="record-name">${condition.name || 'Unnamed Condition'}</h4>
                <span class="record-date">${formatDate(condition.date)}</span>
            </div>
            <div class="record-details">
                <div class="detail-row">
                    <span class="detail-label">Onset Date:</span>
                    <span class="detail-value">${formatDate(condition.date)}</span>
                </div>
                <div class="detail-row">
                    <span class="detail-label">Status:</span>
                    <span class="detail-value">Active</span>
                </div>
            </div>
        </div>
    `).join('');
}

function renderEncounters(encounters) {
    if (!encounters || encounters.length === 0) {
        return '<div class="no-records">No healthcare encounters recorded</div>';
    }

    return encounters.map(encounter => `
        <div class="record-item">
            <div class="record-header">
                <h4 class="record-name">Healthcare Visit</h4>
                <span class="record-date">${formatDateTime(encounter.date)}</span>
            </div>
            <div class="record-details">
                <div class="detail-row">
                    <span class="detail-label">Encounter Date:</span>
                    <span class="detail-value">${formatDateTime(encounter.date)}</span>
                </div>
                <div class="detail-row">
                    <span class="detail-label">Type:</span>
                    <span class="detail-value">Clinical Visit</span>
                </div>
            </div>
        </div>
    `).join('');
}

function renderMedications(medications) {
    if (!medications || medications.length === 0) {
        return '<div class="no-records">No medications prescribed</div>';
    }

    return medications.map(med => `
        <div class="record-item">
            <div class="record-header">
                <h4 class="record-name">${med.name || 'Unnamed Medication'}</h4>
                <span class="record-date">${formatDate(med.date)}</span>
            </div>
            <div class="record-details">
                <div class="detail-row">
                    <span class="detail-label">Dosage Instructions:</span>
                    <span class="detail-value">${med.dosage || 'Not specified'}</span>
                </div>
                <div class="detail-row">
                    <span class="detail-label">Prescribed Date:</span>
                    <span class="detail-value">${formatDate(med.date)}</span>
                </div>
            </div>
        </div>
    `).join('');
}

function renderObservations(observations) {
    if (!observations || observations.length === 0) {
        return '<div class="no-records">No clinical observations recorded</div>';
    }

    return observations.map(obs => `
        <div class="record-item">
            <div class="record-header">
                <h4 class="record-name">${obs.name || 'Unnamed Observation'}</h4>
                <span class="record-date">${formatDateTime(obs.date)}</span>
            </div>
            <div class="record-details">
                <div class="detail-row">
                    <span class="detail-label">Observation:</span>
                    <span class="detail-value">${obs.value || obs.name || 'Value not recorded'}</span>
                </div>
                <div class="detail-row">
                    <span class="detail-label">Recorded Date:</span>
                    <span class="detail-value">${formatDateTime(obs.date)}</span>
                </div>
            </div>
        </div>
    `).join('');
}

function renderVitalSigns(vitals) {
    if (!vitals || vitals.length === 0) {
        return '<div class="no-records">No vital signs recorded</div>';
    }

    return vitals.map(vital => `
        <div class="record-item">
            <div class="record-header">
                <h4 class="record-name">${vital.name || 'Vital Sign'}</h4>
                <span class="record-date">${formatDateTime(vital.date)}</span>
            </div>
            <div class="record-details">
                <div class="detail-row">
                    <span class="detail-label">Value:</span>
                    <span class="detail-value">${vital.value || vital.name || 'Value not recorded'}</span>
                </div>
                <div class="detail-row">
                    <span class="detail-label">Measured Date:</span>
                    <span class="detail-value">${formatDateTime(vital.date)}</span>
                </div>
            </div>
        </div>
    `).join('');
}

function showNoData() {
    document.getElementById('patientDetailContainer').innerHTML = '';
    document.getElementById('noDataMessage').style.display = 'block';
}