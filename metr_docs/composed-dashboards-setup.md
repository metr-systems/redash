# Composed Dashboards Deployment Setup

## MANUAL SETUP (What You Don't Need to Do - because it is already set)

### 1. Template Organization Configuration

- `TEMPLATE_ORG_SLUG` environment variable (`se_template` For production  , `staging_se_template` for staging).
  This org holds all template dashboards, queries, and data sources

### 2. Environment Configuration

- `GLOBAL_SECRET_KEY`, differs from main Redash app (signs session cookie)

## ✋ MANUAL SETUP (What You Need to Do)

### 1. Data Sources Setup

- **In template org**: Create all data sources needed by template dashboards
- **In target orgs**: Ensure each target organization has data sources with **matching identifiers**
  - For each template data source, there must be a target data source with the same `MetrDataSource.data_source_identifier`
  - Example: if template has data source with identifier `"production_db"`, target org must have a data source with identifier `"production_db"`
- Set `MetrDataSource.data_source_identifier` on every data source used by template queries

### 2. Template Dashboard Creation

- Create template dashboards in the **template organization**
- Set **`MetrDashboard.url_identifier`** on each template dashboard
  - This is the stable key used to find/update dashboards during deployment
  It needs to respect the slug format.

### 3. Queries & Widgets in Template Dashboards

- Create queries and visualizations in template dashboards
- Ensure all data sources have identifiers (see step 1)
- *(Widget positions, row heights, etc. are set naturally — no special config needed)*

### 4. Allowed Widgets Query (Optional)

- If using an allowed-widgets query, create it in the **template organization**
- All template dashboards in a composed dashboard must reference the **same** allowed-widgets query
  - Set `MetrDashboard.allowed_widget_query_identifier` on each template dashboard to the same value
  - This identifier is what the deployment uses to find and copy the query

### 5. Sub-Dashboard Assignments

- Create `SubDashboardAssignment` records specifying which template dashboards go to which target organizations

### 6. Composed Dashboard Recipe

- Create a `ComposedDashboard` record with:
  - **`url_identifier`** (unique, slug format) — e.g., `"enterprise-bundle-v1"`
  - **`name`** — will be copied to the deployed dashboard
- Add `ComposedDashboardEntry` records for each sub-dashboard in order:
  - Link to template dashboard
  - Set `order_index` (determines vertical stacking order)
  - Include only template dashboards that have org assignments

---

## ⚙️ AUTOMATIC SETUP (What Deployment Handles)

### 1. Data Source Copying/Mapping

- ✅ Automatically maps template data sources to target org data sources by `data_source_identifier`
- ✅ If target org doesn't have a matching data source, deployment fails with `DataSourceError`

### 2. Query Copying & Updates

- ✅ Queries are copied from template org to target org
- ✅ Automatically sets `MetrQuery.template_query_id` on the copy to point to the template query's ID
- ✅ On redeploy: uses `template_query_id` to find existing copies and update them (not create duplicates)
- ✅ Automatically updates query `data_source_id` to use target org's matching data source

### 3. Allowed Widgets Query Propagation

- ✅ Automatically copies the allowed-widgets query from template org to target org
- ✅ Uses `MetrQuery.query_identifier` (set on the template query in template org) to identify and find the query
- ✅ Automatically sets `MetrQuery.template_query_id` on the copied query to point to the template query's ID
- ✅ All sub-dashboards' allowed-widgets queries are replaced with the single copied copy in the target org
- ✅ On redeploy: uses `template_query_id` to find and update the existing allowed-widgets copy

### 4. Widget Copying & Row Offset Calculation

- ✅ Copies all widgets from each template dashboard in order
- ✅ Automatically calculates cumulative row offsets:
  - First sub-dashboard widgets start at their natural row positions
  - Second sub-dashboard widgets are shifted down by the height of all first sub-dashboard widgets
  - Continues for all sub-dashboards
- ✅ Deletes old widgets from target dashboard (if redeploying)

### 5. Dashboard Creation/Update

- ✅ Finds or creates target dashboard by `MetrDashboard.url_identifier` + target org
- ✅ If dashboard exists, updates its name and widgets
- ✅ If dashboard doesn't exist, creates it with composed dashboard name

### 6. Orphaned Cleanup

- ✅ Deletes visualizations and queries no longer referenced by any widget
- ✅ Cleans up stale artifacts from previous deployments

### 7. Validation (Runs Before Any Writes)

- ✅ **DataSourceError** — validates all data sources exist with identifiers and match in target orgs
- ✅ **AllowedWidgetsQueryError** — validates all sub-dashboards use same allowed-widgets query (or none)
- ✅ **ParameterError** — validates dashboard parameters with same name map to same type across sub-dashboards

### 8. Deployment Record Creation

- ✅ Creates/updates `ComposedDashboardDeployment` record with `last_deployed_at` timestamp
- ✅ Tracks deployment state per (composed dashboard, organization) pair

---

## 🔗 Identifier-Based Matching Pattern

All critical matching uses **stable identifiers** (not stored ForeignKeys) to enable safe redeployment:

| Entity | Matching Key | Purpose |
|---|---|---|
| **Dashboard** | `MetrDashboard.url_identifier` + target org | Find/create dashboard by stable ID instead of stored FK; safe on redeploy |
| **Query** (on redeploy) | `MetrQuery.template_query_id` (auto-set) | Update existing query copy on redeploy instead of creating duplicate |
| **Data Source** | `MetrDataSource.data_source_identifier` | Map template data sources to target org's matching data sources by identifier |
| **Allowed Widgets Query** | `MetrDashboard.allowed_widget_query_identifier` + `MetrQuery.query_identifier` | Identifies which query is the allowed-widgets query; copied once, all sub-dashboards reference it; enables consistent filtering on redeploy |

**Allowed Widgets Query Special Case:**

- Set `MetrDashboard.allowed_widget_query_identifier` on each template dashboard to a common identifier (e.g., `"allowed_widgets"`)
- Set `MetrQuery.query_identifier` on the allowed-widgets query in the template org to the same value
- During deployment, the system finds the query by matching `query_identifier` and copies it once to the target org
- Automatically sets `MetrQuery.template_query_id` on the copied query to point back to the template query
- All template dashboards' allowed-widgets queries are then replaced with a reference to this single copied query
- On redeploy: uses `template_query_id` to find and update the existing allowed-widgets copy instead of creating a duplicate
- This ensures all sub-dashboards in the composed dashboard use identical allowed-widgets filtering in the target org
