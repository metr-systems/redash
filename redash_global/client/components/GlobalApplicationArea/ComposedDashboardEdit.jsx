import React, { useCallback, useEffect, useMemo, useState } from "react";
import PropTypes from "prop-types";
import { filter, find, keyBy } from "lodash";

import Button from "antd/lib/button";
import Modal from "antd/lib/modal";
import Select from "antd/lib/select";
import Table from "antd/lib/table";
import Icon from "antd/lib/icon";

import Link from "@/components/Link";
import PageHeader from "@/components/PageHeader";
import BigMessage from "@/components/BigMessage";
import LoadingState from "@/components/items-list/components/LoadingState";
import notification from "@/services/notification";

import ComposedDashboardService from "../../services/composedDashboard";
import SubDashboardService from "../../services/subDashboard";

function AddEntryModal({ visible, entries, subDashboards, saving, onAdd, onCancel }) {
  const [selectedDashboardId, setSelectedDashboardId] = useState(undefined);

  useEffect(() => {
    if (visible) {
      setSelectedDashboardId(undefined);
    }
  }, [visible]);

  const assignedDashboardIds = useMemo(
    () => new Set(entries.map((e) => e.template_dashboard_id)),
    [entries]
  );

  const availableDashboards = useMemo(
    () => filter(subDashboards, (d) => !assignedDashboardIds.has(d.id)),
    [subDashboards, assignedDashboardIds]
  );

  return (
    <Modal
      visible={visible}
      title="Add subdashboard"
      okText="Add"
      okButtonProps={{ disabled: !selectedDashboardId || saving, loading: saving }}
      cancelButtonProps={{ disabled: saving }}
      closable={!saving}
      maskClosable={!saving}
      onOk={() => onAdd(selectedDashboardId)}
      onCancel={onCancel}>
      <Select
        showSearch
        optionFilterProp="children"
        placeholder="Select a subdashboard"
        style={{ width: "100%" }}
        value={selectedDashboardId}
        onChange={setSelectedDashboardId}
        notFoundContent="No subdashboards available to add">
        {availableDashboards.map((d) => (
          <Select.Option key={d.id} value={d.id}>
            {d.name}
          </Select.Option>
        ))}
      </Select>
    </Modal>
  );
}

AddEntryModal.propTypes = {
  visible: PropTypes.bool.isRequired,
  entries: PropTypes.arrayOf(PropTypes.object).isRequired,
  subDashboards: PropTypes.arrayOf(PropTypes.object).isRequired,
  saving: PropTypes.bool.isRequired,
  onAdd: PropTypes.func.isRequired,
  onCancel: PropTypes.func.isRequired,
};

