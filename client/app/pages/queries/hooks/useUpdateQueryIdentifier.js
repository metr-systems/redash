import { useCallback } from "react";
import useUpdateQuery from "./useUpdateQuery";

import { axios } from "@/services/axios";
import notification from "@/services/notification";
import recordEvent from "@/services/recordEvent";

export default function useUpdateQueryIdentifier(query, onChange) {
  const updateQuery = useUpdateQuery(query, onChange);

  return useCallback(
    async (query_identifier) => {
      recordEvent("edit_query_identifier", "query", query.id);

      // skip validation if empty value
      if (query_identifier) {
        try {
          const response = await axios.post(`api/queries/${query.id}/query_identifier/validate`, { query_identifier });
          if (!response.valid) {
            if (response.errors) {
              response.errors.forEach((error) => notification.error(error));
            }
            return;
          }
        } catch (error) {
          notification.error("Failed to validate query identifier");
          return;
        }
      }

      updateQuery({ query_identifier });
    },
    [query.id, updateQuery]
  );
}
