# Secure Payment Processing API Infrastructure

A production-ready Pulumi Python implementation for deploying a PCI-DSS compliant payment processing infrastructure on AWS with comprehensive security controls.

## Architecture

This infrastructure implements a defense-in-depth security model with:

- VPC with network isolation (3 private + 3 public subnets across 3 availability zones)
- Lambda functions in private subnets accessing AWS services via VPC endpoints
- API Gateway with WAF protection and Lambda proxy integration
- Customer-managed KMS keys with automatic rotation for all encryption
- CloudWatch Logs with 90-day retention and encryption
- DynamoDB with point-in-time recovery and encryption at rest
- S3 with versioning, encryption, and public access blocking
- IAM roles following least privilege with explicit deny statements

## Prerequisites

- AWS CLI configured with appropriate credentials
- Pulumi CLI installed (v3.0+)
- Python 3.9 or higher
- AWS account with permissions to create VPC, Lambda, API Gateway, WAF, S3, DynamoDB, KMS, CloudWatch resources

## Quick Start

### 1. Install Dependencies

```bash
# Install Pulumi
curl -fsSL https://get.pulumi.com | sh

# Install Python dependencies
pip install pulumi pulumi-aws
```

### 2. Configure Stack

```bash
# Initialize Pulumi (if not already initialized)
pulumi stack init dev

# Set required configuration
pulumi config set environmentSuffix dev
pulumi config set region us-east-1
pulumi config set aws:region us-east-1
```

### 3. Deploy Infrastructure

```bash
# Preview changes
pulumi preview

# Deploy stack
pulumi up --yes

# View outputs
pulumi stack output
```

### 4. Test the API

```bash
# Get API URL from outputs
API_URL=$(pulumi stack output api_gateway_url)

# Test payment processing endpoint
curl -X POST $API_URL/process-payment \
  -H "Content-Type: application/json" \
  -d '{
    "transactionId": "tx-001",
    "customerId": "cust-123",
    "amount": 99.99
  }'
```

## Configuration Options

| Parameter | Default | Description |
|-----------|---------|-------------|
| environmentSuffix | dev | Suffix for resource names |
| region | us-east-1 | AWS region for deployment |

## Stack Outputs

After deployment, the following outputs are available:

```bash
pulumi stack output vpc_id                  # VPC identifier
pulumi stack output private_subnet_ids      # Private subnet IDs
pulumi stack output public_subnet_ids       # Public subnet IDs
pulumi stack output lambda_function_name    # Lambda function name
pulumi stack output lambda_function_arn     # Lambda function ARN
pulumi stack output s3_bucket_name          # S3 bucket name
pulumi stack output dynamodb_table_name     # DynamoDB table name
pulumi stack output api_gateway_url         # API Gateway endpoint URL
pulumi stack output waf_web_acl_id          # WAF WebACL ID
pulumi stack output kms_s3_key_id           # S3 encryption key ID
pulumi stack output kms_dynamodb_key_id     # DynamoDB encryption key ID
pulumi stack output kms_logs_key_id         # CloudWatch Logs encryption key ID
```

## Security Features

### Network Security
- Lambda functions deployed in private subnets with no direct internet access
- VPC endpoints for S3, DynamoDB, and CloudWatch Logs
- Security groups restricting inbound and outbound traffic
- Separate public subnets for future ALB/NAT Gateway deployment

### Encryption
- Customer-managed KMS keys with automatic rotation enabled
- Separate KMS keys for S3, DynamoDB, and CloudWatch Logs
- S3 bucket encryption with KMS
- DynamoDB encryption at rest with KMS
- CloudWatch Logs encryption with KMS

### API Protection
- AWS WAF with OWASP Top 10 managed rule sets
- Rate limiting (2000 requests per 5 minutes per IP)
- API Gateway access logging to CloudWatch
- Lambda proxy integration

### IAM Security
- Least privilege IAM policies with specific actions
- Explicit deny statements for destructive operations
- Conditions enforcing encrypted-only S3 access
- VPC networking permissions for Lambda

### Data Protection
- S3 versioning enabled for data recovery
- S3 public access blocked at bucket level
- DynamoDB point-in-time recovery enabled
- CloudWatch Logs retention set to 90 days

