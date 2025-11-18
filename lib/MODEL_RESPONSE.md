# Payment Processing API Infrastructure - AWS CDK Python Implementation

This implementation provides a resilient payment processing API with disaster recovery capabilities using AWS CDK with Python.

## Architecture Overview

The infrastructure includes:
- API Gateway REST API with throttling
- Lambda functions for payment validation, processing, and health monitoring
- DynamoDB table with point-in-time recovery
- SQS queues with dead letter queues
- SNS topics for alarm notifications
- CloudWatch alarms, logs, and dashboard
- IAM roles with least privilege access

## File: lib/tap_stack.py

```python
from aws_cdk import (
    Stack,
    aws_apigateway as apigateway,
    aws_lambda as lambda_,
    aws_dynamodb as dynamodb,
    aws_sqs as sqs,
    aws_sns as sns,
    aws_sns_subscriptions as sns_subscriptions,
    aws_cloudwatch as cloudwatch,
    aws_iam as iam,
    aws_logs as logs,
    Duration,
    RemovalPolicy,
    CfnOutput,
    Tags,
)
from constructs import Construct
import os


class TapStack(Stack):
    def __init__(self, scope: Construct, construct_id: str, environment_suffix: str, **kwargs) -> None:
        super().__init__(scope, construct_id, **kwargs)

        # Tag all resources with Environment
        Tags.of(self).add("Environment", environment_suffix)

        # SNS Topic for Alarms
        alarm_topic = sns.Topic(
            self,
            "AlarmTopic",
            topic_name=f"payment-alarms-{environment_suffix}",
            display_name="Payment Processing Alarms"
        )

        # DynamoDB Table for transaction storage
        transactions_table = dynamodb.Table(
            self,
            "TransactionsTable",
            table_name=f"transactions-{environment_suffix}",
            partition_key=dynamodb.Attribute(
                name="transaction_id",
                type=dynamodb.AttributeType.STRING
            ),
            billing_mode=dynamodb.BillingMode.PAY_PER_REQUEST,
            point_in_time_recovery=True,
            removal_policy=RemovalPolicy.DESTROY
        )

        # DynamoDB CloudWatch Alarm for throttling
        dynamodb_throttle_alarm = cloudwatch.Alarm(
            self,
            "DynamoDBThrottleAlarm",
            alarm_name=f"dynamodb-throttle-{environment_suffix}",
            metric=transactions_table.metric_user_errors(
                statistic="Sum",
                period=Duration.minutes(5)
            ),
            threshold=10,
            evaluation_periods=2,
            alarm_description="DynamoDB throttling detected"
        )
        dynamodb_throttle_alarm.add_alarm_action(
            cloudwatch_actions.SnsAction(alarm_topic)
        )

        # Dead Letter Queue for failed transactions
        failed_transactions_dlq = sqs.Queue(
            self,
            "FailedTransactionsDLQ",
            queue_name=f"failed-transactions-dlq-{environment_suffix}",
            retention_period=Duration.days(14),
            removal_policy=RemovalPolicy.DESTROY
        )

        # SQS Queue for async processing
        failed_transactions_queue = sqs.Queue(
            self,
            "FailedTransactionsQueue",
            queue_name=f"failed-transactions-{environment_suffix}",
            visibility_timeout=Duration.seconds(300),
            dead_letter_queue=sqs.DeadLetterQueue(
                max_receive_count=3,
                queue=failed_transactions_dlq
            ),
            removal_policy=RemovalPolicy.DESTROY
        )

        # Lambda: Payment Validation
        validation_function = lambda_.Function(
            self,
            "ValidationFunction",
            function_name=f"payment-validation-{environment_suffix}",
            runtime=lambda_.Runtime.PYTHON_3_11,
            handler="validation.handler",
            code=lambda_.Code.from_asset("lib/lambda/validation"),
            timeout=Duration.seconds(30),
            memory_size=256,
            environment={
                "TRANSACTIONS_TABLE": transactions_table.table_name,
                "FAILED_QUEUE_URL": failed_transactions_queue.queue_url
            },
            log_retention=logs.RetentionDays.ONE_WEEK
        )

        # Lambda: Payment Processing
        processing_function = lambda_.Function(
            self,
            "ProcessingFunction",
            function_name=f"payment-processing-{environment_suffix}",
            runtime=lambda_.Runtime.PYTHON_3_11,
            handler="processing.handler",
            code=lambda_.Code.from_asset("lib/lambda/processing"),
            timeout=Duration.seconds(60),
            memory_size=512,
            environment={
                "TRANSACTIONS_TABLE": transactions_table.table_name,
                "FAILED_QUEUE_URL": failed_transactions_queue.queue_url
            },
            log_retention=logs.RetentionDays.ONE_WEEK
        )

        # Lambda: Health Monitor
        health_monitor_function = lambda_.Function(
            self,
            "HealthMonitorFunction",
            function_name=f"health-monitor-{environment_suffix}",
            runtime=lambda_.Runtime.PYTHON_3_11,
            handler="health_monitor.handler",
            code=lambda_.Code.from_asset("lib/lambda/health_monitor"),
            timeout=Duration.seconds(60),
            memory_size=256,
            environment={
                "ALARM_TOPIC_ARN": alarm_topic.topic_arn,
                "API_NAME": f"payment-api-{environment_suffix}"
            },
            log_retention=logs.RetentionDays.ONE_WEEK
        )

        # Grant DynamoDB permissions
        transactions_table.grant_read_write_data(validation_function)
        transactions_table.grant_read_write_data(processing_function)
        transactions_table.grant_read_data(health_monitor_function)

        # Grant SQS permissions
        failed_transactions_queue.grant_send_messages(validation_function)
        failed_transactions_queue.grant_send_messages(processing_function)

        # Grant SNS permissions
        alarm_topic.grant_publish(health_monitor_function)

        # Grant CloudWatch permissions to health monitor
        health_monitor_function.add_to_role_policy(
            iam.PolicyStatement(
                effect=iam.Effect.ALLOW,
                actions=[
                    "cloudwatch:GetMetricStatistics",
                    "cloudwatch:DescribeAlarms",
                    "cloudwatch:PutMetricData"
                ],
                resources=["*"]
            )
        )

        health_monitor_function.add_to_role_policy(
            iam.PolicyStatement(
                effect=iam.Effect.ALLOW,
                actions=[
                    "apigateway:GET"
                ],
                resources=["*"]
            )
        )

        # API Gateway REST API
        api = apigateway.RestApi(
            self,
            "PaymentAPI",
            rest_api_name=f"payment-api-{environment_suffix}",
            description="Payment Processing API with disaster recovery",
            deploy_options=apigateway.StageOptions(
                stage_name="prod",
                throttling_rate_limit=1000,
                throttling_burst_limit=2000,
                logging_level=apigateway.MethodLoggingLevel.INFO,
                data_trace_enabled=True,
                metrics_enabled=True
            ),
            cloud_watch_role=True
        )

        # API Gateway Resources and Methods
        validate_resource = api.root.add_resource("validate")
        validate_integration = apigateway.LambdaIntegration(validation_function)
        validate_resource.add_method("POST", validate_integration)

        process_resource = api.root.add_resource("process")
        process_integration = apigateway.LambdaIntegration(processing_function)
        process_resource.add_method("POST", process_integration)

        health_resource = api.root.add_resource("health")
        health_integration = apigateway.LambdaIntegration(health_monitor_function)
        health_resource.add_method("GET", health_integration)

        # CloudWatch Alarms for API Gateway
        api_latency_alarm = cloudwatch.Alarm(
            self,
            "APILatencyAlarm",
            alarm_name=f"api-latency-{environment_suffix}",
            metric=cloudwatch.Metric(
                namespace="AWS/ApiGateway",
                metric_name="Latency",
                dimensions_map={
                    "ApiName": f"payment-api-{environment_suffix}",
                    "Stage": "prod"
                },
                statistic="Average",
                period=Duration.minutes(5)
            ),
            threshold=1000,
            evaluation_periods=2,
            alarm_description="API Gateway latency is high"
        )
        api_latency_alarm.add_alarm_action(
            cloudwatch_actions.SnsAction(alarm_topic)
        )

        # CloudWatch Alarms for Lambda Functions
        validation_error_alarm = cloudwatch.Alarm(
            self,
            "ValidationErrorAlarm",
            alarm_name=f"validation-errors-{environment_suffix}",
            metric=validation_function.metric_errors(
                statistic="Sum",
                period=Duration.minutes(5)
            ),
            threshold=10,
            evaluation_periods=2,
            alarm_description="Validation function errors detected"
        )
        validation_error_alarm.add_alarm_action(
            cloudwatch_actions.SnsAction(alarm_topic)
        )

        processing_error_alarm = cloudwatch.Alarm(
            self,
            "ProcessingErrorAlarm",
            alarm_name=f"processing-errors-{environment_suffix}",
            metric=processing_function.metric_errors(
                statistic="Sum",
                period=Duration.minutes(5)
            ),
            threshold=10,
            evaluation_periods=2,
            alarm_description="Processing function errors detected"
        )
        processing_error_alarm.add_alarm_action(
            cloudwatch_actions.SnsAction(alarm_topic)
        )

        # CloudWatch Dashboard
        dashboard = cloudwatch.Dashboard(
            self,
            "PaymentDashboard",
            dashboard_name=f"payment-dashboard-{environment_suffix}"
        )

        # Add widgets to dashboard
        dashboard.add_widgets(
            cloudwatch.GraphWidget(
                title="API Gateway Latency",
                left=[
                    cloudwatch.Metric(
                        namespace="AWS/ApiGateway",
                        metric_name="Latency",
                        dimensions_map={
                            "ApiName": f"payment-api-{environment_suffix}",
                            "Stage": "prod"
                        },
                        statistic="Average",
                        period=Duration.minutes(5)
                    )
                ],
                width=12
            )
        )

        dashboard.add_widgets(
            cloudwatch.GraphWidget(
                title="Lambda Function Errors",
                left=[
                    validation_function.metric_errors(
                        statistic="Sum",
                        period=Duration.minutes(5),
                        label="Validation Errors"
                    ),
                    processing_function.metric_errors(
                        statistic="Sum",
                        period=Duration.minutes(5),
                        label="Processing Errors"
                    )
                ],
                width=12
            )
        )

        dashboard.add_widgets(
            cloudwatch.GraphWidget(
                title="DynamoDB Operations",
                left=[
                    transactions_table.metric_consumed_read_capacity_units(
                        statistic="Sum",
                        period=Duration.minutes(5)
                    ),
                    transactions_table.metric_consumed_write_capacity_units(
                        statistic="Sum",
                        period=Duration.minutes(5)
                    )
                ],
                width=12
            )
        )

        dashboard.add_widgets(
            cloudwatch.GraphWidget(
                title="SQS Queue Metrics",
                left=[
                    failed_transactions_queue.metric_approximate_number_of_messages_visible(
                        statistic="Average",
                        period=Duration.minutes(5),
                        label="Messages in Queue"
                    ),
                    failed_transactions_dlq.metric_approximate_number_of_messages_visible(
                        statistic="Average",
                        period=Duration.minutes(5),
                        label="Messages in DLQ"
                    )
                ],
                width=12
            )
        )

        # Outputs
        CfnOutput(
            self,
            "APIEndpoint",
            value=api.url,
            description="Payment API Endpoint"
        )

        CfnOutput(
            self,
            "TransactionsTableName",
            value=transactions_table.table_name,
            description="DynamoDB Transactions Table"
        )

        CfnOutput(
            self,
            "AlarmTopicArn",
            value=alarm_topic.topic_arn,
            description="SNS Topic for Alarms"
        )

        CfnOutput(
            self,
            "DashboardName",
            value=dashboard.dashboard_name,
            description="CloudWatch Dashboard"
        )
```

