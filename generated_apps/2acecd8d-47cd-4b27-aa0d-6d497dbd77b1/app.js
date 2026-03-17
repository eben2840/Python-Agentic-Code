document.addEventListener('DOMContentLoaded', function() {
    // Check if patient data exists
    if (!window.PATIENT_DATA) {
        console.error('Patient data not available');
        document.getElementById('patient-info').textContent = 'Patient data not available';
        return;
    }

    const data = window.PATIENT_DATA;
    
    // Initialize the pain tracker
    initializePainTracker(data);
});

function initializePainTracker(data) {
    // Handle all patients view
    if (data.patient && data.patient.id === 'all') {
        displayAllPatientsView(data);
        return;
    }

    // Single patient view
    displayPatientInfo(data.patient);
    displayPainScale();
    displayPainAssessments(data);
    displayPainMedications(data);
    displayPostopStatus(data);
}

function displayAllPatientsView(data) {
    document.getElementById('patient-info').textContent = 'All Patients - Pain Assessment Overview';
    
    if (!data.patients || data.patients.length === 0) {
        document.getElementById('pain-history').innerHTML = '<p class="text-muted">No patient data available</p>';
        return;
    }

    // Find patients with pain-related conditions or observations
    const painPatients = data.patients.filter(patient => {
        const hasConditions = patient.data.condition && patient.data.condition.some(c => 
            c.name && (c.name.toLowerCase().includes('pain') || 
                      c.name.toLowerCase().includes('fractur') ||
                      c.name.toLowerCase().includes('migraine'))
        );
        const hasPainObs = patient.data.observation && patient.data.observation.some(o =>
            o.name && (o.name.toLowerCase().includes('pain') || 
                      o.name.toLowerCase().includes('vas') ||
                      o.name.toLowerCase().includes('scale'))
        );
        return hasConditions || hasPainObs;
    });

    displayPainPatientsOverview(painPatients);
}

function displayPainPatientsOverview(patients) {
    if (patients.length === 0) {
        document.getElementById('pain-history').innerHTML = '<p class="text-muted">No patients with pain assessments found</p>';
        document.getElementById('current-pain').textContent = '0';
        document.getElementById('pain-trend').textContent = 'No data';
        return;
    }

    document.getElementById('current-pain').textContent = patients.length;
    document.getElementById('pain-trend').innerHTML = '<i class="fas fa-users text-info"></i>';
    
    let historyHtml = '<div class="row">';
    
    patients.forEach(patient => {
        const painScore = extractPainScore(patient);
        const painLevel = getPainLevel(painScore);
        const condition = patient.data.condition ? patient.data.condition[0]?.name || 'Unknown condition' : 'No condition';
        
        historyHtml += `
            <div class="col-md-6 mb-3">
                <div class="card">
                    <div class="card-body">
                        <div class="d-flex justify-content-between align-items-start mb-2">
                            <h6 class="mb-1">${patient.name || 'Unknown Patient'}</h6>
                            <span class="pain-score ${painLevel}">${painScore}/10</span>
                        </div>
                        <p class="text-muted mb-2" style="font-size: 12px;">
                            <i class="fas fa-user me-1"></i>
                            ${patient.gender || 'Unknown'} • ${calculateAge(patient.birthDate)}
                        </p>
                        <p class="mb-1" style="font-size: 13px;">
                            <i class="fas fa-stethoscope me-1 text-primary"></i>
                            ${condition}
                        </p>
                        ${patient.data.observation && patient.data.observation[0] ? `
                            <small class="text-muted">
                                <i class="fas fa-clock me-1"></i>
                                ${formatDate(patient.data.observation[0].date)}
                            </small>
                        ` : ''}
                    </div>
                </div>
            </div>
        `;
    });
    
    historyHtml += '</div>';
    document.getElementById('pain-history').innerHTML = historyHtml;
    
    // Update medication status
    const totalMedications = patients.reduce((sum, p) => 
        sum + (p.data.medicationrequest ? p.data.medicationrequest.length : 0), 0);
    document.getElementById('medication-status').innerHTML = `
        <h6 class="mb-0">${totalMedications}</h6>
        <small class="text-muted">active prescriptions</small>
    `;
}

function displayPatientInfo(patient) {
    if (!patient) {
        document.getElementById('patient-info').textContent = 'Patient information not available';
        return;
    }
    
    const age = calculateAge(patient.birthDate);
    const gender = patient.gender || 'Unknown';
    
    document.getElementById('patient-info').textContent = 
        `${patient.name || 'Unknown Patient'} • ${gender} • Age ${age}`;
}

