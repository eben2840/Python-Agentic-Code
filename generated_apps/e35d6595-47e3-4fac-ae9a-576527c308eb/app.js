// Mock patient data structure for demonstration
window.PATIENT_DATA = {
    patient: {
        id: 'pat-0a70a8f4',
        name: 'Jane Doe',
        gender: 'female',
        birthDate: '1980-02-15'
    },
    condition: {
        summary: [
            {
                name: 'Breast Cancer',
                status: 'active',
                date: '2026-03-01T09:00:00Z'
            }
        ]
    },
    medicationrequest: {
        summary: [
            {
                name: 'Treatment for Breast Cancer',
                value: '1 tablet daily',
                status: 'active'
            }
        ]
    },
    observation: {
        summary: [
            {
                name: 'Tumor Marker CA15-3',
                value: 'Tumor Marker CA15-3',
                date: '2026-03-05T12:00:00Z',
                status: 'final'
            }
        ]
    },
    locations: {
        summary: [
            {
                name: 'Room 205',
                value: 'Oncology Ward',
                status: 'active'
            }
        ]
    }
};

// Pain assessments storage (in real app, this would be from FHIR)
let painAssessments = [];
let carePlan = null;

// Initialize the application
document.addEventListener('DOMContentLoaded', function() {
    loadPatientData();
    loadPainAssessments();
    initializePainLevelSlider();
});

function loadPatientData() {
    const data = window.PATIENT_DATA;
    
    if (!data || !data.patient) {
        showNoDataMessage();
        return;
    }

    // Load patient basic info
    document.getElementById('patientName').textContent = data.patient.name || 'Unknown Patient';
    document.getElementById('patientId').textContent = data.patient.id || 'N/A';
    document.getElementById('patientGender').textContent = capitalizeFirst(data.patient.gender) || 'N/A';
    document.getElementById('patientDob').textContent = formatDate(data.patient.birthDate) || 'N/A';

    // Load current condition
    loadCurrentCondition(data.condition);
    
    // Load current medication
    loadCurrentMedication(data.medicationrequest);
    
    // Load recent observations
    loadRecentObservations(data.observation);
    
    // Load current location
    loadCurrentLocation(data.locations);
}

function loadCurrentCondition(conditionData) {
    const container = document.getElementById('currentCondition');
    
    if (!conditionData || !conditionData.summary || conditionData.summary.length === 0) {
        container.innerHTML = '<div class="condition-item text-muted">No conditions available</div>';
        return;
    }

    container.innerHTML = '';
    conditionData.summary.forEach(condition => {
        const conditionElement = document.createElement('div');
        conditionElement.className = 'condition-item';
        conditionElement.innerHTML = `
            <div class="d-flex justify-content-between align-items-center">
                <span class="fw-medium">${condition.name || 'Unknown Condition'}</span>
                <span class="status-badge status-${condition.status || 'unknown'}">${capitalizeFirst(condition.status) || 'Unknown'}</span>
            </div>
            ${condition.date ? `<small class="text-muted">Since: ${formatDate(condition.date)}</small>` : ''}
        `;
        container.appendChild(conditionElement);
    });
}

function loadCurrentMedication(medicationData) {
    const container = document.getElementById('currentMedication');
    
    if (!medicationData || !medicationData.summary || medicationData.summary.length === 0) {
        container.innerHTML = '<div class="medication-item text-muted">No medications available</div>';
        return;
    }

    container.innerHTML = '';
    medicationData.summary.forEach(medication => {
        const medicationElement = document.createElement('div');
        medicationElement.className = 'medication-item';
        medicationElement.innerHTML = `
            <div class="d-flex justify-content-between align-items-center">
                <span class="fw-medium">${medication.name || 'Unknown Medication'}</span>
                <span class="status-badge status-${medication.status || 'unknown'}">${capitalizeFirst(medication.status) || 'Unknown'}</span>
            </div>
            ${medication.value ? `<small class="text-muted">Dosage: ${medication.value}</small>` : ''}
        `;
        container.appendChild(medicationElement);
    });
}

