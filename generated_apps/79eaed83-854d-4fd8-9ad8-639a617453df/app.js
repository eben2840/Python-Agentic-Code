document.addEventListener('DOMContentLoaded', function() {
    let allLocations = [];
    let filteredLocations = [];
    let currentFilter = 'all';

    // Initialize the app
    function init() {
        loadLocationData();
        setupEventListeners();
        renderLocations();
        updateStatistics();
    }

    // Load location data from window.PATIENT_DATA
    function loadLocationData() {
        if (!window.PATIENT_DATA || !window.PATIENT_DATA.locations || !window.PATIENT_DATA.locations.summary) {
            console.warn('No location data available');
            showNoDataMessage();
            return;
        }

        allLocations = window.PATIENT_DATA.locations.summary.map((location, index) => {
            // Determine location type based on name
            let type = 'other';
            let displayName = location.name || `Location ${index + 1}`;
            let ward = location.value || '';
            
            if (location.name && location.name.toLowerCase().includes('ward')) {
                type = 'ward';
            } else if (location.name && location.name.toLowerCase().includes('room')) {
                type = 'room';
            }

            return {
                id: index,
                name: displayName,
                ward: ward,
                type: type,
                status: location.status || 'active'
            };
        });

        filteredLocations = [...allLocations];
    }

    // Setup event listeners
    function setupEventListeners() {
        document.getElementById('filterWards').addEventListener('click', () => filterLocations('ward'));
        document.getElementById('filterRooms').addEventListener('click', () => filterLocations('room'));
        document.getElementById('showAll').addEventListener('click', () => filterLocations('all'));
    }

    // Filter locations by type
    function filterLocations(type) {
        currentFilter = type;
        
        if (type === 'all') {
            filteredLocations = [...allLocations];
        } else {
            filteredLocations = allLocations.filter(location => location.type === type);
        }
        
        renderLocations();
        updateFilterButtons();
    }

    // Update filter button states
    function updateFilterButtons() {
        const buttons = {
            'ward': document.getElementById('filterWards'),
            'room': document.getElementById('filterRooms'),
            'all': document.getElementById('showAll')
        };

        Object.entries(buttons).forEach(([type, button]) => {
            if (type === currentFilter) {
                button.classList.remove('btn-outline-secondary', 'btn-outline-primary');
                button.classList.add('btn-primary');
            } else {
                button.classList.remove('btn-primary');
                if (type === 'all') {
                    button.classList.add('btn-outline-primary');
                } else {
                    button.classList.add('btn-outline-secondary');
                }
            }
        });
    }

    // Render locations list
    function renderLocations() {
        const wardList = document.getElementById('wardList');
        const noDataMessage = document.getElementById('noDataMessage');

        if (filteredLocations.length === 0) {
            wardList.innerHTML = '';
            noDataMessage.classList.remove('d-none');
            return;
        }

        noDataMessage.classList.add('d-none');

        const locationItems = filteredLocations.map(location => {
            const iconClass = getLocationIcon(location.type);
            const statusClass = location.status === 'active' ? 'status-active' : 'status-inactive';
            
            return `
                <div class="list-group-item">
                    <div class="location-item">
                        <div class="location-info">
                            <div class="location-icon ${location.type}">
                                <i class="${iconClass}"></i>
                            </div>
                            <div class="location-details">
                                <h6>${escapeHtml(location.name)}</h6>
                                <p>${location.ward ? escapeHtml(location.ward) : 'No ward specified'}</p>
                            </div>
                        </div>
                        <div class="status-badge ${statusClass}">
                            ${location.status}
                        </div>
                    </div>
                </div>
            `;
        }).join('');

        wardList.innerHTML = locationItems;
    }

    // Get icon class for location type
    function getLocationIcon(type) {
        switch (type) {
            case 'ward':
                return 'fas fa-bed';
            case 'room':
                return 'fas fa-door-open';
            default:
                return 'fas fa-map-marker-alt';
        }
    }

    // Update statistics
    function updateStatistics() {
        const totalWards = allLocations.filter(loc => loc.type === 'ward').length;
        const totalRooms = allLocations.filter(loc => loc.type === 'room').length;
        const activeLocations = allLocations.filter(loc => loc.status === 'active').length;

        document.getElementById('totalWards').textContent = totalWards;
        document.getElementById('totalRooms').textContent = totalRooms;
        document.getElementById('activeLocations').textContent = activeLocations;
    }

    // Show no data message
    function showNoDataMessage() {
        const wardList = document.getElementById('wardList');
        const noDataMessage = document.getElementById('noDataMessage');
        
        wardList.innerHTML = '';
        noDataMessage.classList.remove('d-none');
        
        // Update statistics to show 0
        document.getElementById('totalWards').textContent = '0';
        document.getElementById('totalRooms').textContent = '0';
        document.getElementById('activeLocations').textContent = '0';
    }

    // Utility function to escape HTML
    function escapeHtml(text) {
        if (!text) return '';
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    // Initialize the application
    init();
});