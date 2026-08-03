import { filter, some } from "lodash";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import PropTypes from "prop-types";

import Button from "antd/lib/button";
import Modal from "antd/lib/modal";
import Select from "antd/lib/select";
import Table from "antd/lib/table";

import Link from "@/components/Link";
import PageHeader from "@/components/PageHeader";
import BigMessage from "@/components/BigMessage";
import LoadingState from "@/components/items-list/components/LoadingState";
import notification from "@/services/notification";

import SubDashboardService from "../../services/subDashboard";
import OrganizationService from "../../services/organization";

function AssignOrgModal({ visible, organizations, assignments, saving, onAssign, onCancel }) {
  const [selectedOrgId, setSelectedOrgId] = useState(undefined);

  useEffect(() => {
    if (visible) {
      setSelectedOrgId(undefined);
    }
  }, [visible]);

  const availableOrgs = useMemo(
    () => filter(organizations, (org) => !some(assignments, { organization_id: org.id })),
    [organizations, assignments]
  );

  return (
    <Modal
      visible={visible}
      title="Assign to organization"
      okText="Assign"
      okButtonProps={{ disabled: !selectedOrgId || saving, loading: saving }}
      cancelButtonProps={{ disabled: saving }}
      closable={!saving}
      maskClosable={!saving}
      onOk={() => onAssign(selectedOrgId)}
      onCancel={onCancel}>
      <Select
        showSearch
        optionFilterProp="children"
        placeholder="Select an organization"
        style={{ width: "100%" }}
        value={selectedOrgId}
        onChange={setSelectedOrgId}
        notFoundContent="No organizations left to assign">
        {availableOrgs.map((org) => (
          <Select.Option key={org.id} value={org.id}>
            {org.name}
          </Select.Option>
        ))}
      </Select>
    </Modal>
  );
}

AssignOrgModal.propTypes = {
  visible: PropTypes.bool.isRequired,
  organizations: PropTypes.arrayOf(PropTypes.object).isRequired,
  assignments: PropTypes.arrayOf(PropTypes.object).isRequired,
  saving: PropTypes.bool.isRequired,
  onAssign: PropTypes.func.isRequired,
  onCancel: PropTypes.func.isRequired,
};

export default function SubDashboardAssignments({ dashboardId }) {
  const [dashboard, setDashboard] = useState(null);
  const [assignments, setAssignments] = useState([]);
  const [organizations, setOrganizations] = useState([]);
  const [isLoaded, setIsLoaded] = useState(false);
  const [loadError, setLoadError] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [saving, setSaving] = useState(false);
  const [removingId, setRemovingId] = useState(null);

  useEffect(() => {
    let isCancelled = false;

    Promise.all([SubDashboardService.getAssignments({ id: dashboardId }), OrganizationService.query()])
      .then(([{ dashboard: dash, assignments: rows }, orgs]) => {
        if (!isCancelled) {
          setDashboard(dash);
          setAssignments(rows);
          setOrganizations(orgs);
          setIsLoaded(true);
        }
      })
      .catch((error) => {
        if (!isCancelled) {
          setLoadError(error);
          setIsLoaded(true);
        }
      });

    return () => {
      isCancelled = true;
    };
  }, [dashboardId]);

  const handleAssign = useCallback(
    (organizationId) => {
      setSaving(true);
      SubDashboardService.assign({ id: dashboardId, organizationId })
        .then((assignment) => {
          setAssignments((current) => [...current, assignment].sort((a, b) =>
            a.organization_name.localeCompare(b.organization_name)
          ));
          setModalVisible(false);
        })
        .catch(() => notification.error("Failed to assign the dashboard to that organization."))
        .finally(() => setSaving(false));
    },
    [dashboardId]
  );

  const handleRemove = useCallback(
    (assignment) => {
      setRemovingId(assignment.id);
      SubDashboardService.removeAssignment({ id: dashboardId, assignmentId: assignment.id })
        .then(() => setAssignments((current) => filter(current, (a) => a.id !== assignment.id)))
        .catch(() => notification.error("Failed to remove the assignment."))
        .finally(() => setRemovingId(null));
    },
    [dashboardId]
  );

  const columns = [
    { title: "Organization", dataIndex: "organization_name", key: "organization_name" },
    { title: "Slug", dataIndex: "organization_slug", key: "organization_slug" },
    {
      title: "",
      key: "actions",
      width: "1%",
      className: "text-nowrap",
      render: (text, assignment) => (
        <Button
          type="link"
          danger
          loading={removingId === assignment.id}
          disabled={removingId !== null}
          onClick={() => handleRemove(assignment)}>
          Remove
        </Button>
      ),
    },
  ];

  const title = dashboard ? `Assignments — ${dashboard.name}` : "Assignments";

  return (
    <div className="page-dashboard-list">
      <div className="container">
        <PageHeader title={title} />
        <div className="m-b-15">
          <Link href="sub-dashboards">&larr; Back to sub-dashboards</Link>
        </div>

        {!isLoaded ? (
          <LoadingState />
        ) : loadError ? (
          <BigMessage icon="fa-exclamation-circle" message="Failed to load assignments." />
        ) : (
          <React.Fragment>
            <div className="m-b-15">
              <Button type="primary" onClick={() => setModalVisible(true)}>
                Assign to organization
              </Button>
            </div>
            <div className="bg-white tiled table-responsive">
              <Table
                rowKey="id"
                columns={columns}
                dataSource={assignments}
                pagination={false}
                locale={{ emptyText: "This dashboard isn't assigned to any organization yet." }}
              />
            </div>
            <AssignOrgModal
              visible={modalVisible}
              organizations={organizations}
              assignments={assignments}
              saving={saving}
              onAssign={handleAssign}
              onCancel={() => setModalVisible(false)}
            />
          </React.Fragment>
        )}
      </div>
    </div>
  );
}

SubDashboardAssignments.propTypes = {
  dashboardId: PropTypes.string.isRequired,
};
