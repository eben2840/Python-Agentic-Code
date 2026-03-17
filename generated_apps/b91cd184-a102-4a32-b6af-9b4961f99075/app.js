document.addEventListener('DOMContentLoaded', function() {
    if (!window.PATIENT_DATA) {
        console.error('Patient data not available');
        showNoData();
        return;
    }

    const data = window.PATIENT_DATA;
    
    // Check if we're in "all patients" mode
    if (data.patient.id !== 'all') {
        showNoData();
        return;
    }

    // Filter patients aged 5-49 with cardiac arrest conditions
    const cardiacArrestPatients = filterCardiacArrestPatients(data.patients);
    
    if (cardiacArrestPatients.length === 0) {
        showNoData();
        return;
    }

    // Update summary statistics
    updateSummaryStats(cardiacArrestPatients);
    
    // Display patient list
    displayPatients(cardiacArrestPatients);
    
    // Show analysis
    displayAnalysis(cardiacArrestPatients);
    
    // Show sections
    document.getElementById('patientSection').style.display = 'block';
    document.getElementById('analysisSection').style.display = 'block';
});

function filterCardiacArrestPatients(patients) {
    if (!patients || !Array.isArray(patients)) {
        return [];
    }

    return patients.filter(patient => {
        // Calculate age
        const age = calculateAge(patient.birthDate);
        if (age < 5 || age > 49) {
            return false;
        }

        // Check for cardiac arrest related conditions
        if (!patient.data || !patient.data.condition) {
            return false;
        }

        return patient.data.condition.some(condition => {
            const conditionName = condition.name ? condition.name.toLowerCase() : '';
            return conditionName.includes('cardiac') || 
                   conditionName.includes('heart') || 
                   conditionName.includes('arrest') ||
                   conditionName.includes('chest pain') ||
                   conditionName.includes('cardio');
        });
    });
}

function calculateAge(birthDate) {
    if (!birthDate) return 0;
    
    const birth = new Date(birthDate);
    const today = new Date();
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
        age--;
    }
    
    return age;
}

function updateSummaryStats(patients) {
    const totalPatients = patients.length;
    document.getElementById('totalPatients').textContent = totalPatients;

    // Gender distribution
    const genderCounts = patients.reduce((acc, patient) => {
        const gender = patient.gender || 'unknown';
        acc[gender] = (acc[gender] || 0) + 1;
        return acc;
    }, {});

    const maleCount = genderCounts.male || 0;
    const femaleCount = genderCounts.female || 0;
    document.getElementById('genderSplit').textContent = `${maleCount}M / ${femaleCount}F`;

    // Average age
    const totalAge = patients.reduce((sum, patient) => sum + calculateAge(patient.birthDate), 0);
    const avgAge = totalPatients > 0 ? Math.round(totalAge / totalPatients) : 0;
    document.getElementById('avgAge').textContent = `${avgAge} years`;

    // Active conditions count
    const totalConditions = patients.reduce((sum, patient) => {
        return sum + (patient.data.condition ? patient.data.condition.length : 0);
    }, 0);
    document.getElementById('activeConditions').textContent = totalConditions;
}

function displayPatients(patients) {
    const patientList = document.getElementById('patientList');
    patientList.innerHTML = '';

    patients.forEach(patient => {
        const patientCard = createPatientCard(patient);
        patientList.appendChild(patientCard);
    });
}

