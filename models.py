"""
Database Models for CareIT Vibe Mini App Generator
"""

import os
import enum
from datetime import datetime
from flask_sqlalchemy import SQLAlchemy

db = SQLAlchemy()


class TaskStatus(enum.Enum):
    """Task status enumeration"""
    pending = "pending"
    planning = "planning"
    executing = "executing"
    reviewing = "reviewing"
    fixing = "fixing"
    completed = "completed"
    failed = "failed"
    cancelled = "cancelled"


class TaskComplexity(enum.Enum):
    """Task complexity levels"""
    simple = "simple"
    standard = "standard"
    complex = "complex"


class Task(db.Model):
    """Task model for storing mini app generation tasks"""
    __tablename__ = 'tasks'

    id = db.Column(db.String(36), primary_key=True)
    title = db.Column(db.String(500), nullable=False)
    description = db.Column(db.Text, nullable=True)
    specification = db.Column(db.Text, nullable=True)
    complexity = db.Column(db.Enum(TaskComplexity), default=TaskComplexity.standard)
    status = db.Column(db.Enum(TaskStatus), default=TaskStatus.pending)
    
    # Patient context
    patient_id = db.Column(db.String(100), nullable=True)
    fhir_base_url = db.Column(db.String(500), nullable=True)
    patient_data = db.Column(db.JSON, nullable=True)  # Cached FHIR patient data
    
    # Generation details
    plan = db.Column(db.Text, nullable=True)
    generated_files = db.Column(db.JSON, nullable=True)  # List of generated file paths
    html_content = db.Column(db.Text, nullable=True)
    css_content = db.Column(db.Text, nullable=True)
    js_content = db.Column(db.Text, nullable=True)
    
    # Iteration tracking
    current_iteration = db.Column(db.Integer, default=0)
    max_iterations = db.Column(db.Integer, default=5)
    
    # Scoring and feedback
    final_score = db.Column(db.Float, nullable=True)
    error_message = db.Column(db.Text, nullable=True)
    
    # Cancellation flag
    cancel_requested = db.Column(db.Boolean, default=False)

    # CareITWeb / CIW transfer
    transferred    = db.Column(db.Boolean, default=False)
    transferred_at = db.Column(db.DateTime, nullable=True)
    transfer_status   = db.Column(db.String(20), nullable=True)   # 'active' | 'not_active'
    transfer_roles    = db.Column(db.JSON, nullable=True)         # ['main_page', 'med_board', ...]
    transfer_show_at  = db.Column(db.JSON, nullable=True)
    transfer_dept_name = db.Column(db.String(300), nullable=True)
    transfer_ward      = db.Column(db.String(300), nullable=True)

    # Timestamps
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    completed_at = db.Column(db.DateTime, nullable=True)

    # Relationships
    logs = db.relationship('TaskLog', backref='task', lazy='dynamic', cascade='all, delete-orphan')
    generations = db.relationship('Generation', backref='task', lazy='dynamic', cascade='all, delete-orphan')

    def to_dict(self):
        """Convert task to dictionary"""
        return {
            'id': self.id,
            'title': self.title,
            'description': self.description,
            'specification': self.specification,
            'complexity': self.complexity.value if self.complexity else 'standard',
            'status': self.status.value if self.status else 'pending',
            'patient_id': self.patient_id,
            'fhir_base_url': self.fhir_base_url,
            'patient_data': self.patient_data,
            'plan': self.plan,
            'generated_files': self.generated_files or [],
            'html_content': self.html_content,
            'css_content': self.css_content,
            'js_content': self.js_content,
            'current_iteration': self.current_iteration,
            'max_iterations': self.max_iterations,
            'final_score': self.final_score,
            'error_message': self.error_message,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None,
            'completed_at': self.completed_at.isoformat() if self.completed_at else None,
        }


class TaskLog(db.Model):
    """Log entries for task execution"""
    __tablename__ = 'task_logs'

    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    task_id = db.Column(db.String(36), db.ForeignKey('tasks.id'), nullable=False)
    level = db.Column(db.String(20), default='info')  # info, warning, error, debug
    message = db.Column(db.Text, nullable=False)
    details = db.Column(db.JSON, nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {
            'id': self.id,
            'task_id': self.task_id,
            'level': self.level,
            'message': self.message,
            'details': self.details,
            'created_at': self.created_at.isoformat() if self.created_at else None,
        }


class Generation(db.Model):
    """Store each generation/iteration of mini app code"""
    __tablename__ = 'generations'

    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    task_id = db.Column(db.String(36), db.ForeignKey('tasks.id'), nullable=False)
    iteration = db.Column(db.Integer, default=1)
    
    # User prompt and context
    user_prompt = db.Column(db.Text, nullable=False)
    patient_context = db.Column(db.JSON, nullable=True)
    
    # Generated content
    html_content = db.Column(db.Text, nullable=True)
    css_content = db.Column(db.Text, nullable=True)
    js_content = db.Column(db.Text, nullable=True)
    
    # LLM interaction
    llm_prompt = db.Column(db.Text, nullable=True)  # Full prompt sent to LLM
    llm_response = db.Column(db.Text, nullable=True)  # Raw LLM response
    
    # File paths
    output_folder = db.Column(db.String(500), nullable=True)
    html_file_path = db.Column(db.String(500), nullable=True)
    css_file_path = db.Column(db.String(500), nullable=True)
    js_file_path = db.Column(db.String(500), nullable=True)
    
    # Scoring
    score = db.Column(db.Float, nullable=True)
    feedback = db.Column(db.Text, nullable=True)
    
    # Timestamps
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {
            'id': self.id,
            'task_id': self.task_id,
            'iteration': self.iteration,
            'user_prompt': self.user_prompt,
            'patient_context': self.patient_context,
            'html_content': self.html_content,
            'css_content': self.css_content,
            'js_content': self.js_content,
            'output_folder': self.output_folder,
            'html_file_path': self.html_file_path,
            'css_file_path': self.css_file_path,
            'js_file_path': self.js_file_path,
            'score': self.score,
            'feedback': self.feedback,
            'created_at': self.created_at.isoformat() if self.created_at else None,
        }


class PatientSession(db.Model):
    """Store patient session data persistently"""
    __tablename__ = 'patient_sessions'

    id = db.Column(db.String(36), primary_key=True)
    patient_id = db.Column(db.String(100), nullable=False)
    patient_name = db.Column(db.String(200), nullable=True)
    fhir_base_url = db.Column(db.String(500), nullable=False)
    auth_token = db.Column(db.Text, nullable=False)
    patient_data = db.Column(db.JSON, nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    last_accessed = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    def to_dict(self):
        return {
            'id': self.id,
            'patient_id': self.patient_id,
            'patient_name': self.patient_name,
            'fhir_base_url': self.fhir_base_url,
            'patient_data': self.patient_data,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'last_accessed': self.last_accessed.isoformat() if self.last_accessed else None,
        }


class CIWTransfer:
    status  = [('active', 'Active'), ('not_active', 'Not Active')]
    roles   = [('nurse', 'Nurse'), ('doctor', 'Doctor'), ('admin', 'Admin')]
    show_at = [('main_dashboard', 'Ward Overview'), ('medboard', 'Med Board'), ('curve', 'Curve')]


def init_db(app):
    """Initialize the database"""
    db.init_app(app)
    with app.app_context():
        db.create_all()
