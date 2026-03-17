// PflegePlus - Dekubitus Prevention Dashboard
class PflegePlusApp {
    constructor() {
        this.patientData = null;
        this.riskScore = 0;
        this.riskFactors = [];
        this.init();
    }

    init() {
        this.updateCurrentTime();
        setInterval(() => this.updateCurrentTime(), 60000);
        
        // Load patient data
        this.loadPatientData();
        
        // Initialize body map interactions
        this.initializeBodyMap();
        
        // Generate positioning schedule
        this.generatePositioningSchedule();
    }

    updateCurrentTime() {
        const now = new Date();
        const timeString = now.toLocaleString('de-DE', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
        document.getElementById('current-time').textContent = timeString;
    }

    loadPatientData() {
        // Check if patient data is available
        if (typeof window.PATIENT_DATA === 'undefined') {
            this.showNoDataMessage();
            return;
        }

        this.patientData = window.PATIENT_DATA;
        
        // Update patient info
        this.updatePatientInfo();
        
        // Load and analyze conditions
        this.loadConditions();
        
        // Load observations and vital signs
        this.loadObservations();
        
        // Calculate risk score
        this.calculateRiskScore();
    }

    updatePatientInfo() {
        const patientInfoEl = document.getElementById('patient-info');
        
        if (this.patientData.patient.id === 'all') {
            patientInfoEl.textContent = `Alle Patienten (${this.patientData.patients?.length || 0} Patienten)`;
            return;
        }

        const patient = this.patientData.patient;
        let infoText = 'Patient: ';
        
        if (patient.name) {
            infoText += patient.name;
        } else {
            infoText += 'Unbekannt';
        }
        
        if (patient.gender) {
            infoText += ` | Geschlecht: ${patient.gender}`;
        }
        
        if (patient.birthDate) {
            const age = this.calculateAge(patient.birthDate);
            infoText += ` | Alter: ${age} Jahre`;
        }
        
        patientInfoEl.textContent = infoText;
    }

    calculateAge(birthDate) {
        const today = new Date();
        const birth = new Date(birthDate);
        let age = today.getFullYear() - birth.getFullYear();
        const monthDiff = today.getMonth() - birth.getMonth();
        
        if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
            age--;
        }
        
        return age;
    }

    loadConditions() {
        const conditionsEl = document.getElementById('conditions-list');
        
        if (!this.patientData.condition?.summary || this.patientData.condition.summary.length === 0) {
            conditionsEl.innerHTML = '<div class="text-muted">Keine Diagnosen verfügbar</div>';
            return;
        }

        const conditionsHtml = this.patientData.condition.summary.map(condition => {
            const statusClass = condition.status === 'active' ? 'status-active' : 'status-resolved';
            const statusText = condition.status === 'active' ? 'Aktiv' : 'Gelöst';
            
            return `
                <div class="condition-item">
                    <div>
                        <div class="condition-name">${condition.name || 'Unbekannte Diagnose'}</div>
                        <small class="text-muted">${condition.date || 'Datum unbekannt'}</small>
                    </div>
                    <span class="${statusClass}">${statusText}</span>
                </div>
            `;
        }).join('');
        
        conditionsEl.innerHTML = conditionsHtml;
    }

    loadObservations() {
        const observationsEl = document.getElementById('observations-list');
        
        // Combine observations and vital signs
        let allObservations = [];
        
        if (this.patientData.observation?.summary) {
            allObservations = allObservations.concat(this.patientData.observation.summary);
        }
        
        if (this.patientData.vital_signs?.summary) {
            allObservations = allObservations.concat(this.patientData.vital_signs.summary);
        }
        
        if (allObservations.length === 0) {
            observationsEl.innerHTML = '<div class="text-muted">Keine Beobachtungen verfügbar</div>';
            return;
        }

        const observationsHtml = allObservations.slice(0, 5).map(obs => {
            return `
                <div class="observation-item">
                    <div>
                        <div class="observation-name">${obs.name || 'Unbekannte Beobachtung'}</div>
                        <small class="text-muted">${obs.date || 'Datum unbekannt'}</small>
                    </div>
                    <div class="observation-value">${obs.value || 'Wert unbekannt'}</div>
                </div>
            `;
        }).join('');
        
        observationsEl.innerHTML = observationsHtml;
    }

    calculateRiskScore() {
        this.riskFactors = [];
        let score = 0;

        // Age factor
        if (this.patientData.patient.birthDate) {
            const age = this.calculateAge(this.patientData.patient.birthDate);
            if (age > 70) {
                score += 3;
                this.riskFactors.push({ name: 'Alter > 70 Jahre', level: 'high' });
            } else if (age > 60) {
                score += 2;
                this.riskFactors.push({ name: 'Alter > 60 Jahre', level: 'medium' });
            }
        }

        // Mobility-related conditions
        if (this.patientData.condition?.summary) {
            const conditions = this.patientData.condition.summary;
            
            conditions.forEach(condition => {
                const name = condition.name?.toLowerCase() || '';
                
                if (name.includes('diabetes')) {
                    score += 2;
                    this.riskFactors.push({ name: 'Diabetes mellitus', level: 'medium' });
                }
                
                if (name.includes('immobil') || name.includes('bettlägerig') || name.includes('lähmung')) {
                    score += 4;
                    this.riskFactors.push({ name: 'Immobilität', level: 'high' });
                }
                
                if (name.includes('untergewicht') || name.includes('malnutrition')) {
                    score += 3;
                    this.riskFactors.push({ name: 'Mangelernährung', level: 'high' });
                }
                
                if (name.includes('inkontinenz')) {
                    score += 2;
                    this.riskFactors.push({ name: 'Inkontinenz', level: 'medium' });
                }
            });
        }

        // Default risk factors if no specific conditions found
        if (this.riskFactors.length === 0) {
            this.riskFactors.push({ name: 'Grundrisiko', level: 'low' });
            score = 1;
        }

        this.riskScore = Math.min(score, 10); // Cap at 10
        this.updateRiskDisplay();
    }

