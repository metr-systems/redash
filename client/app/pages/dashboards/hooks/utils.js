import _ from "lodash";

function convertStringIntoList(stringList) {
  return stringList.replace(/[\[\]']/g, "").split(",");
}

function isWidgetToShow(allowedWidgets, listOfTags) {
  for (let index in listOfTags) {
    let tag = listOfTags[index];
    let listOfNames = tag.split(";");
    listOfNames = _.union(listOfNames, [tag]);
    if (_.intersection(allowedWidgets, listOfNames).length > 0) {
      return true;
    }
  }
  return false;
}

export function getAllowedWidgetsForCurrentParam(dashboardParameters, AllowedWidgetsIdentifiers, dashboardAllWidgets) {
  try {
    // filter the widgets by keeping only the ones we want
    for (var param of dashboardParameters) {
      const paramValue = param.value;
      // check if we have allowed widgets for this param value
      if (AllowedWidgetsIdentifiers !== undefined && AllowedWidgetsIdentifiers.hasOwnProperty(paramValue)) {
        // filter the widgets to process
        let allowedWidgets = convertStringIntoList(AllowedWidgetsIdentifiers[paramValue]);

        let filtered_wgt_id = dashboardAllWidgets
          .filter(widget => isWidgetToShow(allowedWidgets, widget.tags))
          .map(widget => widget.id);

        // we only consider one main parameter, this is why we return here
        return dashboardAllWidgets.filter(widget => filtered_wgt_id.includes(widget.id));
      }
    }
  } catch (error) {
    console.error(error);
  }

  return dashboardAllWidgets;
}
