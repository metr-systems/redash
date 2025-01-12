import getOptions from "./getOptions";
import Renderer from "./Renderer";
import Editor from "./Editor";

import i18next from "i18next";

export default {
  type: "FUNNEL",
  name: i18next.t("viz-lib:Funnel"),
  getOptions,
  Renderer,
  Editor,

  defaultRows: 10,
};
