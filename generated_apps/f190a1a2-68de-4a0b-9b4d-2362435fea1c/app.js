document.addEventListener('DOMContentLoaded', function() {
    loadElevatedBPPatients();
});

function loadElevatedBPPatients() {
    // Check if patient data is available
    if (!window.PATIENT_DATA) {
        showNoData();
        return;
    }

    const data = window.PATIENT_DATA;
    
    // Check if we're in "all patients" mode
    if (data.patient.id !== 'all' || !data.patients) {
        showNoData();
        return;
    }

    // Filter patients with elevated blood pressure
    const elevatedBPPatients = filterElevatedBPPatients(data.patients);
    
    if (elevatedBPPatients.length === 0) {
        showNoData();
        return;
    }

    // Update summary statistics
    updateSummaryStats(elevatedBPPatients);
    
    // Display patients
    displayPatients(elevatedBPPatients);
}

function filterElevatedBPPatients(patients) {
    const elevatedPatients = [];
    
    patients.forEach(patient => {
        if (!patient.data) return;
        
        // Check vital signs and observations for blood pressure readings
        const bpReadings = [];
        
        // Check vital_signs
        if (patient.data.vital_signs) {
            patient.data.vital_signs.forEach(vital => {
                if (vital.name && vital.name.toLowerCase().includes('bp')) {
                    const bpValue = extractBPValue(vital.name);
                    if (bpValue && isElevatedBP(bpValue)) {
                        bpReadings.push({
                            reading: vital.name,
                            date: vital.date,
                            systolic: bpValue.systolic,
                            diastolic: bpValue.diastolic
                        });
                    }
                }
            });
        }
        
        // Check observations
        if (patient.data.observation) {
            patient.data.observation.forEach(obs => {
                if (obs.name && obs.name.toLowerCase().includes('bp')) {
                    const bpValue = extractBPValue(obs.name);
                    if (bpValue && isElevatedBP(bpValue)) {
                        bpReadings.push({
                            reading: obs.name,
                            date: obs.date,
                            systolic: bpValue.systolic,
                            diastolic: bpValue.diastolic
                        });
                    }
                }
            });
        }
        
        if (bpReadings.length > 0) {
            elevatedPatients.push({
                ...patient,
                bpReadings: bpReadings
            });
        }
    });
    
    return elevatedPatients;
}

function extractBPValue(bpString) {
    // Extract BP values from strings like "BP 140/90"
    const match = bpString.match(/(\d+)\/(\d+)/);
    if (match) {
        return {
            systolic: parseInt(match[1]),
            diastolic: parseInt(match[2])
        };
    }
    return null;
}

function isElevatedBP(bpValue) {
    // Consider BP elevated if systolic >= 130 OR diastolic >= 80
    return bpValue.systolic >= 130 || bpValue.diastolic >= 80;
}

function updateSummaryStats(patients) {
    const totalPatients = patients.length;
    let totalSystolic = 0;
    let totalDiastolic = 0;
    let readingCount = 0;
    
    patients.forEach(patient => {
        patient.bpReadings.forEach(reading => {
            totalSystolic += reading.systolic;
            totalDiastolic += reading.diastolic;
            readingCount++;
        });
    });
    
    const avgSystolic = readingCount > 0 ? Math.round(totalSystolic / readingCount) : 0;
    const avgDiastolic = readingCount > 0 ? Math.round(totalDiastolic / readingCount) : 0;
    
    document.getElementById('totalPatients').textContent = totalPatients;
    document.getElementById('avgSystolic').textContent = avgSystolic > 0 ? avgSystolic : '--';
    document.getElementById('avgDiastolic').textContent = avgDiastolic > 0 ? avgDiastolic : '--';
}

function displayPatients(patients) {
    const patientsList = document.getElementById('patientsList');
    
    let html = '';
    
    patients.forEach(patient => {
        const age = calculateAge(patient.birthDate);
        const latestBP = patient.bpReadings[0]; // Get the first (most recent) BP reading
        
        html += `
            <div class="patient-item">
                <div class="patient-name">${escapeHtml(patient.name || 'Unknown Patient')}</div>
                <div class="patient-details">
                    ID: ${escapeHtml(patient.id || 'N/A')} • Age: ${age} • 
                    <span class="gender-badge gender-${patient.gender || 'unknown'}">${formatGender(patient.gender)}</span>
                </div>
                <div class="bp-reading">
                    <i class="fas fa-heartbeat"></i>
                    ${escapeHtml(latestBP.reading)}
                </div>
                <div class="patient-meta">
                    <div class="meta-item">
                        <i class="fas fa-calendar"></i>
                        ${formatDate(latestBP.date)}
                    </div>
                    <div class="meta-item">
                        <i class="fas fa-chart-line"></i>
                        ${patient.bpReadings.length} reading${patient.bpReadings.length !== 1 ? 's' : ''}
                    </div>
                    ${patient.data.condition ? `
                        <div class="meta-item">
                            <i class="fas fa-notes-medical"></i>
                            ${patient.data.condition.length} condition${patient.data.condition.length !== 1 ? 's' : ''}
                        </div>
                    ` : ''}
                </div>
            </div>
        `;
    });
    
    patientsList.innerHTML = html;
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

function formatGender(gender) {
    if (!gender) return 'Unknown';
    return gender.charAt(0).toUpperCase() + gender.slice(1);
}

function formatDate(dateString) {
    if (!dateString) return 'Unknown date';
    
    try {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
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
    document.getElementById('patientsList').style.display = 'none';
    document.getElementById('noDataMessage').style.display = 'block';
    
    // Reset stats
    document.getElementById('totalPatients').textContent = '0';
    document.getElementById('avgSystolic').textContent = '--';
    document.getElementById('avgDiastolic').textContent = '--';
}