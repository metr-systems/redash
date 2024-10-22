import cfg from "@/config/dashboard-grid-options";

export function keepLayoutsOrder(orderedLayoutsIds, layouts, widgets) {
  const newLayouts = [];
  let currentY = 0;
  let usedColumns = 0;
  let biggestHeightInLine = 0;

  const getWidgetById = id => widgets.find(widget => widget.id.toString() === id.toString());
  const isTextbox = widget => widget && !widget.visualization;

  orderedLayoutsIds.forEach(id => {
    const layout = layouts.find(l => l.i === id.toString());
    if (!layout) return;

    const widget = getWidgetById(layout.i);
    const isWidgetTextbox = isTextbox(widget);

    if (newLayouts.length === 0) {
      // Position the first layout
      layout.y = currentY;
      layout.x = 0;
      usedColumns = layout.w;
      biggestHeightInLine = layout.h;
    } else {
      const previousLayout = newLayouts[newLayouts.length - 1];
      const previousWidget = getWidgetById(previousLayout.i);
      const isPreviousTextbox = isTextbox(previousWidget);

      const shouldMoveToNewLine =
        isWidgetTextbox ||
        isPreviousTextbox ||
        previousLayout.w + layout.w > cfg.columns ||
        usedColumns + layout.w > cfg.columns;

      if (shouldMoveToNewLine) {
        // Move to a new line
        currentY += biggestHeightInLine;
        layout.y = currentY;
        layout.x = 0;
        usedColumns = layout.w;
        biggestHeightInLine = layout.h;
      } else {
        // Place on the same line
        layout.y = previousLayout.y;
        layout.x = previousLayout.x + previousLayout.w;
        biggestHeightInLine = Math.max(biggestHeightInLine, layout.h);
        usedColumns += layout.w;
      }
    }
    newLayouts.push(layout);
  });

  return newLayouts;
}
