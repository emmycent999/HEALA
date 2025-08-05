# Docker Build Fix Instructions

## Main Issues Identified:

1. **Missing Type Definitions**: Your build fails because TypeScript needs dev dependencies for compilation
2. **Docker Build Order**: Dependencies stage wasn't including dev dependencies needed for build
3. **Prisma Client**: Not properly copied to production stage

## Step-by-Step Fix:

### 1. Replace your Dockerfile with the fixed version:
```dockerfile
# ---- Base Stage ----
FROM node:18.17.0-alpine AS base
WORKDIR /app
# Install OpenSSL and curl for health checks
RUN apk add --no-cache openssl curl

# ---- Dependencies Stage ----
FROM base AS dependencies
COPY package*.json ./
# Install ALL dependencies (including devDependencies needed for build)
RUN npm ci

# ---- Build Stage ----
FROM dependencies AS build
COPY . .
# Generate the Prisma client
RUN npx prisma generate
# Build the TypeScript code (now we have all dev dependencies)
RUN npm run build

# ---- Production Stage ----
FROM base AS production
# Copy package files
COPY package*.json ./
# Install only production dependencies
RUN npm ci --only=production && npm cache clean --force

# Copy the built application from the build stage
COPY --from=build /app/dist ./dist
# Copy the prisma schema and generated client
COPY --from=build /app/prisma ./prisma
COPY --from=build /app/node_modules/.prisma ./node_modules/.prisma

# Create a non-root user for better security
RUN addgroup -S appgroup && adduser -S appuser -G appgroup
RUN chown -R appuser:appgroup /app
USER appuser

# Expose the application port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD curl -f http://localhost:3000/health || exit 1

# Define the command to run the application
CMD ["node", "dist/index.js"]
```

### 2. Update your package.json to include missing dev dependencies:
Add these to your devDependencies:
```json
{
  "devDependencies": {
    "@types/bcryptjs": "^2.4.6",
    "@types/cors": "^2.8.17",
    "@types/express": "^4.17.21",
    "@types/jsonwebtoken": "^9.0.5",
    "@types/morgan": "^1.9.9",
    "@types/multer": "^1.4.11",
    "@types/node": "^20.10.0",
    "typescript": "^5.3.2",
    "prisma": "^5.7.0"
  }
}
```

### 3. Fix TypeScript Configuration:
Update your tsconfig.json and set `exactOptionalPropertyTypes: false` to avoid strict type issues.

### 4. Update docker-compose.yml:
Remove the version field and add proper health checks and dependency conditions.

### 5. Install missing dependencies in your backend project:
```bash
cd healthcare-backend
npm install --save-dev @types/express @types/bcryptjs @types/jsonwebtoken @types/morgan @types/multer @types/cors @types/node typescript
```

### 6. Create a .env file with required variables:
```
DATABASE_URL=your_supabase_connection_string
JWT_SECRET=your_jwt_secret
REDIS_PASSWORD=your_redis_password
AWS_ACCESS_KEY_ID=your_aws_key
AWS_SECRET_ACCESS_KEY=your_aws_secret
AWS_REGION=your_aws_region
AWS_S3_BUCKET=your_s3_bucket
```

## Testing the Fix:

1. Build the image: `docker-compose build healthcare-api`
2. Run the stack: `docker-compose up -d`
3. Check logs: `docker-compose logs healthcare-api`

The key changes:
- Fixed dependency installation order
- Added missing type definitions
- Properly copied Prisma client to production
- Added health checks with curl
- Fixed TypeScript configuration issues