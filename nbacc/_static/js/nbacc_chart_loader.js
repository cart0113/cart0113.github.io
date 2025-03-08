/**
 * nbacc_chart_loader.js
 * Handles finding and loading charts when they become visible in the viewport.
 */

// Keep track of which charts have already been loaded
const loadedCharts = new Set();
// Store chart instances for reference (needed for reset functionality)
const chartInstances = {};

// Function to check if an element is in the viewport
function isElementInViewport(el) {
    const rect = el.getBoundingClientRect();
    return (
        rect.top >= 0 &&
        rect.left >= 0 &&
        rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
        rect.right <= (window.innerWidth || document.documentElement.clientWidth)
    );
}

// Function to reset zoom on a chart
function resetChartZoom(chartId) {
    const chart = chartInstances[chartId];
    if (chart) {
        chart.resetZoom();
    }
}

// Function to load and plot chart data
async function loadAndPlotChart(chartDiv) {
    const divId = chartDiv.id;
    if (!divId) {
        console.error("Chart div must have an ID attribute");
        return;
    }

    // Mark this chart as loaded to avoid duplicate processing
    loadedCharts.add(divId);

    // Show loading indicator
    chartDiv.innerHTML = '<div class="chart-loading">Loading chart data...</div>';

    // Construct the URL for the chart data
    const jsonUrl = `../_static/json/charts/${divId}.json`;

    // Fetch the JSON data
    let chartData;
    try {
        // First try a direct path
        let response = await fetch(jsonUrl);

        // If direct path fails, try an alternative path
        if (!response.ok) {
            const altPath = `../docs/source/_static/json/charts/${divId}.json`;
            response = await fetch(altPath);

            // If that fails too, throw an error
            if (!response.ok) {
                throw new Error(`Error can't find ${divId}.json!`);
            }
        }

        // Check if we have gzipped JSON (based on content type or extension)
        const contentType = response.headers.get("Content-Type");
        if (jsonUrl.endsWith(".gz") || (contentType && contentType.includes("gzip"))) {
            // Use the readGzJson utility function
            chartData = await readGzJson(response);
        } else {
            // Regular JSON
            chartData = await response.json();
        }

        // Validate the required attributes early
        validateChartData(chartData);
    } catch (error) {
        console.error(`Error loading or validating JSON: ${error.message}`);
        chartDiv.innerHTML = `Error can't find ${divId}.json!`;
        return;
    }

    // First, clear the div completely
    chartDiv.innerHTML = "";

    // Calculate desired height based on chart data
    let chartHeight = 600; /* Increased from 700 to 900 */

    // Create a container for the chart specifically for Chart.js
    const chartContainer = document.createElement("div");
    chartContainer.className = "chart-container";
    chartContainer.style.position = "relative";
    chartContainer.style.height = `${chartHeight}px`;
    chartContainer.style.width = "100%";
    chartDiv.appendChild(chartContainer);

    // Create canvas with proper size attributes
    const canvas = document.createElement("canvas");
    canvas.id = `${divId}-canvas`;
    canvas.style.width = "100%";
    canvas.style.height = "100%";

    // Set initial dimensions for the canvas - important!
    const containerWidth = chartContainer.clientWidth || 600;
    canvas.width = containerWidth;
    canvas.height = chartHeight;

    // Add canvas to container
    chartContainer.appendChild(canvas);

    // Create button container
    const buttonContainer = document.createElement("div");
    buttonContainer.className = "chart-buttons";
    buttonContainer.style.textAlign = "center";
    buttonContainer.style.marginTop = "10px";
    chartDiv.appendChild(buttonContainer);

    // Add Reset Zoom button
    const resetButton = document.createElement("button");
    resetButton.className = "chart-btn reset-zoom-btn";
    resetButton.textContent = "Reset Zoom";
    resetButton.onclick = function () {
        resetChartZoom(divId);
    };
    buttonContainer.appendChild(resetButton);

    // Add Save As PNG button
    const saveButton = document.createElement("button");
    saveButton.className = "chart-btn save-png-btn";
    saveButton.textContent = "Save As PNG";
    saveButton.onclick = function () {
        saveChart(canvas);
    };
    buttonContainer.appendChild(saveButton);

    // Process JSON data for Chart.js
    const formattedData = formatDataForChartJS(chartData);

    // Create chart and store the instance
    const chartInstance = createChartJSChart(canvas.id, formattedData);
    chartInstances[divId] = chartInstance;

    // Add double-click event listener to reset zoom
    canvas.addEventListener("dblclick", function () {
        resetChartZoom(divId);
    });

    // Create a global keyboard handler for this chart instead of focusing the canvas
    const chartKeyboardHandler = function (event) {
        if (event.key === "f" || event.key === "F") {
            // Check if the mouse is over this chart
            const rect = canvas.getBoundingClientRect();
            const mouseX = event.clientX;
            const mouseY = event.clientY;

            // If mouse is over this chart or if this is the active chart
            if (
                (mouseX >= rect.left &&
                    mouseX <= rect.right &&
                    mouseY >= rect.top &&
                    mouseY <= rect.bottom) ||
                chartDiv.classList.contains("active-chart")
            ) {
                resetChartZoom(divId);
                event.preventDefault(); // Prevent default behavior
            }
        }
    };

    // Add global key event listener
    document.addEventListener("keydown", chartKeyboardHandler);

    // Mark chart as active when mouse enters
    canvas.addEventListener("mouseenter", function () {
        // Remove active class from all charts
        document.querySelectorAll(".nba-cc.chart").forEach((div) => {
            div.classList.remove("active-chart");
        });
        // Add active class to this chart
        chartDiv.classList.add("active-chart");
    });
}

