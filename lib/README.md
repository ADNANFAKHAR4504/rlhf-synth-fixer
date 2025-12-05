# Automated Compliance Auditing System

A comprehensive AWS Config-based compliance auditing system built with AWS CDK 2.x and TypeScript. This solution continuously monitors AWS resources against compliance policies and sends real-time alerts for violations.

## Overview

This infrastructure deploys a complete compliance monitoring system for financial services that includes:

- **AWS Config**: Configuration recorder and delivery channel for tracking all resource changes
- **Custom Config Rules**: Three Lambda-based rules for EC2 AMI, S3 encryption, and RDS backup compliance
- **S3 Storage**: Versioned bucket with lifecycle policies for 7-year compliance data retention
- **SNS Notifications**: Real-time alerts for compliance violations
- **Parameter Store**: Centralized management of compliance thresholds
- **Cross-Region Aggregation**: Config aggregator for multi-region visibility
- **CloudWatch Logs**: 30-day retention for Lambda function logs
- **Comprehensive Tagging**: CostCenter and ComplianceLevel tags on all resources

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     AWS Config Recorder                      │
│              (Tracks all resource changes)                   │
└───────────────────┬─────────────────────────────────────────┘
                    │
                    ├──> S3 Bucket (7-year retention)
                    │
                    ├──> Config Rules (3 custom Lambda rules)
                    │    │
                    │    ├──> AMI Check Lambda
                    │    ├──> S3 Encryption Lambda
                    │    └──> RDS Backup Lambda
                    │         │
                    │         ├──> Parameter Store (thresholds)
                    │         └──> SNS Topic (alerts)
                    │
                    └──> Config Aggregator (cross-region)
```

## Prerequisites

- **AWS CLI**: Configured with appropriate credentials
- **Node.js**: Version 18+ installed
- **AWS CDK CLI**: `npm install -g aws-cdk`
- **Python**: Version 3.9+ for Lambda functions
- **AWS Account**: With permissions to create Config, Lambda, S3, SNS, IAM resources

## Installation

1. Clone the repository and navigate to the project directory

2. Install dependencies:
   ```bash
   npm install
   ```

3. Configure AWS credentials:
   ```bash
   aws configure
   ```

4. Bootstrap CDK (if not already done):
   ```bash
   cdk bootstrap
   ```

## Deployment

### Basic Deployment

Deploy with default environment suffix (dev):

```bash
cdk deploy
```

### Deploy with Custom Environment Suffix

```bash
cdk deploy --context environmentSuffix=prod
```

### Synthesize CloudFormation Template

```bash
cdk synth
```

### Deploy to Specific Account/Region

```bash
cdk deploy \
  --context environmentSuffix=prod \
  --profile production \
  --region us-east-1
```

## Configuration

### Update Approved AMIs

The system checks EC2 instances against a list of approved AMIs stored in Parameter Store:

```bash
aws ssm put-parameter \
  --name /compliance/dev/approved-amis \
  --value "ami-12345678,ami-87654321,ami-abcdefgh" \
  --overwrite
```

### Update Minimum Backup Retention

Change the minimum required backup retention for RDS instances:

```bash
aws ssm put-parameter \
  --name /compliance/dev/min-backup-retention-days \
  --value "14" \
  --overwrite
```

### Update SNS Email Subscription

To change the email address for compliance alerts:

1. Locate the SNS topic ARN in stack outputs
2. Add new subscription:
   ```bash
   aws sns subscribe \
     --topic-arn arn:aws:sns:us-east-1:123456789012:compliance-alerts-dev \
     --protocol email \
     --notification-endpoint your-team@example.com
   ```
3. Confirm the subscription via email

## Compliance Rules

### 1. EC2 AMI Compliance

**Purpose**: Ensures EC2 instances use approved AMIs

**Configuration**:
- Approved AMIs stored in Parameter Store: `/compliance/{env}/approved-amis`
- Evaluation trigger: Instance creation/modification + every 24 hours
- Resource type: AWS::EC2::Instance

**Compliance Criteria**:
- COMPLIANT: Instance uses an AMI from the approved list
- NON_COMPLIANT: Instance uses an unapproved AMI

### 2. S3 Bucket Encryption

**Purpose**: Ensures all S3 buckets have encryption enabled

**Configuration**:
- Evaluation trigger: Bucket creation/modification + every 24 hours
- Resource type: AWS::S3::Bucket

**Compliance Criteria**:
- COMPLIANT: Bucket has server-side encryption enabled (any type)
- NON_COMPLIANT: Bucket does not have encryption enabled

### 3. RDS Backup Retention

**Purpose**: Ensures RDS instances meet minimum backup retention requirements

**Configuration**:
- Minimum retention stored in Parameter Store: `/compliance/{env}/min-backup-retention-days`
- Evaluation trigger: Instance creation/modification + every 24 hours
- Resource type: AWS::RDS::DBInstance

**Compliance Criteria**:
- COMPLIANT: Backup retention >= minimum required days
- NON_COMPLIANT: Backup retention < minimum required days

## Verification

### Check Config Recorder Status

```bash
aws configservice describe-configuration-recorder-status
```

Expected output:
```json
{
  "ConfigurationRecordersStatus": [
    {
      "name": "config-recorder-dev",
      "recording": true,
      "lastStatus": "SUCCESS"
    }
  ]
}
```

### List Config Rules

```bash
aws configservice describe-config-rules \
  --query 'ConfigRules[*].[ConfigRuleName,ConfigRuleState]' \
  --output table
