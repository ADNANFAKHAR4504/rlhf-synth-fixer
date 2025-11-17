# Secure Data Analytics Platform

Defense-in-depth security implementation for PCI-DSS compliant data analytics using AWS CDK TypeScript.

## Architecture Overview

This solution implements a multi-layered security architecture:

- **Encryption Layer**: KMS customer-managed keys with rotation
- **Network Layer**: VPC with private subnets only, VPC endpoints for AWS services
- **Storage Layer**: S3 buckets with SSE-KMS, versioning, and deny policies
- **Compute Layer**: Lambda functions with IAM session policies and permission boundaries
- **API Layer**: API Gateway with WAF protection and API key authentication
- **Monitoring Layer**: CloudWatch Logs, metrics, and alarms for security events

## Security Features

### 1. Data Encryption
- KMS customer-managed key with automatic rotation
- All S3 buckets encrypted with KMS
- CloudWatch Logs encrypted with KMS
- Bucket policies deny unencrypted uploads

### 2. Network Isolation
- VPC with 3 private subnets across availability zones
- No internet gateway or NAT gateway
- VPC endpoints for S3, DynamoDB, and Lambda
- Security groups restricting traffic to HTTPS only

### 3. Access Control
- IAM roles with least privilege principles
- Permission boundaries preventing privilege escalation
- Explicit deny policies for destructive actions
- Session policies limiting S3 access to specific prefixes
- API key authentication for API access

### 4. Threat Protection
- AWS WAF with SQL injection protection
- XSS attack prevention
- Rate limiting rules
- DDoS protection via AWS Shield

### 5. Audit and Monitoring
- S3 access logging to audit bucket
- CloudWatch Logs with 90-day retention
- CloudWatch alarms for security events
- SNS notifications for alarm triggers
- Complete audit trail of all operations

## Deployment

### Prerequisites

- Node.js 18+ and npm
- AWS CLI configured with appropriate credentials
- AWS CDK CLI installed: `npm install -g aws-cdk`

### Deploy

```bash
# Install dependencies
npm install

# Synthesize CloudFormation template
cdk synth -c environmentSuffix=synth8k3zn9

# Deploy to AWS
cdk deploy -c environmentSuffix=synth8k3zn9
```

### Important Notes

- The `environmentSuffix` context variable is **required** for all CDK commands
- This ensures unique resource names and prevents conflicts
- Example: `synth8k3zn9` creates buckets like `raw-data-synth8k3zn9`

## Testing the Deployment

### 1. Upload Test Data

```bash
# Get bucket name from stack outputs
RAW_BUCKET=$(aws cloudformation describe-stacks \
  --stack-name TapStack \
  --query 'Stacks[0].Outputs[?OutputKey==`RawDataBucketName`].OutputValue' \
  --output text)

# Upload a test file (will trigger Lambda via EventBridge)
echo "test data" > test-file.txt
aws s3 cp test-file.txt s3://$RAW_BUCKET/input/test-file.txt
```

### 2. Test API Gateway

```bash
# Get API endpoint and key
API_ENDPOINT=$(aws cloudformation describe-stacks \
  --stack-name TapStack \
  --query 'Stacks[0].Outputs[?OutputKey==`ApiEndpoint`].OutputValue' \
  --output text)

API_KEY_ID=$(aws cloudformation describe-stacks \
  --stack-name TapStack \
  --query 'Stacks[0].Outputs[?OutputKey==`ApiKeyId`].OutputValue' \
  --output text)

# Get API key value
API_KEY_VALUE=$(aws apigateway get-api-key \
  --api-key $API_KEY_ID \
  --include-value \
  --query 'value' \
  --output text)

# Test API call
curl -X GET \
  -H "x-api-key: $API_KEY_VALUE" \
  "${API_ENDPOINT}data"
```

### 3. Check Logs

```bash
# View Lambda logs
aws logs tail /aws/lambda/data-processor-synth8k3zn9 --follow

# View API Gateway logs
aws logs tail /aws/apigateway/analytics-api-synth8k3zn9 --follow
```

### 4. Verify Security

