document.addEventListener('DOMContentLoaded', function() {
    // Initialize the application
    initializeApp();
    
    // Set up event listeners
    setupEventListeners();
});

function initializeApp() {
    // Check if patient data is available
    if (!window.PATIENT_DATA) {
        console.error('Patient data not available');
        document.getElementById('patient-info').textContent = 'Patient data not available';
        return;
    }
    
    // Populate patient information
    populatePatientInfo();
    
    // Populate clinical context
    populateClinicalContext();
}

function populatePatientInfo() {
    const data = window.PATIENT_DATA;
    
    if (data.patient && data.patient.id !== 'all') {
        // Single patient
        const patient = data.patient;
        
        document.getElementById('patient-name').value = patient.name || 'No data available';
        document.getElementById('patient-gender').value = patient.gender || 'No data available';
        
        // Calculate age from birth date
        if (patient.birthDate) {
            const age = calculateAge(patient.birthDate);
            document.getElementById('patient-age').value = age + ' years';
        } else {
            document.getElementById('patient-age').value = 'No data available';
        }
        
        // Update header
        document.getElementById('patient-info').textContent = `Patient: ${patient.name || 'Unknown'} | ID: ${patient.id || 'Unknown'}`;
    } else {
        // Handle case where no single patient is selected
        document.getElementById('patient-name').value = 'No data available';
        document.getElementById('patient-gender').value = 'No data available';
        document.getElementById('patient-age').value = 'No data available';
        document.getElementById('patient-info').textContent = 'No patient selected for assessment';
    }
}

