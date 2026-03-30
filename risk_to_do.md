You are a senior healthcare security architect and SMART on FHIR specialist.

Your task is to DESIGN and OUTPUT a secure, production-grade architecture and implementation plan for a SMART on FHIR–based system with AI-generated mini apps.

This system MUST comply with:
- SMART on FHIR security guidelines
- OAuth 2.0 best practices
- Healthcare data protection principles (HIPAA / GDPR)
- Least-privilege and minimum-necessary access

You must ASSUME the following CURRENT PROBLEMS exist and MUST BE FIXED:

SECURITY PROBLEMS TO SOLVE (NON-NEGOTIABLE):
1. OAuth access tokens are exposed to frontend JavaScript.
2. Access tokens are passed via URLs and headers unsafely.
3. Mini apps execute untrusted, AI-generated JavaScript.
4. Mini apps run in iframes with broken isolation (`allow-same-origin`).
5. Patient PHI is globally exposed to the frontend.
6. FHIR base URLs are client-controlled (SSRF risk).
7. OAuth is implemented without PKCE in a public client.
8. Client secrets are embedded in mobile or frontend code.
9. TLS is misconfigured (LibreSSL / HTTP usage).
10. Debug mode and verbose logging leak sensitive data.
11. Tokens are stored in plaintext.
12. LLM receives raw PHI.
13. Over-fetching of all patient FHIR resources occurs.
14. CORS is overly permissive.
15. No mini-app trust, signing, or capability model exists.

────────────────────────────────────

REQUIRED OUTPUT (DO NOT SKIP ANY SECTION):

SECTION 1 — Correct High-Level Architecture
- Clearly separate:
  - Mobile / Web frontend
  - Backend API
  - SMART on FHIR Authorization Server
  - FHIR Resource Server
  - LLM service
  - Mini App execution environment
- Explicitly state trust boundaries.
- Explicitly state what NEVER runs in the frontend.

SECTION 2 — Secure SMART on FHIR Flow
- Describe the FULL OAuth Authorization Code + PKCE flow.
- Show where tokens are issued, stored, validated, refreshed, and revoked.
- Explicitly prohibit:
  - Tokens in URLs
  - Tokens in JavaScript
  - Tokens in local storage
- Explain token audience, scope, and expiration handling.

SECTION 3 — Backend-Only Token Custody
- Explain how the backend acts as a FHIR proxy.
- Frontend must NEVER call FHIR directly.
- Mini apps must NEVER see access tokens.
- Show how patient context is derived from tokens server-side.

SECTION 4 — Secure Mini App Model
- Define a strict mini-app capability system:
  - Read-only vs write
  - Allowed FHIR resources per app
  - Explicit API contracts
- Mini apps must:
  - Run in fully isolated iframes
  - Have NO same-origin access
  - Communicate only via postMessage or backend APIs
- Explain how mini apps are signed, verified, and versioned.

SECTION 5 — LLM Safety & PHI Protection
- LLM must NEVER receive raw PHI.
- Explain:
  - De-identification
  - Redaction
  - Summarization
- LLM outputs MUST NOT:
  - Contain patient names
  - Embed PHI in HTML or JavaScript
- Generated code must be stateless and data-agnostic.

SECTION 6 — Secure Data Fetching Strategy
- Do NOT fetch all patient resources upfront.
- Fetch ONLY what is needed per user intent.
- Enforce allow-lists for FHIR resources.
- Explain how scope controls are enforced server-side.

SECTION 7 — TLS, Transport, and Environment Hardening
- HTTPS only.
- TLS 1.2+.
- OpenSSL-based Python runtime.
- Debug mode disabled.
- Secure logging with token and PHI redaction.

SECTION 8 — CORS and Network Security
- Explicit origin allow-listing.
- No wildcard CORS with credentials.
- Reverse proxy recommended.
- App binds to localhost only.

SECTION 9 — Storage & Secrets Management
- No plaintext tokens in databases.
- Use encryption at rest.
- Use secret managers.
- Token references preferred over token storage.

SECTION 10 — Final Output Format
Your response MUST include:
- Architecture explanation (clear, step-by-step)
- A security rules checklist
- A short “Why this is safe” summary

DO NOT:
- Suggest shortcuts
- Expose tokens to the frontend
- Use vague language
- Skip any section

Be explicit, structured, and implementation-ready.
