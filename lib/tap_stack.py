from constructs import Construct
from cdktf import TerraformStack, TerraformOutput
from cdktf_cdktf_provider_aws.provider import AwsProvider
from cdktf_cdktf_provider_aws.dynamodb_table import (
    DynamodbTable, DynamodbTableAttribute, DynamodbTableTtl
)
from cdktf_cdktf_provider_aws.lambda_function import (
    LambdaFunction, LambdaFunctionEnvironment, LambdaFunctionTracingConfig
)
from cdktf_cdktf_provider_aws.lambda_event_source_mapping import LambdaEventSourceMapping
from cdktf_cdktf_provider_aws.api_gateway_rest_api import ApiGatewayRestApi
from cdktf_cdktf_provider_aws.api_gateway_resource import ApiGatewayResource
from cdktf_cdktf_provider_aws.api_gateway_method import ApiGatewayMethod
from cdktf_cdktf_provider_aws.api_gateway_integration import ApiGatewayIntegration
from cdktf_cdktf_provider_aws.api_gateway_deployment import ApiGatewayDeployment
from cdktf_cdktf_provider_aws.api_gateway_stage import ApiGatewayStage
from cdktf_cdktf_provider_aws.api_gateway_method_settings import ApiGatewayMethodSettings
from cdktf_cdktf_provider_aws.sqs_queue import SqsQueue
from cdktf_cdktf_provider_aws.sns_topic import SnsTopic
from cdktf_cdktf_provider_aws.cloudwatch_metric_alarm import CloudwatchMetricAlarm
from cdktf_cdktf_provider_aws.iam_role import IamRole, IamRoleInlinePolicy
from cdktf_cdktf_provider_aws.iam_role_policy_attachment import IamRolePolicyAttachment
from cdktf_cdktf_provider_aws.lambda_permission import LambdaPermission
import json
import os


