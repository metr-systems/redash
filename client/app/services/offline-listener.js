import notification from "@/services/notification";

import i18next from "i18next";

function addOnlineListener(notificationKey) {
  function onlineStateHandler() {
    notification.close(notificationKey);
    window.removeEventListener("online", onlineStateHandler);
  }
  window.addEventListener("online", onlineStateHandler);
}

export default {
  init() {
    window.addEventListener("offline", () => {
      notification.warning(i18next.t("Please check your Internet connection."), null, {
        key: "connectionNotification",
        duration: null,
      });
      addOnlineListener("connectionNotification");
    });
  },
};
