document.addEventListener('DOMContentLoaded', function() {
    // Check if patient data is available
    if (!window.PATIENT_DATA) {
        showNoDataMessage();
        return;
    }

    const data = window.PATIENT_DATA;
    
    // Search for Regina Hall in the patient data
    let reginaHall = null;
    
    if (data.patient && data.patient.id === 'all' && data.patients) {
        // All patients mode - search in patients array
        reginaHall = data.patients.find(patient => 
            patient.name && patient.name.toLowerCase().includes('regina hall')
        );
    } else if (data.patient && data.patient.name && 
               data.patient.name.toLowerCase().includes('regina hall')) {
        // Single patient mode - check if current patient is Regina Hall
        reginaHall = {
            name: data.patient.name,
            gender: data.patient.gender,
            birthDate: data.patient.birthDate,
            data: {
                observation: data.observation ? data.observation.summary : []
            }
        };
    }

    if (!reginaHall) {
        showNoDataMessage();
        return;
    }

    // Display patient information
    displayPatientInfo(reginaHall);
    
    // Display observations
    displayObservations(reginaHall.data.observation || []);
});

function displayPatientInfo(patient) {
    document.getElementById('patientName').textContent = patient.name || 'Unknown Patient';
    
    const gender = patient.gender || 'Unknown';
    const age = calculateAge(patient.birthDate);
    
    document.getElementById('patientGender').textContent = 
        gender.charAt(0).toUpperCase() + gender.slice(1);
    document.getElementById('patientAge').textContent = age;
}

function displayObservations(observations) {
    const container = document.getElementById('observationsContainer');
    const countBadge = document.getElementById('observationCount');
    
    if (!observations || observations.length === 0) {
        container.innerHTML = `
            <div class="text-center py-4">
                <div class="icon-circle-sm mx-auto mb-3">
                    <i class="fas fa-chart-line text-muted"></i>
                </div>
                <p class="text-muted mb-0">No observations available</p>
            </div>
        `;
        countBadge.textContent = '0';
        return;
    }

    countBadge.textContent = observations.length;
    
    const observationsHtml = observations.map(obs => {
        const name = obs.name || 'Unknown Observation';
        const value = obs.value || obs.status || 'No value recorded';
        const date = formatDate(obs.date);
        
        return `
            <div class="observation-item">
                <div class="d-flex justify-content-between align-items-start">
                    <div class="flex-grow-1">
                        <div class="observation-name">${escapeHtml(name)}</div>
                        <div class="observation-value">${escapeHtml(value)}</div>
                    </div>
                    <div class="text-end">
                        <div class="observation-date">${date}</div>
                    </div>
                </div>
            </div>
        `;
    }).join('');
    
    container.innerHTML = observationsHtml;
}

function calculateAge(birthDate) {
    if (!birthDate) return 'Unknown age';
    
    try {
        const birth = new Date(birthDate);
        const today = new Date();
        let age = today.getFullYear() - birth.getFullYear();
        const monthDiff = today.getMonth() - birth.getMonth();
        
        if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
            age--;
        }
        
        return `${age} years old`;
    } catch (error) {
        return 'Unknown age';
    }
}

function formatDate(dateString) {
    if (!dateString) return 'No date';
    
    try {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    } catch (error) {
        return 'Invalid date';
    }
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function showNoDataMessage() {
    document.getElementById('patientName').textContent = 'Patient Not Found';
    document.getElementById('patientInfo').style.display = 'none';
    document.querySelector('.card:last-of-type').style.display = 'none';
    document.getElementById('noDataMessage').style.display = 'block';
}