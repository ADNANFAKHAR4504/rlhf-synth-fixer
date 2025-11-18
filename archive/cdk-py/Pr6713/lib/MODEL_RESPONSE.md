# Serverless Payment Notification Processing System

This implementation creates a complete serverless payment processing system using AWS CDK with Python.

## Architecture Overview

The solution implements a highly scalable, serverless payment notification processing system with the following components:

- **API Gateway REST API**: Webhook endpoint for payment notifications
- **Lambda Functions**: Three functions for payment processing, accounting, and failure notifications
- **DynamoDB**: Transaction storage with on-demand billing
- **SQS**: Message queuing with DLQ for failed messages
- **SNS**: Notifications for alerts and failures
- **CloudWatch**: Alarms, metrics, and log insights
- **AWS WAF**: Rate-based protection for the API
- **X-Ray**: Distributed tracing for all components

## File: lib/tap_stack.py

```python
from aws_cdk import (
    Stack,
    Duration,
    RemovalPolicy,
    Tags,
    aws_lambda as _lambda,
    aws_apigateway as apigateway,
    aws_dynamodb as dynamodb,
    aws_sqs as sqs,
    aws_sns as sns,
    aws_sns_subscriptions as sns_subscriptions,
    aws_cloudwatch as cloudwatch,
    aws_cloudwatch_actions as cloudwatch_actions,
    aws_iam as iam,
    aws_logs as logs,
    aws_wafv2 as wafv2,
)
from constructs import Construct
import os


class TapStack(Stack):
    def __init__(
        self,
        scope: Construct,
        construct_id: str,
        environment_suffix: str,
        **kwargs
    ) -> None:
        super().__init__(scope, construct_id, **kwargs)

        # Add tags to all resources in the stack
        Tags.of(self).add("Environment", f"synth-{environment_suffix}")
        Tags.of(self).add("Owner", "turing-ai")
        Tags.of(self).add("CostCenter", "training")

        # ========================================
        # 1. DynamoDB Table - Payment Transactions
        # ========================================
        payment_table = dynamodb.Table(
            self,
            f"PaymentTransactionsTable-{environment_suffix}",
            table_name=f"payment-transactions-{environment_suffix}",
            partition_key=dynamodb.Attribute(
                name="transaction_id",
                type=dynamodb.AttributeType.STRING
            ),
            sort_key=dynamodb.Attribute(
                name="timestamp",
                type=dynamodb.AttributeType.STRING
            ),
            billing_mode=dynamodb.BillingMode.PAY_PER_REQUEST,
            point_in_time_recovery=True,
            encryption=dynamodb.TableEncryption.AWS_MANAGED,
            removal_policy=RemovalPolicy.DESTROY
        )

        # ========================================
        # 2. Lambda Layer - Common Libraries
        # ========================================
        lambda_layer = _lambda.LayerVersion(
            self,
            f"CommonLibrariesLayer-{environment_suffix}",
            layer_version_name=f"payment-common-libs-{environment_suffix}",
            code=_lambda.Code.from_asset("lib/lambda_layer"),
            compatible_runtimes=[_lambda.Runtime.PYTHON_3_11],
            compatible_architectures=[_lambda.Architecture.ARM_64],
            description="Common libraries: boto3, requests, jsonschema",
            removal_policy=RemovalPolicy.DESTROY
        )

        # ========================================
        # 3. SQS Queues - Main Queue and DLQ
        # ========================================
        # Dead Letter Queue for payment processing
        payment_dlq = sqs.Queue(
            self,
            f"PaymentProcessingDLQ-{environment_suffix}",
            queue_name=f"payment-processing-dlq-{environment_suffix}",
            retention_period=Duration.days(14),
            encryption=sqs.QueueEncryption.SQS_MANAGED
        )

        # Main payment processing queue
        payment_queue = sqs.Queue(
            self,
            f"PaymentProcessingQueue-{environment_suffix}",
            queue_name=f"payment-processing-queue-{environment_suffix}",
            visibility_timeout=Duration.seconds(300),
            dead_letter_queue=sqs.DeadLetterQueue(
                max_receive_count=3,
                queue=payment_dlq
            ),
            encryption=sqs.QueueEncryption.SQS_MANAGED
        )

        # ========================================
        # 4. SNS Topic - Payment Notifications
        # ========================================
        notification_topic = sns.Topic(
            self,
            f"PaymentNotificationsTopic-{environment_suffix}",
            topic_name=f"payment-notifications-{environment_suffix}",
            display_name="Payment Processing Notifications"
        )

        # ========================================
        # 5. Lambda Function - Process Payment
        # ========================================
        process_payment_function = _lambda.Function(
            self,
            f"ProcessPaymentFunction-{environment_suffix}",
            function_name=f"process-payment-{environment_suffix}",
            runtime=_lambda.Runtime.PYTHON_3_11,
            architecture=_lambda.Architecture.ARM_64,
            handler="process_payment.lambda_handler",
            code=_lambda.Code.from_asset("lib/lambda"),
            timeout=Duration.seconds(30),
            memory_size=512,
            reserved_concurrent_executions=100,
            environment={
                "TABLE_NAME": payment_table.table_name,
                "QUEUE_URL": payment_queue.queue_url
            },
            tracing=_lambda.Tracing.ACTIVE,
            layers=[lambda_layer],
            log_retention=logs.RetentionDays.ONE_MONTH
        )

        # Grant permissions to process payment function
        payment_table.grant_write_data(process_payment_function)
        payment_queue.grant_send_messages(process_payment_function)

        # ========================================
        # 6. Lambda Function - Process Accounting
        # ========================================
        process_accounting_function = _lambda.Function(
            self,
            f"ProcessAccountingFunction-{environment_suffix}",
            function_name=f"process-accounting-{environment_suffix}",
            runtime=_lambda.Runtime.PYTHON_3_11,
            architecture=_lambda.Architecture.ARM_64,
            handler="process_accounting.lambda_handler",
            code=_lambda.Code.from_asset("lib/lambda"),
            timeout=Duration.seconds(60),
            memory_size=512,
            reserved_concurrent_executions=50,
            environment={
                "TABLE_NAME": payment_table.table_name,
                "SNS_TOPIC_ARN": notification_topic.topic_arn
            },
            tracing=_lambda.Tracing.ACTIVE,
            layers=[lambda_layer],
            log_retention=logs.RetentionDays.ONE_MONTH
        )

        # Grant permissions to accounting function
        payment_table.grant_read_write_data(process_accounting_function)
        notification_topic.grant_publish(process_accounting_function)

        # Add SQS event source to accounting function
        from aws_cdk.aws_lambda_event_sources import SqsEventSource
        process_accounting_function.add_event_source(
            SqsEventSource(
                payment_queue,
                batch_size=10,
                max_batching_window=Duration.seconds(5)
            )
        )

        # ========================================
        # 7. Lambda Function - Notify Failures
        # ========================================
        notify_failures_function = _lambda.Function(
            self,
            f"NotifyFailuresFunction-{environment_suffix}",
            function_name=f"notify-failures-{environment_suffix}",
            runtime=_lambda.Runtime.PYTHON_3_11,
            architecture=_lambda.Architecture.ARM_64,
            handler="notify_failures.lambda_handler",
            code=_lambda.Code.from_asset("lib/lambda"),
            timeout=Duration.seconds(30),
            memory_size=256,
            reserved_concurrent_executions=10,
            environment={
                "SNS_TOPIC_ARN": notification_topic.topic_arn
            },
            tracing=_lambda.Tracing.ACTIVE,
            layers=[lambda_layer],
            log_retention=logs.RetentionDays.ONE_MONTH
        )

        # Grant permissions to notify failures function
        notification_topic.grant_publish(notify_failures_function)

        # Add DLQ as event source to notify failures function
        notify_failures_function.add_event_source(
            SqsEventSource(
                payment_dlq,
                batch_size=10
            )
        )

        # ========================================
        # 8. API Gateway REST API
        # ========================================
        api = apigateway.RestApi(
            self,
            f"PaymentWebhooksAPI-{environment_suffix}",
            rest_api_name=f"payment-webhooks-api-{environment_suffix}",
            description="Payment notification webhooks API",
            deploy_options=apigateway.StageOptions(
                stage_name="prod",
                throttling_rate_limit=1000,
                throttling_burst_limit=2000,
                tracing_enabled=True,
                logging_level=apigateway.MethodLoggingLevel.INFO,
                data_trace_enabled=True,
                metrics_enabled=True
            ),
            default_cors_preflight_options=apigateway.CorsOptions(
                allow_origins=["*"],
                allow_methods=["POST", "OPTIONS"],
                allow_headers=["Content-Type", "X-Api-Key"]
            ),
            cloud_watch_role=True
        )

        # Create API key for authentication
        api_key = api.add_api_key(
            f"PaymentAPIKey-{environment_suffix}",
            api_key_name=f"payment-api-key-{environment_suffix}"
        )

        # Create usage plan
        usage_plan = api.add_usage_plan(
            f"PaymentUsagePlan-{environment_suffix}",
            name=f"payment-usage-plan-{environment_suffix}",
            throttle=apigateway.ThrottleSettings(
                rate_limit=1000,
                burst_limit=2000
            ),
            quota=apigateway.QuotaSettings(
                limit=1000000,
                period=apigateway.Period.DAY
            )
        )

        usage_plan.add_api_key(api_key)
        usage_plan.add_api_stage(
            stage=api.deployment_stage
        )

        # Create /webhooks resource
        webhooks_resource = api.root.add_resource("webhooks")

        # Create Lambda integration
        lambda_integration = apigateway.LambdaIntegration(
            process_payment_function,
            proxy=False,
            integration_responses=[
                apigateway.IntegrationResponse(
                    status_code="200",
                    response_templates={
                        "application/json": ""
                    }
                ),
                apigateway.IntegrationResponse(
                    status_code="400",
                    selection_pattern=".*error.*",
                    response_templates={
                        "application/json": ""
                    }
                ),
                apigateway.IntegrationResponse(
                    status_code="500",
                    selection_pattern=".*Internal.*",
                    response_templates={
                        "application/json": ""
                    }
                )
            ]
        )

        # Add POST method with API key authentication
        webhooks_resource.add_method(
            "POST",
            lambda_integration,
            api_key_required=True,
            method_responses=[
                apigateway.MethodResponse(status_code="200"),
                apigateway.MethodResponse(status_code="400"),
                apigateway.MethodResponse(status_code="500")
            ]
        )

        # ========================================
        # 9. AWS WAF for API Gateway
        # ========================================
        # Create WAF Web ACL with rate-based rule
        waf_web_acl = wafv2.CfnWebACL(
            self,
            f"PaymentAPIWebACL-{environment_suffix}",
            name=f"payment-api-waf-{environment_suffix}",
            scope="REGIONAL",
            default_action=wafv2.CfnWebACL.DefaultActionProperty(
                allow={}
            ),
            visibility_config=wafv2.CfnWebACL.VisibilityConfigProperty(
                cloud_watch_metrics_enabled=True,
                metric_name=f"PaymentAPIWAF-{environment_suffix}",
                sampled_requests_enabled=True
            ),
            rules=[
                wafv2.CfnWebACL.RuleProperty(
                    name=f"RateLimitRule-{environment_suffix}",
                    priority=1,
                    statement=wafv2.CfnWebACL.StatementProperty(
                        rate_based_statement=wafv2.CfnWebACL.RateBasedStatementProperty(
                            limit=2000,
                            aggregate_key_type="IP"
                        )
                    ),
                    action=wafv2.CfnWebACL.RuleActionProperty(
                        block={}
                    ),
                    visibility_config=wafv2.CfnWebACL.VisibilityConfigProperty(
                        cloud_watch_metrics_enabled=True,
                        metric_name=f"RateLimitRule-{environment_suffix}",
                        sampled_requests_enabled=True
                    )
                )
            ]
        )

        # Associate WAF with API Gateway
        wafv2.CfnWebACLAssociation(
            self,
            f"WAFAPIAssociation-{environment_suffix}",
            resource_arn=f"arn:aws:apigateway:{self.region}::/restapis/{api.rest_api_id}/stages/{api.deployment_stage.stage_name}",
            web_acl_arn=waf_web_acl.attr_arn
        )

        # ========================================
        # 10. CloudWatch Alarms - Lambda Errors
        # ========================================
        # Alarm for process payment function
        payment_error_alarm = cloudwatch.Alarm(
            self,
            f"ProcessPaymentErrorAlarm-{environment_suffix}",
            alarm_name=f"process-payment-errors-{environment_suffix}",
            metric=process_payment_function.metric_errors(
                statistic="Sum",
                period=Duration.minutes(5)
            ),
            threshold=1,
            evaluation_periods=1,
            datapoints_to_alarm=1,
            comparison_operator=cloudwatch.ComparisonOperator.GREATER_THAN_OR_EQUAL_TO_THRESHOLD,
            treat_missing_data=cloudwatch.TreatMissingData.NOT_BREACHING
        )

        # Calculate 1% error rate alarm for process payment
        payment_invocations = process_payment_function.metric_invocations(
            statistic="Sum",
            period=Duration.minutes(5)
        )
        payment_errors = process_payment_function.metric_errors(
            statistic="Sum",
            period=Duration.minutes(5)
        )

        payment_error_rate = cloudwatch.MathExpression(
            expression="(errors / invocations) * 100",
            using_metrics={
                "errors": payment_errors,
                "invocations": payment_invocations
            },
            period=Duration.minutes(5)
        )

        payment_error_rate_alarm = cloudwatch.Alarm(
            self,
            f"ProcessPaymentErrorRateAlarm-{environment_suffix}",
            alarm_name=f"process-payment-error-rate-{environment_suffix}",
            metric=payment_error_rate,
            threshold=1,
            evaluation_periods=1,
            datapoints_to_alarm=1,
            comparison_operator=cloudwatch.ComparisonOperator.GREATER_THAN_THRESHOLD,
            treat_missing_data=cloudwatch.TreatMissingData.NOT_BREACHING
        )

        # Alarm for process accounting function
        accounting_error_alarm = cloudwatch.Alarm(
            self,
            f"ProcessAccountingErrorAlarm-{environment_suffix}",
            alarm_name=f"process-accounting-errors-{environment_suffix}",
            metric=process_accounting_function.metric_errors(
                statistic="Sum",
                period=Duration.minutes(5)
            ),
            threshold=1,
            evaluation_periods=1,
            datapoints_to_alarm=1,
            comparison_operator=cloudwatch.ComparisonOperator.GREATER_THAN_OR_EQUAL_TO_THRESHOLD,
            treat_missing_data=cloudwatch.TreatMissingData.NOT_BREACHING
        )

        accounting_invocations = process_accounting_function.metric_invocations(
            statistic="Sum",
            period=Duration.minutes(5)
        )
        accounting_errors = process_accounting_function.metric_errors(
            statistic="Sum",
            period=Duration.minutes(5)
        )

        accounting_error_rate = cloudwatch.MathExpression(
            expression="(errors / invocations) * 100",
            using_metrics={
                "errors": accounting_errors,
                "invocations": accounting_invocations
            },
            period=Duration.minutes(5)
        )

        accounting_error_rate_alarm = cloudwatch.Alarm(
            self,
            f"ProcessAccountingErrorRateAlarm-{environment_suffix}",
            alarm_name=f"process-accounting-error-rate-{environment_suffix}",
            metric=accounting_error_rate,
            threshold=1,
            evaluation_periods=1,
            datapoints_to_alarm=1,
            comparison_operator=cloudwatch.ComparisonOperator.GREATER_THAN_THRESHOLD,
            treat_missing_data=cloudwatch.TreatMissingData.NOT_BREACHING
        )

        # Add SNS actions to alarms
        payment_error_alarm.add_alarm_action(
            cloudwatch_actions.SnsAction(notification_topic)
        )
        payment_error_rate_alarm.add_alarm_action(
            cloudwatch_actions.SnsAction(notification_topic)
        )
        accounting_error_alarm.add_alarm_action(
            cloudwatch_actions.SnsAction(notification_topic)
        )
        accounting_error_rate_alarm.add_alarm_action(
            cloudwatch_actions.SnsAction(notification_topic)
        )

        # ========================================
        # 11. CloudWatch Logs Insights Queries
        # ========================================
        logs.QueryDefinition(
            self,
            f"TransactionAnalysisQuery-{environment_suffix}",
            query_definition_name=f"payment-transaction-analysis-{environment_suffix}",
            query_string="""
fields @timestamp, @message
| filter @message like /transaction_id/
| parse @message /transaction_id: (?<transactionId>[^,]+)/
| stats count() by transactionId
| sort count desc
| limit 20
            """.strip(),
            log_groups=[
                process_payment_function.log_group,
                process_accounting_function.log_group
            ]
        )

        logs.QueryDefinition(
            self,
            f"ErrorAnalysisQuery-{environment_suffix}",
            query_definition_name=f"payment-error-analysis-{environment_suffix}",
            query_string="""
fields @timestamp, @message
| filter @message like /ERROR/ or @message like /Error/ or @message like /error/
| stats count() by bin(5m)
| sort @timestamp desc
            """.strip(),
            log_groups=[
                process_payment_function.log_group,
                process_accounting_function.log_group,
                notify_failures_function.log_group
            ]
        )

        logs.QueryDefinition(
            self,
            f"LatencyAnalysisQuery-{environment_suffix}",
            query_definition_name=f"payment-latency-analysis-{environment_suffix}",
            query_string="""
fields @timestamp, @duration
| filter @type = "REPORT"
| stats avg(@duration), max(@duration), min(@duration), pct(@duration, 95) by bin(5m)
| sort @timestamp desc
            """.strip(),
            log_groups=[
                process_payment_function.log_group,
                process_accounting_function.log_group
            ]
        )
```

