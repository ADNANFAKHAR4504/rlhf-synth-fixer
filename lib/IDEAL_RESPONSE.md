# Serverless Image Upload Processing System

This solution implements a comprehensive serverless image processing system using AWS CloudFormation. The infrastructure handles 2,000 daily image uploads efficiently with automatic processing, user notifications, and monitoring.

## Architecture Components

### Core Infrastructure
- **Amazon S3**: Two buckets for raw uploads and processed images with encryption and lifecycle policies
- **AWS Lambda**: Node.js 20 function for automatic image processing triggered by S3 events
- **Amazon SNS**: Topic for sending processing notifications to users
- **Amazon CloudWatch**: Monitoring dashboard with alarms for errors, duration, and throttling

### Security Features
- S3 buckets with AES256 encryption and public access blocking
- IAM roles with least-privilege policies
- Versioning enabled with automated cleanup of old versions

### Processing Workflow
1. Images uploaded to `uploads/` prefix in the source S3 bucket
2. S3 event triggers Lambda function automatically
3. Lambda processes images (supports .jpg, .jpeg, .png formats)
4. Processed images stored in destination bucket with metadata
5. SNS notifications sent for both success and failure cases
6. CloudWatch logs and metrics captured for monitoring

### Monitoring and Alerting
- Real-time dashboard showing invocations, errors, duration, and S3 object counts
- Automated alarms for error rates, execution duration, and throttling
- SNS integration for alert notifications
- 7-day log retention for cost optimization

### Parameterization
- Environment-specific resource naming (dev, staging, prod)
- Configurable notification email address
- Scalable design supporting multiple AWS accounts

## Deployment Instructions
Deploy using AWS CLI:
```bash
aws cloudformation deploy \
  --template-file TapStack.yml \
  --stack-name image-processing-system \
  --parameter-overrides EnvironmentSuffix=prod NotificationEmail=admin@company.com \
  --capabilities CAPABILITY_IAM
```

## Usage
Upload images to the bucket's `uploads/` directory:
```bash
aws s3 cp image.jpg s3://image-upload-bucket-prod-123456789012/uploads/
```

The system automatically processes images and sends notifications upon completion.