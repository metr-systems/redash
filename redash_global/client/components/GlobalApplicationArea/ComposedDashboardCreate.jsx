import React, { useState } from "react";
import { Modal, notification } from "antd";

import ComposedDashboardService from "../../services/composedDashboard";

export default function ComposedDashboardCreateModal({ visible, onClose, onSuccess }) {
  const [name, setName] = useState("");
  const [urlIdentifier, setUrlIdentifier] = useState("");
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState({});

  const handleSubmit = (e) => {
    e.preventDefault();

    const newErrors = {};
    if (!name.trim()) newErrors.name = "Name is required";
    if (!urlIdentifier.trim()) newErrors.urlIdentifier = "URL identifier is required";

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setSaving(true);
    ComposedDashboardService.create({ name, url_identifier: urlIdentifier })
      .then((dashboard) => {
        notification.success("Composed dashboard created successfully.");
        handleClose();
        onSuccess(dashboard.id);
      })
      .catch((error) => {
        setSaving(false);
        if (error.response?.status === 409) {
          setErrors({ urlIdentifier: "A dashboard with this URL identifier already exists." });
        } else {
          notification.error("Failed to create composed dashboard.");
        }
      });
  };

  const handleClose = () => {
    setName("");
    setUrlIdentifier("");
    setErrors({});
    onClose();
  };

  return (
    <Modal
      title="Create Composed Dashboard"
      visible={visible}
      onCancel={handleClose}
      footer={null}
      destroyOnClose
    >
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="name">Name *</label>
          <input
            id="name"
            type="text"
            className={`form-control ${errors.name ? "error" : ""}`}
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              setErrors({ ...errors, name: null });
            }}
            placeholder="Enter dashboard name"
          />
          {errors.name && <span className="text-danger">{errors.name}</span>}
        </div>

        <div className="form-group">
          <label htmlFor="urlIdentifier">URL Identifier *</label>
          <input
            id="urlIdentifier"
            type="text"
            className={`form-control ${errors.urlIdentifier ? "error" : ""}`}
            value={urlIdentifier}
            onChange={(e) => {
              setUrlIdentifier(e.target.value);
              setErrors({ ...errors, urlIdentifier: null });
            }}
            placeholder="e.g. my-dashboard"
          />
          {errors.urlIdentifier && <span className="text-danger">{errors.urlIdentifier}</span>}
        </div>

        <div className="form-group">
          <button type="submit" className="btn btn-primary" disabled={saving}>
            {saving ? "Creating..." : "Create"}
          </button>
          <button type="button" className="btn btn-default m-l-10" onClick={handleClose}>
            Cancel
          </button>
        </div>
      </form>
    </Modal>
  );
}
