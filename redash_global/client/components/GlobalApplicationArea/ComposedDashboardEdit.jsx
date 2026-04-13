import React, { useCallback, useEffect, useRef, useState } from "react";
import { sortableContainer, sortableElement, sortableHandle } from "react-sortable-hoc";
import Button from "antd/lib/button";
import Input from "antd/lib/input";
import Modal from "antd/lib/modal";
import Select from "antd/lib/select";
import Tag from "antd/lib/tag";

import { ComposedDashboard, OrganizationService } from "../../services/composedDashboard";
import { GlobalDashboard } from "../../services/globalDashboard";

// ─── Sortable primitives ────────────────────────────────────────────────────

const DragHandle = sortableHandle(() => (
  <span style={{ cursor: "grab", marginRight: 10, color: "#bbb", fontSize: 16, lineHeight: 1 }}>⠿</span>
));

const SortableItem = sortableElement(({ entry, onRemove }) => (
  <div
    style={{
      display: "flex",
      alignItems: "center",
      padding: "10px 14px",
      background: "#fff",
      borderBottom: "1px solid #f0f0f0",
      userSelect: "none",
    }}>
    <DragHandle />
    <a href={entry.url} target="_blank" rel="noopener noreferrer" style={{ flex: 1 }}>
      {entry.name}
    </a>
    <Button size="small" type="danger" onClick={() => onRemove(entry)}>
      Remove
    </Button>
  </div>
));

const SortableList = sortableContainer(({ entries, onRemove }) => (
  <div style={{ border: "1px solid #e8e8e8", borderRadius: 4, overflow: "hidden" }}>
    {entries.map((entry, index) => (
      <SortableItem key={entry.entry_id} index={index} entry={entry} onRemove={onRemove} />
    ))}
  </div>
));

// ─── Available dashboards picker ─────────────────────────────────────────────

function AvailableDashboardsPicker({ addedIds, onAdd }) {
  const [available, setAvailable] = useState([]);
  const [search, setSearch] = useState("");
  const [adding, setAdding] = useState(null); // dashboard_id currently being added

  useEffect(() => {
    GlobalDashboard.query({ page_size: 250 }).then((data) => {
      setAvailable(data.results || []);
    });
  }, []);

  const filtered = available.filter((d) => d.name.toLowerCase().includes(search.toLowerCase()));

  function handleAdd(dashboard) {
    setAdding(dashboard.id);
    onAdd(dashboard).finally(() => setAdding(null));
  }

  return (
    <div style={{ marginTop: 32 }}>
      <h5 style={{ marginBottom: 10 }}>Available dashboards</h5>
      <Input
        placeholder="Search…"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        style={{ marginBottom: 10, maxWidth: 340 }}
      />
      {filtered.length === 0 ? (
        <p className="text-muted">No dashboards found.</p>
      ) : (
        <div style={{ border: "1px solid #e8e8e8", borderRadius: 4, overflow: "hidden", maxHeight: 360, overflowY: "auto" }}>
          {filtered.map((d) => {
            const isAdded = addedIds.has(d.id);
            return (
              <div
                key={d.id}
                style={{
                  display: "flex",
                  alignItems: "center",
                  padding: "8px 14px",
                  background: isAdded ? "#fafafa" : "#fff",
                  borderBottom: "1px solid #f0f0f0",
                }}>
                <span style={{ flex: 1, color: isAdded ? "#aaa" : "inherit" }}>{d.name}</span>
                <Button
                  size="small"
                  disabled={isAdded || adding === d.id}
                  loading={adding === d.id}
                  onClick={() => handleAdd(d)}>
                  {isAdded ? "Added" : "Add"}
                </Button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ─── Client assignments panel ─────────────────────────────────────────────────

function ClientAssignmentsPanel({ dashboardId }) {
  const [assignments, setAssignments] = useState([]);
  const [allOrgs, setAllOrgs] = useState([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedOrgId, setSelectedOrgId] = useState(null);
  const [assigning, setAssigning] = useState(false);
  const [removingId, setRemovingId] = useState(null);

  useEffect(() => {
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
    <div style={{ marginTop: 40 }}>
      <div style={{ display: "flex", alignItems: "center", marginBottom: 12, gap: 12 }}>
        <h5 style={{ margin: 0 }}>Clients</h5>
        <Button size="small" type="primary" onClick={openModal} disabled={availableOrgs.length === 0}>
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

// ─── Main component ─────────────────────────────────────────────────────────

export default function ComposedDashboardEdit({ dashboardId }) {
  const [dashboard, setDashboard] = useState(null);
  const [entries, setEntries] = useState([]);
  const [saveStatus, setSaveStatus] = useState(null); // null | "saving" | "saved" | "error"
  const saveTimerRef = useRef(null);

  useEffect(() => {
    ComposedDashboard.get(dashboardId).then(setDashboard);
    ComposedDashboard.getEntries(dashboardId).then(setEntries);
  }, [dashboardId]);

  const persistOrder = useCallback(
    (newEntries) => {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
      setSaveStatus("saving");
      saveTimerRef.current = setTimeout(() => {
        ComposedDashboard.reorderEntries(
          dashboardId,
          newEntries.map((e) => e.entry_id)
        )
          .then(() => setSaveStatus("saved"))
          .catch(() => setSaveStatus("error"));
      }, 400);
    },
    [dashboardId]
  );

  function handleSortEnd({ oldIndex, newIndex }) {
    if (oldIndex === newIndex) return;
    const reordered = [...entries];
    reordered.splice(newIndex, 0, ...reordered.splice(oldIndex, 1));
    setEntries(reordered);
    persistOrder(reordered);
  }

  function handleAdd(templateDashboard) {
    return ComposedDashboard.addEntry(dashboardId, templateDashboard.id).then((newEntry) => {
      setEntries((prev) => [...prev, newEntry]);
    });
  }

  function handleRemove(entry) {
    ComposedDashboard.removeEntry(dashboardId, entry.entry_id).then(() => {
      setEntries((prev) => prev.filter((e) => e.entry_id !== entry.entry_id));
    });
  }

  if (!dashboard) {
    return (
      <div className="container" style={{ paddingTop: 30 }}>
        <p className="text-muted">Loading…</p>
      </div>
    );
  }

  const addedIds = new Set(entries.map((e) => e.dashboard_id));

  return (
    <div className="container" style={{ paddingTop: 30, maxWidth: 700 }}>
      <div style={{ display: "flex", alignItems: "baseline", marginBottom: 20, gap: 12 }}>
        <h3 style={{ margin: 0 }}>{dashboard.name}</h3>
        {saveStatus === "saving" && <small className="text-muted">Saving…</small>}
        {saveStatus === "saved" && <small style={{ color: "#52c41a" }}>Saved</small>}
        {saveStatus === "error" && <small className="text-danger">Save failed</small>}
      </div>

      <h5 style={{ marginBottom: 8 }}>Sub-dashboards</h5>
      {entries.length === 0 ? (
        <p className="text-muted">No sub-dashboards added yet.</p>
      ) : (
        <>
          <p className="text-muted" style={{ marginBottom: 10 }}>
            Drag rows to reorder. Changes are saved automatically.
          </p>
          <SortableList
            entries={entries}
            onRemove={handleRemove}
            onSortEnd={handleSortEnd}
            useDragHandle
            lockAxis="y"
            helperClass="sortable-helper"
          />
        </>
      )}

      <AvailableDashboardsPicker addedIds={addedIds} onAdd={handleAdd} />

      <ClientAssignmentsPanel dashboardId={dashboardId} />
    </div>
  );
}
