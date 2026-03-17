// Global variables
let patientData = null;
let statusCounts = { green: 0, yellow: 0, red: 0 };

// Initialize the application
document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
});

function initializeApp() {
    // Check if patient data is available
    if (typeof window.PATIENT_DATA !== 'undefined') {
        patientData = window.PATIENT_DATA;
        loadPatientData();
    } else {
        console.log('No patient data available');
        showNoDataState();
    }
    
    // Add click handlers for status cards
    addCardClickHandlers();
}

function loadPatientData() {
    if (!patientData) {
        showNoDataState();
        return;
    }
    
    // Load patient basic info
    loadPatientInfo();
    
    // Load different data sections
    loadVitalSigns();
    loadLabResults();
    loadMedications();
    loadConditions();
    
    // Update overall status
    updateOverallStatus();
    updateLastUpdate();
}

function loadPatientInfo() {
    const nameElement = document.getElementById('patientName');
    const detailsElement = document.getElementById('patientDetails');
    
    if (patientData.patient && patientData.patient.name) {
        nameElement.textContent = patientData.patient.name;
        
        let details = [];
        if (patientData.patient.gender) {
            details.push(patientData.patient.gender);
        }
        if (patientData.patient.birthDate) {
            const age = calculateAge(patientData.patient.birthDate);
            details.push(`${age} Jahre`);
        }
        
        detailsElement.textContent = details.length > 0 ? details.join(', ') : 'Keine Details verfügbar';
    } else {
        nameElement.textContent = 'Keine Patientendaten';
        detailsElement.textContent = 'Keine Daten verfügbar';
    }
}

function loadVitalSigns() {
    const summaryElement = document.getElementById('vitalsSummary');
    const statusElement = document.getElementById('vitalsStatus');
    
    if (patientData.vital_signs && patientData.vital_signs.summary && patientData.vital_signs.summary.length > 0) {
        const vitals = patientData.vital_signs.summary;
        let html = '';
        let overallStatus = 'green';
        
        vitals.slice(0, 4).forEach(vital => {
            const status = assessVitalStatus(vital);
            if (status === 'red') overallStatus = 'red';
            else if (status === 'yellow' && overallStatus !== 'red') overallStatus = 'yellow';
            
            html += `
                <div class="vital-item">
                    <span class="vital-name">${vital.name || 'Unbekannt'}</span>
                    <div class="d-flex align-items-center gap-2">
                        <span class="vital-value">${vital.value || 'N/A'}</span>
                        <span class="status-badge ${status}">${getStatusText(status)}</span>
                    </div>
                </div>
            `;
        });
        
        summaryElement.innerHTML = html;
        updateStatusLight(statusElement, overallStatus);
        updateStatusCount(overallStatus);
    } else {
        summaryElement.innerHTML = `
            <div class="text-center text-muted py-3">
                <i class="fas fa-chart-line fa-2x mb-2 opacity-50"></i>
                <p class="mb-0">Keine Vitalwerte verfügbar</p>
            </div>
        `;
        updateStatusLight(statusElement, 'unknown');
    }
}

function loadLabResults() {
    const summaryElement = document.getElementById('labSummary');
    const statusElement = document.getElementById('labStatus');
    
    if (patientData.observation && patientData.observation.summary && patientData.observation.summary.length > 0) {
        const observations = patientData.observation.summary.filter(obs => 
            obs.name && !isVitalSign(obs.name)
        );
        
        if (observations.length > 0) {
            let html = '';
            let overallStatus = 'green';
            
            observations.slice(0, 4).forEach(obs => {
                const status = assessLabStatus(obs);
                if (status === 'red') overallStatus = 'red';
                else if (status === 'yellow' && overallStatus !== 'red') overallStatus = 'yellow';
                
                html += `
                    <div class="lab-item">
                        <span class="lab-name">${obs.name}</span>
                        <div class="d-flex align-items-center gap-2">
                            <span class="lab-value">${obs.value || 'N/A'}</span>
                            <span class="status-badge ${status}">${getStatusText(status)}</span>
                        </div>
                    </div>
                `;
            });
            
            summaryElement.innerHTML = html;
            updateStatusLight(statusElement, overallStatus);
            updateStatusCount(overallStatus);
        } else {
            showNoLabData(summaryElement, statusElement);
        }
    } else {
        showNoLabData(summaryElement, statusElement);
    }
}

function loadMedications() {
    const summaryElement = document.getElementById('medicationSummary');
    const statusElement = document.getElementById('medicationStatus');
    
    if (patientData.medication && patientData.medication.summary && patientData.medication.summary.length > 0) {
        const medications = patientData.medication.summary;
        let html = '';
        let overallStatus = 'green';
        
        medications.slice(0, 4).forEach(med => {
            const status = assessMedicationStatus(med);
            if (status === 'red') overallStatus = 'red';
            else if (status === 'yellow' && overallStatus !== 'red') overallStatus = 'yellow';
            
            html += `
                <div class="medication-item">
                    <span class="medication-name">${med.name || 'Unbekannt'}</span>
                    <div class="d-flex align-items-center gap-2">
                        <span class="status-badge ${med.status === 'active' ? 'active' : 'normal'}">${med.status || 'Unbekannt'}</span>
                    </div>
                </div>
            `;
        });
        
        summaryElement.innerHTML = html;
        updateStatusLight(statusElement, overallStatus);
        updateStatusCount(overallStatus);
    } else {
        summaryElement.innerHTML = `
            <div class="text-center text-muted py-3">
                <i class="fas fa-prescription-bottle fa-2x mb-2 opacity-50"></i>
                <p class="mb-0">Keine Medikation verfügbar</p>
            </div>
        `;
        updateStatusLight(statusElement, 'unknown');
    }
}

