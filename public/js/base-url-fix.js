// Base URL Fix Script for Production Environment
(function() {
  console.log('Base URL Fix Script loaded v1.0');
  
  // Run immediately to prevent flickering links
  runBaseUrlFix();
  
  // Then run again once DOM is fully loaded to catch any dynamically added links
  document.addEventListener('DOMContentLoaded', runBaseUrlFix);
  
  function runBaseUrlFix() {
    console.log('Fixing links with correct base URL...');
    
    // 1. Get the base URL from the server-side (from EJS template)
    let serverBaseUrl = '';
    const baseUrlMeta = document.querySelector('meta[name="base-url"]');
    if (baseUrlMeta) {
      serverBaseUrl = baseUrlMeta.getAttribute('content') || '';
      console.log('Server provided base URL:', serverBaseUrl);
    }
    
    // 2. Ensure window.fsBaseUrl is set correctly
    if (window.fsBaseUrl !== serverBaseUrl) {
      console.log('Updating window.fsBaseUrl from', window.fsBaseUrl, 'to', serverBaseUrl);
      window.fsBaseUrl = serverBaseUrl;
    }
    
    // 3. Fix all <a> tags that don't already have absolute URLs or special protocols
    const links = document.querySelectorAll('a[href]');
    links.forEach(link => {
      const href = link.getAttribute('href');
      
      // Skip links that are already absolute URLs or special protocols
      if (href.startsWith('http://') || 
          href.startsWith('https://') || 
          href.startsWith('mailto:') || 
          href.startsWith('tel:') ||
          href.startsWith('javascript:') ||
          href.startsWith('#')) {
        return;
      }
      
      // Skip links that already have the correct base URL
      if (serverBaseUrl && href.startsWith(serverBaseUrl + '/')) {
        return;
      }
      
      // Fix relative links
      if (href.startsWith('/')) {
        // Already root-relative, just prepend the base URL (if any)
        const newHref = serverBaseUrl + href;
        console.log(`Fixing link: ${href} → ${newHref}`);
        link.setAttribute('href', newHref);
      } else {
        // Relative to current path, make it root-relative with base URL
        const newHref = serverBaseUrl + '/' + href;
        console.log(`Fixing link: ${href} → ${newHref}`);
        link.setAttribute('href', newHref);
      }
    });
    
    // 4. Fix form actions that don't already have absolute URLs
    const forms = document.querySelectorAll('form[action]');
    forms.forEach(form => {
      const action = form.getAttribute('action');
      
      // Skip forms with absolute URLs
      if (action.startsWith('http://') || action.startsWith('https://')) {
        return;
      }
      
      // Fix relative form actions
      if (action.startsWith('/')) {
        form.setAttribute('action', serverBaseUrl + action);
      } else {
        form.setAttribute('action', serverBaseUrl + '/' + action);
      }
    });
    
    console.log('Base URL fixing complete');
  }
})();
