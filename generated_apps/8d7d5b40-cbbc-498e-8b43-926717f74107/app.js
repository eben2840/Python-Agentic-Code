// Find Frank Miller in the patient data
function findFrankMiller() {
    if (!window.PATIENT_DATA) {
        console.error('No patient data available');
        return null;
    }

    const data = window.PATIENT_DATA;
    
    // Check if we're in all patients mode
    if (data.patient && data.patient.id === 'all' && data.patients) {
        return data.patients.find(p => p.name && p.name.toLowerCase().includes('frank miller'));
    }
    
    // Check if current patient is Frank Miller
    if (data.patient && data.patient.name && data.patient.name.toLowerCase().includes('frank miller')) {
        return {
            id: data.patient.id,
            name: data.patient.name,
            gender: data.patient.gender,
            birthDate: data.patient.birthDate,
            data: data
        };
    }
    
    return null;
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
    if (!dateString) return 'Date not available';
    
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

function renderPatientHeader(patient) {
    document.getElementById('patientName').textContent = patient.name || 'Unknown Patient';
    document.getElementById('patientGender').textContent = patient.gender || 'Unknown';
    document.getElementById('patientAge').textContent = calculateAge(patient.birthDate);
    document.getElementById('patientDob').textContent = patient.birthDate ? formatDate(patient.birthDate) : 'Unknown';
}

function renderEncounters(encounters) {
    const container = document.getElementById('encountersContent');
    
    if (!encounters || encounters.length === 0) {
        container.innerHTML = `
            <div class="no-data">
                <i class="fas fa-calendar-times"></i>
                <div>No encounters available</div>
            </div>
        `;
        return;
    }
    
    const encountersHtml = encounters.map(encounter => {
        const status = encounter.status || 'unknown';
        const statusClass = status === 'finished' ? 'status-completed' : 
                           status === 'in-progress' ? 'status-active' : 'status-unknown';
        
        return `
            <div class="encounter-item">
                <div class="d-flex justify-content-between align-items-start">
                    <div>
                        <div class="fw-medium">${encounter.name || 'Encounter'}</div>
                        <div class="encounter-date">
                            <i class="fas fa-clock me-1"></i>
                            ${encounter.date ? formatDate(encounter.date) : 'Date not available'}
                        </div>
                    </div>
                    <span class="status-badge ${statusClass}">
                        ${status}
                    </span>
                </div>
            </div>
        `;
    }).join('');
    
    container.innerHTML = encountersHtml;
}

function renderMedications(medications) {
    const container = document.getElementById('medicationsContent');
    
    if (!medications || medications.length === 0) {
        container.innerHTML = `
            <div class="no-data">
                <i class="fas fa-pills"></i>
                <div>No medications available</div>
            </div>
        `;
        return;
    }
    
    const medicationsHtml = medications.map(medication => {
        const status = medication.status || 'active';
        const statusClass = status === 'active' ? 'status-active' : 
                           status === 'completed' ? 'status-completed' : 'status-unknown';
        
        return `
            <div class="medication-item">
                <div class="d-flex justify-content-between align-items-start">
                    <div class="flex-grow-1">
                        <div class="fw-medium">${medication.name || 'Medication'}</div>
                        ${medication.value ? `
                            <div class="medication-dosage">
                                <i class="fas fa-prescription-bottle me-1"></i>
                                ${medication.value}
                            </div>
                        ` : ''}
                    </div>
                    <span class="status-badge ${statusClass}">
                        ${status}
                    </span>
                </div>
            </div>
        `;
    }).join('');
    
    container.innerHTML = medicationsHtml;
}

function initializeApp() {
    const frank = findFrankMiller();
    
    if (!frank) {
        document.getElementById('patientName').textContent = 'Frank Miller not found';
        document.getElementById('encountersContent').innerHTML = `
            <div class="no-data">
                <i class="fas fa-user-times"></i>
                <div>Frank Miller not found in patient data</div>
            </div>
        `;
        document.getElementById('medicationsContent').innerHTML = `
            <div class="no-data">
                <i class="fas fa-user-times"></i>
                <div>Frank Miller not found in patient data</div>
            </div>
        `;
        return;
    }
    
    // Render patient header
    renderPatientHeader(frank);
    
    // Get encounters and medications from Frank's data
    const encounters = frank.data.encounter?.summary || [];
    const medications = frank.data.medicationrequest?.summary || [];
    
    // Render encounters and medications
    renderEncounters(encounters);
    renderMedications(medications);
}

// Initialize when page loads
document.addEventListener('DOMContentLoaded', function() {
    // Small delay to ensure PATIENT_DATA is loaded
    setTimeout(initializeApp, 100);
});

// Also try to initialize immediately if data is already available
if (window.PATIENT_DATA) {
    initializeApp();
}