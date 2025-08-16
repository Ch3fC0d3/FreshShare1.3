# Deploying to Existing GitHub Repository

I see you already have a GitHub repository set up at `https://github.com/Ch3fC0d3/FreshShare1.2.git`. This guide will help you deploy your FreshShare 1.3 project using this existing repository structure.

## 1. Setting Up the New Version with Your Existing Repository

### Option 1: Create a New Branch

1. **Clone your existing repository**:
   ```bash
   git clone https://github.com/Ch3fC0d3/FreshShare1.2.git
   cd FreshShare1.2
   ```

2. **Create a new branch for version 1.3**:
   ```bash
   git checkout -b freshshare-1.3
   ```

3. **Copy your new files**:
   ```bash
   # Remove all files except .git directory
   find . -mindepth 1 -not -path "./.git*" -delete
   
   # Copy new FreshShare 1.3 files
   xcopy /E /H /Y "D:\Users\gabep\Desktop\FreshShareProd\FreshShare1.3" .
   ```

4. **Commit and push changes**:
   ```bash
   git add .
   git commit -m "Upgrade to FreshShare 1.3"
   git push origin freshshare-1.3
   ```

### Option 2: Create a New Repository for FreshShare 1.3

1. **Create a new repository on GitHub**:
   - Go to GitHub and create `FreshShare1.3` repository
   
2. **Initialize your local 1.3 directory**:
   ```bash
   cd D:\Users\gabep\Desktop\FreshShareProd\FreshShare1.3
   git init
   git add .
   git commit -m "Initial FreshShare 1.3 commit"
   git branch -M main
   git remote add origin https://github.com/Ch3fC0d3/FreshShare1.3.git
   git push -u origin main
   ```

## 2. GitHub Actions Automated Deployment (Method 2)

Since you indicated interest in Method 2 (GitHub Actions), here's how to set it up with your existing SSH connection:

1. **Set up GitHub Actions secrets**:
   - Go to your GitHub repository
   - Navigate to Settings > Secrets and variables > Actions
   - Add the following secrets:
     - `SSH_HOST`: myfreshshare.com
     - `SSH_USERNAME`: myfrovov
     - `SSH_PORT`: 21098
     - `SSH_PRIVATE_KEY`: Your private SSH key (create a new one for GitHub Actions)

2. **Create SSH key for GitHub Actions**:
   ```bash
   ssh-keygen -t rsa -b 4096 -C "github-actions" -f github-actions
   ```
   
3. **Add the public key to your server**:
   - Copy the content of `github-actions.pub`
   - SSH into your server:
     ```bash
     ssh myfrovov@myfreshshare.com -p 21098
     ```
   - Add the public key to `~/.ssh/authorized_keys`:
     ```bash
     mkdir -p ~/.ssh
     chmod 700 ~/.ssh
     echo "paste-your-public-key-here" >> ~/.ssh/authorized_keys
     chmod 600 ~/.ssh/authorized_keys
     ```

4. **Add the private key to GitHub Secrets**:
   - Copy the content of the `github-actions` private key file
   - Add it as `SSH_PRIVATE_KEY` in your GitHub repository secrets

5. **Create GitHub Actions workflow file**:
   Create `.github/workflows/deploy.yml` in your repository:

   ```yaml
   name: Deploy FreshShare

   on:
     push:
       branches: [ main ]  # or freshshare-1.3 if using Option 1
     workflow_dispatch:

   jobs:
     deploy:
       runs-on: ubuntu-latest
       steps:
         - uses: actions/checkout@v2
         
         - name: Install SSH key
           uses: shimataro/ssh-key-action@v2
           with:
             key: ${{ secrets.SSH_PRIVATE_KEY }}
             known_hosts: unnecessary
             if_key_exists: replace
             
         - name: Adding Known Hosts
           run: ssh-keyscan -H ${{ secrets.SSH_HOST }} >> ~/.ssh/known_hosts
           
         - name: Deploy Express Server
           run: |
             ssh ${{ secrets.SSH_USERNAME }}@${{ secrets.SSH_HOST }} -p ${{ secrets.SSH_PORT }} "cd /home/myfrovov/freshshhare1.2 && git pull origin main && npm install && pm2 restart freshshare-express || pm2 start server.js --name freshshare-express"
             
         - name: Deploy Fastify Backend
           run: |
             ssh ${{ secrets.SSH_USERNAME }}@${{ secrets.SSH_HOST }} -p ${{ secrets.SSH_PORT }} "cd /home/myfrovov/fastify-backend && git pull origin main && npm install && pm2 restart freshshare-fastify || pm2 start server.ts --interpreter='node --loader ts-node/esm' --name freshshare-fastify"
   ```

