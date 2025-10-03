#!/bin/bash
# package-lambda.sh

# Create package directory
mkdir -p lambda-package

# Copy lambda function
cp lambda_function.py lambda-package/

# Create deployment package
cd lambda-package
zip -r ../lambda-code.zip .
cd ..

# Upload to S3
aws s3 cp lambda-code.zip s3://${ENVIRONMENT_NAME}-lambda-layers-${ACCOUNT_ID}/

echo "Lambda code uploaded successfully"