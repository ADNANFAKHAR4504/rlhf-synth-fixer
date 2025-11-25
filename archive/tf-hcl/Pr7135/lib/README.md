# Serverless Fraud Detection System

Production-ready serverless fraud detection system built with Terraform and AWS services.

## Architecture

This solution implements a complete serverless fraud detection pipeline:

- **API Gateway**: REST API endpoint (`POST /webhook`) for receiving fraud detection events
- **Lambda Function**: Container-based (ARM64, 3GB memory) for webhook processing and batch analysis
- **DynamoDB**: `fraud_patterns` table with point-in-time recovery for pattern storage
- **S3**: Encrypted bucket with versioning for audit trail storage
- **EventBridge**: Scheduled rule (every 5 minutes) for batch pattern analysis
- **ECR**: Repository for Lambda container images
- **SQS**: Dead letter queue for failed Lambda invocations
- **CloudWatch Logs**: KMS-encrypted log groups for all services
- **KMS**: Customer-managed key for encryption at rest
- **IAM**: Least-privilege roles with explicit deny policies

## Prerequisites

1. **Terraform**: Version 1.0 or higher
2. **AWS CLI**: Configured with appropriate credentials
3. **Docker**: For building Lambda container images
4. **AWS Account**: With permissions to create all required resources

## Deployment

### 1. Configure Variables

Create a `terraform.tfvars` file:

```hcl
environment_suffix = "dev-001"  # Unique suffix for your deployment
aws_region         = "us-east-1"
```

### 2. Build and Push Lambda Container Image

```bash
# Navigate to Lambda directory
cd lib/lambda

# Get ECR login credentials
aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin <account-id>.dkr.ecr.us-east-1.amazonaws.com

# Build Docker image for ARM64
docker buildx build --platform linux/arm64 -t fraud-detector:latest .

# Tag and push to ECR (after infrastructure is created)
docker tag fraud-detector:latest <ecr-repository-url>:latest
docker push <ecr-repository-url>:latest
```

### 3. Initialize and Deploy Infrastructure

```bash
# Initialize Terraform
terraform init

# Review planned changes
terraform plan

# Deploy infrastructure
terraform apply
```

### 4. Post-Deployment

After infrastructure is created:

1. Get ECR repository URL from outputs: `terraform output ecr_repository_url`
2. Build and push Lambda container image (see step 2)
3. Update Lambda function to use the new image (or wait for next deployment)

## Usage

### Testing the Webhook Endpoint

```bash
# Get API Gateway URL
API_URL=$(terraform output -raw api_gateway_url)

# Send test webhook
curl -X POST $API_URL \
  -H "Content-Type: application/json" \
  -d '{
    "transaction_id": "txn-12345",
    "risk_score": 75,
    "pattern_data": {
      "amount": 1500.00,
      "merchant": "TEST_MERCHANT",
      "location": "US"
    }
  }'
```

Expected response:

```json
{
  "pattern_id": "pattern-txn-12345",
  "timestamp": 1234567890,
  "action": "review",
  "risk_score": 75,
  "message": "Fraud detection event processed successfully"
}
```

### Monitoring

```bash
# View Lambda logs
aws logs tail /aws/lambda/fraud-detector-<suffix> --follow

# View API Gateway logs
aws logs tail /aws/apigateway/fraud-detection-<suffix> --follow

# Query DynamoDB table
aws dynamodb scan --table-name fraud-patterns-<suffix>

# List audit trail files in S3
aws s3 ls s3://fraud-detection-audit-trail-<suffix>/audit/ --recursive
```

## Security Features

1. **Encryption at Rest**:
   - S3: KMS encryption
   - DynamoDB: KMS encryption
   - CloudWatch Logs: KMS encryption
   - SQS: KMS encryption

2. **IAM Least Privilege**:
   - Lambda has access only to required resources
   - Explicit deny policies prevent access to out-of-scope resources
   - Service-specific roles with minimal permissions

3. **Network Security**:
   - S3 bucket public access blocked
   - API Gateway regional endpoint
   - VPC isolation (optional - not implemented in basic version)

4. **Audit and Compliance**:
   - All webhook events stored in S3 audit bucket
   - DynamoDB point-in-time recovery enabled
   - S3 versioning enabled
   - CloudWatch Logs retention for 30 days

## Cost Optimization

This solution uses serverless components to minimize costs:

- **Lambda**: Pay per invocation (container-based, ARM64 for cost efficiency)
- **DynamoDB**: On-demand billing (no provisioned capacity)
- **API Gateway**: Pay per request
- **EventBridge**: Minimal cost for scheduled rules
- **S3**: Standard storage with lifecycle policies (can be added)

Estimated monthly cost for 1M webhook events: $50-100 USD

## Cleanup

To destroy all resources:

```bash
# Empty S3 bucket first (versioned objects must be deleted)
aws s3 rm s3://fraud-detection-audit-trail-<suffix> --recursive

# Destroy infrastructure
terraform destroy
```

## Troubleshooting

### Lambda Function Not Working

1. Check CloudWatch Logs: `/aws/lambda/fraud-detector-<suffix>`
2. Verify IAM permissions
3. Ensure Lambda has access to DynamoDB and S3
4. Check environment variables are set correctly

### API Gateway 403 Error

1. Verify Lambda permission for API Gateway invocation
2. Check API Gateway deployment stage
3. Review CloudWatch Logs for API Gateway

### Container Image Issues

1. Verify Docker image is built for `linux/arm64` platform
2. Check ECR repository URL is correct
3. Ensure AWS credentials have ECR push permissions
4. Verify Lambda function is updated with latest image

## Optional Enhancements

To add optional features mentioned in requirements:

1. **Step Functions**: Add state machine for complex fraud workflows
2. **SNS**: Add topic for high-severity alert notifications
3. **X-Ray**: Enable X-Ray tracing for Lambda (already enabled in code)

## Support

For issues or questions:
1. Check CloudWatch Logs for errors
2. Review Terraform plan output
3. Verify all prerequisites are met
4. Ensure `environment_suffix` is unique
