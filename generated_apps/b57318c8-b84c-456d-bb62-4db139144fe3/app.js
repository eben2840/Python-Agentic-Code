document.addEventListener('DOMContentLoaded', function() {
    // Set handover timestamp
    const now = new Date();
    document.getElementById('handover-time').textContent = now.toLocaleString();
    
    // Check if we have patient data
    if (!window.PATIENT_DATA) {
        showError('No patient data available');
        return;
    }
    
    const data = window.PATIENT_DATA;
    
    // Check if this is all patients view
    if (data.patient && data.patient.id === 'all') {
        showAllPatientsView();
        return;
    }
    
    // Single patient - generate SBAR
    generateSBARSummary(data);
});

function showAllPatientsView() {
    document.getElementById('sbar-content').style.display = 'none';
    document.getElementById('all-patients-view').style.display = 'block';
    
    const patients = window.PATIENT_DATA.patients || [];
    const patientList = document.getElementById('patient-list');
    
    if (patients.length === 0) {
        patientList.innerHTML = '<div class="col-12"><div class="no-data">No patients available</div></div>';
        return;
    }
    
    patientList.innerHTML = patients.map(patient => {
        const conditions = [];
        if (patient.data && patient.data.condition) {
            patient.data.condition.forEach(condition => {
                if (condition.name) conditions.push(condition.name);
            });
        }
        
        return `
            <div class="col-md-6 col-lg-4">
                <div class="patient-card">
                    <div class="patient-name">${patient.name || 'Unknown Patient'}</div>
                    <div class="patient-details">
                        ${patient.gender || 'Unknown'} • ${calculateAge(patient.birthDate)}
                        <br>ID: ${patient.id}
                    </div>
                    ${conditions.length > 0 ? `
                        <div class="mt-2">
                            ${conditions.map(c => `<span class="condition-badge">${c}</span>`).join('')}
                        </div>
                    ` : ''}
                </div>
            </div>
        `;
    }).join('');
    
    document.getElementById('patient-header').textContent = `${patients.length} patients available - Select individual patient for SBAR handover`;
}

function generateSBARSummary(data) {
    const patient = data.patient;
    if (!patient) {
        showError('Patient information not available');
        return;
    }
    
    // Update header
    document.getElementById('patient-header').textContent = 
        `${patient.name || 'Unknown Patient'} • ${patient.gender || 'Unknown'} • ${calculateAge(patient.birthDate)} • ID: ${patient.id}`;
    
    // Generate SBAR sections
    const sbarContent = document.getElementById('sbar-content');
    sbarContent.innerHTML = `
        <div class="col-lg-6 col-12">
            ${generateSituationSection(data)}
        </div>
        <div class="col-lg-6 col-12">
            ${generateBackgroundSection(data)}
        </div>
        <div class="col-lg-6 col-12">
            ${generateAssessmentSection(data)}
        </div>
        <div class="col-lg-6 col-12">
            ${generateRecommendationSection(data)}
        </div>
    `;
}

function generateSituationSection(data) {
    const conditions = data.condition?.summary || [];
    const encounters = data.encounter?.summary || [];
    const locations = data.locations?.summary || [];
    
    let admissionInfo = 'No current admission data';
    let currentLocation = 'Location not specified';
    let primaryDiagnosis = 'No active diagnoses';
    
    if (encounters.length > 0) {
        const latestEncounter = encounters[0];
        if (latestEncounter.date) {
            const admissionDate = new Date(latestEncounter.date);
            const daysSince = Math.floor((new Date() - admissionDate) / (1000 * 60 * 60 * 24));
            admissionInfo = `Admitted ${daysSince} day${daysSince !== 1 ? 's' : ''} ago (${admissionDate.toLocaleDateString()})`;
        }
    }
    
    if (locations.length > 0) {
        const location = locations[0];
        currentLocation = `${location.name || 'Unknown Room'}${location.value ? ` (${location.value})` : ''}`;
    }
    
    if (conditions.length > 0) {
        primaryDiagnosis = conditions[0].name || 'Unnamed condition';
    }
    
    return `
        <div class="sbar-section">
            <div class="sbar-header">
                <div class="sbar-icon situation-icon">
                    <i class="fas fa-user-injured"></i>
                </div>
                <h2>Situation</h2>
            </div>
            <div class="clinical-item">
                <div class="clinical-label">Current Status</div>
                <div class="clinical-value">${admissionInfo}</div>
            </div>
            <div class="clinical-item">
                <div class="clinical-label">Location</div>
                <div class="clinical-value">${currentLocation}</div>
            </div>
            <div class="clinical-item">
                <div class="clinical-label">Primary Reason for Care</div>
                <div class="clinical-value">${primaryDiagnosis}</div>
            </div>
            ${conditions.length > 1 ? `
                <div class="clinical-item">
                    <div class="clinical-label">Additional Active Conditions</div>
                    <div class="clinical-value">
                        ${conditions.slice(1).map(c => c.name || 'Unnamed condition').join(', ')}
                    </div>
                </div>
            ` : ''}
        </div>
    `;
}

