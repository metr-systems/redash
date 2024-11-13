import { axios } from "@/services/axios";
import notification from "@/services/notification";

export default {
  get: () => axios.get("api/settings/organization"),
  save: (data, message = i18next.t("Settings:Settings changes saved.")) =>
    axios
      .post("api/settings/organization", data)
      .then(data => {
        notification.success(message);
        return data;
      })
      .catch(() => {
        notification.error(i18next.t("Failed saving changes."));
      }),
};
