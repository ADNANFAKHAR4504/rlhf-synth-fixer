# Observability Platform for Microservices - CDKTF Python Implementation

This CDKTF Python implementation provides a comprehensive observability platform for microservices architecture, including centralized logging, distributed tracing, metrics collection, intelligent alerting, and visualization dashboards.

## Architecture Overview

The solution implements:

1. **Centralized Logging Infrastructure**
   - CloudWatch Log Groups with KMS encryption for ECS tasks and Lambda functions
   - 30-day log retention with automatic archival
   - Log aggregation across all microservices

2. **Distributed Tracing**
   - X-Ray tracing for all Lambda functions and ECS services
   - Sampling rate of 0.1 (10%) as per requirements
   - Service map visualization for request flow

3. **Metrics and Monitoring**
   - Metric filters for error rates, latency p99, and concurrent executions
   - Container Insights for ECS cluster monitoring
   - Lambda Insights with enhanced monitoring

4. **Alerting and Notifications**
   - CloudWatch alarms for CPU, memory, error rate, and latency thresholds
   - SNS topics with dead letter queues (maxReceiveCount=3)
   - Composite alarms to reduce false positives

5. **Visualization**
   - CloudWatch dashboard with service health, latency percentiles, and error trends
   - Organized by service boundary with cross-service view

## Prerequisites

- Python 3.9+
- CDKTF 0.20+
- AWS CLI configured with appropriate permissions
- Pipenv for dependency management

## Project Structure

```
.
├── cdktf.json                    # CDKTF configuration
├── main.py                        # Application entry point
├── stacks/
│   ├── __init__.py
│   └── observability_stack.py    # Main observability stack
├── lambda/
│   ├── payment_handler/           # Payment handler Lambda
│   │   ├── index.py
│   │   └── requirements.txt
│   └── order_processor/           # Order processor Lambda
│       ├── index.py
│       └── requirements.txt
└── tests/
    └── test_observability_stack.py
```

## Installation

1. Install dependencies:

```bash
pipenv install
```

2. Initialize CDKTF:

```bash
cdktf get
```

3. Package Lambda functions:

```bash
cd lambda/payment_handler
pip install -r requirements.txt -t .
zip -r ../payment_handler.zip .
cd ../..

cd lambda/order_processor
pip install -r requirements.txt -t .
zip -r ../order_processor.zip .
cd ../..
```

## Configuration

The stack accepts an `environment_suffix` parameter for resource naming. Default is "dev".

To customize:

```python
ObservabilityStack(app, "observability-platform", environment_suffix="prod")
```

## Deployment

1. Review the planned changes:

```bash
cdktf diff
```

2. Deploy the stack:

```bash
cdktf deploy
```

3. Approve the deployment when prompted.

## Key Features

### KMS Encryption
All CloudWatch Log Groups use customer-managed KMS keys with automatic key rotation enabled.

### X-Ray Tracing
- Lambda functions have X-Ray tracing enabled with Active mode
- Sampling rate: 0.1 (10%)
- Service map provides visualization of request flow across services

### Container Insights
ECS cluster has Container Insights enabled for detailed container-level metrics including CPU, memory, network, and storage.

### Lambda Insights
All Lambda functions include Lambda Insights layer for enhanced monitoring with detailed performance metrics.

### Metric Filters
- **Error Rate**: Tracks ERROR and FATAL log entries
- **Latency**: Extracts duration from log messages
- **Concurrent Executions**: Monitors Lambda concurrency

### Alarms
- Lambda error rate alarm (threshold: 5 errors in 10 minutes)
- Lambda latency alarm (threshold: 3000ms p99)
- Lambda concurrent executions alarm (threshold: 100)
- ECS CPU utilization alarm (threshold: 80%)
- ECS memory utilization alarm (threshold: 80%)
- ECS error rate alarm (threshold: 10 errors in 10 minutes)

### Composite Alarms
- **Lambda Critical**: Triggers when errors/latency AND concurrent executions are high
- **ECS Resource Exhaustion**: Triggers when both CPU AND memory are high
- **System-Wide Critical**: Triggers when both Lambda AND ECS have high error rates

### CloudWatch Dashboard
The dashboard includes:
- Lambda function metrics (errors, latency, concurrency)
- ECS cluster resource utilization
- Error rates by service
- Latency percentiles (p50, p95, p99)
- Recent error logs from Lambda and ECS

## SNS Topic Configuration

The alarm SNS topic includes:
- Dead letter queue with 14-day message retention
- Email subscription support (commented out - add your email)
- Webhook/HTTP endpoint support

To add email notifications, uncomment and update in `observability_stack.py`:

```python
SnsTopicSubscription(
    self,
    f"alarm-email-subscription-{self.environment_suffix}",
    topic_arn=alarm_topic.arn,
    protocol="email",
    endpoint="your-email@example.com"
)
```

## Testing

Run unit tests:

```bash
pipenv run pytest tests/ -v
```

## Monitoring

1. **CloudWatch Dashboard**: Access via the output URL or navigate to CloudWatch Console > Dashboards > `observability-platform-{environment_suffix}`

2. **X-Ray Service Map**: Navigate to X-Ray Console > Service Map to visualize request flow

3. **Container Insights**: Navigate to CloudWatch Console > Container Insights to view ECS metrics

4. **Lambda Insights**: Navigate to CloudWatch Console > Lambda Insights to view enhanced Lambda metrics

## Outputs

After deployment, the following outputs are available:

- `kms_key_id`: KMS key ID for CloudWatch Logs encryption
- `alarm_topic_arn`: SNS topic ARN for alarms
- `ecs_cluster_name`: ECS cluster name
- `lambda_function_names`: JSON object with Lambda function names
- `dashboard_url`: Direct URL to CloudWatch Dashboard

## Cost Optimization

This implementation follows AWS best practices for cost optimization:

- CloudWatch Logs with 30-day retention
- X-Ray sampling rate of 0.1 (10%) to reduce tracing costs
- Lambda functions with appropriate memory/timeout configurations
- No over-provisioning of resources

## Security

- All CloudWatch Logs encrypted with KMS customer-managed keys
- KMS key rotation enabled
- Lambda functions have minimal IAM permissions
- SNS topics have dead letter queues for message reliability

## Cleanup

To destroy all resources:

```bash
cdktf destroy
```

All resources are configured with proper removal policies to ensure clean deletion.

## Troubleshooting

### Lambda Functions Not Deploying
Ensure Lambda ZIP files exist:
```bash
ls -la lambda/*.zip
```

### X-Ray Traces Not Appearing
- Verify Lambda execution role has `AWSXRayDaemonWriteAccess` policy
- Check Lambda environment variables include X-Ray configuration
- Allow 1-2 minutes for traces to appear in X-Ray console

### Alarms Not Triggering
- Verify SNS subscription is confirmed (check email)
- Check alarm evaluation periods and thresholds
- Generate test traffic to Lambda functions

### KMS Encryption Issues
- Verify CloudWatch Logs service has permissions in KMS key policy
- Check key policy includes correct AWS account ID

## Support

For issues or questions:
1. Check CloudWatch Logs for error messages
2. Review X-Ray traces for failed requests
3. Examine CloudWatch alarms for threshold breaches
4. Review SNS DLQ for failed notification deliveries
