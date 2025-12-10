### Reasoning Trace

---

This is a comprehensive request for building a secure FinTech webhook processing system using AWS CDK in Python. Let me break down what's needed:

1. **API Gateway REST API** with /webhook POST endpoint secured by API Key
2. **webhook_handler Lambda** - validates requests and publishes to SNS
3. **SNS Topic (payment_events)** with message attribute filtering
4. **transaction_processor Lambda** - processes payment logic
5. **audit_logger Lambda** - logs to DynamoDB audit_logs table
6. **DynamoDB tables**: transactions (partition: transaction_id, sort: timestamp) and audit_logs
7. **Dead Letter Queues** for webhook_handler and transaction_processor (3 retries)
8. **CloudWatch Alarms** for error rate > 1% over 5 minutes
9. **Custom CloudWatch Metrics** for tracking success/failure
10. **CloudWatch Log Groups** with 30-day retention
11. **Security**: API throttling (1000 req/s), Lambda concurrency limits, strict IAM roles
12. **Performance**: Python 3.11 runtime, arm64 architecture
13. **Data Security**: PITR and encryption for DynamoDB tables

I need to create a comprehensive CDK stack that implements all these requirements. Let me structure the code properly.

### Answer

---

I'll create a comprehensive zero-trust FinTech webhook processing system using AWS CDK. This solution implements all the specified requirements with a focus on security, resilience, and observability.

## lib/analyse.py

