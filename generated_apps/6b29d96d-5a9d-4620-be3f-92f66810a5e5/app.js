// Chronic diseases list - conditions that are typically long-term/ongoing
const CHRONIC_CONDITIONS = [
    'hypertension', 'diabetes', 'asthma', 'copd', 'arthritis', 'depression', 
    'dementia', 'hypothyroidism', 'ckd', 'chronic kidney disease', 'psoriasis',
    'ulcerative colitis', 'rheumatoid arthritis', 'ra', 'glaucoma', 'anemia',
    'migraine', 'breast cancer', 'cancer'
];

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

function getConditionBadgeClass(conditionName) {
    if (!conditionName) return 'condition-default';
    const name = conditionName.toLowerCase();
    
    if (name.includes('cancer')) return 'condition-cancer';
    if (name.includes('depression') || name.includes('dementia')) return 'condition-mental';
    if (name.includes('diabetes') || name.includes('hypertension') || 
        name.includes('copd') || name.includes('asthma') || 
        name.includes('ckd') || name.includes('hypothyroidism')) return 'condition-chronic';
    
    return 'condition-default';
}

function getGenderIcon(gender) {
    if (!gender) return 'fas fa-user';
    return gender.toLowerCase() === 'male' ? 'fas fa-mars' : 'fas fa-venus';
}

function formatDate(dateString) {
    if (!dateString) return '';
    try {
        return new Date(dateString).toLocaleDateString();
    } catch {
        return '';
    }
}

function showPatientDetails(patient) {
    const age = calculateAge(patient.birthDate);
    const conditions = patient.data?.condition || [];
    const observations = patient.data?.observation || [];
    const vitalSigns = patient.data?.vital_signs || [];
    const allReadings = [...observations, ...vitalSigns].sort((a, b) => 
        new Date(b.date || 0) - new Date(a.date || 0)
    );

    document.getElementById('patientDetailTitle').textContent = `${patient.name} - Detailed Overview`;
    
    const modalBody = document.getElementById('patientDetailBody');
    modalBody.innerHTML = `
        <div class="detail-section">
            <div class="detail-section-title">
                <i class="fas fa-user"></i>
                Patient Information
            </div>
            <div class="detail-grid">
                <div class="detail-item">
                    <div class="detail-item-label">Full Name</div>
                    <div class="detail-item-value">${patient.name || 'Unknown'}</div>
                </div>
                <div class="detail-item">
                    <div class="detail-item-label">Age</div>
                    <div class="detail-item-value">${age} years old</div>
                </div>
                <div class="detail-item">
                    <div class="detail-item-label">Gender</div>
                    <div class="detail-item-value">
                        <i class="${getGenderIcon(patient.gender)} me-2"></i>${patient.gender || 'Unknown'}
                    </div>
                </div>
                <div class="detail-item">
                    <div class="detail-item-label">Date of Birth</div>
                    <div class="detail-item-value">${formatDate(patient.birthDate) || 'Unknown'}</div>
                </div>
            </div>
        </div>

        <div class="detail-section">
            <div class="detail-section-title">
                <i class="fas fa-stethoscope"></i>
                Chronic Conditions
            </div>
            <div class="mb-3">
                ${conditions.length > 0 ? conditions.map(condition => `
                    <span class="condition-badge ${getConditionBadgeClass(condition.name)}">
                        ${condition.name || 'Unknown Condition'}
                    </span>
                `).join('') : '<span class="text-muted">No conditions recorded</span>'}
            </div>
        </div>

        <div class="detail-section">
            <div class="detail-section-title">
                <i class="fas fa-chart-line"></i>
                Medical Readings & Observations
            </div>
            <div class="observations-list">
                ${allReadings.length > 0 ? allReadings.map(reading => `
                    <div class="observation-item">
                        <div class="observation-name">${reading.name || 'Unknown Reading'}</div>
                        <div class="observation-details">
                            ${reading.value ? `Value: ${reading.value}` : ''}
                            ${reading.unit ? ` ${reading.unit}` : ''}
                            ${reading.date ? `• Date: ${formatDate(reading.date)}` : ''}
                            ${reading.category ? `• Category: ${reading.category}` : ''}
                        </div>
                    </div>
                `).join('') : '<div class="text-muted">No readings or observations recorded</div>'}
            </div>
        </div>

        <div class="detail-section">
            <div class="detail-section-title">
                <i class="fas fa-info-circle"></i>
                Summary Statistics
            </div>
            <div class="detail-grid">
                <div class="detail-item">
                    <div class="detail-item-label">Total Conditions</div>
                    <div class="detail-item-value">${conditions.length}</div>
                </div>
                <div class="detail-item">
                    <div class="detail-item-label">Total Observations</div>
                    <div class="detail-item-value">${observations.length}</div>
                </div>
                <div class="detail-item">
                    <div class="detail-item-label">Vital Signs Recorded</div>
                    <div class="detail-item-value">${vitalSigns.length}</div>
                </div>
                <div class="detail-item">
                    <div class="detail-item-label">Latest Reading</div>
                    <div class="detail-item-value">
                        ${allReadings.length > 0 ? formatDate(allReadings[0].date) : 'None'}
                    </div>
                </div>
            </div>
        </div>
    `;

    const modal = new bootstrap.Modal(document.getElementById('patientDetailModal'));
    modal.show();
}

