# Infrastructure Compliance Monitoring System

Create an automated compliance monitoring system for EC2 instances using infrastructure as code.

## Requirements

1. **Compliance Scanner Lambda Function**
   - Scan all EC2 instances in the region
   - Check for required tags: Environment, Owner, CostCenter
   - Run automatically every 6 hours using EventBridge
   - Store scan results in S3 with 90-day retention

2. **Alerting System**
   - Send SNS email alerts when non-compliant instances are found
   - Alert should include instance IDs and missing tags
   - Email should be configurable via parameter

3. **Monitoring Dashboard**
   - CloudWatch dashboard showing compliance metrics
   - Display compliance percentage over time
   - Show compliant vs non-compliant instance counts
   - Single value widget for current compliance rate

4. **CloudWatch Alarm**
   - Alert when compliance percentage drops below 95%
   - Use SNS topic for alarm notifications
   - Evaluate every 6 hours (matching scan frequency)

## Technical Requirements

- Use Pulumi with TypeScript
- Lambda runtime: Node.js 20.x
- Lambda timeout: 300 seconds
- Lambda memory: 256 MB
- All resources must have appropriate tags
- Use environment suffix for unique resource naming
- CloudWatch log retention: 7 days

## Expected Outputs

Export the following values:
- bucketName: S3 bucket for scan results
- topicArn: SNS topic ARN
- lambdaFunctionName: Lambda function name
- lambdaFunctionArn: Lambda function ARN
- dashboardName: CloudWatch dashboard name
- alarmName: CloudWatch alarm name
- eventRuleName: EventBridge rule name
- logGroupName: CloudWatch log group name
