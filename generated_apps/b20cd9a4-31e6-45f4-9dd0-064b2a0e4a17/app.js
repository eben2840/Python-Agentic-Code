document.addEventListener('DOMContentLoaded', function() {
    const patientSelect = document.getElementById('patientSelect');
    const patientInfo = document.getElementById('patient-info');
    const carePlanContent = document.getElementById('care-plan-content');
    const noDiabeticPatients = document.getElementById('no-diabetic-patients');
    
    // Check if we have patient data
    if (!window.PATIENT_DATA) {
        console.error('No patient data available');
        showNoDiabeticPatients();
        return;
    }

    const data = window.PATIENT_DATA;
    
    // Initialize the app
    if (data.patient && data.patient.id === 'all') {
        // All patients mode - find diabetic patients
        initializeAllPatientsMode();
    } else {
        // Single patient mode - check if diabetic
        initializeSinglePatientMode();
    }

    function initializeAllPatientsMode() {
        if (!data.patients || !Array.isArray(data.patients)) {
            showNoDiabeticPatients();
            return;
        }

        // Find patients with diabetes-related conditions
        const diabeticPatients = data.patients.filter(patient => {
            if (!patient.data || !patient.data.condition) return false;
            
            return patient.data.condition.some(condition => {
                const conditionName = condition.name ? condition.name.toLowerCase() : '';
                return conditionName.includes('diabetes') || 
                       conditionName.includes('diabetic') ||
                       conditionName.includes('gestational diabetes');
            });
        });

        if (diabeticPatients.length === 0) {
            showNoDiabeticPatients();
            return;
        }

        // Populate patient selector
        diabeticPatients.forEach(patient => {
            const option = document.createElement('option');
            option.value = patient.id;
            option.textContent = `${patient.name} (${patient.gender}, DOB: ${formatDate(patient.birthDate)})`;
            option.dataset.patient = JSON.stringify(patient);
            patientSelect.appendChild(option);
        });

        // Handle patient selection
        patientSelect.addEventListener('change', function() {
            if (this.value) {
                const selectedPatient = JSON.parse(this.options[this.selectedIndex].dataset.patient);
                displayPatientCarePlan(selectedPatient);
            } else {
                hideCarePlan();
            }
        });
    }

    function initializeSinglePatientMode() {
        // Check if current patient has diabetes
        const hasDiabetes = data.condition && data.condition.summary && 
            data.condition.summary.some(condition => {
                const conditionName = condition.name ? condition.name.toLowerCase() : '';
                return conditionName.includes('diabetes') || 
                       conditionName.includes('diabetic') ||
                       conditionName.includes('gestational diabetes');
            });

        if (!hasDiabetes) {
            showNoDiabeticPatients();
            return;
        }

        // Hide selector and show patient info directly
        document.getElementById('patient-selector').style.display = 'none';
        displayPatientCarePlan({
            id: data.patient.id,
            name: data.patient.name,
            gender: data.patient.gender,
            birthDate: data.patient.birthDate,
            data: data
        });
    }

    function displayPatientCarePlan(patient) {
        // Show patient info
        document.getElementById('patient-name').textContent = patient.name || 'Unknown';
        document.getElementById('patient-dob').textContent = formatDate(patient.birthDate) || 'Unknown';
        document.getElementById('patient-gender').textContent = capitalizeFirst(patient.gender) || 'Unknown';
        
        patientInfo.style.display = 'block';
        carePlanContent.style.display = 'block';
        noDiabeticPatients.style.display = 'none';

        // Populate care plan sections
        populateCurrentConditions(patient.data);
        populateCurrentVitals(patient.data);
        populateCurrentMedications(patient.data);
    }

    function populateCurrentConditions(patientData) {
        const conditionsList = document.getElementById('conditions-list');
        conditionsList.innerHTML = '';

        if (!patientData.condition || !patientData.condition.summary || patientData.condition.summary.length === 0) {
            conditionsList.innerHTML = '<div class="no-data">No conditions available</div>';
            return;
        }

        // Filter for diabetes-related conditions
        const diabeticConditions = patientData.condition.summary.filter(condition => {
            const conditionName = condition.name ? condition.name.toLowerCase() : '';
            return conditionName.includes('diabetes') || 
                   conditionName.includes('diabetic') ||
                   conditionName.includes('gestational diabetes');
        });

        if (diabeticConditions.length === 0) {
            conditionsList.innerHTML = '<div class="no-data">No diabetic conditions found</div>';
            return;
        }

        diabeticConditions.forEach(condition => {
            const conditionDiv = document.createElement('div');
            conditionDiv.className = 'condition-item';
            conditionDiv.innerHTML = `
                <div class="item-name">${condition.name || 'Unknown Condition'}</div>
                <div class="item-details">
                    ${condition.status ? `Status: ${condition.status}` : ''}
                    ${condition.date ? ` | Date: ${formatDate(condition.date)}` : ''}
                </div>
            `;
            conditionsList.appendChild(conditionDiv);
        });
    }

    function populateCurrentVitals(patientData) {
        const vitalsList = document.getElementById('vitals-list');
        vitalsList.innerHTML = '';

        // Check both vital_signs and observation for glucose readings
        let glucoseReadings = [];
        
        if (patientData.vital_signs && patientData.vital_signs.summary) {
            const vitalsGlucose = patientData.vital_signs.summary.filter(vital => {
                const vitalName = vital.name ? vital.name.toLowerCase() : '';
                return vitalName.includes('glucose') || vitalName.includes('blood sugar');
            });
            glucoseReadings = glucoseReadings.concat(vitalsGlucose);
        }

        if (patientData.observation && patientData.observation.summary) {
            const obsGlucose = patientData.observation.summary.filter(obs => {
                const obsName = obs.name ? obs.name.toLowerCase() : '';
                return obsName.includes('glucose') || obsName.includes('blood sugar');
            });
            glucoseReadings = glucoseReadings.concat(obsGlucose);
        }

        if (glucoseReadings.length === 0) {
            vitalsList.innerHTML = '<div class="no-data">No glucose readings available</div>';
            return;
        }

        glucoseReadings.forEach(reading => {
            const readingDiv = document.createElement('div');
            readingDiv.className = 'vital-item';
            readingDiv.innerHTML = `
                <div class="item-name">${reading.name || 'Glucose Reading'}</div>
                <div class="item-details">
                    ${reading.value ? `Value: ${reading.value}` : ''}
                    ${reading.date ? ` | Date: ${formatDate(reading.date)}` : ''}
                </div>
            `;
            vitalsList.appendChild(readingDiv);
        });
    }

    function populateCurrentMedications(patientData) {
        const medicationsList = document.getElementById('medications-list');
        medicationsList.innerHTML = '';

        if (!patientData.medicationrequest || !patientData.medicationrequest.summary || patientData.medicationrequest.summary.length === 0) {
            medicationsList.innerHTML = '<div class="no-data">No medications available</div>';
            return;
        }

        // Filter for diabetes-related medications
        const diabeticMedications = patientData.medicationrequest.summary.filter(medication => {
            const medicationName = medication.name ? medication.name.toLowerCase() : '';
            return medicationName.includes('diabetes') || 
                   medicationName.includes('diabetic') ||
                   medicationName.includes('insulin') ||
                   medicationName.includes('metformin') ||
                   medicationName.includes('glucose') ||
                   medicationName.includes('gestational diabetes');
        });

        if (diabeticMedications.length === 0) {
            medicationsList.innerHTML = '<div class="no-data">No diabetic medications found</div>';
            return;
        }

        diabeticMedications.forEach(medication => {
            const medicationDiv = document.createElement('div');
            medicationDiv.className = 'medication-item';
            medicationDiv.innerHTML = `
                <div class="item-name">${medication.name || 'Unknown Medication'}</div>
                <div class="item-details">
                    ${medication.value ? `Dosage: ${medication.value}` : ''}
                    ${medication.status ? ` | Status: ${medication.status}` : ''}
                </div>
            `;
            medicationsList.appendChild(medicationDiv);
        });
    }

    function hideCarePlan() {
        patientInfo.style.display = 'none';
        carePlanContent.style.display = 'none';
    }

    function showNoDiabeticPatients() {
        document.getElementById('patient-selector').style.display = 'none';
        patientInfo.style.display = 'none';
        carePlanContent.style.display = 'none';
        noDiabeticPatients.style.display = 'block';
    }

    function formatDate(dateString) {
        if (!dateString) return '';
        try {
            const date = new Date(dateString);
            return date.toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'short',
                day: 'numeric'
            });
        } catch (e) {
            return dateString;
        }
    }

    function capitalizeFirst(str) {
        if (!str) return '';
        return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
    }
});