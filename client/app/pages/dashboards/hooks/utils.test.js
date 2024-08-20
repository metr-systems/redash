import { getAllowedWidgetsForCurrentParam } from "@/pages/dashboards/hooks/utils";
describe("filterWidgets", () => {
  test("filter only for allowed widgets per main parameter value", () => {
    let dashboardParameters = [
      {
        name: "controller_param",
        value: "controller12345",
      },
    ];
    let dashboardAllowedWidgets = {
      controller12345: ["firstViz", "secondViz"],
      "4d678ac-cdbc-49c4-ba0f-c8800bce5e8c": ["thirdViz"],
    };
    let dashboardAllWidgets = [
      { id: 1, visualization: { name: "firstViz" } },
      { id: 2, visualization: { name: "secondViz" } },
      { id: 3, visualization: { name: "thirdViz" } },
    ];

    let result = getAllowedWidgetsForCurrentParam(dashboardParameters, dashboardAllowedWidgets, dashboardAllWidgets);
    expect([
      { id: 1, visualization: { name: "firstViz" } },
      { id: 2, visualization: { name: "secondViz" } },
    ]).toStrictEqual(result);
  });
  test("filter correctly in case of many parameters", () => {
    let dashboardParameters = [
      {
        name: "controller_param",
        value: "controller12345",
      },
      {
        name: "building_address_param", // order of params is important in this test
        title: "Building address param",
        type: "text",
        urlPrefix: "p_",
        value: "building kreuzberg 1234",
      },
      {
        name: "zone_uuid_param",
        title: "Zone UUID param",
        type: "text",
        urlPrefix: "p_",
        value: "zone12ce1e7d-51b5-40b7-bcb8-358cb84da400",
      },
    ];
    let dashboardAllowedWidgets = {
      "building kreuzberg 1234": ["firstViz", "secondViz"],
      "zone12ce1e7d-51b5-40b7-bcb8-358cb84da400": ["thirdViz"],
    };
    let dashboardAllWidgets = [
      { id: 1, visualization: { name: "firstViz" } },
      { id: 2, visualization: { name: "secondViz" } },
      { id: 3, visualization: { name: "thirdViz" } },
    ];

    let result = getAllowedWidgetsForCurrentParam(dashboardParameters, dashboardAllowedWidgets, dashboardAllWidgets);
    expect([
      { id: 1, visualization: { name: "firstViz" } },
      { id: 2, visualization: { name: "secondViz" } },
    ]).toStrictEqual(result);
  });
  test("return all widgets if allowed_widgets is undefined", () => {
    let dashboardParameters = [
      {
        name: "controller_param",
        value: "controller12345",
      },
    ];
    let dashboardAllowedWidgets = undefined;
    let dashboardAllWidgets = [
      {
        id: 1,
        visualization: { name: "firstViz" },
      },
      {
        id: 2,
        visualization: { name: "secondViz" },
      },
      {
        id: 3,
        visualization: { name: "thirdViz" },
      },
    ];

    let result = getAllowedWidgetsForCurrentParam(dashboardParameters, dashboardAllowedWidgets, dashboardAllWidgets);
    expect(dashboardAllWidgets).toStrictEqual(result);
  });
  test("not found widget is just not returned", () => {
    let dashboardParameters = [
      {
        name: "controller_param",
        value: "controller12345",
      },
    ];
    let dashboardAllowedWidgets = {
      controller12345: ["firstViz", "someNameViz"],
    };
    let dashboardAllWidgets = [
      { id: 1, visualization: { name: "someNameViz" } },
      {
        id: 2,
        visualization: { name: "someOtherNameViz" },
      },
    ];

    let result = getAllowedWidgetsForCurrentParam(dashboardParameters, dashboardAllowedWidgets, dashboardAllWidgets);
    expect([{ id: 1, visualization: { name: "someNameViz" } }]).toStrictEqual(result);
  });
});
