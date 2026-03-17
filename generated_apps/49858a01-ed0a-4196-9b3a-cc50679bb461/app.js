// Chronic conditions that are considered long-term/chronic
const CHRONIC_CONDITIONS = [
    'hypertension', 'diabetes', 'copd', 'asthma', 'depression', 'dementia',
    'cancer', 'breast cancer', 'ckd', 'chronic kidney disease', 'ra', 
    'rheumatoid arthritis', 'psoriasis', 'hypothyroidism', 'glaucoma',
    'ulcerative colitis', 'gestational diabetes', 'anemia'
];

let allChronicPatients = [];
let filteredPatients = [];

function calculateAge(birthDate) {
    if (!birthDate) return 0;
    const today = new Date();
    const birth = new Date(birthDate);
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
        age--;
    }
    return age;
}

function isChronicCondition(conditionName) {
    if (!conditionName) return false;
    const name = conditionName.toLowerCase();
    return CHRONIC_CONDITIONS.some(chronic => name.includes(chronic));
}

function loadChronicPatients() {
    if (!window.PATIENT_DATA) {
        console.error('No patient data available');
        return;
    }

    const data = window.PATIENT_DATA;
    
    if (data.patient.id === 'all' && data.patients) {
        // Filter patients who are 30+ and have chronic conditions
        allChronicPatients = data.patients.filter(patient => {
            const age = calculateAge(patient.birthDate);
            const hasChronicCondition = patient.data.condition && 
                patient.data.condition.some(condition => isChronicCondition(condition.name));
            
            return age >= 30 && hasChronicCondition;
        });
    } else {
        // Single patient mode - check if patient meets criteria
        const age = calculateAge(data.patient.birthDate);
        const hasChronicCondition = data.condition && data.condition.summary &&
            data.condition.summary.some(condition => isChronicCondition(condition.name));
        
        if (age >= 30 && hasChronicCondition) {
            allChronicPatients = [{
                id: data.patient.id,
                name: data.patient.name,
                gender: data.patient.gender,
                birthDate: data.patient.birthDate,
                data: {
                    condition: data.condition?.summary || [],
                    observation: data.observation?.summary || [],
                    vital_signs: data.vital_signs?.summary || []
                }
            }];
        }
    }

    filteredPatients = [...allChronicPatients];
    updateStats();
    populateConditionFilter();
    populateNameFilter();
    renderPatients();
}

function updateStats() {
    const totalPatients = filteredPatients.length;
    const avgAge = totalPatients > 0 ? 
        Math.round(filteredPatients.reduce((sum, p) => sum + calculateAge(p.birthDate), 0) / totalPatients) : 0;
    
    const allConditions = new Set();
    filteredPatients.forEach(patient => {
        if (patient.data.condition) {
            patient.data.condition.forEach(condition => {
                if (isChronicCondition(condition.name)) {
                    allConditions.add(condition.name.toLowerCase());
                }
            });
        }
    });

    document.getElementById('totalPatients').textContent = totalPatients;
    document.getElementById('avgAge').textContent = avgAge;
    document.getElementById('uniqueConditions').textContent = allConditions.size;
}

function populateConditionFilter() {
    const conditionFilter = document.getElementById('conditionFilter');
    const conditions = new Set();
    
    allChronicPatients.forEach(patient => {
        if (patient.data.condition) {
            patient.data.condition.forEach(condition => {
                if (isChronicCondition(condition.name)) {
                    conditions.add(condition.name);
                }
            });
        }
    });

    // Clear existing options except first one
    conditionFilter.innerHTML = '<option value="">All Conditions</option>';
    
    Array.from(conditions).sort().forEach(condition => {
        const option = document.createElement('option');
        option.value = condition;
        option.textContent = condition;
        conditionFilter.appendChild(option);
    });
}

function populateNameFilter() {
    const nameFilter = document.getElementById('nameFilter');
    const names = new Set();
    
    allChronicPatients.forEach(patient => {
        if (patient.name) {
            names.add(patient.name);
        }
    });

    // Clear existing options except first one
    nameFilter.innerHTML = '<option value="">All Patients</option>';
    
    Array.from(names).sort().forEach(name => {
        const option = document.createElement('option');
        option.value = name;
        option.textContent = name;
        nameFilter.appendChild(option);
    });
}