function loadConditions() {
    const summaryElement = document.getElementById('conditionsSummary');
    const statusElement = document.getElementById('conditionsStatus');
    
    if (patientData.condition && patientData.condition.summary && patientData.condition.summary.length > 0) {
        const conditions = patientData.condition.summary;
        let html = '';
        let overallStatus = 'green';
        
        conditions.slice(0, 4).forEach(condition => {
            const status = assessConditionStatus(condition);
            if (status === 'red') overallStatus = 'red';
            else if (status === 'yellow' && overallStatus !== 'red') overallStatus = 'yellow';
            
            html += `
                <div class="condition-item">
                    <span class="condition-name">${condition.name || 'Unbekannt'}</span>
                    <div class="d-flex align-items-center gap-2">
                        <span class="status-badge ${condition.status === 'active' ? 'warning' : 'normal'}">${condition.status || 'Unbekannt'}</span>
                    </div>
                </div>
            `;
        });
        
        summaryElement.innerHTML = html;
        updateStatusLight(statusElement, overallStatus);
        updateStatusCount(overallStatus);
    } else {
        summaryElement.innerHTML = `
            <div class="text-center text-muted py-3">
                <i class="fas fa-notes-medical fa-2x mb-2 opacity-50"></i>
                <p class="mb-0">Keine Diagnosen verfügbar</p>
            </div>
        `;
        updateStatusLight(statusElement, 'unknown');
    }
}

// Status assessment functions
function assessVitalStatus(vital) {
    if (!vital.value) return 'unknown';
    
    const value = parseFloat(vital.value);
    const name = vital.name.toLowerCase();
    
    if (name.includes('blutdruck') || name.includes('blood pressure')) {
        if (value > 140 || value < 90) return 'red';
        if (value > 130 || value < 100) return 'yellow';
    } else if (name.includes('puls') || name.includes('heart rate')) {
        if (value > 100 || value < 60) return 'red';
        if (value > 90 || value < 70) return 'yellow';
    } else if (name.includes('temperatur') || name.includes('temperature')) {
        if (value > 38.5 || value < 36) return 'red';
        if (value > 37.5 || value < 36.5) return 'yellow';
    }
    
    return 'green';
}

function assessLabStatus(observation) {
    // Simple heuristic - in real app, would use reference ranges
    if (!observation.value) return 'unknown';
    return 'green'; // Default to normal for demo
}

function assessMedicationStatus(medication) {
    if (medication.status === 'stopped' || medication.status === 'suspended') {
        return 'yellow';
    }
    return 'green';
}

function assessConditionStatus(condition) {
    if (condition.status === 'active') {
        // Check for critical conditions
        const name = condition.name.toLowerCase();
        if (name.includes('akut') || name.includes('kritisch') || name.includes('notfall')) {
            return 'red';
        }
        return 'yellow';
    }
    return 'green';
}

// Utility functions
function isVitalSign(name) {
    const vitalKeywords = ['blutdruck', 'puls', 'temperatur', 'sauerstoff', 'blood pressure', 'heart rate', 'temperature', 'oxygen'];
    return vitalKeywords.some(keyword => name.toLowerCase().includes(keyword));
}

function getStatusText(status) {
    switch(status) {
        case 'green': return 'Normal';
        case 'yellow': return 'Achtung';
        case 'red': return 'Kritisch';
        case 'active': return 'Aktiv';
        case 'normal': return 'Normal';
        default: return 'Unbekannt';
    }
}

function updateStatusLight(element, status) {
    const light = element.querySelector('.status-light');
    if (light) {
        light.className = `status-light ${status}`;
    }
}

function updateStatusCount(status) {
    if (status in statusCounts) {
        statusCounts[status]++;
    }
}

function updateOverallStatus() {
    const overallIcon = document.getElementById('overallStatusIcon');
    const overallText = document.getElementById('overallStatusText');
    const overallDetail = document.getElementById('overallStatusDetail');
    
    // Update status counts display
    document.getElementById('greenCount').textContent = statusCounts.green;
    document.getElementById('yellowCount').textContent = statusCounts.yellow;
    document.getElementById('redCount').textContent = statusCounts.red;
    
    // Determine overall status
    let overallStatus = 'green';
    let statusText = 'Patientenstatus unauffällig';
    let detailText = 'Alle Bereiche im Normalbereich';
    
    if (statusCounts.red > 0) {
        overallStatus = 'critical';
        statusText = 'Kritische Werte erkannt';
        detailText = `${statusCounts.red} Bereich(e) erfordern sofortige Aufmerksamkeit`;