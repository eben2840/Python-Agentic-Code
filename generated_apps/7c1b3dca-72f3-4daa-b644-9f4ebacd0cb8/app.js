// Initialize the app when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    initializeMedicationChecklist();
});

// Global variable to store current patient data
let currentPatientData = null;

function initializeMedicationChecklist() {
    // Set current date
    const today = new Date();
    document.getElementById('currentDate').textContent = today.toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });

    // Check if patient data exists
    if (!window.PATIENT_DATA) {
        showNoDataMessage();
        return;
    }

    const data = window.PATIENT_DATA;
    
    // Find Grace Lee specifically
    let graceData = null;
    
    if (data.patient && data.patient.id === 'all' && data.patients) {
        // All patients mode - find Grace Lee
        const gracePatient = data.patients.find(p => 
            p.name && p.name.toLowerCase().includes('grace lee')
        );
        if (gracePatient) {
            graceData = {
                patient: gracePatient,
                medicationrequest: gracePatient.data?.medicationrequest || []
            };
        }
    } else if (data.patient && data.patient.name && data.patient.name.toLowerCase().includes('grace lee')) {
        // Single patient mode - check if it's Grace Lee
        graceData = {
            patient: data.patient,
            medicationrequest: data.medicationrequest?.summary || []
        };
    }

    if (!graceData) {
        showNoDataMessage('Grace Lee not found in patient data');
        return;
    }

    // Store patient data globally
    currentPatientData = graceData;

    // Display patient information
    displayPatientInfo(graceData.patient);
    
    // Display medication checklist
    displayMedicationChecklist(graceData.medicationrequest);
}

function displayPatientInfo(patient) {
    document.getElementById('patientName').textContent = patient.name || 'Grace Lee';
    document.getElementById('patientGender').textContent = patient.gender || 'No data available';
    
    if (patient.birthDate) {
        const birthDate = new Date(patient.birthDate);
        document.getElementById('patientDob').textContent = birthDate.toLocaleDateString();
    } else {
        document.getElementById('patientDob').textContent = 'No data available';
    }
}

function displayMedicationChecklist(medications) {
    const medicationList = document.getElementById('medicationList');
    
    if (!medications || medications.length === 0) {
        showNoDataMessage('No medications found for Grace Lee');
        return;
    }

    // Create medication schedule based on available data
    const medicationSchedule = createMedicationSchedule(medications);
    
    if (medicationSchedule.length === 0) {
        showNoDataMessage('No medications found for Grace Lee');
        return;
    }

    // Clear loading spinner
    medicationList.innerHTML = '';
    
    // Generate checklist items
    medicationSchedule.forEach((med, index) => {
        const medicationItem = createMedicationItem(med, index);
        medicationList.appendChild(medicationItem);
    });

    // Show summary card and update progress
    document.getElementById('summaryCard').style.display = 'block';
    updateProgress();
}

function createMedicationSchedule(medications) {
    const schedule = [];
    
    medications.forEach(med => {
        if (!med.name) return;
        
        // Parse dosage information
        const dosage = med.status || med.value || '1 tablet daily';
        const times = extractMedicationTimes(dosage);
        
        times.forEach(time => {
            schedule.push({
                id: `med-${schedule.length}`,
                name: med.name,
                dosage: dosage,
                time: time.time,
                period: time.period,
                instructions: getInstructions(med.name),
                completed: false
            });
        });
    });
    
    return schedule;
}

