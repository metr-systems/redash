import React, { useState } from "react";
import { Modal } from "antd";

import Link from "@/components/Link";
import PageHeader from "@/components/PageHeader";
import Paginator from "@/components/Paginator";
import { wrap as itemsList, ControllerType } from "@/components/items-list/ItemsList";
import { ResourceItemsSource } from "@/components/items-list/classes/ItemsSource";
import { UrlStateStorage } from "@/components/items-list/classes/StateStorage";
import ItemsTable, { Columns } from "@/components/items-list/components/ItemsTable";

import ComposedDashboardService from "../../services/composedDashboard";
import ComposedDashboardCreateModal from "./ComposedDashboardCreate";

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
