// Script to capture detailed error information
const fs = require('fs');
const { spawn } = require('child_process');

// Create a file stream to capture the error output
const errorLogFile = fs.createWriteStream('./error-log.txt', { flags: 'w' });

console.log('Starting server with error logging...');

// Spawn the server process
const serverProcess = spawn('node', ['fixed-server.js'], {
  stdio: ['inherit', 'inherit', 'pipe'] // Pipe stderr to our handler
});

// Capture and log stderr
serverProcess.stderr.on('data', (data) => {
  const errorText = data.toString();
  console.error(errorText); // Display in console
  errorLogFile.write(errorText); // Write to file
});

// Handle process exit
serverProcess.on('close', (code) => {
  console.log(`Server process exited with code ${code}`);
  errorLogFile.end();
  console.log('Error log saved to error-log.txt');
});
