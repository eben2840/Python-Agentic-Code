#!/usr/bin/env python3
"""Test the _parse_response method"""

import sys
import re
sys.path.insert(0, '.')

from app import app, db
from models import Generation
from llm_service import ClaudeLLMService

with app.app_context():
    # Get the latest generation
    gen = Generation.query.order_by(Generation.created_at.desc()).first()

    if gen and gen.llm_response:
        print(f"Testing _parse_response on latest generation...")
        print(f"Response length: {len(gen.llm_response)}\n")

        # Create LLM service instance
        llm = ClaudeLLMService()

        # Parse the response
        html, css, js = llm._parse_response(gen.llm_response)

        print(f"Parsed results:")
        print(f"  HTML: {len(html)} chars")
        print(f"  CSS: {len(css)} chars")
        print(f"  JS: {len(js)} chars")

        if not js:
            print("\n❌ JavaScript extraction FAILED!")

            # Test the regex manually
            response = gen.llm_response

            # Try to find script tags
            script_pattern = r'<script(?![^>]*src=)[^>]*>(.*?)</script>'
            script_matches = re.findall(script_pattern, response, re.DOTALL | re.IGNORECASE)

            print(f"\nManual regex test:")
            print(f"  Found {len(script_matches)} script blocks")

            if script_matches:
                for i, match in enumerate(script_matches[:3]):
                    print(f"\n  Script block {i+1} ({len(match)} chars):")
                    print(f"    {match[:100]}...")
