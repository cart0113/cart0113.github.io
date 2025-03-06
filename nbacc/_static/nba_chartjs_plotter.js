
// Function to convert canvas to blob
// Function to convert canvas to blob with padding
function canvasToBlob(canvas, padding = 30) {
  return new Promise((resolve) => {
      // Create temporary canvas with padding
      const tempCanvas = document.createElement('canvas');
      // Add padding to both width and height (padding on both sides)
      tempCanvas.width = canvas.width + (padding * 4);
      tempCanvas.height = canvas.height + (padding * 2);
      
      // Get context and fill with white background
      const tempCtx = tempCanvas.getContext('2d');
      tempCtx.fillStyle = 'white';
      tempCtx.fillRect(0, 0, tempCanvas.width, tempCanvas.height);
      
      // Draw original canvas with offset for padding
      tempCtx.drawImage(canvas, 2 * padding, padding);
      
      // Convert to blob
      tempCanvas.toBlob((blob) => {
          resolve(blob);
      }, 'image/png');
  });
}
// Function to save the chart with file picker
async function saveChart() {
  try {
      // Generate default filename with timestamp
      const timestamp = new Date().toISOString().replace(/[:]/g, '-').split('.')[0];
      const defaultFilename = `chart_${timestamp}.png`;

      // Show the file picker
      const handle = await window.showSaveFilePicker({
          suggestedName: defaultFilename,
          types: [{
              description: 'PNG Image',
              accept: {
                  'image/png': ['.png'],
              },
          }],
      });

      // Convert canvas to blob
      const blob = await canvasToBlob(document.getElementById('myChart'));

      // Create a FileSystemWritableFileStream
      const writable = await handle.createWritable();

      // Write the blob to the file
      await writable.write(blob);

      // Close the file
      await writable.close();

  } catch (err) {
      // Handle user cancellation or errors
      if (err.name !== 'AbortError') {
          console.error('Error saving file:', err);
          alert('Error saving file. Please try again.');
      }
  }
}

const data = {
  labels: ['Day 1', 'Day 2', 'Day 3', 'Day 4', 'Day 5', 'Day 6'],
  datasets: [
    {
      label: 'Dataset',
      data: [1, 2, 3, 4, 5, 6],
      borderColor: 'rgba(55, 128, 191, 0.5)',
      backgroundColor: 'rgba(55, 128, 191, 0.5)',
      pointStyle: 'rectRounded',
      pointRadius: 10,
      pointHoverRadius: 12,
    }
  ]
};

function externalTooltip(context) {
  // Tooltip Element
  let tooltipEl = document.getElementById('chartjs-tooltip');

  // Create element on first render
  if (!tooltipEl) {
      tooltipEl = document.createElement('div');
      tooltipEl.id = 'chartjs-tooltip';
      tooltipEl.innerHTML = '<table></table>';
      document.body.appendChild(tooltipEl);
  }

  // Hide if no tooltip
  const tooltipModel = context.tooltip;
  if (tooltipModel.opacity === 0) {
      tooltipEl.style.opacity = 0;
      return;
  }

  // Set caret Position
  tooltipEl.classList.remove('above', 'below', 'no-transform');
  if (tooltipModel.yAlign) {
      tooltipEl.classList.add(tooltipModel.yAlign);
  } else {
      tooltipEl.classList.add('no-transform');
  }

  function getBody(bodyItem) {
      return bodyItem.lines;
  }

  // Set Text
  if (tooltipModel.body) {
      const titleLines = tooltipModel.title || [];
      const bodyLines = tooltipModel.body.map(getBody);

      let innerHtml = '<thead>';

      titleLines.forEach(function(title) {
          innerHtml += '<tr><th>' + title + '</th></tr>';
      });
      innerHtml += '</thead><tbody>';

      bodyLines.forEach(function(body, i) {
          const colors = tooltipModel.labelColors[i];
          let style = 'background:' + colors.backgroundColor;
          style += '; border-color:' + colors.borderColor;
          style += '; border-width: 2px';
          const span = '<span style="' + style + '">' + body + '</span>';
          innerHtml += '<tr><td>' + span + '</td></tr>';
      });
      innerHtml += '</tbody>';

      let tableRoot = tooltipEl.querySelector('table');
      tableRoot.innerHTML = "HI";  //innerHtml;
  }

  const position = context.chart.canvas.getBoundingClientRect();
  const bodyFont = Chart.helpers.toFont(tooltipModel.options.bodyFont);

  // Display, position, and set styles for font
  tooltipEl.style.opacity = 1;
  tooltipEl.style.position = 'absolute';
  tooltipEl.style.left = position.left + window.pageXOffset + tooltipModel.caretX + 'px';
  tooltipEl.style.top = position.top + window.pageYOffset + tooltipModel.caretY + 'px';
  tooltipEl.style.font = bodyFont.string;
  tooltipEl.style.padding = tooltipModel.padding + 'px ' + tooltipModel.padding + 'px';
  tooltipEl.style.pointerEvents = 'none';
}


const zoomOptions = {
  //pan: {
  //  enabled: true,
  //  modifierKey: 'ctrl',
  //},
  zoom: {
    drag: {
      enabled: true
    },
    wheel: {
      enabled: true,
    },
    pinch: {
      enabled: true
    },  
    mode: 'xy',
  },
};
// </block>

const panStatus = () => zoomOptions.pan.enabled ? 'enabled' : 'disabled';
const zoomStatus = () => zoomOptions.zoom.drag.enabled ? 'enabled' : 'disabled';

const config = {
  type: 'line',
  data: data,
  options: {
    responsive: true,
    plugins: {
      title: {
        display: true,
        text: (ctx) => 'Point Style: ' + ctx.chart.data.datasets[0].pointStyle,
      },
      tooltip: {
        enabled: false,
        external: externalTooltip,
      },
      zoom: zoomOptions,
    },
    scales: {
        y: {
          position: "left",
        },
        y1: {
          position: "right",
          afterBuildTicks: (axis) => {
            axis.ticks = [...axis.chart.scales.y.ticks];
            axis.min = axis.chart.scales.y.min;
            axis.max = axis.chart.scales.y.max;
        },
      },
    },
  },
};



window.onload = function() {
  const ctx = document.getElementById('myChart');
  var chart = new Chart(ctx, config);

  // Add key press event listener to the canvas
  const myDiv = document.getElementById('myChartDiv');
  myDiv.tabIndex = 0; // Make the div focusable
  myDiv.addEventListener('keydown', function (event) {
      if (event.key === 'f') {
        // Fire desired callback when 'f' is pressed
        chart.resetZoom();
          // Add your custom callback logic here
      }
  });
  myDiv.addEventListener('dblclick', function(event) {
    chart.resetZoom();
  });


  $("#buttonReset").on("click", function () {
    chart.resetZoom();  
  });

  $("#buttonSave").on("click", saveChart);

};
