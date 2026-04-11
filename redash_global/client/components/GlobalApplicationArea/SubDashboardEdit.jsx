import React, { useState, useEffect } from "react";
import Button from "antd/lib/button";
import Input from "antd/lib/input";

import { SubDashboard } from "../../services/subDashboard";

export default function SubDashboardEdit({ dashboardId }) {
  const [dashboard, setDashboard] = useState(null);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    SubDashboard.get(dashboardId)
      .then((data) => {
        setDashboard(data);
        setName(data.name);
        setDescription(data.description || "");
      })
      .catch(() => setError("Dashboard not found."))
      .finally(() => setLoading(false));
  }, [dashboardId]);

  function handleSave() {
    const trimmed = name.trim();
    if (!trimmed) return;
    setSaving(true);
    SubDashboard.save(dashboardId, { name: trimmed, description })
      .then((data) => {
        setDashboard(data);
        setName(data.name);
        setDescription(data.description || "");
      })
      .finally(() => setSaving(false));
  }

  if (loading) return <div className="container" style={{ paddingTop: 30 }}>Loading...</div>;
  if (error) return <div className="container" style={{ paddingTop: 30 }}><p className="text-danger">{error}</p></div>;

  return (
    <div className="container" style={{ paddingTop: 30, maxWidth: 700 }}>
      <div className="m-b-20">
        <a href="../dashboards">← Dashboards</a>
      </div>
      <h3>{dashboard.name}</h3>
      <div className="m-b-15">
        <label htmlFor="gd-name" className="control-label">Name</label>
        <Input
          id="gd-name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          disabled={saving}
        />
      </div>
      <div className="m-b-20">
        <label htmlFor="gd-description" className="control-label">Description</label>
        <Input.TextArea
          id="gd-description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={3}
          disabled={saving}
        />
      </div>
      <Button type="primary" onClick={handleSave} loading={saving} disabled={!name.trim()}>
        Save
      </Button>
    </div>
  );
}
