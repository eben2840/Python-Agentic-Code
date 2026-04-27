import json
import re
from pathlib import Path

from flask import Blueprint, flash, redirect, render_template, request, url_for


extraction = Blueprint('extraction', __name__)

BASE_DIR = Path(__file__).resolve().parent.parent / 'prompts' / 'extraction'
INDEX_FILE = BASE_DIR / 'index.json'
NAME_RE = re.compile(r'^[A-Za-z0-9_-]+$')


def _read_manifest():
    if not INDEX_FILE.exists():
        return []
    return json.loads(INDEX_FILE.read_text()).get('files', [])


def _write_manifest(files):
    INDEX_FILE.write_text(json.dumps({'files': files}, indent=2))


def _filename(stem):
    stem = (stem or '').strip()
    if not NAME_RE.fullmatch(stem):
        raise ValueError('invalid filename')
    return f'{stem}.md'


def _file_path(name):
    path = BASE_DIR / name
    if path.suffix != '.md' or path.parent != BASE_DIR:
        raise ValueError('invalid file path')
    return path


def _redirect(file=None):
    if file:
        return redirect(url_for('extraction.skills_page', file=file))
    return redirect(url_for('extraction.skills_page'))


@extraction.get('/skills')
def skills_page():
    files = _read_manifest()
    current = request.args.get('file') or (files[0] if files else '')
    try:
        content = _file_path(current).read_text() if current else ''
    except (ValueError, FileNotFoundError):
        current, content = '', ''
    return render_template(
        'skills.html',
        skills_files=files,
        skills_current_file=current,
        skills_current_stem=current[:-3] if current else '',
        skills_editor_content=content,
    )



@extraction.post('/skills/new')
def new_skill_page():
    files = _read_manifest()
    stem, counter, candidate = 'new_skill', 1, 'new_skill.md'
    while candidate in files:
        candidate = f'{stem}_{counter}.md'
        counter += 1
    _file_path(candidate).write_text('')
    _write_manifest(files + [candidate])
    flash('New skill created', 'success')
    return _redirect(candidate)



@extraction.post('/skills/save')
def save_skill_page():
    try:
        name = request.form.get('current_file', '')
        path = _file_path(name)
        if not path.exists():
            flash('File not found', 'error')
            return _redirect()
        path.write_text(request.form.get('content', ''))
        flash('Saved', 'success')
        return _redirect(name)
    except ValueError:
        flash('Invalid filename', 'error')
        return _redirect()


@extraction.post('/skills/rename')
def rename_skill_page():
    try:
        old_name = request.form.get('current_file', '')
        old_path = _file_path(old_name)
        if not old_path.exists():
            flash('File not found', 'error')
            return _redirect()
        new_name = _filename(request.form.get('filename'))
        new_path = _file_path(new_name)
        if new_path.exists():
            flash('File already exists', 'error')
            return _redirect(old_name)
        old_path.rename(new_path)
        _write_manifest([new_name if f == old_name else f for f in _read_manifest()])
        flash('Renamed', 'success')
        return _redirect(new_name)
    except ValueError:
        flash('Invalid filename', 'error')
        return _redirect()
