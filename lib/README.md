# Zero-Trust Security Architecture for Financial Data Processing

A production-ready Pulumi TypeScript implementation of a zero-trust security architecture for processing sensitive financial data in AWS. This solution meets PCI-DSS compliance requirements with encryption at rest and in transit, strict access controls, and comprehensive audit trails.

## Architecture Overview

This infrastructure implements a completely isolated, zero-trust security model where:

- All resources are deployed in private subnets with NO internet access
- All AWS service communication occurs through VPC endpoints (AWS PrivateLink)
- All data is encrypted at rest using customer-managed KMS keys
- All access attempts are logged to an encrypted audit table
- AWS Config continuously monitors encryption compliance
- Security groups enforce minimal necessary permissions

### Components

1. **VPC**: 10.0.0.0/16 CIDR with 3 private subnets across availability zones
2. **VPC Endpoints**: Gateway endpoints for S3 and DynamoDB, Interface endpoints for KMS and CloudWatch Logs
3. **KMS**: Customer-managed key with automatic rotation for all encryption
4. **S3 Bucket**: Versioned, encrypted storage with public access completely blocked
5. **Lambda Function**: Data processor running in private subnet with 1024MB memory
6. **DynamoDB Table**: Encrypted audit log table with point-in-time recovery
7. **CloudWatch Logs**: Encrypted log group with 90-day retention
8. **AWS Config**: Compliance monitoring with encryption validation rules
9. **IAM Roles**: Least-privilege policies for all services

## Prerequisites

- Node.js 18.x or later
- Pulumi CLI 3.x or later
- AWS CLI configured with appropriate credentials
- TypeScript 5.x or later
- Valid AWS account with permissions to create VPCs, KMS keys, Lambda, etc.

## Installation

1. Install project dependencies:
```bash
npm install
```

2. Install Lambda function dependencies:
```bash
cd lib/lambda
npm install
cd ../..
```

3. Install Pulumi plugins:
```bash
pulumi plugin install resource aws v6.0.0
```

## Configuration

### Required Configuration

Set the following Pulumi configuration values:

```bash
# Set your unique environment suffix (REQUIRED)
pulumi config set environmentSuffix <your-unique-suffix>

# Set AWS region (defaults to us-east-1)
pulumi config set region us-east-1
pulumi config set aws:region us-east-1
```

The `environmentSuffix` is critical for:
- Making resource names unique across deployments
- Preventing naming conflicts in shared AWS accounts
- Supporting multiple environments (dev, staging, prod)

Example:
```bash
pulumi config set environmentSuffix dev-abc123
```

This will create resources like:
- `financial-data-dev-abc123` (S3 bucket)
- `audit-logs-dev-abc123` (DynamoDB table)
- `data-processor-dev-abc123` (Lambda function)

## Deployment

### 1. Preview Changes

Before deploying, preview what resources will be created:

```bash
pulumi preview
```

This will show you:
- All resources to be created
- Expected configurations
- Estimated deployment time

### 2. Deploy Infrastructure

Deploy the complete stack:

```bash
pulumi up
```

Review the plan and type "yes" to confirm.

Deployment typically takes 5-10 minutes and includes:
- VPC and networking (1-2 min)
- VPC endpoints (2-3 min)
- KMS key and encryption setup (1 min)
- Lambda function with VPC configuration (2-3 min)
- AWS Config recorder (1-2 min)

### 3. Verify Deployment

After deployment completes, Pulumi will display the stack outputs:

```
Outputs:
    bucketName      : "financial-data-dev-abc123"
    kmsKeyArn       : "arn:aws:kms:us-east-1:123456789012:key/..."
    lambdaArn       : "arn:aws:lambda:us-east-1:123456789012:function:data-processor-dev-abc123"
    vpcId           : "vpc-0123456789abcdef"
    auditTableName  : "audit-logs-dev-abc123"
```

Save these outputs for testing and validation.

### 4. Export Outputs

For integration tests, export outputs to a JSON file:

```bash
pulumi stack output --json > cfn-outputs/flat-outputs.json
```

## Testing

### Unit Tests

Run unit tests to verify resource configurations:

```bash
npm test
```

Unit tests validate:
- Resource naming conventions (environmentSuffix)
- KMS encryption settings
- VPC configuration
- Security group rules
- IAM policies
- Tag compliance

### Integration Tests

Run integration tests against the deployed infrastructure:

```bash
npm run test:integration
```

Integration tests validate:
- VPC isolation (no internet gateway/NAT gateway)
- VPC endpoint connectivity
- KMS key rotation
- S3 bucket encryption and versioning
- DynamoDB encryption and PITR
- Lambda VPC configuration
- CloudWatch Logs encryption
- AWS Config compliance rules
- End-to-end data processing flow
- Security group rules (no 0.0.0.0/0)

### End-to-End Testing

Test the complete data processing pipeline:

```bash
# Upload a test file
aws s3 cp test.txt s3://financial-data-<suffix>/test-$(date +%s).txt

# Wait 5 seconds for Lambda processing
sleep 5

# Check audit logs
aws dynamodb scan --table-name audit-logs-<suffix> \
  --filter-expression "contains(fileName, :key)" \
  --expression-attribute-values '{":key": {"S": "test"}}'

# Check CloudWatch Logs
aws logs tail /aws/lambda/data-processor-<suffix> --follow
```

