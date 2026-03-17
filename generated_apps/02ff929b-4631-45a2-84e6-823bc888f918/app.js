// Chronic disease keywords for classification
const CHRONIC_CONDITIONS = {
    cardiovascular: ['hypertension', 'chest pain', 'heart', 'cardiac', 'blood pressure'],
    respiratory: ['asthma', 'copd', 'respiratory', 'breathing', 'lung'],
    metabolic: ['diabetes', 'thyroid', 'hypothyroidism', 'glucose', 'metabolic'],
    other: ['cancer', 'arthritis', 'ra', 'rheumatoid', 'dementia', 'depression', 'psoriasis', 'colitis', 'glaucoma', 'anemia', 'sepsis', 'migraine', 'tb', 'tuberculosis', 'ckd', 'kidney']
};

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

function classifyCondition(conditionName) {
    if (!conditionName) return 'other';
    const name = conditionName.toLowerCase();
    
    for (const [category, keywords] of Object.entries(CHRONIC_CONDITIONS)) {
        if (keywords.some(keyword => name.includes(keyword))) {
            return category;
        }
    }
    return 'other';
}

function isChronicCondition(conditionName) {
    if (!conditionName) return false;
    const name = conditionName.toLowerCase();
    
    // Check if condition matches any chronic disease keywords
    return Object.values(CHRONIC_CONDITIONS).flat().some(keyword => 
        name.includes(keyword)
    );
}

function getPatientInitials(name) {
    if (!name) return '?';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2);
}

function formatDate(dateString) {
    if (!dateString) return 'Unknown';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'short', 
        day: 'numeric' 
    });
}

