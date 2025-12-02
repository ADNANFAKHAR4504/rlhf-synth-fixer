# AWS Infrastructure Compliance Scanner

This Pulumi program analyzes existing AWS infrastructure and identifies compliance violations.

## Features

1. **EC2 Instance Analysis**
   - Checks for unencrypted EBS volumes
   - Verifies IAM roles are attached to instances

2. **RDS Database Compliance**
   - Verifies encryption at rest is enabled
   - Checks automated backups with at least 7-day retention

3. **S3 Bucket Security**
   - Validates public access blocks
   - Checks versioning status
   - Verifies server-side encryption configuration

4. **VPC Flow Logs**
   - Ensures CloudWatch Logs are enabled
   - Validates retention periods of at least 30 days

5. **Compliance Reporting**
   - Generates JSON reports stored in S3
   - Categorizes findings by severity (CRITICAL, HIGH, MEDIUM, LOW)

6. **CloudWatch Monitoring**
   - Creates custom metrics for each compliance category
   - Provides pass/fail counts

7. **Resource Tagging**
   - Tags all analyzed resources with 'last-compliance-check' timestamp

8. **Dashboard**
   - Exports summary dashboard URL showing compliance status

## Prerequisites

- Pulumi CLI installed
- AWS credentials configured
- Node.js 18.x or later

## Deployment

1. Install dependencies:
   ```bash
   npm install
   ```

2. Configure the stack:
   ```bash
   pulumi config set environmentSuffix dev
   pulumi config set aws:region us-east-1
   ```

3. Deploy the stack:
   ```bash
   pulumi up
   ```

4. View the outputs:
   ```bash
   pulumi stack output
   ```

## Usage

The compliance scanner Lambda function runs automatically on a daily schedule. You can also invoke it manually:

```bash
aws lambda invoke --function-name compliance-scanner-dev response.json
```

## Outputs

- `complianceReportBucketName`: S3 bucket containing compliance reports
- `complianceScannerLambdaName`: Lambda function name
- `complianceScannerLambdaArn`: Lambda function ARN
- `complianceDashboardUrl`: CloudWatch dashboard URL
- `lambdaLogGroupName`: CloudWatch log group name

## Compliance Report Format

```json
{
  "timestamp": "2025-12-02T15:30:00.000Z",
  "summary": {
    "critical": 5,
    "high": 10,
    "medium": 15,
    "low": 2
  },
  "ec2": [...],
  "rds": [...],
  "s3": [...],
  "flowLogs": [...]
}
```

## Clean Up

To remove all resources:

```bash
pulumi destroy
```
