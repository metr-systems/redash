import { keepLayoutsOrder } from "./utils";

// Assumptions for now:
// titles (textboxes) are always on left

describe("keepLayoutsOrder", () => {
  it("widget moves to left when there is space", () => {
    /** 
        full layout looks like this:
        ------------- -------------
        |           | |           |
        | vis1      | |  vis2     |
        ------------- -------------
        ------------- -------------
        |           | |           |
        | vis3      | |  vis4     |
        ------------- -------------

        layout with hidden widget 3 look like this:

        ------------- -------------
        |           | |           |
        | vis1      | |  vis2     |
        ------------- -------------
        -------------
        |           | 
        | vis4      | 
        ------------- 
        */
    const orderedLayoutsIds = [1, 2, 3, 4];
    const layouts = [
      { w: 3, h: 4, x: 0, y: 0, i: "1" },
      { w: 3, h: 4, x: 3, y: 0, i: "2" },
      // hidden { w: 3, h: 4, x: 0, y: 4, i: "3" },
      { w: 3, h: 4, x: 3, y: 4, i: "4" },
    ];
    const widgets = [
      { id: 1, visualization: {} },
      { id: 2, visualization: {} },
      //{ id: 3, visualization: {} },
      { id: 4, visualization: {} },
    ];
    const result = keepLayoutsOrder(orderedLayoutsIds, layouts, widgets);
    expect(result).toEqual([
      { w: 3, h: 4, x: 0, y: 0, i: "1" },
      { w: 3, h: 4, x: 3, y: 0, i: "2" },
      { w: 3, h: 4, x: 0, y: 4, i: "4" },
    ]);
  });
  it("widget moves up when there is space", () => {
    /** 
        full layout looks like this:
        ------------- -------------
        |           | |           |
        | vis1      | |  vis2     |
        ------------- -------------
        ------------- -------------
        |           | |           |
        | vis3      | |  vis4     |
        ------------- -------------

        layout with hidden widget 1 and 2 look like this:

        ------------- -------------
        |           | |           |
        | vis3      | |  vis4     |
        ------------- -------------
        */
    const orderedLayoutsIds = [1, 2, 3, 4];
    const layouts = [
      // hidden { w: 3, h: 4, x: 0, y: 0, i: "1" },
      // hidden { w: 3, h: 4, x: 3, y: 0, i: "2" },
      { w: 3, h: 4, x: 0, y: 4, i: "3" },
      { w: 3, h: 4, x: 3, y: 4, i: "4" },
    ];
    const widgets = [
      // hidden { id: 1, visualization: {} },
      // hidden { id: 2, visualization: {} },
      { id: 3, visualization: {} },
      { id: 4, visualization: {} },
    ];
    const result = keepLayoutsOrder(orderedLayoutsIds, layouts, widgets);
    expect(result).toEqual([
      { w: 3, h: 4, x: 0, y: 0, i: "3" },
      { w: 3, h: 4, x: 3, y: 0, i: "4" },
    ]);
  });
  it("widget moves up and from left to right when there is space", () => {
    /** 
        full layout looks like this:
        ------------- 
        |           | 
        | vis1      | 
        ------------- 
        ------------- -------------
        |           | |           |
        | vis3      | |  vis4     |
        ------------- -------------

        layout with hidden widget 2 look like this:

        ------------- -------------
        |           | |           |
        | vis1      | |  vis3     |
        ------------- -------------
        ------------- 
        |           | 
        | vis4      | 
        ------------- 
        */
    const orderedLayoutsIds = [1, 2, 3, 4];
    const layouts = [
      { w: 3, h: 4, x: 0, y: 0, i: "1" },
      // hidden { w: 3, h: 4, x: 3, y: 0, i: "2" },
      { w: 3, h: 4, x: 0, y: 4, i: "3" },
      { w: 3, h: 4, x: 3, y: 4, i: "4" },
    ];
    const widgets = [
      { id: 1, visualization: {} },
      // hidden { id: 2, visualization: {} },
      { id: 3, visualization: {} },
      { id: 4, visualization: {} },
    ];
    const result = keepLayoutsOrder(orderedLayoutsIds, layouts, widgets);
    expect(result).toEqual([
      { w: 3, h: 4, x: 0, y: 0, i: "1" },
      { w: 3, h: 4, x: 3, y: 0, i: "3" },
      { w: 3, h: 4, x: 0, y: 4, i: "4" },
    ]);
  });
  it("widgets with visualization stay in new line after a textbox", () => {
    /** 
        full layout looks like this:
        -------------
        | textbox   |
        -------------
        ------------- -------------
        |           | |           |
        | vis1      | |  vis2     |
        ------------- -------------

        layout after being processed look like this:

        -------------
        | textbox   |
        -------------
        ------------- -------------
        |           | |           |
        | vis1      | |  vis2     |
        ------------- -------------
        translation of position :
        y: the line
        x: the column
        h: the height
        w: the width
        */

    const orderedLayoutsIds = [1, 2, 3];
    const layouts = [
      { w: 6, h: 2, x: 0, y: 0, i: "1" },
      { w: 3, h: 4, x: 0, y: 2, i: "2" },
      { w: 3, h: 4, x: 3, y: 2, i: "3" },
    ];
    const widgets = [{ id: 1 }, { id: 2, visualization: {} }, { id: 3, visualization: {} }];
    const result = keepLayoutsOrder(orderedLayoutsIds, layouts, widgets);
    expect(result).toEqual([
      { w: 6, h: 2, x: 0, y: 0, i: "1" },
      { w: 3, h: 4, x: 0, y: 2, i: "2" },
      { w: 3, h: 4, x: 3, y: 2, i: "3" },
    ]);
  });
  it("textbox also stay in new line after a textbox", () => {
    /** 
        full layout looks like this:
        -------------
        | textbox1  |
        -------------
        -------------
        | textbox2  |
        -------------

        layout after being processed look like this:

        -------------
        | textbox1  |
        -------------
        -------------
        | textbox2  |
        -------------
        translation of position :
        y: the line
        x: the column
        h: the height
        w: the width
        */

    const orderedLayoutsIds = [1, 2, 3];
    const layouts = [
      { w: 3, h: 2, x: 0, y: 0, i: "1" },
      { w: 3, h: 2, x: 0, y: 2, i: "2" },
    ];
    const widgets = [{ id: 1 }, { id: 2 }];
    const result = keepLayoutsOrder(orderedLayoutsIds, layouts, widgets);
    expect(result).toEqual([
      { w: 3, h: 2, x: 0, y: 0, i: "1" },
      { w: 3, h: 2, x: 0, y: 2, i: "2" },
    ]);
  });
  it("constraint that widgets are on the left", () => {
    /** 
        full layout looks like this:
                -------------
                | textbox1  |
                -------------
                -------------
                | textbox2  |
                -------------

        layout after being processed look like this:

        -------------
        | textbox1  |
        -------------
        -------------
        | textbox2  |
        -------------
        */

    const orderedLayoutsIds = [1, 2, 3];
    const layouts = [
      { w: 3, h: 2, x: 3, y: 0, i: "1" },
      { w: 3, h: 2, x: 3, y: 2, i: "2" },
    ];
    const widgets = [{ id: 1 }, { id: 2 }];
    const result = keepLayoutsOrder(orderedLayoutsIds, layouts, widgets);
    expect(result).toEqual([
      { w: 3, h: 2, x: 0, y: 0, i: "1" },
      { w: 3, h: 2, x: 0, y: 2, i: "2" },
    ]);
  });
  it("hidden middle line moves widgets up", () => {
    /** 
        full layout looks like this:
        ------------- -------------
        |           | |           |
        | vis1      | |  vis2     |
        ------------- -------------
        ------------- -------------
        |           | |           |
        | vis3      | |  vis4     |
        ------------- -------------
        ------------- -------------
        |           | |           |
        | vis5      | |  vis6     |
        ------------- -------------

        layout with hidden widget 3 and 4 look like this:
        ------------- -------------
        |           | |           |
        | vis1      | |  vis2     |
        ------------- -------------
        ------------- -------------
        |           | |           |
        | vis5      | |  vis6     |
        ------------- -------------
        */

    const orderedLayoutsIds = [1, 2, 3, 4, 5, 6];
    const layouts = [
      { w: 3, h: 4, x: 0, y: 0, i: "1" },
      { w: 3, h: 4, x: 3, y: 0, i: "2" },
      // hidden { w: 3, h: 4, x: 0, y: 4, i: "3" },
      // hidden { w: 3, h: 4, x: 3, y: 4, i: "4" },
      { w: 3, h: 4, x: 0, y: 8, i: "5" },
      { w: 3, h: 4, x: 3, y: 8, i: "6" },
    ];
    const widgets = [
      { id: 1, visualization: {} },
      { id: 2, visualization: {} },
      // hidden { id: 3, visualization: {} },
      // hidden { id: 4, visualization: {} },
      { id: 5, visualization: {} },
      { id: 6, visualization: {} },
    ];
    const result = keepLayoutsOrder(orderedLayoutsIds, layouts, widgets);
    expect(result).toEqual([
      { w: 3, h: 4, x: 0, y: 0, i: "1" },
      { w: 3, h: 4, x: 3, y: 0, i: "2" },
      { w: 3, h: 4, x: 0, y: 4, i: "5" },
      { w: 3, h: 4, x: 3, y: 4, i: "6" },
    ]);
  });
  it("hidden corner widgets moves widgets up and from left to right", () => {
    /** 
        full layout looks like this:
        ------------- -------------
        |           | |           |
        | vis1      | |  vis2     |
        ------------- -------------
        ------------- -------------
        |           | |           |
        | vis3      | |  vis4     |
        ------------- -------------
        ------------- -------------
        |           | |           |
        | vis5      | |  vis6     |
        ------------- -------------

        layout with hidden widget 2 and 3 look like this:
        ------------- -------------
        |           | |           |
        | vis1      | |  vis4     |
        ------------- -------------
        ------------- -------------
        |           | |           |
        | vis5      | |  vis6     |
        ------------- -------------
        */

    const orderedLayoutsIds = [1, 2, 3, 4, 5, 6];
    const layouts = [
      { w: 3, h: 4, x: 0, y: 0, i: "1" },
      // hidden { w: 3, h: 4, x: 3, y: 0, i: "2" },
      // hidden { w: 3, h: 4, x: 0, y: 4, i: "3" },
      { w: 3, h: 4, x: 3, y: 4, i: "4" },
      { w: 3, h: 4, x: 0, y: 8, i: "5" },
      { w: 3, h: 4, x: 3, y: 8, i: "6" },
    ];
    const widgets = [
      { id: 1, visualization: {} },
      // hidden { id: 2, visualization: {} },
      // hidden { id: 3, visualization: {} },
      { id: 4, visualization: {} },
      { id: 5, visualization: {} },
      { id: 6, visualization: {} },
    ];
    const result = keepLayoutsOrder(orderedLayoutsIds, layouts, widgets);
    expect(result).toEqual([
      { w: 3, h: 4, x: 0, y: 0, i: "1" },
      { w: 3, h: 4, x: 3, y: 0, i: "4" },
      { w: 3, h: 4, x: 0, y: 4, i: "5" },
      { w: 3, h: 4, x: 3, y: 4, i: "6" },
    ]);
  });
  it("hidden corner widgets moves widgets up and from left to right, second senario", () => {
    /** 
        full layout looks like this:
        ------------- -------------
        |           | |           |
        | vis1      | |  vis2     |
        ------------- -------------
        ------------- -------------
        |           | |           |
        | vis3      | |  vis4     |
        ------------- -------------
        ------------- -------------
        |           | |           |
        | vis5      | |  vis6     |
        ------------- -------------

        layout with hidden widget 3 and 5 look like this:
        ------------- -------------
        |           | |           |
        | vis1      | |  vis2     |
        ------------- -------------
        ------------- -------------
        |           | |           |
        | vis4      | |  vis6     |
        ------------- -------------
        */

    const orderedLayoutsIds = [1, 2, 3, 4, 5, 6];
    const layouts = [
      { w: 3, h: 4, x: 0, y: 0, i: "1" },
      { w: 3, h: 4, x: 3, y: 0, i: "2" },
      // hidden { w: 3, h: 4, x: 0, y: 4, i: "3" },
      { w: 3, h: 4, x: 3, y: 4, i: "4" },
      // hidden { w: 3, h: 4, x: 0, y: 8, i: "5" },
      { w: 3, h: 4, x: 3, y: 8, i: "6" },
    ];
    const widgets = [
      { id: 1, visualization: {} },
      { id: 2, visualization: {} },
      // hidden { id: 3, visualization: {} },
      { id: 4, visualization: {} },
      // hidden { id: 5, visualization: {} },
      { id: 6, visualization: {} },
    ];
    const result = keepLayoutsOrder(orderedLayoutsIds, layouts, widgets);
    expect(result).toEqual([
      { w: 3, h: 4, x: 0, y: 0, i: "1" },
      { w: 3, h: 4, x: 3, y: 0, i: "2" },
      { w: 3, h: 4, x: 0, y: 4, i: "4" },
      { w: 3, h: 4, x: 3, y: 4, i: "6" },
    ]);
  });
  it("mixed widgets and textboxed case", () => {
    /** 
        full layout looks like this:
        -------------
        | textbox1  |
        -------------
        ------------- -------------
        |           | |           |
        | vis1      | |  vis2     |
        ------------- -------------
        --------------------------
        | textbox2                |
        --------------------------
        ------------- -------------
        |           | |           |
        | vis3      | |  vis4     |
        ------------- -------------
        --------------------------
        | textbox3                |
        --------------------------
        ------------- -------------
        |           | |           |
        | vis5      | |  vis6     |
        ------------- -------------

        layout with hidden widget 3 and 4 look like this:
        -------------
        | textbox1  |
        -------------
        ------------- -------------
        |           | |           |
        | vis1      | |  vis2     |
        ------------- -------------
        --------------------------
        | textbox2                |
        --------------------------
        --------------------------
        | textbox3                |
        --------------------------
        ------------- -------------
        |           | |           |
        | vis5      | |  vis6     |
        ------------- -------------
        */

    const orderedLayoutsIds = [1, 2, 3, 4, 5, 6, 7, 8, 9];
    const layouts = [
      { w: 3, h: 2, x: 0, y: 0, i: "1" }, // textbox
      { w: 3, h: 4, x: 0, y: 2, i: "2" },
      { w: 3, h: 4, x: 3, y: 2, i: "3" },
      { w: 6, h: 2, x: 0, y: 6, i: "4" }, // textbox
      //hidden { w: 3, h: 4, x: 0, y: 8, i: "5" },
      //hidden { w: 3, h: 4, x: 3, y: 8, i: "6" },
      { w: 6, h: 2, x: 0, y: 12, i: "7" }, // textbox
      { w: 3, h: 4, x: 0, y: 14, i: "8" },
      { w: 3, h: 4, x: 3, y: 14, i: "9" },
    ];
    const widgets = [
      { id: 1 },
      { id: 2, visualization: {} },
      { id: 3, visualization: {} },
      { id: 4 },
      //hidden { id: 5, visualization: {} },
      //hidden { id: 6, visualization: {} },
      { id: 7 },
      { id: 8, visualization: {} },
      { id: 9, visualization: {} },
    ];
    const result = keepLayoutsOrder(orderedLayoutsIds, layouts, widgets);
    expect(result).toEqual([
      { w: 3, h: 2, x: 0, y: 0, i: "1" }, // textbox
      { w: 3, h: 4, x: 0, y: 2, i: "2" },
      { w: 3, h: 4, x: 3, y: 2, i: "3" },
      { w: 6, h: 2, x: 0, y: 6, i: "4" }, // textbox
      { w: 6, h: 2, x: 0, y: 8, i: "7" }, // textbox
      { w: 3, h: 4, x: 0, y: 10, i: "8" },
      { w: 3, h: 4, x: 3, y: 10, i: "9" },
    ]);
  });
  it("right widget with  different height is hidden", () => {
    /** 
        full layout looks like this:
        ------------- -------------
        |           | |           |
        | vis1      | |  vis2     |
        ------------- |           |
        ------------- |           |
        |           | |           |
        | vis3      | |           |
        ------------- -------------

        layout with hidden widget 2 look like this:

        ------------- -------------
        |           | |           |
        | vis1      | |  vis3     |
        ------------- -------------
        */
    const orderedLayoutsIds = [1, 2, 3];
    const layouts = [
      { w: 3, h: 4, x: 0, y: 0, i: "1" },
      // hidden { w: 3, h: 8, x: 3, y: 0, i: "2" },
      { w: 3, h: 4, x: 3, y: 4, i: "3" },
    ];
    const widgets = [
      { id: 1, visualization: {} },
      //{ id: 2, visualization: {} },
      { id: 3, visualization: {} },
    ];
    const result = keepLayoutsOrder(orderedLayoutsIds, layouts, widgets);
    expect(result).toEqual([
      { w: 3, h: 4, x: 0, y: 0, i: "1" },
      { w: 3, h: 4, x: 3, y: 0, i: "3" },
    ]);
  });
  it("left widget with  different height is hidden", () => {
    /** 
        full layout looks like this:
        ------------- -------------
        |           | |           |
        | vis1      | |  vis2     |
        |           | -------------
        |           | -------------
        |           | |           |
        |           | |  vis3     |
        ------------- -------------

        layout with hidden widget 1 look like this:

        ------------- -------------
        |           | |           |
        | vis2      | |  vis3     |
        ------------- -------------
        */
    const orderedLayoutsIds = [1, 2, 3];
    const layouts = [
      // hidden { w: 3, h: 8, x: 0, y: 0, i: "1" },
      { w: 3, h: 4, x: 3, y: 0, i: "2" },
      { w: 3, h: 4, x: 3, y: 4, i: "3" },
    ];
    const widgets = [
      //{ id: 1, visualization: {} },
      { id: 2, visualization: {} },
      { id: 3, visualization: {} },
    ];
    const result = keepLayoutsOrder(orderedLayoutsIds, layouts, widgets);
    expect(result).toEqual([
      { w: 3, h: 4, x: 0, y: 0, i: "2" },
      { w: 3, h: 4, x: 3, y: 0, i: "3" },
    ]);
  });
  it("widget next to right widget with  different height is hidden", () => {
    /** 
        full layout looks like this:
        ------------- -------------
        |           | |           |
        | vis1      | |  vis2     |
        ------------- |           |
        ------------- |           |
        |           | |           |
        | vis3      | |           |
        ------------- -------------

        layout with hidden widget 3 look like this:

        ------------- -------------
        |           | |           |
        | vis1      | |  vis2     |
        ------------- |           |
                      |           |
                      |           |
                      |           |
                      -------------
        */
    const orderedLayoutsIds = [1, 2, 3];
    const layouts = [
      { w: 3, h: 4, x: 0, y: 0, i: "1" },
      { w: 3, h: 8, x: 3, y: 0, i: "2" },
      // hidden { w: 3, h: 4, x: 3, y: 4, i: "3" },
    ];
    const widgets = [
      { id: 1, visualization: {} },
      { id: 2, visualization: {} },
      //{ id: 3, visualization: {} },
    ];
    const result = keepLayoutsOrder(orderedLayoutsIds, layouts, widgets);
    expect(result).toEqual([
      { w: 3, h: 4, x: 0, y: 0, i: "1" },
      { w: 3, h: 8, x: 3, y: 0, i: "2" },
    ]);
  });
  it("widget next to right widget with  different height is hidden, senario 2", () => {
    /** 
        full layout looks like this:
        ------------- -------------
        |           | |           |
        | vis1      | |  vis2     |
        ------------- |           |
        ------------- |           |
        |           | |           |
        | vis3      | |           |
        ------------- -------------
        ------------- -------------
        |           | |           |
        | vis4      | |  vis5     |
        ------------- -------------

        layout with hidden widget 3 look like this:

        ------------- -------------
        |           | |           |
        | vis1      | |  vis2     |
        ------------- |           |
                      |           |
                      |           |
                      |           |
                      -------------
        ------------- -------------
        |           | |           |
        | vis4      | |  vis5     |
        ------------- -------------
        */
    const orderedLayoutsIds = [1, 2, 3, 4, 5];
    const layouts = [
      {
        w: 3,
        h: 4,
        x: 0,
        y: 0,
        i: "1",
      },
      {
        w: 3,
        h: 8,
        x: 3,
        y: 0,
        i: "2",
      },
      // hidden { w: 3, h: 4, x: 3, y: 4, i: "3" },
      {
        w: 3,
        h: 4,
        x: 0,
        y: 10, // to confirm that it gets corrected to 8
        i: "4",
      },
      {
        w: 3,
        h: 4,
        x: 3,
        y: 10, // to confirm that it gets corrected to 8
        i: "5",
      },
    ];
    const widgets = [
      { id: 1, visualization: {} },
      { id: 2, visualization: {} },
      //{ id: 3, visualization: {} },
      { id: 4, visualization: {} },
      { id: 5, visualization: {} },
    ];
    const result = keepLayoutsOrder(orderedLayoutsIds, layouts, widgets);
    expect(result).toEqual([
      {
        w: 3,
        h: 4,
        x: 0,
        y: 0,
        i: "1",
      },
      {
        w: 3,
        h: 8,
        x: 3,
        y: 0,
        i: "2",
      },
      {
        w: 3,
        h: 4,
        x: 0,
        y: 8,
        i: "4",
      },
      {
        w: 3,
        h: 4,
        x: 3,
        y: 8,
        i: "5",
      },
    ]);
  });
  it("widget next to left widget with  different height is hidden", () => {
    /** 
        full layout looks like this:
        ------------- -------------
        |           | |           |
        | vis1      | |  vis2     |
        |           | -------------
        |           | -------------
        |           | |           |
        |           | |  vis3     |
        ------------- -------------

        layout with hidden widget 2 look like this:

        ------------- -------------
        |           | |           |
        | vis1      | |  vis3     |
        |           | -------------
        |           | 
        |           | 
        |           | 
        ------------- 
        */
    const orderedLayoutsIds = [1, 2, 3];
    const layouts = [
      { w: 3, h: 8, x: 0, y: 0, i: "1" },
      // hidden { w: 3, h: 4, x: 3, y: 0, i: "2" },
      { w: 3, h: 4, x: 3, y: 4, i: "3" },
    ];
    const widgets = [
      { id: 1, visualization: {} },
      //{ id: 2, visualization: {} },
      { id: 3, visualization: {} },
    ];
    const result = keepLayoutsOrder(orderedLayoutsIds, layouts, widgets);
    expect(result).toEqual([
      { w: 3, h: 8, x: 0, y: 0, i: "1" },
      { w: 3, h: 4, x: 3, y: 0, i: "3" },
    ]);
  });
  it("widget next to left widget with  different height is hidden, senario 2", () => {
    /** 
        full layout looks like this:
        ------------- -------------
        |           | |           |
        | vis1      | |  vis2     |
        |           | -------------
        |           | -------------
        |           | |           |
        |           | |  vis3     |
        ------------- -------------
        ------------- -------------
        |           | |           |
        | vis4      | |  vis5     |
        ------------- -------------
        layout with hidden widget 2 look like this:

        ------------- -------------
        |           | |           |
        | vis1      | |  vis3     |
        |           | -------------
        |           | 
        |           | 
        |           | 
        ------------- 
        ------------- -------------
        |           | |           |
        | vis4      | |  vis5     |
        ------------- -------------
        */
    const orderedLayoutsIds = [1, 2, 3, 4, 5];
    const layouts = [
      {
        w: 3,
        h: 8,
        x: 0,
        y: 0,
        i: "1",
      },
      // hidden { w: 3, h: 4, x: 3, y: 0, i: "2" },
      {
        w: 3,
        h: 4,
        x: 3,
        y: 4,
        i: "3",
      },
      {
        w: 3,
        h: 4,
        x: 0,
        y: 10, // to confirm that it gets corrected to 8
        i: "4",
      },
      {
        w: 3,
        h: 4,
        x: 3,
        y: 10, // to confirm that it gets corrected to 8
        i: "5",
      },
    ];
    const widgets = [
      { id: 1, visualization: {} },
      //{ id: 2, visualization: {} },
      { id: 3, visualization: {} },
      { id: 4, visualization: {} },
      { id: 5, visualization: {} },
    ];
    const result = keepLayoutsOrder(orderedLayoutsIds, layouts, widgets);
    expect(result).toEqual([
      {
        w: 3,
        h: 8,
        x: 0,
        y: 0,
        i: "1",
      },
      {
        w: 3,
        h: 4,
        x: 3,
        y: 0,
        i: "3",
      },
      {
        w: 3,
        h: 4,
        x: 0,
        y: 8,
        i: "4",
      },
      {
        w: 3,
        h: 4,
        x: 3,
        y: 8,
        i: "5",
      },
    ]);
  });
  it("case of many widgets per line", () => {
    /** 
        full layout looks like this:
        ------------- ------------- ------------- ------------- ------------- -------------
        |           | |           | |           | |           | |           | |           |
        | vis1      | |  vis2     | | vis3      | |  vis4     | |  vis5     | |  vis6     |
        ------------- ------------- ------------- ------------- ------------- -------------
        --------------------------- ------------- -------------
        |                         | |           | |           |
        | vis7                    | | vis8      | |  vis9     |
        --------------------------- ------------- -------------

        layout with hidden widget 3 and 6 look like this:

        ------------- ------------- ------------- ------------- ---------------------------
        |           | |           | |           | |           | |                         |
        | vis1      | |  vis2     | | vis4      | |  vis5     | | vis7                    |
        ------------- ------------- ------------- ------------- ---------------------------
        ------------- ------------- ´
        |           | |           | 
        | vis8      | |  vis9     | 
        ------------- ------------- 

        */
    const orderedLayoutsIds = [1, 2, 3, 4, 5, 6, 7, 8, 9];
    const layouts = [
      { w: 1, h: 4, x: 0, y: 0, i: "1" },
      { w: 1, h: 4, x: 1, y: 0, i: "2" },
      // hidden { w: 1, h: 4, x: 2, y: 0, i: "3" },
      { w: 1, h: 4, x: 3, y: 0, i: "4" },
      { w: 1, h: 4, x: 4, y: 0, i: "5" },
      // hidden { w: 1, h: 4, x: 5, y: 0, i: "6" },
      { w: 2, h: 4, x: 0, y: 4, i: "7" },
      { w: 1, h: 4, x: 2, y: 4, i: "8" },
      { w: 1, h: 4, x: 3, y: 4, i: "9" },
    ];
    const widgets = [
      { id: 1, visualization: {} },
      { id: 2, visualization: {} },
      //{ id: 3, visualization: {} },
      { id: 4, visualization: {} },
      { id: 5, visualization: {} },
      //{ id: 6, visualization: {} },
      { id: 7, visualization: {} },
      { id: 8, visualization: {} },
      { id: 9, visualization: {} },
    ];
    const result = keepLayoutsOrder(orderedLayoutsIds, layouts, widgets);
    expect(result).toEqual([
      { w: 1, h: 4, x: 0, y: 0, i: "1" },
      { w: 1, h: 4, x: 1, y: 0, i: "2" },
      { w: 1, h: 4, x: 2, y: 0, i: "4" },
      { w: 1, h: 4, x: 3, y: 0, i: "5" },
      { w: 2, h: 4, x: 4, y: 0, i: "7" },
      { w: 1, h: 4, x: 0, y: 4, i: "8" },
      { w: 1, h: 4, x: 1, y: 4, i: "9" },
    ]);
  });
  it("integration test senario 1", () => {
    /**
     full layout looks like this (similar to logamatic5000 one): 
      --------------------------------------------------
      |     textbox 1                                  |
      --------------------------------------------------
      -------- ------------- --------------------------- 
      |      | |           | |                         |
      | vis2 | |  vis3     | | vis4                    | 
      -------- ------------- ---------------------------         
      ---------------------- ---------------------------
      |                    | |                         |
      | vis5               | |  vis6                   |
      ---------------------- ---------------------------
      --------------------------------------------------
      |     textbox 7                                  |
      --------------------------------------------------
      ---------------------- ---------------------------
      |                    | |                         |
      | vis8               | |  vis9                   |
      ---------------------- ---------------------------
      --------------------------------------------------
      |     textbox 10                                 |
      --------------------------------------------------
      ---------------------- ---------------------------
      |                    | |                         |
      | vis11              | |  vis12                  |
      ---------------------- ---------------------------
      --------------------------------------------------
      |     textbox 13                                 |
      --------------------------------------------------
      ----------------------
      |     textbox 14     |
      ----------------------
      ---------------------- ---------------------------
      |                    | |                         |
      | vis15              | |  vis16                  |
      ---------------------- ---------------------------
      
      layout with hidden widget 4, 8 and 9 look like this:
      --------------------------------------------------
      |     textbox 1                                  |
      --------------------------------------------------
      -------- ------------- --------------------------- 
      |      | |           | |                         |
      | vis2 | |  vis3     | | vis5                    | 
      -------- ------------- ---------------------------         
      ---------------------- 
      |                    | 
      | vis6               | 
      ---------------------- 
      --------------------------------------------------
      |     textbox 7                                  |
      --------------------------------------------------
      --------------------------------------------------
      |     textbox 10                                 |
      --------------------------------------------------
      ---------------------- ---------------------------
      |                    | |                         |
      | vis11              | |  vis12                  |
      ---------------------- ---------------------------
      --------------------------------------------------
      |     textbox 13                                 |
      --------------------------------------------------
      ----------------------
      |     textbox 14     |
      ----------------------
      ---------------------- ---------------------------
      |                    | |                         |
      | vis15              | |  vis16                  |
      ---------------------- ---------------------------
      */
    const orderedLayoutsIds = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16];
    const layouts = [
      { w: 6, h: 2, x: 0, y: 0, i: "1" },
      { w: 1, h: 4, x: 0, y: 2, i: "2" },
      { w: 2, h: 4, x: 1, y: 2, i: "3" },
      // hidden { w: 3, h: 4, x: 3, y: 2, i: "4" },
      { w: 3, h: 4, x: 0, y: 6, i: "5" },
      { w: 3, h: 4, x: 3, y: 6, i: "6" },
      { w: 6, h: 2, x: 0, y: 10, i: "7" },
      //{ w: 3, h: 4, x: 0, y: 12, i: "8" },
      //{ w: 3, h: 4, x: 3, y: 12, i: "9" },
      { w: 6, h: 2, x: 0, y: 16, i: "10" },
      { w: 3, h: 4, x: 0, y: 18, i: "11" },
      { w: 3, h: 4, x: 3, y: 18, i: "12" },
      { w: 6, h: 2, x: 0, y: 22, i: "13" },
      { w: 3, h: 2, x: 0, y: 24, i: "14" },
      { w: 3, h: 4, x: 0, y: 26, i: "15" },
      { w: 3, h: 4, x: 3, y: 26, i: "16" },
    ];
    const widgets = [
      { id: 1 },
      { id: 2, visualization: {} },
      { id: 3, visualization: {} },
      { id: 4, visualization: {} },
      { id: 5, visualization: {} },
      { id: 6, visualization: {} },
      { id: 7 },
      { id: 8, visualization: {} },
      { id: 9, visualization: {} },
      { id: 10 },
      { id: 11, visualization: {} },
      { id: 12, visualization: {} },
      { id: 13 },
      { id: 14 },
      { id: 15, visualization: {} },
      { id: 16, visualization: {} },
    ];
    const result = keepLayoutsOrder(orderedLayoutsIds, layouts, widgets);
    expect(result).toEqual([
      { w: 6, h: 2, x: 0, y: 0, i: "1" },
      { w: 1, h: 4, x: 0, y: 2, i: "2" },
      { w: 2, h: 4, x: 1, y: 2, i: "3" },
      { w: 3, h: 4, x: 3, y: 2, i: "5" },
      { w: 3, h: 4, x: 0, y: 6, i: "6" },
      { w: 6, h: 2, x: 0, y: 10, i: "7" },
      { w: 6, h: 2, x: 0, y: 12, i: "10" },
      { w: 3, h: 4, x: 0, y: 14, i: "11" },
      { w: 3, h: 4, x: 3, y: 14, i: "12" },
      { w: 6, h: 2, x: 0, y: 18, i: "13" },
      { w: 3, h: 2, x: 0, y: 20, i: "14" },
      { w: 3, h: 4, x: 0, y: 22, i: "15" },
      { w: 3, h: 4, x: 3, y: 22, i: "16" },
    ]);
  });
});
