#!/usr/bin/env python
"""Infrastructure as Code for serverless fraud detection system using CDKTF"""

from cdktf import TerraformStack, S3Backend, TerraformOutput
from cdktf_cdktf_provider_aws.provider import AwsProvider
from cdktf_cdktf_provider_aws.dynamodb_table import DynamodbTable, DynamodbTableAttribute, DynamodbTableTtl
from cdktf_cdktf_provider_aws.lambda_function import LambdaFunction, LambdaFunctionDeadLetterConfig, LambdaFunctionEnvironment, LambdaFunctionTracingConfig
from cdktf_cdktf_provider_aws.lambda_event_source_mapping import LambdaEventSourceMapping
from cdktf_cdktf_provider_aws.api_gateway_rest_api import ApiGatewayRestApi
from cdktf_cdktf_provider_aws.api_gateway_resource import ApiGatewayResource
from cdktf_cdktf_provider_aws.api_gateway_method import ApiGatewayMethod
from cdktf_cdktf_provider_aws.api_gateway_integration import ApiGatewayIntegration
from cdktf_cdktf_provider_aws.api_gateway_deployment import ApiGatewayDeployment
from cdktf_cdktf_provider_aws.api_gateway_stage import ApiGatewayStage
from cdktf_cdktf_provider_aws.api_gateway_method_settings import ApiGatewayMethodSettings, ApiGatewayMethodSettingsSettings
from cdktf_cdktf_provider_aws.sqs_queue import SqsQueue
from cdktf_cdktf_provider_aws.sns_topic import SnsTopic
from constructs import Construct
from cdktf_cdktf_provider_aws.cloudwatch_metric_alarm import CloudwatchMetricAlarm
from cdktf_cdktf_provider_aws.cloudwatch_log_group import CloudwatchLogGroup
from cdktf_cdktf_provider_aws.iam_role import IamRole, IamRoleInlinePolicy
from cdktf_cdktf_provider_aws.iam_role_policy_attachment import IamRolePolicyAttachment
from cdktf_cdktf_provider_aws.lambda_permission import LambdaPermission
import json
import os
import hashlib
import shutil


