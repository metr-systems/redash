import React from "react";
import { VisualizationType, registeredVisualizations } from "@redash/viz/lib";
import i18next from "i18next";

import "./VisualizationName.less";

function VisualizationName({ visualization }) {
  const config = registeredVisualizations[visualization.type];
  const translatedVizName = i18next.t(`vizlib:${visualization.name}`);
  const translatedConfigName = i18next.t(`vizlib:${visualization.name}`);

  return (
    <span className="visualization-name">
      {config &&
      visualization.name !== config.name &&
      translatedVizName !== config.name &&
      visualization.name !== translatedConfigName
        ? visualization.name
        : null}
    </span>
  );
}

VisualizationName.propTypes = {
  visualization: VisualizationType.isRequired,
};

export default VisualizationName;
