---
name: Code style preferences
description: User wants simple, flat, production-quality code — no over-engineering
type: feedback
---

Keep functions under 10 lines. No nested if/else chains, no try/catch unless strictly necessary. No helper functions that aren't reused. Write flat, readable, production code. Don't rush and add complexity in the moment.

**Why:** User explicitly called out over-engineered, rushed code as unacceptable.

**How to apply:** Before writing any function, ask: can this be done in under 10 lines without try/catch? If yes, do that.
