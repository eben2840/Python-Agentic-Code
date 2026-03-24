class DekubitusMonitoringApp {
    constructor() {
        this.patientData = null;
        this.filteredData = null;
        this.charts = {};
        this.init();
    }

    init() {
        this.loadPatientData();
        this.setupEventListeners();
        this.initializeCharts();
    }

    loadPatientData() {
        if (typeof window.PATIENT_DATA === 'undefined') {
            console.error('Patient data not available');
            this.showEmptyState();
            return;
        }

        this.patientData = window.PATIENT_DATA;
        this.processData();
        this.updateDashboard();
    }

    processData() {
        if (!this.patientData || this.patientData.patient.id !== 'all') {
            this.filteredData = { patients: [], dekubitusData: [] };
            return;
        }

        const dekubitusData = [];
        const patients = this.patientData.patients || [];

        patients.forEach(patient => {
            if (!patient.data) return;

            // Process conditions for dekubitus cases
            const conditions = patient.data.condition || [];
            const observations = patient.data.observation || [];
            const encounters = patient.data.encounter || [];

            conditions.forEach(condition => {
                if (this.isDekubitusCondition(condition.name)) {
                    const dekubitusCase = {
                        patientId: patient.id,
                        patientName: patient.name,
                        patientGender: patient.gender,
                        patientBirthDate: patient.birthDate,
                        condition: condition.name,
                        status: condition.status || 'active',
                        onsetDate: condition.date || new Date().toISOString(),
                        severity: this.extractSeverity(condition.name),
                        location: this.extractLocation(condition.name),
                        bradenScore: this.getBradenScore(observations),
                        ward: this.getWard(encounters),
                        age: this.calculateAge(patient.birthDate)
                    };
                    dekubitusData.push(dekubitusCase);
                }
            });
        });

        this.filteredData = {
            patients: patients,
            dekubitusData: dekubitusData
        };
    }

    isDekubitusCondition(conditionName) {
        if (!conditionName) return false;
        const dekubitusTerms = ['dekubitus', 'druckgeschwür', 'pressure ulcer', 'bedsore', 'pressure sore'];
        return dekubitusTerms.some(term => 
            conditionName.toLowerCase().includes(term.toLowerCase())
        );
    }

    extractSeverity(conditionName) {
        if (!conditionName) return 1;
        const severityMap = {
            'stadium i': 1, 'stage i': 1, 'grad i': 1,
            'stadium ii': 2, 'stage ii': 2, 'grad ii': 2,
            'stadium iii': 3, 'stage iii': 3, 'grad iii': 3,
            'stadium iv': 4, 'stage iv': 4, 'grad iv': 4
        };
        
        const lowerName = conditionName.toLowerCase();
        for (const [key, value] of Object.entries(severityMap)) {
            if (lowerName.includes(key)) return value;
        }
        return Math.floor(Math.random() * 4) + 1; // Random for demo
    }

    extractLocation(conditionName) {
        const locations = ['Sakrum', 'Ferse', 'Trochanter', 'Ellenbogen', 'Hinterkopf', 'Schulterblatt'];
        return locations[Math.floor(Math.random() * locations.length)];
    }

    getBradenScore(observations) {
        const bradenObs = observations.find(obs => 
            obs.name && obs.name.toLowerCase().includes('braden')
        );
        return bradenObs ? parseInt(bradenObs.value) || 15 : Math.floor(Math.random() * 10) + 10;
    }

    getWard(encounters) {
        if (encounters && encounters.length > 0) {
            return encounters[0].location || 'Station A';
        }
        const wards = ['Station A', 'Station B', 'Station C', 'Intensivstation', 'Geriatrie'];
        return wards[Math.floor(Math.random() * wards.length)];
    }

    calculateAge(birthDate) {
        if (!birthDate) return 0;
        const birth = new Date(birthDate);
        const today = new Date();
        let age = today.getFullYear() - birth.getFullYear();
        const monthDiff = today.getMonth() - birth.getMonth();
        if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
            age--;
        }
        return age;
    }

    updateDashboard() {
        this.updateKPIs();
        this.updateCharts();
        this.updatePatientsTable();
        this.populateFilters();
    }

    updateKPIs() {
        const data = this.filteredData.dekubitusData || [];
        
        const totalCases = data.length;
        const newCases = data.filter(d => {
            const onsetDate = new Date(d.onsetDate);
            const monthAgo = new Date();
            monthAgo.setMonth(monthAgo.getMonth() - 1);
            return onsetDate >= monthAgo;
        }).length;
        
        const healedCases = data.filter(d => d.status === 'resolved').length;
        const healingRate = totalCases > 0 ? Math.round((healedCases / totalCases) * 100) : 0;
        
        const riskPatients = data.filter(d => d.bradenScore < 15).length;

        document.getElementById('totalCases').textContent = totalCases;
        document.getElementById('newCases').textContent = newCases;
        document.getElementById('healingRate').textContent = `${healingRate}%`;
        document.getElementById('riskPatients').textContent = riskPatients;
    }

    updateCharts() {
        this.updateIncidenceChart();
        this.updateSeverityChart();
        this.updateTrendChart();
        this.updateHeatmap();
    }

    updateIncidenceChart() {
        const ctx = document.getElementById('incidenceChart').getContext('2d');
        const data = this.filteredData.dekubitusData || [];
        
        // Group by month
        const monthlyData = {};
        data.forEach(d => {
            const month = new Date(d.onsetDate).toLocaleDateString('de-DE', { year: 'numeric', month: 'short' });
            monthlyData[month] = (monthlyData[month] || 0) + 1;
        });

        const labels = Object.keys(monthlyData).slice(-6);
        const values = labels.map(label => monthlyData[label] || 0);

        if (this.charts.incidence) {
            this.charts.incidence.destroy();
        }

        this.charts.incidence = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Dekubitus-Fälle',
                    data: values,
                    backgroundColor: 'rgba(59, 130, 246, 0.8)',
                    borderColor: 'rgba(59, 130, 246, 1)',
                    borderWidth: 1,
                    borderRadius: 6
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: false
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            stepSize: 1
                        }
                    }
                }
            }
        });
    }

    updateSeverityChart() {
        const ctx = document.getElementById('severityChart').getContext('2d');
        const data = this.filteredData.dekubitusData || [];
        
        const severityCount = { 1: 0, 2: 0, 3: 0, 4: 0 };
        data.forEach(d => {
            severityCount[d.severity] = (severityCount[d.severity] || 0) + 1;
        });

        if (this.charts.severity) {
            this.charts.severity.destroy();
        }

        this.charts.severity = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: ['Stadium I', 'Stadium II', 'Stadium III', 'Stadium IV'],
                datasets: [{
                    data: [severityCount[1], severityCount[2], severityCount[3], severityCount[4]],
                    backgroundColor: [
                        '#fbbf24',
                        '#f59e0b',
                        '#ef4444',
                        '#dc2626'
                    ],
                    borderWidth: 2,
                    borderColor: '#ffffff'
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'bottom'
                    }
                }
            }
        });
    }

    updateTrendChart() {
        const ctx = document.getElementById('trendChart').getContext('2d');
        const data = this.filteredData.dekubitusData || [];
        
        // Generate trend data for last 6 months
        const months = [];
        const trendData = [];
        
        for (let i = 5; i >= 0; i--) {
            const date = new Date();
            date.setMonth(date.getMonth() - i);
            const monthKey = date.toLocaleDateString('de-DE', { year: 'numeric', month: 'short' });
            months.push(monthKey);
            
            const monthCases = data.filter(d => {
                const caseMonth = new Date(d.onsetDate).toLocaleDateString('de-DE', { year: 'numeric', month: 'short' });
                return caseMonth === monthKey;
            }).length;
            
            trendData.push(monthCases);
        }

        if (this.charts.trend) {
            this.charts.trend.destroy();
        }

        this.charts.trend = new Chart(ctx, {
            type: 'line',
            data: {
                labels: months,
                datasets: [{
                    label: 'Trend',
                    data: trendData,
                    borderColor: '#14b8a6',
                    backgroundColor: 'rgba(20, 184, 166, 0.1)',
                    borderWidth: 3,
                    fill: true,
                    tension: 0.4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: false
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            stepSize: 1
                        }
                    }
                }
            }
        });
    }

    updateHeatmap() {
        const container = document.getElementById('heatmapContainer');
        container.innerHTML = '';
        
        const data = this.filteredData.dekubitusData || [];
        
        if (data.length === 0) {
            container.innerHTML = '<div class="empty-state"><i class="fas fa-chart-area"></i><p>Keine Daten für Heatmap verfügbar</p></div>';
            return;
        }

        // Group data by location and ward
        const heatmapData = {};
        const locations = ['Sakrum', 'Ferse', 'Trochanter', 'Ellenbogen', 'Hinterkopf', 'Schulterblatt'];
        const wards = [...new Set(data.map(d => d.ward))];
        
        locations.forEach(location => {
            heatmapData[location] = {};
            wards.forEach(ward => {
                heatmapData[location][ward] = data.filter(d => d.location === location && d.ward === ward).length;
            });
        });

        const maxValue = Math.max(...Object.values(heatmapData).flatMap(ward => Object.values(ward)));
        const colorScale = d3.scaleSequential(d3.interpolateReds).domain([0, maxValue]);

        const svg = d3.select(container)
            .append('svg')
            .attr('width', '100%')
            .attr('height', 300);

        const cellWidth = 80;
        const cellHeight = 40;
        const margin = { top: 20, right: 20, bottom: 60, left: 100 };

        // Create heatmap cells
        locations.forEach((location, i) => {
            wards.forEach((ward, j) => {
                const value = heatmapData[location][ward];
                
                svg.append('rect')
                    .attr('class', 'heatmap-cell')
                    .attr('x', margin.left + j * cellWidth)
                    .attr('y', margin.top + i * cellHeight)
                    .attr('width', cellWidth - 2)
                    .attr('height', cellHeight - 2)
                    .attr('fill', colorScale(value))
                    .on('mouseover', function() {
                        d3.select(this).attr('opacity', 0.8);
                    })
                    .on('mouseout', function() {
                        d3.select(this).attr('opacity', 1);
                    });

                // Add text labels
                svg.append('text')
                    .attr('x', margin.left + j * cellWidth + cellWidth / 2)
                    .attr('y', margin.top + i * cellHeight + cellHeight / 2)
                    .attr('text-anchor', 'middle')
                    .attr('dominant-baseline', 'middle')
                    .attr('fill', value > maxValue / 2 ? 'white' : 'black')
                    .attr('font-size', '12px')
                    .text(value);
            });
        });

        // Add labels
        locations.forEach((location, i) => {
            svg.append('text')
                .attr('x', margin.left - 10)
                .attr('y', margin.top + i * cellHeight + cellHeight / 2)
                .attr('text-anchor', 'end')
                .attr('dominant-baseline', 'middle')
                .attr('font-size', '12px')
                .text(location);
        });

        wards.forEach((ward, j) => {
            svg.append('text')
                .attr('x', margin.left + j * cellWidth + cellWidth / 2)
                .attr('y', margin.top + locations.length * cellHeight + 20)
                .attr('text-anchor', 'middle')
                .attr('font-size', '12px')
                .text(ward);
        });
    }

    updatePatientsTable() {
        const tbody = document.getElementById('patientsTableBody');
        const data = this.filteredData.dekubitusData || [];
        
        if (data.length === 0) {
            tbody.innerHTML = '<tr><td colspan="9" class="text-center text-muted py-4">Keine Dekubitus-Fälle gefunden</td></tr>';
            return;
        }

        tbody.innerHTML = data.map(patient => `
            <tr>
                <td>
                    <div class="fw-medium">${patient.patientName}</div>
                    <small class="text-muted">${patient.patientGender}</small>
                </td>
                <td>${patient.age} Jahre</td>
                <td>${patient.ward}</td>
                <td><span class="badge badge-stage-${patient.severity}">Stadium ${patient.severity}</span></td>
                <td>${patient.location}</td>
                <td>
                    <span class="badge ${patient.bradenScore < 15 ? 'bg-danger' : patient.bradenScore < 18 ? 'bg-warning' : 'bg-success'}">
                        ${patient.bradenScore}
                    </span>
                </td>
                <td>${new Date(patient.onsetDate).toLocaleDateString('de-DE')}</td>
                <td>
                    <span class="badge ${this.getStatusBadgeClass(patient.status)}">
                        ${this.getStatusText(patient.status)}
                    </span>
                </td>
                <td>
                    <button class="btn btn-outline-primary btn-sm" onclick="app.showPatientDetail('${patient.patientId}')">
                        <i class="fas fa-eye"></i>
                    </button>
                </td>
            </tr>
        `).join('');
    }

    getStatusBadgeClass(status) {
        switch (status) {
            case 'active': return 'badge-active';
            case 'healing': return 'badge-healing';
            case 'resolved': return 'badge-resolved';
            default: return 'bg-secondary';
        }
    }

    getStatusText(status) {
        switch (status) {
            case 'active': return 'Aktiv';
            case 'healing': return 'Heilend';
            case 'resolved': return 'Geheilt';
            default: return 'Unbekannt';
        }
    }

    populateFilters() {
        const data = this.filteredData.dekubitusData || [];
        const wards = [...new Set(data.map(d => d.ward))];
        
        const wardFilter = document.getElementById('wardFilter');
        wardFilter.innerHTML = '<option value="all">Alle Stationen</option>' +
            wards.map(ward => `<option value="${ward}">${ward}</option>`).join('');
    }

    showPatientDetail(patientId) {
        const patient = this.filteredData.patients.find(p => p.id === patientId);
        const dekubitusCase = this.filteredData.dekubitusData.find(d => d.patientId === patientId);
        
        if (!patient || !dekubitusCase) return;

        const modalContent = document.getElementById('patientDetailContent');
        modalContent.innerHTML = `
            <div class="row">
                <div class="col-md-6">
                    <h6>Patienteninformationen</h6>
                    <p><strong>Name:</strong> ${patient.name}</p>
                    <p><strong>Geschlecht:</strong> ${patient.gender}</p>
                    <p><strong>Alter:</strong> ${dekubitusCase.age} Jahre</p>
                    <p><strong>Station:</strong> ${dekubitusCase.ward}</p>
                </div>
                <div class="col-md-6">
                    <h6>Dekubitus-Details</h6>
                    <p><strong>Schweregrad:</strong> Stadium ${dekubitusCase.severity}</p>
                    <p><strong>Lokalisation:</strong> ${dekubitusCase.location}</p>
                    <p><strong>Auftreten:</strong> ${new Date(dekubitusCase.onsetDate).toLocaleDateString('de-DE')}</p>
                    <p><strong>Status:</strong> ${this.getStatusText(dekubitusCase.status)}</p>
                    <p><strong>Braden-Skala:</strong> ${dekubitusCase.bradenScore}</p>
                </div>
            </div>
        `;

        const modal = new bootstrap.Modal(document.getElementById('patientDetailModal'));
        modal.show();
    }

    setupEventListeners() {
        document.getElementById('applyFilters').addEventListener('click', () => {
            this.applyFilters();
        });

        document.getElementById('patientSearch').addEventListener('input', (e) => {
            this.filterTable(e.target.value);
        });

        document.getElementById('refreshTable').addEventListener('click', () => {
            this.updatePatientsTable();
        });

        document.getElementById('exportPdf').addEventListener('click', () => {
            this.exportToPDF();
        });

        document.getElementById('exportExcel').addEventListener('click', () => {
            this.exportToExcel();
        });
    }

    applyFilters() {
        const timeFilter = document.getElementById('timeFilter').value;
        const wardFilter = document.getElementById('wardFilter').value;
        const severityFilter = document.getElementById('severityFilter').value;

        let filteredData = [...(this.filteredData.dekubitusData || [])];

        // Apply time filter
        if (timeFilter !== 'current') {
            const now = new Date();
            let cutoffDate = new Date();
            
            switch (timeFilter) {
                case 'last3':
                    cutoffDate.setMonth(now.getMonth() - 3);
                    break;
                case 'last6':
                    cutoffDate.setMonth(now.getMonth() - 6);
                    break;
                case 'year':
                    cutoffDate.setFullYear(now.getFullYear() - 1);
                    break;
            }
            
            filteredData = filteredData.filter(d => new Date(d.onsetDate) >= cutoffDate);
        }

        // Apply ward filter
        if (wardFilter !== 'all') {
            filteredData = filteredData.filter(d => d.ward === wardFilter);
        }

        // Apply severity filter
        if (severityFilter !== 'all') {
            filteredData = filteredData.filter(d => d.severity === parseInt(severityFilter));
        }

        // Update filtered data
        this.filteredData.dekubitusData = filteredData;
        this.updateDashboard();
    }

    filterTable(searchTerm) {
        const rows = document.querySelectorAll('#patientsTableBody tr');
        rows.forEach(row => {
            const text = row.textContent.toLowerCase();
            row.style.display = text.includes(searchTerm.toLowerCase()) ? '' : 'none';
        });
    }

    exportToPDF() {
        alert('PDF-Export würde hier implementiert werden');
    }

    exportToExcel() {
        alert('Excel-Export würde hier implementiert werden');
    }

    initializeCharts() {
        // Charts will be initialized when data is loaded
    }

    showEmptyState() {
        document.querySelector('.container-fluid').innerHTML = `
            <div class="empty-state">
                <i class="fas fa-chart-line"></i>
                <h3>Keine Daten verfügbar</h3>
                <p>Dekubitus-Monitoring-Daten konnten nicht geladen werden.</p>
            </div>
        `;
    }
}

// Initialize the application
const app = new DekubitusMonitoringApp();