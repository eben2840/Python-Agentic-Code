// Chronic diseases list for filtering
const CHRONIC_DISEASES = [
    'hypertension', 'diabetes', 'asthma', 'copd', 'depression', 'dementia',
    'breast cancer', 'cancer', 'ckd', 'chronic kidney disease', 'hypothyroidism',
    'psoriasis', 'ulcerative colitis', 'rheumatoid arthritis', 'ra', 'glaucoma',
    'anemia', 'tuberculosis', 'tb', 'migraine', 'sepsis'
];

let filteredPatients = [];
let allChronicPatients = [];

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

function hasChronicDisease(patient) {
    if (!patient.data || !patient.data.condition) return false;
    
    return patient.data.condition.some(condition => {
        if (!condition.name) return false;
        const conditionName = condition.name.toLowerCase();
        return CHRONIC_DISEASES.some(chronic => conditionName.includes(chronic));
    });
}

function filterChronicPatients() {
    if (!window.PATIENT_DATA || !window.PATIENT_DATA.patients) {
        return [];
    }

    return window.PATIENT_DATA.patients.filter(patient => {
        const age = calculateAge(patient.birthDate);
        const isOver30 = age >= 30;
        const hasChronic = hasChronicDisease(patient);
        
        return isOver30 && hasChronic;
    });
}

function applyFilters() {
    const genderFilter = document.getElementById('genderFilter').value;
    const ageFilter = document.getElementById('ageFilter').value;
    
    filteredPatients = allChronicPatients.filter(patient => {
        // Gender filter
        if (genderFilter && patient.gender !== genderFilter) {
            return false;
        }
        
        // Age filter
        if (ageFilter) {
            const age = calculateAge(patient.birthDate);
            switch (ageFilter) {
                case '30-40':
                    if (age < 30 || age > 40) return false;
                    break;
                case '40-50':
                    if (age < 40 || age > 50) return false;
                    break;
                case '50+':
                    if (age < 50) return false;
                    break;
            }
        }
        
        return true;
    });
    
    renderPatients();
    updateStats();
}

function updateStats() {
    const totalPatients = filteredPatients.length;
    const avgAge = totalPatients > 0 
        ? Math.round(filteredPatients.reduce((sum, p) => sum + calculateAge(p.birthDate), 0) / totalPatients)
        : 0;
    const totalConditions = filteredPatients.reduce((sum, p) => {
        return sum + (p.data.condition ? p.data.condition.length : 0);
    }, 0);
    
    document.getElementById('totalPatients').textContent = totalPatients;
    document.getElementById('avgAge').textContent = avgAge;
    document.getElementById('totalConditions').textContent = totalConditions;
}

function formatDate(dateString) {
    if (!dateString) return 'Unknown';
    try {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    } catch {
        return dateString;
    }
}

