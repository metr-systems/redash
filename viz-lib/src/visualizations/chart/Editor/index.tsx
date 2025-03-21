/* eslint-disable react/prop-types */
import React from "react";
import createTabbedEditor from "@/components/visualizations/editor/createTabbedEditor";

import GeneralSettings from "./GeneralSettings";
import XAxisSettings from "./XAxisSettings";
import YAxisSettings from "./YAxisSettings";
import SeriesSettings from "./SeriesSettings";
import ColorsSettings from "./ColorsSettings";
import DataLabelsSettings from "./DataLabelsSettings";
import CustomChartSettings from "./CustomChartSettings";

import "./editor.less";
import i18next from "i18next";

const isCustomChart = (options: any) => options.globalSeriesType === "custom";
const isPieChart = (options: any) => options.globalSeriesType === "pie";

export default createTabbedEditor([
  {
    key: "General",
    title: i18next.t("vizlib:General"),
    component: (props: any) => (
      <React.Fragment>
        <GeneralSettings {...props} />
        {isCustomChart(props.options) && <CustomChartSettings {...props} />}
      </React.Fragment>
    ),
  },
  {
    key: "XAxis",
    title: ({ swappedAxes }: any) => (!swappedAxes ? i18next.t("vizlib:X Axis") : i18next.t("vizlib:Y Axis")),
    component: XAxisSettings,
    isAvailable: (options: any) => !isCustomChart(options) && !isPieChart(options),
  },
  {
    key: "YAxis",
    title: ({ swappedAxes }: any) => (!swappedAxes ? i18next.t("vizlib:Y Axis") : i18next.t("vizlib:X Axis")),
    component: YAxisSettings,
    isAvailable: (options: any) => !isCustomChart(options) && !isPieChart(options),
  },
  {
    key: "Series",
    title: i18next.t("vizlib:Series"),
    component: SeriesSettings,
    isAvailable: (options: any) => !isCustomChart(options),
  },
  {
    key: "Colors",
    title: i18next.t("vizlib:Colors"),
    component: ColorsSettings,
    isAvailable: (options: any) => !isCustomChart(options),
  },
  {
    key: "DataLabels",
    title: i18next.t("vizlib:Data Labels"),
    component: DataLabelsSettings,
    isAvailable: (options: any) => !isCustomChart(options),
  },
]);