### Compliance
- All resources tagged with Environment, DataClassification, ComplianceScope
- PCI-DSS aligned security controls
- Audit trail via CloudWatch Logs and API Gateway logging

## Resource Naming Convention

All resources follow the pattern: `{resource-type}-{environment-suffix}`

Examples:
- VPC: `payment-vpc-dev`
- Lambda: `payment-processor-dev`
- S3: `payment-docs-dev-{account-id}`
- DynamoDB: `payment-transactions-dev`

## Monitoring and Logging

### CloudWatch Logs
- Lambda function logs: `/aws/lambda/payment-processor-{environment_suffix}`
- 90-day retention period
- Encrypted with customer-managed KMS key

### CloudWatch Metrics
- WAF metrics for all rules
- API Gateway execution metrics
- Lambda invocation and error metrics

### Alarms (Future Enhancement)
Consider adding CloudWatch Alarms for:
- API Gateway 4XX/5XX error rates
- Lambda function errors and throttles
- WAF blocked request rates
- DynamoDB consumed capacity

## Cost Optimization

This infrastructure uses several cost-optimized configurations:

- DynamoDB with on-demand billing (pay-per-request)
- Lambda in private subnets (no NAT Gateway costs)
- VPC Gateway endpoints for S3/DynamoDB (no data transfer costs)
- Minimal VPC Interface endpoints (only CloudWatch Logs)

Estimated monthly cost (low traffic): $10-30
- KMS keys: $3/key/month (3 keys = $9)
- Lambda: Pay per invocation + GB-second
- API Gateway: Pay per request
- DynamoDB: Pay per request
- S3: Pay per GB stored
- CloudWatch Logs: Pay per GB ingested
- VPC endpoints: $7.20/month for Logs interface endpoint

## Troubleshooting

### Lambda Cannot Access DynamoDB
- Verify VPC endpoints are created and associated with private route table
- Check Lambda security group allows outbound traffic
- Verify IAM role has DynamoDB permissions

### API Gateway Returns 502
- Check Lambda function logs in CloudWatch
- Verify Lambda handler name matches code configuration
- Ensure Lambda has proper IAM permissions

### KMS Encryption Errors
- Verify KMS key policy allows CloudWatch Logs service
- Check IAM role has kms:Decrypt and kms:GenerateDataKey permissions
- Ensure KMS key is in the same region as resources

### WAF Not Protecting API
- Verify WAF WebACL scope is REGIONAL
- Check WebAclAssociation links WAF to API stage ARN
- Review WAF metrics in CloudWatch

## Cleanup

To destroy all resources:

```bash
pulumi destroy --yes
```

Note: KMS keys have a 10-day deletion window. They will be scheduled for deletion but not immediately removed.

## Project Structure

```
.
├── lib/
│   ├── tap_stack.py           # Main infrastructure code
│   ├── PROMPT.md              # Original requirements document
│   ├── IDEAL_RESPONSE.md      # Complete working implementation
│   ├── MODEL_RESPONSE.md      # Version with intentional errors
│   ├── MODEL_FAILURES.md      # Error analysis and fixes
│   └── README.md              # This file
├── tests/
│   ├── unit/                  # Unit tests for infrastructure
│   └── integration/           # Integration tests
├── metadata.json              # Task metadata
└── Pulumi.yaml                # Pulumi project configuration
```

## Learning Resources

This implementation demonstrates:

1. **VPC Best Practices**: Private subnets with VPC endpoints for AWS service access
2. **Security Controls**: Multi-layered defense with WAF, encryption, IAM, and network isolation
3. **Compliance**: PCI-DSS aligned controls with proper tagging and logging
4. **Error Handling**: Comprehensive Lambda error handling with proper logging
5. **Infrastructure as Code**: Clean, maintainable Pulumi Python code

For detailed error analysis and learning points, see MODEL_FAILURES.md which documents 50+ common infrastructure code mistakes and their corrections.

## Support

For issues or questions:
- Review MODEL_FAILURES.md for common errors and fixes
- Check CloudWatch Logs for Lambda and API Gateway issues
- Verify AWS service quotas and limits
- Consult Pulumi documentation: https://www.pulumi.com/docs/

## License

This is example infrastructure code for educational and testing purposes.
