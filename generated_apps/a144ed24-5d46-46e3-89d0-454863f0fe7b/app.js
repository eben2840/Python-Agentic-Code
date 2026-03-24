// BVC Assessment App
class BVCAssessment {
    constructor() {
        this.currentPatient = null;
        this.bvcItems = [
            {
                id: 'confusion',
                label: 'Verwirrtheit',
                description: 'Patient erscheint verwirrt, desorientiert oder hat Schwierigkeiten beim Verstehen',
                keywords: ['verwirrt', 'desorientiert', 'kognitiv', 'mmse', 'demenz', 'delir']
            },
            {
                id: 'irritability',
                label: 'Reizbarkeit',
                description: 'Patient zeigt Zeichen von Gereiztheit, Verärgerung oder Ungeduld',
                keywords: ['reizbar', 'verärgert', 'ungeduldig', 'aufgeregt', 'unruhig']
            },
            {
                id: 'boisterousness',
                label: 'Lärmende Unruhe',
                description: 'Patient ist laut, geräuschvoll oder übermäßig energisch',
                keywords: ['laut', 'geräuschvoll', 'energisch', 'hyperaktiv', 'manisch']
            },
            {
                id: 'physical_threats',
                label: 'Körperliche Drohungen',
                description: 'Patient hat verbale Drohungen körperlicher Gewalt ausgesprochen',
                keywords: ['drohung', 'gewalt', 'aggressiv', 'schaden', 'angriff']
            },
            {
                id: 'verbal_threats',
                label: 'Verbale Drohungen',
                description: 'Patient hat verbale Drohungen oder feindselige Äußerungen gemacht',
                keywords: ['verbale drohung', 'feindselig', 'bedrohlich', 'einschüchternd']
            },
            {
                id: 'attacking_objects',
                label: 'Angriffe auf Gegenstände',
                description: 'Patient hat Eigentum beschädigt oder Gegenstände geworfen',
                keywords: ['schaden', 'geworfen', 'zerbrochen', 'zerstört', 'sachschaden']
            }
        ];
        this.assessmentHistory = this.loadAssessmentHistory();
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.loadPatientData();
        this.renderBVCItems();
        this.updateRiskAssessment();
        this.renderAssessmentHistory();
    }

    setupEventListeners() {
        // Patient selection
        document.getElementById('patient-select')?.addEventListener('change', (e) => {
            this.selectPatient(e.target.value);
        });

        // Form interactions
        document.getElementById('save-assessment')?.addEventListener('click', () => {
            this.saveAssessment();
        });

        document.getElementById('reset-form')?.addEventListener('click', () => {
            this.resetForm();
        });

        // Dynamic score calculation
        document.addEventListener('change', (e) => {
            if (e.target.classList.contains('bvc-checkbox')) {
                this.updateRiskAssessment();
            }
        });
    }

    loadPatientData() {
        if (!window.PATIENT_DATA) {
            console.error('Patientendaten nicht verfügbar');
            return;
        }

        const data = window.PATIENT_DATA;

        if (data.patient && data.patient.id === 'all') {
            // Show patient selector for all patients
            this.showPatientSelector(data.patients || []);
        } else if (data.patient) {
            // Single patient
            this.currentPatient = data.patient;
            this.displayPatientInfo(data.patient);
            this.preFillFromClinicalData(data);
        }
    }

    showPatientSelector(patients) {
        const selector = document.getElementById('patient-selector');
        const select = document.getElementById('patient-select');
        
        if (!selector || !select) return;

        selector.style.display = 'block';
        
        // Clear existing options except first
        select.innerHTML = '<option value="">Einen Patienten wählen...</option>';
        
        patients.forEach(patient => {
            const option = document.createElement('option');
            option.value = patient.id;
            option.textContent = `${patient.name || 'Unbekannt'} (${patient.gender || 'Unbekannt'}, Geburtsdatum: ${patient.birthDate || 'Unbekannt'})`;
            select.appendChild(option);
        });
    }

