#!/usr/bin/env python3
"""Test LLM service to see if changes work"""

import sys
import os
sys.path.insert(0, '.')

# Mock patient data
patient_data = {
    'patient': {
        'id': 'test123',
        'name': 'Test Patient',
        'gender': 'male',
        'birthDate': '1980-01-01'
    },
    'observations': {
        'count': 5,
        'summary': [
            {'code': 'Blood Pressure', 'value': 120, 'unit': 'mmHg', 'date': '2025-01-15'}
        ]
    },
    'conditions': {'count': 0, 'summary': []},
    'medications': {'count': 0, 'summary': []},
    'allergies': {'count': 0, 'summary': []}
}

# Check if API key exists
if not os.getenv('ANTHROPIC_API_KEY'):
    print("❌ ANTHROPIC_API_KEY not set")
    print("   This is likely why tasks are failing!")
    sys.exit(1)

print("✅ ANTHROPIC_API_KEY is set")

# Test import
try:
    from llm_service import ClaudeLLMService
    print("✅ LLM service imports successfully")
except Exception as e:
    print(f"❌ Failed to import LLM service: {e}")
    import traceback
    traceback.print_exc()
    sys.exit(1)

# Test initialization
try:
    llm = ClaudeLLMService()
    print("✅ LLM service initializes successfully")
except Exception as e:
    print(f"❌ Failed to initialize LLM service: {e}")
    import traceback
    traceback.print_exc()
    sys.exit(1)

# Test _parse_response method
try:
    test_response = """Here is your mini app:

```html
<!DOCTYPE html>
<html>
<head><title>Test</title></head>
<body>Hello World</body>
</html>
```

```css
body { margin: 0; }
```

```javascript
console.log('test');
```
"""
    html, css, js = llm._parse_response(test_response)
    print(f"✅ _parse_response works:")
    print(f"   HTML: {len(html)} chars")
    print(f"   CSS: {len(css)} chars")
    print(f"   JS: {len(js)} chars")

    if not html:
        print("❌ WARNING: HTML parsing failed!")
    if not css:
        print("⚠️  WARNING: CSS parsing returned empty")
    if not js:
        print("⚠️  WARNING: JS parsing returned empty")

except Exception as e:
    print(f"❌ _parse_response failed: {e}")
    import traceback
    traceback.print_exc()

print("\n✅ All basic tests passed")
print("The LLM service should be working correctly")
