FROM public.ecr.aws/lambda/nodejs:18

# Copy package.json first for better Docker layer caching
COPY package.json ${LAMBDA_TASK_ROOT}

# Install dependencies (including mysql2 and aws-sdk)
RUN npm install --production

# Copy function code
COPY index.js ${LAMBDA_TASK_ROOT}

# Set the CMD to your handler
CMD [ "index.handler" ]
