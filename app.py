
import os
import logging

from dotenv import load_dotenv
load_dotenv()

from flask import Flask, request, make_response, jsonify, render_template
from models import init_db
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
app.config['SECRET_KEY'] = os.getenv('SECRET_KEY', 'k21vhabf2lbhyblb')
app.config['SQLALCHEMY_DATABASE_URI'] = os.getenv('DATABASE_URL', 'sqlite:///careit_vibe.db')
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

OUTPUT_FOLDER = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'generated_apps')
os.makedirs(OUTPUT_FOLDER, exist_ok=True)

init_db(app)
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
from backend_service     import backend_service
from quick_generate_api  import quick_generate

app.register_blueprint(web)
app.register_blueprint(mini_apps)
app.register_blueprint(tasks_api)
app.register_blueprint(misc_api)
app.register_blueprint(organization)
app.register_blueprint(location)
app.register_blueprint(backend_service)
app.register_blueprint(quick_generate)

# =============================================================================
# CORS
# =============================================================================

@app.after_request
def add_cors_headers(response):
    """Add CORS headers for webview compatibility"""
    origin = request.headers.get('Origin')
    if origin:
        response.headers.add('Access-Control-Allow-Origin', origin)
    else:
        response.headers.add('Access-Control-Allow-Origin', '*')
    response.headers.add('Access-Control-Allow-Credentials', 'true')
    response.headers.add('Access-Control-Allow-Headers', 'Content-Type,Authorization,X-Patient-Id,X-FHIR-Base')
    response.headers.add('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS,PATCH')
    return response

# =============================================================================
# ERROR HANDLERS
# =============================================================================

@app.errorhandler(404)
def not_found(e):
    if request.path.startswith('/api/'):
        return jsonify({'error': 'Not found'}), 404
    return render_template('unauthorized.html'), 404


@app.errorhandler(500)
def server_error(e):
    return jsonify({'error': 'Internal server error'}), 500

# =============================================================================
# MAIN
# =============================================================================

if __name__ == '__main__':
    port  = int(os.getenv('PORT', 2000))
    debug = os.getenv('FLASK_DEBUG', 'true').lower() == 'true'
    app.run(host='0.0.0.0', port=port, debug=debug)