function extractMedicationTimes(dosage) {
    // Default to once daily if no specific timing
    const defaultTimes = [{ time: '09:00', period: 'morning' }];
    
    if (!dosage) return defaultTimes;
    
    const dosageLower = dosage.toLowerCase();
    
    if (dosageLower.includes('twice') || dosageLower.includes('2 times') || dosageLower.includes('bid')) {
        return [
            { time: '09:00', period: 'morning' },
            { time: '21:00', period: 'evening' }
        ];
    } else if (dosageLower.includes('three times') || dosageLower.includes('3 times') || dosageLower.includes('tid')) {
        return [
            { time: '09:00', period: 'morning' },
            { time: '14:00', period: 'afternoon' },
            { time: '21:00', period: 'evening' }
        ];
    } else if (dosageLower.includes('four times') || dosageLower.includes('4 times') || dosageLower.includes('qid')) {
        return [
            { time: '09:00', period: 'morning' },
            { time: '14:00', period: 'afternoon' },
            { time: '19:00', period: 'evening' },
            { time: '23:00', period: 'night' }
        ];
    }
    
    return defaultTimes;
}

function getInstructions(medicationName) {
    const instructions = {
        'chest pain': 'Take with water. Contact doctor if chest pain persists.',
        'treatment for chest pain': 'Take with water. Contact doctor if chest pain persists.'
    };
    
    const medLower = medicationName.toLowerCase();
    for (const [key, instruction] of Object.entries(instructions)) {
        if (medLower.includes(key)) {
            return instruction;
        }
    }
    
    return 'Take as prescribed by your healthcare provider.';
}

function createMedicationItem(medication, index) {
    const item = document.createElement('div');
    item.className = 'medication-item';
    item.id = medication.id;
    
    item.innerHTML = `
        <div class="d-flex align-items-start">
            <div class="form-check me-3">
                <input class="form-check-input medication-checkbox" type="checkbox" 
                       id="check-${index}" onchange="toggleMedication('${medication.id}')">
            </div>
            <div class="flex-grow-1">
                <div class="d-flex justify-content-between align-items-start mb-2">
                    <div>
                        <div class="medication-name">${medication.name}</div>
                        <div class="medication-dosage">${medication.dosage}</div>
                    </div>
                    <div class="d-flex align-items-center">
                        <span class="time-badge ${medication.period} me-2">${medication.time}</span>
                        <span class="badge bg-light text-dark">${medication.period}</span>
                    </div>
                </div>
                <div class="medication-notes">
                    <i class="fas fa-info-circle me-1"></i>
                    ${medication.instructions}
                </div>
            </div>
        </div>
    `;
    
    return item;
}

function toggleMedication(medicationId) {
    const item = document.getElementById(medicationId);
    const checkbox = item.querySelector('.medication-checkbox');
    
    if (checkbox.checked) {
        item.classList.add('completed');
    } else {
        item.classList.remove('completed');
    }
    
    updateProgress();
}

function updateProgress() {
    const checkboxes = document.querySelectorAll('.medication-checkbox');
    const completed = document.querySelectorAll('.medication-checkbox:checked').length;
    const total = checkboxes.length;
    
    if (total === 0) return;
    
    const percentage = (completed / total) * 100;
    
    // Update progress bar
    document.getElementById('progressBar').style.width = `${percentage}%`;
    document.getElementById('progressText').textContent = `${completed}/${total}`;
    
    // Update summary stats
    document.getElementById('completedCount').textContent = completed;
    document.getElementById('pendingCount').textContent = total - completed;
    document.getElementById('totalCount').textContent = total;
}

function showNoDataMessage(message = 'No medication data available for Grace Lee') {
    document.getElementById('medicationList').innerHTML = '';
    document.getElementById('noDataMessage').classList.remove('d-none');
    document.getElementById('noDataMessage').querySelector('p').textContent = message;
    
    // Update patient info with defaults
    document.getElementById('patientName').textContent = 'Grace Lee';
    document.getElementById('patientGender').textContent = 'No data available';
    document.getElementById('patientDob').textContent = 'No data available';
}

// Care Plan Functions
function toggleCarePlan() {
    const modal = new bootstrap.Modal(document.getElementById('carePlanModal'));
    generateCarePlan();
    modal.show();
}

