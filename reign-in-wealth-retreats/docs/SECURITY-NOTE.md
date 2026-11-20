# Security after sharing environment configuration

If an admin password hash or CRON_SECRET has been posted in a chat or other shared location, rotate the admin password and the cron secret before launch. Do not commit .env to Git. Changing CRON_SECRET also requires updating the scheduler / cPanel cron job configuration.
