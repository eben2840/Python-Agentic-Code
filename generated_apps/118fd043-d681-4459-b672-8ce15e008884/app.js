let currentPatientId = null;
let vitalSignsData = {};

// Initialize the application
document.addEventListener('DOMContentLoaded', function() {
    loadPatients();
});

function loadPatients() {
    const patientBoard = document.getElementById('patientBoard');
    const patientCount = document.getElementById('patientCount');
    
    if (!window.PATIENT_DATA) {
        showEmptyState();
        return;
    }

    const data = window.PATIENT_DATA;
    let patients = [];

    // Handle both single patient and all patients mode
    if (data.patient && data.patient.id === 'all' && data.patients) {
        patients = data.patients.filter(p => p.id !== 'all' && p.name && p.name !== 'All Patients');
    } else if (data.patient && data.patient.id !== 'all') {
        patients = [data.patient];
    }

    if (patients.length === 0) {
        showEmptyState();
        return;
    }

    patientCount.textContent = patients.length;
    
    patientBoard.innerHTML = patients.map(patient => {
        const patientData = patient.data || data;
        const conditions = patientData.condition?.summary || [];
        const vitals = patientData.vital_signs?.summary || [];
        const observations = patientData.observation?.summary || [];
        
        // Get primary condition
        const primaryCondition = conditions[0];
        const conditionSeverity = getConditionSeverity(primaryCondition?.name || 'Unknown');
        
        // Get latest vitals
        const latestVitals = getLatestVitals(vitals, observations);
        
        return `
            <div class="patient-card">
                <div class="priority-indicator priority-${conditionSeverity.priority}"></div>
                <div class="patient-header">
                    <div>
                        <h6 class="patient-name">${patient.name || 'Unknown Patient'}</h6>
                        <div class="patient-info">
                            <i class="fas fa-user me-1"></i>${patient.gender || 'Unknown'} • 
                            <i class="fas fa-calendar me-1"></i>${formatAge(patient.birthDate)}
                        </div>
                    </div>
                </div>
                
                ${primaryCondition ? `
                    <div class="condition-badge ${conditionSeverity.class}">
                        <i class="fas fa-stethoscope me-1"></i>${primaryCondition.name}
                    </div>
                ` : ''}
                
                <div class="vital-signs-summary">
                    <div class="vital-item">
                        <i class="fas fa-tint text-danger me-1"></i>
                        <span class="vital-value">${latestVitals.bloodPressure || 'N/A'}</span>
                    </div>
                    <div class="vital-item">
                        <i class="fas fa-heartbeat text-danger me-1"></i>
                        <span class="vital-value">${latestVitals.heartRate || 'N/A'}</span>
                    </div>
                    <div class="vital-item">
                        <i class="fas fa-thermometer-half text-warning me-1"></i>
                        <span class="vital-value">${latestVitals.temperature || 'N/A'}</span>
                    </div>
                    <div class="vital-item">
                        <i class="fas fa-wind text-primary me-1"></i>
                        <span class="vital-value">${latestVitals.oxygenSat || 'N/A'}</span>
                    </div>
                </div>
                
                <button class="btn btn-vital-signs" onclick="openVitalSignsModal('${patient.id}', '${patient.name}')">
                    <i class="fas fa-plus me-1"></i>Record Vital Signs
                </button>
            </div>
        `;
    }).join('');
}

function showEmptyState() {
    const patientBoard = document.getElementById('patientBoard');
    const patientCount = document.getElementById('patientCount');
    
    patientCount.textContent = '0';
    patientBoard.innerHTML = `
        <div class="empty-state col-12">
            <i class="fas fa-hospital-user"></i>
            <h5>No Patients Available</h5>
            <p class="text-muted">No patient data available for the Emergency Room.</p>
        </div>
    `;
}

function getConditionSeverity(condition) {
    const critical = ['sepsis', 'chest pain', 'tb', 'cancer', 'ckd stage 4'];
    const moderate = ['hypertension', 'diabetes', 'copd', 'depression', 'dementia'];
    
    const conditionLower = condition.toLowerCase();
    
    if (critical.some(c => conditionLower.includes(c))) {
        return { priority: 'high', class: 'critical' };
    } else if (moderate.some(c => conditionLower.includes(c))) {
        return { priority: 'medium', class: '' };
    }
    return { priority: 'low', class: 'stable' };
}

