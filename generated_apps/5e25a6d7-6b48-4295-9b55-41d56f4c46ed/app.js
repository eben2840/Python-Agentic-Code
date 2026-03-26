class PainAssessmentApp {
    constructor() {
        this.currentPainValue = 0;
        this.assessments = [];
        this.emojiMap = {
            0: '😊', 1: '🙂', 2: '😐', 3: '😕', 4: '😟',
            5: '😢', 6: '😰', 7: '😨', 8: '😭', 9: '😵', 10: '💀'
        };
        this.init();
    }

    init() {
        this.loadPatientData();
        this.setupVASSlider();
        this.setupEventListeners();
        this.loadPreviousAssessments();
        this.updateEmojiDisplay();
    }

    loadPatientData() {
        const patientInfo = document.getElementById('patient-info');
        
        if (!window.PATIENT_DATA) {
            patientInfo.textContent = 'Keine Patientendaten verfügbar';
            return;
        }

        const data = window.PATIENT_DATA;
        
        if (data.patient && data.patient.id !== 'all') {
            const patient = data.patient;
            const name = patient.name || 'Unbekannt';
            const gender = patient.gender || '';
            const birthDate = patient.birthDate ? new Date(patient.birthDate).toLocaleDateString('de-DE') : '';
            
            patientInfo.innerHTML = `
                <strong>${name}</strong>
                ${gender && `<span class="text-muted ms-2">${gender}</span>`}
                ${birthDate && `<span class="text-muted ms-2">geb. ${birthDate}</span>`}
            `;
        } else {
            patientInfo.textContent = 'Bitte wählen Sie einen Patienten aus';
        }
    }

    setupVASSlider() {
        const slider = document.getElementById('vas-slider');
        const handle = slider.querySelector('.vas-handle');
        let isDragging = false;

        const updatePosition = (clientX) => {
            const rect = slider.getBoundingClientRect();
            const x = Math.max(0, Math.min(clientX - rect.left, rect.width));
            const percentage = x / rect.width;
            const value = Math.round(percentage * 10);
            
            this.updatePainValue(value);
            handle.style.left = `${percentage * 100}%`;
        };

        // Mouse events
        slider.addEventListener('mousedown', (e) => {
            isDragging = true;
            updatePosition(e.clientX);
            document.addEventListener('mousemove', onMouseMove);
            document.addEventListener('mouseup', onMouseUp);
        });

        const onMouseMove = (e) => {
            if (isDragging) {
                updatePosition(e.clientX);
            }
        };

        const onMouseUp = () => {
            isDragging = false;
            document.removeEventListener('mousemove', onMouseMove);
            document.removeEventListener('mouseup', onMouseUp);
        };

        // Touch events
        slider.addEventListener('touchstart', (e) => {
            e.preventDefault();
            isDragging = true;
            updatePosition(e.touches[0].clientX);
        });

        slider.addEventListener('touchmove', (e) => {
            if (isDragging) {
                e.preventDefault();
                updatePosition(e.touches[0].clientX);
            }
        });

        slider.addEventListener('touchend', () => {
            isDragging = false;
        });

        // Emoji click events
        document.querySelectorAll('.pain-emoji').forEach((emoji, index) => {
            emoji.addEventListener('click', () => {
                this.updatePainValue(index);
                const percentage = index / 10;
                handle.style.left = `${percentage * 100}%`;
            });
        });
    }

    updatePainValue(value) {
        this.currentPainValue = value;
        
        const painValueElement = document.getElementById('pain-value');
        const painDescriptionElement = document.getElementById('pain-description');
        const painEmojiLarge = document.getElementById('pain-emoji-large');
        
        painValueElement.textContent = value;
        painValueElement.className = `pain-value pain-level-${value}`;
        
        // Update large emoji display
        painEmojiLarge.textContent = this.emojiMap[value];
        
        const descriptions = {
            0: 'Kein Schmerz',
            1: 'Sehr leichter Schmerz',
            2: 'Leichter Schmerz',
            3: 'Leichter Schmerz',
            4: 'Mäßiger Schmerz',
            5: 'Mäßiger Schmerz',
            6: 'Starker Schmerz',
            7: 'Starker Schmerz',
            8: 'Sehr starker Schmerz',
            9: 'Sehr starker Schmerz',
            10: 'Stärkster vorstellbarer Schmerz'
        };
        
        painDescriptionElement.textContent = descriptions[value];
        painDescriptionElement.className = `pain-description pain-level-${value}`;
        
        this.updateEmojiDisplay();
    }

    updateEmojiDisplay() {
        document.querySelectorAll('.pain-emoji').forEach((emoji, index) => {
            emoji.classList.toggle('active', index === this.currentPainValue);
        });
    }

    setupEventListeners() {
        const saveButton = document.getElementById('save-assessment');
        saveButton.addEventListener('click', () => this.saveAssessment());
    }

    saveAssessment() {
        const location = document.getElementById('pain-location').value;
        const type = document.getElementById('pain-type').value;
        const notes = document.getElementById('pain-notes').value;
        
        const assessment = {
            id: Date.now(),
            value: this.currentPainValue,
            emoji: this.emojiMap[this.currentPainValue],
            location: location,
            type: type,
            notes: notes,
            timestamp: new Date(),
            patientId: window.PATIENT_DATA?.patient?.id || 'unknown'
        };
        
        this.assessments.unshift(assessment);
        this.displayPreviousAssessments();
        this.resetForm();
        this.showSuccessModal();
        
        // In a real app, this would be sent to the server
        console.log('Pain assessment saved:', assessment);
    }

    resetForm() {
        // Reset VAS slider
        this.updatePainValue(0);
        const handle = document.querySelector('.vas-handle');
        handle.style.left = '0%';
        
        // Reset form fields
        document.getElementById('pain-location').value = '';
        document.getElementById('pain-type').value = '';
        document.getElementById('pain-notes').value = '';
    }

    showSuccessModal() {
        const modal = new bootstrap.Modal(document.getElementById('successModal'));
        modal.show();
    }

    loadPreviousAssessments() {
        // Load existing pain assessments from patient data
        if (window.PATIENT_DATA && window.PATIENT_DATA.observation) {
            const observations = window.PATIENT_DATA.observation.summary || [];
            
            observations.forEach(obs => {
                if (obs.name && (obs.name.toLowerCase().includes('pain') || 
                                obs.name.toLowerCase().includes('schmerz') ||
                                obs.name.toLowerCase().includes('vas'))) {
                    
                    // Extract pain value from observation
                    let painValue = 0;
                    if (obs.value) {
                        const match = obs.value.match(/(\d+)/);
                        if (match) {
                            painValue = Math.min(10, parseInt(match[1]));
                        }
                    }
                    
                    const assessment = {
                        id: Date.now() + Math.random(),
                        value: painValue,
                        emoji: this.emojiMap[painValue],
                        location: '',
                        type: '',
                        notes: obs.name,
                        timestamp: obs.date ? new Date(obs.date) : new Date(),
                        patientId: window.PATIENT_DATA.patient?.id || 'unknown'
                    };
                    
                    this.assessments.push(assessment);
                }
            });
        }
        
        this.displayPreviousAssessments();
    }

    displayPreviousAssessments() {
        const container = document.getElementById('previous-assessments');
        
        if (this.assessments.length === 0) {
            container.innerHTML = `
                <div class="text-center text-muted py-4">
                    <i class="fas fa-clock fa-2x mb-3"></i>
                    <p>Keine vorherigen Erfassungen verfügbar</p>
                </div>
            `;
            return;
        }
        
        const assessmentsHtml = this.assessments.map(assessment => {
            const date = assessment.timestamp.toLocaleDateString('de-DE');
            const time = assessment.timestamp.toLocaleTimeString('de-DE', { 
                hour: '2-digit', 
                minute: '2-digit' 
            });
            
            const locationText = assessment.location ? this.getLocationText(assessment.location) : '';
            const typeText = assessment.type ? this.getTypeText(assessment.type) : '';
            
            return `
                <div class="assessment-item">
                    <div class="assessment-header">
                        <div class="assessment-value pain-level-${assessment.value}">
                            <span class="assessment-emoji">${assessment.emoji}</span>
                            ${assessment.value}/10
                        </div>
                        <div class="assessment-date">
                            ${date} ${time}
                        </div>
                    </div>
                    <div class="assessment-details">
                        ${locationText && `<span class="me-3"><i class="fas fa-map-marker-alt me-1"></i>${locationText}</span>`}
                        ${typeText && `<span class="me-3"><i class="fas fa-info-circle me-1"></i>${typeText}</span>`}
                        ${assessment.notes && `<div class="mt-2"><i class="fas fa-sticky-note me-1"></i>${assessment.notes}</div>`}
                    </div>
                </div>
            `;
        }).join('');
        
        container.innerHTML = assessmentsHtml;
    }

    getLocationText(location) {
        const locations = {
            'head': 'Kopf',
            'neck': 'Nacken',
            'chest': 'Brust',
            'back': 'Rücken',
            'abdomen': 'Bauch',
            'arms': 'Arme',
            'legs': 'Beine',
            'joints': 'Gelenke',
            'other': 'Sonstiges'
        };
        return locations[location] || location;
    }

    getTypeText(type) {
        const types = {
            'dull': 'Dumpf',
            'sharp': 'Stechend',
            'burning': 'Brennend',
            'throbbing': 'Pochend',
            'cramping': 'Krampfartig',
            'shooting': 'Schießend'
        };
        return types[type] || type;
    }
}

// Initialize the app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new PainAssessmentApp();
});