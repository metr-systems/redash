/* eslint-disable react/prop-types */

import { toPairs } from "lodash";
import React from "react";
import { useTranslation } from "react-i18next";

import List from "antd/lib/list";
import Card from "antd/lib/card";
import TimeAgo from "@/components/TimeAgo";

import { toHuman, prettySize } from "@/lib/utils";

export function General({ info }) {
  const { t } = useTranslation("Admin");
  info = toPairs(info);
  return (
    <Card title={t("General")} size="small">
      {info.length === 0 && <div className="text-muted text-center">{t("No data")}</div>}
      {info.length > 0 && (
        <List
          size="small"
          itemLayout="vertical"
          dataSource={info}
          renderItem={([name, value]) => (
            <List.Item extra={<span className="badge">{value}</span>}>{toHuman(name)}</List.Item>
          )}
        />
      )}
    </Card>
  );
}

export function DatabaseMetrics({ info }) {
  const { t } = useTranslation("Admin");
  return (
    <Card title={t("Redash Database")} size="small">
      {info.length === 0 && <div className="text-muted text-center">{t("No data")}</div>}
      {info.length > 0 && (
        <List
          size="small"
          itemLayout="vertical"
          dataSource={info}
          renderItem={([name, size]) => (
            <List.Item extra={<span className="badge">{prettySize(size)}</span>}>{name}</List.Item>
          )}
        />
      )}
    </Card>
  );
}

export function Queues({ info }) {
  const { t } = useTranslation("Admin");
  info = toPairs(info);
  return (
    <Card title={t("Queues")} size="small">
      {info.length === 0 && <div className="text-muted text-center">{t("No data")}</div>}
      {info.length > 0 && (
        <List
          size="small"
          itemLayout="vertical"
          dataSource={info}
          renderItem={([name, queue]) => (
            <List.Item extra={<span className="badge">{queue.size}</span>}>{name}</List.Item>
          )}
        />
      )}
    </Card>
  );
}

export function Manager({ info }) {
  const { t } = useTranslation("Admin");
  const items = info
    ? [
        <List.Item
          extra={
            <span className="badge">
              <TimeAgo date={info.lastRefreshAt} placeholder="n/a" />
            </span>
          }
        >
          {t("Last Refresh")}
        </List.Item>,
        <List.Item
          extra={
            <span className="badge">
              <TimeAgo date={info.startedAt} placeholder="n/a" />
            </span>
          }
        >
          {t("Started")}
        </List.Item>,
        <List.Item extra={<span className="badge">{info.outdatedQueriesCount}</span>}>
          {t("Outdated Queries Count")}
        </List.Item>,
      ]
    : [];

  return (
    <Card title={t("Manager")} size="small">
      {!info && <div className="text-muted text-center">{t("No data")}</div>}
      {info && <List size="small" itemLayout="vertical" dataSource={items} renderItem={(item) => item} />}
    </Card>
  );
}
