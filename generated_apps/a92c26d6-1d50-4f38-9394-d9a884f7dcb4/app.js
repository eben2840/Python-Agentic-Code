document.addEventListener('DOMContentLoaded', function() {
    // Initialize data storage
    let emergencies = JSON.parse(localStorage.getItem('emergencies') || '[]');
    let vitals = JSON.parse(localStorage.getItem('vitals') || '[]');
    
    // Update dashboard stats
    function updateStats() {
        const data = window.PATIENT_DATA;
        const totalPatients = data ? (data.observations?.summary?.length || 0) : emergencies.length + vitals.length;
        
        document.getElementById('totalPatients').textContent = totalPatients;
        document.getElementById('emergencyCount').textContent = emergencies.length;
        document.getElementById('vitalsCount').textContent = vitals.length;
        document.getElementById('avgWaitTime').textContent = Math.floor(Math.random() * 30) + 15; // Mock wait time
        
        document.getElementById('emergencyBadge').textContent = `${emergencies.length} entries`;
        document.getElementById('vitalsBadge').textContent = `${vitals.length} readings`;
    }
    
    // Display emergency entries
    function displayEmergencies() {
        const container = document.getElementById('emergencyList');
        
        if (emergencies.length === 0) {
            container.innerHTML = `
                <div class="text-center text-muted py-4">
                    <i class="fas fa-clipboard-list fa-2x mb-3 opacity-50"></i>
                    <p>No emergency entries yet</p>
                </div>
            `;
            return;
        }
        
        container.innerHTML = emergencies.map(emergency => `
            <div class="emergency-item ${emergency.priority}">
                <div class="d-flex justify-content-between align-items-start mb-2">
                    <div>
                        <h6 class="mb-1">${emergency.patient}</h6>
                        <span class="priority-badge priority-${emergency.priority}">${emergency.priority.toUpperCase()}</span>
                    </div>
                    <span class="timestamp">${new Date(emergency.timestamp).toLocaleString()}</span>
                </div>
                <div class="mb-2">
                    <strong>${emergency.type.charAt(0).toUpperCase() + emergency.type.slice(1)}</strong>
                </div>
                <p class="mb-0 text-muted">${emergency.description}</p>
            </div>
        `).join('');
    }
    
    // Display vital signs
    function displayVitals() {
        const container = document.getElementById('vitalsList');
        
        if (vitals.length === 0) {
            container.innerHTML = `
                <div class="text-center text-muted py-4">
                    <i class="fas fa-heartbeat fa-2x mb-3 opacity-50"></i>
                    <p>No vital signs recorded yet</p>
                </div>
            `;
            return;
        }
        
        container.innerHTML = vitals.map(vital => `
            <div class="vitals-item">
                <div class="d-flex justify-content-between align-items-start mb-2">
                    <h6 class="mb-0">${vital.patient}</h6>
                    <span class="timestamp">${new Date(vital.timestamp).toLocaleString()}</span>
                </div>
                <div class="row g-2 mb-2">
                    ${vital.bloodPressure ? `<div class="col-6"><small class="text-muted">BP:</small> <span class="vital-value">${vital.bloodPressure}</span></div>` : ''}
                    ${vital.heartRate ? `<div class="col-6"><small class="text-muted">HR:</small> <span class="vital-value">${vital.heartRate} bpm</span></div>` : ''}
                    ${vital.temperature ? `<div class="col-6"><small class="text-muted">Temp:</small> <span class="vital-value">${vital.temperature}°F</span></div>` : ''}
                    ${vital.oxygenSat ? `<div class="col-6"><small class="text-muted">O2:</small> <span class="vital-value">${vital.oxygenSat}%</span></div>` : ''}
                </div>
                ${vital.notes ? `<p class="mb-0 text-muted"><small>${vital.notes}</small></p>` : ''}
            </div>
        `).join('');
    }
    
    // Save emergency
    window.saveEmergency = function() {
        const form = document.getElementById('emergencyForm');
        const formData = new FormData(form);
        
        const emergency = {
            id: Date.now(),
            patient: document.getElementById('emergencyPatient').value,
            type: document.getElementById('emergencyType').value,
            priority: document.getElementById('emergencyPriority').value,
            description: document.getElementById('emergencyDescription').value,
            timestamp: new Date().toISOString()
        };
        
        emergencies.unshift(emergency);
        localStorage.setItem('emergencies', JSON.stringify(emergencies));
        
        form.reset();
        bootstrap.Modal.getInstance(document.getElementById('emergencyModal')).hide();
        
        updateStats();
        displayEmergencies();
    };
    
    // Save vitals
    window.saveVitals = function() {
        const form = document.getElementById('vitalsForm');
        
        const vital = {
            id: Date.now(),
            patient: document.getElementById('vitalsPatient').value,
            bloodPressure: document.getElementById('bloodPressure').value,
            heartRate: document.getElementById('heartRate').value,
            temperature: document.getElementById('temperature').value,
            respiratoryRate: document.getElementById('respiratoryRate').value,
            oxygenSat: document.getElementById('oxygenSat').value,
            painLevel: document.getElementById('painLevel').value,
            notes: document.getElementById('vitalsNotes').value,
            timestamp: new Date().toISOString()
        };
        
        vitals.unshift(vital);
        localStorage.setItem('vitals', JSON.stringify(vitals));
        
        form.reset();
        bootstrap.Modal.getInstance(document.getElementById('vitalsModal')).hide();
        
        updateStats();
        displayVitals();
    };
    
    // Initialize display
    updateStats();
    displayEmergencies();
    displayVitals();
    
    // Auto-refresh stats every 30 seconds
    setInterval(updateStats, 30000);
});