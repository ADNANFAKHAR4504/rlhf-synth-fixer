## tap_stack.py

```python
"""
tap_stack.py

This module defines the TapStack class, the main Pulumi ComponentResource for
the serverless webhook processing system.

It orchestrates the creation of API Gateway, Lambda functions, SQS queues,
EventBridge, DynamoDB, and monitoring components for processing payment webhooks
from multiple providers (Stripe, PayPal, Square).
"""

import json
import os
from typing import Optional

import pulumi
import pulumi_aws as aws
from pulumi import ResourceOptions


class TapStackArgs:
    """
    TapStackArgs defines the input arguments for the TapStack Pulumi component.

    Args:
        environment_suffix (Optional[str]): An optional suffix for identifying
            the deployment environment (e.g., 'dev', 'prod').
        tags (Optional[dict]): Optional default tags to apply to resources.
    """

    def __init__(self, environment_suffix: Optional[str] = None,
                 tags: Optional[dict] = None):
        self.environment_suffix = environment_suffix or 'dev'
        self.tags = tags


class TapStack(pulumi.ComponentResource):
    """
    Represents the main Pulumi component resource for the serverless webhook processing system.

    This component creates:
    - API Gateway for webhook ingestion
    - SQS FIFO queues for each payment provider
    - Lambda functions for webhook validation and processing
    - EventBridge custom event bus for event routing
    - DynamoDB table for idempotency tracking
    - CloudWatch monitoring and SNS alerting

    Args:
        name (str): The logical name of this Pulumi component.
        args (TapStackArgs): Configuration arguments including environment suffix and tags.
        opts (ResourceOptions): Pulumi options.
    """

    def __init__(
        self,
        name: str,
        args: TapStackArgs,
        opts: Optional[ResourceOptions] = None
    ):
        super().__init__('tap:stack:TapStack', name, None, opts)

        self.environment_suffix = args.environment_suffix
        self.tags = args.tags or {}
        
        # Payment providers
        self.providers = ["stripe", "paypal", "square"]
        
        # Create base components
        self._create_dynamodb_table()
        self._create_sqs_queues()
        self._create_eventbridge_bus()
        self._create_sns_topic()
        self._create_lambda_functions()
        self._create_api_gateway()
        self._create_cloudwatch_monitoring()
        
        # Register outputs
        self.register_outputs({
            'api_gateway_endpoint': self.api_endpoint,
            'api_key_id': self.api_key.id,
            'dynamodb_table_name': self.dynamodb_table.name,
            'eventbridge_bus_name': self.event_bus.name,
            'sns_topic_arn': self.sns_topic.arn
        })

    def _create_dynamodb_table(self):
        """Create DynamoDB table for webhook idempotency tracking."""
        self.dynamodb_table = aws.dynamodb.Table(
            f"webhook-processing-{self.environment_suffix}",
            name=f"webhook-processing-{self.environment_suffix}",
            hash_key="webhook_id",
            billing_mode="PAY_PER_REQUEST",
            point_in_time_recovery=aws.dynamodb.TablePointInTimeRecoveryArgs(
                enabled=True
            ),
            attributes=[
                aws.dynamodb.TableAttributeArgs(
                    name="webhook_id",
                    type="S"
                )
            ],
            tags={
                **self.tags,
                "Name": f"webhook-processing-{self.environment_suffix}",
                "Component": "DynamoDB"
            },
            opts=ResourceOptions(parent=self)
        )

    def _create_sqs_queues(self):
        """Create SQS FIFO queues for each payment provider."""
        self.sqs_queues = {}
        self.dlq_queues = {}
        
        for provider in self.providers:
            # Create dead letter queue
            dlq = aws.sqs.Queue(
                f"{provider}-webhook-dlq-{self.environment_suffix}",
                name=f"{provider}-webhook-dlq-{self.environment_suffix}.fifo",
                fifo_queue=True,
                content_based_deduplication=True,
                message_retention_seconds=1209600,  # 14 days
                tags={
                    **self.tags,
                    "Name": f"{provider}-webhook-dlq-{self.environment_suffix}",
                    "Component": "SQS-DLQ",
                    "Provider": provider
                },
                opts=ResourceOptions(parent=self)
            )
            self.dlq_queues[provider] = dlq
            
            # Create main queue
            queue = aws.sqs.Queue(
                f"{provider}-webhook-queue-{self.environment_suffix}",
                name=f"{provider}-webhook-queue-{self.environment_suffix}.fifo",
                fifo_queue=True,
                content_based_deduplication=True,
                visibility_timeout_seconds=300,  # 5 minutes
                redrive_policy=pulumi.Output.all(dlq.arn).apply(
                    lambda args: json.dumps({
                        "deadLetterTargetArn": args[0],
                        "maxReceiveCount": 3
                    })
                ),
                tags={
                    **self.tags,
                    "Name": f"{provider}-webhook-queue-{self.environment_suffix}",
                    "Component": "SQS",
                    "Provider": provider
                },
                opts=ResourceOptions(parent=self)
            )
            self.sqs_queues[provider] = queue

    def _create_eventbridge_bus(self):
        """Create EventBridge custom event bus for payment event routing."""
        self.event_bus = aws.cloudwatch.EventBus(
            f"payment-events-{self.environment_suffix}",
            name=f"payment-events-{self.environment_suffix}",
            tags={
                **self.tags,
                "Name": f"payment-events-{self.environment_suffix}",
                "Component": "EventBridge"
            },
            opts=ResourceOptions(parent=self)
        )
        
        # Create EventBridge rules for different payment thresholds
        self.event_rules = {}
        thresholds = [
            {"name": "small", "min": 0, "max": 100},
            {"name": "medium", "min": 100, "max": 1000},
            {"name": "large", "min": 1000, "max": 10000},
            {"name": "xlarge", "min": 10000, "max": 999999999}
        ]
        
        for threshold in thresholds:
            rule = aws.cloudwatch.EventRule(
                f"payment-{threshold['name']}-{self.environment_suffix}",
                name=f"payment-{threshold['name']}-{self.environment_suffix}",
                event_bus_name=self.event_bus.name,
                event_pattern=json.dumps({
                    "source": ["webhook.processor"],
                    "detail-type": ["Payment Processed"],
                    "detail": {
                        "amount": [{
                            "numeric": [">", threshold["min"], "<=", threshold["max"]]
                        }]
                    }
                }),
                tags={
                    **self.tags,
                    "Name": f"payment-{threshold['name']}-{self.environment_suffix}",
                    "Component": "EventBridge-Rule",
                    "Threshold": threshold['name']
                },
                opts=ResourceOptions(parent=self)
            )
            self.event_rules[threshold['name']] = rule

    def _create_sns_topic(self):
        """Create SNS topic for operational alerts."""
        self.sns_topic = aws.sns.Topic(
            f"webhook-alerts-{self.environment_suffix}",
            name=f"webhook-alerts-{self.environment_suffix}",
            tags={
                **self.tags,
                "Name": f"webhook-alerts-{self.environment_suffix}",
                "Component": "SNS"
            },
            opts=ResourceOptions(parent=self)
        )

    def _create_lambda_functions(self):
        """Create Lambda functions for webhook processing."""
        # Create common Lambda execution role
        self._create_lambda_role()
        
        # Package Lambda code from files in lib/lambda directory
        # Create webhook validator Lambda
        self.webhook_validator = aws.lambda_.Function(
            f"webhook-validator-{self.environment_suffix}",
            name=f"webhook-validator-{self.environment_suffix}",
            runtime="python3.9",
            handler="webhook_validator.webhook_validator_handler",
            memory_size=1024,
            timeout=300,
            code=pulumi.FileArchive("lib/lambda"),
            role=self.lambda_role.arn,
            environment=aws.lambda_.FunctionEnvironmentArgs(
                variables={
                    "STRIPE_QUEUE_URL": self.sqs_queues["stripe"].url,
                    "PAYPAL_QUEUE_URL": self.sqs_queues["paypal"].url,
                    "SQUARE_QUEUE_URL": self.sqs_queues["square"].url,
                    "DYNAMODB_TABLE": self.dynamodb_table.name
                }
            ),
            tracing_config=aws.lambda_.FunctionTracingConfigArgs(mode="Active"),
            tags={
                **self.tags,
                "Name": f"webhook-validator-{self.environment_suffix}",
                "Component": "Lambda"
            },
            opts=ResourceOptions(parent=self)
        )
        
        # Create provider processor Lambdas
        self.provider_processors = {}
        for provider in self.providers:
            processor = aws.lambda_.Function(
                f"{provider}-processor-{self.environment_suffix}",
                name=f"{provider}-processor-{self.environment_suffix}",
                runtime="python3.9",
                handler="provider_processor.provider_processor_handler",
                memory_size=1024,
                timeout=300,
                code=pulumi.FileArchive("lib/lambda"),
                role=self.lambda_role.arn,
                environment=aws.lambda_.FunctionEnvironmentArgs(
                    variables={
                        "PROVIDER": provider,
                        "DYNAMODB_TABLE": self.dynamodb_table.name,
                        "EVENT_BUS_NAME": self.event_bus.name
                    }
                ),
                tracing_config=aws.lambda_.FunctionTracingConfigArgs(mode="Active"),
                tags={
                    **self.tags,
                    "Name": f"{provider}-processor-{self.environment_suffix}",
                    "Component": "Lambda",
                    "Provider": provider
                },
                opts=ResourceOptions(parent=self)
            )
            self.provider_processors[provider] = processor
            
            # Create SQS trigger for the processor
            aws.lambda_.EventSourceMapping(
                f"{provider}-sqs-trigger-{self.environment_suffix}",
                event_source_arn=self.sqs_queues[provider].arn,
                function_name=processor.name,
                batch_size=10,
                opts=ResourceOptions(parent=processor)
            )
        
        # Create event processor Lambda
        self.event_processor = aws.lambda_.Function(
            f"event-processor-{self.environment_suffix}",
            name=f"event-processor-{self.environment_suffix}",
            runtime="python3.9",
            handler="event_processor.event_processor_handler",
            memory_size=1024,
            timeout=300,
            code=pulumi.FileArchive("lib/lambda"),
            role=self.lambda_role.arn,
            environment=aws.lambda_.FunctionEnvironmentArgs(
                variables={
                    "DYNAMODB_TABLE": self.dynamodb_table.name
                }
            ),
            tracing_config=aws.lambda_.FunctionTracingConfigArgs(mode="Active"),
            tags={
                **self.tags,
                "Name": f"event-processor-{self.environment_suffix}",
                "Component": "Lambda"
            },
            opts=ResourceOptions(parent=self)
        )
        
        # Create EventBridge triggers for event processor
        for rule_name, rule in self.event_rules.items():
            # Add permission for EventBridge to invoke Lambda
            aws.lambda_.Permission(
                f"eventbridge-{rule_name}-permission-{self.environment_suffix}",
                action="lambda:InvokeFunction",
                function=self.event_processor.name,
                principal="events.amazonaws.com",
                source_arn=rule.arn,
                opts=ResourceOptions(parent=self.event_processor)
            )
            
            # Create EventBridge target
            aws.cloudwatch.EventTarget(
                f"eventbridge-{rule_name}-target-{self.environment_suffix}",
                rule=rule.name,
                event_bus_name=self.event_bus.name,
                arn=self.event_processor.arn,
                opts=ResourceOptions(parent=rule)
            )

    def _create_lambda_role(self):
        """Create IAM role for Lambda functions with necessary permissions."""
        # Trust policy
        trust_policy = {
            "Version": "2012-10-17",
            "Statement": [
                {
                    "Effect": "Allow",
                    "Principal": {"Service": "lambda.amazonaws.com"},
                    "Action": "sts:AssumeRole"
                }
            ]
        }
        
        # Create role
        self.lambda_role = aws.iam.Role(
            f"webhook-lambda-role-{self.environment_suffix}",
            name=f"webhook-lambda-role-{self.environment_suffix}",
            assume_role_policy=json.dumps(trust_policy),
            tags={
                **self.tags,
                "Name": f"webhook-lambda-role-{self.environment_suffix}",
                "Component": "IAM"
            },
            opts=ResourceOptions(parent=self)
        )
        
        # Attach basic Lambda execution policy
        aws.iam.RolePolicyAttachment(
            f"lambda-basic-execution-{self.environment_suffix}",
            role=self.lambda_role.name,
            policy_arn="arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole",
            opts=ResourceOptions(parent=self.lambda_role)
        )
        
        # Attach X-Ray tracing policy
        aws.iam.RolePolicyAttachment(
            f"lambda-xray-tracing-{self.environment_suffix}",
            role=self.lambda_role.name,
            policy_arn="arn:aws:iam::aws:policy/AWSXRayDaemonWriteAccess",
            opts=ResourceOptions(parent=self.lambda_role)
        )
        
        # Create custom policy for SQS, DynamoDB, and EventBridge access
        custom_policy = aws.iam.Policy(
            f"webhook-lambda-policy-{self.environment_suffix}",
            name=f"webhook-lambda-policy-{self.environment_suffix}",
            policy=pulumi.Output.all(
                self.dynamodb_table.arn,
                *[queue.arn for queue in self.sqs_queues.values()],
                self.event_bus.arn
            ).apply(lambda args: json.dumps({
                "Version": "2012-10-17",
                "Statement": [
                    {
                        "Effect": "Allow",
                        "Action": [
                            "dynamodb:GetItem",
                            "dynamodb:PutItem",
                            "dynamodb:UpdateItem"
                        ],
                        "Resource": args[0]
                    },
                    {
                        "Effect": "Allow",
                        "Action": [
                            "sqs:SendMessage",
                            "sqs:ReceiveMessage",
                            "sqs:DeleteMessage",
                            "sqs:GetQueueAttributes"
                        ],
                        "Resource": args[1:4]  # SQS queue ARNs
                    },
                    {
                        "Effect": "Allow",
                        "Action": [
                            "events:PutEvents"
                        ],
                        "Resource": args[4]  # EventBridge ARN
                    },
                    {
                        "Effect": "Allow",
                        "Action": [
                            "cloudwatch:PutMetricData"
                        ],
                        "Resource": "*"
                    }
                ]
            })),
            tags={
                **self.tags,
                "Name": f"webhook-lambda-policy-{self.environment_suffix}",
                "Component": "IAM"
            },
            opts=ResourceOptions(parent=self)
        )
        
        # Attach custom policy to role
        aws.iam.RolePolicyAttachment(
            f"lambda-custom-policy-{self.environment_suffix}",
            role=self.lambda_role.name,
            policy_arn=custom_policy.arn,
            opts=ResourceOptions(parent=self.lambda_role)
        )

    def _create_api_gateway(self):
        """Create API Gateway for webhook ingestion."""
        # Create API Gateway
        self.api_gateway = aws.apigateway.RestApi(
            f"webhook-api-{self.environment_suffix}",
            name=f"webhook-api-{self.environment_suffix}",
            description="Serverless webhook processing API",
            endpoint_configuration=aws.apigateway.RestApiEndpointConfigurationArgs(
                types="REGIONAL"
            ),
            tags={
                **self.tags,
                "Name": f"webhook-api-{self.environment_suffix}",
                "Component": "API-Gateway"
            },
            opts=ResourceOptions(parent=self)
        )
        
        # Create API key
        self.api_key = aws.apigateway.ApiKey(
            f"webhook-api-key-{self.environment_suffix}",
            name=f"webhook-api-key-{self.environment_suffix}",
            description="API key for webhook endpoints",
            tags={
                **self.tags,
                "Name": f"webhook-api-key-{self.environment_suffix}",
                "Component": "API-Gateway"
            },
            opts=ResourceOptions(parent=self)
        )
        
        # Create usage plan
        self.usage_plan = aws.apigateway.UsagePlan(
            f"webhook-usage-plan-{self.environment_suffix}",
            name=f"webhook-usage-plan-{self.environment_suffix}",
            description="Usage plan for webhook API",
            quota_settings=aws.apigateway.UsagePlanQuotaSettingsArgs(
                limit=10000,
                period="DAY"
            ),
            throttle_settings=aws.apigateway.UsagePlanThrottleSettingsArgs(
                rate_limit=1000,
                burst_limit=2000
            ),
            tags={
                **self.tags,
                "Name": f"webhook-usage-plan-{self.environment_suffix}",
                "Component": "API-Gateway"
            },
            opts=ResourceOptions(parent=self)
        )
        
        # Create /webhooks resource
        self.webhooks_resource = aws.apigateway.Resource(
            f"webhooks-resource-{self.environment_suffix}",
            rest_api=self.api_gateway.id,
            parent_id=self.api_gateway.root_resource_id,
            path_part="webhooks",
            opts=ResourceOptions(parent=self.api_gateway)
        )
        
        # Create /{provider} resource
        self.provider_resource = aws.apigateway.Resource(
            f"provider-resource-{self.environment_suffix}",
            rest_api=self.api_gateway.id,
            parent_id=self.webhooks_resource.id,
            path_part="{provider}",
            opts=ResourceOptions(parent=self.api_gateway)
        )
        
        # Create POST method
        self.post_method = aws.apigateway.Method(
            f"post-method-{self.environment_suffix}",
            rest_api=self.api_gateway.id,
            resource_id=self.provider_resource.id,
            http_method="POST",
            authorization="NONE",
            api_key_required=True,
            opts=ResourceOptions(parent=self.api_gateway)
        )
        
        # Create Lambda integration
        self.lambda_integration = aws.apigateway.Integration(
            f"lambda-integration-{self.environment_suffix}",
            rest_api=self.api_gateway.id,
            resource_id=self.provider_resource.id,
            http_method=self.post_method.http_method,
            integration_http_method="POST",
            type="AWS_PROXY",
            uri=self.webhook_validator.invoke_arn,
            opts=ResourceOptions(parent=self.api_gateway)
        )
        
        # Grant API Gateway permission to invoke Lambda
        aws.lambda_.Permission(
            f"api-gateway-lambda-permission-{self.environment_suffix}",
            action="lambda:InvokeFunction",
            function=self.webhook_validator.name,
            principal="apigateway.amazonaws.com",
            source_arn=pulumi.Output.all(
                self.api_gateway.id,
                self.api_gateway.execution_arn
            ).apply(lambda args: f"{args[1]}/*/POST/webhooks/*"),
            opts=ResourceOptions(parent=self.webhook_validator)
        )
        
        # Deploy API
        self.deployment = aws.apigateway.Deployment(
            f"api-deployment-{self.environment_suffix}",
            rest_api=self.api_gateway.id,
            opts=ResourceOptions(
                parent=self.api_gateway,
                depends_on=[self.lambda_integration, self.post_method]
            )
        )
        
        # Create API stage
        self.api_stage = aws.apigateway.Stage(
            f"api-stage-{self.environment_suffix}",
            deployment=self.deployment.id,
            rest_api=self.api_gateway.id,
            stage_name="prod",
            tags={
                **self.tags,
                "Name": f"api-stage-{self.environment_suffix}",
                "Component": "API-Gateway"
            },
            opts=ResourceOptions(parent=self.api_gateway)
        )
        
        # Associate API stage with usage plan
        aws.apigateway.UsagePlanKey(
            f"usage-plan-key-{self.environment_suffix}",
            key_id=self.api_key.id,
            key_type="API_KEY",
            usage_plan_id=self.usage_plan.id,
            opts=ResourceOptions(parent=self.usage_plan)
        )
        
        # Export API endpoint
        self.api_endpoint = pulumi.Output.all(
            self.api_gateway.id,
            self.api_stage.stage_name
        ).apply(lambda args: f"https://{args[0]}.execute-api.{os.getenv('AWS_REGION', 'us-east-1')}.amazonaws.com/{args[1]}")

    def _create_cloudwatch_monitoring(self):
        """Create CloudWatch alarms and monitoring."""
        # Create alarms for SQS queue depth
        for provider, queue in self.sqs_queues.items():
            aws.cloudwatch.MetricAlarm(
                f"{provider}-queue-depth-alarm-{self.environment_suffix}",
                name=f"{provider}-queue-depth-alarm-{self.environment_suffix}",
                alarm_description=f"Alarm for {provider} SQS queue depth exceeding 1000",
                comparison_operator="GreaterThanThreshold",
                evaluation_periods=2,
                metric_name="ApproximateNumberOfMessages",
                namespace="AWS/SQS",
                period=300,
                statistic="Average",
                threshold=1000,
                alarm_actions=[self.sns_topic.arn],
                dimensions={
                    "QueueName": queue.name
                },
                tags={
                    **self.tags,
                    "Name": f"{provider}-queue-depth-alarm-{self.environment_suffix}",
                    "Component": "CloudWatch",
                    "Provider": provider
                },
                opts=ResourceOptions(parent=self)
            )
        
        # Create alarms for Lambda errors
        all_lambdas = [self.webhook_validator, self.event_processor] + list(self.provider_processors.values())
        
        for lambda_func in all_lambdas:
            aws.cloudwatch.MetricAlarm(
                f"{lambda_func._name}-error-alarm",
                name=f"{lambda_func._name}-error-alarm",
                alarm_description=f"Alarm for {lambda_func._name} errors exceeding 1",
                comparison_operator="GreaterThanThreshold",
                evaluation_periods=2,
                metric_name="Errors",
                namespace="AWS/Lambda",
                period=300,
                statistic="Sum",
                threshold=1.0,
                alarm_actions=[self.sns_topic.arn],
                dimensions={
                    "FunctionName": lambda_func.name
                },
                tags={
                    **self.tags,
                    "Name": f"{lambda_func._name}-error-alarm",
                    "Component": "CloudWatch"
                },
                opts=ResourceOptions(parent=self)
            )
        
        # Create CloudWatch log groups with 7-day retention
        for lambda_func in all_lambdas:
            aws.cloudwatch.LogGroup(
                f"{lambda_func._name}-log-group",
                name=pulumi.Output.concat("/aws/lambda/", lambda_func.name),
                retention_in_days=7,
                tags={
                    **self.tags,
                    "Name": f"{lambda_func._name}-log-group",
                    "Component": "CloudWatch-Logs"
                },
                opts=ResourceOptions(parent=lambda_func)
            )
```

