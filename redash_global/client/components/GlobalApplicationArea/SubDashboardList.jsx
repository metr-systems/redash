import React, { useState } from "react";
import { trim } from "lodash";
import Button from "antd/lib/button";
import Modal from "antd/lib/modal";
import Input from "antd/lib/input";

import PageHeader from "@/components/PageHeader";
import Paginator from "@/components/Paginator";
import * as Sidebar from "@/components/items-list/components/Sidebar";
import ItemsTable, { Columns } from "@/components/items-list/components/ItemsTable";
import { wrap as itemsList, ControllerType } from "@/components/items-list/ItemsList";
import { ResourceItemsSource } from "@/components/items-list/classes/ItemsSource";
import { UrlStateStorage } from "@/components/items-list/classes/StateStorage";
import Layout from "@/components/layouts/ContentWithSidebar";

import { SubDashboard } from "../../services/subDashboard";

import "@/pages/dashboards/dashboard-list.css";

function CreateSubDashboardDialog({ visible, onClose, onCreate }) {
  const [name, setName] = useState("");
  const [saving, setSaving] = useState(false);

  function handleOk() {
    const trimmed = trim(name);
    if (!trimmed) return;
    setSaving(true);
    SubDashboard.create({ name: trimmed })
      .then((data) => {
        onCreate(data);
        setName("");
        onClose();
      })
      .finally(() => setSaving(false));
  }

  function handleCancel() {
    setName("");
    onClose();
  }

  return (
    <Modal
      visible={visible}
      title="New Dashboard"
      okText="Save"
      cancelText="Close"
      okButtonProps={{ disabled: !trim(name) || saving, loading: saving }}
      onOk={handleOk}
      onCancel={handleCancel}
      maskClosable={!saving}
    >
      <Input
        value={name}
        onChange={(e) => setName(e.target.value)}
        onPressEnter={handleOk}
        placeholder="Dashboard Name"
        autoFocus
        disabled={saving}
      />
    </Modal>
  );
}

const listColumns = [
  Columns.custom.sortable(
    (text, item) => (
      <a href={`dashboards/${item.id}`} data-test={`SubDashboardId${item.id}`}>
        {item.name}
      </a>
    ),
    { title: "Name", field: "name", width: null }
  ),
  Columns.dateTime.sortable({ title: "Created At", field: "created_at", width: "1%" }),
];

function SubDashboardListComponent({ controller }) {
  const [showCreate, setShowCreate] = useState(false);

  function handleCreated() {
    controller.update();
  }

  return (
    <div className="page-dashboard-list">
      <div className="container">
        <PageHeader
          title={controller.params.pageTitle}
          actions={
            <Button type="primary" onClick={() => setShowCreate(true)}>
              <i className="fa fa-plus m-r-5" aria-hidden="true" />
              New Dashboard
            </Button>
          }
        />
        <CreateSubDashboardDialog
          visible={showCreate}
          onClose={() => setShowCreate(false)}
          onCreate={handleCreated}
        />
        <Layout>
          <Layout.Sidebar className="m-b-0">
            <Sidebar.SearchInput
              placeholder="Search Dashboards..."
              label="Search dashboards"
              value={controller.searchTerm}
              onChange={controller.updateSearch}
            />
          </Layout.Sidebar>
          <Layout.Content>
            <div data-test="DashboardLayoutContent">
              {controller.isLoaded && controller.isEmpty ? (
                <div className="text-center p-15">
                  <p className="text-muted">No dashboards found.</p>
                </div>
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
          </Layout.Content>
        </Layout>
      </div>
    </div>
  );
}

SubDashboardListComponent.propTypes = {
  controller: ControllerType.isRequired,
};

const SubDashboardListPage = itemsList(
  SubDashboardListComponent,
  () =>
    new ResourceItemsSource({
      getResource() {
        return SubDashboard.query.bind(SubDashboard);
      },
      getItemProcessor() {
        return (item) => new SubDashboard(item);
      },
    }),
  () => new UrlStateStorage({ orderByField: "created_at", orderByReverse: true })
);

function handleListError(error) {
  console.error("SubDashboardList error:", error);
}

export default function SubDashboardList() {
  return <SubDashboardListPage pageTitle="Dashboards" onError={handleListError} />;
}
