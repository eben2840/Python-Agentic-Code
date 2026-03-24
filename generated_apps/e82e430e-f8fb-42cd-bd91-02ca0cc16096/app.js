// Global variables
let bvcScore = 0;
let dasaScore = 0;
let assessmentData = {
    bvc: {},
    dasa: {},
    timestamp: null,
    notes: ''
};

// BVC Items (German)
const bvcItems = [
    {
        id: 'bvc1',
        text: 'Verwirrung',
        description: 'Patient zeigt Orientierungslosigkeit oder Verwirrung'
    },
    {
        id: 'bvc2',
        text: 'Reizbarkeit',
        description: 'Patient ist leicht reizbar oder zeigt Anzeichen von Frustration'
    },
    {
        id: 'bvc3',
        text: 'Lärm',
        description: 'Patient macht übermäßigen Lärm oder ist laut'
    },
    {
        id: 'bvc4',
        text: 'Körperliche Bedrohung',
        description: 'Patient droht anderen körperlich oder zeigt aggressive Gesten'
    },
    {
        id: 'bvc5',
        text: 'Verbale Bedrohung',
        description: 'Patient äußert verbale Drohungen gegen andere'
    },
    {
        id: 'bvc6',
        text: 'Angriff auf Gegenstände',
        description: 'Patient beschädigt oder greift Gegenstände an'
    }
];

// DASA Items (German)
const dasaItems = [
    {
        id: 'dasa1',
        text: 'Negative Einstellungen',
        description: 'Feindseligkeit, Zynismus oder negative Einstellung gegenüber anderen'
    },
    {
        id: 'dasa2',
        text: 'Impulsivität',
        description: 'Handelt ohne nachzudenken oder zeigt impulsives Verhalten'
    },
    {
        id: 'dasa3',
        text: 'Reizbarkeit',
        description: 'Leicht erregbar, ungeduldig oder frustriert'
    },
    {
        id: 'dasa4',
        text: 'Verbale Bedrohung',
        description: 'Äußert Drohungen oder aggressive Sprache'
    },
    {
        id: 'dasa5',
        text: 'Körperliche Bedrohung',
        description: 'Zeigt bedrohliche Körperhaltung oder Gesten'
    },
    {
        id: 'dasa6',
        text: 'Angriff auf Gegenstände',
        description: 'Beschädigt oder wirft Gegenstände'
    },
    {
        id: 'dasa7',
        text: 'Körperlicher Angriff',
        description: 'Körperliche Gewalt gegen Personen oder sich selbst'
    }
];

// Initialize the application
document.addEventListener('DOMContentLoaded', function() {
    initializePatientData();
    renderAssessmentItems();
    updateTimestamp();
    
    // Set up event listeners
    document.getElementById('assessmentNotes').addEventListener('input', function() {
        assessmentData.notes = this.value;
    });
});

