export function getAllowedWidgetsForCurrentParam(dashboardParameters, dashboardAllowedWidgets, dashboardAllWidgets) {
  try {
    // filter the widgets by keeping only the ones we want
    // get identifier of the current controller
    for (var param of dashboardParameters) {
      const controllerParam = param.value;
      // check if we have allowed widgets for this param value
      // get the allowed widgets for the current controller
      if (dashboardAllowedWidgets.hasOwnProperty(controllerParam)) {
        // filter the widgets to process
        const allowedWidgetsIds = dashboardAllowedWidgets[controllerParam];
        return dashboardAllWidgets.filter(widget => allowedWidgetsIds.includes(widget.id));
      }
    }
  } catch (error) {
    console.error(error);
  }

  return dashboardAllWidgets;
}