    selectPatient(patientId) {
        if (!window.PATIENT_DATA?.patients || !patientId) return;

        const selectedPatient = window.PATIENT_DATA.patients.find(p => p.id === patientId);
        if (!selectedPatient) return;

        this.currentPatient = selectedPatient;
        this.displayPatientInfo(selectedPatient);
        this.preFillFromClinicalData({ patient: selectedPatient, ...selectedPatient.data });
        this.resetForm();
    }

    displayPatientInfo(patient) {
        const nameEl = document.getElementById('patient-name');
        const dobEl = document.getElementById('patient-dob');
        const genderEl = document.getElementById('patient-gender');

        if (nameEl) nameEl.textContent = patient.name || 'Keine Daten verfügbar';
        if (dobEl) dobEl.textContent = patient.birthDate || 'Keine Daten verfügbar';
        if (genderEl) genderEl.textContent = patient.gender || 'Keine Daten verfügbar';
    }

    preFillFromClinicalData(data) {
        // Reset pre-fill status
        this.bvcItems.forEach(item => {
            item.preFilled = false;
            item.preFilledReason = '';
        });

        // Check conditions
        if (data.condition) {
            const conditions = Array.isArray(data.condition) ? data.condition : (data.condition.summary || []);
            conditions.forEach(condition => {
                this.checkConditionForBVC(condition);
            });
        }

        // Check observations
        if (data.observation) {
            const observations = Array.isArray(data.observation) ? data.observation : (data.observation.summary || []);
            observations.forEach(observation => {
                this.checkObservationForBVC(observation);
            });
        }

        // Check vital signs
        if (data.vital_signs) {
            const vitals = Array.isArray(data.vital_signs) ? data.vital_signs : (data.vital_signs.summary || []);
            vitals.forEach(vital => {
                this.checkObservationForBVC(vital);
            });
        }

        // Re-render items with pre-fill data
        this.renderBVCItems();
    }

    checkConditionForBVC(condition) {
        if (!condition.name) return;
        
        const conditionText = condition.name.toLowerCase();
        
        this.bvcItems.forEach(item => {
            item.keywords.forEach(keyword => {
                if (conditionText.includes(keyword.toLowerCase())) {
                    item.preFilled = true;
                    item.preFilledReason = `Basierend auf Diagnose: ${condition.name}`;
                }
            });
        });
    }

    checkObservationForBVC(observation) {
        if (!observation.name && !observation.value) return;
        
        const obsText = `${observation.name || ''} ${observation.value || ''}`.toLowerCase();
        
        this.bvcItems.forEach(item => {
            item.keywords.forEach(keyword => {
                if (obsText.includes(keyword.toLowerCase())) {
                    item.preFilled = true;
                    item.preFilledReason = `Basierend auf Beobachtung: ${observation.name || observation.value}`;
                }
            });
        });
    }

    renderBVCItems() {
        const container = document.querySelector('.bvc-items');
        if (!container) return;

        container.innerHTML = '';

        this.bvcItems.forEach(item => {
            const itemDiv = document.createElement('div');
            itemDiv.className = `bvc-item ${item.preFilled ? 'pre-filled' : ''}`;
            
            itemDiv.innerHTML = `
                <div class="form-check">
                    <input class="form-check-input bvc-checkbox" type="checkbox" 
                           id="${item.id}" ${item.preFilled ? 'checked' : ''}>
                    <label class="form-check-label" for="${item.id}">
                        ${item.label}
                        ${item.preFilled ? '<span class="pre-fill-indicator ms-2"><i class="fas fa-magic"></i> Automatisch erkannt</span>' : ''}
                        <div class="item-description">${item.description}</div>
                        ${item.preFilled && item.preFilledReason ? `<div class="pre-fill-reason text-warning mt-1"><small>${item.preFilledReason}</small></div>` : ''}
                    </label>
                </div>
            `;
            
            container.appendChild(itemDiv);
        });
    }

    updateRiskAssessment() {
        const checkboxes = document.querySelectorAll('.bvc-checkbox');
        const checkedCount = Array.from(checkboxes).filter(cb => cb.checked).length;
        
        const scoreEl = document.getElementById('total-score');
        const riskEl = document.getElementById('risk-level');
        
        if (scoreEl) scoreEl.textContent = checkedCount;
        
        if (riskEl) {
            const badge = riskEl.querySelector('.badge');
            if (badge) {
                badge.className = 'badge';
                
                if (checkedCount === 0) {
                    badge.classList.add('risk-low');
                    badge.textContent = 'Niedriges Risiko';
                } else if (checkedCount <= 2) {
                    badge.classList.add('risk-moderate');
                    badge.textContent = 'Mittleres Risiko';
                } else {
                    badge.classList.add('risk-high');
                    badge.textContent = 'Hohes Risiko';
                }
            }
        }
    }

