// SHORT JavaScript - display REAL patient data
document.addEventListener('DOMContentLoaded', function() {
    const data = window.PATIENT_DATA;
    if (!data) { 
        document.body.innerHTML = '<div class="container mt-5"><div class="alert alert-warning text-center">No patient data available</div></div>'; 
        return; 
    }

    // Display patient info
    if (data.patient) {
        document.getElementById('patientName').textContent = data.patient.name || 'Unknown Patient';
        const age = data.patient.birthDate ? calculateAge(data.patient.birthDate) : 'Unknown';
        document.getElementById('patientInfo').textContent = `${data.patient.gender || 'Unknown'} • Age: ${age}`;
    }

    // Display vital signs
    if (data.vital_signs && data.vital_signs.summary && data.vital_signs.summary.length > 0) {
        const vitalSignsHtml = data.vital_signs.summary.slice(0, 3).map(vital => 
            `<div class="metric-item">
                <div class="metric-value">${vital.value} ${vital.unit || ''}</div>
                <div class="metric-label">${vital.display}</div>
            </div>`
        ).join('');
        document.getElementById('vitalSigns').innerHTML = vitalSignsHtml;
    }

    // Display conditions
    if (data.conditions && data.conditions.summary && data.conditions.summary.length > 0) {
        const conditionsHtml = data.conditions.summary.slice(0, 3).map(condition => 
            `<div class="metric-item">
                <div class="metric-value">${condition.condition}</div>
                <div class="metric-label">
                    <span class="badge ${condition.status === 'active' ? 'badge-active' : 'badge-inactive'}">${condition.status}</span>
                </div>
            </div>`
        ).join('');
        document.getElementById('conditions').innerHTML = conditionsHtml;
    }

    // Display medications
    if (data.medications && data.medications.summary && data.medications.summary.length > 0) {
        const medicationsHtml = data.medications.summary.slice(0, 3).map(med => 
            `<div class="metric-item">
                <div class="metric-value">${med.medication}</div>
                <div class="metric-label">${med.dosage || 'No dosage info'}</div>
            </div>`
        ).join('');
        document.getElementById('medications').innerHTML = medicationsHtml;
    }

    // Display allergies
    if (data.allergies && data.allergies.summary && data.allergies.summary.length > 0) {
        const allergiesHtml = data.allergies.summary.slice(0, 3).map(allergy => 
            `<div class="metric-item">
                <div class="metric-value">${allergy.allergen}</div>
                <div class="metric-label">
                    <span class="badge ${allergy.criticality === 'high' ? 'badge-high' : 'badge-normal'}">${allergy.criticality}</span>
                </div>
            </div>`
        ).join('');
        document.getElementById('allergies').innerHTML = allergiesHtml;
    }

    // Display observations table
    if (data.observations && data.observations.summary && data.observations.summary.length > 0) {
        const observationsHtml = `
            <table class="table table-hover">
                <thead>
                    <tr>
                        <th>Observation</th>
                        <th>Value</th>
                        <th>Date</th>
                        <th>Status</th>
                    </tr>
                </thead>
                <tbody>
                    ${data.observations.summary.slice(0, 10).map(obs => 
                        `<tr>
                            <td>${obs.display}</td>
                            <td><strong>${obs.value} ${obs.unit || ''}</strong></td>
                            <td>${formatDate(obs.date)}</td>
                            <td><span class="badge badge-normal">${obs.status || 'final'}</span></td>
                        </tr>`
                    ).join('')}
                </tbody>
            </table>
        `;
        document.getElementById('observations').innerHTML = observationsHtml;
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

    function formatDate(dateString) {
        if (!dateString) return 'Unknown';
        const date = new Date(dateString);
        return date.toLocaleDateString();
    }
});