import createTabbedEditor from "@/components/visualizations/editor/createTabbedEditor";

import GeneralSettings from "./GeneralSettings";
import AppearanceSettings from "./AppearanceSettings";

import i18next from "i18next";

export default createTabbedEditor([
  { key: "General", title: i18next.t("vizlib:General"), component: GeneralSettings },
  { key: "Appearance", title: i18next.t("vizlib:Appearance"), component: AppearanceSettings },
]);
