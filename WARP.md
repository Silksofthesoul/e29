# WARP.md

This file provides guidance to WARP (warp.dev) when working with code in this repository.

## Development commands

This repository is a static HTML/CSS/JavaScript project with no build system, test runner, or linter configured. Work directly with the files under `index.html`, `css/`, and `js/`.

- **Run locally via a simple HTTP server** (recommended for correct relative paths):
  - From the repository root, run:
    - `python3 -m http.server 8000`
  - Then open `http://localhost:8000/index.html` in a browser.
- **Direct file open** (alternative):
  - Open `index.html` directly in a browser from the filesystem if a server is not needed.

There are currently **no project-specific commands** for building, linting, or running tests. If you introduce tooling (e.g. a bundler, Jest/Vitest, ESLint), document the new commands here.

## High-level architecture

### HTML entrypoint

- `index.html` is the single HTML entrypoint.
  - It links the aggregated stylesheet `css/styles.css`.
  - It loads JavaScript files in a specific order to satisfy dependency registration:
    1. Utility and dependency-registration scripts under `js/utils/`.
    2. Mixins under `js/mixins/`.
    3. Base and domain classes under `js/classes/`.
    4. The main bootstrap script `js/index.js`.

The load order matters because the project uses a custom dependency container instead of ES modules.

### Styling

- `css/styles.css` imports the rest of the styles and is the single stylesheet referenced from `index.html`.
- `css/variables.css` defines CSS custom properties such as font families, matrix cell colors, and base cell sizing.
- `css/default.css` and `css/scene.css` establish global layout and centering rules. `.scene` is sized to fill the viewport (`100vw` × `100vh`) and centers the matrix.
- `css/matrix.css` defines the grid layout classes (`.matrix`, `.matrix__row`, `.matrix__cell`, and per-value color classes like `.matrix__cell--m-1`) and the keyframe animation `matrix-cell-pulse`. `.matrix` stretches to fill the scene, while individual cells use CSS custom properties (e.g. `--cell-size`, `--cell-delay`, `--cell-animation-scale-min/max`, `--cell-animation-opacity-max`, `--cell-animation-blur-max`, `--cell-duration`) to control square sizing and a wave-like pulse animation driven by JavaScript.

### Custom dependency container (`js/utils/dep.js`)

The project uses a small, custom dependency injection / registry mechanism instead of ES modules:

- `js/utils/dep.js` defines a `$DEP` object with:
  - `export` method for registering dependencies by name.
  - `import` method for retrieving dependencies by name or list of names.
- A single instance is created and exposed globally as:
  - `$dep` — the main container object.
  - `$export` — shorthand for `$dep.export`.
  - `$import` — shorthand for `$dep.import`.
- Other modules:
  - Register their exports via `$dep.export({ Name })` or `$export({ Name })`.
  - Consume dependencies via `$dep.import(['Name'])` or `$import(['Name'])`.

When adding new utilities or classes, follow this pattern so that they can be imported elsewhere.

### Utility modules (`js/utils/`)

- `type.js` provides basic coercion helpers: `int`, `float`, and `str`, all registered in the dependency container.
- `rnd.js` depends on the type utilities and exports random helpers:
  - `rndInt(min, max)` — inclusive random integer.
  - `rndFromArray(array)` — picks a random element from an array.
- `fn.js` exports `altQueue`, a higher-order function for composing a list of fallback handlers that are tried in order until one returns a non-`false` value.

These utilities are designed to be reused by higher-level classes like `Matrix`.

### Logging mixin and base class (`js/mixins/`, `js/classes/Base.js`)

- `js/mixins/Logs.js` defines a `Logs` class with a static `log(...args)` method. The actual `console.log` call is currently commented out; enable it while debugging.
- `js/classes/Base.js` defines `Base`, which:
  - Imports `Logs` from the dependency container.
  - Provides a shared `log` method for subclasses via `this.log`.
  - Sets a `name` property (default `'unnamed'`) and logs on construction.

All main domain classes (`Scene`, `Cell`, `Matrix`) extend `Base` and inherit this logging and naming behavior.

### Scene and matrix domain model (`js/classes/`)

The core runtime model is a simple scene graph with a 2D, animated matrix of `Cell` objects.

