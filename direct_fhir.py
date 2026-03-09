"""
Direct FHIR Client - Fetches patient data using the FHIR URL and access token.
Resource types are discovered dynamically from the server — nothing is hardcoded.
"""
import requests
import logging

logger = logging.getLogger(__name__)


class DirectFHIRClient:

    def __init__(self, session_data: dict):
        self.base_url = session_data['fhir_base_url'].rstrip('/')
        self.patient_id = session_data['patient_id']
        self.headers = {
            'Authorization': f'Bearer {session_data["auth_token"]}',
            'Accept': 'application/fhir+json',
        }

    # -------------------------------------------------------------------------
    # HTTP
    # -------------------------------------------------------------------------

    def _get(self, endpoint: str, params: dict = None) -> dict:
        """Make a GET request to the FHIR server. Returns {} on failure."""
        url = f"{self.base_url}/{endpoint}"
        try:
            response = requests.get(url, headers=self.headers, params=params, timeout=30)
            response.raise_for_status()
            return response.json()
        except Exception as e:
            logger.error(f"FHIR request failed [{endpoint}]: {e}")
            return {}

    def _bundle_resources(self, data: dict) -> list:
        """Pull the resource list out of a FHIR Bundle response."""
        return [entry['resource'] for entry in data.get('entry', []) if 'resource' in entry]

    # -------------------------------------------------------------------------
    # Discovery
    # -------------------------------------------------------------------------

    def _supported_resource_types(self) -> list:
        """
        Ask the FHIR server what resource types it supports (via /metadata).
        Returns a list of (resource_type, search_param) tuples.
        Only includes resource types that can be searched by patient or subject.
        """
        metadata = self._get('metadata')
        supported = []

        for rest in metadata.get('rest', []):
            for resource in rest.get('resource', []):
                rtype = resource.get('type', '')
                if not rtype or rtype == 'Patient':
                    continue

                search_params = [sp.get('name') for sp in resource.get('searchParam', [])]

                if 'patient' in search_params:
                    supported.append((rtype, 'patient'))
                elif 'subject' in search_params:
                    supported.append((rtype, 'subject'))

        return supported

    # -------------------------------------------------------------------------
    # Fetching
    # -------------------------------------------------------------------------

    def _fetch(self, resource_type: str, search_param: str, extra_params: dict = None) -> list:
        """Fetch all resources of a given type for the current patient."""
        params = {search_param: self.patient_id, '_count': 100}
        if extra_params:
            params.update(extra_params)
        data = self._get(resource_type, params=params)
        return self._bundle_resources(data)

    def _fetch_all_records(self, resource_type: str) -> list:
        """
        Fetch ALL records of a resource type from the server — no patient filter.
        Follows pagination links until there are no more pages.
        """
        resources = []
        url = f"{self.base_url}/{resource_type}"

        while url:
            response = requests.get(url, headers=self.headers, timeout=30)
            response.raise_for_status()
            data = response.json()
            resources.extend(self._bundle_resources(data))
            url = next((l['url'] for l in data.get('link', []) if l.get('relation') == 'next'), None)
            logger.info(f"  {resource_type}: fetched {len(resources)} so far...")

        return resources

    def _patient_ref(self, resource: dict) -> str:
        """
        Extract the patient ID from a resource's subject or patient reference.
        FHIR references look like 'Patient/abc123' — we return just 'abc123'.
        """
        ref = (resource.get('subject') or resource.get('patient') or {}).get('reference', '')
        return ref.split('/')[-1] if ref else ''

    def _as_entry(self, resources: list) -> dict:
        """Wrap a resource list into the standard {count, resources, summary} shape."""
        return {
            'count': len(resources),
            'resources': resources,
            'summary': [self._flatten(r) for r in resources],
        }

    # -------------------------------------------------------------------------
    # Flattening
    # -------------------------------------------------------------------------

    def _display(self, codeable_concept: dict) -> str:
        """Get a human-readable name from a FHIR CodeableConcept."""
        if not codeable_concept:
            return ''
        text = codeable_concept.get('text', '')
        if text:
            return text
        coding = codeable_concept.get('coding', [])
        if coding:
            return coding[0].get('display', '')
        return ''

    def _flatten(self, resource: dict) -> dict:
        """
        Flatten any FHIR resource into a simple {name, status, date, value} dict.
        Same format for all resource types — no special cases per type.
        """
        # Name — try the common FHIR name fields
        name = (
            self._display(resource.get('code'))
            or self._display(resource.get('vaccineCode'))
            or self._display(resource.get('medicationCodeableConcept'))
            or (resource.get('medicationReference') or {}).get('display', '')
            or self._display((resource.get('type') or [{}])[0])
        )

        # Status — clinicalStatus (e.g. conditions) or plain status
        clinical = resource.get('clinicalStatus') or {}
        status = (clinical.get('coding') or [{}])[0].get('code') or resource.get('status', '')

        # Date — first date field that has a value
        date_fields = [
            'effectiveDateTime', 'issued', 'onsetDateTime', 'authoredOn',
            'occurrenceDateTime', 'performedDateTime', 'recordedDate',
        ]
        date = next((resource[f] for f in date_fields if resource.get(f)), '')
        if not date:
            date = (resource.get('period') or {}).get('start', '')
        if not date:
            date = (resource.get('performedPeriod') or {}).get('start', '')

        # Value — quantity, coded value, string, dosage, or component readings
        value = ''
        vq = resource.get('valueQuantity') or {}
        if vq.get('value') is not None:
            value = f"{vq['value']} {vq.get('unit', '')}".strip()

        if not value:
            value = self._display(resource.get('valueCodeableConcept'))

        if not value:
            value = resource.get('valueString', '')

        if not value:
            dosage = resource.get('dosageInstruction') or []
            value = dosage[0].get('text', '') if dosage else ''

        if not value and resource.get('component'):
            parts = []
            for comp in resource['component']:
                comp_name = self._display(comp.get('code') or {})
                comp_vq = comp.get('valueQuantity') or {}
                if comp_vq.get('value') is not None:
                    parts.append(f"{comp_name}: {comp_vq['value']} {comp_vq.get('unit', '')}".strip())
            value = '; '.join(parts)

        return {'name': name, 'status': status, 'date': date, 'value': value}

    # -------------------------------------------------------------------------
    # Patient info
    # -------------------------------------------------------------------------

    def _patient_info(self, resource: dict) -> dict:
        """Pull the key fields out of a Patient resource."""
        name = ''
        names = resource.get('name') or []
        if names:
            given = ' '.join(names[0].get('given') or [])
            family = names[0].get('family', '')
            name = f"{given} {family}".strip()

        return {
            'id':        resource.get('id'),
            'name':      name,
            'gender':    resource.get('gender'),
            'birthDate': resource.get('birthDate'),
            'telecom':   resource.get('telecom'),
            'address':   resource.get('address'),
        }

    # -------------------------------------------------------------------------
    # Public API
    # -------------------------------------------------------------------------

    def _fetch_locations(self, encounters: list) -> list:
        locations = []
        seen = set()

        for encounter in encounters:
            for loc in encounter.get('location', []):
                ref = loc.get('location', {}).get('reference', '')
                if not ref or ref in seen:
                    continue
                seen.add(ref)

                room = self._get(ref)
                ward_name = ''
                ward_ref = (room.get('partOf') or {}).get('reference', '')
                if ward_ref:
                    ward = self._get(ward_ref)
                    ward_name = ward.get('name', '')

                locations.append({
                    'name': room.get('name', ''),
                    'status': room.get('status', ''),
                    'date': '',
                    'value': ward_name,
                })

        return locations

    def get_patient_data(self) -> dict:
        """
        Fetch all data for a single patient.
        Discovers supported resource types from the FHIR server first,
        then fetches each one using the patient ID and access token.
        """
        logger.info(f"Fetching data for patient {self.patient_id}")

        patient_resource = self._get(f'Patient/{self.patient_id}')
        result = {'patient': self._patient_info(patient_resource)}

        for rtype, param in self._supported_resource_types():
            resources = self._fetch(rtype, param)
            logger.info(f"  {rtype}: {len(resources)} records")
            result[rtype.lower()] = self._as_entry(resources)

        # Vital signs are observations filtered by category
        vital_signs = self._fetch('Observation', 'patient', extra_params={'category': 'vital-signs'})
        result['vital_signs'] = self._as_entry(vital_signs)

        # Locations — follow encounter → room → ward chain
        encounters = result.get('encounter', {}).get('resources', [])
        location_records = self._fetch_locations(encounters)
        result['locations'] = {
            'count': len(location_records),
            'resources': location_records,
            'summary': location_records,
        }

        return result

    def get_all_patients_data(self) -> dict:
        """
        Fetch all patients and their clinical data efficiently.
        Instead of N x M requests (per patient x per resource type),
        we fetch all records of each type once, then group by patient ID.
        Total requests = 1 (patients) + M (one per resource type).
        """
        logger.info("Fetching all patients")

        bundle = self._get('Patient', params={'_count': 100})
        patients = [self._patient_info(e['resource']) for e in bundle.get('entry', []) if 'resource' in e]
        logger.info(f"Found {len(patients)} patients")

        # Index by ID for fast lookup when grouping records
        patients_by_id = {p['id']: p for p in patients if p.get('id')}
        for patient in patients:
            patient['data'] = {}

        # Fetch all records per resource type and group by patient
        for rtype, _ in self._supported_resource_types():
            all_records = self._fetch_all_records(rtype)
            for record in all_records:
                pid = self._patient_ref(record)
                if pid in patients_by_id:
                    patients_by_id[pid]['data'].setdefault(rtype.lower(), [])
                    patients_by_id[pid]['data'][rtype.lower()].append(self._flatten(record))

        # Vital signs — same approach, observations filtered by category
        all_vs = self._fetch_all_records('Observation?category=vital-signs')
        for record in all_vs:
            pid = self._patient_ref(record)
            if pid in patients_by_id:
                patients_by_id[pid]['data'].setdefault('vital_signs', [])
                patients_by_id[pid]['data']['vital_signs'].append(self._flatten(record))

        logger.info(f"Done. {len(patients)} patients with clinical data attached.")

        return {
            'patient': {'id': 'all', 'name': 'All Patients', 'count': len(patients)},
            'patients': patients,
        }


# -----------------------------------------------------------------------------
# Module-level helpers called by other parts of the app
# -----------------------------------------------------------------------------

def get_patient_data_direct(session_data: dict) -> dict:
    return DirectFHIRClient(session_data).get_patient_data()


def get_all_patients_data_direct(session_data: dict) -> dict:
    return DirectFHIRClient(session_data).get_all_patients_data()
