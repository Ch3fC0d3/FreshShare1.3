# FreshShare BaseUrl Implementation Summary

This document provides a comprehensive overview of all baseUrl fixes implemented in the FreshShare application to ensure proper URL handling in various deployment scenarios.

## Core Concept

The application now supports two deployment scenarios:
- **Root path deployment**: Site is accessible at the domain root (`https://example.com/`)
- **Subdirectory deployment**: Site is in a subdirectory (`https://example.com/subdirectory/`)

All routes, links, and asset references now use the configurable `baseUrl` value, which is derived from the `BASE_URL` environment variable.

## Key Components Modified

### 1. Server Configuration (server.js)

- Added environment variable support:
  ```js
  const BASE_URL = process.env.BASE_URL || '';
  ```
- All route renders now use:
  ```js
  res.render('template', { baseUrl: BASE_URL, ...otherData })
  ```
- Static file serving paths configured with baseUrl awareness

### 2. Template Files (.ejs)

- **Layout Template** (`layout.ejs`): 
  - All CSS/JS imports use `<%- baseUrl %>` prefix
  - Meta tags with URLs use proper baseUrl prefixing
  
- **Header Navigation** (`header.ejs`):
  - All navigation links prefixed with `<%- baseUrl %>`
  - Form actions and redirects properly handled

- **Page Templates**:
  - All internal links and form actions use `<%- baseUrl %>`
  - All asset references (images, scripts) properly prefixed
  - API endpoint references adjusted to use baseUrl

### 3. Client-side JavaScript

- Updated `auth.js` to use baseUrl for form submissions and redirects
- Modified `css-fix.js` to handle baseUrl in dynamic asset loading
- Fixed AJAX/Fetch calls to properly include baseUrl in endpoints

### 4. Directory Structure & Static Files

- Consolidated `public` and `public_html` directories
- `.htaccess` configurations updated to work with baseUrl
- Static file references in CSS updated to work with subdirectory paths

### 5. Deployment Configuration

- Added `BASE_URL` environment variable to GitHub Actions workflow
- Updated deployment documentation with baseUrl configuration guidance
- Added examples for both root and subdirectory deployment scenarios

## Testing

All navigation paths and asset loading have been tested using `test-server.js` with both:
- Empty baseUrl (`BASE_URL=''`) for root deployment
- Path baseUrl (`BASE_URL='/subdirectory'`) for subdirectory deployment

## Troubleshooting Common Issues

1. **Broken Links**: Ensure all href attributes use `<%- baseUrl %>` prefix
2. **Missing Assets**: Check that asset paths in CSS/JS use proper baseUrl prefixes
3. **API Calls Failing**: Verify API endpoints include baseUrl in client-side code
4. **Redirect Issues**: Confirm that all redirects append baseUrl to the path

## Environment Variable Configuration

The `BASE_URL` environment variable must be set correctly:

- For root deployment: `BASE_URL=''` (empty string)
- For subdirectory deployment: `BASE_URL='/subdirectory'` (with leading slash)

This variable is injected into templates via the `baseUrl` property passed to `res.render()` calls in `server.js`.

## Future Considerations

- Implement automated link checking to verify baseUrl usage
- Consider middleware approach for more automatic baseUrl handling
- Add E2E tests that specifically verify correct subdirectory deployment
