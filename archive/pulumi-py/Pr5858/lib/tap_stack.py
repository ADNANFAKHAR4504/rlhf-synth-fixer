"""
tap_stack.py

This module defines the TapStack class for the transaction processing pipeline.

It orchestrates the creation of AWS resources for a serverless transaction
processing system including S3, Lambda, DynamoDB, SNS, and API Gateway.
"""

from typing import Optional
import json

import pulumi
from pulumi import ResourceOptions, Output
import pulumi_aws as aws


class TapStackArgs:
    """
    TapStackArgs defines the input arguments for the TapStack Pulumi component.

    Args:
        environment_suffix (Optional[str]): An optional suffix for identifying the deployment environment (e.g., 'dev', 'prod').
        tags (Optional[dict]): Optional default tags to apply to resources.
    """

    def __init__(self, environment_suffix: Optional[str] = None, tags: Optional[dict] = None):
        self.environment_suffix = environment_suffix or 'dev'
        self.tags = tags or {
            "Environment": "production",
            "Project": "transaction-processor"
        }


class TapStack(pulumi.ComponentResource):
    """
    Represents the main Pulumi component resource for the transaction processing pipeline.

    This component creates a complete serverless transaction processing system with:
    - S3 bucket for file uploads
    - Three Lambda functions for validation, anomaly detection, and API handling
    - DynamoDB table for transaction storage
    - SNS topic for alerts
    - API Gateway REST API

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
        self.tags = args.tags

        # S3 Bucket for transaction uploads
        self.transaction_bucket = aws.s3.Bucket(
            f"transaction-uploads-{self.environment_suffix}",
            versioning=aws.s3.BucketVersioningArgs(
                enabled=True
            ),
            lifecycle_rules=[aws.s3.BucketLifecycleRuleArgs(
                enabled=True,
                expiration=aws.s3.BucketLifecycleRuleExpirationArgs(
                    days=90
                )
            )],
            tags=self.tags,
            opts=ResourceOptions(parent=self)
        )

        # DynamoDB table for transactions
        self.transactions_table = aws.dynamodb.Table(
            f"transactions-{self.environment_suffix}",
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
            tags=self.tags,
            opts=ResourceOptions(parent=self)
        )

        # SNS Topic for anomaly alerts
        self.alerts_topic = aws.sns.Topic(
            f"transaction-alerts-{self.environment_suffix}",
            tags=self.tags,
            opts=ResourceOptions(parent=self)
        )

        # Create Lambda functions
        self._create_validation_lambda()
        self._create_anomaly_detection_lambda()
        self._create_api_lambda()

        # Create API Gateway
        self._create_api_gateway()

        # Register outputs
        self.register_outputs({
            "bucket_name": self.transaction_bucket.id,
            "dynamodb_table_name": self.transactions_table.name,
            "sns_topic_arn": self.alerts_topic.arn,
            "api_endpoint": self.api_endpoint,
            "api_key_id": self.api_key.id
        })

    def _create_validation_lambda(self):
        """Creates the validation Lambda function and related resources"""
        # IAM role
        self.validation_lambda_role = aws.iam.Role(
            f"validation-lambda-role-{self.environment_suffix}",
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
            tags=self.tags,
            opts=ResourceOptions(parent=self)
        )

        # IAM policy
        self.validation_lambda_policy = aws.iam.RolePolicy(
            f"validation-lambda-policy-{self.environment_suffix}",
            role=self.validation_lambda_role.id,
            policy=Output.all(self.transaction_bucket.arn, self.transactions_table.arn).apply(
                lambda args: json.dumps({
                    "Version": "2012-10-17",
                    "Statement": [
                        {
                            "Effect": "Allow",
                            "Action": [
                                "s3:GetObject",
                                "s3:GetObjectVersion"
                            ],
                            "Resource": f"{args[0]}/*"
                        },
                        {
                            "Effect": "Allow",
                            "Action": [
                                "dynamodb:PutItem",
                                "dynamodb:UpdateItem"
                            ],
                            "Resource": args[1]
                        },
                        {
                            "Effect": "Allow",
                            "Action": [
                                "logs:CreateLogGroup",
                                "logs:CreateLogStream",
                                "logs:PutLogEvents"
                            ],
                            "Resource": "arn:aws:logs:*:*:*"
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
            ),
            opts=ResourceOptions(parent=self)
        )

        # CloudWatch Log Group
        self.validation_log_group = aws.cloudwatch.LogGroup(
            f"validation-lambda-logs-{self.environment_suffix}",
            name=f"/aws/lambda/validation-lambda-{self.environment_suffix}",
            retention_in_days=7,
            tags=self.tags,
            opts=ResourceOptions(parent=self)
        )

        # Lambda function
        self.validation_lambda = aws.lambda_.Function(
            f"validation-lambda-{self.environment_suffix}",
            runtime="python3.9",
            handler="validation.handler",
            role=self.validation_lambda_role.arn,
            memory_size=512,
            reserved_concurrent_executions=10,
            code=pulumi.AssetArchive({
                ".": pulumi.FileArchive("./lib/lambda")
            }),
            environment=aws.lambda_.FunctionEnvironmentArgs(
                variables={
                    "DYNAMODB_TABLE": self.transactions_table.name,
                    "ENVIRONMENT": "production"
                }
            ),
            tracing_config=aws.lambda_.FunctionTracingConfigArgs(
                mode="Active"
            ),
            tags=self.tags,
            opts=ResourceOptions(parent=self, depends_on=[self.validation_log_group])
        )

        # Lambda permission for S3
        self.s3_lambda_permission = aws.lambda_.Permission(
            f"s3-invoke-validation-{self.environment_suffix}",
            action="lambda:InvokeFunction",
            function=self.validation_lambda.name,
            principal="s3.amazonaws.com",
            source_arn=self.transaction_bucket.arn,
            opts=ResourceOptions(parent=self)
        )

        # S3 bucket notification
        self.bucket_notification = aws.s3.BucketNotification(
            f"transaction-bucket-notification-{self.environment_suffix}",
            bucket=self.transaction_bucket.id,
            lambda_functions=[aws.s3.BucketNotificationLambdaFunctionArgs(
                lambda_function_arn=self.validation_lambda.arn,
                events=["s3:ObjectCreated:*"],
                filter_prefix="uploads/",
                filter_suffix=".csv"
            )],
            opts=ResourceOptions(parent=self, depends_on=[self.s3_lambda_permission])
        )

    def _create_anomaly_detection_lambda(self):
        """Creates the anomaly detection Lambda function and related resources"""
        # IAM role
        self.anomaly_lambda_role = aws.iam.Role(
            f"anomaly-lambda-role-{self.environment_suffix}",
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
            tags=self.tags,
            opts=ResourceOptions(parent=self)
        )

        # IAM policy
        self.anomaly_lambda_policy = aws.iam.RolePolicy(
            f"anomaly-lambda-policy-{self.environment_suffix}",
            role=self.anomaly_lambda_role.id,
            policy=Output.all(self.transactions_table.stream_arn, self.alerts_topic.arn).apply(
                lambda args: json.dumps({
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
                            "Resource": args[0]
                        },
                        {
                            "Effect": "Allow",
                            "Action": [
                                "sns:Publish"
                            ],
                            "Resource": args[1]
                        },
                        {
                            "Effect": "Allow",
                            "Action": [
                                "logs:CreateLogGroup",
                                "logs:CreateLogStream",
                                "logs:PutLogEvents"
                            ],
                            "Resource": "arn:aws:logs:*:*:*"
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
            ),
            opts=ResourceOptions(parent=self)
        )

        # CloudWatch Log Group
        self.anomaly_log_group = aws.cloudwatch.LogGroup(
            f"anomaly-lambda-logs-{self.environment_suffix}",
            name=f"/aws/lambda/anomaly-lambda-{self.environment_suffix}",
            retention_in_days=7,
            tags=self.tags,
            opts=ResourceOptions(parent=self)
        )

        # Lambda function
        self.anomaly_lambda = aws.lambda_.Function(
            f"anomaly-lambda-{self.environment_suffix}",
            runtime="python3.9",
            handler="anomaly_detection.handler",
            role=self.anomaly_lambda_role.arn,
            memory_size=512,
            reserved_concurrent_executions=10,
            code=pulumi.AssetArchive({
                ".": pulumi.FileArchive("./lib/lambda")
            }),
            environment=aws.lambda_.FunctionEnvironmentArgs(
                variables={
                    "SNS_TOPIC_ARN": self.alerts_topic.arn,
                    "ENVIRONMENT": "production"
                }
            ),
            tracing_config=aws.lambda_.FunctionTracingConfigArgs(
                mode="Active"
            ),
            tags=self.tags,
            opts=ResourceOptions(parent=self, depends_on=[self.anomaly_log_group])
        )

        # Event source mapping
        self.stream_mapping = aws.lambda_.EventSourceMapping(
            f"dynamodb-stream-mapping-{self.environment_suffix}",
            event_source_arn=self.transactions_table.stream_arn,
            function_name=self.anomaly_lambda.name,
            starting_position="LATEST",
            batch_size=100,
            opts=ResourceOptions(parent=self)
        )

    def _create_api_lambda(self):
        """Creates the API Lambda function and related resources"""
        # IAM role
        self.api_lambda_role = aws.iam.Role(
            f"api-lambda-role-{self.environment_suffix}",
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
            tags=self.tags,
            opts=ResourceOptions(parent=self)
        )

        # IAM policy
        self.api_lambda_policy = aws.iam.RolePolicy(
            f"api-lambda-policy-{self.environment_suffix}",
            role=self.api_lambda_role.id,
            policy=Output.all(self.transaction_bucket.arn, self.transactions_table.arn).apply(
                lambda args: json.dumps({
                    "Version": "2012-10-17",
                    "Statement": [
                        {
                            "Effect": "Allow",
                            "Action": [
                                "s3:PutObject",
                                "s3:GetObject"
                            ],
                            "Resource": f"{args[0]}/*"
                        },
                        {
                            "Effect": "Allow",
                            "Action": [
                                "dynamodb:GetItem",
                                "dynamodb:Query"
                            ],
                            "Resource": args[1]
                        },
                        {
                            "Effect": "Allow",
                            "Action": [
                                "logs:CreateLogGroup",
                                "logs:CreateLogStream",
                                "logs:PutLogEvents"
                            ],
                            "Resource": "arn:aws:logs:*:*:*"
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
            ),
            opts=ResourceOptions(parent=self)
        )

        # CloudWatch Log Group
        self.api_log_group = aws.cloudwatch.LogGroup(
            f"api-lambda-logs-{self.environment_suffix}",
            name=f"/aws/lambda/api-lambda-{self.environment_suffix}",
            retention_in_days=7,
            tags=self.tags,
            opts=ResourceOptions(parent=self)
        )

        # Lambda function
        self.api_lambda = aws.lambda_.Function(
            f"api-lambda-{self.environment_suffix}",
            runtime="python3.9",
            handler="api_handler.handler",
            role=self.api_lambda_role.arn,
            memory_size=512,
            reserved_concurrent_executions=10,
            code=pulumi.AssetArchive({
                ".": pulumi.FileArchive("./lib/lambda")
            }),
            environment=aws.lambda_.FunctionEnvironmentArgs(
                variables={
                    "S3_BUCKET": self.transaction_bucket.id,
                    "DYNAMODB_TABLE": self.transactions_table.name,
                    "ENVIRONMENT": "production"
                }
            ),
            tracing_config=aws.lambda_.FunctionTracingConfigArgs(
                mode="Active"
            ),
            tags=self.tags,
            opts=ResourceOptions(parent=self, depends_on=[self.api_log_group])
        )

    def _create_api_gateway(self):
        """Creates the API Gateway REST API and related resources"""
        # API Gateway REST API
        self.api = aws.apigateway.RestApi(
            f"transaction-api-{self.environment_suffix}",
            description="Transaction processing API",
            tags=self.tags,
            opts=ResourceOptions(parent=self)
        )

        # Upload resource
        self.upload_resource = aws.apigateway.Resource(
            f"upload-resource-{self.environment_suffix}",
            rest_api=self.api.id,
            parent_id=self.api.root_resource_id,
            path_part="upload",
            opts=ResourceOptions(parent=self)
        )

        # Upload method
        self.upload_method = aws.apigateway.Method(
            f"upload-method-{self.environment_suffix}",
            rest_api=self.api.id,
            resource_id=self.upload_resource.id,
            http_method="POST",
            authorization="NONE",
            api_key_required=True,
            opts=ResourceOptions(parent=self)
        )

        # Upload integration
        self.upload_integration = aws.apigateway.Integration(
            f"upload-integration-{self.environment_suffix}",
            rest_api=self.api.id,
            resource_id=self.upload_resource.id,
            http_method=self.upload_method.http_method,
            integration_http_method="POST",
            type="AWS_PROXY",
            uri=self.api_lambda.invoke_arn,
            opts=ResourceOptions(parent=self)
        )

        # Status resource
        self.status_resource = aws.apigateway.Resource(
            f"status-resource-{self.environment_suffix}",
            rest_api=self.api.id,
            parent_id=self.api.root_resource_id,
            path_part="status",
            opts=ResourceOptions(parent=self)
        )

        # Status ID resource
        self.status_id_resource = aws.apigateway.Resource(
            f"status-id-resource-{self.environment_suffix}",
            rest_api=self.api.id,
            parent_id=self.status_resource.id,
            path_part="{transaction_id}",
            opts=ResourceOptions(parent=self)
        )

        # Status method
        self.status_method = aws.apigateway.Method(
            f"status-method-{self.environment_suffix}",
            rest_api=self.api.id,
            resource_id=self.status_id_resource.id,
            http_method="GET",
            authorization="NONE",
            api_key_required=True,
            opts=ResourceOptions(parent=self)
        )

        # Status integration
        self.status_integration = aws.apigateway.Integration(
            f"status-integration-{self.environment_suffix}",
            rest_api=self.api.id,
            resource_id=self.status_id_resource.id,
            http_method=self.status_method.http_method,
            integration_http_method="POST",
            type="AWS_PROXY",
            uri=self.api_lambda.invoke_arn,
            opts=ResourceOptions(parent=self)
        )

        # Deployment
        self.deployment = aws.apigateway.Deployment(
            f"api-deployment-{self.environment_suffix}",
            rest_api=self.api.id,
            opts=ResourceOptions(parent=self, depends_on=[self.upload_integration, self.status_integration])
        )

        # Stage
        self.stage = aws.apigateway.Stage(
            f"api-stage-{self.environment_suffix}",
            rest_api=self.api.id,
            deployment=self.deployment.id,
            stage_name="prod",
            xray_tracing_enabled=True,
            tags=self.tags,
            opts=ResourceOptions(parent=self)
        )

        # API key
        self.api_key = aws.apigateway.ApiKey(
            f"api-key-{self.environment_suffix}",
            enabled=True,
            tags=self.tags,
            opts=ResourceOptions(parent=self)
        )

        # Usage plan
        self.usage_plan = aws.apigateway.UsagePlan(
            f"usage-plan-{self.environment_suffix}",
            api_stages=[aws.apigateway.UsagePlanApiStageArgs(
                api_id=self.api.id,
                stage=self.stage.stage_name
            )],
            quota_settings=aws.apigateway.UsagePlanQuotaSettingsArgs(
                limit=10000,
                period="MONTH"
            ),
            throttle_settings=aws.apigateway.UsagePlanThrottleSettingsArgs(
                burst_limit=500,
                rate_limit=1000
            ),
            tags=self.tags,
            opts=ResourceOptions(parent=self)
        )

        # Usage plan key
        self.usage_plan_key = aws.apigateway.UsagePlanKey(
            f"usage-plan-key-{self.environment_suffix}",
            key_id=self.api_key.id,
            key_type="API_KEY",
            usage_plan_id=self.usage_plan.id,
            opts=ResourceOptions(parent=self)
        )

        # Lambda permission for API Gateway
        self.api_lambda_permission = aws.lambda_.Permission(
            f"apigateway-invoke-api-lambda-{self.environment_suffix}",
            action="lambda:InvokeFunction",
            function=self.api_lambda.name,
            principal="apigateway.amazonaws.com",
            source_arn=Output.concat(self.api.execution_arn, "/*/*"),
            opts=ResourceOptions(parent=self)
        )

        # API endpoint
        self.api_endpoint = Output.concat("https://", self.api.id, ".execute-api.us-east-1.amazonaws.com/prod")
