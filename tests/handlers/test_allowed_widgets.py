from redash.handlers.dashboards import (
    add_allowed_widgets_info,
    get_allowed_widgets_info,
)
from redash.models import MetrDashboard, MetrQuery, db
from tests import BaseTestCase


class TestAddAllowedWidgetsInfo(BaseTestCase):
    def test_add_allowed_widgets_info_works_correctly(self):
        parameter_col_name = "main_parameter"
        widgets_col_name = "widgets"
        dashboard_id = 1
        data = {
            "rows": [{parameter_col_name: "controller1234", widgets_col_name: ["firstQueryViz", "secondQueryViz"]}],
            "columns": [{"name": parameter_col_name}, {"name": widgets_col_name}],
        }

        query_data_result = self.factory.create_query_result(data=data)
        self.factory.create_query(name=f"allowed_widgets_{dashboard_id}", latest_query_data=query_data_result)

        org = self.factory.org

        class ClassToTest:
            current_org = org

            @add_allowed_widgets_info
            def test_method(self, dashboard_id):
                return {"info": "info detail"}

        instance = ClassToTest()
        result = instance.test_method(1)

        assert "allowed_widgets" in result
        assert result["allowed_widgets"] == {"controller1234": ["firstQueryViz", "secondQueryViz"]}


