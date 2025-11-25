# Use AWS Lambda base image for ARM64
FROM public.ecr.aws/lambda/python:3.11-arm64

# Set working directory
WORKDIR ${LAMBDA_TASK_ROOT}

# Copy requirements and install dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy function code
COPY app.py .

# Set the CMD to your handler
CMD ["app.lambda_handler"]
