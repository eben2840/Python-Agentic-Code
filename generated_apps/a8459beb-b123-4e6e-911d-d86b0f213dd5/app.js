document.addEventListener('DOMContentLoaded', function() {
    const patientInfoEl = document.getElementById('patientInfo');
    const wardLocationEl = document.getElementById('wardLocation');
    
    if (!window.PATIENT_DATA) {
        showNoData('Patient data not available');
        return;
    }
    
    const data = window.PATIENT_DATA;
    
    if (data.patient && data.patient.id === 'all') {
        // Multiple patients view
        renderAllPatientsWards();
    } else {
        // Single patient view
        renderSinglePatientWard();
    }
    
    function renderSinglePatientWard() {
        const patient = data.patient;
        
        if (!patient) {
            showNoData('Patient information not available');
            return;
        }
        
        // Render patient info
        patientInfoEl.innerHTML = `
            <div class="patient-name">
                <i class="fas fa-user text-blue me-2"></i>
                ${patient.name || 'Unknown Patient'}
            </div>
            <div class="patient-details">
                <span class="me-3">
                    <i class="fas fa-venus-mars me-1"></i>
                    ${patient.gender ? patient.gender.charAt(0).toUpperCase() + patient.gender.slice(1) : 'Not specified'}
                </span>
                <span>
                    <i class="fas fa-calendar me-1"></i>
                    ${patient.birthDate ? formatDate(patient.birthDate) : 'Not specified'}
                </span>
            </div>
        `;
        
        // Render ward location
        const locations = data.locations && data.locations.summary ? data.locations.summary : [];
        
        if (locations.length === 0) {
            showNoWardData();
            return;
        }
        
        let wardHtml = '';
        locations.forEach(location => {
            const wardName = location.value || 'Unknown Ward';
            const roomName = location.name || 'Unknown Room';
            const status = location.status || 'unknown';
            
            wardHtml += `
                <div class="location-card">
                    <div class="location-icon">
                        <i class="fas fa-hospital"></i>
                    </div>
                    <div class="ward-name">${wardName}</div>
                    <div class="room-name">${roomName}</div>
                    <div class="status-badge status-${status.toLowerCase()}">
                        ${status.charAt(0).toUpperCase() + status.slice(1)}
                    </div>
                </div>
            `;
        });
        
        wardLocationEl.innerHTML = wardHtml;
    }
    
    function renderAllPatientsWards() {
        patientInfoEl.innerHTML = `
            <div class="patient-name">
                <i class="fas fa-users text-blue me-2"></i>
                All Patients Ward Locations
            </div>
            <div class="patient-details">
                Showing ward assignments for all patients
            </div>
        `;
        
        const patients = data.patients || [];
        
        if (patients.length === 0) {
            showNoData('No patients available');
            return;
        }
        
        let allPatientsHtml = '';
        
        patients.forEach(patient => {
            let patientWardHtml = `
                <div class="patient-section">
                    <div class="patient-header">
                        <div class="patient-name">
                            <i class="fas fa-user text-blue me-2"></i>
                            ${patient.name || 'Unknown Patient'}
                        </div>
                        <div class="patient-details">
                            <span class="me-3">
                                <i class="fas fa-venus-mars me-1"></i>
                                ${patient.gender ? patient.gender.charAt(0).toUpperCase() + patient.gender.slice(1) : 'Not specified'}
                            </span>
                            <span>
                                <i class="fas fa-calendar me-1"></i>
                                ${patient.birthDate ? formatDate(patient.birthDate) : 'Not specified'}
                            </span>
                        </div>
                    </div>
            `;
            
            // Check for locations in patient data
            const patientData = patient.data || {};
            const locations = patientData.locations || [];
            
            if (locations.length === 0) {
                patientWardHtml += `
                    <div class="no-data">
                        <div class="no-data-icon">
                            <i class="fas fa-map-marker-alt"></i>
                        </div>
                        <p>No ward location available</p>
                    </div>
                `;
            } else {
                locations.forEach(location => {
                    const wardName = location.value || location.ward || 'Unknown Ward';
                    const roomName = location.name || location.room || 'Unknown Room';
                    const status = location.status || 'unknown';
                    
                    patientWardHtml += `
                        <div class="location-card">
                            <div class="location-icon">
                                <i class="fas fa-hospital"></i>
                            </div>
                            <div class="ward-name">${wardName}</div>
                            <div class="room-name">${roomName}</div>
                            <div class="status-badge status-${status.toLowerCase()}">
                                ${status.charAt(0).toUpperCase() + status.slice(1)}
                            </div>
                        </div>
                    `;
                });
            }
            
            patientWardHtml += '</div>';
            allPatientsHtml += patientWardHtml;
        });
        
        wardLocationEl.innerHTML = `<div class="multiple-patients">${allPatientsHtml}</div>`;
    }
    
    function showNoData(message) {
        patientInfoEl.innerHTML = '';
        wardLocationEl.innerHTML = `
            <div class="no-data">
                <div class="no-data-icon">
                    <i class="fas fa-exclamation-circle"></i>
                </div>
                <p>${message}</p>
            </div>
        `;
    }
    
    function showNoWardData() {
        wardLocationEl.innerHTML = `
            <div class="no-data">
                <div class="no-data-icon">
                    <i class="fas fa-map-marker-alt"></i>
                </div>
                <p>No ward location available</p>
            </div>
        `;
    }
    
    function formatDate(dateString) {
        try {
            const date = new Date(dateString);
            return date.toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            });
        } catch (e) {
            return dateString;
        }
    }
});