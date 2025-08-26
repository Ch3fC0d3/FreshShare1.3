const express = require('express');
const path = require('path');
const app = express();

// Parse command line arguments
const args = process.argv.slice(2);
let baseUrlArg = '';
let testModeArg = 'static';
let portArg = 3002;

// Parse command line arguments
args.forEach(arg => {
  if (arg.startsWith('--baseUrl=')) {
    baseUrlArg = arg.split('=')[1];
  } else if (arg.startsWith('--testMode=')) {
    testModeArg = arg.split('=')[1];
  } else if (arg.startsWith('--port=')) {
    portArg = parseInt(arg.split('=')[1]);
  }
});

// Fallback to environment variables if args not provided
const PORT = process.env.PORT || portArg;
const baseUrl = process.env.BASE_URL || baseUrlArg;
const TEST_MODE = process.env.TEST_MODE || testModeArg; // 'static', 'templates', or 'full'

app.locals.baseUrl = baseUrl;

// Middleware for logging
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} ${req.method} ${req.url}`);
  next();
});

// Make baseUrl available to all templates
app.use((req, res, next) => {
  res.locals.baseUrl = baseUrl;
  next();
});

// If baseUrl is set, mount the app at the baseUrl path
if (baseUrl) {
  console.log(`Using baseUrl: ${baseUrl}`);
  // Serve static assets without the baseUrl prefix
  const staticHandler = express.static(path.join(__dirname, 'public'), {
    setHeaders: (res, filePath) => setContentType(res, filePath)
  });
  
  const staticHandlerFallback = express.static(path.join(__dirname, 'public_html'), {
    setHeaders: (res, filePath) => setContentType(res, filePath)
  });
  
  // Serve static files at both /baseUrl/path and /path
  app.use(baseUrl, staticHandler);
  app.use(baseUrl, staticHandlerFallback);
  app.use(staticHandler);
  app.use(staticHandlerFallback);
} else {
  console.log('Using root path (no baseUrl)');
}

// Helper function to set content type headers
function setContentType(res, filePath) {
  if (filePath.endsWith('.css')) {
    res.setHeader('Content-Type', 'text/css');
  } else if (filePath.endsWith('.js')) {
    res.setHeader('Content-Type', 'application/javascript');
  } else if (filePath.endsWith('.jpg') || filePath.endsWith('.jpeg')) {
    res.setHeader('Content-Type', 'image/jpeg');
  } else if (filePath.endsWith('.png')) {
    res.setHeader('Content-Type', 'image/png');
  }
}

// Only set up static file serving if not already set up with baseUrl
if (!baseUrl) {
  // Serve static files with proper MIME types
  app.use(express.static(path.join(__dirname, 'public'), {
    setHeaders: (res, filePath) => setContentType(res, filePath)
  }));

  // Fallback to public_html
  app.use(express.static(path.join(__dirname, 'public_html'), {
    setHeaders: (res, filePath) => setContentType(res, filePath)
  }));
}

// Set up view engine if testing templates
if (TEST_MODE === 'templates' || TEST_MODE === 'full') {
  app.set('view engine', 'ejs');
  app.set('views', path.join(__dirname, 'views'));
}

// Simple HTML test page for static files
app.get('/', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>FreshShare Test Server</title>
      <link rel="stylesheet" href="${baseUrl}/css/main.css">
      <link rel="stylesheet" href="${baseUrl}/css/color-system.css">
      <style>
        body { font-family: Arial, sans-serif; max-width: 1200px; margin: 0 auto; padding: 20px; }
        .nav { background: #f0f0f0; padding: 10px; margin-bottom: 20px; }
        .nav a { margin-right: 15px; }
        .test-section { border: 1px solid #ddd; padding: 15px; margin-bottom: 20px; }
        .test-result { padding: 10px; background: #f9f9f9; border-left: 4px solid #007bff; }
        .code { background: #f5f5f5; padding: 10px; border: 1px solid #ddd; font-family: monospace; }
      </style>
    </head>
    <body>
      <h1>FreshShare Test Server</h1>
      <div class="nav">
        <a href="${baseUrl}/">Home</a>
        <a href="${baseUrl}/static-test">Static Files</a>
        ${TEST_MODE !== 'static' ? `<a href="${baseUrl}/template-test">Template Test</a>` : ''}
        ${TEST_MODE === 'full' ? `<a href="${baseUrl}/page-test">Page Links</a>` : ''}
      </div>
      
      <div class="test-section">
        <h2>Configuration</h2>
        <div class="test-result">
          <p><strong>Base URL:</strong> ${baseUrl || '/'} (${baseUrl ? 'subdirectory mode' : 'root mode'})</p>
          <p><strong>Test Mode:</strong> ${TEST_MODE}</p>
          <p><strong>Server URL:</strong> http://localhost:${PORT}${baseUrl}</p>
        </div>
        
        <h3>Usage Instructions</h3>
        <p>Start the server with different configurations to test path handling:</p>
        <div class="code">
          # Test with root URL
          node test-server.js
          
          # Test with subdirectory
          BASE_URL=/freshshare node test-server.js
          
          # Test with templates
          TEST_MODE=templates BASE_URL=/freshshare node test-server.js
          
          # Full testing mode
          TEST_MODE=full BASE_URL=/freshshare node test-server.js
        </div>
      </div>
      
      <div class="test-section">
        <h2>Quick Links</h2>
        <ul>
          <li><a href="${baseUrl}/css/main.css">main.css</a></li>
          <li><a href="${baseUrl}/css/color-system.css">color-system.css</a></li>
          <li><a href="${baseUrl}/js/css-fix.js">css-fix.js</a></li>
          <li><a href="${baseUrl}/images/create-group.jpg">create-group.jpg</a></li>
        </ul>
      </div>
    </body>
    </html>
  `);
});

