class ConditionsDashboard {
    constructor() {
        this.data = null;
        this.filteredData = null;
        this.charts = {};
        this.filters = {
            status: '',
            condition: '',
            risk: '',
            search: ''
        };
        
        this.init();
    }

    init() {
        this.loadData();
        this.setupEventListeners();
        this.setupCharts();
    }

    loadData() {
        if (!window.PATIENT_DATA) {
            this.showError('No patient data available');
            return;
        }

        this.data = window.PATIENT_DATA;
        this.processData();
        this.updateDashboard();
    }

    processData() {
        if (this.data.patient && this.data.patient.id === 'all') {
            // All patients view
            this.processAllPatientsData();
        } else {
            // Single patient view
            this.processSinglePatientData();
        }
    }

    processAllPatientsData() {
        const patients = this.data.patients || [];
        this.processedData = {
            patients: [],
            conditions: new Map(),
            timeline: new Map(),
            riskDistribution: { high: 0, medium: 0, low: 0 }
        };

        patients.forEach(patient => {
            const patientConditions = [];
            const patientData = patient.data || {};

            // Process all condition-related resources
            Object.entries(patientData).forEach(([resourceType, records]) => {
                if (resourceType === 'condition' && Array.isArray(records)) {
                    records.forEach(condition => {
                        const conditionData = {
                            name: condition.name || 'Unknown Condition',
                            status: condition.status || 'active',
                            date: condition.date || new Date().toISOString(),
                            value: condition.value || ''
                        };
                        
                        patientConditions.push(conditionData);
                        
                        // Update condition prevalence
                        const count = this.processedData.conditions.get(conditionData.name) || 0;
                        this.processedData.conditions.set(conditionData.name, count + 1);
                        
                        // Update timeline
                        const month = this.getMonthKey(conditionData.date);
                        const monthCount = this.processedData.timeline.get(month) || 0;
                        this.processedData.timeline.set(month, monthCount + 1);
                    });
                }
            });

            // Calculate risk level
            const conditionCount = patientConditions.length;
            let riskLevel = 'low';
            if (conditionCount >= 3) riskLevel = 'high';
            else if (conditionCount === 2) riskLevel = 'medium';
            
            this.processedData.riskDistribution[riskLevel]++;

            // Calculate age
            const age = patient.birthDate ? this.calculateAge(patient.birthDate) : 'Unknown';

            this.processedData.patients.push({
                id: patient.id,
                name: patient.name || 'Unknown Patient',
                gender: patient.gender || 'Unknown',
                age: age,
                birthDate: patient.birthDate,
                conditions: patientConditions,
                riskLevel: riskLevel,
                lastUpdated: this.getLatestDate(patientConditions)
            });
        });

        this.filteredData = { ...this.processedData };
    }

    processSinglePatientData() {
        // Handle single patient case
        const patient = this.data.patient;
        const conditions = this.data.condition?.summary || [];
        
        this.processedData = {
            patients: [{
                id: patient.id,
                name: patient.name || 'Unknown Patient',
                gender: patient.gender || 'Unknown',
                age: patient.birthDate ? this.calculateAge(patient.birthDate) : 'Unknown',
                birthDate: patient.birthDate,
                conditions: conditions.map(c => ({
                    name: c.name || 'Unknown Condition',
                    status: c.status || 'active',
                    date: c.date || new Date().toISOString(),
                    value: c.value || ''
                })),
                riskLevel: conditions.length >= 3 ? 'high' : conditions.length === 2 ? 'medium' : 'low',
                lastUpdated: this.getLatestDate(conditions)
            }],
            conditions: new Map(),
            timeline: new Map(),
            riskDistribution: { high: 0, medium: 0, low: 1 }
        };

        conditions.forEach(condition => {
            const count = this.processedData.conditions.get(condition.name) || 0;
            this.processedData.conditions.set(condition.name, count + 1);
            
            const month = this.getMonthKey(condition.date);
            const monthCount = this.processedData.timeline.get(month) || 0;
            this.processedData.timeline.set(month, monthCount + 1);
        });

        this.filteredData = { ...this.processedData };
    }

