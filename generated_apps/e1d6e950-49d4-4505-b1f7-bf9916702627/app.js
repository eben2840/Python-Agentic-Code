// Initialize the application when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
});

function initializeApp() {
    // Check if patient data is available
    if (typeof window.PATIENT_DATA === 'undefined') {
        console.error('Patient data not available');
        showNoDataMessage();
        return;
    }

    const data = window.PATIENT_DATA;
    
    // Load patient information
    loadPatientInfo(data);
    
    // Load vital signs
    loadVitalSigns(data);
    
    // Load conditions
    loadConditions(data);
    
    // Load medications
    loadMedications(data);
    
    // Load location
    loadLocation(data);
    
    // Load encounter status
    loadEncounterStatus(data);
    
    // Initialize chart
    initializeVitalsChart(data);
    
    // Setup event listeners
    setupEventListeners();
}

function loadPatientInfo(data) {
    const patientNameEl = document.getElementById('patient-name');
    const patientInfoEl = document.getElementById('patient-info');
    
    if (data.patient) {
        patientNameEl.textContent = data.patient.name || 'Unknown Patient';
        
        const gender = data.patient.gender || 'Unknown';
        const birthDate = data.patient.birthDate || 'Unknown';
        const age = calculateAge(birthDate);
        
        patientInfoEl.textContent = `${gender.charAt(0).toUpperCase() + gender.slice(1)} | DOB: ${birthDate} | Age: ${age}`;
    } else {
        patientNameEl.textContent = 'No patient data available';
        patientInfoEl.textContent = '';
    }
}

function loadVitalSigns(data) {
    const vitalSignsGrid = document.getElementById('vital-signs-grid');
    
    if (!data.vital_signs || !data.vital_signs.summary || data.vital_signs.summary.length === 0) {
        vitalSignsGrid.innerHTML = '<div class="col-12"><div class="no-data">No vital signs data available</div></div>';
        return;
    }
    
    const vitals = data.vital_signs.summary;
    let vitalSignsHTML = '';
    
    vitals.forEach(vital => {
        const vitalData = parseVitalSign(vital);
        vitalSignsHTML += createVitalSignCard(vitalData);
    });
    
    vitalSignsGrid.innerHTML = vitalSignsHTML;
}

function parseVitalSign(vital) {
    const name = vital.name || 'Unknown';
    const value = vital.value || vital.name || '--';
    
    // Determine vital sign type and status
    let type = 'unknown';
    let status = 'normal';
    let icon = 'fa-heartbeat';
    let unit = '';
    
    if (name.toLowerCase().includes('bp') || name.toLowerCase().includes('blood pressure')) {
        type = 'blood_pressure';
        icon = 'fa-heartbeat';
        unit = 'mmHg';
        status = assessBloodPressure(value);
    } else if (name.toLowerCase().includes('heart rate') || name.toLowerCase().includes('pulse')) {
        type = 'heart_rate';
        icon = 'fa-heartbeat';
        unit = 'bpm';
        status = assessHeartRate(value);
    } else if (name.toLowerCase().includes('temperature') || name.toLowerCase().includes('temp')) {
        type = 'temperature';
        icon = 'fa-thermometer-half';
        unit = '°F';
        status = assessTemperature(value);
    } else if (name.toLowerCase().includes('oxygen') || name.toLowerCase().includes('spo2')) {
        type = 'oxygen';
        icon = 'fa-lungs';
        unit = '%';
        status = assessOxygen(value);
    } else if (name.toLowerCase().includes('respiratory') || name.toLowerCase().includes('resp')) {
        type = 'respiratory';
        icon = 'fa-wind';
        unit = '/min';
        status = assessRespiratory(value);
    }
    
    return {
        name,
        value,
        type,
        status,
        icon,
        unit,
        trend: 'stable',
        date: vital.date || new Date().toISOString()
    };
}

function createVitalSignCard(vital) {
    const trendIcon = getTrendIcon(vital.trend);
    const trendClass = `trend-${vital.trend}`;
    
    return `
        <div class="col-md-6 col-lg-4">
            <div class="vital-sign-card">
                <div class="vital-icon ${vital.status}">
                    <i class="fas ${vital.icon}"></i>
                </div>
                <div class="vital-value">${vital.value}</div>
                <div class="vital-label">${vital.name}</div>
                <div class="vital-trend ${trendClass}">
                    <i class="fas ${trendIcon}"></i>
                    ${vital.trend}
                </div>
            </div>
        </div>
    `;
}

function loadConditions(data) {
    const conditionsList = document.getElementById('conditions-list');
    
    if (!data.condition || !data.condition.summary || data.condition.summary.length === 0) {
        conditionsList.innerHTML = '<div class="no-data">No conditions data available</div>';
        return;
    }
    
    let conditionsHTML = '';
    data.condition.summary.forEach(condition => {
        conditionsHTML += `
            <div class="condition-item">
                <div class="item-icon condition-icon">
                    <i class="fas fa-exclamation"></i>
                </div>
                <div class="item-info">
                    <div class="item-name">${condition.name || 'Unknown Condition'}</div>
                    <div class="item-details">${formatDate(condition.date) || 'Date unknown'}</div>
                </div>
            </div>
        `;
    });
    
    conditionsList.innerHTML = conditionsHTML;
}