    saveAssessment() {
        if (!this.currentPatient) {
            alert('Kein Patient ausgewählt');
            return;
        }

        const checkboxes = document.querySelectorAll('.bvc-checkbox');
        const checkedItems = Array.from(checkboxes)
            .filter(cb => cb.checked)
            .map(cb => cb.id);
        
        const notes = document.getElementById('additional-notes')?.value || '';
        const score = checkedItems.length;
        
        const assessment = {
            id: Date.now().toString(),
            patientId: this.currentPatient.id,
            patientName: this.currentPatient.name,
            date: new Date().toISOString(),
            score: score,
            checkedItems: checkedItems,
            notes: notes,
            riskLevel: score === 0 ? 'Niedrig' : score <= 2 ? 'Mittel' : 'Hoch'
        };
        
        this.assessmentHistory.unshift(assessment);
        this.saveAssessmentHistory();
        this.renderAssessmentHistory();
        
        // Show success message
        const btn = document.getElementById('save-assessment');
        const originalText = btn.innerHTML;
        btn.innerHTML = '<i class="fas fa-check me-2"></i>Gespeichert!';
        btn.classList.remove('btn-primary');
        btn.classList.add('btn-success');
        
        setTimeout(() => {
            btn.innerHTML = originalText;
            btn.classList.remove('btn-success');
            btn.classList.add('btn-primary');
        }, 2000);
    }

    resetForm() {
        // Uncheck all checkboxes except pre-filled ones
        const checkboxes = document.querySelectorAll('.bvc-checkbox');
        checkboxes.forEach(checkbox => {
            const item = this.bvcItems.find(item => item.id === checkbox.id);
            checkbox.checked = item?.preFilled || false;
        });
        
        // Clear notes
        const notesEl = document.getElementById('additional-notes');
        if (notesEl) notesEl.value = '';
        
        this.updateRiskAssessment();
    }

    loadAssessmentHistory() {
        try {
            const stored = localStorage.getItem('bvc_assessments');
            return stored ? JSON.parse(stored) : [];
        } catch (e) {
            console.error('Fehler beim Laden des Bewertungsverlaufs:', e);
            return [];
        }
    }

    saveAssessmentHistory() {
        try {
            localStorage.setItem('bvc_assessments', JSON.stringify(this.assessmentHistory));
        } catch (e) {
            console.error('Fehler beim Speichern des Bewertungsverlaufs:', e);
        }
    }

    renderAssessmentHistory() {
        const container = document.getElementById('history-content');
        if (!container) return;

        const patientHistory = this.currentPatient 
            ? this.assessmentHistory.filter(a => a.patientId === this.currentPatient.id)
            : this.assessmentHistory;

        if (patientHistory.length === 0) {
            container.innerHTML = '<p class="text-muted">Keine vorherigen Bewertungen gefunden.</p>';
            return;
        }

        container.innerHTML = patientHistory.map(assessment => {
            const date = new Date(assessment.date).toLocaleString('de-DE');
            const itemLabels = assessment.checkedItems.map(id => {
                const item = this.bvcItems.find(item => item.id === id);
                return item ? item.label : id;
            }).join(', ');

            return `
                <div class="history-item">
                    <div class="history-header">
                        <div class="history-score">Punktzahl: ${assessment.score}/6 - ${assessment.riskLevel}es Risiko</div>
                        <div class="history-date">${date}</div>
                    </div>
                    ${itemLabels ? `<div class="history-items">Punkte: ${itemLabels}</div>` : ''}
                    ${assessment.notes ? `<div class="history-notes mt-2"><strong>Anmerkungen:</strong> ${assessment.notes}</div>` : ''}
                </div>
            `;
        }).join('');
    }
}

// Initialize the app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new BVCAssessment();
});