# Secure Data Processing Pipeline for Financial Services

## Overview

This CloudFormation template implements a comprehensive secure data processing pipeline for financial services that meets strict compliance requirements. The infrastructure enforces encryption at all layers, implements fine-grained access controls, and maintains detailed audit logs for regulatory compliance.

## Architecture

The solution deploys a complete data processing pipeline with the following components:

### Core Services

- **KMS**: Customer-managed encryption key with automatic rotation
- **VPC**: Isolated network with private subnets across 3 availability zones
- **S3**: Encrypted data storage with versioning and lifecycle policies
- **DynamoDB**: Transaction records table with encryption and point-in-time recovery
- **Lambda**: Data processing functions in VPC isolation
- **API Gateway**: REST API with request validation and API key authentication
- **Secrets Manager**: Automatic credential rotation for database access
- **CloudWatch**: Encrypted logs and alarms for monitoring

### Security Features

1. **Encryption**: All resources encrypted with customer-managed KMS key
2. **Network Isolation**: Lambda functions run in private subnets with no internet access
3. **VPC Endpoints**: Gateway endpoints for S3/DynamoDB, interface endpoint for Secrets Manager
4. **IAM Least Privilege**: Explicit permissions with no wildcards, resource-specific ARNs
5. **API Security**: API key required, request validation enabled, CloudWatch logging
6. **Secrets Rotation**: Automatic rotation every 30 days
7. **Audit Logging**: All logs encrypted with KMS, 90-day retention
8. **Compliance Tags**: Cost allocation tags on all resources

## Parameters

- **EnvironmentSuffix**: Suffix for resource naming (default: prod)
- **SecretRotationDays**: Days between secret rotations (default: 30)
- **LogRetentionDays**: CloudWatch Logs retention period (default: 90)
- **VpcCidr**: CIDR block for VPC (default: 10.0.0.0/16)

## Deployment

### Prerequisites

- AWS CLI configured with appropriate credentials
- IAM permissions to create all listed resources
- Sufficient service quotas for VPC, Lambda, and other services

### Deploy Stack

```bash
aws cloudformation create-stack \
  --stack-name secure-pipeline-prod \
  --template-body file://lib/TapStack.json \
  --parameters ParameterKey=EnvironmentSuffix,ParameterValue=prod \
  --capabilities CAPABILITY_NAMED_IAM \
  --region us-east-1
```

### Monitor Deployment

```bash
aws cloudformation describe-stack-events \
  --stack-name secure-pipeline-prod \
  --region us-east-1
```

### Retrieve Outputs

```bash
aws cloudformation describe-stacks \
  --stack-name secure-pipeline-prod \
  --query "Stacks[0].Outputs" \
  --region us-east-1
```

## Testing

### Get API Key Value

```bash
API_KEY_ID=$(aws cloudformation describe-stacks \
  --stack-name secure-pipeline-prod \
  --query "Stacks[0].Outputs[?OutputKey=='ApiKeyId'].OutputValue" \
  --output text \
  --region us-east-1)

API_KEY_VALUE=$(aws apigateway get-api-key \
  --api-key $API_KEY_ID \
  --include-value \
  --query "value" \
  --output text \
  --region us-east-1)

echo "API Key: $API_KEY_VALUE"
```

### Test API Endpoint

```bash
API_ENDPOINT=$(aws cloudformation describe-stacks \
  --stack-name secure-pipeline-prod \
  --query "Stacks[0].Outputs[?OutputKey=='ApiEndpoint'].OutputValue" \
  --output text \
  --region us-east-1)

curl -X POST $API_ENDPOINT/transactions \
  -H "x-api-key: $API_KEY_VALUE" \
  -H "Content-Type: application/json" \
  -d '{"transactionId": "txn-001", "amount": 100.50}'
```

Expected response:
```json
{
  "statusCode": 200,
  "body": "{\"message\": \"Transaction processed successfully\", \"transactionId\": \"txn-001\"}"
}
```

### Verify Data Storage

Check DynamoDB table:
```bash
TABLE_NAME=$(aws cloudformation describe-stacks \
  --stack-name secure-pipeline-prod \
  --query "Stacks[0].Outputs[?OutputKey=='TransactionTableName'].OutputValue" \
  --output text \
  --region us-east-1)

aws dynamodb get-item \
  --table-name $TABLE_NAME \
  --key '{"transactionId": {"S": "txn-001"}, "timestamp": {"N": "1234567890"}}' \
  --region us-east-1
```

Check S3 bucket:
```bash
BUCKET_NAME=$(aws cloudformation describe-stacks \
  --stack-name secure-pipeline-prod \
  --query "Stacks[0].Outputs[?OutputKey=='DataBucketName'].OutputValue" \
  --output text \
  --region us-east-1)

aws s3 ls s3://$BUCKET_NAME/transactions/ --region us-east-1
```

