class AnamneseAssessmentApp {
    constructor() {
        this.data = window.PATIENT_DATA || {};
        this.filteredData = [];
        this.currentWard = '';
        this.currentMonth = '2026-03';
        
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.populateWardFilter();
        this.loadData();
    }

    setupEventListeners() {
        document.getElementById('wardFilter').addEventListener('change', (e) => {
            this.currentWard = e.target.value;
            this.loadData();
        });

        document.getElementById('monthFilter').addEventListener('change', (e) => {
            this.currentMonth = e.target.value;
            this.loadData();
        });

        document.getElementById('refreshBtn').addEventListener('click', () => {
            this.loadData();
        });
    }

    populateWardFilter() {
        const wardFilter = document.getElementById('wardFilter');
        const wards = new Set();

        if (this.data.patient?.id === 'all' && this.data.patients) {
            this.data.patients.forEach(patient => {
                if (patient.data?.locations?.summary) {
                    patient.data.locations.summary.forEach(location => {
                        if (location.value) {
                            wards.add(location.value);
                        }
                    });
                }
            });
        }

        // Clear existing options except "Alle Stationen"
        while (wardFilter.children.length > 1) {
            wardFilter.removeChild(wardFilter.lastChild);
        }

        if (wards.size === 0) {
            // Add some default wards if no location data available
            const defaultWards = ['Innere Medizin', 'Chirurgie', 'Kardiologie', 'Neurologie', 'Onkologie'];
            defaultWards.forEach(ward => {
                const option = document.createElement('option');
                option.value = ward;
                option.textContent = ward;
                wardFilter.appendChild(option);
            });
        } else {
            Array.from(wards).sort().forEach(ward => {
                const option = document.createElement('option');
                option.value = ward;
                option.textContent = ward;
                wardFilter.appendChild(option);
            });
        }
    }

    loadData() {
        if (!this.data.patient || this.data.patient.id !== 'all' || !this.data.patients) {
            this.showNoData();
            return;
        }

        this.filteredData = this.filterPatients();
        this.updateSummaryCards();
        this.updateTable();
    }

    filterPatients() {
        let patients = this.data.patients || [];

        // Filter by ward if selected
        if (this.currentWard) {
            patients = patients.filter(patient => {
                if (!patient.data?.locations?.summary) return false;
                return patient.data.locations.summary.some(location => 
                    location.value === this.currentWard
                );
            });
        }

        // Filter by month (based on encounter dates)
        patients = patients.filter(patient => {
            if (!patient.data?.encounter?.summary) return false;
            return patient.data.encounter.summary.some(encounter => {
                if (!encounter.date) return false;
                const encounterDate = new Date(encounter.date);
                const monthKey = `${encounterDate.getFullYear()}-${String(encounterDate.getMonth() + 1).padStart(2, '0')}`;
                return monthKey === this.currentMonth;
            });
        });

        return patients.map(patient => this.enrichPatientData(patient));
    }

    enrichPatientData(patient) {
        const enriched = { ...patient };
        
        // Get admission date from encounter
        const admissionDate = patient.data?.encounter?.summary?.[0]?.date;
        enriched.admissionDate = admissionDate;

        // Check for Anamnese (within 24 hours)
        enriched.anamneseCompliant = this.checkAnamneseCompliance(patient, admissionDate);
        
        // Check for Assessment (within 72 hours)
        enriched.assessmentCompliant = this.checkAssessmentCompliance(patient, admissionDate);

        // Get ward
        enriched.ward = patient.data?.locations?.summary?.[0]?.value || 'Unbekannt';

        return enriched;
    }

    checkAnamneseCompliance(patient, admissionDate) {
        if (!admissionDate) return false;
        
        const admission = new Date(admissionDate);
        const deadline = new Date(admission.getTime() + 24 * 60 * 60 * 1000); // 24 hours

        // Check observations for anamnese-related entries
        const observations = patient.data?.observation?.summary || [];
        return observations.some(obs => {
            if (!obs.date) return false;
            const obsDate = new Date(obs.date);
            return obsDate <= deadline && obsDate >= admission;
        });
    }

