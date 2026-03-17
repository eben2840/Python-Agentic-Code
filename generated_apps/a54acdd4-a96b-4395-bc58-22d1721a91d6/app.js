document.addEventListener('DOMContentLoaded', function() {
    // Check if patient data is available
    if (!window.PATIENT_DATA) {
        showError('Patient data not available');
        return;
    }

    const data = window.PATIENT_DATA;
    
    // Find Rose Hall in the patient data
    let roseHallData = null;
    
    if (data.patient && data.patient.id === 'all' && data.patients) {
        // All patients mode - find Rose Hall
        const roseHall = data.patients.find(p => 
            p.name && p.name.toLowerCase().includes('rose hall')
        );
        
        if (roseHall) {
            roseHallData = {
                patient: roseHall,
                observation: roseHall.data?.observation || [],
                encounter: roseHall.data?.encounter || [],
                medication: roseHall.data?.medication || []
            };
        }
    } else if (data.patient && data.patient.name && 
               data.patient.name.toLowerCase().includes('rose hall')) {
        // Single patient mode - check if it's Rose Hall
        roseHallData = {
            patient: data.patient,
            observation: data.observation?.summary || [],
            encounter: data.encounter?.summary || [],
            medication: data.medication?.summary || []
        };
    }

    if (!roseHallData) {
        showError('Rose Hall not found in patient data');
        return;
    }

    // Display patient information
    displayPatientInfo(roseHallData.patient);
    
    // Display all data sections
    displayObservations(roseHallData.observation);
    displayEncounters(roseHallData.encounter);
    displayMedications(roseHallData.medication);
});

function displayPatientInfo(patient) {
    document.getElementById('patientName').textContent = patient.name || 'Unknown Patient';
    document.getElementById('patientGender').textContent = patient.gender || 'Unknown';
    
    if (patient.birthDate) {
        const birthDate = new Date(patient.birthDate);
        const age = calculateAge(birthDate);
        document.getElementById('patientAge').textContent = `${age} years old`;
        document.getElementById('patientDob').textContent = formatDate(birthDate);
    } else {
        document.getElementById('patientAge').textContent = 'Unknown age';
        document.getElementById('patientDob').textContent = 'Unknown DOB';
    }
}

function displayObservations(observations) {
    const container = document.getElementById('observationsContainer');
    
    if (!observations || observations.length === 0) {
        container.innerHTML = `
            <div class="no-data">
                <i class="fas fa-chart-line"></i>
                <h6>No observations available</h6>
                <p class="mb-0">No observation data found for this patient.</p>
            </div>
        `;
        return;
    }

    let html = '';
    
    observations.forEach(obs => {
        const statusClass = getStatusClass(obs.status);
        const iconClass = getObservationIcon(obs.name);
        
        html += `
            <div class="observation-item">
                <div class="d-flex justify-content-between align-items-start">
                    <div class="flex-grow-1">
                        <div class="d-flex align-items-center mb-2">
                            <i class="${iconClass} text-primary me-2"></i>
                            <div class="observation-name">${obs.name || 'Unknown Observation'}</div>
                        </div>
                        <div class="observation-value">${obs.value || obs.name || 'No value recorded'}</div>
                        ${obs.date ? `<div class="observation-date">
                            <i class="fas fa-clock me-1"></i>
                            ${formatDateTime(obs.date)}
                        </div>` : ''}
                    </div>
                    ${obs.status ? `<span class="status-badge ${statusClass}">${obs.status}</span>` : ''}
                </div>
            </div>
        `;
    });
    
    container.innerHTML = html;
}

function displayEncounters(encounters) {
    const container = document.getElementById('encountersContainer');
    
    if (!encounters || encounters.length === 0) {
        container.innerHTML = `
            <div class="no-data">
                <i class="fas fa-calendar-check"></i>
                <h6>No encounters available</h6>
                <p class="mb-0">No encounter data found for this patient.</p>
            </div>
        `;
        return;
    }

    let html = '';
    
    encounters.forEach(encounter => {
        const statusClass = getStatusClass(encounter.status);
        const iconClass = getEncounterIcon(encounter.type);
        
        html += `
            <div class="encounter-item">
                <div class="d-flex justify-content-between align-items-start">
                    <div class="flex-grow-1">
                        <div class="d-flex align-items-center mb-2">
                            <i class="${iconClass} text-primary me-2"></i>
                            <div class="encounter-name">${encounter.name || encounter.type || 'Unknown Encounter'}</div>
                        </div>
                        ${encounter.type ? `<div class="encounter-type">${encounter.type}</div>` : ''}
                        ${encounter.reasonCode && encounter.reasonCode.length > 0 ? `
                            <div class="encounter-reason">${encounter.reasonCode[0].text || encounter.reasonCode[0].display || 'Reason not specified'}</div>
                        ` : ''}
                        ${encounter.period?.start ? `<div class="encounter-date">
                            <i class="fas fa-clock me-1"></i>
                            ${formatDateTime(encounter.period.start)}
                            ${encounter.period.end ? ` - ${formatDateTime(encounter.period.end)}` : ''}
                        </div>` : ''}
                        ${encounter.serviceProvider?.display ? `
                            <div class="encounter-provider">
                                <i class="fas fa-user-md me-1"></i>
                                Provider: ${encounter.serviceProvider.display}
                            </div>
                        ` : ''}
                    </div>
                    ${encounter.status ? `<span class="status-badge ${statusClass}">${encounter.status}</span>` : ''}
                </div>
            </div>
        `;
    });
    
    container.innerHTML = html;
}

