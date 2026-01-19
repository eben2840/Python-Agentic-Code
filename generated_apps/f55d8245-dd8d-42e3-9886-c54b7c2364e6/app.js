// Healthcare Vital Signs Dashboard JavaScript
class VitalSignsDashboard {
    constructor() {
        this.patientData = window.PATIENT_DATA || this.generateMockData();
        this.charts = {};
        this.currentTimeRange = 7;
        this.selectedVitals = new Set(['bloodPressure', 'heartRate', 'temperature', 'weight', 'respiratoryRate']);
        
        this.init();
    }

    init() {
        this.showLoading();
        this.setupEventListeners();
        this.loadMedicationsList();
        this.loadEncountersList();
        this.updateSummaryCards();
        this.initializeCharts();
        this.hideLoading();
    }

    generateMockData() {
        const now = new Date();
        const observations = [];
        const medications = [
            { name: 'Lisinopril', dose: '10mg daily', startDate: new Date(now.getTime() - 180 * 24 * 60 * 60 * 1000) },
            { name: 'Metformin', dose: '500mg twice daily', startDate: new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000) },
            { name: 'Atorvastatin', dose: '20mg daily', startDate: new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000) },
            { name: 'Aspirin', dose: '81mg daily', startDate: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000) }
        ];

        // Generate vital signs data for the past year
        for (let i = 365; i >= 0; i--) {
            const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
            
            // Blood Pressure (with some variation)
            const systolic = 120 + Math.sin(i / 30) * 15 + (Math.random() - 0.5) * 20;
            const diastolic = 80 + Math.sin(i / 30) * 10 + (Math.random() - 0.5) * 15;
            
            observations.push({
                date: date,
                type: 'bloodPressure',
                value: { systolic: Math.round(systolic), diastolic: Math.round(diastolic) },
                unit: 'mmHg'
            });

            // Heart Rate
            const heartRate = 72 + Math.sin(i / 20) * 8 + (Math.random() - 0.5) * 12;
            observations.push({
                date: date,
                type: 'heartRate',
                value: Math.round(heartRate),
                unit: 'bpm'
            });

            // Temperature (only some days)
            if (Math.random() > 0.7) {
                const temp = 98.6 + (Math.random() - 0.5) * 2;
                observations.push({
                    date: date,
                    type: 'temperature',
                    value: parseFloat(temp.toFixed(1)),
                    unit: '°F'
                });
            }

            // Weight (weekly measurements)
            if (i % 7 === 0) {
                const weight = 180 + Math.sin(i / 60) * 5 + (Math.random() - 0.5) * 3;
                observations.push({
                    date: date,
                    type: 'weight',
                    value: parseFloat(weight.toFixed(1)),
                    unit: 'lbs'
                });
            }

            // Respiratory Rate (less frequent)
            if (Math.random() > 0.8) {
                const rr = 16 + (Math.random() - 0.5) * 4;
                observations.push({
                    date: date,
                    type: 'respiratoryRate',
                    value: Math.round(rr),
                    unit: '/min'
                });
            }
        }

        const encounters = [
            { date: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000), type: 'Annual Physical', provider: 'Dr. Smith' },
            { date: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000), type: 'Follow-up Visit', provider: 'Dr. Johnson' },
            { date: new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000), type: 'Cardiology Consult', provider: 'Dr. Williams' }
        ];

        return { observations, medications, encounters };
    }

    setupEventListeners() {
        // Time range selection
        document.querySelectorAll('input[name="timeRange"]').forEach(radio => {
            radio.addEventListener('change', (e) => {
                this.currentTimeRange = parseInt(e.target.value);
                this.updateCharts();
                this.updateSummaryCards();
            });
        });

        // Vital signs filter
        document.querySelectorAll('.vital-filters input[type="checkbox"]').forEach(checkbox => {
            checkbox.addEventListener('change', (e) => {
                if (e.target.checked) {
                    this.selectedVitals.add(e.target.id);
                } else {
                    this.selectedVitals.delete(e.target.id);
                }
                this.updateCharts();
            });
        });

        // Export and share buttons
        document.getElementById('exportBtn').addEventListener('click', () => {
            const modal = new bootstrap.Modal(document.getElementById('exportModal'));
            modal.show();