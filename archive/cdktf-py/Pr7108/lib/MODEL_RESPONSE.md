# Payment Processing Infrastructure - CDKTF Python Implementation

This implementation provides a complete payment processing infrastructure using CDKTF with Python.

## File: cdktf.json

```json
{
  "language": "python",
  "app": "pipenv run python tap.py",
  "projectId": "payment-processing-infrastructure",
  "sendCrashReports": "false",
  "terraformProviders": [
    "aws@~> 6.0"
  ],
  "terraformModules": [],
  "context": {}
}
```

## File: tap.py

```python
#!/usr/bin/env python
import sys
import os
from datetime import datetime, timezone
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from cdktf import App
from lib.tap_stack import TapStack

# Get environment variables from the environment or use defaults
environment_suffix = os.getenv("ENVIRONMENT_SUFFIX", "dev")
state_bucket = os.getenv("TERRAFORM_STATE_BUCKET", "iac-rlhf-tf-states")
state_bucket_region = os.getenv("TERRAFORM_STATE_BUCKET_REGION", "us-east-1")
aws_region = os.getenv("AWS_REGION", "us-east-1")
repository_name = os.getenv("REPOSITORY", "unknown")
commit_author = os.getenv("COMMIT_AUTHOR", "unknown")
pr_number = os.getenv("PR_NUMBER", "unknown")
team = os.getenv("TEAM", "unknown")
created_at = datetime.now(timezone.utc).isoformat()

# Calculate the stack name
stack_name = f"TapStack{environment_suffix}"

# default_tags is structured in adherence to the AwsProvider default_tags interface
default_tags = {
    "tags": {
        "Environment": environment_suffix,
        "Repository": repository_name,
        "Author": commit_author,
        "PRNumber": pr_number,
        "Team": team,
        "CreatedAt": created_at,
    }
}

app = App()

# Create the TapStack with the calculated properties
TapStack(
    app,
    stack_name,
    environment_suffix=environment_suffix,
    state_bucket=state_bucket,
    state_bucket_region=state_bucket_region,
    aws_region=aws_region,
    default_tags=default_tags,
)

# Synthesize the app to generate the Terraform configuration
app.synth()
```

## File: lib/__init__.py

```python
"""TAP Stack library package."""
```

## File: lib/tap_stack.py

```python
"""TAP Stack module for payment processing infrastructure."""

from cdktf import TerraformStack, S3Backend, TerraformOutput, Fn, TerraformAsset, AssetType
from constructs import Construct
from cdktf_cdktf_provider_aws.provider import AwsProvider
from cdktf_cdktf_provider_aws.s3_bucket import S3Bucket
from cdktf_cdktf_provider_aws.s3_bucket_versioning import S3BucketVersioningA, S3BucketVersioningVersioningConfiguration
from cdktf_cdktf_provider_aws.s3_bucket_server_side_encryption_configuration import (
    S3BucketServerSideEncryptionConfigurationA,
    S3BucketServerSideEncryptionConfigurationRuleA,
    S3BucketServerSideEncryptionConfigurationRuleApplyServerSideEncryptionByDefault
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
import tempfile
import shutil
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
            "CostCenter": "payments"
        }

        # ========================================
        # S3 Bucket for Batch Payment Files
        # ========================================

        payment_files_bucket = S3Bucket(
            self,
            "payment_files_bucket",
            bucket=f"payment-batch-files-{environment_suffix}",
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
                    apply_server_side_encryption_by_default=S3BucketServerSideEncryptionConfigurationRuleApplyServerSideEncryptionByDefault(
                        sse_algorithm="AES256"
                    ),
                    bucket_key_enabled=True
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
            temp_dir = tempfile.mkdtemp()
            zip_path = os.path.join(temp_dir, f"{function_name}.zip")

            # Create ZIP file
            shutil.make_archive(
                os.path.join(temp_dir, function_name),
                'zip',
                source_dir
            )

            return TerraformAsset(
                self,
                f"{function_name}_asset",
                path=zip_path,
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
```

## File: lib/lambda/payment_processor/index.py

