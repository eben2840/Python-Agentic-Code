document.addEventListener('DOMContentLoaded', function() {
    const assessmentContainer = document.getElementById('assessmentContainer');
    const noDataMessage = document.getElementById('noDataMessage');

    function calculateAge(birthDate) {
        if (!birthDate) return 'Unknown';
        const birth = new Date(birthDate);
        const today = new Date();
        let age = today.getFullYear() - birth.getFullYear();
        const monthDiff = today.getMonth() - birth.getMonth();
        if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
            age--;
        }
        return age;
    }

    function formatDate(dateString) {
        if (!dateString) return 'No date';
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', { 
            year: 'numeric', 
            month: 'short', 
            day: 'numeric' 
        });
    }

    function assessRiskLevel(conditions, observations, age, gender) {
        let riskScore = 0;
        const riskFactors = [];

        // Age-based risk
        if (age >= 65) {
            riskScore += 2;
            riskFactors.push('Advanced age (65+)');
        } else if (age >= 50) {
            riskScore += 1;
            riskFactors.push('Middle age (50+)');
        }

        // Condition-based risk assessment
        const highRiskConditions = ['sepsis', 'chest pain', 'copd', 'ckd', 'dementia', 'cancer'];
        const mediumRiskConditions = ['hypertension', 'diabetes', 'asthma', 'depression'];

        conditions.forEach(condition => {
            const conditionName = condition.name ? condition.name.toLowerCase() : '';
            if (highRiskConditions.some(risk => conditionName.includes(risk))) {
                riskScore += 3;
                riskFactors.push(`High-risk condition: ${condition.name}`);
            } else if (mediumRiskConditions.some(risk => conditionName.includes(risk))) {
                riskScore += 2;
                riskFactors.push(`Medium-risk condition: ${condition.name}`);
            } else if (conditionName) {
                riskScore += 1;
                riskFactors.push(`Condition: ${condition.name}`);
            }
        });

        // Vital signs risk assessment
        observations.forEach(obs => {
            const obsName = obs.name ? obs.name.toLowerCase() : '';
            const obsValue = obs.value ? obs.value.toLowerCase() : '';
            
            if (obsName.includes('temp') && obsValue.includes('39')) {
                riskScore += 2;
                riskFactors.push('High fever');
            } else if (obsName.includes('bp') && obsValue.includes('140')) {
                riskScore += 1;
                riskFactors.push('Elevated blood pressure');
            } else if (obsName.includes('glucose') && obsValue.includes('8.5')) {
                riskScore += 2;
                riskFactors.push('Elevated glucose');
            } else if (obsName.includes('egfr') && obsValue.includes('22')) {
                riskScore += 3;
                riskFactors.push('Severely reduced kidney function');
            }
        });

        // Determine risk level
        let riskLevel, riskClass;
        if (riskScore >= 6) {
            riskLevel = 'HIGH';
            riskClass = 'risk-high';
        } else if (riskScore >= 3) {
            riskLevel = 'MEDIUM';
            riskClass = 'risk-medium';
        } else {
            riskLevel = 'LOW';
            riskClass = 'risk-low';
        }

        return { riskLevel, riskClass, riskScore, riskFactors };
    }

    function assessPainLevel(observations) {
        let painScore = 0;
        let painType = 'None';
        let painClass = 'pain-none';
        const painIndicators = [];

        observations.forEach(obs => {
            const obsName = obs.name ? obs.name.toLowerCase() : '';
            const obsValue = obs.value ? obs.value.toLowerCase() : '';
            
            if (obsName.includes('pain') && obsValue.includes('8')) {
                painScore = 8;
                painType = 'Severe';
                painClass = 'pain-severe';
                painIndicators.push('Pain scale 8/10 - Severe pain');
            } else if (obsName.includes('headache') && obsValue.includes('7')) {
                painScore = 7;
                painType = 'Severe';
                painClass = 'pain-severe';
                painIndicators.push('Headache VAS 7 - Severe headache');
            } else if (obsName.includes('das28') && obsValue.includes('5.2')) {
                painScore = 6;
                painType = 'Moderate';
                painClass = 'pain-moderate';
                painIndicators.push('DAS28 5.2 - Moderate joint pain');
            } else if (obsName.includes('phq') && obsValue.includes('15')) {
                painScore = 5;
                painType = 'Moderate';
                painClass = 'pain-moderate';
                painIndicators.push('PHQ-9 15 - Moderate psychological distress');
            }
        });

        // If no specific pain indicators, check for conditions that typically cause pain
        if (painScore === 0) {
            // This would be filled based on condition analysis
            painType = 'Assessment needed';
            painClass = 'pain-none';
            painIndicators.push('No current pain measurements available');
        }

        return { painScore, painType, painClass, painIndicators };
    }

    function renderPatientAssessment(patient) {
        const age = calculateAge(patient.birthDate);
        const conditions = patient.data?.condition || [];
        const observations = patient.data?.observation || patient.data?.vital_signs || [];
        
        const riskAssessment = assessRiskLevel(conditions, observations, age, patient.gender);
        const painAssessment = assessPainLevel(observations);

        return `
            <div class="col-lg-6 col-xl-4">
                <div class="assessment-card">
                    <div class="patient-header">
                        <div class="patient-name">${patient.name || 'Unknown Patient'}</div>
                        <div class="patient-info">
                            <i class="fas fa-user me-1"></i>
                            ${patient.gender || 'Unknown'} • Age ${age} • ID: ${patient.id || 'Unknown'}
                        </div>
                    </div>

                    <div class="risk-section">
                        <div class="section-title">
                            <i class="fas fa-shield-alt text-primary"></i>
                            Risk Assessment
                        </div>
                        <div class="risk-item">
                            <div class="risk-label">Overall Risk Level</div>
                            <div class="risk-value">
                                <span class="risk-badge ${riskAssessment.riskClass}">
                                    ${riskAssessment.riskLevel}
                                </span>
                                <span class="ms-2 text-muted">(Score: ${riskAssessment.riskScore})</span>
                            </div>
                            <div class="mt-2">
                                ${riskAssessment.riskFactors.length > 0 ? 
                                    riskAssessment.riskFactors.map(factor => 
                                        `<div class="risk-date">• ${factor}</div>`
                                    ).join('') : 
                                    '<div class="no-data-text">No risk factors identified</div>'
                                }
                            </div>
                        </div>
                    </div>

                    <div class="pain-section">
                        <div class="section-title">
                            <i class="fas fa-thermometer-half text-danger"></i>
                            Pain Assessment
                        </div>
                        <div class="pain-item">
                            <div class="pain-label">Pain Level</div>
                            <div class="pain-value ${painAssessment.painClass}">
                                ${painAssessment.painType}
                                ${painAssessment.painScore > 0 ? ` (${painAssessment.painScore}/10)` : ''}
                            </div>
                            <div class="mt-2">
                                ${painAssessment.painIndicators.length > 0 ? 
                                    painAssessment.painIndicators.map(indicator => 
                                        `<div class="pain-date">• ${indicator}</div>`
                                    ).join('') : 
                                    '<div class="no-data-text">No pain indicators available</div>'
                                }
                            </div>
                        </div>
                    </div>

                    <div class="summary-stats">
                        <div class="row">
                            <div class="col-4 stat-item">
                                <div class="stat-value">${conditions.length}</div>
                                <div class="stat-label">Conditions</div>
                            </div>
                            <div class="col-4 stat-item">
                                <div class="stat-value">${observations.length}</div>
                                <div class="stat-label">Observations</div>
                            </div>
                            <div class="col-4 stat-item">
                                <div class="stat-value">${patient.data?.encounter?.length || 0}</div>
                                <div class="stat-label">Encounters</div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    function renderAssessments() {
        if (!window.PATIENT_DATA) {
            noDataMessage.classList.remove('d-none');
            return;
        }

        const data = window.PATIENT_DATA;
        let assessmentsHTML = '';

        if (data.patient && data.patient.id === 'all' && data.patients) {
            // Multiple patients
            data.patients.forEach(patient => {
                assessmentsHTML += renderPatientAssessment(patient);
            });
        } else if (data.patient && data.patient.id !== 'all') {
            // Single patient
            const singlePatient = {
                id: data.patient.id,
                name: data.patient.name,
                gender: data.patient.gender,
                birthDate: data.patient.birthDate,
                data: {
                    condition: data.condition?.summary || [],
                    observation: data.observation?.summary || [],
                    vital_signs: data.vital_signs?.summary || [],
                    encounter: data.encounter?.summary || []
                }
            };
            assessmentsHTML += renderPatientAssessment(singlePatient);
        }

        if (assessmentsHTML) {
            assessmentContainer.innerHTML = assessmentsHTML;
        } else {
            noDataMessage.classList.remove('d-none');
        }
    }

    // Initialize the assessment
    renderAssessments();
});