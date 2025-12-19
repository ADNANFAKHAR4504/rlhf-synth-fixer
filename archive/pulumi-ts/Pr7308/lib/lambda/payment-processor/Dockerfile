FROM public.ecr.aws/lambda/nodejs:18

# Copy function code
COPY index.js ${LAMBDA_TASK_ROOT}/

# Install dependencies
COPY package.json ${LAMBDA_TASK_ROOT}/
RUN npm install --production

# Set the handler
CMD [ "index.handler" ]