class TestAllowedWidgetsDashboardResourceGet(BaseTestCase):
    def test_return_allowed_widgets_if_the_query_exists(self):
        dashboard_id = 1
        parameter_col_name = "main_parameter"
        widgets_col_name = "widgets"

        # create query holding allowed widgets info
        data = {
            "rows": [{parameter_col_name: "controller1234", widgets_col_name: ["firstQueryViz", "secondQueryViz"]}],
            "columns": [{"name": parameter_col_name}, {"name": widgets_col_name}],
        }
        query_data_result = self.factory.create_query_result(data=data)
        self.factory.create_query(name=f"allowed_widgets_{dashboard_id}", latest_query_data=query_data_result)

        # call function to test
        allowed_widgets = get_allowed_widgets_info(
            dashboard_id, parameter_col_name, widgets_col_name, self.factory.org
        )

        # assertions
        assert {"controller1234": ["firstQueryViz", "secondQueryViz"]} == allowed_widgets

    def test_allowed_widgets_is_empty_if_wrong_query_row_keys(self):
        dashboard_id = 1
        parameter_col_name = "main_param"
        widgets_col_name = "widgets"

        # create query holding allowed widgets info
        data = {
            "rows": [{parameter_col_name: "controller1234", widgets_col_name: ["firstQueryViz", "secondQueryViz"]}],
            "columns": [{"name": parameter_col_name}, {"name": widgets_col_name}],
        }
        query_data_result = self.factory.create_query_result(data=data)

        # call function to test
        self.factory.create_query(name=f"allowed_widgets_{dashboard_id}", latest_query_data=query_data_result)

        # assertions
        assert get_allowed_widgets_info(dashboard_id, "main_parameter", widgets_col_name, self.factory.org) == {}

    def test_allowed_widgets_is_empty_if_the_query_doesnt_exists(self):
        dashboard_id = 1
        parameter_col_name = "main_parameter"
        widgets_col_name = "widgets"

        # call function to test and assert its result
        assert get_allowed_widgets_info(dashboard_id, parameter_col_name, widgets_col_name, self.factory.org) == {}

    def test_does_not_return_data_from_a_different_org(self):
        dashboard_id = 1
        parameter_col_name = "main_parameter"
        widgets_col_name = "widgets"

        # create a query with the same name in a different org
        other_org = self.factory.create_org()
        data = {
            "rows": [{parameter_col_name: "other_org_controller", widgets_col_name: ["otherViz"]}],
            "columns": [{"name": parameter_col_name}, {"name": widgets_col_name}],
        }
        query_data_result = self.factory.create_query_result(data=data)
        self.factory.create_query(
            name=f"allowed_widgets_{dashboard_id}",
            latest_query_data=query_data_result,
            org=other_org,
        )

        # querying for the current org should return nothing
        allowed_widgets = get_allowed_widgets_info(
            dashboard_id, parameter_col_name, widgets_col_name, self.factory.org
        )
        assert allowed_widgets == {}

    def test_resolves_via_dashboard_identifier_when_set(self):
        parameter_col_name = "main_parameter"
        widgets_col_name = "widgets"

        # Dashboard with allowed widget query identifier "the-aw-query"
        dashboard = self.factory.create_dashboard()
        db.session.add(
            MetrDashboard(
                dashboard_id=dashboard.id,
                org_id=dashboard.org_id,
                allowed_widget_query_identifier="the-aw-query",
            )
        )

        # A query (NOT named via the legacy convention) carries the mapping
        data = {
            "rows": [{parameter_col_name: "controller42", widgets_col_name: ["vizA"]}],
            "columns": [{"name": parameter_col_name}, {"name": widgets_col_name}],
        }
        query_data_result = self.factory.create_query_result(data=data)
        query = self.factory.create_query(name="some-other-name", latest_query_data=query_data_result)
        db.session.add(
            MetrQuery(
                query_id=query.id,
                org_id=query.org_id,
                query_identifier="the-aw-query",
            )
        )
        db.session.flush()

        allowed_widgets = get_allowed_widgets_info(
            dashboard.id, parameter_col_name, widgets_col_name, self.factory.org
        )
        assert allowed_widgets == {"controller42": ["vizA"]}

    def test_falls_back_to_legacy_query_name_when_identifier_null(self):
        parameter_col_name = "main_parameter"
        widgets_col_name = "widgets"

        dashboard = self.factory.create_dashboard()
        db.session.add(
            MetrDashboard(
                dashboard_id=dashboard.id,
                org_id=dashboard.org_id,
                allowed_widget_query_identifier=None,
            )
        )

        data = {
            "rows": [{parameter_col_name: "legacy", widgets_col_name: ["legacyViz"]}],
            "columns": [{"name": parameter_col_name}, {"name": widgets_col_name}],
        }
        query_data_result = self.factory.create_query_result(data=data)
        self.factory.create_query(name=f"allowed_widgets_{dashboard.id}", latest_query_data=query_data_result)
        db.session.flush()

        allowed_widgets = get_allowed_widgets_info(
            dashboard.id, parameter_col_name, widgets_col_name, self.factory.org
        )
        assert allowed_widgets == {"legacy": ["legacyViz"]}

    def test_does_not_resolve_metr_query_from_other_org(self):
        parameter_col_name = "main_parameter"
        widgets_col_name = "widgets"

        # Current-org dashboard points at "shared-id"
        dashboard = self.factory.create_dashboard()
        db.session.add(
            MetrDashboard(
                dashboard_id=dashboard.id,
                org_id=dashboard.org_id,
                allowed_widget_query_identifier="shared-id",
            )
        )

        # A different org has a MetrQuery with the same identifier
        other_org = self.factory.create_org()
        other_data = {
            "rows": [{parameter_col_name: "leaky", widgets_col_name: ["leakyViz"]}],
            "columns": [{"name": parameter_col_name}, {"name": widgets_col_name}],
        }
        other_qr = self.factory.create_query_result(data=other_data)
        other_query = self.factory.create_query(name="x", latest_query_data=other_qr, org=other_org)
        db.session.add(
            MetrQuery(
                query_id=other_query.id,
                org_id=other_org.id,
                query_identifier="shared-id",
            )
        )
        db.session.flush()

        # No matching MetrQuery in current org, no legacy-named query either -> empty
        allowed_widgets = get_allowed_widgets_info(
            dashboard.id, parameter_col_name, widgets_col_name, self.factory.org
        )
        assert allowed_widgets == {}
