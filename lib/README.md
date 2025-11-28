# Advanced Observability Platform for Microservices

A comprehensive CloudFormation template for monitoring distributed microservices with real-time alerting, distributed tracing, and automated anomaly detection.

## Overview

This infrastructure implements a production-ready observability platform that provides:
- Custom metrics collection and processing
- Multi-channel alerting (email and SMS)
- Distributed tracing with X-Ray
- Automated anomaly detection
- Cross-account metric sharing
- Real-time dashboards with metric math

## Architecture

The platform consists of the following components:

1. **CloudWatch Custom Metrics**: Custom namespace for application-specific metrics
2. **Lambda Processor**: Processes and publishes custom metrics from logs
3. **CloudWatch Alarms**: Composite alarms for multi-metric evaluation
4. **SNS Topic**: KMS-encrypted topic for email and SMS notifications
5. **X-Ray**: Distributed tracing with configurable sampling
6. **EventBridge**: Scheduled metric collection every 5 minutes
7. **CloudWatch Dashboard**: Real-time visualization with metric math
8. **Anomaly Detectors**: Automatic baseline learning for latency and errors
9. **Cross-Account Role**: IAM role for sharing metrics across accounts

## Prerequisites

- AWS CLI 2.x configured with appropriate permissions
- IAM permissions to create:
  - CloudWatch resources (Logs, Alarms, Dashboards, Anomaly Detectors)
  - Lambda functions and execution roles
  - SNS topics
  - KMS keys
  - X-Ray groups and sampling rules
  - EventBridge rules
  - IAM roles and policies

## Parameters

| Parameter | Type | Description | Default |
|-----------|------|-------------|---------|
| EnvironmentSuffix | String | Environment suffix for resource naming | prod |
| XRaySamplingRate | Number | X-Ray sampling rate (0-1) | 0.1 |
| AlertEmail | String | Email address for alerts | Required |
| AlertPhoneNumber | String | Phone number in E.164 format | Required |
| CrossAccountRoleArn | String | ARN for cross-account access | Optional |
| Department | String | Department for cost allocation | Engineering |

## Deployment

### Using AWS CLI

```bash
aws cloudformation create-stack \
  --stack-name observability-platform \
  --template-body file://lib/TapStack.json \
  --parameters \
    ParameterKey=EnvironmentSuffix,ParameterValue=prod \
    ParameterKey=XRaySamplingRate,ParameterValue=0.1 \
    ParameterKey=AlertEmail,ParameterValue=alerts@example.com \
    ParameterKey=AlertPhoneNumber,ParameterValue=+12345678900 \
    ParameterKey=Department,ParameterValue=Engineering \
  --capabilities CAPABILITY_NAMED_IAM \
  --region us-east-1
```

### Using AWS Console

1. Navigate to CloudFormation console
2. Click "Create Stack" > "With new resources"
3. Upload `lib/TapStack.json`
4. Fill in required parameters
5. Acknowledge IAM resource creation
6. Click "Create Stack"

## Post-Deployment Steps

1. **Confirm SNS Subscriptions**:
   - Check email inbox for confirmation link
   - Click to confirm email subscription
   - SMS subscription auto-confirms on first alert

2. **Instrument Applications**:
   - Add X-Ray SDK to application code
   - Configure X-Ray daemon or use Lambda layer
   - Use sampling rate from XRaySamplingRate parameter

3. **Send Test Logs**:
   ```bash
   aws logs put-log-events \
     --log-group-name /aws/observability/metrics-prod \
     --log-stream-name test-stream \
     --log-events timestamp=$(date +%s)000,message='{"latency": 250, "error": false}'
   ```

4. **Verify Dashboard**:
   - Open CloudWatch console
   - Navigate to Dashboards
   - Select `observability-{EnvironmentSuffix}`

## Usage

### Sending Custom Metrics

Write JSON-formatted logs to the metrics log group:

```json
{
  "latency": 145,
  "error": false,
  "service": "api-gateway"
}
```

Metric filters will automatically extract:
- `RequestLatency` from `latency` field
- `ErrorRate` from `error` field

### Invoking Lambda Processor

The Lambda function is invoked automatically every 5 minutes by EventBridge.

Manual invocation:
```bash
aws lambda invoke \
  --function-name metrics-processor-prod \
  --payload '{"triggerType": "manual", "metrics": []}' \
  response.json
```

### Viewing Traces

1. Open X-Ray console
2. Select group: `observability-traces-{EnvironmentSuffix}`
3. View service map and trace details

### Cross-Account Access

If CrossAccountRoleArn is provided:

```bash
aws sts assume-role \
  --role-arn arn:aws:iam::ACCOUNT_ID:role/observability-cross-account-prod \
  --role-session-name metrics-reader \
  --external-id observability-prod
```

## Monitoring

### Key Metrics

- `CustomMetrics/{EnvironmentSuffix}/RequestLatency`: Request latency in milliseconds
- `CustomMetrics/{EnvironmentSuffix}/ErrorRate`: Error count
- `AWS/Lambda/Invocations`: Lambda invocation count
- `AWS/Lambda/Errors`: Lambda error count
- `AWS/XRay/TraceSummary.ByResponseTime`: X-Ray trace response times

### Alarms

- **HighLatencyAlarm**: Triggers when average latency > 1000ms for 2 periods
- **HighErrorRateAlarm**: Triggers when error count > 10 for 2 periods
- **CompositeAlarm**: Triggers when either alarm activates

### Anomaly Detection

Anomaly detectors learn baselines over 2+ weeks:
- Latency anomaly detection on RequestLatency
- Error rate anomaly detection on ErrorRate

## Cost Optimization

Estimated monthly costs (us-east-1):
- CloudWatch Logs: $0.50/GB ingested + $0.03/GB stored
- Lambda: $0.20 per 1M requests (8640/month for 5-min schedule)
- SNS: $0.50 per 1M email + $0.00645 per SMS
- X-Ray: $5 per 1M traces recorded
- KMS: $1/month per key + $0.03/10K requests
- CloudWatch Dashboard: $3/month per dashboard

**Total estimated cost**: $5-20/month depending on volume

## Troubleshooting

### SNS Not Sending Alerts

1. Check subscription confirmation status
2. Verify composite alarm state
3. Check KMS key permissions for SNS

### Lambda Not Processing Metrics

1. Check EventBridge rule is enabled
2. Verify Lambda execution role permissions
3. Check Lambda logs in CloudWatch

### Metric Filters Not Extracting

1. Verify log format is valid JSON
2. Check filter patterns match log structure
3. Ensure numeric values in correct fields

### X-Ray Not Showing Traces

1. Verify application instrumentation
2. Check X-Ray daemon configuration
3. Verify sampling rate not too low

## Security Considerations

- KMS key rotation enabled (annual)
- SNS topics encrypted at rest
- IAM roles follow least-privilege principle
- Lambda functions use specific permissions
- Cross-account access requires external ID
- All resources tagged for cost allocation

## Compliance

- CloudWatch Logs retention: 30 days (configurable)
- All actions logged via CloudTrail
- Encryption at rest using KMS
- Audit trail via X-Ray traces
- Department-level cost allocation tags

## Cleanup

To delete all resources:

```bash
aws cloudformation delete-stack \
  --stack-name observability-platform \
  --region us-east-1
```

Note: All resources use `DeletionPolicy: Delete` for complete cleanup.

## Support

For issues or questions:
1. Check CloudWatch Logs for Lambda function errors
2. Review CloudFormation stack events
3. Verify IAM permissions
4. Consult AWS X-Ray documentation

## License

This infrastructure code is provided as-is for observability platform deployment.
