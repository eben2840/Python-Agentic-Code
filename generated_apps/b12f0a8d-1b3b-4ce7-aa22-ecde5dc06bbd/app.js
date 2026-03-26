document.addEventListener('DOMContentLoaded', function() {
    if (!window.PATIENT_DATA) {
        console.error('Patient data not available');
        return;
    }

    const data = window.PATIENT_DATA;
    
    // Get locations data
    let locations = [];
    
    if (data.patient && data.patient.id === 'all') {
        // All patients view - get locations from data.locations if available
        if (data.locations && data.locations.summary) {
            locations = data.locations.summary;
        }
    } else {
        // Single patient view - check if locations exist
        if (data.locations && data.locations.summary) {
            locations = data.locations.summary;
        }
    }

    // Process locations data
    const wards = [];
    const rooms = [];
    const allLocations = [];

    locations.forEach(location => {
        const locationData = {
            name: location.name || 'Unknown Location',
            value: location.value || '',
            status: location.status || 'unknown'
        };

        allLocations.push(locationData);

        // Categorize by name patterns
        const name = locationData.name.toLowerCase();
        if (name.includes('ward') && !name.includes('room')) {
            wards.push(locationData);
        } else if (name.includes('room') || name.match(/^\d+$/)) {
            rooms.push(locationData);
        }
    });

    // Update statistics
    document.getElementById('totalLocations').textContent = allLocations.length;
    document.getElementById('totalWards').textContent = wards.length;
    document.getElementById('totalRooms').textContent = rooms.length;

    // Render wards
    renderLocationsList('wardsList', wards, 'ward');
    
    // Render rooms
    renderLocationsList('roomsList', rooms, 'room');
    
    // Render all locations
    renderAllLocations('allLocationsList', allLocations);
});

function renderLocationsList(containerId, locations, type) {
    const container = document.getElementById(containerId);
    
    if (!locations || locations.length === 0) {
        container.innerHTML = `<div class="no-data">No ${type} data available</div>`;
        return;
    }

    const html = locations.map(location => `
        <div class="location-item">
            <div>
                <div class="location-name">${escapeHtml(location.name)}</div>
                ${location.value ? `<div class="location-type">${escapeHtml(location.value)}</div>` : ''}
            </div>
            <div class="location-status status-${location.status}">
                ${escapeHtml(location.status)}
            </div>
        </div>
    `).join('');

    container.innerHTML = html;
}

function renderAllLocations(containerId, locations) {
    const container = document.getElementById(containerId);
    
    if (!locations || locations.length === 0) {
        container.innerHTML = '<div class="no-data">No location data available</div>';
        return;
    }

    const html = locations.map(location => `
        <div class="grid-item">
            <div class="d-flex justify-content-between align-items-start mb-2">
                <div class="location-name">${escapeHtml(location.name)}</div>
                <div class="location-status status-${location.status}">
                    ${escapeHtml(location.status)}
                </div>
            </div>
            ${location.value ? `<div class="location-type">${escapeHtml(location.value)}</div>` : ''}
        </div>
    `).join('');

    container.innerHTML = html;
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}