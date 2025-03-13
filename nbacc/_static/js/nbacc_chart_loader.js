/**
 * nbacc_chart_loader.js
 * Handles finding and loading charts when they become visible in the viewport.
 */

// Keep track of which charts have already been loaded
const loadedCharts = new Set();
// Store chart instances for reference (needed for reset functionality)
const chartInstances = {};

// Function to check if any part of an element is in the viewport
// Returns true if any portion of the element is visible on screen
function isElementInViewport(el) {
    const rect = el.getBoundingClientRect();
    const windowHeight = window.innerHeight || document.documentElement.clientHeight;
    const windowWidth = window.innerWidth || document.documentElement.clientWidth;

    // Check if any part of the element is visible
    return (
        rect.bottom > 0 &&
        rect.right > 0 &&
        rect.left < windowWidth &&
        rect.top < windowHeight
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
    if (loadedCharts.has(divId)) {
        throw new AssertionError(`Chart with ID ${divId} has already been loaded`);
    }
    loadedCharts.add(divId);

    // Show loading indicator
    // chartDiv.innerHTML = '<div class="chart-loading">Loading chart data...</div>';

    // Construct the URL for the chart data using absolute path from root
    const rootUrl = window.location.protocol + "//" + window.location.host;
    const jsonUrl = `${rootUrl}/nbacc/_static/json/charts/${
        divId.split("_copy")[0]
    }.json`;

    // Fetch the JSON data
    let chartData;
    try {
        // Try the absolute path
        let response = await fetch(jsonUrl);

        // If absolute path fails, try an alternative path
        if (!response.ok) {
            throw new Error(`Error can't find ${divId}.json!`);
        }

        // Check if we have gzipped JSON (based on content type or extension)
        const contentType = response.headers.get("Content-Type");
        const isGzipped =
            jsonUrl.endsWith(".gz") || (contentType && contentType.includes("gzip"));
        if (isGzipped) {
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
    let chartHeight = 600;

    // Create a parent container for the chart container
    const chartContainerParent = document.createElement("div");
    chartContainerParent.className = "chart-container-parent";
    chartContainerParent.style.width = "100%";

    // Create a container for the chart specifically for Chart.js
    const chartContainer = document.createElement("div");
    chartContainer.className = "chart-container";
    chartContainer.style.position = "relative";
    chartContainer.style.height = `${chartHeight}px`;
    chartContainer.style.width = "100%";

    // Append the chart container to the parent container
    chartContainerParent.appendChild(chartContainer);

    // Append the parent container to the chart div
    chartDiv.appendChild(chartContainerParent);

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

    // Note: We're no longer creating button container here, as it will be created by createChartJSChart

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

    // // Mark chart as active when mouse enters
    // canvas.addEventListener("mouseenter", function () {
    //     // Remove active class from all charts
    //     document.querySelectorAll(".nba-cc.chart").forEach((div) => {
    //         div.classList.remove("active-chart");
    //     });
    //     // Add active class to this chart
    //     chartDiv.classList.add("active-chart");
    // });

    // // Handle mouse leaving the canvas
    // canvas.addEventListener("mouseleave", function () {
    //     // Hide any tooltips when mouse leaves the chart
    //     const tooltipEl = document.getElementById("chartjs-tooltip");
    //     if (tooltipEl) {
    //         // Add a small delay to allow moving to the tooltip itself
    //         setTimeout(() => {
    //             if (!tooltipEl.matches(":hover")) {
    //                 tooltipEl.style.opacity = 0;
    //                 tooltipEl.setAttribute("data-sticky", "false");
    //             }
    //         }, 100);
    //     }
    // });
}

// Check all chart divs and load those in the viewport
function checkChartsInViewport() {
    const chartDivs = document.querySelectorAll("div.nbacc-chart");

    if (chartDivs.length === 0) {
        console.log("No chart divs found with class 'nbacc-chart'");
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
