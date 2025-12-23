"""TAP Stack module for CDKTF Python infrastructure - Serverless Fraud Detection Pipeline."""

from cdktf import TerraformStack, S3Backend, TerraformOutput, Fn
from constructs import Construct
from cdktf_cdktf_provider_aws.provider import AwsProvider
from cdktf_cdktf_provider_aws.kms_key import KmsKey
from cdktf_cdktf_provider_aws.kms_alias import KmsAlias
from cdktf_cdktf_provider_aws.kms_key_policy import KmsKeyPolicy
from cdktf_cdktf_provider_aws.vpc import Vpc
from cdktf_cdktf_provider_aws.subnet import Subnet
from cdktf_cdktf_provider_aws.security_group import SecurityGroup, SecurityGroupEgress
from cdktf_cdktf_provider_aws.dynamodb_table import (
    DynamodbTable,
    DynamodbTableAttribute
)
from cdktf_cdktf_provider_aws.sqs_queue import SqsQueue
from cdktf_cdktf_provider_aws.sns_topic import SnsTopic
from cdktf_cdktf_provider_aws.sns_topic_subscription import SnsTopicSubscription
from cdktf_cdktf_provider_aws.iam_role import IamRole
from cdktf_cdktf_provider_aws.iam_role_policy import IamRolePolicy
from cdktf_cdktf_provider_aws.iam_role_policy_attachment import (
    IamRolePolicyAttachment
)
from cdktf_cdktf_provider_aws.lambda_function import (
    LambdaFunction,
    LambdaFunctionEnvironment,
    LambdaFunctionVpcConfig,
    LambdaFunctionTracingConfig
)
from cdktf_cdktf_provider_aws.lambda_permission import LambdaPermission
from cdktf_cdktf_provider_aws.lambda_event_source_mapping import LambdaEventSourceMapping
from cdktf_cdktf_provider_aws.cloudwatch_log_group import CloudwatchLogGroup
from cdktf_cdktf_provider_aws.api_gateway_rest_api import ApiGatewayRestApi
from cdktf_cdktf_provider_aws.api_gateway_resource import ApiGatewayResource
from cdktf_cdktf_provider_aws.api_gateway_method import ApiGatewayMethod
from cdktf_cdktf_provider_aws.api_gateway_integration import ApiGatewayIntegration
from cdktf_cdktf_provider_aws.api_gateway_deployment import ApiGatewayDeployment
from cdktf_cdktf_provider_aws.api_gateway_stage import ApiGatewayStage
from cdktf_cdktf_provider_aws.api_gateway_method_settings import ApiGatewayMethodSettings
from cdktf_cdktf_provider_aws.cloudwatch_event_rule import CloudwatchEventRule
from cdktf_cdktf_provider_aws.cloudwatch_event_target import CloudwatchEventTarget
import json
import os
import base64
import boto3


