# Design Record: Dashboard Editing Architecture

## Context

Redash has an editing interface that allows users to modify dashboard properties, add widgets, rearrange layouts. The editing experience needs to be responsive and provide immediate feedback while ensuring data persistence and consistency.

---

## What does "Done editing" button actually do?

Less than you'd expect — clicking **Done** does *not* save anything. Under the direct-persistence
model, every drag/resize was already POSTed per-widget (debounced) while editing, so by the time
you press Done the layout is already on the server. Done is purely a mode switch.

---

## Why parameters should be disabled while editing

In edit mode you only ever see — and therefore only ever record the order of — the widgets
visible under the current parameter value. Switch to a value that shows *more* widgets, and the
repack has no entry for the newly-shown ones, so it can't fit them into the reflow and the layout comes wrong.
For more information about allowed widgets, check [allowed_widgets_system_overview](allowed_widgets_system_overview.md).

---

## Decision

Dashboard editing follows a **direct persistence model** where each modification is immediately saved to the backend via individual API calls, rather than using a traditional form-based submission approach. We decide to follow this decision for our metr changes.


