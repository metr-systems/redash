import React, { useState } from "react";
import PropTypes from "prop-types";
import Button from "antd/lib/button";
import Input from "antd/lib/input";
import { useTranslation } from "react-i18next";
import { axios } from "@/services/axios";
import notification from "@/services/notification";
import InputWithCopy from "@/components/InputWithCopy";
import "./UrlIdentifierContainer.css";

function UrlIdentifierContainer({ dashboardConfiguration, style, ...props }) {
  const { t } = useTranslation("Dashboards");
  const [urlIdentifier, setUrlIdentifier] = useState("");
  const [saving, setSaving] = useState(false);
  const [localUrlIdentifier, setLocalUrlIdentifier] = useState(null); // Track locally set URL identifier
  const { dashboard, updateDashboard } = dashboardConfiguration;

  const handleSetUrlIdentifier = async () => {
    if (!urlIdentifier.trim()) return;
    setSaving(true);

    try {
      const response = await axios.post(`api/dashboards/${dashboard.id}/url_identifier/validate`, {
        url_identifier: urlIdentifier,
      });

      if (!response.valid) {
        if (response.errors) {
          response.errors.forEach(error => {
            notification.error(error);
          });
        }
        return;
      }

      await updateDashboard({ url_identifier: urlIdentifier });
      setLocalUrlIdentifier(urlIdentifier); // Set local state to immediately show readonly view
      setUrlIdentifier("");
      notification.success(t("URL identifier set successfully!"));
    } catch (error) {
      const errorMessage = error.response?.data?.error || t("Failed to save URL identifier. Please try again.");
      notification.error(errorMessage);
    } finally {
      setSaving(false);
    }
  };

  const currentUrlIdentifier = dashboard.url_identifier || localUrlIdentifier;
  if (currentUrlIdentifier) {
    return (
      <div className="add-widget-container url-identifier-container" style={style} {...props}>
        <h2>
          <i className="zmdi zmdi-widgets" aria-hidden="true" />
          <span className="hidden-xs hidden-sm">{t("This dashboard has a URL identifier")}.</span>
        </h2>
        <InputWithCopy
          value={`https://${window.location.host}/dashboards/by_url_identifier/${currentUrlIdentifier}`}
          readOnly
          className="url-identifier-input"
        />
      </div>
    );
  }

  return (
    <div className="add-widget-container" style={style} {...props}>
      <h2>
        <i className="zmdi zmdi-widgets" aria-hidden="true" />
        <span className="hidden-xs hidden-sm">
          {t("Create a custom URL identifier to make this dashboard easier to share and access")}.
        </span>
      </h2>
      <div className="url-identifier-input-container">
        <div>
          <Input
            size="small"
            placeholder={t("Enter URL identifier")}
            value={urlIdentifier}
            onChange={(e) => setUrlIdentifier(e.target.value)}
            onPressEnter={handleSetUrlIdentifier}
          />
          <Button 
            type="primary" 
            onClick={handleSetUrlIdentifier} 
            loading={saving} 
            disabled={!urlIdentifier.trim() || saving}
          >
            {t("Set Identifier")}
          </Button>
        </div>
      </div>
    </div>
  );
}

UrlIdentifierContainer.propTypes = {
  dashboardConfiguration: PropTypes.object.isRequired,
  style: PropTypes.object,
};

export default UrlIdentifierContainer;
