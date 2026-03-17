document.addEventListener('DOMContentLoaded', function() {
    const data = window.PATIENT_DATA;
    
    // Mock room and patient data since PATIENT_DATA doesn't contain room info
    const mockRooms = [
        { number: '101', status: 'occupied', patient: 'John Doe', type: 'Standard' },
        { number: '102', status: 'available', patient: null, type: 'Standard' },
        { number: '103', status: 'occupied', patient: 'Jane Smith', type: 'Private' },
        { number: '104', status: 'maintenance', patient: null, type: 'Standard' },
        { number: '105', status: 'available', patient: null, type: 'ICU' },
        { number: '106', status: 'occupied', patient: 'Bob Johnson', type: 'Private' }
    ];

    const mockPatients = [
        { name: 'John Doe', room: '101', status: 'Stable', admitted: '2024-01-15' },
        { name: 'Jane Smith', room: '103', status: 'Critical', admitted: '2024-01-14' },
        { name: 'Bob Johnson', room: '106', status: 'Recovering', admitted: '2024-01-16' }
    ];

    function initializeApp() {
        displayRooms(mockRooms);
        displayPatients(mockPatients);
        updateStats(mockRooms, mockPatients);
    }

    function displayRooms(rooms) {
        const container = document.getElementById('roomsContainer');
        container.innerHTML = rooms.map(room => `
            <div class="col-md-4 col-lg-3">
                <div class="room-card ${room.status} p-3">
                    <div class="d-flex justify-content-between align-items-start mb-2">
                        <div class="room-number">Room ${room.number}</div>
                        <span class="room-status status-${room.status}">${room.status}</span>
                    </div>
                    <div class="text-muted mb-2">${room.type}</div>
                    ${room.patient ? `
                        <div class="d-flex align-items-center">
                            <div class="patient-avatar me-2">${room.patient.split(' ').map(n => n[0]).join('')}</div>
                            <small class="text-dark">${room.patient}</small>
                        </div>
                    ` : '<small class="text-muted">No patient assigned</small>'}
                </div>
            </div>
        `).join('');
    }

    function displayPatients(patients) {
        const tbody = document.getElementById('patientsTable');
        tbody.innerHTML = patients.map(patient => `
            <tr>
                <td>
                    <div class="d-flex align-items-center">
                        <div class="patient-avatar me-2">${patient.name.split(' ').map(n => n[0]).join('')}</div>
                        <span>${patient.name}</span>
                    </div>
                </td>
                <td>
                    <span class="badge bg-light text-dark border">Room ${patient.room}</span>
                </td>
                <td>
                    <span class="badge ${getStatusBadgeClass(patient.status)}">${patient.status}</span>
                </td>
                <td>${new Date(patient.admitted).toLocaleDateString()}</td>
                <td>
                    <button class="btn btn-sm btn-outline-primary me-1">
                        <i class="fas fa-eye"></i>
                    </button>
                    <button class="btn btn-sm btn-outline-secondary">
                        <i class="fas fa-edit"></i>
                    </button>
                </td>
            </tr>
        `).join('');
    }

    function getStatusBadgeClass(status) {
        switch(status.toLowerCase()) {
            case 'critical': return 'bg-danger';
            case 'stable': return 'bg-success';
            case 'recovering': return 'bg-warning';
            default: return 'bg-secondary';
        }
    }

    function updateStats(rooms, patients) {
        document.getElementById('totalRooms').textContent = rooms.length;
        document.getElementById('totalPatients').textContent = patients.length;
    }

    window.refreshRooms = function() {
        initializeApp();
    };

    // Initialize the app
    initializeApp();
});