// Static files test page
app.get('/static-test', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Static Files Test</title>
      <link rel="stylesheet" href="${baseUrl}/css/main.css">
      <link rel="stylesheet" href="${baseUrl}/css/color-system.css">
      <style>
        body { font-family: Arial, sans-serif; max-width: 1200px; margin: 0 auto; padding: 20px; }
        .test-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 20px; }
        .test-item { border: 1px solid #ddd; padding: 10px; }
        .nav { background: #f0f0f0; padding: 10px; margin-bottom: 20px; }
        .nav a { margin-right: 15px; }
      </style>
    </head>
    <body>
      <div class="nav">
        <a href="${baseUrl}/">Home</a>
        <a href="${baseUrl}/static-test">Static Files</a>
        ${TEST_MODE !== 'static' ? `<a href="${baseUrl}/template-test">Template Test</a>` : ''}
        ${TEST_MODE === 'full' ? `<a href="${baseUrl}/page-test">Page Links</a>` : ''}
      </div>
      <h1>Static Files Test</h1>
      <p>Testing static file serving with baseUrl: <strong>${baseUrl || '/'}</strong></p>
      
      <h2>CSS Files</h2>
      <ul>
        <li><a href="${baseUrl}/css/main.css">main.css</a></li>
        <li><a href="${baseUrl}/css/color-system.css">color-system.css</a></li>
        <li><a href="${baseUrl}/css/components/forms.css">forms.css</a></li>
      </ul>
      
      <h2>JavaScript Files</h2>
      <ul>
        <li><a href="${baseUrl}/js/css-fix.js">css-fix.js</a></li>
        <li><a href="${baseUrl}/js/auth.js">auth.js</a></li>
        <li><a href="${baseUrl}/js/header.js">header.js</a></li>
      </ul>
      
      <h2>Images</h2>
      <div class="test-grid">
        <div class="test-item">
          <a href="${baseUrl}/images/create-group.jpg">
            <img src="${baseUrl}/images/create-group.jpg" alt="Create Group" width="100%">
          </a>
          <p>create-group.jpg</p>
        </div>
        <div class="test-item">
          <a href="${baseUrl}/images/coordinate.jpg">
            <img src="${baseUrl}/images/coordinate.jpg" alt="Coordinate" width="100%">
          </a>
          <p>coordinate.jpg</p>
        </div>
        <div class="test-item">
          <a href="${baseUrl}/images/share.jpg">
            <img src="${baseUrl}/images/share.jpg" alt="Share" width="100%">
          </a>
          <p>share.jpg</p>
        </div>
      </div>
      
      <script>
        // Check if assets loaded properly
        window.addEventListener('load', function() {
          const images = document.querySelectorAll('img');
          let allLoaded = true;
          
          images.forEach(img => {
            if (!img.complete || img.naturalHeight === 0) {
              allLoaded = false;
              console.error('Image failed to load:', img.src);
            }
          });
          
          if (allLoaded) {
            console.log('All assets loaded successfully!');
            document.body.insertAdjacentHTML('beforeend', 
              '<div style="padding: 15px; background: #dff0d8; margin-top: 20px; border-left: 4px solid #5cb85c;">' +
              '<strong>Success!</strong> All static assets loaded correctly.' +
              '</div>'
            );
          } else {
            document.body.insertAdjacentHTML('beforeend', 
              '<div style="padding: 15px; background: #f2dede; margin-top: 20px; border-left: 4px solid #d9534f;">' +
              '<strong>Error!</strong> Some static assets failed to load. Check console for details.' +
              '</div>'
            );
          }
        });
      </script>
    </body>
    </html>
  `);
});

// Only add template test routes if in templates or full mode
if (TEST_MODE === 'templates' || TEST_MODE === 'full') {
  // Template test page
  app.get('/template-test', (req, res) => {
    res.render('layouts/layout', {
      baseUrl: res.locals.baseUrl,
      title: 'Template Test',
      content: 'Test content rendered through EJS template',
      body: 'partials/header',
      script: ''
    });
  });

  // Add full page tests if in full mode
  if (TEST_MODE === 'full') {
    app.get('/page-test', (req, res) => {
      res.send(`
        <!DOCTYPE html>
        <html lang="en">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Page Links Test</title>
          <link rel="stylesheet" href="${baseUrl}/css/main.css">
          <style>
            body { font-family: Arial, sans-serif; max-width: 1200px; margin: 0 auto; padding: 20px; }
            .nav { background: #f0f0f0; padding: 10px; margin-bottom: 20px; }
            .nav a { margin-right: 15px; }
            .page-link { display: block; padding: 10px; margin: 5px 0; background: #f9f9f9; }
          </style>
        </head>
        <body>
          <div class="nav">
            <a href="${baseUrl}/">Home</a>
            <a href="${baseUrl}/static-test">Static Files</a>
            <a href="${baseUrl}/template-test">Template Test</a>
            <a href="${baseUrl}/page-test">Page Links</a>
          </div>
          <h1>Page Links Test</h1>
          <p>Click on the links below to test navigation with baseUrl: <strong>${baseUrl || '/'}</strong></p>
          
          <h2>Main Pages</h2>
          <a href="${baseUrl}/" class="page-link">Home</a>
          <a href="${baseUrl}/login" class="page-link">Login</a>
          <a href="${baseUrl}/signup" class="page-link">Signup</a>
          <a href="${baseUrl}/dashboard" class="page-link">Dashboard</a>
          <a href="${baseUrl}/groups" class="page-link">Groups</a>
          <a href="${baseUrl}/create-group" class="page-link">Create Group</a>
          <a href="${baseUrl}/marketplace" class="page-link">Marketplace</a>
          <a href="${baseUrl}/about" class="page-link">About</a>
          <a href="${baseUrl}/contact" class="page-link">Contact</a>
          
          <h2>API Endpoints</h2>
          <a href="${baseUrl}/api/auth/profile" class="page-link">Auth Profile API</a>
          <a href="${baseUrl}/api/groups" class="page-link">Groups API</a>
          <a href="${baseUrl}/api/marketplace" class="page-link">Marketplace API</a>
        </body>
        </html>
      `);
    });
  }
}

app.listen(PORT, () => {
  console.log(`Test server running on http://localhost:${PORT}${baseUrl}`);
  console.log(`Test mode: ${TEST_MODE}`);
  console.log(`BaseURL: ${baseUrl || '/'} (${baseUrl ? 'subdirectory mode' : 'root mode'})`);
  console.log(`Static files served from: ${path.join(__dirname, 'public')} (primary) and ${path.join(__dirname, 'public_html')} (fallback)`);
  console.log(`Use CTRL+C to stop the server`);
});
