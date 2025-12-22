module.exports = {
  locales: ["en", "de"], // Languages you want to support
  output: "client/app/i18n/locales/$LOCALE/$NAMESPACE.json", // Where extracted files will be stored
  input: [
    "./client/app/**/*.{js,jsx,tsx}",
    "./viz-lib/src/**/*.{js,jsx,tsx,ts}",
  ], // Files to parse (can be changed)
  defaultNamespace: "common", // Default namespace
  keySeparator: ":", // Set to false if keys in code are dot-separated
  nsSeparator: false, // Set to false if namespaces in code are dot-separated
  useKeysAsDefaultValue: true, // Set to true if keys should be default values
  keepRemoved: [/\breserved\w*\b/],
};
