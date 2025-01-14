import React from "react";
import { Section, Input } from "@/components/visualizations/editor";
import { EditorPropTypes } from "@/visualizations/prop-types";

import { useTranslation } from "react-i18next";

export default function Editor({ options, onOptionsChange }: any) {
  const { t } = useTranslation("vizlib");
  const onXAxisLabelChanged = (xAxisLabel: any) => {
    const newOptions = { ...options, xAxisLabel };
    onOptionsChange(newOptions);
  };

  const onYAxisLabelChanged = (yAxisLabel: any) => {
    const newOptions = { ...options, yAxisLabel };
    onOptionsChange(newOptions);
  };

  return (
    <React.Fragment>
      {/* @ts-expect-error ts-migrate(2745) FIXME: This JSX tag's 'children' prop expects type 'never... Remove this comment to see the full error message */}
      <Section>
        <Input
          label={t("X Axis Label")}
          data-test="BoxPlot.XAxisLabel"
          value={options.xAxisLabel}
          onChange={(event: any) => onXAxisLabelChanged(event.target.value)}
        />
      </Section>

      {/* @ts-expect-error ts-migrate(2745) FIXME: This JSX tag's 'children' prop expects type 'never... Remove this comment to see the full error message */}
      <Section>
        <Input
          label={t("Y Axis Label")}
          data-test="BoxPlot.YAxisLabel"
          value={options.yAxisLabel}
          onChange={(event: any) => onYAxisLabelChanged(event.target.value)}
        />
      </Section>
    </React.Fragment>
  );
}

Editor.propTypes = EditorPropTypes;
