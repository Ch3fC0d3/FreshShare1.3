// CSS Path Diagnostic Script for Production Environment
document.addEventListener('DOMContentLoaded', function () {
  console.log('=== CSS DIAGNOSTIC TOOL ===');
  console.log('Base URL:', window.location.origin);
  console.log('Page URL:', window.location.href);

  // Create diagnostic area in page
  const diagnosticArea = document.createElement('div');
  diagnosticArea.id = 'css-diagnostic';
  diagnosticArea.style.cssText =
    'position:fixed; top:10px; right:10px; width:350px; padding:15px; background:#fff; border:2px solid #f00; z-index:9999; overflow:auto; max-height:80vh; font-family:monospace; font-size:12px;';

  const heading = document.createElement('h3');
  heading.textContent = 'CSS Diagnostic';
  heading.style.marginTop = '0';
  diagnosticArea.appendChild(heading);

  // Add close button
  const closeBtn = document.createElement('button');
  closeBtn.textContent = 'Close';
  closeBtn.style.cssText = 'position:absolute; top:10px; right:10px;';
  closeBtn.onclick = function () {
    diagnosticArea.remove();
  };
  diagnosticArea.appendChild(closeBtn);

  // Check all stylesheets
  const styleStatus = document.createElement('div');
  styleStatus.innerHTML = '<h4>CSS Files Status:</h4>';
  diagnosticArea.appendChild(styleStatus);

  const list = document.createElement('ul');
  list.style.cssText = 'list-style:none; padding-left:5px;';
  styleStatus.appendChild(list);

  // Get all CSS links
  const cssLinks = Array.from(
    document.querySelectorAll('link[rel="stylesheet"]')
  );
  console.log('Found', cssLinks.length, 'CSS files in document');

  // Check each CSS link
  cssLinks.forEach((link) => {
    const href = link.getAttribute('href');
    const item = document.createElement('li');
    item.style.marginBottom = '8px';
    list.appendChild(item);

    const url = href.startsWith('http')
      ? href
      : href.startsWith('/')
        ? window.location.origin + href
        : window.location.origin + '/' + href;
    console.log('Checking CSS:', url);

    // Show initial status
    item.innerHTML = `<span style="color:#666">⏳</span> ${href}`;

    // Fetch to check if file is accessible
    fetch(url, {
      method: 'HEAD',
      cache: 'no-cache',
    })
      .then((response) => {
        if (response.ok) {
          item.innerHTML = `<span style="color:green">✅</span> ${href}<br>
                         <small>Status: ${response.status}, Type: ${response.headers.get('content-type') || 'unknown'}</small>`;
          console.log('CSS loaded successfully:', url);
        } else {
          item.innerHTML = `<span style="color:red">❌</span> ${href}<br>
                         <small>Error: ${response.status} ${response.statusText}</small>`;
          console.error(
            'CSS failed to load:',
            url,
            response.status,
            response.statusText
          );
        }
      })
      .catch((error) => {
        item.innerHTML = `<span style="color:red">❌</span> ${href}<br>
                       <small>Error: ${error.message}</small>`;
        console.error('CSS error:', url, error);
      });
  });

  // Check stylesheet rules
  const ruleStatus = document.createElement('div');
  ruleStatus.innerHTML = '<h4>Stylesheet Rules:</h4>';
  diagnosticArea.appendChild(ruleStatus);

  const ruleList = document.createElement('ul');
  ruleList.style.cssText = 'list-style:none; padding-left:5px;';
  ruleStatus.appendChild(ruleList);

  // Try accessing rules from each stylesheet
  Array.from(document.styleSheets).forEach((sheet, index) => {
    const item = document.createElement('li');
    item.style.marginBottom = '8px';
    ruleList.appendChild(item);

    try {
      const rules = sheet.cssRules;
      const ruleCount = rules ? rules.length : 0;
      item.innerHTML = `<span style="color:green">✅</span> Sheet #${index}: ${sheet.href || 'inline'}<br>
                       <small>${ruleCount} rules loaded</small>`;
      console.log(
        `Stylesheet #${index} has ${ruleCount} rules:`,
        sheet.href || 'inline'
      );
    } catch (e) {
      item.innerHTML = `<span style="color:red">❌</span> Sheet #${index}: ${sheet.href || 'inline'}<br>
                       <small>Error: ${e.message} (CORS issue?)</small>`;
      console.error(`Stylesheet #${index} error:`, sheet.href, e);
    }
  });

  // MIME Type check
  const mimeSection = document.createElement('div');
  mimeSection.innerHTML = '<h4>Server Headers Test:</h4>';
  diagnosticArea.appendChild(mimeSection);

  // Test local CSS file for proper headers
  const testCssPath = '/css/color-system.css';
  const testUrl = window.location.origin + testCssPath;

  fetch(testUrl)
    .then((response) => {
      const headersList = document.createElement('div');
      headersList.style.marginTop = '10px';

      let headerText = `Status: ${response.status} ${response.statusText}<br>`;
      headerText += `Content-Type: ${response.headers.get('content-type') || 'not set'}<br>`;
      headerText += `Content-Encoding: ${response.headers.get('content-encoding') || 'not set'}<br>`;
      headerText += `Cache-Control: ${response.headers.get('cache-control') || 'not set'}<br>`;

      headersList.innerHTML = headerText;
      mimeSection.appendChild(headersList);

      console.log(
        'Headers for',
        testUrl,
        'Content-Type:',
        response.headers.get('content-type')
      );
    })
    .catch((error) => {
      mimeSection.innerHTML += `<p style="color:red">Error fetching headers: ${error.message}</p>`;
      console.error('Header test error:', error);
    });

  // Fix button
  const fixSection = document.createElement('div');
  fixSection.innerHTML = '<h4>Actions:</h4>';
  diagnosticArea.appendChild(fixSection);

  const fixButton = document.createElement('button');
  fixButton.textContent = 'Try Force Reload CSS';
  fixButton.style.marginRight = '10px';
  fixButton.onclick = function () {
    cssLinks.forEach((link) => {
      const href = link.getAttribute('href');
      if (href.includes('/css/')) {
        // Force reload by adding timestamp
        const newLink = document.createElement('link');
        newLink.rel = 'stylesheet';
        newLink.type = 'text/css';
        const forcedUrl = window.location.origin + href + '?t=' + Date.now();
        newLink.href = forcedUrl;
        document.head.appendChild(newLink);
        console.log('Force loaded:', forcedUrl);
      }
    });
    alert('CSS reload attempted!');
  };
  fixSection.appendChild(fixButton);

  const reloadButton = document.createElement('button');
  reloadButton.textContent = 'Hard Reload Page';
  reloadButton.onclick = function () {
    location.reload(true); // Hard reload, bypassing cache
  };
  fixSection.appendChild(reloadButton);

  // Add to page
  document.body.appendChild(diagnosticArea);

  // Log browser info
  console.log('User Agent:', navigator.userAgent);
  console.log('=== END OF CSS DIAGNOSTIC ===');
});
