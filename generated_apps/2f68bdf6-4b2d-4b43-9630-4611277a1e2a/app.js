// Chronic diseases list
const CHRONIC_DISEASES = [
    'hypertension', 'diabetes', 'asthma', 'copd', 'depression', 'dementia',
    'breast cancer', 'cancer', 'ckd', 'chronic kidney disease', 'psoriasis',
    'ulcerative colitis', 'hypothyroidism', 'rheumatoid arthritis', 'ra',
    'glaucoma', 'anemia', 'migraine', 'gestational diabetes'
];

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

function isChronicDisease(conditionName) {
    if (!conditionName) return false;
    const name = conditionName.toLowerCase();
    return CHRONIC_DISEASES.some(chronic => name.includes(chronic));
}

function formatDate(dateString) {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'short', 
        day: 'numeric' 
    });
}

function createPatientCard(patient) {
    const age = calculateAge(patient.birthDate);
    const genderClass = patient.gender === 'male' ? 'male' : 'female';
    const genderIcon = patient.gender === 'male' ? 'fas fa-mars' : 'fas fa-venus';
    
    // Get chronic conditions
    const chronicConditions = patient.data.condition?.filter(condition => 
        isChronicDisease(condition.name)
    ) || [];
    
    const conditionsHtml = chronicConditions.length > 0 
        ? chronicConditions.map(condition => `
            <div class="condition-item">
                <span class="condition-name">${condition.name || 'Unknown condition'}</span>
                <span class="chronic-badge">Chronic</span>
                ${condition.date ? `<span class="condition-date">${formatDate(condition.date)}</span>` : ''}
            </div>
        `).join('')
        : '<div class="text-muted" style="font-size: 13px;">No chronic conditions recorded</div>';
    
    const medicationsHtml = patient.data.medicationrequest?.length > 0
        ? patient.data.medicationrequest.map(med => `
            <div class="medication-item">
                <span class="medication-name">${med.name || 'Unknown medication'}</span>
                ${med.value ? `<span class="medication-dosage">${med.value}</span>` : ''}
            </div>
        `).join('')
        : '<div class="text-muted" style="font-size: 13px;">No medications recorded</div>';
    
    const vitalsHtml = patient.data.vital_signs?.length > 0
        ? patient.data.vital_signs.map(vital => `
            <div class="vital-item">
                <span class="vital-name">${vital.name || 'Unknown vital'}</span>
                ${vital.value ? `<span class="vital-value">${vital.value}</span>` : ''}
            </div>
        `).join('')
        : '<div class="text-muted" style="font-size: 13px;">No vital signs recorded</div>';
    
    return `
        <div class="col-lg-6 col-xl-4">
            <div class="patient-card">
                <div class="patient-header">
                    <div class="patient-avatar ${genderClass}">
                        <i class="${genderIcon}"></i>
                    </div>
                    <div class="patient-info flex-grow-1">
                        <h3>${patient.name || 'Unknown Patient'}</h3>
                        <div class="patient-meta">
                            ID: ${patient.id || 'Unknown'}
                            <span class="age-badge">Age ${age !== null ? age : 'Unknown'}</span>
                        </div>
                    </div>
                </div>
                
                <div class="conditions-section">
                    <div class="section-title">
                        <i class="fas fa-heartbeat text-danger"></i>
                        Chronic Conditions (${chronicConditions.length})
                    </div>
                    ${conditionsHtml}
                </div>
                
                <div class="medications-section">
                    <div class="section-title">
                        <i class="fas fa-pills text-primary"></i>
                        Medications
                    </div>
                    ${medicationsHtml}
                </div>
                
                <div class="vitals-section">
                    <div class="section-title">
                        <i class="fas fa-chart-line text-success"></i>
                        Latest Vitals
                    </div>
                    ${vitalsHtml}
                </div>
            </div>
        </div>
    `;
}

function loadChronicPatients() {
    if (!window.PATIENT_DATA) {
        document.getElementById('noDataMessage').style.display = 'block';
        return;
    }
    
    const data = window.PATIENT_DATA;
    
    if (data.patient.id !== 'all') {
        document.getElementById('noDataMessage').style.display = 'block';
        return;
    }
    
    // Filter patients aged 30 with chronic diseases
    const chronicPatients = data.patients.filter(patient => {
        const age = calculateAge(patient.birthDate);
        const hasChronicCondition = patient.data.condition?.some(condition => 
            isChronicDisease(condition.name)
        );
        
        return age === 30 && hasChronicCondition;
    });
    
    // Update statistics
    const totalChronicConditions = chronicPatients.reduce((total, patient) => {
        const chronicCount = patient.data.condition?.filter(condition => 
            isChronicDisease(condition.name)
        ).length || 0;
        return total + chronicCount;
    }, 0);
    
    document.getElementById('totalPatients').textContent = chronicPatients.length;
    document.getElementById('chronicConditions').textContent = totalChronicConditions;
    
    const container = document.getElementById('patientsContainer');
    
    if (chronicPatients.length === 0) {
        document.getElementById('noDataMessage').style.display = 'block';
        return;
    }
    
    // Sort patients by name
    chronicPatients.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
    
    // Generate patient cards
    container.innerHTML = chronicPatients.map(patient => createPatientCard(patient)).join('');
}

// Initialize when page loads
document.addEventListener('DOMContentLoaded', function() {
    loadChronicPatients();
});