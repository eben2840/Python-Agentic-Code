// Global variables
let allConditions = [];
let filteredConditions = [];
let categoryChart = null;
let statusChart = null;

// Initialize the dashboard
document.addEventListener('DOMContentLoaded', function() {
    if (typeof window.PATIENT_DATA === 'undefined') {
        showEmptyState();
        return;
    }
    
    loadConditionsData();
    setupEventListeners();
    renderDashboard();
});

// Load and process conditions data
function loadConditionsData() {
    allConditions = [];
    
    if (!window.PATIENT_DATA || !window.PATIENT_DATA.patients) {
        return;
    }
    
    window.PATIENT_DATA.patients.forEach(patient => {
        if (patient.data && patient.data.condition) {
            patient.data.condition.forEach(condition => {
                allConditions.push({
                    id: `${patient.id}-${condition.name || 'Unknown'}`,
                    patientId: patient.id,
                    patientName: patient.name || 'Unknown Patient',
                    patientGender: patient.gender || 'Unknown',
                    patientBirthDate: patient.birthDate || null,
                    conditionName: condition.name || 'Unknown Condition',
                    status: condition.status || 'unknown',
                    date: condition.date || null,
                    value: condition.value || null,
                    category: categorizeCondition(condition.name || '')
                });
            });
        }
    });
    
    filteredConditions = [...allConditions];
}

// Categorize conditions based on name
function categorizeCondition(conditionName) {
    const name = conditionName.toLowerCase();
    
    if (name.includes('hypertension') || name.includes('heart') || name.includes('cardiac') || name.includes('chest pain')) {
        return 'Cardiovascular';
    } else if (name.includes('asthma') || name.includes('copd') || name.includes('respiratory')) {
        return 'Respiratory';
    } else if (name.includes('diabetes') || name.includes('thyroid') || name.includes('glucose')) {
        return 'Endocrine';
    } else if (name.includes('cancer') || name.includes('tumor') || name.includes('oncology')) {
        return 'Oncology';
    } else if (name.includes('fracture') || name.includes('bone') || name.includes('joint') || name.includes('arthritis')) {
        return 'Musculoskeletal';
    } else if (name.includes('depression') || name.includes('anxiety') || name.includes('mental') || name.includes('psychiatric')) {
        return 'Mental Health';
    } else if (name.includes('infection') || name.includes('sepsis') || name.includes('tb')) {
        return 'Infectious Disease';
    } else if (name.includes('kidney') || name.includes('renal') || name.includes('ckd')) {
        return 'Nephrology';
    } else if (name.includes('skin') || name.includes('dermatology') || name.includes('psoriasis')) {
        return 'Dermatology';
    } else if (name.includes('gastro') || name.includes('colitis') || name.includes('digestive')) {
        return 'Gastroenterology';
    } else {
        return 'Other';
    }
}

// Setup event listeners
function setupEventListeners() {
    // Search functionality
    document.getElementById('conditionSearch').addEventListener('input', applyFilters);
    document.getElementById('statusFilter').addEventListener('change', applyFilters);
    document.getElementById('categoryFilter').addEventListener('change', applyFilters);
    document.getElementById('clearFilters').addEventListener('click', clearFilters);
    
    // Export functionality
    document.getElementById('exportBtn').addEventListener('click', exportData);
}

// Apply filters
function applyFilters() {
    const searchTerm = document.getElementById('conditionSearch').value.toLowerCase();
    const statusFilter = document.getElementById('statusFilter').value;
    const categoryFilter = document.getElementById('categoryFilter').value;
    
    filteredConditions = allConditions.filter(condition => {
        const matchesSearch = !searchTerm || 
            condition.conditionName.toLowerCase().includes(searchTerm) ||
            condition.patientName.toLowerCase().includes(searchTerm);
        
        const matchesStatus = !statusFilter || condition.status === statusFilter;
        const matchesCategory = !categoryFilter || condition.category === categoryFilter;
        
        return matchesSearch && matchesStatus && matchesCategory;
    });
    
    renderDashboard();
}

// Clear all filters
function clearFilters() {
    document.getElementById('conditionSearch').value = '';
    document.getElementById('statusFilter').value = '';
    document.getElementById('categoryFilter').value = '';
    filteredConditions = [...allConditions];
    renderDashboard();
}

// Render the entire dashboard
function renderDashboard() {
    updateSummaryCards();
    populateFilterOptions();
    renderCharts();
    renderTimeline();
    renderRiskMatrix();
    renderConditionsTable();
}

// Update summary cards
function updateSummaryCards() {
    const totalPatients = window.PATIENT_DATA?.patients?.length || 0;
    const activeConditions = filteredConditions.filter(c => c.status === 'active').length;
    const resolvedConditions = filteredConditions.filter(c => c.status === 'resolved').length;
    const categories = [...new Set(filteredConditions.map(c => c.category))].length;
    
    document.getElementById('totalPatients').textContent = totalPatients;
    document.getElementById('activeConditions').textContent = activeConditions;
    document.getElementById('resolvedConditions').textContent = resolvedConditions;
    document.getElementById('conditionCategories').textContent = categories;
}

