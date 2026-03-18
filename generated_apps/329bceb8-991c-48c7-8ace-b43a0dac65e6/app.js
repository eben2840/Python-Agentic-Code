// Global variables
let conditionData = [];
let patientData = [];
let trendsChart = null;

// Initialize the dashboard
document.addEventListener('DOMContentLoaded', function() {
    initializeDashboard();
    setupEventListeners();
});

function initializeDashboard() {
    if (!window.PATIENT_DATA) {
        showEmptyState();
        return;
    }

    processPatientData();
    updateMetrics();
    renderPrevalenceHeatMap();
    renderRiskStratification();
    renderTrendsChart();
    renderCareGapAlerts();
    renderCorrelationMatrix();
    renderConditionsTable();
}

function processPatientData() {
    conditionData = [];
    patientData = [];

    if (window.PATIENT_DATA.patient && window.PATIENT_DATA.patient.id === 'all') {
        // Process all patients
        const patients = window.PATIENT_DATA.patients || [];
        
        patients.forEach(patient => {
            const patientInfo = {
                id: patient.id,
                name: patient.name,
                gender: patient.gender,
                birthDate: patient.birthDate,
                age: calculateAge(patient.birthDate),
                conditions: []
            };

            // Process conditions for this patient
            if (patient.data && patient.data.condition) {
                patient.data.condition.forEach(condition => {
                    const conditionInfo = {
                        name: condition.name || 'Unknown Condition',
                        status: condition.status || 'active',
                        date: condition.date || null,
                        patientId: patient.id,
                        patientName: patient.name,
                        patientAge: patientInfo.age,
                        patientGender: patient.gender
                    };
                    
                    conditionData.push(conditionInfo);
                    patientInfo.conditions.push(conditionInfo);
                });
            }

            patientData.push(patientInfo);
        });
    } else {
        showEmptyState();
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

function updateMetrics() {
    // Total patients
    document.getElementById('totalPatients').textContent = patientData.length;

    // Total active conditions
    const activeConditions = conditionData.filter(c => c.status === 'active' || !c.status);
    document.getElementById('totalConditions').textContent = activeConditions.length;

    // High risk patients (patients with 3+ conditions)
    const highRiskCount = patientData.filter(p => p.conditions.length >= 3).length;
    document.getElementById('highRiskPatients').textContent = highRiskCount;

    // Care gap alerts (simulated - patients with conditions but no recent encounters)
    const careGapCount = Math.min(patientData.length, Math.floor(patientData.length * 0.15));
    document.getElementById('careGapAlerts').textContent = careGapCount;
}

function renderPrevalenceHeatMap() {
    const grid = document.getElementById('prevalenceGrid');
    
    if (conditionData.length === 0) {
        grid.innerHTML = '<div class="empty-state"><i class="fas fa-chart-bar"></i><h3>No Condition Data</h3><p>No conditions found in the patient population.</p></div>';
        return;
    }

    // Count condition occurrences
    const conditionCounts = {};
    conditionData.forEach(condition => {
        const name = condition.name;
        conditionCounts[name] = (conditionCounts[name] || 0) + 1;
    });

    // Sort by prevalence
    const sortedConditions = Object.entries(conditionCounts)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 12); // Show top 12 conditions

    const totalPatients = patientData.length;
    
    grid.innerHTML = sortedConditions.map(([condition, count]) => {
        const percentage = ((count / totalPatients) * 100).toFixed(1);
        let severity = 'low';
        if (percentage > 30) severity = 'high';
        else if (percentage > 15) severity = 'medium';

        return `
            <div class="prevalence-item ${severity}" data-condition="${condition}">
                <div class="prevalence-condition">${condition}</div>
                <div class="prevalence-count">${count}</div>
                <div class="prevalence-percentage">${percentage}% of patients</div>
            </div>
        `;
    }).join('');

    // Add click handlers
    grid.querySelectorAll('.prevalence-item').forEach(item => {
        item.addEventListener('click', function() {
            const condition = this.dataset.condition;
            filterTableByCondition(condition);
        });
    });
}

function renderRiskStratification() {
    const highRiskContainer = document.getElementById('highRiskPatients');
    const mediumRiskContainer = document.getElementById('mediumRiskPatients');
    const lowRiskContainer = document.getElementById('lowRiskPatients');

    // Categorize patients by risk level
    const highRisk = patientData.filter(p => p.conditions.length >= 3);
    const mediumRisk = patientData.filter(p => p.conditions.length === 2);
    const lowRisk = patientData.filter(p => p.conditions.length <= 1);

    // Update counts
    document.getElementById('highRiskCount').textContent = highRisk.length;
    document.getElementById('mediumRiskCount').textContent = mediumRisk.length;
    document.getElementById('lowRiskCount').textContent = lowRisk.length;

    // Render patient lists
    renderRiskPatients(highRiskContainer, highRisk.slice(0, 5));
    renderRiskPatients(mediumRiskContainer, mediumRisk.slice(0, 5));
    renderRiskPatients(lowRiskContainer, lowRisk.slice(0, 5));
}

function renderRiskPatients(container, patients) {
    if (patients.length === 0) {
        container.innerHTML = '<div class="risk-patient"><span class="patient-name">No patients in this category</span></div>';
        return;
    }

    container.innerHTML = patients.map(patient => `
        <div class="risk-patient">
            <div>
                <div class="patient-name">${patient.name}</div>
                <div class="patient-conditions">${patient.conditions.length} condition(s)</div>
            </div>
        </div>
    `).join('');
}

function renderTrendsChart() {
    const ctx = document.getElementById('trendsChart').getContext('2d');
    
    if (trendsChart) {
        trendsChart.destroy();
    }

    // Simulate trend data based on conditions
    const conditionCounts = {};
    conditionData.forEach(condition => {
        const name = condition.name;
        conditionCounts[name] = (conditionCounts[name] || 0) + 1;
    });

    const topConditions = Object.entries(conditionCounts)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 5);

    const labels = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];
    const datasets = topConditions.map(([condition, count], index) => {
        const colors = ['#14b8a6', '#3b82f6', '#22c55e', '#f59e0b', '#ef4444'];
        // Simulate monthly data
        const data = Array.from({length: 6}, () => Math.floor(Math.random() * count) + 1);
        
        return {
            label: condition,
            data: data,
            borderColor: colors[index],
            backgroundColor: colors[index] + '20',
            tension: 0.4,
            fill: true
        };
    });

    trendsChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: datasets
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'bottom'
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    grid: {
                        color: '#f3f4f6'
                    }
                },
                x: {
                    grid: {
                        color: '#f3f4f6'
                    }
                }
            }
        }
    });
}

