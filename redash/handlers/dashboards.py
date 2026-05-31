from flask import request, url_for
from flask_babel import _
from flask_restful import abort
from funcy import partial, project
from sqlalchemy.orm.exc import StaleDataError

from redash import models
from redash.handlers.base import (
    BaseResource,
    filter_by_tags,
    get_object_or_404,
    paginate,
)
from redash.handlers.base import order_results as _order_results
from redash.permissions import (
    can_modify,
    require_admin_or_owner,
    require_dashboard_group_access,
    require_object_modify_permission,
    require_permission,
)
from redash.security import csp_allows_embeding
from redash.serializers import DashboardSerializer, public_dashboard

# Ordering map for relationships
order_map = {
    "name": "lowercase_name",
    "-name": "-lowercase_name",
    "created_at": "created_at",
    "-created_at": "-created_at",
}

order_results = partial(_order_results, default_order="-created_at", allowed_orders=order_map)


class DashboardListResource(BaseResource):
    @require_permission("list_dashboards")
    def get(self):
        """
        Lists all accessible dashboards.

        :qparam number page_size: Number of queries to return per page
        :qparam number page: Page number to retrieve
        :qparam number order: Name of column to order by
        :qparam number q: Full text search term

        Responds with an array of :ref:`dashboard <dashboard-response-label>`
        objects.
        """
        search_term = request.args.get("q")

        group_ids = self.current_user.group_ids
        is_admin = self.current_user.has_any_permission(["admin", "super_admin"])
        if is_admin:
            group_ids = [group.id for group in models.Group.all(self.current_org)]

        if search_term:
            results = models.Dashboard.search(self.current_org, group_ids, self.current_user.id, search_term, is_admin)
        else:
            results = models.Dashboard.all(self.current_org, group_ids, self.current_user.id, is_admin)

        results = filter_by_tags(results, models.Dashboard.tags)

        # order results according to passed order parameter,
        # special-casing search queries where the database
        # provides an order by search rank
        ordered_results = order_results(results, fallback=not bool(search_term))

        page = request.args.get("page", 1, type=int)
        page_size = request.args.get("page_size", 25, type=int)

        response = paginate(
            ordered_results,
            page=page,
            page_size=page_size,
            serializer=DashboardSerializer,
        )

        if search_term:
            self.record_event({"action": "search", "object_type": "dashboard", "term": search_term})
        else:
            self.record_event({"action": "list", "object_type": "dashboard"})

        return response

    @require_permission("create_dashboard")
    def post(self):
        """
        Creates a new dashboard.

        :<json string name: Dashboard name

        Responds with a :ref:`dashboard <dashboard-response-label>`.
        """
        dashboard_properties = request.get_json(force=True)
        dashboard = models.Dashboard(
            name=dashboard_properties["name"],
            org=self.current_org,
            user=self.current_user,
            is_draft=True,
            layout=[],
        )

        default_group = self.current_org.default_group
        dashboard_group = models.DashboardGroup(dashboard=dashboard, group=default_group)

        models.db.session.add(dashboard)
        models.db.session.add(dashboard_group)
        models.db.session.commit()
        return DashboardSerializer(dashboard).serialize()


class MyDashboardsResource(BaseResource):
    @require_permission("list_dashboards")
    def get(self):
        """
        Retrieve a list of dashboards created by the current user.

        :qparam number page_size: Number of dashboards to return per page
        :qparam number page: Page number to retrieve
        :qparam number order: Name of column to order by
        :qparam number search: Full text search term

        Responds with an array of :ref:`dashboard <dashboard-response-label>`
        objects.
        """
        search_term = request.args.get("q", "")
        if search_term:
            results = models.Dashboard.search_by_user(search_term, self.current_user)
        else:
            results = models.Dashboard.by_user(self.current_user)

        results = filter_by_tags(results, models.Dashboard.tags)

        # order results according to passed order parameter,
        # special-casing search queries where the database
        # provides an order by search rank
        ordered_results = order_results(results, fallback=not bool(search_term))

        page = request.args.get("page", 1, type=int)
        page_size = request.args.get("page_size", 25, type=int)
        return paginate(ordered_results, page, page_size, DashboardSerializer)


