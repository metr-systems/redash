from redash import models
from tests import BaseTestCase
from tests.handlers.test_widgets import WidgetAPITest


class TestMetrWidgetTagsResource(BaseTestCase):
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

    def test_post_creates_metrwidget_if_does_not_exist(self):
        widget = self.factory.create_widget()
        models.db.session.add(widget)
        models.db.session.commit()
        self.assertTrue(len(models.metrWidget.query.all())  == 0)
        self.assertTrue(len(models.Widget.query.all())  == 1)

        new_tags = ["tag3", "tag4"]
        widget_properties = {"tags": new_tags}

        response =  self.make_request("post",f"/api/widgets/{widget.id}/tags", data=widget_properties)

        self.assertEqual(response.status_code, 200)
        self.assertEqual(widget.metr_widget[0].tags, new_tags)
        self.assertEqual(widget.metr_widget[0].widget_id,widget.id)

class TestWidgetAPI(WidgetAPITest):
    def test_create_widget_creates_also_metr_widget(self):
        self.assertTrue(len(models.metrWidget.query.all())  == 0)

        dashboard = self.factory.create_dashboard()
        vis = self.factory.create_visualization()

        rv = self.create_widget(dashboard, vis)

        self.assertEqual(rv.status_code, 200)
        self.assertTrue(len(models.metrWidget.query.all()) == 1)
