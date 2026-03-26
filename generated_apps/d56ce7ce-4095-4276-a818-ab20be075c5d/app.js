document.addEventListener('DOMContentLoaded', function() {
    // Wait for PATIENT_DATA to be available
    function initializeApp() {
        if (typeof window.PATIENT_DATA === 'undefined') {
            setTimeout(initializeApp, 100);
            return;
        }
        
        renderLocationStructure();
        renderPatientOverview();
    }
    
    function renderLocationStructure() {
        const locationContainer = document.getElementById('locationStructure');
        
        if (!window.PATIENT_DATA || !window.PATIENT_DATA.location) {
            locationContainer.innerHTML = '<div class="no-data"><i class="fas fa-info-circle me-2"></i>No location data available</div>';
            return;
        }
        
        const locations = window.PATIENT_DATA.location.summary || [];
        
        if (locations.length === 0) {
            locationContainer.innerHTML = '<div class="no-data"><i class="fas fa-info-circle me-2"></i>No location data available</div>';
            return;
        }
        
        // Group locations by type
        const wards = locations.filter(loc => loc.name === 'Ward');
        const rooms = locations.filter(loc => loc.name === 'Room');
        const others = locations.filter(loc => loc.name !== 'Ward' && loc.name !== 'Room');
        
        let html = '';
        
        // Show statistics
        html += `
            <div class="stats-row mb-3">
                <div class="stat-item">
                    <div class="stat-number">${wards.length}</div>
                    <div class="stat-label">Wards</div>
                </div>
                <div class="stat-item">
                    <div class="stat-number">${rooms.length}</div>
                    <div class="stat-label">Rooms</div>
                </div>
                <div class="stat-item">
                    <div class="stat-number">${others.length}</div>
                    <div class="stat-label">Other</div>
                </div>
            </div>
        `;
        
        // Show wards
        if (wards.length > 0) {
            html += '<div class="mb-3">';
            wards.forEach(ward => {
                html += `
                    <div class="location-item location-ward">
                        <div class="d-flex align-items-center">
                            <i class="fas fa-building me-2 text-blue"></i>
                            <div>
                                <strong>${ward.name || 'Ward'}</strong>
                                <div class="text-muted small">${ward.value || 'No details'}</div>
                            </div>
                            <span class="badge bg-success ms-auto">${ward.status || 'active'}</span>
                        </div>
                    </div>
                `;
            });
            html += '</div>';
        }
        
        // Show rooms
        if (rooms.length > 0) {
            html += '<div class="mb-3">';
            rooms.forEach(room => {
                html += `
                    <div class="location-item location-room">
                        <div class="d-flex align-items-center">
                            <i class="fas fa-door-open me-2 text-green"></i>
                            <div>
                                <strong>${room.name || 'Room'}</strong>
                                <div class="text-muted small">${room.value || 'No details'}</div>
                            </div>
                            <span class="badge bg-success ms-auto">${room.status || 'active'}</span>
                        </div>
                    </div>
                `;
            });
            html += '</div>';
        }
        
        // Show other locations
        if (others.length > 0) {
            html += '<div>';
            others.forEach(loc => {
                html += `
                    <div class="location-item">
                        <div class="d-flex align-items-center">
                            <i class="fas fa-map-pin me-2 text-teal"></i>
                            <div>
                                <strong>${loc.name || 'Location'}</strong>
                                <div class="text-muted small">${loc.value || 'No details'}</div>
                            </div>
                            <span class="badge bg-success ms-auto">${loc.status || 'active'}</span>
                        </div>
                    </div>
                `;
            });
            html += '</div>';
        }
        
        locationContainer.innerHTML = html;
    }
    
    function renderPatientOverview() {
        const patientConditionsContainer = document.getElementById('patientConditions');
        const patientCardsContainer = document.getElementById('patientCards');
        const patientCountBadge = document.getElementById('patientCount');
        
        if (!window.PATIENT_DATA) {
            patientConditionsContainer.innerHTML = '<div class="no-data"><i class="fas fa-info-circle me-2"></i>No patient data available</div>';
            patientCountBadge.textContent = '0';
            return;
        }
        
        let patients = [];
        
        // Handle single patient vs all patients
        if (window.PATIENT_DATA.patient && window.PATIENT_DATA.patient.id !== 'all') {
            // Single patient
            patients = [{
                id: window.PATIENT_DATA.patient.id,
                name: window.PATIENT_DATA.patient.name,
                gender: window.PATIENT_DATA.patient.gender,
                birthDate: window.PATIENT_DATA.patient.birthDate,
                data: {
                    condition: window.PATIENT_DATA.condition?.summary || [],
                    observation: window.PATIENT_DATA.observation?.summary || [],
                    medicationrequest: window.PATIENT_DATA.medicationrequest?.summary || [],
                    encounter: window.PATIENT_DATA.encounter?.summary || []
                }
            }];
        } else if (window.PATIENT_DATA.patients) {
            // All patients
            patients = window.PATIENT_DATA.patients;
        }
        
        patientCountBadge.textContent = patients.length;
        
        if (patients.length === 0) {
            patientConditionsContainer.innerHTML = '<div class="no-data"><i class="fas fa-info-circle me-2"></i>No patient data available</div>';
            return;
        }
        
        // Render overview
        let overviewHtml = '';
        let totalConditions = 0;
        let totalObservations = 0;
        let totalMedications = 0;
        
        patients.forEach(patient => {
            const conditions = patient.data?.condition || [];
            const observations = patient.data?.observation || [];
            const medications = patient.data?.medicationrequest || [];
            
            totalConditions += conditions.length;
            totalObservations += observations.length;
            totalMedications += medications.length;
        });
        
        overviewHtml = `
            <div class="stats-row mb-3">
                <div class="stat-item">
                    <div class="stat-number">${totalConditions}</div>
                    <div class="stat-label">Conditions</div>
                </div>
                <div class="stat-item">
                    <div class="stat-number">${totalObservations}</div>
                    <div class="stat-label">Observations</div>
                </div>
                <div class="stat-item">
                    <div class="stat-number">${totalMedications}</div>
                    <div class="stat-label">Medications</div>
                </div>
            </div>
        `;
        
        // Show condition summary
        const allConditions = [];
        patients.forEach(patient => {
            const conditions = patient.data?.condition || [];
            conditions.forEach(condition => {
                allConditions.push(condition.name || 'Unknown Condition');
            });
        });
        
        const conditionCounts = {};
        allConditions.forEach(condition => {
            conditionCounts[condition] = (conditionCounts[condition] || 0) + 1;
        });
        
        const sortedConditions = Object.entries(conditionCounts)
            .sort(([,a], [,b]) => b - a)
            .slice(0, 10);
        
        if (sortedConditions.length > 0) {
            overviewHtml += '<div class="mb-3"><h6 class="mb-2">Most Common Conditions</h6>';
            sortedConditions.forEach(([condition, count]) => {
                const severity = getSeverityClass(condition);
                overviewHtml += `<span class="condition-badge ${severity}">${condition} (${count})</span>`;
            });
            overviewHtml += '</div>';
        }
        
        patientConditionsContainer.innerHTML = overviewHtml;
        
        // Render detailed patient cards
        renderPatientCards(patients);
    }
    
    function renderPatientCards(patients) {
        const patientCardsContainer = document.getElementById('patientCards');
        let cardsHtml = '';
        
        patients.forEach(patient => {
            const conditions = patient.data?.condition || [];
            const observations = patient.data?.observation || [];
            const medications = patient.data?.medicationrequest || [];
            const encounters = patient.data?.encounter || [];
            
            const initials = getInitials(patient.name || 'Unknown');
            const age = calculateAge(patient.birthDate);
            
            cardsHtml += `
                <div class="col-lg-6 col-xl-4 mb-4">
                    <div class="card patient-card">
                        <div class="patient-header">
                            <div class="patient-info">
                                <div class="patient-avatar">${initials}</div>
                                <div class="patient-details">
                                    <h6>${patient.name || 'Unknown Patient'}</h6>
                                    <div class="patient-meta">
                                        <i class="fas fa-user me-1"></i>${patient.gender || 'Unknown'} • 
                                        <i class="fas fa-birthday-cake me-1"></i>${age} years old
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div class="card-body">
                            ${renderPatientConditions(conditions)}
                            ${renderPatientObservations(observations)}
                            ${renderPatientMedications(medications)}
                            ${renderPatientEncounters(encounters)}
                        </div>
                    </div>
                </div>
            `;
        });
        
        patientCardsContainer.innerHTML = cardsHtml;
    }
    
    function renderPatientConditions(conditions) {
        if (!conditions || conditions.length === 0) {
            return '<div class="mb-3"><h6 class="mb-2"><i class="fas fa-stethoscope me-2 text-teal"></i>Conditions</h6><p class="text-muted small">No conditions recorded</p></div>';
        }
        
        let html = '<div class="mb-3"><h6 class="mb-2"><i class="fas fa-stethoscope me-2 text-teal"></i>Conditions</h6>';
        conditions.forEach(condition => {
            const severity = getSeverityClass(condition.name);
            html += `<span class="condition-badge ${severity}">${condition.name || 'Unknown'}</span>`;
        });
        html += '</div>';
        return html;
    }
    
    function renderPatientObservations(observations) {
        if (!observations || observations.length === 0) {
            return '<div class="mb-3"><h6 class="mb-2"><i class="fas fa-chart-line me-2 text-blue"></i>Latest Observations</h6><p class="text-muted small">No observations recorded</p></div>';
        }
        
        let html = '<div class="mb-3"><h6 class="mb-2"><i class="fas fa-chart-line me-2 text-blue"></i>Latest Observations</h6>';
        observations.slice(0, 3).forEach(obs => {
            html += `<div class="small mb-1"><strong>${obs.name || 'Unknown'}:</strong> ${obs.value || 'No value'}</div>`;
        });
        html += '</div>';
        return html;
    }
    
    function renderPatientMedications(medications) {
        if (!medications || medications.length === 0) {
            return '<div class="mb-3"><h6 class="mb-2"><i class="fas fa-pills me-2 text-green"></i>Medications</h6><p class="text-muted small">No medications prescribed</p></div>';
        }
        
        let html = '<div class="mb-3"><h6 class="mb-2"><i class="fas fa-pills me-2 text-green"></i>Medications</h6>';
        medications.slice(0, 3).forEach(med => {
            html += `<div class="small mb-1"><strong>${med.name || 'Unknown'}:</strong> ${med.value || 'No dosage'}</div>`;
        });
        html += '</div>';
        return html;
    }
    
    function renderPatientEncounters(encounters) {
        if (!encounters || encounters.length === 0) {
            return '';
        }
        
        let html = '<div class="mb-2"><h6 class="mb-2"><i class="fas fa-calendar me-2 text-warning"></i>Recent Encounters</h6>';
        html += `<p class="text-muted small">${encounters.length} encounter(s) on record</p>`;
        html += '</div>';
        return html;
    }
    
    function getSeverityClass(conditionName) {
        if (!conditionName) return '';
        
        const critical = ['sepsis', 'cancer', 'fracture', 'chest pain', 'tb'];
        const warning = ['hypertension', 'diabetes', 'copd', 'ckd', 'anemia'];
        
        const name = conditionName.toLowerCase();
        
        if (critical.some(c => name.includes(c))) {
            return 'condition-critical';
        } else if (warning.some(w => name.includes(w))) {
            return 'condition-warning';
        }
        
        return '';
    }
    
    function getInitials(name) {
        if (!name) return '?';
        return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
    }
    
    function calculateAge(birthDate) {
        if (!birthDate) return 'Unknown';
        
        const birth = new Date(birthDate);
        const today = new Date();
        let age = today.getFullYear() - birth.getFullYear();
        const monthDiff = today.getMonth() - birth.getMonth();
        
        if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
            age--;
        }
        
        return age;
    }
    
    // Initialize the app
    initializeApp();
});