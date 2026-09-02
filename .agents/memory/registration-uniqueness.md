---
name: Registration uniqueness
description: How the conference registration flow prevents the same attendee from registering twice.
---

Registration uniqueness is intentionally enforced with both an HttpOnly browser cookie and database uniqueness on email and national ID.

**Why:** A cookie gives an immediate friendly block for returning browsers, while database constraints prevent bypasses from a cleared cookie or another device.

**How to apply:** Preserve both layers whenever the registration schema or submission route changes; user-facing duplicate responses should remain a clear conflict rather than a generic server error.