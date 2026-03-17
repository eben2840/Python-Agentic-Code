document.addEventListener('DOMContentLoaded', function() {
    if (!window.PATIENT_DATA) {
        console.error('No patient data available');
        return;
    }

    const data = window.PATIENT_DATA;
    
    // Initialize the pain tracker
    initializePainTracker(data);
});

function initializePainTracker(data) {
    // Handle both single patient and all patients mode
    if (data.patient && data.patient.id === 'all') {
        displayAllPatientsMessage();
        return;
    }

    // Single patient mode
    displayPatientInfo(data.patient);
    displayPainAssessments(data);
    displayRelatedInfo(data);
}

function displayAllPatientsMessage() {
    document.getElementById('patientName').textContent = 'All Patients';
    document.getElementById('patientInfo').textContent = 'Please select a specific patient to view pain assessments';
    
    const painHistory = document.getElementById('painHistory');
    painHistory.innerHTML = `
        <div class="text-center text-muted py-4">
            <i class="fas fa-users fa-2x mb-3"></i>
            <p>Pain assessment tracking requires a specific patient selection</p>
            <small>Please navigate to an individual patient to view their pain assessment history</small>
        </div>
    `;
}

function displayPatientInfo(patient) {
    if (!patient) {
        document.getElementById('patientName').textContent = 'Unknown Patient';
        document.getElementById('patientInfo').textContent = 'Patient information not available';
        return;
    }

    document.getElementById('patientName').textContent = patient.name || 'Unknown Patient';
    
    let patientInfo = '';
    if (patient.gender) {
        patientInfo += `${patient.gender.charAt(0).toUpperCase() + patient.gender.slice(1)}`;
    }
    if (patient.birthDate) {
        const age = calculateAge(patient.birthDate);
        patientInfo += patientInfo ? ` • ${age} years old` : `${age} years old`;
    }
    if (patient.id) {
        patientInfo += patientInfo ? ` • ID: ${patient.id}` : `ID: ${patient.id}`;
    }
    
    document.getElementById('patientInfo').textContent = patientInfo || 'Patient information not available';
}

function calculateAge(birthDate) {
    if (!birthDate) return 'Unknown';
    const today = new Date();
    const birth = new Date(birthDate);
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
        age--;
    }
    return age;
}

function displayPainAssessments(data) {
    const painAssessments = extractPainAssessments(data);
    
    if (painAssessments.length === 0) {
        displayNoPainData();
        return;
    }

    updatePainMetrics(painAssessments);
    displayPainHistory(painAssessments);
}

function extractPainAssessments(data) {
    const painAssessments = [];
    
    // Check observations and vital signs for pain-related data
    const sources = ['observation', 'vital_signs'];
    
    sources.forEach(source => {
        if (data[source] && data[source].summary) {
            data[source].summary.forEach(item => {
                if (isPainRelated(item.name)) {
                    painAssessments.push({
                        name: item.name,
                        value: item.value || item.name,
                        date: item.date,
                        status: item.status,
                        source: source
                    });
                }
            });
        }
    });

    // Sort by date (most recent first)
    return painAssessments.sort((a, b) => {
        if (!a.date && !b.date) return 0;
        if (!a.date) return 1;
        if (!b.date) return -1;
        return new Date(b.date) - new Date(a.date);
    });
}

function isPainRelated(name) {
    if (!name) return false;
    const painKeywords = ['pain', 'scale', 'vas', 'nrs', 'ache', 'discomfort', 'hurt'];
    return painKeywords.some(keyword => name.toLowerCase().includes(keyword));
}

function displayNoPainData() {
    document.getElementById('currentPainLevel').textContent = 'N/A';
    document.getElementById('avgPainLevel').textContent = 'N/A';
    document.getElementById('totalAssessments').textContent = '0';
    document.getElementById('lastAssessment').textContent = 'None';
    document.getElementById('historyCount').textContent = '0 records';
}

function updatePainMetrics(assessments) {
    const painValues = extractPainValues(assessments);
    
    // Current pain level (most recent)
    const currentPain = painValues.length > 0 ? painValues[0] : null;
    document.getElementById('currentPainLevel').textContent = currentPain !== null ? `${currentPain}/10` : 'N/A';
    
    // Average pain level
    if (painValues.length > 0) {
        const avgPain = (painValues.reduce((sum, val) => sum + val, 0) / painValues.length).toFixed(1);
        document.getElementById('avgPainLevel').textContent = `${avgPain}/10`;
    } else {
        document.getElementById('avgPainLevel').textContent = 'N/A';
    }
    
    // Total assessments
    document.getElementById('totalAssessments').textContent = assessments.length.toString();
    
    // Last assessment
    if (assessments.length > 0 && assessments[0].date) {
        const lastDate = new Date(assessments[0].date);
        document.getElementById('lastAssessment').textContent = formatDate(lastDate);
    } else {
        document.getElementById('lastAssessment').textContent = 'Unknown';
    }
    
    // Update history count
    document.getElementById('historyCount').textContent = `${assessments.length} record${assessments.length !== 1 ? 's' : ''}`;
}

function extractPainValues(assessments) {
    const painValues = [];
    
    assessments.forEach(assessment => {
        const value = extractNumericPainValue(assessment.value || assessment.name);
        if (value !== null) {
            painValues.push(value);
        }
    });
    
    return painValues;
}

