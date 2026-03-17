document.addEventListener('DOMContentLoaded', function() {
    const data = window.PATIENT_DATA;
    if (!data) { 
        document.body.innerHTML = '<div class="container"><p class="text-center mt-5 text-muted">No patient data available</p></div>'; 
        return; 
    }

    // Display patient information
    displayPatientInfo(data.patient);
    
    // Analyze blood pressure readings
    analyzeBPReadings(data.observations.summary, data.vital_signs.summary);
    
    // Show high risk observations
    displayHighRiskObservations(data.observations.summary, data.vital_signs.summary);
    
    // Show related conditions
    displayRelatedConditions(data.conditions.summary);

    function displayPatientInfo(patient) {
        const patientInfo = document.getElementById('patientInfo');
        const age = calculateAge(patient.birthDate);
        
        patientInfo.innerHTML = `
            <div class="mb-2">
                <strong class="text-dark">${patient.name || 'Unknown Patient'}</strong>
            </div>
            <div class="mb-1">
                <i class="fas fa-venus-mars text-muted me-2"></i>
                <span>${patient.gender || 'Unknown'}</span>
            </div>
            <div class="mb-1">
                <i class="fas fa-birthday-cake text-muted me-2"></i>
                <span>${age} years old</span>
            </div>
            <div>
                <i class="fas fa-calendar text-muted me-2"></i>
                <span>${formatDate(patient.birthDate)}</span>
            </div>
        `;
    }

    function analyzeBPReadings(observations, vitalSigns) {
        const bpReadings = [...observations, ...vitalSigns].filter(obs => 
            obs.display && (
                obs.display.toLowerCase().includes('blood pressure') ||
                obs.display.toLowerCase().includes('systolic') ||
                obs.display.toLowerCase().includes('diastolic')
            )
        );

        const bpContainer = document.getElementById('bpReadings');
        const bpStatus = document.getElementById('bpStatus');

        if (bpReadings.length === 0) {
            bpContainer.innerHTML = '<p class="text-muted">No blood pressure readings found</p>';
            bpStatus.innerHTML = '<span class="badge bg-secondary">No Data</span>';
            return;
        }

        let hasHighBP = false;
        let readingsHtml = '';

        bpReadings.forEach(reading => {
            const value = parseFloat(reading.value);
            let status = 'normal';
            let statusClass = 'bp-normal';
            let statusText = 'Normal';
            let statusColor = 'text-bp-normal';

            // Determine BP status based on value and type
            if (reading.display.toLowerCase().includes('systolic')) {
                if (value >= 140) {
                    status = 'high';
                    statusClass = 'bp-high';
                    statusText = 'High';
                    statusColor = 'text-bp-high';
                    hasHighBP = true;
                } else if (value >= 120) {
                    status = 'elevated';
                    statusClass = 'bp-elevated';
                    statusText = 'Elevated';
                    statusColor = 'text-bp-elevated';
                }
            } else if (reading.display.toLowerCase().includes('diastolic')) {
                if (value >= 90) {
                    status = 'high';
                    statusClass = 'bp-high';
                    statusText = 'High';
                    statusColor = 'text-bp-high';
                    hasHighBP = true;
                } else if (value >= 80) {
                    status = 'elevated';
                    statusClass = 'bp-elevated';
                    statusText = 'Elevated';
                    statusColor = 'text-bp-elevated';
                }
            }

            readingsHtml += `
                <div class="bp-reading ${statusClass}">
                    <div class="d-flex justify-content-between align-items-center">
                        <div>
                            <div class="fw-semibold text-dark">${reading.display}</div>
                            <div class="text-muted small">${formatDate(reading.date)}</div>
                        </div>
                        <div class="text-end">
                            <div class="metric-value ${statusColor}">
                                ${reading.value} <span class="metric-unit">${reading.unit || 'mmHg'}</span>
                            </div>
                            <div class="small ${statusColor}">${statusText}</div>
                        </div>
                    </div>
                </div>
            `;
        });

        bpContainer.innerHTML = readingsHtml;
        
        // Update status badge
        if (hasHighBP) {
            bpStatus.innerHTML = '<span class="badge bg-danger">High BP Detected</span>';
        } else {
            bpStatus.innerHTML = '<span class="badge bg-success">Normal Range</span>';
        }
    }

    function displayHighRiskObservations(observations, vitalSigns) {
        const allObs = [...observations, ...vitalSigns];
        const highRiskObs = allObs.filter(obs => {
            const value = parseFloat(obs.value);
            const display = obs.display ? obs.display.toLowerCase() : '';
            
            return (
                (display.includes('glucose') && value > 140) ||
                (display.includes('cholesterol') && value > 240) ||
                (display.includes('heart rate') && (value > 100 || value < 60)) ||
                (display.includes('temperature') && (value > 38 || value < 36)) ||
                (display.includes('weight') && value > 120) ||
                (display.includes('systolic') && value >= 140) ||
                (display.includes('diastolic') && value >= 90)
            );
        });

        const container = document.getElementById('highRiskObs');
        
        if (highRiskObs.length === 0) {
            container.innerHTML = '<p class="text-muted">No high-risk observations detected</p>';
            return;
        }

        let obsHtml = '';
        highRiskObs.forEach(obs => {
            obsHtml += `
                <div class="obs-item obs-high">
                    <div class="d-flex justify-content-between align-items-center">
                        <div>
                            <div class="fw-semibold text-dark">${obs.display}</div>
                            <div class="text-muted small">
                                <i class="fas fa-clock me-1"></i>
                                ${formatDate(obs.date)}
                            </div>
                        </div>
                        <div class="text-end">
                            <div class="metric-value text-danger">
                                ${obs.value} <span class="metric-unit">${obs.unit || ''}</span>
                            </div>
                            <div class="small text-danger">
                                <i class="fas fa-exclamation-triangle me-1"></i>
                                High Risk
                            </div>
                        </div>
                    </div>
                </div>
            `;
        });

        container.innerHTML = obsHtml;
    }

    function displayRelatedConditions(conditions) {
        const bpRelatedConditions = conditions.filter(condition => {
            const conditionName = condition.condition ? condition.condition.toLowerCase() : '';
            return (
                conditionName.includes('hypertension') ||
                conditionName.includes('blood pressure') ||
                conditionName.includes('cardiovascular') ||
                conditionName.includes('heart') ||
                conditionName.includes('diabetes') ||
                conditionName.includes('obesity')
            );
        });

        const container = document.getElementById('relatedConditions');
        
        if (bpRelatedConditions.length === 0) {
            container.innerHTML = '<p class="text-muted">No related cardiovascular conditions found</p>';
            return;
        }

        let conditionsHtml = '';
        bpRelatedConditions.forEach(condition => {
            const severityColor = getSeverityColor(condition.severity);
            conditionsHtml += `
                <div class="condition-item">
                    <div class="d-flex justify-content-between align-items-center">
                        <div>
                            <div class="fw-semibold text-dark">${condition.condition}</div>
                            <div class="text-muted small">
                                <i class="fas fa-calendar-alt me-1"></i>
                                Onset: ${formatDate(condition.onset)}
                            </div>
                        </div>
                        <div class="text-end">
                            <span class="badge bg-${severityColor}">${condition.status || 'Active'}</span>
                            ${condition.severity ? `<div class="small text-muted mt-1">${condition.severity}</div>` : ''}
                        </div>
                    </div>
                </div>
            `;
        });

        container.innerHTML = conditionsHtml;
    }

    function calculateAge(birthDate) {
        if (!birthDate) return 'Unknown';
        const birth = new Date(birthDate);
        const today = new Date();
        let age = today.getFullYear() - birth.getFullYear();
        const monthDiff = today.getMonth() - birth.getMonth();
        if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
            age--;
        }
        return age;
    }

    function formatDate(dateString) {
        if (!dateString) return 'Unknown';
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', { 
            year: 'numeric', 
            month: 'short', 
            day: 'numeric' 
        });
    }

    function getSeverityColor(severity) {
        if (!severity) return 'secondary';
        const sev = severity.toLowerCase();
        if (sev.includes('severe') || sev.includes('high')) return 'danger';
        if (sev.includes('moderate')) return 'warning';
        if (sev.includes('mild') || sev.includes('low')) return 'info';
        return 'secondary';
    }
});