def get_allowed_widgets_info(dashboard_id, parameter_col_name, widgets_col_name, org):
    """Resolve the query holding the allowed_widgets info for a dashboard and
    build the {parameter_value: [widget_ids]} mapping from its latest result.

    Resolution order:
      1. MetrDashboard.allowed_widget_query_identifier -> MetrQuery -> Query
      2. Fallback: a query named f"allowed_widgets_{dashboard_id}" in the org

    Returns an empty dict if no query is found.
    """
    query = None

    # 1) MetrDashboard.allowed_widget_query_identifier -> MetrQuery -> Query
    metr_dashboard = models.MetrDashboard.query.filter(
        models.MetrDashboard.dashboard_id == dashboard_id,
        models.MetrDashboard.org_id == org.id,
    ).first()
    if metr_dashboard and metr_dashboard.allowed_widget_query_identifier:
        metr_query = (
            models.db.session.query(models.MetrQuery)
            .filter(
                models.MetrQuery.org_id == org.id,
                models.MetrQuery.query_identifier == metr_dashboard.allowed_widget_query_identifier,
            )
            .first()
        )
        if metr_query:
            query = metr_query.query

    # 2) Fallback: legacy naming convention
    if query is None:
        query = models.Query.query.filter(
            models.Query.name == f"allowed_widgets_{dashboard_id}",
            models.Query.org == org,
        ).first()

    # construct the allowed_widgets dictionary from the query data
    allowed_widgets = {}
    if query:
        data = query.latest_query_data.data["rows"]
        for row in data:
            if parameter_col_name in row.keys() and widgets_col_name in row.keys():
                allowed_widgets[row[parameter_col_name]] = row[widgets_col_name]

    return allowed_widgets


def add_allowed_widgets_info(method):
    """Decorator that adds the ``allowed_widgets`` mapping to the serialized
    dashboard when an allowed-widgets query exists and
    yields a non-empty mapping. Nothings otherwise.
    """

    def wrapper(self, dashboard_id):
        result = method(self, dashboard_id)

        parameter_col_name = "main_parameter"
        widgets_col_name = "widgets"

        # Use result["id"] from the serialized dashboard — the URL param may be a slug
        # when ?legacy is used, which would break integer-column comparisons.
        allowed_widgets = get_allowed_widgets_info(
            result["id"], parameter_col_name, widgets_col_name, self.current_org
        )
        if allowed_widgets:
            result["allowed_widgets"] = allowed_widgets
        return result

    return wrapper


