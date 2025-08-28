# FreshShare 1.3 Deployment Verification Checklist

This checklist helps verify that your FreshShare 1.3 deployment was successful, with special attention to MongoDB bypass functionality.

## 1. Server Access and File Verification

- [ ] SSH access to the production server works
- [ ] All required files are present in the deployment directory
  ```bash
  ls -la ~/freshshare1.3
  ls -la ~/freshshare1.3/fastify-backend
  ```
- [ ] Configuration files exist
  ```bash
  # Check for .env files
  ls -la ~/freshshare1.3/.env
  ls -la ~/freshshare1.3/fastify-backend/.env

  # Check for MongoDB fallback configuration
  ls -la ~/freshshare1.3/config/mongodb-production-fallback.js
  ```

## 2. Process Verification

- [ ] Check for running Node.js processes
  ```bash
  ps aux | grep node
  ```
- [ ] Verify listening ports
  ```bash
  netstat -tulpn | grep LISTEN
  # Should show ports 3001 (Express) and 8080 (Fastify)
  ```
- [ ] Verify the processes have been running for the expected duration
  ```bash
  ps -eo pid,etime,cmd | grep node
  ```

## 3. Application Functionality

- [ ] Test Express server health
  ```bash
  curl -I http://localhost:3001/api/test
  # Should return HTTP 200
  ```
- [ ] Test Fastify backend health
  ```bash
  curl -I http://localhost:8080/api/health
  # Should return HTTP 200
  ```
- [ ] Verify public website accessibility
  ```bash
  curl -I https://your-domain.com
  # Should return HTTP 200
  ```
- [ ] Test API endpoints through the proxy
  ```bash
  curl -I https://your-domain.com/api/test
  # Should return HTTP 200
  ```

## 4. MongoDB Bypass Verification

- [ ] Verify MongoDB fallback configuration exists
  ```bash
  cat ~/freshshare1.3/config/mongodb-production-fallback.js
  ```
- [ ] Check server logs for MongoDB connection attempts
  ```bash
  grep -i "mongodb" ~/freshshare1.3/logs/express-server.log
  grep -i "mongodb" ~/freshshare1.3/fastify-backend/logs/fastify-server.log
  ```
- [ ] Verify application starts despite MongoDB connection failures
  ```bash
  # Look for messages indicating fallback usage
  grep -i "fallback" ~/freshshare1.3/logs/express-server.log
  ```

## 5. Front-end Verification

- [ ] Check if static assets load correctly
  ```bash
  curl -I https://your-domain.com/css/style.css
  curl -I https://your-domain.com/js/auth.js
  ```
- [ ] Test the login page
  ```bash
  curl -I https://your-domain.com/login
  ```
- [ ] Test the signup page
  ```bash
  curl -I https://your-domain.com/signup
  ```

## 6. Security Verification

- [ ] Verify HTTPS is working correctly
  ```bash
  curl -I https://your-domain.com
  # Should show TLS/SSL information
  ```
- [ ] Check for security headers
  ```bash
  curl -I https://your-domain.com | grep -i "strict-transport\|content-security\|x-frame\|x-xss"
  ```
- [ ] Verify .env files have correct permissions
  ```bash
  ls -la ~/freshshare1.3/.env
  # Should show 600 or 640 permissions (not world-readable)
  ```

## 7. Error Logging and Monitoring

- [ ] Verify log files exist and are being written to
  ```bash
  ls -la ~/freshshare1.3/logs/
  ls -la ~/freshshare1.3/fastify-backend/logs/
  ```
- [ ] Check for error messages in logs
  ```bash
  grep -i "error\|exception\|fail" ~/freshshare1.3/logs/express-server.log
  grep -i "error\|exception\|fail" ~/freshshare1.3/fastify-backend/logs/fastify-server.log
  ```
- [ ] Verify monitoring script is installed
  ```bash
  ls -la ~/freshshare1.3/monitor.sh
  ```
- [ ] Verify cron job for monitoring is set up
  ```bash
  crontab -l | grep monitor.sh
  ```

## 8. Fallback Database Verification

If using PostgreSQL as a fallback:

- [ ] Verify PostgreSQL connection
  ```bash
  DATABASE_URL="postgresql://username:password@localhost:5432/database_name" node -e "const { Pool } = require('pg'); const pool = new Pool({ connectionString: process.env.DATABASE_URL }); pool.query('SELECT NOW()', (err, res) => { if (err) { console.error('PostgreSQL connection error:', err); } else { console.log('PostgreSQL connection successful:', res.rows[0]); } pool.end(); });"
  ```
- [ ] Check if data is being saved to PostgreSQL
  ```bash
  # Connect to PostgreSQL and check tables
  psql -U username -d database_name -c "\dt"
  ```

## 9. Cleanup Verification

- [ ] Check for temporary files or build artifacts that should be removed
  ```bash
  find ~/freshshare1.3 -name "*.tmp" -o -name "*.log.old"
  ```
- [ ] Verify no development dependencies are installed in production
  ```bash
  npm list --depth=0 --production=false | grep -i "dev"
  ```

## 10. Next Steps After Verification

If all checks pass, your deployment is successful. If any checks fail:

1. Review logs for specific error messages
2. Check the MongoDB bypass functionality
3. Verify environment variables are correctly set
4. Restart the services if necessary
5. Consider adding the server IP to MongoDB Atlas whitelist

## Reference: Quick Troubleshooting Commands

```bash
# Restart Express server
cd ~/freshshare1.3
pm2 restart express-server || node server.js &

# Restart Fastify backend
cd ~/freshshare1.3/fastify-backend
pm2 restart fastify-backend || node app.js &

# Check for port conflicts
sudo lsof -i :3001
sudo lsof -i :8080

# Repair permissions if needed
chmod 600 ~/freshshare1.3/.env
chmod 600 ~/freshshare1.3/fastify-backend/.env
chmod +x ~/freshshare1.3/*.sh
chmod +x ~/freshshare1.3/fastify-backend/*.sh
```

Use this checklist methodically to verify each aspect of the deployment. Once all items are checked, your deployment should be functional and resilient, even with MongoDB Atlas connection issues.
