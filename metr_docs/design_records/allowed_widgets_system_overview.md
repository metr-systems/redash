# Allowed widgets — system overview (current state)

"Allowed widgets" drives the dashboard UI clients interact with directly, and it
requires effort to trace through the code. This record is a map to its pieces.

---

## 1. What "allowed widgets" is

Two **independent** mechanisms, both added by Metr:

1. **Visibility filter** — given the current parameter value, decide which widgets are shown.
2. **Repacking** — re-flow widgets to close the holes left when the visible set changes.
   (In the current code it runs on *every* layout change, not only when the set changes.)
   This is entangled with [react-grid-layout (RGL)](https://github.com/react-grid-layout/react-grid-layout)
   and is where the subtle behavior and complexity live.

A third concern, **how widget order/position is saved**, predates Metr but is covered here too.

---

## 2. Backend vs frontend

The backend only ships data: it resolves the mapping query, exposes the mapping, and serves
each widget's tags and position. It never strips widgets and has no concept of repacking.

Every behavioral decision — which widgets to show, when to repack, what to save — happens in
the browser. The feature is **mostly frontend**.

---

## 3. The process

### 3.1 Display flow — runs whenever a parameter changes (no editing involved)

1. **Build the mapping (backend).** `redash/handlers/dashboards.py` —
   `get_allowed_widgets_info()`, exposed by the `@add_allowed_widgets_info` decorator on the
   dashboard GET. Produces `dashboard.allowed_widgets`.

2. **Turn the mapping into a visible set (frontend).**
   `client/app/pages/dashboards/hooks/utils.js` — `getAllowedWidgetsForCurrentParam` matches
   the current parameter + widget tags against the mapping (see [Mechanism 1](#41-mechanism-1--visibility-filter)).

3. **Hold the visible set as state.** `client/app/pages/dashboards/hooks/useDashboard.js` —
   `loadDashboard` calls the filter and stores the result via `setVisibleWidgets`.

4. **Hand it to the grid.** `client/app/pages/dashboards/DashboardPage.jsx` renders
   `<DashboardGrid widgets={visibleWidgets} .../>` and wires the handler functions.

5. **Repack — preview only, *not* while editing.** On a layout change, `DashboardGrid.jsx`'s
   `onLayoutChange` calls `applyLayoutsOrder` → `keepLayoutsOrder`
   (`client/app/components/dashboards/utils.js`) to re-flow widgets and close holes. **Purely
   visual — nothing is written to the server here** (see [Mechanism 2](#42-mechanism-2--repacking)).

   > **`onLayoutChange` is two different functions — don't mix them up.** On a layout change,
   > RGL calls **our own** `DashboardGrid.onLayoutChange`, which runs the **repack**. At its
   > end, that method calls `this.props.onLayoutChange` — a **different** function passed in by
   > `DashboardPage` (step 4) that only **saves** positions (`saveDashboardLayout` while
   > editing, a no-op in preview). RGL has no `onLayoutChange` of its own; it just triggers ours.

### 3.2 Save flow — only while editing; the *only* path that writes to the DB

When the user drags widgets in edit mode, position changes are persisted per widget:

- `client/app/pages/dashboards/hooks/useEditModeHandler.js` — `saveDashboardLayout` diffs the
  new positions against the saved ones (debounced) and saves each moved widget.
- `client/app/services/widget.js` — `Widget.save` does the actual `POST api/widgets/<id>`,
  storing `options.position`. **This is the real, persisted order** — there is no separate
  order field; it lives in each widget's position.

### 3.3 The order *list* — in-memory only, carries the edited order into the repack

A list of widget IDs in display order that the repack (step 5) places widgets in. It lives
**only in memory, never saved to the server**, and comes either from the order you dragged
widgets into (after editing) or from the backend's widget order (on a fresh load). Two variants:

- **`layoutsOrder` (baseline)** — the order used by **every** repack. Initialized from the
  backend's widget order (`saved_all_widgets`) when the grid loads, **and re-set after each
  edit**: `applyLayoutsOrder` calls `setLayoutsOrder(editedlayoutsOrder)` so the freshly
  dragged order becomes the baseline for subsequent repacks. This re-set is how an edited
  order survives into later repacks.
- **`editedlayoutsOrder` (new order after editing)** — the order you just dragged widgets
  into, computed when you leave edit mode.

---

## 4. The two mechanisms in detail

Sections 1–3 covered the pieces and their order. The two sections below
zoom into the two mechanisms from section 1: the **filter** that picks the visible set, and
the **repack** that re-flows it. They are independent — the filter decides *what* is shown,
the repack only rearranges *whatever* it's handed.

### 4.1 Mechanism 1 — visibility filter

The backend ships a **mapping**, not a filtered widget list; all filtering is client-side, on
every load. In `useDashboard.loadDashboard`, `getAllowedWidgetsForCurrentParam`:

- Walks dashboard parameters and picks the **first** one whose `value` is a key in the
  mapping. Only **one** "main parameter" is ever honored — it `return`s on the first match.
- Keeps widgets whose **`tags`** intersect the mapping's allowed list (`isWidgetToShow`; tags
  can be `;`-joined and are unioned before intersecting). **A widget with no tags is *always*
  kept** — `isWidgetToShow` returns `true` on an empty tag list.
- If nothing matches (or `allowed_widgets` is undefined), returns **all** widgets.

The result, `visibleWidgets`, is what `DashboardPage` passes to the grid. So **changing a
parameter gives the grid a different set of widgets** — but the grid never checks "did the set
change?" to decide when to repack; it repacks on every layout change in preview (Mechanism 2).

**To change visibility rules:** `getAllowedWidgetsForCurrentParam` + `isWidgetToShow`.

### 4.2 Mechanism 2 — repacking

The repack itself is `keepLayoutsOrder(orderedIds, layouts, widgets)`: it walks an ordered id
list and re-flows widgets left→right / top→bottom, closing holes left by hidden widgets
(textboxes force a new line). It is reached **only** via `applyLayoutsOrder`, which is called
**only** from inside `DashboardGrid.onLayoutChange`.

#### 4.2.1 When `applyLayoutsOrder` runs

On **every** `onLayoutChange` fire, as long as all three hold:

- More than one column in the layout (`layouts[MULTI]` exists).
- **Not** in editing mode (`!isEditing`).
- It's an allowed-widgets dashboard (`dashboard.allowed_widgets` set).

Without `allowed_widgets`, `applyLayoutsOrder` is never called — repacking is exclusively an
allowed-widgets, non-editing behavior.

#### 4.2.2 Editing mode vs preview mode

Editing mode (`isEditing`/`editingLayout`, entered via the **Edit** button / `?edit` flag) and
preview mode are a clean, mutually exclusive split:

| | Editing (`isEditing`) | Preview (`!isEditing`) |
|---|---|---|
| Drag/resize widgets | ✅ | ❌ |
| Save positions (`saveDashboardLayout` → `POST api/widgets/<id>`) | ✅ | ❌ no-op |
| Repack (`applyLayoutsOrder`) | ❌ skipped | ✅ on every `onLayoutChange` |
| Parameter-driven visibility filter | ✅ | ✅ |

Only the **repack** is preview-only; only the **save/drag** is edit-only. The visibility
filter runs in both — it is not gated on edit mode.
