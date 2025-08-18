module.exports = {
  apps: [
    {
      name: "express-frontend",
      cwd: "/home/myfrovov/public_html",
      script: "server.js",
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: "500M",
      env: {
        NODE_ENV: "production"
      }
    },
    {
      name: "fastify-backend",
      cwd: "/home/myfrovov/fastify-backend",
      script: "server.ts",
      interpreter: "node",
      interpreter_args: "--require ts-node/register",
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: "500M",
      env: {
        NODE_ENV: "production"
      }
    }
  ]
};
