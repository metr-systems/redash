import Renderer from "./Renderer";
import Editor from "./Editor";
import i18next from "i18next";

const DEFAULT_OPTIONS = {
  counterLabel: "",
  counterColName: "counter",
  rowNumber: 1,
  targetRowNumber: 1,
  stringDecimal: 0,
  stringDecChar: ".",
  stringThouSep: ",",
  tooltipFormat: "0,0.000", // TODO: Show in editor
};

export default {
  type: "COUNTER",
  name: i18next.t("vizlib:Counter"),
  getOptions: (options: any) => ({
    ...DEFAULT_OPTIONS,
    ...options,
  }),
  Renderer,
  Editor,

  defaultColumns: 4,
  defaultRows: 5,
};
