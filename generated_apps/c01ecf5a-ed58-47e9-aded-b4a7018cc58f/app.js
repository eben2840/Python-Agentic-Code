document.addEventListener('DOMContentLoaded', function() {
    if (!window.PATIENT_DATA) {
        showNoData();
        return;
    }

    const data = window.PATIENT_DATA;
    
    if (data.patient && data.patient.id === 'all') {
        renderAllPatientsWardData(data);
    } else {
        renderSinglePatientWardData(data);
    }
});

function renderAllPatientsWardData(data) {
    const patients = data.patients || [];
    
    if (patients.length === 0) {
        showNoData();
        return;
    }

    let wardData = {};
    let totalPatients = 0;

    // Define standard hospital wards with types and capacities
    const standardWards = {
        'ICU': { type: 'Intensive Care Unit', capacity: 20, icon: 'fas fa-heartbeat', color: '#dc2626' },
        'Emergency': { type: 'Emergency Department', capacity: 30, icon: 'fas fa-ambulance', color: '#dc2626' },
        'Cardiology': { type: 'Cardiac Care', capacity: 25, icon: 'fas fa-heart', color: '#dc2626' },
        'Oncology': { type: 'Cancer Treatment', capacity: 30, icon: 'fas fa-ribbon', color: '#7c3aed' },
        'Pediatrics': { type: 'Children\'s Ward', capacity: 40, icon: 'fas fa-baby', color: '#06b6d4' },
        'Surgery': { type: 'Surgical Ward', capacity: 35, icon: 'fas fa-user-md', color: '#059669' },
        'Maternity': { type: 'Maternity Ward', capacity: 25, icon: 'fas fa-female', color: '#db2777' },
        'Orthopedics': { type: 'Bone & Joint Care', capacity: 30, icon: 'fas fa-bone', color: '#d97706' },
        'Neurology': { type: 'Neurological Care', capacity: 20, icon: 'fas fa-brain', color: '#7c3aed' },
        'Psychiatry': { type: 'Mental Health', capacity: 25, icon: 'fas fa-head-side-virus', color: '#059669' },
        'Pulmonology': { type: 'Respiratory Care', capacity: 25, icon: 'fas fa-lungs', color: '#0369a1' },
        'Nephrology': { type: 'Kidney Care', capacity: 20, icon: 'fas fa-kidney', color: '#7c2d12' },
        'Geriatrics': { type: 'Elderly Care', capacity: 35, icon: 'fas fa-wheelchair', color: '#6b7280' },
        'Dermatology': { type: 'Skin Care', capacity: 15, icon: 'fas fa-hand-paper', color: '#dc2626' },
        'Gastroenterology': { type: 'Digestive Care', capacity: 20, icon: 'fas fa-stomach', color: '#059669' },
        'General': { type: 'General Medicine', capacity: 50, icon: 'fas fa-hospital', color: '#3b82f6' }
    };

    // Initialize all standard wards with zero occupancy
    Object.entries(standardWards).forEach(([wardName, wardInfo]) => {
        wardData[wardName] = {
            ...wardInfo,
            count: 0,
            patients: [],
            occupancyRate: 0
        };
    });

    // Process patient data to assign to appropriate wards
    patients.forEach(patient => {
        if (!patient.data) return;
        totalPatients++;

        let assignedWard = null;

        // Check conditions to determine appropriate ward
        if (patient.data.condition) {
            patient.data.condition.forEach(condition => {
                const conditionName = condition.name ? condition.name.toLowerCase() : '';
                
                if (conditionName.includes('sepsis') || conditionName.includes('critical')) {
                    assignedWard = 'ICU';
                } else if (conditionName.includes('cancer') || conditionName.includes('breast cancer')) {
                    assignedWard = 'Oncology';
                } else if (conditionName.includes('chest pain') || conditionName.includes('heart')) {
                    assignedWard = 'Cardiology';
                } else if (conditionName.includes('fractured') || conditionName.includes('femur')) {
                    assignedWard = 'Orthopedics';
                } else if (conditionName.includes('dementia') || conditionName.includes('depression')) {
                    assignedWard = 'Psychiatry';
                } else if (conditionName.includes('asthma') || conditionName.includes('copd')) {
                    assignedWard = 'Pulmonology';
                } else if (conditionName.includes('ckd') || conditionName.includes('kidney')) {
                    assignedWard = 'Nephrology';
                } else if (conditionName.includes('tb') || conditionName.includes('tuberculosis')) {
                    assignedWard = 'Pulmonology';
                } else if (conditionName.includes('gestational diabetes')) {
                    assignedWard = 'Maternity';
                } else if (conditionName.includes('psoriasis')) {
                    assignedWard = 'Dermatology';
                } else if (conditionName.includes('ulcerative colitis')) {
                    assignedWard = 'Gastroenterology';
                } else if (conditionName.includes('hypothyroidism')) {
                    assignedWard = 'General';
                } else if (conditionName.includes('ra') || conditionName.includes('rheumatoid arthritis')) {
                    assignedWard = 'Orthopedics';
                } else if (conditionName.includes('glaucoma')) {
                    assignedWard = 'General';
                } else if (conditionName.includes('tonsillitis')) {
                    assignedWard = 'General';
                } else if (conditionName.includes('anemia')) {
                    assignedWard = 'General';
                } else if (conditionName.includes('hypertension')) {
                    assignedWard = 'Cardiology';
                } else if (conditionName.includes('migraine')) {
                    assignedWard = 'Neurology';
                }
            });
        }

        // Assign to age-appropriate ward if no condition-specific ward
        if (!assignedWard) {
            const birthDate = new Date(patient.birthDate);
            const age = new Date().getFullYear() - birthDate.getFullYear();
            
            if (age < 18) {
                assignedWard = 'Pediatrics';
            } else if (age > 65) {
                assignedWard = 'Geriatrics';
            } else {
                assignedWard = 'General';
            }
        }

        // Add patient to assigned ward
        if (assignedWard && wardData[assignedWard]) {
            wardData[assignedWard].count++;
            wardData[assignedWard].patients.push({
                name: patient.name,
                room: `Room ${Math.floor(Math.random() * 100) + 1}${String.fromCharCode(65 + Math.floor(Math.random() * 3))}`,
                condition: patient.data.condition?.[0]?.name || 'General Care'
            });
            wardData[assignedWard].occupancyRate = (wardData[assignedWard].count / wardData[assignedWard].capacity) * 100;
        }
    });

    renderWardsGrid(wardData);
    renderWardOccupancy(wardData);
    renderPatientDistribution(wardData);
    renderWardSummary(wardData, totalPatients);
    updateStatistics(wardData, totalPatients);
}

