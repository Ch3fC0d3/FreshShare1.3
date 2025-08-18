# Using GitHub Workflow for FreshShare Deployment

This guide explains how to use the GitHub Actions workflow to automatically deploy your FreshShare application to your cPanel hosting.

## Prerequisites

1. GitHub account
2. Repository with your FreshShare code
3. cPanel hosting with Node.js support
4. FTP and SSH access to your hosting

## Step 1: Push Your Code to GitHub

1. Create a new repository on GitHub (if you don't have one already)
2. Initialize Git in your local project (if not already done):
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   ```
3. Connect your local repository to GitHub:
   ```bash
   git remote add origin https://github.com/yourusername/freshshare.git
   git branch -M main
   git push -u origin main
   ```

## Step 2: Set Up GitHub Secrets

1. Go to your GitHub repository
2. Click on "Settings" tab
3. In the left sidebar, click on "Secrets and variables" → "Actions"
4. Click "New repository secret"
5. Add the following secrets:

   **FTP Credentials:**
   - `FTP_SERVER`: Your cPanel server hostname (e.g., `yoursite.com`)
   - `FTP_USERNAME`: Your cPanel username
   - `FTP_PASSWORD`: Your cPanel password

   **JWT Secret:**
   - `JWT_SECRET`: A strong secret key for JWT authentication

   **MongoDB:**
   - `MONGODB_URI`: Your MongoDB Atlas connection string

## Step 3: Verify Workflow File

The workflow file (`.github/workflows/deploy-with-secrets.yml`) should already be configured with:

- PostgreSQL connection string: `postgres://myfrovov_freshshare_user:BjgjX2Vev2vmLwh@localhost:5432/myfrovov_freshshare`
- Proper environment variable setup
- FTP deployment configuration
- SSH commands to restart services

## Step 4: Trigger the Workflow

### Automatic Trigger (Push to Main)

The workflow is configured to run automatically when you push to the main branch:

```bash
# Make changes to your code
git add .
git commit -m "Update feature XYZ"
git push origin main
```

### Manual Trigger

You can also trigger the workflow manually:

1. Go to your GitHub repository
2. Click on the "Actions" tab
3. Select the "Deploy to cPanel" workflow from the left sidebar
4. Click "Run workflow" dropdown on the right
5. Select the branch (usually main)
6. Click "Run workflow" button

## Step 5: Monitor Deployment

1. Go to the "Actions" tab in your GitHub repository
2. Click on the running workflow to see its progress
3. Expand each step to see detailed logs
4. Check for any errors in the logs

## Step 6: Verify Deployment

After the workflow completes successfully:

1. Visit your website to ensure it's working properly
2. Check for any 503 errors
3. Test the functionality of both Express and Fastify services

## Troubleshooting

### Workflow Fails at FTP Step

1. Verify your FTP credentials in GitHub secrets
2. Check if your hosting has FTP access enabled
3. Ensure your FTP user has write permissions to the target directories

### Workflow Fails at SSH Step

1. Verify your FTP credentials (used for SSH as well)
2. Check if your hosting has SSH access enabled
3. Ensure your SSH user has execute permissions

### Application Shows 503 Error After Deployment

1. SSH into your server and check if services are running:
   ```bash
   ps aux | grep node
   ```
2. Check logs for errors:
   ```bash
   cat ~/public_html/express.log
   cat ~/fastify-backend/fastify.log
   ```
3. Manually restart services if needed:
   ```bash
   cd ~/fastify-backend
   ./start-fastify.sh > fastify.log 2>&1 &
   
   cd ~/public_html
   ./start-express.sh > express.log 2>&1 &
   ```

## Making Changes to the Workflow

If you need to modify the workflow:

1. Edit the `.github/workflows/deploy-with-secrets.yml` file
2. Commit and push your changes
3. The updated workflow will be used for future deployments

## Best Practices

1. Always test changes locally before pushing to GitHub
2. Use descriptive commit messages
3. Monitor workflow runs after pushing changes
4. Keep your GitHub secrets secure and update them if credentials change
