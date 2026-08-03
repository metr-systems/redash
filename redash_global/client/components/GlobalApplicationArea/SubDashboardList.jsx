import React from "react";

import Link from "@/components/Link";
import PageHeader from "@/components/PageHeader";
import Paginator from "@/components/Paginator";
import { wrap as itemsList, ControllerType } from "@/components/items-list/ItemsList";
import { ResourceItemsSource } from "@/components/items-list/classes/ItemsSource";
import { UrlStateStorage } from "@/components/items-list/classes/StateStorage";
import ItemsTable, { Columns } from "@/components/items-list/components/ItemsTable";

import SubDashboardService from "../../services/subDashboard";

const listColumns = [
  Columns.custom(
    (text, item) => (
      <a className="table-main-title" href={item.url} target="_blank" rel="noopener noreferrer">
        {item.name}
      </a>
    ),
    { title: "Name", width: null }
  ),
  Columns.custom((text, item) => item.url_identifier || "—", { title: "URL Identifier" }),
  Columns.custom(
    (text, item) => <Link href={`sub-dashboards/${item.id}/assignments`}>Manage assignments</Link>,
    { title: "", width: "1%", className: "text-nowrap" }
  ),
];

function SubDashboardList({ controller }) {
  return (
    <div className="page-dashboard-list">
      <div className="container">
        <PageHeader title={controller.params.pageTitle} />
        {controller.isLoaded && controller.isEmpty ? (
          <div className="text-center">There are no dashboards to assign yet.</div>
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

SubDashboardList.propTypes = {
  controller: ControllerType.isRequired,
};

const SubDashboardListPage = itemsList(
  SubDashboardList,
  () =>
    new ResourceItemsSource({
      getResource() {
        return SubDashboardService.query.bind(SubDashboardService);
      },
    }),
  () => new UrlStateStorage({ orderByField: "created_at", orderByReverse: true })
);

export default SubDashboardListPage;
