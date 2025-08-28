const express = require('express');
const path = require('path');
const expressLayouts = require('express-ejs-layouts');

const app = express();
const PORT = 3002;

// Set global template variables
app.locals.baseUrl = '';
app.locals.title = 'FreshShare';

// Set view engine
app.use(expressLayouts);
app.set('view engine', 'ejs');
app.set('layout', 'layouts/layout');

// Serve static files
app.use(express.static(path.join(__dirname, 'public')));

// Simulate MongoDB down state
app.use((req, res, next) => {
  if (req.path.startsWith('/api/')) {
    return res.status(503).json({
      success: false,
      message: 'Database service temporarily unavailable',
    });
  }

  if (
    !req.path.startsWith('/css/') &&
    !req.path.startsWith('/js/') &&
    !req.path.startsWith('/images/')
  ) {
    return res.render('pages/maintenance', {
      title: 'FreshShare - Maintenance',
      baseUrl: '',
      error: 'Database connection is currently unavailable. Please try again later.',
    });
  }
  return next();
});

app.listen(PORT, () => {
  console.log(`Test server running at http://localhost:${PORT}`);
});
