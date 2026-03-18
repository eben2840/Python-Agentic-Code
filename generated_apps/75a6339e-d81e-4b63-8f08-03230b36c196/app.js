// Global variables
let allPatients = [];
let filteredPatients = [];
let currentFilters = {
    risk: '',
    condition: '',
    age: ''
};

// Initialize the application
document.addEventListener('DOMContentLoaded', function() {
    if (window.PATIENT_DATA) {
        initializeDashboard();
        setupEventListeners();
    } else {
        showEmptyState();
    }
});

function initializeDashboard() {
    const data = window.PATIENT_DATA;
    
    if (data.patient.id === 'all') {
        // Multi-patient mode
        allPatients = data.patients || [];
        processPatientData();
        renderDashboard();
    } else {
        // Single patient mode - convert to array for consistent handling
        allPatients = [data];
        processPatientData();
        renderDashboard();
    }
}

function processPatientData() {
    // Calculate risk scores and add metadata to each patient
    allPatients = allPatients.map(patient => {
        const riskScore = calculateRiskScore(patient);
        const riskLevel = getRiskLevel(riskScore);
        const age = calculateAge(patient.birthDate);
        
        return {
            ...patient,
            riskScore,
            riskLevel,
            age,
            conditions: extractConditions(patient),
            medications: extractMedications(patient),
            observations: extractObservations(patient)
        };
    });
    
    filteredPatients = [...allPatients];
    populateFilterOptions();
}

function calculateRiskScore(patient) {
    let score = 0;
    
    // Age factor (higher risk for elderly)
    const age = calculateAge(patient.birthDate);
    if (age >= 75) score += 3;
    else if (age >= 65) score += 2;
    else if (age >= 50) score += 1;
    
    // Condition-based risk factors
    const conditions = extractConditions(patient);
    conditions.forEach(condition => {
        const conditionName = condition.name?.toLowerCase() || '';
        
        // High-risk conditions
        if (conditionName.includes('diabetes') || 
            conditionName.includes('sepsis') || 
            conditionName.includes('dementia') ||
            conditionName.includes('ckd') ||
            conditionName.includes('anemia')) {
            score += 3;
        }
        // Medium-risk conditions
        else if (conditionName.includes('hypertension') ||
                 conditionName.includes('copd') ||
                 conditionName.includes('depression') ||
                 conditionName.includes('hypothyroidism')) {
            score += 2;
        }
        // Mobility-related conditions (highest risk)
        else if (conditionName.includes('fractur') ||
                 conditionName.includes('femur')) {
            score += 4;
        }
    });
    
    // Observation-based factors
    const observations = extractObservations(patient);
    observations.forEach(obs => {
        const obsName = obs.name?.toLowerCase() || '';
        
        // Pain indicators
        if (obsName.includes('pain') || obsName.includes('vas')) {
            score += 2;
        }
        // Mobility indicators
        if (obsName.includes('mmse') || obsName.includes('das28')) {
            score += 1;
        }
    });
    
    return Math.min(score, 10); // Cap at 10
}

function getRiskLevel(score) {
    if (score >= 7) return 'high';
    if (score >= 4) return 'medium';
    return 'low';
}

function calculateAge(birthDate) {
    if (!birthDate) return 0;
    const birth = new Date(birthDate);
    const today = new Date();
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
        age--;
    }
    return age;
}

function extractConditions(patient) {
    if (patient.data && patient.data.condition) {
        return patient.data.condition.summary || [];
    }
    return patient.condition?.summary || [];
}

function extractMedications(patient) {
    if (patient.data && patient.data.medicationrequest) {
        return patient.data.medicationrequest.summary || [];
    }
    return patient.medicationrequest?.summary || [];
}

function extractObservations(patient) {
    if (patient.data && patient.data.observation) {
        return patient.data.observation.summary || [];
    }
    return patient.observation?.summary || [];
}

function populateFilterOptions() {
    // Populate condition filter
    const conditionFilter = document.getElementById('conditionFilter');
    const uniqueConditions = new Set();
    
    allPatients.forEach(patient => {
        const conditions = extractConditions(patient);
        conditions.forEach(condition => {
            if (condition.name) {
                uniqueConditions.add(condition.name);
            }
        });
    });
    
    // Clear existing options except the first one
    while (conditionFilter.children.length > 1) {
        conditionFilter.removeChild(conditionFilter.lastChild);
    }
    
    // Add condition options
    Array.from(uniqueConditions).sort().forEach(condition => {
        const option = document.createElement('option');
        option.value = condition;
        option.textContent = condition;
        conditionFilter.appendChild(option);
    });
}

function renderDashboard() {
    updateRiskSummary();
    renderPatientGrid();
    renderPositioningSchedule();
    updateRiskFactorsChart();
}

function updateRiskSummary() {
    const highRisk = filteredPatients.filter(p => p.riskLevel === 'high').length;
    const mediumRisk = filteredPatients.filter(p => p.riskLevel === 'medium').length;
    const lowRisk = filteredPatients.filter(p => p.r