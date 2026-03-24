// Global variables
let conditionChart = null;
let genderChart = null;
let patientData = null;

// Initialize the dashboard
document.addEventListener('DOMContentLoaded', function() {
    // Check if patient data is available
    if (typeof window.PATIENT_DATA === 'undefined') {
        showNoDataMessage();
        return;
    }
    
    patientData = window.PATIENT_DATA;
    
    // Check if we have all patients data
    if (!patientData.patient || patientData.patient.id !== 'all' || !patientData.patients) {
        showNoDataMessage();
        return;
    }
    
    initializeDashboard();
});

function initializeDashboard() {
    updatePopulationMetrics();
    renderConditionChart();
    renderGenderChart();
    renderChronicDiseaseMonitor();
    renderRiskStratification();
    renderClinicalAlerts();
    setupEventListeners();
}

function updatePopulationMetrics() {
    const patients = patientData.patients || [];
    const totalPatients = patients.length;
    
    // Count total conditions
    let totalConditions = 0;
    let chronicConditions = 0;
    let highRiskPatients = 0;
    
    const chronicDiseases = ['hypertension', 'diabetes', 'heart disease', 'copd', 'asthma', 'ckd', 'dementia', 'depression'];
    
    patients.forEach(patient => {
        const conditions = patient.data?.condition || [];
        totalConditions += conditions.length;
        
        let patientChronicCount = 0;
        conditions.forEach(condition => {
            const conditionName = condition.name?.toLowerCase() || '';
            if (chronicDiseases.some(chronic => conditionName.includes(chronic))) {
                chronicConditions++;
                patientChronicCount++;
            }
        });
        
        // High risk: patients with 2+ conditions or specific high-risk conditions
        if (conditions.length >= 2 || patientChronicCount > 0) {
            highRiskPatients++;
        }
    });
    
    document.getElementById('totalPatients').textContent = totalPatients;
    document.getElementById('totalConditions').textContent = totalConditions;
    document.getElementById('chronicConditions').textContent = chronicConditions;
    document.getElementById('highRiskPatients').textContent = highRiskPatients;
}

function renderConditionChart() {
    const patients = patientData.patients || [];
    const conditionCounts = {};
    
    patients.forEach(patient => {
        const conditions = patient.data?.condition || [];
        conditions.forEach(condition => {
            const name = condition.name || 'Unknown Condition';
            conditionCounts[name] = (conditionCounts[name] || 0) + 1;
        });
    });
    
    // Get top 10 conditions
    const sortedConditions = Object.entries(conditionCounts)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 10);
    
    const ctx = document.getElementById('conditionChart').getContext('2d');
    
    if (conditionChart) {
        conditionChart.destroy();
    }
    
    conditionChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: sortedConditions.map(([name]) => name),
            datasets: [{
                label: 'Number of Patients',
                data: sortedConditions.map(([, count]) => count),
                backgroundColor: '#3b82f6',
                borderColor: '#2563eb',
                borderWidth: 1,
                borderRadius: 4
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        stepSize: 1
                    }
                },
                x: {
                    ticks: {
                        maxRotation: 45,
                        minRotation: 45
                    }
                }
            }
        }
    });
}

function renderGenderChart() {
    const patients = patientData.patients || [];
    const genderCounts = { male: 0, female: 0, other: 0 };
    
    patients.forEach(patient => {
        const gender = patient.gender?.toLowerCase() || 'other';
        if (genderCounts.hasOwnProperty(gender)) {
            genderCounts[gender]++;
        } else {
            genderCounts.other++;
        }
    });
    
    const ctx = document.getElementById('genderChart').getContext('2d');
    
    if (genderChart) {
        genderChart.destroy();
    }
    
    genderChart = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: ['Male', 'Female', 'Other'],
            datasets: [{
                data: [genderCounts.male, genderCounts.female, genderCounts.other],
                backgroundColor: ['#3b82f6', '#14b8a6', '#f59e0b'],
                borderWidth: 2,
                borderColor: '#ffffff'
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'bottom'
                }
            }
        }
    });
}

