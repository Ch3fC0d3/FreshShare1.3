# FreshShare Conflict Resolution Guide

This comprehensive guide covers all types of conflicts you may encounter when working with the FreshShare application and how to resolve them effectively.

## Table of Contents

1. [Git Merge Conflicts](#git-merge-conflicts)
2. [Deployment Conflicts](#deployment-conflicts)
3. [Service and Port Conflicts](#service-and-port-conflicts)
4. [Path and Configuration Conflicts](#path-and-configuration-conflicts)
5. [File Permission Conflicts](#file-permission-conflicts)
6. [Environment Variable Conflicts](#environment-variable-conflicts)
7. [Database Connection Conflicts](#database-connection-conflicts)
8. [Automated Conflict Resolution Tools](#automated-conflict-resolution-tools)

---

## Git Merge Conflicts

### Understanding Git Conflicts

Git conflicts occur when:
- Multiple people modify the same lines in a file
- One person deletes a file while another modifies it
- Merging branches with different changes to the same files

### Identifying Git Conflicts

```bash
# Check for conflicts after a merge or pull
git status

# Look for files marked as "both modified"
# Conflict markers in files look like:
# <<<<<<< HEAD
# Your changes
# =======
# Their changes
# >>>>>>> branch-name
```

### Resolving Git Conflicts

#### Method 1: Manual Resolution

```bash
# 1. Open the conflicted file in your editor
# 2. Look for conflict markers (<<<<<<< ======= >>>>>>>)
# 3. Choose which changes to keep or combine them
# 4. Remove the conflict markers
# 5. Stage the resolved file
git add filename
# 6. Complete the merge
git commit
```

#### Method 2: Using Git Tools

```bash
# Use git mergetool for visual resolution
git mergetool

# Or abort the merge and try again
git merge --abort

# Reset to a clean state
git reset --hard HEAD
```

#### Method 3: Choose a Version

```bash
# Keep your version (current branch)
git checkout --ours filename

# Keep their version (incoming branch)
git checkout --theirs filename

# Stage the chosen version
git add filename
git commit
```

### Common FreshShare Git Conflict Scenarios

#### Package Dependencies Conflicts
```bash
# If package-lock.json conflicts:
rm package-lock.json
npm install
git add package-lock.json
git commit
```

#### Environment File Conflicts
```bash
# Never commit .env files - they should be in .gitignore
# If .env conflicts occur:
git reset HEAD .env
echo ".env" >> .gitignore
git add .gitignore
git commit -m "Add .env to gitignore"
```

---

## Deployment Conflicts

### Common Deployment Issues

1. **Application Root Path Mismatch**
2. **Node.js Version Conflicts**
3. **Process Manager Conflicts**
4. **File Structure Misalignment**

### Quick Deployment Conflict Resolution

```bash
# Run the comprehensive 503 fix script
cd /home/runner/work/FreshShare1.3/FreshShare1.3
./comprehensive-503-fix.sh

# Or use the troubleshooting script for diagnosis
./deployment/troubleshoot-503.sh
```

### Application Root Path Fix

```bash
# 1. Check current application root in cPanel
# 2. Correct the path from freshshare1.2 to freshshare1.3
# 3. Update the application startup file path
# 4. Restart the Node.js application

# Verify the fix:
cd /home/myfrovov/repositories/FreshShare1.3/deployment/
./troubleshoot-503.sh
```

### Node.js Version Conflicts

```bash
# Set the correct Node.js version path
export PATH=$HOME/nodevenv/freshshare1.3/18/bin:$PATH

# Verify Node.js version
node -v
npm -v

# Install dependencies if needed
npm install
```

---

## Service and Port Conflicts

### Identifying Port Conflicts

```bash
# Check what's running on your ports
netstat -tulpn | grep -E '3001|8080|80'

# Check for Node.js processes
ps aux | grep node

# Check PM2 processes
pm2 list
```

### Resolving Port Conflicts

#### Kill Conflicting Processes

```bash
# Kill all Node.js processes
pkill -f "node server.js"
pkill -f "node proxy-server.js"
pkill -f "node.*fastify"

# Or use PM2 to restart services
pm2 restart all
pm2 reload all
```

#### Change Port Configuration

```bash
# Update Express server port (in .env or config)
echo "PORT=3001" >> ~/public_html/.env

# Update Fastify backend port
echo "PORT=8080" >> ~/fastify-backend/.env

# Update proxy configuration if needed
```

### Service Startup Order

```bash
# Proper startup sequence:
# 1. Start Fastify backend first
cd ~/fastify-backend
npm start &

# 2. Start Express server
cd ~/public_html
npm start &

# 3. Check both services are running
curl -f http://localhost:8080/health || echo "Fastify not ready"
curl -f http://localhost:3001/ || echo "Express not ready"
```

---

## Path and Configuration Conflicts

### Common Path Issues

1. **Incorrect application root paths**
2. **Missing environment files**
3. **Wrong file permissions**
4. **Broken symlinks**

### Path Resolution Commands

```bash
# Fix application root path
# In cPanel: Setup Node.js App > Edit > Application Root: /home/myfrovov/freshshare1.3

# Create missing directories
mkdir -p ~/public_html
mkdir -p ~/fastify-backend

# Fix file permissions
chmod -R 755 ~/public_html
chmod -R 755 ~/fastify-backend

# Check for broken symlinks
find . -type l -exec test ! -e {} \; -print
```

### Configuration File Conflicts

#### Express Configuration
```bash
# Create Express .env file
cat > ~/public_html/.env << 'EOF'
PORT=3001
NODE_ENV=production
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/freshshare
JWT_SECRET=your-jwt-secret-key
FASTIFY_BACKEND_URL=http://localhost:8080
EOF
```

#### Fastify Configuration
```bash
# Create Fastify .env file
cat > ~/fastify-backend/.env << 'EOF'
PORT=8080
NODE_ENV=production
DATABASE_URL=mongodb+srv://username:password@cluster.mongodb.net/freshshare
JWT_SECRET=your-jwt-secret-key
EOF
```

---

## File Permission Conflicts

### Understanding Permission Issues

Permission conflicts occur when:
- Web server can't read application files
- Node.js can't write to log files
- Upload directories aren't writable

### Permission Resolution

```bash
# Standard web application permissions
# Files: 644 (readable by owner and group)
find ~/public_html -type f -exec chmod 644 {} \;

# Directories: 755 (executable/searchable by owner and group)
find ~/public_html -type d -exec chmod 755 {} \;

# Special permissions for uploads and logs
chmod 755 ~/public_html/uploads
chmod 755 ~/public_html/logs

# Make scripts executable
chmod +x ~/public_html/start-express.sh
chmod +x ~/fastify-backend/start-fastify.sh
```

### Ownership Issues

```bash
# Ensure correct ownership (replace 'myfrovov' with your username)
chown -R myfrovov:myfrovov ~/public_html
chown -R myfrovov:myfrovov ~/fastify-backend

# Check ownership
ls -la ~/public_html
ls -la ~/fastify-backend
```

---

## Environment Variable Conflicts

### Common Environment Issues

1. **Missing .env files**
2. **Conflicting environment variables**
3. **Incorrect database URLs**
4. **Missing JWT secrets**

### Environment Resolution

#### Check Current Environment
```bash
# List all environment variables
env | grep -E "NODE_ENV|PORT|MONGODB_URI|DATABASE_URL|JWT_SECRET"

# Check if .env files exist
ls -la ~/public_html/.env
ls -la ~/fastify-backend/.env
```

#### Create Environment Files
```bash
# Use the emergency fix script to create proper .env files
cd /home/runner/work/FreshShare1.3/FreshShare1.3
./fix-503-error.sh

# Or manually create them using the templates above
```

#### Environment Validation
```bash
# Test environment loading
cd ~/public_html
node -e "require('dotenv').config(); console.log('PORT:', process.env.PORT);"

cd ~/fastify-backend
node -e "require('dotenv').config(); console.log('PORT:', process.env.PORT);"
```

---

## Database Connection Conflicts

### Common Database Issues

1. **Incorrect MongoDB connection strings**
2. **Network connectivity problems**
3. **Authentication failures**
4. **Database timeout issues**

### Database Conflict Resolution

#### Test Database Connection
```bash
# Run the connection test
cd /home/runner/work/FreshShare1.3/FreshShare1.3
node check-deployment-status.js

# Or use a simple MongoDB connection test
node -e "
const { MongoClient } = require('mongodb');
const uri = process.env.MONGODB_URI || 'your-connection-string';
MongoClient.connect(uri)
  .then(() => console.log('✓ Database connected'))
  .catch(err => console.error('✗ Database error:', err.message));
"
```

#### Fix Connection String Format
```bash
# Correct MongoDB Atlas connection string format:
# mongodb+srv://username:password@cluster.mongodb.net/database?retryWrites=true&w=majority

# Update .env files with correct connection string
sed -i 's/MONGODB_URI=.*/MONGODB_URI=mongodb+srv:\/\/username:password@cluster.mongodb.net\/freshshare?retryWrites=true\&w=majority/' ~/public_html/.env
```

---

## Automated Conflict Resolution Tools

### Quick Fix Scripts

The repository includes several automated tools for conflict resolution:

#### 1. Comprehensive 503 Fix
```bash
./comprehensive-503-fix.sh
```
**Resolves:** Service conflicts, port issues, environment problems

#### 2. Troubleshooting Script
```bash
./deployment/troubleshoot-503.sh
```
**Diagnoses:** All common deployment conflicts

#### 3. One-Click Deploy
```bash
./one-click-deploy.sh
```
**Resolves:** Fresh deployment conflicts

#### 4. Emergency Fix Guide
```bash
# Follow the emergency fix guide
cat EMERGENCY_FIX_GUIDE.md
```
**Resolves:** Critical production issues

### Creating Custom Resolution Scripts

#### Conflict Detection Script
```bash
#!/bin/bash
# Create a custom conflict detection script

cat > ~/detect-conflicts.sh << 'EOF'
#!/bin/bash
echo "=== FreshShare Conflict Detection ==="

# Check for git conflicts
if git status --porcelain | grep -q "^UU\|^AA\|^DD"; then
    echo "⚠ Git conflicts detected"
fi

# Check for port conflicts
if netstat -tulpn | grep -E ':3001|:8080' > /dev/null; then
    echo "⚠ Port conflicts detected"
fi

# Check for permission issues
if [ ! -w ~/public_html ] || [ ! -w ~/fastify-backend ]; then
    echo "⚠ Permission conflicts detected"
fi

# Check for missing environment files
if [ ! -f ~/public_html/.env ] || [ ! -f ~/fastify-backend/.env ]; then
    echo "⚠ Environment conflicts detected"
fi

echo "Conflict detection complete."
EOF

chmod +x ~/detect-conflicts.sh
```

### Recovery Commands

#### Complete Reset (Nuclear Option)
```bash
# ⚠ WARNING: This will reset everything
# Use only when all else fails

# 1. Stop all services
pm2 kill
pkill -f node

# 2. Clean up
rm -rf ~/public_html/node_modules
rm -rf ~/fastify-backend/node_modules

# 3. Reinstall dependencies
cd ~/public_html && npm install
cd ~/fastify-backend && npm install

# 4. Restart services
./one-click-deploy.sh
```

#### Backup Before Resolution
```bash
# Always backup before major conflict resolution
BACKUP_DIR="~/conflict-backup-$(date +%Y%m%d-%H%M%S)"
mkdir -p $BACKUP_DIR

cp -r ~/public_html $BACKUP_DIR/
cp -r ~/fastify-backend $BACKUP_DIR/

echo "Backup created in $BACKUP_DIR"
```

---

## Prevention Tips

### Best Practices to Avoid Conflicts

1. **Regular Updates:** Keep dependencies updated
2. **Environment Management:** Use proper .env files
3. **Git Hygiene:** Commit frequently, pull before pushing
4. **Testing:** Test locally before deployment
5. **Documentation:** Keep configuration documented
6. **Monitoring:** Use health checks and logging

### Conflict Prevention Commands

```bash
# Setup git hooks for conflict prevention
git config merge.tool vimdiff
git config merge.conflictstyle diff3

# Setup automatic backup on deployment
echo "cp -r ~/public_html ~/backup-$(date +%Y%m%d)" >> ~/.bashrc

# Setup monitoring
echo "*/5 * * * * curl -f http://localhost:3001/health || echo 'Service down' | mail -s 'FreshShare Alert' your@email.com" | crontab -
```

---

## Getting Help

### When to Use Each Resolution Method

1. **Simple conflicts:** Use manual git resolution
2. **Service issues:** Use troubleshooting script
3. **Deployment problems:** Use comprehensive fix script
4. **Critical failures:** Use emergency fix guide
5. **Complex issues:** Use this comprehensive guide

### Support Resources

- **Emergency Fix Guide:** `EMERGENCY_FIX_GUIDE.md`
- **Deployment Guide:** `DEPLOYMENT_GUIDE_FOR_AI.md`
- **Troubleshooting Script:** `deployment/troubleshoot-503.sh`
- **Health Check:** `check-deployment-status.js`

Remember: Always backup your data before attempting major conflict resolution, and test changes in a staging environment when possible.