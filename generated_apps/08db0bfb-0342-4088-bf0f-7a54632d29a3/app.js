document.addEventListener('DOMContentLoaded', function() {
    if (!window.PATIENT_DATA) {
        console.error('Patient data not available');
        showNoData();
        return;
    }

    const data = window.PATIENT_DATA;
    
    if (data.patient && data.patient.id === 'all') {
        renderAllPatientsView(data);
    } else {
        renderSinglePatientView(data);
    }
});

function renderSinglePatientView(data) {
    renderPatientInfo(data.patient);
    renderStressMetrics(data);
    renderMentalHealthMetrics(data);
    renderSleepMetrics(data);
    renderMeditationRecommendations(data);
    renderSessionTracker(data);
    renderConditions(data);
    renderMedications(data);
    renderObservations(data);
}

function renderAllPatientsView(data) {
    if (!data.patients || data.patients.length === 0) {
        showNoData();
        return;
    }

    renderAllPatientsInfo(data.patients);
    renderAllPatientsMetrics(data.patients);
    renderAllPatientsClinicalData(data.patients);
}

function renderPatientInfo(patient) {
    const container = document.getElementById('patient-info');
    if (!patient) {
        container.innerHTML = '<div class="no-data"><i class="fas fa-user-slash"></i><p>No patient data available</p></div>';
        return;
    }

    container.innerHTML = `
        <div class="patient-detail">
            <h6>Patient Name</h6>
            <div class="value">${patient.name || 'No data available'}</div>
        </div>
        <div class="patient-detail">
            <h6>Gender</h6>
            <div class="value">${patient.gender || 'No data available'}</div>
        </div>
        <div class="patient-detail">
            <h6>Date of Birth</h6>
            <div class="value">${formatDate(patient.birthDate) || 'No data available'}</div>
        </div>
        <div class="patient-detail">
            <h6>Age</h6>
            <div class="value">${calculateAge(patient.birthDate) || 'No data available'}</div>
        </div>
    `;
}

function renderAllPatientsInfo(patients) {
    const container = document.getElementById('patient-info');
    container.innerHTML = `
        <div class="patient-detail">
            <h6>Total Patients</h6>
            <div class="value">${patients.length}</div>
        </div>
        <div class="patient-detail">
            <h6>Active Cases</h6>
            <div class="value">${countActiveCases(patients)}</div>
        </div>
        <div class="patient-detail">
            <h6>Conditions Tracked</h6>
            <div class="value">${countTotalConditions(patients)}</div>
        </div>
        <div class="patient-detail">
            <h6>Recent Observations</h6>
            <div class="value">${countTotalObservations(patients)}</div>
        </div>
    `;
}

function renderStressMetrics(data) {
    const container = document.getElementById('stress-metrics');
    const stressIndicators = getStressRelatedObservations(data);
    
    if (stressIndicators.length === 0) {
        container.innerHTML = '<div class="text-muted">No stress data available</div>';
        return;
    }

    container.innerHTML = stressIndicators.map(obs => `
        <div class="mb-2">
            <strong>${obs.name}</strong><br>
            <span class="text-muted">${obs.value || 'No value'}</span>
        </div>
    `).join('');
}

function renderMentalHealthMetrics(data) {
    const container = document.getElementById('mental-health-metrics');
    const mentalHealthObs = getMentalHealthObservations(data);
    
    if (mentalHealthObs.length === 0) {
        container.innerHTML = '<div class="text-muted">No mental health data available</div>';
        return;
    }

    container.innerHTML = mentalHealthObs.map(obs => `
        <div class="mb-2">
            <strong>${obs.name}</strong><br>
            <span class="text-muted">${obs.value || 'No value'}</span>
        </div>
    `).join('');
}

function renderSleepMetrics(data) {
    const container = document.getElementById('sleep-metrics');
    const sleepObs = getSleepRelatedObservations(data);
    
    if (sleepObs.length === 0) {
        container.innerHTML = '<div class="text-muted">No sleep data available</div>';
        return;
    }

    container.innerHTML = sleepObs.map(obs => `
        <div class="mb-2">
            <strong>${obs.name}</strong><br>
            <span class="text-muted">${obs.value || 'No value'}</span>
        </div>
    `).join('');
}

