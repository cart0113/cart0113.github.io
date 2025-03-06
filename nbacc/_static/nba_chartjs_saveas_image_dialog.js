
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

