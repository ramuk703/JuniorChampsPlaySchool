FROM node:20-alpine

WORKDIR /app

# Install production dependencies only
COPY --chown=node:node package*.json ./

RUN npm ci --omit=dev --ignore-scripts

# Copy application source with correct ownership
COPY --chown=node:node . .

# Create runtime directories and assign them to the non-root user
RUN mkdir -p \
    /app/logs/app \
    /app/logs/error \
    /app/logs/requests \
    /app/logs/audit \
    /app/uploads \
    && chown -R node:node \
    /app/logs \
    /app/uploads

# Run application as non-root user
USER node

EXPOSE 5000

# Docker health check
HEALTHCHECK --interval=30s \
    --timeout=5s \
    --start-period=20s \
    --retries=3 \
    CMD node -e "require('http').get('http://127.0.0.1:5000/health/live', res => process.exit(res.statusCode === 200 ? 0 : 1)).on('error', () => process.exit(1))"

CMD ["node", "server.js"]