```python
"""Payment processor Lambda function."""

import json
import os
import boto3
from datetime import datetime
from decimal import Decimal

dynamodb = boto3.resource('dynamodb')
sns = boto3.client('sns')

PAYMENTS_TABLE = os.environ['PAYMENTS_TABLE']
AUDIT_TABLE = os.environ['AUDIT_TABLE']
SNS_TOPIC_ARN = os.environ['SNS_TOPIC_ARN']
ENVIRONMENT = os.environ['ENVIRONMENT']


def handler(event, context):
    """Process payment transactions."""
    try:
        # Parse input
        if 'body' in event:
            payment_data = json.loads(event['body'])
        else:
            payment_data = event

        payment_id = payment_data.get('payment_id')
        amount = payment_data.get('amount')
        currency = payment_data.get('currency', 'USD')

        if not payment_id or not amount:
            return {
                'statusCode': 400,
                'body': json.dumps({'error': 'Missing required fields'})
            }

        # Validate payment
        if amount <= 0:
            return {
                'statusCode': 400,
                'body': json.dumps({'error': 'Invalid amount'})
            }

        timestamp = int(datetime.utcnow().timestamp())

        # Store in DynamoDB
        payments_table = dynamodb.Table(PAYMENTS_TABLE)
        payments_table.put_item(
            Item={
                'payment_id': payment_id,
                'amount': Decimal(str(amount)),
                'currency': currency,
                'status': 'processed',
                'timestamp': timestamp,
                'environment': ENVIRONMENT,
                'processed_at': datetime.utcnow().isoformat()
            }
        )

        # Audit log
        audit_table = dynamodb.Table(AUDIT_TABLE)
        audit_table.put_item(
            Item={
                'audit_id': f"{payment_id}-{timestamp}",
                'payment_id': payment_id,
                'action': 'payment_processed',
                'timestamp': timestamp,
                'details': json.dumps({
                    'amount': float(amount),
                    'currency': currency,
                    'environment': ENVIRONMENT
                })
            }
        )

        # Send notification
        sns.publish(
            TopicArn=SNS_TOPIC_ARN,
            Subject=f"Payment Processed: {payment_id}",
            Message=json.dumps({
                'payment_id': payment_id,
                'amount': float(amount),
                'currency': currency,
                'status': 'processed',
                'timestamp': timestamp
            })
        )

        return {
            'statusCode': 200,
            'body': json.dumps({
                'message': 'Payment processed successfully',
                'payment_id': payment_id,
                'status': 'processed'
            })
        }

    except Exception as e:
        print(f"Error processing payment: {str(e)}")
        return {
            'statusCode': 500,
            'body': json.dumps({'error': 'Internal server error'})
        }
```

## File: lib/lambda/batch_processor/index.py

