import json

from redash import models
from tests import BaseTestCase
from tests.handlers.test_widgets import WidgetAPITest


class TestMetrWidgetTagsResource(BaseTestCase):
    def test_get_returns_tags_of_metr_widget(self):
        widget = self.factory.create_widget()

        metr_widget = models.metrWidget(widget=widget, widget_id=widget.id, tags=["tag1", "tag2"])
        models.db.session.add(metr_widget)
        models.db.session.commit()

        response = self.make_request("get",f"/api/widgets/{widget.id}/tags")

        self.assertEqual(response.status_code, 200)
        self.assertEqual(json.loads(response.data), {"tags": [{"name": "tag1"}, {"name": "tag2"}]})

    # Note case test_get_returns_error_if_widget_not_found was skipped

    def test_get_returns_empty_list_if_metr_widget_not_found(self):
        widget=self.factory.create_widget()
        models.db.session.add(widget)
        models.db.session.commit()

        response = self.make_request("get",f"/api/widgets/{widget.id}/tags")

        self.assertEqual(response.status_code, 200)
        self.assertEqual(json.loads(response.data), {"tags": []})

    # Note case test_post_returns_error_if_widget_not_found was skipped

    def test_post_updates_tags_of_metr_widget(self):
        widget = self.factory.create_widget()
        metr_widget = models.metrWidget(widget=widget, tags=["tag1", "tag2"])
        models.db.session.add(metr_widget)
        models.db.session.commit()

        new_tags = ["tag3", "tag4"]
        widget_properties = {"tags": new_tags}

        response =  self.make_request("post",f"/api/widgets/{widget.id}/tags", data=widget_properties)

        self.assertEqual(response.status_code, 200)
        self.assertEqual(metr_widget.tags, new_tags)


class TestWidgetAPI(WidgetAPITest):
    def test_create_widget_creates_also_metr_widget(self):
        self.assertTrue(len(models.metrWidget.query.all())  == 0)

        dashboard = self.factory.create_dashboard()
        vis = self.factory.create_visualization()

        rv = self.create_widget(dashboard, vis)

        self.assertEqual(rv.status_code, 200)
        self.assertTrue(len(models.metrWidget.query.all()) == 1)
