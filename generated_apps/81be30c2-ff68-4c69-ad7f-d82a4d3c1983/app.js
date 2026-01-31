document.addEventListener('DOMContentLoaded', function() {
    const data = window.PATIENT_DATA;
    if (!data) { 
        document.body.innerHTML = '<div class="container mt-5"><div class="alert alert-warning text-center">No patient data available</div></div>'; 
        return; 
    }

    // Display patient name
    const patientNameEl = document.getElementById('patientName');
    if (data.patient && data.patient.name) {
        patientNameEl.textContent = data.patient.name;
    }

    // Get conditions and sort by severity
    const conditions = data.conditions && data.conditions.summary ? data.conditions.summary : [];
    
    // Update conditions count
    document.getElementById('conditionsCount').textContent = `${conditions.length} condition${conditions.length !== 1 ? 's' : ''}`;

    // Severity ranking for sorting (high to low)
    const severityRank = {
        'high': 4,
        'severe': 4,
        'moderate': 3,
        'medium': 3,
        'mild': 2,
        'low': 1,
        'minimal': 1
    };

    // Sort conditions by severity (high to low)
    const sortedConditions = conditions.sort((a, b) => {
        const severityA = severityRank[a.severity?.toLowerCase()] || 0;
        const severityB = severityRank[b.severity?.toLowerCase()] || 0;
        return severityB - severityA;
    });

    // Display conditions
    const conditionsListEl = document.getElementById('conditionsList');
    
    if (sortedConditions.length === 0) {
        conditionsListEl.innerHTML = `
            <div class="no-conditions">
                <i class="fas fa-clipboard-check"></i>
                <h6>No Conditions Found</h6>
                <p class="mb-0">This patient has no recorded medical conditions.</p>
            </div>
        `;
        return;
    }

    const conditionsHTML = sortedConditions.map(condition => {
        const severity = condition.severity || 'unknown';
        const status = condition.status || 'unknown';
        const onset = condition.onset ? new Date(condition.onset).toLocaleDateString() : 'Unknown';
        
        // Determine severity badge class
        let severityClass = 'severity-low';
        if (severity.toLowerCase().includes('high') || severity.toLowerCase().includes('severe')) {
            severityClass = 'severity-high';
        } else if (severity.toLowerCase().includes('moderate') || severity.toLowerCase().includes('medium')) {
            severityClass = 'severity-moderate';
        } else if (severity.toLowerCase().includes('mild')) {
            severityClass = 'severity-mild';
        }

        // Determine status badge class
        let statusClass = 'status-inactive';
        if (status.toLowerCase().includes('active')) {
            statusClass = 'status-active';
        } else if (status.toLowerCase().includes('resolved')) {
            statusClass = 'status-resolved';
        }

        return `
            <div class="condition-item">
                <div class="d-flex justify-content-between align-items-start">
                    <div class="flex-grow-1">
                        <div class="condition-name">${condition.condition || 'Unknown Condition'}</div>
                        <div class="condition-meta">
                            <i class="fas fa-calendar-alt me-1"></i>
                            Onset: ${onset}
                        </div>
                    </div>
                    <div class="text-end">
                        <div class="severity-badge ${severityClass} mb-1">
                            ${severity}
                        </div>
                        <div class="status-badge ${statusClass}">
                            ${status}
                        </div>
                    </div>
                </div>
            </div>
        `;
    }).join('');

    conditionsListEl.innerHTML = conditionsHTML;
});