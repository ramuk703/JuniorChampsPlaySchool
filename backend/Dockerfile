FROM node:20-alpine

WORKDIR /app

# Install production dependencies only
COPY package*.json ./

RUN npm ci --omit=dev --ignore-scripts

# Copy application source
COPY . .

# Create directories required at runtime
RUN mkdir -p /app/logs/app \
    /app/logs/error \
    /app/logs/requests \
    /app/logs/audit \
    /app/uploads

# Give the Node user ownership of the application
RUN chown -R node:node /app

# Run application as non-root user
USER node

EXPOSE 5000

# Docker health check
HEALTHCHECK --interval=30s \
    --timeout=5s \
    --start-period=20s \
    --retries=3 \
    CMD node -e "require('http').get('http://127.0.0.1:5000/', res => process.exit(res.statusCode === 200 ? 0 : 1)).on('error', () => process.exit(1))"

CMD ["node", "server.js"]