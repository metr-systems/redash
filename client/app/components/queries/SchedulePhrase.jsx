import React from "react";
import PropTypes from "prop-types";

import i18next from "i18next";

import Tooltip from "@/components/Tooltip";
import PlainButton from "@/components/PlainButton";
import { localizeTime, durationHumanize } from "@/lib/utils";
import { RefreshScheduleType, RefreshScheduleDefault } from "../proptypes";

import "./ScheduleDialog.css";

export default class SchedulePhrase extends React.Component {
  static propTypes = {
    schedule: RefreshScheduleType,
    isNew: PropTypes.bool.isRequired,
    isLink: PropTypes.bool,
    onClick: PropTypes.func,
  };

  static defaultProps = {
    schedule: RefreshScheduleDefault,
    isLink: false,
    onClick: () => {},
  };

  get content() {
    const { interval: seconds } = this.props.schedule || SchedulePhrase.defaultProps.schedule;
    if (!seconds) {
      return [i18next.t("Queries:Never")];
    }
    const humanized = durationHumanize(seconds, {
      omitSingleValueNumber: true,
    });

    const SECOND = 1,
      MINUTE = 60,
      HOUR = 3600,
      DAY = 86400,
      WEEK = 604800;

    let short, full;
    switch (seconds) {
      case DAY:
        short = i18next.t("Queries:Every_Day", { humanized });
        full = i18next.t("Queries:Refreshes_Every_Day", { humanized });
        break;
      case SECOND:
      case MINUTE:
      case HOUR:
      case WEEK:
        short = i18next.t("Queries:Every", { humanized });
        full = i18next.t("Queries:Refreshes_Every", { humanized });
        break;
      default:
        short = i18next.t("Queries:Every_plural", { humanized });
        full = i18next.t("Queries:Refreshes_Every_plural", { humanized });
    }

    const { time, day_of_week: dayOfWeek } = this.props.schedule;
    if (time) {
      full += i18next.t("Queries:at {{time}}", { time: ` ${localizeTime(time)}` });
    }
    if (dayOfWeek) {
      full += i18next.t("Queries:on {{day}}", { day: ` ${dayOfWeek}` });
    }

    return [short, full];
  }

  render() {
    if (this.props.isNew) {
      return i18next.t("Queries:Never");
    }

    const [short, full] = this.content;
    const content = full ? <Tooltip title={full}>{short}</Tooltip> : short;

    return this.props.isLink ? (
      <PlainButton type="link" className="schedule-phrase" onClick={this.props.onClick} data-test="EditSchedule">
        {content}
      </PlainButton>
    ) : (
      content
    );
  }
}
