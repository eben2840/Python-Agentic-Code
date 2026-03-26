document.addEventListener('DOMContentLoaded', function() {
    if (!window.PATIENT_DATA) {
        console.error('PATIENT_DATA not available');
        return;
    }

    const data = window.PATIENT_DATA;
    
    // Render summary cards
    renderSummaryCards(data);
    
    // Render ward and room structure
    renderWardRoomStructure(data);
    
    // Render patients and conditions
    renderPatientsAndConditions(data);
});

function renderSummaryCards(data) {
    const summaryContainer = document.getElementById('summaryCards');
    
    let totalPatients = 0;
    let totalConditions = 0;
    let totalWards = 0;
    let totalRooms = 0;

    if (data.patient && data.patient.id === 'all') {
        // All patients view
        totalPatients = (data.patients || []).length;
        
        // Count all conditions across all patients
        (data.patients || []).forEach(patient => {
            if (patient.data) {
                Object.entries(patient.data).forEach(([resourceType, records]) => {
                    if (resourceType === 'condition') {
                        totalConditions += (records || []).length;
                    }
                });
            }
        });
        
        // Count wards and rooms
        if (data.location && data.location.summary) {
            data.location.summary.forEach(location => {
                const locationType = getLocationType(location);
                if (locationType === 'Ward') {
                    totalWards++;
                } else if (locationType === 'Room') {
                    totalRooms++;
                }
            });
        }
    } else {
        // Single patient view
        totalPatients = 1;
        if (data.condition && data.condition.summary) {
            totalConditions = data.condition.summary.length;
        }
        if (data.location && data.location.summary) {
            data.location.summary.forEach(location => {
                const locationType = getLocationType(location);
                if (locationType === 'Ward') {
                    totalWards++;
                } else if (locationType === 'Room') {
                    totalRooms++;
                }
            });
        }
    }

    const cards = [
        { icon: 'fas fa-users', count: totalPatients, label: 'Patients', color: 'text-primary' },
        { icon: 'fas fa-stethoscope', count: totalConditions, label: 'Conditions', color: 'text-success' },
        { icon: 'fas fa-hospital-user', count: totalWards, label: 'Wards', color: 'text-info' },
        { icon: 'fas fa-bed', count: totalRooms, label: 'Rooms', color: 'text-warning' }
    ];

    summaryContainer.innerHTML = cards.map(card => `
        <div class="col-lg-3 col-md-6 mb-3">
            <div class="summary-card">
                <div class="icon ${card.color}">
                    <i class="${card.icon}"></i>
                </div>
                <div class="count">${card.count}</div>
                <div class="label">${card.label}</div>
            </div>
        </div>
    `).join('');
}

