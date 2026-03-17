document.addEventListener('DOMContentLoaded', function() {
    const searchInput = document.getElementById('searchInput');
    const filterSelect = document.getElementById('filterSelect');
    const patientsContainer = document.getElementById('patientsContainer');
    const noDataMessage = document.getElementById('noDataMessage');
    const statsContainer = document.getElementById('statsContainer');

    let allPatients = [];

    function initializeApp() {
        if (!window.PATIENT_DATA) {
            showNoData();
            return;
        }

        const data = window.PATIENT_DATA;
        
        if (data.patient && data.patient.id === 'all' && data.patients) {
            allPatients = data.patients.filter(patient => 
                patient.data && patient.data.vital_signs && patient.data.vital_signs.length > 0
            );
        } else {
            showNoData();
            return;
        }

        renderStats();
        renderPatients(allPatients);
        
        // Event listeners
        searchInput.addEventListener('input', handleSearch);
        filterSelect.addEventListener('change', handleFilter);
    }

    function renderStats() {
        const totalPatients = allPatients.length;
        const totalVitalSigns = allPatients.reduce((sum, patient) => 
            sum + (patient.data.vital_signs ? patient.data.vital_signs.length : 0), 0
        );
        
        const vitalTypes = new Set();
        allPatients.forEach(patient => {
            if (patient.data.vital_signs) {
                patient.data.vital_signs.forEach(vital => {
                    if (vital.name) {
                        vitalTypes.add(getVitalType(vital.name));
                    }
                });
            }
        });

        statsContainer.innerHTML = `
            <div class="stat-item">
                <i class="fas fa-users text-primary"></i>
                <div>
                    <div class="stat-number">${totalPatients}</div>
                    <div class="stat-label">Patients</div>
                </div>
            </div>
            <div class="stat-item">
                <i class="fas fa-heartbeat text-danger"></i>
                <div>
                    <div class="stat-number">${totalVitalSigns}</div>
                    <div class="stat-label">Vital Signs</div>
                </div>
            </div>
            <div class="stat-item">
                <i class="fas fa-chart-line text-success"></i>
                <div>
                    <div class="stat-number">${vitalTypes.size}</div>
                    <div class="stat-label">Types</div>
                </div>
            </div>
        `;
    }

    function renderPatients(patients) {
        if (patients.length === 0) {
            showNoData();
            return;
        }

        hideNoData();
        
        patientsContainer.innerHTML = patients.map(patient => `
            <div class="col-lg-6 col-xl-4 mb-4">
                <div class="patient-card">
                    <div class="patient-header">
                        <div class="patient-info">
                            <h5>${patient.name || 'Unknown Patient'}</h5>
                            <div class="patient-details">
                                ${formatAge(patient.birthDate)} • ID: ${patient.id || 'N/A'}
                            </div>
                        </div>
                        <span class="gender-badge gender-${patient.gender || 'unknown'}">
                            <i class="fas fa-${getGenderIcon(patient.gender)}"></i>
                            ${formatGender(patient.gender)}
                        </span>
                    </div>
                    <div class="vital-signs-list">
                        ${renderVitalSigns(patient.data.vital_signs)}
                    </div>
                </div>
            </div>
        `).join('');
    }

    function renderVitalSigns(vitalSigns) {
        if (!vitalSigns || vitalSigns.length === 0) {
            return '<div class="no-vitals">No vital signs recorded</div>';
        }

        return vitalSigns.map(vital => `
            <div class="vital-sign-item">
                <div class="vital-sign-info">
                    <div class="vital-icon vital-${getVitalType(vital.name).toLowerCase()}">
                        <i class="fas fa-${getVitalIcon(vital.name)}"></i>
                    </div>
                    <div class="vital-details">
                        <h6>${vital.name || 'Unknown Vital'}</h6>
                        <div class="vital-value">${vital.value || 'No value'}</div>
                    </div>
                </div>
                <div class="vital-timestamp">
                    ${formatDate(vital.date)}
                </div>
            </div>
        `).join('');
    }

    function getVitalType(name) {
        if (!name) return 'Other';
        const nameLower = name.toLowerCase();
        if (nameLower.includes('bp') || nameLower.includes('blood pressure')) return 'BP';
        if (nameLower.includes('temp') || nameLower.includes('temperature')) return 'Temp';
        if (nameLower.includes('glucose') || nameLower.includes('sugar')) return 'Glucose';
        if (nameLower.includes('pain') || nameLower.includes('vas')) return 'Pain';
        if (nameLower.includes('flow') || nameLower.includes('fev')) return 'Flow';
        return 'Other';
    }

    function getVitalIcon(name) {
        if (!name) return 'chart-line';
        const nameLower = name.toLowerCase();
        if (nameLower.includes('bp') || nameLower.includes('blood pressure')) return 'heartbeat';
        if (nameLower.includes('temp') || nameLower.includes('temperature')) return 'thermometer-half';
        if (nameLower.includes('glucose') || nameLower.includes('sugar')) return 'tint';
        if (nameLower.includes('pain') || nameLower.includes('vas')) return 'exclamation-triangle';
        if (nameLower.includes('flow') || nameLower.includes('fev')) return 'lungs';
        if (nameLower.includes('ecg')) return 'wave-square';
        if (nameLower.includes('mmse')) return 'brain';
        if (nameLower.includes('pasi')) return 'hand-dots';
        return 'chart-line';
    }

    function getGenderIcon(gender) {
        if (gender === 'male') return 'mars';
        if (gender === 'female') return 'venus';
        return 'genderless';
    }

    function formatGender(gender) {
        if (!gender) return 'Unknown';
        return gender.charAt(0).toUpperCase() + gender.slice(1);
    }

    function formatAge(birthDate) {
        if (!birthDate) return 'Age unknown';
        const birth = new Date(birthDate);
        const today = new Date();
        const age = today.getFullYear() - birth.getFullYear();
        return `Age ${age}`;
    }

    function formatDate(dateString) {
        if (!dateString) return 'No date';
        const date = new Date(dateString);
        if (isNaN(date.getTime())) return 'Invalid date';
        return date.toLocaleDateString('en-US', { 
            month: 'short', 
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    }

    function handleSearch() {
        const searchTerm = searchInput.value.toLowerCase().trim();
        const filteredPatients = allPatients.filter(patient => {
            const nameMatch = patient.name && patient.name.toLowerCase().includes(searchTerm);
            const vitalMatch = patient.data.vital_signs && patient.data.vital_signs.some(vital => 
                vital.name && vital.name.toLowerCase().includes(searchTerm)
            );
            return nameMatch || vitalMatch;
        });
        
        const finalFiltered = applyVitalFilter(filteredPatients);
        renderPatients(finalFiltered);
    }

    function handleFilter() {
        const searchTerm = searchInput.value.toLowerCase().trim();
        let filteredPatients = allPatients;
        
        if (searchTerm) {
            filteredPatients = filteredPatients.filter(patient => {
                const nameMatch = patient.name && patient.name.toLowerCase().includes(searchTerm);
                const vitalMatch = patient.data.vital_signs && patient.data.vital_signs.some(vital => 
                    vital.name && vital.name.toLowerCase().includes(searchTerm)
                );
                return nameMatch || vitalMatch;
            });
        }
        
        const finalFiltered = applyVitalFilter(filteredPatients);
        renderPatients(finalFiltered);
    }

    function applyVitalFilter(patients) {
        const filterValue = filterSelect.value;
        if (!filterValue) return patients;
        
        return patients.filter(patient => {
            return patient.data.vital_signs && patient.data.vital_signs.some(vital => 
                getVitalType(vital.name) === filterValue
            );
        });
    }

    function showNoData() {
        patientsContainer.style.display = 'none';
        noDataMessage.style.display = 'block';
    }

    function hideNoData() {
        patientsContainer.style.display = 'block';
        noDataMessage.style.display = 'none';
    }

    // Initialize the app
    initializeApp();
});