function renderChronicDiseaseMonitor() {
    const patients = patientData.patients || [];
    const chronicDiseases = {
        'Hypertension': { count: 0, icon: 'fas fa-heart', color: '#ef4444' },
        'Diabetes': { count: 0, icon: 'fas fa-tint', color: '#3b82f6' },
        'Heart Disease': { count: 0, icon: 'fas fa-heartbeat', color: '#dc2626' },
        'COPD': { count: 0, icon: 'fas fa-lungs', color: '#f59e0b' },
        'Asthma': { count: 0, icon: 'fas fa-wind', color: '#14b8a6' },
        'Depression': { count: 0, icon: 'fas fa-brain', color: '#8b5cf6' }
    };
    
    patients.forEach(patient => {
        const conditions = patient.data?.condition || [];
        conditions.forEach(condition => {
            const name = condition.name || '';
            Object.keys(chronicDiseases).forEach(disease => {
                if (name.toLowerCase().includes(disease.toLowerCase())) {
                    chronicDiseases[disease].count++;
                }
            });
        });
    });
    
    const container = document.getElementById('chronicDiseaseGrid');
    container.innerHTML = '';
    
    Object.entries(chronicDiseases).forEach(([disease, data]) => {
        const col = document.createElement('div');
        col.className = 'col-xl-2 col-lg-3 col-md-4 col-sm-6 mb-3';
        
        col.innerHTML = `
            <div class="chronic-disease-card">
                <div class="chronic-disease-icon" style="background: ${data.color}">
                    <i class="${data.icon}"></i>
                </div>
                <div class="chronic-disease-name">${disease}</div>
                <div class="chronic-disease-count">${data.count}</div>
            </div>
        `;
        
        container.appendChild(col);
    });
}

function renderRiskStratification() {
    const patients = patientData.patients || [];
    const tbody = document.getElementById('riskTableBody');
    tbody.innerHTML = '';
    
    // Calculate risk for each patient
    const patientRisks = patients.map(patient => {
        const conditions = patient.data?.condition || [];
        const encounters = patient.data?.encounter || [];
        
        let riskLevel = 'low';
        let riskScore = 0;
        
        // Risk factors
        if (conditions.length >= 3) riskScore += 3;
        else if (conditions.length >= 2) riskScore += 2;
        else if (conditions.length >= 1) riskScore += 1;
        
        // High-risk conditions
        const highRiskConditions = ['sepsis', 'cancer', 'heart', 'stroke', 'copd'];
        const hasHighRisk = conditions.some(c => 
            highRiskConditions.some(hr => (c.name || '').toLowerCase().includes(hr))
        );
        if (hasHighRisk) riskScore += 2;
        
        // Age factor
        const age = calculateAge(patient.birthDate);
        if (age >= 65) riskScore += 1;
        
        if (riskScore >= 4) riskLevel = 'high';
        else if (riskScore >= 2) riskLevel = 'medium';
        
        return {
            ...patient,
            conditions,
            encounters,
            riskLevel,
            riskScore,
            age
        };
    });
    
    // Sort by risk score (highest first)
    patientRisks.sort((a, b) => b.riskScore - a.riskScore);
    
    patientRisks.forEach(patient => {
        const row = document.createElement('tr');
        
        const lastEncounter = patient.encounters.length > 0 
            ? formatDate(patient.encounters[0].date) 
            : 'No data available';
        
        const conditionBadges = patient.conditions
            .slice(0, 3)
            .map(c => `<span class="condition-badge">${c.name || 'Unknown'}</span>`)
            .join('');
        
        const moreConditions = patient.conditions.length > 3 
            ? `<span class="condition-badge">+${patient.conditions.length - 3} more</span>` 
            : '';
        
        row.innerHTML = `
            <td><strong>${patient.name || 'Unknown Patient'}</strong></td>
            <td>${patient.age}</td>
            <td>${capitalizeFirst(patient.gender || 'Unknown')}</td>
            <td>${conditionBadges}${moreConditions}</td>
            <td><span class="risk-badge ${patient.riskLevel}">${capitalizeFirst(patient.riskLevel)}</span></td>
            <td>${lastEncounter}</td>
        `;
        
        tbody.appendChild(row);
    });
}

