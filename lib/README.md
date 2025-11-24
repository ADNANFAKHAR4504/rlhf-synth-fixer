# AWS Compliance Auditing System

A comprehensive automated infrastructure compliance auditing system built with AWS CDK and Python. This solution provides continuous compliance monitoring, cross-account scanning, automated remediation, and detailed reporting for financial services regulatory requirements.

## Architecture

This implementation creates a multi-layer compliance infrastructure:

### Core Components

1. **AWS Config** - Configuration tracking and compliance rules
   - Custom rules for S3 encryption, VPC flow logs, and Lambda settings
   - Config aggregator for multi-account data collection
   - Automated compliance evaluation

2. **Lambda Functions** - Serverless compute for compliance operations
   - **Scanner Function**: Cross-account infrastructure scanning using AssumeRole
   - **Report Generator**: Creates JSON and CSV compliance reports
   - **Remediation Function**: Automatic fixing of specific violations

3. **EventBridge** - Event-driven orchestration
   - Scheduled scans every 6 hours
   - Custom event triggers for on-demand scans
   - Report generation triggers

4. **S3 Storage** - Audit data persistence
   - Versioned buckets with KMS encryption
   - 90-day lifecycle policy for audit reports
   - Separate buckets for audit reports and Config data

5. **SNS Alerting** - Real-time notifications
   - Critical compliance violations
   - Remediation status updates
   - Email subscriptions support

6. **CloudWatch Dashboard** - Metrics and monitoring
   - Lambda function performance
   - Compliance trend analysis
   - Alert statistics

7. **VPC Infrastructure** - Network isolation
   - Private subnets for Lambda execution
   - VPC endpoints for AWS service access
   - VPC flow logs with specific naming convention

## Features

### Compliance Monitoring
- Continuous evaluation of S3 bucket encryption
- VPC flow log configuration validation
- Lambda function security settings check
- Multi-account compliance aggregation

### Cross-Account Scanning
- AssumeRole-based authentication
- Scan multiple AWS accounts from single deployment
- Centralized compliance reporting

### Automated Remediation
- S3 encryption enablement
- Lambda X-Ray tracing activation
- Configurable remediation policies

### Reporting
- JSON format for detailed analysis
- CSV format for spreadsheet import
- 90-day retention with lifecycle policies
- Automated report generation after scans

### Alerting
- SNS topics for critical violations
- Email subscription support
- Remediation status notifications

## Deployment

### Prerequisites

- AWS CDK CLI: `npm install -g aws-cdk`
- Python 3.9+
- AWS CLI configured with appropriate credentials
- Required Python packages (installed via requirements.txt)

### Installation

```bash
# Install dependencies
pip install -r requirements.txt

# Bootstrap CDK (first time only)
cdk bootstrap

# Synthesize CloudFormation template
cdk synth --context environmentSuffix=dev

# Deploy the stack
cdk deploy --context environmentSuffix=dev
```

### Environment Configuration

The `environmentSuffix` context variable is used for resource naming:

```bash
# Development
cdk deploy --context environmentSuffix=dev

# Staging
cdk deploy --context environmentSuffix=staging

# Production
cdk deploy --context environmentSuffix=prod
```

## Resource Naming

All resources include the environment suffix for uniqueness:
- S3 Buckets: `compliance-audit-reports-{environmentSuffix}`
- Lambda Functions: `compliance-scanner-{environmentSuffix}`
- SNS Topics: `compliance-critical-alerts-{environmentSuffix}`
- Config Rules: `s3-bucket-encryption-check-{environmentSuffix}`

## Configuration

### Mandatory Tags

All resources are tagged with:
- `Environment`: Environment identifier
- `Owner`: compliance-team
- `CostCenter`: security-ops
- `ComplianceLevel`: high

### Cross-Account Access

To enable cross-account scanning:

1. Create IAM role in target accounts:
```json
{
  "RoleName": "ComplianceAuditRole-{environmentSuffix}",
  "AssumeRolePolicyDocument": {
    "Version": "2012-10-17",
    "Statement": [
      {
        "Effect": "Allow",
        "Principal": {
          "AWS": "arn:aws:iam::{SOURCE_ACCOUNT}:role/compliance-scanner-role-{environmentSuffix}"
        },
        "Action": "sts:AssumeRole"
      }
    ]
  }
}
```

2. Attach AWS Config read permissions to the role

3. Trigger scan with target account information via EventBridge custom event

### Email Subscriptions

After deployment, subscribe email addresses to SNS topics:

```bash
aws sns subscribe \
  --topic-arn arn:aws:sns:us-east-1:{ACCOUNT}:compliance-critical-alerts-{environmentSuffix} \
  --protocol email \
  --notification-endpoint security-team@example.com
```

