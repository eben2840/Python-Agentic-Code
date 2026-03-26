document.addEventListener('DOMContentLoaded', function() {
    // Check if patient data is available
    if (!window.PATIENT_DATA) {
        console.error('Patient data not available');
        return;
    }

    const data = window.PATIENT_DATA;
    
    // Initialize dashboard
    initializeDashboard();
    
    function initializeDashboard() {
        loadNurses();
        loadWardStructure();
        loadCriticalPatients();
        updateSummaryCounts();
    }
    
    function loadNurses() {
        const nursesList = document.getElementById('nurses-list');
        
        // Check for practitioner data (nurses would be practitioners with specific roles)
        if (data.practitioner && data.practitioner.summary && data.practitioner.summary.length > 0) {
            nursesList.innerHTML = '';
            
            data.practitioner.summary.forEach(practitioner => {
                // Assume practitioners are nurses for this demo
                const nurseItem = createNurseItem(practitioner);
                nursesList.appendChild(nurseItem);
            });
        } else {
            nursesList.innerHTML = `
                <div class="no-data">
                    <i class="fas fa-info-circle text-muted"></i>
                    <p>No nurse data available</p>
                </div>
            `;
        }
    }
    
    function createNurseItem(practitioner) {
        const div = document.createElement('div');
        div.className = 'nurse-item';
        
        const initial = practitioner.name ? practitioner.name.charAt(0).toUpperCase() : 'N';
        const status = practitioner.status || 'active';
        
        div.innerHTML = `
            <div class="nurse-avatar">
                <i class="fas fa-user-nurse"></i>
            </div>
            <div class="nurse-info">
                <h6>${practitioner.name || 'Unknown Nurse'}</h6>
                <p>Status: ${status}</p>
            </div>
        `;
        
        return div;
    }
    
    function loadWardStructure() {
        const wardsStructure = document.getElementById('wards-structure');
        
        if (data.location && data.location.summary && data.location.summary.length > 0) {
            const wardMap = organizeLocationsByWard(data.location.summary);
            wardsStructure.innerHTML = '';
            
            Object.entries(wardMap).forEach(([wardName, rooms]) => {
                const wardSection = createWardSection(wardName, rooms);
                wardsStructure.appendChild(wardSection);
            });
        } else {
            wardsStructure.innerHTML = `
                <div class="no-data">
                    <i class="fas fa-info-circle text-muted"></i>
                    <p>No location data available</p>
                </div>
            `;
        }
    }
    
    function organizeLocationsByWard(locations) {
        const wardMap = {};
        
        locations.forEach(location => {
            if (location.status === 'active') {
                let wardName = 'General Ward';
                let roomName = location.name;
                
                // Extract ward from location name
                if (location.name.includes('Ward')) {
                    const parts = location.name.split(' ');
                    const wardIndex = parts.findIndex(part => part === 'Ward');
                    if (wardIndex > 0) {
                        wardName = parts.slice(0, wardIndex + 1).join(' ');
                        if (wardIndex + 1 < parts.length) {
                            roomName = parts.slice(wardIndex + 1).join(' ');
                        }
                    }
                } else if (location.value && location.value.includes('Ward')) {
                    wardName = location.value;
                }
                
                if (!wardMap[wardName]) {
                    wardMap[wardName] = [];
                }
                
                wardMap[wardName].push({
                    name: roomName,
                    status: location.status,
                    patients: getPatientsByRoom(roomName)
                });
            }
        });
        
        return wardMap;
    }
    
    function getPatientsByRoom(roomName) {
        // This would typically come from encounter or location data
        // For now, return empty array as we don't have room assignments
        return [];
    }
    
    function createWardSection(wardName, rooms) {
        const section = document.createElement('div');
        section.className = 'ward-section';
        
        section.innerHTML = `
            <div class="ward-header">
                <div class="ward-icon">
                    <i class="fas fa-procedures"></i>
                </div>
                <h4 class="ward-title">${wardName}</h4>
            </div>
            <div class="rooms-grid" id="rooms-${wardName.replace(/\s+/g, '-')}">
            </div>
        `;
        
        const roomsGrid = section.querySelector('.rooms-grid');
        rooms.forEach(room => {
            const roomCard = createRoomCard(room);
            roomsGrid.appendChild(roomCard);
        });
        
        return section;
    }
    
    function createRoomCard(room) {
        const div = document.createElement('div');
        div.className = 'room-card';
        
        const hasPatients = room.patients && room.patients.length > 0;
        const statusClass = hasPatients ? 'status-occupied' : 'status-available';
        const statusText = hasPatients ? 'Occupied' : 'Available';
        
        div.innerHTML = `
            <div class="room-header">
                <span class="room-number">${room.name}</span>
                <span class="room-status ${statusClass}">${statusText}</span>
            </div>
            <div class="patient-info">
                ${hasPatients ? 
                    room.patients.map(p => `<div>${p.name}</div>`).join('') : 
                    'No patients assigned'
                }
            </div>
        `;
        
        return div;
    }
    
    function loadCriticalPatients() {
        const criticalPatients = document.getElementById('critical-patients');
        const criticalBPPatients = [];
        
        // Check all patients for critical blood pressure
        if (data.patient && data.patient.id === 'all' && data.patients) {
            data.patients.forEach(patient => {
                if (patient.data && patient.data.vital_signs) {
                    patient.data.vital_signs.forEach(vital => {
                        if (isCriticalBloodPressure(vital)) {
                            criticalBPPatients.push({
                                patient: patient,
                                vital: vital
                            });
                        }
                    });
                }
                
                if (patient.data && patient.data.observation) {
                    patient.data.observation.forEach(obs => {
                        if (isCriticalBloodPressure(obs)) {
                            criticalBPPatients.push({
                                patient: patient,
                                vital: obs
                            });
                        }
                    });
                }
            });
        }
        
        if (criticalBPPatients.length > 0) {
            criticalPatients.innerHTML = '';
            criticalBPPatients.forEach(item => {
                const patientItem = createCriticalPatientItem(item.patient, item.vital);
                criticalPatients.appendChild(patientItem);
            });
        } else {
            criticalPatients.innerHTML = `
                <div class="no-data">
                    <i class="fas fa-check-circle text-success"></i>
                    <p>No patients with critical blood pressure readings</p>
                </div>
            `;
        }
    }
    
    function isCriticalBloodPressure(vital) {
        if (!vital.name && !vital.value) return false;
        
        const bpText = vital.name || vital.value || '';
        const bpMatch = bpText.match(/(\d+)\/(\d+)/);
        
        if (bpMatch) {
            const systolic = parseInt(bpMatch[1]);
            const diastolic = parseInt(bpMatch[2]);
            
            // Critical BP: Systolic ≥180 or Diastolic ≥110
            return systolic >= 180 || diastolic >= 110;
        }
        
        return false;
    }
    
    function createCriticalPatientItem(patient, vital) {
        const div = document.createElement('div');
        div.className = 'patient-item';
        
        const bpReading = vital.name || vital.value || 'Unknown BP';
        const patientName = patient.name || 'Unknown Patient';
        const patientGender = patient.gender || 'Unknown';
        const patientAge = calculateAge(patient.birthDate);
        
        div.innerHTML = `
            <div class="patient-avatar">
                <i class="fas fa-user"></i>
            </div>
            <div class="patient-details">
                <h6>${patientName}</h6>
                <p>${patientGender}, Age: ${patientAge}</p>
                <p>Last Reading: ${vital.date || 'Unknown date'}</p>
                <span class="bp-reading">${bpReading}</span>
            </div>
        `;
        
        return div;
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
    
    function updateSummaryCounts() {
        // Update nurses count
        const nursesCount = data.practitioner && data.practitioner.summary ? 
            data.practitioner.summary.length : 0;
        document.getElementById('nurses-count').textContent = nursesCount;
        
        // Update wards count
        const locations = data.location && data.location.summary ? data.location.summary : [];
        const wards = new Set();
        locations.forEach(location => {
            if (location.status === 'active' && location.name.includes('Ward')) {
                const parts = location.name.split(' ');
                const wardIndex = parts.findIndex(part => part === 'Ward');
                if (wardIndex > 0) {
                    const wardName = parts.slice(0, wardIndex + 1).join(' ');
                    wards.add(wardName);
                }
            }
        });
        document.getElementById('wards-count').textContent = wards.size;
        
        // Update rooms count
        const activeRooms = locations.filter(location => 
            location.status === 'active' && !location.name.includes('Ward')
        ).length;
        document.getElementById('rooms-count').textContent = activeRooms;
        
        // Update critical patients count
        let criticalCount = 0;
        if (data.patient && data.patient.id === 'all' && data.patients) {
            data.patients.forEach(patient => {
                if (patient.data && patient.data.vital_signs) {
                    patient.data.vital_signs.forEach(vital => {
                        if (isCriticalBloodPressure(vital)) {
                            criticalCount++;
                        }
                    });
                }
                
                if (patient.data && patient.data.observation) {
                    patient.data.observation.forEach(obs => {
                        if (isCriticalBloodPressure(obs)) {
                            criticalCount++;
                        }
                    });
                }
            });
        }
        document.getElementById('critical-patients-count').textContent = criticalCount;
    }
});