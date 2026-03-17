// Mock patient data structure
window.PATIENT_DATA = {
    patient: {
        id: 'pat-0a70a8f4',
        name: 'Jane Doe',
        gender: 'female',
        birthDate: '1980-02-15'
    },
    condition: {
        summary: [
            {
                name: 'Breast Cancer',
                status: 'active',
                date: '2026-03-01T09:00:00Z'
            }
        ]
    },
    medicationrequest: {
        summary: [
            {
                name: 'Treatment for Breast Cancer',
                value: '1 tablet daily',
                status: 'active'
            }
        ]
    },
    observation: {
        summary: [
            {
                name: 'Tumor Marker CA15-3',
                value: 'Latest: Tumor Marker CA15-3',
                date: '2026-03-05T12:00:00Z',
                status: 'final'
            }
        ]
    },
    locations: {
        summary: [
            {
                name: 'Room 205',
                value: 'Oncology Ward',
                status: 'active'
            }
        ]
    }
};

class PainTracker {
    constructor() {
        this.painRecords = [];
        this.initializeEventListeners();
    }

    initializeEventListeners() {
        const painScale = document.getElementById('painScale');
        const painLevelBadge = document.getElementById('painLevelBadge');
        const recordPainBtn = document.getElementById('recordPain');

        painScale.addEventListener('input', (e) => {
            const level = parseInt(e.target.value);
            painLevelBadge.textContent = level;
            painLevelBadge.className = `badge pain-level-badge ${this.getPainLevelClass(level)}`;
        });

        recordPainBtn.addEventListener('click', () => this.recordPainAssessment());
    }

    getPainLevelClass(level) {
        if (level <= 3) return 'low';
        if (level <= 6) return 'moderate';
        return 'severe';
    }

    recordPainAssessment() {
        const level = parseInt(document.getElementById('painScale').value);
        const location = document.getElementById('painLocation').value;
        const painTypes = [];

        // Get selected pain types
        ['sharp', 'dull', 'burning', 'throbbing', 'cramping', 'aching'].forEach(type => {
            if (document.getElementById(type).checked) {
                painTypes.push(type);
            }
        });

        if (!location) {
            alert('Please select a pain location');
            return;
        }

        const record = {
            id: Date.now(),
            level: level,
            location: location,
            types: painTypes,
            timestamp: new Date()
        };

        this.painRecords.unshift(record);
        this.renderPainHistory();
        this.resetForm();
    }

    resetForm() {
        document.getElementById('painScale').value = 0;
        document.getElementById('painLevelBadge').textContent = '0';
        document.getElementById('painLevelBadge').className = 'badge pain-level-badge low';
        document.getElementById('painLocation').value = '';
        ['sharp', 'dull', 'burning', 'throbbing', 'cramping', 'aching'].forEach(type => {
            document.getElementById(type).checked = false;
        });
    }

    renderPainHistory() {
        const historyContainer = document.getElementById('painHistory');
        
        if (this.painRecords.length === 0) {
            historyContainer.innerHTML = '<div class="text-muted text-center py-3">No pain assessments recorded</div>';
            return;
        }

        const html = this.painRecords.slice(0, 5).map(record => `
            <div class="pain-record ${this.getPainLevelClass(record.level)}">
                <div class="d-flex justify-content-between align-items-start">
                    <div>
                        <div class="fw-bold">Pain Level: ${record.level}/10</div>
                        <div class="text-muted small">Location: ${record.location}</div>
                        ${record.types.length > 0 ? `<div class="text-muted small">Type: ${record.types.join(', ')}</div>` : ''}
                    </div>
                    <div class="text-muted small">
                        ${record.timestamp.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                    </div>
                </div>
            </div>
        `).join('');

        historyContainer.innerHTML = html;
    }
}

class FluidTracker {
    constructor() {
        this.fluidEntries = [];
        this.initializeEventListeners();
    }