class TapStack(TerraformStack):
    """CDKTF Stack for serverless fraud detection system"""
    def __init__(self, scope: Construct, stack_id: str, region: str, environment_suffix: str):
        super().__init__(scope, stack_id)
        
        self.region = region
        self.environment_suffix = environment_suffix
        
        # AWS Provider configuration
        AwsProvider(self, "aws", region=region)
        
        # S3 Backend configuration (conditional)
        state_bucket = os.getenv('TERRAFORM_STATE_BUCKET', '')
        state_bucket_region = os.getenv('TERRAFORM_STATE_BUCKET_REGION', 'us-east-1')
        state_bucket_key = os.getenv('TERRAFORM_STATE_BUCKET_KEY', 'test')
        
        if state_bucket:
            S3Backend(self,
                bucket=state_bucket,
                key=f"{state_bucket_key}/{stack_id}.tfstate",
                region=state_bucket_region,
                encrypt=True
            )
        
        # Create CloudWatch Log Groups first
        self.ingestion_log_group = self._create_log_group("transaction-ingestion")
        self.processor_log_group = self._create_log_group("transaction-processor")
        self.scorer_log_group = self._create_log_group("fraud-scorer")
        
        # Create DynamoDB tables
        self.transactions_table = self._create_transactions_table()
        self.fraud_scores_table = self._create_fraud_scores_table()
        
        # Create SQS Dead Letter Queues
        self.ingestion_dlq = self._create_dlq("transaction-ingestion")
        self.processor_dlq = self._create_dlq("transaction-processor")
        self.scorer_dlq = self._create_dlq("fraud-scorer")
        
        # Create SNS Topic
        self.fraud_alerts_topic = self._create_sns_topic()
        
        # Create IAM Roles
        self.ingestion_role = self._create_ingestion_role()
        self.processor_role = self._create_processor_role()
        self.scorer_role = self._create_scorer_role()
        
        # Create Lambda functions
        self.ingestion_lambda = self._create_transaction_ingestion()
        self.processor_lambda = self._create_transaction_processor()
        self.scorer_lambda = self._create_fraud_scorer()
        
        # Create event source mapping
        self._create_dynamodb_trigger()
        
        # Create API Gateway
        self.api = self._create_api_gateway()
        
        # Create CloudWatch Alarms
        self._create_cloudwatch_alarms()
        
        # Create outputs
        self._create_outputs()
    
    def _create_log_group(self, function_name: str) -> CloudwatchLogGroup:
        """Create CloudWatch Log Group with retention"""
        return CloudwatchLogGroup(
            self, f"{function_name}-log-group",
            name=f"/aws/lambda/{function_name}-{self.environment_suffix}",
            retention_in_days=7,
            tags={
                "Environment": self.environment_suffix
            }
        )
    
    def _create_transactions_table(self) -> DynamodbTable:
        """Create DynamoDB table for transactions"""
        return DynamodbTable(
            self, "transactions-table",
            name=f"transactions-{self.environment_suffix}",
            billing_mode="PAY_PER_REQUEST",
            hash_key="transaction_id",
            range_key="timestamp",
            attribute=[
                DynamodbTableAttribute(name="transaction_id", type="S"),
                DynamodbTableAttribute(name="timestamp", type="N")
            ],
            stream_enabled=True,
            stream_view_type="NEW_IMAGE",
            tags={
                "Environment": self.environment_suffix
            }
        )
    
    def _create_fraud_scores_table(self) -> DynamodbTable:
        """Create DynamoDB table for fraud scores"""
        return DynamodbTable(
            self, "fraud-scores-table",
            name=f"fraud_scores-{self.environment_suffix}",
            billing_mode="PAY_PER_REQUEST",
            hash_key="transaction_id",
            attribute=[
                DynamodbTableAttribute(name="transaction_id", type="S")
            ],
            ttl=DynamodbTableTtl(
                enabled=True,
                attribute_name="expiry"
            ),
            tags={
                "Environment": self.environment_suffix
            }
        )
    
    def _create_dlq(self, name: str) -> SqsQueue:
        """Create SQS Dead Letter Queue"""
        return SqsQueue(
            self, f"{name}-dlq",
            name=f"{name}-dlq-{self.environment_suffix}",
            message_retention_seconds=1209600,  # 14 days
            tags={
                "Environment": self.environment_suffix
            }
        )
    
    def _create_sns_topic(self) -> SnsTopic:
        """Create SNS topic for fraud alerts"""
        return SnsTopic(
            self, "fraud-alerts-topic",
            name=f"fraud-alerts-{self.environment_suffix}",
            tags={
                "Environment": self.environment_suffix
            }
        )
    
    def _create_api_gateway(self) -> ApiGatewayRestApi:
        """Create API Gateway REST API with all components"""
        # Create REST API
        api = ApiGatewayRestApi(
            self, "fraud-detection-api",
            name=f"fraud-detection-api-{self.environment_suffix}",
            description="API for fraud detection system"
        )
        
        # Create /transactions resource
        transactions_resource = ApiGatewayResource(
            self, "transactions-resource",
            rest_api_id=api.id,
            parent_id=api.root_resource_id,
            path_part="transactions"
        )
        
        # Create POST method
        post_method = ApiGatewayMethod(
            self, "transactions-post-method",
            rest_api_id=api.id,
            resource_id=transactions_resource.id,
            http_method="POST",
            authorization="NONE"
        )
        
        # Create Lambda integration
        integration = ApiGatewayIntegration(
            self, "transactions-integration",
            rest_api_id=api.id,
            resource_id=transactions_resource.id,
            http_method=post_method.http_method,
            integration_http_method="POST",
            type="AWS_PROXY",
            uri=self.ingestion_lambda.invoke_arn
        )
        
        # Create deployment
        deployment = ApiGatewayDeployment(
            self, "api-deployment",
            rest_api_id=api.id,
            depends_on=[post_method, integration]
        )
        
        # Create stage
        stage = ApiGatewayStage(
            self, "api-stage",
            deployment_id=deployment.id,
            rest_api_id=api.id,
            stage_name="prod",
            xray_tracing_enabled=True,
            tags={
                "Environment": self.environment_suffix
            }
        )
        
        # Configure method settings for throttling
        ApiGatewayMethodSettings(
            self, "api-method-settings",
            rest_api_id=api.id,
            stage_name=stage.stage_name,
            method_path="*/*",
            settings=ApiGatewayMethodSettingsSettings(
                throttling_rate_limit=1000,
                throttling_burst_limit=2000
            )
        )
        
        # Grant API Gateway permission to invoke Lambda
        LambdaPermission(
            self, "api-lambda-permission",
            statement_id="AllowAPIGatewayInvoke",
            action="lambda:InvokeFunction",
            function_name=self.ingestion_lambda.function_name,
            principal="apigateway.amazonaws.com",
            source_arn=f"{api.execution_arn}/*/*"
        )
        
        return api
    
    def _create_ingestion_role(self) -> IamRole:
        """Create IAM role for transaction ingestion Lambda"""
        return IamRole(
            self, "ingestion-lambda-role",
            name=f"transaction-ingestion-role-{self.environment_suffix}",
            assume_role_policy=json.dumps({
                "Version": "2012-10-17",
                "Statement": [{
                    "Action": "sts:AssumeRole",
                    "Principal": {"Service": "lambda.amazonaws.com"},
                    "Effect": "Allow"
                }]
            }),
            inline_policy=[IamRoleInlinePolicy(
                name="ingestion-policy",
                policy=json.dumps({
                    "Version": "2012-10-17",
                    "Statement": [
                        {
                            "Effect": "Allow",
                            "Action": ["dynamodb:PutItem"],
                            "Resource": self.transactions_table.arn
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
                        },
                        {
                            "Effect": "Allow",
                            "Action": ["sqs:SendMessage"],
                            "Resource": self.ingestion_dlq.arn
                        }
                    ]
                })
            )]
        )
    
    def _create_processor_role(self) -> IamRole:
        """Create IAM role for transaction processor Lambda"""
        return IamRole(
            self, "processor-lambda-role",
            name=f"transaction-processor-role-{self.environment_suffix}",
            assume_role_policy=json.dumps({
                "Version": "2012-10-17",
                "Statement": [{
                    "Action": "sts:AssumeRole",
                    "Principal": {"Service": "lambda.amazonaws.com"},
                    "Effect": "Allow"
                }]
            }),
            inline_policy=[IamRoleInlinePolicy(
                name="processor-policy",
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
                            "Resource": self.transactions_table.stream_arn
                        },
                        {
                            "Effect": "Allow",
                            "Action": ["lambda:InvokeFunction"],
                            "Resource": f"arn:aws:lambda:{self.region}:*:function:fraud-scorer-{self.environment_suffix}"
                        },
                        {
                            "Effect": "Allow",
                            "Action": ["sqs:SendMessage"],
                            "Resource": self.processor_dlq.arn
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
            )]
        )
    
    def _create_scorer_role(self) -> IamRole:
        """Create IAM role for fraud scorer Lambda"""
        role = IamRole(
            self, "scorer-lambda-role",
            name=f"fraud-scorer-role-{self.environment_suffix}",
            assume_role_policy=json.dumps({
                "Version": "2012-10-17",
                "Statement": [{
                    "Action": "sts:AssumeRole",
                    "Principal": {"Service": "lambda.amazonaws.com"},
                    "Effect": "Allow"
                }]
            }),
            inline_policy=[IamRoleInlinePolicy(
                name="scorer-policy",
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
                            "Resource": self.fraud_scores_table.arn
                        },
                        {
                            "Effect": "Allow",
                            "Action": ["sns:Publish"],
                            "Resource": self.fraud_alerts_topic.arn
                        },
                        {
                            "Effect": "Allow",
                            "Action": ["sqs:SendMessage"],
                            "Resource": self.scorer_dlq.arn
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
            )]
        )

        return role
    
    def _create_transaction_ingestion(self) -> LambdaFunction:
        """Create transaction ingestion Lambda function"""
        lambda_dir = os.path.join(os.path.dirname(__file__), "lambda")
        ingestion_zip = os.path.join(lambda_dir, "transaction-ingestion.zip")
        
        # Create the ZIP file if it doesn't exist
        source_dir = os.path.join(lambda_dir, "transaction-ingestion")
        if not os.path.exists(ingestion_zip) and os.path.exists(source_dir):
            shutil.make_archive(ingestion_zip.replace('.zip', ''), 'zip', source_dir)
        
        # Calculate source code hash
        source_code_hash = ""
        if os.path.exists(ingestion_zip):
            with open(ingestion_zip, "rb") as f:
                source_code_hash = hashlib.sha256(f.read()).hexdigest()

        return LambdaFunction(
            self, "transaction-ingestion",
            function_name=f"transaction-ingestion-{self.environment_suffix}",
            handler="index.handler",
            runtime="nodejs18.x",
            role=self.ingestion_role.arn,
            filename=ingestion_zip,
            source_code_hash=source_code_hash,
            timeout=30,
            memory_size=256,
            environment=LambdaFunctionEnvironment(
                variables={
                    "TRANSACTIONS_TABLE": self.transactions_table.name,
                    "DLQ_URL": self.ingestion_dlq.url
                }
            ),
            dead_letter_config=LambdaFunctionDeadLetterConfig(
                target_arn=self.ingestion_dlq.arn
            ),
            tracing_config=LambdaFunctionTracingConfig(mode="Active"),
            depends_on=[self.ingestion_log_group],
            tags={"Environment": self.environment_suffix}
        )
    
    def _create_transaction_processor(self) -> LambdaFunction:
        """Create transaction processor Lambda function"""
        lambda_dir = os.path.join(os.path.dirname(__file__), "lambda")
        processor_zip = os.path.join(lambda_dir, "transaction-processor.zip")
        
        # Create the ZIP file if it doesn't exist
        source_dir = os.path.join(lambda_dir, "transaction-processor")
        if not os.path.exists(processor_zip) and os.path.exists(source_dir):
            shutil.make_archive(processor_zip.replace('.zip', ''), 'zip', source_dir)
        
        # Calculate source code hash
        source_code_hash = ""
        if os.path.exists(processor_zip):
            with open(processor_zip, "rb") as f:
                source_code_hash = hashlib.sha256(f.read()).hexdigest()

        return LambdaFunction(
            self, "transaction-processor",
            function_name=f"transaction-processor-{self.environment_suffix}",
            handler="index.handler",
            runtime="nodejs18.x",
            role=self.processor_role.arn,
            filename=processor_zip,
            source_code_hash=source_code_hash,
            timeout=60,
            memory_size=512,
            reserved_concurrent_executions=100,
            environment=LambdaFunctionEnvironment(
                variables={
                    "FRAUD_SCORER_FUNCTION": f"fraud-scorer-{self.environment_suffix}",
                    "DLQ_URL": self.processor_dlq.url
                }
            ),
            dead_letter_config=LambdaFunctionDeadLetterConfig(
                target_arn=self.processor_dlq.arn
            ),
            tracing_config=LambdaFunctionTracingConfig(mode="Active"),
            depends_on=[self.processor_log_group],
            tags={"Environment": self.environment_suffix}
        )
    
    def _create_fraud_scorer(self) -> LambdaFunction:
        """Create fraud scorer Lambda function"""
        lambda_dir = os.path.join(os.path.dirname(__file__), "lambda")
        scorer_zip = os.path.join(lambda_dir, "fraud-scorer.zip")
        
        # Create the ZIP file if it doesn't exist
        source_dir = os.path.join(lambda_dir, "fraud-scorer")
        if not os.path.exists(scorer_zip) and os.path.exists(source_dir):
            shutil.make_archive(scorer_zip.replace('.zip', ''), 'zip', source_dir)
        
        # Calculate source code hash
        source_code_hash = ""
        if os.path.exists(scorer_zip):
            with open(scorer_zip, "rb") as f:
                source_code_hash = hashlib.sha256(f.read()).hexdigest()

        return LambdaFunction(
            self, "fraud-scorer",
            function_name=f"fraud-scorer-{self.environment_suffix}",
            handler="index.handler",
            runtime="nodejs18.x",
            role=self.scorer_role.arn,
            filename=scorer_zip,
            source_code_hash=source_code_hash,
            timeout=120,
            memory_size=1024,
            reserved_concurrent_executions=50,
            environment=LambdaFunctionEnvironment(
                variables={
                    "FRAUD_SCORES_TABLE": self.fraud_scores_table.name,
                    "SNS_TOPIC_ARN": self.fraud_alerts_topic.arn,
                    "DLQ_URL": self.scorer_dlq.url
                }
            ),
            dead_letter_config=LambdaFunctionDeadLetterConfig(
                target_arn=self.scorer_dlq.arn
            ),
            tracing_config=LambdaFunctionTracingConfig(mode="Active"),
            depends_on=[self.scorer_log_group],
            tags={"Environment": self.environment_suffix}
        )
    
    def _create_dynamodb_trigger(self):
        """Create event source mapping for DynamoDB stream"""
        LambdaEventSourceMapping(
            self, "transactions-stream-trigger",
            event_source_arn=self.transactions_table.stream_arn,
            function_name=self.processor_lambda.function_name,
            starting_position="LATEST",
            batch_size=100,
            maximum_retry_attempts=5
        )
    
    def _create_outputs(self):
        """Create stack outputs"""
        TerraformOutput(
            self, "api_endpoint",
            value=f"https://{self.api.id}.execute-api.{self.region}.amazonaws.com/prod",
            description="API Gateway endpoint URL"
        )
        
        TerraformOutput(
            self, "transactions_table_name",
            value=self.transactions_table.name,
            description="Transactions DynamoDB table name"
        )
        
        TerraformOutput(
            self, "fraud_scores_table_name",
            value=self.fraud_scores_table.name,
            description="Fraud scores DynamoDB table name"
        )
        
        TerraformOutput(
            self, "sns_topic_arn",
            value=self.fraud_alerts_topic.arn,
            description="SNS topic ARN for fraud alerts"
        )
        
        TerraformOutput(
            self, "ingestion_lambda_name",
            value=self.ingestion_lambda.function_name,
            description="Transaction ingestion Lambda function name"
        )
        
        TerraformOutput(
            self, "processor_lambda_name",
            value=self.processor_lambda.function_name,
            description="Transaction processor Lambda function name"
        )
        
        TerraformOutput(
            self, "scorer_lambda_name",
            value=self.scorer_lambda.function_name,
            description="Fraud scorer Lambda function name"
        )
    
    def _create_cloudwatch_alarms(self):
        """Create CloudWatch alarms for Lambda errors"""
        # Processor Lambda error alarm
        CloudwatchMetricAlarm(
            self, "processor-error-alarm",
            alarm_name=f"transaction-processor-errors-{self.environment_suffix}",
            comparison_operator="GreaterThanThreshold",
            evaluation_periods=1,
            metric_name="Errors",
            namespace="AWS/Lambda",
            period=300,
            statistic="Sum",
            threshold=10,
            alarm_description="Alert when transaction processor has more than 10 errors in 5 minutes",
            dimensions={
                "FunctionName": self.processor_lambda.function_name
            },
            treat_missing_data="notBreaching"
        )
        
        # Scorer Lambda error alarm
        CloudwatchMetricAlarm(
            self, "scorer-error-alarm",
            alarm_name=f"fraud-scorer-errors-{self.environment_suffix}",
            comparison_operator="GreaterThanThreshold",
            evaluation_periods=1,
            metric_name="Errors",
            namespace="AWS/Lambda",
            period=300,
            statistic="Sum",
            threshold=10,
            alarm_description="Alert when fraud scorer has more than 10 errors in 5 minutes",
            dimensions={
                "FunctionName": self.scorer_lambda.function_name
            },
            treat_missing_data="notBreaching"
        )

        # Ingestion Lambda error alarm
        CloudwatchMetricAlarm(
            self, "ingestion-error-alarm",
            alarm_name=f"transaction-ingestion-errors-{self.environment_suffix}",
            comparison_operator="GreaterThanThreshold",
            evaluation_periods=1,
            metric_name="Errors",
            namespace="AWS/Lambda",
            period=300,
            statistic="Sum",
            threshold=10,
            alarm_description="Alert when transaction ingestion has more than 10 errors in 5 minutes",
            dimensions={
                "FunctionName": self.ingestion_lambda.function_name
            },
            treat_missing_data="notBreaching"
        )