function createPatientCard(patient) {
    const col = document.createElement('div');
    col.className = 'col-md-6 col-lg-4';

    const age = calculateAge(patient.birthDate);
    const genderIcon = patient.gender === 'male' ? 'fas fa-mars' : 'fas fa-venus';
    const avatarColor = patient.gender === 'male' ? '#3b82f6' : '#ec4899';
    const initials = patient.name ? patient.name.split(' ').map(n => n[0]).join('').toUpperCase() : 'N/A';

    // Get conditions
    const conditions = patient.data.condition || [];
    const conditionsHtml = conditions.map(condition => 
        `<span class="condition-badge">${condition.name || 'Unknown condition'}</span>`
    ).join('');

    // Get vital signs
    const vitals = patient.data.vital_signs || [];
    const vitalsHtml = vitals.slice(0, 3).map(vital => 
        `<div class="vital-item">
            <span class="vital-label">${vital.name || 'Unknown'}</span>
            <span class="vital-value">${vital.value || 'N/A'}</span>
        </div>`
    ).join('');

    col.innerHTML = `
        <div class="patient-card">
            <div class="patient-header">
                <div class="patient-avatar" style="background-color: ${avatarColor}">
                    ${initials}
                </div>
                <div class="flex-grow-1">
                    <h4 class="patient-name">${patient.name || 'Unknown Patient'}</h4>
                    <p class="patient-info">
                        <i class="${genderIcon} me-1"></i>
                        ${patient.gender || 'Unknown'} • ${age} years old
                    </p>
                </div>
            </div>
            
            <div class="mb-3">
                <h6 class="mb-2"><i class="fas fa-heartbeat me-1 text-danger"></i>Conditions</h6>
                ${conditionsHtml || '<span class="text-muted">No conditions recorded</span>'}
            </div>
            
            ${vitals.length > 0 ? `
            <div>
                <h6 class="mb-2"><i class="fas fa-chart-line me-1 text-primary"></i>Latest Vitals</h6>
                ${vitalsHtml}
            </div>
            ` : ''}
        </div>
    `;

    return col;
}

function displayAnalysis(patients) {
    displayAgeAnalysis(patients);
    displayClinicalAnalysis(patients);
}

function displayAgeAnalysis(patients) {
    const ageGroups = {
        '5-15': 0,
        '16-25': 0,
        '26-35': 0,
        '36-45': 0,
        '46-49': 0
    };

    patients.forEach(patient => {
        const age = calculateAge(patient.birthDate);
        if (age >= 5 && age <= 15) ageGroups['5-15']++;
        else if (age >= 16 && age <= 25) ageGroups['16-25']++;
        else if (age >= 26 && age <= 35) ageGroups['26-35']++;
        else if (age >= 36 && age <= 45) ageGroups['36-45']++;
        else if (age >= 46 && age <= 49) ageGroups['46-49']++;
    });

    const ageAnalysis = document.getElementById('ageAnalysis');
    ageAnalysis.innerHTML = Object.entries(ageGroups).map(([range, count]) => 
        `<div class="analysis-item">
            <span class="analysis-label">${range} years</span>
            <span class="analysis-value">${count} patients</span>
        </div>`
    ).join('');
}

function displayClinicalAnalysis(patients) {
    // Count unique conditions
    const conditionCounts = {};
    let totalEncounters = 0;
    let totalMedications = 0;

    patients.forEach(patient => {
        if (patient.data.condition) {
            patient.data.condition.forEach(condition => {
                const name = condition.name || 'Unknown';
                conditionCounts[name] = (conditionCounts[name] || 0) + 1;
            });
        }
        
        totalEncounters += patient.data.encounter ? patient.data.encounter.length : 0;
        totalMedications += patient.data.medicationrequest ? patient.data.medicationrequest.length : 0;
    });

    const clinicalAnalysis = document.getElementById('clinicalAnalysis');
    
    let analysisHtml = `
        <div class="analysis-item">
            <span class="analysis-label">Total Encounters</span>
            <span class="analysis-value">${totalEncounters}</span>
        </div>
        <div class="analysis-item">
            <span class="analysis-label">Active Medications</span>
            <span class="analysis-value">${totalMedications}</span>
        </div>
    `;

    // Show top conditions
    const topConditions = Object.entries(conditionCounts)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 3);

    if (topConditions.length > 0) {
        analysisHtml += '<div class="mt-3 mb-2"><strong>Most Common Conditions:</strong></div>';
        topConditions.forEach(([condition, count]) => {
            analysisHtml += `
                <div class="analysis-item">
                    <span class="analysis-label">${condition}</span>
                    <span class="analysis-value">${count} cases</span>
                </div>
            `;
        });
    }

    clinicalAnalysis.innerHTML = analysisHtml;
}

function showNoData() {
    document.getElementById('noDataMessage').style.display = 'block';
    document.getElementById('patientSection').style.display = 'none';
    document.getElementById('analysisSection').style.display = 'none';
    
    // Reset stats to 0
    document.getElementById('totalPatients').textContent = '0';
    document.getElementById('genderSplit').textContent = '0M / 0F';
    document.getElementById('avgAge').textContent = '0 years';
    document.getElementById('activeConditions').textContent = '0';
}