import { describe, expect, it } from "vitest";
import { widgetPhysicalPixels } from "./bridge";

describe("widget physical sizing", () => {
  it("preserves the intended CSS sizes at 100% scaling", () => {
    expect(widgetPhysicalPixels(false, 1)).toBe(100);
    expect(widgetPhysicalPixels(true, 1)).toBe(320);
  });

  it("expands the native window for 123% Windows text scaling", () => {
    expect(widgetPhysicalPixels(false, 1.23)).toBe(123);
    expect(widgetPhysicalPixels(true, 1.23)).toBe(394);
  });

  it("falls back to 100% for invalid ratios", () => {
    expect(widgetPhysicalPixels(false, 0)).toBe(100);
    expect(widgetPhysicalPixels(true, Number.NaN)).toBe(320);
  });
});