function loadMedications(data) {
    const medicationsList = document.getElementById('medications-list');
    
    if (!data.medicationrequest || !data.medicationrequest.summary || data.medicationrequest.summary.length === 0) {
        medicationsList.innerHTML = '<div class="no-data">No medications data available</div>';
        return;
    }
    
    let medicationsHTML = '';
    data.medicationrequest.summary.forEach(medication => {
        medicationsHTML += `
            <div class="medication-item">
                <div class="item-icon medication-icon">
                    <i class="fas fa-pills"></i>
                </div>
                <div class="item-info">
                    <div class="item-name">${medication.name || 'Unknown Medication'}</div>
                    <div class="item-details">${medication.value || 'Dosage unknown'}</div>
                </div>
            </div>
        `;
    });
    
    medicationsList.innerHTML = medicationsHTML;
}

function loadLocation(data) {
    const locationInfo = document.getElementById('location-info');
    
    if (!data.locations || !data.locations.summary || data.locations.summary.length === 0) {
        locationInfo.innerHTML = '<div class="no-data">No location data available</div>';
        return;
    }
    
    const location = data.locations.summary[0];
    locationInfo.innerHTML = `
        <div class="location-item">
            <div class="item-icon location-icon">
                <i class="fas fa-map-marker-alt"></i>
            </div>
            <div class="item-info">
                <div class="item-name">${location.name || 'Unknown Room'}</div>
                <div class="item-details">${location.value || 'Unknown Ward'}</div>
            </div>
        </div>
    `;
}

function loadEncounterStatus(data) {
    const encounterStatusEl = document.getElementById('encounter-status');
    
    if (!data.encounter || !data.encounter.summary || data.encounter.summary.length === 0) {
        encounterStatusEl.innerHTML = '<i class="fas fa-hospital me-1"></i>No encounter data';
        return;
    }
    
    const encounter = data.encounter.summary[0];
    const status = encounter.status || 'unknown';
    
    let statusClass = 'status-pending';
    if (status === 'in-progress') {
        statusClass = 'status-active';
    } else if (status === 'finished') {
        statusClass = 'status-pending';
    }
    
    encounterStatusEl.className = `status-badge ${statusClass}`;
    encounterStatusEl.innerHTML = `<i class="fas fa-hospital me-1"></i>${status.charAt(0).toUpperCase() + status.slice(1)}`;
}

function initializeVitalsChart(data) {
    const canvas = document.getElementById('vitals-chart');
    const ctx = canvas.getContext('2d');
    
    // Simple chart placeholder - in a real app, you'd use Chart.js or similar
    ctx.fillStyle = '#f8f9fa';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    ctx.fillStyle = '#6b7280';
    ctx.font = '14px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('Vital Signs Trend Chart', canvas.width / 2, canvas.height / 2);
    ctx.fillText('(Chart visualization would be implemented with Chart.js)', canvas.width / 2, canvas.height / 2 + 20);
}

function setupEventListeners() {
    // Time period buttons
    const periodButtons = document.querySelectorAll('[data-period]');
    periodButtons.forEach(button => {
        button.addEventListener('click', function() {
            periodButtons.forEach(btn => btn.classList.remove('active'));
            this.classList.add('active');
            // In a real app, this would update the chart data
        });
    });
    
    // Pain score slider
    const painSlider = document.querySelector('input[type="range"]');
    if (painSlider) {
        painSlider.addEventListener('input', function() {
            const value = this.value;
            const display = this.parentElement.querySelector('.fw-bold');
            if (display) {
                display.textContent = `Current: ${value}`;
            }
        });
    }
}

// Utility functions
function calculateAge(birthDate) {
    if (!birthDate || birthDate === 'Unknown') return 'Unknown';
    
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
    if (!dateString) return null;
    
    try {
        const date = new Date(dateString);
        return date.toLocaleDateString();
    } catch (e) {
        return dateString;
    }
}

function getTrendIcon(trend) {
    switch (trend) {
        case 'up': return 'fa-arrow-up';
        case 'down': return 'fa-arrow-down';
        case 'stable': return 'fa-minus';
        default: return 'fa-minus';
    }
}

// Assessment functions for vital signs
function assessBloodPressure(value) {
    // Simple assessment - in real app, would parse systolic/diastolic
    if (typeof value === 'string' && value.includes('/')) {
        const parts = value.split('/');
        const systolic = parseInt(parts[0]);
        if (systolic > 140) return 'critical';
        if (systolic > 120) return 'warning';
    }
    return 'normal';
}

function assessHeartRate(value) {
    const hr = parseInt(value);
    if (isNaN(hr)) return 'normal';
    if (hr > 100 || hr < 60) return 'warning';
    if (hr > 120 || hr < 50) return 'critical';
    return 'normal';
}

function assessTemperature(value) {
    const temp = parseFloat(value);
    if (isNaN(temp)) return 'normal';
    if (temp > 100.4 || temp < 96) return 'warning';
    if (temp > 102 || temp < 95) return 'critical';
    return 'normal';
}

function assessOxygen(value) {
    const o2 = parseInt(value);
    if (isNaN(o2)) return 'normal';
    if (o2 < 95) return 'warning';
    if (o2 < 90) return 'critical';
    return 'normal';
}

function assessRespiratory(value) {
    const rr = parseInt(value);
    if (isNaN(rr)) return 'normal';
    if (rr > 20 || rr < 12) return 'warning';
    if (rr > 24 || rr < 10) return 'critical';
    return 'normal';
}

function showNoDataMessage() {
    document.getElementById('patient-name').textContent = 'No Patient Data Available';
    document.getElementById('patient-info').textContent = 'Please ensure patient data is loaded';
    document.getElementById('encounter-status').innerHTML = '<i class="fas fa-exclamation-triangle me-1"></i>No Data';
}