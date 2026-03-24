document.addEventListener('DOMContentLoaded', function() {
    // Initialize the application
    initializeApp();
    
    // Set up event listeners
    setupEventListeners();
});

function initializeApp() {
    // Load patient information
    loadPatientInfo();
    
    // Set current date
    setAssessmentDate();
}

function loadPatientInfo() {
    const patientInfoElement = document.getElementById('patient-info');
    
    if (window.PATIENT_DATA && window.PATIENT_DATA.patient) {
        const patient = window.PATIENT_DATA.patient;
        
        if (patient.id === 'all') {
            // Find Spencer in the patients list
            const spencer = window.PATIENT_DATA.patients?.find(p => 
                p.name && p.name.toLowerCase().includes('spencer')
            );
            
            if (spencer) {
                const age = calculateAge(spencer.birthDate);
                patientInfoElement.textContent = `${spencer.name} • ${spencer.gender || 'Unknown'} • Age ${age || 'Unknown'}`;
            } else {
                patientInfoElement.textContent = 'Spencer • Patient not found in current dataset';
            }
        } else {
            // Single patient view
            const age = calculateAge(patient.birthDate);
            patientInfoElement.textContent = `${patient.name || 'Unknown Patient'} • ${patient.gender || 'Unknown'} • Age ${age || 'Unknown'}`;
        }
    } else {
        patientInfoElement.textContent = 'Spencer • Patient data not available';
    }
}

function calculateAge(birthDate) {
    if (!birthDate) return null;
    
    const birth = new Date(birthDate);
    const today = new Date();
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
        age--;
    }
    
    return age;
}

function setAssessmentDate() {
    const dateElement = document.getElementById('assessment-date');
    const now = new Date();
    const options = { 
        year: 'numeric', 
        month: 'short', 
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    };
    dateElement.textContent = now.toLocaleDateString('en-US', options);
}

function setupEventListeners() {
    const form = document.getElementById('risk-assessment-form');
    const resetButton = document.getElementById('reset-form');
    
    form.addEventListener('submit', handleFormSubmit);
    resetButton.addEventListener('click', resetForm);
}

function handleFormSubmit(event) {
    event.preventDefault();
    
    const formData = new FormData(event.target);
    const scores = calculateRiskScores(formData);
    
    displayResults(scores);
    showResultsSection();
}

function calculateRiskScores(formData) {
    // Fall Risk Score (0-10 scale)
    const fallScore = 
        parseInt(formData.get('age_factor') || 0) +
        parseInt(formData.get('previous_falls') || 0) +
        parseInt(formData.get('mobility') || 0) +
        parseInt(formData.get('medications') || 0);
    
    // Pressure Ulcer Risk (Braden Scale - 6-24, lower is higher risk)
    const pressureScore = 
        parseInt(formData.get('sensory_perception') || 0) +
        parseInt(formData.get('moisture') || 0) +
        parseInt(formData.get('activity') || 0) +
        parseInt(formData.get('nutrition') || 0);
    
    // VTE Risk Score (0-15 scale)
    const vteScore = 
        parseInt(formData.get('surgery_trauma') || 0) +
        parseInt(formData.get('immobility') || 0) +
        parseInt(formData.get('cancer') || 0) +
        parseInt(formData.get('previous_vte') || 0);
    
    return {
        fall: {
            score: fallScore,
            level: getFallRiskLevel(fallScore)
        },
        pressure: {
            score: pressureScore,
            level: getPressureRiskLevel(pressureScore)
        },
        vte: {
            score: vteScore,
            level: getVTERiskLevel(vteScore)
        }
    };
}

function getFallRiskLevel(score) {
    if (score <= 2) return 'low';
    if (score <= 5) return 'moderate';
    return 'high';
}

function getPressureRiskLevel(score) {
    if (score >= 19) return 'low';
    if (score >= 15) return 'moderate';
    return 'high';
}

