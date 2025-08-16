# Deploying FreshShare via GitHub

Yes, you can use GitHub to deploy your FreshShare application to your Namecheap server. This guide provides step-by-step instructions for setting up GitHub deployment for your project.

## 1. Setting Up GitHub Repository

1. **Create a new GitHub repository**:
   - Go to [GitHub](https://github.com)
   - Click "New" to create a new repository
   - Name it "FreshShare" or any name you prefer
   - Choose Public or Private based on your preference
   - Click "Create repository"

2. **Initialize your local repository**:
   - Open a terminal in your FreshShare project directory
   - Run the following commands:

   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git branch -M main
   git remote add origin https://github.com/yourusername/FreshShare.git
   git push -u origin main
   ```

   Replace `yourusername` with your GitHub username and the repository name if different.

## 2. Setting Up Deployment from GitHub to Namecheap

### Method 1: Manual Deployment via Git Pull

1. **SSH into your Namecheap server**:
   - Use your SSH credentials to connect to your server

2. **Navigate to your application directory**:
   ```bash
   cd /home/myfresho/freshshare12
   ```

3. **Clone your repository**:
   ```bash
   # If this is a new directory:
   git clone https://github.com/yourusername/FreshShare.git .
   
   # If this is an existing directory:
   git init
   git remote add origin https://github.com/yourusername/FreshShare.git
   git fetch
   git reset --hard origin/main
   ```

4. **Set up deployment keys** (for private repositories):
   - Generate SSH key on your server:
     ```bash
     ssh-keygen -t rsa -b 4096 -C "your_email@example.com"
     ```
   - Add the public key to your GitHub repository:
     - Go to your repository on GitHub
     - Go to Settings > Deploy keys
     - Click "Add deploy key"
     - Paste the contents of the public key (usually in `~/.ssh/id_rsa.pub`)
     - Give it a title and check "Allow write access" if needed
     - Click "Add key"

5. **Create a deployment script**:
   Create a file named `deploy.sh` in your home directory:

   ```bash
   #!/bin/bash
   # Deployment script for FreshShare

   # Express server
   cd /home/myfresho/freshshare12
   git pull origin main
   npm install
   pm2 restart freshshare-express

   # Fastify backend
   cd /home/myfresho/fastify-backend
   git pull origin main
   npm install
   pm2 restart freshshare-fastify
   ```

   Make the script executable:
   ```bash
   chmod +x deploy.sh
   ```

### Method 2: GitHub Actions for Automated Deployment

1. **Create SSH keys for GitHub Actions**:
   - Generate a new SSH key pair on your local machine:
     ```bash
     ssh-keygen -t rsa -b 4096 -C "github-actions" -f github-actions
     ```
   - Add the public key (`github-actions.pub`) to your server's `~/.ssh/authorized_keys` file
   - Add the private key (`github-actions`) as a GitHub Secret:
     - Go to your repository on GitHub
     - Go to Settings > Secrets > Actions
     - Click "New repository secret"
     - Name it `SSH_PRIVATE_KEY`
     - Paste the contents of the private key
     - Click "Add secret"
   - Also add these secrets:
     - `SSH_HOST`: Your server's hostname or IP
     - `SSH_USERNAME`: Your SSH username
     - `SSH_PORT`: Your SSH port (usually 22)

2. **Create a GitHub Action workflow file**:
   Create a file in your repository at `.github/workflows/deploy.yml`:

   ```yaml
   name: Deploy FreshShare

   on:
     push:
       branches: [ main ]
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
             ssh ${{ secrets.SSH_USERNAME }}@${{ secrets.SSH_HOST }} -p ${{ secrets.SSH_PORT }} "cd /home/myfresho/freshshare12 && git pull origin main && npm install && pm2 restart freshshare-express || pm2 start server.js --name freshshare-express"
             
         - name: Deploy Fastify Backend
           run: |
             ssh ${{ secrets.SSH_USERNAME }}@${{ secrets.SSH_HOST }} -p ${{ secrets.SSH_PORT }} "cd /home/myfresho/fastify-backend && git pull origin main && npm install && pm2 restart freshshare-fastify || pm2 start server.ts --interpreter='node --loader ts-node/esm' --name freshshare-fastify"
   ```

3. **Push the workflow file to GitHub**:
   ```bash
   git add .github/workflows/deploy.yml
   git commit -m "Add GitHub Actions deployment workflow"
   git push origin main
   ```

4. **Trigger the deployment**:
   - Go to your repository on GitHub
   - Click on "Actions" tab
   - Click on the "Deploy FreshShare" workflow
   - Click "Run workflow" and select the main branch

## 3. Setting Up Environment Files

Since environment files contain sensitive information, they shouldn't be stored in GitHub. Instead:

1. **Create .env files directly on the server**:
   - For Express server:
     ```bash
     nano /home/myfresho/freshshare12/.env
     ```
     Add your environment variables:
     ```
     PORT=8080
     FASTIFY_BACKEND_URL=http://localhost:8089
     MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/freshshare_db
     JWT_SECRET=your_jwt_secret_here
     ```
     
   - For Fastify backend:
     ```bash
     nano /home/myfresho/fastify-backend/.env
     ```
     Add your environment variables:
     ```
     DATABASE_URL=postgres://fastify_user:your_password@localhost:5432/freshshare
     PORT=8089
     ```

2. **Add .env to .gitignore**:
   Make sure your .gitignore file includes:
   ```
   .env
   .env.*
   ```

## 4. Additional Configuration

1. **Configure .htaccess**:
   - Copy the `.htaccess` file from your deployment directory to your server:
     ```bash
     scp ./deployment/.htaccess username@your-server:/home/myfresho/freshshare12/
     ```

2. **Set up databases**:
   - Follow the database setup instructions in `NAMECHEAP_HOSTING_GUIDE.md`
   - Import the schemas and seed data as needed

## 5. Testing Your Deployment

1. Make a small change to your code
2. Commit and push to GitHub:
   ```bash
   git add .
   git commit -m "Test deployment"
   git push origin main
   ```
3. If using GitHub Actions, monitor the deployment in the Actions tab
4. If using manual deployment, SSH into your server and run `./deploy.sh`
5. Verify the changes on your website

## Troubleshooting

1. **Permission issues**:
   - Make sure your deploy script and application directories have the correct permissions
   - Use `chmod` and `chown` as needed

2. **SSH connection issues**:
   - Verify your SSH keys are correctly set up
   - Check if your server allows SSH connections

3. **GitHub Actions failures**:
   - Check the logs in the Actions tab
   - Verify your secrets are correctly set up

4. **Application not starting**:
   - Check the PM2 logs:
     ```bash
     pm2 logs freshshare-express
     pm2 logs freshshare-fastify
     ```
