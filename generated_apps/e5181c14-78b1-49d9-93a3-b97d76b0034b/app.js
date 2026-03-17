document.addEventListener('DOMContentLoaded', function() {
    if (!window.PATIENT_DATA) {
        console.error('Patient data not available');
        showPatientNotFound();
        return;
    }

    const data = window.PATIENT_DATA;
    let johnSmithPatient = null;

    // Find John Smith in the data
    if (data.patient.id === 'all' && data.patients) {
        johnSmithPatient = data.patients.find(patient => 
            patient.name && patient.name.toLowerCase().includes('john smith')
        );
    } else if (data.patient.name && data.patient.name.toLowerCase().includes('john smith')) {
        johnSmithPatient = data.patient;
    }

    if (!johnSmithPatient) {
        showPatientNotFound();
        return;
    }

    // Update statistics
    updateStatistics(johnSmithPatient);
    
    // Render patient details
    renderPatientDetails(johnSmithPatient);
    
    document.getElementById('patientDetails').style.display = 'block';
});

function updateStatistics(patient) {
    const encounters = patient.data?.encounter || [];
    const conditions = patient.data?.condition || [];
    const observations = (patient.data?.observation || []).concat(patient.data?.vital_signs || []);
    const medications = patient.data?.medicationrequest || [];
    
    document.getElementById('totalEncounters').textContent = encounters.length;
    document.getElementById('totalConditions').textContent = conditions.length;
    document.getElementById('totalObservations').textContent = observations.length;
    document.getElementById('totalMedications').textContent = medications.length;
}

function renderPatientDetails(patient) {
    renderBasicInfo(patient);
    renderEncounters(patient.data?.encounter);
    renderConditions(patient.data?.condition);
    renderObservations(patient.data?.observation, patient.data?.vital_signs);
    renderMedications(patient.data?.medicationrequest);
    renderProcedures(patient.data?.procedure);
    renderImmunizations(patient.data?.immunization);
    renderAllergies(patient.data?.allergyintolerance);
}

function renderBasicInfo(patient) {
    const container = document.getElementById('basicInfo');
    const age = calculateAge(patient.birthDate);
    const genderClass = patient.gender?.toLowerCase() === 'female' ? 'female' : 'male';
    const initials = getInitials(patient.name);
    
    container.innerHTML = `
        <div class="d-flex align-items-center mb-4">
            <div class="patient-avatar ${genderClass}">
                ${initials}
            </div>
            <div>
                <h3 class="mb-1">${patient.name || 'Unknown Patient'}</h3>
                <p class="text-muted mb-0">Patient ID: ${patient.id || 'N/A'}</p>
            </div>
        </div>
        
        <div class="basic-info-grid">
            <div class="info-item">
                <div class="info-label">Date of Birth</div>
                <div class="info-value">${formatDate(patient.birthDate) || 'Unknown'}</div>
            </div>
            <div class="info-item">
                <div class="info-label">Age</div>
                <div class="info-value">${age}</div>
            </div>
            <div class="info-item">
                <div class="info-label">Gender</div>
                <div class="info-value">${patient.gender || 'Unknown'}</div>
            </div>
            <div class="info-item">
                <div class="info-label">Address</div>
                <div class="info-value">${formatAddress(patient.address) || 'Not available'}</div>
            </div>
            <div class="info-item">
                <div class="info-label">Phone</div>
                <div class="info-value">${patient.telecom?.phone || 'Not available'}</div>
            </div>
            <div class="info-item">
                <div class="info-label">Email</div>
                <div class="info-value">${patient.telecom?.email || 'Not available'}</div>
            </div>
        </div>
    `;
}

