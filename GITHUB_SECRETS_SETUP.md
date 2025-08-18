# GitHub Secrets Setup for FreshShare Automated Deployment

This guide explains how to set up the required GitHub secrets for the automated deployment workflow.

## Required Secrets

Set up the following secrets in your GitHub repository settings:

### Database Connections

- **MONGODB_URI**: Your MongoDB Atlas connection string

```bash
mongodb+srv://<username>:<password>@<cluster>.mongodb.net/FreshShareDB
```

- **POSTGRES_URL**: PostgreSQL connection string for Fastify backend

```bash
postgres://username:password@localhost:5432/freshshare
```

### Server Access

- **FTP_SERVER**: Your cPanel server IP or hostname
- **FTP_USERNAME**: Your cPanel FTP username
- **FTP_PASSWORD**: Your cPanel FTP password

### Security

- **JWT_SECRET**: A strong secret key for JWT authentication

## How to Add Secrets to GitHub

1. Go to your GitHub repository
2. Click on "Settings" tab
3. In the left sidebar, click on "Secrets and variables" → "Actions"
4. Click "New repository secret"
5. Add each secret listed above with its corresponding value
6. Click "Add secret"

## Testing the Workflow

After adding all secrets:

1. Go to the "Actions" tab in your repository
2. Select the "Deploy to cPanel" workflow
3. Click "Run workflow" (dropdown on the right)
4. Choose the branch to deploy (usually main)
5. Click "Run workflow" button

The deployment will automatically run and update your hosting with the latest code from GitHub.

## Important Notes

- Keep your secrets secure and never commit them to the repository
- The workflow will run automatically on every push to the main branch
- You can also manually trigger the workflow from the Actions tab
- Check the workflow logs for any deployment issues
