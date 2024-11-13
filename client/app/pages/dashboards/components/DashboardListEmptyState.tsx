import * as React from "react";
import * as PropTypes from "prop-types";
import Button from "antd/lib/button";

import { useTranslation } from "react-i18next";

import BigMessage from "@/components/BigMessage";
import NoTaggedObjectsFound from "@/components/NoTaggedObjectsFound";
import EmptyState, { EmptyStateHelpMessage } from "@/components/empty-state/EmptyState";
import DynamicComponent from "@/components/DynamicComponent";
import CreateDashboardDialog from "@/components/dashboards/CreateDashboardDialog";
import { currentUser } from "@/services/auth";
import HelpTrigger from "@/components/HelpTrigger";

export interface DashboardListEmptyStateProps {
  page: string;
  searchTerm: string;
  selectedTags: string[];
}

export default function DashboardListEmptyState({ page, searchTerm, selectedTags }: DashboardListEmptyStateProps) {
  const { t } = useTranslation();
  if (searchTerm !== "") {
    return <BigMessage message={t("Dashboards:Sorry, we couldn't find anything.")} icon="fa-search" />;
  }
  if (selectedTags.length > 0) {
    return <NoTaggedObjectsFound objectType="dashboards" tags={selectedTags} />;
  }
  switch (page) {
    case "favorites":
      return <BigMessage message={t("Dashboards:Mark dashboards as Favorite to list them here.")} icon="fa-star" />;
    case "my":
      const my_msg = currentUser.hasPermission("create_dashboard") ? (
        <span>
          <Button type="primary" size="small" onClick={() => CreateDashboardDialog.showModal()}>
            {t("Dashboards:Create your first dashboard!")}
          </Button>{" "}
          <HelpTrigger className="f-14" type="DASHBOARDS" showTooltip={false}>
            {t("Dashboards:Need help?")}
          </HelpTrigger>
        </span>
      ) : (
        <span>{t("Dashboards:Sorry, we couldn't find anything.")}</span>
      );
      return <BigMessage icon="fa-search">{my_msg}</BigMessage>;
    default:
      return (
        <DynamicComponent name="DashboardList.EmptyState">
          <EmptyState
            icon="zmdi zmdi-view-quilt"
            description={t("Dashboards:See the big picture")}
            illustration="dashboard"
            helpMessage={<EmptyStateHelpMessage helpTriggerType="DASHBOARDS" />}
            showDashboardStep
          />
        </DynamicComponent>
      );
  }
}

DashboardListEmptyState.propTypes = {
  page: PropTypes.string.isRequired,
  searchTerm: PropTypes.string.isRequired,
  selectedTags: PropTypes.array.isRequired,
};
