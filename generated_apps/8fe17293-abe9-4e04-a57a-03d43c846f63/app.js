class PositioningPlan {
    constructor() {
        this.patientData = window.PATIENT_DATA || null;
        this.positioningSchedule = [];
        this.init();
    }

    init() {
        this.loadPatientData();
        this.setupEventListeners();
        this.generateSampleSchedule();
    }

    loadPatientData() {
        if (!this.patientData) {
            document.getElementById('patientInfo').textContent = 'Keine Patientendaten verfügbar';
            return;
        }

        const isAllPatients = this.patientData.patient?.id === 'all';
        
        if (isAllPatients) {
            this.showAllPatientsView();
        } else {
            this.showSinglePatientView();
        }
    }

    showSinglePatientView() {
        const patient = this.patientData.patient;
        document.getElementById('patientInfo').textContent = 
            `Patient: ${patient.name || 'Unbekannt'} | Geschlecht: ${patient.gender || 'Nicht angegeben'} | Geburtsdatum: ${this.formatDate(patient.birthDate) || 'Nicht angegeben'}`;
        
        document.getElementById('singlePatientView').classList.remove('d-none');
        document.getElementById('allPatientsView').classList.add('d-none');

        this.renderCurrentPosition();
        this.renderPositioningSchedule();
        this.renderRiskAssessment();
        this.renderSpecialNotes();
    }

    showAllPatientsView() {
        document.getElementById('patientInfo').textContent = 'Übersicht aller Patienten';
        document.getElementById('singlePatientView').classList.add('d-none');
        document.getElementById('allPatientsView').classList.remove('d-none');

        this.renderAllPatientsGrid();
        this.setupFilters();
    }

    renderCurrentPosition() {
        const currentPositionDiv = document.getElementById('currentPosition');
        
        // Check if we have any positioning data from observations or vital signs
        const observations = this.patientData.observation?.summary || [];
        const vitalSigns = this.patientData.vital_signs?.summary || [];
        
        const positionData = [...observations, ...vitalSigns].find(item => 
            item.name && (
                item.name.toLowerCase().includes('position') ||
                item.name.toLowerCase().includes('lagerung') ||
                item.name.toLowerCase().includes('bed')
            )
        );

        if (positionData) {
            currentPositionDiv.innerHTML = `
                <div class="d-flex align-items-center">
                    <div class="position-icon supine me-3">
                        <i class="fas fa-bed"></i>
                    </div>
                    <div>
                        <h6 class="mb-1">${positionData.name}</h6>
                        <small class="text-muted">
                            ${positionData.date ? `Seit: ${this.formatDateTime(positionData.date)}` : 'Zeitpunkt unbekannt'}
                        </small>
                        ${positionData.value ? `<div class="mt-1"><small class="text-info">${positionData.value}</small></div>` : ''}
                    </div>
                    <div class="ms-auto">
                        <span class="time-indicator time-current">Aktuell</span>
                    </div>
                </div>
            `;
        } else {
            currentPositionDiv.innerHTML = `
                <div class="alert alert-info mb-0">
                    <i class="fas fa-info-circle me-2"></i>
                    Keine aktuellen Lagerungsdaten verfügbar
                </div>
            `;
        }
    }

    renderPositioningSchedule() {
        const scheduleDiv = document.getElementById('positioningSchedule');
        
        if (this.positioningSchedule.length === 0) {
            scheduleDiv.innerHTML = `
                <div class="text-center py-4">
                    <i class="fas fa-calendar-plus text-muted fs-1 mb-3"></i>
                    <p class="text-muted">Noch keine Lagerungen geplant</p>
                    <button class="btn btn-primary btn-sm" data-bs-toggle="modal" data-bs-target="#addPositionModal">
                        <i class="fas fa-plus me-1"></i>
                        Erste Lagerung planen
                    </button>
                </div>
            `;
            return;
        }

        const scheduleHtml = this.positioningSchedule.map(position => {
            const timeStatus = this.getTimeStatus(position.scheduledTime);
            const positionName = this.getPositionName(position.type);
            const aids = position.aids || [];

            return `
                <div class="card position-card ${timeStatus}">
                    <div class="card-body">
                        <div class="row align-items-center">
                            <div class="col-auto">
                                <div class="position-icon ${position.type}">
                                    <i class="fas fa-bed"></i>
                                </div>
                            </div>
                            <div class="col">
                                <div class="d-flex justify-content-between align-items-start">
                                    <div>
                                        <h6 class="mb-1">${positionName}</h6>
                                        <small class="text-muted">
                                            ${this.formatDateTime(position.scheduledTime)} 
                                            (${position.duration} Min.)
                                        </small>
                                        ${aids.length > 0 ? `
                                            <div class="aids-list mt-2">
                                                ${aids.map(aid => `<span class="aid-tag">${aid}</span>`).join('')}
                                            </div>
                                        ` : ''}
                                        ${position.notes ? `<div class="mt-2"><small class="text-info">${position.notes}</small></div>` : ''}
                                    </div>
                                    <div class="text-end">
                                        <span class="time-indicator time-${timeStatus}">${this.getTimeStatusText(timeStatus)}</span>
                                        <div class="mt-2">
                                            <button class="btn btn-outline-success btn-sm me-1" onclick="positioningPlan.completePosition('${position.id}')">
                                                <i class="fas fa-check"></i>
                                            </button>
                                            <button class="btn btn-outline-danger btn-sm" onclick="positioningPlan.deletePosition('${position.id}')">
                                                <i class="fas fa-trash"></i>
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            `;
        }).join('');

        scheduleDiv.innerHTML = scheduleHtml;
    }

    renderRiskAssessment() {
        const riskDiv = document.getElementById('riskAssessment');
        
        // Analyze conditions to determine positioning risk
        const conditions = this.patientData.condition?.summary || [];
        const riskFactors = [];
        let riskLevel = 'low';

        conditions.forEach(condition => {
            const conditionName = condition.name?.toLowerCase() || '';
            
            if (conditionName.includes('fractur') || conditionName.includes('bruch')) {
                riskFactors.push('Frakturrisiko');
                riskLevel = 'high';
            }
            if (conditionName.includes('sepsis') || conditionName.includes('infection')) {
                riskFactors.push('Infektionsrisiko');
                if (riskLevel !== 'high') riskLevel = 'medium';
            }
            if (conditionName.includes('copd') || conditionName.includes('asthma')) {
                riskFactors.push('Atemwegserkrankung');
                if (riskLevel === 'low') riskLevel = 'medium';
            }
            if (conditionName.includes('dementia') || conditionName.includes('demenz')) {
                riskFactors.push('Kognitive Einschränkung');
                if (riskLevel === 'low') riskLevel = 'medium';
            }
        });

        if (riskFactors.length === 0) {
            riskDiv.innerHTML = `
                <div class="d-flex align-items-center">
                    <span class="risk-badge risk-low me-2">Niedriges Risiko</span>
                    <small class="text-muted">Keine besonderen Risikofaktoren identifiziert</small>
                </div>
            `;
        } else {
            riskDiv.innerHTML = `
                <div class="mb-2">
                    <span class="risk-badge risk-${riskLevel}">${this.getRiskLevelText(riskLevel)}</span>
                </div>
                <div class="mt-2">
                    <small class="text-muted d-block mb-1">Identifizierte Risikofaktoren:</small>
                    ${riskFactors.map(factor => `<span class="aid-tag me-1">${factor}</span>`).join('')}
                </div>
            `;
        }
    }

    renderSpecialNotes() {
        const notesDiv = document.getElementById('specialNotes');
        
        // Generate positioning recommendations based on conditions
        const conditions = this.patientData.condition?.summary || [];
        const recommendations = [];

        conditions.forEach(condition => {
            const conditionName = condition.name?.toLowerCase() || '';
            
            if (conditionName.includes('fractur') && conditionName.includes('femur')) {
                recommendations.push('Betroffenes Bein in neutraler Position lagern');
            }
            if (conditionName.includes('copd')) {
                recommendations.push('Oberkörper erhöht lagern (30-45°)');
            }
            if (conditionName.includes('asthma')) {
                recommendations.push('Semi-Fowler Position bevorzugen');
            }
            if (conditionName.includes('sepsis')) {
                recommendations.push('Häufige Lagerungswechsel alle 2 Stunden');
            }
            if (conditionName.includes('chest pain') || conditionName.includes('herzschmerz')) {
                recommendations.push('Oberkörper leicht erhöht, Seitenlage vermeiden');
            }
        });

        if (recommendations.length === 0) {
            notesDiv.innerHTML = '<div class="text-muted">Keine besonderen Lagerungshinweise</div>';
        } else {
            notesDiv.innerHTML = `
                <ul class="list-unstyled mb-0">
                    ${recommendations.map(rec => `
                        <li class="mb-2">
                            <i class="fas fa-lightbulb text-warning me-2"></i>
                            <small>${rec}</small>
                        </li>
                    `).join('')}
                </ul>
            `;
        }
    }

    renderAllPatientsGrid() {
        const gridDiv = document.getElementById('patientsGrid');
        const patients = this.patientData.patients || [];

        if (patients.length === 0) {
            gridDiv.innerHTML = `
                <div class="col-12">
                    <div class="text-center py-5">
                        <i class="fas fa-users text-muted fs-1 mb-3"></i>
                        <p class="text-muted">Keine Patientendaten verfügbar</p>
                    </div>
                </div>
            `;
            return;
        }

        const patientCards = patients.map(patient => {
            const conditions = patient.data?.condition || [];
            const riskLevel = this.assessPatientRisk(conditions);
            const primaryCondition = conditions[0]?.name || 'Keine Diagnose';

            return `
                <div class="col-md-6 col-lg-4 mb-4 patient-card" data-risk="${riskLevel}" data-condition="${primaryCondition}">
                    <div class="card patient-summary-card">
                        <div class="card-body">
                            <div class="d-flex justify-content-between align-items-start mb-3">
                                <div>
                                    <h6 class="card-title mb-1">${patient.name || 'Unbekannt'}</h6>
                                    <small class="text-muted">
                                        ${patient.gender || 'Unbekannt'} | 
                                        ${this.calculateAge(patient.birthDate)} Jahre
                                    </small>
                                </div>
                                <span class="risk-badge risk-${riskLevel}">${this.getRiskLevelText(riskLevel)}</span>
                            </div>
                            
                            <div class="mb-3">
                                <small class="text-muted d-block mb-1">Hauptdiagnose:</small>
                                <div class="aid-tag">${primaryCondition}</div>
                            </div>

                            <div class="mb-3">
                                <small class="text-muted d-block mb-1">Nächste Lagerung:</small>
                                <div class="d-flex align-items-center">
                                    <i class="fas fa-clock text-blue me-2"></i>
                                    <small>In ${Math.floor(Math.random() * 120) + 30} Min.</small>
                                </div>
                            </div>

                            <div class="d-flex justify-content-between align-items-center">
                                <small class="text-muted">
                                    Letzte Lagerung: vor ${Math.floor(Math.random() * 180) + 60} Min.
                                </small>
                                <button class="btn btn-outline-primary btn-sm" onclick="positioningPlan.viewPatientPlan('${patient.id}')">
                                    <i class="fas fa-eye me-1"></i>
                                    Plan
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            `;
        }).join('');

        gridDiv.innerHTML = patientCards;
    }

    setupFilters() {
        // Populate condition filter
        const conditionFilter = document.getElementById('conditionFilter');
        const patients = this.patientData.patients || [];
        const conditions = new Set();

        patients.forEach(patient => {
            const patientConditions = patient.data?.condition || [];
            patientConditions.forEach(condition => {
                if (condition.name) {
                    conditions.add(condition.name);
                }
            });
        });

        conditions.forEach(condition => {
            const option = document.createElement('option');
            option.value = condition;
            option.textContent = condition;
            conditionFilter.appendChild(option);
        });

        // Setup filter event listeners
        document.getElementById('riskFilter').addEventListener('change', () => this.applyFilters());
        document.getElementById('conditionFilter').addEventListener('change', () => this.applyFilters());
    }

    applyFilters() {
        const riskFilter = document.getElementById('riskFilter').value;
        const conditionFilter = document.getElementById('conditionFilter').value;
        const patientCards = document.querySelectorAll('.patient-card');

        patientCards.forEach(card => {
            const cardRisk = card.dataset.risk;
            const cardCondition = card.dataset.condition;
            
            const riskMatch = !riskFilter || cardRisk === riskFilter;
            const conditionMatch = !conditionFilter || cardCondition.includes(conditionFilter);
            
            if (riskMatch && conditionMatch) {
                card.style.display = 'block';
            } else {
                card.style.display = 'none';
            }
        });
    }

    setupEventListeners() {
        // Add position button
        document.getElementById('addPositionBtn')?.addEventListener('click', () => {
            document.getElementById('positionTime').value = this.getNextPositionTime();
        });

        // Save position button
        document.getElementById('savePositionBtn')?.addEventListener('click', () => {
            this.savePosition();
        });
    }

    generateSampleSchedule() {
        if (this.patientData?.patient?.id === 'all') return;

        // Generate a sample positioning schedule
        const now = new Date();
        const positions = ['supine', 'left-lateral', 'right-lateral', 'semi-fowler'];
        
        for (let i = 0; i < 4; i++) {
            const scheduledTime = new Date(now.getTime() + (i * 2 * 60 * 60 * 1000)); // Every 2 hours
            this.positioningSchedule.push({
                id: `pos-${Date.now()}-${i}`,
                type: positions[i % positions.length],
                scheduledTime: scheduledTime,
                duration: 120,
                aids: i % 2 === 0 ? ['Kissen', 'Lagerungskeile'] : ['Kissen'],
                notes: i === 0 ? 'Besonders vorsichtig aufgrund der Fraktur' : '',
                completed: false
            });
        }
    }

    savePosition() {
        const form = document.getElementById('positionForm');
        const formData = new FormData(form);
        
        const position = {
            id: `pos-${Date.now()}`,
            type: document.getElementById('positionType').value,
            scheduledTime: new Date(document.getElementById('positionTime').value),
            duration: parseInt(document.getElementById('positionDuration').value),
            aids: [],
            notes: document.getElementById('positionNotes').value,
            completed: false
        };

        // Collect aids
        if (document.getElementById('pillows').checked) position.aids.push('Kissen');
        if (document.getElementById('wedges').checked) position.aids.push('Lagerungskeile');
        if (document.getElementById('mattress').checked) position.aids.push('Spezialmatratze');

        this.positioningSchedule.push(position);
        this.positioningSchedule.sort((a, b) => a.scheduledTime - b.scheduledTime);
        
        this.renderPositioningSchedule();
        
        // Close modal
        const modal = bootstrap.Modal.getInstance(document.getElementById('addPositionModal'));
        modal.hide();
        
        // Reset form
        form.reset();
    }

    completePosition(positionId) {
        const position = this.positioningSchedule.find(p => p.id === positionId);
        if (position) {
            position.completed = true;
            this.renderPositioningSchedule();
        }
    }

    deletePosition(positionId) {
        this.positioningSchedule = this.positioningSchedule.filter(p => p.id !== positionId);
        this.renderPositioningSchedule();
    }

    viewPatientPlan(patientId) {
        // In a real app, this would navigate to the patient's individual plan
        alert(`Lagerungsplan für Patient ${patientId} würde geöffnet`);
    }

    // Utility methods
    assessPatientRisk(conditions) {
        const highRiskConditions = ['fractur', 'sepsis', 'copd'];
        const mediumRiskConditions = ['asthma', 'dementia', 'depression'];
        
        for (const condition of conditions) {
            const name = condition.name?.toLowerCase() || '';
            if (highRiskConditions.some(risk => name.includes(risk))) return 'high';
        }
        
        for (const condition of conditions) {
            const name = condition.name?.toLowerCase() || '';
            if (mediumRiskConditions.some(risk => name.includes(risk))) return 'medium';
        }
        
        return 'low';
    }

    getTimeStatus(scheduledTime) {
        const now = new Date();
        const timeDiff = scheduledTime - now;
        
        if (timeDiff < -30 * 60 * 1000) return 'overdue'; // 30 minutes overdue
        if (timeDiff < 30 * 60 * 1000) return 'current'; // Within 30 minutes
        return 'upcoming';
    }

    getTimeStatusText(status) {
        const statusTexts = {
            'overdue': 'Überfällig',
            'current': 'Aktuell',
            'upcoming': 'Geplant'
        };
        return statusTexts[status] || 'Unbekannt';
    }

    getPositionName(type) {
        const names = {
            'supine': 'Rückenlage',
            'prone': 'Bauchlage',
            'left-lateral': 'Linksseitenlage',
            'right-lateral': 'Rechtsseitenlage',
            'semi-fowler': 'Semi-Fowler',
            'fowler': 'Fowler-Lagerung',
            'trendelenburg': 'Trendelenburg'
        };
        return names[type] || type;
    }

    getRiskLevelText(level) {
        const texts = {
            'high': 'Hohes Risiko',
            'medium': 'Mittleres Risiko',
            'low': 'Niedriges Risiko'
        };
        return texts[level] || level;
    }

    getNextPositionTime() {
        const now = new Date();
        now.setMinutes(now.getMinutes() + 120); // Default to 2 hours from now
        return now.toISOString().slice(0, 16);
    }

    formatDate(dateString) {
        if (!dateString) return null;
        return new Date(dateString).toLocaleDateString('de-DE');
    }

    formatDateTime(date) {
        if (!date) return 'Unbekannt';
        return new Date(date).toLocaleString('de-DE', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    }

    calculateAge(birthDate) {
        if (!birthDate) return 'Unbekannt';
        const today = new Date();
        const birth = new Date(birthDate);
        let age = today.getFullYear() - birth.getFullYear();
        const monthDiff = today.getMonth() - birth.getMonth();
        if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
            age--;
        }
        return age;
    }
}

// Initialize the positioning plan when the page loads
document.addEventListener('DOMContentLoaded', () => {
    window.positioningPlan = new PositioningPlan();
});