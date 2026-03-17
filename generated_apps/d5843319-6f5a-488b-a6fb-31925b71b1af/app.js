document.addEventListener('DOMContentLoaded', function() {
    const data = window.PATIENT_DATA;
    if (!data) { 
        document.body.innerHTML = '<div class="container mt-5"><div class="alert alert-warning text-center"><i class="fas fa-exclamation-triangle me-2"></i>No patient data available</div></div>'; 
        return; 
    }

    // Display patient info
    const patientInfo = document.getElementById('patientInfo');
    if (data.patient) {
        const age = data.patient.birthDate ? new Date().getFullYear() - new Date(data.patient.birthDate).getFullYear() : 'Unknown';
        patientInfo.textContent = `${data.patient.name || 'Unknown Patient'} • ${data.patient.gender || 'Unknown'} • Age ${age}`;
    }

    // Display vital signs
    const vitalsGrid = document.getElementById('vitalsGrid');
    if (data.vital_signs && data.vital_signs.summary && data.vital_signs.summary.length > 0) {
        vitalsGrid.innerHTML = '';
        data.vital_signs.summary.forEach(vital => {
            const vitalClass = getVitalStatus(vital.code, vital.value);
            const col = document.createElement('div');
            col.className = 'col-md-3 col-sm-6 mb-3';
            col.innerHTML = `
                <div class="vital-card">
                    <i class="fas ${getVitalIcon(vital.code)} ${vitalClass} mb-2"></i>
                    <div class="vital-value ${vitalClass}">${vital.value} ${vital.unit || ''}</div>
                    <div class="text-muted small">${vital.display}</div>
                    <div class="text-muted small">${formatDate(vital.date)}</div>
                </div>
            `;
            vitalsGrid.appendChild(col);
        });
    } else {
        vitalsGrid.innerHTML = '<div class="col-12 text-center text-muted">No vital signs available</div>';
    }

    // Display conditions
    const conditionsList = document.getElementById('conditionsList');
    if (data.conditions && data.conditions.summary && data.conditions.summary.length > 0) {
        conditionsList.innerHTML = '';
        data.conditions.summary.forEach(condition => {
            const conditionDiv = document.createElement('div');
            conditionDiv.className = 'condition-item';
            conditionDiv.innerHTML = `
                <div class="fw-semibold">${condition.condition}</div>
                <div class="text-muted small">Status: ${condition.status || 'Active'}</div>
                ${condition.onset ? `<div class="text-muted small">Since: ${formatDate(condition.onset)}</div>` : ''}
            `;
            conditionsList.appendChild(conditionDiv);
        });
    } else {
        conditionsList.innerHTML = '<div class="text-muted text-center">No active conditions</div>';
    }

    // Pain scale slider
    const painScale = document.getElementById('painScale');
    const painValue = document.getElementById('painValue');
    painScale.addEventListener('input', function() {
        painValue.textContent = this.value;
    });

    // Form submission
    document.getElementById('emergencyForm').addEventListener('submit', function(e) {
        e.preventDefault();
        alert('Emergency assessment saved successfully!');
    });

    function getVitalStatus(code, value) {
        const numValue = parseFloat(value);
        if (code.includes('blood-pressure')) {
            const systolic = parseInt(value.split('/')[0]);
            if (systolic > 140 || systolic < 90) return 'vital-critical';
            if (systolic > 130 || systolic < 100) return 'vital-warning';
            return 'vital-normal';
        }
        if (code.includes('heart-rate')) {
            if (numValue > 100 || numValue < 60) return 'vital-critical';
            if (numValue > 90 || numValue < 70) return 'vital-warning';
            return 'vital-normal';
        }
        if (code.includes('body-temperature')) {
            if (numValue > 38 || numValue < 36) return 'vital-critical';
            if (numValue > 37.5 || numValue < 36.5) return 'vital-warning';
            return 'vital-normal';
        }
        return 'vital-normal';
    }

    function getVitalIcon(code) {
        if (code.includes('blood-pressure')) return 'fa-tachometer-alt';
        if (code.includes('heart-rate')) return 'fa-heartbeat';
        if (code.includes('body-temperature')) return 'fa-thermometer-half';
        if (code.includes('respiratory-rate')) return 'fa-lungs';
        if (code.includes('oxygen-saturation')) return 'fa-wind';
        return 'fa-chart-line';
    }

    function formatDate(dateString) {
        if (!dateString) return 'Unknown';
        const date = new Date(dateString);
        return date.toLocaleDateString();
    }
});