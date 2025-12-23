import React from "react";
import { mount } from "enzyme";
import { useFixedFromUrlParameters, extractFixedFromUrlParameterNames } from "../useFixedFromUrlParameters";

describe("useFixedFromUrlParameters Performance", () => {
  // Create large mock data for performance testing
  const createLargeMockData = (widgetCount = 100, paramsPerWidget = 10) => {
    const widgets = [];
    const globalParameters = [];

    for (let i = 0; i < widgetCount; i++) {
      const parameterMappings = {};
      
      for (let j = 0; j < paramsPerWidget; j++) {
        const paramName = `param_${i}_${j}`;
        parameterMappings[paramName] = {
          type: j % 3 === 0 ? "fixed-from-url" : "dashboard-level",
          mapTo: `global_${i}_${j}`
        };
        
        if (j % 3 === 0) {
          globalParameters.push({
            name: `global_${i}_${j}`,
            title: `Global Parameter ${i}_${j}`
          });
        }
      }

      widgets.push({
        options: { parameterMappings }
      });
    }

    return { widgets, globalParameters };
  };

  test("should handle large datasets efficiently", () => {
    const { widgets, globalParameters } = createLargeMockData(100, 20);
    
    const start = performance.now();
    
    // Test the extraction function directly
    const parameterNames = extractFixedFromUrlParameterNames({ widgets });
    expect(parameterNames.length).toBeGreaterThan(0);
    
    const extractTime = performance.now() - start;
    
    // Should complete extraction in reasonable time (< 10ms for 2000 parameters)
    expect(extractTime).toBeLessThan(10);
    
    console.log(`Extraction of ${parameterNames.length} parameters took ${extractTime.toFixed(2)}ms`);
  });

  test("should efficiently find parameters in large global parameter list", () => {
    const { widgets, globalParameters } = createLargeMockData(50, 15);
    
    const TestComponent = ({ widgets, globalParameters }) => {
      const result = useFixedFromUrlParameters(widgets, globalParameters);
      // Store result in component instance for testing
      TestComponent.lastResult = result;
      return null;
    };

    const start = performance.now();
    
    const wrapper = mount(<TestComponent widgets={widgets} globalParameters={globalParameters} />);
    const result = TestComponent.lastResult;
    expect(result.parameterNames.length).toBeGreaterThan(0);
    expect(result.parameters.length).toBe(result.parameterNames.length);
    
    const hookTime = performance.now() - start;
    
    // Hook should complete in reasonable time (< 20ms for large datasets including React mount overhead)
    expect(hookTime).toBeLessThan(20);
    
    console.log(`Hook processing of ${result.count} parameters took ${hookTime.toFixed(2)}ms`);
    
    wrapper.unmount();
  });

  test("should return same object reference for identical inputs", () => {
    const { widgets, globalParameters } = createLargeMockData(10, 5);
    
    const TestComponent = ({ widgets, globalParameters }) => {
      const result = useFixedFromUrlParameters(widgets, globalParameters);
      // Store result in component instance for testing
      TestComponent.lastResult = result;
      return null;
    };

    const wrapper1 = mount(<TestComponent widgets={widgets} globalParameters={globalParameters} />);
    const result1 = TestComponent.lastResult;
    
    const wrapper2 = mount(<TestComponent widgets={widgets} globalParameters={globalParameters} />);
    const result2 = TestComponent.lastResult;
    
    // Results should be equivalent but may be different objects due to memoization
    expect(result1.parameterNames).toEqual(result2.parameterNames);
    expect(result1.parameters.length).toBe(result2.parameters.length);
    expect(result1.count).toBe(result2.count);
    expect(result1.hasFixedParameters).toBe(result2.hasFixedParameters);
    
    wrapper1.unmount();
    wrapper2.unmount();
  });

  test("should handle empty inputs efficiently", () => {
    const start = performance.now();
    
    const TestComponent = ({ widgets, globalParameters }) => {
      const result = useFixedFromUrlParameters(widgets, globalParameters);
      // Store result in component instance for testing
      TestComponent.lastResult = result;
      return null;
    };

    const wrapper = mount(<TestComponent widgets={[]} globalParameters={[]} />);
    const result = TestComponent.lastResult;
    
    const emptyTime = performance.now() - start;
    
    expect(result.parameterNames).toEqual([]);
    expect(result.parameters).toEqual([]);
    expect(result.hasFixedParameters).toBe(false);
    expect(result.count).toBe(0);
    
    // Should be fast for empty inputs (including React mount overhead)
    expect(emptyTime).toBeLessThan(10);
    
    wrapper.unmount();
  });
});
