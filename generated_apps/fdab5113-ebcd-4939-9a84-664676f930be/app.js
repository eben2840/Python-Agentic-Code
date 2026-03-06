document.addEventListener('DOMContentLoaded', function() {
    const data = window.PATIENT_DATA;
    
    // Update current time
    function updateTime() {
        const now = new Date();
        document.getElementById('currentTime').textContent = now.toLocaleTimeString();
    }
    updateTime();
    setInterval(updateTime, 1000);

    // Display patient info
    if (data && data.patient) {
        const patientInfo = document.getElementById('patientInfo');
        const age = data.patient.birthDate ? calculateAge(data.patient.birthDate) : 'Unknown';
        patientInfo.textContent = `${data.patient.name} • ${data.patient.gender} • Age ${age} • ID: ${data.patient.id}`;
    }

    // Assessment tasks organized by priority
    const assessmentTasks = {
        critical: [
            { title: 'Vital Signs Assessment', description: 'Check blood pressure, heart rate, temperature, respiratory rate', time: '5 min', icon: 'fas fa-heartbeat' },
            { title: 'Pain Assessment', description: 'Evaluate current pain level using appropriate scale', time: '3 min', icon: 'fas fa-thermometer-half' },
            { title: 'Medication Review', description: 'Verify current medications and check for interactions', time: '10 min', icon: 'fas fa-pills' },
            { title: 'Allergy Verification', description: 'Confirm known allergies and reactions', time: '2 min', icon: 'fas fa-exclamation-triangle' }
        ],
        important: [
            { title: 'Medical History Review', description: 'Review past medical conditions and surgeries', time: '8 min', icon: 'fas fa-file-medical' },
            { title: 'Physical Examination', description: 'Conduct systematic physical assessment', time: '15 min', icon: 'fas fa-stethoscope' },
            { title: 'Symptom Assessment', description: 'Document current symptoms and their severity', time: '7 min', icon: 'fas fa-clipboard-list' },
            { title: 'Risk Assessment', description: 'Evaluate fall risk, infection risk, etc.', time: '5 min', icon: 'fas fa-shield-alt' }
        ],
        routine: [
            { title: 'Nutritional Assessment', description: 'Review dietary habits and nutritional status', time: '6 min', icon: 'fas fa-utensils' },
            { title: 'Mobility Assessment', description: 'Evaluate patient mobility and assistance needs', time: '5 min', icon: 'fas fa-walking' },
            { title: 'Skin Integrity Check', description: 'Inspect skin for wounds, pressure areas', time: '4 min', icon: 'fas fa-hand-holding-medical' },
            { title: 'Mental Status Evaluation', description: 'Assess cognitive function and mental state', time: '8 min', icon: 'fas fa-brain' }
        ],
        optional: [
            { title: 'Social History', description: 'Document social support, living situation', time: '10 min', icon: 'fas fa-users' },
            { title: 'Advance Directives', description: 'Review advance directives and care preferences', time: '5 min', icon: 'fas fa-file-contract' },
            { title: 'Educational Needs', description: 'Identify patient education requirements', time: '6 min', icon: 'fas fa-graduation-cap' },
            { title: 'Discharge Planning', description: 'Begin preliminary discharge planning assessment', time: '12 min', icon: 'fas fa-home' }
        ]
    };

    // Render tasks for each category
    renderTasks('criticalTasks', assessmentTasks.critical, 'critical');
    renderTasks('importantTasks', assessmentTasks.important, 'important');
    renderTasks('routineTasks', assessmentTasks.routine, 'routine');
    renderTasks('optionalTasks', assessmentTasks.optional, 'optional');

    // Update counters
    updateCounters();

    function renderTasks(containerId, tasks, priority) {
        const container = document.getElementById(containerId);
        container.innerHTML = tasks.map((task, index) => `
            <div class="task-item d-flex align-items-start" data-priority="${priority}" data-index="${index}">
                <div class="task-checkbox" onclick="toggleTask(this)">
                    <i class="fas fa-check" style="display: none;"></i>
                </div>
                <div class="task-content">
                    <div class="task-title">${task.title}</div>
                    <div class="task-description">${task.description}</div>
                    <div class="task-meta">
                        <span class="text-muted">
                            <i class="${task.icon} me-1"></i>
                            ${task.time}
                        </span>
                        <span class="priority-badge priority-${priority}">${priority.toUpperCase()}</span>
                    </div>
                </div>
            </div>
        `).join('');
    }

    window.toggleTask = function(checkbox) {
        const taskItem = checkbox.closest('.task-item');
        const checkIcon = checkbox.querySelector('i');
        
        if (taskItem.classList.contains('completed')) {
            taskItem.classList.remove('completed');
            checkbox.classList.remove('checked');
            checkIcon.style.display = 'none';
        } else {
            taskItem.classList.add('completed');
            checkbox.classList.add('checked');
            checkIcon.style.display = 'block';
        }
        
        updateCounters();
    };

    function updateCounters() {
        const priorities = ['critical', 'important', 'routine', 'optional'];
        priorities.forEach(priority => {
            const total = document.querySelectorAll(`[data-priority="${priority}"]`).length;
            const completed = document.querySelectorAll(`[data-priority="${priority}"].completed`).length;
            const remaining = total - completed;
            document.getElementById(`${priority}Count`).textContent = remaining;
        });
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
});