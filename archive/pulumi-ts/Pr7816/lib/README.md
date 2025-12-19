# AWS Config Compliance System

An automated compliance checking system built with **Pulumi and TypeScript** that monitors and enforces security policies using AWS Config.

## Overview

This infrastructure deploys a comprehensive compliance monitoring solution that:
- Continuously tracks AWS resource configurations
- Evaluates compliance against predefined rules
- Generates automated compliance reports
- Sends real-time notifications for policy violations
- Provides visualization through CloudWatch dashboards

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                    AWS Config Compliance System                  │
└─────────────────────────────────────────────────────────────────┘
                              │
        ┌─────────────────────┼─────────────────────┐
        │                     │                     │
   ┌────▼────┐          ┌────▼────┐          ┌────▼────┐
   │  AWS    │          │ Lambda  │          │CloudWatch│
   │ Config  │          │Reporter │          │Dashboard│
   └────┬────┘          └────┬────┘          └─────────┘
        │                    │
   ┌────▼────┐          ┌────▼────┐
   │   S3    │          │  SNS    │
   │ Storage │          │ Alerts  │
   └─────────┘          └─────────┘
```

## Components

### AWS Config
- **Configuration Recorder**: Tracks changes to all supported AWS resources
- **Delivery Channel**: Sends configuration snapshots to S3
- **Config Rules**:
  - S3 bucket encryption enforcement
  - EC2 instance required tags validation

### Storage
- **S3 Bucket**: Stores Config snapshots and compliance reports
  - Versioning enabled
  - Server-side encryption (AES256)
  - Lifecycle policy (90 days → Glacier)

### Compliance Reporting
- **Lambda Function**: Python 3.11 runtime
  - Aggregates compliance findings
  - Generates JSON reports
  - Calculates compliance scores
  - Provides actionable recommendations
  - Runs daily via EventBridge schedule

### Notifications
- **SNS Topic**: Sends email alerts for compliance violations
- **CloudWatch Dashboard**: Real-time compliance metrics visualization

### Security
- **IAM Roles**: Least privilege permissions
  - Config role with AWS_ConfigRole managed policy
  - Lambda role with basic execution and Config/S3/SNS access

## Prerequisites

- Node.js 18+ and npm
- Pulumi CLI installed
- AWS credentials configured
- AWS account with appropriate permissions

## Installation

1. Clone the repository and navigate to the project directory

2. Install dependencies:
```bash
npm install
```

3. Configure environment:
```bash
export AWS_REGION=us-east-1
export ENVIRONMENT_SUFFIX=<your-unique-suffix>
```

## Deployment

### Initial Setup

```bash
# Initialize Pulumi (if not already done)
pulumi stack init dev

# Set configuration
pulumi config set aws:region us-east-1
```

### Deploy Infrastructure

```bash
# Preview changes
pulumi preview

# Deploy
pulumi up

# View outputs
pulumi stack output
```

### Expected Outputs

After successful deployment, you'll see:
```
Outputs:
  bucketArn            : "arn:aws:s3:::config-bucket-<suffix>"
  configRecorderName   : "config-recorder-<suffix>"
  dashboardName        : "compliance-metrics-<suffix>"
  lambdaFunctionName   : "compliance-reporter-<suffix>"
  snsTopicArn          : "arn:aws:sns:us-east-1:...:compliance-notifications-<suffix>"
```

## Usage

### Manual Compliance Check

Invoke the Lambda function manually:
```bash
aws lambda invoke \
  --function-name compliance-reporter-<suffix> \
  --region us-east-1 \
  response.json

cat response.json
```

### View Reports

Reports are stored in S3:
```bash
aws s3 ls s3://config-bucket-<suffix>/compliance-reports/<suffix>/
aws s3 cp s3://config-bucket-<suffix>/compliance-reports/<suffix>/<timestamp>.json -
```

### View Dashboard

1. Open CloudWatch Console
2. Navigate to Dashboards
3. Open `compliance-metrics-<suffix>`

### Subscribe to Notifications

Subscribe an email to the SNS topic:
```bash
aws sns subscribe \
  --topic-arn <sns-topic-arn> \
  --protocol email \
  --notification-endpoint your-email@example.com
