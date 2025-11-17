# Multi-Region Trading Platform Infrastructure

This CDKTF Python implementation deploys a complete trading platform infrastructure across three AWS regions (us-east-1, us-east-2, us-west-2).

## Architecture

The infrastructure includes:
- VPC with public and private subnets
- RDS Aurora MySQL clusters with 2 read replicas per region
- Lambda functions for trade processing (512MB, 30s timeout)
- API Gateway REST APIs with Lambda proxy integration
- S3 buckets with 90-day lifecycle policy
- KMS keys for encryption (alias/trading-{region})
- CloudWatch Logs with 30-day retention
- NAT Gateway for private subnet internet access

## Prerequisites

- Python 3.9+
- Node.js 16+ (for CDKTF)
- AWS CLI configured with appropriate credentials
- Terraform 1.5+

## Installation

1. Install dependencies:
```bash
pip install cdktf cdktf-cdktf-provider-aws
npm install -g cdktf-cli
```

2. Create Lambda deployment package:
```bash
cd lib/lambda
zip -r ../../lambda_function.zip index.py
cd ../..
```

## Workspace-Based Deployment

This implementation supports workspace-based deployments for dev, staging, and prod environments:

### Deploy to Development (all regions)
```bash
export TF_WORKSPACE=dev
cdktf synth
cdktf deploy --auto-approve
```

### Deploy to Staging (all regions)
```bash
export TF_WORKSPACE=staging
cdktf synth
cdktf deploy --auto-approve
```

### Deploy to Production (all regions)
```bash
export TF_WORKSPACE=prod
cdktf synth
cdktf deploy --auto-approve
```

### Deploy Specific Region
```bash
export TF_WORKSPACE=dev
cdktf deploy trading-platform-useast1-dev --auto-approve
```

## Outputs

After deployment, you'll see outputs for each region:
- `vpc_id`: VPC identifier
- `rds_cluster_endpoint`: Primary RDS endpoint for writes
- `rds_cluster_reader_endpoint`: Reader endpoint for read replicas
- `api_gateway_url`: API Gateway invoke URL
- `lambda_function_name`: Lambda function name
- `s3_bucket_name`: S3 bucket name
- `kms_key_id`: KMS key identifier

## Testing the API

Test the API Gateway endpoint:
```bash
curl -X POST https://{api-id}.execute-api.{region}.amazonaws.com/dev/trade \
  -H "Content-Type: application/json" \
  -d '{"symbol": "AAPL", "quantity": 100}'
```

## Destroying Resources

To destroy all resources:
```bash
export TF_WORKSPACE=dev
cdktf destroy --auto-approve
```

## Configuration

### Region-Specific Settings

Each region uses its own VPC CIDR block:
- us-east-1: 10.0.0.0/16
- us-east-2: 10.1.0.0/16
- us-west-2: 10.2.0.0/16

### Resource Naming

All resources include the environment suffix for isolation:
- Format: `{resource-type}-{environment-suffix}`
- Example: `trading-vpc-dev`, `trading-cluster-prod`

### Security

- All data at rest encrypted with KMS
- RDS credentials should use AWS Secrets Manager (placeholder in code)
- Lambda functions run in private subnets
- Security groups restrict RDS access to Lambda only

### Cost Optimization

- Single NAT Gateway per region (instead of per AZ)
- Aurora Serverless can be used for dev/staging
- Consider using smaller instance types for non-production

## Troubleshooting

### Lambda Cannot Connect to RDS
- Verify Lambda is in private subnets
- Check security group allows Lambda SG to access RDS on port 3306
- Verify NAT Gateway is running for Lambda internet access

### API Gateway Returns 502
- Check Lambda function logs in CloudWatch
- Verify Lambda has correct IAM permissions
- Ensure Lambda is properly integrated with API Gateway

### Terraform State Issues
- Use S3 backend for remote state (recommended for production)
- Enable state locking with DynamoDB

## Production Considerations

1. Use AWS Secrets Manager for RDS credentials
2. Implement custom domain names with Route 53
3. Add WAF rules to API Gateway
4. Enable X-Ray tracing for Lambda
5. Set up cross-region replication for S3
6. Implement Aurora Global Database for multi-region replication
7. Add CloudWatch alarms and SNS notifications
8. Use parameter store for environment-specific configuration
9. Implement CI/CD pipeline for deployments
10. Enable GuardDuty and Security Hub

## License

This infrastructure code is provided as-is for the trading platform deployment.