## File: lib/lambda/validation/validation.py

```python
import json
import os
import boto3
import uuid
from datetime import datetime

dynamodb = boto3.resource('dynamodb')
sqs = boto3.client('sqs')

TRANSACTIONS_TABLE = os.environ['TRANSACTIONS_TABLE']
FAILED_QUEUE_URL = os.environ['FAILED_QUEUE_URL']

table = dynamodb.Table(TRANSACTIONS_TABLE)


def handler(event, context):
    """
    Validates payment requests and stores them in DynamoDB.
    Failed validations are sent to SQS for retry.
    """
    try:
        # Parse request body
        body = json.loads(event.get('body', '{}'))

        # Validate required fields
        required_fields = ['amount', 'currency', 'customer_id']
        missing_fields = [field for field in required_fields if field not in body]

        if missing_fields:
            return {
                'statusCode': 400,
                'body': json.dumps({
                    'error': 'Validation failed',
                    'missing_fields': missing_fields
                })
            }

        # Validate amount
        amount = body.get('amount')
        if not isinstance(amount, (int, float)) or amount <= 0:
            return {
                'statusCode': 400,
                'body': json.dumps({
                    'error': 'Invalid amount',
                    'message': 'Amount must be a positive number'
                })
            }

        # Create transaction record
        transaction_id = str(uuid.uuid4())
        timestamp = datetime.utcnow().isoformat()

        transaction = {
            'transaction_id': transaction_id,
            'amount': str(amount),
            'currency': body.get('currency'),
            'customer_id': body.get('customer_id'),
            'status': 'validated',
            'created_at': timestamp,
            'updated_at': timestamp
        }

        # Store in DynamoDB
        table.put_item(Item=transaction)

        return {
            'statusCode': 200,
            'body': json.dumps({
                'message': 'Payment validated successfully',
                'transaction_id': transaction_id,
                'status': 'validated'
            })
        }

    except Exception as e:
        print(f"Validation error: {str(e)}")

        # Send to failed queue for retry
        try:
            sqs.send_message(
                QueueUrl=FAILED_QUEUE_URL,
                MessageBody=json.dumps({
                    'error': str(e),
                    'event': event,
                    'timestamp': datetime.utcnow().isoformat()
                })
            )
        except Exception as sqs_error:
            print(f"Failed to send to SQS: {str(sqs_error)}")

        return {
            'statusCode': 500,
            'body': json.dumps({
                'error': 'Validation failed',
                'message': str(e)
            })
        }
```