## Monitoring

### View CloudWatch Logs

Lambda function logs:
```bash
aws logs tail /aws/lambda/data-processor-prod --follow --region us-east-1
```

API Gateway logs:
```bash
API_ID=$(aws cloudformation describe-stacks \
  --stack-name secure-pipeline-prod \
  --query "Stacks[0].Outputs[?OutputKey=='ApiEndpoint'].OutputValue" \
  --output text | cut -d'/' -f3 | cut -d'.' -f1)

aws logs tail /aws/apigateway/$API_ID/prod --follow --region us-east-1
```

### Check CloudWatch Alarms

```bash
aws cloudwatch describe-alarms \
  --alarm-name-prefix "api-errors-prod" \
  --region us-east-1

aws cloudwatch describe-alarms \
  --alarm-name-prefix "lambda-errors-prod" \
  --region us-east-1
```

## Compliance Verification

### Check Encryption

Verify KMS encryption on S3:
```bash
aws s3api get-bucket-encryption --bucket $BUCKET_NAME --region us-east-1
```

Verify KMS encryption on DynamoDB:
```bash
aws dynamodb describe-table --table-name $TABLE_NAME \
  --query "Table.SSEDescription" \
  --region us-east-1
```

### Check Point-in-Time Recovery

```bash
aws dynamodb describe-continuous-backups --table-name $TABLE_NAME \
  --query "ContinuousBackupsDescription.PointInTimeRecoveryDescription" \
  --region us-east-1
```

### Check Secrets Rotation

```bash
SECRET_ARN=$(aws cloudformation describe-stacks \
  --stack-name secure-pipeline-prod \
  --query "Stacks[0].Outputs[?OutputKey=='DatabaseSecretArn'].OutputValue" \
  --output text \
  --region us-east-1)

aws secretsmanager describe-secret --secret-id $SECRET_ARN \
  --query "RotationEnabled" \
  --region us-east-1
```

## Resource Cleanup

To delete all resources:

```bash
aws cloudformation delete-stack \
  --stack-name secure-pipeline-prod \
  --region us-east-1
```

Monitor deletion:
```bash
aws cloudformation describe-stack-events \
  --stack-name secure-pipeline-prod \
  --region us-east-1
```

Note: The S3 bucket must be empty before stack deletion. If needed:
```bash
aws s3 rm s3://$BUCKET_NAME --recursive --region us-east-1
```

## Troubleshooting

### Lambda Function Cannot Access AWS Services

Check VPC endpoints are properly configured:
```bash
aws ec2 describe-vpc-endpoints \
  --filters "Name=vpc-id,Values=<VPC_ID>" \
  --region us-east-1
```

Verify security groups allow HTTPS traffic:
```bash
aws ec2 describe-security-groups \
  --filters "Name=group-name,Values=lambda-sg-*" \
  --region us-east-1
```

### API Gateway Returns 403 Forbidden

Verify API key is included in request header:
```bash
curl -v -X POST $API_ENDPOINT/transactions \
  -H "x-api-key: $API_KEY_VALUE" \
  -H "Content-Type: application/json" \
  -d '{"transactionId": "txn-001", "amount": 100.50}'
```

### CloudWatch Logs Not Appearing

Check KMS key policy allows CloudWatch Logs service:
```bash
aws kms get-key-policy \
  --key-id <KEY_ID> \
  --policy-name default \
  --region us-east-1
```

## Security Best Practices

1. Rotate API keys regularly through API Gateway console
2. Monitor CloudWatch alarms for suspicious activity
3. Review IAM policies periodically for least-privilege compliance
4. Enable AWS Config for continuous compliance monitoring
5. Use AWS CloudTrail to track all API calls
6. Regularly review and update security group rules
7. Monitor KMS key usage through CloudWatch metrics
8. Enable GuardDuty for threat detection
9. Use AWS Security Hub for centralized security findings
10. Implement backup and disaster recovery procedures

## Cost Optimization

- Lambda functions use VPC isolation (ENI charges apply)
- DynamoDB uses on-demand billing mode
- S3 lifecycle policies move data to cheaper storage classes
- CloudWatch Logs retention set to 90 days (adjustable)
- VPC endpoints reduce data transfer costs
- Consider Reserved Capacity for predictable workloads

## Compliance Standards

This architecture supports compliance with:
- PCI DSS (Payment Card Industry Data Security Standard)
- SOC 2 (Service Organization Control 2)
- GDPR (General Data Protection Regulation)
- HIPAA (Health Insurance Portability and Accountability Act)
- FINRA (Financial Industry Regulatory Authority)

## Support

For issues or questions:
1. Review CloudWatch Logs for error messages
2. Check CloudFormation stack events for deployment issues
3. Verify IAM permissions are correctly configured
4. Consult AWS documentation for service-specific issues
