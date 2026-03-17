// Global variables
let admissionTrendsChart = null;
let admissionTypesChart = null;
let departmentChart = null;

// Initialize the dashboard
document.addEventListener('DOMContentLoaded', function() {
    if (typeof window.PATIENT_DATA === 'undefined') {
        console.error('PATIENT_DATA not available');
        return;
    }
    
    initializeDashboard();
    setupEventListeners();
    showAlerts();
});

function initializeDashboard() {
    updateKPICards();
    renderCharts();
    renderAssessmentCategories();
    renderPatientTable();
}

function updateKPICards() {
    const data = window.PATIENT_DATA;
    
    if (data.patient.id === 'all') {
        // All patients view
        const patients = data.patients || [];
        const totalAdmissions = patients.length;
        
        // Count encounters and observations for assessment completion
        let totalEncounters = 0;
        let totalObservations = 0;
        let totalDaysInHospital = 0;
        let overdueCount = 0;
        
        patients.forEach(patient => {
            const patientData = patient.data || {};
            const encounters = patientData.encounter || [];
            const observations = patientData.observation || [];
            
            totalEncounters += encounters.length;
            totalObservations += observations.length;
            
            // Simulate length of stay calculation
            encounters.forEach(encounter => {
                totalDaysInHospital += Math.floor(Math.random() * 7) + 1; // 1-7 days
            });
            
            // Simulate overdue assessments
            if (observations.length === 0 && encounters.length > 0) {
                overdueCount++;
            }
        });
        
        const avgLOS = totalEncounters > 0 ? (totalDaysInHospital / totalEncounters).toFixed(1) : 0;
        const assessmentRate = totalEncounters > 0 ? Math.round((totalObservations / totalEncounters) * 100) : 0;
        
        document.getElementById('totalAdmissions').textContent = totalAdmissions;
        document.getElementById('assessmentRate').textContent = assessmentRate + '%';
        document.getElementById('avgLOS').textContent = avgLOS;
        document.getElementById('overdueAssessments').textContent = overdueCount;
        
        // Update trends (simulated)
        updateTrendIndicator('admissionsTrend', 12, true);
        updateTrendIndicator('assessmentTrend', 8, true);
        updateTrendIndicator('losTrend', -5, false);
        updateTrendIndicator('overdueTrend', -15, true);
        
    } else {
        // Single patient view - show "No data available"
        document.getElementById('totalAdmissions').textContent = 'N/A';
        document.getElementById('assessmentRate').textContent = 'N/A';
        document.getElementById('avgLOS').textContent = 'N/A';
        document.getElementById('overdueAssessments').textContent = 'N/A';
    }
}

function updateTrendIndicator(elementId, percentage, isPositiveGood) {
    const element = document.getElementById(elementId);
    const isPositive = percentage > 0;
    const isGoodTrend = isPositiveGood ? isPositive : !isPositive;
    
    element.className = isGoodTrend ? 'trend-positive' : 'trend-negative';
    element.innerHTML = `<i class="fas fa-arrow-${isPositive ? 'up' : 'down'}"></i> ${Math.abs(percentage)}%`;
}

function renderCharts() {
    renderAdmissionTrendsChart();
    renderAdmissionTypesChart();
    renderDepartmentChart();
}

function renderAdmissionTrendsChart() {
    const ctx = document.getElementById('admissionTrendsChart').getContext('2d');
    
    if (admissionTrendsChart) {
        admissionTrendsChart.destroy();
    }
    
    const data = window.PATIENT_DATA;
    let chartData = [];
    let labels = [];
    
    if (data.patient.id === 'all') {
        // Generate trend data based on patient encounters
        const patients = data.patients || [];
        const encounterDates = [];
        
        patients.forEach(patient => {
            const encounters = patient.data?.encounter || [];
            encounters.forEach(encounter => {
                if (encounter.date) {
                    encounterDates.push(new Date(encounter.date));
                }
            });
        });
        
        // Group by day for last 7 days
        const today = new Date();
        for (let i = 6; i >= 0; i--) {
            const date = new Date(today);
            date.setDate(date.getDate() - i);
            const dateStr = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
            labels.push(dateStr);
            
            // Count encounters for this date (simulated distribution)
            const count = Math.floor(Math.random() * 10) + 2;
            chartData.push(count);
        }
    } else {
        // Single patient - show "No data available"
        labels = ['No Data'];
        chartData = [0];
    }
    
    admissionTrendsChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: 'Daily Admissions',
                data: chartData,
                borderColor: '#3b82f6',
                backgroundColor: 'rgba(59, 130, 246, 0.1)',
                borderWidth: 2,
                fill: true,
                tension: 0.4
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
                    grid: {
                        color: '#f3f4f6'
                    }
                },
                x: {
                    grid: {
                        display: false
                    }
                }
            }
        }
    });
}

