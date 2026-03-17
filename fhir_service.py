"""
FHIR Service Module
Handles communication with FHIR servers to fetch patient data
"""

import requests
from typing import Dict, List, Optional, Any
import logging

logger = logging.getLogger(__name__)


class FHIRService:
    """Service for interacting with FHIR servers"""

    def __init__(self, base_url: str, access_token: str):
        """
        Initialize FHIR service
        
        Args:
            base_url: FHIR server base URL (e.g., https://fhir.example.com/r4)
            access_token: OAuth2 access token for authentication
        """
        self.base_url = base_url.rstrip('/')
        self.access_token = access_token
        self.headers = {
            'Authorization': f'Bearer {access_token}',
            'Accept': 'application/fhir+json',
            'Content-Type': 'application/fhir+json'
        }

    def _make_request(self, endpoint: str, params: Optional[Dict] = None) -> Optional[Dict]:
        """Make authenticated request to FHIR server"""
        url = f"{self.base_url}/{endpoint}"
        try:
            response = requests.get(url, headers=self.headers, params=params, timeout=30)
            response.raise_for_status()
            return response.json()
        except requests.exceptions.RequestException as e:
            logger.error(f"FHIR request failed: {e}")
            return None

    def get_patient(self, patient_id: str) -> Optional[Dict]:
        """
        Get patient demographics
        
        Args:
            patient_id: FHIR Patient resource ID
            
        Returns:
            Patient resource or None
        """
        return self._make_request(f"Patient/{patient_id}")

    def get_patient_observations(self, patient_id: str, count: int = 100) -> List[Dict]:
        """
        Get patient observations (vitals, lab results, etc.)
        
        Args:
            patient_id: FHIR Patient resource ID
            count: Maximum number of results
            
        Returns:
            List of Observation resources
        """
        result = self._make_request("Observation", {
            'patient': patient_id,
            '_count': count,
            '_sort': '-date'
        })
        if result and 'entry' in result:
            return [entry['resource'] for entry in result['entry']]
        return []

    def get_patient_conditions(self, patient_id: str) -> List[Dict]:
        """
        Get patient conditions/diagnoses
        
        Args:
            patient_id: FHIR Patient resource ID
            
        Returns:
            List of Condition resources
        """
        result = self._make_request("Condition", {
            'patient': patient_id,
            '_count': 100
        })
        if result and 'entry' in result:
            return [entry['resource'] for entry in result['entry']]
        return []

    def get_patient_medications(self, patient_id: str) -> List[Dict]:
        """
        Get patient medication requests/orders
        
        Args:
            patient_id: FHIR Patient resource ID
            
        Returns:
            List of MedicationRequest resources
        """
        result = self._make_request("MedicationRequest", {
            'patient': patient_id,
            '_count': 100
        })
        if result and 'entry' in result:
            return [entry['resource'] for entry in result['entry']]
        return []

    def get_patient_allergies(self, patient_id: str) -> List[Dict]:
        """
        Get patient allergies/intolerances
        
        Args:
            patient_id: FHIR Patient resource ID
            
        Returns:
            List of AllergyIntolerance resources
        """
        result = self._make_request("AllergyIntolerance", {
            'patient': patient_id,
            '_count': 100
        })
        if result and 'entry' in result:
            return [entry['resource'] for entry in result['entry']]
        return []

    def get_patient_encounters(self, patient_id: str, count: int = 50) -> List[Dict]:
        """
        Get patient encounters/visits
        
        Args:
            patient_id: FHIR Patient resource ID
            count: Maximum number of results
            
        Returns:
            List of Encounter resources
        """
        result = self._make_request("Encounter", {
            'patient': patient_id,
            '_count': count,
            '_sort': '-date'
        })
        if result and 'entry' in result:
            return [entry['resource'] for entry in result['entry']]
        return []

    def get_patient_procedures(self, patient_id: str) -> List[Dict]:
        """
        Get patient procedures
        
        Args:
            patient_id: FHIR Patient resource ID
            
        Returns:
            List of Procedure resources
        """
        result = self._make_request("Procedure", {
            'patient': patient_id,
            '_count': 100
        })
        if result and 'entry' in result:
            return [entry['resource'] for entry in result['entry']]
        return []

    def get_patient_immunizations(self, patient_id: str) -> List[Dict]:
        """
        Get patient immunization records
        
        Args:
            patient_id: FHIR Patient resource ID
            
        Returns:
            List of Immunization resources
        """
        result = self._make_request("Immunization", {
            'patient': patient_id,
            '_count': 100
        })
        if result and 'entry' in result:
            return [entry['resource'] for entry in result['entry']]
        return []

    def get_patient_care_plans(self, patient_id: str) -> List[Dict]:
        """
        Get patient care plans
        
        Args:
            patient_id: FHIR Patient resource ID
            
        Returns:
            List of CarePlan resources
        """
        result = self._make_request("CarePlan", {
            'patient': patient_id,
            '_count': 100
        })
        if result and 'entry' in result:
            return [entry['resource'] for entry in result['entry']]
        return []

    def get_full_patient_data(self, patient_id: str) -> Dict[str, Any]:
        """
        Get comprehensive patient data including all relevant resources
        
        Args:
            patient_id: FHIR Patient resource ID
            
        Returns:
            Dictionary containing all patient data
        """
        logger.info(f"Fetching full patient data for patient: {patient_id}")
        
        patient = self.get_patient(patient_id)
        
        # Extract patient name
        patient_name = "Unknown"
        if patient and 'name' in patient:
            names = patient['name']
            if names and len(names) > 0:
                name_obj = names[0]
                given = ' '.join(name_obj.get('given', []))
                family = name_obj.get('family', '')
                patient_name = f"{given} {family}".strip()

        # Fetch all resources
        observations = self.get_patient_observations(patient_id)
        conditions = self.get_patient_conditions(patient_id)
        medications = self.get_patient_medications(patient_id)
        allergies = self.get_patient_allergies(patient_id)
        encounters = self.get_patient_encounters(patient_id)
        procedures = self.get_patient_procedures(patient_id)
        immunizations = self.get_patient_immunizations(patient_id)
        care_plans = self.get_patient_care_plans(patient_id)

        # Create summary
        patient_data = {
            'patient': {
                'id': patient_id,
                'name': patient_name,
                'gender': patient.get('gender') if patient else None,
                'birthDate': patient.get('birthDate') if patient else None,
                'resource': patient
            },
            'observations': {
                'count': len(observations),
                'resources': observations,
                'summary': self._summarize_observations(observations)
            },
            'conditions': {
                'count': len(conditions),
                'resources': conditions,
                'summary': self._summarize_conditions(conditions)
            },
            'medications': {
                'count': len(medications),
                'resources': medications,
                'summary': self._summarize_medications(medications)
            },
            'allergies': {
                'count': len(allergies),
                'resources': allergies,
                'summary': self._summarize_allergies(allergies)
            },
            'encounters': {
                'count': len(encounters),
                'resources': encounters
            },
            'procedures': {
                'count': len(procedures),
                'resources': procedures
            },
            'immunizations': {
                'count': len(immunizations),
                'resources': immunizations
            },
            'care_plans': {
                'count': len(care_plans),
                'resources': care_plans
            }
        }

        logger.info(f"Fetched patient data: {len(observations)} observations, "
                   f"{len(conditions)} conditions, {len(medications)} medications")

        return patient_data

    def _summarize_observations(self, observations: List[Dict]) -> List[Dict]:
        """Create a simplified summary of observations"""
        summary = []
        for obs in observations[:20]:  # Limit to recent 20
            try:
                code_text = obs.get('code', {}).get('text') or \
                           obs.get('code', {}).get('coding', [{}])[0].get('display', 'Unknown')
                
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
                
                summary.append({
                    'code': code_text,
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
                summary.append({
                    'condition': code_text,
                    'status': cond.get('clinicalStatus', {}).get('coding', [{}])[0].get('code'),
                    'onset': cond.get('onsetDateTime'),
                    'severity': cond.get('severity', {}).get('text')
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
                summary.append({
                    'allergen': code_text,
                    'type': allergy.get('type'),
                    'category': allergy.get('category', []),
                    'criticality': allergy.get('criticality'),
                    'status': allergy.get('clinicalStatus', {}).get('coding', [{}])[0].get('code')
                })
            except Exception as e:
                logger.warning(f"Error summarizing allergy: {e}")
                continue
        return summary


def get_patient_data_for_llm(fhir_base_url: str, access_token: str, patient_id: str) -> Dict[str, Any]:
    """
    Convenience function to get patient data formatted for LLM consumption
    
    Args:
        fhir_base_url: FHIR server base URL
        access_token: OAuth2 access token
        patient_id: Patient ID
        
    Returns:
        Patient data dictionary
    """
    service = FHIRService(fhir_base_url, access_token)
    return service.get_full_patient_data(patient_id)