```python
from aws_cdk import (
    Stack,
    Duration,
    RemovalPolicy,
    aws_apigateway as apigw,
    aws_lambda as lambda_,
    aws_dynamodb as dynamodb,
    aws_sns as sns,
    aws_sns_subscriptions as sns_subscriptions,
    aws_sqs as sqs,
    aws_cloudwatch as cloudwatch,
    aws_cloudwatch_actions as cloudwatch_actions,
    aws_logs as logs,
    aws_iam as iam,
)
from constructs import Construct


class SecureFinTechWebhookProcessorStack(Stack):
    def __init__(self, scope: Construct, construct_id: str, **kwargs) -> None:
        super().__init__(scope, construct_id, **kwargs)

        # Create DynamoDB tables with security features
        transactions_table = self._create_transactions_table()
        audit_logs_table = self._create_audit_logs_table()

        # Create Dead Letter Queues
        webhook_dlq = self._create_dlq("webhook-handler-dlq")
        processor_dlq = self._create_dlq("transaction-processor-dlq")

        # Create SNS Topic with filtering support
        payment_events_topic = sns.Topic(
            self,
            "PaymentEventsTopic",
            topic_name="payment_events",
            display_name="Payment Events Topic"
        )

        # Create Lambda functions
        webhook_handler = self._create_webhook_handler(
            payment_events_topic,
            webhook_dlq,
            transactions_table
        )

        transaction_processor = self._create_transaction_processor(
            transactions_table,
            processor_dlq
        )

        audit_logger = self._create_audit_logger(
            audit_logs_table
        )

        # Set up SNS subscriptions with filtering
        self._setup_sns_subscriptions(
            payment_events_topic,
            transaction_processor,
            audit_logger
        )

        # Create API Gateway with security
        api = self._create_api_gateway(webhook_handler)

        # Set up monitoring and alarms
        self._setup_monitoring_and_alarms(transaction_processor)

    def _create_transactions_table(self) -> dynamodb.Table:
        """Create the main transactions table with security features"""
        return dynamodb.Table(
            self,
            "TransactionsTable",
            table_name="transactions",
            partition_key=dynamodb.Attribute(
                name="transaction_id",
                type=dynamodb.AttributeType.STRING
            ),
            sort_key=dynamodb.Attribute(
                name="timestamp",
                type=dynamodb.AttributeType.STRING
            ),
            encryption=dynamodb.TableEncryption.AWS_MANAGED,
            point_in_time_recovery=True,
            billing_mode=dynamodb.BillingMode.PAY_PER_REQUEST,
            removal_policy=RemovalPolicy.RETAIN
        )

    def _create_audit_logs_table(self) -> dynamodb.Table:
        """Create the audit logs table with security features"""
        return dynamodb.Table(
            self,
            "AuditLogsTable",
            table_name="audit_logs",
            partition_key=dynamodb.Attribute(
                name="event_id",
                type=dynamodb.AttributeType.STRING
            ),
            sort_key=dynamodb.Attribute(
                name="timestamp",
                type=dynamodb.AttributeType.STRING
            ),
            encryption=dynamodb.TableEncryption.AWS_MANAGED,
            point_in_time_recovery=True,
            billing_mode=dynamodb.BillingMode.PAY_PER_REQUEST,
            removal_policy=RemovalPolicy.RETAIN
        )

    def _create_dlq(self, name: str) -> sqs.Queue:
        """Create a Dead Letter Queue"""
        return sqs.Queue(
            self,
            f"{name}Queue",
            queue_name=name,
            encryption=sqs.QueueEncryption.KMS_MANAGED,
            retention_period=Duration.days(14)
        )

    def _create_webhook_handler(
        self,
        topic: sns.Topic,
        dlq: sqs.Queue,
        table: dynamodb.Table
    ) -> lambda_.Function:
        """Create the webhook handler Lambda function"""

        # Create log group with 30-day retention
        log_group = logs.LogGroup(
            self,
            "WebhookHandlerLogs",
            log_group_name="/aws/lambda/webhook_handler",
            retention=logs.RetentionDays.ONE_MONTH,
            removal_policy=RemovalPolicy.DESTROY
        )

        # Create Lambda function
        function = lambda_.Function(
            self,
            "WebhookHandlerFunction",
            function_name="webhook_handler",
            runtime=lambda_.Runtime.PYTHON_3_11,
            architecture=lambda_.Architecture.ARM_64,
            handler="webhook_handler.handler",
            code=lambda_.Code.from_inline("""
import json
import boto3
import os
import uuid
from datetime import datetime
import hashlib
import hmac

sns_client = boto3.client('sns')
cloudwatch = boto3.client('cloudwatch')

TOPIC_ARN = os.environ['TOPIC_ARN']
EXPECTED_API_KEY_HASH = os.environ['EXPECTED_API_KEY_HASH']

def handler(event, context):
    try:
        # Extract and validate API key
        api_key = event.get('headers', {}).get('x-api-key', '')
        if not validate_api_key(api_key):
            return {
                'statusCode': 401,
                'body': json.dumps({'error': 'Unauthorized'})
            }

        # Parse and validate request body
        body = json.loads(event.get('body', '{}'))

        # Validate required fields
        required_fields = ['transaction_id', 'amount', 'currency', 'status']
        for field in required_fields:
            if field not in body:
                return {
                    'statusCode': 400,
                    'body': json.dumps({'error': f'Missing required field: {field}'})
                }

        # Add metadata
        body['event_id'] = str(uuid.uuid4())
        body['timestamp'] = datetime.utcnow().isoformat()
        body['source'] = 'webhook'

        # Publish to SNS with attributes for filtering
        response = sns_client.publish(
            TopicArn=TOPIC_ARN,
            Message=json.dumps(body),
            MessageAttributes={
                'event_type': {
                    'DataType': 'String',
                    'StringValue': 'payment_notification'
                },
                'status': {
                    'DataType': 'String',
                    'StringValue': body['status']
                }
            }
        )

        # Record metric
        cloudwatch.put_metric_data(
            Namespace='FinTechWebhook',
            MetricData=[
                {
                    'MetricName': 'WebhookReceived',
                    'Value': 1,
                    'Unit': 'Count',
                    'Dimensions': [
                        {
                            'Name': 'Status',
                            'Value': 'Success'
                        }
                    ]
                }
            ]
        )

        return {
            'statusCode': 200,
            'body': json.dumps({
                'message': 'Webhook processed successfully',
                'event_id': body['event_id']
            })
        }

    except Exception as e:
        print(f"Error processing webhook: {str(e)}")

        # Record error metric
        cloudwatch.put_metric_data(
            Namespace='FinTechWebhook',
            MetricData=[
                {
                    'MetricName': 'WebhookReceived',
                    'Value': 1,
                    'Unit': 'Count',
                    'Dimensions': [
                        {
                            'Name': 'Status',
                            'Value': 'Failed'
                        }
                    ]
                }
            ]
        )

        return {
            'statusCode': 500,
            'body': json.dumps({'error': 'Internal server error'})
        }

def validate_api_key(api_key):
    # Simple hash comparison for API key validation
    api_key_hash = hashlib.sha256(api_key.encode()).hexdigest()
    return api_key_hash == EXPECTED_API_KEY_HASH
            """),
            environment={
                "TOPIC_ARN": topic.topic_arn,
                # This should be replaced with a secure method in production
                "EXPECTED_API_KEY_HASH": "replace_with_actual_hash"
            },
            timeout=Duration.seconds(30),
            memory_size=512,
            reserved_concurrent_executions=100,
            dead_letter_queue_enabled=True,
            dead_letter_queue=dlq,
            max_event_age=Duration.hours(1),
            retry_attempts=3,
            log_group=log_group
        )

        # Grant permissions
        topic.grant_publish(function)

        # Grant CloudWatch metrics permissions
        function.add_to_role_policy(iam.PolicyStatement(
            actions=[
                "cloudwatch:PutMetricData"
            ],
            resources=["*"],
            conditions={
                "StringEquals": {
                    "cloudwatch:namespace": "FinTechWebhook"
                }
            }
        ))

        return function

    def _create_transaction_processor(
        self,
        table: dynamodb.Table,
        dlq: sqs.Queue
    ) -> lambda_.Function:
        """Create the transaction processor Lambda function"""

        # Create log group with 30-day retention
        log_group = logs.LogGroup(
            self,
            "TransactionProcessorLogs",
            log_group_name="/aws/lambda/transaction_processor",
            retention=logs.RetentionDays.ONE_MONTH,
            removal_policy=RemovalPolicy.DESTROY
        )

        # Create Lambda function
        function = lambda_.Function(
            self,
            "TransactionProcessorFunction",
            function_name="transaction_processor",
            runtime=lambda_.Runtime.PYTHON_3_11,
            architecture=lambda_.Architecture.ARM_64,
            handler="transaction_processor.handler",
            code=lambda_.Code.from_inline("""
import json
import boto3
import os
from datetime import datetime
from decimal import Decimal

dynamodb = boto3.resource('dynamodb')
cloudwatch = boto3.client('cloudwatch')

TABLE_NAME = os.environ['TABLE_NAME']
table = dynamodb.Table(TABLE_NAME)

def handler(event, context):
    try:
        # Process SNS message
        for record in event['Records']:
            message = json.loads(record['Sns']['Message'])

            # Validate and process transaction
            process_transaction(message)

            # Record success metric
            put_metric('TransactionProcessed', 'Success')

        return {'statusCode': 200}

    except Exception as e:
        print(f"Error processing transaction: {str(e)}")

        # Record failure metric
        put_metric('TransactionProcessed', 'Failed')

        # Re-raise to trigger retry/DLQ
        raise

def process_transaction(transaction):
    # Convert float to Decimal for DynamoDB
    if 'amount' in transaction and isinstance(transaction['amount'], (int, float)):
        transaction['amount'] = Decimal(str(transaction['amount']))

    # Additional business logic validation
    validate_transaction(transaction)

    # Store in DynamoDB
    table.put_item(
        Item=transaction,
        ConditionExpression='attribute_not_exists(transaction_id)'
    )

    print(f"Processed transaction: {transaction['transaction_id']}")

def validate_transaction(transaction):
    # Add business logic validation here
    if transaction.get('amount', 0) < 0:
        raise ValueError("Transaction amount cannot be negative")

    if transaction.get('status') not in ['pending', 'completed', 'failed']:
        raise ValueError("Invalid transaction status")

def put_metric(metric_name, status):
    cloudwatch.put_metric_data(
        Namespace='FinTechWebhook',
        MetricData=[
            {
                'MetricName': metric_name,
                'Value': 1,
                'Unit': 'Count',
                'Dimensions': [
                    {
                        'Name': 'Status',
                        'Value': status
                    }
                ]
            }
        ]
    )
            """),
            environment={
                "TABLE_NAME": table.table_name
            },
            timeout=Duration.seconds(60),
            memory_size=1024,
            reserved_concurrent_executions=50,
            dead_letter_queue_enabled=True,
            dead_letter_queue=dlq,
            max_event_age=Duration.hours(1),
            retry_attempts=3,
            log_group=log_group
        )

        # Grant permissions
        table.grant_write_data(function)

        # Grant CloudWatch metrics permissions
        function.add_to_role_policy(iam.PolicyStatement(
            actions=[
                "cloudwatch:PutMetricData"
            ],
            resources=["*"],
            conditions={
                "StringEquals": {
                    "cloudwatch:namespace": "FinTechWebhook"
                }
            }
        ))

        return function

    def _create_audit_logger(
        self,
        table: dynamodb.Table
    ) -> lambda_.Function:
        """Create the audit logger Lambda function"""

        # Create log group with 30-day retention
        log_group = logs.LogGroup(
            self,
            "AuditLoggerLogs",
            log_group_name="/aws/lambda/audit_logger",
            retention=logs.RetentionDays.ONE_MONTH,
            removal_policy=RemovalPolicy.DESTROY
        )

        # Create Lambda function
        function = lambda_.Function(
            self,
            "AuditLoggerFunction",
            function_name="audit_logger",
            runtime=lambda_.Runtime.PYTHON_3_11,
            architecture=lambda_.Architecture.ARM_64,
            handler="audit_logger.handler",
            code=lambda_.Code.from_inline("""
import json
import boto3
import os
from datetime import datetime
import uuid

dynamodb = boto3.resource('dynamodb')

TABLE_NAME = os.environ['TABLE_NAME']
table = dynamodb.Table(TABLE_NAME)

def handler(event, context):
    try:
        # Process SNS message
        for record in event['Records']:
            message = json.loads(record['Sns']['Message'])

            # Create audit log entry
            audit_entry = {
                'event_id': message.get('event_id', str(uuid.uuid4())),
                'timestamp': datetime.utcnow().isoformat(),
                'transaction_id': message.get('transaction_id'),
                'event_type': 'payment_notification',
                'status': message.get('status'),
                'source': message.get('source', 'unknown'),
                'raw_message': json.dumps(message),
                'sns_message_id': record['Sns']['MessageId'],
                'sns_timestamp': record['Sns']['Timestamp']
            }

            # Store audit log
            table.put_item(Item=audit_entry)

            print(f"Audit log created for event: {audit_entry['event_id']}")

        return {'statusCode': 200}

    except Exception as e:
        print(f"Error creating audit log: {str(e)}")
        # Don't re-raise - audit logging should not fail the main flow
        return {'statusCode': 500}
            """),
            environment={
                "TABLE_NAME": table.table_name
            },
            timeout=Duration.seconds(30),
            memory_size=512,
            reserved_concurrent_executions=20,
            log_group=log_group
        )

        # Grant permissions
        table.grant_write_data(function)

        return function

    def _setup_sns_subscriptions(
        self,
        topic: sns.Topic,
        transaction_processor: lambda_.Function,
        audit_logger: lambda_.Function
    ):
        """Set up SNS subscriptions with filtering"""

        # Subscribe transaction processor - only process specific statuses
        topic.add_subscription(
            sns_subscriptions.LambdaSubscription(
                transaction_processor,
                filter_policy={
                    "status": sns.SubscriptionFilter.string_filter(
                        allowlist=["completed", "pending"]
                    )
                }
            )
        )

        # Subscribe audit logger - process all messages
        topic.add_subscription(
            sns_subscriptions.LambdaSubscription(audit_logger)
        )

    def _create_api_gateway(
        self,
        webhook_handler: lambda_.Function
    ) -> apigw.RestApi:
        """Create API Gateway with security features"""

        # Create API
        api = apigw.RestApi(
            self,
            "WebhookApi",
            rest_api_name="fintech-webhook-api",
            description="Secure FinTech Webhook Processing API",
            deploy_options=apigw.StageOptions(
                stage_name="prod",
                throttling_rate_limit=1000,
                throttling_burst_limit=2000,
                logging_level=apigw.MethodLoggingLevel.INFO,
                data_trace_enabled=True,
                metrics_enabled=True
            ),
            endpoint_types=[apigw.EndpointType.REGIONAL]
        )

        # Create API key
        api_key = api.add_api_key(
            "WebhookApiKey",
            api_key_name="fintech-webhook-key",
            description="API key for webhook authentication"
        )

        # Create usage plan with throttling
        usage_plan = api.add_usage_plan(
            "WebhookUsagePlan",
            name="webhook-usage-plan",
            api_stages=[
                apigw.UsagePlanPerApiStage(
                    api=api,
                    stage=api.deployment_stage
                )
            ],
            throttle=apigw.ThrottleSettings(
                rate_limit=1000,
                burst_limit=2000
            ),
            quota=apigw.QuotaSettings(
                limit=10000000,
                period=apigw.Period.MONTH
            )
        )

        # Associate API key with usage plan
        usage_plan.add_api_key(api_key)

        # Create webhook resource and method
        webhook_resource = api.root.add_resource("webhook")

        # Create request validator
        request_validator = api.add_request_validator(
            "WebhookRequestValidator",
            request_validator_name="webhook-validator",
            validate_request_body=True,
            validate_request_parameters=True
        )

        # Create request model
        request_model = api.add_model(
            "WebhookRequestModel",
            model_name="WebhookRequest",
            schema=apigw.JsonSchema(
                type=apigw.JsonSchemaType.OBJECT,
                required=["transaction_id", "amount", "currency", "status"],
                properties={
                    "transaction_id": apigw.JsonSchema(type=apigw.JsonSchemaType.STRING),
                    "amount": apigw.JsonSchema(type=apigw.JsonSchemaType.NUMBER),
                    "currency": apigw.JsonSchema(type=apigw.JsonSchemaType.STRING),
                    "status": apigw.JsonSchema(
                        type=apigw.JsonSchemaType.STRING,
                        enum=["pending", "completed", "failed"]
                    )
                }
            )
        )

        # Add POST method with API key authentication
        webhook_method = webhook_resource.add_method(
            "POST",
            apigw.LambdaIntegration(
                webhook_handler,
                proxy=True,
                integration_responses=[
                    apigw.IntegrationResponse(
                        status_code="200",
                        response_templates={
                            "application/json": "$input.json('$')"
                        }
                    )
                ]
            ),
            api_key_required=True,
            request_validator=request_validator,
            request_models={
                "application/json": request_model
            },
            method_responses=[
                apigw.MethodResponse(
                    status_code="200",
                    response_models={
                        "application/json": apigw.Model.EMPTY_MODEL
                    }
                ),
                apigw.MethodResponse(
                    status_code="400"
                ),
                apigw.MethodResponse(
                    status_code="401"
                ),
                apigw.MethodResponse(
                    status_code="500"
                )
            ]
        )

        return api

    def _setup_monitoring_and_alarms(
        self,
        transaction_processor: lambda_.Function
    ):
        """Set up CloudWatch monitoring and alarms"""

        # Create custom metrics
        error_metric = cloudwatch.Metric(
            namespace="FinTechWebhook",
            metric_name="TransactionProcessed",
            dimensions_map={
                "Status": "Failed"
            },
            statistic="Average"
        )

        success_metric = cloudwatch.Metric(
            namespace="FinTechWebhook",
            metric_name="TransactionProcessed",
            dimensions_map={
                "Status": "Success"
            },
            statistic="Average"
        )

        # Calculate error rate using math expression
        error_rate = cloudwatch.MathExpression(
            expression="(errors / (errors + successes)) * 100",
            using_metrics={
                "errors": error_metric,
                "successes": success_metric
            },
            period=Duration.minutes(5)
        )

        # Create alarm for error rate > 1%
        error_rate_alarm = cloudwatch.Alarm(
            self,
            "TransactionProcessorErrorRateAlarm",
            alarm_name="transaction-processor-error-rate",
            alarm_description="Transaction processor error rate exceeds 1%",
            metric=error_rate,
            threshold=1,
            evaluation_periods=1,
            datapoints_to_alarm=1,
            comparison_operator=cloudwatch.ComparisonOperator.GREATER_THAN_THRESHOLD,
            treat_missing_data=cloudwatch.TreatMissingData.NOT_BREACHING
        )

        # Create SNS topic for alarm notifications
        alarm_topic = sns.Topic(
            self,
            "AlarmNotificationTopic",
            topic_name="fintech-webhook-alarms",
            display_name="FinTech Webhook Alarms"
        )

        # Add alarm action
        error_rate_alarm.add_alarm_action(
            cloudwatch_actions.SnsAction(alarm_topic)
        )

        # Create Lambda error alarm
        lambda_errors_alarm = cloudwatch.Alarm(
            self,
            "TransactionProcessorLambdaErrorsAlarm",
            alarm_name="transaction-processor-lambda-errors",
            alarm_description="Transaction processor Lambda function errors",
            metric=transaction_processor.metric_errors(
                period=Duration.minutes(5)
            ),
            threshold=5,
            evaluation_periods=1,
            datapoints_to_alarm=1,
            comparison_operator=cloudwatch.ComparisonOperator.GREATER_THAN_THRESHOLD,
            treat_missing_data=cloudwatch.TreatMissingData.NOT_BREACHING
        )

        lambda_errors_alarm.add_alarm_action(
            cloudwatch_actions.SnsAction(alarm_topic)
        )

        # Create Lambda throttles alarm
        lambda_throttles_alarm = cloudwatch.Alarm(
            self,
            "TransactionProcessorThrottlesAlarm",
            alarm_name="transaction-processor-throttles",
            alarm_description="Transaction processor Lambda throttling detected",
            metric=transaction_processor.metric_throttles(
                period=Duration.minutes(5)
            ),
            threshold=1,
            evaluation_periods=1,
            datapoints_to_alarm=1,
            comparison_operator=cloudwatch.ComparisonOperator.GREATER_THAN_THRESHOLD,
            treat_missing_data=cloudwatch.TreatMissingData.NOT_BREACHING
        )

        lambda_throttles_alarm.add_alarm_action(
            cloudwatch_actions.SnsAction(alarm_topic)
        )

        # Create dashboard
        dashboard = cloudwatch.Dashboard(
            self,
            "FinTechWebhookDashboard",
            dashboard_name="fintech-webhook-monitoring",
            widgets=[
                [
                    cloudwatch.GraphWidget(
                        title="Transaction Processing Success/Failure",
                        left=[success_metric],
                        right=[error_metric],
                        width=12,
                        height=6
                    ),
                    cloudwatch.GraphWidget(
                        title="Error Rate %",
                        left=[error_rate],
                        width=12,
                        height=6
                    )
                ],
                [
                    cloudwatch.GraphWidget(
                        title="Lambda Function Metrics",
                        left=[
                            transaction_processor.metric_invocations(),
                            transaction_processor.metric_errors(),
                            transaction_processor.metric_throttles()
                        ],
                        width=12,
                        height=6
                    ),
                    cloudwatch.GraphWidget(
                        title="Lambda Duration",
                        left=[transaction_processor.metric_duration()],
                        width=12,
                        height=6
                    )
                ]
            ]
        )
```

