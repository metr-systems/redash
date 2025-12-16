import { map } from "lodash";

describe("Widget parameter mapping - FixedFromUrl", () => {
  beforeEach(() => {
    jest.resetModules();
    jest.mock("plotly.js", () => ({
    __esModule: true,
    // Provide common functions in case something calls them during imports
    newPlot: jest.fn(),
    react: jest.fn(),
    purge: jest.fn(),
    Plots: { resize: jest.fn() },
    }));
    // Prevent importing the untranspiled viz-lib package during tests
    jest.mock("@redash/viz/lib", () => ({ registeredVisualizations: {} }));
  });



  test("reads dashboard-level p_<mapTo> over widget-scoped p_w<ID>_<mapTo>", () => {
    // Ensure window.location.search is set before importing widget module
    // so the module-level URLSearchParams helper picks it up.
    delete window.location;
    window.location = new URL("http://localhost/?p_foo=bar&p_w123_foo=baz");

    const Widget = require("@/services/widget").default;

    const widgetData = {
      id: 123,
      visualization: {
        query: {
          query: "select {{foo}}",
          options: { parameters: [{ title: "Foo", name: "foo", type: "text", value: null }] },
        },
      },
      options: {
        parameterMappings: {
          foo: { name: "foo", type: "fixed-from-url", mapTo: "foo", value: null, title: "" },
        },
        paramOrder: [],
      },
    };

    const widget = new Widget(widgetData);

    // This forces widget to read and apply URL params to parameter locals
    const localParams = widget.getParametersDefs();
    expect(localParams.length).toBeGreaterThan(0);

    // Check the underlying query parameter was updated
    const queryParams = widget.getQuery().getParameters().get();
    const p = queryParams.find((x) => x.name === "foo");
    expect(p.getExecutionValue()).toBe("bar");
  });

  test("ignores widget-scoped params when dashboard-level is missing (yields null)", () => {
    jest.resetModules();
    delete window.location;
    window.location = new URL("http://localhost/?p_w123_foo=baz");

    const Widget = require("@/services/widget").default;

    const widgetData = {
      id: 123,
      visualization: {
        query: {
          query: "select {{foo}}",
          options: { parameters: [{ title: "Foo", name: "foo", type: "text", value: null }] },
        },
      },
      options: {
        parameterMappings: {
          foo: { name: "foo", type: "fixed-from-url", mapTo: "foo", value: null, title: "" },
        },
        paramOrder: [],
      },
    };

    const widget = new Widget(widgetData);
    const localParams = widget.getParametersDefs();
    expect(localParams.length).toBeGreaterThan(0);

    const queryParams = widget.getQuery().getParameters().get();
    const p = queryParams.find((x) => x.name === "foo");
    expect(p.getExecutionValue()).toBeNull();
  });
});