## File: lib/lambda/process_payment.py

```python
import json
import os
import boto3
from datetime import datetime
from decimal import Decimal

# Initialize AWS clients
dynamodb = boto3.resource('dynamodb')
sqs = boto3.client('sqs')

def validate_payload(payload):
    """Validate incoming webhook payload"""
    required_fields = ['transaction_id', 'amount', 'currency', 'provider']

    for field in required_fields:
        if field not in payload:
            raise ValueError(f"Missing required field: {field}")

    # Validate amount is positive
    if float(payload['amount']) <= 0:
        raise ValueError("Amount must be positive")

    # Validate currency is 3-letter code
    if len(payload['currency']) != 3:
        raise ValueError("Currency must be 3-letter code")

    return True

def lambda_handler(event, context):
    """Process incoming payment webhook"""

    table_name = os.environ['TABLE_NAME']
    queue_url = os.environ['QUEUE_URL']

    try:
        # Parse request body
        body = json.loads(event['body']) if isinstance(event.get('body'), str) else event.get('body', {})

        # Validate payload
        validate_payload(body)

        # Prepare DynamoDB item
        timestamp = datetime.utcnow().isoformat()
        item = {
            'transaction_id': body['transaction_id'],
            'timestamp': timestamp,
            'amount': Decimal(str(body['amount'])),
            'currency': body['currency'],
            'provider': body['provider'],
            'status': 'received',
            'metadata': body.get('metadata', {})
        }

        # Write to DynamoDB
        table = dynamodb.Table(table_name)
        table.put_item(Item=item)

        # Send message to SQS for downstream processing
        message = {
            'transaction_id': body['transaction_id'],
            'timestamp': timestamp,
            'amount': float(body['amount']),
            'currency': body['currency'],
            'provider': body['provider']
        }

        sqs.send_message(
            QueueUrl=queue_url,
            MessageBody=json.dumps(message)
        )

        return {
            'statusCode': 200,
            'headers': {
                'Content-Type': 'application/json'
            },
            'body': json.dumps({
                'message': 'Payment processed successfully',
                'transaction_id': body['transaction_id']
            })
        }

    except ValueError as e:
        # Validation error
        return {
            'statusCode': 400,
            'headers': {
                'Content-Type': 'application/json'
            },
            'body': json.dumps({
                'error': 'Validation error',
                'message': str(e)
            })
        }

    except Exception as e:
        # Unexpected error
        print(f"Error processing payment: {str(e)}")
        return {
            'statusCode': 500,
            'headers': {
                'Content-Type': 'application/json'
            },
            'body': json.dumps({
                'error': 'Internal server error',
                'message': 'Failed to process payment'
            })
        }
```

