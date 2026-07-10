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