function displayMedications(medications) {
    const container = document.getElementById('medicationsContainer');
    
    if (!medications || medications.length === 0) {
        container.innerHTML = `
            <div class="no-data">
                <i class="fas fa-pills"></i>
                <h6>No medications available</h6>
                <p class="mb-0">No medication data found for this patient.</p>
            </div>
        `;
        return;
    }

    let html = '';
    
    medications.forEach(medication => {
        const statusClass = getStatusClass(medication.status);
        const medicationName = medication.medicationCodeableConcept?.text || 
                              medication.medicationCodeableConcept?.coding?.[0]?.display ||
                              medication.name || 'Unknown Medication';
        
        html += `
            <div class="medication-item">
                <div class="d-flex justify-content-between align-items-start">
                    <div class="flex-grow-1">
                        <div class="d-flex align-items-center mb-2">
                            <i class="fas fa-pills text-primary me-2"></i>
                            <div class="medication-name">${medicationName}</div>
                        </div>
                        ${medication.dosageInstruction && medication.dosageInstruction.length > 0 ? `
                            <div class="medication-dosage">
                                ${medication.dosageInstruction[0].text || 'Dosage as prescribed'}
                            </div>
                            ${medication.dosageInstruction[0].doseAndRate?.[0]?.doseQuantity ? `
                                <div class="medication-strength">
                                    ${medication.dosageInstruction[0].doseAndRate[0].doseQuantity.value} 
                                    ${medication.dosageInstruction[0].doseAndRate[0].doseQuantity.unit}
                                </div>
                            ` : ''}
                        ` : ''}
                        ${medication.effectivePeriod?.start ? `<div class="medication-date">
                            <i class="fas fa-clock me-1"></i>
                            Started: ${formatDateTime(medication.effectivePeriod.start)}
                            ${medication.effectivePeriod.end ? ` | Ended: ${formatDateTime(medication.effectivePeriod.end)}` : ''}
                        </div>` : ''}
                        ${medication.note && medication.note.length > 0 ? `
                            <div class="medication-instructions">
                                <i class="fas fa-info-circle me-1"></i>
                                ${medication.note[0].text}
                            </div>
                        ` : ''}
                    </div>
                    ${medication.status ? `<span class="status-badge ${statusClass}">${medication.status}</span>` : ''}
                </div>
            </div>
        `;
    });
    
    container.innerHTML = html;
}

function getObservationIcon(name) {
    if (!name) return 'fas fa-chart-line';
    
    const nameLower = name.toLowerCase();
    
    if (nameLower.includes('wbc') || nameLower.includes('white blood')) return 'fas fa-microscope';
    if (nameLower.includes('temp') || nameLower.includes('temperature')) return 'fas fa-thermometer-half';
    if (nameLower.includes('bp') || nameLower.includes('blood pressure')) return 'fas fa-heartbeat';
    if (nameLower.includes('glucose') || nameLower.includes('sugar')) return 'fas fa-tint';
    if (nameLower.includes('pain')) return 'fas fa-exclamation-triangle';
    if (nameLower.includes('ecg') || nameLower.includes('ekg')) return 'fas fa-wave-square';
    if (nameLower.includes('flow') || nameLower.includes('lung')) return 'fas fa-lungs';
    
    return 'fas fa-chart-line';
}

function getEncounterIcon(type) {
    if (!type) return 'fas fa-calendar-check';
    
    const typeLower = type.toLowerCase();
    
    if (typeLower.includes('inpatient') || typeLower.includes('admission')) return 'fas fa-bed';
    if (typeLower.includes('outpatient') || typeLower.includes('ambulatory')) return 'fas fa-walking';
    if (typeLower.includes('emergency')) return 'fas fa-ambulance';
    if (typeLower.includes('virtual') || typeLower.includes('telehealth')) return 'fas fa-video';
    if (typeLower.includes('home')) return 'fas fa-home';
    
    return 'fas fa-calendar-check';
}

function getStatusClass(status) {
    if (!status) return '';
    
    const statusLower = status.toLowerCase();
    
    if (statusLower.includes('active') || statusLower.includes('current')) return 'status-active';
    if (statusLower.includes('completed') || statusLower.includes('final') || statusLower.includes('finished')) return 'status-completed';
    if (statusLower.includes('pending') || statusLower.includes('preliminary')) return 'status-pending';
    if (statusLower.includes('stopped') || statusLower.includes('cancelled') || statusLower.includes('discontinued')) return 'status-stopped';
    if (statusLower.includes('in-progress') || statusLower.includes('ongoing')) return 'status-in-progress';
    
    return 'status-active';
}

function calculateAge(birthDate) {
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
        age--;
    }
    
    return age;
}

function formatDate(date) {
    return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    });
}

function formatDateTime(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

function showError(message) {
    const containers = ['observationsContainer', 'encountersContainer', 'medicationsContainer'];
    
    containers.forEach(containerId => {
        const container = document.getElementById(containerId);
        if (container) {
            container.innerHTML = `
                <div class="no-data">
                    <i class="fas fa-exclamation-triangle text-warning"></i>
                    <h6>Error</h6>
                    <p class="mb-0">${message}</p>
                </div>
            `;
        }
    });
    
    document.getElementById('patientName').textContent = 'Patient Not Found';
    document.getElementById('patientGender').textContent = '-';
    document.getElementById('patientAge').textContent = '-';
    document.getElementById('patientDob').textContent = '-';
}