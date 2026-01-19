#!/usr/bin/env python3
"""Quick test to check if the API endpoints work"""

import sys
sys.path.insert(0, '.')

from app import app, db
from models import Task, TaskStatus

# Create app context
with app.app_context():
    # Get first task
    task = Task.query.first()

    if task:
        print(f"✅ Found task: {task.id}")
        print(f"   Title: {task.title}")
        print(f"   Status: {task.status}")

        # Test to_dict
        try:
            task_dict = task.to_dict()
            print(f"✅ to_dict() works - returned {len(task_dict)} fields")

            # Check if all expected fields are there
            expected_fields = ['id', 'title', 'status', 'description', 'specification',
                             'complexity', 'patient_id', 'plan', 'html_content',
                             'css_content', 'js_content', 'final_score', 'error_message']

            for field in expected_fields:
                if field in task_dict:
                    print(f"   ✅ {field}: {type(task_dict[field]).__name__}")
                else:
                    print(f"   ❌ Missing field: {field}")

        except Exception as e:
            print(f"❌ Error calling to_dict(): {e}")
            import traceback
            traceback.print_exc()
    else:
        print("⚠️  No tasks found in database")

    # Count tasks
    total = Task.query.count()
    print(f"\nTotal tasks in database: {total}")
