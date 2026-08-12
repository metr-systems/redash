import pytest

from redash.models import MetrDashboard, MetrDataSource, db
from redash_global.deployment.exceptions import DeploymentError
from redash_global.deployment.validations import (
    validate_allowed_widgets_query,
    validate_composed_dashboard,
    validate_data_sources,
    validate_parameters,
)


@pytest.fixture
def sub_dashboard(factory):
    return factory.create_dashboard()


@pytest.fixture
def other_sub_dashboard(factory):
    return factory.create_dashboard()


@pytest.fixture
def target_org(factory):
    return factory.create_org()


@pytest.fixture
def address_dashboard_level_mapping():
    return {"address": {"name": "address", "type": "dashboard-level", "mapTo": "address"}}


def widget_level_mapping(param_name):
    return {param_name: {"name": param_name, "type": "widget-level", "mapTo": param_name}}


def link_identifier(data_source, identifier):
    db.session.add(
        MetrDataSource(data_source_id=data_source.id, org_id=data_source.org_id, data_source_identifier=identifier)
    )
    db.session.flush()


class TestValidateDataSources:
    def test_passes_when_the_target_org_has_a_matching_identifier(self, factory, sub_dashboard, target_org):
        widget = factory.create_widget(dashboard=sub_dashboard)
        link_identifier(widget.visualization.query_rel.data_source, "controller")
        link_identifier(factory.create_data_source(org=target_org), "controller")

        validate_data_sources([sub_dashboard], target_org)

    def test_ignores_text_only_widgets(self, factory, sub_dashboard, target_org):
        factory.create_widget(dashboard=sub_dashboard, visualization=None, text="just text")

        validate_data_sources([sub_dashboard], target_org)

    def test_raises_when_a_query_lost_its_data_source(self, factory, sub_dashboard, target_org):
        widget = factory.create_widget(dashboard=sub_dashboard)
        widget.visualization.query_rel.data_source.delete()

        with pytest.raises(DeploymentError):
            validate_data_sources([sub_dashboard], target_org)

    def test_raises_when_the_data_source_has_no_identifier(self, factory, sub_dashboard, target_org):
        factory.create_widget(dashboard=sub_dashboard)

        with pytest.raises(DeploymentError):
            validate_data_sources([sub_dashboard], target_org)

    def test_raises_when_the_target_org_has_no_matching_identifier(self, factory, sub_dashboard, target_org):
        widget = factory.create_widget(dashboard=sub_dashboard)
        link_identifier(widget.visualization.query_rel.data_source, "controller")

        with pytest.raises(DeploymentError):
            validate_data_sources([sub_dashboard], target_org)


class TestValidateAllowedWidgetsQuery:
    def test_passes_when_none_reference_an_allowed_widgets_query(self, sub_dashboard, other_sub_dashboard):
        validate_allowed_widgets_query([sub_dashboard, other_sub_dashboard])

    def test_passes_when_all_reference_the_same_query(self, sub_dashboard, other_sub_dashboard):
        for dashboard in (sub_dashboard, other_sub_dashboard):
            db.session.add(
                MetrDashboard(
                    dashboard_id=dashboard.id,
                    org_id=dashboard.org_id,
                    allowed_widget_query_identifier="shared-query",
                )
            )
        db.session.flush()

        validate_allowed_widgets_query([sub_dashboard, other_sub_dashboard])

    def test_raises_when_they_reference_different_queries(self, sub_dashboard, other_sub_dashboard):
        db.session.add(
            MetrDashboard(
                dashboard_id=sub_dashboard.id,
                org_id=sub_dashboard.org_id,
                allowed_widget_query_identifier="query-a",
            )
        )
        db.session.add(
            MetrDashboard(
                dashboard_id=other_sub_dashboard.id,
                org_id=other_sub_dashboard.org_id,
                allowed_widget_query_identifier="query-b",
            )
        )
        db.session.flush()

        with pytest.raises(DeploymentError):
            validate_allowed_widgets_query([sub_dashboard, other_sub_dashboard])