```bash
# Attempt unencrypted upload (should be denied)
aws s3 cp test-file.txt s3://$RAW_BUCKET/test.txt \
  --server-side-encryption AES256
# Expected: Access Denied due to bucket policy

# Check WAF metrics
aws cloudwatch get-metric-statistics \
  --namespace AWS/WAFV2 \
  --metric-name BlockedRequests \
  --dimensions Name=WebACL,Value=analytics-waf-synth8k3zn9 Name=Region,Value=us-east-2 \
  --start-time $(date -u -d '1 hour ago' +%Y-%m-%dT%H:%M:%S) \
  --end-time $(date -u +%Y-%m-%dT%H:%M:%S) \
  --period 300 \
  --statistics Sum
```

## Cleanup

```bash
# Destroy all resources
cdk destroy -c environmentSuffix=synth8k3zn9
```

## Compliance Notes

### PCI-DSS Requirements Met

- **Requirement 3**: Data encryption at rest and in transit
- **Requirement 4**: Encrypted transmission over public networks (HTTPS only)
- **Requirement 7**: Restrict access to cardholder data (IAM policies)
- **Requirement 8**: Assign unique ID to each person with access (IAM roles)
- **Requirement 10**: Track and monitor all access (CloudWatch Logs, CloudTrail)

### 90-Day Log Retention

CloudWatch Logs are configured with exactly 90-day retention to meet compliance requirements:
- Lambda function logs
- API Gateway access logs
- All logs encrypted with KMS

## Architecture Decisions

### Why No NAT Gateway?

- Cost optimization (NAT Gateway ~$32/month)
- Security enhancement (no internet access)
- VPC endpoints provide secure AWS service access
- All required services (S3, DynamoDB, Lambda) accessible via VPC endpoints

### Why KMS Customer-Managed Keys?

- Full control over key rotation and policies
- Audit trail of all key usage via CloudTrail
- Resource-based policies restrict key usage
- Required for PCI-DSS compliance

### Why Permission Boundaries?

- Prevent privilege escalation
- Enforce security guardrails on all IAM roles
- Protect against overly permissive policies
- Additional layer of defense-in-depth

## Troubleshooting

### Lambda Cannot Access S3

- Verify Lambda is in private subnets
- Check S3 VPC endpoint is properly configured
- Verify security group allows HTTPS egress
- Check IAM role has necessary permissions

### API Gateway Returns 403

- Verify API key is included in request header: `x-api-key`
- Check WAF rules aren't blocking legitimate requests
- Review CloudWatch Logs for detailed error messages

### KMS Access Denied

- Verify IAM role has `kms:Decrypt` and `kms:GenerateDataKey` permissions
- Check KMS key policy allows the role
- Ensure key is not disabled or pending deletion

## Security Best Practices Implemented

1. **Defense in Depth**: Multiple security layers (encryption, network isolation, IAM, WAF)
2. **Least Privilege**: IAM roles grant minimum necessary permissions
3. **Encryption Everywhere**: All data encrypted at rest and in transit
4. **Network Isolation**: Private subnets only, VPC endpoints for AWS services
5. **Audit Logging**: Complete trail of all operations and access attempts
6. **Monitoring and Alerting**: CloudWatch alarms on security events
7. **Automated Response**: SNS notifications enable incident response
8. **Compliance Ready**: 90-day log retention, encryption, access controls

## Cost Estimates

### Monthly Cost Breakdown

- VPC: $0 (3 private subnets)
- VPC Endpoints: ~$21.60 (3 interface endpoints x $7.20/month)
- S3: ~$0.023/GB stored + requests
- Lambda: Free tier covers typical usage
- API Gateway: Free tier covers development, ~$3.50/million requests
- KMS: $1/month for key + $0.03/10,000 requests
- CloudWatch Logs: $0.50/GB ingested, $0.03/GB stored
- WAF: $5/month + $1/million requests
- EventBridge: Free for standard AWS events

**Estimated Total**: ~$30-40/month for typical development workload

## References

- [AWS CDK Documentation](https://docs.aws.amazon.com/cdk/)
- [AWS Well-Architected Framework - Security Pillar](https://aws.amazon.com/architecture/well-architected/)
- [PCI-DSS Requirements](https://www.pcisecuritystandards.org/)
- [AWS VPC Endpoints](https://docs.aws.amazon.com/vpc/latest/privatelink/vpc-endpoints.html)
- [AWS KMS Best Practices](https://docs.aws.amazon.com/kms/latest/developerguide/best-practices.html)
