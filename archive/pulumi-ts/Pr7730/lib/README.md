# Infrastructure Compliance Analysis System

## Overview

This Pulumi TypeScript program analyzes deployed AWS infrastructure and validates compliance against security policies. It performs eight different compliance checks and generates reports with CloudWatch metrics and SNS notifications for critical violations.

## Features

1. **EC2 Tag Validation**: Verifies all instances have required tags (Environment, Owner, CostCenter)
2. **S3 Security Compliance**: Checks encryption and versioning configuration
3. **AMI Compliance**: Validates instances use approved AMI IDs
4. **Security Group Analysis**: Detects open SSH/RDP ports from 0.0.0.0/0
5. **IAM Role Validation**: Identifies wildcard permissions
6. **CloudWatch Metrics**: Publishes violation counts by type
7. **JSON Reports**: Exports detailed violation data
8. **SNS Alerts**: Sends notifications for critical violations

## Configuration

Set the following Pulumi config values:

```bash
pulumi config set aws:region us-east-1
pulumi config set tap:environmentSuffix dev123
pulumi config set tap:approvedAmiIds '["ami-0abcdef123456789", "ami-0987654321fedcba"]'
```

## Deployment

```bash
npm install
pulumi up
```

## Outputs

- `violationsReport`: JSON report of all violations
- `snsTopicArn`: SNS topic ARN for alerts
- `violationCount`: Total number of violations found

## Compliance Checks

### Critical Severity
- S3 buckets without encryption
- Security groups with open SSH (port 22) from 0.0.0.0/0
- Security groups with open RDP (port 3389) from 0.0.0.0/0

### High Severity
- EC2 instances using unapproved AMIs
- IAM roles with wildcard permissions

### Medium Severity
- EC2 instances missing required tags
- S3 buckets without versioning

## CloudWatch Metrics

Metrics are published to namespace: `ComplianceMonitoring-{environmentSuffix}`

Metric names:
- MissingRequiredTags
- EncryptionNotEnabled
- VersioningNotEnabled
- UnapprovedAMI
- OpenSSHPort
- OpenRDPPort
- WildcardPermissions
- TotalViolations

## Testing

```bash
npm test              # Run all tests
npm run test:unit     # Run unit tests only
npm run test:int      # Run integration tests only
```