function generateCarePlan() {
    const patient = currentPatientData ? currentPatientData.patient : { name: 'Grace Lee' };
    const medications = currentPatientData ? currentPatientData.medicationrequest : [];
    
    const carePlanContent = document.getElementById('carePlanContent');
    const patientName = patient.name || 'Grace Lee';
    
    // Update modal title
    document.getElementById('carePlanPatientName').textContent = patientName;
    
    const today = new Date();
    const carePlan = generateCarePlanTemplate(patient, medications, today);
    
    carePlanContent.innerHTML = carePlan;
}

function generateCarePlanTemplate(patient, medications, currentDate) {
    const patientName = patient.name || 'Grace Lee';
    const patientGender = patient.gender || 'Not specified';
    const patientAge = calculateAge(patient.birthDate) || 'Not specified';
    
    return `
        <div class="care-plan-header">
            <h4><i class="fas fa-heartbeat me-2"></i>Comprehensive Care Plan</h4>
            <p class="mb-1">${patientName}</p>
            <div class="care-plan-date">Generated on ${currentDate.toLocaleDateString('en-US', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            })}</div>
        </div>

        <div class="care-plan-section">
            <h6><i class="fas fa-user"></i>Patient Demographics</h6>
            <div class="row">
                <div class="col-md-4">
                    <strong>Name:</strong> ${patientName}
                </div>
                <div class="col-md-4">
                    <strong>Age:</strong> ${patientAge}
                </div>
                <div class="col-md-4">
                    <strong>Gender:</strong> ${patientGender}
                </div>
            </div>
        </div>

        <div class="care-plan-section">
            <h6><i class="fas fa-stethoscope"></i>Primary Health Concerns</h6>
            <div class="care-goal">
                <div class="d-flex justify-content-between align-items-start mb-2">
                    <strong>Cardiovascular Health Management</strong>
                    <span class="goal-priority high">High Priority</span>
                </div>
                <p class="mb-2 text-muted">Based on chest pain medication regimen, focus on cardiac health monitoring and symptom management.</p>
                <div class="intervention-item">
                    <i class="fas fa-check-circle me-2"></i>
                    Monitor chest pain episodes and triggers
                </div>
                <div class="intervention-item">
                    <i class="fas fa-check-circle me-2"></i>
                    Ensure medication compliance for cardiac medications
                </div>
                <div class="intervention-item">
                    <i class="fas fa-check-circle me-2"></i>
                    Regular vital signs monitoring (blood pressure, heart rate)
                </div>
            </div>
        </div>

        <div class="care-plan-section">
            <h6><i class="fas fa-pills"></i>Medication Management Plan</h6>
            ${generateMedicationPlan(medications)}
        </div>

        <div class="care-plan-section">
            <h6><i class="fas fa-bullseye"></i>Care Goals & Objectives</h6>
            <div class="care-goal">
                <div class="d-flex justify-content-between align-items-start mb-2">
                    <strong>Short-term Goals (1-3 months)</strong>
                    <span class="goal-priority high">High Priority</span>
                </div>
                <div class="intervention-item">Achieve 100% medication adherence</div>
                <div class="intervention-item">Establish routine for daily medication tracking</div>
                <div class="intervention-item">Identify and document chest pain triggers</div>
            </div>
            <div class="care-goal">
                <div class="d-flex justify-content-between align-items-start mb-2">
                    <strong>Long-term Goals (3-12 months)</strong>
                    <span class="goal-priority medium">Medium Priority</span>
                </div>
                <div class="intervention-item">Reduce frequency of chest pain episodes</div>
                <div class="intervention-item">Develop comprehensive self-management skills</div>
                <div class="intervention-item">Establish regular cardiology follow-up schedule</div>
            </div>
        </div>

        <div class="care-plan-section">
            <h6><i class="fas fa-calendar-check"></i>Monitoring & Follow-up Schedule</h6>
            <div class="care-goal">
                <strong>Daily:</strong>
                <div class="intervention-item">Complete medication checklist</div>
                <div class="intervention-item">Monitor and record symptoms</div>
            </div>
            <div class="care-goal">
                <strong>Weekly:</strong>
                <div class="intervention-item">Review medication adherence progress</div>
                <div class="intervention-item">Assess symptom patterns</div>
            </div>
            <div class="care-goal">
                <strong>Monthly:</strong>
                <div class="intervention-item">Healthcare provider consultation</div>
                <div class="intervention-item">Medication effectiveness review</div>
            </div>
        </div>

        <div class="care-plan-section">
            <h6><i class="fas fa-exclamation-triangle"></i>Emergency Action Plan</h6>
            <div class="care-goal">
                <div class="intervention-item"><strong>Severe Chest Pain:</strong> Call 911 immediately</div>
                <div class="intervention-item"><strong>Medication Side Effects:</strong> Contact healthcare provider</div>
                <div class="intervention-item"><strong>Missed Medications:</strong> Follow provider instructions for missed doses</div>
                <div class="intervention-item"><strong>Emergency Contacts:</strong> Keep current list accessible</div>
            </div>
        </div>

        <div class="care-plan-section">
            <h6><i class="fas fa-clipboard-list"></i>Care Team & Resources</h6>
            <div class="row">
                <div class="col-md-6">
                    <div class="care-goal">
                        <strong>Primary Care Team:</strong>
                        <div class="intervention-item">Primary Care Physician</div>
                        <div class="intervention-item">Cardiologist (as needed)</div>
                        <div class="intervention-item">Pharmacist</div>
                    </div>
                </div>
                <div class="col-md-6">
                    <div class="care-goal">
                        <strong>Support Resources:</strong>
                        <div class="intervention-item">Medication reminder apps</div>
                        <div class="intervention-item">Patient education materials</div>
                        <div class="intervention-item">Emergency contact list</div>
                    </div>
                </div>
            </div>
        </div>
    `;
}

