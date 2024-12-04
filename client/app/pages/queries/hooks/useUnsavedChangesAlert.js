import { useRef, useEffect } from "react";

import { useTranslation } from "react-i18next";

import location from "@/services/location";

export default function useUnsavedChangesAlert(shouldShowAlert = false) {
  const { t } = useTranslation("Queries");
  const shouldShowAlertRef = useRef();
  shouldShowAlertRef.current = shouldShowAlert;

  useEffect(() => {
    const unloadMessage = t("You will lose your changes if you leave");
    const confirmMessage = t("{{unloadMessage}}\n\nAre you sure you want to leave this page?", {
      unloadMessage: unloadMessage,
    });
    // store original handler (if any)
    const savedOnBeforeUnload = window.onbeforeunload;

    window.onbeforeunload = function onbeforeunload() {
      return shouldShowAlertRef.current ? unloadMessage : undefined;
    };

    const unsubscribe = location.confirmChange((nextLocation, currentLocation) => {
      if (shouldShowAlertRef.current && nextLocation.path !== currentLocation.path) {
        return confirmMessage;
      }
    });

    return () => {
      window.onbeforeunload = savedOnBeforeUnload;
      unsubscribe();
    };
  }, []);
}
