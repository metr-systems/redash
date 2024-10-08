
from flask import request

from redash import models
from redash.handlers.base import BaseResource
from redash.permissions import (
    require_object_modify_permission,
    require_permission
)
from redash.serializers import serialize_widget

class MetrWidgetTagsResource(BaseResource):
    """
    Resource for handling tags of a metrWidget.

    This resource provides methods for retrieving and updating tags associated with a metrWidget.
    """

    @require_permission("edit_dashboard")
    def post(self, widget_id):
        widget = models.Widget.get_by_id_and_org(widget_id, self.current_org)
        require_object_modify_permission(widget.dashboard, self.current_user)
        widget_properties = request.get_json(force=True)
        tags = widget_properties["tags"]

        if widget.metr_widget is None:
            metrWidget = models.metrWidget(widget=widget)
            models.db.session.add(metrWidget)

        widget.metr_widget.tags = tags
        models.db.session.commit()
        return serialize_widget(widget)
