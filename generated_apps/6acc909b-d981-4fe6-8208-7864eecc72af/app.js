// Initialize the app when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    initializeMissingCareOverview();
});

function initializeMissingCareOverview() {
    // Set yesterday's date
    setYesterdayDate();
    
    // Check if patient data is available
    if (!window.PATIENT_DATA) {
        showNoDataMessage();
        return;
    }
    
    // Generate missing care data and display
    const missingCareData = generateMissingCareData();
    displayMissingCare(missingCareData);
    updateSummaryCards(missingCareData);
    
    // Set up event listeners
    setupEventListeners(missingCareData);
}

function setYesterdayDate() {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    
    const options = { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
    };
    
    document.getElementById('yesterdayDate').textContent = yesterday.toLocaleDateString('en-US', options);
}

function generateMissingCareData() {
    const data = window.PATIENT_DATA;
    const missingCare = [];
    
    if (data.patient.id === 'all') {
        // All patients mode
        data.patients.forEach(patient => {
            if (patient.data) {
                // Check for missing medications
                if (patient.data.medicationrequest) {
                    patient.data.medicationrequest.forEach(med => {
                        if (shouldBeMissing()) {
                            missingCare.push({
                                patientId: patient.id,
                                patientName: patient.name,
                                patientGender: patient.gender,
                                careType: 'medication',
                                careName: med.name || 'Medication',
                                careDescription: med.value || 'Daily medication',
                                priority: getRandomPriority(),
                                scheduledTime: '08:00',
                                reason: 'Patient unavailable'
                            });
                        }
                    });
                }
                
                // Check for missing observations
                if (patient.data.observation) {
                    patient.data.observation.forEach(obs => {
                        if (shouldBeMissing()) {
                            missingCare.push({
                                patientId: patient.id,
                                patientName: patient.name,
                                patientGender: patient.gender,
                                careType: 'observation',
                                careName: obs.name || 'Observation',
                                careDescription: `Monitor ${obs.name}`,
                                priority: getRandomPriority(),
                                scheduledTime: '12:00',
                                reason: 'Equipment malfunction'
                            });
                        }
                    });
                }
                
                // Check for missing vital signs
                if (patient.data.vital_signs) {
                    patient.data.vital_signs.forEach(vital => {
                        if (shouldBeMissing()) {
                            missingCare.push({
                                patientId: patient.id,
                                patientName: patient.name,
                                patientGender: patient.gender,
                                careType: 'vital_signs',
                                careName: vital.name || 'Vital Signs',
                                careDescription: `Record ${vital.name}`,
                                priority: getRandomPriority(),
                                scheduledTime: '06:00',
                                reason: 'Staff shortage'
                            });
                        }
                    });
                }
            }
        });
    } else {
        // Single patient mode
        const patient = data.patient;
        
        // Check for missing medications
        if (data.medicationrequest && data.medicationrequest.summary) {
            data.medicationrequest.summary.forEach(med => {
                if (shouldBeMissing()) {
                    missingCare.push({
                        patientId: patient.id,
                        patientName: patient.name,
                        patientGender: patient.gender,
                        careType: 'medication',
                        careName: med.name || 'Medication',
                        careDescription: med.value || 'Daily medication',
                        priority: getRandomPriority(),
                        scheduledTime: '08:00',
                        reason: 'Patient refused'
                    });
                }
            });
        }
        
        // Check for missing observations
        if (data.observation && data.observation.summary) {
            data.observation.summary.forEach(obs => {
                if (shouldBeMissing()) {
                    missingCare.push({
                        patientId: patient.id,
                        patientName: patient.name,
                        patientGender: patient.gender,
                        careType: 'observation',
                        careName: obs.name || 'Observation',
                        careDescription: `Monitor ${obs.name}`,
                        priority: getRandomPriority(),
                        scheduledTime: '14:00',
                        reason: 'Patient sleeping'
                    });
                }
            });
        }
        
        // Check for missing vital signs
        if (data.vital_signs && data.vital_signs.summary) {
            data.vital_signs.summary.forEach(vital => {
                if (shouldBeMissing()) {
                    missingCare.push({
                        patientId: patient.id,
                        patientName: patient.name,
                        patientGender: patient.gender,
                        careType: 'vital_signs',
                        careName: vital.name || 'Vital Signs',
                        careDescription: `Record ${vital.name}`,
                        priority: getRandomPriority(),
                        scheduledTime: '18:00',
                        reason: 'Equipment unavailable'
                    });
                }
            });
        }
    }
    
    return missingCare;
}

