document.addEventListener('DOMContentLoaded', function() {
    // Check if patient data is available
    if (!window.PATIENT_DATA) {
        showNoDataMessage();
        return;
    }

    const data = window.PATIENT_DATA;
    let locations = [];

    // Extract locations data
    if (data.patient && data.patient.id === 'all') {
        // All patients view - get locations from the global locations data
        if (data.locations && data.locations.summary) {
            locations = data.locations.summary;
        }
    } else {
        // Single patient view - check if locations exist
        if (data.locations && data.locations.summary) {
            locations = data.locations.summary;
        }
    }

    if (!locations || locations.length === 0) {
        showNoDataMessage();
        return;
    }

    // Update summary statistics
    updateSummaryStats(locations);

    // Render locations table
    renderLocationsTable(locations);

    // Setup sorting functionality
    setupSorting(locations);
});

function updateSummaryStats(locations) {
    const totalLocations = locations.length;
    const activeLocations = locations.filter(loc => loc.status === 'active').length;
    
    // Extract unique wards/departments
    const uniqueWards = new Set();
    locations.forEach(location => {
        if (location.value && location.value.trim()) {
            uniqueWards.add(location.value.trim());
        }
    });

    document.getElementById('total-locations').textContent = totalLocations;
    document.getElementById('active-locations').textContent = activeLocations;
    document.getElementById('unique-wards').textContent = uniqueWards.size;
}

function renderLocationsTable(locations) {
    const tbody = document.getElementById('locations-table-body');
    tbody.innerHTML = '';

    locations.forEach(location => {
        const row = document.createElement('tr');
        
        const statusBadge = location.status === 'active' 
            ? '<span class="badge badge-success"><i class="fas fa-check-circle me-1"></i>Active</span>'
            : '<span class="badge badge-warning"><i class="fas fa-exclamation-triangle me-1"></i>Inactive</span>';

        const wardName = location.value && location.value.trim() 
            ? location.value.trim() 
            : '<span class="text-muted">Not specified</span>';

        row.innerHTML = `
            <td class="ps-4">
                <div class="d-flex align-items-center">
                    <i class="fas fa-map-marker-alt me-2 text-teal"></i>
                    <strong>${location.name || 'Unnamed Location'}</strong>
                </div>
            </td>
            <td>
                <div class="d-flex align-items-center">
                    <i class="fas fa-hospital me-2 text-muted"></i>
                    ${wardName}
                </div>
            </td>
            <td>${statusBadge}</td>
        `;

        tbody.appendChild(row);
    });
}

function setupSorting(locations) {
    const sortNameBtn = document.getElementById('sort-name');
    const sortWardBtn = document.getElementById('sort-ward');
    let currentSort = { field: null, direction: 'asc' };

    sortNameBtn.addEventListener('click', function() {
        sortLocations(locations, 'name');
        updateSortButtons('name');
    });

    sortWardBtn.addEventListener('click', function() {
        sortLocations(locations, 'ward');
        updateSortButtons('ward');
    });

    function sortLocations(locations, field) {
        const direction = currentSort.field === field && currentSort.direction === 'asc' ? 'desc' : 'asc';
        
        locations.sort((a, b) => {
            let valueA, valueB;
            
            if (field === 'name') {
                valueA = (a.name || '').toLowerCase();
                valueB = (b.name || '').toLowerCase();
            } else if (field === 'ward') {
                valueA = (a.value || '').toLowerCase();
                valueB = (b.value || '').toLowerCase();
            }
            
            if (direction === 'asc') {
                return valueA.localeCompare(valueB);
            } else {
                return valueB.localeCompare(valueA);
            }
        });

        currentSort = { field, direction };
        renderLocationsTable(locations);
    }

    function updateSortButtons(activeField) {
        sortNameBtn.classList.remove('active');
        sortWardBtn.classList.remove('active');
        
        if (activeField === 'name') {
            sortNameBtn.classList.add('active');
            const icon = sortNameBtn.querySelector('i');
            icon.className = currentSort.direction === 'asc' ? 'fas fa-sort-alpha-down me-1' : 'fas fa-sort-alpha-up me-1';
        } else if (activeField === 'ward') {
            sortWardBtn.classList.add('active');
            const icon = sortWardBtn.querySelector('i');
            icon.className = currentSort.direction === 'asc' ? 'fas fa-sort-down me-1' : 'fas fa-sort-up me-1';
        }
    }
}

function showNoDataMessage() {
    document.querySelector('.card:not(#no-data-card)').classList.add('d-none');
    document.getElementById('no-data-card').classList.remove('d-none');
    
    // Set stats to 0
    document.getElementById('total-locations').textContent = '0';
    document.getElementById('active-locations').textContent = '0';
    document.getElementById('unique-wards').textContent = '0';
}