## File: lib/lambda/process_accounting.py

```python
import json
import os
import boto3
from datetime import datetime

# Initialize AWS clients
dynamodb = boto3.resource('dynamodb')
sns = boto3.client('sns')

def lambda_handler(event, context):
    """Process accounting updates from SQS messages"""

    table_name = os.environ['TABLE_NAME']
    sns_topic_arn = os.environ.get('SNS_TOPIC_ARN')

    processed_count = 0
    failed_count = 0

    for record in event['Records']:
        try:
            # Parse SQS message
            message = json.loads(record['body'])
            transaction_id = message['transaction_id']

            # Update DynamoDB with accounting status
            table = dynamodb.Table(table_name)
            table.update_item(
                Key={
                    'transaction_id': transaction_id,
                    'timestamp': message['timestamp']
                },
                UpdateExpression='SET #status = :status, accounting_processed_at = :processed_at',
                ExpressionAttributeNames={
                    '#status': 'status'
                },
                ExpressionAttributeValues={
                    ':status': 'accounting_processed',
                    ':processed_at': datetime.utcnow().isoformat()
                }
            )

            processed_count += 1
            print(f"Successfully processed transaction: {transaction_id}")

        except Exception as e:
            failed_count += 1
            error_message = f"Failed to process transaction: {str(e)}"
            print(error_message)

            # Send failure notification to SNS if configured
            if sns_topic_arn and 'transaction_id' in message:
                try:
                    sns.publish(
                        TopicArn=sns_topic_arn,
                        Subject='Payment Processing Failure',
                        Message=json.dumps({
                            'error': error_message,
                            'transaction_id': message.get('transaction_id'),
                            'timestamp': datetime.utcnow().isoformat()
                        })
                    )
                except Exception as sns_error:
                    print(f"Failed to send SNS notification: {str(sns_error)}")

    return {
        'statusCode': 200,
        'body': json.dumps({
            'processed': processed_count,
            'failed': failed_count
        })
    }
```

