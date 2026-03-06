// SHORT JavaScript - display REAL patient data
document.addEventListener('DOMContentLoaded', function() {
    const data = window.PATIENT_DATA;
    if (!data) { 
        document.getElementById('conditionsTable').innerHTML = '<tr><td colspan="5" class="text-center py-5 text-muted">No patient data available</td></tr>'; 
        return; 
    }

    // Chronic conditions keywords to filter by
    const chronicKeywords = ['diabetes', 'hypertension', 'copd', 'asthma', 'arthritis', 'heart', 'chronic', 'depression', 'anxiety', 'obesity'];
    
    let chronicConditions = [];
    let totalPatients = 0;
    let activeCount = 0;
    let recentCount = 0;

    // Check if data has conditions summary
    if (data.conditions && data.conditions.summary) {
        data.conditions.summary.forEach(condition => {
            const conditionLower = condition.condition.toLowerCase();
            const ischronic = chronicKeywords.some(keyword => conditionLower.includes(keyword));
            
            if (ischronic) {
                chronicConditions.push({
                    patientName: data.patient ? data.patient.name : 'Unknown Patient',
                    patientGender: data.patient ? data.patient.gender : '',
                    patientAge: data.patient && data.patient.birthDate ? calculateAge(data.patient.birthDate) : '',
                    condition: condition.condition,
                    status: condition.status || 'active',
                    severity: condition.severity || 'moderate',
                    onset: condition.onset || 'Unknown'
                });

                if (condition.status === 'active') activeCount++;
                
                // Check if recent (within last year)
                if (condition.onset && isRecentOnset(condition.onset)) {
                    recentCount++;
                }
            }
        });
        totalPatients = 1; // Single patient data
    }

    // Update summary cards
    document.getElementById('totalPatients').textContent = totalPatients;
    document.getElementById('chronicCount').textContent = chronicConditions.length;
    document.getElementById('activeCount').textContent = activeCount;
    document.getElementById('recentCount').textContent = recentCount;

    // Populate table
    const tableBody = document.getElementById('conditionsTable');
    if (chronicConditions.length === 0) {
        tableBody.innerHTML = '<tr><td colspan="5" class="text-center py-5 text-muted">No chronic conditions found</td></tr>';
        return;
    }

    tableBody.innerHTML = chronicConditions.map(item => `
        <tr>
            <td class="px-4">
                <div class="patient-name">${item.patientName}</div>
                <div class="patient-info">${item.patientGender}${item.patientAge ? `, ${item.patientAge} years` : ''}</div>
            </td>
            <td class="px-4">
                <div class="condition-name">${item.condition}</div>
            </td>
            <td class="px-4">
                <span class="badge status-${item.status.toLowerCase()}">${capitalizeFirst(item.status)}</span>
            </td>
            <td class="px-4">
                <span class="badge severity-${item.severity.toLowerCase()}">${capitalizeFirst(item.severity)}</span>
            </td>
            <td class="px-4">${formatDate(item.onset)}</td>
        </tr>
    `).join('');

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

    function isRecentOnset(onsetDate) {
        const oneYearAgo = new Date();
        oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
        const onset = new Date(onsetDate);
        return onset > oneYearAgo;
    }

    function formatDate(dateString) {
        if (!dateString || dateString === 'Unknown') return 'Unknown';
        try {
            const date = new Date(dateString);
            return date.toLocaleDateString('en-US', { 
                year: 'numeric', 
                month: 'short', 
                day: 'numeric' 
            });
        } catch (e) {
            return dateString;
        }
    }

    function capitalizeFirst(str) {
        return str.charAt(0).toUpperCase() + str.slice(1);
    }
});