```

### View Compliance Status

```bash
aws configservice describe-compliance-by-config-rule
```

### Check SNS Topic Subscriptions

```bash
aws sns list-subscriptions
```

### View Lambda Function Logs

```bash
aws logs tail /aws/lambda/config-ami-check-dev --follow
```

## Testing

### Run Integration Tests

The solution includes comprehensive integration tests that verify all components:

```bash
# Install test dependencies (if not already done)
npm install

# Run tests
npm test

# Run tests with specific environment
ENVIRONMENT_SUFFIX=dev npm test

# Run tests with coverage
npm run test:coverage
```

### Test Coverage

The integration tests cover:
- S3 bucket configuration (versioning, encryption, lifecycle, public access)
- AWS Config recorder and delivery channel
- All three Config Rules
- Lambda functions (existence, runtime, environment variables)
- SNS topic and subscriptions
- Parameter Store parameters
- Resource tagging
- End-to-end integration

Expected coverage: 100%

### Manual Testing

1. **Test AMI Compliance Rule**:
   ```bash
   # Launch an EC2 instance with unapproved AMI
   aws ec2 run-instances \
     --image-id ami-unapproved \
     --instance-type t2.micro \
     --count 1

   # Wait for Config evaluation (up to 24 hours or immediately on change)
   # Check for SNS notification
   ```

2. **Test S3 Encryption Rule**:
   ```bash
   # Create unencrypted bucket
   aws s3 mb s3://test-unencrypted-bucket-123456

   # Wait for Config evaluation
   # Check compliance status
   aws configservice get-compliance-details-by-config-rule \
     --config-rule-name s3-bucket-encryption-dev
   ```

3. **Test RDS Backup Rule**:
   ```bash
   # Create RDS instance with insufficient backup retention
   aws rds create-db-instance \
     --db-instance-identifier test-db \
     --db-instance-class db.t3.micro \
     --engine mysql \
     --backup-retention-period 1

   # Wait for Config evaluation
   # Check for compliance violation
   ```

## Monitoring

### CloudWatch Dashboards

Create a custom dashboard to monitor compliance:

```bash
aws cloudwatch put-dashboard \
  --dashboard-name ComplianceMonitoring \
  --dashboard-body file://dashboard.json
```

### CloudWatch Alarms

Set up alarms for Lambda function errors:

```bash
aws cloudwatch put-metric-alarm \
  --alarm-name config-lambda-errors \
  --alarm-description "Alert on Lambda function errors" \
  --metric-name Errors \
  --namespace AWS/Lambda \
  --statistic Sum \
  --period 300 \
  --threshold 1 \
  --comparison-operator GreaterThanThreshold