    checkAssessmentCompliance(patient, admissionDate) {
        if (!admissionDate) return false;
        
        const admission = new Date(admissionDate);
        const deadline = new Date(admission.getTime() + 72 * 60 * 60 * 1000); // 72 hours

        // Check conditions or observations for assessment-related entries
        const conditions = patient.data?.condition?.summary || [];
        const observations = patient.data?.observation?.summary || [];
        
        const hasConditionAssessment = conditions.some(cond => {
            if (!cond.date) return false;
            const condDate = new Date(cond.date);
            return condDate <= deadline && condDate >= admission;
        });

        const hasObservationAssessment = observations.some(obs => {
            if (!obs.date) return false;
            const obsDate = new Date(obs.date);
            return obsDate <= deadline && obsDate >= admission;
        });

        return hasConditionAssessment || hasObservationAssessment;
    }

    updateSummaryCards() {
        const totalPatients = this.filteredData.length;
        
        if (totalPatients === 0) {
            this.updateCard('anamnese', 0, 0, 0);
            this.updateCard('assessment', 0, 0, 0);
            return;
        }

        const anamneseCompliant = this.filteredData.filter(p => p.anamneseCompliant).length;
        const assessmentCompliant = this.filteredData.filter(p => p.assessmentCompliant).length;

        const anamnesePercent = Math.round((anamneseCompliant / totalPatients) * 100);
        const assessmentPercent = Math.round((assessmentCompliant / totalPatients) * 100);

        this.updateCard('anamnese', anamnesePercent, anamneseCompliant, totalPatients);
        this.updateCard('assessment', assessmentPercent, assessmentCompliant, totalPatients);
    }

    updateCard(type, percent, compliant, total) {
        document.getElementById(`${type}Percent`).textContent = `${percent}%`;
        document.getElementById(`${type}Count`).textContent = `(${compliant} von ${total})`;
        document.getElementById(`${type}Progress`).style.width = `${percent}%`;
    }

    updateTable() {
        const tbody = document.getElementById('patientTableBody');
        
        if (this.filteredData.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="6" class="text-center text-muted py-4">
                        <i class="fas fa-info-circle me-2"></i>
                        Keine Daten für die ausgewählten Filter verfügbar
                    </td>
                </tr>
            `;
            return;
        }

        tbody.innerHTML = this.filteredData.map(patient => {
            const admissionDate = patient.admissionDate ? 
                new Date(patient.admissionDate).toLocaleDateString('de-DE') : 'Unbekannt';
            
            const anamneseStatus = patient.anamneseCompliant ? 
                '<span class="status-badge status-compliant"><i class="fas fa-check"></i>Erfüllt</span>' :
                '<span class="status-badge status-non-compliant"><i class="fas fa-times"></i>Nicht erfüllt</span>';
            
            const assessmentStatus = patient.assessmentCompliant ? 
                '<span class="status-badge status-compliant"><i class="fas fa-check"></i>Erfüllt</span>' :
                '<span class="status-badge status-non-compliant"><i class="fas fa-times"></i>Nicht erfüllt</span>';

            const overallStatus = patient.anamneseCompliant && patient.assessmentCompliant ? 
                '<span class="status-badge status-compliant"><i class="fas fa-check-circle"></i>Vollständig</span>' :
                patient.anamneseCompliant || patient.assessmentCompliant ?
                '<span class="status-badge status-partial"><i class="fas fa-exclamation-circle"></i>Teilweise</span>' :
                '<span class="status-badge status-non-compliant"><i class="fas fa-times-circle"></i>Unvollständig</span>';

            return `
                <tr>
                    <td>
                        <strong>${patient.name || 'Unbekannt'}</strong><br>
                        <small class="text-muted">${patient.gender || ''} • ${patient.birthDate ? new Date(patient.birthDate).toLocaleDateString('de-DE') : ''}</small>
                    </td>
                    <td>${patient.ward}</td>
                    <td>${admissionDate}</td>
                    <td>${anamneseStatus}</td>
                    <td>${assessmentStatus}</td>
                    <td>${overallStatus}</td>
                </tr>
            `;
        }).join('');
    }

    showNoData() {
        document.getElementById('noDataMessage').classList.remove('d-none');
        document.getElementById('patientTableBody').innerHTML = `
            <tr>
                <td colspan="6" class="text-center text-muted py-4">
                    <i class="fas fa-info-circle me-2"></i>
                    Keine Patientendaten verfügbar
                </td>
            </tr>
        `;
        this.updateCard('anamnese', 0, 0, 0);
        this.updateCard('assessment', 0, 0, 0);
    }
}

// Initialize app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new AnamneseAssessmentApp();
});