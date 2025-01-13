import { merge } from "lodash";

import Renderer from "./Renderer";
import Editor from "./Editor";

import i18next from "i18next";

const DEFAULT_OPTIONS = {
  column: "",
  frequenciesColumn: "",
  wordLengthLimit: { min: null, max: null },
  wordCountLimit: { min: null, max: null },
};

export default {
  type: "WORD_CLOUD",
  name: i18next.t("viz-lib:Word Cloud"),
  getOptions: (options: any) => merge({}, DEFAULT_OPTIONS, options),
  Renderer,
  Editor,

  defaultRows: 8,
};
