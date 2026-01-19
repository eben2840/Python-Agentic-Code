// Healthcare Vital Signs Dashboard Application
class VitalSignsDashboard {
    constructor() {
        this.patientData = window.PATIENT_DATA || this.generateMockData();
        this.vitalsChart = null;
        this.sparklineCharts = {};
        this.currentTimeRange = '24h';
        this.vitalRanges = {
            bloodPressure: { systolic: { min: 90, max: 120 }, diastolic: { min: 60, max: 80 } },
            heartRate: { min: 60, max: 100 },
            temperature: { min: 97.0, max: 99.5 },
            respiratoryRate: { min: 12, max: 20 },
            oxygenSaturation: { min: 95, max: 100 }
        };
        
        this.init();
    }

    init() {
        this.showLoading();
        this.setupEventListeners();
        this.processVitalSigns();
        this.renderCriticalAlerts();
        this.renderVitalsChart();
        this.renderVitalCards();
        this.renderComparison();
        this.updateLastUpdated();
        this.hideLoading();
    }

    setupEventListeners() {
        // Time range selector
        document.querySelectorAll('input[name="timeRange"]').forEach(input => {
            input.addEventListener('change', (e) => {
                this.currentTimeRange = e.target.value;
                this.renderVitalsChart();
                this.renderVitalCards();
            });
        });

        // Chart controls
        document.getElementById('toggleGrid')?.addEventListener('click', this.toggleChartGrid.bind(this));
        document.getElementById('exportChart')?.addEventListener('click', this.exportChart.bind(this));

        // Comparison period selector
        document.getElementById('comparisonPeriod')?.addEventListener('change', this.renderComparison.bind(this));

        // Header action button
        document.getElementById('headerActionBtn')?.addEventListener('click', this.refreshData.bind(this));
    }

    refreshData() {
        const btn = document.getElementById('headerActionBtn');
        const icon = btn.querySelector('i');
        
        //