```

### View Compliance Reports

Access the AWS Config console to view:
- Compliance timeline
- Resource inventory
- Configuration history
- Compliance by resource type

## Troubleshooting

### Config Recorder Not Recording

1. Check recorder status:
   ```bash
   aws configservice describe-configuration-recorder-status
   ```

2. Verify IAM role permissions:
   ```bash
   aws iam get-role --role-name config-role-dev
   ```

3. Start recorder if stopped:
   ```bash
   aws configservice start-configuration-recorder \
     --configuration-recorder-name config-recorder-dev
   ```

### Lambda Function Errors

1. View CloudWatch Logs:
   ```bash
   aws logs tail /aws/lambda/config-ami-check-dev --follow
   ```

2. Check Lambda function configuration:
   ```bash
   aws lambda get-function --function-name config-ami-check-dev
   ```

3. Verify environment variables are set correctly

### SNS Notifications Not Received

1. Check email subscription status:
   ```bash
   aws sns list-subscriptions-by-topic \
     --topic-arn <topic-arn>
   ```

2. Confirm email subscription (check spam folder)

3. Verify Lambda has permission to publish to SNS:
   ```bash
   aws lambda get-policy --function-name config-ami-check-dev
   ```

### Config Rule Not Evaluating

1. Check rule status:
   ```bash
   aws configservice describe-config-rule-evaluation-status
   ```

2. Manually trigger evaluation:
   ```bash
   aws configservice start-config-rules-evaluation \
     --config-rule-names ec2-approved-ami-dev
   ```

## Cost Optimization

### Estimated Monthly Costs

Based on moderate usage (1000 resources, 10 evaluations/day):

- **AWS Config**: $2.00 (recorder) + $0.10 (rules) = $2.10
- **S3 Storage**: $0.023/GB (first year) + Glacier archiving
- **Lambda**: $0.20 (with free tier)
- **SNS**: $0.50 (email notifications)
- **CloudWatch Logs**: $0.50 (30-day retention)
- **Parameter Store**: Free (Standard tier)

**Total Estimated Cost**: ~$3.50/month

### Cost Reduction Tips

1. **Reduce Config evaluation frequency**: Change from 24 hours to less frequent
2. **Adjust S3 lifecycle policies**: Archive earlier than 90 days
3. **Limit CloudWatch Logs retention**: Reduce from 30 days to 7 days
4. **Use AWS Config Rules wisely**: Only enable rules for critical resources

## Security Considerations

### IAM Least Privilege

All IAM roles use least privilege:
- Config role: Only has permissions to write to S3 and read configurations
- Lambda role: Limited to Config, SSM, SNS, and specific resource descriptions
- Aggregator role: Read-only Config permissions

### Data Encryption

- **S3 bucket**: Encrypted with S3-managed keys (SSE-S3)
- **Parameter Store**: Encrypted at rest
- **Lambda environment variables**: Encrypted by default
- **SNS messages**: In-transit encryption

### Network Security

- S3 bucket has public access blocked
- Lambda functions can be deployed in VPC (optional)
- Config data stored in private S3 bucket

## Compliance and Auditing

### Data Retention

- **Config data**: Retained in S3 for 7 years
- **CloudWatch Logs**: Retained for 30 days
- **Config snapshots**: Automatically archived after 90 days

### Audit Trail

All compliance evaluations are logged and available through:
- AWS Config timeline
- CloudWatch Logs
- S3 archived data

### Reporting

Generate compliance reports using:
- AWS Config dashboard
- AWS Config API queries
- Custom scripts using CloudWatch Insights

## Cleanup

### Destroy All Resources

```bash
# Delete all resources created by the stack
cdk destroy --context environmentSuffix=dev

# Confirm deletion when prompted
```

### Manual Cleanup (if needed)

If `cdk destroy` fails:

1. Empty S3 bucket:
   ```bash
   aws s3 rm s3://compliance-config-dev --recursive
   ```

2. Delete Config recorder:
   ```bash
   aws configservice stop-configuration-recorder \
     --configuration-recorder-name config-recorder-dev
   aws configservice delete-configuration-recorder \
     --configuration-recorder-name config-recorder-dev
   ```

3. Delete Config rules:
   ```bash
   aws configservice delete-config-rule \
     --config-rule-name ec2-approved-ami-dev
   ```

4. Run `cdk destroy` again

## Support and Contribution

### Getting Help

- Review CloudWatch Logs for error messages
- Check AWS Config console for rule evaluation status
- Verify IAM permissions for all resources

### Best Practices

1. **Test in non-production first**: Deploy to dev/staging before production
2. **Monitor costs**: Use AWS Cost Explorer to track spending
3. **Regular updates**: Keep CDK and dependencies up to date
4. **Backup configurations**: Store Parameter Store values externally
5. **Document changes**: Track modifications to compliance thresholds

## License

This solution is provided as-is for use in AWS environments. Modify as needed for your specific compliance requirements.

## Additional Resources

- [AWS Config Documentation](https://docs.aws.amazon.com/config/)
- [AWS CDK Documentation](https://docs.aws.amazon.com/cdk/)
- [AWS Config Rules](https://docs.aws.amazon.com/config/latest/developerguide/evaluate-config.html)
- [Lambda Custom Config Rules](https://docs.aws.amazon.com/config/latest/developerguide/evaluate-config_develop-rules_lambda-functions.html)
