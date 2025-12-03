# AWS Infrastructure Compliance Analyzer

Automated compliance scanning system for AWS infrastructure using Pulumi and Lambda.

## Overview

This system performs automated compliance checks on AWS resources:
- EC2 instances (tagging compliance)
- Security groups (overly permissive rules)
- S3 buckets (encryption and public access)
- IAM access keys (age verification)
- EBS volumes (unattached volumes)
- VPC flow logs (logging enabled)

## Architecture

- **Lambda Functions**: Execute compliance checks
- **DynamoDB**: Store compliance findings
- **S3**: Store detailed reports
- **EventBridge**: Schedule daily scans
- **CloudWatch**: Logging and monitoring

## Deployment

### Prerequisites

- Node.js 18+ and npm
- Pulumi CLI
- AWS credentials configured

### Deploy Infrastructure

```bash
# Install dependencies
npm install

# Set environment suffix
export ENVIRONMENT_SUFFIX=dev

# Deploy with Pulumi
pulumi up
```

### Manual Trigger

```bash
# Invoke Lambda function manually
aws lambda invoke \
  --function-name compliance-scanner-dev \
  --payload '{}' \
  response.json
```

## Configuration

Environment variables:
- `ENVIRONMENT_SUFFIX`: Environment identifier (default: dev)
- `AWS_REGION`: Target region (default: us-east-1)

## Testing

```bash
# Run unit tests
npm test

# Run integration tests
npm run test:integration
```

## Compliance Scoring

- Critical violations: -10 points
- High violations: -5 points
- Medium violations: -2 points
- Low violations: -1 point

Starting score: 100
Minimum score: 0

## Reports

Reports are stored in S3 at:
```
s3://compliance-reports-{environmentSuffix}/compliance-reports/{scanId}.json
```

## Troubleshooting

Check CloudWatch Logs:
```bash
aws logs tail /aws/lambda/compliance-scanner-dev --follow
```
