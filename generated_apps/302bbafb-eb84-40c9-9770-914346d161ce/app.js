document.addEventListener('DOMContentLoaded', function() {
    if (typeof window.PATIENT_DATA === 'undefined') {
        console.error('Patient data not available');
        showNoData();
        return;
    }

    const data = window.PATIENT_DATA;
    
    if (data.patient.id !== 'all' || !data.patients) {
        showNoData();
        return;
    }

    // Filter patients with diabetes and age > 30
    const diabetesPatients = data.patients.filter(patient => {
        // Check if patient has diabetes condition
        const hasDiabetes = patient.data.condition?.some(condition => 
            condition.name && condition.name.toLowerCase().includes('diabetes')
        );
        
        // Calculate age
        if (!patient.birthDate || !hasDiabetes) return false;
        
        const birthDate = new Date(patient.birthDate);
        const today = new Date();
        const age = today.getFullYear() - birthDate.getFullYear();
        const monthDiff = today.getMonth() - birthDate.getMonth();
        
        const actualAge = monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate()) 
            ? age - 1 : age;
        
        return actualAge > 30;
    });

    displayStats(diabetesPatients);
    displayPatients(diabetesPatients);
});

function displayStats(patients) {
    const totalPatients = patients.length;
    
    // Calculate average age
    let totalAge = 0;
    let validAges = 0;
    
    patients.forEach(patient => {
        if (patient.birthDate) {
            const birthDate = new Date(patient.birthDate);
            const today = new Date();
            const age = today.getFullYear() - birthDate.getFullYear();
            const monthDiff = today.getMonth() - birthDate.getMonth();
            
            const actualAge = monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate()) 
                ? age - 1 : age;
            
            totalAge += actualAge;
            validAges++;
        }
    });
    
    const avgAge = validAges > 0 ? Math.round(totalAge / validAges) : 0;
    
    // Count active conditions
    let activeConditions = 0;
    patients.forEach(patient => {
        if (patient.data.condition) {
            activeConditions += patient.data.condition.length;
        }
    });

    document.getElementById('totalPatients').textContent = totalPatients;
    document.getElementById('avgAge').textContent = avgAge;
    document.getElementById('activeConditions').textContent = activeConditions;
}

function displayPatients(patients) {
    const container = document.getElementById('patientsContainer');
    
    if (patients.length === 0) {
        container.innerHTML = `
            <div class="no-data">
                <i class="fas fa-user-slash"></i>
                <h4>No diabetes patients found</h4>
                <p>No patients with diabetes conditions above age 30 were found in the system.</p>
            </div>
        `;
        return;
    }

    const patientsHtml = patients.map(patient => {
        const age = calculateAge(patient.birthDate);
        const genderIcon = patient.gender === 'male' ? 'fas fa-mars' : 'fas fa-venus';
        const genderColor = patient.gender === 'male' ? 'text-primary' : 'text-danger';
        
        return `
            <div class="patient-card">
                <div class="patient-header">
                    <h4 class="patient-name">
                        <i class="fas fa-user-circle text-secondary me-2"></i>
                        ${patient.name || 'Unknown Patient'}
                    </h4>
                    <div class="patient-info">
                        <div class="info-item">
                            <i class="${genderIcon} ${genderColor}"></i>
                            <span class="badge-gender">${patient.gender || 'Unknown'}</span>
                        </div>
                        <div class="info-item">
                            <i class="fas fa-birthday-cake text-warning"></i>
                            <span class="badge-age">${age} years old</span>
                        </div>
                        <div class="info-item">
                            <i class="fas fa-calendar text-info"></i>
                            <span>${formatDate(patient.birthDate)}</span>
                        </div>
                    </div>
                </div>
                
                <div class="patient-details">
                    ${generateConditionsSection(patient.data.condition)}
                    ${generateObservationsSection(patient.data.observation)}
                    ${generateMedicationsSection(patient.data.medicationrequest)}
                </div>
            </div>
        `;
    }).join('');

    container.innerHTML = patientsHtml;
}

function generateConditionsSection(conditions) {
    if (!conditions || conditions.length === 0) {
        return `
            <div class="detail-section">
                <h6><i class="fas fa-stethoscope me-2"></i>Conditions</h6>
                <p class="text-muted">No conditions available</p>
            </div>
        `;
    }

    const conditionsList = conditions.map(condition => 
        `<li><i class="fas fa-circle"></i>${condition.name || 'Unknown condition'}</li>`
    ).join('');

    return `
        <div class="detail-section">
            <h6><i class="fas fa-stethoscope me-2"></i>Conditions</h6>
            <ul class="detail-list">
                ${conditionsList}
            </ul>
        </div>
    `;
}

function generateObservationsSection(observations) {
    if (!observations || observations.length === 0) {
        return `
            <div class="detail-section">
                <h6><i class="fas fa-chart-line me-2"></i>Latest Observations</h6>
                <p class="text-muted">No observations available</p>
            </div>
        `;
    }

    const observationsList = observations.map(obs => 
        `<li><i class="fas fa-circle"></i>${obs.name || 'Unknown observation'}</li>`
    ).join('');

    return `
        <div class="detail-section">
            <h6><i class="fas fa-chart-line me-2"></i>Latest Observations</h6>
            <ul class="detail-list">
                ${observationsList}
            </ul>
        </div>
    `;
}

function generateMedicationsSection(medications) {
    if (!medications || medications.length === 0) {
        return `
            <div class="detail-section">
                <h6><i class="fas fa-pills me-2"></i>Medications</h6>
                <p class="text-muted">No medications available</p>
            </div>
        `;
    }

    const medicationsList = medications.map(med => 
        `<li><i class="fas fa-circle"></i>${med.name || 'Unknown medication'}</li>`
    ).join('');

    return `
        <div class="detail-section">
            <h6><i class="fas fa-pills me-2"></i>Medications</h6>
            <ul class="detail-list">
                ${medicationsList}
            </ul>
        </div>
    `;
}

function calculateAge(birthDate) {
    if (!birthDate) return 'Unknown';
    
    const birth = new Date(birthDate);
    const today = new Date();
    const age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    
    const actualAge = monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate()) 
        ? age - 1 : age;
    
    return actualAge;
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

function showNoData() {
    const container = document.getElementById('patientsContainer');
    container.innerHTML = `
        <div class="no-data">
            <i class="fas fa-exclamation-triangle"></i>
            <h4>No data available</h4>
            <p>Unable to load patient data or no patients found.</p>
        </div>
    `;
    
    document.getElementById('totalPatients').textContent = '0';
    document.getElementById('avgAge').textContent = '0';
    document.getElementById('activeConditions').textContent = '0';
}