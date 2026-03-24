// Global variables
let patientData = null;
let trendsChart = null;

// Initialize the application
document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
});

function initializeApp() {
    // Check if patient data is available
    if (typeof window.PATIENT_DATA !== 'undefined') {
        patientData = window.PATIENT_DATA;
        loadPatientInfo();
        loadRiskFactors();
        loadMedicationAnalysis();
        initializeTrendsChart();
    } else {
        console.warn('Patient data not available');
        showNoDataMessage();
    }
}

function loadPatientInfo() {
    const patientNameEl = document.getElementById('patientName');
    const patientDetailsEl = document.getElementById('patientDetails');
    
    if (patientData.patient && patientData.patient.id !== 'all') {
        const patient = patientData.patient;
        patientNameEl.textContent = patient.name || 'Unbekannter Patient';
        
        let details = [];
        if (patient.gender) {
            details.push(patient.gender === 'male' ? 'Männlich' : 'Weiblich');
        }
        if (patient.birthDate) {
            const age = calculateAge(patient.birthDate);
            details.push(`${age} Jahre`);
        }
        patientDetailsEl.textContent = details.join(' • ');
    } else if (patientData.patients && patientData.patients.length > 0) {
        patientNameEl.textContent = `${patientData.patients.length} Patienten`;
        patientDetailsEl.textContent = 'Mehrere Patienten ausgewählt';
    } else {
        patientNameEl.textContent = 'Keine Patientendaten';
        patientDetailsEl.textContent = 'Daten nicht verfügbar';
    }
}

function calculateAge(birthDate) {
    const today = new Date();
    const birth = new Date(birthDate);
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
        age--;
    }
    
    return age;
}

function loadRiskFactors() {
    // Age Risk
    let ageRisk = 'Niedrig';
    let ageProgress = 20;
    
    if (patientData.patient && patientData.patient.birthDate) {
        const age = calculateAge(patientData.patient.birthDate);
        if (age >= 80) {
            ageRisk = 'Hoch';
            ageProgress = 90;
        } else if (age >= 65) {
            ageRisk = 'Mittel';
            ageProgress = 60;
        }
        
        document.getElementById('ageRisk').textContent = `${age} Jahre - ${ageRisk}`;
    } else {
        document.getElementById('ageRisk').textContent = 'Keine Daten verfügbar';
    }
    
    updateRiskBar('ageProgress', ageProgress);
    
    // Medication Risk
    let medicationRisk = 'Niedrig';
    let medicationProgress = 20;
    let medicationCount = 0;
    
    if (patientData.medicationrequest && patientData.medicationrequest.summary) {
        medicationCount = patientData.medicationrequest.summary.length;
    } else if (patientData.patients) {
        patientData.patients.forEach(patient => {
            if (patient.data && patient.data.medicationrequest) {
                medicationCount += patient.data.medicationrequest.length;
            }
        });
    }
    
    if (medicationCount >= 10) {
        medicationRisk = 'Hoch';
        medicationProgress = 85;
    } else if (medicationCount >= 5) {
        medicationRisk = 'Mittel';
        medicationProgress = 55;
    }
    
    document.getElementById('medicationRisk').textContent = `${medicationCount} Medikamente - ${medicationRisk}`;
    updateRiskBar('medicationProgress', medicationProgress);
    
    // Vitals Risk
    let vitalsRisk = 'Niedrig';
    let vitalsProgress = 25;
    
    if (patientData.vital_signs && patientData.vital_signs.summary && patientData.vital_signs.summary.length > 0) {
        const latestVital = patientData.vital_signs.summary[0];
        if (latestVital.name && latestVital.name.includes('Temp')) {
            vitalsRisk = 'Mittel';
            vitalsProgress = 65;
        }
    } else if (patientData.patients) {
        patientData.patients.forEach(patient => {
            if (patient.data && patient.data.vital_signs) {
                patient.data.vital_signs.forEach(vital => {
                    if (vital.name && vital.name.includes('Temp')) {
                        vitalsRisk = 'Mittel';
                        vitalsProgress = 65;
                    }
                });
            }
        });
    }
    
    document.getElementById('vitalsRisk').textContent = vitalsRisk;
    updateRiskBar('vitalsProgress', vitalsProgress);
    
    // Lab Risk
    let labRisk = 'Niedrig';
    let labProgress = 30;
    
    if (patientData.observation && patientData.observation.summary && patientData.observation.summary.length > 0) {
        labRisk = 'Mittel';
        labProgress = 50;
    } else if (patientData.patients) {
        let hasLabs = false;
        patientData.patients.forEach(patient => {
            if (patient.data && patient.data.observation && patient.data.observation.length > 0) {
                hasLabs = true;
            }
        });
        if (hasLabs) {
            labRisk = 'Mittel';
            labProgress = 50;
        }
    }
    
    document.getElementById('labRisk').textContent = labRisk;
    updateRiskBar('labProgress', labProgress);
    
    // Overall Risk
    const overallScore = Math.round((ageProgress + medicationProgress + vitalsProgress + labProgress) / 4);
    let overallCategory = 'Niedrig';
    
    if (overallScore >= 70) {
        overallCategory = 'Hoch';
    } else if (overallScore >= 40) {
        overallCategory = 'Mittel';
    }
    
    document.getElementById('overallRiskScore').textContent = overallScore;
    document.getElementById('overallRiskCategory').textContent = overallCategory;
    document.getElementById('overallRiskCategory').className = `risk-category ${overallCategory.toLowerCase()}`;
}

