import React from "react";

import PageHeader from "@/components/PageHeader";
import Paginator from "@/components/Paginator";
import * as Sidebar from "@/components/items-list/components/Sidebar";
import ItemsTable, { Columns } from "@/components/items-list/components/ItemsTable";
import { wrap as itemsList, ControllerType } from "@/components/items-list/ItemsList";
import { ResourceItemsSource } from "@/components/items-list/classes/ItemsSource";
import { UrlStateStorage } from "@/components/items-list/classes/StateStorage";
import Layout from "@/components/layouts/ContentWithSidebar";

import { GlobalDashboard } from "../../services/globalDashboard";

import "@/pages/dashboards/dashboard-list.css";

const listColumns = [
  Columns.custom.sortable(
    (text, item) => (
      <a href={item.url} target="_blank" rel="noopener noreferrer" data-test={`DashboardId${item.id}`}>
        {item.name}
      </a>
    ),
    { title: "Name", field: "name", width: null }
  ),
  Columns.dateTime.sortable({ title: "Created At", field: "created_at", width: "1%" }),
];

function TemplateDashboardListComponent({ controller }) {
  return (
    <div className="page-dashboard-list">
      <div className="container">
        <PageHeader title={controller.params.pageTitle} />
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

TemplateDashboardListComponent.propTypes = {
  controller: ControllerType.isRequired,
};

const TemplateDashboardListPage = itemsList(
  TemplateDashboardListComponent,
  () =>
    new ResourceItemsSource({
      getResource() {
        return GlobalDashboard.query.bind(GlobalDashboard);
      },
      getItemProcessor() {
        return (item) => new GlobalDashboard(item);
      },
    }),
  () => new UrlStateStorage({ orderByField: "created_at", orderByReverse: true })
);

function handleListError(error) {
  console.error("TemplateDashboardList error:", error);
}

export default function TemplateDashboardList() {
  return <TemplateDashboardListPage pageTitle="Dashboards" onError={handleListError} />;
}
