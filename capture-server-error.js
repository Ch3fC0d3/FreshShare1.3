// Script to capture detailed server error information
const fs = require('fs');
const { spawn } = require('child_process');

// Create a file stream to capture the error output
const errorLogFile = fs.createWriteStream('./server-error-log.txt', { flags: 'w' });

console.log('Starting server with error logging...');

// Spawn the server process
const serverProcess = spawn('node', ['server.js'], {
  stdio: ['inherit', 'pipe', 'pipe'] // Pipe stdout and stderr to our handler
});

// Capture and log stdout
serverProcess.stdout.on('data', (data) => {
  const text = data.toString();
  console.log(text); // Display in console
  errorLogFile.write(`[STDOUT] ${text}`); // Write to file
});

// Capture and log stderr
serverProcess.stderr.on('data', (data) => {
  const errorText = data.toString();
  console.error(errorText); // Display in console
  errorLogFile.write(`[STDERR] ${errorText}`); // Write to file
});

// Handle process exit
serverProcess.on('close', (code) => {
  console.log(`Server process exited with code ${code}`);
  errorLogFile.end();
  console.log('Error log saved to server-error-log.txt');
});
