#!/usr/bin/env python3
import sqlite3
import os

db_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'instance', 'careit_vibe.db')

if not os.path.exists(db_path):
    print(f'Database not found at: {db_path}')
    raise SystemExit(1)

conn   = sqlite3.connect(db_path)
cursor = conn.cursor()

cursor.execute('PRAGMA table_info(tasks)')
existing = {col[1] for col in cursor.fetchall()}

migrations = [
    ('cancel_requested', 'BOOLEAN DEFAULT 0'),
    ('transferred',      'BOOLEAN DEFAULT 0'),
    ('transferred_at',   'DATETIME'),
    ('transfer_status',  'VARCHAR(20)'),
    ('transfer_roles',   'TEXT'),
    ('transfer_show_at', 'VARCHAR(100)'),
]

for column, definition in migrations:
    if column not in existing:
        cursor.execute(f'ALTER TABLE tasks ADD COLUMN {column} {definition}')
        print(f'Added: {column}')
    else:
        print(f'OK: {column}')

conn.commit()
conn.close()
print('Done.')
