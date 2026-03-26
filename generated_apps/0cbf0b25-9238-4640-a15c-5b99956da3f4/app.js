document.addEventListener('DOMContentLoaded', function() {
    if (!window.PATIENT_DATA) {
        showNoDataState();
        return;
    }

    const data = window.PATIENT_DATA;
    
    // Initialize counters
    let entPatientCount = 0;
    let entLocations = [];
    let patientsWithConditions = [];

    // Check if we have all patients data
    if (data.patient && data.patient.id === 'all') {
        // Process locations to find ENT ward
        if (data.locations && data.locations.summary) {
            entLocations = data.locations.summary.filter(location => 
                location.name && location.name.toLowerCase().includes('ent')
            );
        }

        // Process all patients
        if (data.patients && Array.isArray(data.patients)) {
            data.patients.forEach(patient => {
                if (patient.data) {
                    // Check if patient has conditions
                    let hasConditions = false;
                    Object.entries(patient.data).forEach(([resourceType, records]) => {
                        if (resourceType === 'condition' && records && records.length > 0) {
                            hasConditions = true;
                        }
                    });

                    if (hasConditions) {
                        patientsWithConditions.push(patient);
                        entPatientCount++; // For now, count all patients with conditions as ENT patients
                    }
                }
            });
        }
    } else {
        // Single patient view
        if (data.patient) {
            entPatientCount = 1;
            patientsWithConditions.push({
                id: data.patient.id || 'unknown',
                name: data.patient.name || 'Unknown Patient',
                gender: data.patient.gender || 'unknown',
                birthDate: data.patient.birthDate || null,
                data: {
                    condition: data.condition ? data.condition.summary || [] : []
                }
            });
        }
    }

    // Update UI
    updatePatientCount(entPatientCount);
    updateENTLocations(entLocations);
    updatePatientConditions(patientsWithConditions);

    // Show no data state if no relevant data found
    if (entPatientCount === 0 && entLocations.length === 0) {
        showNoDataState();
    }
});

function updatePatientCount(count) {
    const countElement = document.getElementById('entPatientCount');
    if (countElement) {
        countElement.textContent = count;
    }
}

function updateENTLocations(locations) {
    const container = document.getElementById('entLocations');
    if (!container) return;

    if (!locations || locations.length === 0) {
        container.innerHTML = '<div class="no-data-text">No ENT ward locations found</div>';
        return;
    }

    const locationsHTML = locations.map(location => `
        <div class="location-item">
            <div class="location-name">${escapeHtml(location.name || 'Unknown Location')}</div>
            <span class="location-status status-${(location.status || 'active').toLowerCase()}">
                ${escapeHtml(location.status || 'Active')}
            </span>
        </div>
    `).join('');

    container.innerHTML = locationsHTML;
}

function updatePatientConditions(patients) {
    const container = document.getElementById('patientConditions');
    if (!container) return;

    if (!patients || patients.length === 0) {
        container.innerHTML = '<div class="no-data-text">No patient condition data available</div>';
        return;
    }

    const patientsHTML = patients.map(patient => {
        const conditions = patient.data && patient.data.condition ? patient.data.condition : [];
        const age = calculateAge(patient.birthDate);
        
        const conditionsHTML = conditions.length > 0 
            ? conditions.map(condition => `
                <li class="condition-item">
                    <div class="condition-icon"></div>
                    <span class="condition-name">${escapeHtml(condition.name || 'Unknown Condition')}</span>
                    ${condition.date ? `<span class="condition-date">${formatDate(condition.date)}</span>` : ''}
                </li>
            `).join('')
            : '<li class="condition-item"><span class="condition-name" style="color: #9ca3af; font-style: italic;">No conditions recorded</span></li>';

        return `
            <div class="patient-card">
                <div class="patient-header">
                    <div class="flex-grow-1">
                        <div class="patient-name">${escapeHtml(patient.name || 'Unknown Patient')}</div>
                        <div class="patient-info">
                            ${age ? `Age: ${age}` : 'Age: Unknown'}
                            ${patient.gender ? ` • ${patient.gender}` : ''}
                        </div>
                    </div>
                    ${patient.gender ? `<span class="gender-badge gender-${patient.gender.toLowerCase()}">${patient.gender}</span>` : ''}
                </div>
                <ul class="condition-list">
                    ${conditionsHTML}
                </ul>
            </div>
        `;
    }).join('');

    container.innerHTML = patientsHTML;
}

function calculateAge(birthDate) {
    if (!birthDate) return null;
    
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
    if (typeof text !== 'string') return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function showNoDataState() {
    const noDataElement = document.getElementById('noDataState');
    if (noDataElement) {
        noDataElement.style.display = 'block';
    }
    
    // Hide other sections
    const countElement = document.getElementById('entPatientCount');
    if (countElement) {
        countElement.textContent = '0';
    }
}