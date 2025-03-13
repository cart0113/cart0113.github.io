// Default zoom options for Chart.js
const zoomOptions = {
    zoom: {
        drag: {
            enabled: true,
            backgroundColor: "rgba(109, 102, 102, 0.3)",
            borderColor: "rgba(225,225,225,0.6)",
            borderWidth: 1,
            threshold: 10,
        },
        wheel: {
            enabled: false,
        },
        pinch: {
            enabled: true,
            backgroundColor: "rgba(109, 102, 102, 0.3)",
            borderColor: "rgba(225,225,225,0.6)",
            borderWidth: 1,
            threshold: 10,
        },
        mode: "xy",
        onZoom: function ({ chart }) {
            // Update buttons during zoom (not just after completion)
            updateButtonPositions(chart);
        },
        onZoomComplete: function ({ chart }) {
            // Update button visibility when zoom changes
            // updateChartControlsVisibility(chart);
            // Reposition buttons after zoom
            updateButtonPositions(chart);
        },
    },
    pan: {
        enabled: true,
        mode: "xy",
        threshold: 5, // Minimum distance required before pan is registered
        modifierKey: "shift", // Hold shift key to pan (optional, prevents accidental panning)
        onPan: function ({ chart }) {
            // Update buttons during panning (not just after completion)
            updateButtonPositions(chart);
        },
        onPanComplete: function ({ chart }) {
            // Update button positions after panning completes
            updateButtonPositions(chart);
        },
    },
};

const colorWheel = [
    "rgba(58, 129, 210, 0.5)", // Blue
    "rgba(254, 150, 45, 0.5)", // Orange
    "rgba(66, 165, 81, 0.5)", // Green
    "rgba(255, 99, 132, 0.5)", // Red
    "rgba(153, 102, 255, 0.5)", // Purple
    "rgba(255, 206, 86, 0.5)", // Yellow
    "rgba(199, 199, 199, 0.5)", // Gray
];

function getColorWheel(opacity) {
    return colorWheel.map((color) => color.replace(/0\.5\)/, `${opacity})`));
}

// Custom plugin to add a grey background box around the plot area
const plotBackgroundPlugin = {
    id: "plotBackgroundPlugin",
    beforeDraw: (chart) => {
        const { ctx, chartArea } = chart;
        if (!chartArea) {
            return;
        }
        // Draw a grey background rectangle
        ctx.save();
        ctx.fillStyle = "rgba(166, 166, 166, 0.2)";
        ctx.fillRect(chartArea.left, chartArea.top, chartArea.width, chartArea.height);

        // Add border around the rectangle
        ctx.lineWidth = 2;
        ctx.strokeStyle = "rgba(187, 187, 187, 0.68)";
        ctx.strokeRect(
            chartArea.left,
            chartArea.top,
            chartArea.width,
            chartArea.height
        );

        ctx.restore();
    },
};

// Global variable to track whether to show R² values
let showRSquared = false;

// Function to update tooltip with or without R² values
function updateRSquaredDisplay() {
    // If tooltip is currently visible, update it
    const tooltipEl = document.getElementById("chartjs-tooltip");
    if (tooltipEl && tooltipEl.style.opacity !== "0") {
        // Find all cells with R² data
        const tooltipCells = tooltipEl.querySelectorAll(
            "td[data-has-r-squared='true']"
        );
        tooltipCells.forEach((cell) => {
            if (showRSquared) {
                // Show the R² part
                cell.innerHTML = cell.getAttribute("data-full-text");
            } else {
                // Hide the R² part
                cell.innerHTML = cell.getAttribute("data-text-without-r");
            }
        });
    }
}

// Add keyboard event listener to toggle R² display with 'r' key
document.addEventListener("keydown", function (event) {
    if (event.key === "r" || event.key === "R") {
        showRSquared = !showRSquared;
        updateRSquaredDisplay();
    }
});

