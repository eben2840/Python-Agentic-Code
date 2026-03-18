// Critical conditions that require immediate attention
const CRITICAL_CONDITIONS = [
    'sepsis', 'chest pain', 'breast cancer', 'fractured femur', 
    'copd', 'ckd stage 4', 'dementia', 'tb', 'anemia'
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

function isCriticalCondition(conditionName) {
    if (!conditionName) return false;
    const name = conditionName.toLowerCase().trim();
    return CRITICAL_CONDITIONS.some(critical => name.includes(critical));
}

function formatDate(dateString) {
    if (!dateString) return 'No date';
    try {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', { 
            year: 'numeric', 
            month: 'short', 
            day: 'numeric' 
        });
    } catch (e) {
        return 'Invalid date';
    }
}

function getPatientInitials(name) {
    if (!name) return '?';
    return name.split(' ').map(n => n.charAt(0)).join('').toUpperCase();
}

function renderPatientCard(patient, criticalConditions) {
    const age = calculateAge(patient.birthDate);
    const initials = getPatientInitials(patient.name);
    const genderClass = patient.gender === 'male' ? 'male' : 'female';
    
    // Get other data
    const observations = patient.data?.observation || [];
    const medications = patient.data?.medicationrequest || [];
    
    return `
        <div class="col-lg-6 col-xl-4 mb-4">
            <div class="patient-card">
                <div class="patient-header">
                    <div class="patient-avatar ${genderClass}">
                        ${initials}
                    </div>
                    <div class="patient-info flex-grow-1">
                        <h3>${patient.name || 'Unknown Patient'}</h3>
                        <div class="patient-meta">
                            ${patient.gender || 'Unknown'} • Born ${formatDate(patient.birthDate)}
                            <span class="age-badge">${age} years</span>
                        </div>
                    </div>
                    <div class="critical-badge">
                        <i class="fas fa-exclamation-triangle me-1"></i>
                        Critical
                    </div>
                </div>
                
                ${criticalConditions.length > 0 ? `
                    <div class="conditions-section">
                        <div class="section-title">
                            <i class="fas fa-stethoscope"></i>
                            Critical Conditions
                        </div>
                        ${criticalConditions.map(condition => `
                            <div class="condition-item">
                                <div class="condition-name">${condition.name || 'Unknown Condition'}</div>
                                <div class="condition-date">Diagnosed: ${formatDate(condition.date)}</div>
                            </div>
                        `).join('')}
                    </div>
                ` : ''}
                
                ${observations.length > 0 ? `
                    <div class="observations-section">
                        <div class="section-title">
                            <i class="fas fa-chart-line"></i>
                            Latest Observations
                        </div>
                        ${observations.slice(0, 3).map(obs => `
                            <div class="observation-item">
                                <div class="observation-name">${obs.name || 'Unknown Observation'}</div>
                                <div class="observation-value">${obs.value || 'No value'}</div>
                                <div class="observation-date">Recorded: ${formatDate(obs.date)}</div>
                            </div>
                        `).join('')}
                    </div>
                ` : ''}
                
                ${medications.length > 0 ? `
                    <div class="medications-section">
                        <div class="section-title">
                            <i class="fas fa-pills"></i>
                            Current Medications
                        </div>
                        ${medications.slice(0, 2).map(med => `
                            <div class="medication-item">
                                <div class="medication-name">${med.name || 'Unknown Medication'}</div>
                                <div class="medication-dosage">${med.value || 'No dosage specified'}</div>
                            </div>
                        `).join('')}
                    </div>
                ` : ''}
            </div>
        </div>
    `;
}

function loadCriticalConditions() {
    try {
        if (!window.PATIENT_DATA) {
            console.error('No patient data available');
            document.getElementById('noDataContainer').style.display = 'block';
            return;
        }

        const data = window.PATIENT_DATA;
        
        if (data.patient && data.patient.id !== 'all') {
            // Single patient view
            console.error('This app requires all patients data');
            document.getElementById('noDataContainer').style.display = 'block';
            return;
        }

        if (!data.patients || !Array.isArray(data.patients)) {
            console.error('No patients array found');
            document.getElementById('noDataContainer').style.display = 'block';
            return;
        }

        // Filter patients 30+ with critical conditions
        const criticalPatients = [];
        
        data.patients.forEach(patient => {
            const age = calculateAge(patient.birthDate);
            if (age >= 30) {
                const conditions = patient.data?.condition || [];
                const criticalConditions = conditions.filter(condition => 
                    isCriticalCondition(condition.name)
                );
                
                if (criticalConditions.length > 0) {
                    criticalPatients.push({
                        ...patient,
                        criticalConditions,
                        age
                    });
                }
            }
        });

        // Update summary statistics
        const totalPatients = criticalPatients.length;
        const totalCriticalConditions = criticalPatients.reduce((sum, p) => sum + p.criticalConditions.length, 0);
        const avgAge = totalPatients > 0 ? Math.round(criticalPatients.reduce((sum, p) => sum + p.age, 0) / totalPatients) : 0;

        document.getElementById('totalPatients').textContent = totalPatients;
        document.getElementById('criticalConditions').textContent = totalCriticalConditions;
        document.getElementById('avgAge').textContent = avgAge > 0 ? `${avgAge} years` : '-';

        // Render patient cards
        const container = document.getElementById('patientsContainer');
        
        if (criticalPatients.length === 0) {
            document.getElementById('noDataContainer').style.display = 'block';
            container.innerHTML = '';
        } else {
            document.getElementById('noDataContainer').style.display = 'none';
            
            // Sort by age (oldest first) then by number of critical conditions
            criticalPatients.sort((a, b) => {
                if (b.criticalConditions.length !== a.criticalConditions.length) {
                    return b.criticalConditions.length - a.criticalConditions.length;
                }
                return b.age - a.age;
            });
            
            container.innerHTML = criticalPatients
                .map(patient => renderPatientCard(patient, patient.criticalConditions))
                .join('');
        }

    } catch (error) {
        console.error('Error loading critical conditions:', error);
        document.getElementById('noDataContainer').style.display = 'block';
        document.getElementById('patientsContainer').innerHTML = '';
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    loadCriticalConditions();
});

// Also try to load immediately in case DOM is already ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', loadCriticalConditions);
} else {
    loadCriticalConditions();
}