from tests import BaseTestCase
from redash.handlers.dashboards import get_allowed_widgets_info


class TestAllowedWidgetsDashboardResourceGet(BaseTestCase):
    def test_return_allowed_widgets_if_the_query_exists(self):
        dashboard_id = 1

        # create query holding allowed widgets info
        data = {
            "rows": [{"main_parameter": "controller1234", "widgets": ["firstQueryViz", "secondQueryViz"]}],
            "columns": [{"name": "main_parameter"}, {"name": "widgets"}],
        }
        query_data_result = self.factory.create_query_result(data=data)
        self.factory.create_query(name=f"allowed_widgets_{dashboard_id}", latest_query_data=query_data_result)

        # call function to test
        allowed_widgets = get_allowed_widgets_info(dashboard_id)

        # assertions
        assert {"controller1234": ["firstQueryViz", "secondQueryViz"]} == allowed_widgets

    def test_allowed_widgets_is_empty_if_wrong_query_row_keys(self):
        dashboard_id = 1

        # create query holding allowed widgets info
        data = {
            "rows": [{"main_param": "controller1234", "widgets": ["firstQueryViz", "secondQueryViz"]}],
            "columns": [{"name": "main_param"}, {"name": "widgets"}],
        }
        query_data_result = self.factory.create_query_result(data=data)

        # call function to test
        self.factory.create_query(name=f"allowed_widgets_{dashboard_id}", latest_query_data=query_data_result)

        # assertions
        assert get_allowed_widgets_info(dashboard_id) == {}

    def test_allowed_widgets_is_empty_if_the_query_doesnt_exists(self):
        dashboard_id = 1

        # call function to test and assert its result
        assert get_allowed_widgets_info(dashboard_id) == {}