// Check all chart divs and load those in the viewport
function checkChartsInViewport() {
    const chartDivs = document.querySelectorAll("div.nba-cc.chart");

    if (chartDivs.length === 0) {
        console.log("No chart divs found with class 'nba-cc chart'");
    }

    chartDivs.forEach((div) => {
        const divId = div.id;

        if (!divId) {
            console.warn("Found chart div without ID - skipping");
            return;
        }

        // Skip if this chart has already been loaded
        if (loadedCharts.has(divId)) return;

        // If the div is in the viewport, load and plot the chart
        if (isElementInViewport(div)) {
            loadAndPlotChart(div);
        }
    });
}

// Set up the scroll event listener
document.addEventListener("DOMContentLoaded", () => {
    // Initial check for charts in viewport
    checkChartsInViewport();

    // Check for charts when scrolling
    window.addEventListener("scroll", () => {
        // Debounce the scroll event to improve performance
        if (window.scrollTimeout) {
            clearTimeout(window.scrollTimeout);
        }
        window.scrollTimeout = setTimeout(checkChartsInViewport, 100);
    });

    // Also check when window is resized
    window.addEventListener("resize", () => {
        if (window.resizeTimeout) {
            clearTimeout(window.resizeTimeout);
        }
        window.resizeTimeout = setTimeout(checkChartsInViewport, 100);
    });
});

/**
 * Validates that the chart data has all required attributes
 * @param {object} chartData - The chart data object to validate
 * @throws {Error} If any required attributes are missing
 */
function validateChartData(chartData) {
    if (!chartData) {
        throw new Error("No chart data provided");
    }

    if (
        !chartData.lines ||
        !Array.isArray(chartData.lines) ||
        chartData.lines.length === 0
    ) {
        throw new Error("Chart data must contain at least one line");
    }

    chartData.lines.forEach((line, index) => {
        if (
            !line.point_margins ||
            !Array.isArray(line.point_margins) ||
            line.point_margins.length === 0
        ) {
            throw new Error(`Line ${index}: Missing or invalid 'point_margins' array`);
        }

        if (line.m === undefined || line.b === undefined) {
            throw new Error(
                `Line ${index}: Missing slope (m) or y-intercept (b) for trend line`
            );
        }

        if (
            !line.point_margin_data ||
            !Array.isArray(line.point_margin_data) ||
            line.point_margin_data.length === 0
        ) {
            throw new Error(
                `Line ${index}: Missing or invalid 'point_margin_data' array`
            );
        }

        // Check if each point_margin_data entry has the required sigma property
        line.point_margin_data.forEach((point, pointIndex) => {
            if (point.sigma === undefined) {
                throw new Error(
                    `Line ${index}, Point ${pointIndex}: Missing 'sigma' value`
                );
            }
        });
    });
}