## Usage

### Processing Files

The Lambda function automatically processes files uploaded to the S3 bucket:

1. Upload a file to S3:
```bash
aws s3 cp my-file.json s3://financial-data-<suffix>/data/my-file.json
```

2. Lambda automatically:
   - Retrieves the file through S3 VPC endpoint (no internet)
   - Decrypts using KMS through KMS VPC endpoint
   - Creates audit log in DynamoDB through DynamoDB VPC endpoint
   - Writes logs to CloudWatch through Logs VPC endpoint

3. View audit log:
```bash
aws dynamodb get-item \
  --table-name audit-logs-<suffix> \
  --key '{"id": {"S": "2024-01-01T12:00:00.000Z-data/my-file.json"}}'
```

### Querying Audit Logs

Query audit logs by status:

```bash
# Get all successful processing logs
aws dynamodb scan \
  --table-name audit-logs-<suffix> \
  --filter-expression "#status = :status" \
  --expression-attribute-names '{"#status": "status"}' \
  --expression-attribute-values '{":status": {"S": "SUCCESS"}}'

# Get all failed processing logs
aws dynamodb scan \
  --table-name audit-logs-<suffix> \
  --filter-expression "#status = :status" \
  --expression-attribute-names '{"#status": "status"}' \
  --expression-attribute-values '{":status": {"S": "FAILED"}}'
```

### Viewing CloudWatch Logs

View Lambda execution logs:

```bash
# Tail logs in real-time
aws logs tail /aws/lambda/data-processor-<suffix> --follow

# View logs from last hour
aws logs tail /aws/lambda/data-processor-<suffix> --since 1h

# Search for errors
aws logs filter-log-events \
  --log-group-name /aws/lambda/data-processor-<suffix> \
  --filter-pattern "ERROR"
```

### Checking AWS Config Compliance

View encryption compliance status:

```bash
# List Config rules
aws configservice describe-config-rules

# Get compliance status for S3 encryption
aws configservice describe-compliance-by-config-rule \
  --config-rule-names s3-encryption-rule-<suffix>

# Get compliance status for DynamoDB encryption
aws configservice describe-compliance-by-config-rule \
  --config-rule-names dynamo-encryption-rule-<suffix>
```

## Security Features

### Encryption at Rest

All data at rest is encrypted using AWS KMS with customer-managed keys:

- S3 bucket: AES-256 with KMS (SSE-KMS)
- DynamoDB table: KMS encryption with dedicated key
- CloudWatch Logs: KMS encryption
- Lambda environment variables: Automatically encrypted by AWS

### Encryption in Transit

All data in transit is encrypted using TLS 1.2+:

- VPC endpoints enforce HTTPS (port 443)
- Security groups only allow HTTPS traffic
- No unencrypted communication channels

### Network Isolation

Complete zero-trust network architecture:

- No internet gateway or NAT gateway
- Lambda runs in private subnets only
- All AWS service access through VPC endpoints
- Security groups deny all except explicit VPC CIDR traffic

### Access Control

Least-privilege IAM policies:

- Lambda can only read/write specific S3 bucket
- Lambda can only write to specific DynamoDB table
- Lambda can only use specific KMS key
- Config can only write to specific S3 bucket

### Audit Trail

Comprehensive audit logging:

- Every file access logged to DynamoDB
- Timestamp, filename, status recorded
- Errors logged with details
- CloudWatch Logs capture all Lambda execution

### Compliance Monitoring

AWS Config continuously validates:

- S3 bucket encryption enabled
- DynamoDB table encryption enabled
- Configuration changes tracked
- Non-compliant resources flagged

## Troubleshooting

### Lambda Cannot Connect to S3

**Symptom**: Lambda times out when trying to access S3

**Solution**:
1. Verify S3 VPC endpoint exists and is attached to correct route tables
2. Check Lambda security group allows outbound HTTPS (443)
3. Check S3 endpoint security group allows inbound HTTPS from VPC CIDR

```bash
# Check VPC endpoints
aws ec2 describe-vpc-endpoints --filters "Name=vpc-id,Values=<vpc-id>"

# Check Lambda configuration
aws lambda get-function-configuration --function-name data-processor-<suffix>
```

### Lambda Cannot Write to DynamoDB

**Symptom**: Lambda fails with permission errors writing to DynamoDB

**Solution**:
1. Verify DynamoDB VPC endpoint exists
2. Check Lambda IAM role has PutItem permission
3. Verify KMS key policy allows DynamoDB and Lambda services

```bash
# Check IAM role policies
aws iam get-role-policy --role-name lambda-role-<suffix> --policy-name lambdaPolicy

# Test DynamoDB access from Lambda
aws lambda invoke --function-name data-processor-<suffix> \
  --payload '{"Records":[]}' response.json
```

### AWS Config Not Recording

**Symptom**: Config shows no compliance data

**Solution**:
1. Verify Config recorder is enabled
2. Check Config delivery channel exists
3. Verify Config IAM role has proper permissions

