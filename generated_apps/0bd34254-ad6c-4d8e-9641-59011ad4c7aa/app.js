class WardRoomDirectory {
    constructor() {
        this.locations = [];
        this.filteredLocations = [];
        this.currentFilter = 'all';
        this.searchTerm = '';
        
        this.init();
    }
    
    init() {
        this.loadData();
        this.bindEvents();
        this.render();
    }
    
    loadData() {
        if (!window.PATIENT_DATA) {
            console.warn('No patient data available');
            return;
        }
        
        const data = window.PATIENT_DATA;
        
        // Handle single patient case
        if (data.patient && data.patient.id !== 'all') {
            this.locations = data.locations?.summary || [];
        }
        // Handle all patients case
        else if (data.patients) {
            // Get locations from the global locations data
            this.locations = data.locations?.summary || [];
        }
        // Handle direct locations data
        else if (data.locations) {
            this.locations = data.locations.summary || [];
        }
        
        // Process locations to determine type
        this.locations = this.locations.map(location => ({
            ...location,
            type: this.determineLocationType(location.name),
            displayName: location.name || 'Unknown Location',
            ward: location.value || 'Unassigned',
            status: location.status || 'active'
        }));
        
        this.filteredLocations = [...this.locations];
        this.updateStats();
    }
    
    determineLocationType(name) {
        if (!name) return 'unknown';
        
        const lowerName = name.toLowerCase();
        
        // Check for room indicators
        if (lowerName.includes('room') || /\d{3,4}/.test(name)) {
            return 'room';
        }
        
        // Check for ward indicators
        if (lowerName.includes('ward') || 
            lowerName.includes('unit') || 
            lowerName.includes('department') ||
            lowerName.includes('icu') ||
            lowerName.includes('er') ||
            lowerName.includes('surgery') ||
            lowerName.includes('oncology') ||
            lowerName.includes('pediatrics') ||
            lowerName.includes('maternity') ||
            lowerName.includes('geriatrics') ||
            lowerName.includes('psychiatry') ||
            lowerName.includes('dermatology') ||
            lowerName.includes('gastroenterology') ||
            lowerName.includes('endocrinology') ||
            lowerName.includes('pulmonology') ||
            lowerName.includes('rheumatology') ||
            lowerName.includes('nephrology') ||
            lowerName.includes('hematology') ||
            lowerName.includes('ophthalmology') ||
            lowerName.includes('neurology') ||
            lowerName.includes('orthopedics') ||
            lowerName.includes('infectious') ||
            lowerName.includes('ent')) {
            return 'ward';
        }
        
        return 'ward'; // Default to ward for generic entries
    }
    
    updateStats() {
        const totalLocations = this.locations.length;
        const totalWards = this.locations.filter(loc => loc.type === 'ward').length;
        const totalRooms = this.locations.filter(loc => loc.type === 'room').length;
        
        document.getElementById('totalLocations').textContent = totalLocations;
        document.getElementById('totalWards').textContent = totalWards;
        document.getElementById('totalRooms').textContent = totalRooms;
    }
    
    bindEvents() {
        // Search functionality
        const searchInput = document.getElementById('searchInput');
        searchInput.addEventListener('input', (e) => {
            this.searchTerm = e.target.value.toLowerCase();
            this.applyFilters();
        });
        
        // Filter buttons
        const filterButtons = document.querySelectorAll('.btn-filter');
        filterButtons.forEach(button => {
            button.addEventListener('click', (e) => {
                // Remove active class from all buttons
                filterButtons.forEach(btn => btn.classList.remove('active'));
                // Add active class to clicked button
                e.target.classList.add('active');
                
                this.currentFilter = e.target.dataset.filter;
                this.applyFilters();
            });
        });
    }
    
    applyFilters() {
        this.filteredLocations = this.locations.filter(location => {
            // Apply type filter
            const typeMatch = this.currentFilter === 'all' || location.type === this.currentFilter;
            
            // Apply search filter
            const searchMatch = !this.searchTerm || 
                location.displayName.toLowerCase().includes(this.searchTerm) ||
                location.ward.toLowerCase().includes(this.searchTerm) ||
                location.type.toLowerCase().includes(this.searchTerm);
            
            return typeMatch && searchMatch;
        });
        
        this.render();
    }
    
    render() {
        const container = document.getElementById('locationsContainer');
        const noDataMessage = document.getElementById('noDataMessage');
        
        if (this.filteredLocations.length === 0) {
            container.innerHTML = '';
            noDataMessage.style.display = 'block';
            return;
        }
        
        noDataMessage.style.display = 'none';
        
        const html = this.filteredLocations.map(location => this.renderLocationCard(location)).join('');
        container.innerHTML = html;
    }
    
    renderLocationCard(location) {
        const iconClass = location.type === 'ward' ? 'fa-building' : 'fa-door-open';
        const typeLabel = location.type.charAt(0).toUpperCase() + location.type.slice(1);
        
        return `
            <div class="col-12 col-md-6 col-lg-4">
                <div class="location-card">
                    <div class="location-header">
                        <div class="location-title">
                            <div class="location-icon ${location.type}">
                                <i class="fas ${iconClass}"></i>
                            </div>
                            <div>
                                <h3 class="location-name">${this.escapeHtml(location.displayName)}</h3>
                                <p class="location-type">${typeLabel}</p>
                            </div>
                        </div>
                        <span class="status-badge ${location.status}">
                            ${location.status}
                        </span>
                    </div>
                    
                    <div class="location-details">
                        ${location.type === 'room' && location.ward ? `
                            <div class="detail-item">
                                <i class="fas fa-building detail-icon"></i>
                                <span class="detail-label">Ward:</span>
                                <span class="detail-value">${this.escapeHtml(location.ward)}</span>
                            </div>
                        ` : ''}
                        
                        <div class="detail-item">
                            <i class="fas fa-tag detail-icon"></i>
                            <span class="detail-label">Type:</span>
                            <span class="detail-value">${typeLabel}</span>
                        </div>
                        
                        <div class="detail-item">
                            <i class="fas fa-circle detail-icon"></i>
                            <span class="detail-label">Status:</span>
                            <span class="detail-value">${location.status}</span>
                        </div>
                        
                        ${location.type === 'ward' ? `
                            <div class="detail-item">
                                <i class="fas fa-door-open detail-icon"></i>
                                <span class="detail-label">Rooms:</span>
                                <span class="detail-value">${this.getRoomCount(location.displayName)}</span>
                            </div>
                        ` : ''}
                    </div>
                </div>
            </div>
        `;
    }
    
    getRoomCount(wardName) {
        return this.locations.filter(loc => 
            loc.type === 'room' && 
            loc.ward.toLowerCase().includes(wardName.toLowerCase())
        ).length;
    }
    
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}

// Initialize the application when the DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new WardRoomDirectory();
});

// Handle data updates if needed
window.addEventListener('patientDataUpdated', () => {
    new WardRoomDirectory();
});