function updateRiskBar(elementId, progress) {
    const element = document.getElementById(elementId);
    element.style.width = `${progress}%`;
    
    if (progress >= 70) {
        element.className = 'risk-progress high';
    } else if (progress >= 40) {
        element.className = 'risk-progress medium';
    } else {
        element.className = 'risk-progress low';
    }
}

function loadMedicationAnalysis() {
    const medicationListEl = document.getElementById('medicationList');
    const antiScoreEl = document.getElementById('antiScore');
    const recommendationsEl = document.getElementById('medicationRecommendations');
    
    let medications = [];
    let totalAntiScore = 0;
    
    // Collect medications
    if (patientData.medicationrequest && patientData.medicationrequest.summary) {
        medications = patientData.medicationrequest.summary;
    } else if (patientData.patients) {
        patientData.patients.forEach(patient => {
            if (patient.data && patient.data.medicationrequest) {
                medications = medications.concat(patient.data.medicationrequest);
            }
        });
    }
    
    if (medications.length === 0) {
        medicationListEl.innerHTML = '<div class="text-center text-muted">Keine Medikamentendaten verfügbar</div>';
        antiScoreEl.textContent = '0';
        return;
    }
    
    // Render medications
    let medicationHtml = '';
    medications.forEach(med => {
        const riskLevel = assessMedicationRisk(med.name);
        const antiScore = getAnticholinergicScore(med.name);
        totalAntiScore += antiScore;
        
        medicationHtml += `
            <div class="medication-item ${riskLevel.class}">
                <div class="medication-name">${med.name || 'Unbekanntes Medikament'}</div>
                <div class="medication-dose">${med.status || 'Keine Dosierung'}</div>
                <div class="medication-risk text-${riskLevel.color}">${riskLevel.text}</div>
            </div>
        `;
    });
    
    medicationListEl.innerHTML = medicationHtml;
    
    // Update anticholinergic score
    antiScoreEl.textContent = totalAntiScore;
    if (totalAntiScore >= 5) {
        antiScoreEl.className = 'score-circle high';
    } else if (totalAntiScore >= 3) {
        antiScoreEl.className = 'score-circle medium';
    } else {
        antiScoreEl.className = 'score-circle';
    }
    
    // Generate recommendations
    let recommendations = '';
    if (totalAntiScore >= 3) {
        recommendations = `
            <div class="alert alert-warning">
                <strong>Empfehlung:</strong> Anticholinergic Burden Score ist erhöht (${totalAntiScore}). 
                Medikamentenreview empfohlen.
            </div>
        `;
    } else {
        recommendations = `
            <div class="alert alert-success">
                <strong>Status:</strong> Anticholinergic Burden Score ist akzeptabel (${totalAntiScore}).
            </div>
        `;
    }
    
    recommendationsEl.innerHTML = recommendations;
}

function assessMedicationRisk(medicationName) {
    if (!medicationName) return { class: '', color: 'muted', text: 'Unbekannt' };
    
    const name = medicationName.toLowerCase();
    
    // High-risk medications for delirium
    const highRiskMeds = ['haloperidol', 'diphenhydramine', 'scopolamine', 'atropine', 'benztropine'];
    const mediumRiskMeds = ['lorazepam', 'diazepam', 'morphine', 'tramadol', 'amitriptyline'];
    
    if (highRiskMeds.some(med => name.includes(med))) {
        return { class: 'high-risk', color: 'danger', text: 'Hohes Delirium-Risiko' };
    } else if (mediumRiskMeds.some(med => name.includes(med))) {
        return { class: 'medium-risk', color: 'warning', text: 'Mittleres Delirium-Risiko' };
    }
    
    return { class: '', color: 'success', text: 'Niedriges Risiko' };
}