function showPatientDetails(patient) {
    const age = calculateAge(patient.birthDate);
    const conditions = patient.data.condition || [];
    const vitals = patient.data.vital_signs || [];
    const medications = patient.data.medicationrequest || [];
    const encounters = patient.data.encounter || [];
    
    const modalContent = `
        <div class="patient-detail-header">
            <h3>${patient.name || 'Unknown Patient'}</h3>
            <div class="patient-detail-meta">
                <span class="detail-badge">
                    <i class="fas fa-${patient.gender === 'male' ? 'mars' : patient.gender === 'female' ? 'venus' : 'question'} me-1"></i>
                    ${(patient.gender || 'Unknown').charAt(0).toUpperCase() + (patient.gender || 'unknown').slice(1)}
                </span>
                <span class="detail-badge">
                    <i class="fas fa-birthday-cake me-1"></i>
                    ${age} years old
                </span>
                <span class="detail-badge">
                    <i class="fas fa-calendar me-1"></i>
                    Born: ${formatDate(patient.birthDate)}
                </span>
                ${patient.address ? `
                    <span class="detail-badge">
                        <i class="fas fa-map-marker-alt me-1"></i>
                        ${patient.address}
                    </span>
                ` : ''}
            </div>
        </div>

        <div class="detail-grid">
            <!-- Chronic Conditions Section -->
            ${conditions.length > 0 ? `
                <div class="detail-section">
                    <div class="detail-section-title">
                        <i class="fas fa-stethoscope text-warning"></i>
                        Chronic Conditions (${conditions.length})
                    </div>
                    ${conditions.map(condition => `
                        <div class="detail-item condition-detail mb-3">
                            <div class="detail-item-label">Condition</div>
                            <div class="detail-item-value">${condition.name || 'Unknown Condition'}</div>
                            ${condition.onset ? `
                                <div class="detail-item-label mt-2">Onset Date</div>
                                <div class="detail-item-value">${formatDate(condition.onset)}</div>
                            ` : ''}
                            ${condition.clinicalStatus ? `
                                <div class="detail-item-label mt-2">Status</div>
                                <div class="detail-item-value">${condition.clinicalStatus}</div>
                            ` : ''}
                        </div>
                    `).join('')}
                </div>
            ` : ''}

            <!-- Vital Signs Section -->
            ${vitals.length > 0 ? `
                <div class="detail-section">
                    <div class="detail-section-title">
                        <i class="fas fa-heartbeat text-success"></i>
                        Vital Signs (${vitals.length})
                    </div>
                    ${vitals.map(vital => `
                        <div class="detail-item vital-detail mb-3">
                            <div class="detail-item-label">Measurement</div>
                            <div class="detail-item-value">${vital.name || vital.value || 'Unknown'}</div>
                            ${vital.date ? `
                                <div class="detail-item-label mt-2">Date Recorded</div>
                                <div class="detail-item-value">${formatDate(vital.date)}</div>
                            ` : ''}
                            ${vital.unit ? `
                                <div class="detail-item-label mt-2">Unit</div>
                                <div class="detail-item-value">${vital.unit}</div>
                            ` : ''}
                        </div>
                    `).join('')}
                </div>
            ` : ''}
        </div>

        <div class="detail-grid">
            <!-- Medications Section -->
            ${medications.length > 0 ? `
                <div class="detail-section">
                    <div class="detail-section-title">
                        <i class="fas fa-pills text-primary"></i>
                        Current Medications (${medications.length})
                    </div>
                    ${medications.map(med => `
                        <div class="detail-item medication-detail mb-3">
                            <div class="detail-item-label">Medication</div>
                            <div class="detail-item-value">${med.name || 'Unknown Medication'}</div>
                            ${med.dosage ? `
                                <div class="detail-item-label mt-2">Dosage</div>
                                <div class="detail-item-value">${med.dosage}</div>
                            ` : ''}
                            ${med.frequency ? `
                                <div class="detail-item-label mt-2">Frequency</div>
                                <div class="detail-item-value">${med.frequency}</div>
                            ` : ''}
                            ${med.status ? `
                                <div class="detail-item-label mt-2">Status</div>
                                <div class="detail-item-value">${med.status}</div>
                            ` : ''}
                        </div>
                    `).join('')}
                </div>
            ` : ''}

            <!-- Recent Encounters Section -->
            ${encounters.length > 0 ? `
                <div class="detail-section">
                    <div class="detail-section-title">
                        <i class="fas fa-hospital text-danger"></i>
                        Recent Encounters (${encounters.length})
                    </div>
                    <div class="timeline">
                        ${encounters.slice(0, 5).map(encounter => `
                            <div class="timeline-item">
                                <div class="timeline-date">${formatDate(encounter.date)}</div>
                                <div class="timeline-content">
                                    <strong>${encounter.type || 'Medical Visit'}</strong>
                                    ${encounter.reason ? `<br>Reason: ${encounter.reason}` : ''}
                                    ${encounter.status ? `<br>Status: ${encounter.status}` : ''}
                                </div>
                            </div>
                        `).join('')}
                    </div>
                </div>
            ` : ''}
        </div>

        <!-- Patient Summary -->
        <div class="detail-section">
            <div class="detail-section-title">
                <i class="fas fa-chart-line text-info"></i>
                Health Summary
            </div>
            <div class="row">
                <div class="col-md-3 col-6">
                    <div class="detail-item mb-3">
                        <div class="detail-item-label">Total Conditions</div>
                        <div class="detail-item-value">${conditions.length}</div>
                    </div>
                </div>
                <div class="col-md-3 col-6">
                    <div class="detail-item mb-3">
                        <div class="detail-item-label">Active Medications</div>
                        <div class="detail-item-value">${medications.length}</div>
                    </div>
                </div>
                <div class="col-md-3 col-6">
                    <div class="detail-item mb-3">
                        <div class="detail-item-label">Recorded Vitals</div>
                        <div class="detail-item-value">${vitals.length}</div>
                    </div>
                </div>
                <div class="col-md-3 col-6">
                    <div class="detail-item mb-3">
                        <div class="detail-item-label">Healthcare Visits</div>
                        <div class="detail-item-value">${encounters.length}</div>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    document.getElementById('modalContent').innerHTML = modalContent;
    const modal = new bootstrap.Modal(document.getElementById('patientModal'));
    modal.show();
}

function renderPatients() {
    const container = document.getElementById('patientsContainer');
    const noDataMessage = document.getElementById('noDataMessage');
    
    if (filteredPatients.length === 0) {
        container.innerHTML = '';
        noDataMessage.style.display = 'block';
        return;
    }
    
    noDataMessage.style.display = 'none';
    
    const html = filteredPatients.map((patient, index) => {
        const age = calculateAge(patient.birthDate);
        const conditions = patient.data.condition || [];
        const vitals = patient.data.vital_signs || [];
        const medications = patient.data.medicationrequest || [];
        
        return `
            <div class="col-lg-6 col-xl-4">
                <div class="patient-card" onclick="showPatientDetails(filteredPatients[${index}])">
                    <div class="patient-header">
                        <div class="patient-info">
                            <h5>${patient.name || 'Unknown Patient'}</h5>
                            <div class="patient-meta">
                                <span class="gender-badge gender-${patient.gender || 'unknown'}">
                                    <i class="fas fa-${patient.gender === 'male' ? 'mars' : patient.gender === 'female' ? 'venus' : 'question'}"></i>
                                    ${patient.gender || 'Unknown'}
                                </span>
                                <span class="age-badge">
                                    <i class="fas fa-birthday-cake"></i>
                                    ${age} years old
                                </span>
                            </div>
                        </div>
                    </div>
                    
                    ${conditions.length > 0 ? `
                        <div class="conditions-section">
                            <div class="section-title">
                                <i class="fas fa-stethoscope text-warning"></i>
                                Chronic Conditions
                            </div>
                            <div>
                                ${conditions.map(condition => `
                                    <span class="condition-item">${condition.name || 'Unknown Condition'}</span>
                                `).join('')}
                            </div>
                        </div>
                    ` : ''}
                    
                    ${vitals.length > 0 ? `
                        <div class="conditions-section">
                            <div class="section-title">
                                <i class="fas fa-heartbeat text-success"></i>
                                Latest Vitals
                            </div>
                            <div>
                                ${vitals.slice(0, 3).map(vital => `
                                    <span class="vital-item">${vital.name || vital.value || 'Unknown'}</span>
                                `).join('')}
                            </div>
                        </div>
                    ` : ''}
                    
                    ${medications.length > 0 ? `
                        <div class="conditions-section">
                            <div class="section-title">
                                <i class="fas fa-pills text-primary"></i>
                                Medications
                            </div>
                            <div>
                                ${medications.slice(0, 2).map(med => `
                                    <span class="medication-item">${med.name || 'Unknown Medication'}</span>
                                `).join('')}
                            </div>
                        </div>
                    ` : ''}
                    
                    <div class="mt-3 text-center">
                        <small class="text-muted">
                            <i class="fas fa-mouse-pointer me-1"></i>
                            Click for detailed health overview
                        </small>
                    </div>
                </div>
            </div>
        `;
    }).join('');
    
    container.innerHTML = html;
    
    // Auto-show David Brown's details if found
    const davidBrown = filteredPatients.find(patient => 
        patient.name && patient.name.toLowerCase().includes('david brown')
    );
    if (davidBrown) {
        setTimeout(() => showPatientDetails(davidBrown), 500);
    }
}

function initializeApp() {
    // Get chronic patients over 30