// Base URL Fix Script for Production Environment v1.1
(function() {
  console.log('Base URL Fix Script loaded v1.1');
  
  // Get the base URL from the server-side (from EJS template)
  let serverBaseUrl = '';
  const baseUrlMeta = document.querySelector('meta[name="base-url"]');
  if (baseUrlMeta) {
    serverBaseUrl = baseUrlMeta.getAttribute('content') || '';
    console.log('Server provided base URL:', serverBaseUrl);
  }

  // Make baseUrl available globally
  window.fsBaseUrl = serverBaseUrl;

  // Fix URLs immediately and whenever DOM changes
  runBaseUrlFix();
  document.addEventListener('DOMContentLoaded', runBaseUrlFix);

  // Watch for dynamic content changes
  const observer = new MutationObserver(function(mutations) {
    mutations.forEach(function(mutation) {
      if (mutation.addedNodes.length) {
        runBaseUrlFix();
      }
    });
  });

  observer.observe(document.documentElement, {
    childList: true,
    subtree: true
  });

  // Intercept fetch/XHR requests to fix API URLs
  const originalFetch = window.fetch;
  window.fetch = function(url, options) {
    const fixedUrl = fixUrl(url);
    return originalFetch.call(this, fixedUrl, options);
  };

  const originalXHROpen = XMLHttpRequest.prototype.open;
  XMLHttpRequest.prototype.open = function(method, url, ...args) {
    const fixedUrl = fixUrl(url);
    return originalXHROpen.call(this, method, fixedUrl, ...args);
  };

  // URL fixing function
  function fixUrl(url) {
    if (typeof url !== 'string') return url;
    if (!serverBaseUrl) return url;
    if (url.startsWith('http://') || 
        url.startsWith('https://') || 
        url.startsWith('mailto:') || 
        url.startsWith('tel:') || 
        url.startsWith('javascript:') || 
        url.startsWith('#') ||
        url.startsWith('blob:') ||
        url.startsWith('data:')) {
      return url;
    }

    // Handle API endpoints
    if (url.startsWith('/api/')) {
      return serverBaseUrl + url;
    }

    // Fix relative URLs
    return url.startsWith('/') ? serverBaseUrl + url : serverBaseUrl + '/' + url;
  }

  function runBaseUrlFix() {
    if (!serverBaseUrl) return;

    // Fix <a> tags
    document.querySelectorAll('a[href]').forEach(link => {
      const href = link.getAttribute('href');
      const fixedHref = fixUrl(href);
      if (fixedHref !== href) {
        console.log(`Fixing link: ${href} → ${fixedHref}`);
        link.setAttribute('href', fixedHref);
      }
    });

    // Fix forms
    document.querySelectorAll('form[action]').forEach(form => {
      const action = form.getAttribute('action');
      const fixedAction = fixUrl(action);
      if (fixedAction !== action) {
        console.log(`Fixing form action: ${action} → ${fixedAction}`);
        form.setAttribute('action', fixedAction);
      }
    });

    // Fix API endpoints in data attributes
    document.querySelectorAll('[data-api-url]').forEach(el => {
      const apiUrl = el.getAttribute('data-api-url');
      const fixedApiUrl = fixUrl(apiUrl);
      if (fixedApiUrl !== apiUrl) {
        console.log(`Fixing API URL: ${apiUrl} → ${fixedApiUrl}`);
        el.setAttribute('data-api-url', fixedApiUrl);
      }
    });
  }
})();