function loadRecentObservations(observationData) {
    const container = document.getElementById('recentObservations');
    
    if (!observationData || !observationData.summary || observationData.summary.length === 0) {
        container.innerHTML = '<div class="observation-item text-muted">No observations available</div>';
        return;
    }

    container.innerHTML = '';
    observationData.summary.forEach(observation => {
        const observationElement = document.createElement('div');
        observationElement.className = 'observation-item';
        observationElement.innerHTML = `
            <div class="d-flex justify-content-between align-items-center">
                <span class="fw-medium">${observation.name || 'Unknown Observation'}</span>
                <span class="status-badge status-${observation.status || 'unknown'}">${capitalizeFirst(observation.status) || 'Unknown'}</span>
            </div>
            ${observation.date ? `<small class="text-muted">Date: ${formatDate(observation.date)}</small>` : ''}
        `;
        container.appendChild(observationElement);
    });
}

function loadCurrentLocation(locationData) {
    const container = document.getElementById('currentLocation');
    
    if (!locationData || !locationData.summary || locationData.summary.length === 0) {
        container.innerHTML = '<div class="location-item text-muted">No location data available</div>';
        return;
    }

    container.innerHTML = '';
    locationData.summary.forEach(location => {
        const locationElement = document.createElement('div');
        locationElement.className = 'location-item';
        locationElement.innerHTML = `
            <div class="d-flex justify-content-between align-items-center">
                <div>
                    <div class="fw-medium">${location.name || 'Unknown Room'}</div>
                    <small class="text-muted">${location.value || 'Unknown Ward'}</small>
                </div>
                <span class="status-badge status-${location.status || 'unknown'}">${capitalizeFirst(location.status) || 'Unknown'}</span>
            </div>
        `;
        container.appendChild(locationElement);
    });
}

function loadPainAssessments() {
    const container = document.getElementById('painAssessments');
    
    if (painAssessments.length === 0) {
        container.innerHTML = `
            <div class="text-center py-4">
                <i class="fas fa-chart-line text-muted mb-2" style="font-size: 2rem;"></i>
                <p class="text-muted">No pain assessments available</p>
                <small class="text-muted">Click "Add Assessment" to record pain levels</small>
            </div>
        `;
        return;
    }

    container.innerHTML = '';
    painAssessments.sort((a, b) => new Date(b.date) - new Date(a.date)).forEach(assessment => {
        const assessmentElement = document.createElement('div');
        assessmentElement.className = 'pain-assessment-item';
        assessmentElement.innerHTML = `
            <div class="row align-items-center">
                <div class="col-md-2">
                    <div class="pain-level-circle pain-level-${getPainLevelClass(assessment.level)}">
                        ${assessment.level}
                    </div>
                </div>
                <div class="col-md-10">
                    <div class="d-flex justify-content-between align-items-start">
                        <div>
                            <h6 class="mb-1">Pain Level: ${assessment.level}/10</h6>
                            <p class="mb-1"><strong>Location:</strong> ${assessment.location || 'Not specified'}</p>
                            <p class="mb-1"><strong>Type:</strong> ${assessment.type || 'Not specified'}</p>
                            ${assessment.notes ? `<p class="mb-1"><strong>Notes:</strong> ${assessment.notes}</p>` : ''}
                        </div>
                        <small class="text-muted">${formatDateTime(assessment.date)}</small>
                    </div>
                </div>
            </div>
        `;
        container.appendChild(assessmentElement);
    });
}

