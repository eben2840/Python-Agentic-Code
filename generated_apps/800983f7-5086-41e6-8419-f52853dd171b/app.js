document.addEventListener('DOMContentLoaded', function() {
    const data = window.PATIENT_DATA;
    if (!data) { 
        document.getElementById('patientInfo').textContent = 'No patient data available';
        return; 
    }

    // Load patient basic information
    if (data.patient) {
        document.getElementById('patientName').textContent = data.patient.name || 'Unknown';
        document.getElementById('patientGender').textContent = data.patient.gender || 'Unknown';
        document.getElementById('patientBirth').textContent = data.patient.birthDate || 'Unknown';
        
        // Calculate age if birth date available
        if (data.patient.birthDate) {
            const birthDate = new Date(data.patient.birthDate);
            const today = new Date();
            const age = today.getFullYear() - birthDate.getFullYear();
            document.getElementById('patientAge').textContent = age + ' years';
        }

        document.getElementById('patientInfo').textContent = `Assessment for ${data.patient.name || 'Patient'}`;
    }

    // Load latest vital signs
    if (data.vital_signs && data.vital_signs.summary && data.vital_signs.summary.length > 0) {
        const vitalsContainer = document.getElementById('latestVitals');
        vitalsContainer.innerHTML = '';
        
        // Show most recent vitals (limit to 4 most important)
        const importantVitals = data.vital_signs.summary
            .filter(vital => ['blood-pressure', 'heart-rate', 'body-temperature', 'respiratory-rate'].includes(vital.code))
            .slice(0, 4);

        importantVitals.forEach(vital => {
            const vitalDiv = document.createElement('div');
            vitalDiv.className = 'vital-item';
            vitalDiv.innerHTML = `
                <span>${vital.display}</span>
                <span class="vital-value">${vital.value} ${vital.unit || ''}</span>
            `;
            vitalsContainer.appendChild(vitalDiv);
        });

        if (importantVitals.length === 0) {
            vitalsContainer.innerHTML = '<p class="text-muted mb-0">No vital signs available</p>';
        }
    } else {
        document.getElementById('latestVitals').innerHTML = '<p class="text-muted mb-0">No vital signs available</p>';
    }

    // Load current conditions
    if (data.conditions && data.conditions.summary && data.conditions.summary.length > 0) {
        document.getElementById('currentConditions').style.display = 'block';
        const conditionsContainer = document.getElementById('conditionsList');
        conditionsContainer.innerHTML = '';

        data.conditions.summary.forEach(condition => {
            const conditionSpan = document.createElement('span');
            conditionSpan.className = 'condition-badge';
            conditionSpan.textContent = condition.condition;
            conditionsContainer.appendChild(conditionSpan);
        });
    }

    // Form submission handler
    document.getElementById('assessmentForm').addEventListener('submit', function(e) {
        e.preventDefault();
        
        const formData = {
            patientId: data.patient?.id || 'unknown',
            chiefComplaint: document.getElementById('chiefComplaint').value,
            presentIllness: document.getElementById('presentIllness').value,
            generalAppearance: document.getElementById('generalAppearance').value,
            consciousness: document.getElementById('consciousness').value,
            physicalFindings: document.getElementById('physicalFindings').value,
            clinicalAssessment: document.getElementById('clinicalAssessment').value,
            treatmentPlan: document.getElementById('treatmentPlan').value,
            timestamp: new Date().toISOString()
        };

        // Here you would typically send the data to your backend
        console.log('Assessment submitted:', formData);
        
        // Show success message
        alert('Assessment completed successfully!');
    });
});