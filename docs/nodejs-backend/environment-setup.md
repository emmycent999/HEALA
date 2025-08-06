# Environment Configuration Guide

## Setting Up Environment Variables for Frontend Communication

### 1. Frontend URL Configuration

Your frontend runs on `http://localhost:8080` (from vite.config.ts), so you need to configure your backend to allow communication from this origin.

### 2. Create .env file in your backend project root

```bash
# Copy the example file
cp .env.example .env
```

### 3. Update the following variables in .env:

```bash
# Frontend Configuration - UPDATE THESE
FRONTEND_URL="http://localhost:8080"
CLIENT_ORIGIN="http://localhost:8080"
CORS_ORIGINS="http://localhost:8080,https://yourdomain.com"

# For production, add your deployed frontend URL:
# CORS_ORIGINS="http://localhost:8080,https://yourapp.vercel.app,https://yourdomain.com"
```

### 4. CORS Configuration in Express

Your backend should configure CORS like this:

```javascript
// app.js or server.js
const cors = require('cors');

const corsOptions = {
  origin: process.env.CORS_ORIGINS?.split(',') || ['http://localhost:8080'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
};

app.use(cors(corsOptions));
```

### 5. WebSocket Configuration (if using Socket.IO)

```javascript
const io = new Server(server, {
  cors: {
    origin: process.env.CLIENT_ORIGIN || "http://localhost:8080",
    credentials: true
  }
});
```

### 6. Environment Variables by Environment

#### Development (.env.development)
```bash
FRONTEND_URL="http://localhost:8080"
CLIENT_ORIGIN="http://localhost:8080"
CORS_ORIGINS="http://localhost:8080"
NODE_ENV=development
```

#### Production (.env.production)
```bash
FRONTEND_URL="https://yourapp.vercel.app"
CLIENT_ORIGIN="https://yourapp.vercel.app"
CORS_ORIGINS="https://yourapp.vercel.app,https://yourdomain.com"
NODE_ENV=production
```

### 7. Docker Configuration

In your docker-compose.yml, make sure environment variables are properly passed:

```yaml
healthcare-api:
  build:
    context: ./healthcare-backend
  environment:
    - NODE_ENV=production
    - FRONTEND_URL=${FRONTEND_URL}
    - CLIENT_ORIGIN=${CLIENT_ORIGIN}
    - CORS_ORIGINS=${CORS_ORIGINS}
  env_file:
    - ./healthcare-backend/.env
```

### 8. Verifying Configuration

1. Start your backend: `npm run dev`
2. Check console logs for CORS configuration
3. Test API calls from frontend
4. Check browser network tab for CORS errors

### 9. Common Issues & Solutions

#### CORS Blocked
- Ensure `CORS_ORIGINS` includes your frontend URL
- Check for trailing slashes in URLs
- Verify credentials: true if using authentication

#### WebSocket Connection Failed
- Update `CLIENT_ORIGIN` to match your frontend URL
- Check firewall settings for WebSocket connections

#### Environment Variables Not Loading
- Ensure .env file is in the correct directory
- Use dotenv package: `require('dotenv').config()`
- Check file permissions

### 10. Production Deployment Checklist

- [ ] Update CORS_ORIGINS with production frontend URL
- [ ] Set NODE_ENV to "production"
- [ ] Use HTTPS URLs in production
- [ ] Configure proper security headers
- [ ] Set up environment variables in hosting platform
- [ ] Test cross-origin requests in production

### 11. Security Best Practices

- Never commit .env files to version control
- Use specific origins instead of "*" for CORS
- Implement rate limiting
- Use HTTPS in production
- Validate environment variables on startup