6. **Push this workflow file to your repository**:
   ```bash
   git add .github/workflows/deploy.yml
   git commit -m "Add GitHub Actions deployment workflow"
   git push origin main  # or freshshare-1.3 if using Option 1
   ```

## 3. Setting Up Fastify Backend Directory

Since you're adding the Fastify backend, you'll need to create that directory on your server:

1. **SSH into your server**:
   ```bash
   ssh myfrovov@myfreshshare.com -p 21098
   ```

2. **Create the Fastify backend directory**:
   ```bash
   mkdir -p /home/myfrovov/fastify-backend
   ```

3. **Initialize Git repository in the Fastify directory**:
   ```bash
   cd /home/myfrovov/fastify-backend
   git init
   git remote add origin https://github.com/Ch3fC0d3/FreshShare1.3.git
   ```

4. **Set up sparse checkout for Fastify files only**:
   ```bash
   git sparse-checkout init
   git sparse-checkout set fastify-backend
   git pull origin main
   ```

5. **Create environment file**:
   ```bash
   nano /home/myfrovov/fastify-backend/.env
   ```
   
   Add the following content:
   ```
   DATABASE_URL=postgres://fastify_user:your_password@localhost:5432/freshshare
   PORT=8089
   ```

## 4. Updating Your Express Server

1. **Update your existing Express server**:
   ```bash
   cd /home/myfrovov/freshshhare1.2
   git pull origin main  # or freshshare-1.3 if using Option 1
   npm install
   ```

2. **Create or update environment file**:
   ```bash
   nano /home/myfrovov/freshshhare1.2/.env
   ```
   
   Add the following content:
   ```
   PORT=8080
   FASTIFY_BACKEND_URL=http://localhost:8089
   MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/freshshare_db
   JWT_SECRET=your_jwt_secret_here
   ```

3. **Restart your Express server**:
   ```bash
   pm2 restart freshshare-express || pm2 start server.js --name freshshare-express
   ```

## 5. Manual Deployment (Alternative to GitHub Actions)

If you prefer manual deployments:

1. **SSH into your server**:
   ```bash
   ssh myfrovov@myfreshshare.com -p 21098
   ```

2. **Create a deployment script**:
   ```bash
   nano ~/deploy.sh
   ```
   
   Add the following content:
   ```bash
   #!/bin/bash
   # Deployment script for FreshShare
   
   # Express server
   cd /home/myfrovov/freshshhare1.2
   git pull origin main  # or freshshare-1.3 if using Option 1
   npm install
   pm2 restart freshshare-express || pm2 start server.js --name freshshare-express
   
   # Fastify backend
   cd /home/myfrovov/fastify-backend
   git pull origin main
   npm install
   pm2 restart freshshare-fastify || pm2 start server.ts --interpreter="node --loader ts-node/esm" --name freshshare-fastify
   ```

3. **Make the script executable**:
   ```bash
   chmod +x ~/deploy.sh
   ```

4. **Run the script when you want to deploy**:
   ```bash
   ~/deploy.sh
   ```

## 6. Testing Your Deployment

1. Push a small change to your repository
2. Verify that GitHub Actions runs successfully (if using automated deployment)
3. Check that your application is running correctly on your server
4. Check both the Express frontend and Fastify backend

## 7. Troubleshooting

- **Permission issues**: Make sure your directories have the correct permissions
- **GitHub Actions failures**: Check the Actions tab for detailed logs
- **Application not starting**: Check PM2 logs with `pm2 logs freshshare-express` or `pm2 logs freshshare-fastify`
- **Repository connection issues**: Verify your remote URLs with `git remote -v`
