document.addEventListener('DOMContentLoaded', function() {
    const data = window.PATIENT_DATA;
    
    // Load patient information
    if (data && data.patient) {
        const patientInfo = document.getElementById('patientInfo');
        const age = data.patient.birthDate ? calculateAge(data.patient.birthDate) : 'Unknown';
        patientInfo.textContent = `Patient: ${data.patient.name || 'Unknown'} | Age: ${age} | Gender: ${data.patient.gender || 'Unknown'}`;
    }

    // Load current medications
    loadCurrentMedications();
    
    // Create symptoms checklist
    createSymptomsChecklist();
    
    // Handle form submission
    document.getElementById('assessmentForm').addEventListener('submit', handleFormSubmit);
});

function calculateAge(birthDate) {
    const today = new Date();
    const birth = new Date(birthDate);
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
        age--;
    }
    return age;
}

function loadCurrentMedications() {
    const container = document.getElementById('currentMedications');
    const data = window.PATIENT_DATA;
    
    if (data && data.medications && data.medications.summary && data.medications.summary.length > 0) {
        let html = '<h6 class="mb-3">Current Medications:</h6>';
        data.medications.summary.forEach(med => {
            const statusClass = med.status === 'active' ? 'status-active' : 'status-inactive';
            html += `
                <div class="medication-item">
                    <div class="d-flex justify-content-between align-items-start">
                        <div>
                            <strong>${med.medication}</strong>
                            ${med.dosage ? `<div class="text-muted">${med.dosage}</div>` : ''}
                        </div>
                        <span class="status-badge ${statusClass}">${med.status}</span>
                    </div>
                </div>
            `;
        });
        container.innerHTML = html;
    } else {
        container.innerHTML = '<p class="text-muted">No current medications on file</p>';
    }
}

function createSymptomsChecklist() {
    const container = document.getElementById('symptomsChecklist');
    const symptoms = [
        'Fever', 'Headache', 'Nausea', 'Fatigue', 'Dizziness', 'Shortness of breath',
        'Chest pain', 'Abdominal pain', 'Joint pain', 'Muscle aches', 'Cough', 'Sore throat',
        'Difficulty sleeping', 'Loss of appetite', 'Skin rash', 'Swelling'
    ];
    
    let html = '';
    symptoms.forEach((symptom, index) => {
        html += `
            <div class="col-md-4 col-sm-6 mb-2">
                <div class="symptom-item">
                    <div class="form-check">
                        <input class="form-check-input" type="checkbox" id="symptom${index}" value="${symptom}">
                        <label class="form-check-label" for="symptom${index}">
                            ${symptom}
                        </label>
                    </div>
                </div>
            </div>
        `;
    });
    
    container.innerHTML = html;
    
    // Add click handlers for visual feedback
    document.querySelectorAll('.symptom-item input[type="checkbox"]').forEach(checkbox => {
        checkbox.addEventListener('change', function() {
            const item = this.closest('.symptom-item');
            if (this.checked) {
                item.classList.add('checked');
            } else {
                item.classList.remove('checked');
            }
        });
    });
}

function handleFormSubmit(e) {
    e.preventDefault();
    
    // Collect form data
    const formData = new FormData(e.target);
    const assessmentData = {};
    
    // Get all form inputs
    const inputs = e.target.querySelectorAll('input, select, textarea');
    inputs.forEach(input => {
        if (input.type === 'checkbox') {
            if (input.checked) {
                if (!assessmentData.symptoms) assessmentData.symptoms = [];
                assessmentData.symptoms.push(input.value);
            }
        } else if (input.value.trim()) {
            assessmentData[input.name || input.id] = input.value;
        }
    });
    
    // Show success message
    showSubmissionSuccess();
}

function showSubmissionSuccess() {
    const submitButton = document.querySelector('button[type="submit"]');
    const originalText = submitButton.innerHTML;
    
    submitButton.innerHTML = '<i class="fas fa-check me-2"></i>Assessment Submitted!';
    submitButton.classList.remove('btn-primary');
    submitButton.classList.add('btn-success');
    submitButton.disabled = true;
    
    // Reset after 3 seconds
    setTimeout(() => {
        submitButton.innerHTML = originalText;
        submitButton.classList.remove('btn-success');
        submitButton.classList.add('btn-primary');
        submitButton.disabled = false;
    }, 3000);
}