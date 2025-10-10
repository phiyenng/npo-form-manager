module.exports = {
  apps: [{
    name: 'npo-form-manager',
    script: 'node_modules/next/dist/bin/next',
    args: 'start',
    cwd: 'C:\\Users\\Administrator\\Documents\\npo-form-manager',
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
    env: {
      NODE_ENV: 'production',
      PORT: 3000,
      NEXT_PUBLIC_SUPABASE_URL: 'https://115.78.100.151',
      NEXT_PUBLIC_SUPABASE_ANON_KEY: 'sb_publishable_ACJWlzQHlZjBrEguHvfOxg_3BJgxAaH',
      SUPABASE_SERVICE_ROLE_KEY: 'sb_secret_N7UND0UgjKTVK-Uodkm0Hg_xSvEMPvz'
    },
    error_file: './logs/err.log',
    out_file: './logs/out.log',
    log_file: './logs/combined.log',
    time: true
  }]
}