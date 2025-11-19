import getOptions from "./getOptions";
import Renderer from "./Renderer";
import Editor from "./Editor";

import i18next from "i18next";

export default {
  type: "CHOROPLETH",
  name: i18next.t("vizlib:Map (Choropleth)"),
  getOptions,
  Renderer,
  Editor,

  defaultColumns: 6,
  defaultRows: 8,
  minColumns: 2,
};
