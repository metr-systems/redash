import { useCallback } from "react";
import useUpdateQuery from "./useUpdateQuery";

import recordEvent from "@/services/recordEvent";

export default function useUpdateQueryIdentifier(query, onChange) {
  const updateQuery = useUpdateQuery(query, onChange);

  return useCallback(
    (query_identifier) => {
      recordEvent("edit_query_identifier", "query", query.id);
      updateQuery({ query_identifier });
    },
    [query.id, updateQuery]
  );
}
