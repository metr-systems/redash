import getOptions from "./getOptions";
import Renderer from "./Renderer";
import Editor from "./Editor";

import i18next from "i18next";

export default {
  type: "COHORT",
  name: i18next.t("vizlib:Cohort"),
  getOptions,
  Renderer,
  Editor,

  autoHeight: true,
  defaultRows: 8,
};
