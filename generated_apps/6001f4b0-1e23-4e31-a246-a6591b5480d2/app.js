document.addEventListener('DOMContentLoaded', function() {
    if (!window.PATIENT_DATA) {
        console.error('PATIENT_DATA not available');
        showNoData();
        return;
    }

    const data = window.PATIENT_DATA;
    
    if (data.patient && data.patient.id === 'all') {
        renderAllPatientsConditions(data);
    } else {
        console.error('Expected all patients data');
        showNoData();
    }
});

function renderAllPatientsConditions(data) {
    const patients = data.patients || [];
    const conditionsContainer = document.getElementById('conditionsContainer');
    const noDataContainer = document.getElementById('noDataContainer');
    
    let totalPatients = 0;
    let totalConditions = 0;
    let activeConditions = 0;
    let hasAnyConditions = false;
    
    // Clear container
    conditionsContainer.innerHTML = '';
    
    patients.forEach(patient => {
        const patientData = patient.data || {};
        const conditions = patientData.condition || [];
        
        if (conditions.length > 0) {
            hasAnyConditions = true;
            totalPatients++;
            totalConditions += conditions.length;
            
            // Count active conditions
            conditions.forEach(condition => {
                if (condition.status && condition.status.toLowerCase() === 'active') {
                    activeConditions++;
                }
            });
            
            renderPatientConditions(patient, conditions, conditionsContainer);
        }
    });
    
    // Update summary statistics
    document.getElementById('totalPatients').textContent = totalPatients;
    document.getElementById('totalConditions').textContent = totalConditions;
    document.getElementById('activeConditions').textContent = activeConditions;
    
    // Show appropriate content
    if (hasAnyConditions) {
        conditionsContainer.style.display = 'block';
        noDataContainer.style.display = 'none';
    } else {
        showNoData();
    }
}

function renderPatientConditions(patient, conditions, container) {
    const patientCard = document.createElement('div');
    patientCard.className = 'col-12';
    
    const birthDate = patient.birthDate ? formatDate(patient.birthDate) : 'Unknown';
    const age = patient.birthDate ? calculateAge(patient.birthDate) : 'Unknown';
    const gender = patient.gender || 'Unknown';
    
    patientCard.innerHTML = `
        <div class="patient-card">
            <div class="patient-header">
                <div class="patient-name">${escapeHtml(patient.name || 'Unknown Patient')}</div>
                <div class="patient-info">
                    <div class="patient-info-item">
                        <i class="fas fa-user"></i>
                        <span>${escapeHtml(gender)}</span>
                    </div>
                    <div class="patient-info-item">
                        <i class="fas fa-birthday-cake"></i>
                        <span>${escapeHtml(birthDate)} (${escapeHtml(age)} years)</span>
                    </div>
                    <div class="patient-info-item">
                        <i class="fas fa-clipboard-list"></i>
                        <span>${conditions.length} condition${conditions.length !== 1 ? 's' : ''}</span>
                    </div>
                </div>
            </div>
            <div class="conditions-list">
                ${conditions.map(condition => renderConditionItem(condition)).join('')}
            </div>
        </div>
    `;
    
    container.appendChild(patientCard);
}

function renderConditionItem(condition) {
    const name = condition.name || 'Unknown Condition';
    const date = condition.date ? formatDate(condition.date) : 'No date available';
    const status = condition.status || 'unknown';
    const statusClass = getStatusClass(status);
    const statusDisplay = status.charAt(0).toUpperCase() + status.slice(1).toLowerCase();
    
    return `
        <div class="condition-item">
            <div class="condition-info">
                <div class="condition-name">${escapeHtml(name)}</div>
                <div class="condition-date">
                    <i class="fas fa-calendar-alt me-1"></i>
                    ${escapeHtml(date)}
                </div>
            </div>
            <div class="condition-status ${statusClass}">
                ${escapeHtml(statusDisplay)}
            </div>
        </div>
    `;
}

function getStatusClass(status) {
    const statusLower = status.toLowerCase();
    if (statusLower === 'active') return 'status-active';
    if (statusLower === 'resolved' || statusLower === 'inactive') return 'status-resolved';
    return 'status-unknown';
}

function formatDate(dateString) {
    if (!dateString) return 'No date available';
    
    try {
        const date = new Date(dateString);
        if (isNaN(date.getTime())) return 'Invalid date';
        
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    } catch (error) {
        return 'Invalid date';
    }
}

function calculateAge(birthDate) {
    if (!birthDate) return 'Unknown';
    
    try {
        const birth = new Date(birthDate);
        const today = new Date();
        
        if (isNaN(birth.getTime())) return 'Unknown';
        
        let age = today.getFullYear() - birth.getFullYear();
        const monthDiff = today.getMonth() - birth.getMonth();
        
        if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
            age--;
        }
        
        return age.toString();
    } catch (error) {
        return 'Unknown';
    }
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function showNoData() {
    document.getElementById('conditionsContainer').style.display = 'none';
    document.getElementById('noDataContainer').style.display = 'block';
    
    // Reset summary statistics
    document.getElementById('totalPatients').textContent = '0';
    document.getElementById('totalConditions').textContent = '0';
    document.getElementById('activeConditions').textContent = '0';
}