// Format the NBA data JSON structure for Chart.js
function formatDataForChartJS(chartData) {
    var N = chartData.y_ticks.length;

    // Create a dictionary to store regression line data for each point margin
    // Format: pointMarginData[pointMargin][legendText] = { winPercent, rSquared }
    const pointMarginData = {};

    // Build the point margin data dictionary for tooltips
    if (chartData.lines) {
        chartData.lines.forEach((line) => {
            // For each x-value in the regression line
            for (
                let x = Math.ceil(chartData.min_x);
                x <= Math.floor(chartData.max_x);
                x++
            ) {
                if (!pointMarginData[x]) {
                    pointMarginData[x] = {};
                }

                // Calculate y-value using line equation y = mx + b
                const y = line.m * x + line.b;

                // Calculate win percentage using normalCDF
                const winPercentage = (100.0 * normalCDF(y)).toFixed(2);

                // Calculate R-squared (squared correlation coefficient)
                const rSquared = (line.r_value * line.r_value).toPrecision(2);

                // Store the data using legend as key
                pointMarginData[x][line.legend] = {
                    winPercent: winPercentage,
                    rSquared: rSquared,
                };
            }
        });
    }

    const yTickLabelMap = {};
    for (let i = 0; i < N; i++) {
        yTickLabelMap[chartData.y_ticks[i]] = chartData.y_tick_labels[i];
    }
    function find_y_label(value) {
        const closestKey = chartData.y_ticks.reduce((prev, curr) =>
            Math.abs(curr - value) < Math.abs(prev - value) ? curr : prev
        );
        return yTickLabelMap[closestKey];
    }

    // Create a custom plugin to display win count on points with win_count < 10
    const winCountPlugin = {
        id: "winCountPlugin",
        afterDatasetsDraw: (chart) => {
            const ctx = chart.ctx;

            chart.data.datasets.forEach((dataset, datasetIndex) => {
                // Only process scatter datasets (the point datasets are at odd indices)
                if (dataset.type !== "scatter") return;

                const meta = chart.getDatasetMeta(datasetIndex);

                // Find the corresponding line index (each line has 2 datasets: line and scatter)
                const lineIndex = Math.floor(datasetIndex / 2);

                // Check if we have point_margin_data available
                if (
                    !chartData.lines[lineIndex] ||
                    !chartData.lines[lineIndex].point_margin_data
                )
                    return;

                // Process each point
                meta.data.forEach((element, index) => {
                    // Get the data point
                    const dataPoint = dataset.data[index];
                    if (!dataPoint) return;

                    // Find matching point_margin_data
                    const pointData = chartData.lines[lineIndex].point_margin_data.find(
                        (item) =>
                            item.point_margin === dataPoint.x &&
                            item.sigma === dataPoint.y
                    );

                    // If we found matching data and win_count < 10, draw the number
                    if (pointData && pointData.win_count < 10) {
                        const position = {
                            x: element.x,
                            y: element.y,
                        };

                        // Draw the win_count as white text - larger and very bold
                        ctx.save();
                        ctx.fillStyle = "white";
                        ctx.font = "900 11px Arial"; // Increased weight to 900 (extra bold) and size to 15px
                        ctx.textAlign = "center";
                        ctx.textBaseline = "middle";

                        // This is no good --> Add text stroke for extra boldness
                        //ctx.lineWidth = 1;
                        //ctx.strokeStyle = "white";
                        //ctx.strokeText(
                        //    pointData.win_count.toString(),
                        //    position.x,
                        //    position.y
                        //);

                        ctx.fillText(
                            pointData.win_count.toString(),
                            position.x,
                            position.y
                        );
                        ctx.restore();
                    }
                });
            });
        },
    };

    // Custom external tooltip handler that supports HTML and sticky behavior
    const externalTooltipHandler = (context) => {
        // Tooltip Element
        let tooltipEl = document.getElementById("chartjs-tooltip");

        // Track if the tooltip is "sticky" (should stay visible)
        if (!tooltipEl) {
            tooltipEl = document.createElement("div");
            tooltipEl.id = "chartjs-tooltip";
            tooltipEl.innerHTML = "<table></table>";
            tooltipEl.setAttribute("data-sticky", "false");
            document.body.appendChild(tooltipEl);

            // Add mouse enter/leave events for the tooltip itself
            tooltipEl.addEventListener("mouseenter", () => {
                // Only make sticky briefly to allow interaction with links
                tooltipEl.setAttribute("data-sticky", "true");

                // Set a timeout to automatically remove stickiness after 4 seconds
                if (tooltipEl.stickyTimeout) {
                    clearTimeout(tooltipEl.stickyTimeout);
                }
                tooltipEl.stickyTimeout = setTimeout(() => {
                    tooltipEl.setAttribute("data-sticky", "false");
                    tooltipEl.style.opacity = 0;
                }, 4000);
            });

            tooltipEl.addEventListener("mouseleave", (event) => {
                // Always remove stickiness when mouse leaves tooltip
                tooltipEl.setAttribute("data-sticky", "false");

                // Clear any pending timeout
                if (tooltipEl.stickyTimeout) {
                    clearTimeout(tooltipEl.stickyTimeout);
                }

                // Hide tooltip immediately when mouse leaves
                tooltipEl.style.opacity = 0;

                // Reset tooltip content when it hides to prevent link behaviors from lingering
                setTimeout(() => {
                    if (tooltipEl.style.opacity === "0") {
                        // Empty the tooltip content to prevent link behaviors from persisting
                        const tableRoot = tooltipEl.querySelector("table");
                        if (tableRoot) {
                            tableRoot.innerHTML = "";
                        }

                        // Also reset any cursor changes
                        document.body.style.cursor = "default";
                    }
                }, 300); // Short delay to ensure tooltip is fully hidden
            });
        }

        // If tooltip model is inactive (mouse left chart element)
        const tooltipModel = context.tooltip;
        if (tooltipModel.opacity === 0) {
            // Only keep showing tooltip if it's sticky AND being hovered
            if (
                !(
                    tooltipEl.getAttribute("data-sticky") === "true" &&
                    tooltipEl.matches(":hover")
                )
            ) {
                tooltipEl.style.opacity = 0;
                return;
            }
        }

        // Set caret position
        tooltipEl.classList.remove("above", "below", "no-transform");
        if (tooltipModel.yAlign) {
            tooltipEl.classList.add(tooltipModel.yAlign);
        } else {
            tooltipEl.classList.add("no-transform");
        }

        // Set Text
        if (tooltipModel.body) {
            const titleLines = tooltipModel.title || [];

            let innerHtml = "<thead>";

            // Add close button to header
            innerHtml += `
                <tr>
                    <th style="color:#f2f2f2; font-weight:bold; padding:5px 45px 5px 5px; position:relative; font-size:15px;">
                        ${titleLines[0] || ""}
                        <span class="tooltip-close" style="position:absolute; right:8px; top:50%; 
                            transform: translateY(-50%); cursor:pointer; width:20px; height:20px; text-align:center; 
                            line-height:20px; color:#f2f2f2; background:rgba(255,255,255,0.25); 
                            border-radius:50%; font-size:14px;">×</span>
                    </th>
                </tr>`;
            innerHtml += "</thead><tbody>";

            // Special handling for our custom content
            const datasetIndex = tooltipModel.dataPoints[0].datasetIndex;
            const index = tooltipModel.dataPoints[0].dataIndex;
            const dataset = context.chart.data.datasets[datasetIndex];

            // Check if this is a regression line dataset (they are even-indexed)
            if (datasetIndex % 2 === 0) {
                // This is a regression line - we need to show all regression data for this x-value
                const dataPoint = dataset.data[index];
                if (!dataPoint) return;

                // Get the x-value (point margin)
                const xValue = parseFloat(dataPoint.x).toFixed(0);

                // Check if we have pre-calculated data for this point margin
                if (pointMarginData[xValue]) {
                    const colors = getColorWheel(0.8);

                    // Loop through all lines and add their data
                    Object.entries(pointMarginData[xValue]).forEach(
                        ([legend, data], i) => {
                            // Remove the "(XXXX Total Games)" part from the legend text
                            const cleanLegend = legend.replace(
                                /\s+\(\d+\s+Total\s+Games\)$/,
                                ""
                            );

                            // Get the color for this line (more opaque for the box)
                            const color = colors[i % colors.length];

                            // Create two versions of the text - with and without R² value - all text in bold and larger
                            const textWithoutR = `<span style="display:inline-block; width:14px; height:14px; background-color:${color}; margin-right:8px; border-radius:2px;"></span>
                            <span style="font-weight:bold; font-size:14px;">${cleanLegend}:</span> <span style="font-weight:bold; font-size:14px;">Win %= ${data.winPercent}</span>`;

                            const fullText = `<span style="display:inline-block; width:14px; height:14px; background-color:${color}; margin-right:8px; border-radius:2px;"></span>
                            <span style="font-weight:bold; font-size:14px;">${cleanLegend}:</span> <span style="font-weight:bold; font-size:14px;">Win %= ${data.winPercent} | R² Value= ${data.rSquared}</span>`;

                            // Display according to showRSquared toggle
                            innerHtml += `<tr><td 
                            style="padding:3px 5px 3px 5px; font-family:'SF Pro Display', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.4;"
                            data-has-r-squared="true"
                            data-text-without-r="${textWithoutR.replace(
                                /"/g,
                                "&quot;"
                            )}" 
                            data-full-text="${fullText.replace(/"/g, "&quot;")}">
                            ${showRSquared ? fullText : textWithoutR}
                        </td></tr>`;
                        }
                    );
                }
            }
            // Show data points tooltip
            else if (dataset.type === "scatter") {
                const dataPoint = dataset.data[index];

                // Find the corresponding line index
                const lineIndex = Math.floor(datasetIndex / 2);

                // Find the matching point_margin_data
                const pointData = chartData.lines[lineIndex].point_margin_data.find(
                    (item) =>
                        item.point_margin === dataPoint.x && item.sigma === dataPoint.y
                );

                if (pointData) {
                    // Win games section
                    if (pointData.win_count > 0) {
                        innerHtml +=
                            '<tr><td style="padding:3px 5px 1px;"><b>Win examples:</b></td></tr>';

                        // Show up to 9 win examples (increased from 8)
                        const winExamples = pointData.win_games.slice(0, 9);
                        winExamples.forEach((game) => {
                            const gameUrl = `http://www.nba.com/game/${game.game_id}`;
                            // Format the date to be more readable (YYYY-MM-DD to MM/DD/YYYY)
                            let formattedDate = "";
                            if (game.game_date) {
                                const dateParts = game.game_date.split("-");
                                if (dateParts.length === 3) {
                                    formattedDate = `${dateParts[1]}/${dateParts[2]}/${dateParts[0]} `;
                                } else {
                                    formattedDate = `${game.game_date} `;
                                }
                            }
                            innerHtml += `<tr><td style="padding:0px 5px; font-family:'SF Pro Display', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, sans-serif; letter-spacing: 0.1px; line-height: 1.1; font-size:12px;">
                                <a href="${gameUrl}" target="_blank" rel="noopener noreferrer" style="color: #78c6ff; text-decoration: underline; padding: 1px 0;">
                                ${formattedDate}${game.game_summary}</a></td></tr>`;
                        });

                        // Update the "more" text to account for 9 examples instead of 8
                        if (pointData.win_games.length > 9) {
                            innerHtml += `<tr><td style="padding:0px 5px 3px; font-size: 0.85em;">...and ${
                                pointData.win_count - 9
                            } more</td></tr>`;
                        }
                    }

                    // Loss games section - keep at 4 examples as requested
                    if (pointData.loss_count > 0) {
                        innerHtml +=
                            '<tr><td style="padding:3px 5px 1px;"><b>Loss examples:</b></td></tr>';

                        // Still showing 4 loss examples
                        const lossExamples = pointData.loss_games.slice(0, 4);
                        lossExamples.forEach((game) => {
                            const gameUrl = `http://www.nba.com/game/${game.game_id}`;
                            // Format the date to be more readable (YYYY-MM-DD to MM/DD/YYYY)
                            let formattedDate = "";
                            if (game.game_date) {
                                const dateParts = game.game_date.split("-");
                                if (dateParts.length === 3) {
                                    formattedDate = `${dateParts[1]}/${dateParts[2]}/${dateParts[0]} `;
                                } else {
                                    formattedDate = `${game.game_date} `;
                                }
                            }
                            innerHtml += `<tr><td style="padding:0px 5px; font-family:'SF Pro Display', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, sans-serif; letter-spacing: 0.1px; line-height: 1.1; font-size:12px;">
                                <a href="${gameUrl}" target="_blank" rel="noopener noreferrer" style="color: #78c6ff; text-decoration: underline; padding: 1px 0;">
                                ${formattedDate}${game.game_summary}</a></td></tr>`;
                        });

                        // Update the "more" text - make it more compact
                        if (pointData.loss_games.length > 4) {
                            innerHtml += `<tr><td style="padding:0px 5px 2px; font-size: 0.85em;">...and ${
                                pointData.loss_count - 4
                            } more</td></tr>`;
                        }
                    }
                }
            }

            innerHtml += "</tbody>";

            const tableRoot = tooltipEl.querySelector("table");
            tableRoot.innerHTML = innerHtml;

            // Add event listener to close button
            const closeBtn = tooltipEl.querySelector(".tooltip-close");
            if (closeBtn) {
                // First remove any existing event listeners to avoid duplicates
                closeBtn.replaceWith(closeBtn.cloneNode(true));

                // Get the newly cloned button
                const newCloseBtn = tooltipEl.querySelector(".tooltip-close");
                newCloseBtn.addEventListener("click", (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    tooltipEl.style.opacity = 0;
                    tooltipEl.setAttribute("data-sticky", "false");

                    // Clear tooltip content to prevent lingering link behaviors
                    setTimeout(() => {
                        const tableRoot = tooltipEl.querySelector("table");
                        if (tableRoot) {
                            tableRoot.innerHTML = "";
                        }
                        // Reset cursor
                        document.body.style.cursor = "default";
                    }, 300);

                    return false;
                });
            }
        }

        // Get the color of the hovered data point
        let borderColor = "rgba(255, 255, 255, 0.6)"; // Default fallback color

        // Try to get the actual color of the dataset
        if (tooltipModel.dataPoints && tooltipModel.dataPoints.length > 0) {
            const datasetIndex = tooltipModel.dataPoints[0].datasetIndex;
            const dataset = context.chart.data.datasets[datasetIndex];

            // Check if this is a regression line (even-indexed datasets) or a scatter point (odd-indexed)
            if (datasetIndex % 2 === 0) {
                // For regression lines, use a medium-dark gray
                borderColor = "rgba(80, 80, 80, 0.9)"; // Medium-dark gray for regression tooltips
            } else {
                // For scatter points, use the dataset color with consistent opacity
                // Find the original color from the dataset configuration
                const lineIndex = Math.floor(datasetIndex / 2); // Get the line index
                const colors = getColorWheel(0.5);
                const color = colors[lineIndex % colors.length];

                // Make the border color more opaque for better visibility
                if (typeof color === "string" && color.includes("rgba")) {
                    borderColor = color.replace(
                        /rgba\((\d+),\s*(\d+),\s*(\d+),\s*[\d\.]+\)/,
                        "rgba($1, $2, $3, 0.9)"
                    );
                } else {
                    borderColor = color;
                }
            }
        }

        // Position and style the tooltip
        const position = context.chart.canvas.getBoundingClientRect();
        const bodyFont = tooltipModel.options.bodyFont;

        tooltipEl.style.opacity = 1;
        tooltipEl.style.position = "absolute";
        tooltipEl.style.left =
            position.left + window.pageXOffset + tooltipModel.caretX + "px";
        tooltipEl.style.top =
            position.top + window.pageYOffset + tooltipModel.caretY + "px";
        tooltipEl.style.font =
            "'SF Pro Display', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";
        tooltipEl.style.fontSize = "12px"; // Smaller base font size
        tooltipEl.style.padding = "10px"; // Slightly less padding
        tooltipEl.style.pointerEvents = "auto";
        tooltipEl.style.backgroundColor = "rgba(29, 53, 87, 0.95)"; // Dark to medium blue
        tooltipEl.style.color = "#f2f2f2"; // Very light gray
        tooltipEl.style.borderRadius = "10px"; // More rounded corners
        tooltipEl.style.maxWidth = "550px";
        tooltipEl.style.minWidth = "350px";
        tooltipEl.style.zIndex = 20000; // Ensure highest z-index
        tooltipEl.style.boxShadow = "0px 3px 15px rgba(0,0,0,0.3)";
        tooltipEl.style.borderWidth = "6px";
        tooltipEl.style.borderStyle = "solid";
        tooltipEl.style.borderColor = borderColor; // Use the dataset color
    };

    //var stepSize = getStepSizeForScreenWidth();
    const chartConfig = {
        type: "line",
        data: {
            datasets: [],
        },
        options: {
            animation: false, // Disable animations
            responsive: true,
            maintainAspectRatio: false, // Better control over dimensions
            interaction: {
                mode: "nearest", // More sensitive interaction mode
                intersect: true, // Require direct intersection
                axis: "xy", // Consider both axes for finding nearest element
            },
            plugins: {
                title: {
                    display: true,
                    text: chartData.title,
                    font: {
                        size: 16, // Smaller title
                        weight: "bold",
                    },
                },
                legend: {
                    display: true,
                    position: "top",
                    labels: {
                        usePointStyle: true,
                        font: {
                            size: 11,
                        },
                        filter: function (item, chart) {
                            return !item.text.includes("REMOVE!");
                        },
                    },
                },
                tooltip: {
                    enabled: false, // Disable the built-in tooltips
                    external: externalTooltipHandler, // Use our custom tooltip handler
                    mode: "nearest", // Show tooltip for nearest point
                    intersect: true, // Require direct intersection
                    axis: "xy", // Consider both axes for nearest point
                    callbacks: {
                        // Title callback still used by external handler
                        title: function (tooltipItems) {
                            const datasetIndex = tooltipItems[0].datasetIndex;
                            const index = tooltipItems[0].dataIndex;
                            const dataset =
                                tooltipItems[0].chart.data.datasets[datasetIndex];

                            // Special handling for trend line datasets (they are even-indexed)
                            if (datasetIndex % 2 === 0) {
                                // This is a trend line - show data for all lines at this x-value
                                // Get the actual point coordinates
                                const dataPoint = dataset.data[index];
                                if (!dataPoint) return "";

                                // Format x value with no decimal places
                                const xValue = parseFloat(dataPoint.x).toFixed(0);

                                // Main header for tooltip - show point margin
                                let tooltipHeader = `Points Behind: ${xValue}`;

                                // Check if we have pre-calculated data for this point margin
                                if (pointMarginData[xValue]) {
                                    // We'll return only the header - the actual line data will be shown in the tooltip body
                                    return tooltipHeader;
                                }

                                // Fallback if point margin data not found
                                return `Points Behind: ${xValue}`;
                            }

                            // Find the corresponding line index
                            const lineIndex = Math.floor(datasetIndex / 2);

                            // Get the point data
                            const dataPoint = dataset.data[index];
                            if (!dataPoint) return "";

                            // Find the matching point_margin_data
                            const pointData = chartData.lines[
                                lineIndex
                            ].point_margin_data.find(
                                (item) =>
                                    item.point_margin === dataPoint.x &&
                                    item.sigma === dataPoint.y
                            );

                            if (!pointData) return "";

                            // Calculate win percentage
                            const winPercent =
                                pointData.total_count > 0
                                    ? (
                                          (pointData.win_count /
                                              pointData.total_count) *
                                          100
                                      ).toFixed(2)
                                    : "0.00";

                            // Format win statistics with new header format
                            return `${pointData.point_margin}: Wins ${
                                pointData.win_count
                            }/${
                                pointData.total_count
                            } | Win %= ${winPercent} | Deficit %= ${(
                                pointData.point_margin_percent * 100
                            ).toFixed(2)}`;
                        },
                    },
                },
                zoom: zoomOptions,
            },
            scales: {
                x0: {
                    type: "linear",
                    // Use the min/max from the chart data, but with some padding
                    min: chartData.min_x - 1,
                    max: chartData.max_x + 1,
                    title: {
                        display: true,
                        text: chartData.x_label,
                    },
                    ticks: {
                        // Set stepSize based on screen width
                        stepSize: 1,
                        // autoSkip: false,
                        font: {
                            size: 12,
                        },
                        color: "black",
                        maxRotation: 45,
                        minRotation: 45,
                    },
                    grid: {
                        display: true,
                        drawOnChartArea: true,
                        drawTicks: true,
                        lineWidth: 2,
                        color: "rgba(147, 149, 149, 0.25)",
                    },
                    // Use exact values from y_ticks for the axis
                    // afterBuildTicks: function (axis) {
                    //     axis.chart.scales.x1.min = axis.min;
                    //     axis.chart.scales.x1.max = axis.max;
                    //     axis.chart.scales.x1.ticks = axis.ticks;
                    // },
                },
                // x1: {
                //     type: "linear",
                //     position: "top",
                //     ticks: {
                //         // Set stepSize based on screen width (same as x0)
                //         stepSize: stepSize,
                //         autoSkip: false,
                //         maxRotation: 45,
                //         minRotation: 45,
                //     },
                // },
                y: {
                    type: "linear",
                    min: Math.min(...chartData.y_ticks) - 0.2,
                    max: Math.max(...chartData.y_ticks) + 0.2,
                    title: {
                        display: true,
                        text: chartData.y_label,
                        font: {
                            size: 14,
                            weight: "bold",
                        },
                    },
                    ticks: {
                        font: {
                            size: 12,
                        },
                        color: "black",
                        // Use y_tick_labels if available, otherwise use actual values
                        callback: find_y_label,
                    },
                    grid: {
                        display: true,
                        drawOnChartArea: true,
                        drawTicks: true,
                        lineWidth: 2,
                        color: "rgba(147, 149, 149, 0.25)",
                    },
                    // Use exact values from y_ticks for the axis
                    afterBuildTicks: function (axis) {
                        var y_ticks = chartData.y_ticks
                            .filter((value) => value <= axis.max && value >= axis.min)
                            .map((value) => ({
                                value: value,
                            }));
                        axis.ticks = y_ticks;
                    },
                },
                y1: {
                    position: "right",
                    title: {
                        display: true,
                        font: {
                            size: 14,
                            weight: "bold",
                        },
                    },
                    afterBuildTicks: (axis) => {
                        axis.ticks = [...axis.chart.scales.y.ticks];
                        axis.min = axis.chart.scales.y.min;
                        axis.max = axis.chart.scales.y.max;
                    },
                    ticks: {
                        font: {
                            size: 12,
                        },
                        color: "black",
                        // Use y_tick_labels if available, otherwise use actual values
                        callback: find_y_label,
                    },
                },
            },
        },
        plugins: [plotBackgroundPlugin, winCountPlugin], // Add both plugins
    };

    // Add datasets for each line
    if (chartData.lines) {
        const colors = getColorWheel(0.5);

        chartData.lines.forEach((line, index) => {
            const color = colors[index % colors.length];

            // Create two datasets for each line:
            // 1. A line representing the trend line based on m and b
            // 2. Individual points for the sigma values

            // 1. Create trend line dataset using y = mx + b with x_min/x_max from chart data
            const trendlineData = [];

            // Calculate the minimum x value where y won't go below min(y_ticks)
            const minYValue = Math.min(...chartData.y_ticks);
            // Solve for x: minYValue = m*x + b => x = (minYValue - b) / m
            const minAllowedX = (minYValue - line.b) / line.m;

            // Adjust min_x to ensure we don't plot y values below min(y_ticks)
            const adjustedMinX = Math.max(chartData.min_x, Math.ceil(minAllowedX));
            const adjustedMaxX = chartData.max_x;

            // Create a point at every integer x-coordinate from adjustedMinX to adjustedMaxX
            for (
                let x = Math.ceil(adjustedMinX);
                x <= Math.floor(adjustedMaxX);
                x += 1
            ) {
                trendlineData.push({
                    x: x,
                    y: line.m * x + line.b,
                });
            }

            // Always ensure the last point is exactly at max_x if it's not an integer
            if (adjustedMaxX % 1 !== 0) {
                trendlineData.push({
                    x: adjustedMaxX,
                    y: line.m * adjustedMaxX + line.b,
                });
            }

            // Always ensure the first point is exactly at min_x if it's not an integer
            if (adjustedMinX % 1 !== 0) {
                trendlineData.unshift({
                    x: adjustedMinX,
                    y: line.m * adjustedMinX + line.b,
                });
            }

            // Add the trend line dataset
            chartConfig.data.datasets.push({
                data: trendlineData,
                type: "line", // Explicitly set type
                borderColor: color,
                backgroundColor: "transparent",
                borderWidth: 5,
                pointRadius: 4, // Increased for better interaction target
                pointHoverRadius: 10, // Increased hover radius for easier hitting
                pointStyle: "circle", // Round points
                pointBackgroundColor: color,
                pointBorderColor: color, // Same color as the point to remove white border
                pointBorderWidth: 0, // No border
                hoverBorderWidth: 2,
                label: "REMOVE!",
                // Store the r_value in the dataset for tooltip access
                r_value: line.r_value,
                // Make the line interactive but only on the points
                tension: 0, // Straight line
                spanGaps: false,
                // Additional interactive options
                hoverBackgroundColor: color,
                hoverBorderColor: color, // Match the line color for border
                // Hover behavior for regression lines
                interaction: {
                    mode: "nearest",
                    intersect: true, // Require direct intersection
                    axis: "xy",
                },
                hitRadius: 20, // Added a large hit radius to make hovering easier
            });

            // 2. Add scatter points for sigma values
            const sigmaPoints = [];

            line.point_margin_data.forEach((margin) => {
                sigmaPoints.push({
                    x: margin.point_margin,
                    y: margin.sigma,
                });
            });

            // Add scatter dataset (points without connecting lines)
            // Hide this dataset from the legend by setting showInLegend to false
            chartConfig.data.datasets.push({
                type: "scatter",
                data: sigmaPoints,
                borderColor: color,
                backgroundColor: color.replace("0.5", "0.7"),
                pointStyle: "rectRounded",
                pointRadius: 8, // Size of scatter points
                pointHoverRadius: 12, // Larger hover radius
                showLine: false, // Ensure no line is drawn
                label: line.legend,
                // Hover behavior for scatter points
                interaction: {
                    mode: "nearest",
                    intersect: true, // Require direct intersection
                    axis: "xy",
                },
                hitRadius: 15, // Added hit radius to make hover detection area larger
            });
        });
    }

    return chartConfig;
}

