import React from "react";
import { Trans } from "react-i18next";

export default function Editor() {
  return (
    <React.Fragment>
      <p>
        <Trans i18nKey="viz-lib:sankeyEditor_description">This visualization expects the query result to have rows in the following format:</Trans>
      </p>
      <ul>
        <li>
          <Trans i18nKey="viz-lib:sankeyEditor_stage1"><strong>stage1</strong> - stage 1 value</Trans>
        </li>
        <li>
          <Trans i18nKey="viz-lib:sankeyEditor_stage2"><strong>stage2</strong> - stage 2 value (or null)</Trans>
        </li>
        <li>
          <Trans i18nKey="viz-lib:sankeyEditor_stage3"><strong>stage3</strong> - stage 3 value (or null)</Trans>
        </li>
        <li>
          <Trans i18nKey="viz-lib:sankeyEditor_stage4"><strong>stage4</strong> - stage 4 value (or null)</Trans>
        </li>
        <li>
          <Trans i18nKey="viz-lib:sankeyEditor_stage5"><strong>stage5</strong> - stage 5 value (or null)</Trans>
        </li>
        <li>
          <Trans i18nKey="viz-lib:sankeyEditor_value"><strong>value</strong> - number of times this sequence occurred</Trans>
        </li>
      </ul>
    </React.Fragment>
  );
}
