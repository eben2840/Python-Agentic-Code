// Initialize the application
document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
});

function initializeApp() {
    // Set current month
    const currentDate = new Date();
    const monthNames = ['Januar', 'Februar', 'März', 'April', 'Mai', 'Juni',
        'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember'];
    document.getElementById('currentMonth').textContent = 
        `${monthNames[currentDate.getMonth()]} ${currentDate.getFullYear()}`;

    // Check if patient data is available
    if (typeof window.PATIENT_DATA === 'undefined') {
        showNoDataMessage();
        return;
    }

    const data = window.PATIENT_DATA;
    
    // Check if we have all patients data
    if (data.patient.id !== 'all') {
        showSinglePatientMessage();
        return;
    }

    // Initialize filters
    initializeFilters(data);
    
    // Load initial data
    loadComplianceData(data);
    
    // Set up event listeners
    setupEventListeners(data);
}

function initializeFilters(data) {
    const wardFilter = document.getElementById('wardFilter');
    const wards = new Set();
    
    // Extract unique wards from patient data
    if (data.patients && Array.isArray(data.patients)) {
        data.patients.forEach(patient => {
            if (patient.data && patient.data.locations && patient.data.locations.summary) {
                patient.data.locations.summary.forEach(location => {
                    if (location.value) {
                        wards.add(location.value);
                    }
                });
            }
        });
    }
    
    // Populate ward filter
    wards.forEach(ward => {
        const option = document.createElement('option');
        option.value = ward;
        option.textContent = ward;
        wardFilter.appendChild(option);
    });
}

function setupEventListeners(data) {
    const wardFilter = document.getElementById('wardFilter');
    const monthFilter = document.getElementById('monthFilter');
    
    wardFilter.addEventListener('change', () => loadComplianceData(data));
    monthFilter.addEventListener('change', () => loadComplianceData(data));
}

function loadComplianceData(data) {
    const selectedWard = document.getElementById('wardFilter').value;
    const selectedMonth = document.getElementById('monthFilter').value;
    
    // Filter patients based on selected ward
    let filteredPatients = data.patients || [];
    
    if (selectedWard !== 'all') {
        filteredPatients = filteredPatients.filter(patient => {
            if (patient.data && patient.data.locations && patient.data.locations.summary) {
                return patient.data.locations.summary.some(location => 
                    location.value === selectedWard
                );
            }
            return false;
        });
    }
    
    // Calculate compliance metrics
    const metrics = calculateComplianceMetrics(filteredPatients);
    
    // Update UI
    updateSummaryCards(metrics);
    updateComplianceCharts(metrics);
    updateWardBreakdown(data.patients || [], selectedWard);
}

function calculateComplianceMetrics(patients) {
    let totalAdmissions = 0;
    let anamneseCompliant = 0;
    let assessmentCompliant = 0;
    
    patients.forEach(patient => {
        // Count as admission if patient has encounter data
        if (patient.data && patient.data.encounter && patient.data.encounter.summary) {
            const encounters = patient.data.encounter.summary;
            if (encounters.length > 0) {
                totalAdmissions++;
                
                // For demo purposes, simulate compliance based on available data
                // In real implementation, this would check actual timestamps
                
                // Check for anamnese (simulated as having condition data within 24h)
                if (patient.data.condition && patient.data.condition.summary && 
                    patient.data.condition.summary.length > 0) {
                    // Simulate 80% compliance rate
                    if (Math.random() > 0.2) {
                        anamneseCompliant++;
                    }
                }
                
                // Check for assessment (simulated as having observation data within 72h)
                if (patient.data.observation && patient.data.observation.summary && 
                    patient.data.observation.summary.length > 0) {
                    // Simulate 75% compliance rate
                    if (Math.random() > 0.25) {
                        assessmentCompliant++;
                    }
                }
            }
        }
    });
    
    return {
        totalAdmissions,
        anamneseCompliant,
        anamneseNonCompliant: totalAdmissions - anamneseCompliant,
        assessmentCompliant,
        assessmentNonCompliant: totalAdmissions - assessmentCompliant,
        anamnesePercentage: totalAdmissions > 0 ? Math.round((anamneseCompliant / totalAdmissions) * 100) : 0,
        assessmentPercentage: totalAdmissions > 0 ? Math.round((assessmentCompliant / totalAdmissions) * 100) : 0,
        overallCompliance: totalAdmissions > 0 ? Math.round(((anamneseCompliant + assessmentCompliant) / (totalAdmissions * 2)) * 100) : 0
    };
}

