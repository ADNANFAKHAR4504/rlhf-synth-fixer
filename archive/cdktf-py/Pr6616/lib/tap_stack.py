"""TAP Stack module for CDKTF Python transaction processing pipeline."""

import json
from cdktf import TerraformStack, S3Backend, TerraformOutput, Fn
from constructs import Construct
from cdktf_cdktf_provider_aws.provider import AwsProvider
from cdktf_cdktf_provider_aws.s3_bucket import S3Bucket
from cdktf_cdktf_provider_aws.s3_bucket_notification import S3BucketNotification
from cdktf_cdktf_provider_aws.s3_bucket_versioning import S3BucketVersioningA
from cdktf_cdktf_provider_aws.s3_bucket_server_side_encryption_configuration import (
    S3BucketServerSideEncryptionConfigurationA,
    S3BucketServerSideEncryptionConfigurationRuleA,
    S3BucketServerSideEncryptionConfigurationRuleApplyServerSideEncryptionByDefaultA
)
from cdktf_cdktf_provider_aws.iam_role import IamRole, IamRoleInlinePolicy
from cdktf_cdktf_provider_aws.iam_role_policy_attachment import IamRolePolicyAttachment
from cdktf_cdktf_provider_aws.lambda_function import LambdaFunction
from cdktf_cdktf_provider_aws.lambda_permission import LambdaPermission
from cdktf_cdktf_provider_aws.dynamodb_table import (
    DynamodbTable, DynamodbTableAttribute, DynamodbTableGlobalSecondaryIndex
)
from cdktf_cdktf_provider_aws.sns_topic import SnsTopic
from cdktf_cdktf_provider_aws.sqs_queue import SqsQueue
from cdktf_cdktf_provider_aws.cloudwatch_log_group import CloudwatchLogGroup
from cdktf_cdktf_provider_aws.cloudwatch_metric_alarm import CloudwatchMetricAlarm
from cdktf_cdktf_provider_aws.api_gateway_rest_api import ApiGatewayRestApi
from cdktf_cdktf_provider_aws.api_gateway_resource import ApiGatewayResource
from cdktf_cdktf_provider_aws.api_gateway_method import ApiGatewayMethod
from cdktf_cdktf_provider_aws.api_gateway_integration import ApiGatewayIntegration
from cdktf_cdktf_provider_aws.api_gateway_deployment import ApiGatewayDeployment
from cdktf_cdktf_provider_aws.api_gateway_stage import ApiGatewayStage
from cdktf_cdktf_provider_aws.api_gateway_usage_plan import ApiGatewayUsagePlan
from cdktf_cdktf_provider_aws.api_gateway_api_key import ApiGatewayApiKey
from cdktf_cdktf_provider_aws.api_gateway_usage_plan_key import ApiGatewayUsagePlanKey
from cdktf_cdktf_provider_aws.api_gateway_request_validator import ApiGatewayRequestValidator
from cdktf_cdktf_provider_aws.api_gateway_method_settings import ApiGatewayMethodSettings
from cdktf_cdktf_provider_aws.sfn_state_machine import SfnStateMachine
from cdktf_cdktf_provider_aws.cloudwatch_event_rule import CloudwatchEventRule
from cdktf_cdktf_provider_aws.cloudwatch_event_target import CloudwatchEventTarget