```bash
# Check Config status
aws configservice describe-configuration-recorder-status

# Start Config recorder if stopped
aws configservice start-configuration-recorder \
  --configuration-recorder-name config-recorder-<suffix>
```

### KMS Key Permission Errors

**Symptom**: Services fail with KMS decrypt/encrypt errors

**Solution**:
1. Verify KMS key policy includes all required services
2. Check IAM policies grant kms:Decrypt and kms:Encrypt
3. Ensure KMS VPC endpoint exists and is reachable

```bash
# Get KMS key policy
aws kms get-key-policy --key-id <key-id> --policy-name default

# Test KMS access
aws kms describe-key --key-id <key-id>
```

### High Lambda Cold Start Times

**Symptom**: First Lambda invocation takes 10+ seconds

**Solution**: This is expected for Lambda functions in VPC. VPC-attached Lambdas have longer cold starts (5-15 seconds) due to ENI creation. Subsequent invocations are fast.

Mitigation:
- Use provisioned concurrency (adds cost)
- Accept cold start latency for security benefits
- Optimize Lambda code size

### VPC Endpoint Costs

**Note**: VPC interface endpoints (KMS, CloudWatch Logs) cost ~$7.20/month each plus data transfer. Gateway endpoints (S3, DynamoDB) are free. This is the cost of zero-trust security.

## Updating the Stack

### Modify Configuration

To update configurations:

```bash
# Update Lambda memory
pulumi config set lambdaMemory 2048

# Update log retention
pulumi config set logRetentionDays 180

# Apply changes
pulumi up
```

### Update Lambda Code

To deploy Lambda code changes:

```bash
# Update code in lib/lambda/index.ts
# Then redeploy
pulumi up
```

Pulumi detects code changes and updates only the Lambda function.

### Add New Resources

To add resources:

1. Edit `lib/tap-stack.ts`
2. Add new resource definitions
3. Deploy:
```bash
pulumi up
```

## Destroying the Stack

To completely remove all resources:

```bash
# Preview what will be deleted
pulumi destroy --preview

# Destroy all resources
pulumi destroy
```

Note: All resources are configured to be destroyable (no deletion protection), so cleanup is fast and complete.

Destruction takes 3-5 minutes and removes:
- Lambda function and log group
- VPC endpoints
- S3 buckets (including all objects)
- DynamoDB tables
- KMS keys (scheduled for deletion in 7 days)
- IAM roles and policies
- VPC and subnets
- AWS Config recorder

## Cost Estimation

Monthly costs for this infrastructure (us-east-1, light usage):

- VPC: Free
- VPC Endpoints (Interface): ~$14.40 (2 endpoints × $7.20)
- VPC Endpoints (Gateway): Free
- KMS: $1.00 (1 key)
- S3: ~$0.10 (10 GB storage + requests)
- DynamoDB: ~$0.25 (PAY_PER_REQUEST, light usage)
- Lambda: ~$0.20 (100 invocations/day)
- CloudWatch Logs: ~$0.50 (1 GB logs/month)
- AWS Config: ~$2.00 (recorder + rules)

**Total: ~$18.50/month** for a fully isolated, zero-trust architecture

## Architecture Decisions

### Why No NAT Gateway?

NAT Gateways cost ~$32/month and provide internet access, which violates zero-trust principles. VPC endpoints are free (Gateway) or cheaper (Interface) and keep all traffic within AWS.

### Why Customer-Managed KMS Keys?

AWS-managed keys are easier but provide less control. Customer-managed keys enable:
- Key rotation monitoring
- Detailed access policies
- Compliance audit trails
- Cross-account key sharing (if needed)

### Why PAY_PER_REQUEST for DynamoDB?

For audit logging with unpredictable traffic, PAY_PER_REQUEST is more cost-effective than provisioned capacity. No capacity planning needed, scales automatically.

### Why 90-Day Log Retention?

Balances compliance requirements with storage costs. PCI-DSS requires at least 90 days of audit logs. Increase to 365+ days for stricter compliance.

## Contributing

When making changes:

1. Update code in `lib/`
2. Update tests in `test/`
3. Run unit tests: `npm test`
4. Deploy to test environment
5. Run integration tests: `npm run test:integration`
6. Update this README if architecture changes

## License

This infrastructure code is provided as-is for educational and production use.

## Support

For issues or questions:

1. Check Troubleshooting section above
2. Review AWS CloudWatch Logs for errors
3. Check AWS Config for compliance issues
4. Review Pulumi logs: `pulumi logs`
5. Consult MODEL_FAILURES.md for known issues and fixes

## References

- [Pulumi AWS Provider Docs](https://www.pulumi.com/registry/packages/aws/)
- [AWS VPC Endpoints](https://docs.aws.amazon.com/vpc/latest/privatelink/)
- [AWS KMS Key Policies](https://docs.aws.amazon.com/kms/latest/developerguide/key-policies.html)
- [PCI-DSS Compliance](https://aws.amazon.com/compliance/pci-dss-level-1-faqs/)
- [Zero Trust Architecture](https://aws.amazon.com/security/zero-trust/)
