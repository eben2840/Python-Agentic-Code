// Early Warning Score calculation functions
function calculateRespiratoryRateScore(rate) {
    if (!rate || isNaN(rate)) return 0;
    const r = parseFloat(rate);
    if (r <= 8 || r >= 25) return 3;
    if ((r >= 9 && r <= 11) || (r >= 21 && r <= 24)) return 1;
    if (r >= 12 && r <= 20) return 0;
    return 0;
}

function calculateOxygenSatScore(sat) {
    if (!sat || isNaN(sat)) return 0;
    const s = parseFloat(sat);
    if (s <= 91) return 3;
    if (s >= 92 && s <= 93) return 2;
    if (s >= 94 && s <= 95) return 1;
    if (s >= 96) return 0;
    return 0;
}

function calculateTemperatureScore(temp) {
    if (!temp || isNaN(temp)) return 0;
    const t = parseFloat(temp);
    if (t <= 35.0 || t >= 39.1) return 2;
    if ((t >= 35.1 && t <= 36.0) || (t >= 38.1 && t <= 39.0)) return 1;
    if (t >= 36.1 && t <= 38.0) return 0;
    return 0;
}

function calculateSystolicBPScore(bp) {
    if (!bp || isNaN(bp)) return 0;
    const b = parseFloat(bp);
    if (b <= 90 || b >= 220) return 3;
    if (b >= 91 && b <= 100) return 2;
    if (b >= 101 && b <= 110) return 1;
    if (b >= 111 && b <= 219) return 0;
    return 0;
}

function calculateHeartRateScore(hr) {
    if (!hr || isNaN(hr)) return 0;
    const h = parseFloat(hr);
    if (h <= 40 || h >= 131) return 3;
    if (h >= 111 && h <= 130) return 2;
    if ((h >= 41 && h <= 50) || (h >= 91 && h <= 110)) return 1;
    if (h >= 51 && h <= 90) return 0;
    return 0;
}

function calculateConsciousnessScore(consciousness) {
    if (!consciousness) return 0;
    const c = consciousness.toLowerCase();
    if (c.includes('alert') || c.includes('awake')) return 0;
    return 3; // Voice, Pain, or Unresponsive
}

function extractVitalValue(observation) {
    if (!observation) return null;
    
    // Try to extract numeric value from the observation name or value
    const text = (observation.name || observation.value || '').toString();
    const match = text.match(/(\d+\.?\d*)/);
    return match ? parseFloat(match[1]) : null;
}

function extractBPValues(observation) {
    if (!observation) return { systolic: null, diastolic: null };
    
    const text = (observation.name || observation.value || '').toString();
    const bpMatch = text.match(/(\d+)\/(\d+)/);
    
    if (bpMatch) {
        return {
            systolic: parseFloat(bpMatch[1]),
            diastolic: parseFloat(bpMatch[2])
        };
    }
    
    return { systolic: null, diastolic: null };
}

