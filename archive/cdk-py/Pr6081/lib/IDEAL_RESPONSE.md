## tap_stack.py

```python

"""
Serverless Payment Processing Infrastructure Stack

This module implements a complete serverless payment webhook processing system
with secure storage, reliable messaging, and comprehensive monitoring.
"""

import json
from typing import Optional

import aws_cdk as cdk
from aws_cdk import (
    Stack,
    Duration,
    RemovalPolicy,
    CfnOutput,
    aws_apigateway as apigateway,
    aws_dynamodb as dynamodb,
    aws_iam as iam,
    aws_kms as kms,
    aws_lambda as lambda_,
    aws_sns as sns,
    aws_sqs as sqs,
    aws_cloudwatch as cloudwatch,
)
from constructs import Construct


class TapStackProps(cdk.StackProps):
    """
    Properties for the TapStack CDK stack.
    
    Args:
        environment_suffix: Environment identifier (e.g., 'dev', 'prod')
        **kwargs: Additional stack properties
    """
    
    def __init__(self, environment_suffix: Optional[str] = None, **kwargs):
        super().__init__(**kwargs)
        self.environment_suffix = environment_suffix


class TapStack(Stack):
    """
    Serverless Payment Processing Infrastructure Stack
    
    Implements a complete payment webhook processing system including:
    - API Gateway for webhook endpoints and transaction queries
    - Lambda functions for payment processing logic
    - DynamoDB for secure transaction storage
    - SQS for reliable message queuing
    - SNS for email notifications
    - KMS for encryption at rest
    - CloudWatch for monitoring and logging
    """
    
    def __init__(
        self,
        scope: Construct,
        construct_id: str,
        props: Optional[TapStackProps] = None,
        **kwargs
    ):
        super().__init__(scope, construct_id, **kwargs)
        
        # Get environment suffix
        self.environment_suffix = (
            props.environment_suffix if props else None
        ) or self.node.try_get_context('environmentSuffix') or 'prod'
        
        # Create common tags
        self.common_tags = {
            'Project': 'ServerlessPaymentAPI',
            'Environment': self.environment_suffix,
            'ManagedBy': 'CDK'
        }
        
        # Apply tags to all resources in this stack
        for key, value in self.common_tags.items():
            cdk.Tags.of(self).add(key, value)
        
        # Create KMS key for encryption
        self.kms_key = self._create_kms_key()
        
        # Create DynamoDB table for transaction storage
        self.transaction_table = self._create_dynamodb_table()
        
        # Create SQS queues for message processing
        self.notification_queue, self.dead_letter_queues = self._create_sqs_queues()
        
        # Create SNS topic for email notifications
        self.sns_topic = self._create_sns_topic()
        
        # Create Lambda functions
        self.lambda_functions = self._create_lambda_functions()
        
        # Create API Gateway
        self.api_gateway = self._create_api_gateway()
        
        # Create CloudWatch monitoring
        self._create_monitoring()
        
        # Create stack outputs
        self._create_outputs()
    
    def _create_kms_key(self) -> kms.Key:
        """Create KMS key for encryption with proper permissions"""
        
        kms_key = kms.Key(
            self,
            f"PaymentSystemKey-{self.environment_suffix}",
            description=f"KMS key for payment system encryption - {self.environment_suffix}",
            enable_key_rotation=True,
            removal_policy=RemovalPolicy.DESTROY,
        )
        
        # Add CloudWatch Logs permissions
        kms_key.add_to_resource_policy(
            iam.PolicyStatement(
                sid="AllowCloudWatchLogs",
                effect=iam.Effect.ALLOW,
                principals=[
                    iam.ServicePrincipal(f"logs.{self.region}.amazonaws.com")
                ],
                actions=[
                    "kms:Encrypt",
                    "kms:Decrypt",
                    "kms:ReEncrypt*",
                    "kms:GenerateDataKey*",
                    "kms:DescribeKey"
                ],
                resources=["*"],
                conditions={
                    "ArnEquals": {
                        "kms:EncryptionContext:aws:logs:arn": f"arn:aws:logs:{self.region}:{self.account}:*"
                    }
                }
            )
        )
        
        # Create KMS alias
        kms.Alias(
            self,
            f"PaymentSystemKeyAlias-{self.environment_suffix}",
            alias_name=f"alias/payment-system-{self.environment_suffix}",
            target_key=kms_key
        )
        
        return kms_key
    
    def _create_dynamodb_table(self) -> dynamodb.Table:
        """Create DynamoDB table for transaction storage"""
        
        table = dynamodb.Table(
            self,
            f"PaymentTransactions-{self.environment_suffix}",
            table_name=f"payment-transactions-{self.environment_suffix}",
            partition_key=dynamodb.Attribute(
                name="transaction_id",
                type=dynamodb.AttributeType.STRING
            ),
            sort_key=dynamodb.Attribute(
                name="timestamp",
                type=dynamodb.AttributeType.STRING
            ),
            billing_mode=dynamodb.BillingMode.PAY_PER_REQUEST,
            encryption=dynamodb.TableEncryption.CUSTOMER_MANAGED,
            encryption_key=self.kms_key,
            point_in_time_recovery_specification=dynamodb.PointInTimeRecoverySpecification(
                point_in_time_recovery_enabled=True
            ),
            stream=dynamodb.StreamViewType.NEW_AND_OLD_IMAGES,
            removal_policy=RemovalPolicy.DESTROY,
        )
        
        return table
    
    def _create_sqs_queues(self) -> tuple[sqs.Queue, dict[str, sqs.Queue]]:
        """Create SQS queues for message processing"""
        
        # Dead letter queues for each Lambda function
        dead_letter_queues = {}
        
        for function_name in ['webhook-processor', 'transaction-reader', 'notification-sender']:
            dlq = sqs.Queue(
                self,
                f"{function_name.title().replace('-', '')}DLQ-{self.environment_suffix}",
                queue_name=f"{function_name}-dlq-{self.environment_suffix}",
                encryption=sqs.QueueEncryption.KMS,
                encryption_master_key=self.kms_key,
                retention_period=Duration.days(14),
                visibility_timeout=Duration.seconds(300),
            )
            dead_letter_queues[function_name] = dlq
        
        # Main notification queue
        notification_queue = sqs.Queue(
            self,
            f"NotificationQueue-{self.environment_suffix}",
            queue_name=f"payment-notifications-{self.environment_suffix}",
            encryption=sqs.QueueEncryption.KMS,
            encryption_master_key=self.kms_key,
            retention_period=Duration.days(14),
            visibility_timeout=Duration.seconds(300),
            receive_message_wait_time=Duration.seconds(20),  # Long polling
        )
        
        return notification_queue, dead_letter_queues
    
    def _create_sns_topic(self) -> sns.Topic:
        """Create SNS topic for email notifications"""
        
        topic = sns.Topic(
            self,
            f"EmailNotifications-{self.environment_suffix}",
            topic_name=f"payment-email-notifications-{self.environment_suffix}",
            master_key=self.kms_key,
        )
        
        return topic
    
    def _create_lambda_functions(self) -> dict[str, lambda_.Function]:
        """Create Lambda functions for payment processing"""
        
        # Common Lambda configuration
        lambda_config = {
            'runtime': lambda_.Runtime.PYTHON_3_11,
            'memory_size': 512,
            'timeout': Duration.seconds(30),
            'environment_encryption': self.kms_key,
            'tracing': lambda_.Tracing.ACTIVE,
            'architecture': lambda_.Architecture.ARM_64,
        }
        
        functions = {}
        
        # Webhook processor Lambda
        webhook_processor_role = self._create_lambda_role(
            'webhook-processor',
            additional_policies=[
                iam.PolicyStatement(
                    effect=iam.Effect.ALLOW,
                    actions=[
                        'dynamodb:PutItem',
                        'dynamodb:UpdateItem'
                    ],
                    resources=[self.transaction_table.table_arn]
                ),
                iam.PolicyStatement(
                    effect=iam.Effect.ALLOW,
                    actions=['sqs:SendMessage'],
                    resources=[
                        self.notification_queue.queue_arn,
                        self.dead_letter_queues['webhook-processor'].queue_arn
                    ]
                )
            ]
        )
        
        functions['webhook_processor'] = lambda_.Function(
            self,
            f"WebhookProcessor-{self.environment_suffix}",
            function_name=f"webhook-processor-{self.environment_suffix}",
            code=lambda_.Code.from_inline("""
import json
import boto3
import os
from datetime import datetime

def handler(event, context):
    try:
        # Parse incoming webhook data
        body = json.loads(event.get('body', '{}'))
        
        # Validate required fields
        required_fields = ['transaction_id', 'amount', 'currency', 'status']
        for field in required_fields:
            if field not in body:
                return {
                    'statusCode': 400,
                    'body': json.dumps({'error': f'Missing required field: {field}'})
                }
        
        # Store transaction in DynamoDB
        dynamodb = boto3.resource('dynamodb')
        table = dynamodb.Table(os.environ['DYNAMODB_TABLE'])
        
        item = {
            'transaction_id': body['transaction_id'],
            'timestamp': datetime.utcnow().isoformat(),
            'amount': body['amount'],
            'currency': body['currency'],
            'status': body['status'],
            'raw_data': json.dumps(body)
        }
        
        table.put_item(Item=item)
        
        # Send notification message
        sqs = boto3.client('sqs')
        sqs.send_message(
            QueueUrl=os.environ['SQS_QUEUE_URL'],
            MessageBody=json.dumps({
                'transaction_id': body['transaction_id'],
                'notification_type': 'payment_received'
            })
        )
        
        return {
            'statusCode': 200,
            'body': json.dumps({'message': 'Payment processed successfully'})
        }
        
    except Exception as e:
        print(f"Error processing webhook: {str(e)}")
        return {
            'statusCode': 500,
            'body': json.dumps({'error': 'Internal server error'})
        }
            """),
            handler='index.handler',
            role=webhook_processor_role,
            environment={
                'DYNAMODB_TABLE': self.transaction_table.table_name,
                'SQS_QUEUE_URL': self.notification_queue.queue_url,
                'KMS_KEY_ID': self.kms_key.key_id
            },
            dead_letter_queue=self.dead_letter_queues['webhook-processor'],
            reserved_concurrent_executions=100,
            **lambda_config
        )
        
        # Transaction reader Lambda
        transaction_reader_role = self._create_lambda_role(
            'transaction-reader',
            additional_policies=[
                iam.PolicyStatement(
                    effect=iam.Effect.ALLOW,
                    actions=[
                        'dynamodb:GetItem',
                        'dynamodb:Query'
                    ],
                    resources=[self.transaction_table.table_arn]
                )
            ]
        )
        
        functions['transaction_reader'] = lambda_.Function(
            self,
            f"TransactionReader-{self.environment_suffix}",
            function_name=f"transaction-reader-{self.environment_suffix}",
            code=lambda_.Code.from_inline("""
import json
import boto3
import os

def handler(event, context):
    try:
        # Extract transaction ID from path parameters
        transaction_id = event.get('pathParameters', {}).get('id')
        
        if not transaction_id:
            return {
                'statusCode': 400,
                'body': json.dumps({'error': 'Missing transaction ID'})
            }
        
        # Query DynamoDB for transaction
        dynamodb = boto3.resource('dynamodb')
        table = dynamodb.Table(os.environ['DYNAMODB_TABLE'])
        
        response = table.query(
            KeyConditionExpression='transaction_id = :tid',
            ExpressionAttributeValues={':tid': transaction_id},
            ScanIndexForward=False,  # Get latest first
            Limit=1
        )
        
        if not response['Items']:
            return {
                'statusCode': 404,
                'body': json.dumps({'error': 'Transaction not found'})
            }
        
        transaction = response['Items'][0]
        
        # Remove sensitive internal fields
        safe_transaction = {
            'transaction_id': transaction['transaction_id'],
            'timestamp': transaction['timestamp'],
            'amount': transaction['amount'],
            'currency': transaction['currency'],
            'status': transaction['status']
        }
        
        return {
            'statusCode': 200,
            'body': json.dumps(safe_transaction)
        }
        
    except Exception as e:
        print(f"Error reading transaction: {str(e)}")
        return {
            'statusCode': 500,
            'body': json.dumps({'error': 'Internal server error'})
        }
            """),
            handler='index.handler',
            role=transaction_reader_role,
            environment={
                'DYNAMODB_TABLE': self.transaction_table.table_name,
                'KMS_KEY_ID': self.kms_key.key_id
            },
            dead_letter_queue=self.dead_letter_queues['transaction-reader'],
            reserved_concurrent_executions=50,
            **lambda_config
        )
        
        # Notification sender Lambda
        notification_sender_role = self._create_lambda_role(
            'notification-sender',
            additional_policies=[
                iam.PolicyStatement(
                    effect=iam.Effect.ALLOW,
                    actions=[
                        'dynamodb:GetItem',
                        'dynamodb:UpdateItem'
                    ],
                    resources=[self.transaction_table.table_arn]
                ),
                iam.PolicyStatement(
                    effect=iam.Effect.ALLOW,
                    actions=['sns:Publish'],
                    resources=[self.sns_topic.topic_arn]
                )
            ]
        )
        
        functions['notification_sender'] = lambda_.Function(
            self,
            f"NotificationSender-{self.environment_suffix}",
            function_name=f"notification-sender-{self.environment_suffix}",
            code=lambda_.Code.from_inline("""
import json
import boto3
import os

def handler(event, context):
    try:
        # Parse request body
        body = json.loads(event.get('body', '{}'))
        transaction_id = event.get('pathParameters', {}).get('id')
        
        if not transaction_id:
            return {
                'statusCode': 400,
                'body': json.dumps({'error': 'Missing transaction ID'})
            }
        
        # Validate email and template
        email = body.get('email')
        template = body.get('template', 'payment_confirmation')
        
        if not email:
            return {
                'statusCode': 400,
                'body': json.dumps({'error': 'Email address required'})
            }
        
        # Get transaction details
        dynamodb = boto3.resource('dynamodb')
        table = dynamodb.Table(os.environ['DYNAMODB_TABLE'])
        
        response = table.query(
            KeyConditionExpression='transaction_id = :tid',
            ExpressionAttributeValues={':tid': transaction_id},
            ScanIndexForward=False,
            Limit=1
        )
        
        if not response['Items']:
            return {
                'statusCode': 404,
                'body': json.dumps({'error': 'Transaction not found'})
            }
        
        transaction = response['Items'][0]
        
        # Send notification
        sns = boto3.client('sns')
        message = {
            'transaction_id': transaction_id,
            'email': email,
            'template': template,
            'amount': transaction['amount'],
            'currency': transaction['currency'],
            'status': transaction['status']
        }
        
        sns.publish(
            TopicArn=os.environ['SNS_TOPIC_ARN'],
            Message=json.dumps(message),
            Subject=f'Payment Notification - {transaction_id}'
        )
        
        return {
            'statusCode': 200,
            'body': json.dumps({'message': 'Notification sent successfully'})
        }
        
    except Exception as e:
        print(f"Error sending notification: {str(e)}")
        return {
            'statusCode': 500,
            'body': json.dumps({'error': 'Internal server error'})
        }
            """),
            handler='index.handler',
            role=notification_sender_role,
            environment={
                'DYNAMODB_TABLE': self.transaction_table.table_name,
                'SNS_TOPIC_ARN': self.sns_topic.topic_arn,
                'KMS_KEY_ID': self.kms_key.key_id
            },
            dead_letter_queue=self.dead_letter_queues['notification-sender'],
            reserved_concurrent_executions=50,
            **lambda_config
        )
        
        return functions
    
    def _create_lambda_role(self, function_name: str, additional_policies: list = None) -> iam.Role:
        """Create IAM role for Lambda function with least privilege"""
        
        role = iam.Role(
            self,
            f"{function_name.title().replace('-', '')}Role-{self.environment_suffix}",
            role_name=f"{function_name}-role-{self.environment_suffix}",
            assumed_by=iam.ServicePrincipal('lambda.amazonaws.com'),
        )
        
        # Basic Lambda execution permissions
        role.add_managed_policy(
            iam.ManagedPolicy.from_aws_managed_policy_name(
                'service-role/AWSLambdaBasicExecutionRole'
            )
        )
        
        # KMS permissions for encryption
        role.add_to_policy(
            iam.PolicyStatement(
                effect=iam.Effect.ALLOW,
                actions=[
                    'kms:Encrypt',
                    'kms:Decrypt',
                    'kms:ReEncrypt*',
                    'kms:GenerateDataKey*',
                    'kms:DescribeKey'
                ],
                resources=[self.kms_key.key_arn]
            )
        )
        
        # X-Ray permissions
        role.add_to_policy(
            iam.PolicyStatement(
                effect=iam.Effect.ALLOW,
                actions=[
                    'xray:PutTraceSegments',
                    'xray:PutTelemetryRecords'
                ],
                resources=['*']
            )
        )
        
        # Add function-specific permissions
        if additional_policies:
            for policy in additional_policies:
                role.add_to_policy(policy)
        
        return role
    
    def _create_api_gateway(self) -> apigateway.RestApi:
        """Create API Gateway for webhook and transaction endpoints"""
        
        # Create API Gateway
        api = apigateway.RestApi(
            self,
            f"PaymentAPI-{self.environment_suffix}",
            rest_api_name=f"payment-api-{self.environment_suffix}",
            description="Serverless Payment Webhook Processing API",
            endpoint_configuration=apigateway.EndpointConfiguration(
                types=[apigateway.EndpointType.REGIONAL]
            ),
            deploy_options=apigateway.StageOptions(
                stage_name='prod',
                metrics_enabled=True,
                logging_level=apigateway.MethodLoggingLevel.INFO,
                data_trace_enabled=True,
                throttling_rate_limit=1000,
                throttling_burst_limit=2000
            )
        )
        
        # Request validators
        validator = api.add_request_validator(
            'payment-validator',
            validate_request_body=True,
            validate_request_parameters=True
        )
        
        # Request models
        webhook_model = api.add_model(
            'WebhookPaymentModel',
            content_type='application/json',
            schema=apigateway.JsonSchema(
                type=apigateway.JsonSchemaType.OBJECT,
                required=['transaction_id', 'amount', 'currency', 'status'],
                properties={
                    'transaction_id': apigateway.JsonSchema(
                        type=apigateway.JsonSchemaType.STRING,
                        pattern='^[a-zA-Z0-9_-]+$'
                    ),
                    'amount': apigateway.JsonSchema(
                        type=apigateway.JsonSchemaType.NUMBER,
                        minimum=0
                    ),
                    'currency': apigateway.JsonSchema(
                        type=apigateway.JsonSchemaType.STRING,
                        enum=['USD', 'EUR', 'GBP']
                    ),
                    'status': apigateway.JsonSchema(
                        type=apigateway.JsonSchemaType.STRING,
                        enum=['pending', 'completed', 'failed']
                    )
                }
            )
        )
        
        notification_model = api.add_model(
            'NotificationModel',
            content_type='application/json',
            schema=apigateway.JsonSchema(
                type=apigateway.JsonSchemaType.OBJECT,
                required=['email', 'template'],
                properties={
                    'email': apigateway.JsonSchema(
                        type=apigateway.JsonSchemaType.STRING,
                        format='email'
                    ),
                    'template': apigateway.JsonSchema(
                        type=apigateway.JsonSchemaType.STRING,
                        enum=['payment_confirmation', 'payment_failed', 'payment_pending']
                    )
                }
            )
        )
        
        # Create resources and methods
        # /webhooks/payment endpoint
        webhooks_resource = api.root.add_resource('webhooks')
        payment_resource = webhooks_resource.add_resource('payment')
        
        payment_resource.add_method(
            'POST',
            apigateway.LambdaIntegration(self.lambda_functions['webhook_processor']),
            authorization_type=apigateway.AuthorizationType.IAM,
            request_validator=validator,
            request_models={
                'application/json': webhook_model
            }
        )
        
        # /transactions/{id} endpoint
        transactions_resource = api.root.add_resource('transactions')
        transaction_id_resource = transactions_resource.add_resource('{id}')
        
        transaction_id_resource.add_method(
            'GET',
            apigateway.LambdaIntegration(self.lambda_functions['transaction_reader']),
            authorization_type=apigateway.AuthorizationType.IAM,
            request_parameters={
                'method.request.path.id': True
            }
        )
        
        # /transactions/{id}/notify endpoint
        notify_resource = transaction_id_resource.add_resource('notify')
        
        notify_resource.add_method(
            'POST',
            apigateway.LambdaIntegration(self.lambda_functions['notification_sender']),
            authorization_type=apigateway.AuthorizationType.IAM,
            request_validator=validator,
            request_models={
                'application/json': notification_model
            },
            request_parameters={
                'method.request.path.id': True
            }
        )
        
        return api
    
    def _create_monitoring(self):
        """Create CloudWatch alarms for monitoring"""
        
        # Lambda error alarms
        for function_name, function in self.lambda_functions.items():
            cloudwatch.Alarm(
                self,
                f"{function_name.title().replace('_', '')}ErrorAlarm-{self.environment_suffix}",
                alarm_name=f"{function.function_name}-errors",
                alarm_description=f"High error rate for {function.function_name}",
                metric=function.metric_errors(period=Duration.minutes(5)),
                threshold=5,
                evaluation_periods=2,
                comparison_operator=cloudwatch.ComparisonOperator.GREATER_THAN_OR_EQUAL_TO_THRESHOLD
            )
            
            cloudwatch.Alarm(
                self,
                f"{function_name.title().replace('_', '')}DurationAlarm-{self.environment_suffix}",
                alarm_name=f"{function.function_name}-duration",
                alarm_description=f"High duration for {function.function_name}",
                metric=function.metric_duration(period=Duration.minutes(5)),
                threshold=10000,  # 10 seconds
                evaluation_periods=3,
                comparison_operator=cloudwatch.ComparisonOperator.GREATER_THAN_OR_EQUAL_TO_THRESHOLD
            )
        
        # API Gateway error alarm
        cloudwatch.Alarm(
            self,
            f"APIGatewayErrorAlarm-{self.environment_suffix}",
            alarm_name=f"{self.api_gateway.rest_api_name}-5xx-errors",
            alarm_description="High 5XX error rate for API Gateway",
            metric=self.api_gateway.metric_server_error(period=Duration.minutes(5)),
            threshold=10,
            evaluation_periods=2,
            comparison_operator=cloudwatch.ComparisonOperator.GREATER_THAN_OR_EQUAL_TO_THRESHOLD
        )
        
        # DynamoDB throttle alarm
        cloudwatch.Alarm(
            self,
            f"DynamoDBThrottleAlarm-{self.environment_suffix}",
            alarm_name=f"{self.transaction_table.table_name}-throttles",
            alarm_description="DynamoDB throttling detected",
            metric=self.transaction_table.metric_throttled_requests_for_operations(
                operations=[dynamodb.Operation.PUT_ITEM, dynamodb.Operation.GET_ITEM],
                period=Duration.minutes(5)
            ),
            threshold=1,
            evaluation_periods=1,
            comparison_operator=cloudwatch.ComparisonOperator.GREATER_THAN_OR_EQUAL_TO_THRESHOLD
        )
    
    def _create_outputs(self):
        """Create CloudFormation outputs"""
        
        CfnOutput(
            self,
            "APIGatewayInvokeURL",
            description="API Gateway invoke URL",
            value=self.api_gateway.url
        )
        
        CfnOutput(
            self,
            "DynamoDBTableName",
            description="DynamoDB table name",
            value=self.transaction_table.table_name
        )
        
        CfnOutput(
            self,
            "SQSQueueURL",
            description="SQS queue URL",
            value=self.notification_queue.queue_url
        )
        
        CfnOutput(
            self,
            "KMSKeyID",
            description="KMS key ID for encryption",
            value=self.kms_key.key_id
        )
        
        CfnOutput(
            self,
            "SNSTopicARN",
            description="SNS topic ARN for email notifications",
            value=self.sns_topic.topic_arn
        )
```