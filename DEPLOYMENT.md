# Payment Processing Infrastructure Deployment Guide

## Overview

This CloudFormation implementation provides a complete payment processing infrastructure migration to AWS with multi-environment support.

## Architecture

### Nested Stack Structure

1. **master-stack.json**: Main orchestration stack
   - Coordinates deployment of all nested stacks
   - Manages cross-stack dependencies
   - Provides unified outputs

2. **vpc-stack.json**: Network infrastructure
   - VPC with 3 Availability Zones
   - Private subnets (10.0.1-3.0/24) for application resources
   - Public subnets (10.0.101-103.0/24) for NAT Gateway
   - NAT Gateway for outbound internet access
   - Route tables and associations

3. **database-stack.json**: Data layer
   - RDS Aurora MySQL cluster with Multi-AZ
   - Two DB instances for high availability
   - KMS encryption key with rotation
   - Secrets Manager for credentials
   - Security groups for Lambda-RDS communication
   - CloudWatch alarm for CPU utilization

4. **application-stack.json**: Application layer
   - Lambda function for payment processing
   - API Gateway with throttling and API key authentication
   - SQS queue with Dead Letter Queue
   - IAM roles with least-privilege policies
   - CloudWatch alarm for Lambda errors
   - SSM Parameter Store for configuration

## Prerequisites

1. AWS CLI installed and configured
2. S3 bucket for storing nested stack templates
3. Appropriate IAM permissions for CloudFormation stack creation
4. Database master password (will be passed as parameter)

## Deployment Steps

### 1. Upload Nested Stack Templates to S3

```bash
# Replace 'your-bucket-name' with your actual bucket name
BUCKET_NAME="your-bucket-name"
REGION="us-east-1"

# Upload templates
aws s3 cp lib/vpc-stack.json s3://${BUCKET_NAME}/ --region ${REGION}
aws s3 cp lib/database-stack.json s3://${BUCKET_NAME}/ --region ${REGION}
aws s3 cp lib/application-stack.json s3://${BUCKET_NAME}/ --region ${REGION}
```

### 2. Update Parameter Files

Edit `parameters/production.json` and `parameters/staging.json`:

1. Replace `your-bucket` with your actual S3 bucket name
2. Set a secure database password (replace `CHANGE_ME_SECURE_PASSWORD`)

Example:
```json
{
  "ParameterKey": "VPCStackTemplateURL",
  "ParameterValue": "https://s3.amazonaws.com/your-actual-bucket/vpc-stack.json"
}
```

### 3. Deploy Staging Environment

```bash
aws cloudformation create-stack \
  --stack-name payment-processing-staging \
  --template-body file://lib/master-stack.json \
  --parameters file://parameters/staging.json \
  --capabilities CAPABILITY_NAMED_IAM \
  --region us-east-2

# Monitor deployment
aws cloudformation wait stack-create-complete \
  --stack-name payment-processing-staging \
  --region us-east-2
```

### 4. Deploy Production Environment

```bash
aws cloudformation create-stack \
  --stack-name payment-processing-prod \
  --template-body file://lib/master-stack.json \
  --parameters file://parameters/production.json \
  --capabilities CAPABILITY_NAMED_IAM \
  --region us-east-1

# Monitor deployment
aws cloudformation wait stack-create-complete \
  --stack-name payment-processing-prod \
  --region us-east-1
```

### 5. Retrieve Outputs

```bash
# Get API endpoint
aws cloudformation describe-stacks \
  --stack-name payment-processing-prod \
  --query 'Stacks[0].Outputs[?OutputKey==`APIEndpoint`].OutputValue' \
  --output text \
  --region us-east-1

# Get database endpoint
aws cloudformation describe-stacks \
  --stack-name payment-processing-prod \
  --query 'Stacks[0].Outputs[?OutputKey==`DBClusterEndpoint`].OutputValue' \
  --output text \
  --region us-east-1
```

## Testing the Deployment

### 1. Get API Key

