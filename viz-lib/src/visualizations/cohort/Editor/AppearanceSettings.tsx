import React from "react";
import { useDebouncedCallback } from "use-debounce";
import { Section, Input, Checkbox, ContextHelp } from "@/components/visualizations/editor";
import { EditorPropTypes } from "@/visualizations/prop-types";
import { Trans, useTranslation } from "react-i18next";

export default function AppearanceSettings({ options, onOptionsChange }: any) {
  const { t } = useTranslation("viz-lib");
  const [debouncedOnOptionsChange] = useDebouncedCallback(onOptionsChange, 200);

  return (
    <React.Fragment>
      {/* @ts-expect-error ts-migrate(2745) FIXME: This JSX tag's 'children' prop expects type 'never... Remove this comment to see the full error message */}
      <Section>
        <Input
          layout="horizontal"
          label={t("Time Column Title")}
          defaultValue={options.timeColumnTitle}
          onChange={(e: any) => debouncedOnOptionsChange({ timeColumnTitle: e.target.value })}
        />
      </Section>
      {/* @ts-expect-error ts-migrate(2745) FIXME: This JSX tag's 'children' prop expects type 'never... Remove this comment to see the full error message */}
      <Section>
        <Input
          layout="horizontal"
          label={t("People Column Title")}
          defaultValue={options.peopleColumnTitle}
          onChange={(e: any) => debouncedOnOptionsChange({ peopleColumnTitle: e.target.value })}
        />
      </Section>
      {/* @ts-expect-error ts-migrate(2745) FIXME: This JSX tag's 'children' prop expects type 'never... Remove this comment to see the full error message */}
      <Section>
        <Input
          layout="horizontal"
          label={
            <React.Fragment>
              {t("Stage Column Title")}
              <ContextHelp placement="topRight" arrowPointAtCenter>
                {/* @ts-expect-error ts-migrate(2322) FIXME: Type 'Element' is not assignable to type 'null | u... Remove this comment to see the full error message */}
                <div>
                  <Trans ns="viz-lib">
                    Use <code>{"{{ @ }}"}</code> to insert a stage number
                  </Trans>
                </div>
              </ContextHelp>
            </React.Fragment>
          }
          defaultValue={options.stageColumnTitle}
          onChange={(e: any) => debouncedOnOptionsChange({ stageColumnTitle: e.target.value })}
        />
      </Section>

      {/* @ts-expect-error ts-migrate(2745) FIXME: This JSX tag's 'children' prop expects type 'never... Remove this comment to see the full error message */}
      <Section>
        <Input
          layout="horizontal"
          label={
            <React.Fragment>
              {t("Number Values Format")}
              <ContextHelp.NumberFormatSpecs />
            </React.Fragment>
          }
          defaultValue={options.numberFormat}
          onChange={(e: any) => debouncedOnOptionsChange({ numberFormat: e.target.value })}
        />
      </Section>
      {/* @ts-expect-error ts-migrate(2745) FIXME: This JSX tag's 'children' prop expects type 'never... Remove this comment to see the full error message */}
      <Section>
        <Input
          layout="horizontal"
          label={
            <React.Fragment>
              {t("Percent Values Format")}
              <ContextHelp.NumberFormatSpecs />
            </React.Fragment>
          }
          defaultValue={options.percentFormat}
          onChange={(e: any) => debouncedOnOptionsChange({ percentFormat: e.target.value })}
        />
      </Section>

      {/* @ts-expect-error ts-migrate(2745) FIXME: This JSX tag's 'children' prop expects type 'never... Remove this comment to see the full error message */}
      <Section>
        <Input
          layout="horizontal"
          label={t("No Value Placeholder")}
          defaultValue={options.noValuePlaceholder}
          onChange={(e: any) => debouncedOnOptionsChange({ noValuePlaceholder: e.target.value })}
        />
      </Section>

      {/* @ts-expect-error ts-migrate(2745) FIXME: This JSX tag's 'children' prop expects type 'never... Remove this comment to see the full error message */}
      <Section>
        <Checkbox
          defaultChecked={options.showTooltips}
          onChange={event => onOptionsChange({ showTooltips: event.target.checked })}>
          {t("Show Tooltips")}
        </Checkbox>
      </Section>
      {/* @ts-expect-error ts-migrate(2745) FIXME: This JSX tag's 'children' prop expects type 'never... Remove this comment to see the full error message */}
      <Section>
        <Checkbox
          defaultChecked={options.percentValues}
          onChange={event => onOptionsChange({ percentValues: event.target.checked })}>
          {t("Normalize Values to Percentage")}
        </Checkbox>
      </Section>
    </React.Fragment>
  );
}

AppearanceSettings.propTypes = EditorPropTypes;