# lambda/event_processor.py

```python
"""
EventBridge event processing Lambda function.

This function processes events from EventBridge and updates
processing status in DynamoDB for audit and tracking purposes.
"""

import json
import boto3
import os
from datetime import datetime


def event_processor_handler(event, context):
    """Process events from EventBridge and update DynamoDB"""
    try:
        print(f"Processing EventBridge event: {json.dumps(event)}")
        
        # Parse EventBridge event
        detail = event['detail']
        webhook_id = detail['webhook_id']
        provider = detail.get('provider', 'unknown')
        payment_amount = detail.get('amount', 0)
        payment_type = detail.get('payment_type', 'unknown')
        
        # Determine payment category based on amount
        payment_category = categorize_payment(payment_amount)
        
        # Update DynamoDB with additional processing info
        dynamodb = boto3.resource('dynamodb')
        table = dynamodb.Table(os.environ['DYNAMODB_TABLE'])
        
        table.update_item(
            Key={'webhook_id': webhook_id},
            UpdateExpression='SET event_processed = :val, event_timestamp = :ts, payment_category = :cat, final_status = :status',
            ExpressionAttributeValues={
                ':val': True,
                ':ts': datetime.utcnow().isoformat(),
                ':cat': payment_category,
                ':status': 'completed'
            }
        )
        
        print(f"Updated webhook {webhook_id} with event processing info")
        
        # Log payment processing metrics
        log_payment_metrics(provider, payment_amount, payment_category, payment_type)
        
        return {'statusCode': 200, 'message': 'Event processed successfully'}
        
    except Exception as e:
        print(f"Error processing EventBridge event: {str(e)}")
        raise


def categorize_payment(amount):
    """Categorize payment based on amount thresholds"""
    if amount <= 100:
        return "small"
    elif amount <= 1000:
        return "medium"
    elif amount <= 10000:
        return "large"
    else:
        return "xlarge"


def log_payment_metrics(provider, amount, category, payment_type):
    """Log payment processing metrics for monitoring"""
    try:
        # In production, this could send custom metrics to CloudWatch
        cloudwatch = boto3.client('cloudwatch')
        
        cloudwatch.put_metric_data(
            Namespace='WebhookProcessing',
            MetricData=[
                {
                    'MetricName': 'PaymentProcessed',
                    'Dimensions': [
                        {
                            'Name': 'Provider',
                            'Value': provider
                        },
                        {
                            'Name': 'Category',
                            'Value': category
                        },
                        {
                            'Name': 'PaymentType', 
                            'Value': payment_type
                        }
                    ],
                    'Value': 1,
                    'Unit': 'Count',
                    'Timestamp': datetime.utcnow()
                },
                {
                    'MetricName': 'PaymentAmount',
                    'Dimensions': [
                        {
                            'Name': 'Provider',
                            'Value': provider
                        }
                    ],
                    'Value': amount,
                    'Unit': 'None',
                    'Timestamp': datetime.utcnow()
                }
            ]
        )
        
        print(f"Logged metrics for {provider} payment of {amount} ({category})")
        
    except Exception as e:
        print(f"Error logging metrics: {str(e)}")
        # Don't raise - metrics logging shouldn't fail the main processing
```

