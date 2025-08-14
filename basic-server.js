// Most basic Express server possible
const express = require('express');
const app = express();
const PORT = 3001;

// Basic route
app.get('/', (req, res) => {
  res.send('Basic server is working!');
});

// Start server
app.listen(PORT, () => {
  console.log(`Basic server is running on http://localhost:${PORT}`);
});
