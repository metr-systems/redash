import { merge } from "lodash";

import Renderer from "./Renderer";
import Editor from "./Editor";

import i18next from "i18next";

const DEFAULT_OPTIONS = {
  controls: {
    enabled: false, // `false` means "show controls" o_O
  },
  rendererOptions: {
    table: {
      colTotals: true,
      rowTotals: true,
    },
  },
};

export default {
  type: "PIVOT",
  name: i18next.t("vizlib:Pivot Table"),
  getOptions: (options: any) => merge({}, DEFAULT_OPTIONS, options),
  Renderer,
  Editor,

  defaultRows: 10,
  defaultColumns: 3,
  minColumns: 2,
};
