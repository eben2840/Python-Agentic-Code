document.addEventListener('DOMContentLoaded', function() {
    // Wait for patient data to be available
    function initializeApp() {
        if (typeof window.PATIENT_DATA === 'undefined') {
            setTimeout(initializeApp, 100);
            return;
        }
        
        renderPatientInfo();
        renderConditions();
    }
    
    function renderPatientInfo() {
        const patientInfoElement = document.getElementById('patient-info');
        const data = window.PATIENT_DATA;
        
        if (data.patient && data.patient.id !== 'all') {
            // Single patient
            const patient = data.patient;
            const age = calculateAge(patient.birthDate);
            patientInfoElement.innerHTML = `
                <span class="patient-name">${patient.name}</span> • 
                <span class="patient-details">${patient.gender} • ${age} years old</span>
            `;
        } else if (data.patient && data.patient.id === 'all') {
            // Multiple patients
            const patientCount = data.patients ? data.patients.length : 0;
            patientInfoElement.innerHTML = `
                <span class="patient-name">All Patients</span> • 
                <span class="patient-details">${patientCount} patients</span>
            `;
        } else {
            patientInfoElement.innerHTML = '<span class="text-muted">Patient information unavailable</span>';
        }
    }
    
    function renderConditions() {
        const container = document.getElementById('conditions-container');
        const noDataMessage = document.getElementById('no-data-message');
        const data = window.PATIENT_DATA;
        
        let allConditions = [];
        
        if (data.patient && data.patient.id !== 'all') {
            // Single patient
            if (data.condition && data.condition.summary) {
                allConditions = data.condition.summary.map(condition => ({
                    ...condition,
                    patientName: data.patient.name
                }));
            }
        } else if (data.patient && data.patient.id === 'all' && data.patients) {
            // Multiple patients
            data.patients.forEach(patient => {
                if (patient.data && patient.data.condition) {
                    patient.data.condition.forEach(condition => {
                        allConditions.push({
                            ...condition,
                            patientName: patient.name
                        });
                    });
                }
            });
        }
        
        if (allConditions.length === 0) {
            container.style.display = 'none';
            noDataMessage.style.display = 'block';
            return;
        }
        
        container.innerHTML = allConditions.map(condition => createConditionCard(condition)).join('');
        container.style.display = 'block';
        noDataMessage.style.display = 'none';
    }
    
    function createConditionCard(condition) {
        const status = condition.status || 'unknown';
        const badgeClass = getBadgeClass(status);
        const formattedDate = formatDate(condition.date);
        
        return `
            <div class="card condition-card mb-3">
                <div class="card-body">
                    <div class="condition-header">
                        <h5 class="condition-title">${condition.name || 'Unnamed Condition'}</h5>
                        <span class="condition-badge ${badgeClass}">${status}</span>
                    </div>
                    
                    <div class="condition-meta">
                        ${condition.patientName ? `
                            <div class="meta-item">
                                <i class="fas fa-user"></i>
                                <span>${condition.patientName}</span>
                            </div>
                        ` : ''}
                        
                        ${condition.date ? `
                            <div class="meta-item">
                                <i class="fas fa-calendar"></i>
                                <span>${formattedDate}</span>
                            </div>
                        ` : ''}
                        
                        ${condition.value ? `
                            <div class="meta-item">
                                <i class="fas fa-info-circle"></i>
                                <span>${condition.value}</span>
                            </div>
                        ` : ''}
                    </div>
                </div>
            </div>
        `;
    }
    
    function getBadgeClass(status) {
        const statusLower = status.toLowerCase();
        if (statusLower.includes('active') || statusLower.includes('current')) {
            return 'badge-active';
        } else if (statusLower.includes('resolved') || statusLower.includes('completed')) {
            return 'badge-resolved';
        } else {
            return 'badge-inactive';
        }
    }
    
    function formatDate(dateString) {
        if (!dateString) return 'No date available';
        
        try {
            const date = new Date(dateString);
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
            let age = today.getFullYear() - birth.getFullYear();
            const monthDiff = today.getMonth() - birth.getMonth();
            
            if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
                age--;
            }
            
            return age;
        } catch (error) {
            return 'Unknown';
        }
    }
    
    // Initialize the app
    initializeApp();
});