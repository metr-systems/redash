module.exports = {
  locales: ["en", "de"], // Languages you want to support
  output: "client/app/i18n/locales/$LOCALE/$NAMESPACE.json",
  input: ["./client/app/**/*.{js,jsx,ts,tsx}"],
  defaultNamespace: "translation",
  keySeparator: false,
  nsSeparator: false,
  useKeysAsDefaultValue: true
};