function renderMeditationRecommendations(data) {
    const container = document.getElementById('meditation-recommendations');
    const conditions = data.condition || [];
    const recommendations = generateMeditationRecommendations(conditions);
    
    if (recommendations.length === 0) {
        container.innerHTML = '<div class="no-data"><i class="fas fa-spa"></i><p>No specific recommendations available</p></div>';
        return;
    }

    container.innerHTML = recommendations.map(rec => `
        <div class="recommendation-card">
            <h6><i class="${rec.icon} icon text-teal"></i>${rec.title}</h6>
            <p>${rec.description}</p>
            <span class="recommendation-badge">${rec.duration}</span>
        </div>
    `).join('');
}

function renderSessionTracker(data) {
    const container = document.getElementById('session-tracker');
    const encounters = data.encounter || [];
    
    container.innerHTML = `
        <div class="session-stat">
            <span class="number">${encounters.length}</span>
            <span class="label">Clinical Sessions</span>
        </div>
        <div class="session-stat">
            <span class="number">${getRecentEncounters(encounters)}</span>
            <span class="label">This Month</span>
        </div>
    `;
}

function renderConditions(data) {
    const container = document.getElementById('conditions-list');
    const conditions = data.condition || [];
    
    if (conditions.length === 0) {
        container.innerHTML = '<div class="no-data"><i class="fas fa-notes-medical"></i><p>No conditions recorded</p></div>';
        return;
    }

    container.innerHTML = conditions.map(condition => `
        <div class="clinical-item">
            <div>
                <div class="name">${condition.name || 'Unnamed condition'}</div>
                <div class="details">${formatDate(condition.date) || 'No date'}</div>
            </div>
            <span class="badge">${condition.status || 'Active'}</span>
        </div>
    `).join('');
}

function renderMedications(data) {
    const container = document.getElementById('medications-list');
    const medications = data.medicationrequest || [];
    
    if (medications.length === 0) {
        container.innerHTML = '<div class="no-data"><i class="fas fa-pills"></i><p>No medications recorded</p></div>';
        return;
    }

    container.innerHTML = medications.map(med => `
        <div class="clinical-item">
            <div>
                <div class="name">${med.name || 'Unnamed medication'}</div>
                <div class="details">${med.value || 'No dosage information'}</div>
            </div>
            <span class="badge">${med.status || 'Active'}</span>
        </div>
    `).join('');
}

function renderObservations(data) {
    const container = document.getElementById('observations-timeline');
    const observations = data.observation || [];
    
    if (observations.length === 0) {
        container.innerHTML = '<div class="no-data"><i class="fas fa-chart-line"></i><p>No observations recorded</p></div>';
        return;
    }

    const sortedObs = observations.sort((a, b) => new Date(b.date) - new Date(a.date));
    
    container.innerHTML = sortedObs.map(obs => `
        <div class="observation-item">
            <div class="observation-header">
                <div class="observation-name">${obs.name || 'Unnamed observation'}</div>
                <div class="observation-date">${formatDate(obs.date) || 'No date'}</div>
            </div>
            <div class="observation-value">${obs.value || 'No value recorded'}</div>
        </div>
    `).join('');
}

function renderAllPatientsMetrics(patients) {
    const stressContainer = document.getElementById('stress-metrics');
    const mentalContainer = document.getElementById('mental-health-metrics');
    const sleepContainer = document.getElementById('sleep-metrics');
    
    let totalStress = 0, totalMental = 0, totalSleep = 0;
    
    patients.forEach(patient => {
        if (patient.data) {
            Object.entries(patient.data).forEach(([resourceType, records]) => {
                if (resourceType === 'observation' && Array.isArray(records)) {
                    records.forEach(obs => {
                        if (isStressRelated(obs.name)) totalStress++;
                        if (isMentalHealthRelated(obs.name)) totalMental++;
                        if (isSleepRelated(obs.name)) totalSleep++;
                    });
                }
            });
        }
    });
    
    stressContainer.innerHTML = `<div class="text-center"><strong>${totalStress}</strong><br><small>Stress indicators</small></div>`;
    mentalContainer.innerHTML = `<div class="text-center"><strong>${totalMental}</strong><br><small>Mental health metrics</small></div>`;
    sleepContainer.innerHTML = `<div class="text-center"><strong>${totalSleep}</strong><br><small>Sleep observations</small></div>`;
}

