import React, { useState, useEffect } from "react";
import PropTypes from "prop-types";
import Button from "antd/lib/button";
import Input from "antd/lib/input";
import { useTranslation } from "react-i18next";
import { get } from "lodash";
import { axios } from "@/services/axios";
import notification from "@/services/notification";
import InputWithCopy from "@/components/InputWithCopy";
import "./UrlIdentifierContainer.css";

// Component for managing dashboard URL identifiers - allows setting custom URLs for easier sharing
function UrlIdentifierContainer({ dashboardConfiguration, style}) {
  const { t } = useTranslation("Dashboards");
  const [urlIdentifier, setUrlIdentifier] = useState("");
  const [saving, setSaving] = useState(false);
  const [justUpdatedIdentifier, setJustUpdatedIdentifier] = useState("");
  const { dashboard, updateDashboard } = dashboardConfiguration;

  // Reset temporary state when backend confirms the URL identifier update
  useEffect(() => {
    if (dashboard.url_identifier && justUpdatedIdentifier) {
      setJustUpdatedIdentifier("");
    }
  }, [dashboard.url_identifier, justUpdatedIdentifier]);

  // Validates and sets the new URL identifier for the dashboard
  const handleSetUrlIdentifier = async () => {
    if (!urlIdentifier.trim()) return;
    
    setSaving(true);
    
    try {
      const response = await axios.post(`api/dashboards/${dashboard.id}/url_identifier/validate`, {
        url_identifier: urlIdentifier,
      });

      if (!response.valid) {
        void response.errors?.forEach(error => {
          notification.error(error);
        });
        return;
      }

      await updateDashboard({ url_identifier: urlIdentifier });
      setJustUpdatedIdentifier(urlIdentifier);
      setUrlIdentifier("");
      notification.success(t("URL identifier set successfully!"));
      
    } catch (error) {
      const errorMessage = get(error, "response.data.message") || t("Failed to save URL identifier. Please try again.");
      notification.error(errorMessage);
    } finally {
      setSaving(false);
    }
  };

  // Display the shareable URL when identifier exists
  if (dashboard.url_identifier || justUpdatedIdentifier) {
    const displayUrlIdentifier = dashboard.url_identifier || justUpdatedIdentifier;
    return (
      <div className="add-widget-container url-identifier-container" style={style}>
        <h2>
          <i className="zmdi zmdi-widgets" aria-hidden="true" />
          <span className="hidden-xs hidden-sm">{t("This dashboard has a URL identifier")}.</span>
        </h2>
        <InputWithCopy
          value={`${window.location.origin}/dashboards/by_url_identifier/${displayUrlIdentifier}`}
          readOnly
          className="url-identifier-input"
        />
      </div>
    );
  }

  // Show input form for creating new URL identifier
  return (
    <div className="add-widget-container" style={style}>
      <h2>
        <i className="zmdi zmdi-widgets" aria-hidden="true" />
        <span className="hidden-xs hidden-sm">
          {t("Create a custom URL identifier to make this dashboard easier to share and access")}.
        </span>
      </h2>
      <div className="url-identifier-input-container">
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
  );
}

UrlIdentifierContainer.propTypes = {
  dashboardConfiguration: PropTypes.object.isRequired,
  style: PropTypes.object,
};

export default UrlIdentifierContainer;