function formatDateTime(dateString) {
    if (!dateString) return 'Unknown';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'short', 
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

function getChronicPatients() {
    if (!window.PATIENT_DATA || !window.PATIENT_DATA.patients) {
        return [];
    }

    return window.PATIENT_DATA.patients.filter(patient => {
        // Check age (over 30)
        const age = calculateAge(patient.birthDate);
        if (age < 30) return false;

        // Check for chronic conditions
        const conditions = patient.data?.condition || [];
        return conditions.some(condition => isChronicCondition(condition.name));
    });
}

function showPatientDetails(patientId) {
    const patient = filteredPatients.find(p => p.id === patientId);
    if (!patient) return;

    const age = calculateAge(patient.birthDate);
    const conditions = patient.data?.condition || [];
    const chronicConditions = conditions.filter(c => isChronicCondition(c.name));
    const vitals = patient.data?.vital_signs || [];
    const observations = patient.data?.observation || [];
    const procedures = patient.data?.procedure || [];
    const medications = patient.data?.medication_request || [];

    // Generate comprehensive patient detail view
    const detailHTML = `
        <div class="patient-detail-header">
            <div class="d-flex align-items-center">
                <div class="patient-detail-avatar">
                    ${getPatientInitials(patient.name)}
                </div>
                <div class="patient-detail-info">
                    <h2>${patient.name || 'Unknown Patient'}</h2>
                    <p>
                        <i class="fas fa-user me-2"></i>${patient.gender || 'Unknown'} •
                        <i class="fas fa-birthday-cake ms-2 me-2"></i>Age ${age} •
                        <i class="fas fa-calendar ms-2 me-2"></i>DOB: ${formatDate(patient.birthDate)} •
                        <i class="fas fa-id-card ms-2 me-2"></i>ID: ${patient.id}
                    </p>
                </div>
            </div>
        </div>

        <div class="row">
            <div class="col-md-4 mb-3">
                <div class="metric-card">
                    <div class="metric-value">${chronicConditions.length}</div>
                    <div class="metric-label">Chronic Conditions</div>
                </div>
            </div>
            <div class="col-md-4 mb-3">
                <div class="metric-card">
                    <div class="metric-value">${vitals.length}</div>
                    <div class="metric-label">Vital Sign Readings</div>
                </div>
            </div>
            <div class="col-md-4 mb-3">
                <div class="metric-card">
                    <div class="metric-value">${medications.length}</div>
                    <div class="metric-label">Medications</div>
                </div>
            </div>
        </div>

        <div class="detail-section">
            <h5><i class="fas fa-stethoscope"></i>Chronic Conditions</h5>
            ${chronicConditions.length > 0 ? `
                <table class="detail-table">
                    <thead>
                        <tr>
                            <th>Condition</th>
                            <th>Category</th>
                            <th>Status</th>
                            <th>Date Recorded</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${chronicConditions.map(condition => `
                            <tr>
                                <td>${condition.name}</td>
                                <td><span class="condition-badge ${classifyCondition(condition.name)}">${classifyCondition(condition.name)}</span></td>
                                <td>${condition.status || 'Active'}</td>
                                <td>${formatDate(condition.date)}</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            ` : '<p class="text-muted">No chronic conditions recorded</p>'}
        </div>

        <div class="detail-section">
            <h5><i class="fas fa-heartbeat"></i>Latest Vital Signs</h5>
            ${vitals.length > 0 ? `
                <table class="detail-table">
                    <thead>
                        <tr>
                            <th>Vital Sign</th>
                            <th>Value</th>
                            <th>Unit</th>
                            <th>Date</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${vitals.slice(0, 10).map(vital => `
                            <tr>
                                <td>${vital.name}</td>
                                <td><strong>${vital.value}</strong></td>
                                <td>${vital.unit || ''}</td>
                                <td>${formatDateTime(vital.date)}</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            ` : '<p class="text-muted">No vital signs recorded</p>'}
        </div>

        <div class="detail-section">
            <h5><i class="fas fa-pills"></i>Current Medications</h5>
            ${medications.length > 0 ? `
                <table class="detail-table">
                    <thead>
                        <tr>
                            <th>Medication</th>
                            <th>Dosage</th>
                            <th>Frequency</th>
                            <th>Date Prescribed</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${medications.map(med => `
                            <tr>
                                <td>${med.medication || med.name}</td>
                                <td>${med.dosage || 'Not specified'}</td>
                                <td>${med.frequency || 'As directed'}</td>
                                <td>${formatDate(med.date)}</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            ` : '<p class="text-muted">No medications recorded</p>'}
        </div>

        <div class="detail-section">
            <h5><i class="fas fa-procedures"></i>Recent Procedures</h5>
            ${procedures.length > 0 ? `
                <div class="timeline">
                    ${procedures.slice(0, 5).map(proc => `
                        <div class="timeline-item">
                            <div class="timeline-date">${formatDate(proc.date)}</div>
                            <div class="timeline-content">
                                <div class="timeline-title">${proc.name}</div>
                                <div class="timeline-description">${proc.description || 'No additional details'}</div>
                            </div>
                        </div>
                    `).join('')}
                </div>
            ` : '<p class="text-muted">No procedures recorded</p>'}
        </div>

        <div class="detail-section">
            <h5><i class="fas fa-microscope"></i>Laboratory Results & Observations</h5>
            ${observations.length > 0 ? `
                <table class="detail-table">
                    <thead>
                        <tr>
                            <th>Test/Observation</th>
                            <th>Result</th>
                            <th>Unit</th>
                            <th>Reference Range</th>
                            <th>Date</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${observations.slice(0, 10).map(obs => `
                            <tr>
                                <td>${obs.name}</td>
                                <td><strong>${obs.value || obs.result || 'N/A'}</strong></td>
                                <td>${obs.unit || ''}</td>
                                <td>${obs.reference_range || 'Not specified'}</td>
                                <td>${formatDateTime(obs.date)}</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            ` : '<p class="text-muted">No observations recorded</p>'}
        </div>

        <div class="detail-section">
            <h5><i class="fas fa-info-circle"></i>Additional Information</h5>
            <div class="row">
                <div class="col-md-6">
                    <p><strong>Patient ID:</strong> ${patient.id}</p>
                    <p><strong>Gender:</strong> ${patient.gender || 'Not specified'}</p>
                    <p><strong>Date of Birth:</strong> ${formatDate(patient.birthDate)}</p>
                    <p><strong>Age:</strong> ${age} years</p>
                </div>
                <div class="col-md-6">
                    <p><strong>Total Conditions:</strong> ${conditions.length}</p>
                    <p><strong>Chronic Conditions:</strong> ${chronicConditions.length}</p>
                    <p><strong>Total Vitals Recorded:</strong> ${vitals.length}</p>
                    <p><strong>Total Observations:</strong> ${observations.length}</p>
                </div>
            </div>
        </div>
    `;

    document.getElementById('patientDetailContent').innerHTML = detailHTML;
    document.getElementById('patientDetailModalLabel').textContent = `${patient.name || 'Patient'} - Comprehensive Details`;
    
    const modal = new bootstrap.Modal(document.getElementById('patientDetailModal'));
    modal.show();
}

function applyFilters() {
    const ageFilter = document.getElementById('ageFilter').value;
    const conditionFilter = document.getElementById('conditionFilter').value;
    const genderFilter = document.getElementById('genderFilter').value;

    let patients = getChronicPatients();

    // Apply age filter
    const minAge = parseInt(ageFilter.replace('+', ''));
    patients = patients.filter(patient => calculateAge(patient.birthDate) >= minAge);

    // Apply condition type filter
    if (conditionFilter !== 'all') {
        patients = patients.filter(patient => {
            const conditions = patient.data?.condition || [];
            return conditions.some(condition => 
                classifyCondition(condition.name) === conditionFilter
            );
        });
    }

    // Apply gender filter
    if (genderFilter !== 'all') {
        patients = patients.filter(patient => patient.gender === genderFilter);
    }

    filteredPatients = patients;
    renderPatients();
    updatePatientCount();
}

function renderPatients() {
    const patientList = document.getElementById('patientList');
    const noDataMessage = document.getElementById('noDataMessage');

    if (filteredPatients.length === 0) {
        patientList.innerHTML = '';
        noDataMessage.classList.remove('d-none');
        return;
    }

    noDataMessage.classList.add('d-none');

    const patientsHTML = filteredPatients.map(patient => {
        const age = calculateAge(patient.birthDate);
        const conditions = patient.data?.condition || [];
        const chronicConditions = conditions.filter(c => isChronicCondition(c.name));
        const vitals = patient.data?.vital_signs || [];
        const observations = patient.data?.observation || [];
        
        // Get latest vital/observation
        const latestVital = vitals.length > 0 ? vitals[0] : null;
        const latestObs = observations.length > 0 ? observations[0] : null;

        const conditionBadges = chronicConditions.map(condition => {
            const category = classifyCondition(condition.name);
            return `<span class="condition-badge ${category}">${condition.name}</span>`;
        }).join('');

        return `
            <div class="col-lg-4 col-md-6 mb-4">
                <div class="patient-card" onclick="showPatientDetails('${patient.id}')">
                    <div class="patient-header">
                        <div class="patient-avatar ${patient.gender || 'male'}">
                            ${getPatientInitials(patient.name)}
                        </div>
                        <div>
                            <h6 class="patient-name">${patient.name || 'Unknown Patient'}</h6>
                            <p class="patient-details">
                                ${patient.gender || 'Unknown'} • Age ${age} • DOB: ${formatDate(patient.birthDate)}
                            </p>
                        </div>
                    </div>
                    
                    <div class="condition-list">
                        <div class="mb-2">
                            <small class="text-muted">Chronic Conditions:</small>
                        </div>
                        ${conditionBadges || '<span class="text-muted">No conditions recorded</span>'}
                    </div>
                    
                    <div class="vital-info">
                        <div class="vital-item">
                            <div class="vital-label">Conditions</div>
                            <div class="vital-value"