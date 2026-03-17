document.addEventListener('DOMContentLoaded', function() {
    const data = window.PATIENT_DATA;
    let newVitalSigns = [];
    
    // Load patient information
    loadPatientInfo();
    loadExistingVitals();
    
    // Form handlers
    document.getElementById('triageForm').addEventListener('submit', handleTriageSubmit);
    document.getElementById('saveVitals').addEventListener('click', handleVitalsSave);
    
    function loadPatientInfo() {
        const patientInfoDiv = document.getElementById('patientInfo');
        
        if (!data || !data.patient) {
            patientInfoDiv.innerHTML = '<p class="text-muted">No patient data available</p>';
            return;
        }
        
        const patient = data.patient;
        const age = calculateAge(patient.birthDate);
        
        patientInfoDiv.innerHTML = `
            <div class="patient-info-item">
                <span class="patient-info-label">Name</span>
                <span class="patient-info-value">${patient.name || 'Unknown'}</span>
            </div>
            <div class="patient-info-item">
                <span class="patient-info-label">Age</span>
                <span class="patient-info-value">${age} years</span>
            </div>
            <div class="patient-info-item">
                <span class="patient-info-label">Gender</span>
                <span class="patient-info-value">${patient.gender || 'Unknown'}</span>
            </div>
            <div class="patient-info-item">
                <span class="patient-info-label">DOB</span>
                <span class="patient-info-value">${formatDate(patient.birthDate)}</span>
            </div>
        `;
    }
    
    function loadExistingVitals() {
        const existingVitalsDiv = document.getElementById('existingVitals');
        
        if (!data || !data.vital_signs || !data.vital_signs.summary) {
            return;
        }
        
        data.vital_signs.summary.forEach(vital => {
            const vitalCard = createVitalCard(vital.display, vital.value, vital.unit, vital.date);
            existingVitalsDiv.appendChild(vitalCard);
        });
    }
    
    function handleTriageSubmit(e) {
        e.preventDefault();
        
        const formData = {
            chiefComplaint: document.getElementById('chiefComplaint').value,
            painLevel: document.getElementById('painLevel').value,
            onset: document.getElementById('onset').value,
            consciousness: document.getElementById('consciousness').value,
            breathing: document.getElementById('breathing').value,
            additionalNotes: document.getElementById('additionalNotes').value
        };
        
        const triageLevel = calculateTriageLevel(formData);
        updateTriagePriority(triageLevel);
    }
    
    function handleVitalsSave() {
        const vitals = {
            systolic: document.getElementById('systolic').value,
            diastolic: document.getElementById('diastolic').value,
            heartRate: document.getElementById('heartRate').value,
            temperature: document.getElementById('temperature').value,
            oxygenSat: document.getElementById('oxygenSat').value,
            respiratoryRate: document.getElementById('respiratoryRate').value,
            weight: document.getElementById('weight').value,
            timestamp: new Date().toISOString()
        };
        
        addNewVitalSigns(vitals);
        document.getElementById('vitalSignsForm').reset();
        bootstrap.Modal.getInstance(document.getElementById('vitalSignsModal')).hide();
    }
    
    function addNewVitalSigns(vitals) {
        const newVitalsDiv = document.getElementById('newVitalsList');
        
        if (vitals.systolic && vitals.diastolic) {
            const bpCard = createVitalCard('Blood Pressure', `${vitals.systolic}/${vitals.diastolic}`, 'mmHg', 'Just now');
            newVitalsDiv.appendChild(bpCard);
        }
        
        if (vitals.heartRate) {
            const hrCard = createVitalCard('Heart Rate', vitals.heartRate, 'bpm', 'Just now');
            newVitalsDiv.appendChild(hrCard);
        }
        
        if (vitals.temperature) {
            const tempCard = createVitalCard('Temperature', vitals.temperature, '°F', 'Just now');
            newVitalsDiv.appendChild(tempCard);
        }
        
        if (vitals.oxygenSat) {
            const o2Card = createVitalCard('Oxygen Saturation', vitals.oxygenSat, '%', 'Just now');
            newVitalsDiv.appendChild(o2Card);
        }
        
        if (vitals.respiratoryRate) {
            const rrCard = createVitalCard('Respiratory Rate', vitals.respiratoryRate, 'breaths/min', 'Just now');
            newVitalsDiv.appendChild(rrCard);
        }
        
        if (vitals.weight) {
            const weightCard = createVitalCard('Weight', vitals.weight, 'kg', 'Just now');
            newVitalsDiv.appendChild(weightCard);
        }
    }
    
    function createVitalCard(label, value, unit, date) {
        const col = document.createElement('div');
        col.className = 'col-md-4 col-sm-6 mb-3';
        
        col.innerHTML = `
            <div class="vital-card">
                <div class="vital-label">${label}</div>
                <div class="vital-value">${value} <small class="text-muted">${unit}</small></div>
                <small class="text-muted">${formatDate(date)}</small>
            </div>
        `;
        
        return col;
    }
    
    function calculateTriageLevel(formData) {
        let score = 0;
        
        // Critical indicators
        if (formData.consciousness === 'unconscious' || formData.breathing === 'absent') return 1;
        if (formData.painLevel === '9-10' || formData.breathing === 'labored') score += 3;
        if (formData.painLevel === '7-8' || formData.consciousness === 'confused') score += 2;
        if (formData.onset === 'sudden') score += 1;
        if (formData.painLevel === '4-6') score += 1;
        
        if (score >= 3) return 1; // Critical
        if (score >= 2) return 2; // Urgent
        if (score >= 1) return 3; // Less Urgent
        return 4; // Non-urgent
    }
    
    function updateTriagePriority(level) {
        const priorityDiv = document.getElementById('triagePriority');
        const levels = {
            1: { text: 'Critical', class: 'triage-critical' },
            2: { text: 'Urgent', class: 'triage-urgent' },
            3: { text: 'Less Urgent', class: 'triage-less-urgent' },
            4: { text: 'Non-Urgent', class: 'triage-non-urgent' }
        };
        
        const levelInfo = levels[level];
        priorityDiv.innerHTML = `<span class="badge ${levelInfo.class} fs-6 px-3 py-2">${levelInfo.text}</span>`;
    }
    
    function calculateAge(birthDate) {
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
    
    function formatDate(dateString) {
        if (!dateString) return 'Unknown';
        if (dateString === 'Just now') return dateString;
        const date = new Date(dateString);
        return date.toLocaleDateString();
    }
});