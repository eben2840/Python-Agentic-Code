let currentFilter = 'all';

function initializeApp() {
    if (!window.PATIENT_DATA) {
        document.getElementById('patient-info').textContent = 'Dati paziente non disponibili';
        return;
    }

    const data = window.PATIENT_DATA;
    
    if (data.patient && data.patient.id === 'all') {
        showAllPatientsView(data);
    } else {
        showSinglePatientView(data);
    }
}

function showSinglePatientView(data) {
    const patient = data.patient;
    if (!patient) return;

    // Update patient info
    const age = calculateAge(patient.birthDate);
    const genderText = patient.gender === 'male' ? 'Maschio' : 'Femmina';
    document.getElementById('patient-info').textContent = 
        `${patient.name} • ${genderText} • ${age} anni • ID: ${patient.id}`;

    // Show single patient view
    document.getElementById('single-patient-view').style.display = 'block';
    document.getElementById('all-patients-view').style.display = 'none';

    // Populate sections
    populateConditions(data.condition?.summary || []);
    populateVitals(data.vital_signs?.summary || []);
    populateMedications(data.medicationrequest?.summary || []);
    populateLocations(data.locations?.summary || []);
    populateObservations(data.observation?.summary || []);
}

function showAllPatientsView(data) {
    document.getElementById('patient-info').textContent = 'Panoramica di tutti i pazienti';
    document.getElementById('single-patient-view').style.display = 'none';
    document.getElementById('all-patients-view').style.display = 'block';

    if (data.patients && data.patients.length > 0) {
        renderPatientsGrid(data.patients);
    } else {
        document.getElementById('patients-grid').innerHTML = 
            '<div class="col-12"><div class="text-muted text-center">Nessun paziente disponibile</div></div>';
    }
}

function populateConditions(conditions) {
    const container = document.getElementById('conditions-content');
    
    if (!conditions || conditions.length === 0) {
        container.innerHTML = '<div class="text-muted">Nessuna condizione registrata</div>';
        return;
    }

    const html = conditions.map(condition => `
        <div class="condition-item">
            <div class="condition-name">${condition.name || 'Condizione non specificata'}</div>
            ${condition.date ? `<div class="condition-date">Data: ${formatDate(condition.date)}</div>` : ''}
        </div>
    `).join('');

    container.innerHTML = html;
}

function populateVitals(vitals) {
    const container = document.getElementById('vitals-content');
    
    if (!vitals || vitals.length === 0) {
        container.innerHTML = '<div class="text-muted">Nessun segno vitale registrato</div>';
        return;
    }

    const html = vitals.map(vital => `
        <div class="vital-item">
            <div class="vital-name">${vital.name || 'Parametro non specificato'}</div>
            ${vital.value ? `<div class="vital-value">Valore: ${vital.value}</div>` : ''}
            ${vital.date ? `<div class="vital-value">Data: ${formatDate(vital.date)}</div>` : ''}
        </div>
    `).join('');

    container.innerHTML = html;
}

function populateMedications(medications) {
    const container = document.getElementById('medications-content');
    
    if (!medications || medications.length === 0) {
        container.innerHTML = '<div class="text-muted">Nessuna terapia farmacologica</div>';
        return;
    }

    const html = medications.map(med => `
        <div class="medication-item">
            <div class="medication-name">${med.name || 'Farmaco non specificato'}</div>
            ${med.value ? `<div class="medication-dosage">Posologia: ${med.value}</div>` : ''}
        </div>
    `).join('');

    container.innerHTML = html;
}

function populateLocations(locations) {
    const container = document.getElementById('location-content');
    
    if (!locations || locations.length === 0) {
        container.innerHTML = '<div class="text-muted">Posizione non disponibile</div>';
        return;
    }

    const html = locations.map(location => `
        <div class="location-item">
            <div class="location-room">${location.name || 'Stanza non specificata'}</div>
            ${location.value ? `<div class="location-ward">Reparto: ${location.value}</div>` : ''}
        </div>
    `).join('');

    container.innerHTML = html;
}

