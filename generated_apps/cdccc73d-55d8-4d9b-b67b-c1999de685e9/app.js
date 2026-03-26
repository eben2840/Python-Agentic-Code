class HospitalFacilityApp {
    constructor() {
        this.locations = [];
        this.wards = new Map();
        this.patients = [];
        this.filteredData = [];
        
        this.init();
    }

    init() {
        this.loadData();
        this.setupEventListeners();
        this.render();
    }

    loadData() {
        if (!window.PATIENT_DATA) {
            this.showNoData();
            return;
        }

        // Load locations from standalone resource
        if (window.PATIENT_DATA.location && window.PATIENT_DATA.location.summary) {
            this.locations = window.PATIENT_DATA.location.summary.map(loc => ({
                name: loc.name || 'Unknown Location',
                ward: loc.value || 'Unknown Ward',
                status: loc.status || 'unknown'
            }));
        }

        // Load patients to determine room occupancy
        if (window.PATIENT_DATA.patients) {
            this.patients = window.PATIENT_DATA.patients;
        }

        this.processWardData();
        this.filteredData = Array.from(this.wards.values());
    }

    processWardData() {
        // Group locations by ward
        this.locations.forEach(location => {
            const wardName = this.extractWardName(location.name, location.ward);
            const roomName = this.extractRoomName(location.name);
            
            if (!this.wards.has(wardName)) {
                this.wards.set(wardName, {
                    name: wardName,
                    rooms: [],
                    totalRooms: 0,
                    occupiedRooms: 0,
                    availableRooms: 0,
                    activeRooms: 0
                });
            }

            const ward = this.wards.get(wardName);
            
            // Determine if room is occupied (simplified logic)
            const isOccupied = this.isRoomOccupied(roomName, wardName);
            
            const room = {
                name: roomName,
                fullName: location.name,
                status: location.status,
                occupied: isOccupied,
                ward: wardName
            };

            ward.rooms.push(room);
            ward.totalRooms++;
            
            if (location.status === 'active') {
                ward.activeRooms++;
            }
            
            if (isOccupied) {
                ward.occupiedRooms++;
            } else {
                ward.availableRooms++;
            }
        });
    }

    extractWardName(locationName, wardValue) {
        // Try to extract ward name from location name or use ward value
        if (locationName.includes('Ward')) {
            const parts = locationName.split(' ');
            const wardIndex = parts.findIndex(part => part === 'Ward');
            if (wardIndex > 0) {
                return parts.slice(0, wardIndex + 1).join(' ') + (parts[wardIndex + 1] ? ' ' + parts[wardIndex + 1] : '');
            }
        }
        
        if (wardValue && wardValue !== 'Unknown Ward') {
            return wardValue;
        }
        
        // Fallback: try to extract from location name
        if (locationName.includes('Ward')) {
            return locationName.split(' Room')[0];
        }
        
        return 'General Ward';
    }

    extractRoomName(locationName) {
        // Extract room name from location
        if (locationName.includes('Room ')) {
            const roomPart = locationName.split('Room ')[1];
            return roomPart ? `Room ${roomPart}` : locationName;
        }
        
        // If it's just a room number or name
        if (locationName.match(/^(Room\s+)?\d+[A-Z]?$/i)) {
            return locationName.startsWith('Room') ? locationName : `Room ${locationName}`;
        }
        
        return locationName;
    }

    isRoomOccupied(roomName, wardName) {
        // Simplified occupancy logic - in real app, this would check actual patient assignments
        // For demo purposes, randomly assign some rooms as occupied
        const hash = this.simpleHash(roomName + wardName);
        return hash % 3 === 0; // Roughly 1/3 of rooms occupied
    }

    simpleHash(str) {
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
            const char = str.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash; // Convert to 32-bit integer
        }
        return Math.abs(hash);
    }

    setupEventListeners() {
        const wardFilter = document.getElementById('wardFilter');
        const statusFilter = document.getElementById('statusFilter');
        const searchInput = document.getElementById('searchInput');

        if (wardFilter) {
            wardFilter.addEventListener('change', () => this.applyFilters());
        }
        
        if (statusFilter) {
            statusFilter.addEventListener('change', () => this.applyFilters());
        }
        
        if (searchInput) {
            searchInput.addEventListener('input', () => this.applyFilters());
        }
    }

    applyFilters() {
        const wardFilter = document.getElementById('wardFilter')?.value || '';
        const statusFilter = document.getElementById('statusFilter')?.value || '';
        const searchTerm = document.getElementById('searchInput')?.value.toLowerCase() || '';

        this.filteredData = Array.from(this.wards.values()).filter(ward => {
            // Ward filter
            if (wardFilter && ward.name !== wardFilter) {
                return false;
            }

            // Filter rooms within ward
            ward.filteredRooms = ward.rooms.filter(room => {
                // Status filter
                if (statusFilter && room.status !== statusFilter) {
                    return false;
                }

                // Search filter
                if (searchTerm && !room.name.toLowerCase().includes(searchTerm) && 
                    !room.fullName.toLowerCase().includes(searchTerm)) {
                    return false;
                }

                return true;
            });

            // Show ward if it has matching rooms or no specific filters applied
            return ward.filteredRooms.length > 0 || (!statusFilter && !searchTerm);
        });

        this.renderWards();
    }

    render() {
        this.updateStats();
        this.populateFilters();
        this.renderWards();
    }

    updateStats() {
        const totalWards = this.wards.size;
        const totalRooms = Array.from(this.wards.values()).reduce((sum, ward) => sum + ward.totalRooms, 0);
        const occupiedRooms = Array.from(this.wards.values()).reduce((sum, ward) => sum + ward.occupiedRooms, 0);
        const availableRooms = totalRooms - occupiedRooms;

        document.getElementById('totalWards').textContent = totalWards;
        document.getElementById('totalRooms').textContent = totalRooms;
        document.getElementById('occupiedRooms').textContent = occupiedRooms;
        document.getElementById('availableRooms').textContent = availableRooms;
    }

    populateFilters() {
        const wardFilter = document.getElementById('wardFilter');
        if (wardFilter) {
            // Clear existing options except "All Wards"
            wardFilter.innerHTML = '<option value="">All Wards</option>';
            
            // Add ward options
            Array.from(this.wards.keys()).sort().forEach(wardName => {
                const option = document.createElement('option');
                option.value = wardName;
                option.textContent = wardName;
                wardFilter.appendChild(option);
            });
        }
    }

    renderWards() {
        const container = document.getElementById('wardsContainer');
        const noDataMessage = document.getElementById('noDataMessage');
        
        if (!container) return;

        if (this.filteredData.length === 0) {
            container.innerHTML = '';
            if (noDataMessage) {
                noDataMessage.style.display = 'block';
            }
            return;
        }

        if (noDataMessage) {
            noDataMessage.style.display = 'none';
        }

        container.innerHTML = this.filteredData.map(ward => this.renderWardCard(ward)).join('');
    }

    renderWardCard(ward) {
        const roomsToShow = ward.filteredRooms || ward.rooms;
        const occupancyRate = ward.totalRooms > 0 ? Math.round((ward.occupiedRooms / ward.totalRooms) * 100) : 0;

        return `
            <div class="col-12 col-lg-6 col-xl-4">
                <div class="ward-card">
                    <div class="ward-header">
                        <div class="ward-title">${this.escapeHtml(ward.name)}</div>
                        <div class="ward-subtitle">${ward.totalRooms} rooms • ${occupancyRate}% occupied</div>
                        <div class="ward-stats">
                            <div class="ward-stat">
                                <div class="ward-stat-number">${ward.totalRooms}</div>
                                <div class="ward-stat-label">Total</div>
                            </div>
                            <div class="ward-stat">
                                <div class="ward-stat-number">${ward.occupiedRooms}</div>
                                <div class="ward-stat-label">Occupied</div>
                            </div>
                            <div class="ward-stat">
                                <div class="ward-stat-number">${ward.availableRooms}</div>
                                <div class="ward-stat-label">Available</div>
                            </div>
                            <div class="ward-stat">
                                <div class="ward-stat-number">${ward.activeRooms}</div>
                                <div class="ward-stat-label">Active</div>
                            </div>
                        </div>
                    </div>
                    <div class="rooms-grid">
                        ${roomsToShow.length > 0 ? 
                            roomsToShow.map(room => this.renderRoomCard(room)).join('') :
                            '<div class="no-rooms-message">No rooms match current filters</div>'
                        }
                    </div>
                </div>
            </div>
        `;
    }

    renderRoomCard(room) {
        return `
            <div class="room-card ${room.occupied ? 'occupied' : ''}">
                <div class="occupancy-indicator ${room.occupied ? 'occupied' : ''}"></div>
                <div class="room-name">${this.escapeHtml(room.name)}</div>
                <div class="room-status">
                    <span class="status-badge ${room.status}">
                        <i class="fas fa-circle"></i>
                        ${room.status}
                    </span>
                </div>
                <div class="mt-2">
                    <small class="text-muted">
                        ${room.occupied ? 
                            '<i class="fas fa-user text-danger"></i> Occupied' : 
                            '<i class="fas fa-check text-success"></i> Available'
                        }
                    </small>
                </div>
            </div>
        `;
    }

    showNoData() {
        const container = document.getElementById('wardsContainer');
        const noDataMessage = document.getElementById('noDataMessage');
        
        if (container) {
            container.innerHTML = '';
        }
        
        if (noDataMessage) {
            noDataMessage.style.display = 'block';
        }

        // Reset stats
        document.getElementById('totalWards').textContent = '0';
        document.getElementById('totalRooms').textContent = '0';
        document.getElementById('occupiedRooms').textContent = '0';
        document.getElementById('availableRooms').textContent = '0';
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}

// Initialize the app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new HospitalFacilityApp();
});