class TapStack(TerraformStack):
    """CDKTF Python stack for transaction processing pipeline infrastructure."""

    def __init__(
        self,
        scope: Construct,
        construct_id: str,
        **kwargs
    ):
        """Initialize the TAP stack with serverless transaction processing infrastructure."""
        super().__init__(scope, construct_id)

        # Extract configuration from kwargs
        environment_suffix = kwargs.get('environment_suffix', 'dev')
        aws_region = kwargs.get('aws_region', 'us-east-1')
        state_bucket_region = kwargs.get('state_bucket_region', 'us-east-1')
        state_bucket = kwargs.get('state_bucket', 'iac-rlhf-tf-states')
        default_tags = kwargs.get('default_tags', {})

        # Add required tags for the task
        if 'tags' not in default_tags:
            default_tags['tags'] = {}
        default_tags['tags'].update({
            'Environment': environment_suffix,
            'Application': 'transaction-processing-pipeline',
            'CostCenter': 'financial-analytics'
        })

        # Configure AWS Provider
        AwsProvider(
            self,
            "aws",
            region=aws_region,
            default_tags=[default_tags],
        )

        # Configure S3 Backend for CI/CD state persistence
        # Note: DynamoDB table for state locking removed as table doesn't exist
        # Only configure S3 backend if state_bucket is provided (for CI/CD)
        if state_bucket and state_bucket.strip():
            S3Backend(
                self,
                bucket=state_bucket,
                key=f"{environment_suffix}/{construct_id}.tfstate",
                region=state_bucket_region,
                encrypt=True,
            )

        # =================================================================
        # S3 BUCKET FOR FILE STORAGE
        # =================================================================

        # Store as instance attribute for testing
        self.bucket = S3Bucket(
            self,
            "uploads_bucket",
            bucket=f"transaction-uploads-{environment_suffix}",
            force_destroy=True
        )
        uploads_bucket = self.bucket  # Keep local reference for consistency

        # Enable bucket versioning
        self.bucket_versioning = S3BucketVersioningA(
            self,
            "uploads_bucket_versioning",
            bucket=self.bucket.id,
            versioning_configuration={"status": "Enabled"}
        )

        # Enable bucket encryption
        self.bucket_encryption = S3BucketServerSideEncryptionConfigurationA(
            self,
            "uploads_bucket_encryption",
            bucket=self.bucket.id,
            rule=[S3BucketServerSideEncryptionConfigurationRuleA(
                apply_server_side_encryption_by_default=(
                    S3BucketServerSideEncryptionConfigurationRuleApplyServerSideEncryptionByDefaultA(
                        sse_algorithm="AES256"
                    )
                )
            )]
        )

        # =================================================================
        # SQS DEAD LETTER QUEUE
        # =================================================================

        dlq = SqsQueue(
            self,
            "processing_dlq",
            name=f"transaction-processing-dlq-{environment_suffix}",
            message_retention_seconds=1209600  # 14 days
        )

        # =================================================================
        # SNS TOPIC FOR NOTIFICATIONS
        # =================================================================

        sns_topic = SnsTopic(
            self,
            "processing_notifications",
            name=f"transaction-processing-notifications-{environment_suffix}"
        )

        # =================================================================
        # DYNAMODB TABLES
        # =================================================================

        # Processing status tracking table
        status_table = DynamodbTable(
            self,
            "status_tracking_table",
            name=f"transaction-status-{environment_suffix}",
            billing_mode="PAY_PER_REQUEST",
            hash_key="transaction_id",
            range_key="timestamp",
            attribute=[
                DynamodbTableAttribute(name="transaction_id", type="S"),
                DynamodbTableAttribute(name="timestamp", type="N"),
                DynamodbTableAttribute(name="status", type="S")
            ],
            global_secondary_index=[
                DynamodbTableGlobalSecondaryIndex(
                    name="timestamp-status-index",
                    hash_key="status",
                    range_key="timestamp",
                    projection_type="ALL"
                )
            ],
            point_in_time_recovery={"enabled": True}
        )

        # Transformed data table
        data_table = DynamodbTable(
            self,
            "transformed_data_table",
            name=f"transaction-data-{environment_suffix}",
            billing_mode="PAY_PER_REQUEST",
            hash_key="transaction_id",
            range_key="processed_timestamp",
            attribute=[
                DynamodbTableAttribute(name="transaction_id", type="S"),
                DynamodbTableAttribute(name="processed_timestamp", type="N"),
                DynamodbTableAttribute(name="bank_id", type="S")
            ],
            global_secondary_index=[
                DynamodbTableGlobalSecondaryIndex(
                    name="bank-timestamp-index",
                    hash_key="bank_id",
                    range_key="processed_timestamp",
                    projection_type="ALL"
                )
            ],
            point_in_time_recovery={"enabled": True}
        )

        # =================================================================
        # CLOUDWATCH LOG GROUPS
        # =================================================================

        validation_log_group = CloudwatchLogGroup(
            self,
            "validation_lambda_logs",
            name=f"/aws/lambda/validation-lambda-{environment_suffix}",
            retention_in_days=7
        )

        transformation_log_group = CloudwatchLogGroup(
            self,
            "transformation_lambda_logs",
            name=f"/aws/lambda/transformation-lambda-{environment_suffix}",
            retention_in_days=7
        )

        notification_log_group = CloudwatchLogGroup(
            self,
            "notification_lambda_logs",
            name=f"/aws/lambda/notification-lambda-{environment_suffix}",
            retention_in_days=7
        )

        sfn_log_group = CloudwatchLogGroup(
            self,
            "stepfunctions_logs",
            name=f"/aws/stepfunctions/transaction-processing-{environment_suffix}",
            retention_in_days=7
        )

        api_log_group = CloudwatchLogGroup(
            self,
            "api_gateway_logs",
            name=f"/aws/apigateway/transaction-api-{environment_suffix}",
            retention_in_days=7
        )

        # =================================================================
        # IAM ROLES FOR LAMBDA FUNCTIONS
        # =================================================================

        # Validation Lambda Role
        validation_role = IamRole(
            self,
            "validation_lambda_role",
            name=f"validation-lambda-role-{environment_suffix}",
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
                    name="validation-lambda-policy",
                    policy=json.dumps({
                        "Version": "2012-10-17",
                        "Statement": [
                            {
                                "Effect": "Allow",
                                "Action": [
                                    "logs:CreateLogGroup",
                                    "logs:CreateLogStream",
                                    "logs:PutLogEvents"
                                ],
                                "Resource": f"{validation_log_group.arn}:*"
                            },
                            {
                                "Effect": "Allow",
                                "Action": [
                                    "s3:PutObject",
                                    "s3:GetObject"
                                ],
                                "Resource": f"{uploads_bucket.arn}/*"
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
            ]
        )

        # Transformation Lambda Role
        transformation_role = IamRole(
            self,
            "transformation_lambda_role",
            name=f"transformation-lambda-role-{environment_suffix}",
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
                    name="transformation-lambda-policy",
                    policy=json.dumps({
                        "Version": "2012-10-17",
                        "Statement": [
                            {
                                "Effect": "Allow",
                                "Action": [
                                    "logs:CreateLogGroup",
                                    "logs:CreateLogStream",
                                    "logs:PutLogEvents"
                                ],
                                "Resource": f"{transformation_log_group.arn}:*"
                            },
                            {
                                "Effect": "Allow",
                                "Action": ["s3:GetObject"],
                                "Resource": f"{uploads_bucket.arn}/*"
                            },
                            {
                                "Effect": "Allow",
                                "Action": [
                                    "dynamodb:PutItem",
                                    "dynamodb:UpdateItem"
                                ],
                                "Resource": [
                                    status_table.arn,
                                    data_table.arn
                                ]
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
            ]
        )

        # Notification Lambda Role
        notification_role = IamRole(
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
            }),
            inline_policy=[
                IamRoleInlinePolicy(
                    name="notification-lambda-policy",
                    policy=json.dumps({
                        "Version": "2012-10-17",
                        "Statement": [
                            {
                                "Effect": "Allow",
                                "Action": [
                                    "logs:CreateLogGroup",
                                    "logs:CreateLogStream",
                                    "logs:PutLogEvents"
                                ],
                                "Resource": f"{notification_log_group.arn}:*"
                            },
                            {
                                "Effect": "Allow",
                                "Action": ["sns:Publish"],
                                "Resource": sns_topic.arn
                            },
                            {
                                "Effect": "Allow",
                                "Action": [
                                    "dynamodb:GetItem",
                                    "dynamodb:Query"
                                ],
                                "Resource": [
                                    status_table.arn,
                                    f"{status_table.arn}/index/*"
                                ]
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
            ]
        )

        # =================================================================
        # LAMBDA FUNCTIONS (ZIP DEPLOYMENT)
        # =================================================================

        # Package Lambda functions as ZIP files
        # Using TerraformAsset to package Lambda code with dependencies
        import os
        import subprocess
        import tempfile
        import shutil
        from pathlib import Path

        def package_lambda(lambda_dir: str, function_name: str) -> str:
            """Package Lambda function with dependencies into a ZIP file."""
            # Create temp directory for packaging
            with tempfile.TemporaryDirectory() as temp_dir:
                # Copy Lambda code
                lambda_path = Path(lambda_dir)
                app_file = lambda_path / "app.py"
                requirements_file = lambda_path / "requirements.txt"

                # Copy app.py to temp directory
                shutil.copy(str(app_file), temp_dir)

                # Install dependencies if requirements.txt exists
                if requirements_file.exists():
                    subprocess.run([
                        "pip", "install",
                        "-r", str(requirements_file),
                        "-t", temp_dir,
                        "--platform", "manylinux2014_aarch64",
                        "--only-binary=:all:",
                        "--python-version", "3.11"
                    ], check=True)

                # Create ZIP file
                output_dir = Path("lambda_packages")
                output_dir.mkdir(exist_ok=True)
                zip_path = output_dir / f"{function_name}.zip"

                shutil.make_archive(
                    str(zip_path.with_suffix('')),
                    'zip',
                    temp_dir
                )

                return str(zip_path)

        # Get absolute paths for Lambda directories
        lib_dir = os.path.dirname(os.path.abspath(__file__))
        project_root = os.path.dirname(lib_dir)
        validation_zip = package_lambda(
            os.path.join(lib_dir, "lambda", "validation"),
            f"validation-lambda-{environment_suffix}"
        )
        transformation_zip = package_lambda(
            os.path.join(lib_dir, "lambda", "transformation"),
            f"transformation-lambda-{environment_suffix}"
        )
        notification_zip = package_lambda(
            os.path.join(lib_dir, "lambda", "notification"),
            f"notification-lambda-{environment_suffix}"
        )

        # Make paths absolute for Terraform
        validation_zip = os.path.abspath(validation_zip)
        transformation_zip = os.path.abspath(transformation_zip)
        notification_zip = os.path.abspath(notification_zip)

        validation_lambda = LambdaFunction(
            self,
            "validation_lambda",
            function_name=f"validation-lambda-{environment_suffix}",
            role=validation_role.arn,
            handler="app.lambda_handler",
            runtime="python3.11",
            filename=validation_zip,
            source_code_hash=Fn.filebase64sha256(validation_zip),
            architectures=["arm64"],
            memory_size=512,
            timeout=60,
            environment={
                "variables": {
                    "BUCKET_NAME": uploads_bucket.bucket,
                    "ENVIRONMENT": environment_suffix
                }
            },
            tracing_config={"mode": "Active"},
            depends_on=[validation_log_group]
        )

        transformation_lambda = LambdaFunction(
            self,
            "transformation_lambda",
            function_name=f"transformation-lambda-{environment_suffix}",
            role=transformation_role.arn,
            handler="app.lambda_handler",
            runtime="python3.11",
            filename=transformation_zip,
            source_code_hash=Fn.filebase64sha256(transformation_zip),
            architectures=["arm64"],
            memory_size=512,
            timeout=300,
            environment={
                "variables": {
                    "STATUS_TABLE": status_table.name,
                    "DATA_TABLE": data_table.name,
                    "ENVIRONMENT": environment_suffix
                }
            },
            tracing_config={"mode": "Active"},
            depends_on=[transformation_log_group]
        )

        notification_lambda = LambdaFunction(
            self,
            "notification_lambda",
            function_name=f"notification-lambda-{environment_suffix}",
            role=notification_role.arn,
            handler="app.lambda_handler",
            runtime="python3.11",
            filename=notification_zip,
            source_code_hash=Fn.filebase64sha256(notification_zip),
            architectures=["arm64"],
            memory_size=512,
            timeout=60,
            environment={
                "variables": {
                    "SNS_TOPIC_ARN": sns_topic.arn,
                    "STATUS_TABLE": status_table.name,
                    "ENVIRONMENT": environment_suffix
                }
            },
            tracing_config={"mode": "Active"},
            depends_on=[notification_log_group]
        )

        # =================================================================
        # CLOUDWATCH ALARMS FOR LAMBDA ERRORS
        # =================================================================

        validation_alarm = CloudwatchMetricAlarm(
            self,
            "validation_lambda_alarm",
            alarm_name=f"validation-lambda-errors-{environment_suffix}",
            comparison_operator="GreaterThanThreshold",
            evaluation_periods=1,
            metric_name="Errors",
            namespace="AWS/Lambda",
            period=300,
            statistic="Average",
            threshold=0.05,  # 5% error rate
            alarm_description="Triggers when validation lambda error rate exceeds 5%",
            dimensions={
                "FunctionName": validation_lambda.function_name
            },
            treat_missing_data="notBreaching"
        )

        transformation_alarm = CloudwatchMetricAlarm(
            self,
            "transformation_lambda_alarm",
            alarm_name=f"transformation-lambda-errors-{environment_suffix}",
            comparison_operator="GreaterThanThreshold",
            evaluation_periods=1,
            metric_name="Errors",
            namespace="AWS/Lambda",
            period=300,
            statistic="Average",
            threshold=0.05,
            alarm_description="Triggers when transformation lambda error rate exceeds 5%",
            dimensions={
                "FunctionName": transformation_lambda.function_name
            },
            treat_missing_data="notBreaching"
        )

        notification_alarm = CloudwatchMetricAlarm(
            self,
            "notification_lambda_alarm",
            alarm_name=f"notification-lambda-errors-{environment_suffix}",
            comparison_operator="GreaterThanThreshold",
            evaluation_periods=1,
            metric_name="Errors",
            namespace="AWS/Lambda",
            period=300,
            statistic="Average",
            threshold=0.05,
            alarm_description="Triggers when notification lambda error rate exceeds 5%",
            dimensions={
                "FunctionName": notification_lambda.function_name
            },
            treat_missing_data="notBreaching"
        )

        # =================================================================
        # STEP FUNCTIONS STATE MACHINE
        # =================================================================

        sfn_role = IamRole(
            self,
            "stepfunctions_role",
            name=f"stepfunctions-role-{environment_suffix}",
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
                    name="stepfunctions-policy",
                    policy=json.dumps({
                        "Version": "2012-10-17",
                        "Statement": [
                            {
                                "Effect": "Allow",
                                "Action": ["lambda:InvokeFunction"],
                                "Resource": [
                                    transformation_lambda.arn,
                                    notification_lambda.arn
                                ]
                            },
                            {
                                "Effect": "Allow",
                                "Action": ["sqs:SendMessage"],
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
            ]
        )

        state_machine_definition = json.dumps({
            "Comment": "Transaction processing workflow with error handling",
            "StartAt": "TransformData",
            "States": {
                "TransformData": {
                    "Type": "Task",
                    "Resource": transformation_lambda.arn,
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
                            "ResultPath": "$.error",
                            "Next": "HandleError"
                        }
                    ],
                    "Next": "SendNotification"
                },
                "SendNotification": {
                    "Type": "Task",
                    "Resource": notification_lambda.arn,
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
                            "ResultPath": "$.error",
                            "Next": "HandleError"
                        }
                    ],
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
        })

        state_machine = SfnStateMachine(
            self,
            "processing_state_machine",
            name=f"transaction-processing-{environment_suffix}",
            role_arn=sfn_role.arn,
            type="EXPRESS",
            definition=state_machine_definition,
            logging_configuration={
                "log_destination": f"{sfn_log_group.arn}:*",
                "include_execution_data": True,
                "level": "ALL"
            },
            tracing_configuration={"enabled": True}
        )

        # =================================================================
        # S3 BUCKET NOTIFICATION TO TRIGGER STEP FUNCTIONS
        # =================================================================

        # EventBridge rule for S3 events
        s3_event_rule = CloudwatchEventRule(
            self,
            "s3_upload_rule",
            name=f"s3-upload-trigger-{environment_suffix}",
            event_pattern=json.dumps({
                "source": ["aws.s3"],
                "detail-type": ["Object Created"],
                "detail": {
                    "bucket": {
                        "name": [uploads_bucket.bucket]
                    }
                }
            })
        )

        # EventBridge target to trigger Step Functions
        CloudwatchEventTarget(
            self,
            "s3_event_target",
            rule=s3_event_rule.name,
            arn=state_machine.arn,
            role_arn=sfn_role.arn
        )

        # =================================================================
        # API GATEWAY REST API
        # =================================================================

        # API Gateway Role for CloudWatch Logs
        api_role = IamRole(
            self,
            "api_gateway_role",
            name=f"api-gateway-role-{environment_suffix}",
            assume_role_policy=json.dumps({
                "Version": "2012-10-17",
                "Statement": [{
                    "Effect": "Allow",
                    "Principal": {"Service": "apigateway.amazonaws.com"},
                    "Action": "sts:AssumeRole"
                }]
            }),
            inline_policy=[
                IamRoleInlinePolicy(
                    name="api-gateway-policy",
                    policy=json.dumps({
                        "Version": "2012-10-17",
                        "Statement": [
                            {
                                "Effect": "Allow",
                                "Action": [
                                    "logs:CreateLogGroup",
                                    "logs:CreateLogStream",
                                    "logs:PutLogEvents"
                                ],
                                "Resource": f"{api_log_group.arn}:*"
                            },
                            {
                                "Effect": "Allow",
                                "Action": ["lambda:InvokeFunction"],
                                "Resource": validation_lambda.arn
                            }
                        ]
                    })
                )
            ]
        )

        # REST API
        rest_api = ApiGatewayRestApi(
            self,
            "transaction_api",
            name=f"transaction-api-{environment_suffix}",
            description="API for uploading transaction CSV files"
        )

        # Request Validator
        request_validator = ApiGatewayRequestValidator(
            self,
            "api_request_validator",
            name=f"request-validator-{environment_suffix}",
            rest_api_id=rest_api.id,
            validate_request_body=True,
            validate_request_parameters=True
        )

        # /upload resource
        upload_resource = ApiGatewayResource(
            self,
            "upload_resource",
            rest_api_id=rest_api.id,
            parent_id=rest_api.root_resource_id,
            path_part="upload"
        )

        # POST method
        upload_method = ApiGatewayMethod(
            self,
            "upload_method",
            rest_api_id=rest_api.id,
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
            rest_api_id=rest_api.id,
            resource_id=upload_resource.id,
            http_method=upload_method.http_method,
            integration_http_method="POST",
            type="AWS_PROXY",
            uri=validation_lambda.invoke_arn
        )

        # Lambda permission for API Gateway
        LambdaPermission(
            self,
            "api_lambda_permission",
            statement_id="AllowAPIGatewayInvoke",
            action="lambda:InvokeFunction",
            function_name=validation_lambda.function_name,
            principal="apigateway.amazonaws.com",
            source_arn=f"{rest_api.execution_arn}/*/*"
        )

        # Deployment
        deployment = ApiGatewayDeployment(
            self,
            "api_deployment",
            rest_api_id=rest_api.id,
            depends_on=[upload_integration],
            lifecycle={"create_before_destroy": True}
        )

        # Stage
        api_stage = ApiGatewayStage(
            self,
            "api_stage",
            deployment_id=deployment.id,
            rest_api_id=rest_api.id,
            stage_name="prod",
            access_log_settings={
                "destination_arn": api_log_group.arn,
                "format": json.dumps({
                    "requestId": "$context.requestId",
                    "ip": "$context.identity.sourceIp",
                    "requestTime": "$context.requestTime",
                    "httpMethod": "$context.httpMethod",
                    "routeKey": "$context.routeKey",
                    "status": "$context.status",
                    "protocol": "$context.protocol",
                    "responseLength": "$context.responseLength"
                })
            },
            xray_tracing_enabled=True
        )

        # Method Settings for logging
        ApiGatewayMethodSettings(
            self,
            "api_method_settings",
            rest_api_id=rest_api.id,
            stage_name=api_stage.stage_name,
            method_path="*/*",
            settings={
                "metrics_enabled": True,
                "logging_level": "INFO",
                "data_trace_enabled": True
            }
        )

        # Usage Plan
        usage_plan = ApiGatewayUsagePlan(
            self,
            "api_usage_plan",
            name=f"transaction-api-plan-{environment_suffix}",
            description="Usage plan with 1000 requests per day quota",
            api_stages=[{
                "apiId": rest_api.id,
                "stage": api_stage.stage_name
            }],
            quota_settings={
                "limit": 1000,
                "period": "DAY"
            },
            throttle_settings={
                "burst_limit": 100,
                "rate_limit": 50
            }
        )

        # API Key
        api_key = ApiGatewayApiKey(
            self,
            "api_key",
            name=f"transaction-api-key-{environment_suffix}"
        )

        # Associate API Key with Usage Plan
        ApiGatewayUsagePlanKey(
            self,
            "api_usage_plan_key",
            key_id=api_key.id,
            key_type="API_KEY",
            usage_plan_id=usage_plan.id
        )

        # =================================================================
        # OUTPUTS
        # =================================================================

        TerraformOutput(
            self,
            "api_endpoint_url",
            value=f"https://{rest_api.id}.execute-api.{aws_region}.amazonaws.com/{api_stage.stage_name}/upload",
            description="API Gateway upload endpoint URL"
        )

        TerraformOutput(
            self,
            "api_key_id",
            value=api_key.id,
            description="API Key ID for authentication"
        )

        TerraformOutput(
            self,
            "step_functions_arn",
            value=state_machine.arn,
            description="Step Functions state machine ARN"
        )

        TerraformOutput(
            self,
            "status_table_name",
            value=status_table.name,
            description="DynamoDB status tracking table name"
        )

        TerraformOutput(
            self,
            "data_table_name",
            value=data_table.name,
            description="DynamoDB transformed data table name"
        )

        TerraformOutput(
            self,
            "uploads_bucket_name",
            value=uploads_bucket.bucket,
            description="S3 bucket for file uploads"
        )

        TerraformOutput(
            self,
            "sns_topic_arn",
            value=sns_topic.arn,
            description="SNS topic ARN for notifications"
        )

        TerraformOutput(
            self,
            "dlq_url",
            value=dlq.url,
            description="Dead letter queue URL"
        )

        TerraformOutput(
            self,
            "validation_lambda_arn",
            value=validation_lambda.arn,
            description="Validation Lambda function ARN"
        )

        TerraformOutput(
            self,
            "transformation_lambda_arn",
            value=transformation_lambda.arn,
            description="Transformation Lambda function ARN"
        )

        TerraformOutput(
            self,
            "notification_lambda_arn",
            value=notification_lambda.arn,
            description="Notification Lambda function ARN"
        )
