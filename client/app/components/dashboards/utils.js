import cfg from "@/config/dashboard-grid-options";

export function keepLayoutsOrder(orderedLayoutsIds, layouts, widgets) {
  const newLayouts = [];
  let currentY = 0;
  let usedColumns = 0;
  let previousLayout = null;
  let heightLeft = 0;
  let biggestHeightInLine = 0;
  orderedLayoutsIds.forEach(id => {
    const layout = layouts.find(l => l.i === id.toString());
    if (layout) {
      if (!previousLayout) {
        // first layout ever
        layout.y = currentY;
        layout.x = 0;
        usedColumns = layout.w;
        biggestHeightInLine = layout.h;
      } else {
        // we have a previous layout
        // we check if previous layout is a textbox
        let foundPreviousWidget = widgets.find(widget => widget.id.toString() === previousLayout.i);
        let isPreviousTextbox = foundPreviousWidget && !foundPreviousWidget.visualization;
        // we check if current layout is textbox
        let foundWidget = widgets.find(widget => widget.id.toString() === layout.i);
        let isWidgetTextbox = foundWidget && !foundWidget.visualization;

        // we check if we need to put the layout in new line
        let newLineCondition =
          isWidgetTextbox ||
          isPreviousTextbox ||
          previousLayout.w + layout.w > cfg.columns ||
          usedColumns + layout.w > cfg.columns;

        if (newLineCondition) {
          // put the layout in new line
          if (heightLeft > 0) {
            currentY += heightLeft;
          } else if (heightLeft < 0) {
            currentY += biggestHeightInLine;
          } else {
            currentY += previousLayout.h;
          }

          layout.y = currentY;
          layout.x = 0;
          usedColumns = layout.w;
          biggestHeightInLine = layout.h;
        } else {
          // put the layout in same line as previous
          layout.y = previousLayout.y;
          layout.x = previousLayout.x === 0 ? previousLayout.w : 0;
          heightLeft = layout.h - previousLayout.h;
          biggestHeightInLine = Math.max(previousLayout.h, layout.h);
          currentY += biggestHeightInLine - previousLayout.h;
          usedColumns += layout.w;
        }
      }
      newLayouts.push(layout);
      previousLayout = layout;
    }
  });

  return newLayouts;
}
