# Image Processor - Optimized Lambda Infrastructure

This Pulumi TypeScript project implements an optimized Lambda-based image processing system with environment-specific configurations and proper error handling.

## Optimization Points Addressed

This implementation addresses all 8 optimization points:

1. **Memory Configuration**: Environment-specific Lambda memory (512MB dev, 1024MB prod)
2. **Timeout Fix**: Lambda timeout increased from 3 seconds to 30 seconds
3. **Error Handling**: Comprehensive S3 permission error handling with specific error messages
4. **Log Retention**: CloudWatch log retention (7 days dev, 30 days prod)
5. **IAM Permissions**: Least privilege IAM policies with specific bucket ARNs (no wildcards)
6. **Environment Variables**: IMAGE_QUALITY and MAX_FILE_SIZE variables added
7. **X-Ray Tracing**: X-Ray tracing enabled for monitoring and debugging
8. **Concurrency Fix**: Reserved concurrent executions properly configured (5 dev, 10 prod)

## Architecture

The system consists of:

- **S3 Bucket**: Stores uploaded images and processed outputs
- **Lambda Function**: Processes images with configurable quality and size limits
- **CloudWatch Logs**: Centralized logging with retention policies
- **IAM Role**: Least privilege permissions for S3 and X-Ray access
- **X-Ray**: Distributed tracing for performance monitoring

## Prerequisites

- Node.js 18.x or higher
- Pulumi CLI installed
- AWS credentials configured
- npm or yarn package manager

## Configuration

The project supports environment-specific configurations via Pulumi config:

### Required Configuration

```bash
pulumi config set environmentSuffix <unique-suffix>  # e.g., dev, prod, test-123
```

### Optional Configuration (with defaults)

```bash
pulumi config set environment <dev|prod>           # Default: dev
pulumi config set imageQuality <quality>           # Default: 80
pulumi config set maxFileSize <bytes>              # Default: 10485760 (10MB)
pulumi config set lambdaMemory <mb>                # Default: 512
pulumi config set logRetention <days>              # Default: 7
pulumi config set reservedConcurrency <number>     # Default: 5
```

## Deployment

### Development Environment

```bash
# Install dependencies
npm install

# Set configuration for dev
pulumi stack init dev
pulumi config set environmentSuffix dev
pulumi config set environment dev
pulumi config set lambdaMemory 512
pulumi config set logRetention 7
pulumi config set reservedConcurrency 5

# Install Lambda dependencies
cd lambda && npm install && cd ..

# Deploy
pulumi up
```

### Production Environment

```bash
# Set configuration for prod
pulumi stack init prod
pulumi config set environmentSuffix prod
pulumi config set environment prod
pulumi config set lambdaMemory 1024
pulumi config set logRetention 30
pulumi config set reservedConcurrency 10

# Install Lambda dependencies
cd lambda && npm install && cd ..

# Deploy
pulumi up
```

## Usage

Once deployed, upload images to the S3 bucket under the `uploads/` prefix:

```bash
aws s3 cp image.jpg s3://image-processor-bucket-<environmentSuffix>/uploads/
```

The Lambda function will automatically:
1. Process the image with the configured quality
2. Validate file size against MAX_FILE_SIZE
3. Save the processed image to `processed/` prefix
4. Log all operations to CloudWatch
5. Trace execution with X-Ray

## Testing

### Run Unit Tests

```bash
npm test
```

### Run Tests with Coverage

```bash
npm run test:coverage
```

### Integration Testing

```bash
# Deploy to test environment
pulumi stack select test
pulumi config set environmentSuffix test-$(date +%s)
pulumi up

# Upload test image
aws s3 cp test-image.jpg s3://$(pulumi stack output bucketName)/uploads/

# Check Lambda logs
aws logs tail /aws/lambda/$(pulumi stack output lambdaFunctionName) --follow

# Verify processed image
aws s3 ls s3://$(pulumi stack output bucketName)/processed/

# Clean up
pulumi destroy
```

## Monitoring

### CloudWatch Logs

View Lambda execution logs:

```bash
aws logs tail /aws/lambda/image-processor-<environmentSuffix> --follow
```

### X-Ray Tracing

View X-Ray traces in AWS Console:
1. Navigate to AWS X-Ray Console
2. View Service Map for visual representation
3. Analyze traces for performance bottlenecks

### Metrics

Key CloudWatch metrics to monitor:
- `Invocations`: Number of Lambda invocations
- `Duration`: Execution time (should be under 30s)
- `Errors`: Failed executions
- `Throttles`: Should be zero with proper concurrency
- `ConcurrentExecutions`: Active Lambda instances

## Troubleshooting

### AccessDenied Errors

If you see AccessDenied errors:
1. Verify IAM role has correct bucket permissions
2. Check bucket policy doesn't block Lambda
3. Review Lambda logs for specific error messages

### Timeout Issues

If Lambda times out:
1. Verify timeout is set to 30 seconds
2. Check image size against processing time
3. Monitor X-Ray traces for slow operations

### Throttling Issues

If Lambda is throttled:
1. Verify reserved concurrent executions > 0
2. Check account-level Lambda concurrency limits
3. Increase reserved concurrency if needed

## Cost Optimization

This implementation includes several cost optimizations:

1. **Log Retention**: Prevents unlimited log storage costs
2. **Environment-Specific Sizing**: Dev uses smaller memory footprint
3. **File Size Limits**: Prevents processing oversized files
4. **Reserved Concurrency**: Prevents runaway costs from excessive concurrency

## Security Best Practices

1. **Least Privilege IAM**: Role only has access to specific bucket ARN
2. **Public Access Blocked**: S3 bucket blocks all public access
3. **Versioning Enabled**: S3 versioning for data protection
4. **Encryption**: Uses AWS managed encryption by default
5. **No Hardcoded Credentials**: All access via IAM roles

## Cleanup

To destroy all resources:

```bash
pulumi destroy
```

All resources are configured to be fully destroyable, including S3 bucket with `forceDestroy: true`.

## Resources Created

- S3 Bucket: `image-processor-bucket-<environmentSuffix>`
- Lambda Function: `image-processor-<environmentSuffix>`
- IAM Role: `image-processor-role-<environmentSuffix>`
- CloudWatch Log Group: `/aws/lambda/image-processor-<environmentSuffix>`
- S3 Bucket Notification
- IAM Policies and Role Attachments

## Outputs

After deployment, the following outputs are available:

- `bucketName`: S3 bucket name
- `bucketArn`: S3 bucket ARN
- `lambdaFunctionName`: Lambda function name
- `lambdaFunctionArn`: Lambda function ARN
- `logGroupName`: CloudWatch log group name
- `lambdaRoleArn`: IAM role ARN

Access outputs:

```bash
pulumi stack output
pulumi stack output bucketName
```
