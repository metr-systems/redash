from redash import models
from tests import BaseTestCase

class TestMetrWidgetTagsResource(BaseTestCase):
    def test_post_allowed_if_user_has_permission_to_edit_dashboard(self):
        # in other words if admin user
        widget = self.factory.create_widget()
        user = self.factory.create_admin(org=self.factory.org,group_ids=[self.factory.admin_group.id, self.factory.default_group.id]) # admin user
        
        response = self.make_request("post",f"/api/metrwidgets/{widget.id}/tags",data= {"tags":["tag1", "tag2"]}, user=user)
        self.assertEqual(response.status_code, 200)

    def test_post_not_allowed_if_does_not_have_permission_to_edit_dashboard(self):
        # in other words if not an admin user
        widget = self.factory.create_widget()
        user = self.factory.create_user(org=self.factory.org,group_ids=[self.factory.default_group.id])
        
        response = self.make_request("post",f"/api/metrwidgets/{widget.id}/tags",data= {"tags":["tag1", "tag2"]}, user=user)
        self.assertEqual(response.status_code, 403)

    def test_post_not_possible_if_admin_from_another_org(self):
        widget = self.factory.create_widget()
        user = self.factory.create_admin(org=self.factory.create_org(),group_ids=[self.factory.admin_group.id, self.factory.default_group.id])
        
        response = self.make_request("post",f"/api/metrwidgets/{widget.id}/tags",data= {"tags":["tag1", "tag2"]}, user=user)
        self.assertIn("Please login and try again", response.text)
        self.assertEqual(response.status_code, 404)

    def test_post_updates_tags_of_metr_widget(self):
        widget = self.factory.create_widget()
        metr_widget = models.metrWidget(widget=widget, tags=["tag1", "tag2"])
        models.db.session.add(metr_widget)
        models.db.session.commit()

        new_tags = ["tag3", "tag4"]
        widget_properties = {"tags": new_tags}

        # Note: no need to create_user and pass it to make_request as it is already created in setUp
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

        # Note: no need to create_user and pass it to make_request as it is already created in setUp
        response =  self.make_request("post",f"/api/metrwidgets/{widget.id}/tags", data=widget_properties)

        self.assertEqual(response.status_code, 200)
        self.assertEqual(widget.metr_widget.tags, new_tags)
        self.assertEqual(widget.metr_widget.widget_id,widget.id)
