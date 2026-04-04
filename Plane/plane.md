# StatusVault - Enterprise Uptime & SSL Monitoring Platform

A comprehensive SaaS platform for monitoring service uptime, SSL certificate expiration, and performance metrics with real-time alerts and advanced analytics.

## Features

### Core Monitoring
- **Uptime Monitoring**: Monitor services via HTTP(S), TCP, and ICMP ping
- **Real-time Alerts**: Instant notifications via Email, Slack, webhooks, and SMS
- **SSL Certificate Tracking**: Automatic monitoring of SSL expiration dates with renewal reminders
- **Performance Metrics**: Track response times with percentile analysis (p95, p99)
- **Global Monitoring**: Monitor services from 25+ worldwide locations

### Advanced Features
- **Incident Management**: Track, document, and analyze service incidents
- **Analytics Dashboard**: Comprehensive uptime trends and performance insights
- **Customizable Reports**: Generate detailed reports in PDF, CSV, or JSON formats
- **Team Management**: Invite team members with role-based access control
- **API Access**: Full REST API for custom integrations

### Dashboard
- **Real-time Overview**: Live status of all monitored services
- **Monitor Management**: Create and manage monitors with flexible configurations
- **Alert Center**: View and manage active, acknowledged, and resolved alerts
- **Incident Timeline**: Track service incidents with root cause analysis
- **Status Page**: Public status page for service transparency
- **Settings & Preferences**: Customize notifications and team settings

## Technology Stack

- **Frontend**: Next.js 16 with TypeScript and React 19
- **Styling**: Tailwind CSS 4 with shadcn/ui components
- **State Management**: React Context API
- **Charts**: Recharts for data visualization
- **Notifications**: Sonner for toast notifications
- **Storage**: localStorage (mock backend) - easily replaceable with any backend

## Quick Start

### Installation

```bash
# Clone the repository
git clone https://github.com/yourusername/statusvault.git
cd statusvault

# Install dependencies
pnpm install

# Run the development server
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) to view the app in your browser.

### Demo Credentials

The application runs in demo mode without a backend. To access the dashboard:

1. Visit `/auth/signup` or `/auth/login`
2. Use any email and password (demo credentials are automatically created)
3. You'll be logged in and can explore all features



## API Reference

The platform provides a complete REST API for integrations:

### Base URL
```
https://api.statusvault.com/v1
```

### Authentication
```
Authorization: Bearer YOUR_API_KEY
```

### Key Endpoints

#### Monitors
- `GET /monitors` - List all monitors
- `POST /monitors` - Create a new monitor
- `PUT /monitors/:id` - Update monitor
- `DELETE /monitors/:id` - Delete monitor

#### Incidents
- `GET /incidents` - List incidents
- `POST /incidents` - Report incident
- `PUT /incidents/:id` - Update incident
- `GET /incidents/:id/timeline` - Get incident timeline

#### Health Checks
- `GET /monitors/:id/health` - Get monitor health status
- `GET /monitors/:id/history` - Get health check history

### Webhooks

StatusVault sends real-time webhooks for:
- `monitor.down` - Monitor goes down
- `monitor.up` - Monitor recovers
- `incident.created` - New incident created
- `certificate.expiring` - SSL certificate expiring soon

Example webhook payload:
```json
{
  "event": "monitor.down",
  "monitor": {
    "id": "mon_123",
    "name": "API Server",
    "url": "https://api.example.com"
  },
  "status": "down",
  "timestamp": "2024-01-15T10:30:00Z",
  "message": "Service is unreachable"
}
```

## Configuration

### Environment Variables

```env
# Database (replace with your backend)
DATABASE_URL=postgresql://user:password@localhost/statusvault

# API Keys
API_SECRET_KEY=your_secret_key

# Email Configuration
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-password

# Slack Integration
SLACK_WEBHOOK_URL=https://hooks.slack.com/services/...

# SMS Integration (Twilio)
TWILIO_ACCOUNT_SID=your_account_sid
TWILIO_AUTH_TOKEN=your_auth_token
```

## Health Check Configuration

Configure how monitors check services:

### HTTP(S) Monitors
```javascript
{
  type: 'http',
  url: 'https://api.example.com/health',
  interval: 60,        // Check every 60 seconds
  timeout: 30,         // 30 second timeout
  expectedStatus: 200, // Expected HTTP status
}
```

### TCP Monitors
```javascript
{
  type: 'tcp',
  url: 'db.example.com:5432',
  interval: 120,
  timeout: 30,
}
```

### ICMP Ping Monitors
```javascript
{
  type: 'ping',
  url: 'example.com',
  interval: 300,
  timeout: 10,
}
```

## Notification Channels

### Email
- Send alerts to team email addresses
- Configurable templates
- Digest emails with daily summary

### Slack
- Real-time notifications to Slack channels
- Rich message formatting
- Thread organization by monitor

### Webhooks
- POST JSON data to custom endpoints
- Custom headers support
- Retry logic with exponential backoff

### SMS
- SMS alerts for critical incidents
- Twilio integration
- Customizable alert thresholds

## Development

### Running Tests
```bash
pnpm test
```

### Building for Production
```bash
pnpm build
pnpm start
```

### Code Quality
```bash
pnpm lint      # Run ESLint
pnpm format    # Format with Prettier
```

## Performance Optimization

- **Real-time Updates**: React Context API for efficient state management
- **Lazy Loading**: Dynamic imports for dashboard components
- **Chart Optimization**: Recharts with memoization
- **Caching**: LocalStorage for auth and user preferences

## Security

- **Authentication**: JWT-based authentication with secure tokens
- **Authorization**: Role-based access control (RBAC)
- **Data Encryption**: Encrypted storage of sensitive credentials
- **API Security**: Rate limiting, CORS, and input validation
- **Audit Logging**: Track all user actions and changes
- **SQL Injection Prevention**: Parameterized queries

## Roadmap

- [ ] Database Integration (PostgreSQL/MongoDB)
- [ ] Advanced Alerting Rules Engine
- [ ] Custom Metrics Collection
- [ ] Mobile App (iOS/Android)
- [ ] AI-powered Incident Analysis
- [ ] Synthetic Monitoring
- [ ] RUM (Real User Monitoring)
- [ ] Service Mesh Integration
- [ ] On-Premise Deployment
- [ ] Multi-region Monitoring

## Contributing

We welcome contributions! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Support

- **Documentation**: [https://statusvault.com/docs](https://statusvault.com/docs)
- **API Docs**: [https://statusvault.com/api](https://statusvault.com/api)
- **Email Support**: support@statusvault.com
- **Status Page**: [https://status.statusvault.com](https://status.statusvault.com)

## Team

Built with ❤️ by the StatusVault team

## Changelog

### v1.0.0 (Current)
- Initial release with core monitoring features
- Real-time health checks
- Alert management system
- Analytics dashboard
- SSL certificate tracking
- Incident management
- API documentation
- Public status page

---

For more information, visit [statusvault.com](https://statusvault.com)
