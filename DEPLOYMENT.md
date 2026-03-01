# ExamPro CMS - Docker Deployment Guide

This guide explains how to deploy ExamPro CMS on your own server using Docker.

## Prerequisites

- Docker Engine 20.10+
- Docker Compose 2.0+
- At least 1GB RAM
- 10GB disk space

## Quick Start

### 1. Clone or Download the Project

```bash
git clone <your-repo-url>
cd exampro-cms
```

### 2. Configure Environment Variables

Copy the example environment file and customize it:

```bash
cp .env.example .env
```

Edit `.env` with secure values:

```env
DB_PASSWORD=your-secure-database-password
SESSION_SECRET=your-super-secret-session-key-change-in-production
ADMIN_EMAIL=admin@yourdomain.com
ADMIN_PASSWORD=your-secure-admin-password
```

**Important:** Use strong, unique passwords in production!

## Authentication

When running in Docker (self-hosted), the application uses **local username/password authentication** instead of Replit Auth.

### Admin Account Setup

On first startup, an admin user is automatically created using the credentials in your `.env` file:
- Email: `ADMIN_EMAIL`
- Password: `ADMIN_PASSWORD`

**Both `ADMIN_EMAIL` and `ADMIN_PASSWORD` must be set in your `.env` file.** There are no default credentials for security reasons.

### User Registration

Users can register new accounts through the login page. The system supports:
- Email/password authentication
- Session-based login (7-day session duration)
- Secure password hashing with bcrypt

### 3. Build and Start the Application

```bash
docker-compose up -d --build
```

This will:
- Build the application image
- Start PostgreSQL database
- Start the ExamPro CMS application
- Set up networking between services

### 4. Access the Application

The application will automatically initialize the database schema on first startup.

Open your browser and navigate to:
- http://localhost:5000

## Production Deployment

### Using a Reverse Proxy (Nginx)

For production, put Nginx in front of the application:

```nginx
server {
    listen 80;
    server_name your-domain.com;
    
    location / {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

### SSL/TLS with Let's Encrypt

```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d your-domain.com
```

### External PostgreSQL Database

To use an external database instead of the Docker container:

1. Comment out the `db` service in `docker-compose.yml`
2. Set `DATABASE_URL` in your `.env`:

```env
DATABASE_URL=postgresql://user:password@your-db-host:5432/exampro
```

### Docker Compose Override for Production

Create `docker-compose.prod.yml`:

```yaml
version: '3.8'

services:
  app:
    restart: always
    environment:
      - NODE_ENV=production
    logging:
      driver: "json-file"
      options:
        max-size: "10m"
        max-file: "3"
```

Run with:
```bash
docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d
```

## Common Commands

### View Logs
```bash
docker-compose logs -f app
docker-compose logs -f db
```

### Stop the Application
```bash
docker-compose down
```

### Stop and Remove Volumes (Warning: Deletes Data!)
```bash
docker-compose down -v
```

### Rebuild After Code Changes
```bash
docker-compose up -d --build
```

### Access Database CLI
```bash
docker-compose exec db psql -U exampro -d exampro
```

### Expose Database Port for Development
If you need to access the database directly (for debugging/development), create a `docker-compose.override.yml`:

```yaml
version: '3.8'
services:
  db:
    ports:
      - "5432:5432"
```

**Note:** Never expose the database port in production!

### Run Database Migrations
```bash
docker-compose exec app npm run db:push
```

## Backup and Restore

### Backup Database
```bash
docker-compose exec db pg_dump -U exampro exampro > backup.sql
```

### Restore Database
```bash
cat backup.sql | docker-compose exec -T db psql -U exampro -d exampro
```

## Health Checks

The application includes a health check endpoint:

```bash
curl http://localhost:5000/api/health
```

Expected response:
```json
{"status":"ok","timestamp":"2025-01-17T12:00:00.000Z"}
```

## Troubleshooting

### Container won't start
Check logs: `docker-compose logs app`

### Database connection errors
1. Ensure the database is healthy: `docker-compose ps`
2. Check DATABASE_URL is correct
3. Wait for database to fully initialize on first start

### Permission issues
The app runs as non-root user (nodejs:1001). Ensure mounted volumes have correct permissions.

## System Requirements

| Resource | Minimum | Recommended |
|----------|---------|-------------|
| CPU | 1 core | 2+ cores |
| RAM | 512MB | 1GB+ |
| Disk | 5GB | 10GB+ |

## Security Considerations

1. **Change default passwords** - Never use default values in production
2. **Use HTTPS** - Set up SSL/TLS with Let's Encrypt or your certificate
3. **Firewall** - Only expose port 80/443, not 5000 or 5432 directly
4. **Regular updates** - Keep Docker images and dependencies updated
5. **Backups** - Set up automated database backups