function renderAllPatientsClinicalData(patients) {
    const conditionsContainer = document.getElementById('conditions-list');
    const medicationsContainer = document.getElementById('medications-list');
    const observationsContainer = document.getElementById('observations-timeline');
    const recommendationsContainer = document.getElementById('meditation-recommendations');
    const sessionContainer = document.getElementById('session-tracker');
    
    let allConditions = [];
    let allMedications = [];
    let allObservations = [];
    let totalEncounters = 0;
    
    patients.forEach(patient => {
        if (patient.data) {
            Object.entries(patient.data).forEach(([resourceType, records]) => {
                if (Array.isArray(records)) {
                    records.forEach(record => {
                        const recordWithPatient = { ...record, patientName: patient.name };
                        
                        if (resourceType === 'condition') {
                            allConditions.push(recordWithPatient);
                        } else if (resourceType === 'medicationrequest') {
                            allMedications.push(recordWithPatient);
                        } else if (resourceType === 'observation') {
                            allObservations.push(recordWithPatient);
                        } else if (resourceType === 'encounter') {
                            totalEncounters++;
                        }
                    });
                }
            });
        }
    });
    
    // Render conditions
    if (allConditions.length === 0) {
        conditionsContainer.innerHTML = '<div class="no-data"><i class="fas fa-notes-medical"></i><p>No conditions recorded</p></div>';
    } else {
        conditionsContainer.innerHTML = allConditions.map(condition => `
            <div class="clinical-item">
                <div>
                    <div class="name">${condition.name || 'Unnamed condition'}</div>
                    <div class="details">${condition.patientName} • ${formatDate(condition.date) || 'No date'}</div>
                </div>
                <span class="badge">${condition.status || 'Active'}</span>
            </div>
        `).join('');
    }
    
    // Render medications
    if (allMedications.length === 0) {
        medicationsContainer.innerHTML = '<div class="no-data"><i class="fas fa-pills"></i><p>No medications recorded</p></div>';
    } else {
        medicationsContainer.innerHTML = allMedications.map(med => `
            <div class="clinical-item">
                <div>
                    <div class="name">${med.name || 'Unnamed medication'}</div>
                    <div class="details">${med.patientName} • ${med.value || 'No dosage'}</div>
                </div>
                <span class="badge">${med.status || 'Active'}</span>
            </div>
        `).join('');
    }
    
    // Render observations
    if (allObservations.length === 0) {
        observationsContainer.innerHTML = '<div class="no-data"><i class="fas fa-chart-line"></i><p>No observations recorded</p></div>';
    } else {
        const sortedObs = allObservations.sort((a, b) => new Date(b.date) - new Date(a.date));
        observationsContainer.innerHTML = sortedObs.map(obs => `
            <div class="observation-item">
                <div class="observation-header">
                    <div class="observation-name">${obs.name || 'Unnamed observation'}</div>
                    <div class="observation-date">${formatDate(obs.date) || 'No date'}</div>
                </div>
                <div class="observation-value">${obs.value || 'No value'} • ${obs.patientName}</div>
            </div>
        `).join('');
    }
    
    // Render session tracker
    sessionContainer.innerHTML = `
        <div class="session-stat">
            <span class="number">${totalEncounters}</span>
            <span class="label">Total Sessions</span>
        </div>
        <div class="session-stat">
            <span class="number">${patients.length}</span>
            <span class="label">Active Patients</span>
        </div>
    `;
    
    // Render general recommendations
    recommendationsContainer.innerHTML = `
        <div class="recommendation-card">
            <h6><i class="fas fa-heart icon text-teal"></i>Stress Reduction</h6>
            <p>Mindfulness meditation for patients with anxiety and stress-related conditions</p>
            <span class="recommendation-badge">10-15 min</span>
        </div>
        <div class="recommendation-card">
            <h6><i class="fas fa-brain icon text-blue"></i>Mental Clarity</h6>
            <p>Focused attention practices for cognitive enhancement and mental health</p>
            <span class="recommendation-badge">15-20 min</span>
        </div>
        <div class="recommendation-card">
            <h6><i class="fas fa-moon icon text-green"></i>Sleep Support</h6>
            <p>Body scan and relaxation techniques for improved sleep quality</p>
            <span class="recommendation-badge">20-30 min</span>
        </div>
    `;
}

// Helper functions
function formatDate(dateString) {
    if (!dateString) return null;
    try {
        return new Date(dateString).toLocaleDateString();
    } catch {
        return dateString;
    }
}

function calculateAge(birthDate) {
    if (!birthDate) return null;
    try {
        const today = new Date();
        const birth = new Date(birthDate);
        let age = today.getFullYear() - birth.getFullYear();
        const monthDiff = today.getMonth() - birth.getMonth();
        if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
            age--;
        }
        return age + ' years';
    } catch {
        return null;
    }
}

function getStressRelatedObservations(data) {
    const observations = data.observation || [];
    return observations.filter(obs => isStressRelated(obs.name));
}

function getMentalHealthObservations(data) {
    const observations = data.observation || [];
    return observations.filter(obs => isMentalHealthRelated(obs.name));
}