function getVTERiskLevel(score) {
    if (score <= 2) return 'low';
    if (score <= 6) return 'moderate';
    return 'high';
}

function displayResults(scores) {
    // Update fall risk
    document.getElementById('fall-score').textContent = scores.fall.score;
    document.getElementById('fall-level').textContent = scores.fall.level.charAt(0).toUpperCase() + scores.fall.level.slice(1);
    document.getElementById('fall-level').className = `risk-level ${scores.fall.level}`;
    
    // Update pressure ulcer risk
    document.getElementById('pressure-score').textContent = scores.pressure.score;
    document.getElementById('pressure-level').textContent = scores.pressure.level.charAt(0).toUpperCase() + scores.pressure.level.slice(1);
    document.getElementById('pressure-level').className = `risk-level ${scores.pressure.level}`;
    
    // Update VTE risk
    document.getElementById('vte-score').textContent = scores.vte.score;
    document.getElementById('vte-level').textContent = scores.vte.level.charAt(0).toUpperCase() + scores.vte.level.slice(1);
    document.getElementById('vte-level').className = `risk-level ${scores.vte.level}`;
    
    // Generate interventions
    generateInterventions(scores);
}

function generateInterventions(scores) {
    const interventionsList = document.getElementById('interventions-list');
    const interventions = [];
    
    // Fall risk interventions
    if (scores.fall.level === 'high') {
        interventions.push({
            title: 'High Fall Risk - Immediate Action Required',
            description: 'Implement fall prevention protocol: bed alarm, hourly rounding, non-slip socks, clear pathways, adequate lighting.'
        });
    } else if (scores.fall.level === 'moderate') {
        interventions.push({
            title: 'Moderate Fall Risk - Enhanced Precautions',
            description: 'Regular mobility assessment, medication review, environmental safety check, patient education.'
        });
    }
    
    // Pressure ulcer interventions
    if (scores.pressure.level === 'high') {
        interventions.push({
            title: 'High Pressure Ulcer Risk - Intensive Prevention',
            description: 'Pressure-relieving mattress, 2-hourly repositioning, skin assessment, nutritional support, moisture management.'
        });
    } else if (scores.pressure.level === 'moderate') {
        interventions.push({
            title: 'Moderate Pressure Ulcer Risk - Standard Prevention',
            description: 'Regular repositioning, skin inspection, adequate nutrition, pressure point protection.'
        });
    }
    
    // VTE risk interventions
    if (scores.vte.level === 'high') {
        interventions.push({
            title: 'High VTE Risk - Prophylaxis Required',
            description: 'Consider pharmacological prophylaxis, mechanical prophylaxis (compression stockings/IPC), early mobilization.'
        });
    } else if (scores.vte.level === 'moderate') {
        interventions.push({
            title: 'Moderate VTE Risk - Enhanced Monitoring',
            description: 'Mechanical prophylaxis, encourage mobility, adequate hydration, regular assessment.'
        });
    }
    
    // Default low-risk interventions
    if (interventions.length === 0) {
        interventions.push({
            title: 'Low Risk - Standard Care',
            description: 'Continue routine monitoring and reassess risk factors regularly. Maintain current care plan.'
        });
    }
    
    // Render interventions
    interventionsList.innerHTML = interventions.map(intervention => `
        <div class="intervention-item">
            <h6>${intervention.title}</h6>
            <p>${intervention.description}</p>
        </div>
    `).join('');
}

function showResultsSection() {
    const resultsSection = document.getElementById('risk-results');
    resultsSection.style.display = 'block';
    
    // Smooth scroll to results
    setTimeout(() => {
        resultsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 100);
}

function resetForm() {
    const form = document.getElementById('risk-assessment-form');
    const resultsSection = document.getElementById('risk-results');
    
    form.reset();
    resultsSection.style.display = 'none';
    
    // Scroll back to top of form
    form.scrollIntoView({ behavior: 'smooth', block: 'start' });
}