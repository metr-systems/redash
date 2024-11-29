import MockDate from "mockdate";

const date = new Date("2000-01-01T02:00:00.000");

MockDate.set(date);

jest.mock("i18next", () => ({
  t: key =>
    key
      .split(":")
      .pop()
      .trim(),
  changeLanguage: jest.fn(),
}));
