def widgets_with_query(sub_dashboard):
    """Widgets that have a visualization, and therefore a query. Excludes text-box widgets."""
    return [widget for widget in sub_dashboard.widgets if widget.visualization_id is not None]