    updateRiskDisplay() {
        const scoreEl = document.getElementById('risk-score');
        const circleEl = document.getElementById('risk-score-circle');
        const factorsEl = document.getElementById('risk-factors');

        scoreEl.textContent = this.riskScore;

        // Update circle color based on risk level
        circleEl.className = 'risk-score-circle';
        if (this.riskScore >= 7) {
            circleEl.classList.add('high');
        } else if (this.riskScore >= 4) {
            circleEl.classList.add('medium');
        } else {
            circleEl.classList.add('low');
        }

        // Display risk factors
        const factorsHtml = this.riskFactors.map(factor => {
            return `
                <div class="risk-factor-item">
                    <span>${factor.name}</span>
                    <span class="risk-level-badge risk-level-${factor.level}">
                        ${factor.level === 'high' ? 'Hoch' : factor.level === 'medium' ? 'Mittel' : 'Niedrig'}
                    </span>
                </div>
            `;
        }).join('');

        factorsEl.innerHTML = factorsHtml;

        // Update body map based on risk score
        this.updateBodyMap();
    }

    updateBodyMap() {
        const pressurePoints = document.querySelectorAll('.pressure-point');
        
        pressurePoints.forEach(point => {
            point.className = 'pressure-point';
            
            if (this.riskScore >= 7) {
                point.classList.add('high');
            } else if (this.riskScore >= 4) {
                point.classList.add('medium');
            }
            // Low risk keeps default green color
        });
    }

    initializeBodyMap() {
        const pressurePoints = document.querySelectorAll('.pressure-point');
        
        pressurePoints.forEach(point => {
            point.addEventListener('click', (e) => {
                const region = e.target.getAttribute('data-region');
                this.showRegionInfo(region);
            });
        });
    }

    showRegionInfo(region) {
        const recommendations = {
            'Kopf': 'Lagerung: Kopf alle 2 Stunden drehen. Weiche Kopfunterlage verwenden.',
            'Schultern': 'Lagerung: 30° Seitenlage. Schulterblätter entlasten durch Kissen.',
            'Kreuzbein': 'Lagerung: Wechsel zwischen Rücken- und Seitenlage alle 2 Stunden.',
            'Hüften': 'Lagerung: 30° Seitenlage mit Kissen zwischen den Beinen.',
            'Fersen': 'Lagerung: Fersen freilagern mit Kissen unter den Waden.'
        };

        alert(`${region}\n\nEmpfehlung: ${recommendations[region] || 'Regelmäßige Lagerung alle 2-4 Stunden.'}`);
    }

    generatePositioningSchedule() {
        const scheduleEl = document.getElementById('positioning-schedule');
        const nextPositioningEl = document.getElementById('next-positioning');
        
        const now = new Date();
        const positions = [
            'Rückenlage',
            'Linke Seitenlage (30°)',
            'Rechte Seitenlage (30°)',
            'Bauchlage (wenn möglich)'
        ];

        let interval = 2; // Default 2 hours
        if (this.riskScore >= 7) {
            interval = 1.5; // High risk: every 1.5 hours
        } else if (this.riskScore >= 4) {
            interval = 2; // Medium risk: every 2 hours
        } else {
            interval = 3; // Low risk: every 3 hours
        }

        const scheduleHtml = positions.map((position, index) => {
            const time = new Date(now.getTime() + (index * interval * 60 * 60 * 1000));
            const timeString = time.toLocaleTimeString('de-DE', { 
                hour: '2-digit', 
                minute: '2-digit' 
            });
            
            return `
                <div class="positioning-item">
                    <div>
                        <div class="positioning-time">${timeString}</div>
                        <div class="positioning-position">${position}</div>
                    </div>
                    <i class="fas fa-clock text-muted"></i>
                </div>
            `;
        }).join('');

        scheduleEl.innerHTML = scheduleHtml;

        // Next positioning time
        const nextTime = new Date(now.getTime() + (interval * 60 * 60 * 1000));
        const nextTimeString = nextTime.toLocaleTimeString('de-DE', { 
            hour: '2-digit', 
            minute: '2-digit' 
        });
        
        nextPositioningEl.textContent = `Nächste Lagerung um ${nextTimeString} (${positions[1]})`;
    }

    showNoDataMessage() {
        document.getElementById('patient-info').textContent = 'Keine Patientendaten verfügbar';
        document.getElementById('risk-score').textContent = '--';
        document.getElementById('risk-factors').innerHTML = '<div class="text-muted">Keine Daten verfügbar</div>';
        document.getElementById('conditions-list').innerHTML = '<div class="text-muted">Keine Daten verfügbar</div>';
        document.getElementById('observations-list').innerHTML = '<div class="text-muted">Keine Daten verfügbar</div>';
        document.getElementById('positioning-schedule').innerHTML = '<div class="text-muted">Keine Daten verfügbar</div>';
        document.getElementById('next-positioning').textContent = 'Keine Daten verfügbar