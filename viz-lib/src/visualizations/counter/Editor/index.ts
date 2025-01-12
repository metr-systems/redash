import createTabbedEditor from "@/components/visualizations/editor/createTabbedEditor";

import GeneralSettings from "./GeneralSettings";
import FormatSettings from "./FormatSettings";

import i18next from "i18next";

export default createTabbedEditor([
  { key: "General", title: i18next.t("viz-lib:General"), component: GeneralSettings },
  { key: "Format", title: i18next.t("viz-lib:Format"), component: FormatSettings },
]);
