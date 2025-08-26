module.exports = {
  apps: [
    {
      name: 'freshshare-fastify',
      script: 'server.ts',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '500M',
      interpreter: 'node',
      interpreter_args: '--loader ts-node/esm',
      env: {
        NODE_ENV: 'production',
        PORT: 8089,
      },
    },
  ],
};
