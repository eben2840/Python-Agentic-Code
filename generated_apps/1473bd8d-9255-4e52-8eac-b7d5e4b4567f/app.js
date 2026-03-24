document.addEventListener('DOMContentLoaded', function() {
    let allObservations = [];
    let filteredObservations = [];
    
    // DOM elements
    const totalObservationsEl = document.getElementById('totalObservations');
    const totalPatientsEl = document.getElementById('totalPatients');
    const recentObservationsEl = document.getElementById('recentObservations');
    const typeFilterEl = document.getElementById('typeFilter');
    const patientSearchEl = document.getElementById('patientSearch');
    const clearFiltersBtn = document.getElementById('clearFilters');
    const observationsContainer = document.getElementById('observationsContainer');
    const noDataContainer = document.getElementById('noDataContainer');

    function loadObservations() {
        allObservations = [];
        
        if (!window.PATIENT_DATA) {
            showNoData();
            return;
        }

        const data = window.PATIENT_DATA;
        
        // Handle single patient case
        if (data.patient && data.patient.id !== 'all') {
            if (data.observation) {
                data.observation.forEach(obs => {
                    allObservations.push({
                        ...obs,
                        patientName: data.patient.name || 'Unknown Patient',
                        patientId: data.patient.id
                    });
                });
            }
        }
        // Handle all patients case
        else if (data.patients && Array.isArray(data.patients)) {
            data.patients.forEach(patient => {
                if (patient.data && patient.data.observation) {
                    patient.data.observation.forEach(obs => {
                        allObservations.push({
                            ...obs,
                            patientName: patient.name || 'Unknown Patient',
                            patientId: patient.id
                        });
                    });
                }
            });
        }

        if (allObservations.length === 0) {
            showNoData();
            return;
        }

        populateFilters();
        updateStats();
        filteredObservations = [...allObservations];
        renderObservations();
    }

    function populateFilters() {
        // Get unique observation types
        const types = [...new Set(allObservations.map(obs => obs.name || 'Unknown Type'))].sort();
        
        typeFilterEl.innerHTML = '<option value="">All Types</option>';
        types.forEach(type => {
            const option = document.createElement('option');
            option.value = type;
            option.textContent = type;
            typeFilterEl.appendChild(option);
        });
    }

    function updateStats() {
        const uniquePatients = new Set(allObservations.map(obs => obs.patientId)).size;
        const now = new Date();
        const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        
        const recentCount = allObservations.filter(obs => {
            if (!obs.date) return false;
            const obsDate = new Date(obs.date);
            return obsDate >= yesterday;
        }).length;

        totalObservationsEl.textContent = allObservations.length;
        totalPatientsEl.textContent = uniquePatients;
        recentObservationsEl.textContent = recentCount;
    }

    function applyFilters() {
        const typeFilter = typeFilterEl.value.toLowerCase();
        const patientSearch = patientSearchEl.value.toLowerCase();

        filteredObservations = allObservations.filter(obs => {
            const matchesType = !typeFilter || (obs.name || '').toLowerCase().includes(typeFilter);
            const matchesPatient = !patientSearch || (obs.patientName || '').toLowerCase().includes(patientSearch);
            
            return matchesType && matchesPatient;
        });

        renderObservations();
    }

    function renderObservations() {
        if (filteredObservations.length === 0) {
            observationsContainer.style.display = 'none';
            noDataContainer.style.display = 'block';
            return;
        }

        observationsContainer.style.display = 'block';
        noDataContainer.style.display = 'none';

        // Sort by date (most recent first)
        const sortedObservations = filteredObservations.sort((a, b) => {
            const dateA = new Date(a.date || 0);
            const dateB = new Date(b.date || 0);
            return dateB - dateA;
        });

        observationsContainer.innerHTML = sortedObservations.map(obs => createObservationCard(obs)).join('');
    }

    function createObservationCard(obs) {
        const observationName = obs.name || 'Unknown Observation';
        const observationValue = obs.value || 'No value recorded';
        const patientName = obs.patientName || 'Unknown Patient';
        const observationDate = obs.date ? formatDate(obs.date) : 'No date recorded';
        const observationStatus = obs.status || '';

        return `
            <div class="col-12 col-lg-6 col-xl-4">
                <div class="observation-card">
                    <div class="observation-header">
                        <div>
                            <div class="observation-title">${escapeHtml(observationName)}</div>
                            <div class="observation-patient">
                                <i class="fas fa-user"></i>
                                ${escapeHtml(patientName)}
                            </div>
                        </div>
                        <div class="observation-date">
                            <i class="fas fa-clock"></i>
                            ${observationDate}
                        </div>
                    </div>
                    
                    <div class="observation-value">
                        <div class="observation-value-text">${escapeHtml(observationValue)}</div>
                        <div class="observation-value-label">Recorded Value</div>
                    </div>
                    
                    <div class="observation-meta">
                        <div class="meta-item">
                            <i class="fas fa-tag"></i>
                            <span class="type-badge">
                                <i class="fas fa-chart-line"></i>
                                ${escapeHtml(observationName)}
                            </span>
                        </div>
                        ${observationStatus ? `
                            <div class="meta-item">
                                <i class="fas fa-info-circle"></i>
                                Status: ${escapeHtml(observationStatus)}
                            </div>
                        ` : ''}
                    </div>
                </div>
            </div>
        `;
    }

    function formatDate(dateString) {
        try {
            const date = new Date(dateString);
            if (isNaN(date.getTime())) return 'Invalid date';
            
            const now = new Date();
            const diffMs = now - date;
            const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
            const diffDays = Math.floor(diffHours / 24);

            if (diffHours < 1) return 'Just now';
            if (diffHours < 24) return `${diffHours}h ago`;
            if (diffDays < 7) return `${diffDays}d ago`;
            
            return date.toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            });
        } catch (e) {
            return 'Invalid date';
        }
    }

    function escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    function showNoData() {
        observationsContainer.style.display = 'none';
        noDataContainer.style.display = 'block';
        totalObservationsEl.textContent = '0';
        totalPatientsEl.textContent = '0';
        recentObservationsEl.textContent = '0';
    }

    function clearFilters() {
        typeFilterEl.value = '';
        patientSearchEl.value = '';
        applyFilters();
    }

    // Event listeners
    typeFilterEl.addEventListener('change', applyFilters);
    patientSearchEl.addEventListener('input', applyFilters);
    clearFiltersBtn.addEventListener('click', clearFilters);

    // Initialize
    loadObservations();
});