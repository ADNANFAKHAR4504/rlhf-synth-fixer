# CloudWatch Monitoring Stack

A comprehensive monitoring solution built with CDKTF and TypeScript for AWS CloudWatch.

## Overview

This stack provides:
- Centralized CloudWatch Logs with 30-day retention
- Lambda-based log processing for ERROR and CRITICAL levels
- Metric filters and CloudWatch alarms
- SNS notifications via email
- Real-time monitoring dashboard

## Architecture

### Components

1. **CloudWatch Log Group**: `/aws/application/monitoring-{environmentSuffix}`
   - 30-day retention period
   - Enables CloudWatch Logs Insights
   - Tagged for cost allocation

2. **Lambda Function**: `log-processor-{environmentSuffix}`
   - Runtime: Node.js 18
   - Timeout: 60 seconds
   - Filters ERROR and CRITICAL severity levels
   - Processes compressed log events from CloudWatch

3. **Metric Filter**: Counts error occurrences per minute
   - Namespace: `Monitoring/{environmentSuffix}`
   - Metric: ErrorCount

4. **CloudWatch Alarm**: `high-error-rate-{environmentSuffix}`
   - Triggers when errors exceed 10 per 5-minute period
   - Default state: INSUFFICIENT_DATA
   - Notifies via SNS

5. **SNS Topic**: `monitoring-alarms-{environmentSuffix}`
   - Server-side encryption enabled (AWS managed key)
   - Email subscription for notifications

6. **CloudWatch Dashboard**: 2x2 widget layout
   - Error count timeline (per minute)
   - Lambda function metrics
   - Alarm status
   - Recent error logs

## Prerequisites

- Node.js 18 or higher
- AWS CLI configured with appropriate credentials
- Terraform CLI 1.0 or higher
- CDKTF CLI installed

## Installation

```bash
npm install
```

## Configuration

Update the following in `lib/tap-stack.ts`:
- `notificationEmail`: Set your email address for alarm notifications

The region is set to `ca-central-1` by default via `AWS_REGION_OVERRIDE`.

## Deployment

```bash
# Synthesize Terraform configuration
cdktf synth

# Deploy the stack
cdktf deploy

# Specify environment suffix
cdktf deploy --var="environmentSuffix=prod"
```

## Usage

### Sending Test Logs

```bash
aws logs put-log-events \
  --log-group-name /aws/application/monitoring-dev \
  --log-stream-name test-stream \
  --log-events timestamp=$(date +%s)000,message="ERROR: Test error message"
```

### Viewing Dashboard

1. Navigate to CloudWatch in AWS Console
2. Select "Dashboards" from the left menu
3. Open `monitoring-dashboard-{environmentSuffix}`

### Testing Alarms

Generate more than 10 errors within 5 minutes to trigger the alarm:

```bash
for i in {1..15}; do
  aws logs put-log-events \
    --log-group-name /aws/application/monitoring-dev \
    --log-stream-name test-stream \
    --log-events timestamp=$(date +%s)000,message="ERROR: Test error $i"
  sleep 1
done
```

## Resource Naming Convention

All resources follow the pattern: `{resource-type}-{environmentSuffix}`

Examples:
- `log-processor-dev`
- `monitoring-alarms-prod`
- `high-error-rate-staging`

## IAM Permissions

The Lambda execution role has least-privilege access:
- Basic Lambda execution (AWS managed policy)
- CloudWatch Logs write access (custom policy)
- Limited to specific log group ARN

## Monitoring and Alerts

### Alarm States

- **OK**: Error count below threshold
- **ALARM**: Error count exceeded 10 in 5 minutes
- **INSUFFICIENT_DATA**: Not enough data (default state)

### Email Notifications

Confirm the SNS subscription via email after deployment. You will receive notifications when:
- Alarm enters ALARM state
- Alarm returns to OK state

## Cost Optimization

- Serverless architecture (Lambda, CloudWatch)
- 30-day log retention to manage storage costs
- No VPC resources required
- On-demand pricing for all services

## Troubleshooting

### Lambda Not Processing Logs

Check Lambda execution role permissions:
```bash
aws iam get-role --role-name log-processor-role-{environmentSuffix}
```

### No Alarms Triggering

Verify metric filter is publishing data:
```bash
aws cloudwatch get-metric-statistics \
  --namespace Monitoring/{environmentSuffix} \
  --metric-name ErrorCount \
  --start-time $(date -u -d '10 minutes ago' +%Y-%m-%dT%H:%M:%S) \
  --end-time $(date -u +%Y-%m-%dT%H:%M:%S) \
  --period 60 \
  --statistics Sum
```

## Cleanup

```bash
cdktf destroy
```

Note: All resources are configured to be destroyable (no retention policies).

## Tags

All resources are tagged with:
- `Environment: production`
- `Team: platform`
- `Name: {resource-name}-{environmentSuffix}`

## Security

- SNS topic encrypted with AWS managed key
- IAM roles follow least-privilege principle
- No hardcoded credentials
- Lambda function uses environment variables

## Future Enhancements

- Add support for multiple log groups
- Implement log retention policies per service
- Add more sophisticated error pattern matching
- Integrate with third-party monitoring tools
- Add CloudWatch Insights saved queries
