from direct_fhir import DirectFHIRClient
from services.fhir_resource_allowlist import ALL_PATIENT_RESOURCES


def execute_retrieval(plan, fhir_base_url: str, access_token: str, patient_id: str) -> dict:
    if patient_id == 'all':
        return _execute_all_patient_retrieval(plan, fhir_base_url, access_token)
    client = DirectFHIRClient(_session_data(fhir_base_url, access_token, patient_id))
    patient = _patient_payload(client, patient_id)
    print(f"[RETRIEVAL-EXECUTOR] Starting retrieval for patient={patient_id} at {fhir_base_url}", flush=True)
    print(f"[RETRIEVAL-EXECUTOR] Patient payload: {patient}", flush=True)
    sections = {query.resource.lower(): _fetch_section(client, query, patient_id) for query in plan.queries}
    print(f"[RETRIEVAL-EXECUTOR] Retrieved sections: {list(sections.keys())}", flush=True)
    return {'patient': patient, **sections}


def get_supported_resources(fhir_base_url: str, access_token: str, patient_id: str) -> list[str]:
    if patient_id == 'all':
        resources = ALL_PATIENT_RESOURCES
        print(f"[RETRIEVAL-EXECUTOR] Supported resources for patient=all from allowlist: {resources}", flush=True)
        return resources

    client = DirectFHIRClient(_session_data(fhir_base_url, access_token, patient_id))
    resources = client.supported_resources()
    print(f"[RETRIEVAL-EXECUTOR] Supported resources for patient={patient_id}: {resources}", flush=True)
    return resources

# def get_supported_resources(fhir_base_url: str, access_token: str, patient_id: str) -> list[str]:
#     client = DirectFHIRClient(_session_data(fhir_base_url, access_token, patient_id))
#     resources = client.server_resources() if patient_id == 'all' else client.supported_resources()
#     print(f"[RETRIEVAL-EXECUTOR] Supported resources for patient={patient_id}: {resources}", flush=True)
#     return resources


def _fetch_section(client: DirectFHIRClient, query, patient_id: str) -> dict:
    print(f"[RETRIEVAL-EXECUTOR] Fetching {query.resource} for patient={patient_id}", flush=True)
    resources = _fetch_resources(client, query.resource, patient_id)
    section = client.entry(resources)
    print(f"[RETRIEVAL-EXECUTOR] {query.resource} returned count={section.get('count', 0)}", flush=True)
    return section


def _patient_payload(client: DirectFHIRClient, patient_id: str) -> dict:
    if patient_id == 'all':
        return {'id': 'all', 'name': 'All Patients', 'count': 0}
    return client.patient_info(patient_id)


def _fetch_resources(client: DirectFHIRClient, resource: str, patient_id: str):
    param = _resource_param(client, resource)
    return client.search(resource, {param: patient_id, '_count': 100})


def _resource_param(client: DirectFHIRClient, resource: str) -> str:
    supported = dict(client._supported_resource_types())
    return supported.get(resource, 'patient')


def _session_data(fhir_base_url: str, access_token: str, patient_id: str) -> dict:
    return {
        'fhir_base_url': fhir_base_url,
        'auth_token': access_token,
        'patient_id': patient_id,
    }


def _execute_all_patient_retrieval(plan, fhir_base_url: str, access_token: str) -> dict:
    client = DirectFHIRClient(_session_data(fhir_base_url, access_token, 'all'))
    encounters = client._bundle(client._get('Encounter', params={'status': 'in-progress', '_count': 50}))
    active_ids = {e.get('subject', {}).get('reference', '').split('/')[-1] for e in encounters if e.get('subject', {}).get('reference')}
    print(f"[RETRIEVAL-EXECUTOR] Active encounters: {len(encounters)}", flush=True)
    sections = {'encounter': client.entry(encounters)}
    for resource in [q.resource for q in plan.queries if q.resource not in ('Patient', 'Encounter')]:
        sections[resource.lower()] = client.entry(client.fetch_all_resource(resource))
    patients = _group_patients(client, sections)
    patients = [p for p in patients if p['id'] in active_ids]
    print(f"[RETRIEVAL-EXECUTOR] Active patients: {len(patients)}", flush=True)
    location_records = client._fetch_locations(encounters)
    return {
        'patient': {'id': 'all', 'name': 'All Patients', 'count': len(patients)},
        'patients': patients,
        'location': client.entry(location_records),
    }


def _group_patients(client: DirectFHIRClient, sections: dict) -> list[dict]:
    grouped = {}
    for resource in sections.get('patient', {}).get('resources', []):
        patient_id = resource.get('id')
        if not patient_id:
            continue
        patient = grouped.setdefault(patient_id, _patient_stub(patient_id))
        _merge_patient_details(patient, client._patient_info(resource), resource)

    for resource_type, section in sections.items():
        if resource_type == 'patient':
            continue
        for resource in section.get('resources', []):
            patient_id = client._patient_ref(resource)
            if not patient_id:
                continue
            patient = grouped.setdefault(patient_id, _patient_stub(patient_id))
            patient['data'].setdefault(resource_type, []).append(client._flatten(resource))

    for patient_id, patient in grouped.items():
        if patient.get('resource'):
            continue
        resource = client.read(f'Patient/{patient_id}')
        if resource and resource.get('resourceType') == 'Patient':
            _merge_patient_details(patient, client._patient_info(resource), resource)
    return list(grouped.values())


def _patient_stub(patient_id: str) -> dict:
    return {
        'id': patient_id,
        'name': f"Patient {patient_id}",
        'gender': None,
        'birthDate': None,
        'telecom': None,
        'address': None,
        'resource': None,
        'data': {},
    }


def _merge_patient_details(patient: dict, info: dict, resource: dict) -> None:
    patient.update({
        'id': info.get('id') or patient['id'],
        'name': info.get('name') or patient['name'],
        'gender': info.get('gender'),
        'birthDate': info.get('birthDate'),
        'telecom': info.get('telecom'),
        'address': info.get('address'),
        'resource': resource,
    })