function generateCarePlan() {
    const data = window.PATIENT_DATA;
    if (!data || !data.patient) return;

    // Generate care plan based on patient data
    carePlan = {
        id: 'careplan-' + Date.now(),
        patientId: data.patient.id,
        patientName: data.patient.name,
        generatedDate: new Date().toISOString(),
        categories: [
            {
                name: 'Pain Management',
                icon: 'fas fa-hand-holding-heart',
                goals: [
                    {
                        description: 'Reduce pain levels to 3/10 or below within 48 hours',
                        priority: 'high',
                        targetDate: new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString()
                    },
                    {
                        description: 'Maintain pain levels below 5/10 during treatment',
                        priority: 'high',
                        targetDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
                    }
                ],
                interventions: [
                    {
                        description: 'Administer prescribed pain medication as scheduled',
                        priority: 'high',
                        frequency: 'Every 6 hours as needed'
                    },
                    {
                        description: 'Monitor pain levels using 0-10 scale every 4 hours',
                        priority: 'high',
                        frequency: 'Every 4 hours'
                    },
                    {
                        description: 'Apply heat/cold therapy as tolerated',
                        priority: 'medium',
                        frequency: 'As needed'
                    }
                ]
            },
            {
                name: 'Cancer Treatment Support',
                icon: 'fas fa-ribbon',
                goals: [
                    {
                        description: 'Monitor treatment response and side effects',
                        priority: 'high',
                        targetDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString()
                    },
                    {
                        description: 'Maintain nutritional status during treatment',
                        priority: 'medium',
                        targetDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
                    }
                ],
                interventions: [
                    {
                        description: 'Review tumor markers and laboratory results weekly',
                        priority: 'high',
                        frequency: 'Weekly'
                    },
                    {
                        description: 'Provide emotional support and counseling resources',
                        priority: 'medium',
                        frequency: 'As needed'
                    },
                    {
                        description: 'Coordinate with oncology team for treatment planning',
                        priority: 'high',
                        frequency: 'Ongoing'
                    }
                ]
            },
            {
                name: 'General Health Maintenance',
                icon: 'fas fa-heartbeat',
                goals: [
                    {
                        description: 'Prevent complications and infections',
                        priority: 'medium',
                        targetDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
                    },
                    {
                        description: 'Maintain mobility and prevent deconditioning',
                        priority: 'medium',
                        targetDate: new Date(Date.now() + 21 * 24 * 60 * 60 * 1000).toISOString()
                    }
                ],
                interventions: [
                    {
                        description: 'Monitor vital signs every 8 hours',
                        priority: 'medium',
                        frequency: 'Every 8 hours'
                    },
                    {
                        description: 'Encourage ambulation and light exercise as tolerated',
                        priority: 'low',
                        frequency: 'Daily'
                    },
                    {
                        description: 'Educate patient on infection prevention measures',
                        priority: 'medium',
                        frequency: 'Once'
                    }
                ]
            }
        ]
    };

    displayCarePlan();
}

function displayCarePlan() {
    const container = document.getElementById('carePlanTemplate');
    
    if (!carePlan) {
        container.innerHTML = `
            <div class="text-center py-4">
                <i class="fas fa-clipboard-list text-muted mb-2" style="font-size: 2rem;"></i>
                <p class="text-muted">No care plan generated yet</p>
                <small class="text-muted">Click "Generate Plan" to create a personalized care plan</small>
            </div>
        `;
        return;
    }

    container.innerHTML = '';

    // Add care plan header
    const headerElement = document.createElement('div');
    headerElement.className = 'care-plan-item mb-3';
    headerElement.innerHTML = `
        <div class="d-flex justify-content-between align-items-center">
            <div>
                <h6 class="mb-1">Care Plan for ${carePlan.patientName}</h6>
                <small class="text-muted">Generated: ${formatDateTime(carePlan.generatedDate)}</small>
            </div>
            <span class="badge bg-success">Active</span>
        </div>
    `;
    container.appendChild(headerElement);

    // Add each category
    carePlan.categories.forEach(category => {
        const categoryElement = document.createElement('div');
        categoryElement.className = 'care-plan-category';
        
        let categoryHtml = `
            <h6><i class="${category.icon} me-2"></i>${category.name}</h6>
            
            <div class="mb-3">
                <strong class="text-primary">Goals:</strong>
        `;
        
        category.goals.forEach(goal => {
            categoryHtml += `
                <div class="care-plan-goal priority-${goal.priority}">
                    <div class="d-flex justify-content-between align-items-start">
                        <span>${goal.description}</span>
                        <div class="text-end">
                            <small class="badge bg-${getPriorityColor(goal.priority)} mb-1">${capitalizeFirst(goal.priority)}</small>
                            <br>
                            <small class="text-muted">Target: ${formatDate(goal.targetDate)}</small>
                        </div>
                    </div>
                </div>
            `;
        });
        
        categoryHtml += `
            </div>
            
            <div>
                <strong class="text-warning">Interventions:</strong>
        `;
        
        category.interventions.forEach(intervention => {
            categoryHtml += `
                <div class="care-plan-intervention priority-${intervention.priority}">
                    <div class="d-flex justify-content-between align-items-start">
                        <span>${intervention.description}</span>
                        <div class="text-end">
                            <small class="badge bg-${getPriorityColor(intervention.priority)} mb-1">${capitalizeFirst(intervention.priority)}</small>
                            <br>
                            <small class="text-muted">${intervention.frequency}</small>
                        </div>
                    </div>
                </div>
            `;
        });
        
        categoryHtml += '</div>';
        categoryElement.innerHTML = categoryHtml;
        container.appendChild(categoryElement);
    });
}