    calculateAge(birthDate) {
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

    getMonthKey(dateString) {
        if (!dateString) return 'Unknown';
        const date = new Date(dateString);
        return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    }

    getLatestDate(conditions) {
        if (!conditions || conditions.length === 0) return 'No data';
        const dates = conditions.map(c => new Date(c.date || 0));
        const latest = new Date(Math.max(...dates));
        return latest.toLocaleDateString();
    }

    updateDashboard() {
        this.updateSummaryCards();
        this.updateCharts();
        this.updatePatientTable();
        this.updateFilters();
    }

    updateSummaryCards() {
        const data = this.filteredData;
        
        document.getElementById('totalPatients').textContent = data.patients.length;
        
        const activeConditions = data.patients.reduce((sum, p) => 
            sum + p.conditions.filter(c => c.status === 'active').length, 0);
        document.getElementById('activeConditions').textContent = activeConditions;
        
        const highRiskCount = data.patients.filter(p => p.riskLevel === 'high').length;
        document.getElementById('highRiskPatients').textContent = highRiskCount;
        
        document.getElementById('uniqueConditions').textContent = data.conditions.size;
    }

    updateCharts() {
        this.updatePrevalenceChart();
        this.updateRiskChart();
        this.updateTimelineChart();
    }

    updatePrevalenceChart() {
        const ctx = document.getElementById('prevalenceChart').getContext('2d');
        
        if (this.charts.prevalence) {
            this.charts.prevalence.destroy();
        }

        const conditionData = Array.from(this.filteredData.conditions.entries())
            .sort((a, b) => b[1] - a[1])
            .slice(0, 10);

        this.charts.prevalence = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: conditionData.map(([name]) => name),
                datasets: [{
                    label: 'Number of Patients',
                    data: conditionData.map(([, count]) => count),
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
                },
                onClick: (event, elements) => {
                    if (elements.length > 0) {
                        const index = elements[0].index;
                        const conditionName = conditionData[index][0];
                        this.filterByCondition(conditionName);
                    }
                }
            }
        });
    }

    updateRiskChart() {
        const ctx = document.getElementById('riskChart').getContext('2d');
        
        if (this.charts.risk) {
            this.charts.risk.destroy();
        }

        const riskData = this.filteredData.riskDistribution;

        this.charts.risk = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: ['High Risk', 'Medium Risk', 'Low Risk'],
                datasets: [{
                    data: [riskData.high, riskData.medium, riskData.low],
                    backgroundColor: ['#ef4444', '#f59e0b', '#22c55e'],
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

    updateTimelineChart() {
        const ctx = document.getElementById('timelineChart').getContext('2d');
        
        if (this.charts.timeline) {
            this.charts.timeline.destroy();
        }

        const timelineData = Array.from(this.filteredData.timeline.entries())
            .sort((a, b) => a[0].localeCompare(b[0]));

        this.charts.timeline = new Chart(ctx, {
            type: 'line',
            data: {
                labels: timelineData.map(([month]) => month),
                datasets: [{
                    label: 'New Conditions',
                    data: timelineData.map(([, count]) => count),
                    borderColor: '#14b8a6',
                    backgroundColor: 'rgba(20, 184, 166, 0.1)',
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
                        ticks: {
                            stepSize: 1
                        }
                    }
                }
            }
        });
    }

    updatePatientTable() {
        const tbody = document.getElementById('patientTableBody');
        const patients = this.filteredData.patients;

        if (patients.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="7" class="text-center py-4">
                        <div class="empty-state">
                            <i class="fas fa-search"></i>
                            <p>No patients match the current filters</p>
                        </div>
                    </td>
                </tr>
            `;
            return;
        }

        tbody.innerHTML = patients.map(patient => `
            <tr class="fade-in">
                <td>
                    <div>
                        <strong>${patient.name}</strong>
                        <br>
                        <small class="text-muted">ID: ${patient.id}</small>
                    </div>
                </td>
                <td>${patient.age}</td>
                <td>
                    <i class="fas fa-${patient.gender === 'male' ? 'mars' : patient.gender === 'female' ? 'venus' : 'question'} me-1"></i>
                    ${patient.gender}
                </td>
                <td>
                    <div class="d-flex flex-wrap gap-1">
                        ${patient.conditions.slice(0, 3).map(condition => 
                            `<span class="condition-badge">${condition.name}</span>`
                        ).join('')}
                        ${patient.conditions.length > 3 ? `<span class="condition-badge">+${patient.conditions.length - 3} more</span>` : ''}
                    </div>
                </td>
                <td>
                    <span class="risk-badge risk-${patient.riskLevel}">
                        ${patient.riskLevel} risk
                    </span>
                </td>
                <td>${patient.lastUpdated}</td>
                <td>
                    <button class="btn btn-outline-primary btn-sm" onclick="dashboard.showPatientDetails('${patient.id}')">
                        <i class="fas fa-eye"></i>
                    </button>
                </td>
            </tr>
        `).join('');
    }

    updateFilters() {
        const conditionFilter = document.getElementById('conditionFilter');
        const conditions = Array.from(this.processedData.conditions.keys()).sort();
        
        conditionFilter.innerHTML = '<option value="">All Conditions</option>' +
            conditions.map(condition => 
                `<option value="${condition}" ${this.filters.condition === condition ? 'selected' : ''}>${condition}</option>`
            ).join('');
    }

    setupEventListeners() {
        // Filter listeners
        document.getElementById('statusFilter').addEventListener('change', (e) => {
            this.filters.status = e.target.value;
            this.applyFilters();
        });

        document.getElementById('conditionFilter').addEventListener('change', (e) => {
            this.filters.condition = e.target.value;
            this.applyFilters();
        });

        document.getElementById('riskFilter').addEventListener('change', (e) => {
            this.filters.risk = e.target.value;
            this.applyFilters();
        });

        document.getElementById('searchPatients').addEventListener('input', (e) => {
            this.filters.search = e.target.value.toLowerCase();
            this.applyFilters();
        });

        document.getElementById('clearFilters').addEventListener('click', () => {
            this.clearFilters();
        });

        // Action listeners
        document.getElementById('refreshBtn').addEventListener('click', () => {
            this.loadData();
        });

        document.getElementById('exportBtn').addEventListener('click', () => {
            this.exportReport();
        });
    }

    applyFilters() {
        let filteredPatients = [...this.processedData.patients];

        // Apply search filter
        if (this.filters.search) {
            filteredPatients = filteredPatients.filter(patient =>
                patient.name.toLowerCase().includes(this.filters.search) ||
                patient.conditions.some(c => c.name.toLowerCase().includes(this.filters.search))
            );
        }

        // Apply status filter
        if (this.filters.status) {
            filteredPatients = filteredPatients.filter(patient =>
                patient.conditions.some(c => c.status === this.filters.status)
            );
        }

        // Apply condition filter
        if (this.filters.condition) {
            filteredPatients = filteredPatients.filter(patient =>
                patient.conditions.some(c => c.name === this.filters.condition)
            );
        }

        // Apply risk filter
        if (this.filters.risk) {
            const riskMap = { high: 'high', medium: 'medium', low: 'low' };
            filteredPatients = filteredPatients.filter(patient =>
                patient.riskLevel === riskMap[this.filters.risk]
            );
        }

        // Recalculate filtered data
        this.filteredData = {
            patients: filteredPatients,
            conditions: new Map(),
            timeline: new Map(),
            riskDistribution: { high: 0, medium: 0, low: 0 }
        };

        // Recalculate aggregations for filtered data
        filteredPatients.forEach(patient => {
            this.filteredData.riskDistribution[patient.riskLevel]++;
            
            patient.conditions.forEach(condition => {
                const count = this.filteredData.conditions.get(condition.name) || 0;
                this.filteredData.conditions.set(condition.name, count + 1);
                
                const month = this.getMonthKey(condition.date);
                const monthCount = this.filteredData.timeline.get(month) || 0;
                this.filteredData.timeline.set(month, monthCount + 1);
            });
        });

        this.updateDashboard();
    }

    clearFilters() {
        this.filters = { status: '', condition: '', risk: '', search: '' };
        
        document.getElementById('statusFilter').value = '';
        document.getElementById('conditionFilter').value = '';
        document.getElementById('riskFilter').value = '';
        document.getElementById('searchPatients').value = '';
        
        this.filteredData = { ...this.processedData };
        this.updateDashboard();
    }

    filterByCondition(conditionName) {
        this.filters.condition = conditionName;
        document.getElementById('conditionFilter').value = conditionName;
        this.applyFilters();
    }

    showPatientDetails(patientId) {
        const patient = this.processedData.patients.find(p => p.id === patientId);
        if (!patient) return;

        const modalBody = document.getElementById('modalBody');
        modalBody.innerHTML = `
            <div class="row">
                <div class="col-md-6">
                    <h6>Patient Information</h6>
                    <p><strong>Name:</strong> ${patient.name}</p>
                    <p><strong>Age:</strong> ${patient.age}</p>
                    <p><strong>Gender:</strong> ${patient.gender}</p>
                    <p><strong>Risk Level:</strong> <span class="risk-badge risk-${patient.riskLevel}">${patient.riskLevel} risk</span></p>
                </div>
                <div class="col-md-6">
                    <h6>Summary</h6>
                    <p><strong>Total Conditions:</strong> ${patient.conditions.length}</p>
                    <p><strong>Active Conditions:</strong> ${patient.conditions.filter(c => c.status === 'active').length}</p>
                    <p><strong>Last Updated:</strong> ${patient.lastUpdated}</p>
                </div>
            </div>
            <hr>
            <h6>Conditions</h6>
            <div class="row">
                ${patient.conditions.map(condition => `
                    <div class="col-md-6 mb-2">
                        <div class="patient-condition-card">
                            <h6>${condition.name}</h6>
                            <small class="status-${condition.status}">
                                <i class="fas fa-circle me-1"></i>${condition.status}
                            </small>
                            ${condition.date ? `<br><small class="text-muted">Diagnosed: ${new Date(condition.date).toLocaleDateString()}</small>` : ''}
                            ${condition.value ? `<br><small class="text-muted">${condition.value}</small>` : ''}
                        </div>
                    </div>
                `).join('')}
            </div>
        `;

        const modal = new bootstrap.Modal(document.getElementById('patientModal'));
        modal.show();
    }

    exportReport() {
        const data = this.filteredData;
        const report = {
            generatedAt: new Date().toISOString(),
            summary: {
                totalPatients: data.patients.length,
                activeConditions: data.patients.reduce((sum, p) => sum + p.conditions.filter(c => c.status === 'active').length, 0),
                highRiskPatients: data.patients.filter(p => p.riskLevel === 'high').length,
                uniqueConditions: data.conditions.size
            },
            conditionPrevalence: Object.fromEntries(data.conditions),
            riskDistribution: data.riskDistribution,
            patients: data.patients.map(p => ({
                id: p.id,
                name: p.name,
                age: p.age,
                gender: p.gender,
                riskLevel: p.riskLevel,
                conditionCount: p.conditions.length,
                conditions: p.conditions.map(c => ({ name: c.name, status: c.status, date: c.date }))
            }))
        };

        const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `conditions-report-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }

    setupCharts() {
        // Chart.js global configuration
        Chart.defaults.font.family = 'system-ui, -apple-system, sans-serif';
        Chart.defaults.font.size = 12;
        Chart.defaults.color = '#374151';
    }

    showError(message) {
        const tbody = document.getElementById('patientTableBody');
        tbody.innerHTML = `
            <tr>
                <td colspan="7" class="text-center py-4">
                    <div class="empty-state">
                        <i class="fas fa-exclamation-triangle text-warning"></i>
                        <p>${message}</p>
                    </div>
                </td>
            </tr>
        `;
    }
}

// Initialize dashboard when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.dashboard = new ConditionsDashboard();
});