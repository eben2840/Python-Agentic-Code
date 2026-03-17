document.addEventListener('DOMContentLoaded', function() {
    if (!window.PATIENT_DATA) {
        showNoData();
        return;
    }

    const data = window.PATIENT_DATA;
    
    // Check if we're in "all patients" mode
    if (data.patient && data.patient.id === 'all' && data.patients) {
        displayAllPatientsWithObservations(data.patients);
    } else {
        showNoData();
    }
});

function displayAllPatientsWithObservations(patients) {
    // Filter patients who have observations
    const patientsWithObservations = patients.filter(patient => 
        patient.data && patient.data.observation && patient.data.observation.length > 0
    );

    if (patientsWithObservations.length === 0) {
        showNoData();
        return;
    }

    // Update stats
    const totalObservations = patientsWithObservations.reduce((total, patient) => 
        total + (patient.data.observation ? patient.data.observation.length : 0), 0
    );
    
    document.getElementById('totalPatients').textContent = patientsWithObservations.length;
    document.getElementById('totalObservations').textContent = totalObservations;

    // Display patients
    const container = document.getElementById('patientsContainer');
    container.innerHTML = '';

    patientsWithObservations.forEach(patient => {
        const patientCard = createPatientCard(patient);
        container.appendChild(patientCard);
    });
}

function createPatientCard(patient) {
    const col = document.createElement('div');
    col.className = 'col-12 col-lg-6 col-xl-4';

    const birthDate = patient.birthDate ? formatDate(patient.birthDate) : 'Unknown';
    const age = patient.birthDate ? calculateAge(patient.birthDate) : 'Unknown';
    const genderClass = patient.gender === 'male' ? 'gender-male' : 'gender-female';
    const genderIcon = patient.gender === 'male' ? 'fas fa-mars' : 'fas fa-venus';

    // Only show age if it's above 30
    const shouldShowAge = age !== 'Unknown' && typeof age === 'number' && age > 30;

    col.innerHTML = `
        <div class="patient-card">
            <div class="patient-header">
                <div class="patient-name">${escapeHtml(patient.name || 'Unknown Patient')}</div>
                <div class="patient-info">
                    <div class="info-item">
                        <i class="${genderIcon}"></i>
                        <span class="gender-badge ${genderClass}">${patient.gender || 'Unknown'}</span>
                    </div>
                    <div class="info-item">
                        <i class="fas fa-calendar"></i>
                        <span>Born ${birthDate}</span>
                    </div>
                    ${shouldShowAge ? `
                    <div class="info-item">
                        <i class="fas fa-user"></i>
                        <span>Age ${age}</span>
                    </div>
                    ` : ''}
                </div>
            </div>
            <div class="observations-section">
                <div class="section-title">
                    <i class="fas fa-chart-line text-primary"></i>
                    <span>Observations (${patient.data.observation.length})</span>
                </div>
                <div class="observations-grid">
                    ${createObservationsHTML(patient.data.observation)}
                </div>
            </div>
        </div>
    `;

    return col;
}

function createObservationsHTML(observations) {
    return observations.map(obs => `
        <div class="observation-item">
            <div class="observation-name">${escapeHtml(obs.name || 'Unknown Observation')}</div>
            <div class="observation-value">${escapeHtml(obs.value || obs.name || 'No value')}</div>
            ${obs.date ? `<div class="observation-date">
                <i class="fas fa-clock"></i>
                <span>${formatDateTime(obs.date)}</span>
            </div>` : ''}
        </div>
    `).join('');
}

function showNoData() {
    document.getElementById('patientsContainer').style.display = 'none';
    document.getElementById('noDataMessage').style.display = 'block';
    document.getElementById('totalPatients').textContent = '0';
    document.getElementById('totalObservations').textContent = '0';
}

function formatDate(dateString) {
    try {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', { 
            year: 'numeric', 
            month: 'short', 
            day: 'numeric' 
        });
    } catch (e) {
        return 'Unknown';
    }
}

function formatDateTime(dateString) {
    try {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', { 
            year: 'numeric', 
            month: 'short', 
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    } catch (e) {
        return 'Unknown';
    }
}

function calculateAge(birthDate) {
    try {
        const birth = new Date(birthDate);
        const today = new Date();
        let age = today.getFullYear() - birth.getFullYear();
        const monthDiff = today.getMonth() - birth.getMonth();
        
        if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
            age--;
        }
        
        return age;
    } catch (e) {
        return 'Unknown';
    }
}

function escapeHtml(text) {
    const map = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#039;'
    };
    return text ? text.replace(/[&<>"']/g, m => map[m]) : '';
}