// Helper function to determine step size based on screen width
function getStepSizeForScreenWidth() {
    // Check if mobile first using our new utility function
    if (isMobile()) {
        return 5; // Larger steps for mobile devices
    }

    // For non-mobile, check screen width for more granular control
    const width =
        window.innerWidth ||
        document.documentElement.clientWidth ||
        document.body.clientWidth;

    if (width < 400) {
        return 5; // Larger steps for very small screens
    } else if (width < 700) {
        return 2; // Medium steps for medium screens
    } else {
        return 1; // Small steps for large screens
    }
}

// Add this CSS to style the tooltip links and make them clickable
document.addEventListener("DOMContentLoaded", function () {
    const style = document.createElement("style");
    style.textContent = `
        #chartjs-tooltip {
            pointer-events: all !important;
            font-family: 'SF Pro Display', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, sans-serif;
            letter-spacing: 0.1px;
            line-height: 1.2;
            font-size: 12px;
            border: 6px solid transparent; /* Increased from 3px to 6px */
            transition: border-color 0.2s ease-in-out;
            z-index: 20000; /* Highest z-index to ensure tooltip is above everything */
        }
        #chartjs-tooltip a {
            cursor: pointer;
            display: block;
            width: 100%;
            padding: 1px 0;
            color: #78c6ff;
            transition: all 0.2s ease;
            position: relative; /* Ensure proper stacking context */
            z-index: 20001; /* Even higher z-index for links within tooltips */
        }
        #chartjs-tooltip a:hover {
            background-color: rgba(255, 255, 255, 0.08);
            color: #a8daff;
        }
        /* Position Reset Zoom button but keep it below tooltips */
        .chart-btn.reset-zoom-btn {
            position: relative;
            z-index: 10000; 
        }
        .chart-btn {
            margin: 0 2px; /* Reduced from 5px to 2px for tighter spacing */
            padding: 6px 12px;
            background-color: #f8f9fa;
            border: 1px solid #ced4da;
            border-radius: 4px;
            cursor: pointer;
            font-size: 14px;
            transition: all 0.2s ease;
        }
        .chart-btn:hover {
            background-color: #e9ecef;
        }
        /* Add styling for the chart-buttons container to ensure flex display */
        .chart-buttons {
            display: flex;
            margin: 0;
            padding: 0;
        }
    `;
    document.head.appendChild(style);
});

