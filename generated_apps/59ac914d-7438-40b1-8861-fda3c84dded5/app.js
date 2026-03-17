// Global variables
let fluidChart = null;
let patientData = null;

// Initialize the application
document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
});

function initializeApp() {
    // Check if patient data is available
    if (typeof window.PATIENT_DATA === 'undefined') {
        console.error('Patient data not available');
        displayNoDataMessage();
        return;
    }
    
    patientData = window.PATIENT_DATA;
    
    // Load patient information
    loadPatientInfo();
    
    // Load fluid balance data
    loadFluidBalanceData();
    
    // Load related conditions
    loadRelatedConditions();
    
    // Initialize chart
    initializeChart();
}

function loadPatientInfo() {
    const patientInfoElement = document.getElementById('patient-info');
    
    if (!patientData.patient) {
        patientInfoElement.textContent = 'No patient information available';
        return;
    }
    
    const name = patientData.patient.name || 'Unknown Patient';
    const gender = patientData.patient.gender || 'Unknown';
    const birthDate = patientData.patient.birthDate || 'Unknown';
    
    patientInfoElement.textContent = `${name} | Gender: ${gender} | DOB: ${birthDate}`;
}

function loadFluidBalanceData() {
    // Get fluid-related observations
    const observations = patientData.observation?.summary || [];
    
    // Filter for fluid-related observations
    const fluidObservations = observations.filter(obs => 
        obs.name && (
            obs.name.toLowerCase().includes('fluid') ||
            obs.name.toLowerCase().includes('intake') ||
            obs.name.toLowerCase().includes('output') ||
            obs.name.toLowerCase().includes('urine') ||
            obs.name.toLowerCase().includes('iv') ||
            obs.name.toLowerCase().includes('oral')
        )
    );
    
    if (fluidObservations.length === 0) {
        displayNoFluidData();
        return;
    }
    
    // Separate intake and output
    const intakeData = fluidObservations.filter(obs => 
        obs.name.toLowerCase().includes('intake') || 
        obs.name.toLowerCase().includes('iv') ||
        obs.name.toLowerCase().includes('oral')
    );
    
    const outputData = fluidObservations.filter(obs => 
        obs.name.toLowerCase().includes('output') || 
        obs.name.toLowerCase().includes('urine')
    );
    
    // Calculate totals
    const totalIntake = calculateTotal(intakeData);
    const totalOutput = calculateTotal(outputData);
    const netBalance = totalIntake - totalOutput;
    
    // Update summary cards
    updateSummaryCards(totalIntake, totalOutput, netBalance);
    
    // Update data tables
    updateDataTables(intakeData, outputData);
    
    // Update chart
    updateFluidChart(intakeData, outputData);
    
    // Check for clinical alerts
    checkClinicalAlerts(netBalance, totalIntake, totalOutput);
}

function calculateTotal(observations) {
    return observations.reduce((total, obs) => {
        if (obs.value && typeof obs.value === 'string') {
            const numericValue = parseFloat(obs.value.replace(/[^\d.-]/g, ''));
            return total + (isNaN(numericValue) ? 0 : numericValue);
        }
        return total;
    }, 0);
}

function updateSummaryCards(totalIntake, totalOutput, netBalance) {
    document.getElementById('total-intake').textContent = totalIntake > 0 ? `${totalIntake.toFixed(0)} mL` : 'No data available';
    document.getElementById('total-output').textContent = totalOutput > 0 ? `${totalOutput.toFixed(0)} mL` : 'No data available';
    
    const netBalanceElement = document.getElementById('net-balance');
    const balanceStatusElement = document.getElementById('balance-status');
    
    if (totalIntake > 0 || totalOutput > 0) {
        netBalanceElement.textContent = `${netBalance >= 0 ? '+' : ''}${netBalance.toFixed(0)} mL`;
        
        if (netBalance > 500) {
            netBalanceElement.className = 'text-success mb-0';
            balanceStatusElement.textContent = 'Positive';
            balanceStatusElement.className = 'badge badge-positive';
        } else if (netBalance < -500) {
            netBalanceElement.className = 'text-warning mb-0';
            balanceStatusElement.textContent = 'Negative';
            balanceStatusElement.className = 'badge badge-negative';
        } else {
            netBalanceElement.className = 'text-primary mb-0';
            balanceStatusElement.textContent = 'Balanced';
            balanceStatusElement.className = 'badge badge-neutral';
        }
    } else {
        netBalanceElement.textContent = 'No data available';
        balanceStatusElement.textContent = 'No data available';
        balanceStatusElement.className = 'badge bg-secondary';
    }
}

