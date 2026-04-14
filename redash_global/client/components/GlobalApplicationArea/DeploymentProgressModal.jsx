import React, { useEffect, useRef, useState } from "react";
import Button from "antd/lib/button";
import Modal from "antd/lib/modal";
import Spin from "antd/lib/spin";

const STATUS_COLOR = {
  waiting: "#d9d9d9",
  running: "#1890ff",
  ok: "#52c41a",
  error: "#f5222d",
};

function StepIcon({ status }) {
  if (status === "running") return <Spin size="small" />;
  if (status === "ok") return <span style={{ color: STATUS_COLOR.ok, fontWeight: 700 }}>✓</span>;
  if (status === "error") return <span style={{ color: STATUS_COLOR.error, fontWeight: 700 }}>✗</span>;
  return <span style={{ color: STATUS_COLOR.waiting }}>○</span>;
}

function StepRow({ step, status, detail }) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "baseline",
        gap: 10,
        padding: "5px 0",
        color: status === "error" ? STATUS_COLOR.error : "inherit",
      }}>
      <div style={{ width: 18, textAlign: "center", flexShrink: 0, paddingTop: 2 }}>
        <StepIcon status={status} />
      </div>
      <div>
        <span>{step}</span>
        {detail ? <span style={{ marginLeft: 8, color: "#999", fontSize: 12 }}>{detail}</span> : null}
      </div>
    </div>
  );
}

/**
 * Opens a modal that streams deployment progress via SSE.
 *
 * Props:
 *   visible        – bool
 *   dashboardId    – int
 *   orgId          – int|null  (required when deploymentId is null – first deploy)
 *   deploymentId   – int|null  (set for redeploy, null for first deploy)
 *   onDone(result) – called with the {done, deployment_id, deployed_dashboard_id} payload
 *   onClose()      – called when the user dismisses the modal
 */
export default function DeploymentProgressModal({ visible, dashboardId, orgId, deploymentId, onDone, onClose }) {
  const [steps, setSteps] = useState([]);
  const [done, setDone] = useState(false);
  const [fatalError, setFatalError] = useState(null);
  const readerRef = useRef(null);

  useEffect(() => {
    if (!visible) return;

    // Reset state on each open.
    setSteps([]);
    setDone(false);
    setFatalError(null);

    const url = deploymentId
      ? `/global-api/global-dashboards/${dashboardId}/deployments/${deploymentId}/redeploy-stream`
      : `/global-api/global-dashboards/${dashboardId}/deployments/stream`;

    let cancelled = false;

    fetch(url, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: deploymentId ? null : JSON.stringify({ organization_id: orgId }),
    })
      .then(async response => {
        if (!response.ok) {
          const text = await response.text().catch(() => "");
          let message = `HTTP ${response.status}`;
          try {
            message = JSON.parse(text).error || message;
          } catch (_) {}
          if (!cancelled) setFatalError(message);
          return;
        }

        const reader = response.body.getReader();
        readerRef.current = reader;
        const decoder = new TextDecoder();
        let buffer = "";

        // eslint-disable-next-line no-constant-condition
        while (true) {
          const { done: streamDone, value } = await reader.read();
          if (streamDone || cancelled) break;

          buffer += decoder.decode(value, { stream: true });
          // SSE messages are delimited by double newlines.
          const parts = buffer.split("\n\n");
          buffer = parts.pop(); // keep any incomplete trailing chunk

          for (const part of parts) {
            const line = part.trim();
            if (!line.startsWith("data:")) continue;
            let payload;
            try {
              payload = JSON.parse(line.slice(5).trim());
            } catch (_) {
              continue;
            }

            if (cancelled) break;

            if (payload.done) {
              setDone(true);
              onDone?.(payload);
            } else if (payload.step) {
              // Update in-place if the step already exists (running → ok/error),
              // otherwise append.
              setSteps(prev => {
                const idx = prev.findIndex(s => s.step === payload.step);
                if (idx >= 0) {
                  const next = [...prev];
                  next[idx] = payload;
                  return next;
                }
                return [...prev, payload];
              });
            }
          }
        }
      })
      .catch(err => {
        if (!cancelled) setFatalError(err.message);
      });

    return () => {
      cancelled = true;
      readerRef.current?.cancel().catch(() => {});
    };
  }, [visible, dashboardId, orgId, deploymentId]);

  const isRunning = !done && !fatalError;

  return (
    <Modal
      title={deploymentId ? "Redeploying Dashboard" : "Deploying Dashboard"}
      visible={visible}
      closable={!isRunning}
      maskClosable={!isRunning}
      onCancel={isRunning ? undefined : onClose}
      footer={
        <Button type={done ? "primary" : "default"} disabled={isRunning} onClick={onClose}>
          {isRunning ? "Running…" : "Close"}
        </Button>
      }>
      <div style={{ minHeight: 80 }}>
        {steps.map(s => (
          <StepRow key={s.step} {...s} />
        ))}

        {fatalError && (
          <div style={{ marginTop: 12, padding: "8px 12px", background: "#fff1f0", border: "1px solid #ffa39e", borderRadius: 4, color: STATUS_COLOR.error }}>
            {fatalError}
          </div>
        )}

        {done && (
          <div style={{ marginTop: 12, padding: "8px 12px", background: "#f6ffed", border: "1px solid #b7eb8f", borderRadius: 4, color: "#389e0d" }}>
            Deployment completed successfully.
          </div>
        )}
      </div>
    </Modal>
  );
}