function extractNumericPainValue(text) {
    if (!text) return null;
    
    // Look for patterns like "8/10", "Pain Scale 8", "VAS 7", etc.
    const patterns = [
        /(\d+)\/10/,
        /scale\s+(\d+)/i,
        /vas\s+(\d+)/i,
        /pain\s+(\d+)/i,
        /(\d+)\s*\/\s*10/,
        /\b(\d+)\b/
    ];
    
    for (const pattern of patterns) {
        const match = text.match(pattern);
        if (match) {
            const value = parseInt(match[1]);
            if (value >= 0 && value <= 10) {
                return value;
            }
        }
    }
    
    return null;
}

function displayPainHistory(assessments) {
    const painHistory = document.getElementById('painHistory');
    
    if (assessments.length === 0) {
        painHistory.innerHTML = `
            <div class="text-center text-muted py-4">
                <i class="fas fa-clipboard-list fa-2x mb-3"></i>
                <p>No pain assessment data available</p>
            </div>
        `;
        return;
    }
    
    const historyHTML = assessments.map(assessment => {
        const painValue = extractNumericPainValue(assessment.value || assessment.name);
        const painLevel = getPainLevel(painValue);
        const badgeClass = getPainBadgeClass(painValue);
        
        return `
            <div class="assessment-item">
                <div class="d-flex justify-content-between align-items-start">
                    <div class="flex-grow-1">
                        <div class="d-flex align-items-center mb-2">
                            <span class="pain-badge ${badgeClass}">
                                ${painValue !== null ? `${painValue}/10` : 'N/A'}
                            </span>
                            <span class="badge bg-light text-dark ms-2">${painLevel}</span>
                        </div>
                        <h6 class="mb-1">${assessment.name || 'Pain Assessment'}</h6>
                        <p class="text-muted mb-0 small">${assessment.value || 'No additional details'}</p>
                    </div>
                    <div class="text-end">
                        <small class="text-muted">
                            <i class="fas fa-calendar-alt me-1"></i>
                            ${assessment.date ? formatDate(new Date(assessment.date)) : 'Unknown date'}
                        </small>
                        ${assessment.status ? `<br><small class="text-muted">${assessment.status}</small>` : ''}
                    </div>
                </div>
            </div>
        `;
    }).join('');
    
    painHistory.innerHTML = historyHTML;
}

function getPainLevel(painValue) {
    if (painValue === null || painValue === undefined) return 'Unknown';
    if (painValue === 0) return 'No Pain';
    if (painValue <= 3) return 'Mild';
    if (painValue <= 6) return 'Moderate';
    return 'Severe';
}

function getPainBadgeClass(painValue) {
    if (painValue === null || painValue === undefined) return 'pain-none';
    if (painValue === 0) return 'pain-none';
    if (painValue <= 3) return 'pain-mild';
    if (painValue <= 6) return 'pain-moderate';
    return 'pain-severe';
}

function displayRelatedInfo(data) {
    displayRelatedConditions(data);
    displayPainMedications(data);
}

function displayRelatedConditions(data) {
    const conditionsContainer = document.getElementById('relatedConditions');
    
    if (!data.condition || !data.condition.summary || data.condition.summary.length === 0) {
        conditionsContainer.innerHTML = '<div class="text-muted">No conditions available</div>';
        return;
    }
    
    const conditionsHTML = data.condition.summary.map(condition => {
        return `<span class="condition-badge">${condition.name || 'Unknown condition'}</span>`;
    }).join('');
    
    conditionsContainer.innerHTML = conditionsHTML;
}

function displayPainMedications(data) {
    const medicationsContainer = document.getElementById('painMedications');
    
    if (!data.medicationrequest || !data.medicationrequest.summary || data.medicationrequest.summary.length === 0) {
        medicationsContainer.innerHTML = '<div class="text-muted">No medications available</div>';
        return;
    }
    
    // Filter for pain-related medications
    const painMedications = data.medicationrequest.summary.filter(med => 
        isPainMedication(med.name)
    );
    
    if (painMedications.length === 0) {
        medicationsContainer.innerHTML = '<div class="text-muted">No pain medications found</div>';
        return;
    }
    
    const medicationsHTML = painMedications.map(medication => {
        return `
            <div class="medication-item">
                <div class="fw-medium">${medication.name || 'Unknown medication'}</div>
                ${medication.value ? `<small class="text-muted">${medication.value}</small>` : ''}
            </div>
        `;
    }).join('');
    
    medicationsContainer.innerHTML = medicationsHTML;
}

function isPainMedication(name) {
    if (!name) return false;
    const painMedKeywords = ['pain', 'analgesic', 'morphine', 'codeine', 'ibuprofen', 'acetaminophen', 'tramadol', 'oxycodone', 'hydrocodone', 'fentanyl'];
    return painMedKeywords.some(keyword => name.toLowerCase().includes(keyword));
}

function formatDate(date) {
    if (!date || !(date instanceof Date)) return 'Unknown';
    
    const now = new Date();
    const diffTime = Math.abs(now - date);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.ceil(diffDays / 7)} weeks ago`;
    
    return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    });
}