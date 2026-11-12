// PM2 process file — production: `pm2 start ecosystem.config.cjs && pm2 save`
module.exports = {
  apps: [
    {
      name: 'arkan-front',
      script: 'node_modules/next/dist/bin/next',
      args: 'start',
      cwd: __dirname,
      env: {
        NODE_ENV: 'production',
        PORT: 3010,
      },
      max_memory_restart: '700M',
      time: true,
    },
  ],
};
