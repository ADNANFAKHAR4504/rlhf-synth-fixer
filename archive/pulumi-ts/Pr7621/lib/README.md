# Infrastructure Compliance Analyzer for EC2 Instances

A comprehensive, production-ready compliance monitoring system that automatically scans all EC2 instances every 6 hours using Pulumi with TypeScript.

## Overview

Automated compliance validation for EC2 instances with:
- EBS volume encryption validation
- AMI whitelisting enforcement
- Required tag enforcement (Owner, Environment, CostCenter)
- SNS alerts for violations
- S3 exports for long-term retention
- CloudWatch Dashboard for real-time metrics
- Structured JSON logging

## Architecture

1. Lambda Function: Scans EC2 instances and validates compliance
2. EventBridge Rule: Triggers Lambda every 6 hours
3. IAM Role: Least-privilege permissions
4. CloudWatch Logs: Structured JSON logging (7-day retention)
5. SNS Topic: Email notifications for violations
6. S3 Bucket: Long-term compliance report storage
7. CloudWatch Dashboard: Real-time metrics visualization

## Prerequisites

- Node.js 18.x or higher
- Pulumi CLI installed
- AWS credentials configured
- npm packages installed

## Deployment

```bash
# Set environment
export ENVIRONMENT_SUFFIX=dev
export AWS_REGION=us-east-1

# Deploy
pulumi up

# Subscribe to SNS alerts
aws sns subscribe \
  --topic-arn $(pulumi stack output snsTopic) \
  --protocol email \
  --notification-endpoint your-email@example.com
```

## Testing

```bash
# Unit tests
npm test

# Integration tests
npm run test:integration

# Manual Lambda invocation
aws lambda invoke \
  --function-name compliance-scanner-dev \
  --payload '{}' \
  response.json
```

## Monitoring

CloudWatch Dashboard displays:
- Lambda invocation metrics
- Recent compliance violations
- Violations by type
- Compliance status

S3 compliance reports location: s3://compliance-data-dev/compliance-reports/

## Configuration

Update Lambda environment variables in lib/tap-stack.ts:

- APPROVED_AMIS: Comma-separated list of approved AMI IDs
- REQUIRED_TAGS: Comma-separated list of required tags
- EventBridge schedule: Change rate(6 hours) to desired frequency

## Cleanup

```bash
pulumi destroy
```

## Cost Estimate

~$3-4/month for scanning 100 EC2 instances:
- Lambda: ~$1-2
- CloudWatch Logs: ~$1 (7-day retention)
- S3: ~$1 (with lifecycle policies)
- SNS: ~$0.10
- EventBridge: Free
