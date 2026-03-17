// Mock patient data structure for development
window.PATIENT_DATA = {
    patient: {
        id: 'pat-0a70a8f4',
        name: 'Jane Doe',
        gender: 'female',
        birthDate: '1980-02-15'
    },
    medicationrequest: {
        summary: [
            {
                name: 'Treatment for Breast Cancer',
                value: '1 tablet daily',
                status: 'active',
                date: null
            }
        ]
    }
};

class MedicationChecklistApp {
    constructor() {
        this.medications = [];
        this.checkedMedications = new Set();
        this.init();
    }

    init() {
        this.loadPatientData();
        this.setupCurrentDate();
        this.loadMedications();
        this.updateSummary();
    }

    loadPatientData() {
        const patientInfo = document.getElementById('patient-info');
        
        if (window.PATIENT_DATA && window.PATIENT_DATA.patient) {
            const patient = window.PATIENT_DATA.patient;
            const age = this.calculateAge(patient.birthDate);
            patientInfo.textContent = `${patient.name} • ${patient.gender} • Age ${age}`;
        } else {
            patientInfo.textContent = 'Patient information not available';
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

    setupCurrentDate() {
        const currentDateElement = document.getElementById('current-date');
        const today = new Date();
        const options = { 
            weekday: 'long', 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
        };
        currentDateElement.textContent = today.toLocaleDateString('en-US', options);
    }

    loadMedications() {
        const medicationList = document.getElementById('medication-list');
        const noMedicationsDiv = document.getElementById('no-medications');
        
        if (!window.PATIENT_DATA || !window.PATIENT_DATA.medicationrequest || 
            !window.PATIENT_DATA.medicationrequest.summary || 
            window.PATIENT_DATA.medicationrequest.summary.length === 0) {
            
            medicationList.innerHTML = '';
            noMedicationsDiv.classList.remove('d-none');
            return;
        }

        noMedicationsDiv.classList.add('d-none');
        this.medications = window.PATIENT_DATA.medicationrequest.summary;
        
        // Generate medication schedule based on dosage
        const medicationSchedule = this.generateMedicationSchedule();
        
        medicationList.innerHTML = medicationSchedule.map((med, index) => 
            this.createMedicationItem(med, index)
        ).join('');

        // Add event listeners for checkboxes
        this.setupCheckboxListeners();
    }

    generateMedicationSchedule() {
        const schedule = [];
        
        this.medications.forEach((med, medIndex) => {
            if (med.status !== 'active') return;
            
            const dosage = med.value || '1 tablet daily';
            const times = this.parseDosageToTimes(dosage);
            
            times.forEach((time, timeIndex) => {
                schedule.push({
                    id: `${medIndex}-${timeIndex}`,
                    name: med.name || 'Unnamed Medication',
                    dosage: this.extractDosageAmount(dosage),
                    time: time,
                    status: med.status || 'active',
                    originalMed: med
                });
            });
        });
        
        // Sort by time
        return schedule.sort((a, b) => {
            const timeA = this.parseTime(a.time);
            const timeB = this.parseTime(b.time);
            return timeA - timeB;
        });
    }

    parseDosageToTimes(dosage) {
        const lowerDosage = dosage.toLowerCase();
        
        if (lowerDosage.includes('daily') || lowerDosage.includes('once')) {
            return ['09:00 AM'];
        } else if (lowerDosage.includes('twice') || lowerDosage.includes('bid')) {
            return ['09:00 AM', '09:00 PM'];
        } else if (lowerDosage.includes('three times') || lowerDosage.includes('tid')) {
            return ['08:00 AM', '02:00 PM', '08:00 PM'];
        } else if (lowerDosage.includes('four times') || lowerDosage.includes('qid')) {
            return ['08:00 AM', '12:00 PM', '04:00 PM', '08:00 PM'];
        } else {
            return ['09:00 AM']; // Default
        }
    }

    extractDosageAmount(dosage) {
        const match = dosage.match(/(\d+)\s*(tablet|capsule|pill|mg|ml)/i);
        return match ? `${match[1]} ${match[2].toLowerCase()}` : dosage;
    }

    parseTime(timeStr) {
        const [time, period] = timeStr.split(' ');
        const [hours, minutes] = time.split(':').map(Number);
        let hour24 = hours;
        
        if (period === 'PM' && hours !== 12) {
            hour24 += 12;
        } else if (period === 'AM' && hours === 12) {
            hour24 = 0;
        }
        
        return hour24 * 60 + minutes;
    }

    createMedicationItem(med, index) {
        const isCompleted = this.checkedMedications.has(med.id);
        const completedClass = isCompleted ? 'completed' : '';
        const checkedClass = isCompleted ? 'checked' : '';
        
        return `
            <div class="medication-item ${completedClass}" data-med-id="${med.id}">
                <div class="d-flex align-items-center">
                    <div class="medication-checkbox ${checkedClass}" data-med-id="${med.id}"></div>
                    <div class="flex-grow-1 ms-3">
                        <div class="medication-name">${med.name}</div>
                        <div class="medication-dosage">${med.dosage}</div>
                        <div class="medication-time">
                            <i class="fas fa-clock me-1"></i>
                            ${med.time}
                        </div>
                    </div>
                    <div class="ms-3">
                        <span class="status-badge status-${med.status}">${med.status}</span>
                    </div>
                </div>
            </div>
        `;
    }

    setupCheckboxListeners() {
        const checkboxes = document.querySelectorAll('.medication-checkbox');
        
        checkboxes.forEach(checkbox => {
            checkbox.addEventListener('click', (e) => {
                const medId = e.target.dataset.medId;
                this.toggleMedication(medId);
            });
        });
    }

    toggleMedication(medId) {
        const checkbox = document.querySelector(`.medication-checkbox[data-med-id="${medId}"]`);
        const medicationItem = document.querySelector(`.medication-item[data-med-id="${medId}"]`);
        
        if (this.checkedMedications.has(medId)) {
            this.checkedMedications.delete(medId);
            checkbox.classList.remove('checked');
            medicationItem.classList.remove('completed');
        } else {
            this.checkedMedications.add(medId);
            checkbox.classList.add('checked');
            medicationItem.classList.add('completed');
        }
        
        this.updateSummary();
    }

    updateSummary() {
        const totalMedications = this.generateMedicationSchedule().length;
        const completedMedications = this.checkedMedications.size;
        const pendingMedications = totalMedications - completedMedications;
        const completionPercentage = totalMedications > 0 ? 
            Math.round((completedMedications / totalMedications) * 100) : 0;
        
        document.getElementById('total-count').textContent = totalMedications;
        document.getElementById('completed-count').textContent = completedMedications;
        document.getElementById('pending-count').textContent = pendingMedications;
        document.getElementById('completion-percentage').textContent = `${completionPercentage}%`;
        
        // Update progress circle color
        const progressCircle = document.querySelector('.progress-circle');
        if (completionPercentage === 100) {
            progressCircle.style.background = 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)';
        } else if (completionPercentage >= 50) {
            progressCircle.style.background = 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)';
        } else {
            progressCircle.style.background = 'linear-gradient(135deg, #6b7280 0%, #4b5563 100%)';
        }
    }
}

// Initialize the app when the DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new MedicationChecklistApp();
});