function generateBackgroundSection(data) {
    const conditions = data.condition?.summary || [];
    const medications = data.medicationrequest?.summary || [];
    const allergies = data.allergyintolerance?.summary || [];
    
    let medicationList = 'No current medications recorded';
    if (medications.length > 0) {
        medicationList = medications.map(med => `
            <div class="medication-item">
                <strong>${med.name || 'Unnamed medication'}</strong>
                ${med.value ? `<br><small>${med.value}</small>` : ''}
            </div>
        `).join('');
    }
    
    let allergyInfo = 'No known allergies recorded';
    if (allergies.length > 0) {
        allergyInfo = allergies.map(allergy => 
            `${allergy.name || 'Unknown allergen'}${allergy.value ? ` (${allergy.value})` : ''}`
        ).join(', ');
    }
    
    let medicalHistory = 'Limited history available';
    if (conditions.length > 0) {
        medicalHistory = conditions.map(condition => {
            let historyItem = condition.name || 'Unnamed condition';
            if (condition.date) {
                const conditionDate = new Date(condition.date);
                historyItem += ` (since ${conditionDate.toLocaleDateString()})`;
            }
            return historyItem;
        }).join(', ');
    }
    
    return `
        <div class="sbar-section">
            <div class="sbar-header">
                <div class="sbar-icon background-icon">
                    <i class="fas fa-history"></i>
                </div>
                <h2>Background</h2>
            </div>
            <div class="clinical-item">
                <div class="clinical-label">Medical History</div>
                <div class="clinical-value">${medicalHistory}</div>
            </div>
            <div class="clinical-item">
                <div class="clinical-label">Current Medications</div>
                <div class="clinical-value">${medicationList}</div>
            </div>
            <div class="clinical-item">
                <div class="clinical-label">Known Allergies</div>
                <div class="clinical-value">${allergyInfo}</div>
            </div>
        </div>
    `;
}

function generateAssessmentSection(data) {
    const vitals = data.vital_signs?.summary || [];
    const observations = data.observation?.summary || [];
    const diagnosticReports = data.diagnosticreport?.summary || [];
    
    let vitalSigns = '<div class="no-data">No recent vital signs recorded</div>';
    if (vitals.length > 0) {
        vitalSigns = vitals.map(vital => {
            const isAbnormal = checkIfAbnormal(vital.name, vital.value);
            const alertClass = isAbnormal ? 'alert-abnormal' : 'alert-normal';
            const alertText = isAbnormal ? 'ABNORMAL' : 'Normal';
            
            return `
                <div class="vital-reading">
                    <span class="vital-name">${vital.name || 'Unknown vital'}</span>
                    <span class="vital-value">
                        ${vital.value || 'No value'}
                        <span class="alert-badge ${alertClass}">${alertText}</span>
                    </span>
                </div>
                ${vital.date ? `<small class="text-muted">Recorded: ${new Date(vital.date).toLocaleString()}</small>` : ''}
            `;
        }).join('');
    }
    
    let labResults = 'No recent lab results available';
    if (observations.length > 0) {
        const recentObs = observations.slice(0, 5); // Show most recent 5
        labResults = recentObs.map(obs => {
            const isAbnormal = checkIfAbnormal(obs.name, obs.value);
            const alertClass = isAbnormal ? 'alert-abnormal' : 'alert-normal';
            
            return `
                <div class="clinical-item">
                    <strong>${obs.name || 'Unknown test'}</strong>: ${obs.value || 'No result'}
                    <span class="alert-badge ${alertClass}">${isAbnormal ? 'ABNORMAL' : 'Normal'}</span>
                    ${obs.date ? `<br><small class="text-muted">${new Date(obs.date).toLocaleString()}</small>` : ''}
                </div>
            `;
        }).join('');
    }
    
    return `
        <div class="sbar-section">
            <div class="sbar-header">
                <div class="sbar-icon assessment-icon">
                    <i class="fas fa-stethoscope"></i>
                </div>
                <h2>Assessment</h2>
            </div>
            <div class="clinical-item">
                <div class="clinical-label">Latest Vital Signs</div>
                <div class="clinical-value">${vitalSigns}</div>
            </div>
            <div class="clinical-item">
                <div class="clinical-label">Recent Observations & Labs</div>
                <div class="clinical-value">${labResults}</div>
            </div>
        </div>
    `;
}

