class AssessmentTriageApp {
    constructor() {
        this.patients = [];
        this.assessments = [];
        this.selectedPatientId = null;
        this.init();
    }

    init() {
        this.loadPatientData();
        this.setupEventListeners();
        this.loadSavedAssessments();
    }

    loadPatientData() {
        if (!window.PATIENT_DATA) {
            console.error('No patient data available');
            return;
        }

        const data = window.PATIENT_DATA;
        
        if (data.patient && data.patient.id === 'all' && data.patients) {
            this.patients = data.patients.map(patient => ({
                id: patient.id,
                name: patient.name || 'Unknown Patient',
                gender: patient.gender || 'Unknown',
                birthDate: patient.birthDate || 'Unknown',
                age: this.calculateAge(patient.birthDate),
                conditions: patient.data?.condition || [],
                observations: patient.data?.observation || [],
                vitalSigns: patient.data?.vital_signs || [],
                medications: patient.data?.medicationrequest || [],
                priority: this.determinePriority(patient.data),
                lastAssessment: null
            }));
        }

        this.updateStats();
        this.renderPatientList();
        this.populatePatientSelect();
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

    determinePriority(patientData) {
        if (!patientData) return 'routine';
        
        const conditions = patientData.condition || [];
        const vitals = patientData.vital_signs || [];
        
        // Critical conditions
        const criticalConditions = ['sepsis', 'chest pain', 'fractured femur'];
        if (conditions.some(c => criticalConditions.some(cc => 
            c.name?.toLowerCase().includes(cc)))) {
            return 'critical';
        }
        
        // Urgent conditions
        const urgentConditions = ['hypertension', 'migraine', 'asthma', 'copd'];
        if (conditions.some(c => urgentConditions.some(uc => 
            c.name?.toLowerCase().includes(uc)))) {
            return 'urgent';
        }
        
        return 'routine';
    }

    updateStats() {
        const total = this.patients.length;
        const critical = this.patients.filter(p => p.priority === 'critical').length;
        const pending = this.patients.filter(p => !p.lastAssessment).length;
        const completed = this.patients.filter(p => p.lastAssessment).length;

        document.getElementById('totalPatients').textContent = total;
        document.getElementById('criticalPatients').textContent = critical;
        document.getElementById('pendingAssessments').textContent = pending;
        document.getElementById('completedAssessments').textContent = completed;
    }

    renderPatientList() {
        const container = document.getElementById('patientAssessmentList');
        const filter = document.getElementById('priorityFilter').value;
        
        let filteredPatients = this.patients;
        if (filter) {
            filteredPatients = this.patients.filter(p => p.priority === filter);
        }

        if (filteredPatients.length === 0) {
            container.innerHTML = '<div class="text-center py-4 text-muted">No patients available</div>';
            return;
        }

        container.innerHTML = filteredPatients.map(patient => `
            <div class="patient-item ${this.selectedPatientId === patient.id ? 'selected' : ''}" 
                 data-patient-id="${patient.id}">
                <div class="patient-header">
                    <div>
                        <div class="patient-name">${patient.name}</div>
                        <div class="patient-demographics">
                            ${patient.gender} • Age ${patient.age} • ID: ${patient.id.substring(0, 8)}...
                        </div>
                    </div>
                    <span class="priority-badge priority-${patient.priority}">
                        ${patient.priority}
                    </span>
                </div>
                
                ${patient.conditions.length > 0 ? `
                    <div class="patient-conditions">
                        ${patient.conditions.slice(0, 3).map(condition => `
                            <span class="condition-tag">${condition.name || 'Unknown condition'}</span>
                        `).join('')}
                        ${patient.conditions.length > 3 ? `<span class="condition-tag">+${patient.conditions.length - 3} more</span>` : ''}
                    </div>
                ` : ''}
                
                ${patient.vitalSigns.length > 0 ? `
                    <div class="patient-vitals">
                        ${patient.vitalSigns.slice(0, 2).map(vital => `
                            <div class="vital-item">
                                <i class="fas fa-heartbeat text-danger"></i>
                                <span>${vital.name || vital.value || 'Unknown vital'}</span>
                            </div>
                        `).join('')}
                    </div>
                ` : '<div class="patient-vitals"><span class="text-muted">No vital signs recorded</span></div>'}
            </div>
        `).join('');
    }

    populatePatientSelect() {
        const select = document.getElementById('selectedPatient');
        select.innerHTML = '<option value="">Select patient...</option>' +
            this.patients.map(patient => 
                `<option value="${patient.id}">${patient.name} (${patient.gender}, Age ${patient.age})</option>`
            ).join('');
    }

    setupEventListeners() {
        // Patient selection
        document.getElementById('patientAssessmentList').addEventListener('click', (e) => {
            const patientItem = e.target.closest('.patient-item');
            if (patientItem) {
                this.selectPatient(patientItem.dataset.patientId);
            }
        });

        // Priority filter
        document.getElementById('priorityFilter').addEventListener('change', () => {
            this.renderPatientList();
        });

        // Form submission
        document.getElementById('assessmentForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.saveAssessment();
        });

        // Clear form
        document.getElementById('clearForm').addEventListener('click', () => {
            this.clearForm();
        });

        // Complete assessment
        document.getElementById('completeAssessment').addEventListener('click', () => {
            this.completeAssessment();
        });

        // Patient select change
        document.getElementById('selectedPatient').addEventListener('change', (e) => {
            if (e.target.value) {
                this.selectPatient(e.target.value);
            }
        });
    }

