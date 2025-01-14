import createTabbedEditor from "@/components/visualizations/editor/createTabbedEditor";

import ColumnsSettings from "./ColumnsSettings";
import OptionsSettings from "./OptionsSettings";
import ColorsSettings from "./ColorsSettings";
import AppearanceSettings from "./AppearanceSettings";

import i18next from "i18next";

export default createTabbedEditor([
  { key: "Columns", title: i18next.t("vizlib:Columns"), component: ColumnsSettings },
  { key: "Options", title: i18next.t("vizlib:Options"), component: OptionsSettings },
  { key: "Colors", title: i18next.t("vizlib:Colors"), component: ColorsSettings },
  { key: "Appearance", title: i18next.t("vizlib:Appearance"), component: AppearanceSettings },
]);
