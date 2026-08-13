from redash.models import MetrDataSource, MetrQuery, Query, db
from redash_global.deployment.utils import widgets_with_query


def get_target_data_sources(sub_dashboards, target_org):
    identifiers = set()
    for sub_dashboard in sub_dashboards:
        for widget in widgets_with_query(sub_dashboard):
            query = widget.visualization.query_rel
            if query.data_source_id is not None:
                metr_data_source = query.data_source.metr_data_source
                if metr_data_source is not None:
                    identifiers.add(metr_data_source.data_source_identifier)

    return {
        metr_data_source.data_source_identifier: metr_data_source.data_source
        for metr_data_source in MetrDataSource.query.filter(
            MetrDataSource.org_id == target_org.id,
            MetrDataSource.data_source_identifier.in_(identifiers),
        )
    }


def get_or_copy_query(template_query, target_org, deploy_user, data_source_map):
    identifier = template_query.data_source.metr_data_source.data_source_identifier
    target_data_source = data_source_map[identifier]

    metr_query = (
        db.session.query(MetrQuery)
        .filter(MetrQuery.org_id == target_org.id, MetrQuery.template_query_id == template_query.id)
        .first()
    )
    if metr_query:
        query = metr_query.query
        query.name = template_query.name
        query.query_text = template_query.query_text
        query.options = template_query.options
        query.data_source = target_data_source
        return query

    # Bare constructor, not Query.create(...): Query.create always adds a "Table" TABLE
    # visualization, which would collide with the visualization copy_widget/copy_allowed_widgets_query
    # already builds. Query.fork (redash/models/__init__.py:798-820) avoids the same collision
    # the same way.
    query = Query(
        org=target_org,
        data_source=target_data_source,
        user=deploy_user,
        name=template_query.name,
        query_text=template_query.query_text,
        options=template_query.options,
    )
    db.session.add(query)
    db.session.flush()
    db.session.add(MetrQuery(query=query, org_id=target_org.id, template_query_id=template_query.id))
    return query


def copy_allowed_widgets_query(sub_dashboards, target_org, deploy_user, data_source_map):
    metr_dashboard = sub_dashboards[0].metr_dashboard
    identifier = metr_dashboard.allowed_widget_query_identifier if metr_dashboard else None
    if identifier is None:
        return None

    template_org = sub_dashboards[0].org
    template_query = (
        db.session.query(Query)
        .join(MetrQuery, MetrQuery.query_id == Query.id)
        .filter(MetrQuery.org_id == template_org.id, MetrQuery.query_identifier == identifier)
        .first()
    )

    query = get_or_copy_query(template_query, target_org, deploy_user, data_source_map)
    query.metr_query.query_identifier = identifier
    return identifier
