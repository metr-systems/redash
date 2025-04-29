import { filter, map, includes, toLower } from "lodash";
import React from "react";
import Button from "antd/lib/button";
import Dropdown from "antd/lib/dropdown";
import Menu from "antd/lib/menu";

import i18next from "i18next";

import DownOutlinedIcon from "@ant-design/icons/DownOutlined";

import routeWithUserSession from "@/components/ApplicationArea/routeWithUserSession";
import navigateTo from "@/components/ApplicationArea/navigateTo";
import Paginator from "@/components/Paginator";

import { wrap as itemsList, ControllerType } from "@/components/items-list/ItemsList";
import { ResourceItemsSource } from "@/components/items-list/classes/ItemsSource";
import { StateStorage } from "@/components/items-list/classes/StateStorage";

import LoadingState from "@/components/items-list/components/LoadingState";
import ItemsTable, { Columns } from "@/components/items-list/components/ItemsTable";
import SelectItemsDialog from "@/components/SelectItemsDialog";
import { DashboardPreviewCard } from "@/components/PreviewCard";

import GroupName from "@/components/groups/GroupName";
import ListItemAddon from "@/components/groups/ListItemAddon";
import Sidebar from "@/components/groups/DetailsPageSidebar";
import Layout from "@/components/layouts/ContentWithSidebar";
import wrapSettingsTab from "@/components/SettingsWrapper";

import notification from "@/services/notification";
import { currentUser } from "@/services/auth";
import Group from "@/services/group";
import DashboardEndpoints from "@/services/dashboard";
import routes from "@/services/routes";

class GroupDashboards extends React.Component {
  static propTypes = {
    controller: ControllerType.isRequired,
  };

  groupId = parseInt(this.props.controller.params.groupId, 10);

  group = null;

  sidebarMenu = [
    {
      key: "users",
      href: `groups/${this.groupId}`,
      title: i18next.t("Groups:Members"),
    },
    {
      key: "datasources",
      href: `groups/${this.groupId}/data_sources`,
      title: i18next.t("Groups:Data Sources"),
      isAvailable: () => currentUser.isAdmin,
    },
    {
      key: "dashboards",
      href: `groups/${this.groupId}/dashboards`,
      title: i18next.t("Groups:Dashboards"),
      isAvailable: () => currentUser.isAdmin,
    },
  ];

  listColumns = [
    Columns.custom((text, dashboard) => <DashboardPreviewCard dashboard={dashboard} withLink />, {
      title: i18next.t("Groups:Name"),
      field: "name",
      width: null,
    }),
    Columns.custom(
      (text, dashboard) => (
        <Button className="w-100" type="danger" onClick={() => this.removeGroupDashboard(dashboard)}>
          {i18next.t("Remove")}
        </Button>
      ),
      {
        width: "1%",
        isAvailable: () => currentUser.isAdmin,
      }
    ),
  ];

  componentDidMount() {
    Group.get({ id: this.groupId })
      .then((group) => {
        this.group = group;
        this.forceUpdate();
      })
      .catch((error) => {
        this.props.controller.handleError(error);
      });
  }

  removeGroupDashboard = (dashboard) => {
    Group.removeDashboard({ id: this.groupId, dashboardId: dashboard.id })
      .then(() => {
        this.props.controller.updatePagination({ page: 1 });
        this.props.controller.update();
      })
      .catch(() => {
        notification.error(i18next.t("Groups:Failed to remove dashboard from group."));
      });
  };

  addDashboards = () => {
    const allDashboards = DashboardEndpoints.query();
    const alreadyAddedDashboards = map(this.props.controller.allItems, (ds) => ds.id);
    SelectItemsDialog.showModal({
      dialogTitle: i18next.t("Groups:Add Dashboards"),
      inputPlaceholder: `${i18next.t("Groups:Search Dashboards")}...`,
      selectedItemsTitle: i18next.t("Groups:New Dashboards"),
      searchItems: (searchTerm) => {
        searchTerm = toLower(searchTerm);
        return allDashboards.then(({ results }) => filter(results, (d) => includes(toLower(d.name), searchTerm)));
      },
      renderItem: (item, { isSelected }) => {
        const alreadyInGroup = includes(alreadyAddedDashboards, item.id);
        return {
          content: (
            <DashboardPreviewCard dashboard={item}>
              <ListItemAddon isSelected={isSelected} alreadyInGroup={alreadyInGroup} />
            </DashboardPreviewCard>
          ),
          isDisabled: alreadyInGroup,
          className: isSelected || alreadyInGroup ? "selected" : "",
        };
      },
      renderStagedItem: (item, { isSelected }) => ({
        content: (
          <DashboardPreviewCard dashboard={item}>
            <ListItemAddon isSelected={isSelected} isStaged />
          </DashboardPreviewCard>
        ),
      }),
    }).onClose((items) => {
      const promises = map(items, (ds) => Group.addDashboard({ id: this.groupId }, { dashboard_id: ds.id }));
      return Promise.all(promises).then(() => this.props.controller.update());
    });
  };

  render() {
    const { controller } = this.props;
    return (
      <div data-test="Group">
        <GroupName className="d-block m-t-0 m-b-15" group={this.group} onChange={() => this.forceUpdate()} />
        <Layout>
          <Layout.Sidebar>
            <Sidebar
              controller={controller}
              group={this.group}
              items={this.sidebarMenu}
              canAddDashboards={currentUser.isAdmin}
              onAddDashboardsClick={this.addDashboards}
              onGroupDeleted={() => navigateTo("groups")}
            />
          </Layout.Sidebar>
          <Layout.Content>
            {!controller.isLoaded && <LoadingState className="" />}
            {controller.isLoaded && controller.isEmpty && (
              <div className="text-center">
                <p>{i18next.t("Groups:There are no dashboards in this group yet.")}</p>
                {currentUser.isAdmin && (
                  <Button type="primary" onClick={this.addDashboards}>
                    <i className="fa fa-plus m-r-5" aria-hidden="true" />
                    {i18next.t("Groups:Add Dashboards")}
                  </Button>
                )}
              </div>
            )}
            {controller.isLoaded && !controller.isEmpty && (
              <div className="table-responsive">
                <ItemsTable
                  items={controller.pageItems}
                  columns={this.listColumns}
                  showHeader={false}
                  context={this.actions}
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
          </Layout.Content>
        </Layout>
      </div>
    );
  }
}

const GroupDashboardsPage = wrapSettingsTab(
  "Groups.Dashboards",
  null,
  itemsList(
    GroupDashboards,
    () =>
      new ResourceItemsSource({
        isPlainList: true,
        getRequest(unused, { params: { groupId } }) {
          return { id: groupId };
        },
        getResource() {
          return Group.dashboards.bind(Group);
        },
      }),
    () => new StateStorage({ orderByField: "name" })
  )
);

routes.register(
  "Groups.Dashboards",
  routeWithUserSession({
    path: "/groups/:groupId/dashboards",
    title: i18next.t("Groups:Group Dashboards"),
    render: (pageProps) => <GroupDashboardsPage {...pageProps} currentPage="dashboards" />,
  })
);
