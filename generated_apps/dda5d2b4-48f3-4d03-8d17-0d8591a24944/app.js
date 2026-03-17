class ICUDashboard {
    constructor() {
        this.patientData = null;
        this.trendsChart = null;
        this.currentFilter = 'all';
        this.init();
    }

    init() {
        this.loadPatientData();
        this.setupEventListeners();
    }

    loadPatientData() {
        if (typeof window.PATIENT_DATA === 'undefined') {
            this.showError('Patient data not available');
            return;
        }

        this.patientData = window.PATIENT_DATA;
        
        if (this.patientData.patient.id === 'all') {
            this.renderAllPatientsView();
        } else {
            this.renderSinglePatientView();
        }
    }

    setupEventListeners() {
        // Timeline filter buttons
        document.addEventListener('click', (e) => {
            if (e.target.matches('[data-filter]')) {
                this.handleTimelineFilter(e.target);
            }
        });

        // Patient card clicks for all patients view
        document.addEventListener('click', (e) => {
            if (e.target.closest('.patient-card')) {
                const patientId = e.target.closest('.patient-card').dataset.patientId;
                this.selectPatient(patientId);
            }
        });
    }

    renderAllPatientsView() {
        document.getElementById('patient-selection').style.display = 'block';
        document.getElementById('single-patient-dashboard').style.display = 'none';
        
        this.updatePatientHeader('All ICU Patients', 'System Overview');
        this.renderPatientsGrid();
    }

    renderSinglePatientView() {
        document.getElementById('patient-selection').style.display = 'none';
        document.getElementById('single-patient-dashboard').style.display = 'block';
        
        const patient = this.patientData.patient;
        this.updatePatientHeader(patient.name || 'Unknown Patient', 
            `${patient.gender || 'Unknown'} | DOB: ${this.formatDate(patient.birthDate) || 'Unknown'}`);
        
        this.renderVitalSigns();
        this.renderVentilationParams();
        this.renderNeuroMonitoring();
        this.renderTimeline();
        this.renderMedications();
        this.renderTrendsChart();
        this.checkForAlerts();
    }

    updatePatientHeader(name, details) {
        document.getElementById('patient-name').textContent = name;
        document.getElementById('patient-details').textContent = details;
    }

    renderPatientsGrid() {
        const container = document.getElementById('patients-grid');
        
        if (!this.patientData.patients || this.patientData.patients.length === 0) {
            container.innerHTML = '<div class="no-data">No patients available</div>';
            return;
        }

        const patientsHtml = this.patientData.patients.map(patient => {
            const conditionsCount = patient.data.condition ? patient.data.condition.summary.length : 0;
            const vitalsCount = patient.data.vital_signs ? patient.data.vital_signs.summary.length : 0;
            const medsCount = patient.data.medicationrequest ? patient.data.medicationrequest.summary.length : 0;
            const obsCount = patient.data.observation ? patient.data.observation.summary.length : 0;

            return `
                <div class="patient-card" data-patient-id="${patient.id}">
                    <div class="patient-header">
                        <div>
                            <div class="patient-name-card">${patient.name || 'Unknown Patient'}</div>
                            <div class="patient-id">ID: ${patient.id}</div>
                        </div>
                        <i class="fas fa-user-injured fa-lg" style="color: var(--primary-color);"></i>
                    </div>
                    <div class="patient-stats">
                        <div class="stat-item">
                            <div class="stat-value">${conditionsCount}</div>
                            <div class="stat-label">Conditions</div>
                        </div>
                        <div class="stat-item">
                            <div class="stat-value">${vitalsCount}</div>
                            <div class="stat-label">Vitals</div>
                        </div>
                        <div class="stat-item">
                            <div class="stat-value">${medsCount}</div>
                            <div class="stat-label">Medications</div>
                        </div>
                        <div class="stat-item">
                            <div class="stat-value">${obsCount}</div>
                            <div class="stat-label">Observations</div>
                        </div>
                    </div>
                </div>
            `;
        }).join('');

        container.innerHTML = patientsHtml;
    }

    renderVitalSigns() {
        const container = document.getElementById('vital-signs-row');
        const vitals = this.patientData.vital_signs?.summary || [];
        
        if (vitals.length === 0) {
            container.innerHTML = '<div class="col-12 no-data">No vital signs data available</div>';
            return;
        }

        // Group vitals by type for better display
        const vitalTypes = {
            'BP': { icon: 'fas fa-heartbeat', unit: '', color: 'vital-normal' },
            'HR': { icon: 'fas fa-heart', unit: 'bpm', color: 'vital-normal' },
            'Temp': { icon: 'fas fa-thermometer-half', unit: '°C', color: 'vital-normal' },
            'SpO2': { icon: 'fas fa-lungs', unit: '%', color: 'vital-normal' },
            'RR': { icon: 'fas fa-wind', unit: '/min', color: 'vital-normal' }
        };

        const vitalsHtml = vitals.slice(0, 5).map(vital => {
            const vitalType = this.extractVitalType(vital.name);
            const config = vitalTypes[vitalType] || { icon: 'fas fa-chart-line', unit: '', color: 'vital-normal' };
            const status = this.assessVitalStatus(vitalType, vital.value);
            
            return `
                <div class="col-lg-2 col-md-4 col-sm-6 mb-3">
                    <div class="vital-sign-card">
                        <div class="vital-icon ${status}">
                            <i class="${config.icon}"></i>
                        </div>
                        <div class="vital-value ${status}">
                            ${vital.value || 'N/A'}
                            <span class="vital-unit">${config.unit}</span>
                        </div>
                        <div class="vital-label">${vital.name}</div>
                        ${vital.date ? `<div class="timeline-time">${this.formatDateTime(vital.date)}</div>` : ''}
                    </div>
                </div>
            `;
        }).join('');

        container.innerHTML = vitalsHtml;
    }

    renderVentilationParams() {
        const container = document.getElementById('ventilation-params');
        const observations = this.patientData.observation?.summary || [];
        
        // Filter for ventilation-related parameters
        const ventParams = observations.filter(obs => 
            obs.name && (
                obs.name.toLowerCase().includes('peep') ||
                obs.name.toLowerCase().includes('fio2') ||
                obs.name.toLowerCase().includes('tidal') ||
                obs.name.toLowerCase().includes('pressure') ||
                obs.name.toLowerCase().includes('volume')
            )
        );

        if (ventParams.length === 0) {
            container.innerHTML = '<div class="no-data">No ventilation parameters available</div>';
            return;
        }

        const paramsHtml = ventParams.map(param => `
            <div class="parameter-item">
                <span class="parameter-label">${param.name}</span>
                <span class="parameter-value">${param.value || 'N/A'}</span>
            </div>
        `).join('');

        container.innerHTML = paramsHtml;
    }

    renderNeuroMonitoring() {
        const container = document.getElementById('neuro-monitoring');
        const observations = this.patientData.observation?.summary || [];
        
        // Filter for neurological parameters
        const neuroParams = observations.filter(obs => 
            obs.name && (
                obs.name.toLowerCase().includes('gcs') ||
                obs.name.toLowerCase().includes('glasgow') ||
                obs.name.toLowerCase().includes('pupil') ||
                obs.name.toLowerCase().includes('pain') ||
                obs.name.toLowerCase().includes('mmse') ||
                obs.name.toLowerCase().includes('sedation')
            )
        );

        if (neuroParams.length === 0) {
            container.innerHTML = '<div class="no-data">No neurological monitoring data available</div>';
            return;
        }

        const neuroHtml = neuroParams.map(param => `
            <div class="parameter-item">
                <span class="parameter-label">${param.name}</span>
                <span class="parameter-value">${param.value || 'N/A'}</span>
            </div>
        `).join('');

        container.innerHTML = neuroHtml;
    }

    renderTimeline() {
        const container = document.getElementById('timeline-container');
        const timelineItems = this.getTimelineItems();
        
        if (timelineItems.length === 0) {
            container.innerHTML = '<div class="no-data">No timeline data available</div>';
            return;
        }

        const filteredItems = this.currentFilter === 'all' ? 
            timelineItems : timelineItems.filter(item => item.type === this.currentFilter);

        const timelineHtml = filteredItems.map(item => `
            <div class="timeline-item">
                <div class="timeline-icon timeline-${item.type}">
                    <i class="${item.icon}"></i>
                </div>
                <div class="timeline-content">
                    <div class="timeline-title">${item.title}</div>
                    <div class="timeline-details">${item.details}</div>
                    <div class="timeline-time">${item.time}</div>
                </div>
            </div>
        `).join('');

        container.innerHTML = timelineHtml;
    }

    renderMedications() {
        const container = document.getElementById('medications-list');
        const medications = this.patientData.medicationrequest?.summary || [];
        
        if (medications.length === 0) {
            container.innerHTML = '<div class="no-data">No medications available</div>';
            return;
        }

        const medsHtml = medications.map(med => `
            <div class="medication-item">
                <div>
                    <div class="medication-name">${med.name || 'Unknown Medication'}</div>
                    <div class="medication-dosage">${med.value || 'Dosage not specified'}</div>
                </div>
                <div class="medication-status status-active">Active</div>
            </div>
        `).join('');

        container.innerHTML = medsHtml;
    }

    renderTrendsChart() {
        const ctx = document.getElementById('trendsChart');
        if (!ctx) return;

        if (this.trendsChart) {
            this.trendsChart.destroy();
        }

        const vitals = this.patientData.vital_signs?.summary || [];
        
        if (vitals.length === 0) {
            ctx.getContext('2d').clearRect(0, 0, ctx.width, ctx.height);
            return;
        }

        // Create mock trend data based on available vitals
        const labels = Array.from({length: 24}, (_, i) => `${i}:00`);
        const datasets = this.createTrendDatasets(vitals);

        this.trendsChart = new Chart(ctx, {
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
                        position: 'top',
                    },
                    title: {
                        display: true,
                        text: '24-Hour Vital Signs Trends'
                    }
                },
                scales: {
                    y: {
                        beginAtZero: false
                    }
                }
            }
        });
    }

    checkForAlerts() {
        const vitals = this.patientData.vital_signs?.summary || [];
        const alerts = [];

        vitals.forEach(vital => {
            const vitalType = this.extractVitalType(vital.name);
            const status = this.assessVitalStatus(vitalType, vital.value);
            
            if (status === 'vital-critical') {
                alerts.push({
                    type: 'critical',
                    message: `Critical ${vital.name}: ${vital.value}`,
                    time: vital.date
                });
            } else if (status === 'vital-warning') {
                alerts.push({
                    type: 'high',
                    message: `Abnormal ${vital.name}: ${vital.value}`,
                    time: vital.date
                });
            }
        });

        if (alerts.length > 0) {
            this.renderAlerts(alerts);
        }
    }

    renderAlerts(alerts) {
        const alertSection = document.getElementById('alert-section');
        const container = document.getElementById('alerts-container');
        
        const alertsHtml = alerts.map(alert => `
            <div class="alert-item alert-${alert.type}">
                <div>
                    <strong>${alert.message}</strong>
                    ${alert.time ? `<div class="timeline-time">${this.formatDateTime(alert.time)}</div>` : ''}
                </div>
                <button class="btn btn-sm btn-outline-secondary">
                    <i class="fas fa-check"></i>
                </button>
            </div>
        `).join('');

        container.innerHTML = alertsHtml;
        alertSection.style.display = 'block';
    }

    getTimelineItems() {
        const items = [];
        
        // Add vital signs
        (this.patientData.vital_signs?.summary || []).forEach(vital => {
            items.push({
                type: 'vitals',
                icon: 'fas fa-heartbeat',
                title: vital.name,
                details: `Value: ${vital.value || 'N/A'}`,
                time: this.formatDateTime(vital.date),
                timestamp: vital.date
            });
        });

        // Add medications
        (this.patientData.medicationrequest?.summary || []).forEach(med => {
            items.push({
                type: 'medications',
                icon: 'fas fa-pills',
                title: med.name || 'Medication',
                details: med.value || 'Dosage not specified',
                time: this.formatDateTime(med.date),
                timestamp: med.date
            });
        });

        // Add observations
        (this.patientData.observation?.summary || []).forEach(obs => {
            items.push({
                type: 'observations',
                icon: 'fas fa-clipboard-check',
                title: obs.name,
                details: `Value: ${obs.value || 'N/A'}`,
                time: this.formatDateTime(obs.date),
                timestamp: obs.date
            });
        });

        // Sort by timestamp (most recent first)
        return items.sort((a, b) => new Date(b.timestamp || 0) - new Date(a.timestamp || 0));
    }

    createTrendDatasets(vitals) {
        const datasets = [];
        const colors = ['#14b8a6', '#3b82f6', '#22c55e', '#f59e0b', '#ef4444'];
        
        vitals.slice(0, 3).forEach((vital, index) => {
            // Create mock trend data
            const data = Array.from({length: 24}, () => {
                const baseValue = this.extractNumericValue(vital.value);
                return baseValue ? baseValue + (Math.random() - 0.5) * baseValue * 0.1 : Math.random() * 100;
            });

            datasets.push({
                label: vital.name,
                data: data,
                borderColor: colors[index],
                backgroundColor: colors[index] + '20',
                tension: 0.4
            });
        });

        return datasets;
    }

    handleTimelineFilter(button) {
        // Update active button
        document.querySelectorAll('[data-filter]').forEach(btn => btn.classList.remove('active'));
        button.classList.add('active');
        
        this.currentFilter = button.dataset.filter;
        this.renderTimeline();
    }

    selectPatient(patientId) {
        // In a real implementation, this would navigate to the specific patient
        console.log(`Selected patient: ${patientId}`);
    }

    extractVitalType(name) {
        if (!name) return 'Unknown';
        const lower = name.toLowerCase();
        if (lower.includes('bp') || lower.includes('blood pressure')) return 'BP';
        if (lower.includes('hr') || lower.includes('heart rate')) return 'HR';
        if (lower.includes('temp') || lower.includes('temperature')) return 'Temp';
        if (lower.includes('spo2') || lower.includes('oxygen')) return 'SpO2';
        if (lower.includes('rr') || lower.includes('respiratory')) return 'RR';
        return 'Other';
    }

    assessVitalStatus(type, value) {
        if (!value) return 'vital-normal';
        
        const numValue = this.extractNumericValue(value);
        if (!numValue) return 'vital-normal';

        switch (type) {
            case 'BP':
                if (numValue > 180 || numValue < 90) return 'vital-critical';
                if (numValue > 140 || numValue < 100) return 'vital-warning';
                return 'vital-normal';
            case 'HR':
                if (numValue > 120 || numValue < 50) return 'vital-critical';
                if (numValue > 100 || numValue < 60) return 'vital-warning';
                return 'vital-normal';
            case 'Temp':
                if (numValue > 39 || numValue < 35) return 'vital-critical';
                if (numValue > 37.5 || numValue < 36) return 'vital-warning';
                return 'vital-normal';
            default:
                return 'vital-normal';
        }
    }

    extractNumericValue(value) {
        if (!value) return null;
        const match = value.toString().match(/(\d+\.?\d*)/);
        return match ? parseFloat(match[1]) : null;
    }

    formatDate(dateString) {
        if (!dateString) return null;
        try {
            return new Date(dateString).toLocaleDateString();
        } catch {
            return dateString;
        }
    }

    formatDateTime(dateString) {
        if (!dateString) return 'No date';
        try {
            return new Date(dateString).toLocaleString();
        } catch {
            return dateString;
        }
    }

    showError(message) {
        document.body.innerHTML = `
            <div class="container-fluid p-4">
                <div class="alert alert-danger" role="alert">
                    <i class="fas fa-exclamation-triangle me-2"></i>
                    ${message}
                </div>
            </div>
        `;
    }
}

// Initialize the dashboard when the page loads
document.addEventListener('DOMContentLoaded', () => {
    new ICUDashboard();
});