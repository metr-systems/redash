from redash import models
from tests import BaseTestCase

class TestMetrWidgetTagsResource(BaseTestCase):
    def test_post_updates_tags_of_metr_widget(self):
        widget = self.factory.create_widget()
        metr_widget = models.metrWidget(widget=widget, tags=["tag1", "tag2"])
        models.db.session.add(metr_widget)
        models.db.session.commit()

        new_tags = ["tag3", "tag4"]
        widget_properties = {"tags": new_tags}

        response =  self.make_request("post",f"/api/metrwidgets/{widget.id}/tags", data=widget_properties)

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

        response =  self.make_request("post",f"/api/metrwidgets/{widget.id}/tags", data=widget_properties)

        self.assertEqual(response.status_code, 200)
        self.assertEqual(widget.metr_widget.tags, new_tags)
        self.assertEqual(widget.metr_widget.widget_id,widget.id)