function displayPainScale() {
    const scaleContainer = document.getElementById('pain-scale');
    let scaleHtml = '';
    
    for (let i = 0; i <= 10; i++) {
        const level = getPainLevel(i);
        scaleHtml += `
            <div class="pain-level ${level}" data-score="${i}">
                ${i}
            </div>
        `;
    }
    
    scaleContainer.innerHTML = scaleHtml;
}

function displayPainAssessments(data) {
    const currentPainEl = document.getElementById('current-pain');
    const trendEl = document.getElementById('pain-trend');
    const lastAssessmentEl = document.getElementById('last-assessment');
    const historyEl = document.getElementById('pain-history');
    
    // Get pain-related observations
    const painObservations = [];
    
    if (data.observation && data.observation.summary) {
        data.observation.summary.forEach(obs => {
            if (obs.name && (obs.name.toLowerCase().includes('pain') || 
                           obs.name.toLowerCase().includes('vas') ||
                           obs.name.toLowerCase().includes('scale'))) {
                painObservations.push(obs);
            }
        });
    }
    
    if (data.vital_signs && data.vital_signs.summary) {
        data.vital_signs.summary.forEach(vital => {
            if (vital.name && (vital.name.toLowerCase().includes('pain') || 
                             vital.name.toLowerCase().includes('vas') ||
                             vital.name.toLowerCase().includes('scale'))) {
                painObservations.push(vital);
            }
        });
    }
    
    if (painObservations.length === 0) {
        currentPainEl.textContent = '--';
        trendEl.textContent = 'No data';
        lastAssessmentEl.textContent = 'No assessments';
        historyEl.innerHTML = '<p class="text-muted">No pain assessments available</p>';
        return;
    }
    
    // Get current pain score
    const latestPain = painObservations[0];
    const currentScore = extractPainScore({ data: { observation: [latestPain] } });
    
    currentPainEl.textContent = currentScore;
    
    // Update pain scale visual
    updatePainScaleVisual(currentScore);
    
    // Show trend (simplified)
    if (painObservations.length > 1) {
        const previousScore = extractPainScore({ data: { observation: [painObservations[1]] } });
        const trend = currentScore - previousScore;
        
        if (trend > 0) {
            trendEl.innerHTML = `<i class="fas fa-arrow-up text-danger"></i> +${trend}`;
        } else if (trend < 0) {
            trendEl.innerHTML = `<i class="fas fa-arrow-down text-success"></i> ${trend}`;
        } else {
            trendEl.innerHTML = `<i class="fas fa-minus text-muted"></i> Stable`;
        }
    } else {
        trendEl.textContent = 'No trend';
    }
    
    // Last assessment time
    if (latestPain.date) {
        lastAssessmentEl.innerHTML = `
            <div>${formatDate(latestPain.date)}</div>
        `;
    } else {
        lastAssessmentEl.textContent = 'Unknown';
    }
    
    // Display history
    displayPainHistory(painObservations);
}

function displayPainHistory(observations) {
    const historyEl = document.getElementById('pain-history');
    
    if (observations.length === 0) {
        historyEl.innerHTML = '<p class="text-muted">No pain assessments available</p>';
        return;
    }
    
    let historyHtml = '';
    
    observations.forEach(obs => {
        const score = extractPainScore({ data: { observation: [obs] } });
        const level = getPainLevel(score);
        const date = obs.date ? formatDate(obs.date) : 'Unknown date';
        
        historyHtml += `
            <div class="pain-entry ${level}">
                <div class="d-flex justify-content-between align-items-center mb-1">
                    <h6 class="mb-0">${obs.name || 'Pain Assessment'}</h6>
                    <span class="pain-score ${level}">${score}/10</span>
                </div>
                <small class="text-muted">
                    <i class="fas fa-clock me-1"></i>
                    ${date}
                </small>
                ${obs.value && obs.value !== obs.name ? `
                    <p class="mb-0 mt-1" style="font-size: 13px;">${obs.value}</p>
                ` : ''}
            </div>
        `;
    });
    
    historyEl.innerHTML = historyHtml;
}

function displayPainMedications(data) {
    const medicationsEl = document.getElementById('pain-medications');
    const statusEl = document.getElementById('medication-status');
    
    if (!data.medicationrequest || !data.medicationrequest.summary || data.medicationrequest.summary.length === 0) {
        medicationsEl.innerHTML = '<p class="text-muted">No medications available</p>';
        statusEl.innerHTML = '<h6 class="mb-0">--</h6>';
        return;
    }
    
    const medications = data.medicationrequest.summary;
    let medicationsHtml = '';
    
    medications.forEach(med => {
        medicationsHtml += `
            <div class="medication-item">
                <h6>${med.name || 'Unknown Medication'}</h6>
                <small>
                    ${med.value || 'Dosage not specified'}
                    ${med.status ? `• ${med.status}` : ''}
                </small>
            </div>
        `;
    });
    
    medicationsEl.innerHTML = medicationsHtml;
    
    // Update medication status
    statusEl.innerHTML = `
        <h6 class="mb-0">${medications.length}</h6>
    `;
}

