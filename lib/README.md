# PCI-DSS Compliant Payment Processing Infrastructure

CloudFormation JSON infrastructure for secure payment card data processing that meets PCI-DSS compliance standards.

## Overview

This infrastructure provides a fully encrypted, PCI-compliant payment processing system with:

- All data encrypted at rest and in transit
- VPC isolation with private subnets
- VPC endpoints to avoid internet routing
- Comprehensive audit logging
- Strict access controls following least privilege
- Multi-AZ deployment for high availability

## Architecture

### Components

1. **KMS Key**: Customer-managed encryption key with automatic rotation
2. **VPC**: Isolated network with private subnets across 3 availability zones
3. **Lambda Function**: Payment processor running in private subnets
4. **S3 Bucket**: Encrypted storage for payment files with versioning
5. **DynamoDB Table**: Encrypted transaction storage with point-in-time recovery
6. **VPC Endpoints**: Gateway endpoints for S3 and DynamoDB
7. **NAT Gateway**: Controlled outbound internet access
8. **CloudTrail**: Comprehensive audit logging to encrypted S3 bucket
9. **CloudWatch Logs**: Encrypted Lambda execution logs

### Security Features

- **Encryption at Rest**: All data encrypted with customer-managed KMS key
- **Encryption in Transit**: HTTPS/TLS enforced for all communications
- **Network Isolation**: Lambda functions in private subnets with no direct internet access
- **Access Control**: IAM roles with least privilege permissions
- **Audit Logging**: CloudTrail tracks all API calls and data access
- **Public Access Blocked**: S3 buckets deny all public access
- **Versioning Enabled**: S3 bucket versioning for data protection

## Deployment

### Prerequisites

- AWS CLI installed and configured
- IAM permissions to create all resources
- Unique environment suffix for resource naming

### Quick Deploy

```bash
# Deploy the infrastructure
aws cloudformation create-stack \
  --stack-name payment-processing \
  --template-body file://lib/template.json \
  --parameters ParameterKey=EnvironmentSuffix,ParameterValue=prod \
  --capabilities CAPABILITY_NAMED_IAM \
  --region us-east-1

# Monitor deployment (takes ~10-15 minutes)
aws cloudformation wait stack-create-complete \
  --stack-name payment-processing \
  --region us-east-1

# Get outputs
aws cloudformation describe-stacks \
  --stack-name payment-processing \
  --region us-east-1 \
  --query 'Stacks[0].Outputs'
```

### Deploy Lambda Code

```bash
# Package Lambda function
cd lib/lambda
zip payment_processor.zip payment_processor.py

# Update function code
FUNCTION_NAME=$(aws cloudformation describe-stacks \
  --stack-name payment-processing \
  --query 'Stacks[0].Outputs[?OutputKey==`PaymentProcessorFunctionArn`].OutputValue' \
  --output text | cut -d: -f7)

aws lambda update-function-code \
  --function-name $FUNCTION_NAME \
  --zip-file fileb://payment_processor.zip \
  --region us-east-1
```

## Testing

### Unit Tests

```bash
# Install test dependencies
pip install pytest pytest-cov boto3 moto

# Run template validation tests
pytest test/test_template.py -v

# Run Lambda function tests
pytest test/test_lambda.py -v

# Run with coverage
pytest test/ --cov=lib/lambda --cov-report=html
```

### Integration Test

```bash
# Test Lambda function with sample payment
aws lambda invoke \
  --function-name payment-processor-prod \
  --payload '{
    "payment_data": {
      "transactionId": "test-001",
      "amount": "99.99",
      "currency": "USD",
      "cardLast4": "4242"
    }
  }' \
  --region us-east-1 \
  response.json

# Check response
cat response.json
```

### Verify Encryption

```bash
# Check S3 bucket encryption
aws s3api get-bucket-encryption \
  --bucket payment-files-prod-<account-id>

# Check DynamoDB encryption
aws dynamodb describe-table \
  --table-name payment-transactions-prod \
  --query 'Table.SSEDescription'

# Check KMS key rotation
aws kms get-key-rotation-status \
  --key-id <kms-key-id>
```

## Usage

### Upload Payment File

```bash
# Create sample payment file
cat > payment.json << EOF
{
  "transactionId": "txn-$(date +%s)",
  "amount": "100.00",
  "currency": "USD",
  "cardLast4": "1234",
  "metadata": {
    "merchant": "Example Store",
    "timestamp": "$(date -u +%Y-%m-%dT%H:%M:%SZ)"
  }
}
EOF

# Upload to S3 (automatically encrypted)
BUCKET=$(aws cloudformation describe-stacks \
  --stack-name payment-processing \
  --query 'Stacks[0].Outputs[?OutputKey==`PaymentBucketName`].OutputValue' \
  --output text)

aws s3 cp payment.json s3://$BUCKET/payments/$(date +%Y%m%d)/payment.json \
  --server-side-encryption aws:kms
```

### Query Transaction

```bash
# Query DynamoDB for transaction
TABLE=$(aws cloudformation describe-stacks \
  --stack-name payment-processing \
  --query 'Stacks[0].Outputs[?OutputKey==`TransactionTableName`].OutputValue' \
  --output text)

aws dynamodb query \
  --table-name $TABLE \
  --key-condition-expression "transactionId = :tid" \
  --expression-attribute-values '{":tid":{"S":"txn-1234567890"}}' \
  --region us-east-1
```

