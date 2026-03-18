class PatientConditionDashboard {
    constructor() {
        this.patients = [];
        this.filteredPatients = [];
        this.conditionStats = {};
        this.init();
    }

    init() {
        this.loadData();
        this.setupEventListeners();
        this.renderDashboard();
    }

    loadData() {
        if (!window.PATIENT_DATA) {
            console.error('Patient data not available');
            return;
        }

        const data = window.PATIENT_DATA;
        
        if (data.patient && data.patient.id === 'all') {
            // All patients view
            this.patients = (data.patients || []).map(patient => {
                const conditions = patient.data?.condition || [];
                return {
                    id: patient.id,
                    name: patient.name || 'Unknown Patient',
                    gender: patient.gender || 'Unknown',
                    birthDate: patient.birthDate || null,
                    conditions: conditions.map(c => ({
                        name: c.name || 'Unknown Condition',
                        status: this.determineStatus(c.status),
                        date: c.date || null,
                        category: this.determineCategory(c.name)
                    }))
                };
            });
        } else {
            // Single patient view - convert to array format
            const conditions = data.condition?.summary || [];
            this.patients = [{
                id: data.patient?.id || 'unknown',
                name: data.patient?.name || 'Unknown Patient',
                gender: data.patient?.gender || 'Unknown',
                birthDate: data.patient?.birthDate || null,
                conditions: conditions.map(c => ({
                    name: c.name || 'Unknown Condition',
                    status: this.determineStatus(c.status),
                    date: c.date || null,
                    category: this.determineCategory(c.name)
                }))
            }];
        }

        this.filteredPatients = [...this.patients];
        this.calculateStats();
    }

    determineStatus(status) {
        if (!status) return 'unknown';
        const statusLower = status.toLowerCase();
        if (statusLower.includes('active') || statusLower.includes('current')) return 'active';
        if (statusLower.includes('resolved') || statusLower.includes('inactive')) return 'resolved';
        return 'active'; // default to active
    }

    determineCategory(conditionName) {
        if (!conditionName) return 'other';
        const name = conditionName.toLowerCase();
        
        // Chronic conditions
        if (name.includes('diabetes') || name.includes('hypertension') || 
            name.includes('copd') || name.includes('asthma') || 
            name.includes('arthritis') || name.includes('dementia')) {
            return 'chronic';
        }
        
        // Acute conditions
        if (name.includes('fracture') || name.includes('infection') || 
            name.includes('sepsis') || name.includes('chest pain') ||
            name.includes('tonsillitis')) {
            return 'acute';
        }
        
        return 'other';
    }

    calculateStats() {
        this.conditionStats = {
            totalPatients: this.patients.length,
            totalConditions: 0,
            activeConditions: 0,
            criticalConditions: 0,
            conditionCounts: {},
            categoryDistribution: { chronic: 0, acute: 0, other: 0 }
        };

        this.patients.forEach(patient => {
            patient.conditions.forEach(condition => {
                this.conditionStats.totalConditions++;
                
                if (condition.status === 'active') {
                    this.conditionStats.activeConditions++;
                }
                
                // Count high priority conditions (simplified logic)
                if (condition.name && (
                    condition.name.toLowerCase().includes('cancer') ||
                    condition.name.toLowerCase().includes('sepsis') ||
                    condition.name.toLowerCase().includes('fracture')
                )) {
                    this.conditionStats.criticalConditions++;
                }
                
                // Count by condition name
                const conditionName = condition.name || 'Unknown';
                this.conditionStats.conditionCounts[conditionName] = 
                    (this.conditionStats.conditionCounts[conditionName] || 0) + 1;
                
                // Count by category
                this.conditionStats.categoryDistribution[condition.category]++;
            });
        });
    }

    setupEventListeners() {
        // Search functionality
        const searchInput = document.getElementById('searchInput');
        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                this.filterPatients();
            });
        }

        // Filter functionality
        const statusFilter = document.getElementById('statusFilter');
        const categoryFilter = document.getElementById('categoryFilter');
        
        if (statusFilter) {
            statusFilter.addEventListener('change', () => this.filterPatients());
        }
        
        if (categoryFilter) {
            categoryFilter.addEventListener('change', () => this.filterPatients());
        }

        // Export functionality
        const exportBtn = document.getElementById('exportBtn');
        if (exportBtn) {
            exportBtn.addEventListener('click', () => this.exportData());
        }
    }

    filterPatients() {
        const searchTerm = document.getElementById('searchInput')?.value.toLowerCase() || '';
        const statusFilter = document.getElementById('statusFilter')?.value || '';
        const categoryFilter = document.getElementById('categoryFilter')?.value || '';

        this.filteredPatients = this.patients.filter(patient => {
            // Search filter
            const matchesSearch = !searchTerm || 
                patient.name.toLowerCase().includes(searchTerm) ||
                patient.conditions.some(c => 
                    c.name.toLowerCase().includes(searchTerm)
                );

            // Status filter
            const matchesStatus = !statusFilter ||
                patient.conditions.some(c => c.status === statusFilter);

            // Category filter
            const matchesCategory = !categoryFilter ||
                patient.conditions.some(c => c.category === categoryFilter);

            return matchesSearch && matchesStatus && matchesCategory;
        });

        this.renderPatientTable();
    }

    renderDashboard() {
        this.renderOverviewCards();
        this.renderPatientTable();
        this.renderConditionChart();
        this.renderTopConditions();
    }

    renderOverviewCards() {
        const elements = {
            totalPatients: document.getElementById('totalPatients'),
            totalConditions: document.getElementById('totalConditions'),
            activeConditions: document.getElementById('activeConditions'),
            criticalConditions: document.getElementById('criticalConditions')
        };

        if (elements.totalPatients) {
            elements.totalPatients.textContent = this.conditionStats.totalPatients;
        }
        if (elements.totalConditions) {
            elements.totalConditions.textContent = this.conditionStats.totalConditions;
        }
        if (elements.activeConditions) {
            elements.activeConditions.textContent = this.conditionStats.activeConditions;
        }
        if (elements.criticalConditions) {
            elements.criticalConditions.textContent = this.conditionStats.criticalConditions;
        }
    }

    renderPatientTable() {
        const tableContainer = document.getElementById('patientTable');
        if (!tableContainer) return;

        if (this.filteredPatients.length === 0) {
            tableContainer.innerHTML = `
                <div class="no-data">
                    <i class="fas fa-user-slash"></i>
                    <p>No patients found matching your criteria</p>
                </div>
            `;
            return;
        }

        const tableHTML = this.filteredPatients.map(patient => {
            const activeConditions = patient.conditions.filter(c => c.status === 'active');
            const conditionBadges = patient.conditions.slice(0, 3).map(condition => {
                const badgeClass = condition.status === 'active' ? 'active' : 'resolved';
                const priority = condition.name && (
                    condition.name.toLowerCase().includes('cancer') ||
                    condition.name.toLowerCase().includes('sepsis')
                ) ? ' high-priority' : '';
                
                return `<span class="condition-badge ${badgeClass}${priority}">${condition.name}</span>`;
            }).join('');

            const moreCount = patient.conditions.length > 3 ? 
                `<span class="condition-count">+${patient.conditions.length - 3}</span>` : '';

            return `
                <div class="patient-row" onclick="dashboard.showPatientDetails('${patient.id}')">
                    <div class="patient-info">
                        <div class="patient-details">
                            <h6>${patient.name}</h6>
                            <div class="patient-meta">
                                ${patient.gender} • ${this.formatAge(patient.birthDate)} • 
                                ${activeConditions.length} active condition${activeConditions.length !== 1 ? 's' : ''}
                            </div>
                        </div>
                        <div class="condition-summary">
                            <div class="condition-badges">
                                ${conditionBadges}
                                ${moreCount}
                            </div>
                        </div>
                    </div>
                </div>
            `;
        }).join('');

        tableContainer.innerHTML = tableHTML;
    }

    renderConditionChart() {
        const chartContainer = document.getElementById('conditionChart');
        if (!chartContainer) return;

        const { chronic, acute, other } = this.conditionStats.categoryDistribution;
        const total = chronic + acute + other;

        if (total === 0) {
            chartContainer.innerHTML = '<p>No condition data available</p>';
            return;
        }

        // Simple text-based chart representation
        chartContainer.innerHTML = `
            <div style="text-align: center;">
                <div style="margin-bottom: 1rem;">
                    <div style="display: inline-block; width: 20px; height: 20px; background: var(--primary-teal); border-radius: 3px; margin-right: 8px;"></div>
                    <span style="font-size: 13px;">Chronic (${chronic})</span>
                </div>
                <div style="margin-bottom: 1rem;">
                    <div style="display: inline-block; width: 20px; height: 20px; background: var(--primary-blue); border-radius: 3px; margin-right: 8px;"></div>
                    <span style="font-size: 13px;">Acute (${acute})</span>
                </div>
                <div>
                    <div style="display: inline-block; width: 20px; height: 20px; background: var(--primary-orange); border-radius: 3px; margin-right: 8px;"></div>
                    <span style="font-size: 13px;">Other (${other})</span>
                </div>
            </div>
        `;
    }

    renderTopConditions() {
        const container = document.getElementById('topConditions');
        if (!container) return;

        const sortedConditions = Object.entries(this.conditionStats.conditionCounts)
            .sort(([,a], [,b]) => b - a)
            .slice(0, 5);

        if (sortedConditions.length === 0) {
            container.innerHTML = '<p class="text-muted">No condition data available</p>';
            return;
        }

        const listHTML = sortedConditions.map(([condition, count]) => `
            <div class="condition-list-item">
                <span class="condition-name">${condition}</span>
                <span class="condition-count-badge">${count}</span>
            </div>
        `).join('');

        container.innerHTML = listHTML;
    }

    showPatientDetails(patientId) {
        const patient = this.patients.find(p => p.id === patientId);
        if (!patient) return;

        const modal = document.getElementById('patientModal');
        const modalTitle = document.getElementById('modalPatientName');
        const timeline = document.getElementById('patientTimeline');

        if (modalTitle) {
            modalTitle.textContent = `${patient.name} - Condition Timeline`;
        }

        if (timeline) {
            if (patient.conditions.length === 0) {
                timeline.innerHTML = '<p class="text-muted">No conditions recorded for this patient</p>';
            } else {
                const timelineHTML = patient.conditions
                    .sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0))
                    .map(condition => `
                        <div class="timeline-item">
                            <div class="timeline-marker ${condition.status}"></div>
                            <div class="timeline-content">
                                <h6>${condition.name}</h6>
                                <div class="timeline-date">
                                    ${condition.date ? this.formatDate(condition.date) : 'Date not available'} • 
                                    <span class="badge bg-${condition.status === 'active' ? 'success' : 'secondary'}">${condition.status}</span>
                                </div>
                            </div>
                        </div>
                    `).join('');

                timeline.innerHTML = timelineHTML;
            }
        }

        if (modal) {
            const bootstrapModal = new bootstrap.Modal(modal);
            bootstrapModal.show();
        }
    }

    exportData() {
        const exportData = {
            summary: this.conditionStats,
            patients: this.filteredPatients.map(patient => ({
                name: patient.name,
                gender: patient.gender,
                birthDate: patient.birthDate,
                conditions: patient.conditions
            }))
        };

        const dataStr = JSON.stringify(exportData, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(dataBlob);
        
        const link = document.createElement('a');
        link.href = url;
        link.download = `patient-conditions-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    }

    formatAge(birthDate) {
        if (!birthDate) return 'Age unknown';
        const today = new Date();
        const birth = new Date(birthDate);
        const age = today.getFullYear() - birth.getFullYear();
        return `${age} years`;
    }

    formatDate(dateString) {
        if (!dateString) return 'Date not available';
        try {
            return new Date(dateString).toLocaleDateString();
        } catch {
            return 'Invalid date';
        }
    }
}

// Initialize dashboard when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.dashboard = new PatientConditionDashboard();
});