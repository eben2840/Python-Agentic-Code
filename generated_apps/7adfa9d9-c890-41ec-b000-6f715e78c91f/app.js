class ConditionDashboard {
    constructor() {
        this.data = null;
        this.filteredData = [];
        this.sortColumn = null;
        this.sortDirection = 'asc';
        this.filters = {
            search: '',
            categories: new Set(),
            severities: new Set(['mild', 'moderate', 'severe'])
        };
        this.chart = null;
        
        this.init();
    }

    init() {
        this.loadData();
        this.setupEventListeners();
        this.initializeFilters();
    }

    loadData() {
        if (!window.PATIENT_DATA) {
            this.showNoDataMessage();
            return;
        }

        this.data = window.PATIENT_DATA;
        
        if (this.data.patient && this.data.patient.id === 'all') {
            this.processAllPatientsData();
        } else {
            this.processSinglePatientData();
        }
        
        this.updateSummaryCards();
        this.renderTable();
        this.renderPrevalenceChart();
    }

    processAllPatientsData() {
        this.filteredData = [];
        
        if (!this.data.patients || this.data.patients.length === 0) {
            return;
        }

        this.data.patients.forEach(patient => {
            if (patient.data && patient.data.condition && patient.data.condition.summary) {
                patient.data.condition.summary.forEach(condition => {
                    this.filteredData.push({
                        patientId: patient.id,
                        patientName: patient.name || 'Unknown Patient',
                        patientGender: patient.gender || 'Unknown',
                        patientBirthDate: patient.birthDate || null,
                        conditionName: condition.name || 'Unknown Condition',
                        conditionStatus: condition.status || 'active',
                        conditionDate: condition.date || null,
                        conditionValue: condition.value || null,
                        category: this.categorizeCondition(condition.name),
                        severity: this.determineSeverity(condition.name),
                        priority: this.calculatePriority(condition.name, condition.status, condition.date)
                    });
                });
            }
        });
    }

    processSinglePatientData() {
        this.filteredData = [];
        
        if (!this.data.condition || !this.data.condition.summary) {
            return;
        }

        this.data.condition.summary.forEach(condition => {
            this.filteredData.push({
                patientId: this.data.patient.id,
                patientName: this.data.patient.name || 'Unknown Patient',
                patientGender: this.data.patient.gender || 'Unknown',
                patientBirthDate: this.data.patient.birthDate || null,
                conditionName: condition.name || 'Unknown Condition',
                conditionStatus: condition.status || 'active',
                conditionDate: condition.date || null,
                conditionValue: condition.value || null,
                category: this.categorizeCondition(condition.name),
                severity: this.determineSeverity(condition.name),
                priority: this.calculatePriority(condition.name, condition.status, condition.date)
            });
        });
    }

    categorizeCondition(conditionName) {
        if (!conditionName) return 'Other';
        
        const name = conditionName.toLowerCase();
        
        if (name.includes('hypertension') || name.includes('chest pain') || name.includes('heart')) {
            return 'Cardiovascular';
        } else if (name.includes('asthma') || name.includes('copd') || name.includes('respiratory')) {
            return 'Respiratory';
        } else if (name.includes('diabetes') || name.includes('thyroid') || name.includes('glucose')) {
            return 'Endocrine';
        } else if (name.includes('cancer') || name.includes('tumor') || name.includes('oncology')) {
            return 'Oncology';
        } else if (name.includes('depression') || name.includes('anxiety') || name.includes('mental')) {
            return 'Mental Health';
        } else if (name.includes('fracture') || name.includes('bone') || name.includes('joint')) {
            return 'Musculoskeletal';
        } else if (name.includes('infection') || name.includes('sepsis') || name.includes('tb')) {
            return 'Infectious';
        } else if (name.includes('kidney') || name.includes('ckd') || name.includes('renal')) {
            return 'Renal';
        } else {
            return 'Other';
        }
    }

    determineSeverity(conditionName) {
        if (!conditionName) return 'mild';
        
        const name = conditionName.toLowerCase();
        
        if (name.includes('cancer') || name.includes('sepsis') || name.includes('stage 4') || name.includes('severe')) {
            return 'severe';
        } else if (name.includes('moderate') || name.includes('stage 3') || name.includes('chronic')) {
            return 'moderate';
        } else {
            return 'mild';
        }
    }

    calculatePriority(conditionName, status, date) {
        if (!conditionName) return 'low';
        
        const name = conditionName.toLowerCase();
        const isActive = status === 'active';
        
        if (!isActive) return 'low';
        
        if (name.includes('cancer') || name.includes('sepsis') || name.includes('chest pain')) {
            return 'high';
        } else if (name.includes('hypertension') || name.includes('diabetes') || name.includes('copd')) {
            return 'medium';
        } else {
            return 'low';
        }
    }

    setupEventListeners() {
        // Search input
        const searchInput = document.getElementById('patientSearch');
        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                this.filters.search = e.target.value.toLowerCase();
                this.applyFilters();
            });
        }

        // Severity filters
        const severityInputs = document.querySelectorAll('#severityFilters input[type="checkbox"]');
        severityInputs.forEach(input => {
            input.addEventListener('change', () => {
                if (input.checked) {
                    this.filters.severities.add(input.value);
                } else {
                    this.filters.severities.delete(input.value);
                }
                this.applyFilters();
            });
        });

        // Clear filters button
        const clearButton = document.getElementById('clearFilters');
        if (clearButton) {
            clearButton.addEventListener('click', () => {
                this.clearAllFilters();
            });
        }

        // Table sorting
        const sortableHeaders = document.querySelectorAll('.sortable');
        sortableHeaders.forEach(header => {
            header.addEventListener('click', () => {
                const sortKey = header.dataset.sort;
                this.handleSort(sortKey);
            });
        });

        // Export button
        const exportBtn = document.getElementById('exportBtn');
        if (exportBtn) {
            exportBtn.addEventListener('click', () => {
                this.exportData();
            });
        }
    }

    initializeFilters() {
        // Populate category filters
        const categories = [...new Set(this.filteredData.map(item => item.category))].sort();
        const categoryContainer = document.getElementById('categoryFilters');
        
        if (categoryContainer) {
            categoryContainer.innerHTML = '';
            categories.forEach(category => {
                const div = document.createElement('div');
                div.className = 'form-check';
                div.innerHTML = `
                    <input class="form-check-input" type="checkbox" id="category${category}" value="${category}" checked>
                    <label class="form-check-label" for="category${category}">${category}</label>
                `;
                categoryContainer.appendChild(div);
                
                this.filters.categories.add(category);
                
                const checkbox = div.querySelector('input');
                checkbox.addEventListener('change', () => {
                    if (checkbox.checked) {
                        this.filters.categories.add(category);
                    } else {
                        this.filters.categories.delete(category);
                    }
                    this.applyFilters();
                });
            });
        }
    }

    applyFilters() {
        let filtered = [...this.filteredData];

        // Apply search filter
        if (this.filters.search) {
            filtered = filtered.filter(item => 
                item.patientName.toLowerCase().includes(this.filters.search) ||
                item.conditionName.toLowerCase().includes(this.filters.search)
            );
        }

        // Apply category filter
        if (this.filters.categories.size > 0) {
            filtered = filtered.filter(item => this.filters.categories.has(item.category));
        }

        // Apply severity filter
        if (this.filters.severities.size > 0) {
            filtered = filtered.filter(item => this.filters.severities.has(item.severity));
        }

        this.renderTable(filtered);
        this.updateSummaryCards(filtered);
    }

    clearAllFilters() {
        // Clear search
        const searchInput = document.getElementById('patientSearch');
        if (searchInput) {
            searchInput.value = '';
        }
        this.filters.search = '';

        // Reset category filters
        const categoryInputs = document.querySelectorAll('#categoryFilters input[type="checkbox"]');
        categoryInputs.forEach(input => {
            input.checked = true;
        });
        this.filters.categories = new Set([...new Set(this.filteredData.map(item => item.category))]);

        // Reset severity filters
        const severityInputs = document.querySelectorAll('#severityFilters input[type="checkbox"]');
        severityInputs.forEach(input => {
            input.checked = true;
        });
        this.filters.severities = new Set(['mild', 'moderate', 'severe']);

        this.applyFilters();
    }

    handleSort(column) {
        if (this.sortColumn === column) {
            this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
        } else {
            this.sortColumn = column;
            this.sortDirection = 'asc';
        }

        // Update header indicators
        document.querySelectorAll('.sortable').forEach(header => {
            header.classList.remove('sort-asc', 'sort-desc');
        });
        
        const currentHeader = document.querySelector(`[data-sort="${column}"]`);
        if (currentHeader) {
            currentHeader.classList.add(`sort-${this.sortDirection}`);
        }

        this.applyFilters();
    }

    sortData(data) {
        if (!this.sortColumn) return data;

        return [...data].sort((a, b) => {
            let aVal, bVal;

            switch (this.sortColumn) {
                case 'patient':
                    aVal = a.patientName;
                    bVal = b.patientName;
                    break;
                case 'condition':
                    aVal = a.conditionName;
                    bVal = b.conditionName;
                    break;
                case 'date':
                    aVal = a.conditionDate ? new Date(a.conditionDate) : new Date(0);
                    bVal = b.conditionDate ? new Date(b.conditionDate) : new Date(0);
                    break;
                case 'status':
                    aVal = a.conditionStatus;
                    bVal = b.conditionStatus;
                    break;
                default:
                    return 0;
            }

            if (aVal < bVal) return this.sortDirection === 'asc' ? -1 : 1;
            if (aVal > bVal) return this.sortDirection === 'asc' ? 1 : -1;
            return 0;
        });
    }

    updateSummaryCards(data = this.filteredData) {
        const uniquePatients = new Set(data.map(item => item.patientId)).size;
        const totalConditions = data.filter(item => item.conditionStatus === 'active').length;
        const criticalConditions = data.filter(item => item.priority === 'high').length;
        const uniqueConditions = new Set(data.map(item => item.conditionName)).size;

        document.getElementById('totalPatients').textContent = uniquePatients;
        document.getElementById('totalConditions').textContent = totalConditions;
        document.getElementById('criticalConditions').textContent = criticalConditions;
        document.getElementById('uniqueConditions').textContent = uniqueConditions;
    }

    renderTable(data = this.filteredData) {
        const tbody = document.getElementById('conditionTableBody');
        const noDataMessage = document.getElementById('noDataMessage');
        
        if (!tbody) return;

        const sortedData = this.sortData(data);

        if (sortedData.length === 0) {
            tbody.innerHTML = '';
            if (noDataMessage) {
                noDataMessage.style.display = 'block';
            }
            return;
        }

        if (noDataMessage) {
            noDataMessage.style.display = 'none';
        }

        tbody.innerHTML = sortedData.map(item => `
            <tr>
                <td>
                    <div class="d-flex align-items-center">
                        <div>
                            <div class="fw-semibold">${this.escapeHtml(item.patientName)}</div>
                            <small class="text-muted">${this.escapeHtml(item.patientGender)} • ${this.formatAge(item.patientBirthDate)}</small>
                        </div>
                    </div>
                </td>
                <td>
                    <div>
                        <div class="fw-semibold">${this.escapeHtml(item.conditionName)}</div>
                        <small class="text-muted">${this.escapeHtml(item.category)}</small>
                    </div>
                </td>
                <td>${this.formatDate(item.conditionDate)}</td>
                <td>
                    <span class="status-badge status-${item.conditionStatus}">
                        ${this.escapeHtml(item.conditionStatus)}
                    </span>
                </td>
                <td>
                    <span class="priority-indicator priority-${item.priority}" title="${item.priority} priority"></span>
                    <span class="ms-2 text-capitalize">${this.escapeHtml(item.priority)}</span>
                </td>
                <td>
                    <button class="action-btn btn-view" onclick="dashboard.showPatientDetails('${item.patientId}')">
                        <i class="fas fa-eye me-1"></i>View
                    </button>
                </td>
            </tr>
        `).join('');
    }

    renderPrevalenceChart() {
        const ctx = document.getElementById('prevalenceChart');
        if (!ctx) return;

        // Count conditions by category
        const conditionCounts = {};
        this.filteredData.forEach(item => {
            conditionCounts[item.category] = (conditionCounts[item.category] || 0) + 1;
        });

        const labels = Object.keys(conditionCounts);
        const data = Object.values(conditionCounts);
        const colors = [
            '#14b8a6', '#3b82f6', '#22c55e', '#f59e0b', '#ef4444',
            '#8b5cf6', '#f97316', '#06b6d4', '#84cc16', '#ec4899'
        ];

        if (this.chart) {
            this.chart.destroy();
        }

        this.chart = new Chart(ctx, {
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
                            padding: 15,
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

    showPatientDetails(patientId) {
        const patientData = this.getPatientData(patientId);
        if (!patientData) return;

        const modal = new bootstrap.Modal(document.getElementById('patientModal'));
        
        // Update modal content
        document.getElementById('modalPatientName').textContent = patientData.name;
        
        const patientInfo = document.getElementById('modalPatientInfo');
        patientInfo.innerHTML = `
            <div class="row">
                <div class="col-md-6">
                    <strong>Name:</strong> ${this.escapeHtml(patientData.name)}<br>
                    <strong>Gender:</strong> ${this.escapeHtml(patientData.gender)}<br>
                    <strong>Age:</strong> ${this.formatAge(patientData.birthDate)}
                </div>
                <div class="col-md-6">
                    <strong>Patient ID:</strong> ${this.escapeHtml(patientData.id)}<br>
                    <strong>Active Conditions:</strong> ${patientData.conditions.filter(c => c.conditionStatus === 'active').length}
                </div>
            </div>
        `;

        const conditionHistory = document.getElementById('modalConditionHistory');
        conditionHistory.innerHTML = `
            <h6 class="mb-3">Condition History</h6>
            ${patientData.conditions.map(condition => `
                <div class="condition-item">
                    <div class="condition-name">${this.escapeHtml(condition.conditionName)}</div>
                    <div class="condition-details">
                        <span class="status-badge status-${condition.conditionStatus} me-2">${this.escapeHtml(condition.conditionStatus)}</span>
                        <span class="text-muted">${this.formatDate(condition.conditionDate)}</span>
                        <span class="ms-2">Priority: <span class="text-capitalize">${this.escapeHtml(condition.priority)}</span></span>
                    </div>
                </div>
            `).join('')}
        `;

        modal.show();
    }

    getPatientData(patientId) {
        const conditions = this.filteredData.filter(item => item.patientId === patientId);
        if (conditions.length === 0) return null;

        const firstCondition = conditions[0];
        return {
            id: patientId,
            name: firstCondition.patientName,
            gender: firstCondition.patientGender,
            birthDate: firstCondition.patientBirthDate,
            conditions: conditions
        };
    }

    exportData() {
        const data = this.filteredData.map(item => ({
            'Patient Name': item.patientName,
            'Condition': item.conditionName,
            'Category': item.category,
            'Status': item.conditionStatus,
            'Severity': item.severity,
            'Priority': item.priority,
            'Onset Date': this.formatDate(item.conditionDate)
        }));

        const csv = this.convertToCSV(data);
        this.downloadCSV(csv, 'condition-dashboard-export.csv');
    }

    convertToCSV(data) {
        if (data.length === 0) return '';

        const headers = Object.keys(data[0]);
        const csvContent = [
            headers.join(','),
            ...data.map(row => headers.map(header => `"${row[header] || ''}"`).join(','))
        ].join('\n');

        return csvContent;
    }

    downloadCSV(csv, filename) {
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', filename);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
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
            return `${age} years`;
        } catch (e) {
            return 'Unknown age';
        }
    }

    escapeHtml(text) {
        if (typeof text !== 'string') return text;
        const map = {
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#039;'
        };
        return text.replace(/[&<>"']/g, m => map[m]);
    }

    showNoDataMessage() {
        document.getElementById('totalPatients').textContent = '0';
        document.getElementById('totalConditions').textContent = '0';
        document.getElementById('criticalConditions').textContent = '0';
        document.getElementById('uniqueConditions').textContent = '0';
        
        const tbody = document.getElementById('conditionTableBody');
        if (tbody) {
            tbody.innerHTML = '<tr><td colspan="6" class="text-center text-muted">No data available</td></tr>';
        }
    }
}

// Initialize dashboard when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.dashboard = new ConditionDashboard();
});