function calculatePatientEWS(patient) {
    if (!patient.data) return { score: 0, components: {} };
    
    let totalScore = 0;
    const components = {
        respiratoryRate: { value: null, score: 0 },
        oxygenSat: { value: null, score: 0 },
        temperature: { value: null, score: 0 },
        systolicBP: { value: null, score: 0 },
        heartRate: { value: null, score: 0 },
        consciousness: { value: null, score: 0 }
    };
    
    // Process all observations and vital signs
    const allObservations = [
        ...(patient.data.observation || []),
        ...(patient.data.vital_signs || [])
    ];
    
    allObservations.forEach(obs => {
        if (!obs) return;
        
        const text = (obs.name || obs.value || '').toLowerCase();
        
        // Respiratory Rate
        if (text.includes('respiratory') || text.includes('resp') || text.includes('rr')) {
            const value = extractVitalValue(obs);
            if (value) {
                components.respiratoryRate.value = value;
                components.respiratoryRate.score = calculateRespiratoryRateScore(value);
            }
        }
        
        // Oxygen Saturation
        if (text.includes('oxygen') || text.includes('o2') || text.includes('sat') || text.includes('spo2')) {
            const value = extractVitalValue(obs);
            if (value) {
                components.oxygenSat.value = value;
                components.oxygenSat.score = calculateOxygenSatScore(value);
            }
        }
        
        // Temperature
        if (text.includes('temp') || text.includes('°c') || text.includes('celsius') || text.includes('fever')) {
            const value = extractVitalValue(obs);
            if (value) {
                components.temperature.value = value;
                components.temperature.score = calculateTemperatureScore(value);
            }
        }
        
        // Blood Pressure
        if (text.includes('bp') || text.includes('blood pressure') || text.includes('systolic') || text.includes('/')) {
            const bpValues = extractBPValues(obs);
            if (bpValues.systolic) {
                components.systolicBP.value = bpValues.systolic;
                components.systolicBP.score = calculateSystolicBPScore(bpValues.systolic);
            }
        }
        
        // Heart Rate
        if (text.includes('heart') || text.includes('hr') || text.includes('pulse') || text.includes('bpm')) {
            const value = extractVitalValue(obs);
            if (value) {
                components.heartRate.value = value;
                components.heartRate.score = calculateHeartRateScore(value);
            }
        }
        
        // Consciousness (look for mental status indicators)
        if (text.includes('conscious') || text.includes('alert') || text.includes('mental') || 
            text.includes('gcs') || text.includes('avpu') || text.includes('responsive')) {
            components.consciousness.value = obs.name || obs.value;
            components.consciousness.score = calculateConsciousnessScore(obs.name || obs.value);
        }
    });
    
    // Calculate total score
    totalScore = Object.values(components).reduce((sum, comp) => sum + comp.score, 0);
    
    return { score: totalScore, components };
}

function getEWSRiskLevel(score) {
    if (score >= 7) return 'critical';
    if (score >= 5) return 'high';
    if (score >= 3) return 'medium';
    return 'low';
}

function getEWSRiskLabel(score) {
    if (score >= 7) return 'Critical';
    if (score >= 5) return 'High';
    if (score >= 3) return 'Medium';
    return 'Low';
}

function formatVitalValue(component, type) {
    if (!component.value) return 'N/A';
    
    switch (type) {
        case 'respiratoryRate':
            return `${component.value}/min`;
        case 'oxygenSat':
            return `${component.value}%`;
        case 'temperature':
            return `${component.value}°C`;
        case 'systolicBP':
            return `${component.value} mmHg`;
        case 'heartRate':
            return `${component.value}/min`;
        case 'consciousness':
            return component.value || 'Alert';
        default:
            return component.value;
    }
}

function renderPatientCard(patient, ewsData) {
    const riskLevel = getEWSRiskLevel(ewsData.score);
    const riskLabel = getEWSRiskLabel(ewsData.score);
    
    const age = patient.birthDate ? 
        new Date().getFullYear() - new Date(patient.birthDate).getFullYear() : 'Unknown';
    
    return `
        <div class="patient-card">
            <div class="patient-header">
                <div class="patient-info">
                    <h3>${patient.name || 'Unknown Patient'}</h3>
                    <div class="patient-details">
                        ${patient.gender || 'Unknown'} • Age ${age} • ID: ${patient.id}
                    </div>
                </div>
                <div class="ews-badge ews-${riskLevel}">
                    EWS: ${ewsData.score}
                    <div style="font-size: 0.75rem; font-weight: normal;">${riskLabel}</div>
                </div>
            </div>
            
            <div class="vital-signs">
                <div class="vital-item">
                    <div class="vital-value">${formatVitalValue(ewsData.components.respiratoryRate, 'respiratoryRate')}</div>
                    <div class="vital-label">Resp Rate</div>
                    <div class="vital-score score-${ewsData.components.respiratoryRate.score}">${ewsData.components.respiratoryRate.score}</div>
                </div>
                
                <div class="vital-item">
                    <div class="vital-value">${formatVitalValue(ewsData.components.oxygenSat, 'oxygenSat')}</div>
                    <div class="vital-label">O2 Sat</div>
                    <div class="vital-score score-${ewsData.components.oxygenSat.score}">${ewsData.components.oxygenSat.score}</div>
                </div>
                
                <div class="vital-item">
                    <div class="vital-value">${formatVitalValue(ewsData.components.temperature, 'temperature')}</div>
                    <div class="vital-label">Temp</div>
                    <div class="vital-score score-${ewsData.components.temperature.score}">${ewsData.components.temperature.score}</div>
                </div>
                
                <div class="vital-item">
                    <div class="vital-value">${formatVitalValue(ewsData.components.systolicBP, 'systolicBP')}</div>
                    <div class="vital-label">Sys BP</div>
                    <div class="vital-score score-${ewsData.components.systolicBP.score}">${ewsData.components.systolicBP.score}</div>
                </div>
                
                <div class="vital-item">
                    <div class="vital-value">${formatVitalValue(ewsData.components.heartRate, 'heartRate')}</div>
                    <div class="vital-label">Heart Rate</div>
                    <div class="vital-score score-${ewsData.components.heartRate.score}">${ewsData.components.heartRate.score}</div>
                </div>
                
                <div class="vital-item">
                    <div class="vital-value">${formatVitalValue(ewsData.components.consciousness, 'consciousness')}</div>
                    <div class="vital-label">Conscious</div>
                    <div class="vital-score score-${ewsData.components.consciousness.score}">${ewsData.components.consciousness.score}</div>
                </div>
            </div>
        </div>
    `;
}

