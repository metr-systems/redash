import pytest

from redash_global.deployment.exceptions import (
    AllowedWidgetsQueryError,
    DataSourceError,
    DeploymentError,
    DeploymentErrorGroup,
    ParameterError,
)
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


class TestValidateDataSources:
    def test_passes_when_the_target_org_has_a_matching_identifier(self, factory, sub_dashboard, target_org):
        widget = factory.create_widget(dashboard=sub_dashboard)
        factory.create_metr_data_source_for(widget.visualization.query_rel.data_source, "controller")
        factory.create_metr_data_source_for(factory.create_data_source(org=target_org), "controller")

        assert validate_data_sources([sub_dashboard], target_org) == []

    def test_ignores_text_only_widgets(self, factory, sub_dashboard, target_org):
        factory.create_widget(dashboard=sub_dashboard, visualization=None, text="just text")

        assert validate_data_sources([sub_dashboard], target_org) == []

    def test_reports_an_error_when_a_query_lost_its_data_source(self, factory, sub_dashboard, target_org):
        widget = factory.create_widget(dashboard=sub_dashboard)
        widget.visualization.query_rel.data_source.delete()

        errors = validate_data_sources([sub_dashboard], target_org)

        assert len(errors) == 1
        assert isinstance(errors[0], DataSourceError)

    def test_reports_an_error_when_the_data_source_has_no_identifier(self, factory, sub_dashboard, target_org):
        factory.create_widget(dashboard=sub_dashboard)

        errors = validate_data_sources([sub_dashboard], target_org)

        assert len(errors) == 1
        assert isinstance(errors[0], DataSourceError)

    def test_reports_an_error_when_the_target_org_has_no_matching_identifier(self, factory, sub_dashboard, target_org):
        widget = factory.create_widget(dashboard=sub_dashboard)
        factory.create_metr_data_source_for(widget.visualization.query_rel.data_source, "controller")

        errors = validate_data_sources([sub_dashboard], target_org)

        assert len(errors) == 1
        assert isinstance(errors[0], DataSourceError)


class TestValidateAllowedWidgetsQuery:
    def test_passes_when_none_reference_an_allowed_widgets_query(self, sub_dashboard, other_sub_dashboard):
        assert validate_allowed_widgets_query([sub_dashboard, other_sub_dashboard]) == []

    def test_passes_when_all_reference_the_same_query(self, factory, sub_dashboard, other_sub_dashboard):
        for dashboard in (sub_dashboard, other_sub_dashboard):
            factory.create_metr_dashboard(
                dashboard_id=dashboard.id,
                org_id=dashboard.org_id,
                allowed_widget_query_identifier="shared-query",
            )

        assert validate_allowed_widgets_query([sub_dashboard, other_sub_dashboard]) == []

    def test_reports_an_error_when_they_reference_different_queries(self, factory, sub_dashboard, other_sub_dashboard):
        factory.create_metr_dashboard(
            dashboard_id=sub_dashboard.id,
            org_id=sub_dashboard.org_id,
            allowed_widget_query_identifier="query-a",
        )
        factory.create_metr_dashboard(
            dashboard_id=other_sub_dashboard.id,
            org_id=other_sub_dashboard.org_id,
            allowed_widget_query_identifier="query-b",
        )

        errors = validate_allowed_widgets_query([sub_dashboard, other_sub_dashboard])

        assert len(errors) == 1
        assert isinstance(errors[0], AllowedWidgetsQueryError)


class TestParameterErrors:
    def test_passes_with_no_dashboard_level_parameters(self, factory, sub_dashboard):
        factory.create_widget(dashboard=sub_dashboard)

        assert validate_parameters([sub_dashboard]) == []

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

        assert validate_parameters([sub_dashboard, other_sub_dashboard]) == []

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

        assert validate_parameters([with_param, without_param]) == []

    def test_reports_an_error_when_same_name_has_different_types(
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

        errors = validate_parameters([sub_dashboard, other_sub_dashboard])

        assert len(errors) == 1
        assert isinstance(errors[0], ParameterError)

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

        errors = validate_parameters([sub_dashboard, other_sub_dashboard])

        assert len(errors) == 1
        assert isinstance(errors[0], ParameterError)

    def test_widget_level_mappings_are_not_cross_checked(self, factory, sub_dashboard, other_sub_dashboard):
        query_text = factory.create_query(options={"parameters": [{"name": "address", "type": "text"}]})
        factory.create_widget(
            dashboard=sub_dashboard,
            visualization=factory.create_visualization(query_rel=query_text),
            options={
                "parameterMappings": {"address": {"name": "address", "type": "widget-level", "mapTo": "address"}}
            },
        )
        query_number = factory.create_query(options={"parameters": [{"name": "address", "type": "number"}]})
        factory.create_widget(
            dashboard=other_sub_dashboard,
            visualization=factory.create_visualization(query_rel=query_number),
            options={
                "parameterMappings": {"address": {"name": "address", "type": "widget-level", "mapTo": "address"}}
            },
        )

        assert validate_parameters([sub_dashboard, other_sub_dashboard]) == []


class TestValidateComposedDashboard:
    def test_passes_when_every_guard_passes(
        self, factory, sub_dashboard, other_sub_dashboard, target_org, address_dashboard_level_mapping
    ):
        sub_dashboards = [sub_dashboard, other_sub_dashboard]
        widgets = []
        for dashboard in sub_dashboards:
            factory.create_metr_dashboard(
                dashboard_id=dashboard.id,
                org_id=dashboard.org_id,
                allowed_widget_query_identifier="shared-query",
            )
            query = factory.create_query(options={"parameters": [{"name": "address", "type": "text"}]})
            widgets.append(
                factory.create_widget(
                    dashboard=dashboard,
                    visualization=factory.create_visualization(query_rel=query),
                    options={"parameterMappings": address_dashboard_level_mapping},
                )
            )
        factory.create_metr_data_source_for(widgets[0].visualization.query_rel.data_source, "controller")
        factory.create_metr_data_source_for(factory.create_data_source(org=target_org), "controller")

        validate_composed_dashboard(sub_dashboards, target_org)

    def test_raises_an_exception_group_aggregating_every_guards_errors(
        self, factory, sub_dashboard, other_sub_dashboard, target_org
    ):
        factory.create_metr_dashboard(
            dashboard_id=sub_dashboard.id,
            org_id=sub_dashboard.org_id,
            allowed_widget_query_identifier="query-a",
        )
        factory.create_metr_dashboard(
            dashboard_id=other_sub_dashboard.id,
            org_id=other_sub_dashboard.org_id,
            allowed_widget_query_identifier="query-b",
        )
        factory.create_widget(dashboard=sub_dashboard)

        with pytest.raises(DeploymentErrorGroup) as exc_info:
            validate_composed_dashboard([sub_dashboard, other_sub_dashboard], target_org)

        errors = exc_info.value.errors
        assert len(errors) == 2
        assert all(isinstance(error, DeploymentError) for error in errors)