function renderCareGapAlerts() {
    const container = document.getElementById('careGaps');
    
    // Simulate care gap alerts
    const alerts = [];
    
    // Find patients with chronic conditions who might need follow-up
    patientData.forEach(patient => {
        const chronicConditions = patient.conditions.filter(c => 
            c.name.toLowerCase().includes('diabetes') ||
            c.name.toLowerCase().includes('hypertension') ||
            c.name.toLowerCase().includes('copd') ||
            c.name.toLowerCase().includes('asthma')
        );
        
        if (chronicConditions.length > 0) {
            alerts.push({
                type: 'Follow-up Overdue',
                priority: 'High',
                description: `${patient.name} may be overdue for routine follow-up`,
                patient: patient.name,
                condition: chronicConditions[0].name
            });
        }
    });

    // Limit to 5 alerts
    const displayAlerts = alerts.slice(0, 5);

    if (displayAlerts.length === 0) {
        container.innerHTML = '<div class="empty-state"><i class="fas fa-check-circle"></i><h3>No Care Gaps</h3><p>All patients are up to date with their care.</p></div>';
        return;
    }

    container.innerHTML = displayAlerts.map(alert => `
        <div class="care-gap-alert">
            <div class="alert-header">
                <div class="alert-title">${alert.type}</div>
                <div class="alert-priority">${alert.priority}</div>
            </div>
            <div class="alert-description">${alert.description}</div>
            <div class="alert-patient">Patient: ${alert.patient}</div>
        </div>
    `).join('');
}

function renderCorrelationMatrix() {
    const container = document.getElementById('correlationMatrix');
    
    if (conditionData.length === 0) {
        container.innerHTML = '<div class="empty-state"><i class="fas fa-project-diagram"></i><h3>No Correlation Data</h3><p>Insufficient data to generate correlation matrix.</p></div>';
        return;
    }

    // Get top conditions for matrix
    const conditionCounts = {};
    conditionData.forEach(condition => {
        conditionCounts[condition.name] = (conditionCounts[condition.name] || 0) + 1;
    });

    const topConditions = Object.keys(conditionCounts)
        .sort((a, b) => conditionCounts[b] - conditionCounts[a])
        .slice(0, 5);

    if (topConditions.length < 2) {
        container.innerHTML = '<div class="empty-state"><i class="fas fa-project-diagram"></i><h3>Insufficient Data</h3><p>Need at least 2 conditions to show correlations.</p></div>';
        return;
    }

    // Calculate correlations (simplified)
    const correlations = {};
    topConditions.forEach(condition1 => {
        correlations[condition1] = {};
        topConditions.forEach(condition2 => {
            if (condition1 === condition2) {
                correlations[condition1][condition2] = 1.0;
            } else {
                // Find patients with both conditions
                const patientsWithBoth = patientData.filter(patient => 
                    patient.conditions.some(c => c.name === condition1) &&
                    patient.conditions.some(c => c.name === condition2)
                ).length;
                
                const patientsWithFirst = patientData.filter(patient =>
                    patient.conditions.some(c => c.name === condition1)
                ).length;
                
                correlations[condition1][condition2] = patientsWithFirst > 0 ? 
                    (patientsWithBoth / patientsWithFirst) : 0;
            }
        });
    });

    // Render matrix
    const gridSize = topConditions.length + 1;
    const grid = document.createElement('div');
    grid.className = 'correlation-grid';
    grid.style.gridTemplateColumns = `repeat(${gridSize}, 1fr)`;

    // Header row
    grid.appendChild(createCorrelationCell('', true));
    topConditions.forEach(condition => {
        grid.appendChild(createCorrelationCell(condition, true));
    });

    // Data rows
    topConditions.forEach(condition1 => {
        grid.appendChild(createCorrelationCell(condition1, true));
        topConditions.forEach(condition2 => {
            const correlation = correlations[condition1][condition2];
            const cell = createCorrelationCell(correlation.toFixed(2), false);
            
            if (correlation > 0.7) cell.classList.add('correlation-high');
            else if (correlation > 0.4) cell.classList.add('correlation-medium');
            else cell.classList.add('correlation-low');
            
            grid.appendChild(cell);
        });
    });

    container.innerHTML = '';
    container.appendChild(grid);
}

