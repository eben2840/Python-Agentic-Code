# """
# Flutter Session Manager - Store Flutter auth data persistently
# """
# import json
# import sqlite3
# from datetime import datetime, timedelta
# from pathlib import Path


# class FlutterSessionManager:
#     """Manages Flutter session data for webview compatibility"""
    
#     def __init__(self, db_path=None):
#         if db_path:
#             self.db_path = Path(db_path)
#         else:
#             self.db_path = Path(__file__).parent / "instance" / "flutter_sessions.db"
        
#         self.db_path.parent.mkdir(exist_ok=True)
#         self._init_db()
    
#     def _init_db(self):
#         """Initialize session database"""
#         conn = sqlite3.connect(str(self.db_path))
#         conn.execute("""
#             CREATE TABLE IF NOT EXISTS flutter_sessions (
#                 session_id TEXT PRIMARY KEY,
#                 auth_token TEXT NOT NULL,
#                 patient_id TEXT NOT NULL,
#                 fhir_base_url TEXT NOT NULL,
#                 patient_name TEXT,
#                 patient_data TEXT,
#                 created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
#                 expires_at TIMESTAMP
#             )
#         """)
#         conn.commit()
#         conn.close()
    
#     def store_session(self, auth_token, patient_id, fhir_base_url, patient_name=None, patient_data=None):
#         """Store Flutter session data and return session ID"""
#         import uuid
#         session_id = str(uuid.uuid4())
#         expires_at = datetime.now() + timedelta(hours=24)
        
#         patient_data_json = json.dumps(patient_data) if patient_data else None
        
#         conn = sqlite3.connect(str(self.db_path))
#         conn.execute("""
#             INSERT INTO flutter_sessions 
#             (session_id, auth_token, patient_id, fhir_base_url, patient_name, patient_data, expires_at)
#             VALUES (?, ?, ?, ?, ?, ?, ?)
#         """, (session_id, auth_token, patient_id, fhir_base_url, patient_name, patient_data_json, expires_at))
#         conn.commit()
#         conn.close()
        
#         return session_id
    
#     def get_session(self, session_id):
#         """Get session data by ID"""
#         conn = sqlite3.connect(str(self.db_path))
#         cursor = conn.execute("""
#             SELECT auth_token, patient_id, fhir_base_url, patient_name, patient_data
#             FROM flutter_sessions 
#             WHERE session_id = ? AND expires_at > CURRENT_TIMESTAMP
#         """, (session_id,))
        
#         row = cursor.fetchone()
#         conn.close()
        
#         if not row:
#             return None
        
#         patient_data = json.loads(row[4]) if row[4] else None
        
#         return {
#             'auth_token': row[0],
#             'patient_id': row[1],
#             'fhir_base_url': row[2],
#             'patient_name': row[3],
#             'patient_data': patient_data
#         }
    
#     def cleanup_expired(self):
#         """Remove expired sessions"""
#         conn = sqlite3.connect(str(self.db_path))
#         conn.execute("DELETE FROM flutter_sessions WHERE expires_at <= CURRENT_TIMESTAMP")
#         conn.commit()
#         conn.close()


# # Global instance
# flutter_session = FlutterSessionManager()
