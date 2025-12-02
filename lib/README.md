# Compliance Monitoring System

## Overview

This Pulumi TypeScript program deploys an automated infrastructure compliance monitoring system on AWS. The system continuously monitors AWS resources for compliance violations and sends notifications when issues are detected.

## Architecture

The solution includes:

1. **Lambda Function**: Analyzes AWS resource configurations against predefined compliance rules
2. **EventBridge Scheduler**: Triggers compliance checks every 15 minutes
3. **SNS Topic**: Sends email notifications for compliance violations
4. **DynamoDB Table**: Stores compliance check history with 30-day TTL
5. **CloudWatch Logs**: Stores Lambda execution logs with 7-day retention
6. **CloudWatch Metrics**: Tracks compliance check results
7. **CloudWatch Alarm**: Triggers when failure rate exceeds 20%
8. **IAM Roles**: Least-privilege permissions for Lambda execution

## Compliance Rules

The Lambda function currently checks:

- **Security Groups**: Identifies overly permissive security groups with unrestricted access
- **EC2 Instance Tagging**: Ensures instances have required Environment and CostCenter tags

Additional rules can be easily added by extending the `complianceRules` array in the Lambda function.

## Deployment

### Prerequisites

- Node.js 18+ installed
- Pulumi CLI installed
- AWS credentials configured
- Environment variable `ENVIRONMENT_SUFFIX` set (defaults to 'dev')

### Steps

1. Install dependencies:
   ```bash
   npm install
   cd lib/lambda && npm install && cd ../..
   ```

2. Deploy the stack:
   ```bash
   pulumi up
   ```

3. Confirm the email subscription:
   - Check the inbox for compliance@company.com
   - Click the confirmation link in the SNS subscription email

## Outputs

After deployment, the following outputs are available:

- `lambdaFunctionArn`: ARN of the compliance analyzer Lambda function
- `snsTopicArn`: ARN of the SNS topic for notifications
- `dynamoTableName`: Name of the DynamoDB table storing compliance history
- `complianceAlarmArn`: ARN of the CloudWatch alarm

## Monitoring

### CloudWatch Metrics

The system publishes the following custom metrics to the `ComplianceMonitoring` namespace:

- `ComplianceChecksPassed`: Number of compliance checks that passed
- `ComplianceChecksFailed`: Number of compliance checks that failed
- `ComplianceFailureRate`: Percentage of failed checks

### CloudWatch Alarms

An alarm is configured to trigger when the compliance failure rate exceeds 20% over two consecutive 15-minute periods.

## Resource Naming

All resources include the `environmentSuffix` in their names for uniqueness across environments.

## Tags

All resources are tagged with:
- `Environment`: compliance-monitoring
- `CostCenter`: security
- Additional CI/CD metadata tags

## Cleanup

To destroy all resources:

```bash
pulumi destroy
```

All resources are configured to be fully destroyable with no retention policies.
