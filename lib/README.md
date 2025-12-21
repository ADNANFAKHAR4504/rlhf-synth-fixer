# News Website Content Delivery Infrastructure

## Overview

This CDK JavaScript implementation deploys a complete content delivery infrastructure for a news website serving 10,000+ daily readers globally. The stack provides:

- S3 bucket for storing news articles with KMS encryption
- CloudFront distribution for global content delivery with low latency
- CloudWatch dashboard for monitoring delivery metrics and access patterns
- IAM policies for controlled access
- Encryption at rest using KMS with key rotation

## Architecture

The infrastructure follows AWS best practices for content delivery:

1. **Content Storage**: S3 bucket with versioning, lifecycle rules, and KMS encryption
2. **Global Delivery**: CloudFront distribution with Origin Access Control (OAC)
3. **Security**: HTTPS enforcement, modern TLS (v1.2+), and least-privilege IAM policies
4. **Monitoring**: CloudWatch dashboard with metrics for requests, errors, and bandwidth
5. **Cost Optimization**: Lifecycle rules for old versions, Price Class 100 for CloudFront

## LocalStack Compatibility

This implementation is optimized for LocalStack deployment:

- **Conditional CloudFront**: CloudFront resources are only created when not running in LocalStack
- **Environment Detection**: Automatic detection via `AWS_ENDPOINT_URL` environment variable
- **Simplified Setup**: No custom domains or Route 53 required for testing
- **Environment Suffixes**: All resources include environment suffix for multi-environment deployments

## Deployment

### Prerequisites
- Node.js 18+
- AWS CDK CLI: `npm install -g aws-cdk`

### LocalStack Deployment
```bash
export AWS_ENDPOINT_URL="http://localhost:4566"
cdk deploy --context environmentSuffix=dev
```

### AWS Deployment
```bash
cdk deploy --context environmentSuffix=prod
```

## Stack Outputs

- **WebsiteBucketName**: S3 bucket name for uploading content
- **DistributionId**: CloudFront distribution ID
- **DistributionDomainName**: CloudFront URL for accessing content
- **KMSKeyId**: KMS key ID for encryption

## Monitoring

The CloudWatch dashboard includes:
- CloudFront request counts
- Error rates with alarms (threshold: 5%)
- Data transfer metrics
- S3 bucket request metrics

## Security Features

- **Encryption**: KMS encryption for S3 with automatic key rotation
- **Access Control**: CloudFront OAC with S3 bucket policy (no public access)
- **HTTPS Only**: Automatic redirect to HTTPS, TLS 1.2+ required
- **Least Privilege**: IAM policies scoped to specific resources