function renderEncounters(encounters) {
    const container = document.getElementById('encountersSection');
    
    if (!encounters || encounters.length === 0) {
        container.innerHTML = '<div class="no-data">No encounters recorded</div>';
        return;
    }
    
    // Sort encounters by date (most recent first)
    const sortedEncounters = encounters.sort((a, b) => new Date(b.date) - new Date(a.date));
    
    container.innerHTML = sortedEncounters.map(encounter => `
        <div class="encounter-item">
            <div class="encounter-header">
                <div>
                    <div class="encounter-type">${encounter.type || encounter.name || 'Unknown Encounter'}</div>
                    <div class="encounter-date">${formatDate(encounter.date) || 'Unknown date'}</div>
                </div>
                <span class="encounter-status ${(encounter.status || 'finished').toLowerCase().replace(/[^a-z]/g, '')}">${encounter.status || 'Finished'}</span>
            </div>
            
            ${encounter.description ? `<p class="mb-2"><strong>Description:</strong> ${encounter.description}</p>` : ''}
            
            <div class="encounter-details">
                ${encounter.location ? `
                    <div class="detail-item">
                        <div class="detail-label">Location</div>
                        <div class="detail-value">${encounter.location}</div>
                    </div>
                ` : ''}
                ${encounter.practitioner ? `
                    <div class="detail-item">
                        <div class="detail-label">Practitioner</div>
                        <div class="detail-value">${encounter.practitioner}</div>
                    </div>
                ` : ''}
                ${encounter.reasonCode ? `
                    <div class="detail-item">
                        <div class="detail-label">Reason</div>
                        <div class="detail-value">${encounter.reasonCode}</div>
                    </div>
                ` : ''}
                ${encounter.duration ? `
                    <div class="detail-item">
                        <div class="detail-label">Duration</div>
                        <div class="detail-value">${encounter.duration}</div>
                    </div>
                ` : ''}
                ${encounter.serviceType ? `
                    <div class="detail-item">
                        <div class="detail-label">Service Type</div>
                        <div class="detail-value">${encounter.serviceType}</div>
                    </div>
                ` : ''}
            </div>
        </div>
    `).join('');
}

function renderConditions(conditions) {
    const container = document.getElementById('conditionsSection');
    
    if (!conditions || conditions.length === 0) {
        container.innerHTML = '<div class="no-data">No conditions recorded</div>';
        return;
    }
    
    container.innerHTML = conditions.map(condition => `
        <div class="condition-item">
            <div class="item-name">${condition.name || 'Unknown Condition'}</div>
            <div class="item-details">
                ${condition.date ? `<div class="item-detail"><strong>Onset Date:</strong> ${formatDate(condition.date)}</div>` : ''}
                ${condition.status ? `<div class="item-detail"><strong>Status:</strong> ${condition.status}</div>` : ''}
                ${condition.severity ? `<div class="item-detail"><strong>Severity:</strong> ${condition.severity}</div>` : ''}
                ${condition.category ? `<div class="item-detail"><strong>Category:</strong> ${condition.category}</div>` : ''}
                ${condition.code ? `<div class="item-detail"><strong>Code:</strong> ${condition.code}</div>` : ''}
                ${condition.clinicalStatus ? `<div class="item-detail"><strong>Clinical Status:</strong> ${condition.clinicalStatus}</div>` : ''}
                ${condition.verificationStatus ? `<div class="item-detail"><strong>Verification:</strong> ${condition.verificationStatus}</div>` : ''}
                ${condition.bodySite ? `<div class="item-detail"><strong>Body Site:</strong> ${condition.bodySite}</div>` : ''}
            </div>
        </div>
    `).join('');
}

function renderObservations(observations, vitalSigns) {
    const container = document.getElementById('observationsSection');
    const allObservations = [...(observations || []), ...(vitalSigns || [])];
    
    if (allObservations.length === 0) {
        container.innerHTML = '<div class="no-data">No observations recorded</div>';
        return;
    }
    
    // Sort by date (most recent first)
    const sortedObservations = allObservations.sort((a, b) => new Date(b.date) - new Date(a.date));
    
    container.innerHTML = sortedObservations.map(obs => `
        <div class="observation-item">
            <div class="item-name">${obs.name || 'Unknown Observation'}</div>
            <div class="item-details">
                ${obs.value ? `<div class="item-detail"><strong>Value:</strong> ${obs.value}</div>` : ''}
                ${obs.unit ? `<div class="item-detail"><strong>Unit:</strong> ${obs.unit}</div>` : ''}
                ${obs.date ? `<div class="item-detail"><strong>Date:</strong> ${formatDate(obs.date)}</div>` : ''}
                ${obs.status ? `<div class="item-detail"><strong>Status:</strong> ${obs.status}</div>` : ''}
                ${obs.category ? `<div class="item-detail"><strong>Category:</strong> ${obs.category}</div>` : ''}
                ${obs.method ? `<div class="item-detail"><strong>Method:</strong> ${obs.method}</div>` : ''}
                ${obs.interpretation ? `<div class="item-detail"><strong>Interpretation:</strong> ${obs.interpretation}</div>` : ''}
                ${obs.referenceRange ? `<div class="item-detail"><strong>Reference Range:</strong> ${obs.referenceRange}</div>` : ''}
            </div>
        </div>
    `).join('');
}

