# Windows Widget Clipping Design

## Problem

On Windows with accessibility text scaling above 100%, both the 100 x 100 collapsed orb and the 320 x 320 expanded card lose their right and bottom edges.

## Verified Root Cause

The affected machine uses 100% display DPI and 123% Windows text scaling. The Tauri window reports exact 100 x 100 and 320 x 320 physical client areas, while WebView CSS pixels use a 1.23 device pixel ratio. Consequently, the collapsed window exposes only about 81 CSS pixels and the expanded window about 260 CSS pixels, but the frontend requires 100 and 320 CSS pixels respectively.

Removing the native resize frame did not resolve the clipping because the client area was already the requested physical size. As a direct experiment, resizing the expanded native window from 320 x 320 to 394 x 394 (`ceil(320 * 1.23)`) restored all four rounded corners. This confirms the CSS-to-physical pixel mismatch.

## Design

Calculate native widget dimensions from the current WebView `window.devicePixelRatio`:

- Collapsed physical size: `ceil(100 * devicePixelRatio)`.
- Expanded physical size: `ceil(320 * devicePixelRatio)`.
- Fall back to a ratio of 1 for non-finite or non-positive values.

Use Tauri `PhysicalSize` rather than `LogicalSize`, because the WebView device pixel ratio includes Windows text scaling that Tauri's native logical-size conversion does not include. Recalculate on every collapse or expansion so moving the widget between displays uses the current ratio.

Synchronize the collapsed native size once when the React app mounts. Remove the fixed 360 x 360 maximum constraints, which would otherwise clamp the required 394 x 394 expanded size at 123% text scaling. Keep the widget non-resizable so sizes remain controlled by the application.

## Validation

- Unit-test physical pixel calculations at ratios 1 and 1.23.
- Test that the production Tauri configuration has no maximum width or height constraint.
- Test that mounting the app requests the collapsed native size.
- Run all frontend tests, the production web build, Rust tests, and Windows Tauri build.
- Replace the local executable and visually verify all four rounded corners in collapsed and expanded states at 123% text scaling.

## Scope

No quota-fetching, preference, language, visual styling, release-version, or account behavior changes are included.
