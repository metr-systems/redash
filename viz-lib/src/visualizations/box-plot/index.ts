import Renderer from "./Renderer";
import Editor from "./Editor";

import i18next from "i18next";

export default {
  type: "BOXPLOT",
  name: i18next.t("viz-lib:Boxplot (Deprecated)"),
  isDeprecated: true,
  getOptions: (options: any) => ({
    ...options,
  }),
  Renderer,
  Editor,

  defaultRows: 8,
  minRows: 5,
};
