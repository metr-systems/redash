import React, { useState } from "react";
import PropTypes from "prop-types";
import { filter, get } from "lodash";
import Button from "antd/lib/button";
import Modal from "antd/lib/modal";

import Link from "@/components/Link";
import PageHeader from "@/components/PageHeader";
import Paginator from "@/components/Paginator";
import notification from "@/services/notification";
import { wrap as itemsList, ControllerType } from "@/components/items-list/ItemsList";
import { ResourceItemsSource } from "@/components/items-list/classes/ItemsSource";
import { UrlStateStorage } from "@/components/items-list/classes/StateStorage";
import ItemsTable, { Columns } from "@/components/items-list/components/ItemsTable";

import ComposedDashboardService from "../../services/composedDashboard";
import ComposedDashboardCreateModal from "./ComposedDashboardCreate";

// A failed run comes back as a 200 with succeeded=false, and the admin has to read which orgs
// to fix before retrying, so that notification stays up until dismissed.
const STICKY = { duration: 0 };

function DeployButton({ composedDashboard }) {
  const [deploying, setDeploying] = useState(false);

  const notifyFailedRun = (run) => {
    const failed = filter(run.results, (result) => result.errors.length > 0);
    notification.error(
      `"${composedDashboard.name}" was not deployed`,
      <React.Fragment>
        <p>
          A deployment is all or nothing, so <strong>nothing was deployed</strong> — not even to the
          organizations that reported no problem. Fix the following and deploy again:
        </p>
        <ul className="p-l-15">
          {failed.map((result) => (
            <li key={result.organization_id}>
              {result.organization_name} ({result.organization_slug}): {result.errors.join("; ")}
            </li>
          ))}
        </ul>
      </React.Fragment>,
      STICKY
    );
  };

  const deploy = () => {
    setDeploying(true);
    ComposedDashboardService.deploy(composedDashboard.id)
      .then((run) => {
        if (run.succeeded) {
          notification.success(
            `"${composedDashboard.name}" deployed`,
            `Deployed to ${run.results.length} organization(s).`
          );
        } else {
          notifyFailedRun(run);
        }
      })
      .catch((error) =>
        notification.error(
          `"${composedDashboard.name}" was not deployed`,
          get(
            error,
            "response.data.message",
            "Nothing was deployed. Check the server logs for the details of what went wrong."
          ),
          STICKY
        )
      )
      .finally(() => setDeploying(false));
  };

  return (
    <Button
      size="small"
      type="primary"
      loading={deploying}
      onClick={() =>
        Modal.confirm({
          title: "Deploy Composed Dashboard",
          content: `Deploy "${composedDashboard.name}" to every organization that has one of its sub-dashboards assigned? Deployment is all or nothing: if any organization fails, nothing is deployed.`,
          okText: "Deploy",
          onOk: deploy,
        })
      }>
      Deploy
    </Button>
  );
}

DeployButton.propTypes = {
  composedDashboard: PropTypes.object.isRequired,
};

const listColumns = [
  Columns.custom(
    (text, item) => (
      <div className="table-main-title">{item.name}</div>
    ),
    { title: "Name", width: null }
  ),
  Columns.custom((text, item) => item.url_identifier || "—", { title: "URL Identifier" }),
  Columns.custom(
    (text, item) => <Link href={`composed-dashboards/${item.id}/edit`}>Edit composition</Link>,
    { title: "", width: "1%", className: "text-nowrap" }
  ),
  Columns.custom((text, item) => <DeployButton composedDashboard={item} />, {
    title: "",
    width: "1%",
    className: "text-nowrap",
  }),
  Columns.custom(
    (text, item) => (
      <button
        type="button"
        className="btn btn-xs btn-danger"
        onClick={() => {
          Modal.confirm({
            title: "Delete Dashboard",
            content: `Are you sure you want to delete "${item.name}"?`,
            okText: "Delete",
            okType: "danger",
            onOk() {
              ComposedDashboardService.delete(item.id).then(() => {
                window.location.reload();
              });
            },
          });
        }}
      >
        Delete
      </button>
    ),
    { title: "", width: "1%", className: "text-nowrap" }
  ),
];

function ComposedDashboardList({ controller }) {
  const [createModalVisible, setCreateModalVisible] = useState(false);

  const handleCreateSuccess = (dashboardId) => {
    setCreateModalVisible(false);
    window.location.href = `composed-dashboards/${dashboardId}/edit`;
  };

  return (
    <div className="page-dashboard-list">
      <div className="container">
        <PageHeader title={controller.params.pageTitle} />
        <div className="m-b-15">
          <button
            className="btn btn-primary"
            onClick={() => setCreateModalVisible(true)}
          >
            Create Composed Dashboard
          </button>
        </div>
        <ComposedDashboardCreateModal
          visible={createModalVisible}
          onClose={() => setCreateModalVisible(false)}
          onSuccess={handleCreateSuccess}
        />
        {controller.isLoaded && controller.isEmpty ? (
          <div className="text-center">There are no composed dashboards yet.</div>
        ) : (
          <div className="bg-white tiled table-responsive">
            <ItemsTable
              items={controller.pageItems}
              loading={!controller.isLoaded}
              columns={listColumns}
              orderByField={controller.orderByField}
              orderByReverse={controller.orderByReverse}
              toggleSorting={controller.toggleSorting}
            />
            <Paginator
              showPageSizeSelect
              totalCount={controller.totalItemsCount}
              pageSize={controller.itemsPerPage}
              onPageSizeChange={(itemsPerPage) => controller.updatePagination({ itemsPerPage })}
              page={controller.page}
              onChange={(page) => controller.updatePagination({ page })}
            />
          </div>
        )}
      </div>
    </div>
  );
}

ComposedDashboardList.propTypes = {
  controller: ControllerType.isRequired,
};

const ComposedDashboardListPage = itemsList(
  ComposedDashboardList,
  () =>
    new ResourceItemsSource({
      getResource() {
        return ComposedDashboardService.query.bind(ComposedDashboardService);
      },
    }),
  () => new UrlStateStorage({ orderByField: "created_at", orderByReverse: true })
);

export default ComposedDashboardListPage;