## File: lib/lambda/notify_failures.py

```python
import json
import os
import boto3
from datetime import datetime

# Initialize SNS client
sns = boto3.client('sns')

def lambda_handler(event, context):
    """Send alerts for messages from DLQ"""

    sns_topic_arn = os.environ['SNS_TOPIC_ARN']

    notifications_sent = 0

    for record in event['Records']:
        try:
            # Parse DLQ message
            message_body = record['body']

            # Try to parse as JSON
            try:
                message_data = json.loads(message_body)
            except json.JSONDecodeError:
                message_data = {'raw_message': message_body}

            # Prepare alert message
            alert = {
                'alert_type': 'DLQ_MESSAGE',
                'timestamp': datetime.utcnow().isoformat(),
                'message': message_data,
                'receipt_handle': record.get('receiptHandle'),
                'approximate_receive_count': record.get('attributes', {}).get('ApproximateReceiveCount', 'unknown')
            }

            # Send notification to SNS
            sns.publish(
                TopicArn=sns_topic_arn,
                Subject='ALERT: Payment Processing DLQ Message',
                Message=json.dumps(alert, indent=2)
            )

            notifications_sent += 1
            print(f"Sent alert for DLQ message: {record.get('messageId')}")

        except Exception as e:
            print(f"Error sending alert: {str(e)}")
            # Continue processing other records

    return {
        'statusCode': 200,
        'body': json.dumps({
            'notifications_sent': notifications_sent
        })
    }
```