function updateDataTables(intakeData, outputData) {
    updateTable('intake-table', intakeData, 'intake');
    updateTable('output-table', outputData, 'output');
}

function updateTable(tableId, data, type) {
    const tableBody = document.getElementById(tableId);
    
    if (data.length === 0) {
        tableBody.innerHTML = `<tr><td colspan="4" class="text-center text-muted">No ${type} data available</td></tr>`;
        return;
    }
    
    const rows = data.map(obs => {
        const time = obs.date ? new Date(obs.date).toLocaleTimeString() : 'Unknown';
        const name = obs.name || 'Unknown';
        const value = obs.value || 'No value';
        const status = obs.status || 'unknown';
        
        const statusClass = getStatusClass(status);
        
        return `
            <tr>
                <td>${time}</td>
                <td>${name}</td>
                <td>${value}</td>
                <td><span class="status-badge ${statusClass}">${status}</span></td>
            </tr>
        `;
    }).join('');
    
    tableBody.innerHTML = rows;
}

function getStatusClass(status) {
    switch (status.toLowerCase()) {
        case 'final': return 'status-final';
        case 'preliminary': return 'status-preliminary';
        case 'amended': return 'status-amended';
        default: return 'status-preliminary';
    }
}

function initializeChart() {
    const ctx = document.getElementById('fluidChart').getContext('2d');
    
    fluidChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: [],
            datasets: [
                {
                    label: 'Intake',
                    data: [],
                    borderColor: '#22c55e',
                    backgroundColor: 'rgba(34, 197, 94, 0.1)',
                    tension: 0.4
                },
                {
                    label: 'Output',
                    data: [],
                    borderColor: '#f59e0b',
                    backgroundColor: 'rgba(245, 158, 11, 0.1)',
                    tension: 0.4
                },
                {
                    label: 'Net Balance',
                    data: [],
                    borderColor: '#3b82f6',
                    backgroundColor: 'rgba(59, 130, 246, 0.1)',
                    tension: 0.4
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'top',
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    title: {
                        display: true,
                        text: 'Volume (mL)'
                    }
                },
                x: {
                    title: {
                        display: true,
                        text: 'Time'
                    }
                }
            }
        }
    });
}

function updateFluidChart(intakeData, outputData) {
    if (!fluidChart) return;
    
    // Create time-based data points
    const allData = [...intakeData, ...outputData].sort((a, b) => 
        new Date(a.date || 0) - new Date(b.date || 0)
    );
    
    if (allData.length === 0) {
        fluidChart.data.labels = ['No data'];
        fluidChart.data.datasets[0].data = [0];
        fluidChart.data.datasets[1].data = [0];
        fluidChart.data.datasets[2].data = [0];
        fluidChart.update();
        return;
    }
    
    const labels = allData.map(obs => 
        obs.date ? new Date(obs.date).toLocaleTimeString() : 'Unknown'
    );
    
    let cumulativeIntake = 0;
    let cumulativeOutput = 0;
    
    const intakeValues = [];
    const outputValues = [];
    const netBalanceValues = [];
    
    allData.forEach(obs => {
        const value = obs.value ? parseFloat(obs.value.replace(/[^\d.-]/g, '')) || 0 : 0;
        
        if (obs.name && (obs.name.toLowerCase().includes('intake') || 
                        obs.name.toLowerCase().includes('iv') ||
                        obs.name.toLowerCase().includes('oral'))) {
            cumulativeIntake += value;
        } else {
            cumulativeOutput += value;
        }
        
        intakeValues.push(cumulativeIntake);
        outputValues.push(cumulativeOutput);
        netBalanceValues.push(cumulativeIntake - cumulativeOutput);
    });
    
    fluidChart.data.labels = labels;
    fluidChart.data.datasets[0].data = intakeValues;
    fluidChart.data.datasets[1].data = outputValues;
    fluidChart.data.datasets[2].data = netBalanceValues;
    fluidChart.update();
}

