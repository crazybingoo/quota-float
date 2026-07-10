# Windows Widget Clipping Design

## Problem

On Windows, both the 100 x 100 collapsed orb and the 320 x 320 expanded card lose their right and bottom edges. The frontend deliberately renders at those exact client-area sizes, while the Tauri window is configured as a borderless but resizable native window.

## Root Cause

Windows retains an invisible resize frame for a resizable borderless window. Tauri's configured and runtime sizes describe the outer native window, so the WebView client area is smaller than 100 x 100 or 320 x 320. The fixed-size frontend therefore overflows and is clipped on the right and bottom.

The observed clipping width is consistent in both modes, and the missing edges match the native resize-frame location. The widget already controls its own two sizes and provides no user-facing resize workflow.

## Design

Set the Tauri widget window to `resizable: false`. Keep the existing 100 x 100 collapsed size, 320 x 320 expanded size, CSS dimensions, hover behavior, dragging, transparency, and always-on-top behavior unchanged.

This removes the Windows resize frame instead of compensating for a platform- and DPI-dependent frame width. It also preserves the intended visual scale instead of shrinking the frontend to fit an undersized client area.

## Validation

- Add a configuration regression test that loads `src-tauri/tauri.conf.json` and requires the widget to be non-resizable with the existing size limits unchanged.
- Run the new regression test and the complete frontend test suite.
- Run the Rust test suite and production builds.
- Replace the local running executable, relaunch it, and visually verify that the collapsed orb and expanded card show all four rounded corners without right or bottom clipping.

## Scope

No quota-fetching, preference, styling, language, release-version, or packaging behavior changes are included.
