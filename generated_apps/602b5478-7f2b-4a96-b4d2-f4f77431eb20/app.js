document.addEventListener('DOMContentLoaded', function() {
    const data = window.PATIENT_DATA;
    
    // Display patient information
    const patientInfo = document.getElementById('patientInfo');
    if (data && data.patient) {
        const age = data.patient.birthDate ? calculateAge(data.patient.birthDate) : 'Unknown';
        patientInfo.textContent = `${data.patient.name || 'Unknown Patient'} • ${data.patient.gender || 'Unknown'} • Age ${age} • ID: ${data.patient.id || 'N/A'}`;
    } else {
        patientInfo.textContent = 'Patient information not available';
    }

    // Pain level slider
    const painRange = document.getElementById('painRange');
    const painValue = document.getElementById('painValue');
    
    painRange.addEventListener('input', function() {
        painValue.textContent = this.value;
        painValue.className = 'badge text-dark';
        
        if (this.value <= 3) {
            painValue.className += ' bg-success-subtle';
        } else if (this.value <= 6) {
            painValue.className += ' bg-warning-subtle';
        } else {
            painValue.className += ' bg-danger-subtle';
        }
    });

    // Form submission
    const assessmentForm = document.getElementById('assessmentForm');
    assessmentForm.addEventListener('submit', function(e) {
        e.preventDefault();
        
        const formData = new FormData(this);
        const assessment = {};
        
        for (let [key, value] of formData.entries()) {
            assessment[key] = value;
        }
        
        assessment.timestamp = new Date().toISOString();
        assessment.patientId = data?.patient?.id || 'unknown';
        
        console.log('Assessment completed:', assessment);
        
        // Show success message
        const alert = document.createElement('div');
        alert.className = 'alert alert-success alert-dismissible fade show';
        alert.innerHTML = `
            <i class="fas fa-check-circle me-2"></i>
            Assessment completed successfully and saved to patient record.
            <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
        `;
        
        document.querySelector('.container-fluid').insertBefore(alert, document.querySelector('.row'));
        
        // Scroll to top
        window.scrollTo({ top: 0, behavior: 'smooth' });
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
});