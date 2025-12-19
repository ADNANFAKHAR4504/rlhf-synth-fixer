"""
Fraud Detection Stack - Pulumi Python Implementation

This module defines the TapStack for a serverless fraud detection system including:
- API Gateway for transaction endpoints
- Lambda functions for processing, analysis, and reporting
- DynamoDB table with streams for real-time processing
- S3 bucket for report storage
- CloudWatch monitoring and alarms
- IAM roles with least privilege access
"""

import pulumi
import pulumi_aws as aws
import json
from typing import Optional
from pulumi import ResourceOptions

class TapStackArgs:
    """
    TapStackArgs defines input arguments for the TapStack component.

    Args:
        environment_suffix: Suffix for identifying deployment environment
        tags: Optional default tags to apply to resources
    """

    def __init__(self, environment_suffix: Optional[str] = None, tags: Optional[dict] = None):
        self.environment_suffix = environment_suffix or 'dev'
        self.tags = tags or {}


class TapStack(pulumi.ComponentResource):
    """
    Main Pulumi component for serverless fraud detection system

    Creates:
    - S3 bucket for fraud reports with encryption
    - DynamoDB table for transactions with streams
    - Three Lambda functions for processing, analysis, and reporting
    - API Gateway REST API with two endpoints
    - CloudWatch log groups and alarms
    - EventBridge rule for daily reports
    - IAM roles with least privilege access
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

        # Common tags for all resources
        self.common_tags = {
            'Environment': self.environment_suffix,
            'CostCenter': 'fraud-detection',
            'ManagedBy': 'Pulumi',
            **self.tags
        }

        # Create all resources
        self._create_s3_bucket()
        self._create_dynamodb_table()
        self._create_lambda_roles()
        self._create_lambda_functions()
        self._create_api_gateway()
        self._create_cloudwatch_alarms()
        self._create_event_source_mapping()
        self._create_scheduled_report_trigger()

        # Register outputs
        self.register_outputs({
            'api_url': self.api_url,
            'bucket_name': self.bucket_name,
            'table_name': self.table_name
        })

    def _create_s3_bucket(self):
        """Create S3 bucket for fraud reports with encryption"""
        self.reports_bucket = aws.s3.Bucket(
            f"fraud-reports-{self.environment_suffix}",
            bucket=f"fraud-reports-{self.environment_suffix}",
            server_side_encryption_configuration=aws.s3.BucketServerSideEncryptionConfigurationArgs(
                rule=aws.s3.BucketServerSideEncryptionConfigurationRuleArgs(
                    apply_server_side_encryption_by_default=(
                        aws.s3.BucketServerSideEncryptionConfigurationRuleApplyServerSideEncryptionByDefaultArgs(
                            sse_algorithm="AES256"
                        )
                    )
                )
            ),
            lifecycle_rules=[
                aws.s3.BucketLifecycleRuleArgs(
                    enabled=True,
                    transitions=[
                        aws.s3.BucketLifecycleRuleTransitionArgs(
                            days=30,
                            storage_class="STANDARD_IA"
                        ),
                        aws.s3.BucketLifecycleRuleTransitionArgs(
                            days=90,
                            storage_class="GLACIER"
                        )
                    ]
                )
            ],
            tags=self.common_tags,
            opts=ResourceOptions(parent=self)
        )

        self.bucket_name = self.reports_bucket.id

    def _create_dynamodb_table(self):
        """Create DynamoDB table for transactions with streams"""
        self.transactions_table = aws.dynamodb.Table(
            f"transactions-{self.environment_suffix}",
            name=f"transactions-{self.environment_suffix}",
            billing_mode="PAY_PER_REQUEST",
            hash_key="transactionId",
            range_key="timestamp",
            attributes=[
                aws.dynamodb.TableAttributeArgs(
                    name="transactionId",
                    type="S"
                ),
                aws.dynamodb.TableAttributeArgs(
                    name="timestamp",
                    type="N"
                )
            ],
            stream_enabled=True,
            stream_view_type="NEW_AND_OLD_IMAGES",
            tags=self.common_tags,
            opts=ResourceOptions(parent=self)
        )

        self.table_name = self.transactions_table.name

    def _create_lambda_roles(self):
        """Create IAM roles for Lambda functions with least privilege"""

        # Transaction processor role
        self.transaction_processor_role = aws.iam.Role(
            f"transaction-processor-role-{self.environment_suffix}",
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
            tags=self.common_tags,
            opts=ResourceOptions(parent=self)
        )

        # Attach basic Lambda execution policy
        aws.iam.RolePolicyAttachment(
            f"transaction-processor-basic-{self.environment_suffix}",
            role=self.transaction_processor_role.name,
            policy_arn="arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole",
            opts=ResourceOptions(parent=self)
        )

        # Attach VPC execution policy for secure processing
        aws.iam.RolePolicyAttachment(
            f"transaction-processor-vpc-{self.environment_suffix}",
            role=self.transaction_processor_role.name,
            policy_arn="arn:aws:iam::aws:policy/service-role/AWSLambdaVPCAccessExecutionRole",
            opts=ResourceOptions(parent=self)
        )

        # Custom policy for DynamoDB access
        transaction_processor_policy = aws.iam.Policy(
            f"transaction-processor-policy-{self.environment_suffix}",
            policy=self.transactions_table.arn.apply(
                lambda arn: json.dumps({
                    "Version": "2012-10-17",
                    "Statement": [{
                        "Effect": "Allow",
                        "Action": [
                            "dynamodb:PutItem",
                            "dynamodb:GetItem",
                            "dynamodb:Query"
                        ],
                        "Resource": arn
                    }]
                })
            ),
            tags=self.common_tags,
            opts=ResourceOptions(parent=self)
        )

        aws.iam.RolePolicyAttachment(
            f"transaction-processor-policy-attach-{self.environment_suffix}",
            role=self.transaction_processor_role.name,
            policy_arn=transaction_processor_policy.arn,
            opts=ResourceOptions(parent=self)
        )

        # Fraud analyzer role
        self.fraud_analyzer_role = aws.iam.Role(
            f"fraud-analyzer-role-{self.environment_suffix}",
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
            tags=self.common_tags,
            opts=ResourceOptions(parent=self)
        )

        aws.iam.RolePolicyAttachment(
            f"fraud-analyzer-basic-{self.environment_suffix}",
            role=self.fraud_analyzer_role.name,
            policy_arn="arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole",
            opts=ResourceOptions(parent=self)
        )

        aws.iam.RolePolicyAttachment(
            f"fraud-analyzer-vpc-{self.environment_suffix}",
            role=self.fraud_analyzer_role.name,
            policy_arn="arn:aws:iam::aws:policy/service-role/AWSLambdaVPCAccessExecutionRole",
            opts=ResourceOptions(parent=self)
        )

        # Custom policy for DynamoDB streams and S3
        fraud_analyzer_policy = aws.iam.Policy(
            f"fraud-analyzer-policy-{self.environment_suffix}",
            policy=pulumi.Output.all(
                self.transactions_table.arn,
                self.transactions_table.stream_arn,
                self.reports_bucket.arn
            ).apply(
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
                            "Resource": args[1]
                        },
                        {
                            "Effect": "Allow",
                            "Action": [
                                "dynamodb:UpdateItem"
                            ],
                            "Resource": args[0]
                        },
                        {
                            "Effect": "Allow",
                            "Action": [
                                "s3:PutObject"
                            ],
                            "Resource": f"{args[2]}/*"
                        }
                    ]
                })
            ),
            tags=self.common_tags,
            opts=ResourceOptions(parent=self)
        )

        aws.iam.RolePolicyAttachment(
            f"fraud-analyzer-policy-attach-{self.environment_suffix}",
            role=self.fraud_analyzer_role.name,
            policy_arn=fraud_analyzer_policy.arn,
            opts=ResourceOptions(parent=self)
        )

        # Report generator role
        self.report_generator_role = aws.iam.Role(
            f"report-generator-role-{self.environment_suffix}",
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
            tags=self.common_tags,
            opts=ResourceOptions(parent=self)
        )

        aws.iam.RolePolicyAttachment(
            f"report-generator-basic-{self.environment_suffix}",
            role=self.report_generator_role.name,
            policy_arn="arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole",
            opts=ResourceOptions(parent=self)
        )

        aws.iam.RolePolicyAttachment(
            f"report-generator-vpc-{self.environment_suffix}",
            role=self.report_generator_role.name,
            policy_arn="arn:aws:iam::aws:policy/service-role/AWSLambdaVPCAccessExecutionRole",
            opts=ResourceOptions(parent=self)
        )

        # Custom policy for DynamoDB scan and S3 write
        report_generator_policy = aws.iam.Policy(
            f"report-generator-policy-{self.environment_suffix}",
            policy=pulumi.Output.all(
                self.transactions_table.arn,
                self.reports_bucket.arn
            ).apply(
                lambda args: json.dumps({
                    "Version": "2012-10-17",
                    "Statement": [
                        {
                            "Effect": "Allow",
                            "Action": [
                                "dynamodb:Scan",
                                "dynamodb:Query"
                            ],
                            "Resource": args[0]
                        },
                        {
                            "Effect": "Allow",
                            "Action": [
                                "s3:PutObject"
                            ],
                            "Resource": f"{args[1]}/*"
                        }
                    ]
                })
            ),
            tags=self.common_tags,
            opts=ResourceOptions(parent=self)
        )

        aws.iam.RolePolicyAttachment(
            f"report-generator-policy-attach-{self.environment_suffix}",
            role=self.report_generator_role.name,
            policy_arn=report_generator_policy.arn,
            opts=ResourceOptions(parent=self)
        )

    def _create_lambda_functions(self):
        """Create Lambda functions for transaction processing, fraud analysis, and report generation"""

        # CloudWatch log groups with 7-day retention
        self.transaction_processor_logs = aws.cloudwatch.LogGroup(
            f"transaction-processor-logs-{self.environment_suffix}",
            name=f"/aws/lambda/transaction-processor-{self.environment_suffix}",
            retention_in_days=7,
            tags=self.common_tags,
            opts=ResourceOptions(parent=self)
        )

        self.fraud_analyzer_logs = aws.cloudwatch.LogGroup(
            f"fraud-analyzer-logs-{self.environment_suffix}",
            name=f"/aws/lambda/fraud-analyzer-{self.environment_suffix}",
            retention_in_days=7,
            tags=self.common_tags,
            opts=ResourceOptions(parent=self)
        )

        self.report_generator_logs = aws.cloudwatch.LogGroup(
            f"report-generator-logs-{self.environment_suffix}",
            name=f"/aws/lambda/report-generator-{self.environment_suffix}",
            retention_in_days=7,
            tags=self.common_tags,
            opts=ResourceOptions(parent=self)
        )

        # Transaction Processor Lambda
        self.transaction_processor = aws.lambda_.Function(
            f"transaction-processor-{self.environment_suffix}",
            name=f"transaction-processor-{self.environment_suffix}",
            runtime="python3.11",
            handler="transaction_processor.handler",
            role=self.transaction_processor_role.arn,
            code=pulumi.AssetArchive({
                "transaction_processor.py": pulumi.FileAsset("lib/lambda/transaction_processor.py")
            }),
            timeout=300,
            reserved_concurrent_executions=100,
            environment=aws.lambda_.FunctionEnvironmentArgs(
                variables={
                    "TABLE_NAME": self.transactions_table.name,
                    "REGION": "us-east-2"
                }
            ),
            tags=self.common_tags,
            opts=pulumi.ResourceOptions(
                parent=self,
                depends_on=[self.transaction_processor_logs]
            )
        )

        # Fraud Analyzer Lambda
        self.fraud_analyzer = aws.lambda_.Function(
            f"fraud-analyzer-{self.environment_suffix}",
            name=f"fraud-analyzer-{self.environment_suffix}",
            runtime="python3.11",
            handler="fraud_analyzer.handler",
            role=self.fraud_analyzer_role.arn,
            code=pulumi.AssetArchive({
                "fraud_analyzer.py": pulumi.FileAsset("lib/lambda/fraud_analyzer.py")
            }),
            timeout=300,
            reserved_concurrent_executions=100,
            environment=aws.lambda_.FunctionEnvironmentArgs(
                variables={
                    "TABLE_NAME": self.transactions_table.name,
                    "BUCKET_NAME": self.reports_bucket.id,
                    "REGION": "us-east-2"
                }
            ),
            tags=self.common_tags,
            opts=pulumi.ResourceOptions(
                parent=self,
                depends_on=[self.fraud_analyzer_logs]
            )
        )

        # Report Generator Lambda
        self.report_generator = aws.lambda_.Function(
            f"report-generator-{self.environment_suffix}",
            name=f"report-generator-{self.environment_suffix}",
            runtime="python3.11",
            handler="report_generator.handler",
            role=self.report_generator_role.arn,
            code=pulumi.AssetArchive({
                "report_generator.py": pulumi.FileAsset("lib/lambda/report_generator.py")
            }),
            timeout=300,
            reserved_concurrent_executions=100,
            environment=aws.lambda_.FunctionEnvironmentArgs(
                variables={
                    "TABLE_NAME": self.transactions_table.name,
                    "BUCKET_NAME": self.reports_bucket.id,
                    "REGION": "us-east-2"
                }
            ),
            tags=self.common_tags,
            opts=pulumi.ResourceOptions(
                parent=self,
                depends_on=[self.report_generator_logs]
            )
        )

    def _create_api_gateway(self):
        """Create API Gateway with REST endpoints for transaction submission and retrieval"""

        # Create REST API
        self.api = aws.apigateway.RestApi(
            f"fraud-detection-api-{self.environment_suffix}",
            name=f"fraud-detection-api-{self.environment_suffix}",
            description="Fraud Detection API for transaction submission and retrieval",
            tags=self.common_tags,
            opts=ResourceOptions(parent=self)
        )

        # Create /transactions resource
        self.transactions_resource = aws.apigateway.Resource(
            f"transactions-resource-{self.environment_suffix}",
            rest_api=self.api.id,
            parent_id=self.api.root_resource_id,
            path_part="transactions",
            opts=ResourceOptions(parent=self)
        )

        # Create /{id} resource under /transactions
        self.transaction_id_resource = aws.apigateway.Resource(
            f"transaction-id-resource-{self.environment_suffix}",
            rest_api=self.api.id,
            parent_id=self.transactions_resource.id,
            path_part="{id}",
            opts=ResourceOptions(parent=self)
        )

        # POST /transactions method
        self.post_method = aws.apigateway.Method(
            f"post-transactions-method-{self.environment_suffix}",
            rest_api=self.api.id,
            resource_id=self.transactions_resource.id,
            http_method="POST",
            authorization="NONE",
            opts=ResourceOptions(parent=self)
        )

        # POST /transactions integration
        self.post_integration = aws.apigateway.Integration(
            f"post-transactions-integration-{self.environment_suffix}",
            rest_api=self.api.id,
            resource_id=self.transactions_resource.id,
            http_method=self.post_method.http_method,
            integration_http_method="POST",
            type="AWS_PROXY",
            uri=self.transaction_processor.invoke_arn,
            opts=ResourceOptions(parent=self)
        )

        # GET /transactions/{id} method
        self.get_method = aws.apigateway.Method(
            f"get-transaction-method-{self.environment_suffix}",
            rest_api=self.api.id,
            resource_id=self.transaction_id_resource.id,
            http_method="GET",
            authorization="NONE",
            request_parameters={
                "method.request.path.id": True
            },
            opts=ResourceOptions(parent=self)
        )

        # GET /transactions/{id} integration
        self.get_integration = aws.apigateway.Integration(
            f"get-transaction-integration-{self.environment_suffix}",
            rest_api=self.api.id,
            resource_id=self.transaction_id_resource.id,
            http_method=self.get_method.http_method,
            integration_http_method="POST",
            type="AWS_PROXY",
            uri=self.transaction_processor.invoke_arn,
            opts=ResourceOptions(parent=self)
        )

        # Lambda permissions for API Gateway
        self.post_lambda_permission = aws.lambda_.Permission(
            f"post-lambda-permission-{self.environment_suffix}",
            action="lambda:InvokeFunction",
            function=self.transaction_processor.name,
            principal="apigateway.amazonaws.com",
            source_arn=pulumi.Output.concat(self.api.execution_arn, "/*/*"),
            opts=ResourceOptions(parent=self)
        )

        # Deployment
        self.deployment = aws.apigateway.Deployment(
            f"api-deployment-{self.environment_suffix}",
            rest_api=self.api.id,
            opts=pulumi.ResourceOptions(
                parent=self,
                depends_on=[
                    self.post_integration,
                    self.get_integration
                ]
            )
        )

        # Stage with throttling
        self.stage = aws.apigateway.Stage(
            f"api-stage-{self.environment_suffix}",
            rest_api=self.api.id,
            deployment=self.deployment.id,
            stage_name="prod",
            tags=self.common_tags,
            opts=ResourceOptions(parent=self)
        )

        # Method settings for throttling
        self.method_settings = aws.apigateway.MethodSettings(
            f"api-method-settings-{self.environment_suffix}",
            rest_api=self.api.id,
            stage_name=self.stage.stage_name,
            method_path="*/*",
            settings=aws.apigateway.MethodSettingsSettingsArgs(
                throttling_burst_limit=1000,
                throttling_rate_limit=1000,
                metrics_enabled=True
            ),
            opts=ResourceOptions(parent=self)
        )

        # Export API URL
        self.api_url = pulumi.Output.concat(
            "https://",
            self.api.id,
            ".execute-api.us-east-2.amazonaws.com/",
            self.stage.stage_name
        )

    def _create_cloudwatch_alarms(self):
        """Create CloudWatch alarms for Lambda error rates"""

        # Transaction Processor error alarm
        self.transaction_processor_alarm = aws.cloudwatch.MetricAlarm(
            f"transaction-processor-alarm-{self.environment_suffix}",
            name=f"transaction-processor-errors-{self.environment_suffix}",
            comparison_operator="GreaterThanThreshold",
            evaluation_periods=1,
            metric_name="Errors",
            namespace="AWS/Lambda",
            period=300,
            statistic="Average",
            threshold=1.0,
            alarm_description="Alert when transaction processor error rate exceeds 1%",
            dimensions={
                "FunctionName": self.transaction_processor.name
            },
            tags=self.common_tags,
            opts=ResourceOptions(parent=self)
        )

        # Fraud Analyzer error alarm
        self.fraud_analyzer_alarm = aws.cloudwatch.MetricAlarm(
            f"fraud-analyzer-alarm-{self.environment_suffix}",
            name=f"fraud-analyzer-errors-{self.environment_suffix}",
            comparison_operator="GreaterThanThreshold",
            evaluation_periods=1,
            metric_name="Errors",
            namespace="AWS/Lambda",
            period=300,
            statistic="Average",
            threshold=1.0,
            alarm_description="Alert when fraud analyzer error rate exceeds 1%",
            dimensions={
                "FunctionName": self.fraud_analyzer.name
            },
            tags=self.common_tags,
            opts=ResourceOptions(parent=self)
        )

        # Report Generator error alarm
        self.report_generator_alarm = aws.cloudwatch.MetricAlarm(
            f"report-generator-alarm-{self.environment_suffix}",
            name=f"report-generator-errors-{self.environment_suffix}",
            comparison_operator="GreaterThanThreshold",
            evaluation_periods=1,
            metric_name="Errors",
            namespace="AWS/Lambda",
            period=300,
            statistic="Average",
            threshold=1.0,
            alarm_description="Alert when report generator error rate exceeds 1%",
            dimensions={
                "FunctionName": self.report_generator.name
            },
            tags=self.common_tags,
            opts=ResourceOptions(parent=self)
        )

    def _create_event_source_mapping(self):
        """Create event source mapping for DynamoDB streams to trigger fraud analyzer"""
        self.event_source_mapping = aws.lambda_.EventSourceMapping(
            f"fraud-analyzer-event-source-{self.environment_suffix}",
            event_source_arn=self.transactions_table.stream_arn,
            function_name=self.fraud_analyzer.name,
            starting_position="LATEST",
            batch_size=100,
            maximum_batching_window_in_seconds=10,
            opts=ResourceOptions(parent=self)
        )

    def _create_scheduled_report_trigger(self):
        """Create EventBridge rule for daily report generation"""

        # EventBridge rule for daily trigger (runs at midnight UTC)
        self.report_schedule_rule = aws.cloudwatch.EventRule(
            f"daily-report-schedule-{self.environment_suffix}",
            name=f"daily-report-schedule-{self.environment_suffix}",
            description="Trigger daily fraud report generation",
            schedule_expression="cron(0 0 * * ? *)",
            tags=self.common_tags,
            opts=ResourceOptions(parent=self)
        )

        # EventBridge target
        self.report_schedule_target = aws.cloudwatch.EventTarget(
            f"daily-report-target-{self.environment_suffix}",
            rule=self.report_schedule_rule.name,
            arn=self.report_generator.arn,
            opts=ResourceOptions(parent=self)
        )

        # Lambda permission for EventBridge
        self.report_lambda_permission = aws.lambda_.Permission(
            f"report-lambda-eventbridge-permission-{self.environment_suffix}",
            action="lambda:InvokeFunction",
            function=self.report_generator.name,
            principal="events.amazonaws.com",
            source_arn=self.report_schedule_rule.arn,
            opts=ResourceOptions(parent=self)
        )