function populateClinicalContext() {
    const data = window.PATIENT_DATA;
    
    // Handle locations
    if (data.locations && data.locations.summary && data.locations.summary.length > 0) {
        const location = data.locations.summary[0];
        const locationText = `${location.name || 'Unknown Room'} - ${location.value || 'Unknown Ward'}`;
        document.getElementById('current-location').value = locationText;
    } else {
        document.getElementById('current-location').value = 'No data available';
    }
    
    // Handle encounters
    if (data.encounter && data.encounter.summary) {
        const encounterCount = data.encounter.summary.length;
        document.getElementById('encounter-count').value = `${encounterCount} recent encounters`;
    } else {
        document.getElementById('encounter-count').value = 'No data available';
    }
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

function setupEventListeners() {
    // Calculate risk button
    document.getElementById('calculate-risk').addEventListener('click', calculateRiskScores);
    
    // Save assessment button
    document.getElementById('save-assessment').addEventListener('click', saveAssessment);
    
    // Reset form button
    document.getElementById('reset-form').addEventListener('click', resetForm);
    
    // Auto-calculate when form values change
    const formElements = document.querySelectorAll('select');
    formElements.forEach(element => {
        element.addEventListener('change', autoCalculateRisk);
    });
}

function calculateRiskScores() {
    // Calculate fall risk
    const fallRisk = calculateFallRisk();
    document.getElementById('fall-risk-score').textContent = fallRisk.score;
    document.getElementById('fall-risk-score').className = `risk-score ${fallRisk.class}`;
    
    // Calculate medication risk
    const medRisk = calculateMedicationRisk();
    document.getElementById('med-risk-score').textContent = medRisk.score;
    document.getElementById('med-risk-score').className = `risk-score ${medRisk.class}`;
    
    // Calculate infection risk
    const infectionRisk = calculateInfectionRisk();
    document.getElementById('infection-risk-score').textContent = infectionRisk.score;
    document.getElementById('infection-risk-score').className = `risk-score ${infectionRisk.class}`;
    
    // Calculate pressure ulcer risk
    const pressureRisk = calculatePressureRisk();
    document.getElementById('pressure-risk-score').textContent = pressureRisk.score;
    document.getElementById('pressure-risk-score').className = `risk-score ${pressureRisk.class}`;
    
    // Calculate overall risk
    const overallRisk = calculateOverallRisk(fallRisk.value, medRisk.value, infectionRisk.value, pressureRisk.value);
    document.getElementById('overall-risk').textContent = overallRisk.level;
    document.getElementById('overall-risk').className = `overall-risk-score ${overallRisk.class}`;
}

function calculateFallRisk() {
    const mobility = document.getElementById('mobility-status').value;
    const falls = document.getElementById('previous-falls').value;
    
    let score = 0;
    
    // Mobility scoring
    switch(mobility) {
        case 'independent': score += 0; break;
        case 'assistance': score += 2; break;
        case 'wheelchair': score += 3; break;
        case 'bedbound': score += 1; break;
    }
    
    // Fall history scoring
    switch(falls) {
        case 'none': score += 0; break;
        case 'recent': score += 3; break;
        case 'multiple': score += 5; break;
    }
    
    return getRiskLevel(score, [0, 2, 4]);
}

function calculateMedicationRisk() {
    const highRiskMeds = document.getElementById('high-risk-meds').value;
    const adherence = document.getElementById('med-adherence').value;
    
    let score = 0;
    
    // High-risk medication scoring
    switch(highRiskMeds) {
        case 'none': score += 0; break;
        case 'anticoagulants': score += 3; break;
        case 'sedatives': score += 2; break;
        case 'multiple': score += 4; break;
    }
    
    // Adherence scoring
    switch(adherence) {
        case 'excellent': score += 0; break;
        case 'good': score += 1; break;
        case 'poor': score += 3; break;
        case 'unknown': score += 2; break;
    }
    
    return getRiskLevel(score, [0, 2, 4]);
}

function calculateInfectionRisk() {
    const immuneStatus = document.getElementById('immune-status').value;
    const procedures = document.getElementById('recent-procedures').value;
    
    let score = 0;
    
    // Immune status scoring
    switch(immuneStatus) {
        case 'normal': score += 0; break;
        case 'compromised': score += 3; break;
        case 'suppressed': score += 4; break;
    }
    
    // Recent procedures scoring
    switch(procedures) {
        case 'none': score += 0; break;
        case 'minor': score += 1; break;
        case 'major': score += 3; break;
    }
    
    return getRiskLevel(score, [0, 2, 4]);
}

function calculatePressureRisk() {
    const skinCondition = document.getElementById('skin-condition').value;
    const nutrition = document.getElementById('nutrition-status').value;
    
    let score = 0;
    
    // Skin condition scoring
    switch(skinCondition) {
        case 'intact': score += 0; break;
        case 'fragile': score += 2; break;
        case 'breakdown': score += 4; break;
    }
    
    // Nutrition scoring
    switch(nutrition) {
        case 'adequate': score += 0; break;
        case 'risk': score += 2; break;
        case 'malnourished': score += 3; break;
    }
    
    return getRiskLevel(score, [0, 2, 4]);
}

function getRiskLevel(score, thresholds) {
    let level, riskClass;
    
    if (score <= thresholds[1]) {
        level = 'Low';
        riskClass = 'risk-low';
    } else if (score <= thresholds[2]) {
        level = 'Medium';
        riskClass = 'risk-medium';
    } else {
        level = 'High';
        riskClass = 'risk-high';
    }
    
    return {
        score: level,
        class: riskClass,
        value: score
    };
}

function calculateOverallRisk(fallRisk, medRisk, infectionRisk, pressureRisk) {
    const totalScore = fallRisk + medRisk + infectionRisk + pressureRisk;
    
    let level, riskClass;
    
    if (totalScore <= 4) {
        level = 'Low Risk';
        riskClass = 'risk-low';
    } else if (totalScore <= 8) {
        level = 'Medium Risk';
        riskClass = 'risk-medium';
    } else {
        level = 'High Risk';
        riskClass = 'risk-high';
    }
    
    return {
        level: level,
        class: riskClass
    };
}

function autoCalculateRisk() {
    // Check if all required fields have values
    const requiredFields = [
        'mobility-status', 'previous-falls', 'high-risk-meds', 'med-adherence',
        'immune-status', 'recent-procedures', 'skin-condition', 'nutrition-status'
    ];
    
    const allFieldsFilled = requiredFields.every(fieldId => {
        const field = document.getElementById(fieldId);
        return field && field.value !== '';
    });
    
    if (allFieldsFilled) {
        calculateRiskScores();
    }
}

function saveAssessment() {
    // Collect all form data
    const assessmentData = {
        patient: {
            name: document.getElementById('patient-name').value,
            gender: document.getElementById('patient-gender').value,
            age: document.getElementById('patient-age').value
        },
        clinicalContext: {
            location: document.getElementById('current-location').value,
            encounters: document.getElementById('encounter-count').value
        },
        riskAssessment: {
            fallRisk: {
                mobility: document.getElementById('mobility-status').value,
                previousFalls: document.getElementById('previous-falls').value
            },
            medicationRisk: {
                highRiskMeds: document.getElementById('high-risk-meds').value,
                adherence: document.getElementById('med-adherence').value
            },
            infectionRisk: {
                immuneStatus: document.getElementById('immune-status').value,
                procedures: document.getElementById('recent-procedures').value
            },
            pressureRisk: {
                skinCondition: document.getElementById('skin-condition').value,
                nutrition: document.getElementById('nutrition-status').value
            }
        },
        riskScores: {
            fallRisk: document.getElementById('fall-risk-score').textContent,
            medRisk: document.getElementById('med-risk-score').textContent,
            infectionRisk: document.getElementById('infection-risk-score').textContent,
            pressureRisk: document.getElementById('pressure-risk-score').textContent,
            overallRisk: document.getElementById('overall-risk').textContent
        },
        timestamp: new Date().toISOString()
    };
    
    // In a real application, this would be sent to the server
    console.log('Assessment saved:', assessmentData);
    
    // Show success message
    alert('Risk assessment saved successfully!');
}

function resetForm() {
    if (confirm('Are you sure you want to reset the form? All entered data will be lost.')) {
        // Reset all select elements
        const selects = document.querySelectorAll('select');
        selects.forEach(select => {
            select.value = '';
        });
        
        // Reset risk scores
        const riskScores = document.querySelectorAll('.risk-score');
        riskScores.forEach(score => {
            score.textContent = '-';
            score.className = 'risk-score';
        });
        
        // Reset overall risk
        document.getElementById('overall-risk').textContent = 'Not Calculated';
        document.getElementById('overall-risk').className = 'overall-risk-score';
    }
}