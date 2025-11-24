"""TAP Stack module for payment processing infrastructure."""

from cdktf import TerraformStack, S3Backend, TerraformOutput, Fn, TerraformAsset, AssetType
from constructs import Construct
from cdktf_cdktf_provider_aws.provider import AwsProvider
from cdktf_cdktf_provider_aws.s3_bucket import S3Bucket
from cdktf_cdktf_provider_aws.s3_bucket_versioning import S3BucketVersioningA, S3BucketVersioningVersioningConfiguration
from cdktf_cdktf_provider_aws.s3_bucket_server_side_encryption_configuration import (
    S3BucketServerSideEncryptionConfigurationA,
    S3BucketServerSideEncryptionConfigurationRuleA,
    S3BucketServerSideEncryptionConfigurationRuleApplyServerSideEncryptionByDefaultA
)
from cdktf_cdktf_provider_aws.s3_bucket_public_access_block import S3BucketPublicAccessBlock
from cdktf_cdktf_provider_aws.s3_bucket_notification import S3BucketNotification, S3BucketNotificationLambdaFunction
from cdktf_cdktf_provider_aws.dynamodb_table import (
    DynamodbTable,
    DynamodbTableGlobalSecondaryIndex,
    DynamodbTableAttribute,
    DynamodbTablePointInTimeRecovery
)
from cdktf_cdktf_provider_aws.iam_role import IamRole
from cdktf_cdktf_provider_aws.iam_role_policy import IamRolePolicy
from cdktf_cdktf_provider_aws.iam_role_policy_attachment import IamRolePolicyAttachment
from cdktf_cdktf_provider_aws.lambda_function import LambdaFunction, LambdaFunctionEnvironment
from cdktf_cdktf_provider_aws.lambda_permission import LambdaPermission
from cdktf_cdktf_provider_aws.sns_topic import SnsTopic
from cdktf_cdktf_provider_aws.sns_topic_subscription import SnsTopicSubscription
from cdktf_cdktf_provider_aws.sqs_queue import SqsQueue
from cdktf_cdktf_provider_aws.sqs_queue_redrive_policy import SqsQueueRedrivePolicy
from cdktf_cdktf_provider_aws.sfn_state_machine import SfnStateMachine
from cdktf_cdktf_provider_aws.api_gateway_rest_api import ApiGatewayRestApi
from cdktf_cdktf_provider_aws.api_gateway_resource import ApiGatewayResource
from cdktf_cdktf_provider_aws.api_gateway_method import ApiGatewayMethod
from cdktf_cdktf_provider_aws.api_gateway_integration import ApiGatewayIntegration
from cdktf_cdktf_provider_aws.api_gateway_deployment import ApiGatewayDeployment
from cdktf_cdktf_provider_aws.api_gateway_stage import ApiGatewayStage
from cdktf_cdktf_provider_aws.api_gateway_request_validator import ApiGatewayRequestValidator
from cdktf_cdktf_provider_aws.api_gateway_usage_plan import (
    ApiGatewayUsagePlan,
    ApiGatewayUsagePlanQuotaSettings,
    ApiGatewayUsagePlanApiStages
)
from cdktf_cdktf_provider_aws.cloudwatch_log_group import CloudwatchLogGroup
from cdktf_cdktf_provider_aws.cloudwatch_metric_alarm import CloudwatchMetricAlarm
import json
import os
import subprocess
from pathlib import Path


