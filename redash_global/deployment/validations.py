from redash.models import MetrDataSource
from redash_global.deployment.exceptions import AllowedWidgetsQueryError, DataSourceError
from redash_global.deployment.utils import widgets_with_query


def validate_data_sources(sub_dashboards, target_org):
    """Every data source a sub-dashboard's widgets use must also exist in the target org.
    We match on MetrDataSource.data_source_identifier.

    We report an error when:
    - the query's data source was deleted (DataSource.delete() nulls data_source_id instead of
      leaving a dangling FK)
    - the data source has no identifier
    - the target org has no data source with that identifier
    """
    errors = []
    identifiers = set()
    for sub_dashboard in sub_dashboards:
        for widget in widgets_with_query(sub_dashboard):
            # data source has been deleted
            query = widget.visualization.query_rel
            if query.data_source_id is None:
                # Data sources can be deleted and related objects receive value NONE
                # https://github.com/metr-systems/redash/blob/14993943bbd3a4f2ae0ce55d32b6773363bfd8f0/redash/models/__init__.py#L197
                errors.append(
                    DataSourceError(
                        f"Query {query.id} ('{query.name}') on sub-dashboard {sub_dashboard.id} "
                        f"('{sub_dashboard.name}') has no data source"
                    )
                )
                continue

            # data source has no identifier
            metr_data_source = query.data_source.metr_data_source
            if metr_data_source is None or metr_data_source.data_source_identifier is None:
                errors.append(
                    DataSourceError(
                        f"Data source {query.data_source_id} used by query {query.id} ('{query.name}') "
                        f"on sub-dashboard {sub_dashboard.id} ('{sub_dashboard.name}') has no identifier"
                    )
                )
                continue
            identifiers.add(metr_data_source.data_source_identifier)

    if not identifiers:
        return errors

    # target org has no data source for one or more identifiers
    existing_identifiers = {
        row.data_source_identifier
        for row in MetrDataSource.query.filter(
            MetrDataSource.org_id == target_org.id,
            MetrDataSource.data_source_identifier.in_(identifiers),
        )
    }
    missing_identifiers = identifiers - existing_identifiers
    if missing_identifiers:
        errors.append(
            DataSourceError(
                f"Organization {target_org.id} has no data source for identifiers: {sorted(missing_identifiers)}"
            )
        )
    return errors


def validate_allowed_widgets_query(sub_dashboards):
    """All sub-dashboards must reference the same allowed-widgets query, if any.
    No allowed-widgets query at all is also valid.

    We report an error when:
    - sub-dashboards reference more than one distinct allowed-widgets query
    """
    identifiers = {
        sub_dashboard.metr_dashboard.allowed_widget_query_identifier
        for sub_dashboard in sub_dashboards
        if sub_dashboard.metr_dashboard and sub_dashboard.metr_dashboard.allowed_widget_query_identifier
    }
    if len(identifiers) > 1:
        return [
            AllowedWidgetsQueryError(
                f"Sub-dashboards reference different allowed-widgets queries: {sorted(identifiers)}"
            )
        ]
    return []
