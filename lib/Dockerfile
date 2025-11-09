FROM public.ecr.aws/lambda/nodejs:18-arm64

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy source code
COPY app.js ./

# Set the CMD to your handler
CMD ["app.handler"]
