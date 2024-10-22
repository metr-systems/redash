import cfg from "@/config/dashboard-grid-options";

export function keepLayoutsOrder(orderedLayoutsIds, layouts, widgets) {
  const newLayouts = [];
  let currentY = 0;
  let usedColumns = 0;
  let previousLayout = null;
  let biggestHeightInLine = 0;

  orderedLayoutsIds.forEach(id => {
    const layout = layouts.find(l => l.i === id.toString());
    if (layout) {
      const foundWidget = widgets.find(widget => widget.id.toString() === layout.i);
      const isWidgetTextbox = foundWidget && !foundWidget.visualization;

      if (!previousLayout) {
        // First layout
        layout.y = currentY;
        layout.x = 0;
        usedColumns = layout.w;
        biggestHeightInLine = layout.h;
      } else {
        const foundPreviousWidget = widgets.find(widget => widget.id.toString() === previousLayout.i);
        const isPreviousTextbox = foundPreviousWidget && !foundPreviousWidget.visualization;

        const newLineCondition =
          isWidgetTextbox ||
          isPreviousTextbox ||
          previousLayout.w + layout.w > cfg.columns ||
          usedColumns + layout.w > cfg.columns;

        if (newLineCondition) {
          // New line
          currentY += biggestHeightInLine;
          layout.y = currentY;
          layout.x = 0;
          usedColumns = layout.w;
          biggestHeightInLine = layout.h;
        } else {
          // Same line
          layout.y = previousLayout.y;
          layout.x = previousLayout.x === 0 ? previousLayout.w : 0;
          biggestHeightInLine = Math.max(biggestHeightInLine, layout.h);
          usedColumns += layout.w;
        }
      }
      newLayouts.push(layout);
      previousLayout = layout;
    }
  });

  return newLayouts;
}
