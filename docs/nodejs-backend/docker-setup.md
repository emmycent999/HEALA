# Docker Implementation Guide

This guide covers containerizing the Node.js healthcare backend and integrating with Supabase.

## 🐳 Docker Configuration

### Dockerfile

```dockerfile
# Use Node.js 18 Alpine for smaller image size
FROM node:18-alpine

# Set working directory
WORKDIR /app

# Install system dependencies
RUN apk add --no-cache \
    python3 \
    make \
    g++ \
    postgresql-client

# Copy package files
COPY package*.json ./
COPY prisma ./prisma/

# Install dependencies
RUN npm ci --only=production

# Copy source code
COPY . .

# Generate Prisma client
RUN npx prisma generate

# Build TypeScript
RUN npm run build

# Create non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

# Change ownership and switch to non-root user
RUN chown -R nodejs:nodejs /app
USER nodejs

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:3000/health || exit 1

# Start application
CMD ["npm", "start"]
```

### .dockerignore

```dockerignore
node_modules
npm-debug.log
.git
.gitignore
README.md
.env
.nyc_output
coverage
.coverage
.coverage-final.json
.env.local
.env.development.local
.env.test.local
.env.production.local
dist
logs
*.log
.DS_Store
.vscode
.idea
*.swp
*.swo
*~
```

## 🐙 Docker Compose Setup

### docker-compose.yml

```yaml
version: '3.8'

services:
  # Healthcare Backend API
  healthcare-api:
    build:
      context: .
      dockerfile: Dockerfile
    container_name: healthcare-backend
    restart: unless-stopped
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - PORT=3000
      - DATABASE_URL=${SUPABASE_DB_URL}
      - JWT_SECRET=${JWT_SECRET}
      - AWS_ACCESS_KEY_ID=${AWS_ACCESS_KEY_ID}
      - AWS_SECRET_ACCESS_KEY=${AWS_SECRET_ACCESS_KEY}
      - AWS_BUCKET_NAME=${AWS_BUCKET_NAME}
      - AWS_REGION=${AWS_REGION}
      - PAYSTACK_SECRET_KEY=${PAYSTACK_SECRET_KEY}
      - SUPABASE_URL=${SUPABASE_URL}
      - SUPABASE_ANON_KEY=${SUPABASE_ANON_KEY}
      - SUPABASE_SERVICE_ROLE_KEY=${SUPABASE_SERVICE_ROLE_KEY}
    volumes:
      - ./uploads:/app/uploads
      - ./logs:/app/logs
    networks:
      - healthcare-network
    depends_on:
      - redis
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3000/health"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 40s

  # Redis for caching and sessions
  redis:
    image: redis:7-alpine
    container_name: healthcare-redis
    restart: unless-stopped
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data
    networks:
      - healthcare-network
    command: redis-server --appendonly yes --requirepass ${REDIS_PASSWORD}

  # Nginx reverse proxy
  nginx:
    image: nginx:alpine
    container_name: healthcare-nginx
    restart: unless-stopped
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf
      - ./ssl:/etc/nginx/ssl
    networks:
      - healthcare-network
    depends_on:
      - healthcare-api

volumes:
  redis_data:

networks:
  healthcare-network:
    driver: bridge
```

### Development Docker Compose

```yaml
# docker-compose.dev.yml
version: '3.8'

services:
  healthcare-api:
    build:
      context: .
      dockerfile: Dockerfile.dev
    container_name: healthcare-backend-dev
    restart: unless-stopped
    ports:
      - "3000:3000"
      - "9229:9229" # Debug port
    environment:
      - NODE_ENV=development
      - PORT=3000
      - DATABASE_URL=${SUPABASE_DB_URL}
    volumes:
      - .:/app
      - /app/node_modules
    networks:
      - healthcare-network
    command: npm run dev

  redis:
    image: redis:7-alpine
    container_name: healthcare-redis-dev
    ports:
      - "6379:6379"
    networks:
      - healthcare-network

networks:
  healthcare-network:
    driver: bridge
```

### Development Dockerfile

