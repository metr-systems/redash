import getOptions from "./getOptions";
import Renderer from "./Renderer";
import Editor from "./Editor";

import i18next from "i18next";

export default {
  type: "CHOROPLETH",
  name: i18next.t("Map (Choropleth)"),
  getOptions,
  Renderer,
  Editor,

  defaultColumns: 3,
  defaultRows: 8,
  minColumns: 2,
};