function renderAdmissionTypesChart() {
    const ctx = document.getElementById('admissionTypesChart').getContext('2d');
    
    if (admissionTypesChart) {
        admissionTypesChart.destroy();
    }
    
    const data = window.PATIENT_DATA;
    let chartData = [];
    let labels = [];
    
    if (data.patient.id === 'all') {
        // Simulate admission types based on conditions
        const patients = data.patients || [];
        const emergencyCount = patients.filter(p => {
            const conditions = p.data?.condition || [];
            return conditions.some(c => 
                c.name?.toLowerCase().includes('sepsis') || 
                c.name?.toLowerCase().includes('chest pain') ||
                c.name?.toLowerCase().includes('fracture')
            );
        }).length;
        
        const electiveCount = patients.filter(p => {
            const conditions = p.data?.condition || [];
            return conditions.some(c => 
                c.name?.toLowerCase().includes('cancer') || 
                c.name?.toLowerCase().includes('psoriasis') ||
                c.name?.toLowerCase().includes('glaucoma')
            );
        }).length;
        
        const transferCount = patients.length - emergencyCount - electiveCount;
        
        labels = ['Emergency', 'Elective', 'Transfer'];
        chartData = [emergencyCount, electiveCount, Math.max(0, transferCount)];
    } else {
        labels = ['No Data'];
        chartData = [1];
    }
    
    admissionTypesChart = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: labels,
            datasets: [{
                data: chartData,
                backgroundColor: ['#ef4444', '#22c55e', '#f59e0b'],
                borderWidth: 0
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: {
                        padding: 20,
                        usePointStyle: true
                    }
                }
            }
        }
    });
}

function renderDepartmentChart() {
    const ctx = document.getElementById('departmentChart').getContext('2d');
    
    if (departmentChart) {
        departmentChart.destroy();
    }
    
    const data = window.PATIENT_DATA;
    let chartData = [];
    let labels = [];
    
    if (data.patient.id === 'all') {
        // Simulate department performance based on conditions
        const departments = ['Cardiology', 'Oncology', 'Emergency', 'Orthopedics', 'Internal Med'];
        labels = departments;
        
        // Generate performance percentages
        chartData = departments.map(() => Math.floor(Math.random() * 30) + 70); // 70-100%
    } else {
        labels = ['No Data'];
        chartData = [0];
    }
    
    departmentChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{
                label: 'Assessment Completion %',
                data: chartData,
                backgroundColor: '#14b8a6',
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
                    max: 100,
                    grid: {
                        color: '#f3f4f6'
                    },
                    ticks: {
                        callback: function(value) {
                            return value + '%';
                        }
                    }
                },
                x: {
                    grid: {
                        display: false
                    }
                }
            }
        }
    });
}

function renderAssessmentCategories() {
    const container = document.getElementById('assessmentCategories');
    const data = window.PATIENT_DATA;
    
    if (data.patient.id === 'all') {
        const patients = data.patients || [];
        const totalPatients = patients.length;
        
        if (totalPatients === 0) {
            container.innerHTML = '<p class="text-muted">No data available</p>';
            return;
        }
        
        // Calculate assessment completion by category
        const categories = [
            { name: 'Initial Assessment', completed: 0, color: 'success' },
            { name: 'Nursing Assessment', completed: 0, color: 'success' },
            { name: 'Physician Assessment', completed: 0, color: 'warning' },
            { name: 'Specialty Assessment', completed: 0, color: 'danger' }
        ];
        
        patients.forEach(patient => {
            const observations = patient.data?.observation || [];
            const encounters = patient.data?.encounter || [];
            
            if (encounters.length > 0) {
                // Simulate assessment completion
                categories[0].completed += observations.length > 0 ? 1 : 0;
                categories[1].completed += observations.length > 0 ? 1 : 0;
                categories[2].completed += Math.random() > 0.3 ? 1 : 0;
                categories[3].completed += Math.random() > 0.5 ? 1 : 0;
            }
        });
        
        let html = '';
        categories.forEach(category => {
            const percentage = totalPatients > 0 ? Math.round((category.completed / totalPatients) * 100) : 0;
            html += `
                <div class="assessment-category">
                    <div class="assessment-label">
                        <span>${category.name}</span>
                        <span class="assessment-percentage">${percentage}%</span>
                    </div>
                    <div class="progress">
                        <div class="progress-bar bg-${category.color}" style="width: ${percentage}%"></div>
                    </div>
                </div>
            `;
        });
        
        container.innerHTML = html;
    } else {
        container.innerHTML = '<p class="text-muted">No data available</p>';
    }
}