function populateObservations(observations) {
    const container = document.getElementById('observations-content');
    
    if (!observations || observations.length === 0) {
        container.innerHTML = '<div class="text-muted">Nessuna osservazione disponibile</div>';
        return;
    }

    const html = observations.map(obs => `
        <div class="observation-item">
            <div class="observation-name">${obs.name || 'Osservazione non specificata'}</div>
            ${obs.value ? `<div class="observation-value">Risultato: ${obs.value}</div>` : ''}
            ${obs.date ? `<div class="observation-date">Data: ${formatDate(obs.date)}</div>` : ''}
        </div>
    `).join('');

    container.innerHTML = html;
}

function renderPatientsGrid(patients) {
    const container = document.getElementById('patients-grid');
    
    const filteredPatients = filterPatientsByStatus(patients);
    
    if (filteredPatients.length === 0) {
        container.innerHTML = '<div class="col-12"><div class="text-muted text-center">Nessun paziente corrisponde ai criteri di filtro</div></div>';
        return;
    }

    const html = filteredPatients.map(patient => {
        const age = calculateAge(patient.birthDate);
        const genderText = patient.gender === 'male' ? 'M' : 'F';
        const status = determinePatientStatus(patient);
        
        return `
            <div class="col-lg-4 col-md-6">
                <div class="patient-card">
                    <div class="patient-header">
                        <div class="d-flex justify-content-between align-items-start">
                            <div>
                                <h5 class="patient-name">${patient.name}</h5>
                                <p class="patient-details">${genderText} • ${age} anni</p>
                            </div>
                            <span class="status-badge ${status.class}">${status.text}</span>
                        </div>
                    </div>
                    <div class="patient-body">
                        ${renderPatientSummary(patient)}
                    </div>
                </div>
            </div>
        `;
    }).join('');

    container.innerHTML = html;
}

function renderPatientSummary(patient) {
    let summary = '';
    
    // Conditions
    if (patient.data.condition && patient.data.condition.length > 0) {
        const condition = patient.data.condition[0];
        summary += `<div class="mb-2"><i class="fas fa-stethoscope text-danger me-2"></i><small>${condition.name}</small></div>`;
    }
    
    // Latest vital
    if (patient.data.vital_signs && patient.data.vital_signs.length > 0) {
        const vital = patient.data.vital_signs[0];
        summary += `<div class="mb-2"><i class="fas fa-heartbeat text-success me-2"></i><small>${vital.name}</small></div>`;
    }
    
    // Medication
    if (patient.data.medicationrequest && patient.data.medicationrequest.length > 0) {
        const med = patient.data.medicationrequest[0];
        summary += `<div class="mb-2"><i class="fas fa-pills text-warning me-2"></i><small>${med.name}</small></div>`;
    }
    
    return summary || '<div class="text-muted"><small>Nessuna informazione clinica</small></div>';
}

function determinePatientStatus(patient) {
    // Determine status based on conditions and vitals
    const conditions = patient.data.condition || [];
    const criticalConditions = ['Sepsis', 'Chest Pain', 'Fractured Femur', 'Breast Cancer'];
    
    const hasCriticalCondition = conditions.some(c => 
        criticalConditions.some(critical => c.name?.includes(critical))
    );
    
    if (hasCriticalCondition) {
        return { class: 'status-critical', text: 'Critico' };
    } else if (conditions.length > 0) {
        return { class: 'status-monitoring', text: 'Monitoraggio' };
    } else {
        return { class: 'status-stable', text: 'Stabile' };
    }
}

function filterPatients(filterType) {
    currentFilter = filterType;
    
    // Update button states
    document.querySelectorAll('.btn-outline-primary, .btn-outline-danger, .btn-outline-success').forEach(btn => {
        btn.classList.remove('active');
    });
    
    if (window.PATIENT_DATA && window.PATIENT_DATA.patients) {
        renderPatientsGrid(window.PATIENT_DATA.patients);
    }
}

function filterPatientsByStatus(patients) {
    if (currentFilter === 'all') {
        return patients;
    }
    
    return patients.filter(patient => {
        const status = determinePatientStatus(patient);
        
        switch (currentFilter) {
            case 'critical':
                return status.class === 'status-critical';
            case 'stable':
                return status.class === 'status-stable';
            default:
                return true;
        }
    });
}

function calculateAge(birthDate) {
    if (!birthDate) return 'N/A';
    
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
    if (!dateString) return 'N/A';
    
    try {
        const date = new Date(dateString);
        return date.toLocaleDateString('it-IT', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    } catch (e) {
        return dateString;
    }
}

// Initialize the app when the page loads
document.addEventListener('DOMContentLoaded', initializeApp);