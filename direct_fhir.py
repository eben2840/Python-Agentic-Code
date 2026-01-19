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
        """Get comprehensive patient data"""
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
                    patient_data[resource_type] = [entry['resource'] for entry in entries]
                    logger.info(f"Fetched {len(patient_data[resource_type])} {resource_type}")
            else:
                patient_data[resource_type] = []
        
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


def get_patient_data_direct(session_data: Dict) -> Dict:
    """Get patient data directly using session credentials"""
    client = DirectFHIRClient(session_data)
    return client.get_patient_data()
