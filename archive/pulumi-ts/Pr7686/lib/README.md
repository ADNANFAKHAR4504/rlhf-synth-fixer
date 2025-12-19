# AWS Inspector v2 Security Assessment Infrastructure

Pulumi TypeScript implementation for automated security assessments using AWS Inspector v2.

## Overview

This infrastructure provides:
- Automated EC2 instance security scanning
- Real-time notifications for HIGH and CRITICAL findings
- Compliance reporting to S3
- CloudWatch Dashboard for security metrics
- Least privilege IAM roles

## Architecture

```
AWS Inspector v2 --> EventBridge --> Lambda --> SNS (Email)
                                        |
                                        +--> S3 (Compliance Reports)
                                        |
                                        +--> CloudWatch Logs

CloudWatch Dashboard <-- Metrics
```

## Requirements Implemented

1. Inspector v2 enabled for EC2 scanning
2. SNS topic for security findings
3. EventBridge rules for HIGH and CRITICAL severity
4. Email notifications to security@company.com
5. EC2 IAM infrastructure for Inspector tagging
6. Lambda function parsing and formatting findings
7. CloudWatch Dashboard with security metrics
8. Inspector assessments for tagged instances
9. IAM roles with least privilege
10. Organizations configuration for cross-account aggregation
11. S3 bucket for compliance reporting with encryption

## File Structure

```
lib/
├── lib/
│   ├── tap-stack.ts          # Main Pulumi stack (556 lines)
│   ├── PROMPT.md              # Requirements specification
│   ├── MODEL_RESPONSE.md      # Implementation summary
│   └── IDEAL_RESPONSE.md      # Quality checklist
├── test/
│   ├── tap-stack.unit.test.ts    # Unit tests (415 lines, 90%+ coverage)
│   └── tap-stack.int.test.ts     # Integration tests (411 lines)
├── bin/
│   └── tap.ts                 # Entry point
├── Pulumi.yaml                # Pulumi configuration
└── README.md                  # This file
```

## Deployment

### Prerequisites
- AWS credentials configured
- Pulumi CLI installed
- Node.js 18+ installed

### Steps

1. Set environment variables:
```bash
export ENVIRONMENT_SUFFIX=dev
export AWS_REGION=us-east-1
```

2. Install dependencies:
```bash
npm install
```

3. Deploy infrastructure:
```bash
pulumi up
```

4. Confirm SNS email subscription (check security@company.com inbox)

5. Create EC2 instances with the Inspector instance profile:
```bash
aws ec2 run-instances \
  --iam-instance-profile Name=inspector-ec2-profile-dev \
  --tag-specifications 'ResourceType=instance,Tags=[{Key=SecurityScan,Value=enabled}]'
```

## Testing

### Unit Tests
```bash
npm run test:unit
```

### Integration Tests (requires deployed stack)
```bash
npm run test:int
```

### All Tests
```bash
npm test
```

## Resource Naming

All resources include `environmentSuffix` for uniqueness:
- S3 Bucket: `inspector-compliance-{environmentSuffix}`
- SNS Topic: `inspector-findings-topic-{environmentSuffix}`
- Lambda: `inspector-findings-processor-{environmentSuffix}`
- Dashboard: `inspector-security-metrics-{environmentSuffix}`
- EventBridge Rule: `inspector-findings-rule-{environmentSuffix}`
- IAM Roles: `inspector-lambda-role-{environmentSuffix}`, `inspector-ec2-role-{environmentSuffix}`

## Configuration

### Custom Email
```typescript
new TapStack('inspector-stack', {
  securityEmail: 'custom@example.com'
});
```

### Custom Log Retention
```typescript
new TapStack('inspector-stack', {
  logRetentionDays: 14  // Default: 7
});
```

### Custom Tags
```typescript
new TapStack('inspector-stack', {
  tags: {
    Environment: 'production',
    Team: 'security',
    CostCenter: '12345'
  }
});
```

## Security Features

- S3 bucket encrypted with AES256
- Public access blocked on S3
- IAM policies follow least privilege
- SNS email requires manual confirmation
- Lambda uses AWS SDK v3
- CloudWatch Logs for audit trail

## Cost Optimization

- Lambda: Pay per finding (minimal cost)
- CloudWatch Logs: 7-day retention
- S3: Standard storage
- Inspector v2: Regional, EC2 only
- No NAT Gateways or expensive resources

## Compliance

- All findings stored in S3 with timestamps
- S3 versioning enabled for immutability
- CloudWatch Dashboard provides visibility
- Email notifications for immediate response
- Complete audit trail in CloudWatch Logs

## Monitoring

CloudWatch Dashboard includes:
1. Lambda invocations (findings processed)
2. Lambda errors and duration
3. Finding counts by severity (from logs)
4. SNS notifications sent

Access dashboard:
```bash
aws cloudwatch get-dashboard \
  --dashboard-name inspector-security-metrics-dev
```

## Cleanup

To destroy all resources:
```bash
pulumi destroy
```

All resources are fully destroyable (no retention policies).

## Troubleshooting

### Lambda not receiving events
- Check EventBridge rule is enabled
- Verify Lambda has correct permissions
- Check CloudWatch Logs for Lambda errors

### Email not received
- Confirm SNS subscription (check spam folder)
- Verify SNS topic has email subscription
- Check Lambda logs for SNS publish errors

### S3 reports not created
- Verify Lambda has S3 write permissions
- Check compliance bucket exists
- Review Lambda CloudWatch Logs

## Support

For issues or questions, review:
- `lib/PROMPT.md` - Requirements specification
- `lib/MODEL_RESPONSE.md` - Implementation details
- `lib/IDEAL_RESPONSE.md` - Quality checklist
- CloudWatch Logs for Lambda function

## License

This infrastructure code is part of the TAP (Test Automation Platform) project.
