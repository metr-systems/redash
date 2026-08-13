import pytest

from redash.models import MetrQuery, Visualization, Widget
from redash_global.deployment.deploy import (
    copy_allowed_widgets_query,
    copy_widget,
    delete_orphaned_visualizations,
    get_or_copy_query,
    get_target_data_sources,
    replace_widgets,
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


class TestCopyWidget:
    def test_copies_widget_with_visualization(self, factory, sub_dashboard, target_org):
        widget = factory.create_widget(
            dashboard=sub_dashboard, options={"position": {"row": 0, "col": 0, "sizeX": 1, "sizeY": 1}}
        )
        query = widget.visualization.query_rel
        factory.create_metr_data_source_for(query.data_source, "postgres")
        target_ds = factory.create_data_source(org=target_org)
        factory.create_metr_data_source_for(target_ds, "postgres")
        data_source_map = {"postgres": target_ds}

        target_dashboard = factory.create_dashboard(org=target_org)
        deploy_user = factory.create_user(org=target_org)

        result = copy_widget(widget, target_dashboard, target_org, deploy_user, data_source_map, row_offset=0)

        assert result.dashboard_id == target_dashboard.id
        assert result.visualization_id is not None
        assert result.options["position"]["row"] == 0

    def test_offsets_widget_row_position(self, factory, sub_dashboard, target_org):
        widget = factory.create_widget(
            dashboard=sub_dashboard, options={"position": {"row": 5, "col": 0, "sizeX": 1, "sizeY": 1}}
        )
        query = widget.visualization.query_rel
        factory.create_metr_data_source_for(query.data_source, "postgres")
        target_ds = factory.create_data_source(org=target_org)
        factory.create_metr_data_source_for(target_ds, "postgres")
        data_source_map = {"postgres": target_ds}

        target_dashboard = factory.create_dashboard(org=target_org)
        deploy_user = factory.create_user(org=target_org)

        result = copy_widget(widget, target_dashboard, target_org, deploy_user, data_source_map, row_offset=10)

        assert result.options["position"]["row"] == 15

    def test_copies_text_only_widget(self, factory, sub_dashboard, target_org):
        widget = factory.create_widget(
            dashboard=sub_dashboard,
            visualization=None,
            text="hello",
            options={"position": {"row": 0, "col": 0, "sizeX": 1, "sizeY": 1}},
        )

        target_dashboard = factory.create_dashboard(org=target_org)
        deploy_user = factory.create_user(org=target_org)

        result = copy_widget(widget, target_dashboard, target_org, deploy_user, {}, row_offset=0)

        assert result.text == "hello"
        assert result.visualization_id is None


class TestDeleteOrphanedVisualizations:
    def test_deletes_visualization_with_no_widgets(self, factory):
        visualization = factory.create_visualization()

        delete_orphaned_visualizations([visualization.id])

        assert Visualization.query.get(visualization.id) is None

    def test_does_not_delete_visualization_with_widgets(self, factory, sub_dashboard):
        factory.create_widget(dashboard=sub_dashboard)
        visualization = sub_dashboard.widgets[0].visualization

        delete_orphaned_visualizations([visualization.id])

        assert Visualization.query.get(visualization.id) is not None

    def test_deletes_query_when_last_visualization_removed(self, factory):
        visualization = factory.create_visualization()
        query_id = visualization.query_rel.id

        delete_orphaned_visualizations([visualization.id])

        from redash.models import Query
        assert Query.query.get(query_id) is None


class TestReplaceWidgets:
    def test_removes_old_widgets_and_copies_new_ones(self, factory, sub_dashboard, target_org):
        template_widget = factory.create_widget(
            dashboard=sub_dashboard, options={"position": {"row": 0, "col": 0, "sizeX": 1, "sizeY": 1}}
        )
        query = template_widget.visualization.query_rel
        factory.create_metr_data_source_for(query.data_source, "postgres")
        target_ds = factory.create_data_source(org=target_org)
        factory.create_metr_data_source_for(target_ds, "postgres")
        data_source_map = {"postgres": target_ds}

        target_dashboard = factory.create_dashboard(org=target_org)
        old_widget = factory.create_widget(dashboard=target_dashboard)

        deploy_user = factory.create_user(org=target_org)

        replace_widgets(target_dashboard, [sub_dashboard], target_org, deploy_user, data_source_map)

        assert target_dashboard.widgets.count() == 1
        assert target_dashboard.widgets[0].id != old_widget.id

    def test_offsets_rows_across_multiple_sub_dashboards(self, factory, sub_dashboard, target_org):
        factory.create_widget(
            dashboard=sub_dashboard, options={"position": {"row": 0, "col": 0, "sizeX": 1, "sizeY": 2}}
        )
        other_sub_dashboard = factory.create_dashboard()
        factory.create_widget(
            dashboard=other_sub_dashboard, options={"position": {"row": 0, "col": 0, "sizeX": 1, "sizeY": 3}}
        )

        for widget in sub_dashboard.widgets + other_sub_dashboard.widgets:
            query = widget.visualization.query_rel
            factory.create_metr_data_source_for(query.data_source, "postgres")

        target_ds = factory.create_data_source(org=target_org)
        factory.create_metr_data_source_for(target_ds, "postgres")
        data_source_map = {"postgres": target_ds}

        target_dashboard = factory.create_dashboard(org=target_org)
        deploy_user = factory.create_user(org=target_org)

        replace_widgets(target_dashboard, [sub_dashboard, other_sub_dashboard], target_org, deploy_user, data_source_map)

        rows = sorted(w.options["position"]["row"] for w in target_dashboard.widgets.all())
        assert rows == [0, 2]