function checkClinicalAlerts(netBalance, totalIntake, totalOutput) {
    const alertsContainer = document.getElementById('clinical-alerts');
    const alerts = [];
    
    if (netBalance > 1000) {
        alerts.push({
            type: 'warning',
            icon: 'fas fa-exclamation-triangle',
            message: 'Positive fluid balance >1000mL - Monitor for fluid overload'
        });
    }
    
    if (netBalance < -1000) {
        alerts.push({
            type: 'danger',
            icon: 'fas fa-exclamation-circle',
            message: 'Negative fluid balance >1000mL - Risk of dehydration'
        });
    }
    
    if (totalIntake < 1000 && totalOutput > 0) {
        alerts.push({
            type: 'info',
            icon: 'fas fa-info-circle',
            message: 'Low fluid intake - Consider increasing oral or IV fluids'
        });
    }
    
    if (alerts.length === 0) {
        alertsContainer.innerHTML = '<div class="alert alert-info"><i class="fas fa-info-circle me-2"></i>No active alerts</div>';
    } else {
        const alertsHtml = alerts.map(alert => `
            <div class="alert alert-${alert.type}">
                <i class="${alert.icon} me-2"></i>
                ${alert.message}
            </div>
        `).join('');
        alertsContainer.innerHTML = alertsHtml;
    }
}

function loadRelatedConditions() {
    const conditionsContainer = document.getElementById('related-conditions');
    
    if (!patientData.condition?.summary || patientData.condition.summary.length === 0) {
        conditionsContainer.innerHTML = '<p class="text-muted">No related conditions data available</p>';
        return;
    }
    
    // Filter for fluid-related conditions
    const fluidRelatedConditions = patientData.condition.summary.filter(condition => 
        condition.name && (
            condition.name.toLowerCase().includes('heart failure') ||
            condition.name.toLowerCase().includes('kidney') ||
            condition.name.toLowerCase().includes('renal') ||
            condition.name.toLowerCase().includes('dehydration') ||
            condition.name.toLowerCase().includes('edema') ||
            condition.name.toLowerCase().includes('fluid')
        )
    );
    
    if (fluidRelatedConditions.length === 0) {
        conditionsContainer.innerHTML = '<p class="text-muted">No fluid-related conditions found</p>';
        return;
    }
    
    const conditionsHtml = fluidRelatedConditions.map(condition => {
        const statusClass = condition.status === 'active' ? 'condition-active' : 'condition-resolved';
        return `<span class="condition-badge ${statusClass}">${condition.name} (${condition.status || 'unknown'})</span>`;
    }).join('');
    
    conditionsContainer.innerHTML = conditionsHtml;
}

function displayNoDataMessage() {
    document.getElementById('patient-info').textContent = 'No patient data available';
    displayNoFluidData();
}

function displayNoFluidData() {
    document.getElementById('total-intake').textContent = 'No data available';
    document.getElementById('total-output').textContent = 'No data available';
    document.getElementById('net-balance').textContent = 'No data available';
    document.getElementById('balance-status').textContent = 'No data available';
    document.getElementById('balance-status').className = 'badge bg-secondary';
    
    const alertsContainer = document.getElementById('clinical-alerts');
    alertsContainer.innerHTML = '<div class="alert alert-info"><i class="fas fa-info-circle me-2"></i>No fluid balance data available</div>';
}