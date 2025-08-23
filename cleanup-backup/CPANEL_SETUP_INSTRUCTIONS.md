# cPanel Node.js Application Setup Instructions

## Current Issue
The deployment is failing because no Node.js application named "freshshare1.3" exists in your cPanel.

## Step-by-Step Setup

### 1. Create Node.js Application
1. In cPanel, go to **Software** → **Node.js App**
2. Click **"CREATE APPLICATION"**
3. Configure as follows:
   - **Application name**: `freshshare` (or `freshshare1.3`)
   - **Node.js version**: **18.x** (NOT 10.x)
   - **Application root**: `public_html`
   - **Application URL**: Your domain
   - **Application startup file**: `server.js`
   - **Environment**: `production`

### 2. Environment Variables
Add these environment variables in the Node.js App interface:
```
NODE_ENV=production
PORT=3001
FASTIFY_PORT=8080
```

### 3. Application Structure
Your application should be structured as:
```
public_html/
├── server.js (main Express server)
├── fastify-backend/
│   └── server.ts (Fastify backend)
├── package.json
└── other files...
```

### 4. After Creating the App
1. The system will create: `/home/myfrovov/nodevenv/freshshare/18/`
2. This provides Node.js 18 binaries at: `/home/myfrovov/nodevenv/freshshare/18/bin/`
3. Re-run your GitHub Actions deployment

### 5. Verification
After setup, you should see:
- Node.js app listed in cPanel
- Green "Running" status
- Accessible via your domain

## Alternative: Use Different App Name
If you prefer a different name, update the workflow to match your chosen application name.

## Troubleshooting
- Ensure Node.js 18 is selected (not 10.x)
- Verify `public_html` is set as application root
- Check that `server.js` exists in `public_html`
- Confirm environment variables are set
