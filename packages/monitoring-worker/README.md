# StatusVault Monitoring Worker

Automated background monitoring service for StatusVault that performs health checks at configured intervals.

## Features

- **HTTP/HTTPS Monitoring**: Check websites and APIs with configurable timeouts
- **TCP Port Monitoring**: Verify database and service connectivity
- **SSL Certificate Tracking**: Automatic SSL expiry detection
- **Incident Auto-Creation**: Creates incidents when monitors fail
- **Alert Generation**: Triggers alerts for downtime
- **Uptime Calculation**: Calculates 24h, 7d, and 30d uptime percentages

## Quick Start

### Prerequisites

- Node.js 22+
- Supabase project with monitoring tables
- Service Role Key for database access

### Environment Variables

```bash
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
SMTP_HOST=smtp.hostinger.com
SMTP_PORT=465
SMTP_SECURE=true
SMTP_USER=uptime@your-domain.com
SMTP_PASS=your-smtp-password
SMTP_FROM_EMAIL=uptime@your-domain.com
SMTP_FROM_NAME="Uptime by Flinkeo"
```

The SMTP variables are required only if you want email notification channels to send real alert emails from the worker.

### Email Templates

The worker now includes reusable HTML email templates and bundled assets:

```text
src/email/templates/
src/email/assets/
```

Current templates:

- `monitor-down.html`
- `monitor-recovered.html`
- `ssl-expiring.html`
- `team-invite.html`
- `weekly-uptime-report.html`

During `pnpm build`, the `src/email` folder is copied into `dist/email` so the compiled worker can still load the HTML files and images.

### Development

```bash
# Install dependencies
pnpm install

# Run in development mode
pnpm dev
```

### Production

```bash
# Build
pnpm build

# Run
pnpm start
```

### Docker

```bash
# Build image
docker build -t statusvault-worker -f Dockerfile ../..

# Run container
docker run -e SUPABASE_URL=xxx -e SUPABASE_SERVICE_ROLE_KEY=xxx statusvault-worker
```

## How It Works

1. **Monitor Loading**: Worker loads all non-paused monitors from the database
2. **Scheduling**: Each monitor is scheduled based on its interval using node-cron
3. **Health Checks**: At each interval, the worker performs the appropriate check (HTTP/TCP)
4. **Data Storage**: Results are saved to the `health_checks` table
5. **Status Updates**: Monitor status and uptime percentages are updated
6. **Incident Creation**: If a monitor goes down, an incident and alert are created
7. **SSL Tracking**: SSL certificates are checked and expiry dates recorded

## Architecture

```
┌─────────────┐     ┌──────────────┐     ┌─────────────────┐
│   Monitor   │────▶│  Scheduler   │────▶│  Health Checker │
│   Loader    │     │  (node-cron) │     │  (HTTP/TCP/SSL) │
└─────────────┘     └──────────────┘     └─────────────────┘
                                                │
                                                ▼
┌─────────────┐     ┌──────────────┐     ┌─────────────────┐
│   Alerts    │◀────│   Incident   │◀────│   Save Results  │
│   Created   │     │   Created    │     │   to Database   │
└─────────────┘     └──────────────┘     └─────────────────┘
```

## Monitor Types

| Type | Description | Example |
|------|-------------|---------|
| `http` | HTTP GET request | `http://api.example.com/health` |
| `https` | HTTPS GET request with SSL check | `https://example.com` |
| `tcp` | TCP connection test | `tcp://db.example.com:5432` |

## Configuration

Monitors are configured in the database with these key fields:

- `interval`: Check interval in seconds (min: 60)
- `timeout`: Request timeout in seconds
- `expected_status`: Expected HTTP status code (optional)

## Deployment Options

### Railway
```bash
railway up
```

### Render
Use the Dockerfile for web service deployment.

### VPS/Dedicated Server
```bash
git clone <repo>
cd packages/monitoring-worker
pnpm install
pnpm build
pm2 start dist/worker.js --name statusvault-worker
```

## Monitoring

The worker logs all activities to stdout:

```
[Worker] Loaded 5 monitors
Scheduled monitor abc-123 (API Server) - every 60s
[2024-01-15T10:30:00Z] Checking monitor: API Server (https://api.example.com)
  SSL expires in 45 days
  ✅ Status: up, Response: 245ms
```

## Troubleshooting

### Connection refused errors
- Verify Supabase URL and service role key
- Check network connectivity to Supabase
- Ensure database tables exist

### Monitors not being checked
- Verify monitor status is not 'paused'
- Check interval is at least 60 seconds
- Review worker logs for errors

### SSL checks failing
- Some self-signed certificates may cause errors
- Worker allows self-signed certificates but logs warnings
