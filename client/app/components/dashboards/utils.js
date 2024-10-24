import cfg from "@/config/dashboard-grid-options";

export function keepLayoutsOrder(orderedLayoutsIds, layouts, widgets) {
  const newLayouts = [];
  let currentY = 0;
  let usedColumns = 0;
  let biggestHeightInLine = 0;

  const getWidgetById = id => widgets.find(widget => widget.id.toString() === id.toString());
  const isTextbox = widget => widget && !widget.visualization;

  const initNewLine = layout => {
    layout.y = currentY;
    layout.x = 0;
    usedColumns = layout.w;
    biggestHeightInLine = layout.h;
  };

  const moveToNewLine = layout => {
    currentY += biggestHeightInLine;
    initNewLine(layout);
  };

  const placeOnSameLine = (layout, previousLayout) => {
    layout.y = previousLayout.y;
    layout.x = previousLayout.x + previousLayout.w;
    biggestHeightInLine = Math.max(biggestHeightInLine, layout.h);
    usedColumns += layout.w;
  };

  const shouldMoveToNewLine = (isWidgetTextbox, isPreviousTextbox, previousLayout, layout) =>
    isWidgetTextbox ||
    isPreviousTextbox ||
    previousLayout.w + layout.w > cfg.columns ||
    usedColumns + layout.w > cfg.columns;

  orderedLayoutsIds.forEach(id => {
    const layout = layouts.find(l => l.i === id.toString());
    if (!layout) return;

    if (newLayouts.length === 0) {
      initNewLine(layout);
    } else {
      const widget = getWidgetById(layout.i);
      const isWidgetTextbox = isTextbox(widget);

      const previousLayout = newLayouts[newLayouts.length - 1];
      const previousWidget = getWidgetById(previousLayout.i);
      const isPreviousTextbox = isTextbox(previousWidget);

      if (shouldMoveToNewLine(isWidgetTextbox, isPreviousTextbox, previousLayout, layout)) {
        moveToNewLine(layout);
      } else {
        placeOnSameLine(layout, previousLayout);
      }
    }
    newLayouts.push(layout);
  });

  return newLayouts;
}