function getSleepRelatedObservations(data) {
    const observations = data.observation || [];
    return observations.filter(obs => isSleepRelated(obs.name));
}

function isStressRelated(name) {
    if (!name) return false;
    const stressKeywords = ['stress', 'anxiety', 'bp', 'blood pressure', 'heart rate', 'cortisol'];
    return stressKeywords.some(keyword => name.toLowerCase().includes(keyword));
}

function isMentalHealthRelated(name) {
    if (!name) return false;
    const mentalKeywords = ['phq', 'depression', 'anxiety', 'mood', 'mental', 'cognitive', 'mmse'];
    return mentalKeywords.some(keyword => name.toLowerCase().includes(keyword));
}

function isSleepRelated(name) {
    if (!name) return false;
    const sleepKeywords = ['sleep', 'insomnia', 'fatigue', 'rest', 'tired'];
    return sleepKeywords.some(keyword => name.toLowerCase().includes(keyword));
}

function generateMeditationRecommendations(conditions) {
    const recommendations = [];
    
    conditions.forEach(condition => {
        const conditionName = (condition.name || '').toLowerCase();
        
        if (conditionName.includes('hypertension') || conditionName.includes('blood pressure')) {
            recommendations.push({
                title: 'Breathing Meditation',
                description: 'Deep breathing exercises to help lower blood pressure and reduce cardiovascular stress',
                duration: '10-15 min',
                icon: 'fas fa-lungs'
            });
        }
        
        if (conditionName.includes('depression') || conditionName.includes('anxiety')) {
            recommendations.push({
                title: 'Mindfulness Practice',
                description: 'Present-moment awareness to reduce rumination and anxiety symptoms',
                duration: '15-20 min',
                icon: 'fas fa-brain'
            });
        }
        
        if (conditionName.includes('pain') || conditionName.includes('migraine')) {
            recommendations.push({
                title: 'Body Scan Meditation',
                description: 'Progressive relaxation to manage chronic pain and tension',
                duration: '20-25 min',
                icon: 'fas fa-hand-holding-heart'
            });
        }
        
        if (conditionName.includes('asthma') || conditionName.includes('copd')) {
            recommendations.push({
                title: 'Gentle Breathing',
                description: 'Controlled breathing techniques to improve respiratory function',
                duration: '8-12 min',
                icon: 'fas fa-wind'
            });
        }
    });
    
    // Remove duplicates
    const uniqueRecs = recommendations.filter((rec, index, self) => 
        index === self.findIndex(r => r.title === rec.title)
    );
    
    // Add default recommendations if none specific
    if (uniqueRecs.length === 0) {
        uniqueRecs.push(
            {
                title: 'General Wellness',
                description: 'Basic mindfulness meditation for overall health and wellbeing',
                duration: '10-15 min',
                icon: 'fas fa-heart'
            },
            {
                title: 'Stress Relief',
                description: 'Relaxation techniques for daily stress management',
                duration: '12-18 min',
                icon: 'fas fa-leaf'
            }
        );
    }
    
    return uniqueRecs;
}

function getRecentEncounters(encounters) {
    const oneMonthAgo = new Date();
    oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
    
    return encounters.filter(enc => {
        if (!enc.date) return false;
        try {
            return new Date(enc.date) >= oneMonthAgo;
        } catch {
            return false;
        }
    }).length;
}

function countActiveCases(patients) {
    return patients.filter(patient => 
        patient.data && Object.keys(patient.data).some(key => 
            Array.isArray(patient.data[key]) && patient.data[key].length > 0
        )
    ).length;
}

function countTotalConditions(patients) {
    let total = 0;
    patients.forEach(patient => {
        if (patient.data && patient.data.condition && Array.isArray(patient.data.condition)) {
            total += patient.data.condition.length;
        }
    });
    return total;
}

function countTotalObservations(patients) {
    let total = 0;
    patients.forEach(patient => {
        if (patient.data && patient.data.observation && Array.isArray(patient.data.observation)) {
            total += patient.data.observation.length;
        }
    });
    return total;
}

function showNoData() {
    document.body.innerHTML = `
        <div class="container-fluid d-flex justify-content-center align-items-center" style="height: 100vh;">
            <div class="text-center">
                <i class="fas fa-database text-muted" style="font-size: 3rem; margin-bottom: 1rem;"></i>
                <h3 class="text-muted">No Patient Data Available</h3>
                <p class="text-muted">Please ensure patient data is loaded before accessing the meditation dashboard.</p>
            </div>
        </div>
    `;
}