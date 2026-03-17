// SHORT JavaScript - display REAL patient data
document.addEventListener('DOMContentLoaded', function() {
    const data = window.PATIENT_DATA;
    if (!data) { 
        document.body.innerHTML = '<p class="text-center mt-5">No patient data</p>'; 
        return; 
    }

    // Load patient info
    if (data.patient) {
        document.getElementById('patientName').textContent = data.patient.name || 'Sienna Adams';
        document.getElementById('patientId').textContent = data.patient.id || '17a4369b-2ea2-4b63-9681-4660498aafdc';
    }

    // Load conditions
    const conditionsContainer = document.getElementById('conditionsContainer');
    if (data.conditions && data.conditions.summary) {
        data.conditions.summary.forEach(condition => {
            const conditionHtml = `
                <div class="col-12 mb-2">
                    <div class="condition-card">
                        <div class="d-flex justify-content-between align-items-center">
                            <div>
                                <strong>${condition.condition || condition}</strong>
                                <div class="text-muted small">${condition.onset || 'Onset unknown'}</div>
                            </div>
                            <span class="condition-badge">${condition.status || 'Active'}</span>
                        </div>
                    </div>
                </div>
            `;
            conditionsContainer.innerHTML += conditionHtml;
        });
    }

    // Load medications
    const medicationsContainer = document.getElementById('medicationsContainer');
    if (data.medications && data.medications.summary) {
        data.medications.summary.forEach(medication => {
            const medicationHtml = `
                <div class="col-12 mb-2">
                    <div class="medication-card">
                        <div class="d-flex justify-content-between align-items-center">
                            <div>
                                <strong>${medication.medication || medication || 'No medication specified'}</strong>
                                <div class="text-muted small">${medication.dosage || 'Dosage not specified'}</div>
                            </div>
                            <span class="medication-badge">${medication.status || 'Active'}</span>
                        </div>
                    </div>
                </div>
            `;
            medicationsContainer.innerHTML += medicationHtml;
        });
    }

    // Load observations
    const observationsContainer = document.getElementById('observationsContainer');
    if (data.observations && data.observations.summary) {
        data.observations.summary.forEach(obs => {
            const observationHtml = `
                <div class="col-12 mb-2">
                    <div class="observation-card">
                        <div class="d-flex justify-content-between align-items-center">
                            <div>
                                <strong>${obs.display || obs.code}</strong>
                                <div class="text-muted small">${obs.value || 'No value'} ${obs.unit || ''}</div>
                            </div>
                            <span class="observation-badge">${obs.status || 'Final'}</span>
                        </div>
                    </div>
                </div>
            `;
            observationsContainer.innerHTML += observationHtml;
        });
    }

    // Wound form handling
    const woundForm = document.getElementById('woundForm');
    const recentAssessments = document.getElementById('recentAssessments');
    let assessments = JSON.parse(localStorage.getItem('woundAssessments') || '[]');

    // Load recent assessments
    function loadRecentAssessments() {
        recentAssessments.innerHTML = '';
        assessments.slice(-3).reverse().forEach(assessment => {
            const assessmentHtml = `
                <div class="assessment-item">
                    <div class="d-flex justify-content-between">
                        <strong>${assessment.type} - ${assessment.location}</strong>
                        <span class="assessment-date">${assessment.date}</span>
                    </div>
                    <div class="small text-muted mt-1">
                        ${assessment.length}×${assessment.width}×${assessment.depth}cm | ${assessment.stage} | ${assessment.drainage} drainage
                    </div>
                </div>
            `;
            recentAssessments.innerHTML += assessmentHtml;
        });
    }

    loadRecentAssessments();

    woundForm.addEventListener('submit', function(e) {
        e.preventDefault();
        
        const assessment = {
            id: Date.now(),
            date: new Date().toLocaleDateString(),
            location: document.getElementById('woundLocation').value,
            type: document.getElementById('woundType').value,
            length: document.getElementById('woundLength').value || '0',
            width: document.getElementById('woundWidth').value || '0',
            depth: document.getElementById('woundDepth').value || '0',
            stage: document.getElementById('woundStage').value,
            drainage: document.getElementById('woundDrainage').value,
            notes: document.getElementById('woundNotes').value
        };

        assessments.push(assessment);
        localStorage.setItem('woundAssessments', JSON.stringify(assessments));
        
        // Reset form
        woundForm.reset();
        
        // Reload assessments
        loadRecentAssessments();
        
        // Show success message
        alert('Wound assessment saved successfully!');
    });
});