```bash
# List API keys
aws apigateway get-api-keys --include-values --region us-east-1

# Or get from CloudFormation
STACK_NAME="payment-processing-prod"
API_ID=$(aws cloudformation describe-stack-resources \
  --stack-name ${STACK_NAME} \
  --query 'StackResources[?LogicalResourceId==`RestApi`].PhysicalResourceId' \
  --output text \
  --region us-east-1)
```

### 2. Test API Endpoint

```bash
API_ENDPOINT="https://your-api-id.execute-api.us-east-1.amazonaws.com/prod/process"
API_KEY="your-api-key"

curl -X POST ${API_ENDPOINT} \
  -H "x-api-key: ${API_KEY}" \
  -H "Content-Type: application/json" \
  -d '{"amount": 100, "currency": "USD"}'
```

### 3. Monitor CloudWatch Alarms

```bash
# List alarms
aws cloudwatch describe-alarms \
  --alarm-name-prefix "payment" \
  --region us-east-1
```

## Stack Updates

To update an existing stack:

```bash
aws cloudformation update-stack \
  --stack-name payment-processing-prod \
  --template-body file://lib/master-stack.json \
  --parameters file://parameters/production.json \
  --capabilities CAPABILITY_NAMED_IAM \
  --region us-east-1
```

## Stack Deletion

To delete a stack (will remove all resources):

```bash
# Delete production stack
aws cloudformation delete-stack \
  --stack-name payment-processing-prod \
  --region us-east-1

# Wait for deletion to complete
aws cloudformation wait stack-delete-complete \
  --stack-name payment-processing-prod \
  --region us-east-1
```

## Troubleshooting

### Stack Creation Failed

1. Check CloudFormation events:
```bash
aws cloudformation describe-stack-events \
  --stack-name payment-processing-prod \
  --region us-east-1 \
  --max-items 50
```

2. Common issues:
   - S3 URLs incorrect in parameter files
   - Insufficient IAM permissions
   - Database password not meeting requirements
   - Availability Zone not supporting db.t3.medium

### Lambda Function Errors

1. Check CloudWatch Logs:
```bash
aws logs tail /aws/lambda/payment-processor-prod --follow --region us-east-1
```

2. Verify VPC connectivity to Secrets Manager and RDS

### Database Connection Issues

1. Check security group rules
2. Verify Lambda is in correct subnets
3. Test secret retrieval:
```bash
aws secretsmanager get-secret-value \
  --secret-id payment-db-credentials-prod \
  --region us-east-1
```

## Cost Optimization

The infrastructure includes:
- NAT Gateway: ~$32/month (consider using VPC endpoints for AWS services)
- RDS Aurora t3.medium (2 instances): ~$100/month
- Lambda: Pay per invocation
- API Gateway: Pay per request
- Other services: Minimal cost

To reduce costs in non-production:
1. Use smaller RDS instance class
2. Reduce backup retention period
3. Delete NAT Gateway when not in use
4. Use Aurora Serverless for variable workloads

## Security Best Practices

1. Rotate database credentials regularly via Secrets Manager
2. Review CloudWatch alarms and set up SNS notifications
3. Enable VPC Flow Logs for network monitoring
4. Implement AWS WAF on API Gateway for production
5. Use AWS CloudTrail for audit logging
6. Store parameter files in encrypted storage (not in Git)

## Multi-Region Deployment

To deploy to additional regions:
1. Create region-specific parameter files
2. Upload templates to S3 bucket in target region
3. Deploy stack using region-specific parameters

## Blue-Green Deployment

The EnvironmentSuffix parameter enables blue-green deployments:

1. Deploy new version with different suffix (e.g., "prod-v2")
2. Test thoroughly
3. Update DNS/load balancer to point to new version
4. Keep old version for quick rollback
5. Delete old stack after verification

## Support and Maintenance

- Monitor CloudWatch dashboards regularly
- Review RDS automated backups
- Test disaster recovery procedures
- Update Lambda runtime versions as needed
- Rotate KMS keys annually
