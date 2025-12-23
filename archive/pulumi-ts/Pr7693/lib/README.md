# Infrastructure Compliance Scanner

A Pulumi TypeScript program that scans AWS infrastructure for tagging compliance.

## Features

- Scans EC2 instances, RDS databases, and S3 buckets
- Checks for mandatory tags: Environment, Owner, CostCenter, Project
- Generates compliance reports with percentages
- Flags resources running >90 days without proper tags
- Groups non-compliant resources by service
- Exports reports to S3 with timestamps
- Scheduled daily scanning via EventBridge

## Deployment

1. Set configuration:
```bash
pulumi config set environmentSuffix <your-suffix>
pulumi config set region us-east-1  # optional
```

2. Deploy:
```bash
pulumi up
```

3. Invoke scanner manually:
```bash
aws lambda invoke --function-name compliance-scanner-<suffix> output.json
cat output.json
```

## Report Format

Reports include:
- Summary with compliance percentages by service
- Detailed resource lists (compliant/non-compliant)
- Missing tags for each resource
- Resource age and creation dates
- Flagged resources (>90 days old)
- Actionable recommendations
- Grouped by service for remediation

## Testing

Run unit tests:
```bash
npm test
```

## Required IAM Permissions

The scanner requires:
- ec2:DescribeInstances
- ec2:DescribeTags
- rds:DescribeDBInstances
- rds:DescribeDBClusters
- rds:ListTagsForResource
- s3:ListAllMyBuckets
- s3:GetBucketTagging
- s3:PutObject (for report storage)