## lambda/provider_processor.py

```python
"""
Provider-specific webhook processing Lambda function.

This function processes webhooks from SQS queues for specific providers,
ensures idempotency via DynamoDB, and publishes events to EventBridge.
"""

import json
import boto3
import os
from datetime import datetime


def provider_processor_handler(event, context):
    """Process webhooks from SQS for specific provider"""
    try:
        provider = os.environ['PROVIDER']
        
        for record in event['Records']:
            # Parse message
            message_body = json.loads(record['body'])
            webhook_id = record['messageAttributes']['webhook_id']['stringValue']
            
            print(f"Processing webhook {webhook_id} for provider {provider}")
            
            # Check idempotency in DynamoDB
            dynamodb = boto3.resource('dynamodb')
            table = dynamodb.Table(os.environ['DYNAMODB_TABLE'])
            
            response = table.get_item(Key={'webhook_id': webhook_id})
            if 'Item' in response:
                print(f"Webhook {webhook_id} already processed, skipping")
                continue
            
            # Process payment (provider-specific logic)
            payment_amount = message_body.get('amount', 0)
            payment_type = message_body.get('type', 'unknown')
            
            # Provider-specific processing logic
            processed_data = process_provider_webhook(provider, message_body)
            
            # Save to DynamoDB for idempotency
            table.put_item(
                Item={
                    'webhook_id': webhook_id,
                    'provider': provider,
                    'status': 'processed',
                    'timestamp': datetime.utcnow().isoformat(),
                    'amount': payment_amount,
                    'payment_type': payment_type,
                    'processed_data': processed_data
                }
            )
            
            # Send to EventBridge
            eventbridge = boto3.client('events')
            eventbridge.put_events(
                Entries=[
                    {
                        'Source': 'webhook.processor',
                        'DetailType': 'Payment Processed',
                        'Detail': json.dumps({
                            'webhook_id': webhook_id,
                            'provider': provider,
                            'amount': payment_amount,
                            'payment_type': payment_type,
                            'timestamp': datetime.utcnow().isoformat(),
                            'processed_data': processed_data
                        }),
                        'EventBusName': os.environ['EVENT_BUS_NAME']
                    }
                ]
            )
            
            print(f"Successfully processed webhook {webhook_id}")
        
        return {'statusCode': 200}
    except Exception as e:
        print(f"Error processing webhooks: {str(e)}")
        raise


def process_provider_webhook(provider, webhook_data):
    """Process webhook data based on provider-specific logic"""
    
    if provider == 'stripe':
        return {
            'stripe_event_type': webhook_data.get('type'),
            'stripe_object_id': webhook_data.get('data', {}).get('object', {}).get('id'),
            'currency': webhook_data.get('data', {}).get('object', {}).get('currency', 'usd')
        }
    
    elif provider == 'paypal':
        return {
            'paypal_event_type': webhook_data.get('event_type'),
            'paypal_transaction_id': webhook_data.get('resource', {}).get('id'),
            'payment_state': webhook_data.get('resource', {}).get('state', 'unknown')
        }
    
    elif provider == 'square':
        return {
            'square_event_type': webhook_data.get('type'),
            'square_payment_id': webhook_data.get('data', {}).get('object', {}).get('payment', {}).get('id'),
            'location_id': webhook_data.get('data', {}).get('object', {}).get('payment', {}).get('location_id')
        }
    
    else:
        return {'provider': provider, 'raw_data_keys': list(webhook_data.keys())}
```

