document.addEventListener('DOMContentLoaded', function() {
    const data = window.PATIENT_DATA;
    if (!data) { 
        document.body.innerHTML = '<div class="container mt-5"><div class="alert alert-warning text-center">No patient data available</div></div>'; 
        return; 
    }

    // Display patient name
    document.getElementById('patientName').textContent = data.patient.name || 'Unknown Patient';

    // Process and display critical vital signs
    displayCriticalVitals();
    
    // Display active conditions by priority
    displayActiveConditions();
    
    // Display key health metrics
    displayKeyMetrics();
    
    // Display recent observations table
    displayRecentObservations();

    function displayCriticalVitals() {
        const vitalsContainer = document.getElementById('criticalVitals');
        const vitals = data.vital_signs?.summary || [];
        
        if (vitals.length === 0) {
            vitalsContainer.innerHTML = '<p class="text-muted">No vital signs data available</p>';
            return;
        }

        // Prioritize vital signs by importance
        const priorityOrder = ['Body Mass Index', 'Body Weight', 'Body Height', 'Blood Pressure', 'Heart Rate', 'Temperature'];
        const sortedVitals = vitals.sort((a, b) => {
            const aIndex = priorityOrder.indexOf(a.display) !== -1 ? priorityOrder.indexOf(a.display) : 999;
            const bIndex = priorityOrder.indexOf(b.display) !== -1 ? priorityOrder.indexOf(b.display) : 999;
            return aIndex - bIndex;
        });

        let html = '';
        sortedVitals.slice(0, 5).forEach(vital => {
            const priority = getPriorityClass(vital);
            html += `
                <div class="vital-item ${priority}">
                    <div class="d-flex justify-content-between align-items-center">
                        <div>
                            <strong>${vital.display}</strong>
                            <div class="text-muted small">${formatDate(vital.date)}</div>
                        </div>
                        <div class="text-end">
                            <div class="fw-bold">${vital.value} ${vital.unit || ''}</div>
                            <span class="status-indicator status-${getStatusColor(vital)}"></span>
                            <small class="text-muted">${vital.status || 'Active'}</small>
                        </div>
                    </div>
                </div>
            `;
        });

        vitalsContainer.innerHTML = html;
    }

    function displayActiveConditions() {
        const conditionsContainer = document.getElementById('activeConditions');
        const conditions = data.conditions?.summary || [];
        
        if (conditions.length === 0) {
            conditionsContainer.innerHTML = '<p class="text-muted">No active conditions</p>';
            return;
        }

        let html = '';
        conditions.forEach(condition => {
            const isActive = condition.status !== 'resolved';
            html += `
                <div class="mb-3">
                    <div class="condition-badge ${isActive ? 'condition-active' : 'condition-resolved'}">
                        ${condition.condition}
                    </div>
                    <div class="small text-muted mt-1">
                        Status: ${condition.status || 'Active'} 
                        ${condition.onset ? `• Onset: ${formatDate(condition.onset)}` : ''}
                    </div>
                </div>
            `;
        });

        conditionsContainer.innerHTML = html;
    }

    function displayKeyMetrics() {
        const metricsContainer = document.getElementById('keyMetrics');
        const observations = data.observations?.summary || [];
        
        // Extract key metrics
        const bmi = observations.find(obs => obs.display === 'Body Mass Index');
        const weight = observations.find(obs => obs.display === 'Body Weight');
        const height = observations.find(obs => obs.display === 'Body Height');

        let html = '';
        
        if (bmi) {
            html += `
                <div class="metric-card">
                    <div class="metric-value">${parseFloat(bmi.value).toFixed(1)}</div>
                    <div class="metric-label">BMI (${bmi.unit})</div>
                </div>
            `;
        }
        
        if (weight) {
            html += `
                <div class="metric-card">
                    <div class="metric-value">${parseFloat(weight.value).toFixed(1)}</div>
                    <div class="metric-label">Weight (${weight.unit})</div>
                </div>
            `;
        }
        
        if (height) {
            html += `
                <div class="metric-card">
                    <div class="metric-value">${parseFloat(height.value).toFixed(0)}</div>
                    <div class="metric-label">Height (${height.unit})</div>
                </div>
            `;
        }

        html += `
            <div class="metric-card">
                <div class="metric-value">${data.conditions?.summary?.length || 0}</div>
                <div class="metric-label">Active Conditions</div>
            </div>
        `;

        metricsContainer.innerHTML = html || '<p class="text-muted">No metrics available</p>';
    }

    function displayRecentObservations() {
        const observationsContainer = document.getElementById('recentObservations');
        const observations = data.observations?.summary || [];
        
        if (observations.length === 0) {
            observationsContainer.innerHTML = '<p class="text-muted">No observations available</p>';
            return;
        }

        let html = `
            <table class="table table-clean">
                <thead>
                    <tr>
                        <th>Observation</th>
                        <th>Value</th>
                        <th>Status</th>
                        <th>Date</th>
                    </tr>
                </thead>
                <tbody>
        `;

        observations.slice(0, 10).forEach(obs => {
            html += `
                <tr>
                    <td>
                        <span class="status-indicator status-${getStatusColor(obs)}"></span>
                        ${obs.display}
                    </td>
                    <td><strong>${obs.value} ${obs.unit || ''}</strong></td>
                    <td><span class="badge bg-light text-dark">${obs.status || 'Active'}</span></td>
                    <td class="text-muted">${formatDate(obs.date)}</td>
                </tr>
            `;
        });

        html += '</tbody></table>';
        observationsContainer.innerHTML = html;
    }

    function getPriorityClass(vital) {
        // Determine priority based on vital sign type and value
        if (vital.display === 'Body Mass Index') {
            const bmi = parseFloat(vital.value);
            if (bmi < 18.5 || bmi > 25) return 'warning';
            if (bmi < 16 || bmi > 30) return 'critical';
        }
        return 'normal';
    }

    function getStatusColor(item) {
        if (item.status === 'critical' || item.status === 'high') return 'active';
        if (item.status === 'warning' || item.status === 'abnormal') return 'warning';
        return 'normal';
    }

    function formatDate(dateString) {
        if (!dateString) return 'N/A';
        try {
            return new Date(dateString).toLocaleDateString();
        } catch (e) {
            return dateString;
        }
    }
});