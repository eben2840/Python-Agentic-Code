document.addEventListener('DOMContentLoaded', function() {
    if (!window.PATIENT_DATA) {
        console.error('No patient data available');
        return;
    }

    const data = window.PATIENT_DATA;
    
    // Check if we have all patients data
    if (data.patient.id !== 'all' || !data.patients) {
        document.getElementById('totalPatients').textContent = '0';
        document.getElementById('totalConditions').textContent = '0';
        document.getElementById('uniqueConditions').textContent = '0';
        return;
    }

    // Collect all conditions from all patients
    const allConditions = [];
    const conditionCounts = {};
    let totalPatients = 0;
    let patientsWithConditions = 0;

    data.patients.forEach(patient => {
        totalPatients++;
        let patientHasConditions = false;
        
        // Check if patient has condition data
        if (patient.data && patient.data.condition) {
            const conditions = patient.data.condition;
            conditions.forEach(condition => {
                patientHasConditions = true;
                allConditions.push({
                    patient: patient,
                    condition: condition
                });
                
                // Count condition occurrences
                const conditionName = condition.name || 'Unknown Condition';
                conditionCounts[conditionName] = (conditionCounts[conditionName] || 0) + 1;
            });
        }
        
        if (patientHasConditions) {
            patientsWithConditions++;
        }
    });

    // Update statistics
    document.getElementById('totalPatients').textContent = totalPatients;
    document.getElementById('totalConditions').textContent = allConditions.length;
    document.getElementById('uniqueConditions').textContent = Object.keys(conditionCounts).length;

    // Render condition summary
    renderConditionSummary(conditionCounts);
    
    // Render patient conditions
    renderPatientConditions(data.patients);
});

function renderConditionSummary(conditionCounts) {
    const container = document.getElementById('conditionSummary');
    
    if (Object.keys(conditionCounts).length === 0) {
        container.innerHTML = '<div class="no-data">No conditions available</div>';
        return;
    }

    // Sort conditions by count (descending)
    const sortedConditions = Object.entries(conditionCounts)
        .sort(([,a], [,b]) => b - a);

    const html = sortedConditions.map(([conditionName, count]) => `
        <div class="condition-item">
            <div class="condition-name">${escapeHtml(conditionName)}</div>
            <div class="condition-count">${count}</div>
        </div>
    `).join('');

    container.innerHTML = html;
}

function renderPatientConditions(patients) {
    const container = document.getElementById('patientConditions');
    
    // Filter patients who have conditions
    const patientsWithConditions = patients.filter(patient => 
        patient.data && patient.data.condition && patient.data.condition.length > 0
    );

    if (patientsWithConditions.length === 0) {
        container.innerHTML = '<div class="no-data">No patient conditions available</div>';
        return;
    }

    const html = patientsWithConditions.map(patient => {
        const conditions = patient.data.condition || [];
        const patientAge = calculateAge(patient.birthDate);
        
        return `
            <div class="patient-item">
                <div class="patient-header">
                    <div>
                        <div class="patient-name">${escapeHtml(patient.name || 'Unknown Patient')}</div>
                        <div class="patient-info">
                            ${escapeHtml(patient.gender || 'Unknown')} • 
                            Age ${patientAge} • 
                            ${conditions.length} condition${conditions.length !== 1 ? 's' : ''}
                        </div>
                    </div>
                </div>
                <div class="patient-conditions">
                    ${conditions.map(condition => `
                        <div class="condition-badge">
                            ${escapeHtml(condition.name || 'Unknown Condition')}
                            ${condition.date ? `<span class="condition-date">${formatDate(condition.date)}</span>` : ''}
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
    }).join('');

    container.innerHTML = html;
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
    if (!dateString) return '';
    
    try {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    } catch (e) {
        return dateString;
    }
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}