    selectPatient(patientId) {
        this.selectedPatientId = patientId;
        
        // Update visual selection
        document.querySelectorAll('.patient-item').forEach(item => {
            item.classList.remove('selected');
        });
        document.querySelector(`[data-patient-id="${patientId}"]`)?.classList.add('selected');
        
        // Update form
        document.getElementById('selectedPatient').value = patientId;
        
        // Pre-fill form with patient data
        const patient = this.patients.find(p => p.id === patientId);
        if (patient) {
            // Set priority based on patient condition
            document.getElementById('triagePriority').value = patient.priority;
            
            // Pre-fill chief complaint if conditions exist
            if (patient.conditions.length > 0) {
                document.getElementById('chiefComplaint').value = 
                    patient.conditions.map(c => c.name).join(', ');
            }
            
            // Pre-fill vital signs if available
            if (patient.vitalSigns.length > 0) {
                const vitals = patient.vitalSigns[0];
                if (vitals.name?.includes('BP') || vitals.value?.includes('/')) {
                    document.getElementById('bloodPressure').value = vitals.value || vitals.name;
                }
            }
        }
    }

    saveAssessment() {
        const formData = this.getFormData();
        if (!formData.patientId) {
            alert('Please select a patient');
            return;
        }

        const assessment = {
            id: Date.now().toString(),
            patientId: formData.patientId,
            timestamp: new Date().toISOString(),
            ...formData,
            status: 'in-progress'
        };

        this.assessments.push(assessment);
        this.saveAssessmentsToStorage();
        this.updatePatientLastAssessment(formData.patientId, assessment);
        this.renderRecentAssessments();
        this.updateStats();
        
        alert('Assessment saved successfully!');
    }

    completeAssessment() {
        const formData = this.getFormData();
        if (!formData.patientId) {
            alert('Please select a patient');
            return;
        }

        const assessment = {
            id: Date.now().toString(),
            patientId: formData.patientId,
            timestamp: new Date().toISOString(),
            ...formData,
            status: 'completed'
        };

        this.assessments.push(assessment);
        this.saveAssessmentsToStorage();
        this.updatePatientLastAssessment(formData.patientId, assessment);
        this.renderRecentAssessments();
        this.updateStats();
        this.renderPatientList();
        this.clearForm();
        
        alert('Assessment completed and patient discharged!');
    }

    getFormData() {
        return {
            patientId: document.getElementById('selectedPatient').value,
            priority: document.getElementById('triagePriority').value,
            chiefComplaint: document.getElementById('chiefComplaint').value,
            bloodPressure: document.getElementById('bloodPressure').value,
            heartRate: document.getElementById('heartRate').value,
            temperature: document.getElementById('temperature').value,
            oxygenSat: document.getElementById('oxygenSat').value,
            clinicalAssessment: document.getElementById('clinicalAssessment').value,
            treatmentPlan: document.getElementById('treatmentPlan').value,
            followupRequired: document.getElementById('followupRequired').value
        };
    }

    clearForm() {
        document.getElementById('assessmentForm').reset();
        this.selectedPatientId = null;
        document.querySelectorAll('.patient-item').forEach(item => {
            item.classList.remove('selected');
        });
    }

    updatePatientLastAssessment(patientId, assessment) {
        const patient = this.patients.find(p => p.id === patientId);
        if (patient) {
            patient.lastAssessment = assessment;
        }
    }

    renderRecentAssessments() {
        const container = document.getElementById('recentAssessments');
        const recent = this.assessments.slice(-5).reverse();
        
        if (recent.length === 0) {
            container.innerHTML = '<p class="text-muted text-center">No recent assessments</p>';
            return;
        }

        container.innerHTML = recent.map(assessment => {
            const patient = this.patients.find(p => p.id === assessment.patientId);
            const patientName = patient ? patient.name : 'Unknown Patient';
            
            return `
                <div class="recent-assessment-item">
                    <div class="assessment-patient">${patientName}</div>
                    <div class="assessment-time">${new Date(assessment.timestamp).toLocaleString()}</div>
                    <div class="assessment-summary">
                        ${assessment.chiefComplaint || 'No chief complaint recorded'}
                    </div>
                </div>
            `;
        }).join('');
    }

    saveAssessmentsToStorage() {
        try {
            localStorage.setItem('assessments', JSON.stringify(this.assessments));
        } catch (e) {
            console.error('Failed to save assessments to storage:', e);
        }
    }

    loadSavedAssessments() {
        try {
            const saved = localStorage.getItem('assessments');
            if (saved) {
                this.assessments = JSON.parse(saved);
                this.renderRecentAssessments();
            }
        } catch (e) {
            console.error('Failed to load saved assessments:', e);
        }
    }
}

// Initialize the app when the page loads
document.addEventListener('DOMContentLoaded', () => {
    new AssessmentTriageApp();
});