    initializeEventListeners() {
        // Quick intake buttons
        document.querySelectorAll('.quick-intake').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const amount = parseInt(e.target.dataset.amount);
                this.addIntake(amount, 'oral');
            });
        });

        // Quick output buttons
        document.querySelectorAll('.quick-output').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const amount = parseInt(e.target.dataset.amount);
                this.addOutput(amount, 'urine');
            });
        });

        // Custom intake
        document.getElementById('addCustomIntake').addEventListener('click', () => {
            const amount = parseInt(document.getElementById('customIntakeAmount').value);
            const type = document.getElementById('intakeType').value;
            
            if (amount && amount > 0) {
                this.addIntake(amount, type);
                bootstrap.Modal.getInstance(document.getElementById('customIntakeModal')).hide();
                document.getElementById('customIntakeAmount').value = '';
            }
        });

        // Custom output
        document.getElementById('addCustomOutput').addEventListener('click', () => {
            const amount = parseInt(document.getElementById('customOutputAmount').value);
            const type = document.getElementById('outputType').value;
            
            if (amount && amount > 0) {
                this.addOutput(amount, type);
                bootstrap.Modal.getInstance(document.getElementById('customOutputModal')).hide();
                document.getElementById('customOutputAmount').value = '';
            }
        });
    }

    addIntake(amount, type) {
        const entry = {
            id: Date.now(),
            type: 'intake',
            amount: amount,
            category: type,
            timestamp: new Date()
        };

        this.fluidEntries.unshift(entry);
        this.updateDashboard();
    }

    addOutput(amount, type) {
        const entry = {
            id: Date.now(),
            type: 'output',
            amount: amount,
            category: type,
            timestamp: new Date()
        };

        this.fluidEntries.unshift(entry);
        this.updateDashboard();
    }

    calculateTotals() {
        const today = new Date().toDateString();
        const todayEntries = this.fluidEntries.filter(entry => 
            entry.timestamp.toDateString() === today
        );

        const totalIntake = todayEntries
            .filter(entry => entry.type === 'intake')
            .reduce((sum, entry) => sum + entry.amount, 0);

        const totalOutput = todayEntries
            .filter(entry => entry.type === 'output')
            .reduce((sum, entry) => sum + entry.amount, 0);

        return { totalIntake, totalOutput };
    }

    updateDashboard() {
        const { totalIntake, totalOutput } = this.calculateTotals();
        const balance = totalIntake - totalOutput;

        // Update totals
        document.getElementById('totalIntake').textContent = `${totalIntake} mL`;
        document.getElementById('totalOutput').textContent = `${totalOutput} mL`;

        // Update balance
        const balanceBadge = document.getElementById('balanceBadge');
        const balanceBar = document.getElementById('balanceBar');
        
        balanceBadge.textContent = `${balance >= 0 ? '+' : ''}${balance} mL`;
        
        if (balance > 0) {
            balanceBadge.className = 'badge positive';
            balanceBar.style.width = '60%';
        } else if (balance < 0) {
            balanceBadge.className = 'badge negative';
            balanceBar.style.width = '40%';
        } else {
            balanceBadge.className = 'badge neutral';
            balanceBar.style.width = '50%';
        }

        this.renderFluidHistory();
    }

    renderFluidHistory() {
        const historyContainer = document.getElementById('fluidHistory');
        
        if (this.fluidEntries.length === 0) {
            historyContainer.innerHTML = '<div class="text-muted text-center py-3">No fluid entries recorded</div>';
            return;
        }

        const html = this.fluidEntries.slice(0, 8).map(entry => `
            <div class="fluid-entry ${entry.type}">
                <div class="d-flex justify-content-between align-items-center w-100">
                    <div>
                        <div class="fluid-entry-amount">${entry.amount} mL</div>
                        <div class="text-muted small">${entry.category} • ${entry.type}</div>
                    </div>
                    <div class="fluid-entry-time">
                        ${entry.timestamp.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                    </div>
                </div>
            </div>
        `).join('');

        historyContainer.innerHTML = html;
    }
}

class PatientDashboard {
    constructor() {
        this.loadPatientData();
        this.painTracker = new PainTracker();
        this.fluidTracker = new FluidTracker();
    }

    loadPatientData() {
        const data = window.PATIENT_DATA;
        
        if (!data || !data.patient) {
            console.error('No patient data available');
            return;
        }

        // Load patient info
        document.getElementById('patientName').textContent = data.patient.name || 'Unknown Patient';
        document.getElementById('patientGender').textContent = data.patient.gender || '-';
        document.getElementById('patientDob').textContent = data.patient.birthDate || '-';
        document.getElementById('patientId').textContent = data.patient.id || '-';

        // Load conditions
        this.loadConditions(data.condition?.summary || []);
        
        // Load medications
        this.loadMedications(data.medicationrequest?.summary || []);
    }

    loadConditions(conditions) {
        const container = document.getElementById('conditionsList');
        
        if (conditions.length === 0) {
            container.innerHTML = '<div class="text-muted">No conditions available</div>';
            return;
        }

        const html = conditions.map(condition => `
            <div class="condition-item">
                <div class="d-flex justify-content-between align-items-start">
                    <div>
                        <div class="fw-bold">${condition.name || 'Unknown Condition'}</div>
                        ${condition.date ? `<div class="text-muted small">Since: ${new Date(condition.date).toLocaleDateString()}</div>` : ''}
                    </div>
                    <span class="status-badge ${condition.status || 'active'}">${condition.status || 'active'}</span>
                </div>
            </div>
        `).join('');

        container.innerHTML = html;
    }

    loadMedications(medications) {
        const container = document.getElementById('medicationsList');
        
        if (medications.length === 0) {
            container.innerHTML = '<div class="text-muted">No medications available</div>';
            return;
        }

        const html = medications.map(medication => `
            <div class="medication-item">
                <div class="d-flex justify-content-between align-items-start">
                    <div>
                        <div class="fw-bold">${medication.name || 'Unknown Medication'}</div>
                        ${medication.value ? `<div class="text-muted small">Dosage: ${medication.value}</div>` : ''}
                    </div>
                    <span class="status-badge ${medication.status || 'active'}">${medication.status || 'active'}</span>
                </div>
            </div>
        `).join('');

        container.innerHTML = html;
    }
}

// Initialize the dashboard when the page loads
document.addEventListener('DOMContentLoaded', () => {
    new PatientDashboard();
});