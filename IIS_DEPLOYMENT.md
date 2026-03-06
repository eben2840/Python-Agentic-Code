# Deploy CareIT Vibe Mini App to IIS (Windows Server)

## Prerequisites

- Windows Server with IIS installed
- Administrator access

## Step 1: Install Python

1. Download Python 3.11 from https://www.python.org/downloads/
2. Run installer with these options:
   - Check "Add Python to PATH"
   - Install to `C:\Python311`
3. Verify installation:
   ```cmd
   python --version
   ```

## Step 2: Install wfastcgi

Open Command Prompt as Administrator:

```cmd
pip install wfastcgi
wfastcgi-enable
```

Note the output path - you may need it for web.config.

## Step 3: Enable CGI in IIS

1. Open **Server Manager**
2. Click **Add roles and features**
3. Navigate to: Server Roles → Web Server (IIS) → Web Server → Application Development
4. Check **CGI**
5. Complete the wizard

## Step 4: Copy Application Files

Copy the entire application folder to:

```
C:\inetpub\wwwroot\CareIT_Vibe_Miniapp
```

## Step 5: Install Python Dependencies

Open Command Prompt as Administrator:

```cmd
cd C:\inetpub\wwwroot\CareIT_Vibe_Miniapp
pip install -r requirements.txt
```

## Step 6: Create Environment File

Create `.env` file in `C:\inetpub\wwwroot\CareIT_Vibe_Miniapp`:

```
ANTHROPIC_API_KEY=your-api-key-here
SECRET_KEY=your-secret-key-here
FLASK_DEBUG=false
PORT=80
```

## Step 7: Configure IIS Website

1. Open **IIS Manager**
2. Right-click **Sites** → **Add Website**
3. Configure:
   - Site name: `CareITVibeApp`
   - Physical path: `C:\inetpub\wwwroot\CareIT_Vibe_Miniapp`
   - Binding: Port 80 (or your preferred port)
4. Click **OK**

## Step 8: Configure Application Pool

1. In IIS Manager, click **Application Pools**
2. Find `CareITVibeApp` pool
3. Right-click → **Basic Settings**
4. Set .NET CLR version to **No Managed Code**
5. Click **OK**

## Step 9: Set Folder Permissions

1. Right-click `C:\inetpub\wwwroot\CareIT_Vibe_Miniapp`
2. Properties → Security → Edit → Add
3. Add `IIS_IUSRS` with **Modify** permissions
4. Add `IUSR` with **Read & Execute** permissions

## Step 10: Verify web.config

Ensure `web.config` exists with correct Python path:

```xml
<?xml version="1.0" encoding="utf-8"?>
<configuration>
  <system.webServer>
    <handlers>
      <add name="PythonHandler" path="*" verb="*" modules="FastCgiModule"
           scriptProcessor="C:\Python311\python.exe|C:\Python311\Lib\site-packages\wfastcgi.py"
           resourceType="Unspecified" requireAccess="Script"/>
    </handlers>
  </system.webServer>
  <appSettings>
    <add key="WSGI_HANDLER" value="app.app"/>
    <add key="PYTHONPATH" value="C:\inetpub\wwwroot\CareIT_Vibe_Miniapp"/>
  </appSettings>
</configuration>
```

**Update paths if Python is installed elsewhere.**

## Step 11: Initialize Database

```cmd
cd C:\inetpub\wwwroot\CareIT_Vibe_Miniapp
python -c "from app import app, db; app.app_context().push(); db.create_all()"
```

## Step 12: Restart IIS

```cmd
iisreset
```

## Step 13: Test

Open browser and go to:

```
http://localhost
```

Or your server IP/domain.

## Troubleshooting

### Check Logs

- IIS logs: `C:\inetpub\logs\LogFiles`
- wfastcgi logs: `C:\inetpub\logs\wfastcgi.log`

### Common Issues

**500 Error:**
- Check Python path in web.config
- Verify all dependencies installed
- Check folder permissions

**Module not found:**
- Run `pip install -r requirements.txt` again
- Ensure using correct Python installation

**Permission denied:**
- Grant IIS_IUSRS write access to `instance` folder (for SQLite)
- Grant write access to `generated_apps` folder

### Enable Detailed Errors

In web.config, add inside `<system.webServer>`:

```xml
<httpErrors errorMode="Detailed"/>
```

## API Endpoints

Once deployed, these endpoints are available:

- `POST /api/quick/generate` - Generate mini app
- `GET /api/quick/status/{task_id}` - Check status
- `GET /api/mini-apps?patient_id=xxx` - List patient's apps
