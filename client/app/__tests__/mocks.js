import MockDate from "mockdate";

const date = new Date("2000-01-01T02:00:00.000");

MockDate.set(date);

jest.mock("i18next", () => ({
  t: key => {
    const translations = {
      second_plural: "seconds",
      minute_plural: "minutes",
      hour_plural: "hours",
      day_plural: "days",
      week_plural: "weeks",
      millisecond_plural: "milliseconds",
    };
    return (
      translations[key] ||
      key
        .split(":")
        .pop()
        .trim()
    );
  },
  changeLanguage: jest.fn(),
  language: "en",
}));
