---
name: Project database provider
description: Why the registration app keeps its database connection provider-agnostic.
---

The app uses the project-managed PostgreSQL connection through `DATABASE_URL` and Drizzle rather than coupling runtime code to a Neon SDK.

**Why:** The project environment provisions a PostgreSQL database and exposes no application-code Neon connector; keeping the contract generic supports both managed development and a compatible Postgres deployment.

**How to apply:** Keep schema and route code provider-agnostic, and preserve `DATABASE_URL` as the only database connection boundary.