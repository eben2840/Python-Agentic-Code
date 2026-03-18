class PatientConditionTracker {
    constructor() {
        this.data = null;
        this.filteredData = [];
        this.currentFilter = 'all';
        this.searchTerm = '';
        this.charts = {};
        
        this.init();
    }

    init() {
        this.loadData();
        this.setupEventListeners();
        this.initializeCharts();
    }

    loadData() {
        if (!window.PATIENT_DATA) {
            console.error('Patient data not available');
            return;
        }

        this.data = window.PATIENT_DATA;
        this.processData();
        this.updateUI();
    }

    processData() {
        if (this.data.patient && this.data.patient.id === 'all') {
            // All patients view
            this.filteredData = this.extractConditionsFromAllPatients();
        } else {
            // Single patient view
            this.filteredData = this.extractConditionsFromSinglePatient();
        }
    }

    extractConditionsFromAllPatients() {
        const conditions = [];
        
        if (this.data.patients) {
            this.data.patients.forEach(patient => {
                if (patient.data && patient.data.condition && patient.data.condition.summary) {
                    patient.data.condition.summary.forEach(condition => {
                        conditions.push({
                            patientId: patient.id,
                            patientName: patient.name || 'Unknown Patient',
                            patientGender: patient.gender || 'Unknown',
                            patientBirthDate: patient.birthDate || null,
                            conditionName: condition.name || 'Unknown Condition',
                            status: condition.status || 'active',
                            date: condition.date || null,
                            value: condition.value || null,
                            severity: this.determineSeverity(condition.name),
                            patientData: patient.data
                        });
                    });
                }
            });
        }
        
        return conditions;
    }

    extractConditionsFromSinglePatient() {
        const conditions = [];
        
        if (this.data.condition && this.data.condition.summary) {
            this.data.condition.summary.forEach(condition => {
                conditions.push({
                    patientId: this.data.patient.id,
                    patientName: this.data.patient.name || 'Unknown Patient',
                    patientGender: this.data.patient.gender || 'Unknown',
                    patientBirthDate: this.data.patient.birthDate || null,
                    conditionName: condition.name || 'Unknown Condition',
                    status: condition.status || 'active',
                    date: condition.date || null,
                    value: condition.value || null,
                    severity: this.determineSeverity(condition.name)
                });
            });
        }
        
        return conditions;
    }

    determineSeverity(conditionName) {
        const severityMap = {
            'Cancer': 'severe',
            'Breast Cancer': 'severe',
            'Sepsis': 'severe',
            'TB': 'severe',
            'CKD Stage 4': 'severe',
            'Hypertension': 'moderate',
            'Diabetes': 'moderate',
            'Gestational Diabetes': 'moderate',
            'COPD': 'moderate',
            'Depression': 'moderate',
            'Dementia': 'moderate',
            'Asthma': 'mild',
            'Migraine': 'mild',
            'Psoriasis': 'mild',
            'Tonsillitis': 'mild'
        };
        
        return severityMap[conditionName] || 'mild';
    }

    setupEventListeners() {
        // Search input
        const searchInput = document.getElementById('searchInput');
        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                this.searchTerm = e.target.value.toLowerCase();
                this.applyFilters();
            });
        }

        // Filter buttons
        document.querySelectorAll('.filter-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
                e.target.classList.add('active');
                this.currentFilter = e.target.dataset.filter;
                this.applyFilters();
            });
        });

        // Sort select
        const sortSelect = document.getElementById('sortSelect');
        if (sortSelect) {
            sortSelect.addEventListener('change', (e) => {
                this.sortData(e.target.value);
            });
        }

        // Export button
        const exportBtn = document.getElementById('exportBtn');
        if (exportBtn) {
            exportBtn.addEventListener('click', () => this.exportData());
        }

        // Refresh button
        const refreshBtn = document.getElementById('refreshBtn');
        if (refreshBtn) {
            refreshBtn.addEventListener('click', () => this.loadData());
        }
    }

    applyFilters() {
        let filtered = [...this.filteredData];

        // Apply condition filter
        if (this.currentFilter !== 'all') {
            filtered = filtered.filter(item => 
                item.conditionName.toLowerCase().includes(this.currentFilter.toLowerCase())
            );
        }

        // Apply search filter
        if (this.searchTerm) {
            filtered = filtered.filter(item =>
                item.patientName.toLowerCase().includes(this.searchTerm) ||
                item.conditionName.toLowerCase().includes(this.searchTerm)
            );
        }

        this.renderTable(filtered);
        this.updateStats(filtered);
    }

    sortData(sortBy) {
        let sorted = [...this.filteredData];
        
        switch (sortBy) {
            case 'patient':
                sorted.sort((a, b) => a.patientName.localeCompare(b.patientName));
                break;
            case 'condition':
                sorted.sort((a, b) => a.conditionName.localeCompare(b.conditionName));
                break;
            case 'date':
                sorted.sort((a, b) => {
                    const dateA = new Date(a.date || 0);
                    const dateB = new Date(b.date || 0);
                    return dateB - dateA;
                });
                break;
        }
        
        this.renderTable(sorted);
    }

    updateUI() {
        this.updateStats(this.filteredData);
        this.renderTable(this.filteredData);
        this.updateCharts();
    }

    updateStats(data) {
        const totalPatientsEl = document.getElementById('totalPatients');
        const totalConditionsEl = document.getElementById('totalConditions');
        const criticalConditionsEl = document.getElementById('criticalConditions');
        const newConditionsEl = document.getElementById('newConditions');

        if (totalPatientsEl) {
            const uniquePatients = new Set(data.map(item => item.patientId)).size;
            totalPatientsEl.textContent = uniquePatients || 0;
        }

        if (totalConditionsEl) {
            const activeConditions = data.filter(item => item.status === 'active').length;
            totalConditionsEl.textContent = activeConditions || 0;
        }

        if (criticalConditionsEl) {
            const criticalConditions = data.filter(item => item.severity === 'severe').length;
            criticalConditionsEl.textContent = criticalConditions || 0;
        }

        if (newConditionsEl) {
            const oneMonthAgo = new Date();
            oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
            const newConditions = data.filter(item => {
                if (!item.date) return false;
                return new Date(item.date) > oneMonthAgo;
            }).length;
            newConditionsEl.textContent = newConditions || 0;
        }
    }

    renderTable(data) {
        const tbody = document.getElementById('conditionTableBody');
        if (!tbody) return;

        if (data.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="6" class="text-center py-4">
                        <div class="empty-state">
                            <i class="fas fa-search"></i>
                            <p>No conditions found matching your criteria</p>
                        </div>
                    </td>
                </tr>
            `;
            return;
        }

        tbody.innerHTML = data.map(item => `
            <tr>
                <td>
                    <a href="#" class="patient-link" onclick="app.showPatientDetails('${item.patientId}')">
                        ${item.patientName}
                    </a>
                    <br>
                    <small class="text-muted">${item.patientGender} • ${this.formatAge(item.patientBirthDate)}</small>
                </td>
                <td>
                    <strong>${item.conditionName}</strong>
                    ${item.value ? `<br><small class="text-muted">${item.value}</small>` : ''}
                </td>
                <td>${this.formatDate(item.date)}</td>
                <td>
                    <span class="status-badge status-${item.status}">${item.status}</span>
                </td>
                <td>
                    <span class="severity-indicator severity-${item.severity}"></span>
                    ${item.severity}
                </td>
                <td>
                    <button class="action-btn" onclick="app.showPatientDetails('${item.patientId}')" title="View Details">
                        <i class="fas fa-eye"></i>
                    </button>
                    <button class="action-btn" title="Edit">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="action-btn" title="More">
                        <i class="fas fa-ellipsis-v"></i>
                    </button>
                </td>
            </tr>
        `).join('');
    }

    formatDate(dateString) {
        if (!dateString) return 'No date available';
        
        try {
            const date = new Date(dateString);
            return date.toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'short',
                day: 'numeric'
            });
        } catch (e) {
            return 'Invalid date';
        }
    }

    formatAge(birthDate) {
        if (!birthDate) return 'Unknown age';
        
        try {
            const birth = new Date(birthDate);
            const today = new Date();
            const age = Math.floor((today - birth) / (365.25 * 24 * 60 * 60 * 1000));
            return `${age} years old`;
        } catch (e) {
            return 'Unknown age';
        }
    }

    initializeCharts() {
        this.initPrevalenceChart();
        this.initDistributionChart();
    }

    initPrevalenceChart() {
        const ctx = document.getElementById('prevalenceChart');
        if (!ctx) return;

        this.charts.prevalence = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: [],
                datasets: [{
                    label: 'Number of Patients',
                    data: [],
                    backgroundColor: '#3b82f6',
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

    initDistributionChart() {
        const ctx = document.getElementById('distributionChart');
        if (!ctx) return;

        this.charts.distribution = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: ['Mild', 'Moderate', 'Severe'],
                datasets: [{
                    data: [0, 0, 0],
                    backgroundColor: ['#22c55e', '#f59e0b', '#ef4444']
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

    updateCharts() {
        this.updatePrevalenceChart();
        this.updateDistributionChart();
    }

    updatePrevalenceChart() {
        if (!this.charts.prevalence) return;

        const conditionCounts = {};
        this.filteredData.forEach(item => {
            conditionCounts[item.conditionName] = (conditionCounts[item.conditionName] || 0) + 1;
        });

        const sortedConditions = Object.entries(conditionCounts)
            .sort(([,a], [,b]) => b - a)
            .slice(0, 10);

        this.charts.prevalence.data.labels = sortedConditions.map(([name]) => name);
        this.charts.prevalence.data.datasets[0].data = sortedConditions.map(([,count]) => count);
        this.charts.prevalence.update();
    }

    updateDistributionChart() {
        if (!this.charts.distribution) return;

        const severityCounts = {
            mild: 0,
            moderate: 0,
            severe: 0
        };

        this.filteredData.forEach(item => {
            severityCounts[item.severity]++;
        });

        this.charts.distribution.data.datasets[0].data = [
            severityCounts.mild,
            severityCounts.moderate,
            severityCounts.severe
        ];
        this.charts.distribution.update();
    }

    showPatientDetails(patientId) {
        const patient = this.data.patients ? 
            this.data.patients.find(p => p.id === patientId) : 
            (this.data.patient.id === patientId ? this.data : null);

        if (!patient) {
            console.error('Patient not found:', patientId);
            return;
        }

        const modal = new bootstrap.Modal(document.getElementById('patientModal'));
        const modalTitle = document.getElementById('modalPatientName');
        const modalContent = document.getElementById('modalContent');

        if (modalTitle) {
            modalTitle.textContent = patient.name || 'Unknown Patient';
        }

        if (modalContent) {
            modalContent.innerHTML = this.generatePatientDetailsHTML(patient);
        }

        modal.show();
    }

    generatePatientDetailsHTML(patient) {
        const patientData = patient.data || patient;
        
        let html = `
            <div class="detail-card">
                <h6><i class="fas fa-user me-2"></i>Patient Information</h6>
                <ul class="detail-list">
                    <li><strong>Name:</strong> ${patient.name || 'No data available'}</li>
                    <li><strong>Gender:</strong> ${patient.gender || 'No data available'}</li>
                    <li><strong>Date of Birth:</strong> ${this.formatDate(patient.birthDate)}</li>
                    <li><strong>Age:</strong> ${this.formatAge(patient.birthDate)}</li>
                </ul>
            </div>
        `;

        if (patientData.condition && patientData.condition.summary && patientData.condition.summary.length > 0) {
            html += `
                <div class="detail-card">
                    <h6><i class="fas fa-stethoscope me-2"></i>Conditions</h6>
                    <ul class="detail-list">
                        ${patientData.condition.summary.map(condition => `
                            <li>
                                <strong>${condition.name || 'Unknown Condition'}</strong>
                                ${condition.date ? ` - Diagnosed: ${this.formatDate(condition.date)}` : ''}
                                ${condition.status ? ` (${condition.status})` : ''}
                            </li>
                        `).join('')}
                    </ul>
                </div>
            `;
        }

        if (patientData.medicationrequest && patientData.medicationrequest.summary && patientData.medicationrequest.summary.length > 0) {
            html += `
                <div class="detail-card">
                    <h6><i class="fas fa-pills me-2"></i>Medications</h6>
                    <ul class="detail-list">
                        ${patientData.medicationrequest.summary.map(med => `
                            <li>
                                <strong>${med.name || 'Unknown Medication'}</strong>
                                ${med.value ? ` - ${med.value}` : ''}
                            </li>
                        `).join('')}
                    </ul>
                </div>
            `;
        }

        if (patientData.observation && patientData.observation.summary && patientData.observation.summary.length > 0) {
            html += `
                <div class="detail-card">
                    <h6><i class="fas fa-chart-line me-2"></i>Recent Observations</h6>
                    <ul class="detail-list">
                        ${patientData.observation.summary.map(obs => `
                            <li>
                                <strong>${obs.name || 'Unknown Observation'}</strong>
                                ${obs.value ? ` - ${obs.value}` : ''}
                                ${obs.date ? ` (${this.formatDate(obs.date)})` : ''}
                            </li>
                        `).join('')}
                    </ul>
                </div>
            `;
        }

        if (html === `
            <div class="detail-card">
                <h6><i class="fas fa-user me-2"></i>Patient Information</h6>
                <ul class="detail-list">
                    <li><strong>Name:</strong> ${patient.name || 'No data available'}</li>
                    <li><strong>Gender:</strong> ${patient.gender || 'No data available'}</li>
                    <li><strong>Date of Birth:</strong> ${this.formatDate(patient.birthDate)}</li>
                    <li><strong>Age:</strong> ${this.formatAge(patient.birthDate)}</li>
                </ul>
            </div>
        `) {
            html += `
                <div class="empty-state">
                    <i class="fas fa-info-circle"></i>
                    <p>No additional clinical data available for this patient</p>
                </div>
            `;
        }

        return html;
    }

    exportData() {
        const csvContent = this.generateCSV(this.filteredData);
        const blob = new Blob([csvContent], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `patient-conditions-${new Date().toISOString().split('T')[0]}.csv`;
        a.click();
        window.URL.revokeObjectURL(url);
    }

    generateCSV(data) {
        const headers = ['Patient Name', 'Condition', 'Status', 'Severity', 'Diagnosis Date', 'Gender', 'Age'];
        const rows = data.map(item => [
            item.patientName,
            item.conditionName,
            item.status,
            item.severity,
            this.formatDate(item.date),
            item.patientGender,
            this.formatAge(item.patientBirthDate)
        ]);

        return [headers, ...rows]
            .map(row => row.map(field => `"${field}"`).join(','))
            .join('\n');
    }
}

// Initialize the application
let app;
document.addEventListener('DOMContentLoaded', () => {
    app = new PatientConditionTracker();
});