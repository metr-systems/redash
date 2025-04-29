import MockDate from "mockdate";

const date = new Date("2000-01-01T02:00:00.000");

MockDate.set(date);

jest.mock("i18next", () => ({
  t: (key) => {
    const translations = {
      "reserved:second_plural": "seconds",
      "reserved:minute_plural": "minutes",
      "reserved:hour_plural": "hours",
      "reserved:day_plural": "days",
      "reserved:week_plural": "weeks",
      "reserved:millisecond_plural": "milliseconds",
    };
    return translations[key] || key.split(":").pop().trim();
  },
  changeLanguage: jest.fn(),
  language: "en",
}));
