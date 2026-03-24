document.addEventListener('DOMContentLoaded', function() {
    const searchInput = document.getElementById('searchInput');
    const conditionsContainer = document.getElementById('conditionsContainer');
    
    let allConditionsData = [];
    
    function initializeApp() {
        if (!window.PATIENT_DATA) {
            showNoData();
            return;
        }
        
        const data = window.PATIENT_DATA;
        
        if (data.patient && data.patient.id === 'all') {
            loadAllPatientsConditions(data);
        } else {
            loadSinglePatientConditions(data);
        }
        
        setupSearch();
    }
    
    function loadAllPatientsConditions(data) {
        allConditionsData = [];
        let totalConditions = 0;
        let activeConditions = 0;
        const uniqueConditionNames = new Set();
        
        if (!data.patients || !Array.isArray(data.patients)) {
            showNoData();
            return;
        }
        
        data.patients.forEach(patient => {
            const patientConditions = [];
            
            if (patient.data && patient.data.condition && Array.isArray(patient.data.condition)) {
                patient.data.condition.forEach(condition => {
                    const conditionData = {
                        patientId: patient.id,
                        patientName: patient.name || 'Unknown Patient',
                        patientGender: patient.gender || 'Unknown',
                        patientBirthDate: patient.birthDate || 'Unknown',
                        name: condition.name || 'Unknown Condition',
                        status: condition.status || 'unknown',
                        date: condition.date || 'Unknown Date',
                        value: condition.value || ''
                    };
                    
                    patientConditions.push(conditionData);
                    totalConditions++;
                    uniqueConditionNames.add(conditionData.name);
                    
                    if (conditionData.status === 'active' || conditionData.status === '') {
                        activeConditions++;
                    }
                });
            }
            
            if (patientConditions.length > 0) {
                allConditionsData.push({
                    patient: patient,
                    conditions: patientConditions
                });
            }
        });
        
        updateSummaryStats(data.patients.length, totalConditions, activeConditions, uniqueConditionNames.size);
        renderAllConditions();
    }
    
    function loadSinglePatientConditions(data) {
        allConditionsData = [];
        let totalConditions = 0;
        let activeConditions = 0;
        const uniqueConditionNames = new Set();
        
        if (data.condition && Array.isArray(data.condition)) {
            const patientConditions = [];
            
            data.condition.forEach(condition => {
                const conditionData = {
                    patientId: data.patient.id,
                    patientName: data.patient.name || 'Unknown Patient',
                    patientGender: data.patient.gender || 'Unknown',
                    patientBirthDate: data.patient.birthDate || 'Unknown',
                    name: condition.name || 'Unknown Condition',
                    status: condition.status || 'unknown',
                    date: condition.date || 'Unknown Date',
                    value: condition.value || ''
                };
                
                patientConditions.push(conditionData);
                totalConditions++;
                uniqueConditionNames.add(conditionData.name);
                
                if (conditionData.status === 'active' || conditionData.status === '') {
                    activeConditions++;
                }
            });
            
            if (patientConditions.length > 0) {
                allConditionsData.push({
                    patient: data.patient,
                    conditions: patientConditions
                });
            }
        }
        
        updateSummaryStats(1, totalConditions, activeConditions, uniqueConditionNames.size);
        renderAllConditions();
    }
    
    function updateSummaryStats(totalPatients, totalConditions, activeConditions, uniqueConditions) {
        document.getElementById('totalPatients').textContent = totalPatients;
        document.getElementById('totalConditions').textContent = totalConditions;
        document.getElementById('activeConditions').textContent = activeConditions;
        document.getElementById('uniqueConditions').textContent = uniqueConditions;
    }
    
    function renderAllConditions(filteredData = null) {
        const dataToRender = filteredData || allConditionsData;
        
        if (dataToRender.length === 0) {
            showNoData();
            return;
        }
        
        let html = '';
        
        dataToRender.forEach((patientData, index) => {
            const patient = patientData.patient;
            const conditions = patientData.conditions;
            const collapseId = `patient-${index}`;
            
            html += `
                <div class="patient-section">
                    <div class="patient-header" data-bs-toggle="collapse" data-bs-target="#${collapseId}" aria-expanded="true">
                        <div class="d-flex justify-content-between align-items-center w-100">
                            <div class="patient-info">
                                <h4>${escapeHtml(patient.name || 'Unknown Patient')}</h4>
                                <div class="patient-meta">
                                    ${escapeHtml(patient.gender || 'Unknown')} • 
                                    DOB: ${formatDate(patient.birthDate)} • 
                                    ID: ${escapeHtml(patient.id || 'Unknown')}
                                </div>
                            </div>
                            <div class="d-flex align-items-center gap-3">
                                <span class="condition-count">${conditions.length} condition${conditions.length !== 1 ? 's' : ''}</span>
                                <i class="fas fa-chevron-down collapse-icon"></i>
                            </div>
                        </div>
                    </div>
                    <div class="collapse show" id="${collapseId}">
                        <div class="conditions-list">
                            ${renderConditions(conditions)}
                        </div>
                    </div>
                </div>
            `;
        });
        
        conditionsContainer.innerHTML = html;
    }
    
    function renderConditions(conditions) {
        return conditions.map(condition => `
            <div class="condition-item">
                <div class="condition-main">
                    <div class="condition-name">${escapeHtml(condition.name)}</div>
                    <div class="condition-details">
                        ${condition.date !== 'Unknown Date' ? `Diagnosed: ${formatDate(condition.date)}` : 'Date unknown'}
                        ${condition.value ? ` • ${escapeHtml(condition.value)}` : ''}
                    </div>
                </div>
                <div class="condition-status ${getStatusClass(condition.status)}">
                    ${formatStatus(condition.status)}
                </div>
            </div>
        `).join('');
    }
    
    function getStatusClass(status) {
        switch (status?.toLowerCase()) {
            case 'active':
                return 'status-active';
            case 'resolved':
            case 'inactive':
                return 'status-resolved';
            default:
                return 'status-unknown';
        }
    }
    
    function formatStatus(status) {
        if (!status || status === '') return 'Active';
        return status.charAt(0).toUpperCase() + status.slice(1).toLowerCase();
    }
    
    function formatDate(dateString) {
        if (!dateString || dateString === 'Unknown' || dateString === 'Unknown Date') {
            return 'Unknown';
        }
        
        try {
            const date = new Date(dateString);
            if (isNaN(date.getTime())) {
                return dateString;
            }
            return date.toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'short',
                day: 'numeric'
            });
        } catch (e) {
            return dateString;
        }
    }
    
    function setupSearch() {
        searchInput.addEventListener('input', function() {
            const searchTerm = this.value.toLowerCase().trim();
            
            if (searchTerm === '') {
                renderAllConditions();
                return;
            }
            
            const filteredData = allConditionsData.map(patientData => {
                const matchingConditions = patientData.conditions.filter(condition => {
                    return condition.name.toLowerCase().includes(searchTerm) ||
                           condition.patientName.toLowerCase().includes(searchTerm) ||
                           condition.status.toLowerCase().includes(searchTerm);
                });
                
                if (matchingConditions.length > 0 || 
                    patientData.patient.name.toLowerCase().includes(searchTerm)) {
                    return {
                        patient: patientData.patient,
                        conditions: matchingConditions.length > 0 ? matchingConditions : patientData.conditions
                    };
                }
                
                return null;
            }).filter(item => item !== null);
            
            renderAllConditions(filteredData);
        });
    }
    
    function showNoData() {
        conditionsContainer.innerHTML = `
            <div class="no-data-message">
                <i class="fas fa-clipboard-list"></i>
                <p>No conditions data available</p>
            </div>
        `;
        
        updateSummaryStats(0, 0, 0, 0);
    }
    
    function escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
    
    // Initialize the app
    initializeApp();
});