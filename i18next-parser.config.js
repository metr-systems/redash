module.exports = {
  locales: ["en", "de"], // Languages you want to support
  output: "client/app/i18n/locales/$NAMESPACE.json", // Where extracted files will be stored
  input: ["./client/app/**/*.jsx"], // Files to parse (can be changed)
  defaultNamespace: "de", // Default namespace
  keySeparator: false, // Set to false if keys in code are dot-separated
  nsSeparator: false, // Set to false if namespaces in code are dot-separated
  defaultValue: "", // Default text to insert as translation
  useKeysAsDefaultValue: false, // Set to true if keys should be default values
  verbose: true // Output details to the console
};
