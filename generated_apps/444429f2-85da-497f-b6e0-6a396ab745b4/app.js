// Initialize the app when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
});

function initializeApp() {
    // Check if patient data is available
    if (!window.PATIENT_DATA) {
        showError('Patient data not available');
        return;
    }

    const data = window.PATIENT_DATA;
    
    // Find Rose Hall in the patient data
    let roseHallData = null;
    
    if (data.patient && data.patient.id === 'all' && data.patients) {
        // All patients mode - find Rose Hall
        const roseHall = data.patients.find(p => 
            p.name && p.name.toLowerCase().includes('rose hall')
        );
        
        if (roseHall) {
            roseHallData = {
                patient: roseHall,
                observation: roseHall.data?.observation || []
            };
        }
    } else if (data.patient && data.patient.name && 
               data.patient.name.toLowerCase().includes('rose hall')) {
        // Single patient mode - check if it's Rose Hall
        roseHallData = {
            patient: data.patient,
            observation: data.observation?.summary || []
        };
    }

    if (!roseHallData) {
        showError('Rose Hall not found in patient data');
        return;
    }

    // Display patient information
    displayPatientInfo(roseHallData.patient);
    
    // Display observations
    displayObservations(roseHallData.observation);
}

function displayPatientInfo(patient) {
    // Update patient name
    const nameElement = document.getElementById('patientName');
    if (nameElement) {
        nameElement.textContent = patient.name || 'Unknown Patient';
    }

    // Update gender
    const genderElement = document.getElementById('patientGender');
    if (genderElement) {
        const genderSpan = genderElement.querySelector('span');
        if (genderSpan) {
            genderSpan.textContent = formatGender(patient.gender);
        }
    }

    // Update age/birth date
    const ageElement = document.getElementById('patientAge');
    if (ageElement) {
        const ageSpan = ageElement.querySelector('span');
        if (ageSpan) {
            ageSpan.textContent = formatAge(patient.birthDate);
        }
    }

    // Update patient ID
    const idElement = document.getElementById('patientId');
    if (idElement) {
        const idSpan = idElement.querySelector('span');
        if (idSpan) {
            idSpan.textContent = patient.id || 'Unknown ID';
        }
    }
}

function displayObservations(observations) {
    const contentElement = document.getElementById('observationsContent');
    if (!contentElement) return;

    if (!observations || observations.length === 0) {
        contentElement.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-chart-line"></i>
                <div>No observations available</div>
            </div>
        `;
        return;
    }

    const observationsHtml = observations.map(obs => {
        const date = formatDate(obs.date);
        const status = obs.status || 'unknown';
        
        return `
            <div class="observation-card">
                <div class="observation-header">
                    <h3 class="observation-name">${escapeHtml(obs.name || 'Unknown Observation')}</h3>
                    ${date ? `<span class="observation-date">${date}</span>` : ''}
                </div>
                ${obs.value ? `<div class="observation-value">${escapeHtml(obs.value)}</div>` : ''}
                <span class="observation-status status-${status.toLowerCase()}">${status}</span>
            </div>
        `;
    }).join('');

    contentElement.innerHTML = observationsHtml;
}

function formatGender(gender) {
    if (!gender) return 'Not specified';
    return gender.charAt(0).toUpperCase() + gender.slice(1).toLowerCase();
}

function formatAge(birthDate) {
    if (!birthDate) return 'Age unknown';
    
    try {
        const birth = new Date(birthDate);
        const today = new Date();
        let age = today.getFullYear() - birth.getFullYear();
        const monthDiff = today.getMonth() - birth.getMonth();
        
        if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
            age--;
        }
        
        return `${age} years old`;
    } catch (e) {
        return 'Age unknown';
    }
}

function formatDate(dateString) {
    if (!dateString) return '';
    
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
        return dateString;
    }
}

function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function showError(message) {
    const contentElement = document.getElementById('observationsContent');
    if (contentElement) {
        contentElement.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-exclamation-triangle"></i>
                <div>${escapeHtml(message)}</div>
            </div>
        `;
    }

    // Also update patient info with error state
    const nameElement = document.getElementById('patientName');
    if (nameElement) {
        nameElement.textContent = 'Patient Not Found';
    }

    const genderElement = document.getElementById('patientGender');
    if (genderElement) {
        const genderSpan = genderElement.querySelector('span');
        if (genderSpan) {
            genderSpan.textContent = 'Unknown';
        }
    }

    const ageElement = document.getElementById('patientAge');
    if (ageElement) {
        const ageSpan = ageElement.querySelector('span');
        if (ageSpan) {
            ageSpan.textContent = 'Unknown';
        }
    }

    const idElement = document.getElementById('patientId');
    if (idElement) {
        const idSpan = idElement.querySelector('span');
        if (idSpan) {
            idSpan.textContent = 'Unknown';
        }
    }
}