```

## Testing

### Run Unit Tests

```bash
npm test
```

### Run Integration Tests

Integration tests require deployed infrastructure:
```bash
export ENVIRONMENT_SUFFIX=<your-suffix>
export AWS_REGION=us-east-1
npm run test:integration
```

## Configuration

### Environment Variables

- `ENVIRONMENT_SUFFIX`: Unique suffix for resource names (required)
- `AWS_REGION`: AWS region for deployment (default: us-east-1)
- `REPOSITORY`: Repository name for tagging
- `COMMIT_AUTHOR`: Author for tagging
- `PR_NUMBER`: PR number for tagging
- `TEAM`: Team name for tagging

### Customization

Modify `lib/lib/config.ts` to adjust:
- Required EC2 tags
- S3 lifecycle transition days
- Lambda timeout
- Report generation schedule

## Compliance Rules

### S3 Bucket Encryption

**Rule**: S3_BUCKET_SERVER_SIDE_ENCRYPTION_ENABLED

Ensures all S3 buckets have server-side encryption enabled.

**Remediation**: Enable encryption on non-compliant buckets.

### EC2 Required Tags

**Rule**: REQUIRED_TAGS

Verifies EC2 instances have the following tags:
- Environment
- Owner
- CostCenter

**Remediation**: Add missing tags to EC2 instances.

## Monitoring

### CloudWatch Dashboard Widgets

1. **Overall Compliance Score**: Percentage of compliant resources
2. **Compliance Reporter Activity**: Lambda invocations and errors
3. **Recent Compliance Checks**: Log insights from Lambda executions
4. **Compliance Resource Count**: Number of compliant vs non-compliant resources

### Alerts

SNS notifications are sent when:
- Non-compliant resources are detected
- Compliance score drops below threshold
- Critical configuration changes occur

## Troubleshooting

### Config Recorder Fails to Start

**Issue**: Config recorder already exists in the region

**Solution**: AWS Config allows only one recorder per region. Use a different region or delete the existing recorder.

### Lambda Function Errors

**Issue**: Lambda times out or fails

**Solution**:
- Check CloudWatch Logs: `/aws/lambda/compliance-reporter-<suffix>`
- Verify IAM permissions
- Ensure Config recorder is running

### S3 Access Denied

**Issue**: Config cannot write to S3 bucket

**Solution**: Verify bucket policy allows Config service access

### No Compliance Data

**Issue**: Config rules show no evaluations

**Solution**:
- Wait 10-15 minutes after deployment for initial evaluation
- Ensure Config recorder is enabled and recording
- Check that resources exist to evaluate

## Cost Optimization

This solution uses serverless components to minimize costs:
- Lambda: Pay per invocation (daily = ~$0.01/month)
- S3: Storage costs with Glacier transition after 90 days
- Config: $0.003 per configuration item recorded
- SNS: $0.50 per million notifications

**Estimated Monthly Cost**: $2-10 depending on resource count

## Cleanup

### Destroy Infrastructure

```bash
# Remove all resources
pulumi destroy

# Confirm deletion
yes
```

**Note**: S3 bucket has `forceDestroy: true` enabled, so all objects will be deleted automatically.

### Manual Cleanup (if needed)

If Pulumi destroy fails:
```bash
# Delete Config recorder
aws configservice stop-configuration-recorder --configuration-recorder-name config-recorder-<suffix>
aws configservice delete-configuration-recorder --configuration-recorder-name config-recorder-<suffix>

# Delete delivery channel
aws configservice delete-delivery-channel --delivery-channel-name config-delivery-<suffix>

# Empty and delete S3 bucket
aws s3 rm s3://config-bucket-<suffix> --recursive
aws s3 rb s3://config-bucket-<suffix>
```

## Security Best Practices

1. **IAM Roles**: Uses managed policies and least privilege
2. **Encryption**: S3 buckets encrypted at rest
3. **Access Control**: Bucket policies restrict access to Config service
4. **Audit Trail**: Config tracks all resource changes
5. **Notifications**: Real-time alerts for violations

## Limitations

- One Config recorder per region per account
- Config rules evaluate existing resources only
- Lambda function limited to 300-second execution
- S3 lifecycle transition minimum of 30 days

## Support

For issues or questions:
1. Check CloudWatch Logs for Lambda errors
2. Review Config rule compliance in AWS Console
3. Verify IAM permissions
4. Consult AWS Config documentation

## License

MIT License - See LICENSE file for details

## Contributing

Contributions welcome! Please:
1. Fork the repository
2. Create a feature branch
3. Add tests for new functionality
4. Submit a pull request

## References

- [AWS Config Documentation](https://docs.aws.amazon.com/config/)
- [Pulumi AWS Provider](https://www.pulumi.com/registry/packages/aws/)
- [AWS Config Rules](https://docs.aws.amazon.com/config/latest/developerguide/managed-rules-by-aws-config.html)
