# AWS Infrastructure Compliance Scanner

A Pulumi TypeScript application that scans existing AWS infrastructure and generates compliance reports.

## Features

- **EBS Encryption Check**: Identifies unencrypted EBS volumes
- **Security Group Analysis**: Detects unrestricted inbound rules on sensitive ports
- **Tag Compliance**: Verifies required tags (Environment, Owner, CostCenter)
- **AMI Approval**: Validates instances use approved AMIs
- **SSM Agent Status**: Checks SSM agent connectivity
- **VPC Flow Logs**: Ensures flow logs are enabled
- **Automated Reports**: Generates JSON reports stored in S3
- **CloudWatch Metrics**: Exports compliance metrics for monitoring

## Prerequisites

- Node.js 18+
- Pulumi CLI
- AWS credentials configured
- AWS account with resources to scan

## Configuration

Create a `Pulumi.dev.yaml` configuration file:

```yaml
config:
  tap:environmentSuffix: "dev-12345"
  tap:awsRegion: "us-east-1"
  tap:approvedAmis:
    - "ami-0c55b159cbfafe1f0"
    - "ami-0574da719dca65348"
```

## Deployment

```bash
# Install dependencies
npm install

# Deploy the stack
pulumi up

# The scanner will run daily automatically via EventBridge
```

## Manual Scan

Invoke the Lambda function manually:

```bash
aws lambda invoke \
  --function-name compliance-scanner-<environmentSuffix> \
  --region us-east-1 \
  output.json
```

## Report Format

Reports are stored in S3 as JSON:

```json
{
  "scanTimestamp": "2025-12-03T18:30:00Z",
  "region": "us-east-1",
  "environmentSuffix": "dev-12345",
  "summary": {
    "totalResourcesScanned": 50,
    "totalViolations": 12,
    "violationsByType": {
      "UnencryptedEBSVolume": 3,
      "UnrestrictedInboundRule": 5,
      "MissingRequiredTags": 4
    },
    "complianceRate": 76.0
  },
  "violations": [...]
}
```

## CloudWatch Metrics

View metrics in CloudWatch under namespace: `ComplianceScanner/<environmentSuffix>`

- `TotalResourcesScanned`
- `TotalViolations`
- `ComplianceRate` (percentage)

## IAM Permissions

The Lambda function requires:
- EC2 read permissions (DescribeInstances, DescribeVolumes, etc.)
- SSM read permissions (DescribeInstanceInformation)
- CloudWatch write permissions (PutMetricData)
- S3 write permissions (PutObject)

## Cleanup

```bash
pulumi destroy
```

## Testing

```bash
npm test
```
