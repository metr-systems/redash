import React, { useState } from "react";
import PropTypes from "prop-types";
import { get } from "lodash";
import Button from "antd/lib/button";
import Modal from "antd/lib/modal";
import Table from "antd/lib/table";

import Link from "@/components/Link";
import PageHeader from "@/components/PageHeader";
import Paginator from "@/components/Paginator";
import { wrap as itemsList, ControllerType } from "@/components/items-list/ItemsList";
import { ResourceItemsSource } from "@/components/items-list/classes/ItemsSource";
import { UrlStateStorage } from "@/components/items-list/classes/StateStorage";
import ItemsTable, { Columns } from "@/components/items-list/components/ItemsTable";

import ComposedDashboardService from "../../services/composedDashboard";
import ComposedDashboardCreateModal from "./ComposedDashboardCreate";

const resultColumns = [
  { title: "Organization", dataIndex: "organization_name", key: "organization_name" },
  { title: "Slug", dataIndex: "organization_slug", key: "organization_slug" },
  {
    title: "Result",
    key: "errors",
    render: (text, result) =>
      result.errors.length === 0 ? (
        "No problems reported"
      ) : (
        <ul className="p-l-15 m-b-0">
          {result.errors.map((error) => (
            <li key={error}>{error}</li>
          ))}
        </ul>
      ),
  },
];

function DeploymentResultModal({ composedDashboardName, result, onClose }) {
  const run = result && result.run;

  return (
    <Modal
      visible={result !== null}
      title={`Deployment result — ${composedDashboardName}`}
      width={720}
      onCancel={onClose}
      footer={<Button onClick={onClose}>Close</Button>}>
      {run ? (
        <React.Fragment>
          {run.succeeded ? (
            <p>
              Deployed to {run.results.length} organization(s). A dashboard this deployment created is{" "}
              <strong>unpublished</strong>, so it stays out of the target org&apos;s dashboard list until someone there
              publishes it.
            </p>
          ) : (
            <p>
              <strong>Nothing was deployed.</strong> A deployment is all or nothing, so the organizations below that
              reported no problem were rolled back too. Fix the errors and deploy again.
            </p>
          )}
          <Table
            rowKey="organization_id"
            columns={resultColumns}
            dataSource={run.results}
            pagination={false}
            size="small"
          />
        </React.Fragment>
      ) : (
        <p>{result && result.message}</p>
      )}
    </Modal>
  );
}

DeploymentResultModal.propTypes = {
  composedDashboardName: PropTypes.string.isRequired,
  result: PropTypes.object,
  onClose: PropTypes.func.isRequired,
};

DeploymentResultModal.defaultProps = {
  result: null,
};

function DeployButton({ composedDashboard }) {
  const [deploying, setDeploying] = useState(false);
  // The run stays on screen in a modal the admin dismisses: it carries a row per target org,
  // which is more than a notification can show before timing out.
  const [result, setResult] = useState(null);

  const deploy = () => {
    setDeploying(true);
    ComposedDashboardService.deploy(composedDashboard.id)
      .then((run) => setResult({ run }))
      .catch((error) =>
        setResult({
          message: get(
            error,
            "response.data.message",
            "Nothing was deployed. Check the server logs for the details of what went wrong."
          ),
        })
      )
      .finally(() => setDeploying(false));
  };

  return (
    <React.Fragment>
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
      <DeploymentResultModal
        composedDashboardName={composedDashboard.name}
        result={result}
        onClose={() => setResult(null)}
      />
    </React.Fragment>
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
