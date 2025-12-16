import React from "react";
import { mount } from "enzyme";
import { createParameter } from "@/services/parameters";
import Parameters from "@/components/Parameters";

describe("Parameters component fixed-from-url hide", () => {
  test("hides fixed-from-url parameter and Apply Changes works for others", () => {
    const foo = createParameter({ title: "Foo", name: "foo", type: "text", value: null });
    const bar = createParameter({ title: "Bar", name: "bar", type: "text", value: null });

    const onValuesChange = jest.fn();

    const wrapper = mount(
      <Parameters
        parameters={[foo, bar]}
        onValuesChange={onValuesChange}
        hiddenParameterNames={["foo"]}
      />
    );

    // foo should be hidden, bar should be rendered
    expect(wrapper.find('[data-test="ParameterName-foo"]').exists()).toBe(false);
    expect(wrapper.find('[data-test="ParameterName-bar"]').exists()).toBe(true);

    // Simulate changing bar pending value via the child ParameterValueInput's onSelect
    const paramValueInput = wrapper.find("ParameterValueInput").at(0);
    paramValueInput.prop("onSelect")("new-value", true);
    wrapper.update();

    // Now click apply via the ParameterApplyButton's onClick prop
    const apply = wrapper.find("ParameterApplyButton").at(0);
    apply.prop("onClick")();

    // onValuesChange should have been called with one parameter (bar)
    expect(onValuesChange).toHaveBeenCalled();
    const calledWith = onValuesChange.mock.calls[0][0];
    expect(calledWith.length).toBe(1);
    expect(calledWith[0].name).toBe("bar");
  });
});
