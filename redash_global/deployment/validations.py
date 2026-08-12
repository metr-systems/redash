from redash.models import MetrDataSource
from redash_global.deployment.exceptions import DeploymentError

_DASHBOARD_LEVEL_MAPPING_TYPES = {"dashboard-level", "fixed-from-url"}


def validate_composed_dashboard(sub_dashboards, target_org):
    _validate_data_sources(sub_dashboards, target_org)
    _validate_allowed_widgets_query(sub_dashboards)
    _validate_parameters(sub_dashboards)


def _widgets_with_query(sub_dashboard):
    """Widgets that have a visualization, and therefore a query. Excludes text-box widgets."""
    return [widget for widget in sub_dashboard.widgets if widget.visualization_id is not None]

def _validate_data_sources(sub_dashboards, target_org):
    """Every data source a sub-dashboard's widgets use must also exist in the target org.
    We match on MetrDataSource.data_source_identifier.

    We raise when:
    - the query's data source was deleted (DataSource.delete() nulls data_source_id instead of
      leaving a dangling FK)
    - the data source has no identifier
    - the target org has no data source with that identifier
    """
    identifiers = set()
    for sub_dashboard in sub_dashboards:
        for widget in _widgets_with_query(sub_dashboard):
            # raise if data source has been deleted
            query = widget.visualization.query_rel
            if query.data_source_id is None:
                # Data sources can be deleted and related objects receive value NONE
                # https://github.com/metr-systems/redash/blob/14993943bbd3a4f2ae0ce55d32b6773363bfd8f0/redash/models/__init__.py#L197
                raise DeploymentError(
                    f"Query {query.id} ('{query.name}') on sub-dashboard {sub_dashboard.id} "
                    f"('{sub_dashboard.name}') has no data source"
                )

            # raise if data source has no identifier
            metr_data_source = query.data_source.metr_data_source
            if metr_data_source is None or metr_data_source.data_source_identifier is None:
                raise DeploymentError(
                    f"Data source {query.data_source_id} used by query {query.id} ('{query.name}') "
                    f"on sub-dashboard {sub_dashboard.id} ('{sub_dashboard.name}') has no identifier"
                )
            identifiers.add(metr_data_source.data_source_identifier)

    if not identifiers:
        return

    # raise if target identifiers don't match
    existing_identifiers = {
        row.data_source_identifier
        for row in MetrDataSource.query.filter(
            MetrDataSource.org_id == target_org.id,
            MetrDataSource.data_source_identifier.in_(identifiers),
        )
    }
    missing_identifiers = identifiers - existing_identifiers
    if missing_identifiers:
        raise DeploymentError(
            f"Organization {target_org.id} has no data source for identifiers: {sorted(missing_identifiers)}"
        )


def _validate_allowed_widgets_query(sub_dashboards):
    """All sub-dashboards must reference the same allowed-widgets query, if any.
    No allowed-widgets query at all is also valid.

    We raise when:
    - sub-dashboards reference more than one distinct allowed-widgets query
    """
    identifiers = {
        sub_dashboard.metr_dashboard.allowed_widget_query_identifier
        for sub_dashboard in sub_dashboards
        if sub_dashboard.metr_dashboard and sub_dashboard.metr_dashboard.allowed_widget_query_identifier
    }
    if len(identifiers) > 1:
        raise DeploymentError(f"Sub-dashboards reference different allowed-widgets queries: {sorted(identifiers)}")


def _dashboard_level_params(widget):
    """Yield (name, type) for each of *widget*'s dashboard-level
    and fixed-from-url parameter mappings.
    """
    query = widget.visualization.query_rel
    mappings = (widget.options or {}).get("parameterMappings") or {}
    for param in query.parameters:
        mapping = mappings.get(param["name"])
        if mapping and mapping.get("type") in _DASHBOARD_LEVEL_MAPPING_TYPES:
            yield mapping.get("mapTo") or param["name"], param.get("type")


def _validate_parameters(sub_dashboards):
    """A dashboard-level parameter name must always map to exactly one type.

    "Dashboard-level" also covers "fixed-from-url" mappings. Sub-dashboards don't need
    identical parameter sets - a parameter used by only some of them still becomes a
    composed-dashboard parameter. Widget-level and static-value mappings are local to their
    widget and need no cross-dashboard check.

    We raise when:
    - the same dashboard-level parameter name maps to different types across sub-dashboards
    """
    param_types = {}
    for sub_dashboard in sub_dashboards:
        for widget in _widgets_with_query(sub_dashboard):
            for name, param_type in _dashboard_level_params(widget):
                # raise if the same parameter maps to different types
                existing_type = param_types.get(name)
                if existing_type is not None and existing_type != param_type:
                    raise DeploymentError(
                        f"Dashboard-level parameter '{name}' is type {existing_type!r} on one "
                        f"sub-dashboard and {param_type!r} on another"
                    )
                param_types[name] = param_type
