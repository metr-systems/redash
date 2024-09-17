
from flask import request

from redash import models
from redash.handlers.base import BaseResource
from redash.permissions import (
    require_object_modify_permission,
    require_permission
)
from redash.serializers import serialize_widget

class metrWidgetTagsResource(BaseResource):
    """
    Resource for handling tags of a metrWidget.

    This resource provides methods for retrieving and updating tags associated with a metrWidget.
    """

    @require_permission("list_dashboards")
    def get(self, widget_id):
        widget=models.Widget.get_by_id_and_org(widget_id, self.current_org)
        metr_widget = models.metrWidget.query.filter(models.metrWidget.widget == widget).first()
        tags = metr_widget.tags if metr_widget else []
        return {"tags": [{"name": name} for name in tags]}

    @require_permission("edit_dashboard")
    def post(self, widget_id):
        widget = models.Widget.get_by_id_and_org(widget_id, self.current_org)
        require_object_modify_permission(widget.dashboard, self.current_user)
        widget_properties = request.get_json(force=True)
        tags = widget_properties["tags"]

        metrWidget=models.metrWidget.query.filter(models.metrWidget.widget==widget).first()
        metrWidget.tags = tags

        models.db.session.commit()
        return serialize_widget(widget)
