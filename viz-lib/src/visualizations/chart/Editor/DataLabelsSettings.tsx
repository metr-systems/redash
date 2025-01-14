import { includes } from "lodash";
import React from "react";
import { useDebouncedCallback } from "use-debounce";
import { Section, Input, Checkbox, ContextHelp } from "@/components/visualizations/editor";
import { EditorPropTypes } from "@/visualizations/prop-types";
import { Trans, useTranslation } from "react-i18next";

export default function DataLabelsSettings({ options, onOptionsChange }: any) {
  const { t } = useTranslation("vizlib");
  const isShowDataLabelsAvailable = includes(
    ["line", "area", "column", "scatter", "pie", "heatmap"],
    options.globalSeriesType
  );

  const [debouncedOnOptionsChange] = useDebouncedCallback(onOptionsChange, 200);

  return (
    <React.Fragment>
      {isShowDataLabelsAvailable && (
        // @ts-expect-error ts-migrate(2745) FIXME: This JSX tag's 'children' prop expects type 'never... Remove this comment to see the full error message
        <Section>
            <Checkbox
            data-test="Chart.DataLabels.ShowDataLabels"
            defaultChecked={options.showDataLabels}
            onChange={event => onOptionsChange({ showDataLabels: event.target.checked })}>
            {t("Show Data Labels")}
            </Checkbox>
        </Section>
      )}

      {/* @ts-expect-error ts-migrate(2745) FIXME: This JSX tag's 'children' prop expects type 'never... Remove this comment to see the full error message */}
      <Section>
        <Input
          label={
            <React.Fragment>
              {t("Number Values Format")}
              <ContextHelp.NumberFormatSpecs />
            </React.Fragment>
          }
          data-test="Chart.DataLabels.NumberFormat"
          defaultValue={options.numberFormat}
          onChange={(e: any) => debouncedOnOptionsChange({ numberFormat: e.target.value })}
        />
      </Section>

      {/* @ts-expect-error ts-migrate(2745) FIXME: This JSX tag's 'children' prop expects type 'never... Remove this comment to see the full error message */}
      <Section>
        <Input
          label={
            <React.Fragment>
              {t("Percent Values Format")}
              <ContextHelp.NumberFormatSpecs />
            </React.Fragment>
          }
          data-test="Chart.DataLabels.PercentFormat"
          defaultValue={options.percentFormat}
          onChange={(e: any) => debouncedOnOptionsChange({ percentFormat: e.target.value })}
        />
      </Section>

      {/* @ts-expect-error ts-migrate(2745) FIXME: This JSX tag's 'children' prop expects type 'never... Remove this comment to see the full error message */}
      <Section>
        <Input
          label={
            <React.Fragment>
              {t("Date/Time Values Format")}
              <ContextHelp.DateTimeFormatSpecs />
            </React.Fragment>
          }
          data-test="Chart.DataLabels.DateTimeFormat"
          defaultValue={options.dateTimeFormat}
          onChange={(e: any) => debouncedOnOptionsChange({ dateTimeFormat: e.target.value })}
        />
      </Section>

      {/* @ts-expect-error ts-migrate(2745) FIXME: This JSX tag's 'children' prop expects type 'never... Remove this comment to see the full error message */}
      <Section>
        <Input
          label={
            <React.Fragment>
              <Trans ns="vizlib">Data Labels</Trans>
              {/* @ts-expect-error ts-migrate(2746) FIXME: This JSX tag's 'children' prop expects a single ch... Remove this comment to see the full error message */}
              <ContextHelp placement="topRight" arrowPointAtCenter>
                <div style={{ paddingBottom: 5 }}>
                  {t("Use special names to access additional properties") + ":"}
                </div>
                <div>
                  <code>{"{{ @@name }}"}</code> {t("series name") + ";"}
                </div>
                <div>
                  <code>{"{{ @@x }}"}</code> {t("x-value") + ";"}
                </div>
                <div>
                  <code>{"{{ @@y }}"}</code> {t("y-value") + ";"}
                </div>
                <div>
                  <code>{"{{ @@yPercent }}"}</code> {t("relative y-value") + ";"}
                </div>
                <div>
                  <code>{"{{ @@yError }}"}</code> {t("y deviation") + ";"}
                </div>
                <div>
                  <code>{"{{ @@size }}"}</code> {t("bubble size") + ";"}
                </div>
                <div style={{ paddingTop: 5 }}>
                  <Trans ns="vizlib" key="QUERY_RESULT_REFERENCE">Also, all query result columns can be referenced
                  <br />
                  using
                  <code style={{ whiteSpace: "nowrap" }}>{"{{ column_name }}"}</code> syntax.
                  </Trans>
                </div>
              </ContextHelp>
            </React.Fragment>
          }
          data-test="Chart.DataLabels.TextFormat"
          placeholder="(auto)"
          defaultValue={options.textFormat}
          onChange={(e: any) => debouncedOnOptionsChange({ textFormat: e.target.value })}
        />
      </Section>
    </React.Fragment>
  );
}

DataLabelsSettings.propTypes = EditorPropTypes;
