import Renderer from "./Renderer";
import Editor from "./Editor";

import i18next from "i18next";

export default {
  type: "SUNBURST_SEQUENCE",
  name: i18next.t("vizlib:Sunburst Sequence"),
  getOptions: (options: any) => ({
    ...options,
  }),
  Renderer,
  Editor,

  defaultRows: 7,
};