export default function ComposedDashboardEdit({ composedDashboardId }) {
  const [composedDashboard, setComposedDashboard] = useState(null);
  const [entries, setEntries] = useState([]);
  const [subDashboards, setSubDashboards] = useState([]);
  const [isLoaded, setIsLoaded] = useState(false);
  const [loadError, setLoadError] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [saving, setSaving] = useState(false);
  const [removingId, setRemovingId] = useState(null);

  const subDashboardsById = useMemo(() => keyBy(subDashboards, "id"), [subDashboards]);

  useEffect(() => {
    let isCancelled = false;

    Promise.all([
      ComposedDashboardService.get(composedDashboardId),
      ComposedDashboardService.getEntries(composedDashboardId),
      SubDashboardService.query({ page_size: 1000 }),
    ])
      .then(([dashboard, dashboardEntries, subDashboardsData]) => {
        if (!isCancelled) {
          setComposedDashboard(dashboard);
          setEntries(dashboardEntries);
          setSubDashboards(subDashboardsData.results);
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
  }, [composedDashboardId]);

  const handleAdd = useCallback(
    (dashboardId) => {
      setSaving(true);
      ComposedDashboardService.addEntry(composedDashboardId, dashboardId)
        .then((newEntry) => {
          setEntries((current) => [...current, newEntry].sort((a, b) => a.order_index - b.order_index));
          setModalVisible(false);
        })
        .catch(() => notification.error("Failed to add the subdashboard."))
        .finally(() => setSaving(false));
    },
    [composedDashboardId]
  );

  const handleRemove = useCallback(
    (entry) => {
      setRemovingId(entry.id);
      ComposedDashboardService.removeEntry(composedDashboardId, entry.id)
        .then(() => setEntries((current) => filter(current, (e) => e.id !== entry.id)))
        .catch(() => notification.error("Failed to remove the entry."))
        .finally(() => setRemovingId(null));
    },
    [composedDashboardId]
  );

  const handleMoveUp = useCallback(
    (entry) => {
      const currentIndex = entries.findIndex((e) => e.id === entry.id);
      if (currentIndex <= 0) return;

      const newEntries = [...entries];
      [newEntries[currentIndex - 1], newEntries[currentIndex]] = [
        newEntries[currentIndex],
        newEntries[currentIndex - 1],
      ];

      setSaving(true);
      ComposedDashboardService.reorderEntries(
        composedDashboardId,
        newEntries.map((e) => e.id)
      )
        .then(() => setEntries(newEntries))
        .catch(() => notification.error("Failed to reorder entries."))
        .finally(() => setSaving(false));
    },
    [composedDashboardId, entries]
  );

  const handleMoveDown = useCallback(
    (entry) => {
      const currentIndex = entries.findIndex((e) => e.id === entry.id);
      if (currentIndex >= entries.length - 1) return;

      const newEntries = [...entries];
      [newEntries[currentIndex], newEntries[currentIndex + 1]] = [
        newEntries[currentIndex + 1],
        newEntries[currentIndex],
      ];

      setSaving(true);
      ComposedDashboardService.reorderEntries(
        composedDashboardId,
        newEntries.map((e) => e.id)
      )
        .then(() => setEntries(newEntries))
        .catch(() => notification.error("Failed to reorder entries."))
        .finally(() => setSaving(false));
    },
    [composedDashboardId, entries]
  );

  const columns = [
    {
      title: "Subdashboard",
      dataIndex: "template_dashboard_id",
      key: "name",
      render: (dashboardId) => {
        const dashboard = subDashboardsById[dashboardId];
        return dashboard ? dashboard.name : `Dashboard #${dashboardId}`;
      },
    },
    {
      title: "",
      key: "actions",
      width: "20%",
      className: "text-nowrap",
      render: (text, entry) => {
        const currentIndex = entries.findIndex((e) => e.id === entry.id);
        return (
          <span>
            <Button
              type="link"
              disabled={currentIndex === 0 || saving}
              onClick={() => handleMoveUp(entry)}>
              <Icon type="arrow-up" /> Up
            </Button>
            <Button
              type="link"
              disabled={currentIndex >= entries.length - 1 || saving}
              onClick={() => handleMoveDown(entry)}>
              <Icon type="arrow-down" /> Down
            </Button>
            <Button
              type="link"
              danger
              loading={removingId === entry.id}
              disabled={removingId !== null || saving}
              onClick={() => handleRemove(entry)}>
              Remove
            </Button>
          </span>
        );
      },
    },
  ];

  const title = composedDashboard ? `Edit — ${composedDashboard.name}` : "Edit Composed Dashboard";

  return (
    <div className="page-dashboard-list">
      <div className="container">
        <PageHeader title={title} />
        <div className="m-b-15">
          <Link href="composed-dashboards">&larr; Back to composed dashboards</Link>
        </div>

        {!isLoaded ? (
          <LoadingState />
        ) : loadError ? (
          <BigMessage icon="fa-exclamation-circle" message="Failed to load composed dashboard." />
        ) : (
          <React.Fragment>
            <div className="m-b-15">
              <Button type="primary" onClick={() => setModalVisible(true)} disabled={saving}>
                Add subdashboard
              </Button>
            </div>
            <div className="bg-white tiled table-responsive">
              <Table
                rowKey="id"
                columns={columns}
                dataSource={entries}
                pagination={false}
                locale={{ emptyText: "No subdashboards added yet." }}
              />
            </div>
            <AddEntryModal
              visible={modalVisible}
              entries={entries}
              subDashboards={subDashboards}
              saving={saving}
              onAdd={handleAdd}
              onCancel={() => setModalVisible(false)}
            />
          </React.Fragment>
        )}
      </div>
    </div>
  );
}

ComposedDashboardEdit.propTypes = {
  composedDashboardId: PropTypes.string.isRequired,
};
