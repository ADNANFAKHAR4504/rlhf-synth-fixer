"""
TapStack implementation for serverless fraud detection pipeline.
Creates all infrastructure components including API Gateway, Lambda functions,
DynamoDB, EventBridge, SQS, SNS, IAM roles, and monitoring.
"""
import pulumi
import pulumi_aws as aws
import json
import os
from typing import Optional


class TapStackArgs:
    """Arguments for TapStack."""
    def __init__(self, environment_suffix: str):
        self.environment_suffix = environment_suffix


class TapStack(pulumi.ComponentResource):
    """
    Serverless fraud detection pipeline infrastructure.

    Components:
    - API Gateway REST API with /transactions endpoint
    - DynamoDB table for transaction storage
    - Lambda functions for processing (API, fraud detection, notifications)
    - EventBridge for event routing
    - SQS queues for message handling
    - SNS topic for alerts
    - IAM roles and policies
    - CloudWatch logging and X-Ray tracing
    """

    def __init__(self, name: str, args: TapStackArgs, opts: Optional[pulumi.ResourceOptions] = None):
        super().__init__('custom:infrastructure:TapStack', name, {}, opts)

        self.environment_suffix = args.environment_suffix
        self.lambda_reserved_concurrency = self._resolve_reserved_concurrency()

        # Create KMS key for encryption
        self.kms_key = self._create_kms_key()

        # Create VPC for Lambda functions
        self.vpc = self._create_vpc()

        # Create DynamoDB table
        self.dynamodb_table = self._create_dynamodb_table()

        # Create SQS queues
        self.dlq = self._create_dead_letter_queue()
        self.fraud_queue = self._create_fraud_queue()

        # Create SNS topic
        self.sns_topic = self._create_sns_topic()

        # Create Lambda functions
        self.api_lambda = self._create_api_lambda()
        self.fraud_lambda = self._create_fraud_detection_lambda()
        self.notification_lambda = self._create_notification_lambda()

        # Create EventBridge rule
        self.eventbridge_rule = self._create_eventbridge_rule()

        # Create API Gateway
        self.api_gateway = self._create_api_gateway()

        # Export outputs
        self._export_outputs()

        self.register_outputs({})

    def _create_kms_key(self) -> aws.kms.Key:
        """Create KMS key for encryption."""
        key = aws.kms.Key(
            f"fraud-detection-kms-{self.environment_suffix}",
            description="KMS key for fraud detection pipeline encryption",
            enable_key_rotation=True,
            opts=pulumi.ResourceOptions(parent=self)
        )

        aws.kms.Alias(
            f"fraud-detection-alias-{self.environment_suffix}",
            name=f"alias/fraud-detection-{self.environment_suffix}",
            target_key_id=key.id,
            opts=pulumi.ResourceOptions(parent=self)
        )

        return key

    def _create_vpc(self):
        """Create VPC with private subnets for Lambda functions."""
        vpc = aws.ec2.Vpc(
            f"fraud-vpc-{self.environment_suffix}",
            cidr_block="10.0.0.0/16",
            enable_dns_hostnames=True,
            enable_dns_support=True,
            tags={"Name": f"fraud-vpc-{self.environment_suffix}"},
            opts=pulumi.ResourceOptions(parent=self)
        )

        # Create private subnets
        private_subnet_1 = aws.ec2.Subnet(
            f"fraud-private-subnet-1-{self.environment_suffix}",
            vpc_id=vpc.id,
            cidr_block="10.0.1.0/24",
            availability_zone="us-east-1a",
            tags={"Name": f"fraud-private-subnet-1-{self.environment_suffix}"},
            opts=pulumi.ResourceOptions(parent=self)
        )

        private_subnet_2 = aws.ec2.Subnet(
            f"fraud-private-subnet-2-{self.environment_suffix}",
            vpc_id=vpc.id,
            cidr_block="10.0.2.0/24",
            availability_zone="us-east-1b",
            tags={"Name": f"fraud-private-subnet-2-{self.environment_suffix}"},
            opts=pulumi.ResourceOptions(parent=self)
        )

        # Create security group
        security_group = aws.ec2.SecurityGroup(
            f"fraud-lambda-sg-{self.environment_suffix}",
            vpc_id=vpc.id,
            description="Security group for fraud detection Lambda functions",
            egress=[{
                "protocol": "-1",
                "from_port": 0,
                "to_port": 0,
                "cidr_blocks": ["0.0.0.0/0"],
            }],
            tags={"Name": f"fraud-lambda-sg-{self.environment_suffix}"},
            opts=pulumi.ResourceOptions(parent=self)
        )

        return {
            "vpc": vpc,
            "private_subnets": [private_subnet_1, private_subnet_2],
            "security_group": security_group
        }

    def _create_dynamodb_table(self) -> aws.dynamodb.Table:
        """Create DynamoDB table for transactions."""
        table = aws.dynamodb.Table(
            f"transactions-{self.environment_suffix}",
            name=f"transactions-{self.environment_suffix}",
            billing_mode="PAY_PER_REQUEST",
            hash_key="transaction_id",
            range_key="timestamp",
            attributes=[
                {"name": "transaction_id", "type": "S"},
                {"name": "timestamp", "type": "N"}
            ],
            stream_enabled=True,
            stream_view_type="NEW_IMAGE",
            tags={"Environment": self.environment_suffix},
            opts=pulumi.ResourceOptions(parent=self)
        )

        return table

    def _create_dead_letter_queue(self) -> aws.sqs.Queue:
        """Create dead letter queue for failed messages."""
        dlq = aws.sqs.Queue(
            f"fraud-dlq-{self.environment_suffix}",
            name=f"fraud-dlq-{self.environment_suffix}",
            message_retention_seconds=1209600,  # 14 days
            tags={"Environment": self.environment_suffix},
            opts=pulumi.ResourceOptions(parent=self)
        )

        return dlq

    def _create_fraud_queue(self) -> aws.sqs.Queue:
        """Create SQS queue for suspicious transactions."""
        queue = aws.sqs.Queue(
            f"fraud-queue-{self.environment_suffix}",
            name=f"fraud-queue-{self.environment_suffix}",
            visibility_timeout_seconds=360,  # 6 minutes
            redrive_policy=self.dlq.arn.apply(
                lambda arn: json.dumps({
                    "deadLetterTargetArn": arn,
                    "maxReceiveCount": 3
                })
            ),
            tags={"Environment": self.environment_suffix},
            opts=pulumi.ResourceOptions(parent=self)
        )

        return queue

    def _create_sns_topic(self) -> aws.sns.Topic:
        """Create SNS topic for fraud alerts."""
        topic = aws.sns.Topic(
            f"fraud-alerts-{self.environment_suffix}",
            name=f"fraud-alerts-{self.environment_suffix}",
            display_name="Fraud Detection Alerts",
            tags={"Environment": self.environment_suffix},
            opts=pulumi.ResourceOptions(parent=self)
        )

        # Subscribe email (placeholder - will need actual email)
        # Email subscription - Update this email address before deployment
        # Can be set via environment variable FRAUD_ALERT_EMAIL or config
        alert_email = os.getenv('FRAUD_ALERT_EMAIL', 'security-team@example.com')

        aws.sns.TopicSubscription(
            f"fraud-alert-email-{self.environment_suffix}",
            topic=topic.arn,
            protocol="email",
            endpoint=alert_email,
            opts=pulumi.ResourceOptions(parent=self)
        )

        return topic

    def _create_api_lambda(self) -> aws.lambda_.Function:
        """Create Lambda function for API transaction processing."""
        # Create IAM role
        role = aws.iam.Role(
            f"api-lambda-role-{self.environment_suffix}",
            assume_role_policy=json.dumps({
                "Version": "2012-10-17",
                "Statement": [{
                    "Effect": "Allow",
                    "Principal": {"Service": "lambda.amazonaws.com"},
                    "Action": "sts:AssumeRole"
                }]
            }),
            tags={"Environment": self.environment_suffix},
            opts=pulumi.ResourceOptions(parent=self)
        )

        # Attach basic execution policy
        aws.iam.RolePolicyAttachment(
            f"api-lambda-basic-{self.environment_suffix}",
            role=role.name,
            policy_arn="arn:aws:iam::aws:policy/service-role/AWSLambdaVPCAccessExecutionRole",
            opts=pulumi.ResourceOptions(parent=self)
        )

        # Attach X-Ray policy
        aws.iam.RolePolicyAttachment(
            f"api-lambda-xray-{self.environment_suffix}",
            role=role.name,
            policy_arn="arn:aws:iam::aws:policy/AWSXRayDaemonWriteAccess",
            opts=pulumi.ResourceOptions(parent=self)
        )

        # Create policy for DynamoDB access
        policy = aws.iam.RolePolicy(
            f"api-lambda-policy-{self.environment_suffix}",
            role=role.id,
            policy=pulumi.Output.all(
                self.dynamodb_table.arn,
                self.kms_key.arn
            ).apply(
                lambda args: json.dumps({
                    "Version": "2012-10-17",
                    "Statement": [{
                        "Effect": "Allow",
                        "Action": [
                            "dynamodb:PutItem"
                        ],
                        "Resource": args[0]
                    }, {
                        "Effect": "Allow",
                        "Action": [
                            "kms:Decrypt",
                            "kms:Encrypt",
                            "kms:GenerateDataKey"
                        ],
                        "Resource": args[1]
                    }]
                })
            ),
            opts=pulumi.ResourceOptions(parent=self)
        )

        # Create CloudWatch log group
        log_group = aws.cloudwatch.LogGroup(
            f"api-lambda-logs-{self.environment_suffix}",
            name=f"/aws/lambda/api-transaction-{self.environment_suffix}",
            retention_in_days=7,
            tags={"Environment": self.environment_suffix},
            opts=pulumi.ResourceOptions(parent=self)
        )

        # Create Lambda function
        lambda_args = {
            "name": f"api-transaction-{self.environment_suffix}",
            "runtime": "python3.11",
            "handler": "index.handler",
            "role": role.arn,
            "code": pulumi.AssetArchive({
                "index.py": pulumi.StringAsset("""
import json
import boto3
import os
from datetime import datetime

dynamodb = boto3.resource('dynamodb')
table_name = os.environ['TABLE_NAME']
table = dynamodb.Table(table_name)

def handler(event, context):
    try:
        body = json.loads(event['body'])

        # Validate transaction
        if 'transaction_id' not in body or 'amount' not in body:
            return {
                'statusCode': 400,
                'body': json.dumps({'error': 'Missing required fields'})
            }

        # Store in DynamoDB
        item = {
            'transaction_id': body['transaction_id'],
            'timestamp': int(datetime.now().timestamp() * 1000),
            'amount': body['amount'],
            'user_id': body.get('user_id', 'unknown'),
            'status': 'pending'
        }

        table.put_item(Item=item)

        return {
            'statusCode': 200,
            'body': json.dumps({'message': 'Transaction recorded', 'id': body['transaction_id']})
        }
    except Exception as e:
        print(f"Error: {str(e)}")
        return {
            'statusCode': 500,
            'body': json.dumps({'error': 'Internal server error'})
        }
""")
            }),
            "environment": {
                "variables": {
                    "TABLE_NAME": self.dynamodb_table.name
                }
            },
            "kms_key_arn": self.kms_key.arn,
            "vpc_config": {
                "subnet_ids": [s.id for s in self.vpc["private_subnets"]],
                "security_group_ids": [self.vpc["security_group"].id]
            },
            "tracing_config": {"mode": "Active"},
            "timeout": 60,
            "tags": {"Environment": self.environment_suffix},
            "opts": pulumi.ResourceOptions(parent=self, depends_on=[log_group, policy])
        }

        if self.lambda_reserved_concurrency is not None:
            lambda_args["reserved_concurrent_executions"] = self.lambda_reserved_concurrency

        lambda_func = aws.lambda_.Function(
            f"api-lambda-{self.environment_suffix}",
            **lambda_args
        )

        return lambda_func

    def _create_fraud_detection_lambda(self) -> aws.lambda_.Function:
        """Create Lambda function for fraud detection."""
        # Create IAM role
        role = aws.iam.Role(
            f"fraud-lambda-role-{self.environment_suffix}",
            assume_role_policy=json.dumps({
                "Version": "2012-10-17",
                "Statement": [{
                    "Effect": "Allow",
                    "Principal": {"Service": "lambda.amazonaws.com"},
                    "Action": "sts:AssumeRole"
                }]
            }),
            tags={"Environment": self.environment_suffix},
            opts=pulumi.ResourceOptions(parent=self)
        )

        # Attach policies
        aws.iam.RolePolicyAttachment(
            f"fraud-lambda-basic-{self.environment_suffix}",
            role=role.name,
            policy_arn="arn:aws:iam::aws:policy/service-role/AWSLambdaVPCAccessExecutionRole",
            opts=pulumi.ResourceOptions(parent=self)
        )

        aws.iam.RolePolicyAttachment(
            f"fraud-lambda-xray-{self.environment_suffix}",
            role=role.name,
            policy_arn="arn:aws:iam::aws:policy/AWSXRayDaemonWriteAccess",
            opts=pulumi.ResourceOptions(parent=self)
        )

        # Create policy for SQS access
        policy = aws.iam.RolePolicy(
            f"fraud-lambda-policy-{self.environment_suffix}",
            role=role.id,
            policy=pulumi.Output.all(
                self.fraud_queue.arn,
                self.dynamodb_table.stream_arn
            ).apply(
                lambda args: json.dumps({
                    "Version": "2012-10-17",
                    "Statement": [{
                        "Effect": "Allow",
                        "Action": [
                            "sqs:SendMessage"
                        ],
                        "Resource": args[0]
                    }, {
                        "Effect": "Allow",
                        "Action": [
                            "dynamodb:GetRecords",
                            "dynamodb:GetShardIterator",
                            "dynamodb:DescribeStream",
                            "dynamodb:ListStreams"
                        ],
                        "Resource": args[1]
                    }]
                })
            ),
            opts=pulumi.ResourceOptions(parent=self)
        )

        # Create CloudWatch log group
        log_group = aws.cloudwatch.LogGroup(
            f"fraud-lambda-logs-{self.environment_suffix}",
            name=f"/aws/lambda/fraud-detection-{self.environment_suffix}",
            retention_in_days=7,
            tags={"Environment": self.environment_suffix},
            opts=pulumi.ResourceOptions(parent=self)
        )

        # Create Lambda function
        lambda_args = {
            "name": f"fraud-detection-{self.environment_suffix}",
            "runtime": "python3.11",
            "handler": "index.handler",
            "role": role.arn,
            "code": pulumi.AssetArchive({
                "index.py": pulumi.StringAsset("""
import json
import boto3
import os

sqs = boto3.client('sqs')
queue_url = os.environ['QUEUE_URL']

def handler(event, context):
    try:
        # Process DynamoDB stream records directly
        for record in event['Records']:
            # Only process INSERT events
            if record['eventName'] != 'INSERT':
                continue

            # Extract transaction data from DynamoDB stream
            transaction = record['dynamodb']['NewImage']
            amount = float(transaction['amount']['N'])

            # Simple fraud detection logic
            is_suspicious = amount > 10000 or amount < 0

            if is_suspicious:
                # Send to SQS
                message = {
                    'transaction_id': transaction['transaction_id']['S'],
                    'amount': amount,
                    'reason': 'High amount' if amount > 10000 else 'Negative amount',
                    'timestamp': transaction['timestamp']['N']
                }

                sqs.send_message(
                    QueueUrl=queue_url,
                    MessageBody=json.dumps(message)
                )

                print(f"Suspicious transaction detected: {transaction['transaction_id']['S']}")

        return {'statusCode': 200, 'body': 'Processed'}
    except Exception as e:
        print(f"Error: {str(e)}")
        raise
""")
            }),
            "environment": {
                "variables": {
                    "QUEUE_URL": self.fraud_queue.url,
                    "KMS_KEY_ID": self.kms_key.id
                }
            },
            "kms_key_arn": self.kms_key.arn,
            "vpc_config": {
                "subnet_ids": [s.id for s in self.vpc["private_subnets"]],
                "security_group_ids": [self.vpc["security_group"].id]
            },
            "tracing_config": {"mode": "Active"},
            "timeout": 60,
            "tags": {"Environment": self.environment_suffix},
            "opts": pulumi.ResourceOptions(parent=self, depends_on=[log_group, policy])
        }

        if self.lambda_reserved_concurrency is not None:
            lambda_args["reserved_concurrent_executions"] = self.lambda_reserved_concurrency

        lambda_func = aws.lambda_.Function(
            f"fraud-lambda-{self.environment_suffix}",
            **lambda_args
        )

        return lambda_func

    def _create_notification_lambda(self) -> aws.lambda_.Function:
        """Create Lambda function for sending notifications."""
        # Create IAM role
        role = aws.iam.Role(
            f"notification-lambda-role-{self.environment_suffix}",
            assume_role_policy=json.dumps({
                "Version": "2012-10-17",
                "Statement": [{
                    "Effect": "Allow",
                    "Principal": {"Service": "lambda.amazonaws.com"},
                    "Action": "sts:AssumeRole"
                }]
            }),
            tags={"Environment": self.environment_suffix},
            opts=pulumi.ResourceOptions(parent=self)
        )

        # Attach policies
        aws.iam.RolePolicyAttachment(
            f"notification-lambda-basic-{self.environment_suffix}",
            role=role.name,
            policy_arn="arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole",
            opts=pulumi.ResourceOptions(parent=self)
        )

        aws.iam.RolePolicyAttachment(
            f"notification-lambda-xray-{self.environment_suffix}",
            role=role.name,
            policy_arn="arn:aws:iam::aws:policy/AWSXRayDaemonWriteAccess",
            opts=pulumi.ResourceOptions(parent=self)
        )

        # Create policy for SNS and SQS access
        policy = aws.iam.RolePolicy(
            f"notification-lambda-policy-{self.environment_suffix}",
            role=role.id,
            policy=pulumi.Output.all(
                self.sns_topic.arn,
                self.fraud_queue.arn
            ).apply(
                lambda args: json.dumps({
                    "Version": "2012-10-17",
                    "Statement": [{
                        "Effect": "Allow",
                        "Action": [
                            "sns:Publish"
                        ],
                        "Resource": args[0]
                    }, {
                        "Effect": "Allow",
                        "Action": [
                            "sqs:ReceiveMessage",
                            "sqs:DeleteMessage",
                            "sqs:GetQueueAttributes"
                        ],
                        "Resource": args[1]
                    }]
                })
            ),
            opts=pulumi.ResourceOptions(parent=self)
        )

        # Create CloudWatch log group
        log_group = aws.cloudwatch.LogGroup(
            f"notification-lambda-logs-{self.environment_suffix}",
            name=f"/aws/lambda/fraud-notification-{self.environment_suffix}",
            retention_in_days=7,
            tags={"Environment": self.environment_suffix},
            opts=pulumi.ResourceOptions(parent=self)
        )

        # Create Lambda function
        lambda_args = {
            "name": f"fraud-notification-{self.environment_suffix}",
            "runtime": "python3.11",
            "handler": "index.handler",
            "role": role.arn,
            "code": pulumi.AssetArchive({
                "index.py": pulumi.StringAsset("""
import json
import boto3
import os

sns = boto3.client('sns')
topic_arn = os.environ['TOPIC_ARN']

def handler(event, context):
    try:
        for record in event['Records']:
            message = json.loads(record['body'])

            # Format alert message
            alert_message = f'''
Fraud Alert Detected!

Transaction ID: {message['transaction_id']}
Amount: ${message['amount']}
Reason: {message['reason']}
Timestamp: {message['timestamp']}

Please investigate immediately.
'''

            # Publish to SNS
            sns.publish(
                TopicArn=topic_arn,
                Subject='FRAUD ALERT - Suspicious Transaction Detected',
                Message=alert_message
            )

            print(f"Alert sent for transaction: {message['transaction_id']}")

        return {'statusCode': 200, 'body': 'Notifications sent'}
    except Exception as e:
        print(f"Error: {str(e)}")
        raise
""")
            }),
            "environment": {
                "variables": {
                    "TOPIC_ARN": self.sns_topic.arn
                }
            },
            "kms_key_arn": self.kms_key.arn,
            "tracing_config": {"mode": "Active"},
            "timeout": 30,
            "tags": {"Environment": self.environment_suffix},
            "opts": pulumi.ResourceOptions(parent=self, depends_on=[log_group, policy])
        }

        if self.lambda_reserved_concurrency is not None:
            lambda_args["reserved_concurrent_executions"] = self.lambda_reserved_concurrency

        lambda_func = aws.lambda_.Function(
            f"notification-lambda-{self.environment_suffix}",
            **lambda_args
        )

        # Add SQS trigger
        aws.lambda_.EventSourceMapping(
            f"notification-sqs-trigger-{self.environment_suffix}",
            event_source_arn=self.fraud_queue.arn,
            function_name=lambda_func.name,
            batch_size=10,
            opts=pulumi.ResourceOptions(parent=self)
        )

        return lambda_func

    def _create_eventbridge_rule(self):
        """Create DynamoDB stream trigger for fraud detection Lambda."""
        # Use direct DynamoDB stream trigger instead of EventBridge
        # This is the correct approach for processing DynamoDB stream events
        event_source_mapping = aws.lambda_.EventSourceMapping(
            f"fraud-lambda-dynamodb-trigger-{self.environment_suffix}",
            event_source_arn=self.dynamodb_table.stream_arn,
            function_name=self.fraud_lambda.name,
            starting_position="LATEST",
            batch_size=10,
            maximum_batching_window_in_seconds=5,
            opts=pulumi.ResourceOptions(parent=self)
        )

        return event_source_mapping

    def _create_api_gateway(self):
        """Create API Gateway REST API."""
        # Create REST API
        api = aws.apigateway.RestApi(
            f"fraud-api-{self.environment_suffix}",
            name=f"fraud-detection-api-{self.environment_suffix}",
            description="Fraud detection transaction API",
            tags={"Environment": self.environment_suffix},
            opts=pulumi.ResourceOptions(parent=self)
        )

        # Create /transactions resource
        transactions_resource = aws.apigateway.Resource(
            f"transactions-resource-{self.environment_suffix}",
            rest_api=api.id,
            parent_id=api.root_resource_id,
            path_part="transactions",
            opts=pulumi.ResourceOptions(parent=self)
        )

        # Create POST method
        post_method = aws.apigateway.Method(
            f"transactions-post-{self.environment_suffix}",
            rest_api=api.id,
            resource_id=transactions_resource.id,
            http_method="POST",
            authorization="NONE",
            opts=pulumi.ResourceOptions(parent=self)
        )

        # Create Lambda integration
        integration = aws.apigateway.Integration(
            f"transactions-integration-{self.environment_suffix}",
            rest_api=api.id,
            resource_id=transactions_resource.id,
            http_method=post_method.http_method,
            integration_http_method="POST",
            type="AWS_PROXY",
            uri=self.api_lambda.invoke_arn,
            opts=pulumi.ResourceOptions(parent=self)
        )

        # Add Lambda permission for API Gateway
        aws.lambda_.Permission(
            f"api-lambda-permission-{self.environment_suffix}",
            action="lambda:InvokeFunction",
            function=self.api_lambda.name,
            principal="apigateway.amazonaws.com",
            source_arn=pulumi.Output.all(api.execution_arn, transactions_resource.path).apply(
                lambda args: f"{args[0]}/*/*/*"
            ),
            opts=pulumi.ResourceOptions(parent=self)
        )

        # Create deployment
        deployment = aws.apigateway.Deployment(
            f"api-deployment-{self.environment_suffix}",
            rest_api=api.id,
            opts=pulumi.ResourceOptions(parent=self, depends_on=[integration])
        )

        # Create stage with X-Ray tracing
        stage = aws.apigateway.Stage(
            f"api-stage-{self.environment_suffix}",
            rest_api=api.id,
            deployment=deployment.id,
            stage_name="prod",
            xray_tracing_enabled=True,
            tags={"Environment": self.environment_suffix},
            opts=pulumi.ResourceOptions(parent=self)
        )

        # Create usage plan for throttling
        usage_plan = aws.apigateway.UsagePlan(
            f"api-usage-plan-{self.environment_suffix}",
            name=f"fraud-api-plan-{self.environment_suffix}",
            description="Usage plan with throttling",
            api_stages=[{
                "api_id": api.id,
                "stage": stage.stage_name
            }],
            throttle_settings={
                "rate_limit": 1000,
                "burst_limit": 1000
            },
            tags={"Environment": self.environment_suffix},
            opts=pulumi.ResourceOptions(parent=self)
        )

        return {
            "api": api,
            "stage": stage,
            "usage_plan": usage_plan
        }

    def _export_outputs(self):
        """Export stack outputs."""
        pulumi.export("api_endpoint", pulumi.Output.all(
            self.api_gateway["api"].id,
            self.api_gateway["stage"].stage_name
        ).apply(
            lambda args: f"https://{args[0]}.execute-api.us-east-1.amazonaws.com/{args[1]}/transactions"
        ))
        pulumi.export("dynamodb_table_name", self.dynamodb_table.name)
        pulumi.export("fraud_queue_url", self.fraud_queue.url)
        pulumi.export("sns_topic_arn", self.sns_topic.arn)
        pulumi.export("kms_key_id", self.kms_key.id)

    @staticmethod
    def _parse_reserved_value(value: Optional[str]) -> Optional[int]:
        if value in (None, ""):
            return None
        try:
            parsed = int(value)
            if parsed < 0:
                pulumi.log.warn(
                    "LAMBDA_RESERVED_CONCURRENCY cannot be negative; ignoring value %s", value
                )
                return None
            return parsed
        except ValueError:
            pulumi.log.warn(
                "Invalid LAMBDA_RESERVED_CONCURRENCY value '%s'; expected integer", value
            )
            return None

    def _resolve_reserved_concurrency(self) -> Optional[int]:
        env_value = self._parse_reserved_value(os.getenv("LAMBDA_RESERVED_CONCURRENCY"))
        if env_value is not None:
            return env_value

        config = pulumi.Config()
        cfg_value = config.get_int("lambda_reserved_concurrency")
        if cfg_value is not None:
            return cfg_value

        # Check for legacy config key
        legacy_value = config.get_int("lambdaReservedConcurrency")
        if legacy_value is not None:
            return legacy_value

        # Return None (no reserved concurrency) to avoid AWS account limit issues
        # For production, set LAMBDA_RESERVED_CONCURRENCY=100 after requesting AWS quota increase
        # or use pulumi config set lambda_reserved_concurrency 100
        return None
