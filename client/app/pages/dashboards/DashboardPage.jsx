import React, { useState, useEffect } from "react";
import { isEmpty, map } from "lodash";
import PropTypes from "prop-types";
import cx from "classnames";

import Button from "antd/lib/button";
import Checkbox from "antd/lib/checkbox";

import { useTranslation } from "react-i18next";

import routeWithUserSession from "@/components/ApplicationArea/routeWithUserSession";
import DynamicComponent from "@/components/DynamicComponent";
import DashboardGrid from "@/components/dashboards/DashboardGrid";
import Parameters from "@/components/Parameters";
import Filters from "@/components/Filters";
import FixedParameters from "@/components/FixedParameters";
import BackButton from "@/components/backButton";
import BigMessage from "@/components/BigMessage";

import { Dashboard } from "@/services/dashboard";
import recordEvent from "@/services/recordEvent";
import { isValidBackText } from "@/services/navigation";
import resizeObserver from "@/services/resizeObserver";
import location from "@/services/location";
import routes from "@/services/routes";
import url from "@/services/url";
import useImmutableCallback from "@/lib/hooks/useImmutableCallback";

import useDashboard from "./hooks/useDashboard";
import DashboardHeader from "./components/DashboardHeader";
import UrlIdentifierContainer from "@/components/dashboards/UrlIdentifierContainer";

import "./DashboardPage.less";

function DashboardSettings({ dashboardConfiguration }) {
  const { t } = useTranslation("Dashboards");
  const { dashboard, updateDashboard } = dashboardConfiguration;
  return (
    <div className="m-b-10 p-15 bg-white tiled">
      <Checkbox
        checked={!!dashboard.dashboard_filters_enabled}
        onChange={({ target }) => updateDashboard({ dashboard_filters_enabled: target.checked })}
        data-test="DashboardFiltersCheckbox"
      >
        {t("Use Dashboard Level Filters")}
      </Checkbox>
    </div>
  );
}

DashboardSettings.propTypes = {
  dashboardConfiguration: PropTypes.object.isRequired, // eslint-disable-line react/forbid-prop-types
};

function AddWidgetContainer({ dashboardConfiguration, className, ...props }) {
  const { t } = useTranslation("Dashboards");
  const { showAddTextboxDialog, showAddWidgetDialog } = dashboardConfiguration;
  return (
    <div className={cx("add-widget-container", className)} {...props}>
      <h2>
        <i className="zmdi zmdi-widgets" aria-hidden="true" />
        <span className="hidden-xs hidden-sm">
          {t(
            "Widgets are individual query visualizations or text boxes you can place on your dashboard in various arrangements."
          )}
        </span>
      </h2>
      <div>
        <Button className="m-r-15" onClick={showAddTextboxDialog} data-test="AddTextboxButton">
          {t("Add Textbox")}
        </Button>
        <Button type="primary" onClick={showAddWidgetDialog} data-test="AddWidgetButton">
          {t("Add Widget")}
        </Button>
      </div>
    </div>
  );
}

AddWidgetContainer.propTypes = {
  dashboardConfiguration: PropTypes.object.isRequired, // eslint-disable-line react/forbid-prop-types
  className: PropTypes.string,
};