function initializePatientData() {
    if (!window.PATIENT_DATA) {
        console.warn('No patient data available');
        return;
    }

    const data = window.PATIENT_DATA;
    
    if (data.patient && data.patient.id !== 'all') {
        // Single patient
        const patient = data.patient;
        document.getElementById('patientName').textContent = patient.name || 'Unbekannter Patient';
        
        const age = patient.birthDate ? calculateAge(patient.birthDate) : 'Unbekannt';
        const gender = patient.gender === 'male' ? 'Männlich' : 
                      patient.gender === 'female' ? 'Weiblich' : 'Unbekannt';
        
        document.getElementById('patientDetails').textContent = `${gender}, ${age} Jahre`;
        
        // Load relevant patient data
        loadPatientObservations(data);
        loadPatientMedications(data);
        loadPatientConditions(data);
        loadPatientEncounters(data);
    } else {
        // All patients view - show summary
        document.getElementById('patientName').textContent = 'Alle Patienten';
        document.getElementById('patientDetails').textContent = 'Übersichtsansicht';
        
        loadAllPatientsData(data);
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

function loadPatientObservations(data) {
    const container = document.getElementById('patientObservations');
    const observations = data.observation?.summary || [];
    
    if (observations.length === 0) {
        container.innerHTML = '<div class="no-data">Keine relevanten Beobachtungen verfügbar</div>';
        return;
    }
    
    const relevantObs = observations.filter(obs => 
        obs.name && (
            obs.name.toLowerCase().includes('verhalten') ||
            obs.name.toLowerCase().includes('aggression') ||
            obs.name.toLowerCase().includes('stimmung') ||
            obs.name.toLowerCase().includes('psychisch') ||
            obs.name.toLowerCase().includes('schmerz') ||
            obs.name.toLowerCase().includes('angst')
        )
    );
    
    if (relevantObs.length === 0) {
        container.innerHTML = '<div class="no-data">Keine verhaltensrelevanten Beobachtungen</div>';
        return;
    }
    
    container.innerHTML = relevantObs.map(obs => `
        <div class="data-item">
            <span class="label">${obs.name}:</span>
            <span class="value">${obs.value || 'Keine Angabe'}</span>
            ${obs.date ? `<div class="text-muted small mt-1">${formatDate(obs.date)}</div>` : ''}
        </div>
    `).join('');
}

function loadPatientMedications(data) {
    const container = document.getElementById('patientMedications');
    const medications = data.medicationrequest?.summary || [];
    
    if (medications.length === 0) {
        container.innerHTML = '<div class="no-data">Keine Medikationsdaten verfügbar</div>';
        return;
    }
    
    container.innerHTML = medications.map(med => `
        <div class="data-item">
            <span class="label">${med.name || 'Unbekannte Medikation'}:</span>
            <span class="value">${med.value || 'Keine Dosierung'}</span>
            ${med.status ? `<div class="text-muted small mt-1">Status: ${med.status}</div>` : ''}
        </div>
    `).join('');
}

function loadPatientConditions(data) {
    const container = document.getElementById('patientConditions');
    const conditions = data.condition?.summary || [];
    
    if (conditions.length === 0) {
        container.innerHTML = '<div class="no-data">Keine relevanten Diagnosen verfügbar</div>';
        return;
    }
    
    const relevantConditions = conditions.filter(cond => 
        cond.name && (
            cond.name.toLowerCase().includes('psychisch') ||
            cond.name.toLowerCase().includes('depression') ||
            cond.name.toLowerCase().includes('angst') ||
            cond.name.toLowerCase().includes('bipolar') ||
            cond.name.toLowerCase().includes('schizophrenie') ||
            cond.name.toLowerCase().includes('demenz') ||
            cond.name.toLowerCase().includes('sucht')
        )
    );
    
    if (relevantConditions.length === 0) {
        container.innerHTML = '<div class="no-data">Keine verhaltensrelevanten Diagnosen</div>';
        return;
    }
    
    container.innerHTML = relevantConditions.map(cond => `
        <div class="data-item">
            <span class="label">${cond.name}:</span>
            <span class="value">${cond.status || 'Aktiv'}</span>
            ${cond.date ? `<div class="text-muted small mt-1">${formatDate(cond.date)}</div>` : ''}
        </div>
    `).join('');
}

function loadPatientEncounters(data) {
    const container = document.getElementById('patientEncounters');
    const encounters = data.encounter?.summary || [];
    
    if (encounters.length === 0) {
        container.innerHTML = '<div class="no-data">Keine früheren Ereignisse dokumentiert</div>';
        return;
    }
    
    container.innerHTML = encounters.slice(0, 5).map(enc => `
        <div class="data-item">
            <span class="label">Behandlung:</span>
            <span class="value">${enc.name || 'Unbekannt'}</span>
            ${enc.date ? `<div class="text-muted small mt-1">${formatDate(enc.date)}</div>` : ''}
        </div>
    `).join('');
}

function loadAllPatientsData(data) {
    if (!data.patients || data.patients.length === 0) {
        document.getElementById('patientObservations').innerHTML = '<div class="no-data">Keine Patientendaten verfügbar</div>';
        document.getElementById('patientMedications').innerHTML = '<div class="no-data">Keine Patientendaten verfügbar</div>';
        document.getElementById('patientConditions').innerHTML = '<div class="no-data">Keine Patientendaten verfügbar</div>';
        document.getElementById('patientEncounters').innerHTML = '<div class="no-data">Keine Patientendaten verfügbar</div>';
        return;
    }
    
    // Aggregate data from all patients
    let allObservations = [];
    let allMedications = [];
    let allConditions = [];
    let allEncounters = [];
    
    data.patients.forEach(patient => {
        if (patient.data) {
            Object.entries(patient.data).forEach(([resourceType, records]) => {
                if (records && Array.isArray(records)) {
                    records.forEach(record => {
                        const item = {
                            ...record,
                            patientName: patient.name
                        };
                        
                        switch(resourceType) {
                            case 'observation':
                                allObservations.push(item);
                                break;
                            case 'medicationrequest':
                                allMedications.push(item);
                                break;
                            case 'condition':
                                allConditions.push(item);
                                break;
                            case 'encounter':
                                allEncounters.push(item);
                                break;
                        }
                    });
                }
            });
        }
    });
    
    // Display aggregated data
    displayAggregatedObservations(allObservations);
    displayAggregatedMedications(allMedications);
    displayAggregatedConditions(allConditions);
    displayAggregatedEncounters(allEncounters);
}

function displayAggregatedObservations(observations) {
    const container = document.getElementById('patientObservations');
    
    if (observations.length === 0) {
        container.innerHTML = '<div class="no-data">Keine Beobachtungen verfügbar</div>';
        return;
    }
    
    const relevantObs = observations.filter(obs => 
        obs.name && (
            obs.name.toLowerCase().includes('verhalten') ||
            obs.name.toLowerCase().includes('aggression') ||
            obs.name.toLowerCase().includes('stimmung') ||
            obs.name.toLowerCase().includes('psychisch') ||
            obs.name.toLowerCase().includes('schmerz') ||
            obs.name.toLowerCase().includes('angst')
        )
    ).slice(0, 10);
    
    if (relevantObs.length === 0) {
        container.innerHTML = '<div class="no-data">Keine verhaltensrelevanten Beobachtungen</div>';
        return;
    }
    
    container.innerHTML = relevantObs.map(obs => `
        <div class="data-item">
            <span class="label">${obs.name}:</span>
            <span class="value">${obs.value || 'Keine Angabe'}</span>
            <div class="text-muted small mt-1">Patient: ${obs.patientName}</div>
            ${obs.date ? `<div class="text-muted small">${formatDate(obs.date)}</div>` : ''}
        </div>
    `).join('');
}

function displayAggregatedMedications(medications) {
    const container = document.getElementById('patientMedications');
    
    if (medications.length === 0) {
        container.innerHTML = '<div class="no-data">Keine Medikationsdaten verfügbar</div>';
        return;
    }
    
    container.innerHTML = medications.slice(0, 10).map(med => `
        <div class="data-item">
            <span class="label">${med.name || 'Unbekannte Medikation'}:</span>
            <span class="value">${med.value || 'Keine Dosierung'}</span>
            <div class="text-muted small mt-1">Patient: ${med.patientName}</div>
            ${med.status ? `<div class="text-muted small">Status: ${med.status}</div>` : ''}
        </div>
    `).join('');
}

function displayAggregatedConditions(conditions) {
    const container = document.getElementById('patientConditions');
    
    if (conditions.length === 0) {
        container.innerHTML = '<div class="no-data">Keine Diagnosen verfügbar</div>';
        return;
    }
    
    const relevantConditions = conditions.filter(cond => 
        cond.name && (
            cond.name.toLowerCase().includes('psychisch') ||
            cond.name.toLowerCase().includes('depression') ||
            cond.name.toLowerCase().includes('angst') ||
            cond.name.toLowerCase().includes('bipolar') ||
            cond.name.toLowerCase().includes('schizophrenie') ||
            cond.name.toLowerCase().includes('demenz') ||
            cond.name.toLowerCase().includes('sucht')
        )
    ).slice(0, 10);
    
    if (relevantConditions.length === 0) {
        container.innerHTML = '<div class="no-data">Keine verhaltensrelevanten Diagnosen</div>';
        return;
    }
    
    container.innerHTML = relevantConditions.map(cond => `
        <div class="data-item">
            <span class="label">${cond.name}:</span>
            <span class="value">${cond.status || 'Aktiv'}</span>
            <div class="text-muted small mt-1">Patient: ${cond.patientName}</div>
            ${cond.date ? `<div class="text-muted small">${formatDate(cond.date)}</div>` : ''}
        </div>
    `).join('');
}

function displayAggregatedEncounters(encounters) {
    const container = document.getElementById('patientEncounters');
    
    if (encounters.length === 0) {
        container.innerHTML = '<div class="no-data">Keine Ereignisse dokumentiert</div>';
        return;
    }
    
    container.innerHTML = encounters.slice(0, 10).map(enc => `
        <div class="data-item">
            <span class="label">Behandlung:</span>
            <span class="value">${enc.name || 'Unbekannt'}</span>
            <div class="text-muted small mt-1">Patient: ${enc.patientName}</div>
            ${enc.date ? `<div class="text-muted small">${formatDate(enc.date)}</div>` : ''}
        </div>
    `).join('');
}

function renderAssessmentItems() {
    // Render BVC items
    const bvcContainer = document.getElementById('bvcItems');
    bvcContainer.innerHTML = bvcItems.map(item => `
        <div class="assessment-item" id="${item.id}_container">
            <label for="${item.id}">
                <input type="checkbox" id="${item.id}" name="bvc" value="${item.id}" onchange="updateBVCItem('${item.id}')">
                <strong>${item.text}</strong>
                <div class="text-muted small mt-1">${item.description}</div>
            </label>
        </div>
    `).join('');
    
    // Render DASA items
    const dasaContainer = document.getElementById('dasaItems');
    dasaContainer.innerHTML = dasaItems.map(item => `
        <div class="assessment-item" id="${item.id}_container">
            <label for="${item.id}">
                <input type="checkbox" id="${item.id}" name="dasa" value="${item.id}" onchange="updateDASAItem('${item.id}')">
                <strong>${item.text}</strong>
                <div class="text-muted small mt-1">${item.description}</div>
            </label>
        </div>
    `).join('');
}

function updateBVCItem(itemId) {
    const checkbox = document.getElementById(itemId);
    const container = document.getElementById(itemId + '_container');
    
    if (checkbox.checked) {
        container.classList.add('checked');
        assessmentData.bvc[itemId] = true;
    } else {
        container.classList.remove('checked');
        delete assessmentData.bvc[itemId];
    }
}

function updateDASAItem(itemId) {
    const checkbox = document.getElementById(itemId);
    const container = document.getElementById(itemId + '_container');
    
    if (checkbox.checked) {
        container.classList.add('checked');
        assessmentData.dasa[itemId] = true;
    } else {
        container.classList.remove('checked');
        delete assessmentData.dasa[itemId];
    }
}

function calculateBVC() {
    bvcScore = Object.keys(assessmentData.bvc).length;
    updateBVCDisplay();
    updateOverallRisk();
    updateRecommendations();
    updateSummary();
}

function calculateDASA() {
    dasaScore = Object.keys(assessmentData.dasa).length;
    updateDASADisplay();
    updateOverallRisk();
    updateRecommendations();
    updateSummary();
}

function updateBVCDisplay() {
    const scoreElement = document.getElementById('bvcScore');
    const statusElement = document.getElementById('bvcStatus');
    const cardElement = document.getElementById('bvcRiskCard');
    
    scoreElement.textContent = bvcScore;
    
    // Remove existing risk classes
    cardElement.classList.remove('risk-low', 'risk-medium', 'risk-high');
    
    if (bvcScore === 0) {
        statusElement.textContent = 'Niedriges Risiko';
        cardElement.classList.add('risk-low');
    } else if (bvcScore === 1) {
        statusElement.textContent = 'Mittleres Risiko';
        cardElement.classList.add('risk-medium');
    } else {
        statusElement.textContent = 'Hohes Risiko';
        cardElement.classList.add('risk-high');
    }
}

function updateDASADisplay() {
    const scoreElement = document.getElementById('dasaScore');
    const statusElement = document.getElementById('dasaStatus');
    const cardElement = document.getElementById('dasaRiskCard');
    
    scoreElement.textContent = dasaScore;
    
    // Remove existing risk classes
    cardElement.classList.remove('risk-low', 'risk-medium', 'risk-high');
    
    if (dasaScore < 4) {
        statusElement.textContent = 'Niedriges Risiko';
        cardElement.classList.add('risk-low');
    } else if (dasaScore < 6) {
        statusElement.textContent = 'Mittleres Risiko';
        cardElement.classList.add('risk-medium');
    } else {
        statusElement.textContent = 'Hohes Risiko';
        cardElement.classList.add('risk-high');
    }
}

function updateOverallRisk() {
    const scoreElement = document.getElementById('overallScore');
    const statusElement = document.getElementById('overallStatus');
    const cardElement = document.getElementById('overallRiskCard');
    
    // Calculate combined risk
    let overallRisk = 'low';
    let overallText = 'Niedriges Risiko';
    
    if (bvcScore >= 2 || dasaScore >= 4) {
        if (bvcScore >= 3 || dasaScore >= 6) {
            overallRisk = 'high';
            overallText = 'Hohes Risiko';
        } else {
            overallRisk = 'medium';
            overallText = 'Mittleres Risiko';
        }
    }
    
    scoreElement.textContent = `BVC: ${bvcScore} | DASA: ${dasaScore}`;
    statusElement.textContent = overallText;
    
    // Remove existing risk classes
    cardElement.classList.remove('risk-low', 'risk-medium', 'risk-high');
    cardElement.classList.add(`risk-${overallRisk}`);
}

function updateRecommendations() {
    const container = document.getElementById('recommendations');
    let recommendations = [];
    
    // Base recommendations on scores
    if (bvcScore === 0 && dasaScore === 0) {
        recommendations.push({
            icon: 'fas fa-check-circle text-success',
            text: 'Routine-Überwachung fortsetzen',
            priority: 'low'
        });
    }
    
    if (bvcScore >= 1 || dasaScore >= 2) {
        recommendations.push({
            icon: 'fas fa-eye text-warning',
            text: 'Erhöhte Aufmerksamkeit und häufigere Kontrollen',
            priority: 'medium'
        });
    }
    
    if (bvcScore >= 2) {
        recommendations.push({
            icon: 'fas fa-exclamation-triangle text-danger',
            text: 'BVC-Score ≥2: 24h-Gewaltrisiko erhöht - Präventionsmaßnahmen einleiten',
            priority: 'high'
        });
    }
    
    if (dasaScore >= 4) {
        recommendations.push({
            icon: 'fas fa-bolt text-danger',
            text: 'DASA-Score ≥4: Akutes Gewaltrisiko - Sofortige Intervention erforderlich',
            priority: 'high'
        });
    }
    
    if (bvcScore >= 3 || dasaScore >= 6) {
        recommendations.push({
            icon: 'fas fa-phone text-danger',
            text: 'Sicherheitsteam informieren und Deeskalationsprotokoll aktivieren',
            priority: 'high'
        });
        recommendations.push({
            icon: 'fas fa-user-md text-danger',
            text: 'Psychiatrische Konsultation veranlassen',
            priority: 'high'
        });
    }
    
    if (recommendations.length === 0) {
        recommendations.push({
            icon: 'fas fa-info-circle text-muted',
            text: 'Führen Sie zunächst eine Bewertung durch',
            priority: 'low'
        });
    }
    
    container.innerHTML = recommendations.map(rec => `
        <div class="recommendation-item ${rec.priority}-priority">
            <i class="${rec.icon} me-2"></i>
            <span>${rec.text}</span>
        </div>
    `).join('');
}

function updateSummary() {
    assessmentData.timestamp = new Date();
    
    document.getElementById('assessmentTimestamp').textContent = formatDateTime(assessmentData.timestamp);
    document.getElementById('summaryBVC').textContent = `${bvcScore} (${getBVCRiskText()})`;
    document.getElementById('summaryDASA').textContent = `${dasaScore} (${getDASARiskText()})`;
    document.getElementById('summaryOverall').textContent = getOverallRiskText();
}

function getBVCRiskText() {
    if (bvcScore === 0) return 'Niedriges Risiko';
    if (bvcScore === 1) return 'Mittleres Risiko';
    return 'Hohes Risiko';
}

function getDASARiskText() {
    if (dasaScore < 4) return 'Niedriges Risiko';
    if (dasaScore < 6) return 'Mittleres Risiko';
    return 'Hohes Risiko';
}

function getOverallRiskText() {
    if (bvcScore >= 2 || dasaScore >= 4) {
        if (bvcScore >= 3 || dasaScore >= 6) {
            return 'Hohes Risiko';
        } else {
            return 'Mittleres Risiko';
        }
    }
    return 'Niedriges Risiko';
}

function resetBVC() {
    bvcItems.forEach(item => {
        const checkbox = document.getElementById(item.id);
        const container = document.getElementById(item.id + '_container');
        checkbox.checked = false;
        container.classList.remove('checked');
    });
    
    assessmentData.bvc = {};
    bvcScore = 0;
    
    document.getElementById('bvcScore').textContent = '-';
    document.getElementById('bvcStatus').textContent = 'Nicht bewertet';
    document.getElementById('bvcRiskCard').classList.remove('risk-low', 'risk-medium', 'risk-high');
    
    updateOverallRisk();
    updateRecommendations();
    updateSummary();
}

function resetDASA() {
    dasaItems.forEach(item => {
        const checkbox = document.getElementById(item.id);
        const container = document.getElementById(item.id + '_container');
        checkbox.checked = false;
        container.classList.remove('checked');
    });
    
    assessmentData.dasa = {};
    dasaScore = 0;
    
    document.getElementById('dasaScore').textContent = '-';
    document.getElementById('dasaStatus').textContent = 'Nicht bewertet';
    document.getElementById('dasaRiskCard').classList.remove('risk-low', 'risk-medium', 'risk-high');
    
    updateOverallRisk();
    updateRecommendations();
    updateSummary();
}

function saveAssessment() {
    const assessment = {
        ...assessmentData,
        bvcScore: bvcScore,
        dasaScore: dasaScore,
        overallRisk: getOverallRiskText(),
        timestamp: new Date().toISOString()
    };
    
    // In a real application, this would save to FHIR
    console.log('Saving assessment:', assessment);
    
    // Show success message
    const button = event.target;
    const originalText = button.innerHTML;
    button.innerHTML = '<i class="fas fa-check me-2"></i>Gespeichert';
    button.classList.remove('btn-outline-primary');
    button.classList.add('btn-success');
    
    setTimeout(() => {
        button.innerHTML = originalText;
        button.classList.remove('btn-success');
        button.classList.add('btn-outline-primary');
    }, 2000);
}

function exportReport() {
    const reportData = {
        patient: window.PATIENT_DATA?.patient?.name || 'Unbekannt',
        timestamp: new Date().toISOString(),
        bvcScore: bvcScore,
        dasaScore: dasaScore,
        overallRisk: getOverallRiskText(),
        bvcItems: assessmentData.bvc,
        dasaItems: assessmentData.dasa,
        notes: assessmentData.notes
    };
    
    const reportText = generateReportText(reportData);
    
    // Create and download file
    const blob = new Blob([reportText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Gewaltscreening_${reportData.patient}_${formatDateForFilename(new Date())}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

function generateReportText(data) {
    return `
GEWALTSCREENING UND RISIKOBEWERTUNG
=====================================

Patient: ${data.patient}
Datum/Zeit: ${formatDateTime(new Date(data.timestamp))}

BEWERTUNGSERGEBNISSE
-------------------
BVC Score (24h Vorhersage): ${data.bvcScore} (${getBVCRiskText()})
DASA Score (Akute Bewertung): ${data.dasaScore} (${getDASARiskText()})
Gesamtrisiko: ${data.overallRisk}

BVC ITEMS (Brøset Violence Checklist)
------------------------------------
${bvcItems.map(item => `${Object.keys(data.bvcItems).includes(item.id) ? '[X]' : '[ ]'} ${item.text}: ${item.description}`).join('\n')}

DASA ITEMS (Dynamic Appraisal of Situational Aggression)
-------------------------------------------------------
${dasaItems.map(item => `${Object.keys(data.dasaItems).includes(item.id) ? '[X]' : '[ ]'} ${item.text}: ${item.description}`).join('\n')}

ZUSÄTZLICHE BEMERKUNGEN
----------------------
${data.notes || 'Keine zusätzlichen Bemerkungen'}

HANDLUNGSEMPFEHLUNGEN
--------------------
${getRecommendationsText()}

---
Erstellt mit SMART on FHIR Gewaltscreening-App
    `.trim();
}

function getRecommendationsText() {
    let recommendations = [];
    
    if (bvcScore === 0 && dasaScore === 0) {
        recommendations.push('- Routine-Überwachung fortsetzen');
    }
    
    if (bvcScore >= 1 || dasaScore >= 2) {
        recommendations.push('- Erhöhte Aufmerksamkeit und häufigere Kontrollen');
    }
    
    if (bvcScore >= 2) {
        recommendations.push('- BVC-Score ≥2: 24h-Gewaltrisiko erhöht - Präventionsmaßnahmen einleiten');
    }
    
    if (dasaScore >= 4) {
        recommendations.push('- DASA-Score ≥4: Akutes Gewaltrisiko - Sofortige Intervention erforderlich');
    }
    
    if (bvcScore >= 3 || dasaScore >= 6) {
        recommendations.push('- Sicherheitsteam informieren und Deeskalationsprotokoll aktivieren');
        recommendations.push('- Psychiatrische Konsultation veranlassen');
    }
    
    return recommendations.length > 0 ? recommendations.join('\n') : '- Keine spezifischen Empfehlungen';
}

function updateTimestamp() {
    setInterval(() => {
        const now = new Date();
        document.getElementById('assessmentTimestamp').textContent = formatDateTime(now);
    }, 1000);
}

function formatDate(dateString) {
    if (!dateString) return 'Unbekannt';
    const date = new Date(dateString);
    return date.toLocaleDateString('de-DE');
}

function formatDateTime(date) {
    if (!date) return 'Unbekannt';
    return date.toLocaleString('de-DE');
}

function formatDateForFilename(date) {
    return date.toISOString().split('T')[0];
}