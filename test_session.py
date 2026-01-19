#!/usr/bin/env python3
"""Test script to check session data"""
from flutter_session import flutter_session
import sys

# Get all sessions from database
import sqlite3
from pathlib import Path

db_path = Path(__file__).parent / "instance" / "flutter_sessions.db"

if not db_path.exists():
    print("No session database found")
    sys.exit(1)

conn = sqlite3.connect(str(db_path))
cursor = conn.execute("""
    SELECT session_id, patient_id, patient_name, patient_data
    FROM flutter_sessions 
    WHERE expires_at > CURRENT_TIMESTAMP
    ORDER BY created_at DESC
    LIMIT 1
""")

row = cursor.fetchone()
conn.close()

if not row:
    print("No active sessions found")
    sys.exit(1)

session_id, patient_id, patient_name, patient_data_json = row

print(f"Session ID: {session_id}")
print(f"Patient ID: {patient_id}")
print(f"Patient Name: {patient_name}")
print(f"\nPatient Data JSON (first 500 chars):")
print(patient_data_json[:500] if patient_data_json else "None")

# Parse and show structure
if patient_data_json:
    import json
    patient_data = json.loads(patient_data_json)
    print(f"\nPatient Data Keys: {list(patient_data.keys())}")
    
    if 'patient' in patient_data:
        print(f"\nPatient Info:")
        print(f"  Name: {patient_data['patient'].get('name')}")
        print(f"  Gender: {patient_data['patient'].get('gender')}")
        print(f"  Birth Date: {patient_data['patient'].get('birthDate')}")
