import location from "@/services/location";

export function formatFixedValue(v) {
  if (v == null || v === "") return "(missing)";
  return String(v);
}

export function shouldDisplayButton(hasFixedParameters) {
  const params = location.search || {};
  return hasFixedParameters && !!params.back;
}
