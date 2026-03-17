document.addEventListener('DOMContentLoaded', function() {
    const data = window.PATIENT_DATA;
    if (!data) { 
        document.body.innerHTML = '<div class="container mt-5"><div class="alert alert-warning text-center">No patient data available</div></div>'; 
        return; 
    }

    // Display patient info
    if (data.patient) {
        document.getElementById('patientName').textContent = data.patient.name || 'Elias Abbott';
        document.getElementById('patientInfo').textContent = `Patient ID: ${data.patient.id || '851a7b59-feb4-4b4c-9f48-8cf5fad54213'}`;
    }

    // Blood Pressure Dashboard
    displayBloodPressure();
    
    // Medical Conditions
    displayConditions();
    
    // Vital Signs
    displayVitalSigns();
    
    // Allergies
    displayAllergies();

    function displayBloodPressure() {
        const bpContainer = document.getElementById('bpReadings');
        const observations = data.observations?.summary || [];
        
        const bpReadings = observations.filter(obs => 
            obs.display && (
                obs.display.toLowerCase().includes('blood pressure') ||
                obs.display.toLowerCase().includes('systolic') ||
                obs.display.toLowerCase().includes('diastolic')
            )
        );

        if (bpReadings.length === 0) {
            bpContainer.innerHTML = '<div class="col-12"><div class="no-data"><i class="fas fa-heartbeat fa-2x mb-3"></i><p>No blood pressure readings available</p></div></div>';
            return;
        }

        let bpHtml = '';
        bpReadings.forEach(reading => {
            const status = getBPStatus(reading.value);
            bpHtml += `
                <div class="col-md-4 mb-3">
                    <div class="bp-reading">
                        <div class="bp-systolic">${reading.value || 'N/A'}</div>
                        <div class="bp-diastolic">${reading.unit || ''}</div>
                        <div class="bp-status text-${status.color}">${status.text}</div>
                        <small class="text-muted d-block mt-2">${reading.display}</small>
                        <small class="text-muted">${reading.date || 'No date'}</small>
                    </div>
                </div>
            `;
        });
        
        bpContainer.innerHTML = bpHtml;
    }

    function displayConditions() {
        const conditionsContainer = document.getElementById('conditionsList');
        const conditions = data.conditions?.summary || [];

        if (conditions.length === 0) {
            conditionsContainer.innerHTML = '<div class="no-data">No medical conditions recorded</div>';
            return;
        }

        let conditionsHtml = '';
        conditions.forEach(condition => {
            const statusClass = condition.status === 'active' ? 'condition-active' : 'condition-resolved';
            conditionsHtml += `
                <div class="condition-item">
                    <div class="d-flex justify-content-between align-items-start">
                        <div>
                            <h6 class="mb-1">${condition.condition || 'Unknown Condition'}</h6>
                            <small class="text-muted">${condition.onset || 'Onset unknown'}</small>
                        </div>
                        <span class="condition-badge ${statusClass}">${condition.status || 'Unknown'}</span>
                    </div>
                    ${condition.severity ? `<small class="text-muted">Severity: ${condition.severity}</small>` : ''}
                </div>
            `;
        });

        conditionsContainer.innerHTML = conditionsHtml;
    }

    function displayVitalSigns() {
        const vitalContainer = document.getElementById('vitalSigns');
        const vitals = data.vital_signs?.summary || [];

        if (vitals.length === 0) {
            vitalContainer.innerHTML = '<div class="col-12"><div class="no-data">No vital signs available</div></div>';
            return;
        }

        let vitalsHtml = '';
        vitals.forEach(vital => {
            vitalsHtml += `
                <div class="col-md-3 col-sm-6 mb-3">
                    <div class="vital-card">
                        <div class="vital-value">${vital.value || 'N/A'}</div>
                        <div class="vital-unit">${vital.unit || ''}</div>
                        <div class="vital-label">${vital.display || 'Unknown'}</div>
                        <small class="text-muted d-block mt-1">${vital.date || 'No date'}</small>
                    </div>
                </div>
            `;
        });

        vitalContainer.innerHTML = vitalsHtml;
    }

    function displayAllergies() {
        const allergiesContainer = document.getElementById('allergiesList');
        const allergies = data.allergies?.summary || [];

        if (allergies.length === 0) {
            allergiesContainer.innerHTML = '<div class="col-12"><div class="no-data">No known allergies</div></div>';
            return;
        }

        let allergiesHtml = '';
        allergies.forEach(allergy => {
            const severity = getAllergySeverity(allergy.allergen);
            allergiesHtml += `
                <div class="col-md-6 col-lg-4 mb-3">
                    <div class="allergy-item allergy-${severity.level}">
                        <div class="d-flex justify-content-between align-items-start mb-2">
                            <h6 class="mb-0">${allergy.allergen || 'Unknown Allergen'}</h6>
                            <span class="severity-badge severity-${severity.level}">${severity.text}</span>
                        </div>
                        <small class="text-muted">${allergy.type || 'Type unknown'}</small>
                        ${allergy.status ? `<div><small class="text-muted">Status: ${allergy.status}</small></div>` : ''}
                    </div>
                </div>
            `;
        });

        allergiesContainer.innerHTML = allergiesHtml;
    }

    function getBPStatus(value) {
        if (!value || isNaN(value)) return { text: 'Unknown', color: 'secondary' };
        
        const numValue = parseFloat(value);
        if (numValue >= 140) return { text: 'High', color: 'danger' };
        if (numValue >= 120) return { text: 'Elevated', color: 'warning' };
        return { text: 'Normal', color: 'success' };
    }

    function getAllergySeverity(allergen) {
        if (!allergen) return { level: 'low', text: 'Unknown' };
        
        const allergenLower = allergen.toLowerCase();
        if (allergenLower.includes('high')) return { level: 'high', text: 'High' };
        if (allergenLower.includes('medium')) return { level: 'medium', text: 'Medium' };
        if (allergenLower.includes('low')) return { level: 'low', text: 'Low' };
        
        // Default based on common allergens
        if (allergenLower.includes('peanut')) return { level: 'high', text: 'High' };
        if (allergenLower.includes('tree pollen')) return { level: 'high', text: 'High' };
        return { level: 'medium', text: 'Medium' };
    }
});