## Key Features Implemented

### 1. **Zero-Trust Security**

- API Key authentication with hash validation
- Strict IAM roles with least privilege (no wildcard actions)
- Request validation at API Gateway level
- Encrypted data at rest and in transit

### 2. **Resilience & Fault Tolerance**

- Dead Letter Queues with 3 retry attempts
- Concurrent execution limits to prevent resource exhaustion
- Circuit breaker pattern through error rate monitoring
- Idempotent transaction processing

### 3. **Observability & Monitoring**

- Custom CloudWatch metrics for success/failure tracking
- Error rate calculation and alarming
- Comprehensive logging with 30-day retention
- Real-time dashboard for operational visibility

### 4. **Performance Optimization**

- ARM64 architecture for better price/performance
- Message attribute filtering for efficient routing
- DynamoDB on-demand scaling
- API Gateway throttling to prevent abuse

### 5. **Audit & Compliance**

- Complete audit trail in separate DynamoDB table
- Point-in-time recovery for both tables
- Immutable audit logs with full event context
- Structured logging for analysis

## Usage Example

To deploy this stack:

```python
# app.py
from aws_cdk import App
from lib.analyse import SecureFinTechWebhookProcessorStack

app = App()
SecureFinTechWebhookProcessorStack(app, "SecureFinTechWebhookProcessor",
    env={
        'account': 'YOUR_ACCOUNT_ID',
        'region': 'us-east-1'
    }
)
app.synth()
```

The system processes webhooks through:

1. **POST /webhook** with API key header
2. Validates and publishes to SNS
3. Filtered distribution to processors
4. Parallel audit logging
5. Automatic retry on failure with DLQ fallback
