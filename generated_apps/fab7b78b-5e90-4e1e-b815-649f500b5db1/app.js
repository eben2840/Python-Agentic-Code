// Mock data structure for demonstration
window.PATIENT_DATA = {
    patient: { id: 'all' },
    patients: [
        {
            id: 'pat-27bddf00',
            name: 'Ivy Anderson',
            gender: 'male',
            birthDate: '2000-01-15',
            data: {
                observation: [
                    { name: 'PASI Score 12', value: 'PASI Score 12', date: '2026-03-05T12:00:00Z' }
                ],
                medicationrequest: [
                    { name: 'Treatment for Psoriasis', value: '1 tablet daily', date: null }
                ]
            }
        },
        {
            id: 'pat-0d1bccee',
            name: 'Jack Thomas',
            gender: 'female',
            birthDate: '2000-02-15',
            data: {
                observation: [
                    { name: 'Calprotectin High', value: 'Calprotectin High', date: '2026-03-05T12:00:00Z' }
                ],
                medicationrequest: [
                    { name: 'Treatment for Ulcerative Colitis', value: '1 tablet daily', date: null }
                ]
            }
        },
        {
            id: 'pat-d6b886f9',
            name: 'Kathy White',
            gender: 'male',
            birthDate: '2000-03-15',
            data: {
                observation: [
                    { name: 'TSH 12.5', value: 'TSH 12.5', date: '2026-03-05T12:00:00Z' }
                ],
                medicationrequest: [
                    { name: 'Treatment for Hypothyroidism', value: '1 tablet daily', date: null }
                ]
            }
        },
        {
            id: 'pat-19b55858',
            name: 'Leo Harris',
            gender: 'female',
            birthDate: '2000-04-15',
            data: {
                observation: [
                    { name: 'FEV1 45%', value: 'FEV1 45%', date: '2026-03-05T12:00:00Z' }
                ],
                medicationrequest: [
                    { name: 'Treatment for COPD', value: '1 tablet daily', date: null }
                ]
            }
        },
        {
            id: 'pat-940581ad',
            name: 'Mia Martin',
            gender: 'male',
            birthDate: '2000-05-15',
            data: {
                observation: [
                    { name: 'DAS28 5.2', value: 'DAS28 5.2', date: '2026-03-05T12:00:00Z' }
                ],
                medicationrequest: [
                    { name: 'Treatment for RA', value: '1 tablet daily', date: null }
                ]
            }
        },
        {
            id: 'pat-c4f9e86e',
            name: 'Noah Garcia',
            gender: 'female',
            birthDate: '2010-01-15',
            data: {
                observation: [
                    { name: 'Sputum Positive', value: 'Sputum Positive', date: '2026-03-05T12:00:00Z' }
                ],
                medicationrequest: [
                    { name: 'Treatment for TB', value: '1 tablet daily', date: null }
                ]
            }
        },
        {
            id: 'pat-eb8d33ea',
            name: 'Olivia Rodriguez',
            gender: 'male',
            birthDate: '2010-02-15',
            data: {
                observation: [
                    { name: 'eGFR 22', value: 'eGFR 22', date: '2026-03-05T12:00:00Z' }
                ],
                medicationrequest: [
                    { name: 'Treatment for CKD Stage 4', value: '1 tablet daily', date: null }
                ]
            }
        },
        {
            id: 'pat-ac397096',
            name: 'Paul Lewis',
            gender: 'female',
            birthDate: '2010-03-15',
            data: {
                observation: [
                    { name: 'Hb 8.2', value: 'Hb 8.2', date: '2026-03-05T12:00:00Z' }
                ],
                medicationrequest: [
                    { name: 'Treatment for Anemia', value: '1 tablet daily', date: null }
                ]
            }
        },
        {
            id: 'pat-7e8e680c',
            name: 'Quinn Walker',
            gender: 'male',
            birthDate: '2010-04-15',
            data: {
                observation: [
                    { name: 'IOP 24', value: 'IOP 24', date: '2026-03-05T12:00:00Z' }
                ],
                medicationrequest: [
                    { name: 'Treatment for Glaucoma', value: '1 tablet daily', date: null }
                ]
            }
        },
        {
            id: 'pat-9f93d195',
            name: 'Rose Hall',
            gender: 'female',
            birthDate: '2010-05-15',
            data: {
                observation: [
                    { name: 'WBC 14', value: 'WBC 14', date: '2026-03-05T12:00:00Z' }
                ],
                medicationrequest: [
                    { name: 'Treatment for Tonsillitis', value: '1 tablet daily', date: null }
                ]
            }
        }
    ]
};

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

