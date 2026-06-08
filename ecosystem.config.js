// PM2 ecosystem config
// Kullanım: pm2 start ecosystem.config.js
module.exports = {
  apps: [
    {
      name: 'paletpastanesi-menu',
      script: 'node_modules/.bin/next',
      args: 'start',
      cwd: __dirname,
      env: {
        NODE_ENV: 'production',
        PORT: 3003,
        BASE_PATH: '/paletpastanesi',
        JWT_SECRET: 'BURAYA_GUCLU_BIR_SIFRE_YAZIN',
      },
      instances: 1,
      exec_mode: 'fork',
      autorestart: true,
      watch: false,
      max_memory_restart: '500M',
    },
  ],
};