function renderDashboard() {
    const data = window.PATIENT_DATA;
    
    if (!data) {
        document.getElementById('patientsGrid').innerHTML = `
            <div class="no-data">
                <i class="fas fa-exclamation-triangle"></i>
                <h3>No data available</h3>
                <p>Patient data is not loaded</p>
            </div>
        `;
        return;
    }
    
    if (data.patient && data.patient.id !== 'all') {
        // Single patient view
        const ewsData = calculatePatientEWS(data.patient);
        document.getElementById('patientsGrid').innerHTML = renderPatientCard(data.patient, ewsData);
        
        // Update summary counts
        const riskLevel = getEWSRiskLevel(ewsData.score);
        document.getElementById('criticalCount').textContent = riskLevel === 'critical' ? '1' : '0';
        document.getElementById('highCount').textContent = riskLevel === 'high' ? '1' : '0';
        document.getElementById('mediumCount').textContent = riskLevel === 'medium' ? '1' : '0';
        document.getElementById('lowCount').textContent = riskLevel === 'low' ? '1' : '0';
        
    } else if (data.patients && Array.isArray(data.patients)) {
        // All patients view
        const patientCards = [];
        const riskCounts = { critical: 0, high: 0, medium: 0, low: 0 };
        
        data.patients.forEach(patient => {
            const ewsData = calculatePatientEWS(patient);
            patientCards.push(renderPatientCard(patient, ewsData));
            
            const riskLevel = getEWSRiskLevel(ewsData.score);
            riskCounts[riskLevel]++;
        });
        
        if (patientCards.length === 0) {
            document.getElementById('patientsGrid').innerHTML = `
                <div class="no-data">
                    <i class="fas fa-users"></i>
                    <h3>No patients found</h3>
                    <p>No patient data available for EWS calculation</p>
                </div>
            `;
        } else {
            document.getElementById('patientsGrid').innerHTML = patientCards.join('');
        }
        
        // Update summary counts
        document.getElementById('criticalCount').textContent = riskCounts.critical;
        document.getElementById('highCount').textContent = riskCounts.high;
        document.getElementById('mediumCount').textContent = riskCounts.medium;
        document.getElementById('lowCount').textContent = riskCounts.low;
        
    } else {
        document.getElementById('patientsGrid').innerHTML = `
            <div class="no-data">
                <i class="fas fa-database"></i>
                <h3>No data available</h3>
                <p>Unable to load patient information</p>
            </div>
        `;
    }
}

// Initialize the dashboard when the page loads
document.addEventListener('DOMContentLoaded', function() {
    renderDashboard();
});

// Refresh data every 30 seconds if needed
setInterval(renderDashboard, 30000);