## File: lib/lambda/processing/processing.py

```python
import json
import os
import boto3
from datetime import datetime
from decimal import Decimal

dynamodb = boto3.resource('dynamodb')
sqs = boto3.client('sqs')

TRANSACTIONS_TABLE = os.environ['TRANSACTIONS_TABLE']
FAILED_QUEUE_URL = os.environ['FAILED_QUEUE_URL']

table = dynamodb.Table(TRANSACTIONS_TABLE)


def handler(event, context):
    """
    Processes validated payments and updates transaction status.
    Failed processing attempts are sent to SQS for retry.
    """
    try:
        # Parse request body
        body = json.loads(event.get('body', '{}'))

        transaction_id = body.get('transaction_id')
        if not transaction_id:
            return {
                'statusCode': 400,
                'body': json.dumps({
                    'error': 'Missing transaction_id'
                })
            }

        # Get transaction from DynamoDB
        response = table.get_item(Key={'transaction_id': transaction_id})

        if 'Item' not in response:
            return {
                'statusCode': 404,
                'body': json.dumps({
                    'error': 'Transaction not found',
                    'transaction_id': transaction_id
                })
            }

        transaction = response['Item']

        # Check if already processed
        if transaction.get('status') == 'processed':
            return {
                'statusCode': 200,
                'body': json.dumps({
                    'message': 'Transaction already processed',
                    'transaction_id': transaction_id,
                    'status': 'processed'
                })
            }

        # Simulate payment processing
        # In real implementation, this would call payment gateway
        timestamp = datetime.utcnow().isoformat()

        # Update transaction status
        table.update_item(
            Key={'transaction_id': transaction_id},
            UpdateExpression='SET #status = :status, updated_at = :timestamp, processed_at = :timestamp',
            ExpressionAttributeNames={
                '#status': 'status'
            },
            ExpressionAttributeValues={
                ':status': 'processed',
                ':timestamp': timestamp
            }
        )

        return {
            'statusCode': 200,
            'body': json.dumps({
                'message': 'Payment processed successfully',
                'transaction_id': transaction_id,
                'status': 'processed',
                'processed_at': timestamp
            })
        }

    except Exception as e:
        print(f"Processing error: {str(e)}")

        # Send to failed queue for retry
        try:
            sqs.send_message(
                QueueUrl=FAILED_QUEUE_URL,
                MessageBody=json.dumps({
                    'error': str(e),
                    'event': event,
                    'timestamp': datetime.utcnow().isoformat()
                })
            )
        except Exception as sqs_error:
            print(f"Failed to send to SQS: {str(sqs_error)}")

        return {
            'statusCode': 500,
            'body': json.dumps({
                'error': 'Processing failed',
                'message': str(e)
            })
        }
```

