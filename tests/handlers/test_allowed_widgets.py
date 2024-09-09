from tests import BaseTestCase
from redash.handlers.dashboards import get_allowed_widgets_info


class TestAllowedWidgetsDashboardResourceGet(BaseTestCase):
    def test_return_allowed_widgets_if_the_query_exists(self):
        dashboard_id = 1
        parameter_col_name="main_parameter"
        widgets_col_name="widgets"

        # create query holding allowed widgets info
        data = {
            "rows": [{parameter_col_name: "controller1234", widgets_col_name: ["firstQueryViz", "secondQueryViz"]}],
            "columns": [{"name": parameter_col_name}, {"name": widgets_col_name}],
        }
        query_data_result = self.factory.create_query_result(data=data)
        self.factory.create_query(name=f"allowed_widgets_{dashboard_id}", latest_query_data=query_data_result)

        # call function to test
        allowed_widgets = get_allowed_widgets_info(dashboard_id,parameter_col_name,widgets_col_name)

        # assertions
        assert {"controller1234": ["firstQueryViz", "secondQueryViz"]} == allowed_widgets

    def test_allowed_widgets_is_empty_if_wrong_query_row_keys(self):
        dashboard_id = 1
        parameter_col_name="main_param"
        widgets_col_name="widgets"

        # create query holding allowed widgets info
        data = {
            "rows": [{parameter_col_name: "controller1234", widgets_col_name: ["firstQueryViz", "secondQueryViz"]}],
            "columns": [{"name": parameter_col_name}, {"name":widgets_col_name}],
        }
        query_data_result = self.factory.create_query_result(data=data)

        # call function to test
        self.factory.create_query(name=f"allowed_widgets_{dashboard_id}", latest_query_data=query_data_result)

        # assertions
        assert get_allowed_widgets_info(dashboard_id,"main_parameter",widgets_col_name) == {}

    def test_allowed_widgets_is_empty_if_the_query_doesnt_exists(self):
        dashboard_id = 1
        parameter_col_name="main_parameter"
        widgets_col_name="widgets"

        # call function to test and assert its result
        assert get_allowed_widgets_info(dashboard_id,parameter_col_name,widgets_col_name) == {}
