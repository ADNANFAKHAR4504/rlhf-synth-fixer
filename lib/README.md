# Security, Compliance, and Governance Infrastructure

Production-ready CDK TypeScript infrastructure for SOC2 and PCI-DSS compliance.

## Architecture Overview

This infrastructure implements a comprehensive security baseline with the following components:

### Security Layer
- **KMS Key**: Automatic rotation every 90 days, used for all encryption at rest
- **IAM Roles**:
  - Audit role with 1-hour session limit and read-only access
  - Operations role with 2-hour session limit and MFA requirements for sensitive operations
  - Explicit deny statements for destructive operations

### Networking Layer
- **VPC**: 3 availability zones with public, private, and isolated subnets
- **Database Subnets**: No internet gateway (PRIVATE_ISOLATED)
- **VPC Flow Logs**: Sent to both S3 (90-day retention) and CloudWatch Logs
- **Security Groups**: Explicit egress rules, no 0.0.0.0/0 except HTTPS

### Storage Layer
- **Application Data Bucket**: SSE-KMS encryption, versioning, access logging
- **Audit Logs Bucket**: SSE-KMS encryption, 7-year retention, Glacier archival
- **Access Logs Bucket**: SSE-KMS encryption for access log storage
- **All buckets**: Block public access, enforce TLS in transit

### Database Layer
- **RDS Aurora MySQL Serverless v2**:
  - Encrypted with customer-managed KMS key
  - TLS 1.2+ enforcement via parameter group
  - Automated backups (7-day retention)
  - CloudWatch Logs exports (error, general, slowquery, audit)
  - Certificate validation required

### Monitoring Layer
- **CloudWatch Logs**: KMS encryption, 1-year retention
- **Metric Filters**: Unauthorized API calls, privilege escalation attempts
- **CloudWatch Alarms**: Trigger on security events
- **SNS Topic**: Encrypted message delivery for security alerts
- **AWS Config**:
  - Configuration recorder with all resources
  - 5 managed rules for compliance monitoring:
    - S3 bucket encryption
    - RDS encryption
    - EBS encryption by default
    - IAM password policy
    - S3 public access block

### Compliance Layer
- **Systems Manager Parameter Store**:
  - Compliance standards (SOC2, PCI-DSS)
  - Encryption standard (AES-256)
  - TLS version (1.2+)
  - Retention policies
- **Compliance Reports**: Stack outputs showing security configuration status

## Prerequisites

- AWS CDK 2.x
- Node.js 18+
- AWS CLI configured with appropriate permissions
- Environment suffix for resource naming

## Deployment

```bash
# Install dependencies
npm install

# Set environment suffix
export ENVIRONMENT_SUFFIX="dev"

# Deploy
cdk deploy --context environmentSuffix=$ENVIRONMENT_SUFFIX

# Or pass as parameter
cdk deploy -c environmentSuffix=dev
```

## Configuration

All resources are named with the `environmentSuffix` pattern:
- `{resource-name}-${environmentSuffix}`
- Example: `application-data-dev-123456789012`

## Security Features

1. **Encryption at Rest**: All data stores encrypted with KMS customer-managed key
2. **Encryption in Transit**: TLS 1.2+ enforced for all connections
3. **Least Privilege**: IAM roles with explicit deny statements
4. **MFA Requirements**: Sensitive operations require MFA
5. **Session Limits**: 1-2 hour session durations
6. **Monitoring**: CloudWatch alarms for unauthorized access and privilege escalation
7. **Compliance**: AWS Config rules for continuous compliance monitoring
8. **Audit Trail**: VPC Flow Logs, CloudWatch Logs, S3 access logs

## Compliance Standards

- **SOC2**: Security controls, access management, encryption, monitoring
- **PCI-DSS**: Encryption, access control, logging, network segmentation

## Resource Tagging

All resources tagged with:
- `DataClassification: Confidential`
- `Environment: {environmentSuffix}`
- `Owner: security-team`
- `ComplianceFramework: SOC2,PCI-DSS`

## Testing

```bash
# Run unit tests
npm test

# Run integration tests (requires deployment)
npm run test:integration
```

## Cleanup

```bash
cdk destroy --context environmentSuffix=$ENVIRONMENT_SUFFIX
```

## Compliance Outputs

After deployment, review the compliance summary:
- KMS Key ARN
- Encrypted resource count: 8
- AWS Config rules deployed: 5
- Security features enabled: 10
- Compliance status: COMPLIANT

## Notes

- **GuardDuty**: Not created (account-level service, enable manually)
- **Termination Protection**: Disabled for CI/CD (enable in production)
- **Deletion Protection**: Disabled for destroyability (enable in production)
- **NAT Gateway**: Single NAT for cost optimization (scale in production)
