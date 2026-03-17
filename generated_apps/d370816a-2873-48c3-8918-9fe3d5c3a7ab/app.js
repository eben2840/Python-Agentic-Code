class FluidChart {
    constructor() {
        this.patientData = window.PATIENT_DATA || {};
        this.fluidEntries = this.generateSampleFluidData();
        this.filteredEntries = [...this.fluidEntries];
        
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.populateFilters();
        this.updateDisplay();
        this.setDefaultDateTime();
    }

    setupEventListeners() {
        document.getElementById('refreshBtn').addEventListener('click', () => {
            this.updateDisplay();
        });

        document.getElementById('addEntryBtn').addEventListener('click', () => {
            const modal = new bootstrap.Modal(document.getElementById('addEntryModal'));
            modal.show();
        });

        document.getElementById('saveEntryBtn').addEventListener('click', () => {
            this.saveNewEntry();
        });

        document.getElementById('patientFilter').addEventListener('change', () => {
            this.applyFilters();
        });

        document.getElementById('typeFilter').addEventListener('change', () => {
            this.applyFilters();
        });

        document.getElementById('dateFilter').addEventListener('change', () => {
            this.applyFilters();
        });
    }

    generateSampleFluidData() {
        const entries = [];
        const patients = this.getPatients();
        
        if (patients.length === 0) return entries;

        const now = new Date();
        const fluidTypes = {
            intake: ['Water', 'IV Fluid', 'Juice', 'Milk', 'Soup', 'Tea'],
            output: ['Urine', 'Vomit', 'Drain', 'Blood Loss', 'Perspiration']
        };

        patients.forEach(patient => {
            // Generate 3-8 entries per patient over the last 24 hours
            const entryCount = Math.floor(Math.random() * 6) + 3;
            
            for (let i = 0; i < entryCount; i++) {
                const isIntake = Math.random() > 0.4; // 60% intake, 40% output
                const type = isIntake ? 'intake' : 'output';
                const descriptions = fluidTypes[type];
                const description = descriptions[Math.floor(Math.random() * descriptions.length)];
                
                // Random time in last 24 hours
                const hoursAgo = Math.random() * 24;
                const entryTime = new Date(now.getTime() - (hoursAgo * 60 * 60 * 1000));
                
                // Volume ranges
                let volume;
                if (isIntake) {
                    volume = Math.floor(Math.random() * 400) + 100; // 100-500ml
                } else {
                    volume = Math.floor(Math.random() * 300) + 50; // 50-350ml
                }

                entries.push({
                    id: `entry_${Date.now()}_${i}_${patient.id}`,
                    patientId: patient.id,
                    patientName: patient.name,
                    type: type,
                    description: description,
                    volume: volume,
                    time: entryTime,
                    timeString: entryTime.toISOString()
                });
            }
        });

        return entries.sort((a, b) => b.time - a.time);
    }

    getPatients() {
        if (!this.patientData || !this.patientData.patients) {
            return [];
        }

        return this.patientData.patients
            .filter(p => p.id !== 'all' && p.name && p.name !== 'All Patients')
            .map(p => ({
                id: p.id,
                name: p.name,
                gender: p.gender,
                birthDate: p.birthDate
            }));
    }

    populateFilters() {
        const patients = this.getPatients();
        const patientFilter = document.getElementById('patientFilter');
        const entryPatient = document.getElementById('entryPatient');
        
        // Clear existing options
        patientFilter.innerHTML = '<option value="">All Patients</option>';
        entryPatient.innerHTML = '<option value="">Select Patient</option>';
        
        patients.forEach(patient => {
            const option1 = new Option(patient.name, patient.id);
            const option2 = new Option(patient.name, patient.id);
            patientFilter.appendChild(option1);
            entryPatient.appendChild(option2);
        });
    }

    applyFilters() {
        const patientFilter = document.getElementById('patientFilter').value;
        const typeFilter = document.getElementById('typeFilter').value;
        const dateFilter = document.getElementById('dateFilter').value;

        this.filteredEntries = this.fluidEntries.filter(entry => {
            // Patient filter
            if (patientFilter && entry.patientId !== patientFilter) {
                return false;
            }

            // Type filter
            if (typeFilter && entry.type !== typeFilter) {
                return false;
            }

            // Date filter
            if (dateFilter !== 'all') {
                const now = new Date();
                const entryDate = new Date(entry.time);
                let cutoff;

                switch (dateFilter) {
                    case 'today':
                        cutoff = new Date(now.getFullYear(), now.getMonth(), now.getDate());
                        break;
                    case 'week':
                        cutoff = new Date(now.getTime() - (7 * 24 * 60 * 60 * 1000));
                        break;
                    case 'month':
                        cutoff = new Date(now.getFullYear(), now.getMonth(), 1);
                        break;
                    default:
                        cutoff = new Date(0);
                }

                if (entryDate < cutoff) {
                    return false;
                }
            }

            return true;
        });

        this.updateDisplay();
    }

    updateDisplay() {
        this.updateSummaryCards();
        this.renderPatientCharts();
    }

    updateSummaryCards() {
        const totalIntake = this.filteredEntries
            .filter(e => e.type === 'intake')
            .reduce((sum, e) => sum + e.volume, 0);

        const totalOutput = this.filteredEntries
            .filter(e => e.type === 'output')
            .reduce((sum, e) => sum + e.volume, 0);

        const netBalance = totalIntake - totalOutput;
        
        const activePatients = new Set(this.filteredEntries.map(e => e.patientId)).size;

        document.getElementById('totalIntake').textContent = `${totalIntake.toLocaleString()} mL`;
        document.getElementById('totalOutput').textContent = `${totalOutput.toLocaleString()} mL`;
        document.getElementById('netBalance').textContent = `${netBalance >= 0 ? '+' : ''}${netBalance.toLocaleString()} mL`;
        document.getElementById('activePatients').textContent = activePatients.toString();

        // Update balance color
        const balanceElement = document.getElementById('netBalance');
        const balanceIcon = balanceElement.parentElement.querySelector('.summary-icon');
        if (netBalance < 0) {
            balanceIcon.style.backgroundColor = '#fee2e2';
            balanceIcon.style.color = '#ef4444';
        } else {
            balanceIcon.style.backgroundColor = '#d1fae5';
            balanceIcon.style.color = '#22c55e';
        }
    }

    renderPatientCharts() {
        const chartsContainer = document.getElementById('patientCharts');
        const noDataMessage = document.getElementById('noDataMessage');
        
        // Group entries by patient
        const patientEntries = {};
        this.filteredEntries.forEach(entry => {
            if (!patientEntries[entry.patientId]) {
                patientEntries[entry.patientId] = {
                    patient: {
                        id: entry.patientId,
                        name: entry.patientName
                    },
                    entries: []
                };
            }
            patientEntries[entry.patientId].entries.push(entry);
        });

        const patientIds = Object.keys(patientEntries);
        
        if (patientIds.length === 0) {
            chartsContainer.innerHTML = '';
            noDataMessage.style.display = 'block';
            return;
        }

        noDataMessage.style.display = 'none';
        
        const chartsHtml = patientIds.map(patientId => {
            const data = patientEntries[patientId];
            return this.renderPatientChart(data);
        }).join('');

        chartsContainer.innerHTML = chartsHtml;
    }

    renderPatientChart(data) {
        const { patient, entries } = data;
        
        const totalIntake = entries
            .filter(e => e.type === 'intake')
            .reduce((sum, e) => sum + e.volume, 0);

        const totalOutput = entries
            .filter(e => e.type === 'output')
            .reduce((sum, e) => sum + e.volume, 0);

        const netBalance = totalIntake - totalOutput;
        const balanceClass = netBalance >= 0 ? 'balance' : 'balance negative';

        const entriesHtml = entries
            .sort((a, b) => b.time - a.time)
            .slice(0, 10) // Show last 10 entries
            .map(entry => this.renderFluidEntry(entry))
            .join('');

        return `
            <div class="col-lg-6 col-xl-4">
                <div class="card patient-chart">
                    <div class="card-body">
                        <div class="patient-header">
                            <div class="patient-info">
                                <h5>${patient.name}</h5>
                                <p class="text-muted">Patient ID: ${patient.id.substring(0, 8)}...</p>
                            </div>
                        </div>
                        
                        <div class="patient-stats">
                            <div class="stat-item">
                                <p class="stat-value intake">${totalIntake.toLocaleString()}</p>
                                <p class="stat-label">Intake (mL)</p>
                            </div>
                            <div class="stat-item">
                                <p class="stat-value output">${totalOutput.toLocaleString()}</p>
                                <p class="stat-label">Output (mL)</p>
                            </div>
                            <div class="stat-item">
                                <p class="stat-value ${balanceClass}">${netBalance >= 0 ? '+' : ''}${netBalance.toLocaleString()}</p>
                                <p class="stat-label">Balance (mL)</p>
                            </div>
                        </div>

                        <div class="fluid-entries">
                            ${entriesHtml || '<div class="empty-state"><i class="fas fa-tint"></i><p>No fluid entries recorded</p></div>'}
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    renderFluidEntry(entry) {
        const timeStr = this.formatTime(entry.time);
        
        return `
            <div class="fluid-entry">
                <div class="entry-icon ${entry.type}">
                    <i class="fas fa-${entry.type === 'intake' ? 'arrow-down' : 'arrow-up'}"></i>
                </div>
                <div class="entry-details">
                    <p class="entry-description">${entry.description}</p>
                    <p class="entry-time">${timeStr}</p>
                </div>
                <div class="entry-volume ${entry.type}">
                    ${entry.volume} mL
                </div>
            </div>
        `;
    }

    formatTime(date) {
        const now = new Date();
        const diff = now - date;
        const hours = Math.floor(diff / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

        if (hours === 0) {
            return `${minutes}m ago`;
        } else if (hours < 24) {
            return `${hours}h ${minutes}m ago`;
        } else {
            return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
        }
    }

    setDefaultDateTime() {
        const now = new Date();
        const localDateTime = new Date(now.getTime() - now.getTimezoneOffset() * 60000)
            .toISOString()
            .slice(0, 16);
        document.getElementById('entryTime').value = localDateTime;
    }

    saveNewEntry() {
        const form = document.getElementById('addEntryForm');
        const formData = new FormData(form);
        
        const patientId = document.getElementById('entryPatient').value;
        const type = document.getElementById('entryType').value;
        const volume = parseInt(document.getElementById('entryVolume').value);
        const description = document.getElementById('entryDescription').value;
        const time = new Date(document.getElementById('entryTime').value);

        if (!patientId || !type || !volume || !time) {
            alert('Please fill in all required fields');
            return;
        }

        const patient = this.getPatients().find(p => p.id === patientId);
        if (!patient) {
            alert('Invalid patient selected');
            return;
        }

        const newEntry = {
            id: `entry_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            patientId: patientId,
            patientName: patient.name,
            type: type,
            description: description || (type === 'intake' ? 'Fluid Intake' : 'Fluid Output'),
            volume: volume,
            time: time,
            timeString: time.toISOString()
        };

        this.fluidEntries.unshift(newEntry);
        this.applyFilters();

        // Close modal and reset form
        const modal = bootstrap.Modal.getInstance(document.getElementById('addEntryModal'));
        modal.hide();
        form.reset();
        this.setDefaultDateTime();

        // Show success message
        this.showToast('Fluid entry added successfully', 'success');
    }

    showToast(message, type = 'info') {
        // Simple toast notification
        const toast = document.createElement('div');
        toast.className = `alert alert-${type === 'success' ? 'success' : 'info'} position-fixed`;
        toast.style.cssText = 'top: 20px; right: 20px; z-index: 9999; min-width: 300px;';
        toast.innerHTML = `
            <div class="d-flex align-items-center">
                <i class="fas fa-${type === 'success' ? 'check-circle' : 'info-circle'} me-2"></i>
                ${message}
            </div>
        `;
        
        document.body.appendChild(toast);
        
        setTimeout(() => {
            toast.remove();
        }, 3000);
    }
}

// Initialize the app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new FluidChart();
});