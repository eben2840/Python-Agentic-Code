#!/usr/bin/env python3
"""Test actual generation right now"""

import sys
sys.path.insert(0, '.')

from llm_service import ClaudeLLMService

# Simple patient data
patient_data = {
    'patient': {'id': 'test', 'name': 'Test Patient', 'gender': 'male', 'birthDate': '1980-01-01'},
    'observations': {'count': 3, 'summary': [{'code': 'BP', 'value': 120}]},
    'conditions': {'count': 0, 'summary': []},
    'medications': {'count': 0, 'summary': []},
    'allergies': {'count': 0, 'summary': []}
}

print("Creating LLM service...")
llm = ClaudeLLMService()

print("Calling generate_mini_app...")
try:
    html, css, js, llm_response = llm.generate_mini_app(
        "Create a simple vital signs dashboard",
        patient_data,
        'simple'
    )

    print(f"\n✅ Generation succeeded!")
    print(f"HTML: {len(html)} chars")
    print(f"CSS: {len(css)} chars")
    print(f"JS: {len(js)} chars")

    if not js:
        print("\n❌ JS IS EMPTY!")
        print("Checking llm_response...")
        print(f"LLM response length: {len(llm_response)}")

        # Check if there are script tags
        if '<script' in llm_response:
            print("✅ LLM response contains <script> tags")
        else:
            print("❌ LLM response has NO <script> tags")

except Exception as e:
    print(f"\n❌ Generation failed: {e}")
    import traceback
    traceback.print_exc()