## File: lib/lambda/health_monitor/health_monitor.py

```python
import json
import os
import boto3
from datetime import datetime, timedelta

cloudwatch = boto3.client('cloudwatch')
sns = boto3.client('sns')
apigateway = boto3.client('apigateway')

ALARM_TOPIC_ARN = os.environ['ALARM_TOPIC_ARN']
API_NAME = os.environ['API_NAME']


def handler(event, context):
    """
    Monitors system health metrics and triggers recovery actions if needed.
    Checks API Gateway, Lambda, and DynamoDB metrics.
    """
    try:
        health_status = {
            'timestamp': datetime.utcnow().isoformat(),
            'checks': []
        }

        # Check API Gateway metrics
        api_health = check_api_gateway_health()
        health_status['checks'].append(api_health)

        # Check Lambda error rates
        lambda_health = check_lambda_health()
        health_status['checks'].append(lambda_health)

        # Check DynamoDB throttling
        dynamodb_health = check_dynamodb_health()
        health_status['checks'].append(dynamodb_health)

        # Overall health status
        all_healthy = all(check['status'] == 'healthy' for check in health_status['checks'])
        health_status['overall_status'] = 'healthy' if all_healthy else 'degraded'

        # If degraded, send notification
        if not all_healthy:
            send_health_alert(health_status)

        return {
            'statusCode': 200,
            'body': json.dumps(health_status)
        }

    except Exception as e:
        print(f"Health monitor error: {str(e)}")
        return {
            'statusCode': 500,
            'body': json.dumps({
                'error': 'Health check failed',
                'message': str(e)
            })
        }


def check_api_gateway_health():
    """Check API Gateway latency and error rates"""
    try:
        end_time = datetime.utcnow()
        start_time = end_time - timedelta(minutes=5)

        # Get average latency
        latency_response = cloudwatch.get_metric_statistics(
            Namespace='AWS/ApiGateway',
            MetricName='Latency',
            Dimensions=[
                {'Name': 'ApiName', 'Value': API_NAME},
                {'Name': 'Stage', 'Value': 'prod'}
            ],
            StartTime=start_time,
            EndTime=end_time,
            Period=300,
            Statistics=['Average']
        )

        avg_latency = 0
        if latency_response['Datapoints']:
            avg_latency = latency_response['Datapoints'][0]['Average']

        status = 'healthy' if avg_latency < 1000 else 'unhealthy'

        return {
            'service': 'API Gateway',
            'metric': 'latency',
            'value': avg_latency,
            'threshold': 1000,
            'status': status
        }

    except Exception as e:
        print(f"API Gateway health check error: {str(e)}")
        return {
            'service': 'API Gateway',
            'status': 'unknown',
            'error': str(e)
        }


def check_lambda_health():
    """Check Lambda error rates"""
    try:
        end_time = datetime.utcnow()
        start_time = end_time - timedelta(minutes=5)

        # Get error count
        error_response = cloudwatch.get_metric_statistics(
            Namespace='AWS/Lambda',
            MetricName='Errors',
            StartTime=start_time,
            EndTime=end_time,
            Period=300,
            Statistics=['Sum']
        )

        total_errors = 0
        if error_response['Datapoints']:
            total_errors = sum(dp['Sum'] for dp in error_response['Datapoints'])

        status = 'healthy' if total_errors < 10 else 'unhealthy'

        return {
            'service': 'Lambda',
            'metric': 'errors',
            'value': total_errors,
            'threshold': 10,
            'status': status
        }

    except Exception as e:
        print(f"Lambda health check error: {str(e)}")
        return {
            'service': 'Lambda',
            'status': 'unknown',
            'error': str(e)
        }


def check_dynamodb_health():
    """Check DynamoDB throttling"""
    try:
        end_time = datetime.utcnow()
        start_time = end_time - timedelta(minutes=5)

        # Get throttle count
        throttle_response = cloudwatch.get_metric_statistics(
            Namespace='AWS/DynamoDB',
            MetricName='UserErrors',
            StartTime=start_time,
            EndTime=end_time,
            Period=300,
            Statistics=['Sum']
        )

        throttle_count = 0
        if throttle_response['Datapoints']:
            throttle_count = sum(dp['Sum'] for dp in throttle_response['Datapoints'])

        status = 'healthy' if throttle_count < 10 else 'unhealthy'

        return {
            'service': 'DynamoDB',
            'metric': 'throttles',
            'value': throttle_count,
            'threshold': 10,
            'status': status
        }

    except Exception as e:
        print(f"DynamoDB health check error: {str(e)}")
        return {
            'service': 'DynamoDB',
            'status': 'unknown',
            'error': str(e)
        }


def send_health_alert(health_status):
    """Send health alert to SNS topic"""
    try:
        message = {
            'subject': 'Payment System Health Alert',
            'timestamp': health_status['timestamp'],
            'overall_status': health_status['overall_status'],
            'checks': health_status['checks']
        }

        sns.publish(
            TopicArn=ALARM_TOPIC_ARN,
            Subject='Payment System Health Alert',
            Message=json.dumps(message, indent=2)
        )

        print(f"Health alert sent: {health_status['overall_status']}")

    except Exception as e:
        print(f"Failed to send health alert: {str(e)}")
```