class TestValidateParameters:
    def test_passes_with_no_dashboard_level_parameters(self, factory, sub_dashboard):
        factory.create_widget(dashboard=sub_dashboard)

        validate_parameters([sub_dashboard])

    def test_passes_when_same_name_and_type_across_sub_dashboards(
        self, factory, sub_dashboard, other_sub_dashboard, address_dashboard_level_mapping
    ):
        for dashboard in (sub_dashboard, other_sub_dashboard):
            query = factory.create_query(options={"parameters": [{"name": "address", "type": "text"}]})
            factory.create_widget(
                dashboard=dashboard,
                visualization=factory.create_visualization(query_rel=query),
                options={"parameterMappings": address_dashboard_level_mapping},
            )

        validate_parameters([sub_dashboard, other_sub_dashboard])

    def test_a_parameter_can_be_used_by_only_one_sub_dashboard(
        self, factory, sub_dashboard, other_sub_dashboard, address_dashboard_level_mapping
    ):
        with_param = sub_dashboard
        query = factory.create_query(options={"parameters": [{"name": "address", "type": "text"}]})
        factory.create_widget(
            dashboard=with_param,
            visualization=factory.create_visualization(query_rel=query),
            options={"parameterMappings": address_dashboard_level_mapping},
        )
        without_param = other_sub_dashboard
        factory.create_widget(dashboard=without_param)

        validate_parameters([with_param, without_param])

    def test_raises_when_same_name_has_different_types(
        self, factory, sub_dashboard, other_sub_dashboard, address_dashboard_level_mapping
    ):
        query_text = factory.create_query(options={"parameters": [{"name": "address", "type": "text"}]})
        factory.create_widget(
            dashboard=sub_dashboard,
            visualization=factory.create_visualization(query_rel=query_text),
            options={"parameterMappings": address_dashboard_level_mapping},
        )
        query_number = factory.create_query(options={"parameters": [{"name": "address", "type": "number"}]})
        factory.create_widget(
            dashboard=other_sub_dashboard,
            visualization=factory.create_visualization(query_rel=query_number),
            options={"parameterMappings": address_dashboard_level_mapping},
        )

        with pytest.raises(DeploymentError):
            validate_parameters([sub_dashboard, other_sub_dashboard])

    def test_fixed_from_url_is_treated_as_dashboard_level(
        self, factory, sub_dashboard, other_sub_dashboard, address_dashboard_level_mapping
    ):
        query_text = factory.create_query(options={"parameters": [{"name": "address", "type": "text"}]})
        factory.create_widget(
            dashboard=sub_dashboard,
            visualization=factory.create_visualization(query_rel=query_text),
            options={"parameterMappings": address_dashboard_level_mapping},
        )
        query_number = factory.create_query(options={"parameters": [{"name": "address", "type": "number"}]})
        factory.create_widget(
            dashboard=other_sub_dashboard,
            visualization=factory.create_visualization(query_rel=query_number),
            options={
                "parameterMappings": {"address": {"name": "address", "type": "fixed-from-url", "mapTo": "address"}}
            },
        )

        with pytest.raises(DeploymentError):
            validate_parameters([sub_dashboard, other_sub_dashboard])

    def test_widget_level_mappings_are_not_cross_checked(self, factory, sub_dashboard, other_sub_dashboard):
        query_text = factory.create_query(options={"parameters": [{"name": "address", "type": "text"}]})
        factory.create_widget(
            dashboard=sub_dashboard,
            visualization=factory.create_visualization(query_rel=query_text),
            options={"parameterMappings": widget_level_mapping("address")},
        )
        query_number = factory.create_query(options={"parameters": [{"name": "address", "type": "number"}]})
        factory.create_widget(
            dashboard=other_sub_dashboard,
            visualization=factory.create_visualization(query_rel=query_number),
            options={"parameterMappings": widget_level_mapping("address")},
        )

        validate_parameters([sub_dashboard, other_sub_dashboard])


class TestValidateComposedDashboard:
    def test_passes_when_every_guard_passes(
        self, factory, sub_dashboard, other_sub_dashboard, target_org, address_dashboard_level_mapping
    ):
        sub_dashboards = [sub_dashboard, other_sub_dashboard]
        widgets = []
        for dashboard in sub_dashboards:
            db.session.add(
                MetrDashboard(
                    dashboard_id=dashboard.id,
                    org_id=dashboard.org_id,
                    allowed_widget_query_identifier="shared-query",
                )
            )
            query = factory.create_query(options={"parameters": [{"name": "address", "type": "text"}]})
            widgets.append(
                factory.create_widget(
                    dashboard=dashboard,
                    visualization=factory.create_visualization(query_rel=query),
                    options={"parameterMappings": address_dashboard_level_mapping},
                )
            )
        link_identifier(widgets[0].visualization.query_rel.data_source, "controller")
        link_identifier(factory.create_data_source(org=target_org), "controller")
        db.session.flush()

        validate_composed_dashboard(sub_dashboards, target_org)
