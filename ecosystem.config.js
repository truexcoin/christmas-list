module.exports = {
  apps: [
    {
      name: 'christmas-list',
      // For standalone builds, use the server.js from standalone directory
      // For regular builds, this will fallback to npm start in setup scripts
      script: 'node_modules/next/dist/bin/next',
      args: 'start',
      cwd: '/var/www/christmas-list',
      instances: 1,
      exec_mode: 'fork',
      env: {
        NODE_ENV: 'production',
        PORT: 3000,
        HOSTNAME: '0.0.0.0',
      },
      env_file: '/var/www/christmas-list/.env',
      error_file: '/var/www/christmas-list/logs/pm2-error.log',
      out_file: '/var/www/christmas-list/logs/pm2-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      merge_logs: true,
      autorestart: true,
      max_restarts: 10,
      min_uptime: '10s',
      max_memory_restart: '500M',
      watch: false,
      ignore_watch: ['node_modules', 'logs', '.next'],
    },
  ],
};

