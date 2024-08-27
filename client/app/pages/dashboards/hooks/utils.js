export function getAllowedWidgetsForCurrentParam(dashboardParameters, dashboardAllowedWidgets, dashboardAllWidgets) {
  try {
    // filter the widgets by keeping only the ones we want
    for (var param of dashboardParameters) {
      const paramValue = param.value;
      // check if we have allowed widgets for this param value
      if (dashboardAllowedWidgets !== undefined && dashboardAllowedWidgets.hasOwnProperty(paramValue)) {
        // filter the widgets to process
        const allowedWidgets = dashboardAllowedWidgets[paramValue];
        return dashboardAllWidgets.filter(
          widget => !widget.visualization || allowedWidgets.includes(widget.visualization.name)
        );
      }
    }
  } catch (error) {
    console.error(error);
  }

  return dashboardAllWidgets;
}
