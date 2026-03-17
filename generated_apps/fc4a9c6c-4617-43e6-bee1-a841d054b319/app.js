document.addEventListener('DOMContentLoaded', function() {
    const data = window.PATIENT_DATA;
    if (!data) { 
        document.body.innerHTML = '<div class="container mt-5"><div class="alert alert-warning text-center">No patient data available</div></div>'; 
        return; 
    }

    let currentPatient = null;
    let chatHistory = [];

    // Initialize the app
    loadPatientList();
    setupEventListeners();

    function loadPatientList() {
        const patientList = document.getElementById('patientList');
        
        // Since we only have one patient, create a mock list for demo
        const patients = [
            {
                id: 'current',
                name: data.patient?.name || 'Unknown Patient',
                gender: data.patient?.gender || 'Unknown',
                birthDate: data.patient?.birthDate || 'Unknown'
            }
        ];

        patients.forEach(patient => {
            const patientItem = document.createElement('div');
            patientItem.className = 'list-group-item patient-item';
            patientItem.dataset.patientId = patient.id;
            
            patientItem.innerHTML = `
                <div class="patient-name">${patient.name}</div>
                <div class="patient-info">
                    <i class="fas fa-venus-mars me-1"></i>${patient.gender} • 
                    <i class="fas fa-calendar me-1"></i>${patient.birthDate}
                </div>
            `;
            
            patientItem.addEventListener('click', () => selectPatient(patient));
            patientList.appendChild(patientItem);
        });
    }

    function selectPatient(patient) {
        currentPatient = patient;
        
        // Update active state
        document.querySelectorAll('.list-group-item').forEach(item => {
            item.classList.remove('active');
        });
        document.querySelector(`[data-patient-id="${patient.id}"]`).classList.add('active');
        
        // Show patient details
        document.getElementById('welcomeMessage').style.display = 'none';
        document.getElementById('patientDetails').style.display = 'block';
        document.getElementById('encounterChat').style.display = 'block';
        
        // Populate patient details
        document.getElementById('patientName').textContent = patient.name;
        document.getElementById('patientId').textContent = `ID: ${patient.id}`;
        document.getElementById('patientGender').textContent = patient.gender;
        document.getElementById('patientBirth').textContent = patient.birthDate;
        
        // Calculate age if birth date is available
        if (patient.birthDate && patient.birthDate !== 'Unknown') {
            const age = calculateAge(patient.birthDate);
            document.getElementById('patientAge').textContent = age ? `${age} years` : '-';
        }
        
        // Clear chat and add welcome message
        chatHistory = [];
        addChatMessage('system', `Connected to ${patient.name}'s medical record. You can ask about observations, conditions, medications, allergies, or vital signs.`);
    }

    function calculateAge(birthDate) {
        try {
            const birth = new Date(birthDate);
            const today = new Date();
            let age = today.getFullYear() - birth.getFullYear();
            const monthDiff = today.getMonth() - birth.getMonth();
            if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
                age--;
            }
            return age;
        } catch {
            return null;
        }
    }

    function setupEventListeners() {
        // Chat input
        const chatInput = document.getElementById('chatInput');
        const sendButton = document.getElementById('sendMessage');
        
        sendButton.addEventListener('click', sendMessage);
        chatInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') sendMessage();
        });
        
        // Filter
        document.getElementById('filterType').addEventListener('change', applyFilter);
        
        // Clear chat
        document.getElementById('clearChat').addEventListener('click', clearChat);
        
        // Patient search
        document.getElementById('patientSearch').addEventListener('input', filterPatients);
    }

    function sendMessage() {
        const input = document.getElementById('chatInput');
        const message = input.value.trim();
        if (!message || !currentPatient) return;
        
        addChatMessage('user', message);
        input.value = '';
        
        // Process the message and respond with data
        setTimeout(() => processMessage(message), 500);
    }

    function processMessage(message) {
        const lowerMessage = message.toLowerCase();
        
        if (lowerMessage.includes('observation') || lowerMessage.includes('lab') || lowerMessage.includes('test')) {
            showObservations();
        } else if (lowerMessage.includes('condition') || lowerMessage.includes('diagnosis')) {
            showConditions();
        } else if (lowerMessage.includes('medication') || lowerMessage.includes('drug') || lowerMessage.includes('prescription')) {
            showMedications();
        } else if (lowerMessage.includes('allerg')) {
            showAllergies();
        } else if (lowerMessage.includes('vital') || lowerMessage.includes('blood pressure') || lowerMessage.includes('heart rate')) {
            showVitalSigns();
        } else {
            addChatMessage('system', 'I can help you with observations, conditions, medications, allergies, or vital signs. What would you like to know?');
        }
    }

    function showObservations() {
        if (data.observations?.summary?.length) {
            let response = 'Recent Observations:\n\n';
            data.observations.summary.slice(0, 5).forEach(obs => {
                response += `• ${obs.display}: ${obs.value} ${obs.unit || ''}\n`;
                if (obs.date) response += `  Date: ${new Date(obs.date).toLocaleDateString()}\n`;
            });
            addChatMessage('data', response);
        } else {
            addChatMessage('system', 'No observation data available for this patient.');
        }
    }

    function showConditions() {
        if (data.conditions?.summary?.length) {
            let response = 'Current Conditions:\n\n';
            data.conditions.summary.slice(0, 5).forEach(condition => {
                response += `• ${condition.condition}\n`;
                if (condition.status) response += `  Status: ${condition.status}\n`;
                if (condition.onset) response += `  Onset: ${condition.onset}\n`;
            });
            addChatMessage('data', response);
        } else {
            addChatMessage('system', 'No condition data available for this patient.');
        }
    }

    function showMedications() {
        if (data.medications?.summary?.length) {
            let response = 'Current Medications:\n\n';
            data.medications.summary.slice(0, 5).forEach(med => {
                response += `• ${med.medication}\n`;
                if (med.dosage) response += `  Dosage: ${med.dosage}\n`;
                if (med.status) response += `  Status: ${med.status}\n`;
            });
            addChatMessage('data', response);
        } else {
            addChatMessage('system', 'No medication data available for this patient.');
        }
    }

    function showAllergies() {
        if (data.allergies?.summary?.length) {
            let response = 'Known Allergies:\n\n';
            data.allergies.summary.forEach(allergy => {
                response += `• ${allergy.allergen}\n`;
                if (allergy.type) response += `  Type: ${allergy.type}\n`;
                if (allergy.criticality) response += `  Criticality: ${allergy.criticality}\n`;
            });
            addChatMessage('data', response);
        } else {
            addChatMessage('system', 'No allergy data available for this patient.');
        }
    }

    function showVitalSigns() {
        if (data.vital_signs?.summary?.length) {
            let response = 'Recent Vital Signs:\n\n';
            data.vital_signs.summary.slice(0, 5).forEach(vital => {
                response += `• ${vital.display}: ${vital.value} ${vital.unit || ''}\n`;
                if (vital.date) response += `  Date: ${new Date(vital.date).toLocaleDateString()}\n`;
            });
            addChatMessage('data', response);
        } else {
            addChatMessage('system', 'No vital signs data available for this patient.');
        }
    }

    function addChatMessage(type, message) {
        const chatContainer = document.getElementById('chatMessages');
        const messageDiv = document.createElement('div');
        messageDiv.className = `chat-message ${type}`;
        messageDiv.style.whiteSpace = 'pre-line';
        messageDiv.textContent = message;
        
        chatHistory.push({ type, message });
        chatContainer.appendChild(messageDiv);
        chatContainer.scrollTop = chatContainer.scrollHeight;
    }

    function applyFilter() {
        const filterType = document.getElementById('filterType').value;
        if (filterType === 'all') return;
        
        // Show filtered data based on selection
        switch (filterType) {
            case 'observations':
                showObservations();
                break;
            case 'conditions':
                showConditions();
                break;
            case 'medications':
                showMedications();
                break;
            case 'allergies':
                showAllergies();
                break;
            case 'vital_signs':
                showVitalSigns();
                break;
        }
    }

    function clearChat() {
        document.getElementById('chatMessages').innerHTML = '';
        chatHistory = [];
        if (currentPatient) {
            addChatMessage('system', `Chat cleared. Connected to ${currentPatient.name}'s medical record.`);
        }
    }

    function filterPatients() {
        const searchTerm = document.getElementById('patientSearch').value.toLowerCase();
        const patientItems = document.querySelectorAll('.patient-item');
        
        patientItems.forEach(item => {
            const patientName = item.querySelector('.patient-name').textContent.toLowerCase();
            const patientInfo = item.querySelector('.patient-info').textContent.toLowerCase();
            
            if (patientName.includes(searchTerm) || patientInfo.includes(searchTerm)) {
                item.style.display = 'block';
            } else {
                item.style.display = 'none';
            }
        });
    }
});