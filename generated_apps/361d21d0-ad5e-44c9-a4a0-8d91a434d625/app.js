// ENT-related conditions and observations
const ENT_CONDITIONS = [
    'tonsillitis', 'sinusitis', 'otitis', 'laryngitis', 'pharyngitis', 
    'rhinitis', 'hearing loss', 'vertigo', 'throat', 'ear', 'nose',
    'sinus', 'tonsil', 'adenoid', 'vocal cord', 'epiglottis'
];

const ENT_OBSERVATIONS = [
    'hearing', 'audiometry', 'tympanometry', 'throat culture', 
    'nasal', 'sinus', 'vocal', 'laryngoscopy', 'otoscopy',
    'wbc', 'white blood cell', 'throat swab', 'ear exam'
];

function isENTRelated(patient) {
    // Check conditions
    if (patient.data.condition) {
        const hasENTCondition = patient.data.condition.some(condition => 
            ENT_CONDITIONS.some(entTerm => 
                condition.name?.toLowerCase().includes(entTerm.toLowerCase())
            )
        );
        if (hasENTCondition) return true;
    }
    
    // Check observations
    if (patient.data.observation) {
        const hasENTObservation = patient.data.observation.some(obs => 
            ENT_OBSERVATIONS.some(entTerm => 
                obs.name?.toLowerCase().includes(entTerm.toLowerCase())
            )
        );
        if (hasENTObservation) return true;
    }
    
    return false;
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

function calculateAge(birthDate) {
    if (!birthDate) return 'Unknown';
    try {
        const birth = new Date(birthDate);
        const today = new Date();
        let age = today.getFullYear() - birth.getFullYear();
        const monthDiff = today.getMonth() - birth.getMonth();
        if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
            age--;
        }
        return age;
    } catch (e) {
        return 'Unknown';
    }
}

function createPatientCard(patient) {
    const observations = patient.data.observation || [];
    const hasObservations = observations.length > 0;
    
    return `
        <div class="col-lg-6 col-xl-4">
            <div class="patient-card">
                <div class="patient-header">
                    <div class="patient-name">${patient.name || 'Unknown Patient'}</div>
                    <div class="patient-info">
                        <div class="info-item">
                            <i class="fas fa-user"></i>
                            <span class="gender-badge gender-${patient.gender || 'unknown'}">
                                ${patient.gender || 'Unknown'}
                            </span>
                        </div>
                        <div class="info-item">
                            <i class="fas fa-birthday-cake"></i>
                            <span>Age ${calculateAge(patient.birthDate)}</span>
                        </div>
                        <div class="info-item">
                            <i class="fas fa-calendar"></i>
                            <span>${formatDate(patient.birthDate)}</span>
                        </div>
                    </div>
                </div>
                <div class="observations-section">
                    <div class="section-title">
                        <i class="fas fa-chart-line text-teal"></i>
                        Observations (${observations.length})
                    </div>
                    ${hasObservations ? 
                        observations.map(obs => `
                            <div class="observation-item">
                                <div class="observation-name">${obs.name || 'Unknown Observation'}</div>
                                ${obs.value ? `<div class="observation-value">${obs.value}</div>` : ''}
                                <div class="observation-date">${formatDate(obs.date)}</div>
                            </div>
                        `).join('') :
                        '<div class="no-observations">No observations recorded</div>'
                    }
                </div>
            </div>
        </div>
    `;
}

function updateStats(entPatients) {
    const totalPatients = entPatients.length;
    const withObservations = entPatients.filter(p => p.data.observation && p.data.observation.length > 0).length;
    
    document.getElementById('totalPatients').textContent = totalPatients;
    document.getElementById('withObservations').textContent = withObservations;
}

function renderENTPatients() {
    const container = document.getElementById('patientsContainer');
    const noDataMessage = document.getElementById('noDataMessage');
    
    if (!window.PATIENT_DATA) {
        container.innerHTML = '';
        noDataMessage.style.display = 'block';
        updateStats([]);
        return;
    }
    
    const data = window.PATIENT_DATA;
    
    // Handle all patients mode
    if (data.patient && data.patient.id === 'all' && data.patients) {
        const entPatients = data.patients.filter(isENTRelated);
        
        if (entPatients.length === 0) {
            container.innerHTML = '';
            noDataMessage.style.display = 'block';
            updateStats([]);
            return;
        }
        
        // Sort patients by name
        entPatients.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
        
        container.innerHTML = entPatients.map(createPatientCard).join('');
        noDataMessage.style.display = 'none';
        updateStats(entPatients);
    } else {
        // Single patient mode - check if current patient is ENT-related
        const currentPatient = {
            id: data.patient?.id,
            name: data.patient?.name,
            gender: data.patient?.gender,
            birthDate: data.patient?.birthDate,
            data: {
                condition: data.condition?.summary || [],
                observation: data.observation?.summary || []
            }
        };
        
        if (isENTRelated(currentPatient)) {
            container.innerHTML = createPatientCard(currentPatient);
            noDataMessage.style.display = 'none';
            updateStats([currentPatient]);
        } else {
            container.innerHTML = '';
            noDataMessage.style.display = 'block';
            updateStats([]);
        }
    }
}

// Initialize the app when the page loads
document.addEventListener('DOMContentLoaded', function() {
    renderENTPatients();
});

// Re-render if patient data changes
if (window.PATIENT_DATA) {
    renderENTPatients();
}