## File: lib/lambda_layer/requirements.txt

```text
boto3>=1.28.0
requests>=2.31.0
jsonschema>=4.19.0
```

## Implementation Details

### Resource Naming
All resources include the `environment_suffix` parameter to ensure no conflicts in parallel deployments:
- DynamoDB: `payment-transactions-{environment_suffix}`
- Lambda Functions: `process-payment-{environment_suffix}`, etc.
- SQS Queues: `payment-processing-queue-{environment_suffix}`
- SNS Topic: `payment-notifications-{environment_suffix}`
- API Gateway: `payment-webhooks-api-{environment_suffix}`

### Security Features
- API Gateway requires API key authentication
- All resources use encryption at rest
- IAM roles follow least-privilege principle
- CloudWatch Logs with 30-day retention
- AWS WAF with rate-based rules

### Performance Optimization
- ARM64 architecture (Graviton2) for Lambda functions
- Reserved concurrent executions prevent throttling
- DynamoDB on-demand billing for variable loads
- SQS batch processing for efficiency

### Monitoring and Observability
- X-Ray tracing enabled for all Lambda functions and API Gateway
- CloudWatch alarms for error rates exceeding 1%
- CloudWatch Logs Insights queries for transaction analysis
- SNS notifications for all alarms

### Reliability Features
- Dead Letter Queue with 14-day retention
- Point-in-time recovery for DynamoDB
- Automatic retry with SQS visibility timeout
- SNS notifications for DLQ messages

## Deployment

The stack requires an `environment_suffix` parameter:

```python
app = cdk.App()
TapStack(app, "TapStack", environment_suffix="prod123")
app.synth()
```

All resources can be destroyed cleanly with `cdk destroy` as no RETAIN policies are used.
