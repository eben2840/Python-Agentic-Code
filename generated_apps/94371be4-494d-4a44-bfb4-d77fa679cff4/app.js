document.addEventListener('DOMContentLoaded', function() {
    const data = window.PATIENT_DATA;
    
    // Initialize patient info
    if (data && data.patient) {
        document.getElementById('patientName').textContent = data.patient.name || 'Jane Doe';
        document.getElementById('patientId').textContent = data.patient.id || 'pat-0a70a8f4';
    }

    // Display patient conditions
    displayPatientConditions();
    
    // Initialize white board signs
    initializeWhiteBoardSigns();
    
    // Event listeners
    document.getElementById('emergencyForm').addEventListener('submit', handleEmergencyForm);
    document.getElementById('saveSignBtn').addEventListener('click', createWhiteBoardSign);
    document.getElementById('captureBtn').addEventListener('click', captureSign);
    document.getElementById('uploadBtn').addEventListener('click', () => document.getElementById('fileInput').click());
    document.getElementById('fileInput').addEventListener('change', handleFileUpload);
});

function displayPatientConditions() {
    const data = window.PATIENT_DATA;
    const container = document.getElementById('patientConditions');
    
    if (data && data.conditions && data.conditions.summary) {
        const conditionsHtml = data.conditions.summary.map(condition => `
            <div class="condition-badge">${condition.condition || condition}</div>
        `).join('');
        container.innerHTML = conditionsHtml;
    } else {
        container.innerHTML = '<div class="condition-badge">Breast Cancer</div>';
    }
}

function handleEmergencyForm(e) {
    e.preventDefault();
    
    const emergencyData = {
        type: document.getElementById('emergencyType').value,
        priority: document.getElementById('priorityLevel').value,
        details: document.getElementById('emergencyDetails').value,
        vitals: document.getElementById('vitalSigns').value,
        physician: document.getElementById('attendingPhysician').value,
        timestamp: new Date().toISOString()
    };
    
    // Save to localStorage
    const emergencies = JSON.parse(localStorage.getItem('emergencyRecords') || '[]');
    emergencies.push(emergencyData);
    localStorage.setItem('emergencyRecords', JSON.stringify(emergencies));
    
    // Show success message
    alert('Emergency information saved successfully!');
    
    // Reset form
    document.getElementById('emergencyForm').reset();
}

function initializeWhiteBoardSigns() {
    const signs = JSON.parse(localStorage.getItem('whiteBoardSigns') || '[]');
    displayWhiteBoardSigns(signs);
}

function displayWhiteBoardSigns(signs) {
    const container = document.getElementById('whiteBoardSigns');
    
    if (signs.length === 0) {
        container.innerHTML = '<p class="text-muted">No signs created yet. Click "Create Sign" to add one.</p>';
        return;
    }
    
    const signsHtml = signs.map((sign, index) => `
        <div class="sign-item">
            <div class="sign-header">
                <div class="sign-title">${sign.title}</div>
                <span class="sign-type-badge sign-type-${sign.type}">${sign.type}</span>
            </div>
            <div class="sign-location"><i class="fas fa-map-marker-alt me-1"></i>${sign.location}</div>
            <div class="sign-message">${sign.message}</div>
            <small class="text-muted">Created: ${new Date(sign.timestamp).toLocaleString()}</small>
        </div>
    `).join('');
    
    container.innerHTML = signsHtml;
}

function createWhiteBoardSign() {
    const title = document.getElementById('signTitle').value;
    const location = document.getElementById('signLocation').value;
    const message = document.getElementById('signMessage').value;
    const type = document.getElementById('signType').value;
    
    if (!title) {
        alert('Please enter a sign title');
        return;
    }
    
    const sign = {
        title,
        location: location || 'General',
        message: message || '',
        type,
        timestamp: new Date().toISOString()
    };
    
    // Save to localStorage
    const signs = JSON.parse(localStorage.getItem('whiteBoardSigns') || '[]');
    signs.push(sign);
    localStorage.setItem('whiteBoardSigns', JSON.stringify(signs));
    
    // Update display
    displayWhiteBoardSigns(signs);
    
    // Close modal and reset form
    const modal = bootstrap.Modal.getInstance(document.getElementById('createSignModal'));
    modal.hide();
    document.getElementById('signForm').reset();
}

function captureSign() {
    // Simulate camera capture
    alert('Camera capture functionality would be implemented here. In a real app, this would access the device camera.');
}

function handleFileUpload(e) {
    const file = e.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function(e) {
            // In a real app, you would process the image here
            alert(`Image "${file.name}" uploaded successfully! In a real app, this would be processed and stored.`);
        };
        reader.readAsDataURL(file);
    }
}