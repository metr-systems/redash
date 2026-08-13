import pytest

from redash.models import MetrQuery
from redash_global.deployment.deploy import (
    copy_allowed_widgets_query,
    get_or_copy_query,
    get_target_data_sources,
)


@pytest.fixture
def sub_dashboard(factory):
    return factory.create_dashboard()


@pytest.fixture
def target_org(factory):
    return factory.create_org()


class TestGetTargetDataSources:
    def test_returns_empty_dict_when_no_widgets_have_queries(self, factory, sub_dashboard, target_org):
        factory.create_widget(dashboard=sub_dashboard, visualization=None, text="text only")

        result = get_target_data_sources([sub_dashboard], target_org)

        assert result == {}

    def test_returns_matching_data_sources_by_identifier(self, factory, sub_dashboard, target_org):
        widget = factory.create_widget(dashboard=sub_dashboard)
        template_ds = widget.visualization.query_rel.data_source
        factory.create_metr_data_source_for(template_ds, "postgres")

        target_ds = factory.create_data_source(org=target_org)
        factory.create_metr_data_source_for(target_ds, "postgres")

        result = get_target_data_sources([sub_dashboard], target_org)

        assert result == {"postgres": target_ds}

    def test_ignores_data_sources_without_identifiers(self, factory, sub_dashboard, target_org):
        factory.create_widget(dashboard=sub_dashboard)

        result = get_target_data_sources([sub_dashboard], target_org)

        assert result == {}

    def test_returns_only_matching_identifiers(self, factory, sub_dashboard, target_org):
        widget = factory.create_widget(dashboard=sub_dashboard)
        factory.create_metr_data_source_for(widget.visualization.query_rel.data_source, "postgres")

        target_ds = factory.create_data_source(org=target_org)
        factory.create_metr_data_source_for(target_ds, "mysql")

        result = get_target_data_sources([sub_dashboard], target_org)

        assert result == {}


class TestGetOrCopyQuery:
    def test_creates_new_query_when_none_exists(self, factory, sub_dashboard, target_org):
        widget = factory.create_widget(dashboard=sub_dashboard)
        template_query = widget.visualization.query_rel
        factory.create_metr_data_source_for(template_query.data_source, "postgres")
        target_ds = factory.create_data_source(org=target_org)
        factory.create_metr_data_source_for(target_ds, "postgres")
        data_source_map = {"postgres": target_ds}

        deploy_user = factory.create_user(org=target_org)

        result = get_or_copy_query(template_query, target_org, deploy_user, data_source_map)

        assert result.org_id == target_org.id
        assert result.data_source_id == target_ds.id
        assert result.name == template_query.name
        assert result.query_text == template_query.query_text

    def test_creates_metr_query_tracking_template_query(self, factory, sub_dashboard, target_org):
        widget = factory.create_widget(dashboard=sub_dashboard)
        template_query = widget.visualization.query_rel
        factory.create_metr_data_source_for(template_query.data_source, "postgres")
        target_ds = factory.create_data_source(org=target_org)
        factory.create_metr_data_source_for(target_ds, "postgres")
        data_source_map = {"postgres": target_ds}

        deploy_user = factory.create_user(org=target_org)

        result = get_or_copy_query(template_query, target_org, deploy_user, data_source_map)

        metr_query = MetrQuery.query.filter_by(query_id=result.id).one()
        assert metr_query.template_query_id == template_query.id
        assert metr_query.org_id == target_org.id

    def test_updates_existing_query_in_place(self, factory, sub_dashboard, target_org):
        widget = factory.create_widget(dashboard=sub_dashboard)
        template_query = widget.visualization.query_rel
        factory.create_metr_data_source_for(template_query.data_source, "postgres")
        target_ds = factory.create_data_source(org=target_org)
        factory.create_metr_data_source_for(target_ds, "postgres")
        data_source_map = {"postgres": target_ds}

        deploy_user = factory.create_user(org=target_org)

        first_result = get_or_copy_query(template_query, target_org, deploy_user, data_source_map)
        first_id = first_result.id

        template_query.query_text = "SELECT 2"

        second_result = get_or_copy_query(template_query, target_org, deploy_user, data_source_map)

        assert second_result.id == first_id
        assert second_result.query_text == "SELECT 2"


class TestCopyAllowedWidgetsQuery:
    def test_returns_none_when_no_allowed_widgets_query(self, factory, sub_dashboard, target_org):
        factory.create_widget(dashboard=sub_dashboard)
        deploy_user = factory.create_user(org=target_org)
        data_source_map = {}

        result = copy_allowed_widgets_query([sub_dashboard], target_org, deploy_user, data_source_map)

        assert result is None

    def test_returns_identifier_when_query_copied(self, factory, sub_dashboard, target_org):
        query = factory.create_query()
        factory.create_metr_query(query=query, query_identifier="allowed-widgets")
        factory.create_metr_dashboard(
            dashboard_id=sub_dashboard.id,
            org_id=sub_dashboard.org_id,
            allowed_widget_query_identifier="allowed-widgets",
        )
        factory.create_metr_data_source_for(query.data_source, "postgres")
        target_ds = factory.create_data_source(org=target_org)
        factory.create_metr_data_source_for(target_ds, "postgres")
        data_source_map = {"postgres": target_ds}

        deploy_user = factory.create_user(org=target_org)

        result = copy_allowed_widgets_query([sub_dashboard], target_org, deploy_user, data_source_map)

        assert result == "allowed-widgets"
