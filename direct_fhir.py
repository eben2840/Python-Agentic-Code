import requests
import logging

logger = logging.getLogger(__name__)

FHIR_DEFINITION_TYPES = {
    'SearchParameter', 'OperationDefinition', 'StructureDefinition',
    'ValueSet', 'CodeSystem', 'ConceptMap', 'NamingSystem',
    'CapabilityStatement', 'CompartmentDefinition', 'ImplementationGuide',
}

DATE_FIELDS = [
    'effectiveDateTime', 'issued', 'onsetDateTime', 'authoredOn',
    'occurrenceDateTime', 'performedDateTime', 'recordedDate',
]


class DirectFHIRClient:

    def __init__(self, session_data: dict):
        self.base_url = session_data['fhir_base_url'].rstrip('/')
        self.patient_id = session_data['patient_id']
        self.auth_token = session_data["auth_token"]
        self.headers = {
            'Authorization': f'Bearer {self.auth_token}',
            'Accept': 'application/fhir+json',
        }
        print(
            "[DIRECT-FHIR][INIT] "
            f"patient_id={self.patient_id!r} "
            f"base_url={self.base_url!r} "
            f"auth_present={bool(self.auth_token)}",
            flush=True,
        )

    def _get(self, endpoint, params=None):
        try:
            print(
                "[DIRECT-FHIR][GET] "
                f"url={self.base_url}/{endpoint} "
                f"params={params} "
                f"auth_present={bool(self.auth_token)}",
                flush=True,
            )
            r = requests.get(f"{self.base_url}/{endpoint}", headers=self.headers, params=params, timeout=30)
            r.raise_for_status()
            return r.json()
        except Exception as e:
            logger.error(f"FHIR request failed [{endpoint}]: {e}")
            return {}

    def _bundle(self, data):
        return [entry['resource'] for entry in data.get('entry', []) if 'resource' in entry]

    def _supported_resource_types(self):
        supported = []
        for rest in self._get('metadata').get('rest', []):
            for resource in rest.get('resource', []):
                rtype = resource.get('type', '')
                if not rtype:
                    continue
                search_params = [sp.get('name') for sp in resource.get('searchParam', [])]
                if 'patient' in search_params:
                    supported.append((rtype, 'patient'))
                elif 'subject' in search_params:
                    supported.append((rtype, 'subject'))
        return supported

    def _server_resource_types(self):
        resources = []
        for rest in self._get('metadata').get('rest', []):
            for resource in rest.get('resource', []):
                rtype = resource.get('type', '')
                if not rtype or rtype in FHIR_DEFINITION_TYPES:
                    continue
                resources.append(rtype)
        return resources

    def supported_resources(self):
        return [rtype for rtype, _ in self._supported_resource_types()]

    def server_resources(self):
        return self._server_resource_types()

    def _fetch(self, rtype, param, extra=None):
        params = {param: self.patient_id, '_count': 50}
        if extra:
            params.update(extra)
        return self._bundle(self._get(rtype, params=params))

    def search(self, rtype, params=None):
        return self._bundle(self._get(rtype, params=params))

    def read(self, reference):
        return self._get(reference)

    def fetch_all_resource(self, rtype):
        return self._fetch_all(rtype)

    def _fetch_all(self, rtype, max_records=50):
        resources = []
        url = f"{self.base_url}/{rtype}"
        while url and len(resources) < max_records:
            try:
                r = requests.get(url, headers=self.headers, timeout=30)
                r.raise_for_status()
                data = r.json()
            except Exception as e:
                logger.error(f"FHIR request failed while fetching all [{rtype}] at [{url}]: {e}")
                return resources

            resources.extend(self._bundle(data))
            url = next((link['url'] for link in data.get('link', []) if link.get('relation') == 'next'), None)
            logger.info(f"  {rtype}: {len(resources)} so far...")
        return resources[:max_records]

    def _patient_ref(self, resource):
        ref_obj = resource.get('subject') or resource.get('patient') or {}
        ref = ref_obj.get('reference', '')
        return ref.split('/')[-1] if ref else ''

    def _as_entry(self, resources):
        return {
            'count': len(resources),
            'resources': resources,
            'summary': [self._flatten(r) for r in resources],
        }

    def _display(self, concept):
        if not concept:
            return ''
        if isinstance(concept, str):
            return concept
        return concept.get('text') or (concept.get('coding') or [{}])[0].get('display', '')

    def _flatten(self, r):
        name = (
            self._display(r.get('code'))
            or self._display(r.get('vaccineCode'))
            or self._display(r.get('medicationCodeableConcept'))
            or (r.get('medicationReference') or {}).get('display', '')
            or (r.get('name') if isinstance(r.get('name'), str) else '')
            #   or self._display((r.get('type') or [{}])[0])
            or self._display((r.get('type') if isinstance(r.get('type'), list) else [r.get('type') or {}])[0])
        )

        clinical_status = r.get('clinicalStatus') or {}
        status = (clinical_status.get('coding') or [{}])[0].get('code') or r.get('status', '')

        date = (
            next((r[f] for f in DATE_FIELDS if r.get(f)), '')
            or (r.get('period') or {}).get('start', '')
            or (r.get('performedPeriod') or {}).get('start', '')
        )

        vq = r.get('valueQuantity') or {}
        dosage = r.get('dosageInstruction') or []
        value = (
            (f"{vq['value']} {vq.get('unit', '')}".strip() if vq.get('value') is not None else '')
            or self._display(r.get('valueCodeableConcept'))
            or r.get('valueString', '')
            or (dosage[0].get('text', '') if dosage else '')
        )

        if not value and r.get('component'):
            parts = []
            for c in r['component']:
                cq = c.get('valueQuantity') or {}
                if cq.get('value') is not None:
                    parts.append(f"{self._display(c.get('code') or {})}: {cq['value']} {cq.get('unit', '')}".strip())
            value = '; '.join(parts)

        return {'name': name, 'status': status, 'date': date, 'value': value}

    def _patient_info(self, r):
        names = r.get('name') or []
        if names:
            given = ' '.join(names[0].get('given') or [])
            family = names[0].get('family', '')
            full_name = f"{given} {family}".strip()
        else:
            full_name = ''
        return {
            'id': r.get('id'),
            'name': full_name,
            'gender': r.get('gender'),
            'birthDate': r.get('birthDate'),
            'telecom': r.get('telecom'),
            'address': r.get('address'),
        }

    def patient_info(self, patient_id=None):
        return self._patient_info(self._get(f"Patient/{patient_id or self.patient_id}"))

    def entry(self, resources):
        return self._as_entry(resources)

    def _fetch_locations(self, encounters):
        locations = []
        seen = set()
        for encounter in encounters:
            for loc in encounter.get('location', []):
                ref = loc.get('location', {}).get('reference', '')
                if not ref or ref in seen:
                    continue
                seen.add(ref)
                room = self._get(ref)
                ward_ref = (room.get('partOf') or {}).get('reference', '')
                ward_name = self._get(ward_ref).get('name', '') if ward_ref else ''
                locations.append({
                    'name': room.get('name', ''),
                    'status': room.get('status', ''),
                    'date': '',
                    'value': ward_name,
                })
        return locations

    def get_patient_data(self):
        logger.info(f"Fetching data for patient {self.patient_id}")
        result = {'patient': self._patient_info(self._get(f'Patient/{self.patient_id}'))}

        for rtype, param in self._supported_resource_types():
            result[rtype] = self._as_entry(self._fetch(rtype, param))
            logger.info(f"  {rtype}: {result[rtype]['count']} records")

        result['vital_signs'] = self._as_entry(self._fetch('Observation', 'patient', {'category': 'vital-signs'}))

        encounters = result.get('Encounter', {}).get('resources', [])
        location_records = self._fetch_locations(encounters)
        result['locations'] = {'count': len(location_records), 'resources': location_records, 'summary': location_records}

        return result

    def get_all_patients_data(self):
        logger.info("Fetching all patients")
        patients = [self._patient_info(e['resource']) for e in self._get('Patient', params={'_count': 100}).get('entry', []) if 'resource' in e]
        logger.info(f"Found {len(patients)} patients")

        patients_by_id = {p['id']: p for p in patients if p.get('id')}
        for p in patients:
            p['data'] = {}

        context = {}

        for rtype, _ in self._supported_resource_types():
            all_records = self._fetch_all(rtype)
            print(f"[ALL-PATIENTS] {rtype}: fetched {len(all_records)} records", flush=True)
            matched = 0
            for record in all_records:
                pid = self._patient_ref(record)
                if pid in patients_by_id:
                    patients_by_id[pid]['data'].setdefault(rtype, []).append(self._flatten(record))
                    matched += 1
            if all_records and matched == 0:
                context[rtype] = self._as_entry(all_records)

        all_vs = self._fetch_all('Observation?category=vital-signs')
        print(f"[ALL-PATIENTS] vital_signs: fetched {len(all_vs)} records", flush=True)
        for record in all_vs:
            pid = self._patient_ref(record)
            if pid in patients_by_id:
                patients_by_id[pid]['data'].setdefault('vital_signs', []).append(self._flatten(record))

        for p in patients:
            print(f"[ALL-PATIENTS] patient={p['id']} data={ {k: len(v) for k, v in p['data'].items()} }", flush=True)
        logger.info(f"Done. {len(patients)} patients with clinical data attached.")

        # Fetch truly standalone resources (no patient/subject search param at all)
        for rest in self._get('metadata').get('rest', []):
            for resource in rest.get('resource', []):
                rtype = resource.get('type', '')
                if not rtype or rtype in FHIR_DEFINITION_TYPES:
                    continue
                search_params = [sp.get('name') for sp in resource.get('searchParam', [])]
                if 'patient' not in search_params and 'subject' not in search_params:
                    records = self._fetch_all(rtype)
                    print(f"[ALL-PATIENTS] {rtype}: fetched {len(records)} records", flush=True)
                    if records:
                        context[rtype] = self._as_entry(records)

        return {
            'patient': {'id': 'all', 'name': 'All Patients', 'count': len(patients)},
            'patients': patients,
            **context,
        }

    def get_selected_all_patients_data(self, resource_types):
        logger.info("Fetching selected all-patient data")
        patients = [self._patient_info(resource) for resource in self._fetch_all('Patient')]
        patients_by_id = {p['id']: p for p in patients if p.get('id')}
        for patient in patients:
            patient['data'] = {}

        selected = list(dict.fromkeys(resource_types))
        context = {}

        for rtype in selected:
            all_records = self._fetch_all(rtype)
            print(f"[ALL-PATIENTS] {rtype}: fetched {len(all_records)} records", flush=True)
            matched = 0
            for record in all_records:
                pid = self._patient_ref(record)
                if pid in patients_by_id:
                    patients_by_id[pid]['data'].setdefault(rtype, []).append(self._flatten(record))
                    matched += 1
            if all_records and matched == 0:
                context[rtype] = self._as_entry(all_records)

        return {
            'patient': {'id': 'all', 'name': 'All Patients', 'count': len(patients)},
            'patients': patients,
            **context,
        }


def get_patient_data_direct(session_data):
    return DirectFHIRClient(session_data).get_patient_data()


def get_all_patients_data_direct(session_data):
    return DirectFHIRClient(session_data).get_all_patients_data()


def get_selected_all_patients_data_direct(session_data, resource_types):
    return DirectFHIRClient(session_data).get_selected_all_patients_data(resource_types)