class DashboardResource(BaseResource):
    @require_permission("list_dashboards")
    @add_allowed_widgets_info
    def get(self, dashboard_id=None):
        """
        Retrieves a dashboard.

        :qparam number id: Id of dashboard to retrieve.

        .. _dashboard-response-label:

        :>json number id: Dashboard ID
        :>json string name:
        :>json string slug:
        :>json number user_id: ID of the dashboard creator
        :>json string created_at: ISO format timestamp for dashboard creation
        :>json string updated_at: ISO format timestamp for last dashboard modification
        :>json number version: Revision number of dashboard
        :>json boolean dashboard_filters_enabled: Whether filters are enabled or not
        :>json boolean is_archived: Whether this dashboard has been removed from the index or not
        :>json boolean is_draft: Whether this dashboard is a draft or not.
        :>json array layout: Array of arrays containing widget IDs, corresponding to the rows and columns the widgets are displayed in
        :>json array widgets: Array of arrays containing :ref:`widget <widget-response-label>` data
        :>json object options: Dashboard options

        .. _widget-response-label:

        Widget structure:

        :>json number widget.id: Widget ID
        :>json number widget.width: Widget size
        :>json object widget.options: Widget options
        :>json number widget.dashboard_id: ID of dashboard containing this widget
        :>json string widget.text: Widget contents, if this is a text-box widget
        :>json object widget.visualization: Widget contents, if this is a visualization widget
        :>json string widget.created_at: ISO format timestamp for widget creation
        :>json string widget.updated_at: ISO format timestamp for last widget modification
        """
        if request.args.get("legacy") is not None:
            fn = models.Dashboard.get_by_slug_and_org
        else:
            fn = models.Dashboard.get_by_id_and_org
        dashboard = get_object_or_404(fn, dashboard_id, self.current_org)

        require_dashboard_group_access(dashboard, self.current_user)

        response = DashboardSerializer(dashboard, with_widgets=True, user=self.current_user).serialize()

        api_key = models.ApiKey.get_by_object(dashboard)
        if api_key:
            response["public_url"] = url_for(
                "redash.public_dashboard",
                token=api_key.api_key,
                org_slug=self.current_org.slug,
                _external=True,
            )
            response["api_key"] = api_key.api_key

        response["can_edit"] = can_modify(dashboard, self.current_user)

        self.record_event({"action": "view", "object_id": dashboard.id, "object_type": "dashboard"})
        return response

    @require_permission("edit_dashboard")
    def post(self, dashboard_id):
        """
        Modifies a dashboard.

        :qparam number id: Id of dashboard to retrieve.

        Responds with the updated :ref:`dashboard <dashboard-response-label>`.

        :status 200: success
        :status 409: Version conflict -- dashboard modified since last read
        """
        dashboard_properties = request.get_json(force=True)
        # TODO: either convert all requests to use slugs or ids
        dashboard = models.Dashboard.get_by_id_and_org(dashboard_id, self.current_org)

        require_object_modify_permission(dashboard, self.current_user)

        updates = project(
            dashboard_properties,
            (
                "name",
                "layout",
                "version",
                "tags",
                "is_draft",
                "is_archived",
                "dashboard_filters_enabled",
                "options",
                "url_identifier",
                "allowed_widget_query_identifier",
            ),
        )

        # SQLAlchemy handles the case where a concurrent transaction beats us
        # to the update. But we still have to make sure that we're not starting
        # out behind.
        if "version" in updates and updates["version"] != dashboard.version:
            abort(409)

        updates["changed_by"] = self.current_user

        # Handle url_identifier separately for MetrDashboard.
        # Pass dashboard=dashboard so the backref is populated immediately;
        # session uses expire_on_commit=False so a cached metr_dashboard=None
        # would otherwise survive commit and be read by the serializer / the
        # allowed_widget_query_identifier block below.
        if "url_identifier" in updates:
            url_identifier = updates.pop("url_identifier")
            # Note: url_identifier is validated via validation API
            # to ensure it's never empty
            metr_dashboard = dashboard.metr_dashboard
            if not metr_dashboard:
                metr_dashboard = models.MetrDashboard(dashboard=dashboard, org_id=dashboard.org_id)
            metr_dashboard.url_identifier = url_identifier
            models.db.session.add(metr_dashboard)

        if "allowed_widget_query_identifier" in updates:
            query_identifier = updates.pop("allowed_widget_query_identifier") or None

            metr_dashboard = dashboard.metr_dashboard
            if not metr_dashboard:
                metr_dashboard = models.MetrDashboard(dashboard=dashboard, org_id=dashboard.org_id)

            metr_dashboard.allowed_widget_query_identifier = query_identifier
            models.db.session.add(metr_dashboard)

        self.update_model(dashboard, updates)
        models.db.session.add(dashboard)
        try:
            models.db.session.commit()
        except StaleDataError:
            abort(409)

        result = DashboardSerializer(dashboard, with_widgets=True, user=self.current_user).serialize()

        self.record_event({"action": "edit", "object_id": dashboard.id, "object_type": "dashboard"})

        return result

    @require_permission("edit_dashboard")
    def delete(self, dashboard_id):
        """
        Archives a dashboard.

        :qparam number id: Id of dashboard to retrieve.

        Responds with the archived :ref:`dashboard <dashboard-response-label>`.
        """
        dashboard = models.Dashboard.get_by_id_and_org(dashboard_id, self.current_org)
        dashboard.is_archived = True
        dashboard.record_changes(changed_by=self.current_user)
        models.db.session.add(dashboard)
        d = DashboardSerializer(dashboard, with_widgets=True, user=self.current_user).serialize()
        models.db.session.commit()

        self.record_event({"action": "archive", "object_id": dashboard.id, "object_type": "dashboard"})

        return d


