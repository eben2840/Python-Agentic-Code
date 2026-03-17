// Mock patient data structure
window.PATIENT_DATA = {
    patient: { id: 'all' },
    patients: [
        {
            id: 'pat-8af3af30',
            name: 'John Smith',
            gender: 'male',
            birthDate: '1980-01-15',
            data: {
                condition: [{ name: 'Hypertension', status: 'active', date: '2026-03-01T09:00:00Z' }],
                vital_signs: [{ name: 'BP 140/90', value: 'BP 140/90', date: '2026-03-05T12:00:00Z' }]
            }
        },
        {
            id: 'pat-0a70a8f4',
            name: 'Jane Doe',
            gender: 'female',
            birthDate: '1980-02-15',
            data: {
                condition: [{ name: 'Breast Cancer', status: 'active', date: '2026-03-01T09:00:00Z' }],
                vital_signs: [{ name: 'Tumor Marker CA15-3', value: 'Tumor Marker CA15-3', date: '2026-03-05T12:00:00Z' }]
            }
        },
        {
            id: 'pat-3d19853a',
            name: 'Alice Johnson',
            gender: 'male',
            birthDate: '1980-03-15',
            data: {
                condition: [{ name: 'Fractured Femur', status: 'active', date: '2026-03-01T09:00:00Z' }],
                vital_signs: [{ name: 'Pain Scale 8/10', value: 'Pain Scale 8/10', date: '2026-03-05T12:00:00Z' }]
            }
        },
        {
            id: 'pat-ec64299d',
            name: 'Bob Wilson',
            gender: 'female',
            birthDate: '1980-04-15',
            data: {
                condition: [{ name: 'Migraine', status: 'active', date: '2026-03-01T09:00:00Z' }],
                vital_signs: [{ name: 'Headache VAS 7', value: 'Headache VAS 7', date: '2026-03-05T12:00:00Z' }]
            }
        },
        {
            id: 'pat-fed00c36',
            name: 'Carol Davis',
            gender: 'male',
            birthDate: '1980-05-15',
            data: {
                condition: [{ name: 'Asthma', status: 'active', date: '2026-03-01T09:00:00Z' }],
                vital_signs: [{ name: 'Peak Flow 250', value: 'Peak Flow 250', date: '2026-03-05T12:00:00Z' }]
            }
        }
    ]
};

class ERTriageApp {
    constructor() {
        this.selectedPatient = null;
        this.triageData = {};
        this.vitalsData = {};
        this.init();
    }

    init() {
        this.updateCurrentTime();
        setInterval(() => this.updateCurrentTime(), 1000);
        
        this.loadPatients();
        this.bindEvents();
    }

    updateCurrentTime() {
        const now = new Date();
        document.getElementById('currentTime').textContent = now.toLocaleString();
    }

    loadPatients() {
        const select = document.getElementById('patientSelect');
        const data = window.PATIENT_DATA;
        
        if (data.patient.id === 'all' && data.patients) {
            data.patients.forEach(patient => {
                const option = document.createElement('option');
                option.value = patient.id;
                option.textContent = `${patient.name} (${patient.gender}, ${this.calculateAge(patient.birthDate)})`;
                select.appendChild(option);
            });
        }
    }

