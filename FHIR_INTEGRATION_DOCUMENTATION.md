# FHIR Integration & Mini App Implementation Documentation

## Table of Contents
1. [Overview](#overview)
2. [Architecture](#architecture)
3. [FHIR Server Integration](#fhir-server-integration)
4. [Authentication Flow](#authentication-flow)
5. [Data Flow](#data-flow)
6. [Mini App Generation Process](#mini-app-generation-process)
7. [API Endpoints](#api-endpoints)
8. [Security Considerations](#security-considerations)
9. [Usage Examples](#usage-examples)

---

## Overview

The CareIT Vibe Mini App Generator is a Flask-based application that creates SMART on FHIR compliant mini applications using Claude AI. It integrates with FHIR servers to fetch patient data and generates custom healthcare dashboards and applications.

### Key Features
- **SMART on FHIR Compliance**: Follows SMART on FHIR standards for healthcare app integration
- **Secure Authentication**: OAuth2 Bearer token authentication with FHIR servers
- **Real-time Patient Data**: Fetches comprehensive patient data from FHIR servers
- **AI-Powered Generation**: Uses Claude AI to generate custom healthcare UIs
- **Session Management**: Persistent patient sessions stored in SQLite database
- **Task-Based Workflow**: Kanban-style task management for app generation

---

## Architecture

```
┌─────────────────┐
│  Flutter App    │
│  (Mobile/Web)   │
└────────┬────────┘
         │ POST /api/miniapp/init
         │ Headers: Authorization, X-Patient-Id, X-FHIR-Base
         ▼
┌─────────────────────────────────────────────────────────┐
│              Flask Backend (app.py)                      │
│  ┌──────────────────────────────────────────────────┐  │
│  │  1. Receive FHIR credentials via HTTP headers    │  │
│  │  2. Create PatientSession in database            │  │
│  │  3. Return HTML dashboard with session cookies   │  │
│  └──────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────────────────────────┐
│           FHIR Service (fhir_service.py)                 │
│  ┌──────────────────────────────────────────────────┐  │
│  │  • Authenticates with FHIR server                │  │
│  │  • Fetches patient resources:                    │  │
│  │    - Patient demographics                        │  │
│  │    - Observations (vitals, labs)                 │  │
│  │    - Conditions (diagnoses)                      │  │
│  │    - Medications                                 │  │
│  │    - Allergies                                   │  │
│  │    - Encounters, Procedures, Immunizations       │  │
│  └──────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────────────────────────┐
│         LLM Service (llm_service.py)                     │
│  ┌──────────────────────────────────────────────────┐  │
│  │  • Receives patient data + user prompt           │  │
│  │  • Calls Claude API (Sonnet 4)                   │  │
│  │  • Generates complete HTML/CSS/JS mini app       │  │
│  │  • Reviews and scores generated code             │  │
│  └──────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────────────────────────┐
│              Generated Mini App                          │
│  • Single HTML file with embedded CSS/JS                │
│  • Bootstrap 5 + Chart.js + Font Awesome                │
│  • Displays patient-specific healthcare data            │
│  • Responsive, mobile-first design                      │
│  • WCAG 2.1 accessible                                  │
└─────────────────────────────────────────────────────────┘
```

---

## FHIR Server Integration

### FHIRService Class

The `FHIRService` class (`fhir_service.py`) handles all communication with FHIR servers.

#### Initialization

```python
from fhir_service import FHIRService

# Initialize with FHIR server credentials
fhir_service = FHIRService(
    base_url="https://fhir.example.com/r4",
    access_token="eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9..."
)
```

#### Authentication Headers

All FHIR requests include:
```python
headers = {
    'Authorization': f'Bearer {access_token}',
    'Accept': 'application/fhir+json',
    'Content-Type': 'application/fhir+json'
}
```

#### Supported FHIR Resources

| Resource | Method | Description |
|----------|--------|-------------|
| **Patient** | `get_patient(patient_id)` | Demographics, name, gender, DOB |
| **Observation** | `get_patient_observations(patient_id, count)` | Vitals, lab results, measurements |
| **Condition** | `get_patient_conditions(patient_id)` | Diagnoses, clinical status |
| **MedicationRequest** | `get_patient_medications(patient_id)` | Current and past medications |
| **AllergyIntolerance** | `get_patient_allergies(patient_id)` | Known allergies and intolerances |
| **Encounter** | `get_patient_encounters(patient_id, count)` | Hospital visits, appointments |
| **Procedure** | `get_patient_procedures(patient_id)` | Medical procedures performed |
| **Immunization** | `get_patient_immunizations(patient_id)` | Vaccination records |
| **CarePlan** | `get_patient_care_plans(patient_id)` | Treatment plans |

#### Comprehensive Data Fetching

```python
# Fetch all patient data at once
patient_data = fhir_service.get_full_patient_data(patient_id="12345")

# Returns structured dictionary:
{
    'patient': {
        'id': '12345',
        'name': 'John Doe',
        'gender': 'male',
        'birthDate': '1980-05-15',
        'resource': { ... }  # Full FHIR Patient resource
    },
    'observations': {
        'count': 150,
        'resources': [ ... ],  # Full FHIR Observation resources
        'summary': [
            {
                'code': 'Blood Pressure',
                'value': 120,
                'unit': 'mmHg',
                'date': '2025-01-15T10:30:00Z',
                'status': 'final'
            },
            ...
        ]
    },
    'conditions': {
        'count': 5,
        'resources': [ ... ],
        'summary': [
            {
                'condition': 'Type 2 Diabetes',
                'status': 'active',
                'onset': '2020-03-10',
                'severity': 'moderate'
            },
            ...
        ]
    },
    'medications': { ... },
    'allergies': { ... },
    'encounters': { ... },
    'procedures': { ... },
    'immunizations': { ... },
    'care_plans': { ... }
}
```

---

## Authentication Flow

### 1. Flutter App Initiates Connection

The Flutter mobile app sends FHIR credentials via secure HTTP headers:

```dart
// Flutter/Dart example
final response = await http.post(
  Uri.parse('http://localhost:5000/api/miniapp/init'),
  headers: {
    'Authorization': 'Bearer $accessToken',
    'X-Patient-Id': patientId,
    'X-FHIR-Base': fhirBaseUrl,
    'Content-Type': 'application/json',
  },
);
```

### 2. Backend Receives Credentials

```python
# app.py - Main route handler
@app.route('/', methods=['GET', 'POST'])
def index():
    if request.method == 'POST':
        # Extract credentials from headers
        auth_header = request.headers.get('Authorization', '')
        patient_id = request.headers.get('X-Patient-Id', '')
        fhir_base_url = request.headers.get('X-FHIR-Base', '')
        
        if all([auth_header, patient_id, fhir_base_url]):
            access_token = auth_header.replace('Bearer ', '')
            
            # Fetch patient data from FHIR server
            patient_data = get_patient_data_direct({
                'fhir_base_url': fhir_base_url,
                'patient_id': patient_id,
                'auth_token': access_token
            })
```

### 3. Session Creation

```python
# Create persistent session in database
session_id = str(uuid.uuid4())
patient_session = PatientSession(
    id=session_id,
    patient_id=patient_id,
    patient_name=patient_data.get('patient', {}).get('name', 'Unknown'),
    fhir_base_url=fhir_base_url,
    auth_token=access_token,  # Encrypted in production
    patient_data=patient_data  # Full FHIR data as JSON
)
db.session.add(patient_session)
db.session.commit()
```

### 4. Session Retrieval

```python
# Retrieve active session
@backend_service.route('/session-status', methods=['GET'])
def session_status():
    patient_session = PatientSession.query.order_by(
        PatientSession.last_accessed.desc()
    ).first()
    
    if patient_session:
        # Update last accessed timestamp
        patient_session.last_accessed = datetime.utcnow()
        db.session.commit()
        
        return jsonify({
            'authenticated': True,
            'session_data': {
                'patient_id': patient_session.patient_id,
                'patient_name': patient_session.patient_name,
                'fhir_base_url': patient_session.fhir_base_url,
                'patient_data': patient_session.patient_data
            }
        })
```

---

## Data Flow

### Complete Request-Response Cycle

```
1. Flutter App → Flask Backend
   POST /api/miniapp/init
   Headers: Authorization, X-Patient-Id, X-FHIR-Base
   
2. Flask Backend → FHIR Server
   GET /Patient/{id}
   GET /Observation?patient={id}&_count=100&_sort=-date
   GET /Condition?patient={id}
   GET /MedicationRequest?patient={id}
   GET /AllergyIntolerance?patient={id}
   ... (all resources)
   
3. FHIR Server → Flask Backend
   Returns FHIR Bundle resources in JSON format
   
4. Flask Backend → Database
   Stores PatientSession with all fetched data
   
5. Flask Backend → Flutter App
   Returns HTML dashboard with session cookies
   
6. User Creates Task → Flask Backend
   POST /api/backend/create-miniapp
   Body: { title, description, specification, complexity }
   
7. Flask Backend → Database
   Creates Task record with status='pending'
   
8. User Starts Task → Flask Backend
   POST /api/tasks/{id}/run
   
9. Flask Backend → Claude AI
   Sends patient data + user prompt
   
10. Claude AI → Flask Backend
    Returns generated HTML/CSS/JS code
    
11. Flask Backend → Database
    Stores generated code in Task record
    Saves files to generated_apps/{task_id}/
    
12. User Views Mini App → Flask Backend
    GET /api/backend/view-app/{task_id}
    
13. Flask Backend → User
    Returns generated HTML mini app
```

---

## Mini App Generation Process

### Phase 1: Task Creation (Pending)

```python
# User creates task via frontend
POST /api/backend/create-miniapp
{
    "title": "Patient Vital Signs Dashboard",
    "description": "Show blood pressure, heart rate, and temperature trends",
    "specification": "Use line charts for trends, show last 30 days",
    "complexity": "standard"
}

# Backend creates task
task = Task(
    id=uuid.uuid4(),
    title=title,
    description=description,
    specification=specification,
    complexity=TaskComplexity.standard,
    status=TaskStatus.pending,  # Waiting for user to start
    patient_id=patient_session.patient_id,
    patient_data=patient_session.patient_data
)
```

### Phase 2: Planning

```python
# User clicks "Start Task"
POST /api/tasks/{task_id}/run

# Backend updates status
task.status = TaskStatus.planning
task.current_iteration += 1
add_task_log(task_id, "Starting mini app planning...", 'info')
```

### Phase 3: Execution (Code Generation)

```python
task.status = TaskStatus.executing
add_task_log(task_id, "Generating code with Claude AI...", 'info')

# Call Claude AI
llm = ClaudeLLMService()
html_content, css_content, js_content, llm_response = llm.generate_mini_app(
    user_prompt=f"{task.title}\n\n{task.description}\n\n{task.specification}",
    patient_data=task.patient_data,
    complexity=task.complexity.value
)

# Save generated code
task.html_content = html_content
task.css_content = css_content
task.js_content = js_content

# Save to files
save_generated_files(task_id, html_content, css_content, js_content)
```

### Phase 4: AI Review

```python
task.status = TaskStatus.reviewing
add_task_log(task_id, "AI reviewing generated code...", 'info')

# Claude reviews its own code
score, feedback = llm.review_generated_code(
    html_content,
    css_content,
    js_content,
    user_prompt
)

task.final_score = score  # 0-10 rating
```

### Phase 5: Completion

```python
task.status = TaskStatus.completed
task.completed_at = datetime.utcnow()
add_task_log(task_id, f"Task completed with score: {score}/10", 'info')
```

### Generated Mini App Structure

```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Patient Vital Signs Dashboard - John Doe</title>
    
    <!-- External Dependencies -->
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet">
    <link href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css" rel="stylesheet">
    
    <style>
        /* Custom healthcare styling */
        :root {
            --primary-color: #0066cc;
            --success-color: #28a745;
            --danger-color: #dc3545;
            --warning-color: #ffc107;
        }
        
        body {
            font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
            background: #f5f7fa;
        }
        
        .dashboard-header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 2rem;
        }
        
        .vital-card {
            background: white;
            border-radius: 12px;
            padding: 1.5rem;
            box-shadow: 0 2px 8px rgba(0,0,0,0.1);
            transition: transform 0.2s;
        }
        
        .vital-card:hover {
            transform: translateY(-4px);
            box-shadow: 0 4px 16px rgba(0,0,0,0.15);
        }
    </style>
</head>
<body>
    <!-- Patient Header -->
    <div class="dashboard-header">
        <div class="container">
            <h1><i class="fas fa-heartbeat"></i> Vital Signs Dashboard</h1>
            <p class="mb-0">Patient: John Doe | DOB: 1980-05-15 | MRN: 12345</p>
        </div>
    </div>
    
    <!-- Main Content -->
    <div class="container mt-4">
        <div class="row">
            <!-- Blood Pressure Card -->
            <div class="col-md-4 mb-4">
                <div class="vital-card">
                    <h5><i class="fas fa-heart text-danger"></i> Blood Pressure</h5>
                    <h2>120/80 <small>mmHg</small></h2>
                    <canvas id="bpChart"></canvas>
                </div>
            </div>
            
            <!-- Heart Rate Card -->
            <div class="col-md-4 mb-4">
                <div class="vital-card">
                    <h5><i class="fas fa-heartbeat text-primary"></i> Heart Rate</h5>
                    <h2>72 <small>bpm</small></h2>
                    <canvas id="hrChart"></canvas>
                </div>
            </div>
            
            <!-- Temperature Card -->
            <div class="col-md-4 mb-4">
                <div class="vital-card">
                    <h5><i class="fas fa-thermometer-half text-warning"></i> Temperature</h5>
                    <h2>98.6 <small>°F</small></h2>
                    <canvas id="tempChart"></canvas>
                </div>
            </div>
        </div>
        
        <!-- Trend Chart -->
        <div class="vital-card">
            <h5>30-Day Vital Signs Trend</h5>
            <canvas id="trendChart"></canvas>
        </div>
    </div>
    
    <!-- JavaScript -->
    <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
    <script>
        // Patient data from FHIR (embedded by backend)
        const patientData = {
            observations: [
                { date: '2025-01-15', bp_systolic: 120, bp_diastolic: 80, hr: 72, temp: 98.6 },
                { date: '2025-01-14', bp_systolic: 118, bp_diastolic: 78, hr: 70, temp: 98.4 },
                // ... more data
            ]
        };
        
        // Create Blood Pressure Chart
        const bpCtx = document.getElementById('bpChart').getContext('2d');
        new Chart(bpCtx, {
            type: 'line',
            data: {
                labels: patientData.observations.map(o => o.date),
                datasets: [{
                    label: 'Systolic',
                    data: patientData.observations.map(o => o.bp_systolic),
                    borderColor: '#dc3545',
                    tension: 0.4
                }, {
                    label: 'Diastolic',
                    data: patientData.observations.map(o => o.bp_diastolic),
                    borderColor: '#0066cc',
                    tension: 0.4
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    legend: { display: true }
                }
            }
        });
        
        // Similar charts for heart rate and temperature...
    </script>
</body>
</html>
```

---

## API Endpoints

### Authentication & Session

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/` | POST | Initialize session from Flutter app |
| `/api/backend/session-status` | GET | Check current session status |

### Task Management

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/backend/create-miniapp` | POST | Create new task (pending) |
| `/api/tasks/{id}/run` | POST | Start task execution |
| `/api/tasks/{id}` | GET | Get task details |
| `/api/tasks/{id}` | PATCH | Update task |
| `/api/tasks/{id}` | DELETE | Delete task |
| `/api/tasks/{id}/cancel` | POST | Cancel running task |
| `/api/tasks/{id}/logs` | GET | Get task logs |
| `/api/backend/task/{id}/status` | GET | Get task status for polling |

### Mini App Generation

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/backend/generate-idea` | POST | Generate app idea with AI |
| `/api/backend/view-app/{id}` | GET | View generated mini app |
| `/mini-apps/{id}` | GET | Preview mini app in modal |
| `/mini-apps/{id}/raw` | GET | Raw HTML for iframe |

### Dashboard

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/backend/dashboard-data` | GET | Get all dashboard data |

---

## Security Considerations

### 1. Token Storage

**Current Implementation:**
```python
# Tokens stored in database (PatientSession model)
patient_session = PatientSession(
    auth_token=access_token  # Plain text in development
)
```

**Production Recommendation:**
```python
from cryptography.fernet import Fernet

# Encrypt tokens before storage
cipher = Fernet(encryption_key)
encrypted_token = cipher.encrypt(access_token.encode())

patient_session = PatientSession(
    auth_token=encrypted_token
)

# Decrypt when needed
decrypted_token = cipher.decrypt(patient_session.auth_token).decode()
```

### 2. CORS Configuration

```python
@app.after_request
def add_cors_headers(response):
    origin = request.headers.get('Origin')
    if origin:
        response.headers.add('Access-Control-Allow-Origin', origin)
    response.headers.add('Access-Control-Allow-Credentials', 'true')
    return response
```

**Production:** Whitelist specific origins only.

### 3. HTTPS Enforcement

**Production:** Always use HTTPS for:
- Flutter app ↔ Flask backend communication
- Flask backend ↔ FHIR server communication

### 4. Token Expiration

```python
# Check token expiration
if patient_session.created_at < datetime.utcnow() - timedelta(hours=24):
    # Token expired, require re-authentication
    return jsonify({'error': 'Session expired'}), 401
```

### 5. Input Validation

```python
# Validate FHIR base URL
from urllib.parse import urlparse

def validate_fhir_url(url):
    parsed = urlparse(url)
    if parsed.scheme not in ['http', 'https']:
        raise ValueError("Invalid FHIR URL scheme")
    if not parsed.netloc:
        raise ValueError("Invalid FHIR URL")
    return True
```

---

## Usage Examples

### Example 1: Initialize Session from Flutter

```dart
// Flutter app
import 'package:http/http.dart' as http;

Future<void> initializeCareITVibe() async {
  final response = await http.post(
    Uri.parse('https://careit-vibe.example.com/api/miniapp/init'),
    headers: {
      'Authorization': 'Bearer $fhirAccessToken',
      'X-Patient-Id': currentPatientId,
      'X-FHIR-Base': 'https://fhir.example.com/r4',
    },
  );
  
  if (response.statusCode == 200) {
    // Session created, show dashboard HTML
    final html = response.body;
    // Display in WebView
  }
}
```

### Example 2: Create and Execute Task

```python
# Python client example
import requests

# 1. Create task
response = requests.post(
    'http://localhost:5000/api/backend/create-miniapp',
    json={
        'title': 'Medication Adherence Tracker',
        'description': 'Track patient medication compliance with visual indicators',
        'specification': 'Show calendar view with taken/missed doses',
        'complexity': 'standard'
    }
)
task_id = response.json()['task_id']

# 2. Start task
requests.post(f'http://localhost:5000/api/tasks/{task_id}/run')

# 3. Poll for completion
import time
while True:
    status = requests.get(f'http://localhost:5000/api/backend/task/{task_id}/status').json()
    if status['status'] in ['completed', 'failed']:
        break
    time.sleep(2)

# 4. View generated app
app_url = f'http://localhost:5000/api/backend/view-app/{task_id}'
print(f"Mini app ready: {app_url}")
```

### Example 3: Fetch Patient Data Directly

```python
from fhir_service import FHIRService

# Initialize service
fhir = FHIRService(
    base_url='https://fhir.example.com/r4',
    access_token='your_token_here'
)

# Get specific resources
patient = fhir.get_patient('12345')
observations = fhir.get_patient_observations('12345', count=50)
conditions = fhir.get_patient_conditions('12345')

# Or get everything at once
all_data = fhir.get_full_patient_data('12345')

print(f"Patient: {all_data['patient']['name']}")
print(f"Observations: {all_data['observations']['count']}")
print(f"Conditions: {all_data['conditions']['count']}")
```

### Example 4: Custom Mini App with FHIR Data

```javascript
// Generated mini app can access patient data
const patientData = {
    patient: {
        name: "John Doe",
        id: "12345",
        gender: "male",
        birthDate: "1980-05-15"
    },
    observations: {
        summary: [
            { code: "Blood Pressure", value: 120, unit: "mmHg", date: "2025-01-15" },
            { code: "Heart Rate", value: 72, unit: "bpm", date: "2025-01-15" }
        ]
    },
    medications: {
        summary: [
            { medication: "Metformin 500mg", status: "active", dosage: "Twice daily" }
        ]
    }
};

// Use data in UI
document.getElementById('patient-name').textContent = patientData.patient.name;
document.getElementById('bp-value').textContent = 
    patientData.observations.summary.find(o => o.code === 'Blood Pressure').value;
```

---

## Troubleshooting

### Issue: "No patient session found"

**Solution:**
```python
# Check if session exists
patient_session = PatientSession.query.order_by(
    PatientSession.last_accessed.desc()
).first()

if not patient_session:
    # Re-initialize from Flutter app
    # POST /api/miniapp/init with credentials
```

### Issue: "FHIR request failed"

**Solution:**
```python
# Check FHIR server connectivity
import requests

response = requests.get(
    f"{fhir_base_url}/Patient/{patient_id}",
    headers={'Authorization': f'Bearer {access_token}'}
)

if response.status_code == 401:
    print("Token expired or invalid")
elif response.status_code == 404:
    print("Patient not found")
else:
    print(f"Error: {response.status_code}")
```

### Issue: "Task stuck in 'running' status"

**Solution:**
```python
# Check task logs
logs = TaskLog.query.filter_by(task_id=task_id).order_by(
    TaskLog.created_at.desc()
).all()

for log in logs:
    print(f"[{log.level}] {log.message}")

# Cancel and restart if needed
requests.post(f'/api/tasks/{task_id}/cancel')
requests.post(f'/api/tasks/{task_id}/run')
```

---

## Best Practices

1. **Always validate FHIR URLs** before making requests
2. **Encrypt tokens** in production environments
3. **Implement token refresh** for long-running sessions
4. **Use HTTPS** for all communications
5. **Log all FHIR requests** for debugging and auditing
6. **Handle FHIR server errors** gracefully with user-friendly messages
7. **Cache patient data** to reduce FHIR server load
8. **Implement rate limiting** to prevent API abuse
9. **Test with multiple FHIR servers** (Epic, Cerner, HAPI, etc.)
10. **Follow SMART on FHIR scopes** for proper authorization

---

## Conclusion

The CareIT Vibe Mini App Generator provides a complete solution for creating SMART on FHIR compliant healthcare applications. By integrating with FHIR servers and leveraging Claude AI, it enables rapid development of custom patient-facing and provider-facing healthcare dashboards and tools.

For questions or support, refer to the main README.md or contact the development team.