```python
"""Batch payment processor Lambda function."""

import json
import os
import boto3
import csv
from io import StringIO
from datetime import datetime

s3 = boto3.client('s3')
dynamodb = boto3.resource('dynamodb')
sqs = boto3.client('sqs')

PROCESSING_STATUS_TABLE = os.environ['PROCESSING_STATUS_TABLE']
PAYMENTS_TABLE = os.environ['PAYMENTS_TABLE']
PAYMENT_QUEUE_URL = os.environ['PAYMENT_QUEUE_URL']
ENVIRONMENT = os.environ['ENVIRONMENT']


def handler(event, context):
    """Process batch payment files from S3."""
    try:
        # Get S3 event details
        for record in event['Records']:
            bucket = record['s3']['bucket']['name']
            key = record['s3']['object']['key']

            print(f"Processing file: s3://{bucket}/{key}")

            # Generate batch ID
            batch_id = f"batch-{datetime.utcnow().timestamp()}"
            timestamp = int(datetime.utcnow().timestamp())

            # Update processing status
            status_table = dynamodb.Table(PROCESSING_STATUS_TABLE)
            status_table.put_item(
                Item={
                    'batch_id': batch_id,
                    'file_key': key,
                    'status': 'processing',
                    'created_at': timestamp,
                    'environment': ENVIRONMENT
                }
            )

            # Download and process CSV file
            response = s3.get_object(Bucket=bucket, Key=key)
            csv_content = response['Body'].read().decode('utf-8')

            csv_reader = csv.DictReader(StringIO(csv_content))
            payments_table = dynamodb.Table(PAYMENTS_TABLE)

            processed_count = 0
            for row in csv_reader:
                payment_id = row.get('payment_id')
                amount = float(row.get('amount', 0))
                currency = row.get('currency', 'USD')

                # Store payment record
                payments_table.put_item(
                    Item={
                        'payment_id': payment_id,
                        'amount': amount,
                        'currency': currency,
                        'status': 'pending',
                        'timestamp': timestamp,
                        'batch_id': batch_id,
                        'environment': ENVIRONMENT
                    }
                )

                # Queue for processing
                sqs.send_message(
                    QueueUrl=PAYMENT_QUEUE_URL,
                    MessageBody=json.dumps({
                        'payment_id': payment_id,
                        'amount': amount,
                        'currency': currency,
                        'batch_id': batch_id
                    })
                )

                processed_count += 1

            # Update status to completed
            status_table.update_item(
                Key={'batch_id': batch_id},
                UpdateExpression='SET #status = :status, processed_count = :count',
                ExpressionAttributeNames={'#status': 'status'},
                ExpressionAttributeValues={
                    ':status': 'completed',
                    ':count': processed_count
                }
            )

            print(f"Processed {processed_count} payments from batch {batch_id}")

        return {
            'statusCode': 200,
            'body': json.dumps({'message': 'Batch processing completed'})
        }

    except Exception as e:
        print(f"Error processing batch: {str(e)}")
        # Update status to failed
        if 'batch_id' in locals():
            status_table = dynamodb.Table(PROCESSING_STATUS_TABLE)
            status_table.update_item(
                Key={'batch_id': batch_id},
                UpdateExpression='SET #status = :status, error_message = :error',
                ExpressionAttributeNames={'#status': 'status'},
                ExpressionAttributeValues={
                    ':status': 'failed',
                    ':error': str(e)
                }
            )
        raise
```

## File: lib/lambda/api_handler/index.py

```python
"""Payment API handler Lambda function."""

import json
import os
import boto3
from datetime import datetime
from decimal import Decimal

dynamodb = boto3.resource('dynamodb')

PAYMENTS_TABLE = os.environ['PAYMENTS_TABLE']
ENVIRONMENT = os.environ['ENVIRONMENT']


class DecimalEncoder(json.JSONEncoder):
    """Helper class to convert Decimal to float for JSON serialization."""
    def default(self, obj):
        if isinstance(obj, Decimal):
            return float(obj)
        return super(DecimalEncoder, self).default(obj)


def handler(event, context):
    """Handle payment API requests."""
    try:
        http_method = event.get('httpMethod')
        path = event.get('path', '')

        payments_table = dynamodb.Table(PAYMENTS_TABLE)

        # POST /payments - Create payment
        if http_method == 'POST' and '/payments' in path:
            body = json.loads(event.get('body', '{}'))

            payment_id = body.get('payment_id')
            amount = body.get('amount')
            currency = body.get('currency', 'USD')

            if not payment_id or not amount:
                return {
                    'statusCode': 400,
                    'headers': {'Content-Type': 'application/json'},
                    'body': json.dumps({'error': 'Missing required fields: payment_id, amount'})
                }

            if amount <= 0:
                return {
                    'statusCode': 400,
                    'headers': {'Content-Type': 'application/json'},
                    'body': json.dumps({'error': 'Amount must be greater than 0'})
                }

            timestamp = int(datetime.utcnow().timestamp())

            payments_table.put_item(
                Item={
                    'payment_id': payment_id,
                    'amount': Decimal(str(amount)),
                    'currency': currency,
                    'status': 'pending',
                    'timestamp': timestamp,
                    'environment': ENVIRONMENT,
                    'created_at': datetime.utcnow().isoformat()
                }
            )

            return {
                'statusCode': 201,
                'headers': {'Content-Type': 'application/json'},
                'body': json.dumps({
                    'message': 'Payment created successfully',
                    'payment_id': payment_id,
                    'status': 'pending'
                })
            }

        # GET /payments/{id} - Get payment status
        elif http_method == 'GET':
            # Extract payment ID from path
            path_parts = path.strip('/').split('/')
            if len(path_parts) >= 2:
                payment_id = path_parts[-1]

                response = payments_table.get_item(
                    Key={'payment_id': payment_id}
                )

                if 'Item' in response:
                    return {
                        'statusCode': 200,
                        'headers': {'Content-Type': 'application/json'},
                        'body': json.dumps(response['Item'], cls=DecimalEncoder)
                    }
                else:
                    return {
                        'statusCode': 404,
                        'headers': {'Content-Type': 'application/json'},
                        'body': json.dumps({'error': 'Payment not found'})
                    }

        # Method not supported
        return {
            'statusCode': 405,
            'headers': {'Content-Type': 'application/json'},
            'body': json.dumps({'error': 'Method not allowed'})
        }

    except Exception as e:
        print(f"Error handling API request: {str(e)}")
        return {
            'statusCode': 500,
            'headers': {'Content-Type': 'application/json'},
            'body': json.dumps({'error': 'Internal server error'})
        }
```