function formatDate(dateString) {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

function renderObservations(observations) {
    if (!observations || observations.length === 0) {
        return '<div class="no-data"><i class="fas fa-chart-line me-2"></i>No observations available</div>';
    }

    return observations.map(obs => `
        <div class="data-item">
            <div class="data-item-name">${obs.name || 'Unknown Observation'}</div>
            ${obs.value ? `<div class="data-item-value"><strong>Value:</strong> ${obs.value}</div>` : ''}
            ${obs.date ? `<div class="data-item-date"><i class="fas fa-clock me-1"></i>${formatDate(obs.date)}</div>` : ''}
        </div>
    `).join('');
}

function renderMedications(medications) {
    if (!medications || medications.length === 0) {
        return '<div class="no-data"><i class="fas fa-pills me-2"></i>No medications available</div>';
    }

    return medications.map(med => `
        <div class="data-item">
            <div class="data-item-name">${med.name || 'Unknown Medication'}</div>
            ${med.value ? `<div class="data-item-value"><strong>Dosage:</strong> ${med.value}</div>` : ''}
            ${med.date ? `<div class="data-item-date"><i class="fas fa-clock me-1"></i>${formatDate(med.date)}</div>` : ''}
        </div>
    `).join('');
}

function renderPatientCard(patient) {
    const age = calculateAge(patient.birthDate);
    const genderIcon = patient.gender === 'male' ? 'fas fa-mars' : 'fas fa-venus';
    
    return `
        <div class="patient-card">
            <div class="patient-header">
                <div class="d-flex justify-content-between align-items-start">
                    <div>
                        <div class="patient-name">
                            <i class="${genderIcon} me-2"></i>${patient.name || 'Unknown Patient'}
                        </div>
                        <div class="patient-info">
                            <span class="me-3">
                                <i class="fas fa-birthday-cake me-1"></i>
                                ${patient.birthDate ? new Date(patient.birthDate).toLocaleDateString() : 'Unknown DOB'}
                            </span>
                            <span class="me-3">
                                <i class="fas fa-id-card me-1"></i>
                                ${patient.id || 'Unknown ID'}
                            </span>
                        </div>
                    </div>
                    ${age !== null ? `<span class="age-badge">${age} years old</span>` : ''}
                </div>
            </div>
            
            <div class="data-section">
                <div class="section-title">
                    <i class="fas fa-chart-line"></i>
                    Observations
                </div>
                ${renderObservations(patient.data?.observation)}
                
                <div class="divider"></div>
                
                <div class="section-title">
                    <i class="fas fa-pills"></i>
                    Medications
                </div>
                ${renderMedications(patient.data?.medicationrequest)}
            </div>
        </div>
    `;
}

function loadYoungPatients() {
    const container = document.getElementById('patientsContainer');
    
    if (!window.PATIENT_DATA || !window.PATIENT_DATA.patients) {
        container.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-exclamation-triangle"></i>
                <h3>No Patient Data Available</h3>
                <p>Unable to load patient information.</p>
            </div>
        `;
        return;
    }

    // Filter patients under 30 years old
    const youngPatients = window.PATIENT_DATA.patients.filter(patient => {
        const age = calculateAge(patient.birthDate);
        return age !== null && age < 30;
    });

    if (youngPatients.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-user-clock"></i>
                <h3>No Young Patients Found</h3>
                <p>No patients under 30 years old found in the system.</p>
            </div>
        `;
        return;
    }

    // Sort by age (youngest first)
    youngPatients.sort((a, b) => {
        const ageA = calculateAge(a.birthDate);
        const ageB = calculateAge(b.birthDate);
        return ageA - ageB;
    });

    container.innerHTML = youngPatients.map(patient => renderPatientCard(patient)).join('');
}

// Initialize the app when the page loads
document.addEventListener('DOMContentLoaded', function() {
    loadYoungPatients();
});