// Function to make buttons stay in position during zoom
function updateButtonPositions(chart) {
    const chartId = chart.canvas.id.replace("-canvas", "");
    const buttonContainer = document.querySelector(
        `#${chartId} .chart-container .chart-buttons`
    );

    if (buttonContainer && chart.chartArea) {
        // Ensure the buttons are visible
        buttonContainer.style.display = "flex";

        // Most important: position relative to the actual chart area
        const chartArea = chart.chartArea;

        // Important: get the positioning relative to the chart area, not the container
        // Calculate where to place buttons based on the actual chart area coordinates
        const distanceFromBottom = 20; // Set to 20px

        // Convert chart area coordinates to container coordinates
        // Calculate bottom position in pixels from the bottom of the container
        const bottomPosition = chart.height - chartArea.bottom + distanceFromBottom;

        // Set position relative to the actual chart (this is crucial)
        buttonContainer.style.position = "absolute";
        buttonContainer.style.bottom = `${bottomPosition}px`;
        buttonContainer.style.right = "90px"; // Keep consistent right position

        // Make buttons visible with a smooth transition once positioned
        buttonContainer.style.opacity = "0.85"; // Ensure consistent opacity during zoom
        buttonContainer.style.transition = "opacity 0.05s ease";

        // For debugging purposes only - add data attributes to see what's happening
        buttonContainer.dataset.chartAreaBottom = chartArea.bottom;
        buttonContainer.dataset.chartHeight = chart.height;
        buttonContainer.dataset.calculatedBottom = bottomPosition;
    }
}