function generateMedicationPlan(medications) {
    if (!medications || medications.length === 0) {
        return `
            <div class="care-goal">
                <strong>No specific medications on file</strong>
                <div class="intervention-item">Establish comprehensive medication review with healthcare provider</div>
                <div class="intervention-item">Implement medication tracking system</div>
            </div>
        `;
    }

    let medicationPlan = '';
    
    medications.forEach((med, index) => {
        const medName = med.name || `Medication ${index + 1}`;
        const medStatus = med.status || med.value || 'As prescribed';
        
        medicationPlan += `
            <div class="care-goal">
                <div class="d-flex justify-content-between align-items-start mb-2">
                    <strong>${medName}</strong>
                    <span class="goal-priority ${getMedicationPriority(medName)}">
                        ${getMedicationPriorityText(medName)}
                    </span>
                </div>
                <p class="text-muted mb-2">Dosage: ${medStatus}</p>
                <div class="intervention-item">Monitor for effectiveness and side effects</div>
                <div class="intervention-item">Ensure proper timing and administration</div>
                <div class="intervention-item">Track adherence daily</div>
            </div>
        `;
    });
    
    return medicationPlan;
}

function getMedicationPriority(medicationName) {
    const medLower = medicationName.toLowerCase();
    if (medLower.includes('chest pain') || medLower.includes('cardiac') || medLower.includes('heart')) {
        return 'high';
    }
    return 'medium';
}

function getMedicationPriorityText(medicationName) {
    const medLower = medicationName.toLowerCase();
    if (medLower.includes('chest pain') || medLower.includes('cardiac') || medLower.includes('heart')) {
        return 'Critical';
    }
    return 'Important';
}

function calculateAge(birthDate) {
    if (!birthDate) return null;
    
    const today = new Date();
    const birth = new Date(birthDate);
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
        age--;
    }
    
    return age;
}

function printCarePlan() {
    window.print();
}