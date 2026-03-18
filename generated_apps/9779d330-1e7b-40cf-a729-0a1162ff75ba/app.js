class ConditionDashboard {
    constructor() {
        this.patientData = null;
        this.conditions = [];
        this.filteredConditions = [];
        this.selectedCondition = null;
        this.currentFilter = 'all';
        
        this.init();
    }

    init() {
        this.loadPatientData();
        this.setupEventListeners();
        this.render();
    }

    loadPatientData() {
        try {
            this.patientData = window.PATIENT_DATA;
            if (!this.patientData) {
                throw new Error('No patient data available');
            }
            
            this.processConditions();
            this.updatePatientInfo();
            this.updateStatistics();
        } catch (error) {
            console.error('Error loading patient data:', error);
            this.showNoDataMessage();
        }
    }

    processConditions() {
        this.conditions = [];
        
        if (this.patientData.patient && this.patientData.patient.id !== 'all') {
            // Single patient data
            if (this.patientData.condition && this.patientData.condition.summary) {
                this.conditions = this.patientData.condition.summary.map((condition, index) => ({
                    id: `condition-${index}`,
                    name: condition.name || 'Unknown Condition',
                    status: condition.status || 'unknown',
                    date: condition.date || null,
                    value: condition.value || null,
                    clinicalStatus: this.getClinicalStatus(condition.status),
                    category: this.getConditionCategory(condition.name),
                    severity: this.getConditionSeverity(condition.status)
                }));
            }
        } else if (this.patientData.patients) {
            // Multiple patients data - aggregate conditions
            this.patientData.patients.forEach(patient => {
                if (patient.data && patient.data.condition) {
                    patient.data.condition.forEach((condition, index) => {
                        this.conditions.push({
                            id: `${patient.id}-condition-${index}`,
                            patientId: patient.id,
                            patientName: patient.name,
                            name: condition.name || 'Unknown Condition',
                            status: condition.status || 'unknown',
                            date: condition.date || null,
                            value: condition.value || null,
                            clinicalStatus: this.getClinicalStatus(condition.status),
                            category: this.getConditionCategory(condition.name),
                            severity: this.getConditionSeverity(condition.status)
                        });
                    });
                }
            });
        }
        
        // Sort conditions by date (most recent first)
        this.conditions.sort((a, b) => {
            if (!a.date && !b.date) return 0;
            if (!a.date) return 1;
            if (!b.date) return -1;
            return new Date(b.date) - new Date(a.date);
        });
        
        this.filteredConditions = [...this.conditions];
    }

    getClinicalStatus(status) {
        if (!status) return 'unknown';
        
        const statusLower = status.toLowerCase();
        if (statusLower.includes('active') || statusLower.includes('current')) return 'active';
        if (statusLower.includes('resolved') || statusLower.includes('inactive')) return 'resolved';
        if (statusLower.includes('chronic') || statusLower.includes('ongoing')) return 'chronic';
        return 'unknown';
    }

    getConditionCategory(name) {
        if (!name) return 'Other';
        
        const nameLower = name.toLowerCase();
        if (nameLower.includes('diabetes') || nameLower.includes('blood sugar')) return 'Endocrine';
        if (nameLower.includes('hypertension') || nameLower.includes('blood pressure') || nameLower.includes('cardiac')) return 'Cardiovascular';
        if (nameLower.includes('asthma') || nameLower.includes('respiratory') || nameLower.includes('lung')) return 'Respiratory';
        if (nameLower.includes('arthritis') || nameLower.includes('joint') || nameLower.includes('bone')) return 'Musculoskeletal';
        if (nameLower.includes('depression') || nameLower.includes('anxiety') || nameLower.includes('mental')) return 'Mental Health';
        if (nameLower.includes('infection') || nameLower.includes('bacterial') || nameLower.includes('viral')) return 'Infectious';
        return 'Other';
    }

    getConditionSeverity(status) {
        if (!status) return 'low';
        
        const statusLower = status.toLowerCase();
        if (statusLower.includes('severe') || statusLower.includes('critical')) return 'high';
        if (statusLower.includes('moderate') || statusLower.includes('chronic')) return 'medium';
        return 'low';
    }

    updatePatientInfo() {
        const patientInfoEl = document.getElementById('patient-info');
        
        if (this.patientData.patient && this.patientData.patient.id !== 'all') {
            const patient = this.patientData.patient;
            const birthDate = patient.birthDate ? new Date(patient.birthDate).toLocaleDateString() : 'Unknown';
            patientInfoEl.textContent = `${patient.name || 'Unknown Patient'} • ${patient.gender || 'Unknown'} • DOB: ${birthDate}`;
        } else if (this.patientData.patients) {
            patientInfoEl.textContent = `Viewing ${this.patientData.patients.length} patients`;
        } else {
            patientInfoEl.textContent = 'No patient information available';
        }
    }

    updateStatistics() {
        const activeCount = this.conditions.filter(c => c.clinicalStatus === 'active').length;
        const resolvedCount = this.conditions.filter(c => c.clinicalStatus === 'resolved').length;
        const chronicCount = this.conditions.filter(c => c.clinicalStatus === 'chronic').length;
        
        // Recent updates (within last 30 days)
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        const recentCount = this.conditions.filter(c => 
            c.date && new Date(c.date) >= thirtyDaysAgo
        ).length;

        document.getElementById('active-conditions').textContent = activeCount;
        document.getElementById('resolved-conditions').textContent = resolvedCount;
        document.getElementById('chronic-conditions').textContent = chronicCount;
        document.getElementById('recent-updates').textContent = recentCount;
    }

    setupEventListeners() {
        // Filter buttons
        document.querySelectorAll('.filter-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
                e.target.classList.add('active');
                this.currentFilter = e.target.dataset.filter;
                this.applyFilters();
            });
        });

        // Search input
        const searchInput = document.getElementById('search-input');
        searchInput.addEventListener('input', (e) => {
            this.applyFilters(e.target.value);
        });

        // Refresh button
        document.getElementById('refresh-btn').addEventListener('click', () => {
            this.loadPatientData();
            this.render();
        });

        // Export button
        document.getElementById('export-btn').addEventListener('click', () => {
            this.exportData();
        });
    }

    applyFilters(searchTerm = '') {
        this.filteredConditions = this.conditions.filter(condition => {
            // Filter by status
            if (this.currentFilter !== 'all' && condition.clinicalStatus !== this.currentFilter) {
                return false;
            }

            // Filter by search term
            if (searchTerm) {
                const searchLower = searchTerm.toLowerCase();
                return condition.name.toLowerCase().includes(searchLower) ||
                       condition.category.toLowerCase().includes(searchLower);
            }

            return true;
        });

        this.renderTimeline();
        this.renderCategories();
    }

    render() {
        this.renderTimeline();
        this.renderCategories();
    }

    renderTimeline() {
        const container = document.getElementById('timeline-container');
        
        if (this.filteredConditions.length === 0) {
            container.innerHTML = `
                <div class="timeline-placeholder">
                    <i class="fas fa-chart-line fa-3x text-muted mb-3"></i>
                    <p class="text-muted">No conditions found</p>
                </div>
            `;
            return;
        }

        const timelineHtml = this.filteredConditions.map(condition => `
            <div class="timeline-item ${condition.clinicalStatus}" data-condition-id="${condition.id}">
                <div class="timeline-date">
                    ${condition.date ? new Date(condition.date).toLocaleDateString() : 'Unknown'}
                </div>
                <div class="timeline-content">
                    <div class="timeline-title">${condition.name}</div>
                    <div class="d-flex align-items-center gap-2">
                        <span class="timeline-status ${condition.clinicalStatus}">
                            ${condition.clinicalStatus}
                        </span>
                        <small class="text-muted">${condition.category}</small>
                        ${condition.patientName ? `<small class="text-muted">• ${condition.patientName}</small>` : ''}
                    </div>
                </div>
                <div class="timeline-icon">
                    <i class="fas fa-chevron-right"></i>
                </div>
            </div>
        `).join('');

        container.innerHTML = timelineHtml;

        // Add click listeners to timeline items
        container.querySelectorAll('.timeline-item').forEach(item => {
            item.addEventListener('click', (e) => {
                const conditionId = e.currentTarget.dataset.conditionId;
                this.selectCondition(conditionId);
            });
        });
    }

    selectCondition(conditionId) {
        this.selectedCondition = this.conditions.find(c => c.id === conditionId);
        this.renderConditionDetails();
        
        // Update timeline selection
        document.querySelectorAll('.timeline-item').forEach(item => {
            item.classList.remove('selected');
        });
        document.querySelector(`[data-condition-id="${conditionId}"]`)?.classList.add('selected');
    }

    renderConditionDetails() {
        const placeholder = document.getElementById('details-placeholder');
        const details = document.getElementById('condition-details');
        
        if (!this.selectedCondition) {
            placeholder.style.display = 'block';
            details.style.display = 'none';
            return;
        }

        placeholder.style.display = 'none';
        details.style.display = 'block';

        const condition = this.selectedCondition;
        
        document.getElementById('condition-name').textContent = condition.name;
        
        const statusBadge = document.getElementById('condition-status');
        statusBadge.textContent = condition.clinicalStatus;
        statusBadge.className = `badge bg-${this.getStatusBadgeClass(condition.clinicalStatus)}`;
        
        document.getElementById('condition-onset').textContent = 
            condition.date ? new Date(condition.date).toLocaleDateString() : 'Unknown';
        document.getElementById('condition-clinical-status').textContent = condition.clinicalStatus;
        document.getElementById('condition-verification').textContent = condition.status || 'Unknown';
        document.getElementById('condition-category').textContent = condition.category;

        // Related data (placeholder - would need actual medication/encounter data)
        this.renderRelatedData(condition);
    }

    getStatusBadgeClass(status) {
        switch (status) {
            case 'active': return 'success';
            case 'chronic': return 'warning';
            case 'resolved': return 'secondary';
            default: return 'secondary';
        }
    }

    renderRelatedData(condition) {
        // This would typically fetch related medications and encounters
        // For now, showing placeholder text
        document.getElementById('related-medications').innerHTML = 
            '<small class="text-muted">No related medications found</small>';
        document.getElementById('related-encounters').innerHTML = 
            '<small class="text-muted">No related encounters found</small>';
    }

    renderCategories() {
        const container = document.getElementById('categories-container');
        
        if (this.filteredConditions.length === 0) {
            container.innerHTML = `
                <div class="categories-placeholder text-center py-4">
                    <i class="fas fa-folder-open fa-2x text-muted mb-3"></i>
                    <p class="text-muted">No condition categories available</p>
                </div>
            `;
            return;
        }

        // Group conditions by category
        const categories = {};
        this.filteredConditions.forEach(condition => {
            if (!categories[condition.category]) {
                categories[condition.category] = [];
            }
            categories[condition.category].push(condition);
        });

        const categoriesHtml = Object.entries(categories).map(([category, conditions]) => `
            <div class="category-item">
                <div class="category-header">
                    <span class="category-name">${category}</span>
                    <span class="category-count">${conditions.length}</span>
                </div>
                <div class="category-conditions">
                    ${conditions.slice(0, 3).map(c => c.name).join(', ')}
                    ${conditions.length > 3 ? ` and ${conditions.length - 3} more...` : ''}
                </div>
            </div>
        `).join('');

        container.innerHTML = categoriesHtml;
    }

    exportData() {
        const data = {
            patient: this.patientData.patient,
            conditions: this.conditions,
            exportDate: new Date().toISOString(),
            summary: {
                total: this.conditions.length,
                active: this.conditions.filter(c => c.clinicalStatus === 'active').length,
                resolved: this.conditions.filter(c => c.clinicalStatus === 'resolved').length,
                chronic: this.conditions.filter(c => c.clinicalStatus === 'chronic').length
            }
        };

        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `condition-overview-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }

    showNoDataMessage() {
        document.getElementById('patient-info').textContent = 'No patient data available';
        document.getElementById('timeline-container').innerHTML = `
            <div class="timeline-placeholder">
                <i class="fas fa-exclamation-triangle fa-3x text-muted mb-3"></i>
                <p class="text-muted">Unable to load condition data</p>
            </div>
        `;
        document.getElementById('categories-container').innerHTML = `
            <div class="categories-placeholder text-center py-4">
                <i class="fas fa-exclamation-triangle fa-2x text-muted mb-3"></i>
                <p class="text-muted">Unable to load condition categories</p>
            </div>
        `;
    }
}

// Initialize the dashboard when the page loads
document.addEventListener('DOMContentLoaded', () => {
    new ConditionDashboard();
});

// Add CSS for selected timeline item
const style = document.createElement('style');
style.textContent = `
    .timeline-item.selected {
        background: #e0f2fe;
        border-left-color: var(--secondary-color);
        transform: translateX(4px);
    }
`;
document.head.appendChild(style);