## lambda/webhook_validator.py

```python
"""
Webhook validation Lambda function.

This function receives webhook notifications from the API Gateway,
validates the provider, and publishes messages to the appropriate SQS queue.
"""

import json
import boto3
import hashlib
import os
from datetime import datetime


def webhook_validator_handler(event, context):
    """Validate incoming webhooks and publish to appropriate SQS queue"""
    try:
        # Extract provider from path
        provider = event['pathParameters']['provider']
        
        # Validate provider
        if provider not in ['stripe', 'paypal', 'square']:
            return {
                'statusCode': 400,
                'body': json.dumps({'error': 'Invalid provider'})
            }
        
        # Parse webhook body
        body = json.loads(event['body'])
        webhook_id = body.get('id', hashlib.md5(event['body'].encode()).hexdigest())
        
        # Send to SQS
        sqs = boto3.client('sqs')
        queue_url = os.environ[f'{provider.upper()}_QUEUE_URL']
        
        response = sqs.send_message(
            QueueUrl=queue_url,
            MessageBody=event['body'],
            MessageGroupId=provider,
            MessageDeduplicationId=webhook_id,
            MessageAttributes={
                'provider': {'StringValue': provider, 'DataType': 'String'},
                'webhook_id': {'StringValue': webhook_id, 'DataType': 'String'}
            }
        )
        
        print(f"Message sent to {provider} queue: {response['MessageId']}")
        
        return {
            'statusCode': 200,
            'body': json.dumps({
                'message': 'Webhook received',
                'webhook_id': webhook_id,
                'provider': provider
            })
        }
    except Exception as e:
        print(f"Error processing webhook: {str(e)}")
        return {
            'statusCode': 500,
            'body': json.dumps({'error': 'Internal server error'})
        }
```        