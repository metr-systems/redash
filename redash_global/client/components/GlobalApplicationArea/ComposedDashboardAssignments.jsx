import React, { useEffect, useState } from "react";
import Button from "antd/lib/button";
import Modal from "antd/lib/modal";
import Select from "antd/lib/select";
import Tag from "antd/lib/tag";

import { ComposedDashboard, OrganizationService } from "../../services/composedDashboard";

export default function ComposedDashboardAssignments({ dashboardId }) {
  const [dashboard, setDashboard] = useState(null);
  const [assignments, setAssignments] = useState([]);
  const [allOrgs, setAllOrgs] = useState([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedOrgId, setSelectedOrgId] = useState(null);
  const [assigning, setAssigning] = useState(false);
  const [removingId, setRemovingId] = useState(null);

  useEffect(() => {
    ComposedDashboard.get(dashboardId).then(setDashboard);
    ComposedDashboard.getAssignments(dashboardId).then(setAssignments);
    OrganizationService.list().then(setAllOrgs);
  }, [dashboardId]);

  const assignedOrgIds = new Set(assignments.map((a) => a.organization_id));
  const availableOrgs = allOrgs.filter((o) => !assignedOrgIds.has(o.id));

  function openModal() {
    setSelectedOrgId(null);
    setModalOpen(true);
  }

  function handleAssign() {
    if (!selectedOrgId) return;
    setAssigning(true);
    ComposedDashboard.addAssignment(dashboardId, selectedOrgId)
      .then((newAssignment) => {
        setAssignments((prev) => [...prev, newAssignment]);
        setModalOpen(false);
      })
      .finally(() => setAssigning(false));
  }

  function handleRemove(assignment) {
    setRemovingId(assignment.assignment_id);
    ComposedDashboard.removeAssignment(dashboardId, assignment.assignment_id)
      .then(() => {
        setAssignments((prev) => prev.filter((a) => a.assignment_id !== assignment.assignment_id));
      })
      .finally(() => setRemovingId(null));
  }

  return (
    <div className="container" style={{ paddingTop: 30, maxWidth: 700 }}>
      <div style={{ marginBottom: 20 }}>
        <a href="/global-api/admin/composed-dashboards" style={{ fontSize: 13 }}>
          ← Back to Composed Dashboards
        </a>
      </div>

      <div style={{ display: "flex", alignItems: "center", marginBottom: 24, gap: 12 }}>
        <h3 style={{ margin: 0 }}>{dashboard ? dashboard.name : "…"}</h3>
        <span className="text-muted" style={{ fontSize: 13 }}>
          — Client Assignments
        </span>
      </div>

      <div style={{ display: "flex", alignItems: "center", marginBottom: 12, gap: 12 }}>
        <Button type="primary" size="small" onClick={openModal} disabled={availableOrgs.length === 0}>
          Assign to client
        </Button>
      </div>

      {assignments.length === 0 ? (
        <p className="text-muted">Not assigned to any client yet.</p>
      ) : (
        <div style={{ border: "1px solid #e8e8e8", borderRadius: 4, overflow: "hidden" }}>
          {assignments.map((a) => (
            <div
              key={a.assignment_id}
              style={{
                display: "flex",
                alignItems: "center",
                padding: "10px 14px",
                background: "#fff",
                borderBottom: "1px solid #f0f0f0",
              }}>
              <span style={{ flex: 1 }}>
                {a.organization_name}
                <Tag color="default" style={{ marginLeft: 8, fontSize: 11 }}>
                  {a.organization_slug}
                </Tag>
              </span>
              <Button
                size="small"
                type="danger"
                loading={removingId === a.assignment_id}
                onClick={() => handleRemove(a)}>
                Remove
              </Button>
            </div>
          ))}
        </div>
      )}

      <Modal
        title="Assign to client"
        visible={modalOpen}
        onCancel={() => setModalOpen(false)}
        onOk={handleAssign}
        okText="Assign"
        okButtonProps={{ disabled: !selectedOrgId, loading: assigning }}>
        <p style={{ marginBottom: 8 }}>Select the client organization to assign this composed dashboard to.</p>
        <Select
          style={{ width: "100%" }}
          placeholder="Select a client…"
          value={selectedOrgId}
          onChange={setSelectedOrgId}
          showSearch
          filterOption={(input, option) => option.children.toLowerCase().includes(input.toLowerCase())}>
          {availableOrgs.map((o) => (
            <Select.Option key={o.id} value={o.id}>
              {o.name} ({o.slug})
            </Select.Option>
          ))}
        </Select>
      </Modal>
    </div>
  );
}
