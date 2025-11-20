FROM public.ecr.aws/lambda/nodejs:18

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --omit=dev

# Copy source code
COPY app.js ./
COPY processor.js ./

# Set the CMD to your handler (will be overridden by Lambda)
CMD ["app.handler"]
