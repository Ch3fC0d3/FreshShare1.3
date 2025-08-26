// CSS Fix Script for Production Environment
(function() {
  console.log('CSS Fix Script loaded v1.2');
  // Run after DOM content is loaded
  document.addEventListener('DOMContentLoaded', function () {
    console.log('Checking CSS loading status...');

    // Try to access the CSS files with both relative and absolute paths
    const cssFiles = [
      'reset-styles.css',
      'color-system.css',
      'main.css',
      'design-system.css',
      'groups-custom.css',
    ];
    // Detect base URL - check if we're running under a subdirectory
    const basePathElements = window.location.pathname.split('/');
    let basePath = '';
    // If pathname has a specific structure like /mysite/page.html,
    // we might need to prepend /mysite to all relative URLs
    if (basePathElements.length > 2 && basePathElements[1] !== '') {
      basePath = '/' + basePathElements[1];
      console.log('Detected base path:', basePath);
    }
    
    // Store base URL for global use
    window.fsBaseUrl = basePath;
    
    // Set base URL as data attribute on html element for EJS to access
    document.documentElement.setAttribute('data-base-url', basePath);
    
    // Base URL for origins
    const originUrl = window.location.origin;
    // Check if CSS is properly styled by checking computed styles
    const bodyStyles = window.getComputedStyle(document.body);
    const headingElements = document.querySelectorAll('h1, h2, h3');

    // If we detect unstyled content, try to reload CSS files
    if (!cssFilesAreLoaded()) {
      console.log('CSS appears to be missing, attempting to load...');
      reloadCSSFiles();
    }

    // Function to check if CSS appears to be loaded
    function cssFilesAreLoaded() {
      // Simple heuristic - in our app, styled content usually has:
      // 1. Non-default fonts
      // 2. Margins/padding defined
      // 3. Specific background colors

      const fontFamily = bodyStyles.getPropertyValue('font-family');
      const backgroundColor = bodyStyles.getPropertyValue('background-color');

      // Check if any headings have custom styling
      let headingsStyled = false;
      headingElements.forEach((heading) => {
        const headingStyle = window.getComputedStyle(heading);
        if (
          headingStyle.getPropertyValue('color') !== 'rgb(0, 0, 0)' ||
          headingStyle.getPropertyValue('font-weight') !== '400'
        ) {
          headingsStyled = true;
        }
      });

      console.log('Font family:', fontFamily);
      console.log('Background color:', backgroundColor);
      console.log('Headings styled:', headingsStyled);

      // If we see default browser styling, CSS is likely not loaded
      return !(
        fontFamily.includes('serif') &&
        backgroundColor === 'rgba(0, 0, 0, 0)' &&
        !headingsStyled
      );
    }

    // Function to reload CSS files
    function reloadCSSFiles() {
      // Create new link elements with full paths and cache-busting
      cssFiles.forEach(file => {
        // Try multiple paths to ensure loading, using the detected base path
        const cacheBuster = Date.now();
        const paths = [
          `${basePath}/css/${file}?t=${cacheBuster}`,
          `${basePath}/public/css/${file}?t=${cacheBuster}`,
          `${originUrl}${basePath}/css/${file}?t=${cacheBuster}`,
          `${originUrl}${basePath}/public/css/${file}?t=${cacheBuster}`,
          `${basePath}/public_html/css/${file}?t=${cacheBuster}`,
          `${originUrl}${basePath}/public_html/css/${file}?t=${cacheBuster}`,
          `/css/${file}?t=${cacheBuster}` // Fallback to root-relative path
        ];

        // Try each path
        paths.forEach((path) => {
          const link = document.createElement('link');
          link.rel = 'stylesheet';
          link.type = 'text/css';
          link.href = path;
          document.head.appendChild(link);
          console.log(`Attempting to load CSS from: ${path}`);
        });
      });

      // Add inline fallback styles for critical elements
      const criticalStyles = document.createElement('style');
      criticalStyles.textContent = `
        body {
          font-family: 'Open Sans', 'Helvetica Neue', Arial, sans-serif;
          line-height: 1.6;
          color: #333;
          background-color: #f8f9fa;
          margin: 0;
          padding-top: 80px;
        }
        h1, h2, h3, h4, h5, h6 {
          font-weight: 600;
          margin-bottom: 1rem;
          color: #2c3e50;
        }
        a {
          color: #3498db;
          text-decoration: none;
        }
        .container {
          max-width: 1200px;
          margin: 0 auto;
          padding: 0 15px;
        }
        .btn {
          display: inline-block;
          font-weight: 400;
          text-align: center;
          white-space: nowrap;
          vertical-align: middle;
          user-select: none;
          border: 1px solid transparent;
          padding: .375rem .75rem;
          font-size: 1rem;
          line-height: 1.5;
          border-radius: .25rem;
          transition: color .15s ease-in-out,background-color .15s ease-in-out,border-color .15s ease-in-out,box-shadow .15s ease-in-out;
        }
        .btn-primary {
          color: #fff;
          background-color: #007bff;
          border-color: #007bff;
        }
      `;
      document.head.appendChild(criticalStyles);

      // Add visual indicator that CSS fix is active
      const indicator = document.createElement('div');
      indicator.style.position = 'fixed';
      indicator.style.bottom = '10px';
      indicator.style.right = '10px';
      indicator.style.background = 'rgba(255, 255, 255, 0.8)';
      indicator.style.color = '#333';
      indicator.style.padding = '5px 10px';
      indicator.style.borderRadius = '3px';
      indicator.style.fontSize = '12px';
      indicator.style.boxShadow = '0 2px 5px rgba(0,0,0,0.2)';
      indicator.style.zIndex = '9999';
      indicator.textContent = 'CSS Reload Active';
      document.body.appendChild(indicator);
    }
  });
})();
