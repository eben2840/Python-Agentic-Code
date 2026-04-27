# CareIT Vibe Mini App Generator

A Flask application that generates SMART on FHIR mini applications using Claude AI. This integrates with a Flutter mobile app to receive patient context securely and generates custom healthcare dashboards and apps.

## Features

- **Secure FHIR Integration**: Receives Authorization token, Patient ID, and FHIR Base URL via secure HTTP headers
- **Claude AI Generation**: Uses Anthropic's Claude API to generate complete mini applications (HTML, CSS, JS)
- **Patient Data Fetching**: Connects to FHIR servers to fetch comprehensive patient data
- **Task Management**: Kanban-style task tracking with status management
- **Generation History**: SQLite database stores all generations for reference
- **Live Preview**: Preview generated mini apps directly in the browser

## Project Structure

```
CareIT_Vibe_Miniapp/
├── app.py              # Main Flask application
├── models.py           # SQLAlchemy database models
├── llm_service.py      # Claude AI integration service
├── requirements.txt    # Python dependencies
├── .env.example        # Example environment variables
├── generated_apps/     # Output folder for generated apps
├── static/
│   ├── css/           # Stylesheets
│   └── js/            # JavaScript files
└── templates/
    ├── index.html          # Main dashboard
    ├── mini_app_preview.html   # Mini app preview page
    └── mini_apps.html      # Mini apps gallery
```

## Setup

### 1. Create Virtual Environment

```bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

### 2. Install Dependencies

```bash
pip install -r requirements.txt
```

### 3. Configure Environment Variables

Copy the example env file and add your Anthropic API key:

```bash
cp .env.example .env
```

Edit `.env` and set:
```
ANTHROPIC_API_KEY=your_anthropic_api_key_here
```

### 4. Run the Application

```bash
python app.py
```

The server will start at `http://localhost:5000`

## API Endpoints

### Flutter Integration Endpoint

```
POST /api/miniapp/init
```

Headers:
- `Authorization`: Bearer token for FHIR server
- `X-Patient-Id`: FHIR Patient ID
- `X-FHIR-Base`: FHIR server base URL

This endpoint:
1. Receives credentials securely via headers
2. Fetches patient data from FHIR server
3. Returns the HTML dashboard with patient context in cookies

### Task Management

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/tasks` | GET | List all tasks |
| `/api/tasks` | POST | Create new task (triggers generation) |
| `/api/tasks/<id>` | GET | Get task details |
| `/api/tasks/<id>` | PATCH | Update task |
| `/api/tasks/<id>` | DELETE | Delete task |
| `/api/tasks/<id>/run` | POST | Restart task |
| `/api/tasks/<id>/logs` | GET | Get task logs |

### Idea Generation

```
POST /api/generate-idea
Body: { "prompt": "your idea description" }
```

### Mini App Preview

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/mini-apps` | GET | Gallery of completed mini apps |
| `/mini-apps/<id>` | GET | Preview a mini app |
| `/mini-apps/<id>/raw` | GET | Raw HTML for iframe embedding |

## How It Works

1. **Flutter App Connection**: The Flutter app sends patient credentials via secure headers to `/api/miniapp/init`

2. **FHIR Data Fetching**: The server uses the token to fetch:
   - Patient demographics
   - Observations (vitals, lab results)
   - Conditions/diagnoses
   - Medications
   - Allergies
   - And more...

3. **Task Creation**: User creates a task describing what they want (e.g., "Create a dashboard for patient observations")

4. **AI Generation**: Claude AI receives:
   - User's prompt/description
   - Patient data context
   - Instructions for creating SMART on FHIR apps

5. **Code Generation**: Claude generates complete HTML, CSS, and JavaScript code

6. **Review & Scoring**: The generated code is reviewed and scored (0-10)

7. **Storage**: Everything is saved to:
   - SQLite database (metadata, content)
   - `generated_apps/` folder (files)

## Security

- **Token Handling**: Access tokens are never exposed in URLs or browser JavaScript
- **Cookie Security**: FHIR tokens stored in httpOnly cookies
- **Server-Side Requests**: All FHIR API calls happen server-side

## Example Usage

### Generate a Patient Dashboard

1. Open the app at `http://localhost:5000`
2. Go to "Generate Idea" and describe what you want:
   ```
   Create a patient observation dashboard showing vitals over time
   ```
3. Click "Generate Idea" to get AI suggestions
4. Use the idea to create a task
5. Watch as Claude generates your mini app
6. Preview and use the generated app

## License

MIT
├── fhir_service.py     # FHIR API integration service