function renderSinglePatientWardData(data) {
    const patient = data.patient;
    if (!patient) {
        showNoData();
        return;
    }

    // For single patient view, show the ward they would be assigned to
    renderAllPatientsWardData({ patients: [{ ...patient, data: data }] });
}

function renderWardsGrid(wardData) {
    const container = document.getElementById('wardsGrid');
    const totalBadge = document.getElementById('totalWards');
    
    const wards = Object.entries(wardData);
    totalBadge.textContent = wards.length;

    container.innerHTML = wards.map(([wardName, wardInfo]) => {
        const occupancyClass = getOccupancyClass(wardInfo.occupancyRate);
        const occupancyLabel = getOccupancyLabel(wardInfo.occupancyRate);
        
        return `
            <div class="col-lg-4 col-md-6">
                <div class="ward-card" style="border-left-color: ${wardInfo.color}">
                    <div class="ward-header">
                        <div>
                            <h4 class="ward-name">
                                <i class="${wardInfo.icon} me-2" style="color: ${wardInfo.color}"></i>
                                ${wardName}
                            </h4>
                            <div class="ward-type">${wardInfo.type}</div>
                        </div>
                        <span class="occupancy-badge ${occupancyClass}">
                            ${occupancyLabel}
                        </span>
                    </div>
                    <div class="ward-stats">
                        <div class="ward-capacity">
                            Capacity: ${wardInfo.capacity} beds
                        </div>
                        <div class="patient-count">
                            ${wardInfo.count}
                        </div>
                    </div>
                    <div class="progress-bar-custom">
                        <div class="progress-fill ${occupancyClass}" style="width: ${Math.min(wardInfo.occupancyRate, 100)}%"></div>
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

function renderWardOccupancy(wardData) {
    const container = document.getElementById('wardOccupancy');
    
    const wards = Object.entries(wardData).sort((a, b) => b[1].occupancyRate - a[1].occupancyRate);

    container.innerHTML = wards.map(([wardName, wardInfo]) => {
        const occupancyClass = getOccupancyClass(wardInfo.occupancyRate);
        
        return `
            <div class="ward-item">
                <div class="ward-info">
                    <h4>
                        <i class="${wardInfo.icon} me-2" style="color: ${wardInfo.color}"></i>
                        ${wardName}
                    </h4>
                    <p>${wardInfo.count} of ${wardInfo.capacity} beds occupied</p>
                    <div class="progress-bar-custom">
                        <div class="progress-fill ${occupancyClass}" style="width: ${Math.min(wardInfo.occupancyRate, 100)}%"></div>
                    </div>
                </div>
                <div class="ward-occupancy-stats">
                    <span class="occupancy-percentage">${wardInfo.occupancyRate.toFixed(1)}%</span>
                    <span class="occupancy-count">${wardInfo.count}/${wardInfo.capacity}</span>
                </div>
            </div>
        `;
    }).join('');
}

function renderPatientDistribution(wardData) {
    const container = document.getElementById('patientDistribution');
    
    const wardsWithPatients = Object.entries(wardData).filter(([_, wardInfo]) => wardInfo.patients.length > 0);

    if (wardsWithPatients.length === 0) {
        container.innerHTML = `
            <div class="no-data">
                <i class="fas fa-users"></i>
                <h4>No Patient Data</h4>
                <p>No patients currently assigned to wards.</p>
            </div>
        `;
        return;
    }

    container.innerHTML = wardsWithPatients.map(([wardName, wardInfo]) => `
        <div class="ward-patient-list">
            <div class="ward-patient-title">
                <i class="${wardInfo.icon} me-2" style="color: ${wardInfo.color}"></i>
                ${wardName} (${wardInfo.patients.length})
            </div>
            ${wardInfo.patients.map(patient => `
                <div class="patient-item">
                    <span class="patient-name">${patient.name}</span>
                    <span class="room-number">${patient.room}</span>
                </div>
            `).join('')}
        </div>
    `).join('');
}

function renderWardSummary(wardData, totalPatients) {
    const container = document.getElementById('wardSummary');
    
    const wards = Object.entries(wardData);
    const occupiedWards = wards.filter(([_, wardInfo]) => wardInfo.count > 0).length;
    const totalCapacity = wards.reduce((sum, [_, wardInfo]) => sum + wardInfo.capacity, 0);
    const totalOccupied = wards.reduce((sum, [_, wardInfo]) => sum + wardInfo.count, 0);
    const overallOccupancy = totalCapacity > 0 ? (totalOccupied / totalCapacity) * 100 : 0;
    const busiestWard = wards.reduce((max, [name, info]) => 
        info.occupancyRate > max.rate ? { name, rate: info.occupancyRate } : max, 
        { name: 'None', rate: 0 }
    );

    container.innerHTML = `
        <div class="stat-row">
            <span class="stat-row-label">Total Wards</span>
            <span class="stat-row-value">${wards.length}</span>
        </div>
        <div class="stat-row">
            <span class="stat-row-label">Occupied Wards</span>
            <span class="stat-row-value">${occupiedWards}</span>
        </div>
        <div class="stat-row">
            <span class="stat-row-label">Total Capacity</span>
            <span class="stat-row-value">${totalCapacity} beds</span>
        </div>
        <div class="stat-row">
            <span class="stat-row-label">Total Occupied</span>
            <span class="stat-row-value">${totalOccupied} beds</span>
        </div>
        <div class="stat-row">
            <span class="stat-row-label">Overall Occupancy</span>
            <span class="stat-row-value">${overallOccupancy.toFixed(1)}%</span>
        </div>
        <div class="stat-row">
            <span class="stat-row-label">Busiest Ward</span>
            <span class="stat-row-value">${busiestWard.name}</span>
        </div>
    `;
}

function updateStatistics(wardData, totalPatients) {
    const wards = Object.entries(wardData);
    const occupiedWards = wards.filter(([_, wardInfo]) => wardInfo.count > 0).length;
    const totalCapacity = wards.reduce((sum, [_, wardInfo]) => sum + wardInfo.capacity, 0);
    const totalOccupied = wards.reduce((sum, [_, wardInfo]) => sum + wardInfo.count, 0);
    const overallOccupancy = totalCapacity > 0 ? (totalOccupied / totalCapacity) * 100 : 0;
    const busiestWard = wards.reduce((max, [name, info]) => 
        info.occupancyRate > max.rate ? { name, rate: info.occupancyRate } : max, 
        { name: 'None', rate: 0 }
    );

    document.getElementById('totalWardsStat').textContent = wards.length;
    document.getElementById('totalPatientsStat').textContent = totalOccupied;
    document.getElementById('avgOccupancyStat').textContent = `${overallOccupancy.toFixed(1)}%`;
    document.getElementById('busiestWardStat').textContent = busiestWard.name;
}

function getOccupancyClass(rate) {
    if (rate >= 80) return 'high';
    if (rate >= 50) return 'medium';
    return 'low';
}

function getOccupancyLabel(rate) {
    if (rate >= 90) return 'Critical';
    if (rate >= 80) return 'High';
    if (rate >= 50) return 'Medium';
    if (rate > 0) return 'Low';
    return 'Empty';
}

function showNoData() {
    document.getElementById('wardsGrid').innerHTML = `
        <div class="col-12">
            <div class="no-data">
                <i class="fas fa-hospital"></i>
                <h4>No Ward Data Available</h4>
                <p>No hospital ward data available to display.</p>
            </div>
        </div>
    `;
    
    document.getElementById('wardOccupancy').innerHTML = `
        <div class="no-data">
            <i class="fas fa-chart-bar"></i>
            <h4>No Occupancy Data</h4>
            <p>No ward occupancy data available.</p>
        </div>
    `;
    
    document.getElementById('patientDistribution').innerHTML = `
        <div class="no-data">
            <i class="fas fa-users"></i>
            <h4>No Patient Data</h4>
            <p>No patient distribution data available.</p>
        </div>
    `;
    
    updateStatistics({}, 0);
}