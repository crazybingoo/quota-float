import { describe, expect, it } from "vitest";
import config from "../../src-tauri/tauri.conf.json";

describe("widget window sizing", () => {
  it("uses fixed client-area dimensions without a Windows resize frame", () => {
    const widget = config.app.windows.find((window) => window.label === "widget");

    expect(widget).toMatchObject({
      width: 100,
      height: 100,
      minWidth: 80,
      minHeight: 80,
      resizable: false,
      decorations: false,
    });
    expect(widget).not.toHaveProperty("maxWidth");
    expect(widget).not.toHaveProperty("maxHeight");
  });
});
