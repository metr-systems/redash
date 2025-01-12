import React from "react";
import { Section } from "@/components/visualizations/editor";
import { Trans } from "react-i18next";

export default function Editor() {
  return (
    <React.Fragment>
      <p>
        <Trans i18nKey="viz-lib:sunburst_editor_description">This visualization expects the query result to have rows in one of the following formats:</Trans>
      </p>
      {/* @ts-expect-error ts-migrate(2746) FIXME: This JSX tag's 'children' prop expects a single ch... Remove this comment to see the full error message */}
      <Section>
        <p>
          <strong><Trans i18nKey="viz-lib:sunburst_editor_option1">Option 1:</Trans></strong>
        </p>
        <ul>
          <li>
            <Trans i18nKey="viz-lib:sunburst_editor_option1_sequence"><strong>sequence</strong> - sequence id</Trans>
          </li>
          <li>
            <Trans i18nKey="viz-lib:sunburst_editor_option1_stage"><strong>stage</strong> - what stage in sequence this is (1, 2, ...)</Trans>
          </li>
          <li>
            <Trans i18nKey="viz-lib:sunburst_editor_option1_node"><strong>node</strong> - stage name</Trans>
          </li>
          <li>
            <Trans i18nKey="viz-lib:sunburst_editor_option1_value"><strong>value</strong> - number of times this sequence occurred</Trans>
          </li>
        </ul>
      </Section>
      {/* @ts-expect-error ts-migrate(2746) FIXME: This JSX tag's 'children' prop expects a single ch... Remove this comment to see the full error message */}
      <Section>
        <p>
          <strong><Trans i18nKey="viz-lib:sunburst_editor_option2">Option 2:</Trans></strong>
        </p>
        <ul>
          <li>
            <Trans i18nKey="viz-lib:sunburst_editor_option2_stage1"><strong>stage1</strong> - stage 1 value</Trans>
          </li>
          <li>
            <Trans i18nKey="viz-lib:sunburst_editor_option2_stage2"><strong>stage2</strong> - stage 2 value (or null)</Trans>
          </li>
          <li>
            <Trans i18nKey="viz-lib:sunburst_editor_option2_stage3"><strong>stage3</strong> - stage 3 value (or null)</Trans>
          </li>
          <li>
            <Trans i18nKey="viz-lib:sunburst_editor_option2_stage4"><strong>stage4</strong> - stage 4 value (or null)</Trans>
          </li>
          <li>
            <Trans i18nKey="viz-lib:sunburst_editor_option2_stage5"><strong>stage5</strong> - stage 5 value (or null)</Trans>
          </li>
          <li>
            <Trans i18nKey="viz-lib:sunburst_editor_option2_value"><strong>value</strong> - number of times this sequence occurred</Trans>
          </li>
        </ul>
      </Section>
    </React.Fragment>
  );
}
