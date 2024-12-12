import React, { useState, useEffect } from "react";
import PropTypes from "prop-types";
import { toLower, isNumber } from "lodash";

import InputNumber from "antd/lib/input-number";
import Select from "antd/lib/select";

import { Trans, useTranslation } from "react-i18next";

import "./Rearm.less";

const DURATIONS = [
  ["Second", 1],
  ["Minute", 60],
  ["Hour", 3600],
  ["Day", 86400],
  ["Week", 604800],
];

function RearmByDuration({ value, onChange, editMode }) {
  const [durationIdx, setDurationIdx] = useState();
  const [count, setCount] = useState();

  useEffect(() => {
    for (let i = DURATIONS.length - 1; i >= 0; i -= 1) {
      const [, durValue] = DURATIONS[i];
      if (value % durValue === 0) {
        setDurationIdx(i);
        setCount(value / durValue);
        break;
      }
    }
  }, [value]);

  if (!isNumber(count) || !isNumber(durationIdx)) {
    return null;
  }

  const onChangeCount = newCount => {
    setCount(newCount);
    onChange(newCount * DURATIONS[durationIdx][1]);
  };

  const onChangeIdx = newIdx => {
    setDurationIdx(newIdx);
    onChange(count * DURATIONS[newIdx][1]);
  };

  const plural = count !== 1 ? "s" : "";

  if (editMode) {
    return (
      <>
        <InputNumber value={count} onChange={onChangeCount} min={1} precision={0} />
        <Select value={durationIdx} onChange={onChangeIdx}>
          {DURATIONS.map(([name], idx) => (
            <Select.Option value={idx} key={name}>
              {name}
              {plural}
            </Select.Option>
          ))}
        </Select>
      </>
    );
  }

  const [name] = DURATIONS[durationIdx];
  return count + " " + toLower(name) + plural;
}

RearmByDuration.propTypes = {
  onChange: PropTypes.func,
  value: PropTypes.number.isRequired,
  editMode: PropTypes.bool.isRequired,
};

RearmByDuration.defaultProps = {
  onChange: () => {},
};

function RearmEditor({ value, onChange }) {
  const [selected, setSelected] = useState(value < 2 ? value : 2);

  const _onChange = newSelected => {
    setSelected(newSelected);
    onChange(newSelected < 2 ? newSelected : 3600);
  };

  return (
    <div className="alert-rearm">
      <Select
        optionLabelProp="label"
        defaultValue={selected || 0}
        dropdownMatchSelectWidth={false}
        onChange={_onChange}>
        <Select.Option value={0} label="Just once">
          <Trans i18nKey="Alerts:just_once">
            Just once <em>until back to normal</em>
          </Trans>
        </Select.Option>
        <Select.Option value={1} label="Each time alert is evaluated">
          <Trans i18nKey="Alerts:each_time_alert_is_evaluated">
            Each time alert is evaluated <em>until back to normal</em>
          </Trans>
        </Select.Option>
        <Select.Option value={2} label="At most every">
          <Trans i18nKey="Alerts:at_most_every">
            At most every ... <em>when alert is evaluated</em>
          </Trans>
        </Select.Option>
      </Select>
      {selected === 2 && value && <RearmByDuration value={value} onChange={onChange} editMode />}
    </div>
  );
}

RearmEditor.propTypes = {
  onChange: PropTypes.func.isRequired,
  value: PropTypes.number.isRequired,
};

function RearmViewer({ value }) {
  const { t } = useTranslation("Alerts");
  let phrase = "";
  switch (value) {
    case 0:
      phrase = t("just once, until back to normal");
      break;
    case 1:
      phrase = t("each time alert is evaluated, until back to normal");
      break;
    default:
      phrase = (
        <>
          <Trans i18nKey="Alerts:at_most_every_when_alert_is_evaluated">
            at most every <RearmByDuration value={value} editMode={false} />, when alert is evaluated
          </Trans>
        </>
      );
  }

  return (
    <span>
      {t("Alerts:Notifications are sent")} {phrase}.
    </span>
  );
}

RearmViewer.propTypes = {
  value: PropTypes.number.isRequired,
};

export default function Rearm({ editMode, ...props }) {
  return editMode ? <RearmEditor {...props} /> : <RearmViewer {...props} />;
}

Rearm.propTypes = {
  onChange: PropTypes.func,
  value: PropTypes.number.isRequired,
  editMode: PropTypes.bool,
};

Rearm.defaultProps = {
  onChange: null,
  editMode: false,
};
