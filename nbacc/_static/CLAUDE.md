# NBA Charts Frontend - Project Guide

## Development & Testing

- **Run Test Page**: Open `/test/nba_test.html` in browser
- **View Example Page**: Open `nba_charts_example.html` in browser
- **Debug in Console**: Use browser dev tools for debugging (no formal test framework)
- **Validate JSON**: Check chart data in `_static/json/charts/` directory

## Working Guidelines

- **Git Commits**: NEVER commit changes unless explicitly instructed with the phrase "commit changes"

## Code Style Guidelines

- **Formatting**: 4-space indentation, trailing semicolons
- **Naming**: camelCase for variables/functions, use `nbacc_` prefix for module names
- **Comments**: JSDoc for functions, inline comments for complex logic
- **Error Handling**: Assume required data exists in JSON (x_min, x_max, etc.)
- **CSS**: Keep styles in `css/nbacc.css` with descriptive class names
- **HTML**: Use semantic elements, consistent ID naming with `nbacc_` prefix

## Important Sections

When you see "Add the important comment X", it means to add a comment in the code and also add it to this section for future reference.

- **CHART_BACKGROUND_COLOR**: Chart plot area background color and opacity setting in plotBackgroundPlugin
- **FULL_SCREEN_FUNCTIONS**: Full screen and exit full screen functionality for all devices including mobile; disables page scrolling while in full screen mode; on mobile: enables zooming, disables normal page pinch-zooming to prevent interference with chart zoom functionality, adds reset zoom button, shows smaller win count numbers, and enables tooltip hover boxes during full screen mode only; automatically resets zoom when exiting full screen

## Architecture

- Pure vanilla JavaScript without frameworks
- Chart.js handles visualization (version 4.4.1)
- Lazy loading via `nbacc_chart_loader.js`
- Data from JSON files in absolute URL paths: `{rootUrl}/_static/json/charts/`
- Regression lines plotted using x_min to x_max from chart data
- Custom tooltips with game data and links to NBA.com

## Chart Features

- **Zoom**: Drag to zoom into specific regions of the chart
- **Reset Zoom**: Return to the original chart view
- **Full Screen**: Open chart in a lightbox for better visibility (uses BasicLightbox library)
- **Save As PNG**: Download chart as a PNG image