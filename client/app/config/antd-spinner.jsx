import React from "react";
import Spin from "antd/lib/spin";
import i18next from "i18next";

Spin.setDefaultIndicator(
  <span role="status" aria-live="polite" aria-relevant="additions removals">
    <i className="fa fa-spinner fa-pulse" aria-hidden="true" />
    <span className="sr-only">{i18next.t("Loading...")}</span>
  </span>
);