function createCorrelationCell(content, isHeader) {
    const cell = document.createElement('div');
    cell.className = `correlation-cell ${isHeader ? 'header' : ''}`;
    cell.textContent = content;
    return cell;
}

function renderConditionsTable() {
    const tbody = document.getElementById('conditionsTableBody');
    
    if (conditionData.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" class="text-center py-4">No condition data available</td></tr>';
        return;
    }

    // Aggregate condition data
    const conditionStats = {};
    
    conditionData.forEach(condition => {
        const name = condition.name;
        if (!conditionStats[name]) {
            conditionStats[name] = {
                name: name,
                patients: new Set(),
                ages: [],
                genders: { male: 0, female: 0, other: 0 }
            };
        }
        
        conditionStats[name].patients.add(condition.patientId);
        if (condition.patientAge) {
            conditionStats[name].ages.push(condition.patientAge);
        }
        
        const gender = condition.patientGender || 'other';
        conditionStats[name].genders[gender]++;
    });

    const totalPatients = patientData.length;
    
    const rows = Object.values(conditionStats).map(stat => {
        const patientCount = stat.patients.size;
        const prevalence = ((patientCount / totalPatients) * 100).toFixed(1);
        const avgAge = stat.ages.length > 0 ? 
            (stat.ages.reduce((sum, age) => sum + age, 0) / stat.ages.length).toFixed(1) : 'N/A';
        
        let riskLevel = 'low';
        if (prevalence > 30) riskLevel = 'high';
        else if (prevalence > 15) riskLevel = 'medium';

        return `
            <tr>
                <td><strong>${stat.name}</strong></td>
                <td>${patientCount}</td>
                <td>${prevalence}%</td>
                <td>${avgAge}</td>
                <td>
                    <div class="gender-distribution">
                        <span class="gender-item">M: ${stat.genders.male}</span>
                        <span class="gender-item">F: ${stat.genders.female}</span>
                    </div>
                </td>
                <td><span class="risk-badge ${riskLevel}">${riskLevel.toUpperCase()}</span></td>
            </tr>
        `;
    });

    tbody.innerHTML = rows.join('');
}

function filterTableByCondition(conditionName) {
    const searchInput = document.getElementById('conditionSearch');
    if (searchInput) {
        searchInput.value = conditionName;
        // Trigger search functionality here if implemented
    }
    
    // Scroll to table
    document.getElementById('conditionsTable').scrollIntoView({ behavior: 'smooth' });
}

function setupEventListeners() {
    // Refresh heat map
    document.getElementById('refreshHeatMap')?.addEventListener('click', function() {
        renderPrevalenceHeatMap();
    });

    // Trend period change
    document.getElementById('trendPeriod')?.addEventListener('change', function() {
        renderTrendsChart();
    });

    // Export data
    document.getElementById('exportData')?.addEventListener('click', function() {
        exportConditionData();
    });

    // Search functionality
    document.getElementById('conditionSearch')?.addEventListener('input', function() {
        const searchTerm = this.value.toLowerCase();
        const rows = document.querySelectorAll('#conditionsTableBody tr');
        
        rows.forEach(row => {
            const conditionName = row.cells[0].textContent.toLowerCase();
            row.style.display = conditionName.includes(searchTerm) ? '' : 'none';
        });
    });
}

function exportConditionData() {
    if (conditionData.length === 0) {
        alert('No data to export');
        return;
    }

    // Create CSV content
    const headers = ['Condition', 'Patient', 'Age', 'Gender', 'Status', 'Date'];
    const csvContent = [
        headers.join(','),
        ...conditionData.map(condition => [
            `"${condition.name}"`,
            `"${condition.patientName}"`,
            condition.patientAge || 'N/A',
            condition.patientGender || 'N/A',
            condition.status || 'active',
            condition.date || 'N/A'
        ].join(','))
    ].join('\n');

    // Download CSV
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'condition-analysis.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
}

function showEmptyState() {
    const container = document.querySelector('.container-fluid');
    container.innerHTML = `
        <div class="empty-state" style="padding: 4rem 2rem;">
            <i class="fas fa-chart-line"></i>
            <h3>No Patient Data Available</h3>
            <p>This dashboard requires patient data with conditions to display analytics and insights.</p>
        </div>
    `;
}