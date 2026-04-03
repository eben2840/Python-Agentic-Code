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
    ('cancel_requested',  'BOOLEAN DEFAULT 0'),
    ('transferred',       'BOOLEAN DEFAULT 0'),
    ('transferred_at',    'DATETIME'),
    ('transfer_status',   'VARCHAR(20)'),
    ('transfer_roles',    'TEXT'),
    ('transfer_show_at',  'TEXT'),
    ('transfer_dept_name', 'VARCHAR(300)'),
    ('transfer_ward',      'VARCHAR(300)'),
]

for column, definition in migrations:
    if column not in existing:
        cursor.execute(f'ALTER TABLE tasks ADD COLUMN {column} {definition}')
        print(f'Added: {column}')
    else:
        print(f'OK: {column}')

conn.commit()

# Convert any plain-string transfer_show_at values to JSON arrays
cursor.execute("UPDATE tasks SET transfer_show_at = '[\"' || transfer_show_at || '\"]' WHERE transfer_show_at IS NOT NULL AND transfer_show_at NOT LIKE '[%'")
fixed = cursor.rowcount
if fixed:
    print(f'Converted {fixed} rows: transfer_show_at → JSON array')

conn.commit()
conn.close()
print('Done.')
