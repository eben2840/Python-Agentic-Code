document.addEventListener('DOMContentLoaded', function() {
    if (!window.PATIENT_DATA) {
        showNoData();
        return;
    }

    const data = window.PATIENT_DATA;
    
    // Check if we have all patients data
    if (data.patient && data.patient.id === 'all' && data.patients) {
        analyzeAllPatientsWards();
    } else if (data.patient && data.patient.id !== 'all') {
        analyzeSinglePatientWards();
    } else {
        showNoData();
    }
});

function analyzeAllPatientsWards() {
    const data = window.PATIENT_DATA;
    const wardMap = new Map();
    let totalPatients = 0;
    
    // Process each patient's location data
    data.patients.forEach(patient => {
        totalPatients++;
        
        if (patient.data && patient.data.locations) {
            patient.data.locations.forEach(location => {
                const ward = location.value || 'Unknown Ward';
                const room = location.name || 'Unknown Room';
                
                if (!wardMap.has(ward)) {
                    wardMap.set(ward, {
                        name: ward,
                        rooms: new Set(),
                        patients: []
                    });
                }
                
                wardMap.get(ward).rooms.add(room);
                wardMap.get(ward).patients.push({
                    name: patient.name,
                    room: room,
                    status: location.status || 'active'
                });
            });
        }
    });
    
    displayWardAnalysis(wardMap, totalPatients);
}

function analyzeSinglePatientWards() {
    const data = window.PATIENT_DATA;
    const wardMap = new Map();
    
    if (data.locations && data.locations.summary) {
        data.locations.summary.forEach(location => {
            const ward = location.value || 'Unknown Ward';
            const room = location.name || 'Unknown Room';
            
            if (!wardMap.has(ward)) {
                wardMap.set(ward, {
                    name: ward,
                    rooms: new Set(),
                    patients: []
                });
            }
            
            wardMap.get(ward).rooms.add(room);
            wardMap.get(ward).patients.push({
                name: data.patient.name,
                room: room,
                status: location.status || 'active'
            });
        });
    }
    
    displayWardAnalysis(wardMap, 1);
}

function displayWardAnalysis(wardMap, totalPatients) {
    const totalWards = wardMap.size;
    const totalRooms = Array.from(wardMap.values()).reduce((sum, ward) => sum + ward.rooms.size, 0);
    
    // Update summary statistics
    document.getElementById('totalWards').textContent = totalWards;
    document.getElementById('totalRooms').textContent = totalRooms;
    document.getElementById('totalPatients').textContent = totalPatients;
    
    // Display ward details
    const wardsList = document.getElementById('wardsList');
    
    if (totalWards === 0) {
        wardsList.innerHTML = `
            <div class="text-center py-4">
                <div class="icon-large mb-3">
                    <i class="fas fa-info-circle text-muted"></i>
                </div>
                <h6 class="mb-2">No Ward Information</h6>
                <p class="text-muted mb-0">No location data found for patients in the system.</p>
            </div>
        `;
        return;
    }
    
    let wardsHtml = '';
    
    // Sort wards by name
    const sortedWards = Array.from(wardMap.entries()).sort((a, b) => a[0].localeCompare(b[0]));
    
    sortedWards.forEach(([wardName, wardData]) => {
        const roomsArray = Array.from(wardData.rooms).sort();
        const patientCount = wardData.patients.length;
        
        wardsHtml += `
            <div class="ward-item">
                <div class="d-flex justify-content-between align-items-start mb-2">
                    <div class="ward-name">
                        <i class="fas fa-building me-2 text-teal"></i>
                        ${escapeHtml(wardName)}
                    </div>
                    <span class="badge bg-primary">${patientCount} patient${patientCount !== 1 ? 's' : ''}</span>
                </div>
                <div class="ward-rooms">
                    <strong>Rooms (${roomsArray.length}):</strong>
                    <div class="mt-1">
                        ${roomsArray.map(room => {
                            const occupiedPatients = wardData.patients.filter(p => p.room === room);
                            const isOccupied = occupiedPatients.length > 0;
                            return `<span class="room-badge ${isOccupied ? 'occupied' : ''}" title="${isOccupied ? `Occupied by: ${occupiedPatients.map(p => p.name).join(', ')}` : 'Available'}">${escapeHtml(room)}</span>`;
                        }).join('')}
                    </div>
                </div>
            </div>
        `;
    });
    
    wardsList.innerHTML = wardsHtml;
}

function showNoData() {
    // Hide main content and show no data message
    document.querySelector('.row').style.display = 'none';
    document.getElementById('noDataMessage').classList.remove('d-none');
    
    // Update stats to show 0
    document.getElementById('totalWards').textContent = '0';
    document.getElementById('totalRooms').textContent = '0';
    document.getElementById('totalPatients').textContent = '0';
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}