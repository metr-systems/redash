import React, { useEffect, useState } from "react";
import Button from "antd/lib/button";
import Modal from "antd/lib/modal";
import Select from "antd/lib/select";
import Tag from "antd/lib/tag";

import { ComposedDashboard, OrganizationService } from "../../services/composedDashboard";
import DeploymentProgressModal from "./DeploymentProgressModal";

export default function ComposedDashboardAssignments({ dashboardId }) {
  const [dashboard, setDashboard] = useState(null);
  const [deployments, setDeployments] = useState([]);
  const [allOrgs, setAllOrgs] = useState([]);

  // Org-selection modal state
  const [selectOrgOpen, setSelectOrgOpen] = useState(false);
  const [selectedOrgId, setSelectedOrgId] = useState(null);

  // Progress modal state
  const [progressModal, setProgressModal] = useState({
    visible: false,
    orgId: null,
    deploymentId: null,
  });

  // Removal state
  const [removingId, setRemovingId] = useState(null);

  useEffect(() => {
    ComposedDashboard.get(dashboardId).then(setDashboard);
    ComposedDashboard.getDeployments(dashboardId).then(setDeployments);
    OrganizationService.list().then(setAllOrgs);
  }, [dashboardId]);

  const deployedOrgIds = new Set(deployments.map(d => d.organization_id));
  const availableOrgs = allOrgs.filter(o => !deployedOrgIds.has(o.id));

  // ── Org selection ────────────────────────────────────────────────────────

  function openOrgSelect() {
    setSelectedOrgId(null);
    setSelectOrgOpen(true);
  }

  function handleStartDeploy() {
    if (!selectedOrgId) return;
    setSelectOrgOpen(false);
    setProgressModal({ visible: true, orgId: selectedOrgId, deploymentId: null });
  }

  // ── Redeploy ─────────────────────────────────────────────────────────────

  function handleRedeploy(deployment) {
    setProgressModal({ visible: true, orgId: null, deploymentId: deployment.deployment_id });
  }

  // ── Remove ───────────────────────────────────────────────────────────────

  function handleRemove(deployment) {
    setRemovingId(deployment.deployment_id);
    ComposedDashboard.removeDeployment(dashboardId, deployment.deployment_id)
      .then(() => setDeployments(prev => prev.filter(d => d.deployment_id !== deployment.deployment_id)))
      .finally(() => setRemovingId(null));
  }

  // ── Progress modal callbacks ─────────────────────────────────────────────

  function handleDeployDone() {
    // Re-fetch the full deployment list so the table reflects the new entry.
    ComposedDashboard.getDeployments(dashboardId).then(setDeployments);
  }

  function handleProgressClose() {
    setProgressModal({ visible: false, orgId: null, deploymentId: null });
  }

  // ── Render ───────────────────────────────────────────────────────────────

  return (
    <div className="container" style={{ paddingTop: 30, maxWidth: 700 }}>
      <div style={{ marginBottom: 20 }}>
        <a href="/global-api/admin/composed-dashboards" style={{ fontSize: 13 }}>
          ← Back to Composed Dashboards
        </a>
      </div>

      <div style={{ display: "flex", alignItems: "center", marginBottom: 24, gap: 12 }}>
        <h3 style={{ margin: 0 }}>{dashboard ? dashboard.name : "…"}</h3>
        <span className="text-muted" style={{ fontSize: 13 }}>— Client Deployments</span>
      </div>

      <div style={{ marginBottom: 12 }}>
        <Button type="primary" size="small" onClick={openOrgSelect} disabled={availableOrgs.length === 0}>
          Deploy to client
        </Button>
      </div>

      {deployments.length === 0 ? (
        <p className="text-muted">Not deployed to any client yet.</p>
      ) : (
        <div style={{ border: "1px solid #e8e8e8", borderRadius: 4, overflow: "hidden" }}>
          {deployments.map(d => (
            <div
              key={d.deployment_id}
              style={{
                display: "flex",
                alignItems: "center",
                padding: "10px 14px",
                background: "#fff",
                borderBottom: "1px solid #f0f0f0",
              }}>
              <span style={{ flex: 1 }}>
                {d.organization_name}
                <Tag color="default" style={{ marginLeft: 8, fontSize: 11 }}>
                  {d.organization_slug}
                </Tag>
              </span>
              <div style={{ display: "flex", gap: 8 }}>
                <Button size="small" onClick={() => handleRedeploy(d)}>
                  Redeploy
                </Button>
                <Button
                  size="small"
                  type="danger"
                  loading={removingId === d.deployment_id}
                  onClick={() => handleRemove(d)}>
                  Remove
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Org-selection modal (step 1 of deploy) */}
      <Modal
        title="Deploy to client"
        visible={selectOrgOpen}
        onCancel={() => setSelectOrgOpen(false)}
        onOk={handleStartDeploy}
        okText="Deploy"
        okButtonProps={{ disabled: !selectedOrgId }}>
        <p style={{ marginBottom: 8 }}>Select the client organization to deploy this composed dashboard to.</p>
        <Select
          style={{ width: "100%" }}
          placeholder="Select a client…"
          value={selectedOrgId}
          onChange={setSelectedOrgId}
          showSearch
          filterOption={(input, option) => option.children.toLowerCase().includes(input.toLowerCase())}>
          {availableOrgs.map(o => (
            <Select.Option key={o.id} value={o.id}>
              {o.name} ({o.slug})
            </Select.Option>
          ))}
        </Select>
      </Modal>

      {/* Deployment progress modal (step 2 of deploy / redeploy) */}
      <DeploymentProgressModal
        visible={progressModal.visible}
        dashboardId={dashboardId}
        orgId={progressModal.orgId}
        deploymentId={progressModal.deploymentId}
        onDone={handleDeployDone}
        onClose={handleProgressClose}
      />
    </div>
  );
}