class PublicDashboardResource(BaseResource):
    decorators = BaseResource.decorators + [csp_allows_embeding]

    def get(self, token):
        """
        Retrieve a public dashboard.

        :param token: An API key for a public dashboard.
        :>json array widgets: An array of arrays of :ref:`public widgets <public-widget-label>`, corresponding to the rows and columns the widgets are displayed in
        """
        if self.current_org.get_setting("disable_public_urls"):
            abort(400, message=_("Public URLs are disabled."))

        if not isinstance(self.current_user, models.ApiUser):
            api_key = get_object_or_404(models.ApiKey.get_by_api_key, token)
            dashboard = api_key.object
        else:
            dashboard = self.current_user.object

        return public_dashboard(dashboard)


class DashboardShareResource(BaseResource):
    def post(self, dashboard_id):
        """
        Allow anonymous access to a dashboard.

        :param dashboard_id: The numeric ID of the dashboard to share.
        :>json string public_url: The URL for anonymous access to the dashboard.
        :>json api_key: The API key to use when accessing it.
        """
        dashboard = models.Dashboard.get_by_id_and_org(dashboard_id, self.current_org)
        require_admin_or_owner(dashboard.user_id)
        api_key = models.ApiKey.create_for_object(dashboard, self.current_user)
        models.db.session.flush()
        models.db.session.commit()

        public_url = url_for(
            "redash.public_dashboard",
            token=api_key.api_key,
            org_slug=self.current_org.slug,
            _external=True,
        )

        self.record_event(
            {
                "action": "activate_api_key",
                "object_id": dashboard.id,
                "object_type": "dashboard",
            }
        )

        return {"public_url": public_url, "api_key": api_key.api_key}

    def delete(self, dashboard_id):
        """
        Disable anonymous access to a dashboard.

        :param dashboard_id: The numeric ID of the dashboard to unshare.
        """
        dashboard = models.Dashboard.get_by_id_and_org(dashboard_id, self.current_org)
        require_admin_or_owner(dashboard.user_id)
        api_key = models.ApiKey.get_by_object(dashboard)

        if api_key:
            api_key.active = False
            models.db.session.add(api_key)
            models.db.session.commit()

        self.record_event(
            {
                "action": "deactivate_api_key",
                "object_id": dashboard.id,
                "object_type": "dashboard",
            }
        )


class DashboardTagsResource(BaseResource):
    @require_permission("list_dashboards")
    def get(self):
        """
        Lists all accessible dashboards.
        """
        tags = models.Dashboard.all_tags(self.current_org, self.current_user)
        return {"tags": [{"name": name, "count": count} for name, count in tags]}


class DashboardFavoriteListResource(BaseResource):
    def get(self):
        search_term = request.args.get("q")

        if search_term:
            base_query = models.Dashboard.search(
                self.current_org,
                self.current_user.group_ids,
                self.current_user.id,
                search_term,
            )
            favorites = models.Dashboard.favorites(self.current_user, base_query=base_query)
        else:
            favorites = models.Dashboard.favorites(self.current_user)

        favorites = filter_by_tags(favorites, models.Dashboard.tags)

        # order results according to passed order parameter,
        # special-casing search queries where the database
        # provides an order by search rank
        favorites = order_results(favorites, fallback=not bool(search_term))

        page = request.args.get("page", 1, type=int)
        page_size = request.args.get("page_size", 25, type=int)
        # TODO: we don't need to check for favorite status here
        response = paginate(favorites, page, page_size, DashboardSerializer)

        self.record_event(
            {
                "action": "load_favorites",
                "object_type": "dashboard",
                "params": {
                    "q": search_term,
                    "tags": request.args.getlist("tags"),
                    "page": page,
                },
            }
        )

        return response


class DashboardForkResource(BaseResource):
    @require_permission("edit_dashboard")
    def post(self, dashboard_id):
        dashboard = models.Dashboard.get_by_id_and_org(dashboard_id, self.current_org)

        fork_dashboard = dashboard.fork(self.current_user)
        models.db.session.commit()

        self.record_event({"action": "fork", "object_id": dashboard_id, "object_type": "dashboard"})

        return DashboardSerializer(fork_dashboard, with_widgets=True).serialize()
