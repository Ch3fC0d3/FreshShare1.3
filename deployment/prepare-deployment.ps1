# FreshShare Deployment Preparation Script
# This script creates deployment packages for both Express and Fastify components

$deploymentDir = ".\deployment-packages"
$expressDir = "$deploymentDir\express"
$fastifyDir = "$deploymentDir\fastify"

# Create directories
Write-Host "Creating deployment directory structure..."
New-Item -ItemType Directory -Force -Path $deploymentDir | Out-Null
New-Item -ItemType Directory -Force -Path $expressDir | Out-Null
New-Item -ItemType Directory -Force -Path $fastifyDir | Out-Null

# Copy Express server files
Write-Host "Copying Express server files..."
Copy-Item -Path ".\server.js" -Destination $expressDir
Copy-Item -Path ".\package.json" -Destination $expressDir
Copy-Item -Path ".\package-lock.json" -Destination $expressDir
Copy-Item -Path ".\controllers" -Destination "$expressDir\controllers" -Recurse
Copy-Item -Path ".\middleware" -Destination "$expressDir\middleware" -Recurse
Copy-Item -Path ".\models" -Destination "$expressDir\models" -Recurse
Copy-Item -Path ".\routes" -Destination "$expressDir\routes" -Recurse
Copy-Item -Path ".\config" -Destination "$expressDir\config" -Recurse
Copy-Item -Path ".\public" -Destination "$expressDir\public" -Recurse
Copy-Item -Path ".\views" -Destination "$expressDir\views" -Recurse
Copy-Item -Path ".\deployment\.htaccess" -Destination "$expressDir\.htaccess"
Copy-Item -Path ".\deployment\pm2-express.config.js" -Destination "$expressDir\ecosystem.config.js"
Copy-Item -Path ".\deployment\express-env-example" -Destination "$expressDir\.env.example"

# Copy Fastify backend files
Write-Host "Copying Fastify backend files..."
Copy-Item -Path ".\fastify-backend\*" -Destination $fastifyDir -Recurse -Exclude "node_modules"
Copy-Item -Path ".\deployment\pm2-fastify.config.js" -Destination "$fastifyDir\ecosystem.config.js"
Copy-Item -Path ".\deployment\fastify-env-example" -Destination "$fastifyDir\.env.example"

# Copy documentation
Write-Host "Copying deployment documentation..."
Copy-Item -Path ".\deployment\DEPLOYMENT_GUIDE.md" -Destination "$deploymentDir\DEPLOYMENT_GUIDE.md"
Copy-Item -Path ".\deployment\DB_SETUP.md" -Destination "$deploymentDir\DB_SETUP.md"

# Create README files
$expressReadme = @"
# FreshShare Express Server

This is the main Express application server for FreshShare.

## Setup Instructions

1. Copy the `.env.example` file to `.env`
2. Update the environment variables in `.env`
3. Install dependencies: `npm install --production`
4. Start the server: `npm start`

For PM2 deployment:
\`\`\`
pm2 start ecosystem.config.js
\`\`\`

See the DEPLOYMENT_GUIDE.md for complete instructions.
"@

$fastifyReadme = @"
# FreshShare Fastify Backend

This is the Fastify backend API for FreshShare.

## Setup Instructions

1. Copy the `.env.example` file to `.env`
2. Update the environment variables in `.env`
3. Install dependencies: `npm install --production`
4. Start the server: `npm start`

For PM2 deployment:
\`\`\`
pm2 start ecosystem.config.js
\`\`\`

See the DEPLOYMENT_GUIDE.md for complete instructions.
"@

$expressReadme | Out-File -FilePath "$expressDir\README.md" -Encoding UTF8
$fastifyReadme | Out-File -FilePath "$fastifyDir\README.md" -Encoding UTF8

Write-Host "Deployment packages created successfully!"
Write-Host "Express server package: $expressDir"
Write-Host "Fastify backend package: $fastifyDir"
Write-Host ""
Write-Host "Next steps:"
Write-Host "1. Review the DEPLOYMENT_GUIDE.md file for complete instructions"
Write-Host "2. Update the .env files with your production settings"
Write-Host "3. Upload the packages to your Namecheap Stellar hosting"
Write-Host ""
Write-Host "Note: You'll need to install Node.js dependencies after uploading"