## Usage

### Scheduled Scans

Scans run automatically every 6 hours via EventBridge rule.

### On-Demand Scans

Trigger manual scan via EventBridge custom event:

```bash
aws events put-events \
  --entries '[{
    "Source": "compliance.audit",
    "DetailType": "Compliance Scan Request",
    "Detail": "{\"target_accounts\":[]}"
  }]'
```

### Cross-Account Scans

Include target accounts in the event detail:

```bash
aws events put-events \
  --entries '[{
    "Source": "compliance.audit",
    "DetailType": "Compliance Scan Request",
    "Detail": "{\"target_accounts\":[{\"account_id\":\"123456789012\",\"role_name\":\"ComplianceAuditRole\"}]}"
  }]'
```

### Viewing Reports

Reports are stored in S3 under:
- Scan results: `s3://compliance-audit-reports-{environmentSuffix}/scans/{timestamp}/`
- JSON reports: `s3://compliance-audit-reports-{environmentSuffix}/reports/{timestamp}/compliance-report.json`
- CSV reports: `s3://compliance-audit-reports-{environmentSuffix}/reports/{timestamp}/compliance-report.csv`

## Monitoring

### CloudWatch Dashboard

View real-time compliance metrics:
```bash
aws cloudwatch get-dashboard \
  --dashboard-name compliance-metrics-{environmentSuffix}
```

### Lambda Logs

Scanner logs:
```bash
aws logs tail /aws/lambda/compliance-scanner-{environmentSuffix} --follow
```

Report generator logs:
```bash
aws logs tail /aws/lambda/compliance-report-generator-{environmentSuffix} --follow
```

## Security

### Encryption
- KMS encryption for S3 buckets (separate keys for audit and Config)
- S3 server-side encryption enabled
- Lambda environment variables encrypted

### IAM Permissions
- Least privilege access for Lambda functions
- Managed policies only (no inline policies)
- Service-specific IAM roles

### Network Security
- Lambda functions in VPC private subnets
- VPC endpoints for AWS service access
- Security groups with minimal access

### Compliance Features
- VPC flow logs with specific naming convention
- X-Ray tracing enabled for all Lambda functions
- Mandatory resource tags

## Troubleshooting

### AWS Config Recorder Already Exists

AWS Config allows only one recorder per region per account. If deployment fails with recorder conflict:

1. Check existing recorder:
```bash
aws configservice describe-configuration-recorders
```

2. Either delete existing recorder or remove Config resources from this deployment

### Lambda VPC Timeout

If Lambda functions timeout:
- Verify VPC endpoints are created correctly
- Check security group rules allow outbound traffic
- Increase Lambda timeout if needed

### Cross-Account Access Denied

If cross-account scanning fails:
- Verify IAM role exists in target account
- Check trust policy allows source account
- Ensure role has Config read permissions

## Cost Optimization

This implementation includes several cost optimizations:

- **No NAT Gateways**: Uses VPC endpoints instead (~$32/month savings per AZ)
- **Serverless Architecture**: Lambda functions with pay-per-execution
- **S3 Lifecycle Policies**: Automatic transition to Infrequent Access after 30 days
- **VPC Endpoints**: Gateway endpoints for S3 (free) and interface endpoints only for required services
- **Retention Policies**: 90-day automatic deletion of old reports

## Cleanup

To remove all resources:

```bash
# Destroy the stack
cdk destroy --context environmentSuffix=dev

# Confirm deletion when prompted
```

Note: S3 buckets are configured with `auto_delete_objects=True` for safe cleanup.

## Outputs

After deployment, the stack provides these outputs:

- **AuditBucketName**: S3 bucket for compliance reports
- **ScannerFunctionName**: Lambda function for scanning
- **AlertTopicArn**: SNS topic for critical alerts
- **DashboardName**: CloudWatch dashboard name

Access outputs:
```bash
aws cloudformation describe-stacks \
  --stack-name TapStack{environmentSuffix} \
  --query 'Stacks[0].Outputs'
```

## Important Notes

### AWS Config Limitations
- Only one Config recorder per region per account
- Existing recorders will cause deployment conflict
- Consider using existing Config setup if available

### GuardDuty
- NOT created by this stack (account-level service)
- Enable GuardDuty manually at the account level if required

### Lambda Reserved Concurrency
- Set per task requirements to prevent resource exhaustion
- Monitor account-level Lambda concurrency limits

## Support

For issues or questions:
1. Check CloudWatch Logs for Lambda function errors
2. Review AWS Config compliance details in AWS Console
3. Verify VPC endpoint connectivity
4. Check IAM permissions for cross-account access

## License

This infrastructure code is provided as-is for compliance auditing purposes.
