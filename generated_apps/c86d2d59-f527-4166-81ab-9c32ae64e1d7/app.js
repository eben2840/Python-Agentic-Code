document.addEventListener('DOMContentLoaded', function() {
    const data = window.PATIENT_DATA;
    if (!data) { 
        document.body.innerHTML = '<div class="container mt-5"><div class="alert alert-warning text-center">No patient data available</div></div>'; 
        return; 
    }

    // Display patient info
    if (data.patient) {
        document.getElementById('patientName').textContent = data.patient.name || 'Unknown Patient';
        const age = data.patient.birthDate ? calculateAge(data.patient.birthDate) : 'Unknown';
        document.getElementById('patientInfo').textContent = `${data.patient.gender || 'Unknown'} • Age: ${age}`;
    }

    // Display wounds from conditions
    displayWounds();
    
    // Display vital signs
    displayVitalSigns();
    
    // Display all observations
    displayObservations();

    function displayWounds() {
        const container = document.getElementById('woundsContainer');
        const countBadge = document.getElementById('woundCount');
        
        if (!data.conditions || !data.conditions.summary) {
            container.innerHTML = '<div class="empty-state"><i class="fas fa-info-circle fa-2x mb-2"></i><p>No wound data available</p></div>';
            return;
        }

        // Filter for wound-related conditions
        const wounds = data.conditions.summary.filter(condition => 
            condition.condition && (
                condition.condition.toLowerCase().includes('wound') ||
                condition.condition.toLowerCase().includes('injury') ||
                condition.condition.toLowerCase().includes('laceration') ||
                condition.condition.toLowerCase().includes('burn') ||
                condition.condition.toLowerCase().includes('cut') ||
                condition.condition.toLowerCase().includes('abrasion')
            )
        );

        countBadge.textContent = wounds.length;

        if (wounds.length === 0) {
            container.innerHTML = '<div class="empty-state"><i class="fas fa-check-circle fa-2x mb-2 text-success"></i><p>No wounds found</p></div>';
            return;
        }

        let html = '';
        wounds.forEach(wound => {
            const statusClass = getStatusClass(wound.status);
            const severityClass = getSeverityClass(wound.severity);
            
            html += `
                <div class="wound-item">
                    <div class="d-flex justify-content-between align-items-start mb-2">
                        <h3 class="mb-0">${wound.condition}</h3>
                        <span class="status-badge ${statusClass}">${wound.status || 'Unknown'}</span>
                    </div>
                    <div class="row">
                        <div class="col-sm-6">
                            <small class="text-muted">Onset:</small>
                            <p class="mb-1">${formatDate(wound.onset) || 'Not specified'}</p>
                        </div>
                        <div class="col-sm-6">
                            <small class="text-muted">Severity:</small>
                            <p class="mb-0 ${severityClass}">${wound.severity || 'Not specified'}</p>
                        </div>
                    </div>
                </div>
            `;
        });

        container.innerHTML = html;
    }

    function displayVitalSigns() {
        const container = document.getElementById('vitalsContainer');
        const countBadge = document.getElementById('vitalCount');
        
        if (!data.vital_signs || !data.vital_signs.summary) {
            container.innerHTML = '<div class="empty-state"><i class="fas fa-info-circle fa-2x mb-2"></i><p>No vital signs available</p></div>';
            return;
        }

        const vitals = data.vital_signs.summary;
        countBadge.textContent = vitals.length;

        if (vitals.length === 0) {
            container.innerHTML = '<div class="empty-state"><i class="fas fa-info-circle fa-2x mb-2"></i><p>No vital signs recorded</p></div>';
            return;
        }

        let html = '';
        vitals.forEach(vital => {
            const statusClass = getVitalStatusClass(vital.display, vital.value);
            const icon = getVitalIcon(vital.display);
            
            html += `
                <div class="vital-item">
                    <div class="d-flex align-items-center mb-2">
                        <i class="${icon} me-2 text-primary"></i>
                        <h3 class="mb-0 flex-grow-1">${vital.display}</h3>
                        <span class="vital-value ${statusClass}">${vital.value} ${vital.unit || ''}</span>
                    </div>
                    <div class="d-flex justify-content-between align-items-center">
                        <small class="text-muted">${formatDate(vital.date)}</small>
                        <span class="status-badge ${getStatusClass(vital.status)}">${vital.status || 'Final'}</span>
                    </div>
                </div>
            `;
        });

        container.innerHTML = html;
    }

    function displayObservations() {
        const container = document.getElementById('observationsContainer');
        const countBadge = document.getElementById('obsCount');
        
        if (!data.observations || !data.observations.summary) {
            container.innerHTML = '<div class="empty-state"><i class="fas fa-info-circle fa-2x mb-2"></i><p>No observations available</p></div>';
            return;
        }

        const observations = data.observations.summary;
        countBadge.textContent = observations.length;

        if (observations.length === 0) {
            container.innerHTML = '<div class="empty-state"><i class="fas fa-info-circle fa-2x mb-2"></i><p>No observations recorded</p></div>';
            return;
        }

        let html = `
            <div class="table-responsive">
                <table class="table obs-table">
                    <thead>
                        <tr>
                            <th>Observation</th>
                            <th>Value</th>
                            <th>Date</th>
                            <th>Status</th>
                        </tr>
                    </thead>
                    <tbody>
        `;

        observations.forEach(obs => {
            html += `
                <tr>
                    <td>${obs.display}</td>
                    <td><strong>${obs.value} ${obs.unit || ''}</strong></td>
                    <td>${formatDate(obs.date)}</td>
                    <td><span class="status-badge ${getStatusClass(obs.status)}">${obs.status || 'Final'}</span></td>
                </tr>
            `;
        });

        html += '</tbody></table></div>';
        container.innerHTML = html;
    }

    function getStatusClass(status) {
        if (!status) return 'status-final';
        const s = status.toLowerCase();
        if (s.includes('active')) return 'status-active';
        if (s.includes('resolved') || s.includes('inactive')) return 'status-resolved';
        if (s.includes('preliminary')) return 'status-preliminary';
        return 'status-final';
    }

    function getSeverityClass(severity) {
        if (!severity) return '';
        const s = severity.toLowerCase();
        if (s.includes('high') || s.includes('severe')) return 'severity-high';
        if (s.includes('moderate')) return 'severity-moderate';
        if (s.includes('low') || s.includes('mild')) return 'severity-low';
        return '';
    }

    function getVitalStatusClass(display, value) {
        // Simple vital sign assessment
        if (!display || !value) return '';
        const d = display.toLowerCase();
        const v = parseFloat(value);
        
        if (d.includes('blood pressure')) return 'vital-normal';
        if (d.includes('heart rate') && (v < 60 || v > 100)) return 'vital-abnormal';
        if (d.includes('temperature') && (v < 36 || v > 37.5)) return 'vital-warning';
        return 'vital-normal';
    }

    function getVitalIcon(display) {
        if (!display) return 'fas fa-chart-line';
        const d = display.toLowerCase();
        if (d.includes('blood pressure')) return 'fas fa-tachometer-alt';
        if (d.includes('heart') || d.includes('pulse')) return 'fas fa-heartbeat';
        if (d.includes('temperature')) return 'fas fa-thermometer-half';
        if (d.includes('weight')) return 'fas fa-weight';
        if (d.includes('height')) return 'fas fa-ruler-vertical';
        if (d.includes('oxygen') || d.includes('spo2')) return 'fas fa-lungs';
        return 'fas fa-chart-line';
    }

    function formatDate(dateString) {
        if (!dateString) return 'Not specified';
        try {
            return new Date(dateString).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'short',
                day: 'numeric'
            });
        } catch {
            return dateString;
        }
    }

    function calculateAge(birthDate) {
        if (!birthDate) return 'Unknown';
        try {
            const today = new Date();
            const birth = new Date(birthDate);
            let age = today.getFullYear() - birth.getFullYear();
            const monthDiff = today.getMonth() - birth.getMonth();
            if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
                age--;
            }
            return age;
        } catch {
            return 'Unknown';
        }
    }
});