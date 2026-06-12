module.exports = {
  apps: [
    {
      name: 'mantecurated',
      script: 'node_modules/.bin/next',
      args: 'start -p ${PORT:-3010}',
      env: {
        NODE_ENV: 'production',
        PORT: 3010,
      },
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '512M',
    },
  ],
};
