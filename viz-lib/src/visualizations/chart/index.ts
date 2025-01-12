import getOptions from "./getOptions";
import Renderer from "./Renderer";
import Editor from "./Editor";

import i18next from "i18next";

export default {
  type: "CHART",
  name: i18next.t("viz-lib:Chart"),
  isDefault: true,
  getOptions,
  Renderer,
  Editor,

  defaultColumns: 3,
  defaultRows: 8,
  minColumns: 1,
  minRows: 5,
};
