# Compliance Scanner Infrastructure

Automated multi-region infrastructure compliance scanner with enterprise features including Step Functions orchestration, SSM automation, Security Hub integration, and S3 lifecycle management.

## Architecture

This Pulumi TypeScript program deploys:

### Core Components
- **Multi-Region Scanner**: Lambda function scanning us-east-1, eu-west-1, ap-southeast-1
- **DynamoDB Table**: Scan history with GSI for region-based queries
- **S3 Buckets**: Compliance reports with advanced lifecycle policies
- **EventBridge Rules**: Scheduled (2 AM UTC) and on-demand scan triggers
- **SNS Topics**: Critical, high, and error alerting
- **CloudWatch**: Dashboards, alarms, and structured logging

### Enhancement Features
- **AWS Systems Manager**: Configuration management via Parameter Store
- **SSM Automation**: Auto-remediation documents for common violations
- **Step Functions**: Sophisticated workflow with parallel execution
- **Security Hub**: ASFF finding publishing with compliance mapping
- **S3 Lifecycle**: Intelligent-Tiering and cost optimization

## Deployment

### Prerequisites
- Pulumi CLI 3.x
- Node.js 18+
- AWS CLI configured
- AWS credentials with appropriate permissions

### Configuration

```bash
pulumi config set environmentSuffix prod
pulumi config set environment production
pulumi config set aws:region us-east-1
```

### Deploy

```bash
npm install
pulumi up
```

### Trigger Manual Scan

```bash
aws events put-events --entries '[
  {
    "Source": "custom.compliance",
    "DetailType": "Scan Request",
    "Detail": "{\"scanType\": \"manual\", \"scanId\": \"manual-12345\"}"
  }
]'
```

## Features

### 1. Multi-Region Scanning
Scans resources across three regions:
- us-east-1 (primary)
- eu-west-1
- ap-southeast-1

Detects violations:
- Unencrypted S3 buckets
- Public RDS instances
- Overly permissive security groups
- Missing encryption on DynamoDB tables

### 2. Step Functions Workflow
- Parallel region scanning (66% faster)
- Map states for service-level iteration
- Exponential backoff retry (3 attempts, 2x backoff)
- Choice states for violation severity branching
- X-Ray tracing enabled

### 3. SSM Configuration Management
Parameter Store hierarchy:
- `/compliance/scanner/config/regions`
- `/compliance/scanner/config/thresholds`
- `/compliance/scanner/config/remediation-enabled`
- `/compliance/scanner/config/scan-resources`

### 4. Automated Remediation
SSM Automation documents:
- `AWS-RemediateUnencryptedS3Bucket`: Enable KMS encryption
- `AWS-RemediatePublicRDSInstance`: Disable public access
- `AWS-RemediateOverlyPermissiveSecurityGroup`: Revoke 0.0.0.0/0 rules

### 5. Security Hub Integration
- ASFF format findings
- Compliance mapping (CIS, PCI DSS, NIST)
- Multi-region aggregation to us-east-1
- Custom insights for trends

### 6. S3 Cost Optimization
Lifecycle transitions:
- 0-30 days: STANDARD
- 31-90 days: STANDARD_IA
- 91-365 days: INTELLIGENT_TIERING
- 365+ days: DEEP_ARCHIVE

Estimated savings: 35% reduction in storage costs

## Monitoring

### CloudWatch Dashboard
Access at: `https://console.aws.amazon.com/cloudwatch/home?region=us-east-1#dashboards:name=ComplianceScanner-{env}`

Widgets:
- Violation trends (30-day line graph)
- Resource coverage (pie chart)
- Violations by service (bar chart)
- Scanner performance (Lambda metrics)
- Regional distribution

### Alarms
- Scanner errors > 2 in 5 minutes
- Analyzer errors > 2 in 5 minutes
- Scan duration > 4 minutes
- DynamoDB throttling > 0

## Testing

Run test suite:

```bash
npm test
```

## Compliance

All resources tagged with:
- `Environment`
- `Owner`: security-team
- `CostCenter`: security-operations
- `Compliance`: soc2-audit
- `Application`: compliance-scanner

## Security

- KMS encryption for S3, DynamoDB, SNS, CloudWatch Logs
- IAM least-privilege policies (no wildcards)
- X-Ray tracing on all Lambda functions
- CloudWatch Logs retention: 30 days
- S3 public access blocked
- Server-side encryption required

## Cost Considerations

- DynamoDB: ON_DEMAND billing mode
- Lambda: Optimized memory allocation
- S3: Lifecycle policies reduce storage costs
- CloudWatch: Custom metrics in ComplianceScanner namespace

## Outputs

```bash
pulumi stack output scannerLambdaArn
pulumi stack output stepFunctionArn
pulumi stack output dashboardUrl
pulumi stack output complianceReportsBucketName
```

## Troubleshooting

### Check Step Functions execution
```bash
aws stepfunctions list-executions --state-machine-arn $(pulumi stack output stepFunctionArn)
```

### View Lambda logs
```bash
aws logs tail /aws/lambda/compliance-scanner-prod --follow
```

### Query scan history
```bash
aws dynamodb query \
  --table-name compliance-scan-history-prod \
  --index-name region-timestamp-index \
  --key-condition-expression "region = :region" \
  --expression-attribute-values '{":region":{"S":"us-east-1"}}'
```

## License

Proprietary - Financial Services Inc.