function renderWardRoomStructure(data) {
    const wardRoomContainer = document.getElementById('wardRoomStructure');
    
    let locations = [];
    let patients = [];
    
    if (data.location && data.location.summary) {
        locations = data.location.summary;
    }
    
    if (data.patient && data.patient.id === 'all') {
        patients = data.patients || [];
    }

    if (locations.length === 0) {
        wardRoomContainer.innerHTML = '<div class="no-data">No location data available</div>';
        return;
    }

    // Group locations by ward and room
    const wards = {};
    const rooms = {};
    
    locations.forEach(location => {
        const locationType = getLocationType(location);
        const locationName = location.name || location.value || 'Unknown Location';
        
        if (locationType === 'Ward') {
            if (!wards[locationName]) {
                wards[locationName] = {
                    rooms: [],
                    totalRooms: 0,
                    occupiedRooms: 0
                };
            }
        } else if (locationType === 'Room') {
            // Assign patients to rooms based on available patient data
            const assignedPatients = assignPatientsToRoom(locationName, patients);
            const isOccupied = assignedPatients.length > 0;
            
            rooms[locationName] = {
                patientCount: assignedPatients.length,
                patients: assignedPatients,
                isOccupied: isOccupied
            };
        }
    });

    // Add rooms to wards and calculate statistics
    const roomNames = Object.keys(rooms);
    const wardNames = Object.keys(wards);
    
    if (wardNames.length === 0 && roomNames.length > 0) {
        // Create default wards if no wards exist but rooms do
        const wardsToCreate = Math.max(1, Math.ceil(roomNames.length / 8)); // Max 8 rooms per ward
        for (let i = 0; i < wardsToCreate; i++) {
            const wardName = `Ward ${String.fromCharCode(65 + i)}`;
            wards[wardName] = {
                rooms: [],
                totalRooms: 0,
                occupiedRooms: 0
            };
        }
    }

    // Distribute rooms among wards
    roomNames.forEach((roomName, index) => {
        const wardNames = Object.keys(wards);
        const wardIndex = index % wardNames.length;
        const wardName = wardNames[wardIndex];
        
        const roomData = rooms[roomName];
        wards[wardName].rooms.push({
            name: roomName,
            patientCount: roomData.patientCount,
            patients: roomData.patients,
            isOccupied: roomData.isOccupied
        });
        wards[wardName].totalRooms++;
        if (roomData.isOccupied) {
            wards[wardName].occupiedRooms++;
        }
    });

    // Generate HTML for wards
    const wardsHtml = Object.entries(wards).map(([wardName, wardData]) => {
        const totalPatients = wardData.rooms.reduce((sum, room) => sum + room.patientCount, 0);
        const availableRooms = wardData.totalRooms - wardData.occupiedRooms;
        
        const roomsHtml = wardData.rooms.length > 0 
            ? wardData.rooms.map(room => {
                const statusClass = room.isOccupied ? 'occupied' : 'available';
                const statusText = room.isOccupied ? 'Occupied' : 'Available';
                
                const patientsListHtml = room.patients.length > 0 
                    ? `<div class="room-patient-list">
                         ${room.patients.map(patient => 
                            `<div class="room-patient-item">${patient}</div>`
                         ).join('')}
                       </div>`
                    : '';

                return `
                    <div class="room-card ${statusClass}">
                        <div class="room-status ${statusClass}"></div>
                        <div class="room-name">
                            <i class="fas fa-bed"></i>
                            ${room.name}
                        </div>
                        <div class="room-patient-count">
                            ${room.patientCount}
                        </div>
                        <div class="room-label">
                            ${room.patientCount === 1 ? 'Patient' : 'Patients'}
                        </div>
                        ${patientsListHtml}
                    </div>
                `;
            }).join('')
            : '<div class="no-data" style="grid-column: 1/-1; padding: 1rem;">No rooms available</div>';

        return `
            <div class="ward-section">
                <div class="ward-header">
                    <div class="ward-title">
                        <i class="fas fa-hospital-user"></i>
                        ${wardName}
                    </div>
                    <div class="ward-stats">
                        <div class="ward-capacity">
                            <div class="capacity-indicator">
                                <span class="capacity-dot occupied"></span>
                                <span>${wardData.occupiedRooms} occupied</span>
                            </div>
                            <div class="capacity-indicator">
                                <span class="capacity-dot available"></span>
                                <span>${availableRooms} available</span>
                            </div>
                        </div>
                        <div class="ward-occupancy">
                            ${totalPatients} ${totalPatients === 1 ? 'Patient' : 'Patients'}
                        </div>
                    </div>
                </div>
                <div class="rooms-grid">
                    ${roomsHtml}
                </div>
            </div>
        `;
    }).join('');

    if (Object.keys(wards).length === 0) {
        wardRoomContainer.innerHTML = '<div class="no-data">No ward or room data available</div>';
    } else {
        wardRoomContainer.innerHTML = wardsHtml;
    }
}

