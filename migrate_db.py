#!/usr/bin/env python3
"""Database migration script to add missing columns"""

import sqlite3
import os

db_path = '/Users/ebeneyeraggrey-mills/Documents/CareIT_Vibe_Miniapp/instance/careit_vibe.db'

if os.path.exists(db_path):
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    
    # Check if column exists
    cursor.execute('PRAGMA table_info(tasks)')
    columns = [col[1] for col in cursor.fetchall()]
    print(f"Existing columns: {columns}")
    
    if 'cancel_requested' not in columns:
        cursor.execute('ALTER TABLE tasks ADD COLUMN cancel_requested BOOLEAN DEFAULT 0')
        print('Added cancel_requested column')
    else:
        print('cancel_requested column already exists')
    
    conn.commit()
    conn.close()
    print('Database updated successfully')
else:
    print('Database not found at:', db_path)

