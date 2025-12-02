# AWS Config Compliance Monitoring System - Implementation Guide

## Overview

This implementation provides a comprehensive automated compliance checking system using AWS Config with Pulumi TypeScript. The system monitors AWS resources, enforces compliance rules, and automatically remediates non-compliant configurations.

## Architecture

### Components

1. **S3 Bucket for Config Data**
   - Versioning enabled for audit trail
   - KMS encryption for data at rest
   - Bucket policy allowing AWS Config service access

2. **AWS Config Recorder**
   - Tracks EC2 instances, S3 buckets, and IAM roles
   - Delivers configuration snapshots to S3
   - Sends compliance notifications via SNS

3. **Compliance Rules**
   - S3 bucket encryption validation
   - S3 bucket versioning validation
   - EC2 approved AMI validation
   - Required tags validation (Environment, Owner, CostCenter)

4. **Remediation**
   - Automatic S3 encryption enablement
   - SSM automation documents
   - Remediation role with least privilege

5. **Notifications and Processing**
   - SNS topic for compliance events
   - Lambda function for processing and formatting reports
   - Email subscriptions for alerts

6. **Multi-Region Compliance**
   - Config aggregator for centralized compliance view
   - Aggregation authorization for cross-region data

### Security Features

- **Encryption**: All data encrypted at rest (KMS) and in transit (TLS)
- **IAM Least Privilege**: Each service has minimal required permissions
- **Audit Trail**: Complete configuration history in S3 with versioning
- **Automated Remediation**: Non-compliant resources automatically fixed

## Deployment

### Prerequisites

- AWS account with appropriate permissions
- Pulumi CLI installed
- Node.js 20.x or higher
- AWS credentials configured

### Configuration

Set the environment suffix for resource naming:

```bash
export ENVIRONMENT_SUFFIX=dev
```

### Deploy

```bash
# Install dependencies
npm install

# Deploy infrastructure
pulumi up --yes --stack dev
```

### Environment Variables

- `ENVIRONMENT_SUFFIX`: Environment identifier (dev, test, prod)
- `AWS_REGION`: Target AWS region (default: us-east-1)

## Testing

### Unit Tests

```bash
npm run test:unit
```

Tests verify:
- Stack instantiation
- Resource creation with correct properties
- IAM policies and roles
- Resource naming with environmentSuffix
- Config rules and remediation configurations

### Integration Tests

```bash
export ENVIRONMENT_SUFFIX=dev
npm run test:integration
```

Tests verify:
- S3 bucket versioning and encryption
- Config recorder status and configuration
- Config rules deployment
- Remediation configurations
- SNS topic and Lambda function

## Compliance Rules

### 1. S3 Bucket Encryption

**Rule**: `s3-bucket-encryption-{environmentSuffix}`

Checks that all S3 buckets have server-side encryption enabled.

**Remediation**: Automatically enables AES256 encryption for non-compliant buckets.

### 2. S3 Bucket Versioning

**Rule**: `s3-bucket-versioning-{environmentSuffix}`

Checks that all S3 buckets have versioning enabled.

### 3. EC2 Approved AMIs

**Rule**: `ec2-approved-ami-{environmentSuffix}`

Validates that EC2 instances use only approved AMI IDs.

**Configuration**: Approved AMI list can be customized in stack props.

### 4. Required Tags

**Rule**: `required-tags-{environmentSuffix}`

Ensures resources have required tags:
- Environment
- Owner
- CostCenter

## Lambda Compliance Processor

Processes AWS Config compliance change notifications and formats detailed reports.

**Features**:
- Parses Config compliance events
- Fetches additional compliance details
- Formats structured reports
- Publishes to SNS topic

**Runtime**: Node.js 20.x with AWS SDK v3

## Resource Naming Convention

All resources include environmentSuffix for uniqueness:

```
{resource-type}-{environmentSuffix}
```

Examples:
- `config-bucket-dev`
- `compliance-notifications-prod`
- `compliance-processor-test`

## Cleanup

```bash
pulumi destroy --yes --stack dev
```

All resources are configured with `forceDestroy: true` to enable complete cleanup.

## Customization

### Add Custom Config Rules

Extend the stack to add custom managed or custom Config rules:

```typescript
const customRule = new aws.cfg.Rule(`custom-rule-${environmentSuffix}`, {
  name: `custom-rule-${environmentSuffix}`,
  source: {
    owner: "AWS",
    sourceIdentifier: "DESIRED_INSTANCE_TYPE"
  },
  inputParameters: JSON.stringify({
    instanceType: "t3.micro"
  })
});
```

### Configure Email Notifications

Subscribe to the SNS topic:

```bash
aws sns subscribe \
  --topic-arn $(pulumi stack output snsTopicArn) \
  --protocol email \
  --notification-endpoint your-email@example.com
```

### Adjust Approved AMI List

Modify the `approvedAmiIds` in `bin/tap.ts`:

```typescript
approvedAmiIds: [
  "ami-0c55b159cbfafe1f0",
  "ami-0abcdef1234567890",
  "ami-your-custom-ami"
]
```

## Best Practices

1. **Environment Isolation**: Use different environmentSuffix values for dev/test/prod
2. **AMI Management**: Keep approved AMI list updated with latest patched images
3. **Tag Standards**: Enforce tagging across organization for cost tracking
4. **Remediation Testing**: Test remediation actions in dev before enabling in prod
5. **Notification Channels**: Configure multiple notification channels (email, Slack)

## Monitoring

Monitor Config compliance through:
- AWS Config Dashboard
- SNS notifications
- CloudWatch Logs (Lambda function logs)
- Config aggregator for multi-region view

## Cost Optimization

- Config charges per configuration item recorded
- Remediation uses SSM automation (no additional cost)
- S3 storage with lifecycle policies to archive old snapshots
- Lambda invocations only on compliance changes

## Troubleshooting

### Config Recorder Not Starting

Verify IAM role has correct permissions and S3 bucket policy allows Config service.

### Remediation Not Working

Check remediation role permissions and SSM automation document availability.

### Lambda Function Errors

Review CloudWatch Logs for Lambda function:

```bash
aws logs tail /aws/lambda/compliance-processor-{environmentSuffix} --follow
```

## References

- [AWS Config Documentation](https://docs.aws.amazon.com/config/)
- [AWS Config Managed Rules](https://docs.aws.amazon.com/config/latest/developerguide/managed-rules-by-aws-config.html)
- [Pulumi AWS Provider](https://www.pulumi.com/docs/reference/pkg/aws/)
