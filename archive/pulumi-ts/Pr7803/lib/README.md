# AWS Infrastructure Compliance Analyzer

Automated compliance scanning system for AWS infrastructure built with Pulumi and TypeScript.

## Overview

This solution scans existing AWS resources for compliance violations including:

- EC2 instances without required tags
- S3 buckets with public access
- IAM roles with overly permissive policies
- EC2 instances without CloudWatch monitoring
- EBS volumes without encryption

Reports are generated as JSON and stored in S3. Critical violations trigger SNS notifications.

## Architecture

- **Lambda Function**: Performs compliance scanning
- **S3 Bucket**: Stores compliance reports with versioning and encryption
- **SNS Topic**: Sends critical violation alerts with KMS encryption
- **CloudWatch Metrics**: Tracks violation counts by type
- **IAM Role**: Least-privilege permissions for Lambda execution

## Prerequisites

- Node.js 18.x or later
- Pulumi CLI installed
- AWS credentials configured
- AWS account with permissions to create resources

## Deployment

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Install Lambda dependencies**:
   ```bash
   cd lib/lambda/compliance-scanner
   npm install
   cd ../../..
   ```

3. **Set environment suffix**:
   ```bash
   export ENVIRONMENT_SUFFIX="dev"
   ```

4. **Deploy infrastructure**:
   ```bash
   pulumi up
   ```

5. **Invoke Lambda function**:
   ```bash
   aws lambda invoke --function-name compliance-scanner-dev output.json
   ```

## Configuration

Environment variables:

- `ENVIRONMENT_SUFFIX`: Environment identifier (default: 'dev')
- `AWS_REGION`: Target AWS region (default: 'us-east-1')

## Compliance Checks

### 1. EC2 Tag Compliance
- Required tags: Environment, Owner, CostCenter
- Severity: MEDIUM

### 2. S3 Public Access
- Checks bucket ACLs and policies
- Severity: CRITICAL

### 3. IAM Permissions
- Identifies wildcard permissions in policies
- Severity: HIGH

### 4. CloudWatch Monitoring
- Verifies detailed monitoring enabled
- Severity: LOW

### 5. EBS Encryption
- Checks all volumes for encryption
- Severity: CRITICAL

## Reports

Reports are stored in S3 with the format:
```
s3://compliance-reports-{environmentSuffix}/compliance-reports/report-{timestamp}.json
```

Report structure:
```json
{
  "scanTimestamp": "2025-12-03T...",
  "environment": "dev",
  "totalViolations": 10,
  "criticalViolations": 2,
  "violations": [
    {
      "resourceId": "i-1234567890abcdef0",
      "resourceType": "EC2Instance",
      "violationType": "MissingRequiredTags",
      "severity": "MEDIUM",
      "description": "EC2 instance missing required tags: Owner, CostCenter",
      "details": {...}
    }
  ]
}
```

## Metrics

CloudWatch custom metrics in namespace `ComplianceMonitoring`:

- `TotalViolations`: Total count of all violations
- `CriticalViolations`: Count of critical severity violations
- `MissingRequiredTags`: Count of tag compliance violations
- `PublicAccess`: Count of public S3 bucket violations
- `OverlyPermissivePolicy`: Count of IAM policy violations
- `MonitoringDisabled`: Count of monitoring violations
- `UnencryptedVolume`: Count of encryption violations

## Notifications

SNS notifications are sent for critical violations only:
- Public S3 buckets
- Unencrypted EBS volumes

Subscribe to the SNS topic to receive alerts:
```bash
aws sns subscribe \
  --topic-arn $(pulumi stack output snsTopicArn) \
  --protocol email \
  --notification-endpoint your-email@example.com
```

## Cleanup

To destroy all resources:
```bash
pulumi destroy
```

## Security Considerations

- Lambda uses least-privilege IAM permissions
- S3 bucket has public access blocked
- SNS topic uses KMS encryption
- All data encrypted at rest and in transit
- CloudWatch Logs enabled for audit trail

## Troubleshooting

**Lambda timeout**: Increase timeout in `lib/tap-stack.ts` if scanning large number of resources

**Permission errors**: Verify Lambda IAM role has necessary read permissions

**Missing reports**: Check CloudWatch Logs for Lambda execution errors

**No metrics**: Verify CloudWatch namespace is `ComplianceMonitoring`