class TapStack(TerraformStack):
    """CDKTF Stack for serverless fraud detection system"""
    def __init__(self, scope: Construct, stack_id: str, region: str, environment_suffix: str):
        super().__init__(scope, stack_id)

        self.region = region
        self.environment_suffix = environment_suffix

        # AWS Provider
        AwsProvider(self, "aws", region=self.region)

        # Create DynamoDB tables
        self.transactions_table = self._create_transactions_table()
        self.fraud_scores_table = self._create_fraud_scores_table()

        # Create SQS Dead Letter Queues
        self.ingestion_dlq = self._create_dlq("transaction-ingestion")
        self.processor_dlq = self._create_dlq("transaction-processor")
        self.scorer_dlq = self._create_dlq("fraud-scorer")

        # Create SNS Topic for fraud alerts
        self.fraud_alerts_topic = self._create_sns_topic()

        # Create IAM roles
        self.ingestion_role = self._create_ingestion_lambda_role()
        self.processor_role = self._create_processor_lambda_role()
        self.scorer_role = self._create_scorer_lambda_role()

        # Create Lambda functions
        self.ingestion_lambda = self._create_transaction_ingestion()
        self.processor_lambda = self._create_transaction_processor()
        self.scorer_lambda = self._create_fraud_scorer()

        # Create DynamoDB Stream trigger
        self._create_stream_trigger()

        # Create API Gateway
        self.api = self._create_api_gateway()

        # Create CloudWatch Alarms
        self._create_cloudwatch_alarms()

        # Outputs
        TerraformOutput(self, "api_endpoint",
            value=self.api.execution_arn,
            description="API Gateway endpoint URL"
        )
        TerraformOutput(self, "transactions_table_name",
            value=self.transactions_table.name,
            description="Transactions DynamoDB table name"
        )
        TerraformOutput(self, "fraud_scores_table_name",
            value=self.fraud_scores_table.name,
            description="Fraud scores DynamoDB table name"
        )
        TerraformOutput(self, "sns_topic_arn",
            value=self.fraud_alerts_topic.arn,
            description="SNS topic ARN for fraud alerts"
        )
        TerraformOutput(self, "ingestion_lambda_name",
            value=self.ingestion_lambda.function_name,
            description="Transaction ingestion Lambda function name"
        )
        TerraformOutput(self, "processor_lambda_name",
            value=self.processor_lambda.function_name,
            description="Transaction processor Lambda function name"
        )
        TerraformOutput(self, "scorer_lambda_name",
            value=self.scorer_lambda.function_name,
            description="Fraud scorer Lambda function name"
        )

    def _create_transactions_table(self) -> DynamodbTable:
        """Create transactions DynamoDB table"""
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
            tags={"Environment": self.environment_suffix}
        )

    def _create_fraud_scores_table(self) -> DynamodbTable:
        """Create fraud scores DynamoDB table"""
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
            tags={"Environment": self.environment_suffix}
        )

    def _create_dlq(self, function_name: str) -> SqsQueue:
        """Create SQS Dead Letter Queue"""
        return SqsQueue(
            self, f"{function_name}-dlq",
            name=f"{function_name}-dlq-{self.environment_suffix}",
            message_retention_seconds=1209600,  # 14 days
            tags={"Environment": self.environment_suffix}
        )

    def _create_sns_topic(self) -> SnsTopic:
        """Create SNS topic for fraud alerts"""
        return SnsTopic(
            self, "fraud-alerts-topic",
            name=f"fraud-alerts-{self.environment_suffix}",
            tags={"Environment": self.environment_suffix}
        )

    def _create_ingestion_lambda_role(self) -> IamRole:
        """Create IAM role for transaction ingestion Lambda"""
        assume_role_policy = {
            "Version": "2012-10-17",
            "Statement": [{
                "Action": "sts:AssumeRole",
                "Principal": {"Service": "lambda.amazonaws.com"},
                "Effect": "Allow"
            }]
        }

        inline_policy = {
            "Version": "2012-10-17",
            "Statement": [
                {
                    "Effect": "Allow",
                    "Action": [
                        "dynamodb:PutItem"
                    ],
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
                    "Action": ["xray:PutTraceSegments", "xray:PutTelemetryRecords"],
                    "Resource": "*"
                },
                {
                    "Effect": "Allow",
                    "Action": ["sqs:SendMessage"],
                    "Resource": self.ingestion_dlq.arn
                }
            ]
        }

        role = IamRole(
            self, "ingestion-lambda-role",
            name=f"transaction-ingestion-role-{self.environment_suffix}",
            assume_role_policy=json.dumps(assume_role_policy),
            inline_policy=[IamRoleInlinePolicy(
                name="ingestion-policy",
                policy=json.dumps(inline_policy)
            )]
        )

        return role

    def _create_processor_lambda_role(self) -> IamRole:
        """Create IAM role for transaction processor Lambda"""
        assume_role_policy = {
            "Version": "2012-10-17",
            "Statement": [{
                "Action": "sts:AssumeRole",
                "Principal": {"Service": "lambda.amazonaws.com"},
                "Effect": "Allow"
            }]
        }

        inline_policy = {
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
                    "Resource": "*"
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
                    "Action": ["xray:PutTraceSegments", "xray:PutTelemetryRecords"],
                    "Resource": "*"
                }
            ]
        }

        role = IamRole(
            self, "processor-lambda-role",
            name=f"transaction-processor-role-{self.environment_suffix}",
            assume_role_policy=json.dumps(assume_role_policy),
            inline_policy=[IamRoleInlinePolicy(
                name="processor-policy",
                policy=json.dumps(inline_policy)
            )]
        )

        return role

    def _create_scorer_lambda_role(self) -> IamRole:
        """Create IAM role for fraud scorer Lambda"""
        assume_role_policy = {
            "Version": "2012-10-17",
            "Statement": [{
                "Action": "sts:AssumeRole",
                "Principal": {"Service": "lambda.amazonaws.com"},
                "Effect": "Allow"
            }]
        }

        inline_policy = {
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
                    "Action": ["xray:PutTraceSegments", "xray:PutTelemetryRecords"],
                    "Resource": "*"
                }
            ]
        }

        role = IamRole(
            self, "scorer-lambda-role",
            name=f"fraud-scorer-role-{self.environment_suffix}",
            assume_role_policy=json.dumps(assume_role_policy),
            inline_policy=[IamRoleInlinePolicy(
                name="scorer-policy",
                policy=json.dumps(inline_policy)
            )]
        )

        return role

    def _create_transaction_ingestion(self) -> LambdaFunction:
        """Create transaction ingestion Lambda function"""
        lambda_dir = os.path.join(os.path.dirname(__file__), "lambda")
        ingestion_zip = os.path.join(lambda_dir, "transaction-ingestion.zip")

        return LambdaFunction(
            self, "transaction-ingestion",
            function_name=f"transaction-ingestion-{self.environment_suffix}",
            handler="index.handler",
            runtime="nodejs18.x",
            role=self.ingestion_role.arn,
            filename=ingestion_zip,
            memory_size=256,
            timeout=30,
            environment=LambdaFunctionEnvironment(
                variables={
                    "TRANSACTIONS_TABLE": self.transactions_table.name,
                    "DLQ_URL": self.ingestion_dlq.url
                }
            ),
            tracing_config=LambdaFunctionTracingConfig(
                mode="Active"
            ),
            dead_letter_config={
                "target_arn": self.ingestion_dlq.arn
            },
            tags={"Environment": self.environment_suffix}
        )

    def _create_transaction_processor(self) -> LambdaFunction:
        """Create transaction processor Lambda function"""
        # Get the Lambda function code path
        lambda_dir = os.path.join(os.path.dirname(__file__), "lambda")
        processor_zip = os.path.join(lambda_dir, "transaction-processor.zip")

        return LambdaFunction(
            self, "transaction-processor",
            function_name=f"transaction-processor-{self.environment_suffix}",
            handler="index.handler",
            runtime="nodejs18.x",
            role=self.processor_role.arn,
            filename=processor_zip,
            memory_size=512,
            timeout=60,
            environment=LambdaFunctionEnvironment(
                variables={
                    "FRAUD_SCORER_FUNCTION": f"fraud-scorer-{self.environment_suffix}",
                    "DLQ_URL": self.processor_dlq.url
                }
            ),
            tracing_config=LambdaFunctionTracingConfig(
                mode="Active"
            ),
            dead_letter_config={
                "target_arn": self.processor_dlq.arn
            },
            tags={"Environment": self.environment_suffix}
        )

    def _create_fraud_scorer(self) -> LambdaFunction:
        """Create fraud scorer Lambda function"""
        # Get the Lambda function code path
        lambda_dir = os.path.join(os.path.dirname(__file__), "lambda")
        scorer_zip = os.path.join(lambda_dir, "fraud-scorer.zip")

        return LambdaFunction(
            self, "fraud-scorer",
            function_name=f"fraud-scorer-{self.environment_suffix}",
            handler="index.handler",
            runtime="nodejs18.x",
            role=self.scorer_role.arn,
            filename=scorer_zip,
            memory_size=1024,
            timeout=120,
            environment=LambdaFunctionEnvironment(
                variables={
                    "FRAUD_SCORES_TABLE": self.fraud_scores_table.name,
                    "SNS_TOPIC_ARN": self.fraud_alerts_topic.arn,
                    "DLQ_URL": self.scorer_dlq.url
                }
            ),
            tracing_config=LambdaFunctionTracingConfig(
                mode="Active"
            ),
            dead_letter_config={
                "target_arn": self.scorer_dlq.arn
            },
            tags={"Environment": self.environment_suffix}
        )

    def _create_stream_trigger(self):
        """Create DynamoDB Stream event source mapping"""
        LambdaEventSourceMapping(
            self, "transactions-stream-trigger",
            event_source_arn=self.transactions_table.stream_arn,
            function_name=self.processor_lambda.function_name,
            starting_position="LATEST",
            maximum_retry_attempts=5,
            batch_size=100
        )

    def _create_api_gateway(self) -> ApiGatewayRestApi:
        """Create API Gateway REST API"""
        # Create REST API
        api = ApiGatewayRestApi(
            self, "fraud-detection-api",
            name=f"fraud-detection-api-{self.environment_suffix}",
            description="API for fraud detection system"
        )

        # Create /transactions resource
        resource = ApiGatewayResource(
            self, "transactions-resource",
            rest_api_id=api.id,
            parent_id=api.root_resource_id,
            path_part="transactions"
        )

        # Create POST method
        method = ApiGatewayMethod(
            self, "transactions-post-method",
            rest_api_id=api.id,
            resource_id=resource.id,
            http_method="POST",
            authorization="NONE"
        )

        # Create Lambda integration
        integration = ApiGatewayIntegration(
            self, "transactions-integration",
            rest_api_id=api.id,
            resource_id=resource.id,
            http_method=method.http_method,
            integration_http_method="POST",
            type="AWS_PROXY",
            uri=self.ingestion_lambda.invoke_arn
        )

        # Create deployment
        deployment = ApiGatewayDeployment(
            self, "api-deployment",
            rest_api_id=api.id,
            depends_on=[method, integration]
        )

        # Create stage
        stage = ApiGatewayStage(
            self, "api-stage",
            rest_api_id=api.id,
            stage_name="prod",
            deployment_id=deployment.id,
            xray_tracing_enabled=True,
            tags={"Environment": self.environment_suffix}
        )

        # Configure throttling settings
        ApiGatewayMethodSettings(
            self, "api-method-settings",
            rest_api_id=api.id,
            stage_name=stage.stage_name,
            method_path="*/*",
            settings={
                "throttling_rate_limit": 1000,
                "throttling_burst_limit": 2000
            }
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

    def _create_cloudwatch_alarms(self):
        """Create CloudWatch alarms for Lambda errors"""
        # Alarm for transaction processor
        CloudwatchMetricAlarm(
            self, "processor-error-alarm",
            alarm_name=f"transaction-processor-errors-{self.environment_suffix}",
            comparison_operator="GreaterThanThreshold",
            evaluation_periods=1,
            metric_name="Errors",
            namespace="AWS/Lambda",
            period=300,
            statistic="Average",
            threshold=0.01,  # 1% error rate
            alarm_description="Alert when transaction processor error rate exceeds 1%",
            dimensions={
                "FunctionName": self.processor_lambda.function_name
            },
            treat_missing_data="notBreaching"
        )

        # Alarm for fraud scorer
        CloudwatchMetricAlarm(
            self, "scorer-error-alarm",
            alarm_name=f"fraud-scorer-errors-{self.environment_suffix}",
            comparison_operator="GreaterThanThreshold",
            evaluation_periods=1,
            metric_name="Errors",
            namespace="AWS/Lambda",
            period=300,
            statistic="Average",
            threshold=0.01,  # 1% error rate
            alarm_description="Alert when fraud scorer error rate exceeds 1%",
            dimensions={
                "FunctionName": self.scorer_lambda.function_name
            },
            treat_missing_data="notBreaching"
        )