function renderMedications(medications) {
    const container = document.getElementById('medicationsSection');
    
    if (!medications || medications.length === 0) {
        container.innerHTML = '<div class="no-data">No medications recorded</div>';
        return;
    }
    
    container.innerHTML = medications.map(med => `
        <div class="medication-item">
            <div class="item-name">${med.name || 'Unknown Medication'}</div>
            <div class="item-details">
                ${med.value ? `<div class="item-detail"><strong>Dosage:</strong> ${med.value}</div>` : ''}
                ${med.dosage ? `<div class="item-detail"><strong>Dosage:</strong> ${med.dosage}</div>` : ''}
                ${med.frequency ? `<div class="item-detail"><strong>Frequency:</strong> ${med.frequency}</div>` : ''}
                ${med.route ? `<div class="item-detail"><strong>Route:</strong> ${med.route}</div>` : ''}
                ${med.status ? `<div class="item-detail"><strong>Status:</strong> ${med.status}</div>` : ''}
                ${med.date ? `<div class="item-detail"><strong>Prescribed:</strong> ${formatDate(med.date)}</div>` : ''}
                ${med.prescriber ? `<div class="item-detail"><strong>Prescriber:</strong> ${med.prescriber}</div>` : ''}
                ${med.indication ? `<div class="item-detail"><strong>Indication:</strong> ${med.indication}</div>` : ''}
                ${med.instructions ? `<div class="item-detail"><strong>Instructions:</strong> ${med.instructions}</div>` : ''}
            </div>
        </div>
    `).join('');
}

function renderProcedures(procedures) {
    const container = document.getElementById('proceduresSection');
    
    if (!procedures || procedures.length === 0) {
        container.innerHTML = '<div class="no-data">No procedures recorded</div>';
        return;
    }
    
    container.innerHTML = procedures.map(proc => `
        <div class="procedure-item">
            <div class="item-name">${proc.name || 'Unknown Procedure'}</div>
            <div class="item-details">
                ${proc.date ? `<div class="item-detail"><strong>Date:</strong> ${formatDate(proc.date)}</div>` : ''}
                ${proc.status ? `<div class="item-detail"><strong>Status:</strong> ${proc.status}</div>` : ''}
                ${proc.performer ? `<div class="item-detail"><strong>Performer:</strong> ${proc.performer}</div>` : ''}
                ${proc.location ? `<div class="item-detail"><strong>Location:</strong> ${proc.location}</div>` : ''}
                ${proc.reason ? `<div class="item-detail"><strong>Reason:</strong> ${proc.reason}</div>` : ''}
                ${proc.outcome ? `<div class="item-detail"><strong>Outcome:</strong> ${proc.outcome}</div>` : ''}
                ${proc.bodySite ? `<div class="item-detail"><strong>Body Site:</strong> ${proc.bodySite}</div>` : ''}
            </div>
        </div>
    `).join('');
}

function renderImmunizations(immunizations) {
    const container = document.getElementById('immunizationsSection');
    
    if (!immunizations || immunizations.length === 0) {
        container.innerHTML = '<div class="no-data">No immunizations recorded</div>';
        return;
    }
    
    container.innerHTML = immunizations.map(imm => `
        <div class="immunization-item">
            <div class="item-name">${imm.name || 'Unknown Immunization'}</div>
            <div class="item-details">
                ${imm.date ? `<div class="item-detail"><strong>Date:</strong> ${formatDate(imm.date)}</div>` : ''}
                ${imm.status ? `<div class="item-detail"><strong>Status:</strong> ${imm.status}</div>` : ''}
                ${imm.lotNumber ? `<div class="item-detail"><strong>Lot Number:</strong> ${imm.lotNumber}</div>` : ''}
                ${imm.manufacturer ? `<div class="item-detail"><strong>Manufacturer:</strong> ${imm.manufacturer}</div>` : ''}
                ${imm.route ? `<div class="item-detail"><strong>Route:</strong> ${imm.route}</div>` : ''}
                ${imm.site ? `<div class="item-detail"><strong>Site:</strong> ${imm.site}</div>` : ''}
                ${imm.doseQuantity ? `<div class="item-detail"><strong>Dose:</strong> ${imm.doseQuantity}</div>` : ''}
            </div>
        </div>
    `).join('');
}

function renderAllergies(allergies) {
    const container = document.getElementById('allergiesSection');
    
    if (!allergies || allergies.length === 0) {
        container.innerHTML = '<div class="no-data">No allergies recorded</div>';
        return;
    }
    
    container.innerHTML = allergies.map(allergy => `
        <div class="allergy-item">
            <div class="item-name">${allergy.name || 'Unknown Allergy'}</div>
            <div class="item-details">
                ${allergy.severity ? `<div class="item-detail"><strong>Severity:</strong> ${allergy.severity}</div>` : ''}
                ${allergy.type ? `<div class="item-detail"><strong>Type:</strong> ${allergy.type}</div>` : ''}
                ${allergy.category ? `<div class="item-detail"><strong>Category:</strong