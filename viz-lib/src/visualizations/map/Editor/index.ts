import createTabbedEditor from "@/components/visualizations/editor/createTabbedEditor";

import GeneralSettings from "./GeneralSettings";
import GroupsSettings from "./GroupsSettings";
import FormatSettings from "./FormatSettings";
import StyleSettings from "./StyleSettings";

import i18next from "i18next";

export default createTabbedEditor([
  { key: "General", title: i18next.t("viz-lib:General"), component: GeneralSettings },
  { key: "Groups", title: i18next.t("viz-lib:Groups"), component: GroupsSettings },
  { key: "Format", title: i18next.t("viz-lib:Format"), component: FormatSettings },
  { key: "Style", title: i18next.t("viz-lib:Style"), component: StyleSettings },
]);
