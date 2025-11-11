FROM public.ecr.aws/docker/library/python:3.9-slim

WORKDIR /app

# Install dependencies
RUN pip install --no-cache-dir \
    flask==2.3.0 \
    boto3==1.28.0 \
    psycopg2-binary==2.9.7 \
    aws-xray-sdk==2.12.0

# Copy application code
COPY sample_flask_app.py .

# Expose port
EXPOSE 5000

# Set environment variables
ENV FLASK_APP=sample_flask_app.py
ENV PYTHONUNBUFFERED=1

# Run the application
CMD ["python", "sample_flask_app.py"]
