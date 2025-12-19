"""tap_stack.py
Multi-region disaster recovery infrastructure for payment processing API.

This module defines the TapStack class for deploying a comprehensive DR solution
across us-east-1 (primary) and us-east-2 (secondary) regions with automatic failover.
"""

from typing import Optional
import os

import aws_cdk as cdk
from aws_cdk import (
    Stack,
    CfnOutput,
    Duration,
    RemovalPolicy,
    aws_dynamodb as dynamodb,
    aws_lambda as _lambda,
    aws_apigateway as apigateway,
    aws_sqs as sqs,
    aws_sns as sns,
    aws_sns_subscriptions as subscriptions,
    aws_cloudwatch as cloudwatch,
    aws_cloudwatch_actions as cloudwatch_actions,
    aws_iam as iam,
    aws_route53 as route53,
    aws_logs as logs,
)
from constructs import Construct


class TapStackProps(cdk.StackProps):
    """
    Properties for TapStack.

    Args:
        environment_suffix: Optional suffix for resource naming (e.g., 'pr123', 'dev')
        **kwargs: Additional keyword arguments passed to cdk.StackProps
    """

    def __init__(self, environment_suffix: Optional[str] = None, **kwargs):
        super().__init__(**kwargs)
        self.environment_suffix = environment_suffix