// Populate filter options
function populateFilterOptions() {
    const categoryFilter = document.getElementById('categoryFilter');
    const categories = [...new Set(allConditions.map(c => c.category))].sort();
    
    // Clear existing options except "All Categories"
    categoryFilter.innerHTML = '<option value="">All Categories</option>';
    
    categories.forEach(category => {
        const option = document.createElement('option');
        option.value = category;
        option.textContent = category;
        categoryFilter.appendChild(option);
    });
}

// Render charts
function renderCharts() {
    renderCategoryChart();
    renderStatusChart();
}

// Render category distribution chart
function renderCategoryChart() {
    const ctx = document.getElementById('categoryChart').getContext('2d');
    
    if (categoryChart) {
        categoryChart.destroy();
    }
    
    const categoryData = {};
    filteredConditions.forEach(condition => {
        categoryData[condition.category] = (categoryData[condition.category] || 0) + 1;
    });
    
    const labels = Object.keys(categoryData);
    const data = Object.values(categoryData);
    const colors = [
        '#3b82f6', '#22c55e', '#f59e0b', '#ef4444', '#8b5cf6',
        '#14b8a6', '#f97316', '#ec4899', '#6366f1', '#84cc16'
    ];
    
    categoryChart = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: labels,
            datasets: [{
                data: data,
                backgroundColor: colors.slice(0, labels.length),
                borderWidth: 2,
                borderColor: '#ffffff'
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
                        usePointStyle: true,
                        font: {
                            size: 12
                        }
                    }
                }
            }
        }
    });
}

