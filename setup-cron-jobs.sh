#!/bin/bash
# Setup cron jobs for automatic restart of FreshShare services
# This script sets up cron jobs to restart services on reboot and periodically check if they're running

echo "Setting up cron jobs for automatic restart..."

# Remove any existing cron jobs for these services to avoid duplicates
(crontab -l 2>/dev/null || echo "") | grep -v "start-fastify\\.sh\\|start-express\\.sh" > temp_cron

# Add reboot cron jobs
echo "@reboot ~/fastify-backend/start-fastify.sh" >> temp_cron
echo "@reboot sleep 10 && ~/public_html/start-express.sh" >> temp_cron

# Add monitoring cron jobs (every 5 minutes)
echo "*/5 * * * * if ! pgrep -f \"node.*server.ts\" > /dev/null; then cd ~/fastify-backend && ./start-fastify.sh; fi" >> temp_cron
echo "*/5 * * * * if ! pgrep -f \"node server.js\" > /dev/null; then cd ~/public_html && ./start-express.sh; fi" >> temp_cron

# Install the new crontab
crontab temp_cron
rm temp_cron

echo "Cron jobs installed successfully!"
echo ""
echo "The following jobs have been set up:"
echo "1. Start Fastify backend on system reboot"
echo "2. Start Express server on system reboot (with 10-second delay)"
echo "3. Check every 5 minutes if Fastify backend is running, restart if not"
echo "4. Check every 5 minutes if Express server is running, restart if not"
echo ""
echo "You can verify the cron jobs with: crontab -l"