```dockerfile
# Dockerfile.dev
FROM node:18-alpine

WORKDIR /app

# Install system dependencies
RUN apk add --no-cache python3 make g++ postgresql-client

# Copy package files
COPY package*.json ./

# Install all dependencies (including dev)
RUN npm install

# Copy source code
COPY . .

# Generate Prisma client
RUN npx prisma generate

# Expose ports
EXPOSE 3000 9229

# Start in development mode
CMD ["npm", "run", "dev"]
```

## 🔗 Supabase Integration

### Database Connection

```typescript
// src/config/database.ts
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL // Supabase DB URL
    }
  },
  log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error']
});

export default prisma;
```

### Supabase Client Integration

```typescript
// src/config/supabase.ts
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

// For file storage operations
export const supabaseStorage = supabase.storage;
```

### Environment Configuration

```bash
# .env.production
NODE_ENV=production
PORT=3000

# Supabase Configuration
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
SUPABASE_DB_URL=postgresql://postgres:[password]@db.your-project.supabase.co:5432/postgres

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key
JWT_EXPIRES_IN=7d

# AWS Configuration
AWS_ACCESS_KEY_ID=your-aws-access-key
AWS_SECRET_ACCESS_KEY=your-aws-secret-key
AWS_BUCKET_NAME=healthcare-documents
AWS_REGION=us-east-1

# Paystack Configuration
PAYSTACK_SECRET_KEY=sk_live_your-paystack-secret-key
PAYSTACK_PUBLIC_KEY=pk_live_your-paystack-public-key

# Redis Configuration
REDIS_PASSWORD=your-redis-password
REDIS_URL=redis://redis:6379

# Email Configuration (Optional)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
```

## 🚀 Deployment Strategies

### Option 1: Single Container Deployment

```bash
# Build and run single container
docker build -t healthcare-backend .
docker run -d \
  --name healthcare-api \
  -p 3000:3000 \
  --env-file .env.production \
  healthcare-backend
```

### Option 2: Docker Compose Deployment

```bash
# Production deployment
docker-compose up -d

# Development deployment
docker-compose -f docker-compose.dev.yml up -d

# Scale services
docker-compose up -d --scale healthcare-api=3
```

### Option 3: Docker Swarm

```yaml
# docker-stack.yml
version: '3.8'

services:
  healthcare-api:
    image: healthcare-backend:latest
    deploy:
      replicas: 3
      restart_policy:
        condition: on-failure
        delay: 5s
        max_attempts: 3
      update_config:
        parallelism: 1
        delay: 10s
        failure_action: rollback
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
    networks:
      - healthcare-overlay

networks:
  healthcare-overlay:
    driver: overlay
    attachable: true
```

## 🔧 Nginx Configuration

```nginx
# nginx.conf
events {
    worker_connections 1024;
}

http {
    upstream healthcare_backend {
        server healthcare-api:3000;
    }

    server {
        listen 80;
        server_name api.yourdomain.com;

        # Redirect HTTP to HTTPS
        return 301 https://$server_name$request_uri;
    }

    server {
        listen 443 ssl http2;
        server_name api.yourdomain.com;

        ssl_certificate /etc/nginx/ssl/cert.pem;
        ssl_certificate_key /etc/nginx/ssl/key.pem;

        # Security headers
        add_header X-Frame-Options SAMEORIGIN;
        add_header X-Content-Type-Options nosniff;
        add_header X-XSS-Protection "1; mode=block";

        # API routes
        location / {
            proxy_pass http://healthcare_backend;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
            
            # WebSocket support
            proxy_http_version 1.1;
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection "upgrade";
        }

        # File upload size
        client_max_body_size 100M;
    }
}
```

## 📊 Monitoring & Logging

### Health Check Endpoint

```typescript
// src/routes/health.ts
import express from 'express';
import prisma from '../config/database';

const router = express.Router();

router.get('/health', async (req, res) => {
  try {
    // Check database connection
    await prisma.$queryRaw`SELECT 1`;
    
    res.status(200).json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      database: 'connected',
      memory: process.memoryUsage()
    });
  } catch (error) {
    res.status(503).json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: 'Database connection failed'
    });
  }
});

export default router;
```

