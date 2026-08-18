
import os
import logging

from dotenv import load_dotenv
load_dotenv()

from flask import Flask, redirect, request, make_response, jsonify, render_template
from flask_migrate import Migrate
from models import db, init_db
from utils.helpers import time_ago

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)

# =============================================================================
# APP SETUP
# =============================================================================

app = Flask(__name__)
app.url_map.strict_slashes = False
app.config['SECRET_KEY'] = os.getenv('SECRET_KEY')
app.config['SQLALCHEMY_DATABASE_URI'] = os.getenv('DATABASE_URL')
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

OUTPUT_FOLDER = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'generated_apps')
os.makedirs(OUTPUT_FOLDER, exist_ok=True)

init_db(app)
Migrate(app, db)
app.jinja_env.globals['time_ago'] = time_ago

# =============================================================================
# BLUEPRINTS
# =============================================================================

from routes.web          import web
from routes.mini_apps    import mini_apps
from routes.tasks_api    import tasks_api
from routes.misc_api     import misc_api
from routes.organization import organization
from routes.location     import location
from routes.bookmarks    import bookmarks
from routes.extraction   import extraction
from skills        import skills
from admin         import admin
from quick_generate_api  import quick_generate

app.register_blueprint(web)
app.register_blueprint(mini_apps)
app.register_blueprint(tasks_api)
app.register_blueprint(misc_api)
app.register_blueprint(organization)
app.register_blueprint(location)
app.register_blueprint(bookmarks)
app.register_blueprint(extraction)
app.register_blueprint(skills)
app.register_blueprint(admin)
app.register_blueprint(quick_generate)

# =============================================================================
# CORS
# =============================================================================

def allowed_origins():
    raw = os.getenv("CORS_ALLOWED_ORIGINS")
    return [origin.strip().rstrip("/") for origin in raw.split(",") if origin.strip()]


@app.after_request
def add_cors_headers(response):
    """Add CORS headers for webview compatibility"""
    origin = request.headers.get('Origin')
    if origin and origin.rstrip('/') in allowed_origins():
        response.headers.add('Access-Control-Allow-Origin', origin)
    response.headers.add('Access-Control-Allow-Credentials', 'true')
    response.headers.add('Access-Control-Allow-Headers', 'Content-Type,Authorization,X-Patient-Id,X-FHIR-Base')
    response.headers.add('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE')
    return response

# =============================================================================
# ERROR HANDLERS
# =============================================================================

@app.errorhandler(404)
def not_found(e):
    # if request.path.startswith('/api/'):
    #     return jsonify({'error': 'Not found'}), 404
    return redirect('https://nursit.de/careit-vibe')
    # return render_template('unauthorized.html'), 404


@app.errorhandler(500)
def server_error(e):
    return jsonify({'error': 'Internal server error'}), 500

# =============================================================================
# MAIN
# =============================================================================

if __name__ == '__main__':
    port  = int(os.getenv('PORT'))
    debug = os.getenv('FLASK_DEBUG')
    app.run(host='0.0.0.0', port=port, debug=debug)
    # app.run(host='0.0.0.0', port=port, debug=debug,  use_reloader=False)
