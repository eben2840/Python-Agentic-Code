document.addEventListener('DOMContentLoaded', function() {
    if (!window.PATIENT_DATA) {
        console.error('Patient data not available');
        return;
    }

    const data = window.PATIENT_DATA;
    
    // Clinical emergency assessment rules
    const assessEmergencyRisk = (patient) => {
        const emergencies = [];
        const patientData = patient.data || {};
        
        // Get latest observations and vital signs
        const observations = patientData.observation || [];
        const vitalSigns = patientData.vital_signs || [];
        const conditions = patientData.condition || [];
        const medications = patientData.medicationrequest || [];
        
        // Combine all clinical data for assessment
        const allVitals = [...observations, ...vitalSigns];
        
        // Critical vital signs assessment
        allVitals.forEach(vital => {
            const value = vital.value || vital.name || '';
            const name = vital.name || '';
            
            // Blood pressure emergencies
            if (name.toLowerCase().includes('bp') || value.toLowerCase().includes('bp')) {
                const bpMatch = value.match(/(\d+)\/(\d+)/);
                if (bpMatch) {
                    const systolic = parseInt(bpMatch[1]);
                    const diastolic = parseInt(bpMatch[2]);
                    
                    if (systolic >= 180 || diastolic >= 110) {
                        emergencies.push({
                            priority: 'critical',
                            concern: 'Hypertensive Crisis',
                            observations: [`Blood Pressure: ${value}`, `Recorded: ${vital.date || 'Recent'}`],
                            action: 'IMMEDIATE: IV antihypertensive therapy required. Notify physician and cardiology consult within 15 minutes.'
                        });
                    } else if (systolic >= 160 || diastolic >= 100) {
                        emergencies.push({
                            priority: 'high',
                            concern: 'Severe Hypertension',
                            observations: [`Blood Pressure: ${value}`, `Recorded: ${vital.date || 'Recent'}`],
                            action: 'Within 30 minutes: Repeat BP measurement, review medications, physician assessment required.'
                        });
                    }
                }
            }
            
            // Temperature emergencies
            if (name.toLowerCase().includes('temp') || value.toLowerCase().includes('temp')) {
                const tempMatch = value.match(/([\d.]+)/);
                if (tempMatch) {
                    const temp = parseFloat(tempMatch[1]);
                    if (temp >= 39.0) {
                        emergencies.push({
                            priority: 'high',
                            concern: 'High Fever - Sepsis Risk',
                            observations: [`Temperature: ${value}`, `Recorded: ${vital.date || 'Recent'}`],
                            action: 'Within 30 minutes: Blood cultures, lactate level, physician assessment. Consider sepsis protocol.'
                        });
                    }
                }
            }
            
            // Pain assessment
            if (name.toLowerCase().includes('pain') || value.toLowerCase().includes('pain')) {
                const painMatch = value.match(/(\d+)/);
                if (painMatch) {
                    const painScore = parseInt(painMatch[1]);
                    if (painScore >= 8) {
                        emergencies.push({
                            priority: 'high',
                            concern: 'Severe Pain Crisis',
                            observations: [`Pain Score: ${value}`, `Recorded: ${vital.date || 'Recent'}`],
                            action: 'Within 30 minutes: Pain reassessment, analgesic review, physician evaluation for pain management.'
                        });
                    }
                }
            }
            
            // Respiratory function
            if (name.toLowerCase().includes('fev1') || value.toLowerCase().includes('fev1')) {
                const fevMatch = value.match(/([\d.]+)/);
                if (fevMatch) {
                    const fev1 = parseFloat(fevMatch[1]);
                    if (fev1 <= 30) {
                        emergencies.push({
                            priority: 'critical',
                            concern: 'Severe Respiratory Compromise',
                            observations: [`FEV1: ${value}`, `Recorded: ${vital.date || 'Recent'}`],
                            action: 'IMMEDIATE: Oxygen therapy, bronchodilators, respiratory therapy consult. Consider ICU transfer.'
                        });
                    }
                }
            }
            
            // Kidney function
            if (name.toLowerCase().includes('egfr') || value.toLowerCase().includes('egfr')) {
                const egfrMatch = value.match(/([\d.]+)/);
                if (egfrMatch) {
                    const egfr = parseFloat(egfrMatch[1]);
                    if (egfr <= 15) {
                        emergencies.push({
                            priority: 'critical',
                            concern: 'End-Stage Renal Disease - Dialysis Urgent',
                            observations: [`eGFR: ${value}`, `Recorded: ${vital.date || 'Recent'}`],
                            action: 'IMMEDIATE: Nephrology consult, dialysis access assessment, electrolyte monitoring.'
                        });
                    }
                }
            }
            
            // Hemoglobin levels
            if (name.toLowerCase().includes('hb') || value.toLowerCase().includes('hb')) {
                const hbMatch = value.match(/([\d.]+)/);
                if (hbMatch) {
                    const hb = parseFloat(hbMatch[1]);
                    if (hb <= 7.0) {
                        emergencies.push({
                            priority: 'critical',
                            concern: 'Severe Anemia - Transfusion Required',
                            observations: [`Hemoglobin: ${value}`, `Recorded: ${vital.date || 'Recent'}`],
                            action: 'IMMEDIATE: Type and crossmatch, blood transfusion preparation, hematology consult.'
                        });
                    }
                }
            }
        });
        
        // Condition-based assessments
        conditions.forEach(condition => {
            const conditionName = condition.name || '';
            
            if (conditionName.toLowerCase().includes('sepsis')) {
                emergencies.push({
                    priority: 'critical',
                    concern: 'Active Sepsis - Multi-organ Risk',
                    observations: [`Diagnosis: ${conditionName}`, `Onset: ${condition.date || 'Recent'}`],
                    action: 'IMMEDIATE: Sepsis bundle protocol, broad-spectrum antibiotics, fluid resuscitation, ICU consideration.'
                });
            }
            
            if (conditionName.toLowerCase().includes('chest pain')) {
                emergencies.push({
                    priority: 'high',
                    concern: 'Acute Chest Pain - Cardiac Event Risk',
                    observations: [`Condition: ${conditionName}`, `Onset: ${condition.date || 'Recent'}`],
                    action: 'Within 30 minutes: 12-lead ECG, troponin levels, cardiology consult, continuous monitoring.'
                });
            }
            
            if (conditionName.toLowerCase().includes('fractured femur')) {
                emergencies.push({
                    priority: 'monitor',
                    concern: 'Post-Fracture Monitoring - Fat Embolism Risk',
                    observations: [`Condition: ${conditionName}`, `Onset: ${condition.date || 'Recent'}`],
                    action: 'Monitor: Respiratory status, neurological signs, platelet count. Orthopedic follow-up scheduled.'
                });
            }
        });
        
        return emergencies;
    };

    const renderEmergencies = () => {
        const container = document.getElementById('emergency-alerts');
        const criticalCount = document.getElementById('critical-count');
        const highCount = document.getElementById('high-count');
        const monitorCount = document.getElementById('monitor-count');
        const totalReviewed = document.getElementById('total-reviewed');
        
        let allEmergencies = [];
        let totalPatients = 0;
        
        if (data.patient && data.patient.id === 'all' && data.patients) {
            // All patients view
            totalPatients = data.patients.length;
            
            data.patients.forEach(patient => {
                const emergencies = assessEmergencyRisk(patient);
                emergencies.forEach(emergency => {
                    allEmergencies.push({
                        ...emergency,
                        patient: patient
                    });
                });
            });
        } else if (data.patient && data.patient.id !== 'all') {
            // Single patient view
            totalPatients = 1;
            const emergencies = assessEmergencyRisk({ data: data });
            emergencies.forEach(emergency => {
                allEmergencies.push({
                    ...emergency,
                    patient: data.patient
                });
            });
        }
        
        // Sort by priority
        const priorityOrder = { 'critical': 0, 'high': 1, 'monitor': 2 };
        allEmergencies.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);
        
        // Count by priority
        const counts = {
            critical: allEmergencies.filter(e => e.priority === 'critical').length,
            high: allEmergencies.filter(e => e.priority === 'high').length,
            monitor: allEmergencies.filter(e => e.priority === 'monitor').length
        };
        
        // Update summary counts
        criticalCount.textContent = counts.critical;
        highCount.textContent = counts.high;
        monitorCount.textContent = counts.monitor;
        totalReviewed.textContent = totalPatients;
        
        if (allEmergencies.length === 0) {
            container.innerHTML = `
                <div class="no-emergencies">
                    <div class="icon">
                        <i class="fas fa-check-circle"></i>
                    </div>
                    <h4>No Active Clinical Emergencies</h4>
                    <p>All ${totalPatients} patient${totalPatients !== 1 ? 's' : ''} reviewed. No urgent concerns identified for the next 24-72 hours.</p>
                </div>
            `;
            return;
        }
        
        const emergencyHTML = allEmergencies.map(emergency => {
            const patient = emergency.patient;
            const priorityClass = emergency.priority;
            const priorityLabel = emergency.priority.charAt(0).toUpperCase() + emergency.priority.slice(1);
            const priorityColor = {
                'critical': 'danger',
                'high': 'warning',
                'monitor': 'info'
            }[emergency.priority];
            
            // Get location info (simplified for demo)
            const bedInfo = `Bed ${Math.floor(Math.random() * 20) + 1}`;
            const wardInfo = `Ward ${['A', 'B', 'C', 'ICU', 'CCU'][Math.floor(Math.random() * 5)]}`;
            
            const observationsHTML = emergency.observations.map(obs => {
                const [label, value] = obs.split(': ');
                return `
                    <div class="observation-item">
                        <div class="observation-value">${value || label}</div>
                        <div class="observation-label">${label}</div>
                    </div>
                `;
            }).join('');
            
            return `
                <div class="emergency-card ${priorityClass}">
                    <div class="emergency-header">
                        <div class="patient-info">
                            <h5>${patient.name || 'Unknown Patient'}</h5>
                            <div class="location-info">
                                <i class="fas fa-bed me-1"></i>${bedInfo} • 
                                <i class="fas fa-hospital me-1"></i>${wardInfo}
                            </div>
                        </div>
                        <span class="badge bg-${priorityColor} priority-badge">${priorityLabel}</span>
                    </div>
                    <div class="emergency-body">
                        <div class="concern-section">
                            <h6><i class="fas fa-exclamation-circle me-1"></i>Concern</h6>
                            <div class="concern-content">${emergency.concern}</div>
                        </div>
                        
                        <div class="concern-section">
                            <h6><i class="fas fa-chart-line me-1"></i>Observations</h6>
                            <div class="observations-grid">
                                ${observationsHTML}
                            </div>
                        </div>
                        
                        <div class="concern-section">
                            <h6><i class="fas fa-tasks me-1"></i>Action Required</h6>
                            <div class="action-required">
                                <strong>Priority:</strong> ${emergency.action}
                            </div>
                        </div>
                    </div>
                </div>
            `;
        }).join('');
        
        container.innerHTML = emergencyHTML;
    };

    // Initialize the emergency review
    renderEmergencies();
});