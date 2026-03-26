document.addEventListener('DOMContentLoaded', function() {
    if (!window.PATIENT_DATA) {
        console.error('Patient data not available');
        showNoDataMessage();
        return;
    }

    const data = window.PATIENT_DATA;
    
    if (data.patient && data.patient.id === 'all') {
        renderAllPatientsView(data);
    } else {
        renderSinglePatientView(data);
    }
});

function renderAllPatientsView(data) {
    const patients = data.patients || [];
    
    // Find ENT ward patients
    const entPatients = findENTWardPatients(patients, data);
    
    // Update statistics
    updateStatistics(entPatients, patients);
    
    // Render ENT patients
    renderENTPatients(entPatients);
    
    // Render all conditions
    renderAllConditions(patients);
}

function renderSinglePatientView(data) {
    // For single patient view, show their data if they're in ENT ward
    const isENTPatient = checkIfPatientInENTWard(data);
    
    if (isENTPatient) {
        updateStatistics([data], [data]);
        renderENTPatients([data]);
        renderAllConditions([data]);
    } else {
        updateStatistics([], []);
        renderENTPatients([]);
        renderAllConditions([]);
    }
}

function findENTWardPatients(patients, data) {
    const entPatients = [];
    
    // Check locations data for ENT ward
    if (data.locations && data.locations.summary) {
        const entLocations = data.locations.summary.filter(loc => 
            loc.name && loc.name.toLowerCase().includes('ent') ||
            loc.value && loc.value.toLowerCase().includes('ent')
        );
        
        // For this demo, we'll assume patients with ENT-related conditions are in ENT ward
        patients.forEach(patient => {
            if (patient.data && patient.data.condition) {
                const hasENTCondition = patient.data.condition.some(condition => 
                    condition.name && (
                        condition.name.toLowerCase().includes('tonsil') ||
                        condition.name.toLowerCase().includes('throat') ||
                        condition.name.toLowerCase().includes('ear') ||
                        condition.name.toLowerCase().includes('nose') ||
                        condition.name.toLowerCase().includes('ent')
                    )
                );
                
                if (hasENTCondition) {
                    entPatients.push(patient);
                }
            }
        });
    }
    
    // If no specific ENT conditions found, include patients with Tonsillitis as example
    if (entPatients.length === 0) {
        patients.forEach(patient => {
            if (patient.data && patient.data.condition) {
                const hasTonsillitis = patient.data.condition.some(condition => 
                    condition.name && condition.name.toLowerCase().includes('tonsillitis')
                );
                
                if (hasTonsillitis) {
                    entPatients.push(patient);
                }
            }
        });
    }
    
    return entPatients;
}

function checkIfPatientInENTWard(data) {
    if (data.condition && data.condition.summary) {
        return data.condition.summary.some(condition => 
            condition.name && (
                condition.name.toLowerCase().includes('tonsil') ||
                condition.name.toLowerCase().includes('throat') ||
                condition.name.toLowerCase().includes('ear') ||
                condition.name.toLowerCase().includes('nose') ||
                condition.name.toLowerCase().includes('ent')
            )
        );
    }
    return false;
}

function updateStatistics(entPatients, allPatients) {
    const entPatientCount = entPatients.length;
    let totalConditions = 0;
    let activeMedications = 0;
    let recentObservations = 0;
    
    entPatients.forEach(patient => {
        if (patient.data) {
            Object.entries(patient.data).forEach(([resourceType, records]) => {
                if (records && Array.isArray(records)) {
                    if (resourceType === 'condition') {
                        totalConditions += records.length;
                    } else if (resourceType === 'medicationrequest') {
                        activeMedications += records.length;
                    } else if (resourceType === 'observation' || resourceType === 'vital_signs') {
                        recentObservations += records.length;
                    }
                }
            });
        }
    });
    
    document.getElementById('entPatientCount').textContent = entPatientCount;
    document.getElementById('totalConditions').textContent = totalConditions;
    document.getElementById('activeMedications').textContent = activeMedications;
    document.getElementById('recentObservations').textContent = recentObservations;
}