class TapStack(TerraformStack):
    """CDKTF Python stack for payment processing infrastructure."""

    def __init__(
        self,
        scope: Construct,
        construct_id: str,
        **kwargs
    ):
        """Initialize the payment processing stack with AWS infrastructure."""
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

        # Configure S3 Backend conditionally
        if state_bucket and state_bucket.strip():
            S3Backend(
                self,
                bucket=state_bucket,
                key=f"{environment_suffix}/{construct_id}.tfstate",
                region=state_bucket_region,
                encrypt=True
            )

        # Resource tags
        common_tags = {
            "Environment": environment_suffix,
            "Application": "payment-processing",
            "CostCenter": "payments",
            "ManagedBy": "CDKTF"
        }

        # ========================================
        # S3 Bucket for Batch Payment Files
        # ========================================

        # Get AWS account ID from boto3 for unique bucket naming
        import boto3
        sts = boto3.client('sts')
        account_id = sts.get_caller_identity()['Account']

        payment_files_bucket = S3Bucket(
            self,
            "payment_files_bucket",
            bucket=f"payment-batch-files-{account_id}-{environment_suffix}",
            force_destroy=True,
            tags=common_tags
        )

        # Enable versioning
        S3BucketVersioningA(
            self,
            "payment_files_bucket_versioning",
            bucket=payment_files_bucket.id,
            versioning_configuration=S3BucketVersioningVersioningConfiguration(
                status="Enabled"
            )
        )

        # Enable encryption
        S3BucketServerSideEncryptionConfigurationA(
            self,
            "payment_files_bucket_encryption",
            bucket=payment_files_bucket.id,
            rule=[
                S3BucketServerSideEncryptionConfigurationRuleA(
                    apply_server_side_encryption_by_default=(
                        S3BucketServerSideEncryptionConfigurationRuleApplyServerSideEncryptionByDefaultA(
                            sse_algorithm="AES256"
                        )
                    ),
                    bucket_key_enabled=True,
                )
            ]
        )

        # Block public access
        S3BucketPublicAccessBlock(
            self,
            "payment_files_bucket_public_access_block",
            bucket=payment_files_bucket.id,
            block_public_acls=True,
            block_public_policy=True,
            ignore_public_acls=True,
            restrict_public_buckets=True
        )

        # ========================================
        # DynamoDB Tables
        # ========================================

        # Payments table with GSI for timestamp queries
        payments_table = DynamodbTable(
            self,
            "payments_table",
            name=f"payments-{environment_suffix}",
            billing_mode="PAY_PER_REQUEST",
            hash_key="payment_id",
            attribute=[
                DynamodbTableAttribute(name="payment_id", type="S"),
                DynamodbTableAttribute(name="timestamp", type="N"),
                DynamodbTableAttribute(name="status", type="S")
            ],
            global_secondary_index=[
                DynamodbTableGlobalSecondaryIndex(
                    name="timestamp-index",
                    hash_key="timestamp",
                    projection_type="ALL"
                ),
                DynamodbTableGlobalSecondaryIndex(
                    name="status-index",
                    hash_key="status",
                    range_key="timestamp",
                    projection_type="ALL"
                )
            ],
            point_in_time_recovery=DynamodbTablePointInTimeRecovery(enabled=True),
            tags=common_tags
        )

        # Processing status table
        processing_status_table = DynamodbTable(
            self,
            "processing_status_table",
            name=f"payment-processing-status-{environment_suffix}",
            billing_mode="PAY_PER_REQUEST",
            hash_key="batch_id",
            attribute=[
                DynamodbTableAttribute(name="batch_id", type="S"),
                DynamodbTableAttribute(name="created_at", type="N")
            ],
            global_secondary_index=[
                DynamodbTableGlobalSecondaryIndex(
                    name="created-at-index",
                    hash_key="created_at",
                    projection_type="ALL"
                )
            ],
            point_in_time_recovery=DynamodbTablePointInTimeRecovery(enabled=True),
            tags=common_tags
        )

        # Audit log table
        audit_table = DynamodbTable(
            self,
            "audit_table",
            name=f"payment-audit-log-{environment_suffix}",
            billing_mode="PAY_PER_REQUEST",
            hash_key="audit_id",
            attribute=[
                DynamodbTableAttribute(name="audit_id", type="S"),
                DynamodbTableAttribute(name="timestamp", type="N")
            ],
            global_secondary_index=[
                DynamodbTableGlobalSecondaryIndex(
                    name="timestamp-index",
                    hash_key="timestamp",
                    projection_type="ALL"
                )
            ],
            point_in_time_recovery=DynamodbTablePointInTimeRecovery(enabled=True),
            tags=common_tags
        )

        # ========================================
        # SNS Topic for Payment Notifications
        # ========================================

        payment_notifications_topic = SnsTopic(
            self,
            "payment_notifications_topic",
            name=f"payment-notifications-{environment_suffix}",
            tags=common_tags
        )

        # ========================================
        # SQS Queues with DLQ
        # ========================================

        # Dead Letter Queue
        payment_dlq = SqsQueue(
            self,
            "payment_dlq",
            name=f"payment-processing-dlq-{environment_suffix}",
            message_retention_seconds=1209600,  # 14 days
            tags=common_tags
        )

        # Main processing queue
        payment_queue = SqsQueue(
            self,
            "payment_queue",
            name=f"payment-processing-queue-{environment_suffix}",
            visibility_timeout_seconds=300,
            message_retention_seconds=345600,  # 4 days
            tags=common_tags
        )

        # Attach DLQ to main queue
        SqsQueueRedrivePolicy(
            self,
            "payment_queue_redrive_policy",
            queue_url=payment_queue.id,
            redrive_policy=json.dumps({
                "deadLetterTargetArn": payment_dlq.arn,
                "maxReceiveCount": 3
            })
        )

        # ========================================
        # IAM Roles for Lambda Functions
        # ========================================

        # Lambda execution role for payment processor
        payment_processor_role = IamRole(
            self,
            "payment_processor_role",
            name=f"payment-processor-role-{environment_suffix}",
            assume_role_policy=json.dumps({
                "Version": "2012-10-17",
                "Statement": [{
                    "Effect": "Allow",
                    "Principal": {"Service": "lambda.amazonaws.com"},
                    "Action": "sts:AssumeRole"
                }]
            }),
            tags=common_tags
        )

        # Attach basic Lambda execution policy
        IamRolePolicyAttachment(
            self,
            "payment_processor_basic_execution",
            role=payment_processor_role.name,
            policy_arn="arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"
        )

        # Custom policy for DynamoDB and SNS access
        IamRolePolicy(
            self,
            "payment_processor_policy",
            role=payment_processor_role.id,
            policy=json.dumps({
                "Version": "2012-10-17",
                "Statement": [
                    {
                        "Effect": "Allow",
                        "Action": [
                            "dynamodb:PutItem",
                            "dynamodb:GetItem",
                            "dynamodb:UpdateItem",
                            "dynamodb:Query"
                        ],
                        "Resource": [
                            payments_table.arn,
                            f"{payments_table.arn}/index/*",
                            audit_table.arn,
                            f"{audit_table.arn}/index/*"
                        ]
                    },
                    {
                        "Effect": "Allow",
                        "Action": [
                            "sns:Publish"
                        ],
                        "Resource": payment_notifications_topic.arn
                    },
                    {
                        "Effect": "Allow",
                        "Action": [
                            "sqs:ReceiveMessage",
                            "sqs:DeleteMessage",
                            "sqs:GetQueueAttributes"
                        ],
                        "Resource": payment_queue.arn
                    }
                ]
            })
        )

        # Lambda role for batch file processor
        batch_processor_role = IamRole(
            self,
            "batch_processor_role",
            name=f"batch-processor-role-{environment_suffix}",
            assume_role_policy=json.dumps({
                "Version": "2012-10-17",
                "Statement": [{
                    "Effect": "Allow",
                    "Principal": {"Service": "lambda.amazonaws.com"},
                    "Action": "sts:AssumeRole"
                }]
            }),
            tags=common_tags
        )

        IamRolePolicyAttachment(
            self,
            "batch_processor_basic_execution",
            role=batch_processor_role.name,
            policy_arn="arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"
        )

        IamRolePolicy(
            self,
            "batch_processor_policy",
            role=batch_processor_role.id,
            policy=json.dumps({
                "Version": "2012-10-17",
                "Statement": [
                    {
                        "Effect": "Allow",
                        "Action": [
                            "s3:GetObject"
                        ],
                        "Resource": f"{payment_files_bucket.arn}/*"
                    },
                    {
                        "Effect": "Allow",
                        "Action": [
                            "dynamodb:PutItem",
                            "dynamodb:UpdateItem"
                        ],
                        "Resource": [
                            processing_status_table.arn,
                            payments_table.arn
                        ]
                    },
                    {
                        "Effect": "Allow",
                        "Action": [
                            "sqs:SendMessage"
                        ],
                        "Resource": payment_queue.arn
                    }
                ]
            })
        )

        # Lambda role for API handler
        api_handler_role = IamRole(
            self,
            "api_handler_role",
            name=f"payment-api-handler-role-{environment_suffix}",
            assume_role_policy=json.dumps({
                "Version": "2012-10-17",
                "Statement": [{
                    "Effect": "Allow",
                    "Principal": {"Service": "lambda.amazonaws.com"},
                    "Action": "sts:AssumeRole"
                }]
            }),
            tags=common_tags
        )

        IamRolePolicyAttachment(
            self,
            "api_handler_basic_execution",
            role=api_handler_role.name,
            policy_arn="arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"
        )

        IamRolePolicy(
            self,
            "api_handler_policy",
            role=api_handler_role.id,
            policy=json.dumps({
                "Version": "2012-10-17",
                "Statement": [
                    {
                        "Effect": "Allow",
                        "Action": [
                            "dynamodb:PutItem",
                            "dynamodb:GetItem",
                            "dynamodb:Query"
                        ],
                        "Resource": [
                            payments_table.arn,
                            f"{payments_table.arn}/index/*"
                        ]
                    },
                    {
                        "Effect": "Allow",
                        "Action": [
                            "states:StartExecution"
                        ],
                        "Resource": "*"
                    }
                ]
            })
        )

        # ========================================
        # CloudWatch Log Groups
        # ========================================

        payment_processor_log_group = CloudwatchLogGroup(
            self,
            "payment_processor_log_group",
            name=f"/aws/lambda/payment-processor-{environment_suffix}",
            retention_in_days=7,
            tags=common_tags
        )

        batch_processor_log_group = CloudwatchLogGroup(
            self,
            "batch_processor_log_group",
            name=f"/aws/lambda/batch-processor-{environment_suffix}",
            retention_in_days=7,
            tags=common_tags
        )

        api_handler_log_group = CloudwatchLogGroup(
            self,
            "api_handler_log_group",
            name=f"/aws/lambda/payment-api-handler-{environment_suffix}",
            retention_in_days=7,
            tags=common_tags
        )

        # ========================================
        # Lambda Functions with ZIP Deployment
        # ========================================

        # Helper function to create Lambda ZIP assets
        def create_lambda_asset(function_name: str) -> TerraformAsset:
            """Create a TerraformAsset for Lambda function code."""
            source_dir = Path(__file__).parent / "lambda" / function_name

            # Create temporary directory for ZIP
            # TerraformAsset with ARCHIVE type will create ZIP from directory
            return TerraformAsset(
                self,
                f"{function_name}_asset",
                path=str(source_dir),
                type=AssetType.ARCHIVE
            )

        # Payment processor Lambda
        payment_processor_asset = create_lambda_asset("payment_processor")

        payment_processor_lambda = LambdaFunction(
            self,
            "payment_processor_lambda",
            function_name=f"payment-processor-{environment_suffix}",
            role=payment_processor_role.arn,
            handler="index.handler",
            runtime="python3.12",
            filename=payment_processor_asset.path,
            source_code_hash=Fn.filebase64sha256(payment_processor_asset.path),
            timeout=60,
            memory_size=512,
            environment=LambdaFunctionEnvironment(
                variables={
                    "PAYMENTS_TABLE": payments_table.name,
                    "AUDIT_TABLE": audit_table.name,
                    "SNS_TOPIC_ARN": payment_notifications_topic.arn,
                    "ENVIRONMENT": environment_suffix
                }
            ),
            depends_on=[payment_processor_log_group],
            tags=common_tags
        )

        # Batch processor Lambda
        batch_processor_asset = create_lambda_asset("batch_processor")

        batch_processor_lambda = LambdaFunction(
            self,
            "batch_processor_lambda",
            function_name=f"batch-processor-{environment_suffix}",
            role=batch_processor_role.arn,
            handler="index.handler",
            runtime="python3.12",
            filename=batch_processor_asset.path,
            source_code_hash=Fn.filebase64sha256(batch_processor_asset.path),
            timeout=300,
            memory_size=1024,
            environment=LambdaFunctionEnvironment(
                variables={
                    "PROCESSING_STATUS_TABLE": processing_status_table.name,
                    "PAYMENTS_TABLE": payments_table.name,
                    "PAYMENT_QUEUE_URL": payment_queue.url,
                    "ENVIRONMENT": environment_suffix
                }
            ),
            depends_on=[batch_processor_log_group],
            tags=common_tags
        )

        # S3 trigger for batch processor
        LambdaPermission(
            self,
            "batch_processor_s3_permission",
            statement_id="AllowS3Invoke",
            action="lambda:InvokeFunction",
            function_name=batch_processor_lambda.function_name,
            principal="s3.amazonaws.com",
            source_arn=payment_files_bucket.arn
        )

        S3BucketNotification(
            self,
            "payment_files_bucket_notification",
            bucket=payment_files_bucket.id,
            lambda_function=[
                S3BucketNotificationLambdaFunction(
                    lambda_function_arn=batch_processor_lambda.arn,
                    events=["s3:ObjectCreated:*"],
                    filter_suffix=".csv"
                )
            ]
        )

        # API handler Lambda
        api_handler_asset = create_lambda_asset("api_handler")

        api_handler_lambda = LambdaFunction(
            self,
            "api_handler_lambda",
            function_name=f"payment-api-handler-{environment_suffix}",
            role=api_handler_role.arn,
            handler="index.handler",
            runtime="python3.12",
            filename=api_handler_asset.path,
            source_code_hash=Fn.filebase64sha256(api_handler_asset.path),
            timeout=30,
            memory_size=256,
            environment=LambdaFunctionEnvironment(
                variables={
                    "PAYMENTS_TABLE": payments_table.name,
                    "ENVIRONMENT": environment_suffix
                }
            ),
            depends_on=[api_handler_log_group],
            tags=common_tags
        )

        # ========================================
        # Step Functions State Machine
        # ========================================

        # IAM role for Step Functions
        sfn_role = IamRole(
            self,
            "sfn_role",
            name=f"payment-workflow-sfn-role-{environment_suffix}",
            assume_role_policy=json.dumps({
                "Version": "2012-10-17",
                "Statement": [{
                    "Effect": "Allow",
                    "Principal": {"Service": "states.amazonaws.com"},
                    "Action": "sts:AssumeRole"
                }]
            }),
            tags=common_tags
        )

        IamRolePolicy(
            self,
            "sfn_policy",
            role=sfn_role.id,
            policy=json.dumps({
                "Version": "2012-10-17",
                "Statement": [
                    {
                        "Effect": "Allow",
                        "Action": [
                            "lambda:InvokeFunction"
                        ],
                        "Resource": [
                            payment_processor_lambda.arn
                        ]
                    },
                    {
                        "Effect": "Allow",
                        "Action": [
                            "sns:Publish"
                        ],
                        "Resource": payment_notifications_topic.arn
                    }
                ]
            })
        )

        # State machine definition
        state_machine_definition = {
            "Comment": "Payment processing workflow",
            "StartAt": "ValidatePayment",
            "States": {
                "ValidatePayment": {
                    "Type": "Task",
                    "Resource": payment_processor_lambda.arn,
                    "ResultPath": "$.validationResult",
                    "Next": "CheckValidation"
                },
                "CheckValidation": {
                    "Type": "Choice",
                    "Choices": [
                        {
                            "Variable": "$.validationResult.status",
                            "StringEquals": "valid",
                            "Next": "ProcessPayment"
                        }
                    ],
                    "Default": "PaymentFailed"
                },
                "ProcessPayment": {
                    "Type": "Task",
                    "Resource": payment_processor_lambda.arn,
                    "ResultPath": "$.processingResult",
                    "Next": "NotifySuccess",
                    "Retry": [
                        {
                            "ErrorEquals": ["States.ALL"],
                            "IntervalSeconds": 2,
                            "MaxAttempts": 3,
                            "BackoffRate": 2.0
                        }
                    ],
                    "Catch": [
                        {
                            "ErrorEquals": ["States.ALL"],
                            "Next": "PaymentFailed",
                            "ResultPath": "$.error"
                        }
                    ]
                },
                "NotifySuccess": {
                    "Type": "Task",
                    "Resource": "arn:aws:states:::sns:publish",
                    "Parameters": {
                        "TopicArn": payment_notifications_topic.arn,
                        "Message.$": "$.processingResult"
                    },
                    "End": True
                },
                "PaymentFailed": {
                    "Type": "Task",
                    "Resource": "arn:aws:states:::sns:publish",
                    "Parameters": {
                        "TopicArn": payment_notifications_topic.arn,
                        "Message": "Payment processing failed"
                    },
                    "End": True
                }
            }
        }

        payment_workflow = SfnStateMachine(
            self,
            "payment_workflow",
            name=f"payment-workflow-{environment_suffix}",
            role_arn=sfn_role.arn,
            definition=json.dumps(state_machine_definition),
            tags=common_tags
        )

        # ========================================
        # API Gateway
        # ========================================

        # REST API
        payment_api = ApiGatewayRestApi(
            self,
            "payment_api",
            name=f"payment-api-{environment_suffix}",
            description="Payment Processing API",
            tags=common_tags
        )

        # Payments resource
        payments_resource = ApiGatewayResource(
            self,
            "payments_resource",
            rest_api_id=payment_api.id,
            parent_id=payment_api.root_resource_id,
            path_part="payments"
        )

        # POST /payments method
        post_payment_method = ApiGatewayMethod(
            self,
            "post_payment_method",
            rest_api_id=payment_api.id,
            resource_id=payments_resource.id,
            http_method="POST",
            authorization="NONE",
            request_validator_id="${aws_api_gateway_request_validator.payment_api_validator.id}"
        )

        # Request validator
        request_validator = ApiGatewayRequestValidator(
            self,
            "payment_api_validator",
            name=f"payment-api-validator-{environment_suffix}",
            rest_api_id=payment_api.id,
            validate_request_body=True,
            validate_request_parameters=True
        )

        # Lambda integration
        post_payment_integration = ApiGatewayIntegration(
            self,
            "post_payment_integration",
            rest_api_id=payment_api.id,
            resource_id=payments_resource.id,
            http_method=post_payment_method.http_method,
            integration_http_method="POST",
            type="AWS_PROXY",
            uri=api_handler_lambda.invoke_arn
        )

        # Lambda permission for API Gateway
        LambdaPermission(
            self,
            "api_handler_permission",
            statement_id="AllowAPIGatewayInvoke",
            action="lambda:InvokeFunction",
            function_name=api_handler_lambda.function_name,
            principal="apigateway.amazonaws.com",
            source_arn=f"{payment_api.execution_arn}/*/*"
        )

        # GET /payments/{id} method
        payment_id_resource = ApiGatewayResource(
            self,
            "payment_id_resource",
            rest_api_id=payment_api.id,
            parent_id=payments_resource.id,
            path_part="{id}"
        )

        get_payment_method = ApiGatewayMethod(
            self,
            "get_payment_method",
            rest_api_id=payment_api.id,
            resource_id=payment_id_resource.id,
            http_method="GET",
            authorization="NONE"
        )

        get_payment_integration = ApiGatewayIntegration(
            self,
            "get_payment_integration",
            rest_api_id=payment_api.id,
            resource_id=payment_id_resource.id,
            http_method=get_payment_method.http_method,
            integration_http_method="POST",
            type="AWS_PROXY",
            uri=api_handler_lambda.invoke_arn
        )

        # API Deployment
        api_deployment = ApiGatewayDeployment(
            self,
            "payment_api_deployment",
            rest_api_id=payment_api.id,
            depends_on=[
                post_payment_integration,
                get_payment_integration
            ],
            lifecycle={"create_before_destroy": True}
        )

        # API Stage
        api_stage = ApiGatewayStage(
            self,
            "payment_api_stage",
            deployment_id=api_deployment.id,
            rest_api_id=payment_api.id,
            stage_name=environment_suffix,
            tags=common_tags
        )

        # Usage Plan
        usage_plan = ApiGatewayUsagePlan(
            self,
            "payment_api_usage_plan",
            name=f"payment-api-usage-plan-{environment_suffix}",
            api_stages=[
                ApiGatewayUsagePlanApiStages(
                    api_id=payment_api.id,
                    stage=api_stage.stage_name
                )
            ],
            quota_settings=ApiGatewayUsagePlanQuotaSettings(
                limit=10000,
                period="DAY"
            ),
            tags=common_tags
        )

        # ========================================
        # CloudWatch Alarms
        # ========================================

        # Lambda errors alarm
        CloudwatchMetricAlarm(
            self,
            "payment_processor_errors_alarm",
            alarm_name=f"payment-processor-errors-{environment_suffix}",
            comparison_operator="GreaterThanThreshold",
            evaluation_periods=2,
            metric_name="Errors",
            namespace="AWS/Lambda",
            period=300,
            statistic="Sum",
            threshold=5,
            alarm_description="Alert when payment processor has too many errors",
            dimensions={
                "FunctionName": payment_processor_lambda.function_name
            },
            alarm_actions=[payment_notifications_topic.arn],
            tags=common_tags
        )

        # DLQ messages alarm
        CloudwatchMetricAlarm(
            self,
            "payment_dlq_messages_alarm",
            alarm_name=f"payment-dlq-messages-{environment_suffix}",
            comparison_operator="GreaterThanThreshold",
            evaluation_periods=1,
            metric_name="ApproximateNumberOfMessagesVisible",
            namespace="AWS/SQS",
            period=300,
            statistic="Average",
            threshold=0,
            alarm_description="Alert when messages arrive in DLQ",
            dimensions={
                "QueueName": payment_dlq.name
            },
            alarm_actions=[payment_notifications_topic.arn],
            tags=common_tags
        )

        # API 5xx errors alarm
        CloudwatchMetricAlarm(
            self,
            "payment_api_errors_alarm",
            alarm_name=f"payment-api-5xx-errors-{environment_suffix}",
            comparison_operator="GreaterThanThreshold",
            evaluation_periods=2,
            metric_name="5XXError",
            namespace="AWS/ApiGateway",
            period=300,
            statistic="Sum",
            threshold=10,
            alarm_description="Alert when API has too many 5xx errors",
            dimensions={
                "ApiName": payment_api.name
            },
            alarm_actions=[payment_notifications_topic.arn],
            tags=common_tags
        )

        # ========================================
        # Outputs
        # ========================================

        TerraformOutput(
            self,
            "api_endpoint",
            value=f"https://{payment_api.id}.execute-api.{aws_region}.amazonaws.com/{environment_suffix}",
            description="Payment API endpoint URL"
        )

        TerraformOutput(
            self,
            "payments_table_name",
            value=payments_table.name,
            description="DynamoDB payments table name"
        )

        TerraformOutput(
            self,
            "payment_files_bucket_name",
            value=payment_files_bucket.bucket,
            description="S3 bucket for batch payment files"
        )

        TerraformOutput(
            self,
            "payment_queue_url",
            value=payment_queue.url,
            description="SQS queue URL for payment processing"
        )

        TerraformOutput(
            self,
            "payment_workflow_arn",
            value=payment_workflow.arn,
            description="Step Functions state machine ARN"
        )

        TerraformOutput(
            self,
            "sns_topic_arn",
            value=payment_notifications_topic.arn,
            description="SNS topic ARN for notifications"
        )