function showPatientDetail(patientId) {
    const patient = allChronicPatients.find(p => p.id === patientId);
    if (!patient) return;

    const modal = new bootstrap.Modal(document.getElementById('patientDetailModal'));
    const modalBody = document.getElementById('patientDetailBody');
    const age = calculateAge(patient.birthDate);
    
    const chronicConditions = patient.data.condition ? 
        patient.data.condition.filter(c => isChronicCondition(c.name)) : [];
    const allConditions = patient.data.condition || [];
    const observations = patient.data.observation || [];
    const vitals = patient.data.vital_signs || [];

    // Group observations by type
    const observationGroups = {};
    observations.forEach(obs => {
        const category = obs.category || 'General';
        if (!observationGroups[category]) {
            observationGroups[category] = [];
        }
        observationGroups[category].push(obs);
    });

    modalBody.innerHTML = `
        <div class="patient-detail-header">
            <div class="patient-detail-name">
                <i class="fas fa-user-injured me-3"></i>
                ${patient.name}
            </div>
            <div class="patient-detail-meta">
                <span><i class="fas fa-calendar-alt me-2"></i>${age} years old</span>
                <span><i class="fas fa-${patient.gender === 'male' ? 'mars' : 'venus'} me-2"></i>${patient.gender}</span>
                <span><i class="fas fa-id-card me-2"></i>ID: ${patient.id}</span>
                ${patient.birthDate ? `<span><i class="fas fa-birthday-cake me-2"></i>Born: ${new Date(patient.birthDate).toLocaleDateString()}</span>` : ''}
            </div>
        </div>

        <div class="detail-grid">
            <!-- Chronic Conditions -->
            <div class="detail-section">
                <h4><i class="fas fa-heartbeat text-danger"></i>Chronic Conditions</h4>
                ${chronicConditions.length > 0 ? 
                    chronicConditions.map(condition => `
                        <div class="timeline-item severity-high">
                            <div class="timeline-date">${condition.date ? new Date(condition.date).toLocaleDateString() : 'Date unknown'}</div>
                            <div class="timeline-content">
                                <strong>${condition.name}</strong>
                                ${condition.severity ? `<span class="badge bg-danger ms-2">${condition.severity}</span>` : ''}
                                ${condition.status ? `<span class="badge bg-secondary ms-2">${condition.status}</span>` : ''}
                            </div>
                        </div>
                    `).join('') : 
                    '<p class="text-muted">No chronic conditions recorded</p>'
                }
            </div>

            <!-- All Medical Conditions -->
            <div class="detail-section">
                <h4><i class="fas fa-list-ul text-info"></i>All Medical Conditions</h4>
                ${allConditions.length > 0 ? 
                    allConditions.map(condition => {
                        const ischronic = isChronicCondition(condition.name);
                        const severityClass = ischronic ? 'severity-high' : 'severity-medium';
                        return `
                            <div class="timeline-item ${severityClass}">
                                <div class="timeline-date">${condition.date ? new Date(condition.date).toLocaleDateString() : 'Date unknown'}</div>
                                <div class="timeline-content">
                                    <strong>${condition.name}</strong>
                                    ${ischronic ? '<span class="badge bg-danger ms-2">Chronic</span>' : '<span class="badge bg-warning ms-2">Acute</span>'}
                                    ${condition.severity ? `<span class="badge bg-info ms-2">${condition.severity}</span>` : ''}
                                </div>
                            </div>
                        `;
                    }).join('') : 
                    '<p class="text-muted">No conditions recorded</p>'
                }
            </div>

            <!-- Vital Signs Timeline -->
            <div class="detail-section">
                <h4><i class="fas fa-chart-line text-success"></i>Vital Signs History</h4>
                ${vitals.length > 0 ? 
                    vitals.slice(0, 10).map(vital => `
                        <div class="timeline-item severity-low">
                            <div class="timeline-date">${vital.date ? new Date(vital.date).toLocaleDateString() : 'Date unknown'}</div>
                            <div class="timeline-content">
                                <strong>${vital.name || vital.type || 'Vital Sign'}</strong>
                                <span class="ms-2">${vital.value || 'N/A'} ${vital.unit || ''}</span>
                            </div>
                        </div>
                    `).join('') : 
                    '<p class="text-muted">No vital signs recorded</p>'
                }
            </div>

            <!-- Latest Vitals Summary -->
            <div class="detail-section">
                <h4><i class="fas fa-tachometer-alt text-primary"></i>Latest Vital Signs</h4>
                <div class="row">
                    ${vitals.slice(0, 6).map(vital => `
                        <div class="col-md-6 mb-3">
                            <div class="metric-card">
                                <div class="metric-label">${vital.name || vital.type || 'Unknown'}</div>
                                <div class="metric-value">
                                    ${vital.value || 'N/A'}
                                    <span class="metric-unit">${vital.unit || ''}</span>
                                </div>
                                ${vital.date ? `<small class="text-muted">${new Date(vital.date).toLocaleDateString()}</small>` : ''}
                            </div>
                        </div>
                    `).join('')}
                </div>
                ${vitals.length === 0 ? '<p class="text-muted">No vital signs recorded</p>' : ''}
            </div>

            <!-- Observations by Category -->
            ${Object.keys(observationGroups).map(category => `
                <div class="detail-section">
                    <h4><i class="fas fa-microscope text-warning"></i>${category} Observations</h4>
                    ${observationGroups[category].map(obs => `
                        <div class="timeline-item severity-medium">
                            <div class="timeline-date">${obs.date ? new Date(obs.date).toLocaleDateString() : 'Date unknown'}</div>
                            <div class="timeline-content">
                                <strong>${obs.name || obs.type || 'Observation'}</strong>
                                ${obs.value ? `<span class="ms-2">${obs.value} ${obs.unit || ''}</span>` : ''}
                                ${obs.status ? `<span class="badge bg-info ms-2">${obs.status}</span>` : ''}
                            </div>
                        </div>
                    `).join('')}
                </div>
            `).join('')}

            <!-- Patient Summary -->
            <div class="detail-section">
                <h4><i class="fas fa-clipboard-list text-secondary"></i>Patient Summary</h4>
                <div class="row">
                    <div class="col-md-4 mb-3">
                        <div class="metric-card">
                            <div class="metric-label">Total Conditions</div>
                            <div class="metric-value">${allConditions.length}</div>
                        </div>
                    </div>
                    <div class="col-md-4 mb-3">
                        <div class="metric-card">
                            <div class="metric-label">Chronic Conditions</div>
                            <div class="metric-value">${chronicConditions.length}</div>
                        </div>
                    </div>
                    <div class="col-md-4 mb-3">
                        <div class="metric-card">
                            <div class="metric-label">Vital Readings</div>
                            <div class="metric-value">${vitals.length}</div>
                        </div>
                    </div>
                    <div class="col-md-4 mb-3">
                        <div class="metric-card">
                            <div class="metric-label">Total Observations</div>
                            <div class="metric-value">${observations.length}</div>
                        </div>
                    </div>
                    <div class="col-md-4 mb-3">
                        <div class="metric-card">
                            <div class="metric-label">Age Category</div>
                            <div class="metric-value">${age < 40 ? 'Young Adult' : age < 60 ? 'Middle Age' : 'Senior'}</div>
                        </div>
                    </div>
                    <div class="col-md-4 mb-3">
                        <div class="metric-card">
                            <div class="metric-label">Risk Level</div>
                            <div class="metric-value">${chronicConditions.length > 2 ? 'High' : chronicConditions.length > 0 ? 'Moderate' : 'Low'}</div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;

    modal.show();
}

function renderPatients() {
    const container = document.getElementById('patientsContainer');
    const noDataMessage = document.getElementById('noDataMessage');

    if (filteredPatients.length === 0) {
        container.innerHTML = '';