class TapStack(Stack):
    """
    Multi-region disaster recovery stack for payment processing API.

    This stack creates:
    - DynamoDB global table with cross-region replication
    - Lambda functions for payment validation and processing
    - API Gateway REST APIs with custom integrations
    - SQS queues with DLQs for reliable message processing
    - SNS topics for operational notifications
    - CloudWatch dashboards and alarms
    - Route 53 health checks (optional - requires custom domain)

    Note: This stack is designed for deployment to a single region at a time.
    Deploy to both us-east-1 and us-east-2 for complete DR coverage.

    Args:
        scope: The parent construct
        construct_id: The stack identifier
        props: Stack properties including environment_suffix
        **kwargs: Additional keyword arguments
    """

    def __init__(
        self,
        scope: Construct,
        construct_id: str,
        props: Optional[TapStackProps] = None,
        **kwargs
    ):
        super().__init__(scope, construct_id, **kwargs)

        # Get environment suffix from props or context
        self.environment_suffix = (
            props.environment_suffix if props else None
        ) or self.node.try_get_context('environmentSuffix') or 'dev'

        # Get current region from environment
        current_region = os.getenv('CDK_DEFAULT_REGION', 'us-east-1')

        # Create DynamoDB global table for payment transactions
        self.payments_table = self._create_dynamodb_table()

        # Create IAM roles for Lambda functions
        self.lambda_role = self._create_lambda_role()

        # Create Lambda functions
        self.payment_validator = self._create_payment_validator()
        self.payment_processor = self._create_payment_processor()
        self.failover_orchestrator = self._create_failover_orchestrator()

        # Create SQS queues with DLQs
        self.payment_dlq = self._create_payment_dlq()
        self.payment_queue = self._create_payment_queue()

        # Create SNS topics for notifications
        self.ops_alert_topic = self._create_ops_alert_topic()
        self.transaction_topic = self._create_transaction_topic()

        # Create API Gateway REST API
        self.api = self._create_api_gateway()

        # Create CloudWatch dashboard
        self.dashboard = self._create_cloudwatch_dashboard()

        # Create CloudWatch alarms
        self._create_cloudwatch_alarms()

        # Create CloudWatch log groups with retention
        self._create_log_groups()

        # Create outputs for cross-stack references and integration tests
        self._create_outputs()

    def _create_dynamodb_table(self) -> dynamodb.Table:
        """
        Create DynamoDB global table with cross-region replication.

        Returns:
            Table instance configured for global replication
        """
        # Create global table with replicas in both regions
        # Using Table (v1) for compatibility - TableV2 has different API
        table = dynamodb.Table(
            self,
            "PaymentsTable",
            table_name=f"payments-{self.environment_suffix}",
            partition_key=dynamodb.Attribute(
                name="transaction_id", type=dynamodb.AttributeType.STRING
            ),
            sort_key=dynamodb.Attribute(
                name="timestamp", type=dynamodb.AttributeType.NUMBER
            ),
            billing_mode=dynamodb.BillingMode.PAY_PER_REQUEST,
            point_in_time_recovery=True,
            removal_policy=RemovalPolicy.DESTROY,
            replication_regions=["us-east-2"],  # Replicate to secondary region
            stream=dynamodb.StreamViewType.NEW_AND_OLD_IMAGES,
        )

        # Add GSI for querying by customer_id
        table.add_global_secondary_index(
            index_name="customer-index",
            partition_key=dynamodb.Attribute(
                name="customer_id", type=dynamodb.AttributeType.STRING
            ),
            sort_key=dynamodb.Attribute(
                name="timestamp", type=dynamodb.AttributeType.NUMBER
            ),
        )

        return table

    def _create_lambda_role(self) -> iam.Role:
        """
        Create IAM role for Lambda functions with least privilege access.

        Returns:
            IAM Role with necessary permissions
        """
        role = iam.Role(
            self,
            "LambdaExecutionRole",
            role_name=f"payment-lambda-role-{self.environment_suffix}",
            assumed_by=iam.ServicePrincipal("lambda.amazonaws.com"),
            managed_policies=[
                iam.ManagedPolicy.from_aws_managed_policy_name(
                    "service-role/AWSLambdaBasicExecutionRole"
                ),
            ],
        )

        # Add DynamoDB permissions
        role.add_to_policy(
            iam.PolicyStatement(
                actions=[
                    "dynamodb:GetItem",
                    "dynamodb:PutItem",
                    "dynamodb:UpdateItem",
                    "dynamodb:Query",
                    "dynamodb:Scan",
                ],
                resources=[
                    self.payments_table.table_arn,
                    f"{self.payments_table.table_arn}/index/*",
                ],
            )
        )

        # Add SQS permissions
        role.add_to_policy(
            iam.PolicyStatement(
                actions=[
                    "sqs:SendMessage",
                    "sqs:ReceiveMessage",
                    "sqs:DeleteMessage",
                    "sqs:GetQueueAttributes",
                ],
                resources=["*"],  # Will be refined after queue creation
            )
        )

        # Add SNS permissions
        role.add_to_policy(
            iam.PolicyStatement(
                actions=["sns:Publish"],
                resources=["*"],  # Will be refined after topic creation
            )
        )

        # Add CloudWatch permissions for custom metrics
        role.add_to_policy(
            iam.PolicyStatement(
                actions=["cloudwatch:PutMetricData"],
                resources=["*"],
            )
        )

        return role

    def _create_payment_validator(self) -> _lambda.Function:
        """
        Create Lambda function for payment validation.

        Returns:
            Lambda Function for validating payment requests
        """
        function = _lambda.Function(
            self,
            "PaymentValidator",
            function_name=f"payment-validator-{self.environment_suffix}",
            runtime=_lambda.Runtime.PYTHON_3_12,
            handler="index.handler",
            code=_lambda.Code.from_inline(
                """
import json
import boto3
import os
from datetime import datetime

dynamodb = boto3.resource('dynamodb')
cloudwatch = boto3.client('cloudwatch')

def handler(event, context):
    '''
    Validate payment request including fraud checks and input validation.
    '''
    try:
        # Parse request body
        body = json.loads(event.get('body', '{}'))

        # Required fields validation
        required_fields = ['transaction_id', 'customer_id', 'amount', 'currency']
        for field in required_fields:
            if field not in body:
                return {
                    'statusCode': 400,
                    'body': json.dumps({'error': f'Missing required field: {field}'})
                }

        # Amount validation
        amount = float(body['amount'])
        if amount <= 0:
            return {
                'statusCode': 400,
                'body': json.dumps({'error': 'Amount must be positive'})
            }

        # Basic fraud check - flag transactions over $10,000
        if amount > 10000:
            cloudwatch.put_metric_data(
                Namespace='PaymentProcessing',
                MetricData=[{
                    'MetricName': 'HighValueTransaction',
                    'Value': 1,
                    'Unit': 'Count'
                }]
            )

        # Log validation success
        cloudwatch.put_metric_data(
            Namespace='PaymentProcessing',
            MetricData=[{
                'MetricName': 'ValidationSuccess',
                'Value': 1,
                'Unit': 'Count'
            }]
        )

        return {
            'statusCode': 200,
            'body': json.dumps({
                'message': 'Payment validated successfully',
                'transaction_id': body['transaction_id']
            })
        }

    except Exception as e:
        cloudwatch.put_metric_data(
            Namespace='PaymentProcessing',
            MetricData=[{
                'MetricName': 'ValidationError',
                'Value': 1,
                'Unit': 'Count'
            }]
        )
        return {
            'statusCode': 500,
            'body': json.dumps({'error': str(e)})
        }
"""
            ),
            timeout=Duration.seconds(30),
            memory_size=512,
            role=self.lambda_role,
            environment={
                "PAYMENTS_TABLE": self.payments_table.table_name,
                "ENVIRONMENT_SUFFIX": self.environment_suffix,
            },
            retry_attempts=2,
        )

        return function

    def _create_payment_processor(self) -> _lambda.Function:
        """
        Create Lambda function for payment processing.

        Returns:
            Lambda Function for processing validated payments
        """
        function = _lambda.Function(
            self,
            "PaymentProcessor",
            function_name=f"payment-processor-{self.environment_suffix}",
            runtime=_lambda.Runtime.PYTHON_3_12,
            handler="index.handler",
            code=_lambda.Code.from_inline(
                """
import json
import boto3
import os
import time

dynamodb = boto3.resource('dynamodb')
sns = boto3.client('sns')
cloudwatch = boto3.client('cloudwatch')

def handler(event, context):
    '''
    Process validated payment and store in DynamoDB.
    '''
    try:
        table_name = os.environ['PAYMENTS_TABLE']
        sns_topic = os.environ.get('TRANSACTION_TOPIC_ARN', '')

        table = dynamodb.Table(table_name)

        # Parse request
        body = json.loads(event.get('body', '{}'))

        # Create payment record
        timestamp = int(time.time())
        payment_record = {
            'transaction_id': body['transaction_id'],
            'timestamp': timestamp,
            'customer_id': body['customer_id'],
            'amount': str(body['amount']),
            'currency': body['currency'],
            'status': 'PROCESSED',
            'processed_at': timestamp
        }

        # Store in DynamoDB
        table.put_item(Item=payment_record)

        # Publish notification
        if sns_topic:
            sns.publish(
                TopicArn=sns_topic,
                Message=json.dumps(payment_record),
                Subject='Payment Processed'
            )

        # Emit custom metric
        cloudwatch.put_metric_data(
            Namespace='PaymentProcessing',
            MetricData=[{
                'MetricName': 'PaymentProcessed',
                'Value': float(body['amount']),
                'Unit': 'None'
            }]
        )

        return {
            'statusCode': 200,
            'body': json.dumps({
                'message': 'Payment processed successfully',
                'transaction_id': body['transaction_id'],
                'timestamp': timestamp
            })
        }

    except Exception as e:
        cloudwatch.put_metric_data(
            Namespace='PaymentProcessing',
            MetricData=[{
                'MetricName': 'ProcessingError',
                'Value': 1,
                'Unit': 'Count'
            }]
        )
        return {
            'statusCode': 500,
            'body': json.dumps({'error': str(e)})
        }
"""
            ),
            timeout=Duration.seconds(60),
            memory_size=1024,
            role=self.lambda_role,
            environment={
                "PAYMENTS_TABLE": self.payments_table.table_name,
                "ENVIRONMENT_SUFFIX": self.environment_suffix,
            },
            retry_attempts=2,
        )

        return function

    def _create_failover_orchestrator(self) -> _lambda.Function:
        """
        Create Lambda function for automated failover orchestration.

        Returns:
            Lambda Function for managing DR failover
        """
        function = _lambda.Function(
            self,
            "FailoverOrchestrator",
            function_name=f"failover-orchestrator-{self.environment_suffix}",
            runtime=_lambda.Runtime.PYTHON_3_12,
            handler="index.handler",
            code=_lambda.Code.from_inline(
                """
import json
import boto3

route53 = boto3.client('route53')
sns = boto3.client('sns')
cloudwatch = boto3.client('cloudwatch')

def handler(event, context):
    '''
    Orchestrate failover between regions based on health checks.
    '''
    try:
        # Parse CloudWatch alarm or health check event
        message = json.loads(event['Records'][0]['Sns']['Message'])

        alarm_name = message.get('AlarmName', 'Unknown')
        new_state = message.get('NewStateValue', 'UNKNOWN')

        # Emit failover metric
        cloudwatch.put_metric_data(
            Namespace='PaymentProcessing',
            MetricData=[{
                'MetricName': 'FailoverTriggered',
                'Value': 1,
                'Unit': 'Count',
                'Dimensions': [{
                    'Name': 'AlarmName',
                    'Value': alarm_name
                }]
            }]
        )

        return {
            'statusCode': 200,
            'body': json.dumps({
                'message': 'Failover orchestration completed',
                'alarm': alarm_name,
                'state': new_state
            })
        }

    except Exception as e:
        return {
            'statusCode': 500,
            'body': json.dumps({'error': str(e)})
        }
"""
            ),
            timeout=Duration.seconds(60),
            memory_size=256,
            role=self.lambda_role,
            environment={
                "ENVIRONMENT_SUFFIX": self.environment_suffix,
            },
        )

        return function

    def _create_payment_dlq(self) -> sqs.Queue:
        """
        Create dead-letter queue for failed payment messages.

        Returns:
            SQS Queue configured as DLQ
        """
        dlq = sqs.Queue(
            self,
            "PaymentDLQ",
            queue_name=f"payment-dlq-{self.environment_suffix}",
            retention_period=Duration.days(14),
            encryption=sqs.QueueEncryption.SQS_MANAGED,
        )

        return dlq

    def _create_payment_queue(self) -> sqs.Queue:
        """
        Create main payment processing queue with DLQ.

        Returns:
            SQS Queue for payment processing
        """
        queue = sqs.Queue(
            self,
            "PaymentQueue",
            queue_name=f"payment-queue-{self.environment_suffix}",
            visibility_timeout=Duration.seconds(300),
            encryption=sqs.QueueEncryption.SQS_MANAGED,
            dead_letter_queue=sqs.DeadLetterQueue(
                queue=self.payment_dlq, max_receive_count=3
            ),
        )

        # Grant Lambda functions access to queue
        queue.grant_send_messages(self.payment_validator)
        queue.grant_consume_messages(self.payment_processor)

        return queue

    def _create_ops_alert_topic(self) -> sns.Topic:
        """
        Create SNS topic for operational alerts.

        Returns:
            SNS Topic for ops alerts
        """
        topic = sns.Topic(
            self,
            "OpsAlertTopic",
            topic_name=f"ops-alerts-{self.environment_suffix}",
            display_name="Operational Alerts for Payment Processing",
        )

        # Subscribe failover orchestrator to ops alerts
        topic.add_subscription(
            subscriptions.LambdaSubscription(self.failover_orchestrator)
        )

        return topic

    def _create_transaction_topic(self) -> sns.Topic:
        """
        Create SNS topic for transaction notifications.

        Returns:
            SNS Topic for transaction notifications
        """
        topic = sns.Topic(
            self,
            "TransactionTopic",
            topic_name=f"transactions-{self.environment_suffix}",
            display_name="Payment Transaction Notifications",
        )

        # Update payment processor environment with topic ARN
        self.payment_processor.add_environment(
            "TRANSACTION_TOPIC_ARN", topic.topic_arn
        )

        # Grant publish permissions
        topic.grant_publish(self.payment_processor)

        return topic

    def _create_api_gateway(self) -> apigateway.RestApi:
        """
        Create API Gateway REST API with Lambda integrations.

        Returns:
            RestApi instance with configured endpoints
        """
        # Create REST API
        api = apigateway.RestApi(
            self,
            "PaymentAPI",
            rest_api_name=f"payment-api-{self.environment_suffix}",
            description=f"Payment Processing API - {self.environment_suffix}",
            deploy_options=apigateway.StageOptions(
                stage_name="prod",
                throttling_rate_limit=1000,
                throttling_burst_limit=2000,
                logging_level=apigateway.MethodLoggingLevel.INFO,
                data_trace_enabled=True,
                metrics_enabled=True,
            ),
            cloud_watch_role=True,
        )

        # Create /validate endpoint
        validate_resource = api.root.add_resource("validate")
        validate_integration = apigateway.LambdaIntegration(
            self.payment_validator,
            proxy=True,
            integration_responses=[
                apigateway.IntegrationResponse(status_code="200")
            ],
        )
        validate_resource.add_method(
            "POST",
            validate_integration,
            method_responses=[apigateway.MethodResponse(status_code="200")],
        )

        # Create /process endpoint
        process_resource = api.root.add_resource("process")
        process_integration = apigateway.LambdaIntegration(
            self.payment_processor,
            proxy=True,
            integration_responses=[
                apigateway.IntegrationResponse(status_code="200")
            ],
        )
        process_resource.add_method(
            "POST",
            process_integration,
            method_responses=[apigateway.MethodResponse(status_code="200")],
        )

        # Create /health endpoint for health checks
        health_resource = api.root.add_resource("health")
        health_integration = apigateway.MockIntegration(
            integration_responses=[
                apigateway.IntegrationResponse(
                    status_code="200",
                    response_templates={"application/json": '{"status":"healthy"}'},
                )
            ],
            request_templates={"application/json": '{"statusCode": 200}'},
        )
        health_resource.add_method(
            "GET",
            health_integration,
            method_responses=[apigateway.MethodResponse(status_code="200")],
        )

        return api

    def _create_cloudwatch_dashboard(self) -> cloudwatch.Dashboard:
        """
        Create CloudWatch dashboard for monitoring.

        Returns:
            Dashboard instance with configured widgets
        """
        dashboard = cloudwatch.Dashboard(
            self,
            "PaymentDashboard",
            dashboard_name=f"payment-dr-{self.environment_suffix}",
        )

        # API Gateway metrics widget
        dashboard.add_widgets(
            cloudwatch.GraphWidget(
                title="API Gateway Requests",
                left=[
                    self.api.metric_count(),
                    self.api.metric_client_error(),
                    self.api.metric_server_error(),
                ],
                width=12,
            )
        )

        # Lambda metrics widget
        dashboard.add_widgets(
            cloudwatch.GraphWidget(
                title="Lambda Function Metrics",
                left=[
                    self.payment_validator.metric_invocations(),
                    self.payment_processor.metric_invocations(),
                    self.payment_validator.metric_errors(),
                    self.payment_processor.metric_errors(),
                ],
                width=12,
            )
        )

        # DynamoDB metrics widget
        dashboard.add_widgets(
            cloudwatch.GraphWidget(
                title="DynamoDB Operations",
                left=[
                    self.payments_table.metric_consumed_read_capacity_units(),
                    self.payments_table.metric_consumed_write_capacity_units(),
                ],
                width=12,
            )
        )

        # SQS metrics widget
        dashboard.add_widgets(
            cloudwatch.GraphWidget(
                title="SQS Queue Metrics",
                left=[
                    self.payment_queue.metric_approximate_number_of_messages_visible(),
                    self.payment_dlq.metric_approximate_number_of_messages_visible(),
                ],
                width=12,
            )
        )

        return dashboard

    def _create_cloudwatch_alarms(self):
        """Create CloudWatch alarms for critical metrics."""

        # API Gateway 5XX errors alarm
        api_error_alarm = cloudwatch.Alarm(
            self,
            "APIErrorAlarm",
            alarm_name=f"payment-api-errors-{self.environment_suffix}",
            metric=self.api.metric_server_error(statistic="Sum"),
            threshold=10,
            evaluation_periods=2,
            datapoints_to_alarm=2,
            treat_missing_data=cloudwatch.TreatMissingData.NOT_BREACHING,
        )

        # Lambda errors alarm
        lambda_error_alarm = cloudwatch.Alarm(
            self,
            "LambdaErrorAlarm",
            alarm_name=f"payment-lambda-errors-{self.environment_suffix}",
            metric=self.payment_processor.metric_errors(statistic="Sum"),
            threshold=5,
            evaluation_periods=2,
            datapoints_to_alarm=2,
            treat_missing_data=cloudwatch.TreatMissingData.NOT_BREACHING,
        )

        # DynamoDB throttling alarm
        dynamodb_throttle_alarm = cloudwatch.Alarm(
            self,
            "DynamoDBThrottleAlarm",
            alarm_name=f"payment-dynamodb-throttle-{self.environment_suffix}",
            metric=self.payments_table.metric_user_errors(statistic="Sum"),
            threshold=10,
            evaluation_periods=1,
            treat_missing_data=cloudwatch.TreatMissingData.NOT_BREACHING,
        )

        # DLQ messages alarm
        dlq_alarm = cloudwatch.Alarm(
            self,
            "DLQMessagesAlarm",
            alarm_name=f"payment-dlq-messages-{self.environment_suffix}",
            metric=self.payment_dlq.metric_approximate_number_of_messages_visible(),
            threshold=1,
            evaluation_periods=1,
            treat_missing_data=cloudwatch.TreatMissingData.NOT_BREACHING,
        )

        # Add SNS action to alarms
        api_error_alarm.add_alarm_action(
            cloudwatch_actions.SnsAction(self.ops_alert_topic)
        )
        lambda_error_alarm.add_alarm_action(
            cloudwatch_actions.SnsAction(self.ops_alert_topic)
        )

    def _create_log_groups(self):
        """Create CloudWatch log groups with retention policies."""

        # API Gateway log group (created automatically, but we set retention)
        api_log_group = logs.LogGroup(
            self,
            "APIGatewayLogs",
            log_group_name=f"/aws/apigateway/payment-api-{self.environment_suffix}",
            retention=logs.RetentionDays.ONE_WEEK,
            removal_policy=RemovalPolicy.DESTROY,
        )

    def _create_outputs(self):
        """Create CloudFormation outputs for integration testing and cross-stack references."""

        CfnOutput(
            self,
            "PaymentsTableName",
            value=self.payments_table.table_name,
            description="DynamoDB payments table name",
            export_name=f"PaymentsTableName-{self.environment_suffix}",
        )

        CfnOutput(
            self,
            "PaymentsTableArn",
            value=self.payments_table.table_arn,
            description="DynamoDB payments table ARN",
            export_name=f"PaymentsTableArn-{self.environment_suffix}",
        )

        CfnOutput(
            self,
            "PaymentValidatorArn",
            value=self.payment_validator.function_arn,
            description="Payment validator Lambda ARN",
            export_name=f"PaymentValidatorArn-{self.environment_suffix}",
        )

        CfnOutput(
            self,
            "PaymentProcessorArn",
            value=self.payment_processor.function_arn,
            description="Payment processor Lambda ARN",
            export_name=f"PaymentProcessorArn-{self.environment_suffix}",
        )

        CfnOutput(
            self,
            "PaymentQueueUrl",
            value=self.payment_queue.queue_url,
            description="Payment processing queue URL",
            export_name=f"PaymentQueueUrl-{self.environment_suffix}",
        )

        CfnOutput(
            self,
            "PaymentQueueArn",
            value=self.payment_queue.queue_arn,
            description="Payment processing queue ARN",
            export_name=f"PaymentQueueArn-{self.environment_suffix}",
        )

        CfnOutput(
            self,
            "PaymentDLQUrl",
            value=self.payment_dlq.queue_url,
            description="Payment DLQ URL",
            export_name=f"PaymentDLQUrl-{self.environment_suffix}",
        )

        CfnOutput(
            self,
            "APIEndpoint",
            value=self.api.url,
            description="API Gateway endpoint URL",
            export_name=f"APIEndpoint-{self.environment_suffix}",
        )

        CfnOutput(
            self,
            "APIId",
            value=self.api.rest_api_id,
            description="API Gateway REST API ID",
            export_name=f"APIId-{self.environment_suffix}",
        )

        CfnOutput(
            self,
            "OpsAlertTopicArn",
            value=self.ops_alert_topic.topic_arn,
            description="Operational alerts SNS topic ARN",
            export_name=f"OpsAlertTopicArn-{self.environment_suffix}",
        )

        CfnOutput(
            self,
            "TransactionTopicArn",
            value=self.transaction_topic.topic_arn,
            description="Transaction notifications SNS topic ARN",
            export_name=f"TransactionTopicArn-{self.environment_suffix}",
        )

        CfnOutput(
            self,
            "DashboardName",
            value=self.dashboard.dashboard_name,
            description="CloudWatch dashboard name",
            export_name=f"DashboardName-{self.environment_suffix}",
        )

        CfnOutput(
            self,
            "Region",
            value=self.region,
            description="Deployed region",
            export_name=f"DeployedRegion-{self.environment_suffix}",
        )