function getAnticholinergicScore(medicationName) {
    if (!medicationName) return 0;
    
    const name = medicationName.toLowerCase();
    
    // Simplified anticholinergic scoring
    if (name.includes('atropine') || name.includes('scopolamine')) return 3;
    if (name.includes('diphenhydramine') || name.includes('amitriptyline')) return 2;
    if (name.includes('tramadol') || name.includes('morphine')) return 1;
    
    return 0;
}

function calculateCamIcu() {
    const rassScore = document.getElementById('rassScore').value;
    const attention = document.querySelector('input[name="attention"]:checked');
    const thinking = document.querySelector('input[name="thinking"]:checked');
    const consciousness = document.querySelector('input[name="consciousness"]:checked');
    
    if (!rassScore || !attention || !thinking || !consciousness) {
        alert('Bitte füllen Sie alle Bewertungsfelder aus.');
        return;
    }
    
    // CAM-ICU Algorithm
    let camPositive = false;
    let resultText = '';
    let recommendation = '';
    let alertClass = '';
    
    // Feature 1: Acute onset or fluctuating course (assumed present if RASS changed)
    const feature1 = true;
    
    // Feature 2: Inattention
    const feature2 = attention.value === 'impaired';
    
    // Feature 3: Disorganized thinking
    const feature3 = thinking.value === 'disorganized';
    
    // Feature 4: Altered level of consciousness
    const feature4 = consciousness.value === 'altered' || parseInt(rassScore) !== 0;
    
    // CAM-ICU is positive if Features 1 AND 2 AND (3 OR 4)
    camPositive = feature1 && feature2 && (feature3 || feature4);
    
    if (camPositive) {
        resultText = 'CAM-ICU POSITIV - Delirium wahrscheinlich';
        recommendation = 'Sofortige klinische Bewertung und Intervention erforderlich.';
        alertClass = 'alert-danger';
    } else {
        resultText = 'CAM-ICU NEGATIV - Kein Delirium';
        recommendation = 'Weiterhin regelmäßige Überwachung empfohlen.';
        alertClass = 'alert-success';
    }
    
    // Show result
    const resultEl = document.getElementById('camResult');
    const alertEl = document.getElementById('camAlert');
    const resultTextEl = document.getElementById('camResultText');
    const recommendationEl = document.getElementById('camRecommendation');
    
    alertEl.className = `alert ${alertClass}`;
    resultTextEl.textContent = resultText;
    recommendationEl.textContent = recommendation;
    resultEl.style.display = 'block';
}

function initializeTrendsChart() {
    const ctx = document.getElementById('trendsChart');
    if (!ctx) return;
    
    // Sample data for demonstration
    const labels = ['Tag 1', 'Tag 2', 'Tag 3', 'Tag 4', 'Tag 5', 'Tag 6', 'Tag 7'];
    const riskScores = [25, 30, 45, 40, 55, 50, 35];
    const camScores = [0, 0, 1, 1, 1, 0, 0];
    
    trendsChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: 'Risiko-Score',
                data: riskScores,
                borderColor: '#3b82f6',
                backgroundColor: 'rgba(59, 130, 246, 0.1)',
                tension: 0.4,
                yAxisID: 'y'
            }, {
                label: 'CAM-ICU',
                data: camScores,
                borderColor: '#ef4444',
                backgroundColor: 'rgba(239, 68, 68, 0.1)',
                tension: 0.4,
                yAxisID: 'y1'
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'top',
                }
            },
            scales: {
                y: {
                    type: 'linear',
                    display: true,
                    position: 'left',
                    title: {
                        display: true,
                        text: 'Risiko-Score'
                    }
                },
                y1: {
                    type: 'linear',
                    display: true,
                    position: 'right',
                    title: {
                        display: true,
                        text: 'CAM-ICU'
                    },
                    grid: {
                        drawOnChartArea: false,
                    },
                    min: 0,
                    max: 1
                }
            }
        }
    });
}

function showNoDataMessage() {
    const patientNameEl = document.getElementById('patientName');
    const patientDetailsEl = document.getElementById('patientDetails');
    
    patientNameEl.textContent = 'Keine Patientendaten verfügbar';
    patientDetailsEl.textContent = 'Bitte wählen Sie einen Patienten aus';
    
    // Show no data messages in other sections
    document.getElementById('ageRisk').textContent = 'Keine Daten verfügbar';
    document.getElementById('medicationRisk').textContent = 'Keine Daten verfügbar';
    document.getElementById('vitalsRisk').textContent = 'Keine Daten verfügbar';
    document.getElementById('labRisk').textContent = 'Keine Daten verfügbar';
    
    document.getElementById('medicationList').innerHTML = 
        '<div class="text-center text-muted">Keine Patientendaten verfügbar</div>';
}