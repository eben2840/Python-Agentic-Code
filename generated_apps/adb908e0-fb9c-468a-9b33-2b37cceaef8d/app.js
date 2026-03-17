// Initialize the application when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
    updateCurrentTime();
    setInterval(updateCurrentTime, 60000); // Update time every minute
});

function initializeApp() {
    // Check if patient data is available
    if (typeof window.PATIENT_DATA === 'undefined' || !window.PATIENT_DATA) {
        console.log('No patient data available');
        displayNoDataMessage();
        return;
    }

    const data = window.PATIENT_DATA;
    
    // Handle single patient vs all patients mode
    if (data.patient && data.patient.id !== 'all') {
        displaySinglePatientData(data);
    } else if (data.patients && Array.isArray(data.patients)) {
        displayAllPatientsData(data.patients);
    } else {
        displayNoDataMessage();
    }
}

function displaySinglePatientData(data) {
    // Display patient information
    displayPatientInfo(data.patient);
    
    // Display conditions
    displayConditions(data.condition?.summary || []);
    
    // Display vital signs
    displayVitalSigns(data.vital_signs?.summary || []);
    
    // Assess risk based on available data
    assessDecubitusRisk(data);
    
    // Initialize body map interactions
    initializeBodyMap();
    
    // Initialize positioning schedule
    initializePositioningSchedule();
}

function displayAllPatientsData(patients) {
    // For all patients mode, show summary or select first patient with relevant data
    const patientWithRisk = patients.find(p => 
        p.data.condition?.some(c => 
            c.name?.toLowerCase().includes('immobil') ||
            c.name?.toLowerCase().includes('diabetes') ||
            c.name?.toLowerCase().includes('durchblutung')
        )
    );
    
    if (patientWithRisk) {
        displayPatientInfo(patientWithRisk);
        displayConditions(patientWithRisk.data.condition || []);
        displayVitalSigns(patientWithRisk.data.vital_signs || []);
        assessDecubitusRisk({ 
            patient: patientWithRisk,
            condition: { summary: patientWithRisk.data.condition || [] },
            vital_signs: { summary: patientWithRisk.data.vital_signs || [] }
        });
    } else if (patients.length > 0) {
        displayPatientInfo(patients[0]);
        displayConditions(patients[0].data.condition || []);
        displayVitalSigns(patients[0].data.vital_signs || []);
        assessDecubitusRisk({
            patient: patients[0],
            condition: { summary: patients[0].data.condition || [] },
            vital_signs: { summary: patients[0].data.vital_signs || [] }
        });
    } else {
        displayNoDataMessage();
    }
    
    initializeBodyMap();
    initializePositioningSchedule();
}

function displayPatientInfo(patient) {
    const nameElement = document.getElementById('patientName');
    const genderElement = document.getElementById('patientGender');
    const ageElement = document.getElementById('patientAge');
    
    if (patient.name) {
        nameElement.textContent = patient.name;
    } else {
        nameElement.textContent = 'Keine Patientendaten verfügbar';
    }
    
    if (patient.gender) {
        genderElement.textContent = `Geschlecht: ${patient.gender === 'male' ? 'Männlich' : patient.gender === 'female' ? 'Weiblich' : patient.gender}`;
    } else {
        genderElement.textContent = 'Geschlecht: Keine Daten';
    }
    
    if (patient.birthDate) {
        const age = calculateAge(patient.birthDate);
        ageElement.textContent = `Alter: ${age} Jahre`;
    } else {
        ageElement.textContent = 'Alter: Keine Daten';
    }
}

function displayConditions(conditions) {
    const conditionsContainer = document.getElementById('conditionsList');
    
    if (!conditions || conditions.length === 0) {
        conditionsContainer.innerHTML = '<p class="text-muted">Keine Diagnosedaten verfügbar</p>';
        return;
    }
    
    const conditionsHtml = conditions.map(condition => {
        const statusClass = condition.status === 'active' ? 'status-active' : 'status-resolved';
        const statusText = condition.status === 'active' ? 'Aktiv' : 'Gelöst';
        
        return `
            <div class="condition-item">
                <div>
                    <div class="condition-name">${condition.name || 'Unbekannte Diagnose'}</div>
                    <small class="text-muted">${condition.date || 'Datum unbekannt'}</small>
                </div>
                <span class="condition-status ${statusClass}">${statusText}</span>
            </div>
        `;
    }).join('');
    
    conditionsContainer.innerHTML = conditionsHtml;
}

function displayVitalSigns(vitalSigns) {
    const vitalContainer = document.getElementById('vitalSignsList');
    
    if (!vitalSigns || vitalSigns.length === 0) {
        vitalContainer.innerHTML = '<p class="text-muted">Keine Vitalparameter verfügbar</p>';
        return;
    }
    
    const vitalsHtml = vitalSigns.map(vital => {
        const isNormal = isVitalSignNormal(vital.name, vital.value);
        const statusClass = isNormal ? 'vital-normal' : 'vital-abnormal';
        
        return `
            <div class="vital-item">
                <div>
                    <div class="vital-name">${vital.name || 'Unbekannter Parameter'}</div>
                    <small class="text-muted">${vital.date || 'Datum unbekannt'}</small>
                </div>
                <span class="vital-value ${statusClass}">${vital.value || 'Kein Wert'}</span>
            </div>
        `;
    }).join('');
    
    vitalContainer.innerHTML = vitalsHtml;
}

function assessDecubitusRisk(data) {
    const riskLevelElement = document.getElementById('riskLevel');
    const riskFactorsElement = document.getElementById('riskFactors');
    const intervalElement = document.getElementById('intervalDisplay');
    
    let riskScore = 0;
    let riskFactors = [];
    
    // Analyze conditions for risk factors
    if (data.condition?.summary) {
        data.condition.summary.forEach(condition => {
            const conditionName = (condition.name || '').toLowerCase();
            
            if (conditionName.includes('diabetes')) {
                riskScore += 2;
                riskFactors.push('Diabetes mellitus - Erhöhtes Risiko durch Durchblutungsstörungen');
            }
            if (conditionName.includes('immobil') || conditionName.includes('bettlägerig')) {
                riskScore += 3;
                riskFactors.push('Immobilität - Hauptrisikofaktor für Dekubitus');
            }
            if (conditionName.includes('durchblutung') || conditionName.includes('zirkulation')) {
                riskScore += 2;
                riskFactors.push('Durchblutungsstörungen - Verminderte Gewebeperfusion');