function displayPostopStatus(data) {
    const statusEl = document.getElementById('postop-status');
    
    let statusHtml = '<div class="row">';
    
    // Check for surgical conditions
    const conditions = data.condition && data.condition.summary ? data.condition.summary : [];
    const surgicalConditions = conditions.filter(c => 
        c.name && (c.name.toLowerCase().includes('fractur') || 
                  c.name.toLowerCase().includes('surgery') ||
                  c.name.toLowerCase().includes('postop'))
    );
    
    if (surgicalConditions.length > 0) {
        statusHtml += `
            <div class="col-md-6 mb-3">
                <h6><i class="fas fa-procedures text-primary me-2"></i>Surgical History</h6>
        `;
        
        surgicalConditions.forEach(condition => {
            statusHtml += `
                <div class="mb-2">
                    <div class="d-flex justify-content-between">
                        <span>${condition.name}</span>
                        <span class="status-badge stable">Active</span>
                    </div>
                    ${condition.date ? `<small class="text-muted">Since: ${formatDate(condition.date)}</small>` : ''}
                </div>
            `;
        });
        
        statusHtml += '</div>';
    }
    
    // Check encounters
    if (data.encounter && data.encounter.summary && data.encounter.summary.length > 0) {
        statusHtml += `
            <div class="col-md-6 mb-3">
                <h6><i class="fas fa-hospital text-info me-2"></i>Recent Encounters</h6>
        `;
        
        data.encounter.summary.slice(0, 3).forEach(encounter => {
            statusHtml += `
                <div class="mb-2">
                    <div>Hospital Visit</div>
                    ${encounter.date ? `<small class="text-muted">${formatDate(encounter.date)}</small>` : ''}
                </div>
            `;
        });
        
        statusHtml += '</div>';
    }
    
    statusHtml += '</div>';
    
    if (surgicalConditions.length === 0 && (!data.encounter || !data.encounter.summary)) {
        statusHtml = '<p class="text-muted">No postoperative information available</p>';
    }
    
    statusEl.innerHTML = statusHtml;
}

function updatePainScaleVisual(currentScore) {
    const painLevels = document.querySelectorAll('.pain-level');
    
    painLevels.forEach(level => {
        level.classList.remove('current');
        const score = parseInt(level.dataset.score);
        
        if (score === currentScore) {
            level.classList.add('current');
        }
    });
}

function extractPainScore(patient) {
    // Try to extract numeric pain score from observations
    if (patient.data && patient.data.observation) {
        const observations = Array.isArray(patient.data.observation) ? 
            patient.data.observation : [patient.data.observation];
        
        for (const obs of observations) {
            if (obs.name) {
                // Look for numeric values in pain-related observations
                const match = obs.name.match(/(\d+)/);
                if (match) {
                    const score = parseInt(match[1]);
                    return Math.min(Math.max(score, 0), 10); // Clamp between 0-10
                }
                
                // Check value field
                if (obs.value) {
                    const valueMatch = obs.value.match(/(\d+)/);
                    if (valueMatch) {
                        const score = parseInt(valueMatch[1]);
                        return Math.min(Math.max(score, 0), 10);
                    }
                }
            }
        }
    }
    
    // Default to moderate pain for fractures, mild for others
    if (patient.data && patient.data.condition) {
        const conditions = Array.isArray(patient.data.condition) ? 
            patient.data.condition : [patient.data.condition];
        
        for (const condition of conditions) {
            if (condition.name && condition.name.toLowerCase().includes('fractur')) {
                return 8; // Severe pain for fractures
            }
            if (condition.name && condition.name.toLowerCase().includes('migraine')) {
                return 7; // Severe pain for migraines
            }
        }
    }
    
    return 0; // Default
}

function getPainLevel(score) {
    if (score >= 0 && score <= 3) return 'mild';
    if (score >= 4 && score <= 6) return 'moderate';
    if (score >= 7 && score <= 10) return 'severe';
    return 'mild';
}

function calculateAge(birthDate) {
    if (!birthDate) return 'Unknown';
    
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
    if (!dateString) return 'Unknown date';
    
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffHours / 24);
    
    if (diffHours < 1) {
        return 'Just now';
    } else if (diffHours < 24) {
        return `${diffHours}h ago`;
    } else if (diffDays < 7) {
        return `${diffDays}d ago`;
    } else {
        return date.toLocaleDateString();
    }
}