# Iteration 1: Monitoring and Observability

## Context

The base serverless webhook processing system is deployed and functioning. We now need to add comprehensive monitoring and observability to ensure production-readiness. This iteration focuses on proactive issue detection and distributed request tracing.

## Additional Requirements

Building on the existing webhook processing system (API Gateway, Lambda functions, SQS queues), add comprehensive monitoring and observability features.

### CloudWatch Alarms

Create CloudWatch alarms to monitor system health and alert on anomalies:

**Lambda Function Alarms** (for each of the 3 Lambda functions):
- Error rate alarm: Trigger when Errors exceed 5% of Invocations within a 5-minute period
- Throttle alarm: Trigger when any Throttles occur within a 5-minute period
- Duration alarm: Trigger when Duration exceeds 80% of configured timeout within a 5-minute period
- Concurrent execution alarm: Trigger when concurrent executions exceed 90 of the reserved 100

**SQS Main Queue Alarms** (for each of the 3 main queues):
- Message age alarm: Trigger when ApproximateAgeOfOldestMessage exceeds 300 seconds
- Queue depth alarm: Trigger when ApproximateNumberOfMessagesVisible exceeds 100 messages

**DLQ Alarms** (for each of the 3 dead-letter queues):
- DLQ messages alarm: Trigger when ApproximateNumberOfMessagesVisible is greater than 0

**API Gateway Alarms**:
- 4xx error rate alarm: Trigger when 4XXError rate exceeds 10% of total requests within 5 minutes
- 5xx error rate alarm: Trigger when 5XXError rate exceeds 1% of total requests within 5 minutes
- High latency alarm: Trigger when p99 Latency exceeds 1000ms within 5 minutes

### SNS Topic for Notifications

Create an SNS topic for alarm notifications:
- Topic name with environment suffix for uniqueness
- Optional email subscription (configurable via variable)
- All alarms should publish to this topic

### AWS X-Ray Tracing

Enable distributed tracing across the entire request flow:
- API Gateway: Enable X-Ray active tracing on the production stage
- Lambda functions: Set tracing mode to "Active" for all three functions
- IAM permissions: Add X-Ray write permissions to Lambda execution role

### Configuration Variables

Add variables to control monitoring features:
- `alarm_email`: Email address for SNS subscription (optional, default empty string)
- `enable_alarms`: Boolean to enable/disable alarms (default true)
- `enable_xray`: Boolean to enable/disable X-Ray tracing (default true)

## Expected Outcome

A production-ready observability layer that enables:
- Proactive detection of Lambda errors, throttles, and performance issues
- Early warning of queue processing delays and backlog buildup
- Immediate notification of messages landing in dead-letter queues
- API Gateway error monitoring and latency tracking
- End-to-end distributed tracing of requests through the webhook pipeline
- Centralized alarm notifications via SNS

## Implementation Notes

- Create new file `monitoring.tf` for all CloudWatch alarms
- SNS topic creation should be in `monitoring.tf`
- X-Ray configuration is already included in `lambda.tf` and `api_gateway.tf` (controlled by `enable_xray` variable)
- Update `outputs.tf` to include alarm ARNs and SNS topic ARN
- All alarm names must include environment suffix for uniqueness

## Success Criteria

- Total of 15-20 CloudWatch alarms covering all critical system components
- SNS topic properly configured with alarms subscribed
- X-Ray tracing active across API Gateway and Lambda functions
- All alarms follow consistent naming: `{service}-{metric}-{purpose}-{suffix}`
- Training quality improvement from 7/10 to 9/10 due to comprehensive operational monitoring
