"""TAP Stack module for CDKTF Python infrastructure."""

from cdktf import TerraformStack, S3Backend, TerraformOutput, Fn, TerraformAsset, AssetType
from constructs import Construct
from cdktf_cdktf_provider_aws.provider import AwsProvider
from cdktf_cdktf_provider_aws.s3_bucket import S3Bucket
from cdktf_cdktf_provider_aws.s3_bucket_notification import S3BucketNotification, S3BucketNotificationLambdaFunction
from cdktf_cdktf_provider_aws.dynamodb_table import (
    DynamodbTable,
    DynamodbTableGlobalSecondaryIndex,
    DynamodbTableAttribute,
    DynamodbTablePointInTimeRecovery
)
from cdktf_cdktf_provider_aws.iam_role import IamRole, IamRoleInlinePolicy
from cdktf_cdktf_provider_aws.iam_role_policy import IamRolePolicy
from cdktf_cdktf_provider_aws.iam_role_policy_attachment import IamRolePolicyAttachment
from cdktf_cdktf_provider_aws.lambda_function import LambdaFunction, LambdaFunctionEnvironment
from cdktf_cdktf_provider_aws.lambda_permission import LambdaPermission
from cdktf_cdktf_provider_aws.sns_topic import SnsTopic
from cdktf_cdktf_provider_aws.sns_topic_subscription import SnsTopicSubscription
from cdktf_cdktf_provider_aws.sqs_queue import SqsQueue
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
    """CDKTF Python stack for TAP infrastructure."""

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

        # Configure S3 Backend conditionally
        # Only configure backend if state bucket is provided (for CI/CD environments)
        if state_bucket and state_bucket.strip():
            S3Backend(
                self,
                bucket=state_bucket,
                key=f"{environment_suffix}/{construct_id}.tfstate",
                region=state_bucket_region,
                encrypt=True
            )
            # Use S3's native state locking instead of deprecated dynamodb_table
            self.add_override("terraform.backend.s3.use_lockfile", True)

        # Resource tags
        common_tags = {
            "Environment": environment_suffix,
            "Application": "transaction-processing-pipeline",
            "CostCenter": "finance-analytics"
        }

        # ========================================
        # S3 Buckets
        # ========================================

        # S3 bucket for CSV file storage
        csv_bucket = S3Bucket(
            self,
            "csv_bucket",
            bucket=f"transaction-csv-files-{environment_suffix}",
            force_destroy=True,
            tags=common_tags
        )

        # ========================================
        # DynamoDB Tables
        # ========================================

        # DynamoDB table for transaction data
        transactions_table = DynamodbTable(
            self,
            "transactions_table",
            name=f"transactions-{environment_suffix}",
            billing_mode="PAY_PER_REQUEST",
            hash_key="transaction_id",
            attribute=[
                DynamodbTableAttribute(name="transaction_id", type="S"),
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

        # DynamoDB table for processing status tracking
        status_table = DynamodbTable(
            self,
            "status_table",
            name=f"processing-status-{environment_suffix}",
            billing_mode="PAY_PER_REQUEST",
            hash_key="file_id",
            attribute=[
                DynamodbTableAttribute(name="file_id", type="S"),
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
        # SNS Topic
        # ========================================

        notification_topic = SnsTopic(
            self,
            "notification_topic",
            name=f"transaction-notifications-{environment_suffix}",
            tags=common_tags
        )

        # ========================================
        # SQS Dead Letter Queue
        # ========================================

        dlq = SqsQueue(
            self,
            "dlq",
            name=f"transaction-processing-dlq-{environment_suffix}",
            message_retention_seconds=1209600,  # 14 days
            tags=common_tags
        )

        # ========================================
        # Lambda Assets (ZIP packages)
        # ========================================
        
        # Package Lambda functions as ZIP files
        def package_lambda(lambda_dir: str, function_name: str) -> TerraformAsset:
            """Package Lambda function as a ZIP file using TerraformAsset."""
            lambda_path = Path(__file__).parent / "lambda" / lambda_dir
            
            # Create a temporary directory for packaging
            with tempfile.TemporaryDirectory() as temp_dir:
                temp_path = Path(temp_dir)
                
                # Copy Lambda code
                app_file = lambda_path / "app.py"
                if app_file.exists():
                    shutil.copy(str(app_file), str(temp_path / "app.py"))
                
                # Install dependencies if requirements.txt exists
                requirements_file = lambda_path / "requirements.txt"
                if requirements_file.exists():
                    # Install dependencies to the temp directory
                    subprocess.run([
                        "pip", "install",
                        "-r", str(requirements_file),
                        "-t", str(temp_path),
                        "--platform", "manylinux2014_aarch64",
                        "--only-binary=:all:",
                        "--python-version", "3.11",
                        "--quiet"
                    ], check=False)  # Don't fail if pip install has issues
                
                # Create ZIP file
                output_dir = Path("lambda_packages")
                output_dir.mkdir(exist_ok=True)
                zip_path = output_dir / f"{function_name}_{environment_suffix}.zip"
                
                shutil.make_archive(
                    str(zip_path.with_suffix('')),
                    'zip',
                    str(temp_path)
                )
                
                # Create TerraformAsset from the ZIP file
                return TerraformAsset(
                    self,
                    f"{function_name}_asset",
                    path=str(zip_path),
                    type=AssetType.FILE
                )
        
        # Create assets for each Lambda function
        validator_asset = package_lambda("csv_validator", "csv-validator")
        transformer_asset = package_lambda("data_transformer", "data-transformer")
        notifier_asset = package_lambda("notification_sender", "notification-sender")

        # ========================================
        # CloudWatch Log Groups
        # ========================================

        validator_log_group = CloudwatchLogGroup(
            self,
            "validator_log_group",
            name=f"/aws/lambda/csv-validator-{environment_suffix}",
            retention_in_days=7,
            tags=common_tags,
            lifecycle={"create_before_destroy": True}
        )

        transformer_log_group = CloudwatchLogGroup(
            self,
            "transformer_log_group",
            name=f"/aws/lambda/data-transformer-{environment_suffix}",
            retention_in_days=7,
            tags=common_tags,
            lifecycle={"create_before_destroy": True}
        )

        notifier_log_group = CloudwatchLogGroup(
            self,
            "notifier_log_group",
            name=f"/aws/lambda/notification-sender-{environment_suffix}",
            retention_in_days=7,
            tags=common_tags,
            lifecycle={"create_before_destroy": True}
        )

        api_log_group = CloudwatchLogGroup(
            self,
            "api_log_group",
            name=f"/aws/apigateway/transaction-api-{environment_suffix}",
            retention_in_days=7,
            tags=common_tags,
            lifecycle={"create_before_destroy": True}
        )

        sfn_log_group = CloudwatchLogGroup(
            self,
            "sfn_log_group",
            name=f"/aws/states/transaction-workflow-{environment_suffix}",
            retention_in_days=7,
            tags=common_tags,
            lifecycle={"create_before_destroy": True}
        )

        # ========================================
        # IAM Roles
        # ========================================

        # Lambda execution role for CSV validator
        validator_role = IamRole(
            self,
            "validator_role",
            name=f"csv-validator-role-{environment_suffix}",
            assume_role_policy=json.dumps({
                "Version": "2012-10-17",
                "Statement": [{
                    "Effect": "Allow",
                    "Principal": {"Service": "lambda.amazonaws.com"},
                    "Action": "sts:AssumeRole"
                }]
            }),
            inline_policy=[
                IamRoleInlinePolicy(
                    name="lambda-policy",
                    policy=json.dumps({
                        "Version": "2012-10-17",
                        "Statement": [
                            {
                                "Effect": "Allow",
                                "Action": [
                                    "s3:PutObject",
                                    "s3:GetObject"
                                ],
                                "Resource": f"{csv_bucket.arn}/*"
                            },
                            {
                                "Effect": "Allow",
                                "Action": [
                                    "dynamodb:PutItem",
                                    "dynamodb:UpdateItem"
                                ],
                                "Resource": status_table.arn
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
                                    f"log-group:/aws/lambda/csv-validator-{environment_suffix}:*"
                                )
                            },
                            {
                                "Effect": "Allow",
                                "Action": [
                                    "xray:PutTraceSegments",
                                    "xray:PutTelemetryRecords"
                                ],
                                "Resource": "*"
                            }
                        ]
                    })
                )
            ],
            tags=common_tags
        )

        # Lambda execution role for data transformer
        transformer_role = IamRole(
            self,
            "transformer_role",
            name=f"data-transformer-role-{environment_suffix}",
            assume_role_policy=json.dumps({
                "Version": "2012-10-17",
                "Statement": [{
                    "Effect": "Allow",
                    "Principal": {"Service": "lambda.amazonaws.com"},
                    "Action": "sts:AssumeRole"
                }]
            }),
            inline_policy=[
                IamRoleInlinePolicy(
                    name="lambda-policy",
                    policy=json.dumps({
                        "Version": "2012-10-17",
                        "Statement": [
                            {
                                "Effect": "Allow",
                                "Action": [
                                    "s3:GetObject"
                                ],
                                "Resource": f"{csv_bucket.arn}/*"
                            },
                            {
                                "Effect": "Allow",
                                "Action": [
                                    "dynamodb:PutItem",
                                    "dynamodb:BatchWriteItem"
                                ],
                                "Resource": transactions_table.arn
                            },
                            {
                                "Effect": "Allow",
                                "Action": [
                                    "dynamodb:UpdateItem"
                                ],
                                "Resource": status_table.arn
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
                                    f"log-group:/aws/lambda/data-transformer-{environment_suffix}:*"
                                )
                            },
                            {
                                "Effect": "Allow",
                                "Action": [
                                    "xray:PutTraceSegments",
                                    "xray:PutTelemetryRecords"
                                ],
                                "Resource": "*"
                            }
                        ]
                    })
                )
            ],
            tags=common_tags
        )

        # Lambda execution role for notification sender
        notifier_role = IamRole(
            self,
            "notifier_role",
            name=f"notification-sender-role-{environment_suffix}",
            assume_role_policy=json.dumps({
                "Version": "2012-10-17",
                "Statement": [{
                    "Effect": "Allow",
                    "Principal": {"Service": "lambda.amazonaws.com"},
                    "Action": "sts:AssumeRole"
                }]
            }),
            inline_policy=[
                IamRoleInlinePolicy(
                    name="lambda-policy",
                    policy=json.dumps({
                        "Version": "2012-10-17",
                        "Statement": [
                            {
                                "Effect": "Allow",
                                "Action": [
                                    "sns:Publish"
                                ],
                                "Resource": notification_topic.arn
                            },
                            {
                                "Effect": "Allow",
                                "Action": [
                                    "dynamodb:UpdateItem"
                                ],
                                "Resource": status_table.arn
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
                                    f"log-group:/aws/lambda/notification-sender-{environment_suffix}:*"
                                )
                            },
                            {
                                "Effect": "Allow",
                                "Action": [
                                    "xray:PutTraceSegments",
                                    "xray:PutTelemetryRecords"
                                ],
                                "Resource": "*"
                            }
                        ]
                    })
                )
            ],
            tags=common_tags
        )

        # Step Functions execution role
        sfn_role = IamRole(
            self,
            "sfn_role",
            name=f"transaction-workflow-role-{environment_suffix}",
            assume_role_policy=json.dumps({
                "Version": "2012-10-17",
                "Statement": [{
                    "Effect": "Allow",
                    "Principal": {"Service": "states.amazonaws.com"},
                    "Action": "sts:AssumeRole"
                }]
            }),
            inline_policy=[
                IamRoleInlinePolicy(
                    name="sfn-policy",
                    policy=json.dumps({
                        "Version": "2012-10-17",
                        "Statement": [
                            {
                                "Effect": "Allow",
                                "Action": [
                                    "lambda:InvokeFunction"
                                ],
                                "Resource": [
                                    (f"arn:aws:lambda:{aws_region}:*:"
                                     f"function:csv-validator-{environment_suffix}"),
                                    (f"arn:aws:lambda:{aws_region}:*:"
                                     f"function:data-transformer-{environment_suffix}"),
                                    (f"arn:aws:lambda:{aws_region}:*:"
                                     f"function:notification-sender-{environment_suffix}")
                                ]
                            },
                            {
                                "Effect": "Allow",
                                "Action": [
                                    "sqs:SendMessage"
                                ],
                                "Resource": dlq.arn
                            },
                            {
                                "Effect": "Allow",
                                "Action": [
                                    "logs:CreateLogDelivery",
                                    "logs:GetLogDelivery",
                                    "logs:UpdateLogDelivery",
                                    "logs:DeleteLogDelivery",
                                    "logs:ListLogDeliveries",
                                    "logs:PutResourcePolicy",
                                    "logs:DescribeResourcePolicies",
                                    "logs:DescribeLogGroups"
                                ],
                                "Resource": "*"
                            },
                            {
                                "Effect": "Allow",
                                "Action": [
                                    "xray:PutTraceSegments",
                                    "xray:PutTelemetryRecords"
                                ],
                                "Resource": "*"
                            }
                        ]
                    })
                )
            ],
            tags=common_tags
        )

        # ========================================
        # Lambda Functions
        # ========================================

        # CSV Validator Lambda
        validator_lambda = LambdaFunction(
            self,
            "validator_lambda",
            function_name=f"csv-validator-{environment_suffix}",
            role=validator_role.arn,
            runtime="python3.11",
            handler="app.handler",
            filename=validator_asset.path,
            source_code_hash=validator_asset.asset_hash,
            architectures=["arm64"],
            memory_size=512,
            timeout=60,
            environment=LambdaFunctionEnvironment(
                variables={
                    "S3_BUCKET": csv_bucket.bucket,
                    "STATUS_TABLE": status_table.name,
                    "ENVIRONMENT": environment_suffix
                }
            ),
            tracing_config={"mode": "Active"},
            tags=common_tags,
            depends_on=[validator_log_group]
        )

        # Data Transformer Lambda
        transformer_lambda = LambdaFunction(
            self,
            "transformer_lambda",
            function_name=f"data-transformer-{environment_suffix}",
            role=transformer_role.arn,
            runtime="python3.11",
            handler="app.handler",
            filename=transformer_asset.path,
            source_code_hash=transformer_asset.asset_hash,
            architectures=["arm64"],
            memory_size=512,
            timeout=300,
            environment=LambdaFunctionEnvironment(
                variables={
                    "S3_BUCKET": csv_bucket.bucket,
                    "TRANSACTIONS_TABLE": transactions_table.name,
                    "STATUS_TABLE": status_table.name,
                    "ENVIRONMENT": environment_suffix
                }
            ),
            tracing_config={"mode": "Active"},
            tags=common_tags,
            depends_on=[transformer_log_group]
        )

        # Notification Sender Lambda
        notifier_lambda = LambdaFunction(
            self,
            "notifier_lambda",
            function_name=f"notification-sender-{environment_suffix}",
            role=notifier_role.arn,
            runtime="python3.11",
            handler="app.handler",
            filename=notifier_asset.path,
            source_code_hash=notifier_asset.asset_hash,
            architectures=["arm64"],
            memory_size=512,
            timeout=30,
            environment=LambdaFunctionEnvironment(
                variables={
                    "SNS_TOPIC_ARN": notification_topic.arn,
                    "STATUS_TABLE": status_table.name,
                    "ENVIRONMENT": environment_suffix
                }
            ),
            tracing_config={"mode": "Active"},
            tags=common_tags,
            depends_on=[notifier_log_group]
        )

        # ========================================
        # Step Functions State Machine
        # ========================================

        state_machine_definition = {
            "Comment": "Transaction processing workflow",
            "StartAt": "Validation",
            "States": {
                "Validation": {
                    "Type": "Task",
                    "Resource": "arn:aws:states:::lambda:invoke",
                    "Parameters": {
                        "FunctionName": validator_lambda.function_name,
                        "Payload.$": "$"
                    },
                    "Retry": [
                        {
                            "ErrorEquals": ["States.TaskFailed"],
                            "IntervalSeconds": 2,
                            "MaxAttempts": 3,
                            "BackoffRate": 2.0
                        }
                    ],
                    "Catch": [
                        {
                            "ErrorEquals": ["States.ALL"],
                            "ResultPath": "$.error",
                            "Next": "HandleError"
                        }
                    ],
                    "OutputPath": "$.Payload",
                    "Next": "Processing"
                },
                "Processing": {
                    "Type": "Task",
                    "Resource": "arn:aws:states:::lambda:invoke",
                    "Parameters": {
                        "FunctionName": transformer_lambda.function_name,
                        "Payload.$": "$"
                    },
                    "Retry": [
                        {
                            "ErrorEquals": ["States.TaskFailed"],
                            "IntervalSeconds": 2,
                            "MaxAttempts": 3,
                            "BackoffRate": 2.0
                        }
                    ],
                    "Catch": [
                        {
                            "ErrorEquals": ["States.ALL"],
                            "ResultPath": "$.error",
                            "Next": "HandleError"
                        }
                    ],
                    "OutputPath": "$.Payload",
                    "Next": "Notification"
                },
                "Notification": {
                    "Type": "Task",
                    "Resource": "arn:aws:states:::lambda:invoke",
                    "Parameters": {
                        "FunctionName": notifier_lambda.function_name,
                        "Payload.$": "$"
                    },
                    "Retry": [
                        {
                            "ErrorEquals": ["States.TaskFailed"],
                            "IntervalSeconds": 2,
                            "MaxAttempts": 3,
                            "BackoffRate": 2.0
                        }
                    ],
                    "Catch": [
                        {
                            "ErrorEquals": ["States.ALL"],
                            "ResultPath": "$.error",
                            "Next": "HandleError"
                        }
                    ],
                    "OutputPath": "$.Payload",
                    "End": True
                },
                "HandleError": {
                    "Type": "Task",
                    "Resource": "arn:aws:states:::sqs:sendMessage",
                    "Parameters": {
                        "QueueUrl": dlq.url,
                        "MessageBody.$": "$"
                    },
                    "End": True
                }
            }
        }

        state_machine = SfnStateMachine(
            self,
            "state_machine",
            name=f"transaction-workflow-{environment_suffix}",
            role_arn=sfn_role.arn,
            type="EXPRESS",
            definition=json.dumps(state_machine_definition),
            logging_configuration={
                "log_destination": f"{sfn_log_group.arn}:*",
                "include_execution_data": True,
                "level": "ALL"
            },
            tracing_configuration={"enabled": True},
            tags=common_tags
        )

        # ========================================
        # API Gateway
        # ========================================

        # REST API
        api = ApiGatewayRestApi(
            self,
            "api",
            name=f"transaction-api-{environment_suffix}",
            description="API for transaction file uploads",
            tags=common_tags
        )

        # Request Validator
        request_validator = ApiGatewayRequestValidator(
            self,
            "request_validator",
            rest_api_id=api.id,
            name="request-validator",
            validate_request_body=True,
            validate_request_parameters=True
        )

        # /upload resource
        upload_resource = ApiGatewayResource(
            self,
            "upload_resource",
            rest_api_id=api.id,
            parent_id=api.root_resource_id,
            path_part="upload"
        )

        # POST method
        upload_method = ApiGatewayMethod(
            self,
            "upload_method",
            rest_api_id=api.id,
            resource_id=upload_resource.id,
            http_method="POST",
            authorization="NONE",
            request_validator_id=request_validator.id,
            request_parameters={
                "method.request.header.Content-Type": True
            }
        )

        # Lambda integration
        upload_integration = ApiGatewayIntegration(
            self,
            "upload_integration",
            rest_api_id=api.id,
            resource_id=upload_resource.id,
            http_method=upload_method.http_method,
            integration_http_method="POST",
            type="AWS_PROXY",
            uri=validator_lambda.invoke_arn
        )

        # Lambda permission for API Gateway
        api_lambda_permission = LambdaPermission(
            self,
            "api_lambda_permission",
            statement_id="AllowAPIGatewayInvoke",
            action="lambda:InvokeFunction",
            function_name=validator_lambda.function_name,
            principal="apigateway.amazonaws.com",
            source_arn=f"{api.execution_arn}/*/*"
        )

        # Deployment
        deployment = ApiGatewayDeployment(
            self,
            "deployment",
            rest_api_id=api.id,
            depends_on=[upload_method, upload_integration],
            lifecycle={"create_before_destroy": True}
        )

        # Stage
        stage = ApiGatewayStage(
            self,
            "stage",
            rest_api_id=api.id,
            stage_name="prod",
            deployment_id=deployment.id,
            xray_tracing_enabled=True,
            access_log_settings={
                "destination_arn": api_log_group.arn,
                "format": json.dumps({
                    "requestId": "$context.requestId",
                    "ip": "$context.identity.sourceIp",
                    "requestTime": "$context.requestTime",
                    "httpMethod": "$context.httpMethod",
                    "resourcePath": "$context.resourcePath",
                    "status": "$context.status",
                    "protocol": "$context.protocol",
                    "responseLength": "$context.responseLength"
                })
            },
            tags=common_tags
        )

        # Usage Plan
        usage_plan = ApiGatewayUsagePlan(
            self,
            "usage_plan",
            name=f"transaction-api-plan-{environment_suffix}",
            api_stages=[
                ApiGatewayUsagePlanApiStages(
                    api_id=api.id,
                    stage=stage.stage_name
                )
            ],
            quota_settings=ApiGatewayUsagePlanQuotaSettings(
                limit=1000,
                period="DAY"
            ),
            tags=common_tags
        )

        # ========================================
        # S3 Bucket Notification
        # ========================================

        # Lambda permission for S3
        s3_lambda_permission = LambdaPermission(
            self,
            "s3_lambda_permission",
            statement_id="AllowS3Invoke",
            action="lambda:InvokeFunction",
            function_name=transformer_lambda.function_name,
            principal="s3.amazonaws.com",
            source_arn=csv_bucket.arn
        )

        # S3 bucket notification - triggers Step Functions via Lambda
        bucket_notification = S3BucketNotification(
            self,
            "bucket_notification",
            bucket=csv_bucket.id,
            lambda_function=[
                S3BucketNotificationLambdaFunction(
                    lambda_function_arn=transformer_lambda.arn,
                    events=["s3:ObjectCreated:*"],
                    filter_prefix="validated/"
                )
            ],
            depends_on=[s3_lambda_permission]
        )

        # ========================================
        # CloudWatch Alarms
        # ========================================

        # Validator Lambda Error Alarm
        validator_error_alarm = CloudwatchMetricAlarm(
            self,
            "validator_error_alarm",
            alarm_name=f"csv-validator-errors-{environment_suffix}",
            comparison_operator="GreaterThanThreshold",
            evaluation_periods=1,
            metric_name="Errors",
            namespace="AWS/Lambda",
            period=300,
            statistic="Sum",
            threshold=5,
            alarm_description=(
                "Alert when validator Lambda error rate exceeds 5% in 5 minutes"
            ),
            dimensions={
                "FunctionName": validator_lambda.function_name
            },
            treat_missing_data="notBreaching",
            tags=common_tags
        )

        # Transformer Lambda Error Alarm
        transformer_error_alarm = CloudwatchMetricAlarm(
            self,
            "transformer_error_alarm",
            alarm_name=f"data-transformer-errors-{environment_suffix}",
            comparison_operator="GreaterThanThreshold",
            evaluation_periods=1,
            metric_name="Errors",
            namespace="AWS/Lambda",
            period=300,
            statistic="Sum",
            threshold=5,
            alarm_description=(
                "Alert when transformer Lambda error rate exceeds 5% in 5 minutes"
            ),
            dimensions={
                "FunctionName": transformer_lambda.function_name
            },
            treat_missing_data="notBreaching",
            tags=common_tags
        )

        # Notifier Lambda Error Alarm
        notifier_error_alarm = CloudwatchMetricAlarm(
            self,
            "notifier_error_alarm",
            alarm_name=f"notification-sender-errors-{environment_suffix}",
            comparison_operator="GreaterThanThreshold",
            evaluation_periods=1,
            metric_name="Errors",
            namespace="AWS/Lambda",
            period=300,
            statistic="Sum",
            threshold=5,
            alarm_description=(
                "Alert when notifier Lambda error rate exceeds 5% in 5 minutes"
            ),
            dimensions={
                "FunctionName": notifier_lambda.function_name
            },
            treat_missing_data="notBreaching",
            tags=common_tags
        )

        # ========================================
        # Outputs
        # ========================================

        TerraformOutput(
            self,
            "api_endpoint",
            value=(
                f"https://{api.id}.execute-api.{aws_region}.amazonaws.com/"
                f"{stage.stage_name}/upload"
            ),
            description="API Gateway endpoint URL"
        )

        TerraformOutput(
            self,
            "state_machine_arn",
            value=state_machine.arn,
            description="Step Functions state machine ARN"
        )

        TerraformOutput(
            self,
            "transactions_table_name",
            value=transactions_table.name,
            description="DynamoDB transactions table name"
        )

        TerraformOutput(
            self,
            "status_table_name",
            value=status_table.name,
            description="DynamoDB status table name"
        )

        TerraformOutput(
            self,
            "csv_bucket_name",
            value=csv_bucket.bucket,
            description="S3 bucket for CSV files"
        )

        TerraformOutput(
            self,
            "notification_topic_arn",
            value=notification_topic.arn,
            description="SNS topic ARN for notifications"
        )

        TerraformOutput(
            self,
            "dlq_url",
            value=dlq.url,
            description="Dead letter queue URL"
        )