function getLatestVitals(vitals, observations) {
    const result = {
        bloodPressure: 'N/A',
        heartRate: 'N/A',
        temperature: 'N/A',
        oxygenSat: 'N/A'
    };
    
    // Check existing vitals and observations
    [...(vitals || []), ...(observations || [])].forEach(item => {
        const name = item.name?.toLowerCase() || '';
        const value = item.value || item.name || '';
        
        if (name.includes('bp') || name.includes('blood pressure')) {
            result.bloodPressure = value;
        } else if (name.includes('temp')) {
            result.temperature = value;
        } else if (name.includes('heart') || name.includes('pulse')) {
            result.heartRate = value;
        } else if (name.includes('oxygen') || name.includes('spo2')) {
            result.oxygenSat = value;
        }
    });
    
    return result;
}

function formatAge(birthDate) {
    if (!birthDate) return 'Unknown age';
    
    const birth = new Date(birthDate);
    const today = new Date();
    const age = today.getFullYear() - birth.getFullYear();
    
    return `${age} years old`;
}

function openVitalSignsModal(patientId, patientName) {
    currentPatientId = patientId;
    document.getElementById('modalPatientName').textContent = patientName;
    
    // Clear form
    document.getElementById('vitalSignsForm').reset();
    
    // Show modal
    const modal = new bootstrap.Modal(document.getElementById('vitalSignsModal'));
    modal.show();
}

function saveVitalSigns() {
    const systolic = document.getElementById('systolic').value;
    const diastolic = document.getElementById('diastolic').value;
    const heartRate = document.getElementById('heartRate').value;
    const temperature = document.getElementById('temperature').value;
    const respiratoryRate = document.getElementById('respiratoryRate').value;
    const oxygenSat = document.getElementById('oxygenSat').value;
    const painScale = document.getElementById('painScale').value;
    const clinicalNotes = document.getElementById('clinicalNotes').value;
    
    // Validate at least one vital sign is entered
    if (!systolic && !diastolic && !heartRate && !temperature && !respiratoryRate && !oxygenSat && !painScale) {
        alert('Please enter at least one vital sign measurement.');
        return;
    }
    
    // Store vital signs data
    const timestamp = new Date().toISOString();
    const vitalSigns = {
        patientId: currentPatientId,
        timestamp: timestamp,
        bloodPressure: systolic && diastolic ? `${systolic}/${diastolic}` : null,
        heartRate: heartRate || null,
        temperature: temperature || null,
        respiratoryRate: respiratoryRate || null,
        oxygenSaturation: oxygenSat || null,
        painScale: painScale || null,
        clinicalNotes: clinicalNotes || null
    };
    
    // Store in local data structure (in real app, this would be sent to server)
    if (!vitalSignsData[currentPatientId]) {
        vitalSignsData[currentPatientId] = [];
    }
    vitalSignsData[currentPatientId].push(vitalSigns);
    
    // Close modal
    const modal = bootstrap.Modal.getInstance(document.getElementById('vitalSignsModal'));
    modal.hide();
    
    // Show success message
    showSuccessMessage(`Vital signs recorded successfully for patient at ${new Date().toLocaleTimeString()}`);
    
    // Refresh patient board to show updated vitals
    setTimeout(() => {
        loadPatients();
    }, 500);
}

function showSuccessMessage(message) {
    const alert = document.getElementById('successAlert');
    const messageSpan = document.getElementById('successMessage');
    
    messageSpan.textContent = message;
    alert.style.display = 'block';
    alert.classList.add('show');
    
    // Auto-hide after 5 seconds
    setTimeout(() => {
        alert.classList.remove('show');
        setTimeout(() => {
            alert.style.display = 'none';
        }, 150);
    }, 5000);
}

function refreshPatients() {
    loadPatients();
    showSuccessMessage('Patient board refreshed successfully');
}

// Handle modal form submission with Enter key
document.getElementById('vitalSignsForm').addEventListener('keypress', function(e) {
    if (e.key === 'Enter' && e.target.tagName !== 'TEXTAREA') {
        e.preventDefault();
        saveVitalSigns();
    }
});