function updateSummaryCards(metrics) {
    document.getElementById('totalAdmissions').textContent = metrics.totalAdmissions;
    document.getElementById('anamneseCompliant').textContent = 
        `${metrics.anamneseCompliant}/${metrics.totalAdmissions}`;
    document.getElementById('assessmentCompliant').textContent = 
        `${metrics.assessmentCompliant}/${metrics.totalAdmissions}`;
    document.getElementById('overallCompliance').textContent = `${metrics.overallCompliance}%`;
}

function updateComplianceCharts(metrics) {
    // Update anamnese chart
    updateProgressCircle('anamneseProgress', 'anamnesePercentage', metrics.anamnesePercentage, '#22c55e');
    document.getElementById('anamneseCompliantCount').textContent = metrics.anamneseCompliant;
    document.getElementById('anamneseNonCompliantCount').textContent = metrics.anamneseNonCompliant;
    
    // Update assessment chart
    updateProgressCircle('assessmentProgress', 'assessmentPercentage', metrics.assessmentPercentage, '#14b8a6');
    document.getElementById('assessmentCompliantCount').textContent = metrics.assessmentCompliant;
    document.getElementById('assessmentNonCompliantCount').textContent = metrics.assessmentNonCompliant;
}

function updateProgressCircle(circleId, textId, percentage, color) {
    const circle = document.getElementById(circleId);
    const text = document.getElementById(textId);
    
    const degrees = (percentage / 100) * 360;
    circle.style.background = `conic-gradient(${color} ${degrees}deg, #e5e7eb ${degrees}deg)`;
    text.textContent = `${percentage}%`;
}

function updateWardBreakdown(allPatients, selectedWard) {
    const tableBody = document.getElementById('wardBreakdownTable');
    
    if (!allPatients || allPatients.length === 0) {
        tableBody.innerHTML = '<tr><td colspan="5" class="text-center text-muted">Keine Daten verfügbar</td></tr>';
        return;
    }
    
    // Group patients by ward
    const wardData = {};
    
    allPatients.forEach(patient => {
        if (patient.data && patient.data.locations && patient.data.locations.summary) {
            patient.data.locations.summary.forEach(location => {
                if (location.value) {
                    const ward = location.value;
                    if (!wardData[ward]) {
                        wardData[ward] = [];
                    }
                    wardData[ward].push(patient);
                }
            });
        }
    });
    
    // Generate table rows
    let tableHTML = '';
    
    Object.keys(wardData).forEach(ward => {
        if (selectedWard === 'all' || selectedWard === ward) {
            const patients = wardData[ward];
            const metrics = calculateComplianceMetrics(patients);
            
            tableHTML += `
                <tr>
                    <td><strong>${ward}</strong></td>
                    <td>${metrics.totalAdmissions}</td>
                    <td>
                        <span class="badge ${metrics.anamnesePercentage >= 80 ? 'compliant' : 'non-compliant'}">
                            ${metrics.anamneseCompliant}/${metrics.totalAdmissions} (${metrics.anamnesePercentage}%)
                        </span>
                    </td>
                    <td>
                        <span class="badge ${metrics.assessmentPercentage >= 80 ? 'compliant' : 'non-compliant'}">
                            ${metrics.assessmentCompliant}/${metrics.totalAdmissions} (${metrics.assessmentPercentage}%)
                        </span>
                    </td>
                    <td>
                        <span class="badge ${metrics.overallCompliance >= 80 ? 'compliant' : 'non-compliant'}">
                            ${metrics.overallCompliance}%
                        </span>
                    </td>
                </tr>
            `;
        }
    });
    
    if (tableHTML === '') {
        tableHTML = '<tr><td colspan="5" class="text-center text-muted">Keine Daten für ausgewählte Station verfügbar</td></tr>';
    }
    
    tableBody.innerHTML = tableHTML;
}

function showNoDataMessage() {
    document.body.innerHTML = `
        <div class="container-fluid py-5">
            <div class="row justify-content-center">
                <div class="col-md-6">
                    <div class="card">
                        <div class="card-body text-center py-5">
                            <i class="fas fa-exclamation-triangle text-warning mb-3" style="font-size: 3rem;"></i>
                            <h3>Keine Patientendaten verfügbar</h3>
                            <p class="text-muted">Die Anwendung benötigt Patientendaten zur Anzeige der Dokumentationstreue.</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;
}

function showSinglePatientMessage() {
    document.body.innerHTML = `
        <div class="container-fluid py-5">
            <div class="row justify-content-center">
                <div class="col-md-6">
                    <div class="card">
                        <div class="card-body text-center py-5">
                            <i class="fas fa-info-circle text-info mb-3" style="font-size: 3rem;"></i>
                            <h3>Einzelpatient-Modus</h3>
                            <p class="text-muted">Diese Anwendung benötigt Daten von mehreren Patienten für die Compliance-Auswertung.</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;
}