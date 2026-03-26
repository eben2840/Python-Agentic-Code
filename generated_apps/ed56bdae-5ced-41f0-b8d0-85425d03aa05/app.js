document.addEventListener('DOMContentLoaded', function() {
    if (typeof window.PATIENT_DATA === 'undefined') {
        console.error('PATIENT_DATA not available');
        showNoData();
        return;
    }

    const data = window.PATIENT_DATA;
    
    if (data.patient && data.patient.id === 'all') {
        // All patients view
        processAllPatientsData(data);
    } else {
        // Single patient view
        processSinglePatientData(data);
    }
});

function processAllPatientsData(data) {
    const wardSet = new Set();
    const wardPatientCount = {};
    
    // Process all patients to find wards
    if (data.patients && Array.isArray(data.patients)) {
        data.patients.forEach(patient => {
            if (patient.data && patient.data.locations) {
                patient.data.locations.forEach(location => {
                    if (location.value) { // value contains the ward name
                        wardSet.add(location.value);
                        wardPatientCount[location.value] = (wardPatientCount[location.value] || 0) + 1;
                    }
                });
            }
        });
    }
    
    const totalWards = wardSet.size;
    const wardsList = Array.from(wardSet);
    
    updateWardCount(totalWards);
    displayWardsList(wardsList, wardPatientCount);
    displayPatientDistribution(wardPatientCount);
}

function processSinglePatientData(data) {
    const wardSet = new Set();
    const wardPatientCount = {};
    
    // Process single patient location data
    if (data.locations && data.locations.summary && Array.isArray(data.locations.summary)) {
        data.locations.summary.forEach(location => {
            if (location.value) { // value contains the ward name
                wardSet.add(location.value);
                wardPatientCount[location.value] = 1; // Single patient
            }
        });
    }
    
    const totalWards = wardSet.size;
    const wardsList = Array.from(wardSet);
    
    updateWardCount(totalWards);
    displayWardsList(wardsList, wardPatientCount);
    displayPatientDistribution(wardPatientCount);
}

function updateWardCount(count) {
    const totalWardsElement = document.getElementById('totalWards');
    if (totalWardsElement) {
        totalWardsElement.textContent = count;
    }
}

function displayWardsList(wardsList, wardPatientCount) {
    const wardsListElement = document.getElementById('wardsList');
    const noWardsMessage = document.getElementById('noWardsMessage');
    
    if (!wardsListElement) return;
    
    if (wardsList.length === 0) {
        wardsListElement.innerHTML = '';
        if (noWardsMessage) {
            noWardsMessage.classList.remove('d-none');
        }
        return;
    }
    
    if (noWardsMessage) {
        noWardsMessage.classList.add('d-none');
    }
    
    const wardsHtml = wardsList.map(ward => {
        const patientCount = wardPatientCount[ward] || 0;
        return `
            <div class="col-12 col-md-6 col-lg-4">
                <div class="ward-item">
                    <div class="d-flex justify-content-between align-items-start mb-2">
                        <div class="icon-circle bg-teal-light">
                            <i class="fas fa-bed text-teal"></i>
                        </div>
                        <span class="patient-count-badge">${patientCount} patient${patientCount !== 1 ? 's' : ''}</span>
                    </div>
                    <div class="ward-name">${escapeHtml(ward)}</div>
                    <div class="ward-status">Active Ward</div>
                </div>
            </div>
        `;
    }).join('');
    
    wardsListElement.innerHTML = wardsHtml;
}

function displayPatientDistribution(wardPatientCount) {
    const distributionElement = document.getElementById('patientDistribution');
    const noPatientData = document.getElementById('noPatientData');
    
    if (!distributionElement) return;
    
    const wards = Object.keys(wardPatientCount);
    
    if (wards.length === 0) {
        distributionElement.innerHTML = '';
        if (noPatientData) {
            noPatientData.classList.remove('d-none');
        }
        return;
    }
    
    if (noPatientData) {
        noPatientData.classList.add('d-none');
    }
    
    const distributionHtml = wards.map(ward => {
        const count = wardPatientCount[ward];
        return `
            <div class="col-6 col-md-4 col-lg-3">
                <div class="distribution-item">
                    <div class="distribution-count">${count}</div>
                    <div class="distribution-label">${escapeHtml(ward)}</div>
                </div>
            </div>
        `;
    }).join('');
    
    distributionElement.innerHTML = distributionHtml;
}

function showNoData() {
    const totalWardsElement = document.getElementById('totalWards');
    const noWardsMessage = document.getElementById('noWardsMessage');
    const noPatientData = document.getElementById('noPatientData');
    
    if (totalWardsElement) {
        totalWardsElement.textContent = '0';
    }
    
    if (noWardsMessage) {
        noWardsMessage.classList.remove('d-none');
    }
    
    if (noPatientData) {
        noPatientData.classList.remove('d-none');
    }
    
    const wardsList = document.getElementById('wardsList');
    const distributionElement = document.getElementById('patientDistribution');
    
    if (wardsList) wardsList.innerHTML = '';
    if (distributionElement) distributionElement.innerHTML = '';
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}