// Render status distribution chart
function renderStatusChart() {
    const ctx = document.getElementById('statusChart').getContext('2d');
    
    if (statusChart) {
        statusChart.destroy();
    }
    
    const statusData = {};
    filteredConditions.forEach(condition => {
        const status = condition.status || 'unknown';
        statusData[status] = (statusData[status] || 0) + 1;
    });
    
    const labels = Object.keys(statusData);
    const data = Object.values(statusData);
    const colors = {
        'active': '#f59e0b',
        'resolved': '#22c55e',
        'inactive': '#6b7280',
        'unknown': '#d1d5db'
    };
    
    statusChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels.map(l => l.charAt(0).toUpperCase() + l.slice(1)),
            datasets: [{
                data: data,
                backgroundColor: labels.map(l => colors[l] || '#d1d5db'),
                borderRadius: 8,
                borderSkipped: false
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

// Render timeline
function renderTimeline() {
    const timelineContainer = document.getElementById('conditionsTimeline');
    
    if (filteredConditions.length === 0) {
        timelineContainer.innerHTML = '<div class="empty-state"><i class="fas fa-calendar-times"></i><h6>No conditions found</h6><p>Try adjusting your filters</p></div>';
        return;
    }
    
    // Sort by date (most recent first)
    const sortedConditions = [...filteredConditions]
        .filter(c => c.date)
        .sort((a, b) => new Date(b.date) - new Date(a.date))
        .slice(0, 10); // Show only recent 10
    
    if (sortedConditions.length === 0) {
        timelineContainer.innerHTML = '<div class="empty-state"><i class="fas fa-calendar-times"></i><h6>No dated conditions found</h6><p>Conditions without dates are not shown in timeline</p></div>';
        return;
    }
    
    const timelineHTML = sortedConditions.map(condition => {
        const date = new Date(condition.date);
        const formattedDate = date.toLocaleDateString();
        const statusClass = condition.status || 'inactive';
        
        return `
            <div class="timeline-item">
                <div class="timeline-icon ${statusClass}">
                    <i class="fas fa-${getStatusIcon(condition.status)}"></i>
                </div>
                <div class="timeline-content">
                    <h6>${condition.conditionName}</h6>
                    <p>${condition.patientName} • ${condition.category}</p>
                    <div class="timeline-meta">${formattedDate}</div>
                </div>
            </div>
        `;
    }).join('');
    
    timelineContainer.innerHTML = timelineHTML;
}

// Get status icon
function getStatusIcon(status) {
    switch (status) {
        case 'active': return 'exclamation-triangle';
        case 'resolved': return 'check';
        case 'inactive': return 'pause';
        default: return 'question';
    }
}

// Render risk matrix
function renderRiskMatrix() {
    const riskMatrixContainer = document.getElementById('riskMatrix');
    
    // Simple risk stratification based on condition count per patient
    const patientRisk = {};
    filteredConditions.forEach(condition => {
        if (!patientRisk[condition.patientId]) {
            patientRisk[condition.patientId] = { count: 0, active: 0 };
        }
        patientRisk[condition.patientId].count++;
        if (condition.status === 'active') {
            patientRisk[condition.patientId].active++;
        }
    });
    
    let lowRisk = 0, mediumRisk = 0, highRisk = 0;
    
    Object.values(patientRisk).forEach(risk => {
        if (risk.active === 0) {
            lowRisk++;
        } else if (risk.active <= 2) {
            mediumRisk++;
        } else {
            highRisk++;
        }
    });
    
    const riskHTML = `
        <div class="risk-grid">
            <div class="risk-cell risk-low" title="Low Risk Patients">${lowRisk}</div>
            <div class="risk-cell risk-medium" title="Medium Risk Patients">${mediumRisk}</div>
            <div class="risk-cell risk-high" title="High Risk Patients">${highRisk}</div>
        </div>
        <div class="risk-legend">
            <div class="risk-legend-item">
                <div class="risk-legend-color risk-low"></div>
                <span>Low Risk</span>
            </div>
            <div class="risk-legend-item">
                <div class="risk-legend-color risk-medium"></div>
                <span>Medium Risk</span>
            </div>
            <div class="risk-legend-item">
                <div class="risk-legend-color risk-high"></div>
                <span>High Risk</span>
            </div>
        </div>
    `;
    
    riskMatrixContainer.innerHTML = riskHTML;
}

// Render conditions table
function renderConditionsTable() {
    const tableBody = document.getElementById('conditionsTableBody');
    
    if (filteredConditions.length === 0) {
        tableBody.innerHTML = '<tr><td colspan="6" class="text-center py-4"><div class="empty-state"><i class="fas fa-search"></i><h6>No conditions found</h6><p>Try adjusting your search criteria</p></div></td></tr>';
        return;
    }
    
    const tableHTML = filteredConditions.map(condition => {
        const date = condition.date ? new Date(condition.date).toLocaleDateString() : 'No date';
        const statusClass = `status-${condition.status || 'inactive'}`;
        
        return `
            <tr>
                <td>
                    <strong>${condition.patientName}</strong><br>
                    <small class="text-muted">${condition.patientGender} • ${getAge(condition.patientBirthDate)} years</small>
                </td>
                <td>
                    <strong>${condition.conditionName}</strong>
                    ${condition.value ? `<br><small class="text-muted">${condition.value}</small>` : ''}
                </td>
                <td><span class="category-badge">${condition.category}</span></td>
                <td><span class="status-badge ${statusClass}">${condition.status || 'unknown'}</span></td>
                <td>${date}</td>
                <td>
                    <button class="btn btn-outline-primary btn-sm" onclick="showConditionDetails('${condition.id}')">
                        <i class="fas fa-eye"></i>
                    </button>
                </td>
            </tr>
        `;
    }).join('');
    
    tableBody.innerHTML = tableHTML;
}

// Calculate age from birth date
function getAge(birthDate) {
    if (!birthDate) return 'Unknown';
    
    const today = new Date();
    const birth = new Date(birthDate);
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
        age--;
    }
    
    return age;
}

// Show condition details in modal
function showConditionDetails(conditionId) {
    const condition = filteredConditions.find(c => c.id === conditionId);
    if (!condition) return;
    
    const modalBody = document.getElementById('conditionModalBody');
    const age = getAge(condition.patientBirthDate);
    const date = condition.date ? new Date(condition.date).toLocaleDateString() : 'No date available';
    
    modalBody.innerHTML = `
        <div class="row">
            <div class="col-md-6">
                <h6>Patient Information</h6>
                <p><strong>Name:</strong> ${condition.patientName}</p>
                <p><strong>Gender:</strong> ${condition.patientGender}</p>
                <p><strong>Age:</strong> ${age} years</p>
                <p><strong>Birth Date:</strong> ${condition.patientBirthDate || 'Unknown'}</p>
            </div>
            <div class="col-md-6">
                <h6>Condition Details</h6>
                <p><strong>Condition:</strong> ${condition.conditionName}</p>
                <p><strong>Category:</strong> ${condition.category}</p>
                <p><strong>Status:</strong> <span class="status-badge status-${condition.status || 'inactive'}">${condition.status || 'unknown'}</span></p>
                <p><strong>Date:</strong> ${date}</p>
                ${condition.value ? `<p><strong>Value:</strong> ${condition.value}</p>` : ''}
            </div>
        </div>
    `;
    
    const modal = new bootstrap.Modal(document.getElementById('conditionModal'));
    modal.show();
}

// Export data functionality
function exportData() {
    const csvContent = "data:text/csv;charset=utf-8," + 
        "Patient,Condition,Category,Status,Date,Value\n" +
        filteredConditions.map(c => 
            `"${c.patientName}","${c.conditionName}","${c.category}","${c.status || 'unknown'}","${c.date || ''}","${c.value || ''}"`
        ).join("\n");
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "conditions_export.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

// Show empty state when no data is available
function showEmptyState() {
    document.querySelector('.container-fluid').innerHTML = `
        <div class="d-flex justify-content-center align-items-center" style="height: 100vh;">
            <div class="text-center">
                <i class="fas fa-database" style="font-size: 4rem; color: #d1d5db; margin-bottom: 1rem;"></i>
                <h3 style="color: #374151; margin-bottom: 0.5rem;">No Patient Data Available</h3>
                <p style="color: #6b7280;">Patient data is required to display the conditions dashboard.</p>
            </div>
        </div>
    `;
}