function renderClinicalAlerts() {
    const patients = patientData.patients || [];
    const container = document.getElementById('alertsContainer');
    container.innerHTML = '';
    
    const alerts = [];
    
    patients.forEach(patient => {
        const conditions = patient.data?.condition || [];
        const age = calculateAge(patient.birthDate);
        
        // Multiple conditions alert
        if (conditions.length >= 3) {
            alerts.push({
                type: 'warning',
                title: 'Multiple Conditions Detected',
                description: `${patient.name || 'Unknown Patient'} has ${conditions.length} active conditions requiring care coordination.`,
                patient: patient.name || 'Unknown Patient',
                priority: 'high'
            });
        }
        
        // High-risk condition alert
        const criticalConditions = ['sepsis', 'cancer', 'heart attack', 'stroke'];
        const hasCritical = conditions.some(c => 
            criticalConditions.some(cc => (c.name || '').toLowerCase().includes(cc))
        );
        
        if (hasCritical) {
            alerts.push({
                type: 'danger',
                title: 'Critical Condition Alert',
                description: `${patient.name || 'Unknown Patient'} has a high-priority condition requiring immediate attention.`,
                patient: patient.name || 'Unknown Patient',
                priority: 'critical'
            });
        }
        
        // Elderly with multiple conditions
        if (age >= 75 && conditions.length >= 2) {
            alerts.push({
                type: 'info',
                title: 'Elderly Care Coordination',
                description: `${patient.name || 'Unknown Patient'} (age ${age}) may benefit from geriatric care coordination.`,
                patient: patient.name || 'Unknown Patient',
                priority: 'medium'
            });
        }
    });
    
    // Sort alerts by priority
    const priorityOrder = { critical: 3, high: 2, medium: 1, low: 0 };
    alerts.sort((a, b) => priorityOrder[b.priority] - priorityOrder[a.priority]);
    
    if (alerts.length === 0) {
        container.innerHTML = `
            <div class="no-data">
                <i class="fas fa-check-circle"></i>
                <p>No active alerts at this time</p>
            </div>
        `;
        return;
    }
    
    alerts.slice(0, 10).forEach(alert => {
        const alertDiv = document.createElement('div');
        alertDiv.className = 'alert-item';
        
        alertDiv.innerHTML = `
            <div class="alert-icon ${alert.type}">
                <i class="fas fa-${alert.type === 'danger' ? 'exclamation-triangle' : 
                                   alert.type === 'warning' ? 'exclamation-circle' : 
                                   'info-circle'}"></i>
            </div>
            <div class="alert-content">
                <div class="alert-title">${alert.title}</div>
                <div class="alert-description">${alert.description}</div>
                <div class="alert-meta">Patient: ${alert.patient}</div>
            </div>
        `;
        
        container.appendChild(alertDiv);
    });
}

function setupEventListeners() {
    // Gender filter for condition chart
    document.getElementById('genderFilter').addEventListener('change', function() {
        renderConditionChart(); // In a full implementation, this would filter the chart
    });
    
    // Patient search
    document.getElementById('patientSearch').addEventListener('input', function() {
        const searchTerm = this.value.toLowerCase();
        const rows = document.querySelectorAll('#riskTableBody tr');
        
        rows.forEach(row => {
            const patientName = row.cells[0].textContent.toLowerCase();
            const conditions = row.cells[3].textContent.toLowerCase();
            
            if (patientName.includes(searchTerm) || conditions.includes(searchTerm)) {
                row.style.display = '';
            } else {
                row.style.display = 'none';
            }
        });
    });
}

// Utility functions
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

function formatDate(dateString) {
    if (!dateString) return 'No data available';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'short', 
        day: 'numeric' 
    });
}

function capitalizeFirst(str) {
    if (!str) return '';
    return str.charAt(0).toUpperCase() + str.slice(1);
}

function showNoDataMessage() {
    document.body.innerHTML = `
        <div class="container-fluid d-flex justify-content-center align-items-center" style="height: 100vh;">
            <div class="no-data">
                <i class="fas fa-chart-line"></i>
                <h3>Population Health Dashboard</h3>
                <p>No patient data available for population analysis</p>
            </div>
        </div>
    `;
}