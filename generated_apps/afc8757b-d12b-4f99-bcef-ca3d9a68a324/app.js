// ObserveTrack Pro - Healthcare Dashboard JavaScript

class ObserveTrackPro {
    constructor() {
        this.patientData = window.PATIENT_DATA || this.generateMockData();
        this.chart = null;
        this.filteredData = [];
        this.currentTimeRange = 30;
        this.activeFilters = {
            vitals: true,
            labs: true,
            assessments: true
        };
        
        this.init();
    }

    init() {
        this.showLoading();
        setTimeout(() => {
            this.processData();
            this.setupEventListeners();
            this.renderDashboard();
            this.hideLoading();
        }, 1500);
    }

    generateMockData() {
        const observations = [];
        const now = new Date();
        
        // Generate blood pressure readings
        for (let i = 0; i < 20; i++) {
            const date = new Date(now - (i * 7 * 24 * 60 * 60 * 1000)); // Weekly readings
            observations.push({
                id: `bp-${i}`,
                type: 'Blood Pressure',
                category: 'vitals',
                value: `${120 + Math.floor(Math.random() * 40)}/${80 + Math.floor(Math.random() * 20)}`,
                unit: 'mmHg',
                date: date,
                status: Math.random() > 0.8 ? 'abnormal' : 'normal',
                referenceRange: '90-120/60-80 mmHg'
            });
        }

        // Generate heart rate readings
        for (let i = 0; i < 25; i++) {
            const date = new Date(now - (i * 5 * 24 * 60 * 60 * 1000)); // Every 5 days
            const hr = 65 + Math.floor(Math.random() * 30);
            observations.push({
                id: `hr-${i}`,
                type: 'Heart Rate',
                category: 'vitals',
                value: hr,
                unit: 'bpm',
                date: date,
                status: hr > 100 || hr < 60 ? 'abnormal' : 'normal',
                referenceRange: '60-100 bpm'
            });
        }

        // Generate temperature readings
        for (let i = 0; i < 15; i++) {
            const date = new Date(now - (i * 10 * 24 * 60 * 60 * 1000)); // Every 10 days
            const temp = 97.5 + Math.random() * 3;
            observations.push({
                id: `temp-${i}`,
                type: 'Temperature',
                category: 'vitals',
                value: temp.toFixed(1),
                unit: '°F',
                date: date,
                status: temp > 100.4 || temp < 97 ? 'abnormal' : 'normal',
                referenceRange: '97.0-99.5°F'
            });
        }

        // Generate weight readings
        for (let i = 0; i < 12; i++) {
            const date = new Date(now - (i * 30 * 24 * 60 * 60 * 1000)); // Monthly
            const weight = 170 + Math.floor(Math.random() * 20) - 10;
            observations.push({
                id: `weight-${i}`,
                type: 'Weight',
                category: 'vitals',
                value: weight,
                unit: 'lbs',
                date: date,
                status: 'normal',
                referenceRange: '150-200 lbs'
            });
        }

        // Generate lab results
        const labTypes = ['Glucose', 'Cholesterol', 'Hemoglobin', 'White Blood Cell Count'];
        labTypes.forEach((labType, index) => {
            for (let i = 0; i < 8; i++) {
                const date = new Date(now - (i * 45 * 24 * 60 * 60 * 1000)); // Every 45 days
                let value, unit, referenceRange, status;
                
                switch (labType) {
                    case 'Glucose':
                        value = 85 + Math.floor(Math.random() * 40);
                        unit = 'mg/dL';
                        referenceRange = '70-100 mg/dL';
                        status = value > 100 ? 'abnormal' : 'normal';