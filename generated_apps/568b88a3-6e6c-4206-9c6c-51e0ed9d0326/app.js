// Global variables
let conditionChart, demographicsChart, ageChart;
let allPatients = [];
let filteredPatients = [];

// Initialize the dashboard
document.addEventListener('DOMContentLoaded', function() {
    if (window.PATIENT_DATA && window.PATIENT_DATA.patient.id === 'all') {
        allPatients = window.PATIENT_DATA.patients || [];
        filteredPatients = [...allPatients];
        
        initializeDashboard();
        setupEventListeners();
    } else {
        showNoDataMessage();
    }
});

function initializeDashboard() {
    updateMetrics();
    createConditionChart();
    createDemographicsChart();
    createAgeChart();
    updateRiskStratification();
    populatePatientTable();
    populateConditionFilter();
}

function updateMetrics() {
    const totalPatients = allPatients.length;
    const totalConditions = allPatients.reduce((sum, patient) => {
        return sum + (patient.data.condition?.length || 0);
    }, 0);
    const totalMedications = allPatients.reduce((sum, patient) => {
        return sum + (patient.data.medicationrequest?.length || 0);
    }, 0);
    const highRiskPatients = allPatients.filter(patient => {
        const conditionCount = patient.data.condition?.length || 0;
        return conditionCount >= 2; // High risk if 2+ conditions
    }).length;

    document.getElementById('totalPatients').textContent = totalPatients;
    document.getElementById('totalConditions').textContent = totalConditions;
    document.getElementById('totalMedications').textContent = totalMedications;
    document.getElementById('highRiskPatients').textContent = highRiskPatients;
}

function createConditionChart() {
    const ctx = document.getElementById('conditionChart').getContext('2d');
    
    // Count conditions
    const conditionCounts = {};
    allPatients.forEach(patient => {
        if (patient.data.condition) {
            patient.data.condition.forEach(condition => {
                const name = condition.name || 'Unknown Condition';
                conditionCounts[name] = (conditionCounts[name] || 0) + 1;
            });
        }
    });

    const sortedConditions = Object.entries(conditionCounts)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 10); // Top 10 conditions

    if (sortedConditions.length === 0) {
        showChartNoData('conditionChart');
        return;
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
                        maxRotation: 45
                    }
                }
            }
        }
    });
}

function createDemographicsChart() {
    const ctx = document.getElementById('demographicsChart').getContext('2d');
    
    const genderCounts = { male: 0, female: 0, other: 0 };
    allPatients.forEach(patient => {
        const gender = patient.gender?.toLowerCase() || 'other';
        if (genderCounts.hasOwnProperty(gender)) {
            genderCounts[gender]++;
        } else {
            genderCounts.other++;
        }
    });

    if (allPatients.length === 0) {
        showChartNoData('demographicsChart');
        return;
    }

    demographicsChart = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: ['Male', 'Female', 'Other'],
            datasets: [{
                data: [genderCounts.male, genderCounts.female, genderCounts.other],
                backgroundColor: ['#3b82f6', '#ec4899', '#10b981'],
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

function createAgeChart() {
    const ctx = document.getElementById('ageChart').getContext('2d');
    
    const ageGroups = {
        '0-18': 0,
        '19-35': 0,
        '36-50': 0,
        '51-65': 0,
        '65+': 0
    };

    allPatients.forEach(patient => {
        if (patient.birthDate) {
            const age = calculateAge(patient.birthDate);
            if (age <= 18) ageGroups['0-18']++;
            else if (age <= 35) ageGroups['19-35']++;
            else if (age <= 50) ageGroups['36-50']++;
            else if (age <= 65) ageGroups['51-65']++;
            else ageGroups['65+']++;
        }
    });

    if (allPatients.length === 0) {
        showChartNoData('ageChart');
        return;
    }

    ageChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: Object.keys(ageGroups),
            datasets: [{
                label: 'Number of Patients',
                data: Object.values(ageGroups),
                backgroundColor: '#14b8a6',
                borderColor: '#0d9488',
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
                }
            }
        }
    });
}

