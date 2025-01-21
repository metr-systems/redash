import createTabbedEditor from "@/components/visualizations/editor/createTabbedEditor";

import ColumnsSettings from "./ColumnsSettings";
import GridSettings from "./GridSettings";
import i18next from "i18next";

import "./editor.less";

export default createTabbedEditor([
  { key: "Columns", title: i18next.t("vizlib:Columns"), component: ColumnsSettings },
  { key: "Grid", title: i18next.t("vizlib:Grid"), component: GridSettings },
]);
