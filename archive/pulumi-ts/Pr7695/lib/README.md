# AWS Infrastructure Compliance Scanner

A comprehensive compliance analysis tool built with Pulumi and TypeScript that scans AWS infrastructure and generates detailed compliance reports.

## Features

- **EC2 Instance Tag Compliance**: Validates required tags (Environment, Owner, CostCenter)
- **S3 Bucket Security**: Checks encryption and versioning
- **Deprecated Instance Types**: Identifies t2.micro and t2.small instances
- **Security Group Rules**: Validates SSH/RDP access restrictions
- **CloudWatch Logs Retention**: Ensures 30+ day retention policies
- **IAM MFA Enforcement**: Checks MFA for console users
- **CloudWatch Metrics**: Publishes compliance scores
- **JSON Reports**: Detailed violation reports with remediation guidance

## Installation

```bash
npm install
```

## Required IAM Permissions

The scanner requires read-only AWS permissions:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "ec2:DescribeInstances",
        "ec2:DescribeSecurityGroups",
        "s3:ListAllMyBuckets",
        "s3:GetBucketEncryption",
        "s3:GetBucketVersioning",
        "iam:ListUsers",
        "iam:ListMFADevices",
        "iam:GetLoginProfile",
        "logs:DescribeLogGroups",
        "cloudwatch:PutMetricData"
      ],
      "Resource": "*"
    }
  ]
}
```

## Usage

### Basic Usage

```bash
# Set environment variables
export ENVIRONMENT_SUFFIX=dev
export AWS_REGION=us-east-1

# Run compliance scan
npm run scan
```

### With Pulumi

```bash
# Set Pulumi config
pulumi config set environmentSuffix dev
pulumi config set region us-east-1

# Run scan
npm run scan
```

### Dry Run Mode

```bash
# Skip CloudWatch metric publishing
pulumi config set dryRun true
npm run scan
```

## Output

The scanner generates:

1. **Console Output**: Real-time progress and summary
2. **JSON Report**: `compliance-report-{env}-{date}.json`
3. **CloudWatch Metrics**: Published to `Compliance/{environmentSuffix}` namespace

### Sample Report Structure

```json
{
  "scanDate": "2025-12-02T00:00:00.000Z",
  "environmentSuffix": "dev",
  "region": "us-east-1",
  "summary": {
    "totalResources": 50,
    "compliantResources": 35,
    "nonCompliantResources": 15,
    "complianceScore": 85.5
  },
  "violations": {
    "ec2TagCompliance": [...],
    "s3Security": [...],
    "deprecatedInstances": [...],
    "securityGroups": [...],
    "cloudWatchLogs": [...],
    "iamMfa": [...]
  },
  "metrics": {
    "ec2ComplianceScore": 90.0,
    "s3ComplianceScore": 80.0,
    "iamComplianceScore": 85.0,
    "networkComplianceScore": 95.0,
    "overallComplianceScore": 87.5
  }
}
```

## Environment Variables

- `ENVIRONMENT_SUFFIX`: Environment identifier (default: "dev")
- `AWS_REGION`: Target AWS region (default: "us-east-1")
- `AWS_ACCESS_KEY_ID`: AWS credentials (if not using IAM role)
- `AWS_SECRET_ACCESS_KEY`: AWS credentials (if not using IAM role)

## Testing

```bash
npm test
```

## Architecture

The scanner uses:
- **AWS SDK v3**: For resource scanning and metric publishing
- **Pulumi**: For configuration management
- **TypeScript**: Type-safe implementation
- **CloudWatch**: For compliance metrics and monitoring

## Performance

- Scans 100+ resources in under 5 minutes
- Handles API pagination automatically
- Implements exponential backoff for rate limiting
- Graceful error handling for missing permissions