### View CloudTrail Logs

```bash
# Check recent CloudTrail events
TRAIL_BUCKET=$(aws cloudformation describe-stack-resources \
  --stack-name payment-processing \
  --logical-resource-id CloudTrailBucket \
  --query 'StackResources[0].PhysicalResourceId' \
  --output text)

aws s3 ls s3://$TRAIL_BUCKET/AWSLogs/ --recursive
```

## Cleanup

```bash
# Empty S3 buckets (required before stack deletion)
BUCKET=$(aws cloudformation describe-stacks \
  --stack-name payment-processing \
  --query 'Stacks[0].Outputs[?OutputKey==`PaymentBucketName`].OutputValue' \
  --output text)

TRAIL_BUCKET=$(aws cloudformation describe-stack-resources \
  --stack-name payment-processing \
  --logical-resource-id CloudTrailBucket \
  --query 'StackResources[0].PhysicalResourceId' \
  --output text)

aws s3 rm s3://$BUCKET --recursive
aws s3 rm s3://$TRAIL_BUCKET --recursive

# Delete CloudFormation stack
aws cloudformation delete-stack \
  --stack-name payment-processing \
  --region us-east-1

# Monitor deletion
aws cloudformation wait stack-delete-complete \
  --stack-name payment-processing \
  --region us-east-1
```

## Cost Optimization

### Estimated Monthly Costs (us-east-1)

- **NAT Gateway**: $32.40 (0.045/hour × 720 hours)
- **NAT Gateway Data**: $0.045/GB
- **KMS Key**: $1.00
- **Lambda**: Pay per request (first 1M free)
- **DynamoDB**: Pay per request
- **S3 Storage**: $0.023/GB
- **CloudWatch Logs**: $0.50/GB ingested

**Total Base Cost**: ~$35-50/month

### Optimization Strategies

1. **Use NAT Instance for Dev/Test**: Replace NAT Gateway with t3.nano ($3.80/month)
2. **S3 Lifecycle Policies**: Move old versions to Glacier
3. **Lambda Reserved Concurrency**: Only for production
4. **DynamoDB On-Demand**: Pay per request (no provisioned capacity)

## PCI-DSS Compliance

This infrastructure implements PCI-DSS requirements:

### Requirement 3: Protect stored cardholder data
- ✅ All data encrypted with strong cryptography (AES-256)
- ✅ KMS key rotation enabled
- ✅ No unencrypted cardholder data

### Requirement 4: Encrypt transmission of cardholder data
- ✅ TLS/HTTPS enforced for all communications
- ✅ S3 bucket policy denies non-HTTPS access
- ✅ VPC endpoints for private AWS service access

### Requirement 7: Restrict access by business need-to-know
- ✅ IAM roles with least privilege
- ✅ No wildcard permissions
- ✅ Separate roles for each service

### Requirement 10: Track and monitor all access
- ✅ CloudTrail enabled for all API calls
- ✅ CloudWatch Logs for Lambda execution
- ✅ VPC Flow Logs (in IDEAL_RESPONSE)
- ✅ 30-day log retention

### Requirement 11: Regularly test security systems
- ✅ Unit tests for validation logic
- ✅ Integration tests for encryption
- ✅ Security policy enforcement tests

## Troubleshooting

### Lambda Cold Starts

**Issue**: First Lambda invocation is slow (10-15 seconds)

**Cause**: VPC Lambda requires ENI creation

**Solutions**:
- Use reserved concurrent executions (included in template)
- Implement CloudWatch Events for warming
- Accept as normal for PCI-compliant architecture

### CloudTrail Not Logging

**Issue**: No logs appearing in CloudTrail bucket

**Cause**: CloudTrail has 5-15 minute delay

**Solution**: Wait 15 minutes after event before checking logs

### Stack Deletion Fails

**Issue**: "Bucket not empty" error during deletion

**Solution**:
```bash
# Empty buckets first
aws s3 rm s3://payment-files-prod-<account-id> --recursive
aws s3 rm s3://payment-cloudtrail-prod-<account-id> --recursive
```

### KMS Key Permission Denied

**Issue**: Lambda cannot decrypt environment variables

**Cause**: KMS key policy missing Lambda permissions

**Solution**: Verify KMS key policy includes Lambda service principal

## Documentation

- `PROMPT.md`: Original task requirements
- `MODEL_RESPONSE.md`: Initial LLM-generated solution
- `IDEAL_RESPONSE.md`: Enhanced production-ready solution
- `MODEL_FAILURES.md`: Known issues and limitations

## Version History

- **v1.0**: Initial CloudFormation JSON implementation
  - KMS encryption for all resources
  - VPC with private subnets
  - Lambda payment processor
  - S3 and DynamoDB storage
  - CloudTrail audit logging

## Support

For issues or questions:
1. Check `MODEL_FAILURES.md` for known issues
2. Review CloudWatch Logs for error messages
3. Verify KMS key permissions
4. Check VPC endpoint connectivity

## License

This infrastructure code is provided as-is for PCI-DSS compliant payment processing.
