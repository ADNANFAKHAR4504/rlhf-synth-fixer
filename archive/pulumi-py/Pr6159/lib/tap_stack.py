"""
This module defines the TapStack class, the main Pulumi ComponentResource for
the TAP (Test Automation Platform) project. It now encapsulates the full
infrastructure previously defined in `tap_stack.py`.
"""

from typing import Optional, Dict
import json

import pulumi
from pulumi import ResourceOptions
import pulumi_aws as aws


class TapStackArgs:
    """
    TapStackArgs defines the input arguments for the TapStack Pulumi component.

    Args:
        environment_suffix (Optional[str]): An optional suffix for identifying the deployment environment (e.g., 'dev', 'prod').
        tags (Optional[Dict[str, str]]): Optional default tags to apply to resources.
    """

    def __init__(self, environment_suffix: Optional[str] = None, tags: Optional[Dict[str, str]] = None):
        self.environment_suffix = environment_suffix
        self.tags = tags


class TapStack(pulumi.ComponentResource):
    """
    Represents the main Pulumi component resource for the TAP project. All resource
    definitions that previously lived in `tap_stack.py` are now defined within this class.
    """

    def __init__(
        self,
        name: str,
        args: TapStackArgs,
        opts: Optional[ResourceOptions] = None
    ):
        super().__init__('tap:stack:TapStack', name, None, opts)

        config = pulumi.Config()
        environment_suffix = args.environment_suffix or config.get("environmentSuffix") or "dev"
        common_tags = args.tags or {
            "Environment": "production",
            "CostCenter": "fraud-detection",
        }

        self.environment_suffix = environment_suffix
        self.common_tags = common_tags
        self.tags = common_tags

        parent_opts = ResourceOptions(parent=self)

        # KMS Key for encryption
        self.kms_key = aws.kms.Key(
            f"fraud-detection-kms-{environment_suffix}",
            description="KMS key for fraud detection pipeline encryption",
            deletion_window_in_days=10,
            enable_key_rotation=True,
            tags=common_tags,
            opts=parent_opts,
        )

        self.kms_alias = aws.kms.Alias(
            f"fraud-detection-kms-alias-{environment_suffix}",
            target_key_id=self.kms_key.id,
            name=f"alias/fraud-detection-{environment_suffix}",
            opts=parent_opts,
        )

        # IAM Role for process-transaction Lambda
        self.process_transaction_role = aws.iam.Role(
            f"process-transaction-role-{environment_suffix}",
            assume_role_policy=json.dumps({
                "Version": "2012-10-17",
                "Statement": [{
                    "Action": "sts:AssumeRole",
                    "Effect": "Allow",
                    "Principal": {
                        "Service": "lambda.amazonaws.com"
                    }
                }]
            }),
            tags=common_tags,
            opts=parent_opts,
        )

        # Attach basic execution policy
        aws.iam.RolePolicyAttachment(
            f"process-transaction-basic-{environment_suffix}",
            role=self.process_transaction_role.name,
            policy_arn="arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole",
            opts=parent_opts,
        )

        # DynamoDB Table
        self.transactions_table = aws.dynamodb.Table(
            f"transactions-{environment_suffix}",
            attributes=[
                aws.dynamodb.TableAttributeArgs(
                    name="transaction_id",
                    type="S"
                ),
                aws.dynamodb.TableAttributeArgs(
                    name="timestamp",
                    type="N"
                )
            ],
            hash_key="transaction_id",
            range_key="timestamp",
            billing_mode="PAY_PER_REQUEST",
            stream_enabled=True,
            stream_view_type="NEW_AND_OLD_IMAGES",
            tags=common_tags,
            opts=parent_opts,
        )

        # Policy for process-transaction Lambda
        self.process_transaction_policy = aws.iam.RolePolicy(
            f"process-transaction-policy-{environment_suffix}",
            role=self.process_transaction_role.id,
            policy=pulumi.Output.all(self.transactions_table.arn, self.kms_key.arn).apply(
                lambda args2: json.dumps({
                    "Version": "2012-10-17",
                    "Statement": [
                        {
                            "Effect": "Allow",
                            "Action": [
                                "dynamodb:PutItem",
                                "dynamodb:UpdateItem"
                            ],
                            "Resource": args2[0]
                        },
                        {
                            "Effect": "Allow",
                            "Action": [
                                "kms:Decrypt",
                                "kms:Encrypt",
                                "kms:GenerateDataKey"
                            ],
                            "Resource": args2[1]
                        }
                    ]
                })
            ),
            opts=parent_opts,
        )

        # CloudWatch Log Group for process-transaction
        self.process_transaction_log_group = aws.cloudwatch.LogGroup(
            f"process-transaction-logs-{environment_suffix}",
            name=f"/aws/lambda/process-transaction-{environment_suffix}",
            retention_in_days=7,
            tags=common_tags,
            opts=parent_opts,
        )

        # Lambda Function: process-transaction
        self.process_transaction_lambda = aws.lambda_.Function(
            f"process-transaction-{environment_suffix}",
            runtime="python3.9",
            role=self.process_transaction_role.arn,
            handler="index.handler",
            memory_size=512,
            reserved_concurrent_executions=50,
            code=pulumi.AssetArchive({
                "index.py": pulumi.StringAsset("""
import json
import boto3
import time
import os

dynamodb = boto3.resource('dynamodb')
table_name = os.environ['TABLE_NAME']
table = dynamodb.Table(table_name)

def handler(event, context):
    try:
        body = json.loads(event.get('body', '{}'))

        # Validate required fields
        if 'transaction_id' not in body:
            return {
                'statusCode': 400,
                'body': json.dumps({'error': 'Missing transaction_id'})
            }

        # Store transaction in DynamoDB
        item = {
            'transaction_id': body['transaction_id'],
            'timestamp': int(time.time() * 1000),
            'amount': body.get('amount', 0),
            'merchant': body.get('merchant', ''),
            'card_number': body.get('card_number', ''),
            'location': body.get('location', ''),
            'status': 'pending'
        }

        table.put_item(Item=item)

        return {
            'statusCode': 200,
            'body': json.dumps({
                'message': 'Transaction processed successfully',
                'transaction_id': body['transaction_id']
            })
        }
    except Exception as e:
        print(f"Error: {str(e)}")
        return {
            'statusCode': 500,
            'body': json.dumps({'error': 'Internal server error'})
        }
""")
            }),
            environment=aws.lambda_.FunctionEnvironmentArgs(
                variables={
                    "TABLE_NAME": self.transactions_table.name
                }
            ),
            kms_key_arn=self.kms_key.arn,
            tags=common_tags,
            opts=ResourceOptions(parent=self, depends_on=[self.process_transaction_log_group]),
        )

        # SQS Queue for fraud alerts
        self.fraud_alerts_queue = aws.sqs.Queue(
            f"fraud-alerts-{environment_suffix}",
            visibility_timeout_seconds=300,
            tags=common_tags,
            opts=parent_opts,
        )

        # IAM Role for detect-fraud Lambda
        self.detect_fraud_role = aws.iam.Role(
            f"detect-fraud-role-{environment_suffix}",
            assume_role_policy=json.dumps({
                "Version": "2012-10-17",
                "Statement": [{
                    "Action": "sts:AssumeRole",
                    "Effect": "Allow",
                    "Principal": {
                        "Service": "lambda.amazonaws.com"
                    }
                }]
            }),
            tags=common_tags,
            opts=parent_opts,
        )

        aws.iam.RolePolicyAttachment(
            f"detect-fraud-basic-{environment_suffix}",
            role=self.detect_fraud_role.name,
            policy_arn="arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole",
            opts=parent_opts,
        )

        # Policy for detect-fraud Lambda
        self.detect_fraud_policy = aws.iam.RolePolicy(
            f"detect-fraud-policy-{environment_suffix}",
            role=self.detect_fraud_role.id,
            policy=pulumi.Output.all(
                self.transactions_table.stream_arn,
                self.fraud_alerts_queue.arn,
                self.kms_key.arn
            ).apply(
                lambda args2: json.dumps({
                    "Version": "2012-10-17",
                    "Statement": [
                        {
                            "Effect": "Allow",
                            "Action": [
                                "dynamodb:GetRecords",
                                "dynamodb:GetShardIterator",
                                "dynamodb:DescribeStream",
                                "dynamodb:ListStreams"
                            ],
                            "Resource": args2[0]
                        },
                        {
                            "Effect": "Allow",
                            "Action": [
                                "sqs:SendMessage",
                                "sqs:GetQueueAttributes"
                            ],
                            "Resource": args2[1]
                        },
                        {
                            "Effect": "Allow",
                            "Action": [
                                "kms:Decrypt",
                                "kms:Encrypt",
                                "kms:GenerateDataKey"
                            ],
                            "Resource": args2[2]
                        }
                    ]
                })
            ),
            opts=parent_opts,
        )

        # CloudWatch Log Group for detect-fraud
        self.detect_fraud_log_group = aws.cloudwatch.LogGroup(
            f"detect-fraud-logs-{environment_suffix}",
            name=f"/aws/lambda/detect-fraud-{environment_suffix}",
            retention_in_days=7,
            tags=common_tags,
            opts=parent_opts,
        )

        # Lambda Function: detect-fraud
        self.detect_fraud_lambda = aws.lambda_.Function(
            f"detect-fraud-{environment_suffix}",
            runtime="python3.9",
            role=self.detect_fraud_role.arn,
            handler="index.handler",
            memory_size=512,
            reserved_concurrent_executions=50,
            code=pulumi.AssetArchive({
                "index.py": pulumi.StringAsset("""
import json
import boto3
import os

sqs = boto3.client('sqs')
queue_url = os.environ['QUEUE_URL']

def handler(event, context):
    try:
        for record in event['Records']:
            if record['eventName'] in ['INSERT', 'MODIFY']:
                new_image = record['dynamodb'].get('NewImage', {})

                # Extract transaction details
                transaction_id = new_image.get('transaction_id', {}).get('S', '')
                amount = float(new_image.get('amount', {}).get('N', 0))

                # Simple fraud detection logic
                is_suspicious = False
                reasons = []

                if amount > 1000:
                    is_suspicious = True
                    reasons.append('High amount transaction')

                if amount > 5000:
                    is_suspicious = True
                    reasons.append('Very high amount transaction')

                # If suspicious, send to SQS
                if is_suspicious:
                    message = {
                        'transaction_id': transaction_id,
                        'amount': amount,
                        'reasons': reasons,
                        'severity': 'high' if amount > 5000 else 'medium'
                    }

                    sqs.send_message(
                        QueueUrl=queue_url,
                        MessageBody=json.dumps(message)
                    )

                    print(f"Suspicious transaction detected: {transaction_id}")

        return {'statusCode': 200, 'body': 'Processed successfully'}
    except Exception as e:
        print(f"Error: {str(e)}")
        raise
""")
            }),
            environment=aws.lambda_.FunctionEnvironmentArgs(
                variables={
                    "QUEUE_URL": self.fraud_alerts_queue.url
                }
            ),
            kms_key_arn=self.kms_key.arn,
            tags=common_tags,
            opts=ResourceOptions(parent=self, depends_on=[self.detect_fraud_log_group]),
        )

        # Event Source Mapping for DynamoDB Stream
        self.stream_mapping = aws.lambda_.EventSourceMapping(
            f"detect-fraud-stream-mapping-{environment_suffix}",
            event_source_arn=self.transactions_table.stream_arn,
            function_name=self.detect_fraud_lambda.arn,
            starting_position="LATEST",
            batch_size=100,
            opts=parent_opts,
        )

        # SNS Topic for notifications
        self.fraud_notifications_topic = aws.sns.Topic(
            f"fraud-notifications-{environment_suffix}",
            display_name="Fraud Detection Alerts",
            tags=common_tags,
            opts=parent_opts,
        )

        # IAM Role for notify-team Lambda
        self.notify_team_role = aws.iam.Role(
            f"notify-team-role-{environment_suffix}",
            assume_role_policy=json.dumps({
                "Version": "2012-10-17",
                "Statement": [{
                    "Action": "sts:AssumeRole",
                    "Effect": "Allow",
                    "Principal": {
                        "Service": "lambda.amazonaws.com"
                    }
                }]
            }),
            tags=common_tags,
            opts=parent_opts,
        )

        aws.iam.RolePolicyAttachment(
            f"notify-team-basic-{environment_suffix}",
            role=self.notify_team_role.name,
            policy_arn="arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole",
            opts=parent_opts,
        )

        # Policy for notify-team Lambda
        self.notify_team_policy = aws.iam.RolePolicy(
            f"notify-team-policy-{environment_suffix}",
            role=self.notify_team_role.id,
            policy=pulumi.Output.all(
                self.fraud_alerts_queue.arn,
                self.fraud_notifications_topic.arn,
                self.kms_key.arn
            ).apply(
                lambda args2: json.dumps({
                    "Version": "2012-10-17",
                    "Statement": [
                        {
                            "Effect": "Allow",
                            "Action": [
                                "sqs:ReceiveMessage",
                                "sqs:DeleteMessage",
                                "sqs:GetQueueAttributes"
                            ],
                            "Resource": args2[0]
                        },
                        {
                            "Effect": "Allow",
                            "Action": [
                                "sns:Publish"
                            ],
                            "Resource": args2[1]
                        },
                        {
                            "Effect": "Allow",
                            "Action": [
                                "kms:Decrypt",
                                "kms:Encrypt",
                                "kms:GenerateDataKey"
                            ],
                            "Resource": args2[2]
                        }
                    ]
                })
            ),
            opts=parent_opts,
        )

        # CloudWatch Log Group for notify-team
        self.notify_team_log_group = aws.cloudwatch.LogGroup(
            f"notify-team-logs-{environment_suffix}",
            name=f"/aws/lambda/notify-team-{environment_suffix}",
            retention_in_days=7,
            tags=common_tags,
            opts=parent_opts,
        )

        # Lambda Function: notify-team
        self.notify_team_lambda = aws.lambda_.Function(
            f"notify-team-{environment_suffix}",
            runtime="python3.9",
            role=self.notify_team_role.arn,
            handler="index.handler",
            memory_size=512,
            reserved_concurrent_executions=50,
            code=pulumi.AssetArchive({
                "index.py": pulumi.StringAsset("""
import json
import boto3
import os

sns = boto3.client('sns')
topic_arn = os.environ['TOPIC_ARN']

def handler(event, context):
    try:
        for record in event['Records']:
            body = json.loads(record['body'])

            transaction_id = body.get('transaction_id', 'Unknown')
            amount = body.get('amount', 0)
            reasons = body.get('reasons', [])
            severity = body.get('severity', 'medium')

            # Create notification message
            message = f"\\n" + f"FRAUD ALERT - {severity.upper()} SEVERITY\\n\\n" + \
                      f"Transaction ID: {transaction_id}\\n" + \
                      f"Amount: ${amount}\\n" + \
                      f"Reasons: {', '.join(reasons)}\\n\\n" + \
                      f"Please investigate this transaction immediately.\\n"

            # Publish to SNS
            sns.publish(
                TopicArn=topic_arn,
                Subject=f"Fraud Alert: Transaction {transaction_id}",
                Message=message
            )

            print(f"Notification sent for transaction: {transaction_id}")

        return {'statusCode': 200, 'body': 'Notifications sent successfully'}
    except Exception as e:
        print(f"Error: {str(e)}")
        raise
""")
            }),
            environment=aws.lambda_.FunctionEnvironmentArgs(
                variables={
                    "TOPIC_ARN": self.fraud_notifications_topic.arn
                }
            ),
            kms_key_arn=self.kms_key.arn,
            tags=common_tags,
            opts=ResourceOptions(parent=self, depends_on=[self.notify_team_log_group]),
        )

        # Event Source Mapping for SQS
        self.sqs_mapping = aws.lambda_.EventSourceMapping(
            f"notify-team-sqs-mapping-{environment_suffix}",
            event_source_arn=self.fraud_alerts_queue.arn,
            function_name=self.notify_team_lambda.arn,
            batch_size=10,
            opts=parent_opts,
        )

        # API Gateway REST API
        self.api = aws.apigateway.RestApi(
            f"fraud-detection-api-{environment_suffix}",
            description="Fraud Detection API",
            tags=common_tags,
            opts=parent_opts,
        )

        # API Gateway Resource
        self.transactions_resource = aws.apigateway.Resource(
            f"transactions-resource-{environment_suffix}",
            rest_api=self.api.id,
            parent_id=self.api.root_resource_id,
            path_part="transactions",
            opts=parent_opts,
        )

        # Request Validator
        self.request_validator = aws.apigateway.RequestValidator(
            f"api-request-validator-{environment_suffix}",
            rest_api=self.api.id,
            validate_request_body=True,
            validate_request_parameters=True,
            opts=parent_opts,
        )

        # API Gateway Method
        self.transactions_method = aws.apigateway.Method(
            f"transactions-method-{environment_suffix}",
            rest_api=self.api.id,
            resource_id=self.transactions_resource.id,
            http_method="POST",
            authorization="NONE",
            request_validator_id=self.request_validator.id,
            opts=parent_opts,
        )

        # Lambda Permission for API Gateway
        self.lambda_permission = aws.lambda_.Permission(
            f"api-lambda-permission-{environment_suffix}",
            action="lambda:InvokeFunction",
            function=self.process_transaction_lambda.name,
            principal="apigateway.amazonaws.com",
            source_arn=pulumi.Output.all(self.api.execution_arn).apply(
                lambda args2: f"{args2[0]}/*/*"
            ),
            opts=parent_opts,
        )

        # API Gateway Integration
        self.integration = aws.apigateway.Integration(
            f"transactions-integration-{environment_suffix}",
            rest_api=self.api.id,
            resource_id=self.transactions_resource.id,
            http_method=self.transactions_method.http_method,
            integration_http_method="POST",
            type="AWS_PROXY",
            uri=self.process_transaction_lambda.invoke_arn,
            opts=parent_opts,
        )

        # API Gateway Method Response
        self.method_response = aws.apigateway.MethodResponse(
            f"transactions-method-response-{environment_suffix}",
            rest_api=self.api.id,
            resource_id=self.transactions_resource.id,
            http_method=self.transactions_method.http_method,
            status_code="200",
            opts=parent_opts,
        )

        # API Gateway Deployment
        self.deployment = aws.apigateway.Deployment(
            f"api-deployment-{environment_suffix}",
            rest_api=self.api.id,
            opts=ResourceOptions(parent=self, depends_on=[
                self.integration,
                self.method_response
            ]),
        )

        # API Gateway Stage
        self.stage = aws.apigateway.Stage(
            f"api-stage-{environment_suffix}",
            rest_api=self.api.id,
            deployment=self.deployment.id,
            stage_name="prod",
            tags=common_tags,
            opts=parent_opts,
        )

        api_endpoint = pulumi.Output.concat(
            "https://", self.api.id, ".execute-api.us-east-1.amazonaws.com/prod/transactions"
        )

        pulumi.export("api_endpoint", api_endpoint)
        pulumi.export("transactions_table_name", self.transactions_table.name)
        pulumi.export("fraud_alerts_queue_url", self.fraud_alerts_queue.url)
        pulumi.export("fraud_notifications_topic_arn", self.fraud_notifications_topic.arn)
        pulumi.export("kms_key_id", self.kms_key.id)
