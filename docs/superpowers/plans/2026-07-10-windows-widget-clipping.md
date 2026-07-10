# Windows Widget Clipping Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Remove the invisible Windows resize frame so the fixed-size collapsed orb and expanded quota card are not clipped.

**Architecture:** Keep the existing React layout and Tauri runtime size switching unchanged. Make the native widget non-resizable in Tauri configuration and protect that contract with a Vitest regression test that reads the production configuration directly.

**Tech Stack:** Tauri 2, React 19, TypeScript 5, Vitest 3, Rust

## Global Constraints

- Preserve collapsed size 100 x 100 and expanded size 320 x 320.
- Preserve hover expansion, dragging, transparency, and always-on-top behavior.
- Do not change quota fetching, preferences, styling, language, versioning, or packaging behavior.

---

### Task 1: Remove the Windows resize frame

**Files:**
- Create: `src/lib/window-config.test.ts`
- Modify: `src-tauri/tauri.conf.json:23`

**Interfaces:**
- Consumes: Tauri's `app.windows` configuration array and the existing widget label `widget`.
- Produces: A non-resizable widget configuration while retaining all existing size values.

- [ ] **Step 1: Write the failing configuration regression test**

```ts
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
      maxWidth: 360,
      maxHeight: 360,
      resizable: false,
      decorations: false,
    });
  });
});
```

- [ ] **Step 2: Run the test to verify the current configuration fails**

Run: `npm test -- src/lib/window-config.test.ts`

Expected: FAIL because the production configuration currently has `resizable: true`.

- [ ] **Step 3: Apply the minimal configuration fix**

In `src-tauri/tauri.conf.json`, change only:

```json
"resizable": false
```

- [ ] **Step 4: Run automated verification**

Run: `npm test`

Expected: all Vitest tests pass, including the new regression test.

Run: `npm run build`

Expected: TypeScript and Vite production build exit successfully.

Run: `cargo test --manifest-path src-tauri/Cargo.toml`

Expected: all Rust tests pass.

Run: `npm run tauri build -- --no-bundle`

Expected: release executable is created at `src-tauri/target/release/quota-float.exe`.

- [ ] **Step 5: Verify the running Windows widget**

Stop the existing local Quota Float process, replace `D:\Users\Administrator\AppData\Local\Quota Float\quota-float.exe` with the newly built executable, relaunch it, and inspect both UI states.

Expected: the collapsed 100 x 100 orb and expanded 320 x 320 card show all four rounded corners, with no clipping on the right or bottom.

- [ ] **Step 6: Commit the tested fix**

```bash
git add src/lib/window-config.test.ts src-tauri/tauri.conf.json
git commit -m "fix: prevent Windows widget clipping"
```