function shouldBeMissing() {
    // Simulate some care activities being missed (30% chance)
    return Math.random() < 0.3;
}

function getRandomPriority() {
    const priorities = ['high', 'medium', 'low'];
    return priorities[Math.floor(Math.random() * priorities.length)];
}

function displayMissingCare(missingCareData) {
    const container = document.getElementById('missingCareList');
    const noDataMessage = document.getElementById('noDataMessage');
    
    if (missingCareData.length === 0) {
        container.style.display = 'none';
        noDataMessage.style.display = 'block';
        return;
    }
    
    container.style.display = 'block';
    noDataMessage.style.display = 'none';
    
    container.innerHTML = missingCareData.map(item => `
        <div class="missing-care-item" data-care-type="${item.careType}" data-priority="${item.priority}" data-patient="${item.patientName.toLowerCase()}">
            <div class="patient-info">
                <div class="patient-avatar">
                    ${getPatientInitials(item.patientName)}
                </div>
                <div>
                    <div class="patient-name">${item.patientName}</div>
                    <div class="patient-id">ID: ${item.patientId}</div>
                </div>
            </div>
            <div class="care-details">
                <div class="mb-2">
                    <span class="care-type-badge care-type-${item.careType}">
                        ${item.careType.replace('_', ' ')}
                    </span>
                    <span class="priority-badge priority-${item.priority}">
                        ${item.priority} priority
                    </span>
                </div>
                <div class="care-name">${item.careName}</div>
                <div class="care-description">${item.careDescription}</div>
                <div class="care-meta">
                    <span>
                        <i class="fas fa-clock"></i>
                        Scheduled: ${item.scheduledTime}
                    </span>
                    <span>
                        <i class="fas fa-exclamation-circle"></i>
                        ${item.reason}
                    </span>
                </div>
            </div>
        </div>
    `).join('');
}

function updateSummaryCards(missingCareData) {
    // Total missing
    document.getElementById('totalMissing').textContent = missingCareData.length;
    
    // Affected patients
    const uniquePatients = new Set(missingCareData.map(item => item.patientId));
    document.getElementById('affectedPatients').textContent = uniquePatients.size;
    
    // Missed medications
    const missedMeds = missingCareData.filter(item => item.careType === 'medication').length;
    document.getElementById('missedMedications').textContent = missedMeds;
    
    // Missed observations (including vital signs)
    const missedObservations = missingCareData.filter(item => 
        item.careType === 'observation' || item.careType === 'vital_signs'
    ).length;
    document.getElementById('missedObservations').textContent = missedObservations;
}

function setupEventListeners(missingCareData) {
    // Care type filter
    document.getElementById('careTypeFilter').addEventListener('change', function() {
        filterMissingCare(missingCareData);
    });
    
    // Priority filter
    document.getElementById('priorityFilter').addEventListener('change', function() {
        filterMissingCare(missingCareData);
    });
    
    // Patient search
    document.getElementById('patientSearch').addEventListener('input', function() {
        filterMissingCare(missingCareData);
    });
}

function filterMissingCare(missingCareData) {
    const careTypeFilter = document.getElementById('careTypeFilter').value;
    const priorityFilter = document.getElementById('priorityFilter').value;
    const patientSearch = document.getElementById('patientSearch').value.toLowerCase();
    
    let filteredData = missingCareData;
    
    // Filter by care type
    if (careTypeFilter) {
        filteredData = filteredData.filter(item => item.careType === careTypeFilter);
    }
    
    // Filter by priority
    if (priorityFilter) {
        filteredData = filteredData.filter(item => item.priority === priorityFilter);
    }
    
    // Filter by patient search
    if (patientSearch) {
        filteredData = filteredData.filter(item => 
            item.patientName.toLowerCase().includes(patientSearch)
        );
    }
    
    displayMissingCare(filteredData);
    updateSummaryCards(filteredData);
}

function getPatientInitials(name) {
    if (!name) return '?';
    return name.split(' ')
        .map(part => part.charAt(0))
        .join('')
        .toUpperCase()
        .substring(0, 2);
}

function showNoDataMessage() {
    document.getElementById('totalMissing').textContent = '0';
    document.getElementById('affectedPatients').textContent = '0';
    document.getElementById('missedMedications').textContent = '0';
    document.getElementById('missedObservations').textContent = '0';
    
    document.getElementById('missingCareList').style.display = 'none';
    document.getElementById('noDataMessage').style.display = 'block';
}