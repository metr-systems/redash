import getOptions from "./getOptions";
import Renderer from "./Renderer";
import Editor from "./Editor";
import i18next from "i18next";

export default {
  type: "TABLE",
  name: i18next.t("viz-lib:Table"),
  getOptions,
  Renderer,
  Editor,

  autoHeight: true,
  defaultRows: 14,
  defaultColumns: 3,
  minColumns: 2,
};
