import React from "react";

import { useTranslation } from "react-i18next";

import Widget from "./Widget";

function RestrictedWidget(props) {
  const { t } = useTranslation("Dashboards");
  return (
    <Widget {...props} className="d-flex justify-content-center align-items-center widget-restricted">
      <div className="t-body scrollbox">
        <div className="text-center">
          <h1>
            <span className="zmdi zmdi-lock" />
          </h1>
          <p className="text-muted">
            {t("This widget requires access to a data source you don&apos;t have access to.")}
          </p>
        </div>
      </div>
    </Widget>
  );
}

export default RestrictedWidget;