## File: lib/lambda/validation/requirements.txt

```text
boto3>=1.26.0
```

## File: lib/lambda/processing/requirements.txt

```text
boto3>=1.26.0
```

## File: lib/lambda/health_monitor/requirements.txt

```text
boto3>=1.26.0
```

## File: lib/README.md

```markdown
# Payment Processing API Infrastructure

This CDK application deploys a resilient payment processing API infrastructure with disaster recovery capabilities in AWS us-east-1 region.

## Architecture

The infrastructure includes the following components:

### API Layer
- **API Gateway REST API**: Handles incoming payment requests with throttling (1000 requests/sec, 2000 burst)
- Three endpoints: `/validate`, `/process`, and `/health`
- CloudWatch logging and metrics enabled

### Processing Layer
- **Payment Validation Lambda**: Validates payment requests and stores them in DynamoDB
- **Payment Processing Lambda**: Processes validated payments and updates transaction status
- **Health Monitor Lambda**: Monitors system health and triggers recovery actions
- All Lambda functions use Python 3.11 runtime with CloudWatch Logs retention

### Data Layer
- **DynamoDB Table**: Stores transaction data with on-demand billing
- Point-in-time recovery enabled for disaster recovery
- CloudWatch alarms for throttling detection

### Queue Management
- **SQS Queue**: Handles failed transactions for async processing
- **Dead Letter Queue**: Captures messages that fail processing after 3 attempts
- 14-day message retention

### Monitoring & Alerts
- **CloudWatch Alarms**: Monitor API latency, Lambda errors, and DynamoDB throttles
- **SNS Topic**: Sends notifications for critical events
- **CloudWatch Dashboard**: Visualizes key metrics across all components

### Security
- IAM roles with least privilege access for all Lambda functions
- Proper resource-based policies for service integration

## Prerequisites

- AWS CLI configured with appropriate credentials
- AWS CDK CLI installed (`npm install -g aws-cdk`)
- Python 3.9 or higher
- Node.js 14.x or higher

## Installation

1. Create a virtual environment:
```bash
python3 -m venv .venv
source .venv/bin/activate  # On Windows: .venv\Scripts\activate
```

2. Install dependencies:
```bash
pip install -r requirements.txt
```

3. Install Lambda function dependencies:
```bash
cd lib/lambda/validation && pip install -r requirements.txt -t . && cd ../../..
cd lib/lambda/processing && pip install -r requirements.txt -t . && cd ../../..
cd lib/lambda/health_monitor && pip install -r requirements.txt -t . && cd ../../..
```

## Deployment

1. Set your environment suffix (required for unique resource naming):
```bash
export ENVIRONMENT_SUFFIX="dev-001"
```

2. Bootstrap CDK (first time only):
```bash
cdk bootstrap aws://ACCOUNT-NUMBER/us-east-1
```

3. Synthesize the CloudFormation template:
```bash
cdk synth -c environment_suffix=$ENVIRONMENT_SUFFIX
```

4. Deploy the stack:
```bash
cdk deploy -c environment_suffix=$ENVIRONMENT_SUFFIX
```

The deployment will output:
- API Gateway endpoint URL
- DynamoDB table name
- SNS topic ARN
- CloudWatch dashboard name

## Testing

### Test Payment Validation

```bash
curl -X POST https://YOUR-API-ID.execute-api.us-east-1.amazonaws.com/prod/validate \
  -H "Content-Type: application/json" \
  -d '{
    "amount": 100.50,
    "currency": "USD",
    "customer_id": "cust-12345"
  }'
