"""
Direct FHIR Client - Fetch patient data directly using session credentials
"""
import requests
import logging
from typing import Dict, List, Optional

logger = logging.getLogger(__name__)


class DirectFHIRClient:
    """Direct FHIR client using session credentials"""

    def __init__(self, session_data: Dict):
        self.base_url = session_data['fhir_base_url'].rstrip('/')
        self.patient_id = session_data['patient_id']
        self.headers = {
            'Authorization': f'Bearer {session_data["auth_token"]}',
            'Accept': 'application/fhir+json',
            'Content-Type': 'application/fhir+json'
        }

    def _fhir_request(self, endpoint: str, params: Dict = None) -> Optional[Dict]:
        """Make FHIR request"""
        url = f"{self.base_url}/{endpoint}"
        try:
            response = requests.get(url, headers=self.headers, params=params, timeout=30)
            response.raise_for_status()
            return response.json()
        except Exception as e:
            logger.error(f"FHIR request failed for {endpoint}: {e}")
            return None

    def get_patient_data(self) -> Dict:
        """Get comprehensive patient data with summaries for LLM consumption"""
        logger.info(f"Fetching patient data for: {self.patient_id}")

        # FHIR resource types to fetch
        resources = {
            'patient': f'Patient/{self.patient_id}',
            'observations': f'Observation?patient={self.patient_id}&_count=100&_sort=-date',
            'conditions': f'Condition?patient={self.patient_id}&_count=100',
            'medications': f'MedicationRequest?patient={self.patient_id}&_count=100',
            'encounters': f'Encounter?patient={self.patient_id}&_count=50&_sort=-date',
            'procedures': f'Procedure?patient={self.patient_id}&_count=100',
            'allergies': f'AllergyIntolerance?patient={self.patient_id}&_count=100',
            'immunizations': f'Immunization?patient={self.patient_id}&_count=100',
            'care_plans': f'CarePlan?patient={self.patient_id}&_count=100',
            'diagnostic_reports': f'DiagnosticReport?patient={self.patient_id}&_count=100',
            'vital_signs': f'Observation?patient={self.patient_id}&category=vital-signs&_count=100&_sort=-date'
        }

        # Fetch all resources
        patient_data = {}
        for resource_type, endpoint in resources.items():
            data = self._fhir_request(endpoint)
            if data:
                if resource_type == 'patient':
                    patient_data[resource_type] = self._extract_patient_info(data)
                else:
                    # Extract entries from bundle
                    entries = data.get('entry', [])
                    raw_resources = [entry['resource'] for entry in entries]

                    # Create summarized format for LLM consumption
                    patient_data[resource_type] = {
                        'count': len(raw_resources),
                        'resources': raw_resources,
                        'summary': self._summarize_resources(resource_type, raw_resources)
                    }
                    logger.info(f"Fetched {len(raw_resources)} {resource_type}")
            else:
                patient_data[resource_type] = {
                    'count': 0,
                    'resources': [],
                    'summary': []
                }

        return patient_data

    def _extract_patient_info(self, patient_resource: Dict) -> Dict:
        """Extract patient information"""
        patient = {
            'id': patient_resource.get('id'),
            'name': 'Unknown Patient',
            'gender': patient_resource.get('gender'),
            'birthDate': patient_resource.get('birthDate'),
            'active': patient_resource.get('active', True)
        }

        # Extract name
        if 'name' in patient_resource and patient_resource['name']:
            name_obj = patient_resource['name'][0]
            given = ' '.join(name_obj.get('given', []))
            family = name_obj.get('family', '')
            patient['name'] = f"{given} {family}".strip()

        # Extract contact info
        if 'telecom' in patient_resource:
            patient['telecom'] = patient_resource['telecom']

        if 'address' in patient_resource:
            patient['address'] = patient_resource['address']

        return patient

    def _summarize_resources(self, resource_type: str, resources: List[Dict]) -> List[Dict]:
        """Summarize resources based on type for LLM consumption"""
        if resource_type in ['observations', 'vital_signs']:
            return self._summarize_observations(resources)
        elif resource_type == 'conditions':
            return self._summarize_conditions(resources)
        elif resource_type == 'medications':
            return self._summarize_medications(resources)
        elif resource_type == 'allergies':
            return self._summarize_allergies(resources)
        elif resource_type == 'encounters':
            return self._summarize_encounters(resources)
        elif resource_type == 'procedures':
            return self._summarize_procedures(resources)
        elif resource_type == 'immunizations':
            return self._summarize_immunizations(resources)
        else:
            return []

    def _summarize_observations(self, observations: List[Dict]) -> List[Dict]:
        """Create a simplified summary of observations"""
        summary = []
        for obs in observations[:50]:  # Limit to recent 50
            try:
                # Get the LOINC code
                code = None
                code_text = None
                coding = obs.get('code', {}).get('coding', [])
                if coding:
                    code = coding[0].get('code')
                    code_text = coding[0].get('display')
                if not code_text:
                    code_text = obs.get('code', {}).get('text', 'Unknown')

                value = None
                unit = None
                if 'valueQuantity' in obs:
                    value = obs['valueQuantity'].get('value')
                    unit = obs['valueQuantity'].get('unit', '')
                elif 'valueCodeableConcept' in obs:
                    value = obs['valueCodeableConcept'].get('text') or \
                           obs['valueCodeableConcept'].get('coding', [{}])[0].get('display')
                elif 'valueString' in obs:
                    value = obs['valueString']
                elif 'component' in obs:
                    # Handle component observations (like blood pressure)
                    components = []
                    for comp in obs['component']:
                        comp_display = comp.get('code', {}).get('coding', [{}])[0].get('display', '')
                        comp_value = comp.get('valueQuantity', {}).get('value')
                        comp_unit = comp.get('valueQuantity', {}).get('unit', '')
                        if comp_value is not None:
                            components.append(f"{comp_display}: {comp_value} {comp_unit}")
                    value = '; '.join(components) if components else None

                summary.append({
                    'code': code or code_text,
                    'display': code_text,
                    'value': value,
                    'unit': unit,
                    'date': obs.get('effectiveDateTime') or obs.get('issued'),
                    'status': obs.get('status')
                })
            except Exception as e:
                logger.warning(f"Error summarizing observation: {e}")
                continue
        return summary

    def _summarize_conditions(self, conditions: List[Dict]) -> List[Dict]:
        """Create a simplified summary of conditions"""
        summary = []
        for cond in conditions:
            try:
                code_text = cond.get('code', {}).get('text') or \
                           cond.get('code', {}).get('coding', [{}])[0].get('display', 'Unknown')

                clinical_status = None
                if 'clinicalStatus' in cond:
                    clinical_status = cond['clinicalStatus'].get('coding', [{}])[0].get('code')

                summary.append({
                    'condition': code_text,
                    'status': clinical_status,
                    'onset': cond.get('onsetDateTime'),
                    'severity': cond.get('severity', {}).get('text') if cond.get('severity') else None
                })
            except Exception as e:
                logger.warning(f"Error summarizing condition: {e}")
                continue
        return summary

    def _summarize_medications(self, medications: List[Dict]) -> List[Dict]:
        """Create a simplified summary of medications"""
        summary = []
        for med in medications:
            try:
                med_text = None
                if 'medicationCodeableConcept' in med:
                    med_text = med['medicationCodeableConcept'].get('text') or \
                              med['medicationCodeableConcept'].get('coding', [{}])[0].get('display')
                elif 'medicationReference' in med:
                    med_text = med['medicationReference'].get('display', 'Unknown medication')

                dosage = None
                if 'dosageInstruction' in med and len(med['dosageInstruction']) > 0:
                    dosage = med['dosageInstruction'][0].get('text')

                summary.append({
                    'medication': med_text,
                    'status': med.get('status'),
                    'dosage': dosage,
                    'authoredOn': med.get('authoredOn')
                })
            except Exception as e:
                logger.warning(f"Error summarizing medication: {e}")
                continue
        return summary

    def _summarize_allergies(self, allergies: List[Dict]) -> List[Dict]:
        """Create a simplified summary of allergies"""
        summary = []
        for allergy in allergies:
            try:
                code_text = allergy.get('code', {}).get('text') or \
                           allergy.get('code', {}).get('coding', [{}])[0].get('display', 'Unknown')

                clinical_status = None
                if 'clinicalStatus' in allergy:
                    clinical_status = allergy['clinicalStatus'].get('coding', [{}])[0].get('code')

                summary.append({
                    'allergen': code_text,
                    'type': allergy.get('type'),
                    'category': allergy.get('category', []),
                    'criticality': allergy.get('criticality'),
                    'status': clinical_status
                })
            except Exception as e:
                logger.warning(f"Error summarizing allergy: {e}")
                continue
        return summary

    def _summarize_encounters(self, encounters: List[Dict]) -> List[Dict]:
        """Create a simplified summary of encounters"""
        summary = []
        for enc in encounters[:20]:
            try:
                enc_type = 'Unknown'
                if 'type' in enc and enc['type']:
                    enc_type = enc['type'][0].get('text') or \
                              enc['type'][0].get('coding', [{}])[0].get('display', 'Unknown')

                summary.append({
                    'type': enc_type,
                    'status': enc.get('status'),
                    'class': enc.get('class', {}).get('code') if enc.get('class') else None,
                    'period_start': enc.get('period', {}).get('start') if enc.get('period') else None,
                    'period_end': enc.get('period', {}).get('end') if enc.get('period') else None
                })
            except Exception as e:
                logger.warning(f"Error summarizing encounter: {e}")
                continue
        return summary

    def _summarize_procedures(self, procedures: List[Dict]) -> List[Dict]:
        """Create a simplified summary of procedures"""
        summary = []
        for proc in procedures:
            try:
                proc_text = proc.get('code', {}).get('text') or \
                           proc.get('code', {}).get('coding', [{}])[0].get('display', 'Unknown')

                summary.append({
                    'procedure': proc_text,
                    'status': proc.get('status'),
                    'performedDateTime': proc.get('performedDateTime') or proc.get('performedPeriod', {}).get('start')
                })
            except Exception as e:
                logger.warning(f"Error summarizing procedure: {e}")
                continue
        return summary

    def _summarize_immunizations(self, immunizations: List[Dict]) -> List[Dict]:
        """Create a simplified summary of immunizations"""
        summary = []
        for imm in immunizations:
            try:
                vaccine_text = imm.get('vaccineCode', {}).get('text') or \
                              imm.get('vaccineCode', {}).get('coding', [{}])[0].get('display', 'Unknown')

                summary.append({
                    'vaccine': vaccine_text,
                    'status': imm.get('status'),
                    'occurrenceDateTime': imm.get('occurrenceDateTime')
                })
            except Exception as e:
                logger.warning(f"Error summarizing immunization: {e}")
                continue
        return summary


def get_patient_data_direct(session_data: Dict) -> Dict:
    """Get patient data directly using session credentials"""
    client = DirectFHIRClient(session_data)
    return client.get_patient_data()