/**
 * Creates a Chart.js chart from JSON data
 * @param {string} canvasId - The ID of the canvas element where the chart will be rendered
 * @param {object} chartData - The JSON data for the chart
 * @returns {Chart} The created Chart.js instance
 */
function createChartJSChart(canvasId, chartConfig) {
    const canvas = document.getElementById(canvasId);

    // Create the chart
    const chart = new Chart(canvas, chartConfig);

    // Add buttons to chart area after initialization
    addControlsToChartArea(canvas, chart);

    return chart;
}

const fullscreenContent =
    '<div id="lightbox-chart-container" class="lightbox-chart"></div>';
var lightboxInstance = basicLightbox.create(fullscreenContent, {
    closable: false,
    className: "nba-fullscreen-lightbox", // Add custom class for styling
});

// Function to create and add controls to the chart area
function addControlsToChartArea(canvas, chart) {
    // Create button container
    const buttonContainer = document.createElement("div");
    buttonContainer.className = "chart-buttons";
    buttonContainer.style.position = "absolute"; // Ensure absolute positioning
    buttonContainer.style.opacity = "0"; // Start invisible to avoid flashing
    buttonContainer.style.display = "flex"; // Ensure flex display
    buttonContainer.style.margin = "0"; // No margin
    buttonContainer.style.padding = "0"; // No padding

    // Only add Full Screen button if not on mobile
    if (!isMobile()) {
        // Add Full Screen button with icon
        const fullScreenButton = document.createElement("button");
        fullScreenButton.className = "chart-btn full-screen-btn";
        fullScreenButton.title = "Full Screen"; // Standard title
        fullScreenButton.setAttribute("aria-label", "Full Screen"); // Accessibility
        fullScreenButton.setAttribute("data-tooltip", "Full Screen"); // Custom tooltip
        fullScreenButton.innerHTML = '<i class="chart-icon full-screen-icon"></i>';
        fullScreenButton.setAttribute("data-fullscreen", "false"); // Track state

        function fullscreen(event) {
            chartJsToolTipClearer(event);
            // Show lightbox
            lightboxInstance.show();

            // Going into fullscreen mode
            const lightboxContent = document.getElementById("lightbox-chart-container");

            // Store original parent before moving
            var mainChartDiv = chart.canvas.parentElement.parentElement.parentElement;
            chart.mainChartDiv = mainChartDiv;

            // Store original dimensions to restore them later
            const chartContainer = chart.canvas.parentElement;
            chart.originalWidth = chartContainer.style.width;
            chart.originalHeight = chartContainer.style.height;
            chart.originalMaxWidth = chartContainer.style.maxWidth;
            chart.originalMaxHeight = chartContainer.style.maxHeight;

            // Move the canvas to lightbox
            var parentChartDiv = chart.canvas.parentElement.parentElement;
            chart.parentChartDiv = parentChartDiv;
            lightboxContent.appendChild(parentChartDiv);

            // Set fullscreen dimensions
            chartContainer.style.width = "95%";
            chartContainer.style.height = "90vh";
            chartContainer.style.maxWidth = "95%";
            chartContainer.style.maxHeight = "90vh";

            // Resize chart to fit new container
            chart.resize();

            // Update button state
            fullScreenButton.innerHTML =
                '<i class="chart-icon exit-full-screen-icon"></i>';
            fullScreenButton.setAttribute("data-tooltip", "Exit Full Screen");
            fullScreenButton.setAttribute("data-fullscreen", "true");
            fullScreenButton.onclick = exitFullScreen;
        }

        function exitFullScreen(event) {
            chartJsToolTipClearer(event);

            // Close lightbox
            fullScreenButton.innerHTML = '<i class="chart-icon full-screen-icon"></i>';
            fullScreenButton.setAttribute("data-tooltip", "Full Screen");
            fullScreenButton.setAttribute("data-fullscreen", "false");
            fullScreenButton.onclick = fullscreen;
            lightboxInstance.close();

            // Restore chart to original parent
            chart.mainChartDiv.appendChild(chart.parentChartDiv);

            // Restore original dimensions
            const chartContainer = chart.canvas.parentElement;
            chartContainer.style.width = chart.originalWidth || "";
            chartContainer.style.height = chart.originalHeight || "";
            chartContainer.style.maxWidth = chart.originalMaxWidth || "";
            chartContainer.style.maxHeight = chart.originalMaxHeight || "";

            // Resize chart to fit original container
            chart.resize();
        }

        fullScreenButton.onclick = fullscreen;

        // Setup ESC key handler
        const handleEscKey = function (e) {
            if (e.key === "Escape" && lightboxInstance) {
                exitFullScreen(e);
                document.removeEventListener("keydown", handleEscKey);
            }
        };

        document.addEventListener("keydown", handleEscKey);

        buttonContainer.appendChild(fullScreenButton);
    }

    // Add Reset Zoom button with icon
    const resetButton = document.createElement("button");
    resetButton.className = "chart-btn reset-zoom-btn";
    resetButton.title = "Reset Zoom"; // Standard title (may be hidden by some browsers/CSS)
    resetButton.setAttribute("aria-label", "Reset Zoom"); // Accessibility
    resetButton.setAttribute("data-tooltip", "Reset Zoom"); // Custom tooltip
    resetButton.innerHTML = '<i class="chart-icon zoom-reset-icon"></i>';
    resetButton.onclick = function (event) {
        // Prevent default to ensure no link behaviors interfere
        chartJsToolTipClearer(event);
        // Reset zoom
        chart.resetZoom();
        return false;
    };
    buttonContainer.appendChild(resetButton);

    // Add Save As PNG button with icon
    const saveButton = document.createElement("button");
    saveButton.className = "chart-btn save-png-btn";
    saveButton.title = "Save as PNG"; // Standard title (may be hidden by some browsers/CSS)
    saveButton.setAttribute("aria-label", "Save as PNG"); // Accessibility
    saveButton.setAttribute("data-tooltip", "Save as PNG"); // Custom tooltip
    saveButton.innerHTML = '<i class="chart-icon save-png-icon"></i>';
    saveButton.onclick = function (event) {
        // Prevent default to ensure no link behaviors interfere
        chartJsToolTipClearer(event);
        // Get chart ID from canvas ID and save the chart
        const chartId = canvas.id.replace("-canvas", "");
        saveChart(canvas);
        return false;
    };
    buttonContainer.appendChild(saveButton);

    // Add the button container to the chart container
    const chartContainer = canvas.parentElement;
    chartContainer.appendChild(buttonContainer);

    // Set an initial position - will be corrected by updateButtonPositions
    buttonContainer.style.position = "absolute";
    buttonContainer.style.bottom = "30px"; // Just a placeholder, updateButtonPositions will set the proper value
    buttonContainer.style.right = "90px";
    // Don't set display:flex or opacity yet - wait until updateButtonPositions is called

    updateButtonPositions(chart);

    // Also update button positions whenever the window is resized
    window.addEventListener("resize", () => {
        updateButtonPositions(chart);
    });
}
