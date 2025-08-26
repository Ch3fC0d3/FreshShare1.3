# baseUrl Configuration Guide

## Overview

This document outlines the implementation and usage of the `baseUrl` variable throughout the FreshShare application, which enables the application to be hosted at different URL paths without breaking links and assets.

## Why `baseUrl` Is Important

Using a configurable `baseUrl` provides several benefits:

1. **Flexible Deployment**: The application can be deployed at different URL paths (root path `/` or subpaths like `/freshshare`)
2. **Consistent Links**: All internal links, redirects, and API endpoints work correctly regardless of deployment path
3. **Asset Loading**: Images, CSS, and JavaScript files load properly without 404 errors
4. **Proxy Support**: Works correctly when deployed behind proxies or load balancers

## Server-Side Implementation

### Configuration in server.js

The `baseUrl` is configured in `server.js` as follows:

```javascript
// Base URL configuration - allows deployment in subdirectories
const baseUrl = process.env.BASE_URL || '';
app.locals.baseUrl = baseUrl;

// Make baseUrl available to all views
app.use((req, res, next) => {
  res.locals.baseUrl = baseUrl;
  next();
});
```

### Route Configuration

All routes in Express should use the `baseUrl` when rendering views:

```javascript
app.get('/route-path', (req, res) => {
  res.render('page-template', { 
    baseUrl: res.locals.baseUrl,
    // other variables 
  });
});
```

## Client-Side Implementation

### EJS Templates

#### Links and Form Actions

All links and form actions should use the `baseUrl` variable:

```html
<!-- Navigation links -->
<a href="<%= baseUrl %>/dashboard">Dashboard</a>

<!-- Form submissions -->
<form action="<%= baseUrl %>/api/auth/login" method="POST">
  <!-- form fields -->
</form>
```

#### Image and Asset Sources

```html
<!-- Images -->
<img src="<%= baseUrl %>/images/logo.png" alt="Logo">

<!-- Stylesheets -->
<link rel="stylesheet" href="<%= baseUrl %>/css/styles.css">

<!-- Scripts -->
<script src="<%= baseUrl %>/js/app.js"></script>
```

### JavaScript Files

In JavaScript files that aren't pre-processed by EJS, use the global `baseUrl` variable that's defined in the layout:

```javascript
// In layout.ejs
<script>
  window.baseUrl = '<%= baseUrl %>';
</script>

// In standalone JavaScript file
fetch(`${window.baseUrl}/api/data`)
  .then(response => response.json())
  .then(data => console.log(data));
```

In EJS-embedded JavaScript:

```javascript
// Inside EJS <script> tags
const response = await fetch('<%= baseUrl %>/api/endpoint', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(data)
});
```

## Dynamic URLs in JavaScript

When constructing URLs in JavaScript:

```javascript
// Wrong
window.location.href = `/path/${id}`;

// Correct
window.location.href = `<%= baseUrl %>/path/${id}`;
```

## Common Issues and Solutions

1. **404 Errors for Assets**: If images, CSS, or JS files return 404 errors, check that their paths properly include the `baseUrl` variable.

2. **API Endpoints Failing**: Ensure all fetch calls include the `baseUrl` variable in the URL.

3. **Redirects Going to Wrong URL**: Check that all redirects (`window.location.href`) use the `baseUrl` variable.

4. **Testing with Different Paths**: Use the `BASE_URL` environment variable to test the application with different deployment paths:
   ```
   BASE_URL=/subpath node server.js
   ```

5. **Absolute URLs**: Replace all hardcoded absolute URLs (starting with `/`) with `<%= baseUrl %>/path`.

## File Changes Completed

The following files have been updated to use the `baseUrl` variable:

- `views/layouts/layout.ejs`: Base template with proper baseUrl handling
- `views/partials/header.ejs`: Navigation links updated to use baseUrl
- `views/pages/index.ejs`: Homepage links and assets
- `views/pages/login.ejs`: Login form and redirects
- `views/pages/signup.ejs`: Signup form and redirects 
- `views/pages/dashboard.ejs`: Dashboard API calls and asset loading
- `views/pages/groups.ejs`: Group listings and API calls
- `views/pages/group-details.ejs`: Group detail page links and API calls
- `views/pages/marketplace.ejs`: Marketplace items and API calls
- `views/pages/create-group.ejs`: Group creation form and API calls
- `public/js/css-fix.js`: Path detection for CSS assets
- `server.js`: Base configuration and route handling

## Testing

To verify all links work correctly, test the application with different baseUrl settings:

1. Test with root path: `BASE_URL='' node server.js`
2. Test with subpath: `BASE_URL='/freshshare' node server.js`

Use the test-server.js to verify navigation and asset loading in both scenarios.