## File: lib/README.md

```markdown
# Payment Processing Infrastructure

This infrastructure provides a complete payment processing system built with CDKTF and Python, designed to work consistently across development, staging, and production environments.

## Architecture

The infrastructure includes:

- **S3 Bucket**: Storage for batch payment CSV files with encryption and versioning
- **DynamoDB Tables**: Three tables for payments, processing status, and audit logs
- **Lambda Functions**: Three functions for payment processing, batch file processing, and API handling
- **API Gateway**: RESTful API for payment submission and status queries
- **Step Functions**: Workflow orchestration for complex payment flows
- **SNS**: Notification system for payment status updates
- **SQS**: Reliable event processing with dead letter queue
- **CloudWatch**: Logging, monitoring, and alarms for critical failures

## Deployment

### Prerequisites

- Python 3.12+
- Pipenv
- CDKTF CLI (`npm install -g cdktf-cli`)
- AWS CLI configured with credentials

### Environment Variables

Required environment variables:

```bash
export ENVIRONMENT_SUFFIX="dev"                           # Environment identifier
export AWS_REGION="us-east-1"                            # Target AWS region
export TERRAFORM_STATE_BUCKET="iac-rlhf-tf-states"       # S3 bucket for state
export TERRAFORM_STATE_BUCKET_REGION="us-east-1"         # State bucket region
```

### Deploy

```bash
# Install dependencies
pipenv install

# Synthesize Terraform configuration
cdktf synth

# Deploy infrastructure
cdktf deploy
```

### Destroy

```bash
# Destroy all resources
cdktf destroy
```

## API Usage

### Submit Payment

```bash
curl -X POST https://{api-id}.execute-api.us-east-1.amazonaws.com/dev/payments \
  -H "Content-Type: application/json" \
  -d '{
    "payment_id": "pay_123456",
    "amount": 99.99,
    "currency": "USD"
  }'
```

### Get Payment Status

```bash
curl https://{api-id}.execute-api.us-east-1.amazonaws.com/dev/payments/pay_123456
```

## Batch Processing

Upload CSV files to the S3 bucket with the following format:

```csv
payment_id,amount,currency
pay_001,100.00,USD
pay_002,50.00,EUR
pay_003,75.50,USD
```

The batch processor Lambda will automatically process the file and queue individual payments.

## Monitoring

CloudWatch alarms are configured for:

- Lambda function errors (threshold: 5 errors in 10 minutes)
- Dead letter queue messages (any message)
- API 5xx errors (threshold: 10 errors in 10 minutes)

All alarms publish to the SNS topic for notifications.

## Security

- All data at rest is encrypted (S3, DynamoDB)
- All data in transit uses TLS/HTTPS
- IAM roles follow least privilege principle
- S3 buckets have public access blocked
- DynamoDB tables have point-in-time recovery enabled

## Resource Naming

All resources include the environment suffix for uniqueness:
- S3 Bucket: `payment-batch-files-{environment_suffix}`
- DynamoDB Tables: `payments-{environment_suffix}`, etc.
- Lambda Functions: `payment-processor-{environment_suffix}`, etc.
- API Gateway: `payment-api-{environment_suffix}`

## Testing

```bash
# Run unit tests
pytest tests/

# Run with coverage
pytest --cov=lib tests/
```
```
