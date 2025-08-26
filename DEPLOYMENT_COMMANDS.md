# FreshShare Deployment Commands

## Repository Cleanup & Deployment Process

### 1. Cleanup Commands

The repository has been successfully cleaned using the aggressive cleanup scripts:

```bash
# Using PowerShell script
powershell -ExecutionPolicy Bypass -File clean-repo.ps1

# Using JavaScript cleanup script
node aggressive-cleanup.js
```

The cleanup scripts have:

- Removed redundant deployment scripts
- Removed duplicate package-lock.json files
- Cleaned upload directories
- Removed large image files
- Removed backup directories
- Backed up all removed files to timestamped backup directories

### 2. Git Commands to Trigger Deployment

```bash
# Step 1: Review the cleaned state
git status

# Step 2: Add all changes (including removed files)
git add .

# Step 3: Commit changes with a descriptive message
git commit -m "Clean repository for production deployment with CSS fixes"

# Step 4: Push to restore_branch to trigger GitHub Actions workflow
git push origin restore_branch
```

This push will automatically trigger the GitHub Actions workflow defined in `.github/workflows/deploy-with-secrets-fixed.yml`.

### 3. GitHub Actions Workflow Process

The workflow will:

1. Set up Node.js 18
2. Create `.env` files with secrets from GitHub repository
3. Install dependencies for Express and Fastify
4. Transfer files securely via SSH/SFTP to the cPanel server
5. Start both Express and Fastify services with process management
6. Set up cron jobs for service monitoring and auto-restart

### 4. Deployment Verification Checklist

After the GitHub Actions workflow completes:

- [ ] Verify GitHub Actions workflow completed successfully
- [ ] Check the deployed website is accessible
- [ ] Verify CSS loads without errors (using browser dev tools)
- [ ] Test the CSS test page at `/css-test-page.html`
- [ ] Check browser console for any CSS 404 errors
- [ ] Verify CSS loads in both root domain and subdirectory configurations
- [ ] Test automatic path detection in css-fix.js (check browser console)
- [ ] Verify services are running on the server (via SSH if needed)
- [ ] Check if the site renders correctly with all styles
- [ ] Test core functionality (login, groups, marketplace, etc.)

### 5. CSS Path Handling Implementation

The deployment includes enhanced CSS path handling to ensure styles load correctly:

```javascript
// Detect base URL - check if we're running under a subdirectory
const basePathElements = window.location.pathname.split('/');
let basePath = '';
if (basePathElements.length > 2 && basePathElements[1] !== '') {
  basePath = '/' + basePathElements[1];
  console.log('Detected base path:', basePath);
}
```

The CSS fix handles various deployment scenarios:

- Root domain deployment (e.g., example.com)
- Subdirectory deployment (e.g., example.com/freshshare)
- Different server configurations

To test path detection:

1. Check the browser console for "Detected base path" messages
2. Verify that CSS loads with both relative and absolute paths
3. Confirm the CSS reload mechanism works if initial loading fails

### 6. Troubleshooting

If deployment issues occur:
- Check GitHub Actions logs for errors
- SSH to the server and check service logs:
  ```bash
  # Check Express logs
  cat ~/freshshare1.3/express.log
  # Check Fastify logs
  cat ~/freshshare1.3/fastify-backend/fastify.log
  ```
- Restart services manually if needed:
  ```bash
  cd ~/freshshare1.3
  ./start-express.sh
  cd ~/freshshare1.3/fastify-backend
  ./start-backend-prod.sh
  ```
- Verify environment variables are correctly set in `.env` files
