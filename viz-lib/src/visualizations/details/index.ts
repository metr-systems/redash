import DetailsRenderer from "./DetailsRenderer";
import i18next from "i18next";

const DEFAULT_OPTIONS = {};

export default {
  type: "DETAILS",
  name: i18next.t("vizlib:Details View"),
  getOptions: (options: any) => ({
    ...DEFAULT_OPTIONS,
    ...options,
  }),
  Renderer: DetailsRenderer,
  defaultColumns: 4,
  defaultRows: 2,
};
