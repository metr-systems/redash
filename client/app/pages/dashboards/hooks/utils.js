import _ from "lodash";

export function getAllowedWidgetsForCurrentParam(dashboardParameters, dashboardAllowedWidgets, dashboardAllWidgets) {
  try {
    // filter the widgets by keeping only the ones we want
    for (var param of dashboardParameters) {
      const paramValue = param.value;
      // check if we have allowed widgets for this param value
      if (dashboardAllowedWidgets !== undefined && dashboardAllowedWidgets.hasOwnProperty(paramValue)) {
        // filter the widgets to process
        let allowedWidgets = dashboardAllowedWidgets[paramValue];
        allowedWidgets = allowedWidgets
          .replace("[", "")
          .replace("]", "")
          .replaceAll("'", "")
          .split(",");
        let filtered_wgt_id = [];
        for (let widget of dashboardAllWidgets) {
          if (!widget.visualization) {
            // if widget is a textbox - we show it
            filtered_wgt_id.push(widget.id);
          } else {
            // if widget is not a textbox
            // if the visualization name or any subset name in it is in allowedWidgets list - we show it
            let listOfNames = widget.visualization.name.split(";");
            listOfNames = _.union(listOfNames, [widget.visualization.name]);
            if (_.intersection(allowedWidgets, listOfNames).length > 0) {
              filtered_wgt_id.push(widget.id);
            }
          }
        }
        // we only consider one main parameter, this is why we return here
        return dashboardAllWidgets.filter(widget => filtered_wgt_id.includes(widget.id));
      }
    }
  } catch (error) {
    console.error(error);
  }

  return dashboardAllWidgets;
}