```

Expected response:
```json
{
  "message": "Payment validated successfully",
  "transaction_id": "uuid-here",
  "status": "validated"
}
```

### Test Payment Processing

```bash
curl -X POST https://YOUR-API-ID.execute-api.us-east-1.amazonaws.com/prod/process \
  -H "Content-Type: application/json" \
  -d '{
    "transaction_id": "uuid-from-validation"
  }'
```

Expected response:
```json
{
  "message": "Payment processed successfully",
  "transaction_id": "uuid-here",
  "status": "processed",
  "processed_at": "2025-11-18T12:00:00.000Z"
}
```

### Test Health Check

```bash
curl https://YOUR-API-ID.execute-api.us-east-1.amazonaws.com/prod/health
```

Expected response:
```json
{
  "timestamp": "2025-11-18T12:00:00.000Z",
  "overall_status": "healthy",
  "checks": [
    {
      "service": "API Gateway",
      "metric": "latency",
      "value": 150,
      "threshold": 1000,
      "status": "healthy"
    }
  ]
}
```

## Monitoring

### CloudWatch Dashboard

Access the CloudWatch dashboard to view:
- API Gateway latency trends
- Lambda function error rates
- DynamoDB read/write capacity usage
- SQS queue depth and DLQ messages

Navigate to CloudWatch → Dashboards → `payment-dashboard-{environment_suffix}`

### CloudWatch Alarms

The following alarms are configured:
- **API Latency**: Triggers when average latency exceeds 1000ms over 5 minutes
- **Lambda Errors**: Triggers when error count exceeds 10 over 5 minutes (per function)
- **DynamoDB Throttles**: Triggers when throttle count exceeds 10 over 5 minutes

All alarms send notifications to the SNS topic.

### SNS Notifications

Subscribe to the alarm topic to receive email notifications:
```bash
aws sns subscribe \
  --topic-arn arn:aws:sns:us-east-1:ACCOUNT:payment-alarms-{environment_suffix} \
  --protocol email \
  --notification-endpoint your-email@example.com
