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
            enabled: true,
        },
        pinch: {
            enabled: true,
            backgroundColor: "rgba(109, 102, 102, 0.3)",
            borderColor: "rgba(225,225,225,0.6)",
            borderWidth: 1,
            threshold: 10,
        },
        mode: "xy",
    },
};

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

// Format the NBA data JSON structure for Chart.js
function formatDataForChartJS(chartData) {
    var N = chartData.y_ticks.length;

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
                        ctx.font = "900 14px Arial"; // Increased weight to 900 (extra bold) and size to 15px
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
                tooltipEl.setAttribute("data-sticky", "true");
            });

            tooltipEl.addEventListener("mouseleave", () => {
                tooltipEl.setAttribute("data-sticky", "false");
                // Hide tooltip when mouse leaves if not interacting with links
                if (tooltipEl.opacity !== 0 && !tooltipEl.querySelector(":hover")) {
                    tooltipEl.style.opacity = 0;
                }
            });
        }

        // If sticky and mouse is over tooltip, don't hide it
        if (
            tooltipEl.getAttribute("data-sticky") === "true" &&
            tooltipEl.matches(":hover")
        ) {
            return;
        }

        // Hide if no tooltip
        const tooltipModel = context.tooltip;
        if (
            tooltipModel.opacity === 0 &&
            tooltipEl.getAttribute("data-sticky") !== "true"
        ) {
            tooltipEl.style.opacity = 0;
            return;
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
                    <th style="color:#f2f2f2; font-weight:bold; padding:4px; position:relative; font-size:13px;">
                        ${titleLines[0] || ""}
                        <span class="tooltip-close" style="position:absolute; right:2px; top:2px; 
                            cursor:pointer; width:18px; height:18px; text-align:center; 
                            line-height:18px; color:#f2f2f2; background:rgba(255,255,255,0.15); 
                            border-radius:50%;">×</span>
                    </th>
                </tr>`;
            innerHtml += "</thead><tbody>";

            // Special handling for our custom content
            const datasetIndex = tooltipModel.dataPoints[0].datasetIndex;
            const index = tooltipModel.dataPoints[0].dataIndex;
            const dataset = context.chart.data.datasets[datasetIndex];

            // Only show for scatter points, not trend lines
            if (dataset.type === "scatter") {
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
                            const gameUrl = `http://www.nba.com/games/${game.game_id}`;
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
                closeBtn.addEventListener("click", (e) => {
                    e.stopPropagation();
                    tooltipEl.style.opacity = 0;
                    tooltipEl.setAttribute("data-sticky", "false");
                });
            }
        }

        // Get the color of the hovered data point
        let borderColor = "rgba(255, 255, 255, 0.6)"; // Default fallback color

        // Try to get the actual color of the dataset
        if (tooltipModel.dataPoints && tooltipModel.dataPoints.length > 0) {
            const datasetIndex = tooltipModel.dataPoints[0].datasetIndex;
            const dataset = context.chart.data.datasets[datasetIndex];

            // Use the background color or border color of the dataset
            if (dataset.backgroundColor) {
                // For scatter plots (points), use backgroundColor - make it more opaque
                if (
                    typeof dataset.backgroundColor === "string" &&
                    dataset.backgroundColor.includes("rgba")
                ) {
                    // If it's a semi-transparent color, make it more opaque for the border
                    borderColor = dataset.backgroundColor.replace(
                        /rgba\((\d+),\s*(\d+),\s*(\d+),\s*[\d\.]+\)/,
                        "rgba($1, $2, $3, 0.9)"
                    );
                } else {
                    borderColor = dataset.backgroundColor;
                }
            } else if (dataset.borderColor) {
                borderColor = dataset.borderColor;
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
        tooltipEl.style.borderRadius = "10px"; // More rounded corners (increased from 6px)
        tooltipEl.style.maxWidth = "500px";
        tooltipEl.style.minWidth = "300px";
        tooltipEl.style.zIndex = 1000;
        tooltipEl.style.boxShadow = "0px 3px 15px rgba(0,0,0,0.3)";
        tooltipEl.style.borderWidth = "6px"; // Increased from 3px to 6px
        tooltipEl.style.borderStyle = "solid";
        tooltipEl.style.borderColor = borderColor; // Use the dataset color
    };

    const chartConfig = {
        type: "line",
        data: {
            datasets: [],
        },
        options: {
            responsive: true,
            plugins: {
                title: {
                    display: true,
                    text: chartData.title,
                    font: {
                        size: 20,
                        weight: "bold",
                    },
                },
                legend: {
                    display: true,
                    position: "top",
                    labels: {
                        usePointStyle: true,
                        filter: function (item, chart) {
                            // Logic to remove a particular legend item goes here
                            return !item.text.includes("REMOVE!");
                        },
                    },
                },
                tooltip: {
                    enabled: false, // Disable the built-in tooltips
                    external: externalTooltipHandler, // Use our custom tooltip handler
                    callbacks: {
                        // Title callback still used by external handler
                        title: function (tooltipItems) {
                            const datasetIndex = tooltipItems[0].datasetIndex;
                            const index = tooltipItems[0].dataIndex;
                            const dataset =
                                tooltipItems[0].chart.data.datasets[datasetIndex];

                            // Skip if this is a trend line dataset (not a scatter)
                            if (dataset.type !== "scatter") {
                                return "";
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

                            // Format win statistics with new win percentage
                            return `Wins: ${pointData.win_count}/${
                                pointData.total_count
                            } | Win Percent ${winPercent}% | Deficit Frequency: ${(
                                pointData.point_margin_percent * 100
                            ).toFixed(2)}%`;
                        },
                    },
                },
                zoom: zoomOptions,
            },
            scales: {
                x0: {
                    type: "linear",
                    min: Math.min(...chartData.x_ticks),
                    max: Math.max(...chartData.x_ticks),
                    ticks: {
                        stepSize: 2,
                        font: {
                            size: 12,
                        },
                        color: "black",
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
                        axis.chart.scales.x1.min = axis.min;
                        axis.chart.scales.x1.max = axis.max;
                        axis.chart.scales.x1.ticks = axis.ticks;
                    },
                },
                x1: {
                    type: "linear",
                    position: "top",
                    // ticks: {
                    //     //min: Math.min(...chartData.x_ticks) - 2,
                    //     //max: Math.max(...chartData.x_ticks) + 2,
                    //     stepSize: 1,
                    //     font: {
                    //         size: 12,
                    //     },
                    //     color: "black",
                    // },
                    // grid: {
                    //     display: true,
                    //     drawOnChartArea: true,
                    //     drawTicks: true,
                    //     lineWidth: 2,
                    //     color: "rgba(147, 149, 149, 0.25)",
                    // },
                },
                y: {
                    type: "linear",
                    min: Math.min(...chartData.y_ticks) - 0.2,
                    max: Math.max(...chartData.y_ticks) + 0.2,
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
                        // Only draw grid lines at the y_ticks values
                        // callback: function (value) {
                        //     return chartData.y_ticks.includes(value);
                        // },
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
        const colors = [
            "rgba(58, 129, 210, 0.5)", // Blue
            "rgba(255, 160, 64, 0.5)", // Orange
            "rgba(255, 99, 132, 0.5)", // Red
            "rgba(255, 206, 86, 0.5)", // Yellow
            "rgba(75, 192, 192, 0.5)", // Green
            "rgba(153, 102, 255, 0.5)", // Purple
            "rgba(199, 199, 199, 0.5)", // Gray
        ];

        chartData.lines.forEach((line, index) => {
            const color = colors[index % colors.length];

            // Create two datasets for each line:
            // 1. A line representing the trend line based on m and b
            // 2. Individual points for the sigma values

            // 1. Create trend line dataset using y = mx + b
            let trendlineData = [];
            // Sort point margins to ensure the line is drawn correctly
            const sortedMargins = [...line.point_margins].sort((a, b) => a - b);
            sortedMargins.forEach((margin) => {
                trendlineData.push({
                    x: margin,
                    y: line.m * margin + line.b,
                });
            });

            // Add the trend line dataset
            chartConfig.data.datasets.push({
                data: trendlineData,
                borderColor: color,
                backgroundColor: "transparent",
                borderWidth: 5,
                pointRadius: 0, // No points on the line
                label: "REMOVE!",
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
                pointRadius: 11, // Increased from 10 to 12
                pointHoverRadius: 13, // Increased from 12 to 14
                showLine: false, // Ensure no line is drawn
                label: line.legend,
            });
        });
    }

    return chartConfig;
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
    return chart;
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
        }
        #chartjs-tooltip a {
            cursor: pointer;
            display: block;
            width: 100%;
            padding: 1px 0;
            color: #78c6ff;
            transition: all 0.2s ease;
        }
        #chartjs-tooltip a:hover {
            background-color: rgba(255, 255, 255, 0.08);
            color: #a8daff;
        }
        #chartjs-tooltip table {
            width: 100%;
            border-collapse: collapse;
            border-spacing: 0;
        }
        #chartjs-tooltip td {
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
            max-width: 470px; /* Allow for some padding */
            line-height: 1.1;
            font-size: 12px;
            padding: 1px 0;
        }
        #chartjs-tooltip th {
            padding: 3px 4px;
            font-size: 13px;
        }
        #chartjs-tooltip th, #chartjs-tooltip td {
            color: #f2f2f2;
        }
        #chartjs-tooltip b {
            color: #ffffff;
            font-size: 12px;
        }
        .tooltip-close {
            opacity: 0.7;
            transition: all 0.2s ease;
        }
        .tooltip-close:hover {
            background: rgba(255,255,255,0.25) !important;
            opacity: 1;
        }
    `;
    document.head.appendChild(style);
});