function renderENTPatients(entPatients) {
    const container = document.getElementById('entPatientsContainer');
    
    if (entPatients.length === 0) {
        container.innerHTML = `
            <div class="no-data">
                <i class="fas fa-bed"></i>
                <h4>No ENT Ward Patients</h4>
                <p>No patients currently assigned to the ENT ward.</p>
            </div>
        `;
        return;
    }
    
    const patientsHtml = entPatients.map(patient => {
        const patientData = patient.data || {};
        const age = calculateAge(patient.birthDate);
        
        let resourceSections = '';
        Object.entries(patientData).forEach(([resourceType, records]) => {
            if (records && Array.isArray(records) && records.length > 0) {
                const resourceTags = records.map(record => {
                    const displayName = record.name || record.value || `${resourceType} record`;
                    return `<span class="resource-tag">${displayName}</span>`;
                }).join('');
                
                resourceSections += `
                    <div class="resource-section">
                        <div class="resource-title">${resourceType.replace('_', ' ')}</div>
                        <div class="resource-list">${resourceTags}</div>
                    </div>
                `;
            }
        });
        
        return `
            <div class="patient-item">
                <div class="patient-header">
                    <div>
                        <h4 class="patient-name">${patient.name || 'Unknown Patient'}</h4>
                        <div class="patient-info">
                            ${patient.gender || 'Unknown'} • Age ${age} • ID: ${patient.id}
                        </div>
                    </div>
                    <span class="patient-badge">ENT Ward</span>
                </div>
                ${resourceSections}
            </div>
        `;
    }).join('');
    
    container.innerHTML = patientsHtml;
}

function renderAllConditions(patients) {
    const container = document.getElementById('conditionsContainer');
    const allConditions = [];
    
    patients.forEach(patient => {
        if (patient.data && patient.data.condition) {
            patient.data.condition.forEach(condition => {
                allConditions.push({
                    ...condition,
                    patientName: patient.name || 'Unknown Patient',
                    patientId: patient.id
                });
            });
        }
    });
    
    if (allConditions.length === 0) {
        container.innerHTML = `
            <div class="no-data">
                <i class="fas fa-clipboard-list"></i>
                <h4>No Conditions Found</h4>
                <p>No medical conditions recorded for patients.</p>
            </div>
        `;
        return;
    }
    
    const conditionsHtml = allConditions.map(condition => {
        const conditionDate = condition.date ? formatDate(condition.date) : 'No date';
        
        return `
            <div class="condition-item">
                <div class="condition-content">
                    <div class="condition-name">${condition.name || 'Unknown Condition'}</div>
                    <div class="condition-patient">Patient: ${condition.patientName}</div>
                </div>
                <div class="condition-date">${conditionDate}</div>
            </div>
        `;
    }).join('');
    
    container.innerHTML = conditionsHtml;
}

function calculateAge(birthDate) {
    if (!birthDate) return 'Unknown';
    
    const birth = new Date(birthDate);
    const today = new Date();
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
        age--;
    }
    
    return age;
}

function formatDate(dateString) {
    if (!dateString) return 'No date';
    
    try {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    } catch (error) {
        return 'Invalid date';
    }
}

function showNoDataMessage() {
    const containers = ['entPatientsContainer', 'conditionsContainer'];
    
    containers.forEach(containerId => {
        const container = document.getElementById(containerId);
        if (container) {
            container.innerHTML = `
                <div class="no-data">
                    <i class="fas fa-exclamation-triangle"></i>
                    <h4>No Data Available</h4>
                    <p>Patient data could not be loaded.</p>
                </div>
            `;
        }
    });
    
    // Reset statistics
    document.getElementById('entPatientCount').textContent = '0';
    document.getElementById('totalConditions').textContent = '0';
    document.getElementById('activeMedications').textContent = '0';
    document.getElementById('recentObservations').textContent = '0';
}