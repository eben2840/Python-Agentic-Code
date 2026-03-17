document.addEventListener('DOMContentLoaded', function() {
    const data = window.PATIENT_DATA;
    
    // Mock room data since patient data doesn't include room information
    const mockRooms = [
        { number: '101', type: 'Private', status: 'available', patient: null, admissionDate: null },
        { number: '102', type: 'Private', status: 'occupied', patient: 'John Smith', admissionDate: '2024-01-15' },
        { number: '103', type: 'Semi-Private', status: 'occupied', patient: 'Mary Johnson', admissionDate: '2024-01-18' },
        { number: '104', type: 'Private', status: 'available', patient: null, admissionDate: null },
        { number: '105', type: 'ICU', status: 'occupied', patient: 'Robert Davis', admissionDate: '2024-01-20' },
        { number: '106', type: 'Semi-Private', status: 'maintenance', patient: null, admissionDate: null },
        { number: '107', type: 'Private', status: 'available', patient: null, admissionDate: null },
        { number: '108', type: 'ICU', status: 'occupied', patient: 'Sarah Wilson', admissionDate: '2024-01-19' }
    ];

    let currentFilter = 'all';
    let rooms = mockRooms;

    // If patient data exists, add current patient to a room
    if (data && data.patient && data.patient.name) {
        rooms[1].patient = data.patient.name;
        rooms[1].status = 'occupied';
        rooms[1].admissionDate = '2024-01-21';
    }

    function updateStats() {
        const totalRooms = rooms.length;
        const availableRooms = rooms.filter(r => r.status === 'available').length;
        const occupiedRooms = rooms.filter(r => r.status === 'occupied').length;
        const occupancyRate = Math.round((occupiedRooms / totalRooms) * 100);

        document.getElementById('totalRooms').textContent = totalRooms;
        document.getElementById('totalPatients').textContent = occupiedRooms;
        document.getElementById('availableRooms').textContent = availableRooms;
        document.getElementById('occupiedRooms').textContent = occupiedRooms;
        document.getElementById('occupancyRate').textContent = occupancyRate + '%';
    }

    function renderRooms(filteredRooms = rooms) {
        const tbody = document.getElementById('roomsTableBody');
        
        if (filteredRooms.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="6" class="text-center py-4 text-muted">
                        <i class="fas fa-search me-2"></i>
                        No rooms found for current filter
                    </td>
                </tr>
            `;
            return;
        }

        tbody.innerHTML = filteredRooms.map(room => {
            const statusClass = room.status === 'available' ? 'status-available' : 
                               room.status === 'occupied' ? 'status-occupied' : 'status-maintenance';
            
            const statusIcon = room.status === 'available' ? 'fa-check-circle' : 
                              room.status === 'occupied' ? 'fa-user' : 'fa-tools';

            return `
                <tr>
                    <td class="ps-4">
                        <div class="d-flex align-items-center">
                            <i class="fas fa-door-open text-muted me-2"></i>
                            <span class="room-number">Room ${room.number}</span>
                        </div>
                    </td>
                    <td>
                        <span class="room-type">${room.type}</span>
                    </td>
                    <td>
                        <span class="status-badge ${statusClass}">
                            <i class="fas ${statusIcon} me-1"></i>
                            ${room.status.charAt(0).toUpperCase() + room.status.slice(1)}
                        </span>
                    </td>
                    <td>
                        ${room.patient ? `<span class="patient-name">${room.patient}</span>` : '<span class="text-muted">—</span>'}
                    </td>
                    <td>
                        ${room.admissionDate ? `<small class="text-muted">${new Date(room.admissionDate).toLocaleDateString()}</small>` : '<span class="text-muted">—</span>'}
                    </td>
                    <td>
                        <div class="d-flex gap-1">
                            <button class="btn btn-sm btn-outline-primary" title="View Details">
                                <i class="fas fa-eye"></i>
                            </button>
                            ${room.status === 'available' ? 
                                '<button class="btn btn-sm btn-outline-success" title="Assign Patient"><i class="fas fa-plus"></i></button>' : 
                                '<button class="btn btn-sm btn-outline-warning" title="Discharge"><i class="fas fa-sign-out-alt"></i></button>'
                            }
                        </div>
                    </td>
                </tr>
            `;
        }).join('');
    }

    window.filterRooms = function(filter) {
        currentFilter = filter;
        
        // Update button states
        document.querySelectorAll('.card-header button').forEach(btn => {
            btn.classList.remove('btn-primary', 'btn-success', 'btn-warning');
            btn.classList.add('btn-outline-primary', 'btn-outline-success', 'btn-outline-warning');
        });

        let filteredRooms = rooms;
        if (filter === 'available') {
            filteredRooms = rooms.filter(r => r.status === 'available');
        } else if (filter === 'occupied') {
            filteredRooms = rooms.filter(r => r.status === 'occupied');
        }

        renderRooms(filteredRooms);
    };

    // Initialize
    updateStats();
    renderRooms();
});