### Docker Logging Configuration

```yaml
# In docker-compose.yml
services:
  healthcare-api:
    logging:
      driver: "json-file"
      options:
        max-size: "10m"
        max-file: "3"
        labels: "healthcare-backend"
```

## 🔐 Security Considerations

### Container Security

```dockerfile
# Security-hardened Dockerfile
FROM node:18-alpine

# Update packages and remove unnecessary ones
RUN apk update && apk upgrade && \
    apk add --no-cache python3 make g++ postgresql-client && \
    rm -rf /var/cache/apk/*

# Create non-root user early
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

WORKDIR /app

# Copy and install dependencies as root
COPY package*.json ./
RUN npm ci --only=production && npm cache clean --force

# Copy source code and change ownership
COPY --chown=nodejs:nodejs . .

# Generate Prisma client
RUN npx prisma generate

# Switch to non-root user
USER nodejs

# Remove unnecessary packages
RUN npm uninstall -g npm

EXPOSE 3000
CMD ["node", "dist/server.js"]
```

## 🚀 Deployment Commands

### Local Development

```bash
# Start development environment
docker-compose -f docker-compose.dev.yml up -d

# View logs
docker-compose logs -f healthcare-api

# Run migrations
docker-compose exec healthcare-api npx prisma migrate deploy

# Seed database
docker-compose exec healthcare-api npm run seed
```

### Production Deployment

```bash
# Build production image
docker build -t healthcare-backend:latest .

# Tag for registry
docker tag healthcare-backend:latest your-registry.com/healthcare-backend:latest

# Push to registry
docker push your-registry.com/healthcare-backend:latest

# Deploy with compose
docker-compose up -d

# Update deployment
docker-compose pull && docker-compose up -d
```

### AWS ECS Deployment

```json
{
  "family": "healthcare-backend",
  "networkMode": "awsvpc",
  "requiresCompatibilities": ["FARGATE"],
  "cpu": "512",
  "memory": "1024",
  "executionRoleArn": "arn:aws:iam::account:role/ecsTaskExecutionRole",
  "containerDefinitions": [
    {
      "name": "healthcare-api",
      "image": "your-registry.com/healthcare-backend:latest",
      "portMappings": [
        {
          "containerPort": 3000,
          "protocol": "tcp"
        }
      ],
      "environment": [
        {
          "name": "NODE_ENV",
          "value": "production"
        }
      ],
      "secrets": [
        {
          "name": "DATABASE_URL",
          "valueFrom": "arn:aws:secretsmanager:region:account:secret:healthcare/database-url"
        }
      ],
      "logConfiguration": {
        "logDriver": "awslogs",
        "options": {
          "awslogs-group": "/ecs/healthcare-backend",
          "awslogs-region": "us-east-1",
          "awslogs-stream-prefix": "ecs"
        }
      }
    }
  ]
}
```

## 📈 Scaling Considerations

### Horizontal Scaling

```yaml
# docker-compose.scale.yml
version: '3.8'

services:
  healthcare-api:
    deploy:
      replicas: 3
    environment:
      - REDIS_URL=redis://redis:6379
    depends_on:
      - redis
      - load-balancer

  load-balancer:
    image: nginx:alpine
    ports:
      - "80:80"
    volumes:
      - ./nginx-lb.conf:/etc/nginx/nginx.conf
```

### Resource Limits

```yaml
services:
  healthcare-api:
    deploy:
      resources:
        limits:
          cpus: '0.5'
          memory: 512M
        reservations:
          cpus: '0.25'
          memory: 256M
```

## 🔄 CI/CD Integration

### GitHub Actions

```yaml
# .github/workflows/deploy.yml
name: Deploy Healthcare Backend

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    
    steps:
    - uses: actions/checkout@v3
    
    - name: Build Docker image
      run: docker build -t healthcare-backend:${{ github.sha }} .
    
    - name: Deploy to production
      run: |
        docker-compose down
        docker-compose pull
        docker-compose up -d
```

This comprehensive Docker setup provides a production-ready containerized environment for your healthcare backend with seamless Supabase integration.