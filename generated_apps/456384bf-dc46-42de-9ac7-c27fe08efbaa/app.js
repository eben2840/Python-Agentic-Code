document.addEventListener('DOMContentLoaded', function() {
    const data = window.PATIENT_DATA;
    if (!data || !data.encounters) { 
        document.getElementById('encountersTable').innerHTML = '<tr><td colspan="6" class="text-center py-4 text-muted">No encounter data available</td></tr>';
        return; 
    }

    let encounters = data.encounters.summary || [];
    
    function updateStats() {
        const total = encounters.length;
        const currentMonth = new Date().getMonth();
        const currentYear = new Date().getFullYear();
        
        const thisMonth = encounters.filter(enc => {
            const encDate = new Date(enc.date);
            return encDate.getMonth() === currentMonth && encDate.getFullYear() === currentYear;
        }).length;
        
        const providers = new Set(encounters.map(enc => enc.provider || 'Unknown')).size;
        const types = new Set(encounters.map(enc => enc.type || 'Unknown')).size;
        
        document.getElementById('totalEncounters').textContent = total;
        document.getElementById('recentEncounters').textContent = thisMonth;
        document.getElementById('uniqueProviders').textContent = providers;
        document.getElementById('encounterTypes').textContent = types;
    }

    function getStatusBadge(status) {
        const statusClass = {
            'finished': 'status-finished',
            'in-progress': 'status-in-progress',
            'cancelled': 'status-cancelled',
            'planned': 'status-planned'
        };
        
        const className = statusClass[status?.toLowerCase()] || 'status-finished';
        return `<span class="status-badge ${className}">${status || 'Completed'}</span>`;
    }

    function formatDate(dateString) {
        if (!dateString) return 'N/A';
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', { 
            year: 'numeric', 
            month: 'short', 
            day: 'numeric' 
        });
    }

    function formatDuration(start, end) {
        if (!start || !end) return 'N/A';
        const startTime = new Date(start);
        const endTime = new Date(end);
        const diffMs = endTime - startTime;
        const diffMins = Math.round(diffMs / (1000 * 60));
        
        if (diffMins < 60) return `${diffMins} min`;
        const hours = Math.floor(diffMins / 60);
        const mins = diffMins % 60;
        return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
    }

    function renderEncounters() {
        const tbody = document.getElementById('encountersTable');
        
        if (encounters.length === 0) {
            tbody.innerHTML = '<tr><td colspan="6" class="text-center py-4 text-muted">No encounters found</td></tr>';
            return;
        }

        tbody.innerHTML = encounters.map(encounter => `
            <tr>
                <td class="ps-4">
                    <div class="encounter-date">${formatDate(encounter.date)}</div>
                </td>
                <td>
                    <div class="encounter-type">${encounter.type || 'General Visit'}</div>
                </td>
                <td>
                    ${getStatusBadge(encounter.status)}
                </td>
                <td>
                    <div class="provider-name">${encounter.provider || 'Unknown Provider'}</div>
                </td>
                <td>
                    <div class="location-text">${encounter.location || 'Not specified'}</div>
                </td>
                <td>
                    <div class="text-muted">${formatDuration(encounter.start, encounter.end)}</div>
                </td>
            </tr>
        `).join('');
    }

    window.sortEncounters = function(sortBy) {
        if (sortBy === 'date') {
            encounters.sort((a, b) => new Date(b.date) - new Date(a.date));
        } else if (sortBy === 'type') {
            encounters.sort((a, b) => (a.type || '').localeCompare(b.type || ''));
        }
        renderEncounters();
    };

    updateStats();
    renderEncounters();
});