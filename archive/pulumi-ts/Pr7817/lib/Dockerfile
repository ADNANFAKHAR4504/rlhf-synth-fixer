FROM node:18-alpine

WORKDIR /app

# Copy application files
COPY lambda/health-check.ts ./health-check.ts

# Install TypeScript and dependencies
RUN npm install -g typescript ts-node @types/node

# Expose port
EXPOSE 80

# Run the application
CMD ["ts-node", "health-check.ts"]