function updateRiskStratification() {
    const riskCounts = { high: 0, medium: 0, low: 0 };
    
    allPatients.forEach(patient => {
        const conditionCount = patient.data.condition?.length || 0;
        if (conditionCount >= 2) riskCounts.high++;
        else if (conditionCount === 1) riskCounts.medium++;
        else riskCounts.low++;
    });

    const riskGrid = document.getElementById('riskGrid');
    riskGrid.innerHTML = `
        <div class="risk-item risk-high">
            <div class="risk-label">
                <i class="fas fa-exclamation-triangle me-2"></i>
                High Risk (2+ Conditions)
            </div>
            <div class="risk-count">${riskCounts.high}</div>
        </div>
        <div class="risk-item risk-medium">
            <div class="risk-label">
                <i class="fas fa-exclamation-circle me-2"></i>
                Medium Risk (1 Condition)
            </div>
            <div class="risk-count">${riskCounts.medium}</div>
        </div>
        <div class="risk-item risk-low">
            <div class="risk-label">
                <i class="fas fa-check-circle me-2"></i>
                Low Risk (No Conditions)
            </div>
            <div class="risk-count">${riskCounts.low}</div>
        </div>
    `;
}

function populatePatientTable() {
    const tbody = document.getElementById('patientsTableBody');
    
    if (filteredPatients.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7" class="text-center text-muted py-4">No patients found</td></tr>';
        return;
    }

    tbody.innerHTML = filteredPatients.map(patient => {
        const age = patient.birthDate ? calculateAge(patient.birthDate) : 'Unknown';
        const gender = patient.gender || 'Unknown';
        const conditions = patient.data.condition || [];
        const medications = patient.data.medicationrequest || [];
        const observations = patient.data.observation || [];
        
        const riskLevel = conditions.length >= 2 ? 'high' : conditions.length === 1 ? 'medium' : 'low';
        const riskBadge = `<span class="badge badge-${riskLevel}">${riskLevel.toUpperCase()}</span>`;
        
        const conditionBadges = conditions.slice(0, 2).map(condition => 
            `<span class="badge condition-badge">${condition.name || 'Unknown'}</span>`
        ).join('');
        
        const moreConditions = conditions.length > 2 ? `<span class="text-muted">+${conditions.length - 2} more</span>` : '';
        
        const latestObs = observations.length > 0 ? observations[0].name || 'No data' : 'No data available';

        return `
            <tr>
                <td><strong>${patient.name || 'Unknown Patient'}</strong></td>
                <td>${age}</td>
                <td>${gender}</td>
                <td>${conditionBadges}${moreConditions}</td>
                <td>${medications.length}</td>
                <td>${riskBadge}</td>
                <td class="text-muted">${latestObs}</td>
            </tr>
        `;
    }).join('');
}

function populateConditionFilter() {
    const select = document.getElementById('conditionFilter');
    const conditions = new Set();
    
    allPatients.forEach(patient => {
        if (patient.data.condition) {
            patient.data.condition.forEach(condition => {
                if (condition.name) {
                    conditions.add(condition.name);
                }
            });
        }
    });

    const sortedConditions = Array.from(conditions).sort();
    select.innerHTML = '<option value="all">All Conditions</option>' +
        sortedConditions.map(condition => 
            `<option value="${condition}">${condition}</option>`
        ).join('');
}

function setupEventListeners() {
    // Search functionality
    document.getElementById('searchPatients').addEventListener('input', function(e) {
        const searchTerm = e.target.value.toLowerCase();
        filteredPatients = allPatients.filter(patient => 
            (patient.name || '').toLowerCase().includes(searchTerm) ||
            (patient.data.condition || []).some(condition => 
                (condition.name || '').toLowerCase().includes(searchTerm)
            )
        );
        populatePatientTable();
    });

    // Condition filter
    document.getElementById('conditionFilter').addEventListener('change', function(e) {
        const selectedCondition = e.target.value;
        if (selectedCondition === 'all') {
            filteredPatients = [...allPatients];
        } else {
            filteredPatients = allPatients.filter(patient =>
                (patient.data.condition || []).some(condition =>
                    condition.name === selectedCondition
                )
            );
        }
        populatePatientTable();
    });
}

// Utility functions
function calculateAge(birthDate) {
    const today = new Date();
    const birth = new Date(birthDate);
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
        age--;
    }
    
    return age;
}

function showChartNoData(chartId) {
    const canvas = document.getElementById(chartId);
    const container = canvas.parentElement;
    container.innerHTML = '<div class="no-data">No data available</div>';
}

function showNoDataMessage() {
    document.body.innerHTML = `
        <div class="container-fluid p-4">
            <div class="row justify-content-center">
                <div class="col-md-6">
                    <div class="data-card text-center">
                        <div class="p-5">
                            <i class="fas fa-chart-line fa-3x text-muted mb-3"></i>
                            <h3>Population Health Dashboard</h3>
                            <p class="text-muted">This dashboard requires population data (all patients view) to display health metrics and trends.</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;
}