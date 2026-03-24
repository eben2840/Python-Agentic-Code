document.addEventListener('DOMContentLoaded', function() {
    // Initialize the app
    initializeApp();
});

function initializeApp() {
    // Check if patient data is available
    if (typeof window.PATIENT_DATA === 'undefined') {
        console.warn('Patient data not available');
        displayNoData();
        return;
    }

    const data = window.PATIENT_DATA;
    
    // Handle single patient vs all patients
    if (data.patient && data.patient.id !== 'all') {
        displaySinglePatient(data);
    } else if (data.patients) {
        displayAllPatients(data);
    } else {
        displayNoData();
    }
}

function displaySinglePatient(data) {
    // Display patient information
    const patient = data.patient;
    
    document.getElementById('patientName').textContent = patient.name || 'No data available';
    document.getElementById('patientGender').textContent = patient.gender || 'No data available';
    document.getElementById('patientDob').textContent = patient.birthDate || 'No data available';
    document.getElementById('patientId').textContent = patient.id || 'No data available';
    
    // Display patient data summary
    displayPatientDataSummary(data);
}

function displayAllPatients(data) {
    // For all patients view, show summary in patient info section
    document.getElementById('patientName').textContent = 'Multiple Patients';
    document.getElementById('patientGender').textContent = 'Various';
    document.getElementById('patientDob').textContent = 'Various';
    document.getElementById('patientId').textContent = 'Multiple IDs';
    
    // Display all patients data
    displayAllPatientsData(data);
}

function displayPatientDataSummary(data) {
    const summaryContainer = document.getElementById('patientDataSummary');
    summaryContainer.innerHTML = '';
    
    let hasData = false;
    
    // Check for encounters
    if (data.encounter && data.encounter.summary && data.encounter.summary.length > 0) {
        hasData = true;
        const encounterDiv = createDataSummaryItem('Encounters', `${data.encounter.summary.length} encounter(s) on record`, 'fas fa-calendar-check');
        summaryContainer.appendChild(encounterDiv);
    }
    
    // Check for locations
    if (data.locations && data.locations.summary && data.locations.summary.length > 0) {
        hasData = true;
        const locationData = data.locations.summary[0];
        const locationDiv = createDataSummaryItem('Current Location', `${locationData.name} - ${locationData.value}`, 'fas fa-map-marker-alt');
        summaryContainer.appendChild(locationDiv);
    }
    
    // Check for other resource types dynamically
    Object.keys(data).forEach(resourceType => {
        if (resourceType !== 'patient' && resourceType !== 'encounter' && resourceType !== 'locations') {
            const resource = data[resourceType];
            if (resource && resource.summary && resource.summary.length > 0) {
                hasData = true;
                const resourceDiv = createDataSummaryItem(
                    capitalizeFirst(resourceType), 
                    `${resource.summary.length} record(s) available`,
                    'fas fa-file-medical'
                );
                summaryContainer.appendChild(resourceDiv);
            }
        }
    });
    
    if (!hasData) {
        summaryContainer.innerHTML = '<div class="col-12"><p class="text-muted">No additional patient data available</p></div>';
    }
}

function displayAllPatientsData(data) {
    const summaryContainer = document.getElementById('patientDataSummary');
    summaryContainer.innerHTML = '';
    
    if (!data.patients || data.patients.length === 0) {
        summaryContainer.innerHTML = '<div class="col-12"><p class="text-muted">No patient data available</p></div>';
        return;
    }
    
    // Create a container for all patients
    const allPatientsDiv = document.createElement('div');
    allPatientsDiv.className = 'col-12';
    
    data.patients.forEach((patient, index) => {
        const patientCard = document.createElement('div');
        patientCard.className = 'data-summary-item';
        
        let patientHtml = `
            <h6><i class="fas fa-user me-2"></i>${patient.name || 'Unknown Patient'}</h6>
            <p><strong>ID:</strong> ${patient.id || 'No ID'} | <strong>Gender:</strong> ${patient.gender || 'Unknown'} | <strong>DOB:</strong> ${patient.birthDate || 'Unknown'}</p>
        `;
        
        // Display all resource types for this patient
        if (patient.data) {
            Object.entries(patient.data).forEach(([resourceType, records]) => {
                if (records && Array.isArray(records) && records.length > 0) {
                    patientHtml += `<p><strong>${capitalizeFirst(resourceType)}:</strong> ${records.length} record(s)</p>`;
                    
                    // Show details for each record
                    records.forEach((record, recordIndex) => {
                        if (record.name || record.status || record.date || record.value) {
                            patientHtml += `<small class="text-muted d-block ms-3">• ${record.name || 'Record'} ${record.status ? `(${record.status})` : ''} ${record.date ? `- ${record.date}` : ''} ${record.value ? `- ${record.value}` : ''}</small>`;
                        }
                    });
                }
            });
        }
        
        patientCard.innerHTML = patientHtml;
        allPatientsDiv.appendChild(patientCard);
    });
    
    summaryContainer.appendChild(allPatientsDiv);
}

function createDataSummaryItem(title, description, iconClass) {
    const div = document.createElement('div');
    div.className = 'col-md-6 col-lg-4';
    
    div.innerHTML = `
        <div class="data-summary-item">
            <h6><i class="${iconClass} me-2"></i>${title}</h6>
            <p>${description}</p>
        </div>
    `;
    
    return div;
}

function displayNoData() {
    document.getElementById('patientName').textContent = 'No data available';
    document.getElementById('patientGender').textContent = 'No data available';
    document.getElementById('patientDob').textContent = 'No data available';
    document.getElementById('patientId').textContent = 'No data available';
    
    const summaryContainer = document.getElementById('patientDataSummary');
    summaryContainer.innerHTML = '<div class="col-12"><p class="text-muted">No patient data available</p></div>';
}

function capitalizeFirst(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
}

// Utility function to format dates
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
        return dateString;
    }
}

// Handle window resize for responsive behavior
window.addEventListener('resize', function() {
    // Any responsive adjustments can be handled here
});