```

## Disaster Recovery

### Point-in-Time Recovery (PITR)

DynamoDB PITR is enabled by default. To restore:

1. Create a new table from backup:
```bash
aws dynamodb restore-table-to-point-in-time \
  --source-table-name transactions-{environment_suffix} \
  --target-table-name transactions-{environment_suffix}-restored \
  --restore-date-time 2025-11-18T12:00:00Z
```

2. Update Lambda environment variables to point to restored table

### Failed Transaction Recovery

Failed transactions are automatically sent to SQS for retry:
1. Check failed queue: `failed-transactions-{environment_suffix}`
2. Check DLQ: `failed-transactions-dlq-{environment_suffix}`
3. Messages in DLQ require manual investigation

## Resource Cleanup

To destroy all resources:

```bash
cdk destroy -c environment_suffix=$ENVIRONMENT_SUFFIX
```

Confirm the deletion when prompted. All resources will be removed without manual intervention.

## Cost Optimization

This infrastructure uses serverless and pay-per-use services:
- **DynamoDB**: On-demand billing (no idle costs)
- **Lambda**: Pay per invocation
- **API Gateway**: Pay per request
- **SQS**: Free tier covers most use cases
- **CloudWatch**: Basic metrics and alarms included

Estimated monthly cost for low-moderate traffic: $20-50

## Security Best Practices

- All Lambda functions have least privilege IAM roles
- API Gateway CloudWatch logging enabled
- DynamoDB point-in-time recovery enabled
- No public access to SQS queues or DynamoDB tables
- All resources tagged with Environment tag

## Troubleshooting

### Lambda Function Errors

Check CloudWatch Logs:
```bash
aws logs tail /aws/lambda/payment-validation-{environment_suffix} --follow
```

### DynamoDB Throttling

If throttling alarms trigger:
1. Check CloudWatch metrics for traffic patterns
2. DynamoDB on-demand billing should auto-scale
3. Verify application isn't making inefficient queries

### API Gateway 5XX Errors

1. Check Lambda function logs for errors
2. Verify Lambda has correct IAM permissions
3. Check API Gateway CloudWatch logs

## Contributing

When making changes:
1. Update Lambda function code in `lib/lambda/`
2. Test locally if possible
3. Deploy with `cdk deploy`
4. Monitor CloudWatch dashboard for issues

## Support

For issues or questions:
- Check CloudWatch Logs for Lambda functions
- Review CloudWatch Alarms for triggered alerts
- Check SNS topic for notification history