- `Scene` (`js/classes/Scene.js`):
  - Extends `Base` and represents the root visual container.
  - On initialization, creates a root `<div>` with class `scene` and appends it to `document.body`.
  - Manages a `childs` array of `{ key, instance }` pairs.
  - `append(key, instance)`:
    - Ensures only one child per key (replacing existing one if needed).
    - Appends the child’s `element` to the scene root element.
  - `get(key)` and `remove(key)` handle lookups and removal of child instances.
  - `render()` iterates all children and calls their `render()` methods.

- `Cell` (`js/classes/Cell.js`):
  - Extends `Base` and represents an individual matrix cell.
  - Holds a `value` property.
  - `render(parentEl)` lazily creates a `<div>` with class `matrix__cell`, resets its classes, applies a color modifier class based on `value` (e.g. `matrix__cell--m-3`), and appends it to the provided row element.
  - Exposes an `element` getter (`this.elRoot`) for further styling (e.g. per-cell animation parameters).

- `Matrix` (`js/classes/Matrix.js`):
  - Extends `Base` and models a 2D grid of `Cell` instances.
  - Imports `Base`, `Cell`, `rndFromArray`, and `rndInt` from the dependency container.
  - Constructor parameters:
    - `width`, `height` — grid dimensions.
    - `lib` — an array of possible cell values; deduplicated before use.
  - Internal state:
    - `data` — a 2D array of `Cell` instances.
    - `elRoot` — a `<div>` with class `matrix` created in `initElement()`.
  - `init()` builds the DOM root and initializes the `data` structure, then calls `gen()`.
  - `initData()` populates `data` with new `Cell` instances.
  - `gen()` assigns a random value from `lib` to each cell using `rndFromArray`.
  - `render()`:
    - Computes a per-cell pixel size based on `window.innerWidth/height` and the current matrix dimensions, then sets the CSS custom property `--cell-size` on the matrix root so cells remain square and the matrix maximally fills the viewport.
    - Clears the previous DOM, iterates `data`, creates a `.matrix__row` for each `y`, and calls `cell.render(rowEl)` for each `Cell`.
    - For each cell element, sets animation-related CSS custom properties (`--cell-delay`, `--cell-animation-scale-min/max`, `--cell-animation-opacity-max`, `--cell-animation-blur-max`, `--cell-duration`) using `rndInt` and the cell’s coordinates to create a diagonal, wave-like pulse with slight per-cell variation.
  - The `element` getter exposes `elRoot` so `Scene` can append the matrix into the DOM.

The combination of `Scene` and `Matrix` now fully renders a dynamic, animated grid whose behavior is largely driven by CSS variables and keyframes.

### Application bootstrap (`js/index.js`)

- Imports `Scene`, `Matrix`, `rndInt`, and `int` from the dependency container.
- Defines `lib` of possible cell values (`[1, 2, 3, 4, 5, 6, 7, 8, 9]`).
- Defines `baseCellSize` (in pixels) and a helper `createMatrix()` that:
  - Computes `width` and `height` based on `window.innerWidth/height` and `baseCellSize` so that the matrix roughly tiles the viewport with square cells.
  - Creates a `Matrix` with these dimensions and `lib`, and calls `matrix.gen()`.
  - Returns the configured instance.
- Workflow:
  1. Construct a `Scene` instance.
  2. Call `createMatrix()` and append the resulting matrix to the scene via `scene.append('matrix', matrix)`.
  3. Call `scene.render()`.
  4. Subscribe to `window.resize` and, on each event, recreate the matrix via `createMatrix()`, re-append it into the scene, and re-render, so the grid’s resolution adapts to viewport changes.

This script is the primary entrypoint for evolving the application’s behavior (e.g. changing how the grid resolution responds to screen size, altering animation parameters, or wiring up user interaction).

## Notes for future Warp agents

- Be careful when refactoring modules to ES modules or bundlers: the current design relies on globals (`$dep`, `$export`, `$import`) and script-load order in `index.html`.
- Animations and layout rely heavily on CSS variables (`--cell-size` and various `--cell-animation-*` props) set from JavaScript; when changing the rendering model, preserve or consciously replace this contract between JS and CSS.
- If you introduce tooling (tests, linting, bundling), update the **Development commands** section with the exact CLI commands so future agents can run them directly.
