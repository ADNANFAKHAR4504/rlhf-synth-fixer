# Serverless Media Processing Pipeline

A serverless image processing pipeline that automatically generates thumbnails when images are uploaded to S3.

## Architecture

- **Source S3 Bucket**: Receives image uploads (JPEG, PNG formats)
- **Lambda Function**: Triggered by S3 events, processes images using Sharp library
- **Destination S3 Bucket**: Stores generated thumbnails
- **CloudWatch Logs**: Captures Lambda execution logs for monitoring

## Infrastructure Components

### S3 Buckets
- **Source Bucket**: `image-source-{environmentSuffix}`
  - Receives original image uploads
  - Triggers Lambda on `.jpg`, `.jpeg`, `.png` files
  - Auto-cleanup after 90 days

- **Thumbnail Bucket**: `image-thumbnail-{environmentSuffix}`
  - Stores generated thumbnails
  - Auto-cleanup after 90 days

### Lambda Function
- **Name**: `process-image-{environmentSuffix}`
- **Runtime**: Node.js 20.x
- **Memory**: 1024 MB
- **Timeout**: 30 seconds
- **Concurrency**: Limited to 10 concurrent executions

### IAM Role
- **Name**: `process-image-role-{environmentSuffix}`
- **Permissions**:
  - Read access to source S3 bucket
  - Write access to thumbnail S3 bucket
  - CloudWatch Logs write permissions

## Deployment

### Prerequisites
```bash
npm install
```

### Deploy to Development
```bash
npx cdk deploy --context environmentSuffix=dev --context environment=dev
```

### Deploy to Staging
```bash
npx cdk deploy --context environmentSuffix=staging --context environment=staging
```

### Deploy to Production
```bash
npx cdk deploy --context environmentSuffix=prod --context environment=prod
```

## Testing

Upload an image to the source bucket:
```bash
aws s3 cp test-image.jpg s3://image-source-{environmentSuffix}/test-image.jpg
```

Check thumbnail generation:
```bash
aws s3 ls s3://image-thumbnail-{environmentSuffix}/
```

View Lambda logs:
```bash
aws logs tail /aws/lambda/process-image-{environmentSuffix} --follow
```

## Image Processing Details

- **Thumbnail Size**: 200x200 pixels
- **Fit Mode**: Inside (maintains aspect ratio, no enlargement)
- **Output Format**: JPEG with 85% quality
- **Naming**: Thumbnails are prefixed with `thumb-`

## Error Handling

The Lambda function includes comprehensive error handling:
- Validates environment configuration
- Checks for empty files
- Handles Sharp processing errors
- Logs detailed error information to CloudWatch

## Cleanup

Destroy the stack:
```bash
npx cdk destroy
```

All resources are configured with `RemovalPolicy.DESTROY` and will be completely removed.

## CI/CD Integration

This infrastructure supports automated deployment through GitHub Actions. See `lib/ci-cd.yml` for the complete pipeline configuration including:
- Automated dev deployments
- Manual approval gates for staging/prod
- Security scanning with cdk-nag
- Cross-account deployments
