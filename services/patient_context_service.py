import uuid
from dataclasses import dataclass
from datetime import datetime
from typing import Optional

from direct_fhir import get_all_patients_data_direct, get_patient_data_direct
from models import db, PatientSession


@dataclass(frozen=True)
class PatientContextResult:
    session: PatientSession
    patient_data: dict
    patient_name: str
    reused: bool


def _session_query(
    patient_id: Optional[str] = None,
    fhir_base_url: Optional[str] = None,
    access_token: Optional[str] = None,
):
    query = PatientSession.query

    if patient_id:
        query = query.filter_by(patient_id=patient_id)
    if fhir_base_url:
        query = query.filter_by(fhir_base_url=fhir_base_url)
    if access_token:
        query = query.filter_by(auth_token=access_token)

    return query.order_by(PatientSession.last_accessed.desc())


def _latest_session(
    patient_id: Optional[str] = None,
    fhir_base_url: Optional[str] = None,
    access_token: Optional[str] = None,
):
    return _session_query(
        patient_id=patient_id,
        fhir_base_url=fhir_base_url,
        access_token=access_token,
    ).first()


def _fetch_patient_data(session_data: dict):
    patient_id = session_data['patient_id']
    if patient_id == 'all':
        return get_all_patients_data_direct(session_data)
    return get_patient_data_direct(session_data)


def _derive_patient_name(patient_id: str, patient_data: dict):
    if patient_id == 'all':
        count = patient_data.get('patient', {}).get('count', 0)
        return f"All Patients ({count} total)"
    return patient_data.get('patient', {}).get('name') or f"Patient {patient_id}"


def _touch_session(session: PatientSession, access_token: str):
    session.auth_token = access_token
    session.last_accessed = datetime.utcnow()
    db.session.commit()
    return session


def _save_session(session: Optional[PatientSession], patient_id: str, fhir_base_url: str, access_token: str, patient_data: dict):
    patient_name = _derive_patient_name(patient_id, patient_data)
    session = session or PatientSession(id=str(uuid.uuid4()), patient_id=patient_id, fhir_base_url=fhir_base_url, auth_token=access_token)
    session.patient_name = patient_name
    session.auth_token = access_token
    session.patient_data = patient_data
    session.last_accessed = datetime.utcnow()
    db.session.add(session)
    db.session.commit()
    return session, patient_name


def load_patient_context(patient_id: str, fhir_base_url: str, access_token: str, refresh: bool = False):
    session = None if refresh else _latest_session(
        patient_id=patient_id,
        fhir_base_url=fhir_base_url,
        access_token=access_token,
    )
    if session and session.patient_data:
        session = _touch_session(session, access_token)
        return PatientContextResult(session=session, patient_data=session.patient_data, patient_name=session.patient_name or _derive_patient_name(patient_id, session.patient_data), reused=True)

    session_data = {'fhir_base_url': fhir_base_url, 'patient_id': patient_id, 'auth_token': access_token}
    patient_data = _fetch_patient_data(session_data)
    session, patient_name = _save_session(session, patient_id, fhir_base_url, access_token, patient_data)
    return PatientContextResult(session=session, patient_data=patient_data, patient_name=patient_name, reused=False)


def load_latest_patient_session(
    patient_id: Optional[str] = None,
    fhir_base_url: Optional[str] = None,
    access_token: Optional[str] = None,
):
    session = _latest_session(
        patient_id=patient_id,
        fhir_base_url=fhir_base_url,
        access_token=access_token,
    )
    if session:
        return session

    if patient_id or fhir_base_url:
        return _latest_session(patient_id=patient_id, fhir_base_url=fhir_base_url)

    if access_token:
        return _latest_session(access_token=access_token)

    return _latest_session()
