#!/bin/bash
# build-layer.sh

# Create layer directory
mkdir -p python/lib/python3.10/site-packages

# Install dependencies
pip install --target python/lib/python3.10/site-packages \
    reportlab \
    psycopg2-binary \
    boto3

# Create layer zip
zip -r pdf-layer.zip python/

# Upload to S3
aws s3 cp pdf-layer.zip s3://${ENVIRONMENT_NAME}-lambda-layers-${ACCOUNT_ID}/

echo "Layer uploaded successfully"