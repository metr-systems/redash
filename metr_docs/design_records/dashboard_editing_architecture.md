# Design Record: Dashboard Editing Architecture

## Context

Redash has an editing interface that allows users to modify dashboard properties, add widgets, rearrange layouts. The editing experience needs to be responsive and provide immediate feedback while ensuring data persistence and consistency.

---

## Decision

Dashboard editing follows a **direct persistence model** where each modification is immediately saved to the backend via individual API calls, rather than using a traditional form-based submission approach. We decide to follow this decision for our metr changes.