class TapStack(TerraformStack):
    """CDKTF Python stack for Serverless Fraud Detection Pipeline."""

    def __init__(
        self,
        scope: Construct,
        construct_id: str,
        **kwargs
    ):
        """Initialize the TAP stack with AWS infrastructure."""
        super().__init__(scope, construct_id)

        # Extract configuration from kwargs
        environment_suffix = kwargs.get('environment_suffix', 'dev')
        aws_region = kwargs.get('aws_region', 'us-east-1')
        state_bucket_region = kwargs.get('state_bucket_region', 'us-east-1')
        state_bucket = kwargs.get('state_bucket', 'iac-rlhf-tf-states')
        default_tags = kwargs.get('default_tags', {})

        # Configure AWS Provider
        AwsProvider(
            self,
            "aws",
            region=aws_region,
            default_tags=[default_tags],
        )

        # Configure S3 Backend with native state locking
        S3Backend(
            self,
            bucket=state_bucket,
            key=f"{environment_suffix}/{construct_id}.tfstate",
            region=state_bucket_region,
            encrypt=True,
        )

        # Add S3 state locking using escape hatch
        self.add_override("terraform.backend.s3.use_lockfile", True)

        # 1. KMS Key for encryption at rest
        kms_key = KmsKey(
            self,
            "fraud_detection_kms_key",
            description=f"KMS key for fraud detection pipeline {environment_suffix}",
            enable_key_rotation=True,
            deletion_window_in_days=7,
        )

        KmsAlias(
            self,
            "fraud_detection_kms_alias",
            name=f"alias/fraud-detection-{environment_suffix}",
            target_key_id=kms_key.key_id,
        )

        # Get AWS account ID for KMS key policy
        try:
            sts_client = boto3.client('sts', region_name=aws_region)
            account_id = sts_client.get_caller_identity()['Account']
        except Exception:
            # Fallback: try to extract from ARN if available
            account_id = "069919905910"  # Fallback account ID

        # KMS Key Policy to allow CloudWatch Logs to use the key
        KmsKeyPolicy(
            self,
            "kms_key_policy",
            key_id=kms_key.id,
            policy=json.dumps({
                "Version": "2012-10-17",
                "Statement": [
                    {
                        "Sid": "Enable IAM User Permissions",
                        "Effect": "Allow",
                        "Principal": {
                            "AWS": f"arn:aws:iam::{account_id}:root"
                        },
                        "Action": "kms:*",
                        "Resource": "*"
                    },
                    {
                        "Sid": "Allow CloudWatch Logs",
                        "Effect": "Allow",
                        "Principal": {
                            "Service": f"logs.{aws_region}.amazonaws.com"
                        },
                        "Action": [
                            "kms:Encrypt",
                            "kms:Decrypt",
                            "kms:ReEncrypt*",
                            "kms:GenerateDataKey*",
                            "kms:CreateGrant",
                            "kms:DescribeKey"
                        ],
                        "Resource": "*",
                        "Condition": {
                            "ArnLike": {
                                "kms:EncryptionContext:aws:logs:arn": f"arn:aws:logs:{aws_region}:{account_id}:log-group:*"
                            }
                        }
                    }
                ]
            })
        )

        # 2. VPC for Lambda functions processing sensitive data
        vpc = Vpc(
            self,
            "fraud_detection_vpc",
            cidr_block="10.0.0.0/16",
            enable_dns_hostnames=True,
            enable_dns_support=True,
            tags={
                "Name": f"fraud-detection-vpc-{environment_suffix}"
            }
        )

        # Private subnets for Lambda functions
        private_subnet_1 = Subnet(
            self,
            "private_subnet_1",
            vpc_id=vpc.id,
            cidr_block="10.0.1.0/24",
            availability_zone=f"{aws_region}a",
            tags={
                "Name": f"fraud-detection-private-subnet-1-{environment_suffix}"
            }
        )

        private_subnet_2 = Subnet(
            self,
            "private_subnet_2",
            vpc_id=vpc.id,
            cidr_block="10.0.2.0/24",
            availability_zone=f"{aws_region}b",
            tags={
                "Name": f"fraud-detection-private-subnet-2-{environment_suffix}"
            }
        )

        # Security group for Lambda functions
        lambda_security_group = SecurityGroup(
            self,
            "lambda_security_group",
            name=f"fraud-detection-lambda-sg-{environment_suffix}",
            description="Security group for fraud detection Lambda functions",
            vpc_id=vpc.id,
            egress=[
                SecurityGroupEgress(
                    from_port=0,
                    to_port=0,
                    protocol="-1",
                    cidr_blocks=["0.0.0.0/0"],
                    description="Allow all outbound traffic"
                )
            ],
            tags={
                "Name": f"fraud-detection-lambda-sg-{environment_suffix}"
            }
        )

        # 3. DynamoDB table for transactions with streams enabled
        transactions_table = DynamodbTable(
            self,
            "transactions_table",
            name=f"transactions-{environment_suffix}",
            billing_mode="PAY_PER_REQUEST",
            hash_key="transaction_id",
            range_key="timestamp",
            attribute=[
                DynamodbTableAttribute(
                    name="transaction_id",
                    type="S"
                ),
                DynamodbTableAttribute(
                    name="timestamp",
                    type="N"
                )
            ],
            stream_enabled=True,
            stream_view_type="NEW_IMAGE",
            server_side_encryption={
                "enabled": True,
                "kms_key_arn": kms_key.arn
            },
            point_in_time_recovery={
                "enabled": True
            }
        )

        # 4. SQS Dead Letter Queue
        dlq = SqsQueue(
            self,
            "fraud_detection_dlq",
            name=f"fraud-detection-dlq-{environment_suffix}",
            message_retention_seconds=1209600,  # 14 days
            kms_master_key_id=kms_key.key_id,
            kms_data_key_reuse_period_seconds=300
        )

        # 5. SQS Queue for suspicious transactions
        suspicious_transactions_queue = SqsQueue(
            self,
            "suspicious_transactions_queue",
            name=f"suspicious-transactions-{environment_suffix}",
            visibility_timeout_seconds=360,  # 6 minutes
            message_retention_seconds=345600,  # 4 days
            kms_master_key_id=kms_key.key_id,
            kms_data_key_reuse_period_seconds=300,
            redrive_policy=json.dumps({
                "deadLetterTargetArn": dlq.arn,
                "maxReceiveCount": 3
            })
        )

        # 6. SNS Topic for fraud alerts
        fraud_alerts_topic = SnsTopic(
            self,
            "fraud_alerts_topic",
            name=f"fraud-alerts-{environment_suffix}",
            kms_master_key_id=kms_key.key_id
        )

        # SNS Topic Subscription (email)
        SnsTopicSubscription(
            self,
            "fraud_alerts_email_subscription",
            topic_arn=fraud_alerts_topic.arn,
            protocol="email",
            endpoint="fraud-alerts@example.com"
        )

        # 7. IAM Role for API Lambda
        api_lambda_role = IamRole(
            self,
            "api_lambda_role",
            name=f"api-lambda-role-{environment_suffix}",
            assume_role_policy=json.dumps({
                "Version": "2012-10-17",
                "Statement": [{
                    "Effect": "Allow",
                    "Principal": {"Service": "lambda.amazonaws.com"},
                    "Action": "sts:AssumeRole"
                }]
            })
        )

        # Policy for API Lambda
        IamRolePolicy(
            self,
            "api_lambda_policy",
            name=f"api-lambda-policy-{environment_suffix}",
            role=api_lambda_role.id,
            policy=json.dumps({
                "Version": "2012-10-17",
                "Statement": [
                    {
                        "Effect": "Allow",
                        "Action": [
                            "dynamodb:PutItem"
                        ],
                        "Resource": transactions_table.arn
                    },
                    {
                        "Effect": "Allow",
                        "Action": [
                            "logs:CreateLogGroup",
                            "logs:CreateLogStream",
                            "logs:PutLogEvents"
                        ],
                        "Resource": (
                            f"arn:aws:logs:{aws_region}:*:"
                            f"log-group:/aws/lambda/api-handler-{environment_suffix}:*"
                        )
                    },
                    {
                        "Effect": "Allow",
                        "Action": [
                            "xray:PutTraceSegments",
                            "xray:PutTelemetryRecords"
                        ],
                        "Resource": "*"
                    },
                    {
                        "Effect": "Allow",
                        "Action": [
                            "kms:Decrypt",
                            "kms:DescribeKey"
                        ],
                        "Resource": kms_key.arn
                    }
                ]
            })
        )

        # 8. IAM Role for Fraud Detection Lambda (VPC-enabled)
        fraud_detection_lambda_role = IamRole(
            self,
            "fraud_detection_lambda_role",
            name=f"fraud-detection-lambda-role-{environment_suffix}",
            assume_role_policy=json.dumps({
                "Version": "2012-10-17",
                "Statement": [{
                    "Effect": "Allow",
                    "Principal": {"Service": "lambda.amazonaws.com"},
                    "Action": "sts:AssumeRole"
                }]
            })
        )

        # Policy for Fraud Detection Lambda
        IamRolePolicy(
            self,
            "fraud_detection_lambda_policy",
            name=f"fraud-detection-lambda-policy-{environment_suffix}",
            role=fraud_detection_lambda_role.id,
            policy=json.dumps({
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
                        "Resource": f"{transactions_table.arn}/stream/*"
                    },
                    {
                        "Effect": "Allow",
                        "Action": [
                            "sqs:SendMessage"
                        ],
                        "Resource": suspicious_transactions_queue.arn
                    },
                    {
                        "Effect": "Allow",
                        "Action": [
                            "logs:CreateLogGroup",
                            "logs:CreateLogStream",
                            "logs:PutLogEvents"
                        ],
                        "Resource": (
                            f"arn:aws:logs:{aws_region}:*:"
                            f"log-group:/aws/lambda/fraud-detection-{environment_suffix}:*"
                        )
                    },
                    {
                        "Effect": "Allow",
                        "Action": [
                            "xray:PutTraceSegments",
                            "xray:PutTelemetryRecords"
                        ],
                        "Resource": "*"
                    },
                    {
                        "Effect": "Allow",
                        "Action": [
                            "kms:Decrypt",
                            "kms:DescribeKey"
                        ],
                        "Resource": kms_key.arn
                    },
                    {
                        "Effect": "Allow",
                        "Action": [
                            "ec2:CreateNetworkInterface",
                            "ec2:DescribeNetworkInterfaces",
                            "ec2:DeleteNetworkInterface"
                        ],
                        "Resource": "*"
                    }
                ]
            })
        )

        # 9. IAM Role for Notification Lambda
        notification_lambda_role = IamRole(
            self,
            "notification_lambda_role",
            name=f"notification-lambda-role-{environment_suffix}",
            assume_role_policy=json.dumps({
                "Version": "2012-10-17",
                "Statement": [{
                    "Effect": "Allow",
                    "Principal": {"Service": "lambda.amazonaws.com"},
                    "Action": "sts:AssumeRole"
                }]
            })
        )

        # Policy for Notification Lambda
        IamRolePolicy(
            self,
            "notification_lambda_policy",
            name=f"notification-lambda-policy-{environment_suffix}",
            role=notification_lambda_role.id,
            policy=json.dumps({
                "Version": "2012-10-17",
                "Statement": [
                    {
                        "Effect": "Allow",
                        "Action": [
                            "sqs:ReceiveMessage",
                            "sqs:DeleteMessage",
                            "sqs:GetQueueAttributes"
                        ],
                        "Resource": suspicious_transactions_queue.arn
                    },
                    {
                        "Effect": "Allow",
                        "Action": [
                            "sns:Publish"
                        ],
                        "Resource": fraud_alerts_topic.arn
                    },
                    {
                        "Effect": "Allow",
                        "Action": [
                            "logs:CreateLogGroup",
                            "logs:CreateLogStream",
                            "logs:PutLogEvents"
                        ],
                        "Resource": (
                            f"arn:aws:logs:{aws_region}:*:"
                            f"log-group:/aws/lambda/notification-handler-{environment_suffix}:*"
                        )
                    },
                    {
                        "Effect": "Allow",
                        "Action": [
                            "xray:PutTraceSegments",
                            "xray:PutTelemetryRecords"
                        ],
                        "Resource": "*"
                    },
                    {
                        "Effect": "Allow",
                        "Action": [
                            "kms:Decrypt",
                            "kms:DescribeKey"
                        ],
                        "Resource": kms_key.arn
                    }
                ]
            })
        )

        # 10. IAM Role for EventBridge to invoke Lambda
        eventbridge_lambda_role = IamRole(
            self,
            "eventbridge_lambda_role",
            name=f"eventbridge-lambda-role-{environment_suffix}",
            assume_role_policy=json.dumps({
                "Version": "2012-10-17",
                "Statement": [{
                    "Effect": "Allow",
                    "Principal": {"Service": "events.amazonaws.com"},
                    "Action": "sts:AssumeRole"
                }]
            })
        )

        # 11. CloudWatch Log Groups for all Lambda functions
        # CloudWatch Log Groups - must be created after KMS key policy
        api_log_group = CloudwatchLogGroup(
            self,
            "api_lambda_log_group",
            name=f"/aws/lambda/api-handler-{environment_suffix}",
            retention_in_days=7,
            kms_key_id=kms_key.arn
        )

        fraud_detection_log_group = CloudwatchLogGroup(
            self,
            "fraud_detection_lambda_log_group",
            name=f"/aws/lambda/fraud-detection-{environment_suffix}",
            retention_in_days=7,
            kms_key_id=kms_key.arn
        )

        notification_log_group = CloudwatchLogGroup(
            self,
            "notification_lambda_log_group",
            name=f"/aws/lambda/notification-handler-{environment_suffix}",
            retention_in_days=7,
            kms_key_id=kms_key.arn
        )

        # 12. Lambda Functions
        # Read Lambda function code from files
        lambda_dir = os.path.join(os.path.dirname(__file__), "lambda")

        # API Handler Lambda
        with open(os.path.join(lambda_dir, "api_handler.py"), "r", encoding="utf-8") as f:
            api_handler_code = f.read()

        api_lambda = LambdaFunction(
            self,
            "api_lambda",
            function_name=f"api-handler-{environment_suffix}",
            role=api_lambda_role.arn,
            handler="index.lambda_handler",
            runtime="python3.11",
            timeout=30,
            memory_size=256,
            environment=LambdaFunctionEnvironment(
                variables={
                    "DYNAMODB_TABLE": transactions_table.name
                }
            ),
            tracing_config=LambdaFunctionTracingConfig(
                mode="Active"
            ),
            filename=f"{lambda_dir}/api_handler.zip",
            source_code_hash=Fn.filebase64sha256(f"{lambda_dir}/api_handler.zip"),
            depends_on=[api_log_group]
        )

        # Fraud Detection Lambda (VPC-enabled)
        with open(os.path.join(lambda_dir, "fraud_detection.py"), "r", encoding="utf-8") as f:
            fraud_detection_code = f.read()

        fraud_detection_lambda = LambdaFunction(
            self,
            "fraud_detection_lambda",
            function_name=f"fraud-detection-{environment_suffix}",
            role=fraud_detection_lambda_role.arn,
            handler="index.lambda_handler",
            runtime="python3.11",
            timeout=60,
            memory_size=512,
            environment=LambdaFunctionEnvironment(
                variables={
                    "SQS_QUEUE_URL": suspicious_transactions_queue.url
                }
            ),
            vpc_config=LambdaFunctionVpcConfig(
                subnet_ids=[private_subnet_1.id, private_subnet_2.id],
                security_group_ids=[lambda_security_group.id]
            ),
            tracing_config=LambdaFunctionTracingConfig(
                mode="Active"
            ),
            filename=f"{lambda_dir}/fraud_detection.zip",
            source_code_hash=Fn.filebase64sha256(f"{lambda_dir}/fraud_detection.zip"),
            depends_on=[fraud_detection_log_group]
        )

        # Notification Lambda
        with open(os.path.join(lambda_dir, "notification_handler.py"), "r", encoding="utf-8") as f:
            notification_handler_code = f.read()

        notification_lambda = LambdaFunction(
            self,
            "notification_lambda",
            function_name=f"notification-handler-{environment_suffix}",
            role=notification_lambda_role.arn,
            handler="index.lambda_handler",
            runtime="python3.11",
            timeout=30,
            memory_size=256,
            environment=LambdaFunctionEnvironment(
                variables={
                    "SNS_TOPIC_ARN": fraud_alerts_topic.arn
                }
            ),
            tracing_config=LambdaFunctionTracingConfig(
                mode="Active"
            ),
            filename=f"{lambda_dir}/notification_handler.zip",
            source_code_hash=Fn.filebase64sha256(f"{lambda_dir}/notification_handler.zip"),
            depends_on=[notification_log_group]
        )

        # 13. DynamoDB Stream to Lambda Event Source Mapping
        LambdaEventSourceMapping(
            self,
            "dynamodb_stream_mapping",
            event_source_arn=transactions_table.stream_arn,
            function_name=fraud_detection_lambda.function_name,
            starting_position="LATEST",
            batch_size=100,
            maximum_batching_window_in_seconds=10
        )

        # 14. SQS to Lambda Event Source Mapping
        LambdaEventSourceMapping(
            self,
            "sqs_event_source_mapping",
            event_source_arn=suspicious_transactions_queue.arn,
            function_name=notification_lambda.function_name,
            batch_size=10,
            maximum_batching_window_in_seconds=5
        )

        # 15. API Gateway REST API
        api = ApiGatewayRestApi(
            self,
            "fraud_detection_api",
            name=f"fraud-detection-api-{environment_suffix}",
            description="REST API for fraud detection transaction submission",
            endpoint_configuration={
                "types": ["REGIONAL"]
            }
        )

        # API Gateway Resource
        transactions_resource = ApiGatewayResource(
            self,
            "transactions_resource",
            rest_api_id=api.id,
            parent_id=api.root_resource_id,
            path_part="transactions"
        )

        # API Gateway Method
        post_method = ApiGatewayMethod(
            self,
            "transactions_post_method",
            rest_api_id=api.id,
            resource_id=transactions_resource.id,
            http_method="POST",
            authorization="NONE"
        )

        # API Gateway Integration
        api_integration = ApiGatewayIntegration(
            self,
            "transactions_lambda_integration",
            rest_api_id=api.id,
            resource_id=transactions_resource.id,
            http_method=post_method.http_method,
            integration_http_method="POST",
            type="AWS_PROXY",
            uri=f"arn:aws:apigateway:{aws_region}:lambda:path/2015-03-31/functions/{api_lambda.arn}/invocations"
        )

        # Lambda Permission for API Gateway
        LambdaPermission(
            self,
            "api_gateway_lambda_permission",
            statement_id="AllowExecutionFromAPIGateway",
            action="lambda:InvokeFunction",
            function_name=api_lambda.function_name,
            principal="apigateway.amazonaws.com",
            source_arn=f"{api.execution_arn}/*/*"
        )

        # API Gateway Deployment
        deployment = ApiGatewayDeployment(
            self,
            "api_deployment",
            rest_api_id=api.id,
            depends_on=[post_method, api_integration],
            lifecycle={
                "create_before_destroy": True
            }
        )

        # API Gateway Stage with X-Ray tracing
        stage = ApiGatewayStage(
            self,
            "api_stage",
            deployment_id=deployment.id,
            rest_api_id=api.id,
            stage_name="prod",
            xray_tracing_enabled=True
        )

        # API Gateway Method Settings for throttling
        ApiGatewayMethodSettings(
            self,
            "api_method_settings",
            rest_api_id=api.id,
            stage_name=stage.stage_name,
            method_path="*/*",
            settings={
                "throttling_burst_limit": 1000,
                "throttling_rate_limit": 1000
            }
        )

        # 16. Outputs
        TerraformOutput(
            self,
            "api_endpoint",
            value=f"https://{api.id}.execute-api.{aws_region}.amazonaws.com/{stage.stage_name}/transactions",
            description="API Gateway endpoint URL"
        )

        TerraformOutput(
            self,
            "dynamodb_table_name",
            value=transactions_table.name,
            description="DynamoDB transactions table name"
        )

        TerraformOutput(
            self,
            "sqs_queue_url",
            value=suspicious_transactions_queue.url,
            description="SQS queue URL for suspicious transactions"
        )

        TerraformOutput(
            self,
            "sns_topic_arn",
            value=fraud_alerts_topic.arn,
            description="SNS topic ARN for fraud alerts"
        )

        TerraformOutput(
            self,
            "kms_key_id",
            value=kms_key.key_id,
            description="KMS key ID for encryption"
        )