    calculateAge(birthDate) {
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

    bindEvents() {
        document.getElementById('patientSelect').addEventListener('change', (e) => {
            this.selectPatient(e.target.value);
        });

        document.getElementById('painLevel').addEventListener('input', (e) => {
            document.getElementById('painValue').textContent = e.target.value;
            this.updateTriagePriority();
        });

        document.getElementById('triagePriority').addEventListener('change', (e) => {
            this.showTriageResult(e.target.value);
        });

        // Symptom checkboxes
        const symptoms = ['fever', 'nausea', 'dizziness', 'chestPain', 'shortBreath', 'bleeding'];
        symptoms.forEach(symptom => {
            document.getElementById(symptom).addEventListener('change', () => {
                this.updateTriagePriority();
            });
        });

        document.getElementById('saveVitals').addEventListener('click', () => {
            this.saveVitalSigns();
        });

        document.getElementById('completeTriage').addEventListener('click', () => {
            this.completeTriage();
        });
    }

    selectPatient(patientId) {
        if (!patientId) {
            document.getElementById('patientInfo').style.display = 'none';
            document.getElementById('currentConditions').innerHTML = '<p class="text-muted text-sm">Select a patient to view conditions</p>';
            this.selectedPatient = null;
            return;
        }

        const data = window.PATIENT_DATA;
        const patient = data.patients.find(p => p.id === patientId);
        
        if (patient) {
            this.selectedPatient = patient;
            
            // Update patient info
            document.getElementById('patientName').textContent = patient.name;
            document.getElementById('patientGender').textContent = patient.gender || 'Unknown';
            document.getElementById('patientAge').textContent = this.calculateAge(patient.birthDate);
            document.getElementById('patientInfo').style.display = 'block';
            
            // Update conditions
            this.displayCurrentConditions(patient);
            this.displayCurrentVitals(patient);
        }
    }

    displayCurrentConditions(patient) {
        const container = document.getElementById('currentConditions');
        
        if (patient.data.condition && patient.data.condition.length > 0) {
            const conditionsHtml = patient.data.condition.map(condition => 
                `<span class="condition-badge">${condition.name}</span>`
            ).join('');
            container.innerHTML = conditionsHtml;
        } else {
            container.innerHTML = '<p class="text-muted text-sm">No current conditions</p>';
        }
    }

    displayCurrentVitals(patient) {
        const container = document.getElementById('currentVitals');
        const display = document.getElementById('vitalsDisplay');
        
        if (patient.data.vital_signs && patient.data.vital_signs.length > 0) {
            const vitalsHtml = patient.data.vital_signs.map(vital => 
                `<div class="vital-item">
                    <span>${vital.name}:</span>
                    <span class="vital-value">${vital.value}</span>
                </div>`
            ).join('');
            display.innerHTML = vitalsHtml;
            container.style.display = 'block';
        } else {
            container.style.display = 'none';
        }
    }

    updateTriagePriority() {
        const painLevel = parseInt(document.getElementById('painLevel').value);
        const symptoms = this.getSelectedSymptoms();
        
        let suggestedLevel = 5; // Default to lowest priority
        
        // High priority symptoms
        if (symptoms.includes('chestPain') || symptoms.includes('shortBreath') || symptoms.includes('bleeding')) {
            suggestedLevel = Math.min(suggestedLevel, 2);
        }
        
        // Pain-based priority
        if (painLevel >= 8) {
            suggestedLevel = Math.min(suggestedLevel, 2);
        } else if (painLevel >= 6) {
            suggestedLevel = Math.min(suggestedLevel, 3);
        } else if (painLevel >= 4) {
            suggestedLevel = Math.min(suggestedLevel, 4);
        }
        
        // Fever consideration
        if (symptoms.includes('fever')) {
            suggestedLevel = Math.min(suggestedLevel, 3);
        }
        
        // Auto-select suggested priority
        document.getElementById('triagePriority').value = suggestedLevel.toString();
        this.showTriageResult(suggestedLevel.toString());
    }

    getSelectedSymptoms() {
        const symptoms = ['fever', 'nausea', 'dizziness', 'chestPain', 'shortBreath', 'bleeding'];
        return symptoms.filter(symptom => document.getElementById(symptom).checked);
    }

    showTriageResult(level) {
        const resultDiv = document.getElementById('triageResult');
        
        if (!level) {
            resultDiv.style.display = 'none';
            return;
        }
        
        const levels = {
            '1': { name: 'Immediate', color: 'Red', class: 'triage-level-1', time: 'Immediate' },
            '2': { name: 'Urgent', color: 'Orange', class: 'triage-level-2', time: '15 minutes' },
            '3': { name: 'Less Urgent', color: 'Yellow', class: 'triage-level-3', time: '30 minutes' },
            '4': { name: 'Non-Urgent', color: 'Green', class: 'triage-level-4', time: '60 minutes' },
            '5': { name: 'Fast Track', color: 'Blue', class: 'triage-level-5', time: '120 minutes' }
        };
        
        const levelInfo = levels[level];
        resultDiv.className = `triage-result ${levelInfo.class}`;
        resultDiv.innerHTML = `
            <strong>Triage Level ${level}: ${levelInfo.name} (${levelInfo.color})</strong><br>
            <small>Expected wait time: ${levelInfo.time}</small>
        `;
        resultDiv.style.display = 'block';
    }

    saveVitalSigns() {
        if (!this.selectedPatient) {
            alert('Please select a patient first');
            return;
        }
        
        const vitals = {
            systolic: document.getElementById('systolic').value,
            diastolic: document.getElementById('diastolic').value,
            heartRate: document.getElementById('heartRate').value,
            respRate: document.getElementById('respRate').value,
            temperature: document.getElementById('temperature').value,
            oxygenSat: document.getElementById('oxygenSat').value,
            weight: document.getElementById('weight').value,
            timestamp: new Date().toISOString()
        };
        
        // Filter out empty values
        Object.keys(vitals).forEach(key => {
            if (!vitals[key] && key !== 'timestamp') {
                delete vitals[key];
            }
        });
        
        if (Object.keys(vitals).length <= 1) { // Only timestamp
            alert('Please enter at least one vital sign');
            return;
        }
        
        this.vitalsData = vitals;
        
        // Update display
        const display = document.getElementById('vitalsDisplay');
        let vitalsHtml = '';
        
        if (vitals.systolic && vitals.diastolic) {
            vitalsHtml += `<div class="vital-item"><span>Blood Pressure:</span><span class="vital-value">${vitals.systolic}/${vitals.diastolic} mmHg</span></div>`;
        }
        if (vitals.heartRate) {
            vitalsHtml += `<div class="vital-item"><span>Heart Rate:</span><span class="vital-value">${vitals.heartRate} bpm</span></div>`;
        }
        if (vitals.respRate) {
            vitalsHtml += `<div class="vital-item"><span>Respiratory Rate:</span><span class="vital-value">${vitals.respRate} /min</span></div>`;
        }
        if (vitals.temperature) {
            vitalsHtml += `<div class="vital-item"><span>Temperature:</span><span class="vital-value">${vitals.temperature}°C</span></div>`;
        }
        if (vitals.oxygenSat) {
            vitalsHtml += `<div class="vital-item"><span>O2 Saturation:</span><span class="vital-value">${vitals.oxygenSat}%