function DashboardComponent(props) {
  const dashboardConfiguration = useDashboard(props.dashboard);
  const {
    dashboard,
    fixedFromUrlParameters,
    filters,
    setFilters,
    refreshing,
    loadDashboard,
    loadWidget,
    removeWidget,
    saveDashboardLayout,
    globalParameters,
    updateDashboard,
    refreshDashboard,
    refreshWidget,
    editingLayout,
    editedlayoutsOrder,
    setEditedlayoutsOrder,
    setGridDisabled,
    visibleWidgets,
    canEditDashboard,
  } = dashboardConfiguration;

  const fixedFromUrlParamNames = fixedFromUrlParameters.map((param) => param.name);

  const [pageContainer, setPageContainer] = useState(null);
  const [bottomPanelStyles, setBottomPanelStyles] = useState({});
  const onParametersEdit = (parameters) => {
    const paramOrder = map(parameters, "name");
    updateDashboard({ options: { globalParamOrder: paramOrder } });
  };

  useEffect(() => {
    if (pageContainer) {
      const unobserve = resizeObserver(pageContainer, () => {
        if (editingLayout) {
          const style = window.getComputedStyle(pageContainer, null);
          const bounds = pageContainer.getBoundingClientRect();
          const paddingLeft = parseFloat(style.paddingLeft) || 0;
          const paddingRight = parseFloat(style.paddingRight) || 0;
          setBottomPanelStyles({
            left: Math.round(bounds.left) + paddingRight,
            width: pageContainer.clientWidth - paddingLeft - paddingRight,
          });
        }

        // reflow grid when container changes its size
        window.dispatchEvent(new Event("resize"));
      });
      return unobserve;
    }
  }, [pageContainer, editingLayout]);

  return (
    <div className="container" ref={setPageContainer} data-test={`DashboardId${dashboard.id}Container`}>
      <DashboardHeader
        dashboardConfiguration={dashboardConfiguration}
        headerExtra={
          <DynamicComponent
            name="Dashboard.HeaderExtra"
            dashboard={dashboard}
            dashboardConfiguration={dashboardConfiguration}
          />
        }
      />
      {!isEmpty(globalParameters) && (
        <div className="dashboard-parameters m-b-10 p-15 bg-white tiled" data-test="DashboardParameters">
          <div className="dashboard-parameters-container">
            <div className="dashboard-parameters-main">
              {fixedFromUrlParameters.length > 0 && (
                <FixedParameters
                  parameterNames={fixedFromUrlParamNames}
                  parameters={fixedFromUrlParameters}
                  isEditing={editingLayout}
                  sortable={editingLayout}
                />
              )}
              <Parameters
                parameters={globalParameters}
                hiddenParameterNames={fixedFromUrlParamNames}
                onValuesChange={refreshDashboard}
                sortable={editingLayout}
                onParametersEdit={onParametersEdit}
                disabled={refreshing}
              />
            </div>
            {fixedFromUrlParameters.length > 0 && !!location.search?.back && <BackButton />}
          </div>
        </div>
      )}
      {!isEmpty(filters) && (
        <div className="m-b-10 p-15 bg-white tiled" data-test="DashboardFilters">
          <Filters filters={filters} onChange={setFilters} />
        </div>
      )}
      {editingLayout && <DashboardSettings dashboardConfiguration={dashboardConfiguration} />}
      <div id="dashboard-container">
        <DashboardGrid
          dashboard={dashboard}
          widgets={visibleWidgets}
          filters={filters}
          editedlayoutsOrder={editedlayoutsOrder}
          setEditedlayoutsOrder={setEditedlayoutsOrder}
          isEditing={editingLayout}
          onLayoutChange={editingLayout ? saveDashboardLayout : () => {}}
          onBreakpointChange={setGridDisabled}
          onLoadWidget={loadWidget}
          onRefreshWidget={refreshWidget}
          onRemoveWidget={removeWidget}
          onParameterMappingsChange={loadDashboard}
        />
      </div>
      {editingLayout && (
        <>
          <UrlIdentifierContainer
            dashboardConfiguration={dashboardConfiguration}
            style={{
              ...bottomPanelStyles,
              position: "fixed",
              bottom: "95px",
              zIndex: 1000,
            }}
          />
          <AddWidgetContainer dashboardConfiguration={dashboardConfiguration} style={bottomPanelStyles} />
        </>
      )}
    </div>
  );
}

DashboardComponent.propTypes = {
  dashboard: PropTypes.object.isRequired, // eslint-disable-line react/forbid-prop-types
};

function DashboardPage({ dashboardSlug, dashboardId, dashboardUrlIdentifier, onError }) {
  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(true);
  const handleError = useImmutableCallback(onError);
  const { t } = useTranslation();

  useEffect(() => {
    setLoading(true);
    Dashboard.get({ id: dashboardId, slug: dashboardSlug, urlIdentifier: dashboardUrlIdentifier })
      .then((dashboardData) => {
        recordEvent("view", "dashboard", dashboardData.id);
        setDashboard(dashboardData);

        // if loaded by slug or url identifier, update location url to use the canonical id
        if (!dashboardId) {
          location.setPath(url.parse(dashboardData.url).pathname, true);
        }
      })
      .catch(handleError)
      .finally(() => setLoading(false));
  }, [dashboardId, dashboardSlug, dashboardUrlIdentifier, handleError]);

  return (
    <div className="dashboard-page">
      {loading ? (
        <div className="container text-center p-t-10">
          <BigMessage icon="fa-spinner fa-2x fa-pulse" message={t("Loading...")} />
        </div>
      ) : (
        dashboard && <DashboardComponent dashboard={dashboard} />
      )}
    </div>
  );
}

DashboardPage.propTypes = {
  dashboardSlug: PropTypes.string,
  dashboardId: PropTypes.string,
  dashboardUrlIdentifier: PropTypes.string,
  onError: PropTypes.func,
};

DashboardPage.defaultProps = {
  dashboardSlug: null,
  dashboardId: null,
  dashboardUrlIdentifier: null,
  onError: PropTypes.func,
};

// route kept for backward compatibility
routes.register(
  "Dashboards.LegacyViewOrEdit",
  routeWithUserSession({
    path: "/dashboard/:dashboardSlug",
    render: (pageProps) => <DashboardPage {...pageProps} />,
  })
);

// metr dashboard by url identifier
routes.register(
  "Dashboards.ByUrlIdentifier",
  routeWithUserSession({
    path: "/dashboards/by_url_identifier/:dashboardUrlIdentifier",
    render: (pageProps) => <DashboardPage {...pageProps} />,
  })
);

routes.register(
  "Dashboards.ViewOrEdit",
  routeWithUserSession({
    path: "/dashboards/:dashboardId([^-]+)(-.*)?",
    render: (pageProps) => <DashboardPage {...pageProps} />,
  })
);
