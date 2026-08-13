import pytest

from redash_global.deployment.exceptions import DataSourceError
from redash_global.deployment.validations import validate_data_sources


@pytest.fixture
def sub_dashboard(factory):
    return factory.create_dashboard()


@pytest.fixture
def target_org(factory):
    return factory.create_org()


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