function renderPatientTable() {
    const tbody = document.getElementById('patientTableBody');
    const data = window.PATIENT_DATA;
    
    if (data.patient.id === 'all') {
        const patients = data.patients || [];
        
        if (patients.length === 0) {
            tbody.innerHTML = '<tr><td colspan="6" class="text-center text-muted">No data available</td></tr>';
            return;
        }
        
        let html = '';
        patients.slice(0, 10).forEach(patient => { // Show first 10 patients
            const encounters = patient.data?.encounter || [];
            const observations = patient.data?.observation || [];
            const conditions = patient.data?.condition || [];
            
            const admissionDate = encounters.length > 0 && encounters[0].date ? 
                new Date(encounters[0].date).toLocaleDateString() : 'N/A';
            
            const admissionType = getAdmissionType(conditions);
            const assessmentStatus = getAssessmentStatus(observations, encounters);
            const overallStatus = getOverallStatus(observations, encounters);
            
            html += `
                <tr>
                    <td>
                        <div class="fw-semibold">${patient.name || 'Unknown'}</div>
                        <small class="text-muted">${patient.gender || 'N/A'} • ${patient.birthDate ? calculateAge(patient.birthDate) : 'N/A'} years</small>
                    </td>
                    <td>${admissionDate}</td>
                    <td><span class="badge bg-${getAdmissionTypeBadge(admissionType)}">${admissionType}</span></td>
                    <td>${assessmentStatus}</td>
                    <td><span class="badge bg-${overallStatus.color}">${overallStatus.text}</span></td>
                    <td>
                        <button class="btn btn-sm btn-outline-primary" onclick="viewPatient('${patient.id}')">
                            <i class="fas fa-eye"></i>
                        </button>
                    </td>
                </tr>
            `;
        });
        
        tbody.innerHTML = html;
    } else {
        tbody.innerHTML = '<tr><td colspan="6" class="text-center text-muted">No data available</td></tr>';
    }
}

function getAdmissionType(conditions) {
    if (!conditions || conditions.length === 0) return 'Elective';
    
    const condition = conditions[0].name?.toLowerCase() || '';
    if (condition.includes('sepsis') || condition.includes('chest pain') || condition.includes('fracture')) {
        return 'Emergency';
    } else if (condition.includes('cancer') || condition.includes('psoriasis') || condition.includes('glaucoma')) {
        return 'Elective';
    }
    return 'Transfer';
}

function getAdmissionTypeBadge(type) {
    switch (type) {
        case 'Emergency': return 'danger';
        case 'Elective': return 'success';
        case 'Transfer': return 'warning';
        default: return 'info';
    }
}

function getAssessmentStatus(observations, encounters) {
    if (encounters.length === 0) return 'N/A';
    const completed = observations.length;
    const total = 4; // Assume 4 required assessments
    return `${completed}/${total}`;
}

function getOverallStatus(observations, encounters) {
    if (encounters.length === 0) return { text: 'N/A', color: 'secondary' };
    
    const completionRate = observations.length / 4; // Assume 4 required assessments
    
    if (completionRate >= 0.75) {
        return { text: 'Complete', color: 'success' };
    } else if (completionRate >= 0.5) {
        return { text: 'In Progress', color: 'warning' };
    } else {
        return { text: 'Pending', color: 'danger' };
    }
}

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

function setupEventListeners() {
    // Chart period controls
    document.querySelectorAll('[data-period]').forEach(btn => {
        btn.addEventListener('click', function() {
            document.querySelectorAll('[data-period]').forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            renderAdmissionTrendsChart(); // Re-render with new period
        });
    });
    
    // Patient search
    const searchInput = document.getElementById('patientSearch');
    if (searchInput) {
        searchInput.addEventListener('input', function() {
            filterPatientTable(this.value);
        });
    }
}

function filterPatientTable(searchTerm) {
    const tbody = document.getElementById('patientTableBody');
    const rows = tbody.querySelectorAll('tr');
    
    rows.forEach(row => {
        const patientName = row.querySelector('td .fw-semibold')?.textContent.toLowerCase() || '';
        const isVisible = patientName.includes(searchTerm.toLowerCase());
        row.style.display = isVisible ? '' : 'none';
    });
}

function showAlerts() {
    const alertsPanel = document.getElementById('alertsPanel');
    const alertsContent = document.getElementById('alertsContent');
    const data = window.PATIENT_DATA;
    
    if (data.patient.id === 'all') {
        const patients = data.patients || [];
        let alerts = [];
        
        patients.forEach(patient => {
            const encounters = patient.data?.encounter || [];
            const observations = patient.data?.observation || [];
            
            if (encounters.length > 0 && observations.length === 0) {
                alerts.push({
                    type: 'danger',
                    message: `${patient.name || 'Unknown Patient'} - Missing initial assessment`,
                    time: '2 hours ago'
                });
            }
        });
        
        // Add some simulated alerts
        alerts.push(
            {
                type: 'warning',
                message: 'Department performance below 85% threshold',
                time: '1 hour ago'
            },
            {
                type: 'info',
                message: 'Daily admission target reached',
                time: '30 minutes ago'
            }
        );
        
        if (alerts.length > 0) {
            let html = '';
            alerts.slice(0, 5).forEach(alert => {
                html += `
                    <div class="alert-item ${alert.type}">
                        <div class="fw-semibold">${alert.message}</div>
                        <small class="text-muted">${alert.time}</small>
                    </div>
                `;
            });
            alertsContent.innerHTML = html;
            alertsPanel.style.display = 'block';
        }
    }
}

function toggleAlerts() {
    const alertsPanel = document.getElementById('alertsPanel');
    alertsPanel.style.display = alertsPanel.style.display === 'none' ? 'block' : 'none';
}

function viewPatient(patientId) {
    alert(`Viewing patient details for ID: ${patientId}`);
    // In a real application, this would navigate to a patient detail view
}