document.addEventListener('DOMContentLoaded', function() {
    const form = document.getElementById('assessmentForm');
    const painLevel = document.getElementById('painLevel');
    const painValue = document.getElementById('painValue');
    const clearButton = document.getElementById('clearForm');

    // Update pain level display
    painLevel.addEventListener('input', function() {
        painValue.textContent = this.value;
        painValue.className = 'badge ' + getPainBadgeClass(this.value);
    });

    function getPainBadgeClass(value) {
        if (value <= 2) return 'bg-success text-white';
        if (value <= 4) return 'bg-warning text-dark';
        if (value <= 6) return 'bg-orange text-white';
        return 'bg-danger text-white';
    }

    // Form submission
    form.addEventListener('submit', function(e) {
        e.preventDefault();
        
        const formData = {
            patientInfo: {
                name: document.getElementById('patientName').value,
                age: document.getElementById('patientAge').value,
                gender: document.getElementById('patientGender').value
            },
            vitalSigns: {
                bloodPressure: document.getElementById('bloodPressure').value,
                heartRate: document.getElementById('heartRate').value,
                temperature: document.getElementById('temperature').value,
                oxygenSat: document.getElementById('oxygenSat').value
            },
            clinical: {
                chiefComplaint: document.getElementById('chiefComplaint').value,
                presentIllness: document.getElementById('presentIllness').value,
                painLevel: document.getElementById('painLevel').value,
                urgencyLevel: document.getElementById('urgencyLevel').value
            },
            examination: {
                generalAppearance: document.getElementById('generalAppearance').value,
                mentalStatus: document.getElementById('mentalStatus').value,
                physicalFindings: document.getElementById('physicalFindings').value
            },
            assessmentPlan: {
                clinicalAssessment: document.getElementById('clinicalAssessment').value,
                treatmentPlan: document.getElementById('treatmentPlan').value
            },
            timestamp: new Date().toISOString()
        };

        // Save to localStorage
        const assessments = JSON.parse(localStorage.getItem('patientAssessments') || '[]');
        assessments.push(formData);
        localStorage.setItem('patientAssessments', JSON.stringify(assessments));

        // Show success message
        showSuccessMessage();
        
        // Clear form after successful submission
        setTimeout(() => {
            form.reset();
            painValue.textContent = '0';
            painValue.className = 'badge bg-success text-white';
        }, 1500);
    });

    // Clear form
    clearButton.addEventListener('click', function() {
        if (confirm('Are you sure you want to clear all form data?')) {
            form.reset();
            painValue.textContent = '0';
            painValue.className = 'badge bg-success text-white';
        }
    });

    function showSuccessMessage() {
        const alert = document.createElement('div');
        alert.className = 'alert alert-success alert-dismissible fade show position-fixed';
        alert.style.cssText = 'top: 20px; right: 20px; z-index: 9999; min-width: 300px;';
        alert.innerHTML = `
            <i class="fas fa-check-circle me-2"></i>
            Assessment saved successfully!
            <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
        `;
        document.body.appendChild(alert);

        setTimeout(() => {
            if (alert.parentNode) {
                alert.remove();
            }
        }, 3000);
    }

    // Auto-save draft functionality
    const inputs = form.querySelectorAll('input, select, textarea');
    inputs.forEach(input => {
        input.addEventListener('input', function() {
            const draftData = {};
            inputs.forEach(inp => {
                if (inp.value) draftData[inp.id] = inp.value;
            });
            localStorage.setItem('assessmentDraft', JSON.stringify(draftData));
        });
    });

    // Load draft on page load
    const draft = JSON.parse(localStorage.getItem('assessmentDraft') || '{}');
    Object.keys(draft).forEach(id => {
        const element = document.getElementById(id);
        if (element) {
            element.value = draft[id];
            if (id === 'painLevel') {
                painValue.textContent = draft[id];
                painValue.className = 'badge ' + getPainBadgeClass(draft[id]);
            }
        }
    });
});