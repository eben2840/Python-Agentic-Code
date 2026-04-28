import logging
from flask import Blueprint, jsonify
from models import TaskLog
from llm_service import check_llm_available

logger = logging.getLogger(__name__)
misc_api = Blueprint('misc_api', __name__)


@misc_api.route('/api/health')
def health_check():
    llm_info = check_llm_available()
    return jsonify({'status': 'healthy', 'version': '1.0.0', 'llm_info': llm_info})


@misc_api.route('/api/llm/status')
def get_status():
    return jsonify(check_llm_available())


@misc_api.route('/api/logs', methods=['GET'])
def get_all_logs():
    logs = TaskLog.query.order_by(TaskLog.created_at.desc()).limit(100).all()
    return jsonify([log.to_dict() for log in logs])