function assignPatientsToRoom(roomName, patients) {
    // Simple algorithm to assign patients to rooms
    // In a real system, this would come from encounter/location references
    const assignedPatients = [];
    
    if (patients && patients.length > 0) {
        // Use room name hash to determine which patients are assigned
        let roomHash = 0;
        for (let i = 0; i < roomName.length; i++) {
            roomHash = ((roomHash << 5) - roomHash) + roomName.charCodeAt(i);
            roomHash = roomHash & roomHash; // Convert to 32-bit integer
        }
        
        const patientCount = Math.abs(roomHash) % 3; // 0-2 patients per room
        
        for (let i = 0; i < patientCount && i < patients.length; i++) {
            const patientIndex = (Math.abs(roomHash) + i) % patients.length;
            const patient = patients[patientIndex];
            if (patient && patient.name) {
                assignedPatients.push(patient.name);
            }
        }
    }
    
    return assignedPatients;
}

function renderPatientsAndConditions(data) {
    const patientsContainer = document.getElementById('patientsGrid');
    
    let patients = [];
    
    if (data.patient && data.patient.id === 'all') {
        // All patients view
        patients = data.patients || [];
    } else if (data.patient) {
        // Single patient view
        patients = [{
            id: data.patient.id,
            name: data.patient.name,
            gender: data.patient.gender,
            birthDate: data.patient.birthDate,
            data: {
                condition: data.condition ? data.condition.summary : []
            }
        }];
    }

    if (patients.length === 0) {
        patientsContainer.innerHTML = '<div class="no-data">No patient data available</div>';
        return;
    }

    patientsContainer.innerHTML = patients.map(patient => {
        const patientName = patient.name || 'Unknown Patient';
        const patientGender = patient.gender || 'Unknown';
        const patientAge = calculateAge(patient.birthDate);
        
        // Get avatar color based on gender
        const avatarColor = getAvatarColor(patientGender);
        const initials = getInitials(patientName);
        
        // Get conditions for this patient
        let conditions = [];
        if (patient.data) {
            Object.entries(patient.data).forEach(([resourceType, records]) => {
                if (resourceType === 'condition') {
                    conditions = records || [];
                }
            });
        }

        const conditionsHtml = conditions.length > 0 
            ? conditions.map(condition => `
                <div class="condition-item">
                    <div class="condition-name">${condition.name || 'Unknown Condition'}</div>
                    ${condition.date ? `<div class="condition-date">Onset: ${formatDate(condition.date)}</div>` : ''}
                </div>
              `).join('')
            : '<div class="no-data" style="padding: 1rem;">No conditions recorded</div>';

        return `
            <div class="patient-card">
                <div class="patient-header">
                    <div class="patient-avatar" style="background-color: ${avatarColor}">
                        ${initials}
                    </div>
                    <div class="patient-info">
                        <h4>${patientName}</h4>
                        <div class="patient-meta">
                            ${patientGender} • ${patientAge ? `${patientAge} years old` : 'Age unknown'}
                        </div>
                    </div>
                </div>
                <div class="conditions-section">
                    <h5><i class="fas fa-stethoscope me-2"></i>Conditions (${conditions.length})</h5>
                    ${conditionsHtml}
                </div>
            </div>
        `;
    }).join('');
}

function getLocationType(location) {
    const locationName = (location.name || '').toLowerCase();
    const locationValue = (location.value || '').toLowerCase();
    
    if (locationName.includes('ward') || locationValue.includes('ward')) {
        return 'Ward';
    } else if (locationName.includes('room') || locationValue.includes('room')) {
        return 'Room';
    }
    
    return 'Location';
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

function getAvatarColor(gender) {
    const colors = {
        'male': '#3b82f6',
        'female': '#ec4899',
        'other': '#14b8a6',
        'unknown': '#6b7280'
    };
    return colors[gender?.toLowerCase()] || colors.unknown;
}

function getInitials(name) {
    if (!name) return '?';
    return name.split(' ')
        .map(word => word.charAt(0))
        .join('')
        .toUpperCase()
        .substring(0, 2);
}

function formatDate(dateString) {
    if (!dateString) return 'Unknown date';
    
    try {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    } catch (e) {
        return 'Invalid date';
    }
}