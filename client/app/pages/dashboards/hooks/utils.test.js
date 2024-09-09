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
      controller12345: "['firstTag','secondTag']",
      "4d678ac-cdbc-49c4-ba0f-c8800bce5e8c": "['thirdTag']",
    };
    let dashboardAllWidgets = [
      { id: 1, query: { tags: ["firstTag"] }, visualization: {} },
      { id: 2, query: { tags: ["secondTag"] }, visualization: {} },
      { id: 3, query: { tags: ["thirdTag"] }, visualization: {} },
    ];

    let result = getAllowedWidgetsForCurrentParam(dashboardParameters, dashboardAllowedWidgets, dashboardAllWidgets);
    expect([
      { id: 1, query: { tags: ["firstTag"] }, visualization: {} },
      { id: 2, query: { tags: ["secondTag"] }, visualization: {} },
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
        value: "building kreuzberg 1234",
      },
      {
        name: "zone_uuid_param",
        value: "zone12ce1e7d-51b5-40b7-bcb8-358cb84da400",
      },
    ];
    let dashboardAllowedWidgets = {
      "building kreuzberg 1234": "['firstTag','secondTag']",
      "zone12ce1e7d-51b5-40b7-bcb8-358cb84da400": "['thirdTag']",
    };
    let dashboardAllWidgets = [
      { id: 1, query: { tags: ["firstTag"] }, visualization: {} },
      { id: 2, query: { tags: ["secondTag"] }, visualization: {} },
      { id: 3, query: { tags: ["thirdTag"] }, visualization: {} },
    ];

    let result = getAllowedWidgetsForCurrentParam(dashboardParameters, dashboardAllowedWidgets, dashboardAllWidgets);
    expect([
      { id: 1, query: { tags: ["firstTag"] }, visualization: {} },
      { id: 2, query: { tags: ["secondTag"] }, visualization: {} },
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
        query: { tags: ["firstTag"] },
        visualization: {},
      },
      {
        id: 2,
        query: { tags: ["secondTag"] },
        visualization: {},
      },
      {
        id: 3,
        query: { tags: ["thirdTag"] },
        visualization: {},
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
      controller12345: "['firstTag','someNameTag']",
    };
    let dashboardAllWidgets = [
      { id: 1, query: { tags: ["someNameTag"] }, visualization: {} },
      {
        id: 2,
        query: { tags: ["someOtherNameTag"] },
        visualization: {},
      },
    ];

    let result = getAllowedWidgetsForCurrentParam(dashboardParameters, dashboardAllowedWidgets, dashboardAllWidgets);
    expect([{ id: 1, query: { tags: ["someNameTag"] }, visualization: {} }]).toStrictEqual(result);
  });
  test("always show textboxes widgets", () => {
    let dashboardParameters = [
      {
        name: "controller_param",
        value: "controller12345",
      },
    ];
    let dashboardAllowedWidgets = {
      controller12345: "['firstTag','someNameTag']",
    };
    let dashboardAllWidgets = [
      { id: 1, query: { tags: ["someNameTag"] }, visualization: {} },
      {
        id: 2,
        query: { tags: ["someOtherNameTag"] },
        visualization: {},
      },
      {
        id: 3, // textbox widget since it does not have a visualization
      },
    ];

    let result = getAllowedWidgetsForCurrentParam(dashboardParameters, dashboardAllowedWidgets, dashboardAllWidgets);
    expect([{ id: 1, query: { tags: ["someNameTag"] }, visualization: {} }, { id: 3 }]).toStrictEqual(result);
  });
  test("support compount tag", () => {
    let dashboardAllowedWidgets = {
      controller1: "['group1,group2']",
      controller2: "['group1']",
      controller3: "['group2']",
    };
    let dashboardAllWidgets = [
      { id: 1, query: { tags: ["group1;group2"] }, visualization: {} },
      {
        id: 2,
        query: { tags: ["someOtherNameTag"] },
        visualization: {},
      },
    ];

    // test for "group1"
    let dashboardParameters2 = [
      {
        name: "controller_param",
        value: "controller2",
      },
    ];
    let result2 = getAllowedWidgetsForCurrentParam(dashboardParameters2, dashboardAllowedWidgets, dashboardAllWidgets);
    expect([{ id: 1, query: { tags: ["group1;group2"] }, visualization: {} }]).toStrictEqual(result2);
  });
});
