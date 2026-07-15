"""initial schema

Revision ID: 0001_initial_schema
Revises:
Create Date: 2026-07-12 00:00:00.000000

"""
from alembic import op
import sqlalchemy as sa


revision = '0001_initial_schema'
down_revision = None
branch_labels = None
depends_on = None


task_complexity = sa.Enum('simple', 'standard', 'complex', name='taskcomplexity')
task_status = sa.Enum(
    'pending',
    'planning',
    'executing',
    'reviewing',
    'fixing',
    'completed',
    'failed',
    'cancelled',
    name='taskstatus',
)


def upgrade():
    op.create_table(
        'patient_sessions',
        sa.Column('id', sa.String(length=36), nullable=False),
        sa.Column('patient_id', sa.String(length=100), nullable=False),
        sa.Column('patient_name', sa.String(length=200), nullable=True),
        sa.Column('fhir_base_url', sa.String(length=500), nullable=False),
        sa.Column('auth_token', sa.Text(), nullable=False),
        sa.Column('patient_data', sa.JSON(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=True),
        sa.Column('last_accessed', sa.DateTime(), nullable=True),
        sa.PrimaryKeyConstraint('id'),
    )

    op.create_table(
        'tasks',
        sa.Column('id', sa.String(length=36), nullable=False),
        sa.Column('title', sa.String(length=500), nullable=False),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('specification', sa.Text(), nullable=True),
        sa.Column('complexity', task_complexity, nullable=True),
        sa.Column('status', task_status, nullable=True),
        sa.Column('patient_id', sa.String(length=100), nullable=True),
        sa.Column('fhir_base_url', sa.String(length=500), nullable=True),
        sa.Column('patient_data', sa.JSON(), nullable=True),
        sa.Column('plan', sa.Text(), nullable=True),
        sa.Column('generated_files', sa.JSON(), nullable=True),
        sa.Column('html_content', sa.Text(), nullable=True),
        sa.Column('css_content', sa.Text(), nullable=True),
        sa.Column('js_content', sa.Text(), nullable=True),
        sa.Column('current_iteration', sa.Integer(), nullable=True),
        sa.Column('max_iterations', sa.Integer(), nullable=True),
        sa.Column('final_score', sa.Float(), nullable=True),
        sa.Column('error_message', sa.Text(), nullable=True),
        sa.Column('cancel_requested', sa.Boolean(), nullable=True),
        sa.Column('transferred', sa.Boolean(), nullable=True),
        sa.Column('transferred_at', sa.DateTime(), nullable=True),
        sa.Column('transfer_status', sa.String(length=20), nullable=True),
        sa.Column('transfer_roles', sa.JSON(), nullable=True),
        sa.Column('transfer_show_at', sa.JSON(), nullable=True),
        sa.Column('transfer_dept_name', sa.String(length=300), nullable=True),
        sa.Column('transfer_ward', sa.String(length=300), nullable=True),
        sa.Column('transfer_icon', sa.String(length=100), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=True),
        sa.Column('updated_at', sa.DateTime(), nullable=True),
        sa.Column('completed_at', sa.DateTime(), nullable=True),
        sa.PrimaryKeyConstraint('id'),
    )

    op.create_table(
        'bookmarks',
        sa.Column('id', sa.Integer(), autoincrement=True, nullable=False),
        sa.Column('task_id', sa.String(length=36), nullable=False),
        sa.Column('added_by', sa.String(length=100), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=True),
        sa.ForeignKeyConstraint(['task_id'], ['tasks.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
    )

    op.create_table(
        'generations',
        sa.Column('id', sa.Integer(), autoincrement=True, nullable=False),
        sa.Column('task_id', sa.String(length=36), nullable=False),
        sa.Column('iteration', sa.Integer(), nullable=True),
        sa.Column('user_prompt', sa.Text(), nullable=False),
        sa.Column('patient_context', sa.JSON(), nullable=True),
        sa.Column('html_content', sa.Text(), nullable=True),
        sa.Column('css_content', sa.Text(), nullable=True),
        sa.Column('js_content', sa.Text(), nullable=True),
        sa.Column('llm_prompt', sa.Text(), nullable=True),
        sa.Column('llm_response', sa.Text(), nullable=True),
        sa.Column('output_folder', sa.String(length=500), nullable=True),
        sa.Column('html_file_path', sa.String(length=500), nullable=True),
        sa.Column('css_file_path', sa.String(length=500), nullable=True),
        sa.Column('js_file_path', sa.String(length=500), nullable=True),
        sa.Column('score', sa.Float(), nullable=True),
        sa.Column('feedback', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=True),
        sa.ForeignKeyConstraint(['task_id'], ['tasks.id']),
        sa.PrimaryKeyConstraint('id'),
    )

    op.create_table(
        'task_logs',
        sa.Column('id', sa.Integer(), autoincrement=True, nullable=False),
        sa.Column('task_id', sa.String(length=36), nullable=False),
        sa.Column('level', sa.String(length=20), nullable=True),
        sa.Column('message', sa.Text(), nullable=False),
        sa.Column('details', sa.JSON(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=True),
        sa.ForeignKeyConstraint(['task_id'], ['tasks.id']),
        sa.PrimaryKeyConstraint('id'),
    )


def downgrade():
    op.drop_table('task_logs')
    op.drop_table('generations')
    op.drop_table('bookmarks')
    op.drop_table('tasks')
    op.drop_table('patient_sessions')
    task_status.drop(op.get_bind(), checkfirst=True)
    task_complexity.drop(op.get_bind(), checkfirst=True)

