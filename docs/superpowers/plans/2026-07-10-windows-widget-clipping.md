# Windows Widget Clipping Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Size the native widget from the WebView device pixel ratio so 100 x 100 and 320 x 320 CSS layouts remain fully visible under Windows text scaling.

**Architecture:** Keep the React layouts at their intended CSS dimensions. Convert those dimensions to Tauri `PhysicalSize` values using the current `window.devicePixelRatio`, synchronize the collapsed size on mount, and remove native maximum-size constraints that would clamp accessibility-scaled windows.

**Tech Stack:** Tauri 2, React 19, TypeScript 5, Vitest 3, Rust

## Global Constraints

- Preserve CSS layout sizes of 100 x 100 collapsed and 320 x 320 expanded.
- Preserve hover expansion, dragging, transparency, and always-on-top behavior.
- Support both 100% and 123% Windows text scaling without hard-coded machine-specific dimensions.
- Do not change quota fetching, preferences, styling, language, versioning, or account behavior.

---

### Task 1: Add accessibility-aware native sizing

**Files:**
- Create: `src/lib/widget-size.test.ts`
- Create: `src/App.test.tsx`
- Modify: `src/lib/window-config.test.ts`
- Modify: `src/lib/bridge.ts`
- Modify: `src/App.tsx`
- Modify: `src-tauri/tauri.conf.json`

**Interfaces:**
- Produces: `widgetPhysicalPixels(expanded: boolean, devicePixelRatio: number): number`.
- Consumes: WebView `window.devicePixelRatio` and Tauri `PhysicalSize`.

- [ ] **Step 1: Write failing physical-size tests**

Create `src/lib/widget-size.test.ts`:

```ts
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
```

- [ ] **Step 2: Strengthen the configuration regression test**

In `src/lib/window-config.test.ts`, retain the fixed initial dimensions and non-resizable assertion, remove `maxWidth` and `maxHeight` from `toMatchObject`, then add:

```ts
expect(widget).not.toHaveProperty("maxWidth");
expect(widget).not.toHaveProperty("maxHeight");
```

- [ ] **Step 3: Write a failing mount synchronization test**

Create `src/App.test.tsx`:

```tsx
/* @vitest-environment jsdom */
import { render, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { ProviderSnapshot, WidgetPreferences } from "./types";

const bridge = vi.hoisted(() => ({
  fetchSnapshots: vi.fn(),
  getPreferences: vi.fn(),
  listenDesktopEvents: vi.fn(),
  setAlwaysOnTop: vi.fn(),
  setWidgetExpanded: vi.fn(),
  startDragging: vi.fn(),
  updatePreferences: vi.fn(),
}));

vi.mock("./lib/bridge", () => bridge);

import App from "./App";

const preferences: WidgetPreferences = { locked: false, alwaysOnTop: true, pinnedProvider: null, autoRotateSeconds: 12, language: "zh-CN" };
const snapshot: ProviderSnapshot = {
  provider: "codex",
  displayName: "CODEX",
  plan: "PRO",
  shortWindow: { remainingPercent: 73, resetsAt: "2026-07-10T12:00:00Z", windowSeconds: 18_000 },
  weeklyWindow: { remainingPercent: 74, resetsAt: "2026-07-16T00:00:00Z", windowSeconds: 604_800 },
  resetCredits: 1,
  resetCreditExpiresAt: [],
  updatedAt: "2026-07-10T08:00:00Z",
  status: "ok",
  message: null,
};

describe("widget startup sizing", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    bridge.fetchSnapshots.mockResolvedValue([snapshot]);
    bridge.getPreferences.mockResolvedValue(preferences);
    bridge.listenDesktopEvents.mockResolvedValue(() => undefined);
    bridge.setWidgetExpanded.mockResolvedValue(undefined);
    bridge.startDragging.mockResolvedValue(undefined);
    bridge.updatePreferences.mockResolvedValue(undefined);
    bridge.setAlwaysOnTop.mockResolvedValue(preferences);
  });

  it("synchronizes the collapsed native size on mount", async () => {
    const view = render(<App />);
    await waitFor(() => expect(bridge.setWidgetExpanded).toHaveBeenCalledWith(false));
    view.unmount();
  });
});
```

- [ ] **Step 4: Run the focused tests and verify RED**

Run: `npm test -- src/lib/widget-size.test.ts src/lib/window-config.test.ts src/App.test.tsx`

Expected: FAIL because `widgetPhysicalPixels` is missing, maximum constraints still exist, and App does not synchronize its initial size.

- [ ] **Step 5: Implement physical pixel conversion**

In `src/lib/bridge.ts`, export:

```ts
export function widgetPhysicalPixels(expanded: boolean, devicePixelRatio: number): number {
  const ratio = Number.isFinite(devicePixelRatio) && devicePixelRatio > 0 ? devicePixelRatio : 1;
  return Math.ceil((expanded ? 320 : 100) * ratio);
}
```

Change `setWidgetExpanded` to import `PhysicalSize`, calculate pixels from `window.devicePixelRatio`, and call `setSize(new PhysicalSize(pixels, pixels))`.

- [ ] **Step 6: Synchronize the initial collapsed size**

In `src/App.tsx`, add a mount effect that calls `setWidgetExpanded(false)` and reports `Widget size initialization failed.` through the existing operation notice if the call rejects.

- [ ] **Step 7: Remove clamping constraints**

Delete only `maxWidth` and `maxHeight` from the widget entry in `src-tauri/tauri.conf.json`. Keep `resizable: false` and all other window behavior unchanged.

- [ ] **Step 8: Run automated verification**

Run: `npm test`

Expected: all Vitest tests pass.

Run: `npm run build`

Expected: TypeScript and Vite production build exit successfully.

Run in Windows CI: `cargo test --manifest-path src-tauri/Cargo.toml` and `npm run tauri -- build`.

Expected: Rust tests and the Windows Tauri build pass.

- [ ] **Step 9: Replace and visually verify**

Replace the installed executable while retaining the previous backup. At Windows text scaling 123%, verify:

- Collapsed native size is 123 x 123 and all four orb corners are visible.
- Expanded native size is 394 x 394 and all four card corners are visible.

- [ ] **Step 10: Commit the tested fix**

```bash
git add src/lib/widget-size.test.ts src/App.test.tsx src/lib/window-config.test.ts src/lib/bridge.ts src/App.tsx src-tauri/tauri.conf.json
git commit -m "fix: account for Windows text scaling"
```