function renderPatientCard(patient) {
    const age = calculateAge(patient.birthDate);
    const conditions = patient.data?.condition || [];
    const observations = patient.data?.observation || [];
    const vitalSigns = patient.data?.vital_signs || [];
    
    // Get latest observation or vital sign
    const latestReading = observations.length > 0 ? observations[0] : 
                         (vitalSigns.length > 0 ? vitalSigns[0] : null);
    
    return `
        <div class="col-lg-6 col-xl-4">
            <div class="patient-card" onclick="showPatientDetails(${JSON.stringify(patient).replace(/"/g, '&quot;')})">
                <div class="patient-header">
                    <div class="patient-name">${patient.name || 'Unknown Patient'}</div>
                    <div class="patient-info">
                        <span><i class="${getGenderIcon(patient.gender)} gender-icon me-1"></i>${patient.gender || 'Unknown'}</span>
                        <span class="age-badge">${age} years old</span>
                        <span class="text-muted">${formatDate(patient.birthDate)}</span>
                    </div>
                </div>
                <div class="patient-body">
                    <div class="mb-3">
                        <div class="mb-2" style="font-size: 13px; font-weight: 500; color: #374151;">
                            <i class="fas fa-stethoscope text-danger me-2"></i>Chronic Conditions
                        </div>
                        ${conditions.map(condition => `
                            <span class="condition-badge ${getConditionBadgeClass(condition.name)}">
                                ${condition.name || 'Unknown Condition'}
                            </span>
                        `).join('')}
                    </div>
                    
                    ${latestReading ? `
                        <div class="latest-reading">
                            <div class="latest-reading-label">
                                <i class="fas fa-chart-line me-1"></i>Latest Reading
                            </div>
                            <div class="latest-reading-value">
                                ${latestReading.name || 'Unknown'} ${latestReading.date ? `• ${formatDate(latestReading.date)}` : ''}
                            </div>
                        </div>
                    ` : ''}
                </div>
            </div>
        </div>
    `;
}

function updateStats(patients) {
    const totalPatients = patients.length;
    const avgAge = totalPatients > 0 ? 
        Math.round(patients.reduce((sum, p) => sum + calculateAge(p.birthDate), 0) / totalPatients) : 0;
    
    const allConditions = patients.flatMap(p => p.data?.condition || []);
    const conditionCount = allConditions.length;
    
    document.getElementById('totalPatients').textContent = totalPatients;
    document.getElementById('avgAge').textContent = avgAge;
    document.getElementById('conditionCount').textContent = conditionCount;
}

function loadChronicDiseasePatients() {
    if (!window.PATIENT_DATA) {
        document.getElementById('noDataMessage').style.display = 'block';
        return;
    }
    
    const data = window.PATIENT_DATA;
    
    // Check if we're in "all patients" mode
    if (data.patient?.id !== 'all' || !data.patients) {
        document.getElementById('noDataMessage').style.display = 'block';
        return;
    }
    
    // Filter patients: age 45+ AND has chronic conditions
    const chronicPatients = data.patients.filter(patient => {
        const age = calculateAge(patient.birthDate);
        const conditions = patient.data?.condition || [];
        
        const hasChronicCondition = conditions.some(condition => 
            isChronicCondition(condition.name)
        );
        
        return age >= 45 && hasChronicCondition;
    });
    
    const container = document.getElementById('patientsContainer');
    const noDataMessage = document.getElementById('noDataMessage');
    
    if (chronicPatients.length === 0) {
        container.innerHTML = '';
        noDataMessage.style.display = 'block';
        updateStats([]);
        return;
    }
    
    // Sort by age (oldest first)
    chronicPatients.sort((a, b) => calculateAge(b.birthDate) - calculateAge(a.birthDate));
    
    container.innerHTML = chronicPatients.map(renderPatientCard).join('');
    noDataMessage.style.display = 'none';
    updateStats(chronicPatients);

    // Auto-show John Smith's details if he exists
    const johnSmith = chronicPatients.find(p => 
        p.name && p.name.toLowerCase().includes('john smith')
    );
    if (johnSmith) {
        setTimeout(() => showPatientDetails(johnSmith), 500);
    }
}

// Initialize when page loads
document.addEventListener('DOMContentLoaded', loadChronicDiseasePatients);