function generateRecommendationSection(data) {
    const medications = data.medicationrequest?.summary || [];
    const conditions = data.condition?.summary || [];
    const vitals = data.vital_signs?.summary || [];
    
    const recommendations = [];
    const urgentTasks = [];
    const routineTasks = [];
    
    // Check for urgent medication needs
    medications.forEach(med => {
        if (med.name) {
            routineTasks.push(`Continue ${med.name}${med.value ? ` - ${med.value}` : ''}`);
        }
    });
    
    // Check for abnormal vitals requiring follow-up
    vitals.forEach(vital => {
        if (checkIfAbnormal(vital.name, vital.value)) {
            urgentTasks.push(`Monitor ${vital.name} - currently ${vital.value} (abnormal)`);
        }
    });
    
    // Condition-specific recommendations
    conditions.forEach(condition => {
        if (condition.name) {
            const conditionName = condition.name.toLowerCase();
            if (conditionName.includes('hypertension') || conditionName.includes('bp')) {
                recommendations.push('Monitor blood pressure q4h');
            } else if (conditionName.includes('diabetes') || conditionName.includes('glucose')) {
                recommendations.push('Monitor blood glucose levels');
                urgentTasks.push('Check glucose before meals');
            } else if (conditionName.includes('pain') || conditionName.includes('fracture')) {
                recommendations.push('Assess pain levels regularly');
                routineTasks.push('Pain reassessment due');
            } else if (conditionName.includes('sepsis') || conditionName.includes('infection')) {
                urgentTasks.push('Monitor for signs of deterioration');
                urgentTasks.push('Ensure antibiotic compliance');
            }
        }
    });
    
    // Default recommendations if none specific
    if (recommendations.length === 0) {
        recommendations.push('Continue current care plan');
        recommendations.push('Monitor patient response to treatment');
    }
    
    const urgentSection = urgentTasks.length > 0 ? `
        <div class="clinical-item">
            <div class="clinical-label">Urgent Tasks <span class="alert-badge alert-urgent">PRIORITY</span></div>
            <div class="clinical-value">
                ${urgentTasks.map(task => `<div class="task-item task-urgent"><i class="fas fa-exclamation-triangle me-2"></i>${task}</div>`).join('')}
            </div>
        </div>
    ` : '';
    
    const routineSection = routineTasks.length > 0 ? `
        <div class="clinical-item">
            <div class="clinical-label">Routine Tasks</div>
            <div class="clinical-value">
                ${routineTasks.map(task => `<div class="task-item task-normal"><i class="fas fa-check-circle me-2"></i>${task}</div>`).join('')}
            </div>
        </div>
    ` : '';
    
    return `
        <div class="sbar-section">
            <div class="sbar-header">
                <div class="sbar-icon recommendation-icon">
                    <i class="fas fa-clipboard-check"></i>
                </div>
                <h2>Recommendation</h2>
            </div>
            ${urgentSection}
            <div class="clinical-item">
                <div class="clinical-label">Care Plan Priorities</div>
                <div class="clinical-value">
                    ${recommendations.map(rec => `<div class="task-item task-normal"><i class="fas fa-arrow-right me-2"></i>${rec}</div>`).join('')}
                </div>
            </div>
            ${routineSection}
            <div class="clinical-item">
                <div class="clinical-label">Escalation Criteria</div>
                <div class="clinical-value">
                    <div class="task-item priority-high">
                        <i class="fas fa-phone me-2"></i>Contact physician immediately for: significant vital sign changes, new symptoms, patient deterioration
                    </div>
                </div>
            </div>
        </div>
    `;
}

function checkIfAbnormal(name, value) {
    if (!name || !value) return false;
    
    const nameLower = name.toLowerCase();
    const valueStr = value.toString().toLowerCase();
    
    // Blood pressure
    if (nameLower.includes('bp') || nameLower.includes('blood pressure')) {
        if (valueStr.includes('140') || valueStr.includes('90')) return true;
    }
    
    // Temperature
    if (nameLower.includes('temp')) {
        if (valueStr.includes('39') || valueStr.includes('38.5')) return true;
    }
    
    // Pain scales
    if (nameLower.includes('pain') || nameLower.includes('vas')) {
        const painScore = parseInt(valueStr);
        if (painScore >= 7) return true;
    }
    
    // Glucose
    if (nameLower.includes('glucose')) {
        const glucose = parseFloat(valueStr);
        if (glucose > 7.0) return true;
    }
    
    // Generic abnormal indicators
    if (valueStr.includes('abnormal') || valueStr.includes('high') || valueStr.includes('low') || 
        valueStr.includes('positive') || valueStr.includes('elevated')) {
        return true;
    }
    
    return false;
}

function calculateAge(birthDate) {
    if (!birthDate) return 'Unknown age';
    
    const birth = new Date(birthDate);
    const today = new Date();
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
        age--;
    }
    
    return `${age} years`;
}

function showError(message) {
    const sbarContent = document.getElementById('sbar-content');
    sbarContent.innerHTML = `
        <div class="col-12">
            <div class="alert alert-danger">
                <i class="fas fa-exclamation-triangle me-2"></i>
                ${message}
            </div>
        </div>
    `;
}