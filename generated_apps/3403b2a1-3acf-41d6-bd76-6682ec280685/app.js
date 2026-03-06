document.addEventListener('DOMContentLoaded', function() {
    const data = window.PATIENT_DATA;
    if (!data) { 
        document.body.innerHTML = '<div class="container text-center mt-5"><p class="text-muted">No patient data available</p></div>'; 
        return; 
    }

    // Display Patient Information
    function displayPatientInfo() {
        const patientInfo = document.getElementById('patientInfo');
        const patient = data.patient;
        
        if (!patient) {
            patientInfo.innerHTML = '<p class="text-muted">No patient information available</p>';
            return;
        }

        const initials = patient.name ? patient.name.split(' ').map(n => n[0]).join('') : 'P';
        const age = patient.birthDate ? calculateAge(patient.birthDate) : 'Unknown';
        
        patientInfo.innerHTML = `
            <div class="patient-avatar">${initials}</div>
            <div class="text-center mb-3">
                <h4 class="mb-1">${patient.name || 'Unknown Patient'}</h4>
                <p class="text-muted mb-0">${patient.gender || 'Unknown'} • ${age} years old</p>
            </div>
            <div class="info-row">
                <span class="info-label">Date of Birth</span>
                <span class="info-value">${formatDate(patient.birthDate) || 'Unknown'}</span>
            </div>
            <div class="info-row">
                <span class="info-label">Gender</span>
                <span class="info-value">${patient.gender || 'Unknown'}</span>
            </div>
            <div class="info-row">
                <span class="info-label">Patient ID</span>
                <span class="info-value">${patient.id || 'N/A'}</span>
            </div>
        `;
    }

    // Display Vital Signs
    function displayVitalSigns() {
        const vitalSigns = document.getElementById('vitalSigns');
        const vitals = data.vital_signs?.summary || [];
        
        if (vitals.length === 0) {
            vitalSigns.innerHTML = '<p class="text-muted">No vital signs recorded</p>';
            return;
        }

        const vitalsHtml = vitals.map(vital => `
            <div class="vital-item">
                <div class="d-flex justify-content-between align-items-center">
                    <div>
                        <h5 class="mb-1">${vital.display || vital.code}</h5>
                        <small class="text-muted">${formatDate(vital.date)}</small>
                    </div>
                    <div class="text-end">
                        <div class="vital-value">${vital.value || 'N/A'}</div>
                        <div class="vital-unit">${vital.unit || ''}</div>
                    </div>
                </div>
            </div>
        `).join('');

        vitalSigns.innerHTML = vitalsHtml;
    }

    // Display Conditions
    function displayConditions() {
        const conditions = document.getElementById('conditions');
        const conditionsList = data.conditions?.summary || [];
        
        if (conditionsList.length === 0) {
            conditions.innerHTML = '<p class="text-muted">No active conditions</p>';
            return;
        }

        const conditionsHtml = conditionsList.map(condition => `
            <div class="condition-item">
                <div class="d-flex justify-content-between align-items-start">
                    <div>
                        <h6 class="mb-1">${condition.condition}</h6>
                        <small class="text-muted">Onset: ${formatDate(condition.onset) || 'Unknown'}</small>
                    </div>
                    <span class="status-badge ${getStatusClass(condition.status)}">${condition.status || 'Unknown'}</span>
                </div>
                ${condition.severity ? `<div class="mt-2"><small><strong>Severity:</strong> ${condition.severity}</small></div>` : ''}
            </div>
        `).join('');

        conditions.innerHTML = conditionsHtml;
    }

    // Display Medications
    function displayMedications() {
        const medications = document.getElementById('medications');
        const medicationsList = data.medications?.summary || [];
        
        if (medicationsList.length === 0) {
            medications.innerHTML = '<p class="text-muted">No current medications</p>';
            return;
        }

        const medicationsHtml = medicationsList.map(medication => `
            <div class="medication-item">
                <div class="d-flex justify-content-between align-items-start">
                    <div>
                        <h6 class="mb-1">${medication.medication}</h6>
                        <small class="text-muted">Prescribed: ${formatDate(medication.authoredOn) || 'Unknown'}</small>
                    </div>
                    <span class="status-badge ${getStatusClass(medication.status)}">${medication.status || 'Unknown'}</span>
                </div>
                ${medication.dosage ? `<div class="mt-2"><small><strong>Dosage:</strong> ${medication.dosage}</small></div>` : ''}
            </div>
        `).join('');

        medications.innerHTML = medicationsHtml;
    }

    // Display Allergies
    function displayAllergies() {
        const allergies = document.getElementById('allergies');
        const allergiesList = data.allergies?.summary || [];
        
        if (allergiesList.length === 0) {
            allergies.innerHTML = '<div class="alert alert-success mb-0"><i class="fas fa-check-circle me-2"></i>No known allergies</div>';
            return;
        }

        const allergiesHtml = allergiesList.map(allergy => `
            <div class="allergy-item">
                <div class="d-flex justify-content-between align-items-start">
                    <div>
                        <h6 class="mb-1"><i class="fas fa-exclamation-triangle me-2"></i>${allergy.allergen}</h6>
                        <small class="text-muted">Type: ${allergy.type || 'Unknown'}</small>
                    </div>
                    <div class="text-end">
                        <span class="status-badge status-high">${allergy.criticality || 'Unknown'}</span>
                        <div><small class="text-muted">${allergy.status || ''}</small></div>
                    </div>
                </div>
            </div>
        `).join('');

        allergies.innerHTML = allergiesHtml;
    }

    // Helper Functions
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

    function formatDate(dateString) {
        if (!dateString) return null;
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', { 
            year: 'numeric', 
            month: 'short', 
            day: 'numeric' 
        });
    }

    function getStatusClass(status) {
        if (!status) return 'status-inactive';
        const statusLower = status.toLowerCase();
        if (statusLower.includes('active') || statusLower.includes('current')) return 'status-active';
        if (statusLower.includes('high') || statusLower.includes('severe')) return 'status-high';
        return 'status-inactive';
    }

    // Initialize all sections
    displayPatientInfo();
    displayVitalSigns();
    displayConditions();
    displayMedications();
    displayAllergies();
});