function getPriorityColor(priority) {
    switch (priority) {
        case 'high': return 'danger';
        case 'medium': return 'warning';
        case 'low': return 'success';
        default: return 'secondary';
    }
}

function initializePainLevelSlider() {
    const slider = document.getElementById('painLevel');
    const display = document.getElementById('painLevelDisplay');
    
    slider.addEventListener('input', function() {
        display.textContent = this.value;
        display.className = `badge bg-${getPainLevelColor(this.value)}`;
    });
}

function showAddPainModal() {
    const modal = new bootstrap.Modal(document.getElementById('addPainModal'));
    modal.show();
}

function addPainAssessment() {
    const level = document.getElementById('painLevel').value;
    const location = document.getElementById('painLocation').value;
    const type = document.getElementById('painType').value;
    const notes = document.getElementById('painNotes').value;

    const assessment = {
        id: Date.now(),
        date: new Date().toISOString(),
        level: parseInt(level),
        location: location.trim(),
        type: type,
        notes: notes.trim()
    };

    painAssessments.push(assessment);
    loadPainAssessments();

    // Close modal and reset form
    const modal = bootstrap.Modal.getInstance(document.getElementById('addPainModal'));
    modal.hide();
    resetPainForm();
}

function resetPainForm() {
    document.getElementById('painLevel').value = 0;
    document.getElementById('painLevelDisplay').textContent = '0';
    document.getElementById('painLevelDisplay').className = 'badge bg-primary';
    document.getElementById('painLocation').value = '';
    document.getElementById('painType').value = '';
    document.getElementById('painNotes').value = '';
}

function getPainLevelClass(level) {
    if (level <= 2) return '0-2';
    if (level <= 4) return '3-4';
    if (level <= 6) return '5-6';
    if (level <= 8) return '7-8';
    return '9-10';
}

function getPainLevelColor(level) {
    if (level <= 2) return 'success';
    if (level <= 4) return 'warning';
    if (level <= 6) return 'orange';
    if (level <= 8) return 'danger';
    return 'dark';
}

function formatDate(dateString) {
    if (!dateString) return '';
    try {
        return new Date(dateString).toLocaleDateString();
    } catch (e) {
        return dateString;
    }
}

function formatDateTime(dateString) {
    if (!dateString) return '';
    try {
        return new Date(dateString).toLocaleString();
    } catch (e) {
        return dateString;
    }
}

function capitalizeFirst(str) {
    if (!str) return '';
    return str.charAt(0).toUpperCase() + str.slice(1);
}

function showNoDataMessage() {
    document.body.innerHTML = `
        <div class="container-fluid py-4">
            <div class="text-center">
                <i class="fas fa-exclamation-triangle text-warning mb-3" style="font-size: 3rem;"></i>
                <h4>No Patient Data Available</h4>
                <p class="text-muted">Unable to load patient information.</p>
            </div>
        </div>
    `;
}