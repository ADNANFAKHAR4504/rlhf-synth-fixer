from constructs import Construct
from cdktf import TerraformStack, TerraformOutput, Fn, S3Backend
from cdktf_cdktf_provider_aws.provider import AwsProvider
from cdktf_cdktf_provider_aws.kms_key import KmsKey
from cdktf_cdktf_provider_aws.kms_alias import KmsAlias
from cdktf_cdktf_provider_aws.dynamodb_table import DynamodbTable, DynamodbTableAttribute, DynamodbTableGlobalSecondaryIndex, DynamodbTablePointInTimeRecovery
from cdktf_cdktf_provider_aws.sns_topic import SnsTopic
from cdktf_cdktf_provider_aws.sns_topic_subscription import SnsTopicSubscription
from cdktf_cdktf_provider_aws.sqs_queue import SqsQueue
from cdktf_cdktf_provider_aws.sqs_queue_policy import SqsQueuePolicy
from cdktf_cdktf_provider_aws.iam_role import IamRole
from cdktf_cdktf_provider_aws.iam_role_policy_attachment import IamRolePolicyAttachment
from cdktf_cdktf_provider_aws.iam_policy import IamPolicy
from cdktf_cdktf_provider_aws.lambda_function import LambdaFunction, LambdaFunctionEnvironment, LambdaFunctionDeadLetterConfig
from cdktf_cdktf_provider_aws.lambda_permission import LambdaPermission
from cdktf_cdktf_provider_aws.lambda_event_source_mapping import LambdaEventSourceMapping
from cdktf_cdktf_provider_aws.cloudwatch_log_group import CloudwatchLogGroup
from cdktf_cdktf_provider_aws.cloudwatch_event_rule import CloudwatchEventRule
from cdktf_cdktf_provider_aws.cloudwatch_event_target import CloudwatchEventTarget
from cdktf_cdktf_provider_aws.cloudwatch_metric_alarm import CloudwatchMetricAlarm
from cdktf_cdktf_provider_aws.api_gateway_rest_api import ApiGatewayRestApi
from cdktf_cdktf_provider_aws.api_gateway_resource import ApiGatewayResource
from cdktf_cdktf_provider_aws.api_gateway_method import ApiGatewayMethod
from cdktf_cdktf_provider_aws.api_gateway_integration import ApiGatewayIntegration
from cdktf_cdktf_provider_aws.api_gateway_deployment import ApiGatewayDeployment
from cdktf_cdktf_provider_aws.api_gateway_stage import ApiGatewayStage
from cdktf_cdktf_provider_aws.api_gateway_request_validator import ApiGatewayRequestValidator
from cdktf_cdktf_provider_aws.api_gateway_model import ApiGatewayModel
from cdktf_cdktf_provider_aws.api_gateway_usage_plan import ApiGatewayUsagePlan, ApiGatewayUsagePlanQuotaSettings, ApiGatewayUsagePlanApiStages
from cdktf_cdktf_provider_aws.api_gateway_api_key import ApiGatewayApiKey
from cdktf_cdktf_provider_aws.api_gateway_usage_plan_key import ApiGatewayUsagePlanKey
from cdktf_cdktf_provider_aws.ssm_parameter import SsmParameter
import json


class FraudDetectionStack(TerraformStack):
    def __init__(self, scope: Construct, id: str, **kwargs):
        super().__init__(scope, id)

        # Extract configuration
        self.environment_suffix = kwargs.get('environment_suffix', 'dev')
        state_bucket = kwargs.get('state_bucket', 'iac-rlhf-tf-states')
        state_bucket_region = kwargs.get('state_bucket_region', 'us-east-1')
        aws_region = kwargs.get('aws_region', 'us-east-1')
        use_dynamodb_lock = kwargs.get('use_dynamodb_lock', False)
        default_tags = kwargs.get('default_tags', {})

        # Add version suffix to avoid conflicts with existing resources
        self.resource_suffix = f"v1-{self.environment_suffix}"

        # Configure S3 Backend for state management
        backend_config = {
            "bucket": state_bucket,
            "key": f"fraud-detection/{self.environment_suffix}/terraform.tfstate",
            "region": state_bucket_region,
            "encrypt": True
        }

        # Only add DynamoDB locking if explicitly enabled and table exists
        if use_dynamodb_lock:
            backend_config["dynamodb_table"] = f"{state_bucket}-lock"

        S3Backend(self, **backend_config)

        # Provider with default tags
        provider_config = {"region": aws_region}
        if default_tags:
            provider_config["default_tags"] = [default_tags]

        AwsProvider(self, "aws", **provider_config)

        # Tags for all resources (merge with default tags)
        base_tags = {
            "Environment": f"{self.environment_suffix}",
            "Project": "FraudDetection",
            "CostCenter": "Engineering"
        }

        # Merge default_tags with base_tags
        if default_tags and "tags" in default_tags:
            self.common_tags = {**base_tags, **default_tags["tags"]}
        else:
            self.common_tags = base_tags

        # KMS Key for encryption
        self.kms_key = self.create_kms_key()

        # DynamoDB Table
        self.dynamodb_table = self.create_dynamodb_table()

        # SNS Topic and SQS Queue
        self.sns_topic = self.create_sns_topic()
        self.sqs_queue = self.create_sqs_queue()
        self.dlq = self.create_dlq()

        # SQS Queue Policy to allow SNS to send messages
        queue_policy = SqsQueuePolicy(
            self,
            f"fraud-alerts-queue-policy-{self.resource_suffix}",
            queue_url=self.sqs_queue.url,
            policy=json.dumps({
                "Version": "2012-10-17",
                "Statement": [
                    {
                        "Effect": "Allow",
                        "Principal": {"Service": "sns.amazonaws.com"},
                        "Action": "sqs:SendMessage",
                        "Resource": self.sqs_queue.arn,
                        "Condition": {
                            "ArnEquals": {
                                "aws:SourceArn": self.sns_topic.arn
                            }
                        }
                    }
                ]
            })
        )

        # Subscribe SQS to SNS
        SnsTopicSubscription(
            self,
            f"fraud-alerts-subscription-{self.resource_suffix}",
            topic_arn=self.sns_topic.arn,
            protocol="sqs",
            endpoint=self.sqs_queue.arn,
            depends_on=[queue_policy]
        )

        # SSM Parameters
        self.create_ssm_parameters()

        # Lambda Functions
        self.transaction_processor = self.create_transaction_processor_lambda()
        self.pattern_analyzer = self.create_pattern_analyzer_lambda()

        # CloudWatch Alarms
        self.create_cloudwatch_alarms()

        # EventBridge Rule for scheduled analysis
        self.create_scheduled_rule()

        # API Gateway
        self.api = self.create_api_gateway()

        # Outputs
        TerraformOutput(
            self,
            "api_endpoint",
            value=f"https://{self.api.id}.execute-api.us-east-1.amazonaws.com/prod"
        )

        TerraformOutput(
            self,
            "transaction_processor_arn",
            value=self.transaction_processor.arn
        )

        TerraformOutput(
            self,
            "dynamodb_table_name",
            value=self.dynamodb_table.name
        )

    def create_kms_key(self):
        kms_key = KmsKey(
            self,
            f"fraud-detection-key-{self.resource_suffix}",
            description=f"KMS key for fraud detection system - {self.environment_suffix}",
            deletion_window_in_days=7,
            enable_key_rotation=True,
            tags=self.common_tags
        )

        KmsAlias(
            self,
            f"fraud-detection-key-alias-{self.resource_suffix}",
            name=f"alias/fraud-detection-{self.resource_suffix}",
            target_key_id=kms_key.key_id
        )

        return kms_key

    def create_dynamodb_table(self):
        table = DynamodbTable(
            self,
            f"transactions-table-{self.resource_suffix}",
            name=f"transactions-{self.resource_suffix}",
            billing_mode="PAY_PER_REQUEST",
            hash_key="transaction_id",
            range_key="timestamp",
            attribute=[
                DynamodbTableAttribute(name="transaction_id", type="S"),
                DynamodbTableAttribute(name="timestamp", type="N"),
                DynamodbTableAttribute(name="user_id", type="S")
            ],
            global_secondary_index=[
                DynamodbTableGlobalSecondaryIndex(
                    name="user-index",
                    hash_key="user_id",
                    range_key="timestamp",
                    projection_type="ALL"
                )
            ],
            point_in_time_recovery=DynamodbTablePointInTimeRecovery(enabled=True),
            server_side_encryption={
                "enabled": True,
                "kms_key_arn": self.kms_key.arn
            },
            tags=self.common_tags
        )

        return table

    def create_sns_topic(self):
        topic = SnsTopic(
            self,
            f"fraud-alerts-topic-{self.resource_suffix}",
            name=f"fraud-alerts-{self.resource_suffix}",
            kms_master_key_id=self.kms_key.key_id,
            tags=self.common_tags,
            sqs_success_feedback_role_arn=self.create_sns_feedback_role().arn,
            sqs_success_feedback_sample_rate=100
        )

        return topic

    def create_sns_feedback_role(self):
        assume_role_policy = {
            "Version": "2012-10-17",
            "Statement": [
                {
                    "Effect": "Allow",
                    "Principal": {"Service": "sns.amazonaws.com"},
                    "Action": "sts:AssumeRole"
                }
            ]
        }

        role = IamRole(
            self,
            f"sns-feedback-role-{self.resource_suffix}",
            name=f"sns-feedback-role-{self.resource_suffix}",
            assume_role_policy=json.dumps(assume_role_policy),
            tags=self.common_tags
        )

        policy = IamPolicy(
            self,
            f"sns-feedback-policy-{self.resource_suffix}",
            name=f"sns-feedback-policy-{self.resource_suffix}",
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
                        "Resource": "*"
                    }
                ]
            })
        )

        IamRolePolicyAttachment(
            self,
            f"sns-feedback-policy-attachment-{self.resource_suffix}",
            role=role.name,
            policy_arn=policy.arn
        )

        return role

    def create_sqs_queue(self):
        queue = SqsQueue(
            self,
            f"fraud-alerts-queue-{self.resource_suffix}",
            name=f"fraud-alerts-queue-{self.resource_suffix}",
            visibility_timeout_seconds=300,
            kms_master_key_id=self.kms_key.key_id,
            tags=self.common_tags
        )

        return queue

    def create_dlq(self):
        dlq = SqsQueue(
            self,
            f"lambda-dlq-{self.resource_suffix}",
            name=f"lambda-dlq-{self.resource_suffix}",
            visibility_timeout_seconds=300,
            kms_master_key_id=self.kms_key.key_id,
            tags=self.common_tags
        )

        return dlq

    def create_ssm_parameters(self):
        SsmParameter(
            self,
            f"fraud-threshold-param-{self.resource_suffix}",
            name=f"/fraud-detection/{self.resource_suffix}/fraud_threshold",
            type="String",
            value="0.85",
            description="Fraud detection threshold",
            tags=self.common_tags
        )

        SsmParameter(
            self,
            f"alert-email-param-{self.resource_suffix}",
            name=f"/fraud-detection/{self.resource_suffix}/alert_email",
            type="String",
            value="alerts@example.com",
            description="Alert email address",
            tags=self.common_tags
        )

    def create_lambda_role(self, name: str, service_policies: list):
        assume_role_policy = {
            "Version": "2012-10-17",
            "Statement": [
                {
                    "Effect": "Allow",
                    "Principal": {"Service": "lambda.amazonaws.com"},
                    "Action": "sts:AssumeRole"
                }
            ]
        }

        role = IamRole(
            self,
            f"{name}-role-{self.resource_suffix}",
            name=f"{name}-role-{self.resource_suffix}",
            assume_role_policy=json.dumps(assume_role_policy),
            tags=self.common_tags
        )

        # Basic Lambda execution policy
        IamRolePolicyAttachment(
            self,
            f"{name}-basic-execution-{self.resource_suffix}",
            role=role.name,
            policy_arn="arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"
        )

        # X-Ray policy
        IamRolePolicyAttachment(
            self,
            f"{name}-xray-{self.resource_suffix}",
            role=role.name,
            policy_arn="arn:aws:iam::aws:policy/AWSXRayDaemonWriteAccess"
        )

        # Custom policies
        for idx, policy_doc in enumerate(service_policies):
            policy = IamPolicy(
                self,
                f"{name}-policy-{idx}-{self.resource_suffix}",
                name=f"{name}-policy-{idx}-{self.resource_suffix}",
                policy=json.dumps(policy_doc)
            )

            IamRolePolicyAttachment(
                self,
                f"{name}-policy-attachment-{idx}-{self.resource_suffix}",
                role=role.name,
                policy_arn=policy.arn
            )

        return role

    def create_transaction_processor_lambda(self):
        # IAM Role
        dynamodb_policy = {
            "Version": "2012-10-17",
            "Statement": [
                {
                    "Effect": "Allow",
                    "Action": [
                        "dynamodb:PutItem",
                        "dynamodb:GetItem"
                    ],
                    "Resource": self.dynamodb_table.arn
                },
                {
                    "Effect": "Allow",
                    "Action": [
                        "sns:Publish"
                    ],
                    "Resource": self.sns_topic.arn
                },
                {
                    "Effect": "Allow",
                    "Action": [
                        "ssm:GetParameter",
                        "ssm:GetParameters"
                    ],
                    "Resource": f"arn:aws:ssm:us-east-1:*:parameter/fraud-detection/{self.resource_suffix}/*"
                },
                {
                    "Effect": "Allow",
                    "Action": [
                        "kms:Decrypt",
                        "kms:GenerateDataKey"
                    ],
                    "Resource": self.kms_key.arn
                },
                {
                    "Effect": "Allow",
                    "Action": [
                        "sqs:SendMessage"
                    ],
                    "Resource": self.dlq.arn
                }
            ]
        }

        role = self.create_lambda_role("transaction-processor", [dynamodb_policy])

        # CloudWatch Log Group
        log_group = CloudwatchLogGroup(
            self,
            f"transaction-processor-logs-{self.resource_suffix}",
            name=f"/aws/lambda/transaction-processor-{self.resource_suffix}",
            retention_in_days=30,
            tags=self.common_tags
        )

        # Lambda Function
        lambda_function = LambdaFunction(
            self,
            f"transaction-processor-{self.resource_suffix}",
            function_name=f"transaction-processor-{self.resource_suffix}",
            runtime="python3.11",
            handler="transaction_processor.handler",
            role=role.arn,
            filename="../../../lib/lambda_functions/transaction_processor.zip",
            source_code_hash=Fn.filebase64sha256("../../../lib/lambda_functions/transaction_processor.zip"),
            timeout=30,
            memory_size=512,
            reserved_concurrent_executions=5,
            architectures=["arm64"],
            environment=LambdaFunctionEnvironment(
                variables={
                    "DYNAMODB_TABLE": self.dynamodb_table.name,
                    "SNS_TOPIC_ARN": self.sns_topic.arn,
                    "ENVIRONMENT": self.environment_suffix
                }
            ),
            dead_letter_config=LambdaFunctionDeadLetterConfig(
                target_arn=self.dlq.arn
            ),
            tracing_config={
                "mode": "Active"
            },
            tags=self.common_tags,
            depends_on=[log_group]
        )

        return lambda_function

    def create_pattern_analyzer_lambda(self):
        # IAM Role
        analyzer_policy = {
            "Version": "2012-10-17",
            "Statement": [
                {
                    "Effect": "Allow",
                    "Action": [
                        "dynamodb:Query",
                        "dynamodb:Scan"
                    ],
                    "Resource": [
                        self.dynamodb_table.arn,
                        f"{self.dynamodb_table.arn}/index/*"
                    ]
                },
                {
                    "Effect": "Allow",
                    "Action": [
                        "sns:Publish"
                    ],
                    "Resource": self.sns_topic.arn
                },
                {
                    "Effect": "Allow",
                    "Action": [
                        "ssm:GetParameter",
                        "ssm:GetParameters"
                    ],
                    "Resource": f"arn:aws:ssm:us-east-1:*:parameter/fraud-detection/{self.resource_suffix}/*"
                },
                {
                    "Effect": "Allow",
                    "Action": [
                        "kms:Decrypt"
                    ],
                    "Resource": self.kms_key.arn
                },
                {
                    "Effect": "Allow",
                    "Action": [
                        "sqs:SendMessage"
                    ],
                    "Resource": self.dlq.arn
                }
            ]
        }

        role = self.create_lambda_role("pattern-analyzer", [analyzer_policy])

        # CloudWatch Log Group
        log_group = CloudwatchLogGroup(
            self,
            f"pattern-analyzer-logs-{self.resource_suffix}",
            name=f"/aws/lambda/pattern-analyzer-{self.resource_suffix}",
            retention_in_days=30,
            tags=self.common_tags
        )

        # Lambda Function
        lambda_function = LambdaFunction(
            self,
            f"pattern-analyzer-{self.resource_suffix}",
            function_name=f"pattern-analyzer-{self.resource_suffix}",
            runtime="python3.11",
            handler="pattern_analyzer.handler",
            role=role.arn,
            filename="../../../lib/lambda_functions/pattern_analyzer.zip",
            source_code_hash=Fn.filebase64sha256("../../../lib/lambda_functions/pattern_analyzer.zip"),
            timeout=60,
            memory_size=1024,
            reserved_concurrent_executions=2,
            architectures=["arm64"],
            environment=LambdaFunctionEnvironment(
                variables={
                    "DYNAMODB_TABLE": self.dynamodb_table.name,
                    "SNS_TOPIC_ARN": self.sns_topic.arn,
                    "ENVIRONMENT": self.environment_suffix
                }
            ),
            dead_letter_config=LambdaFunctionDeadLetterConfig(
                target_arn=self.dlq.arn
            ),
            tracing_config={
                "mode": "Active"
            },
            tags=self.common_tags,
            depends_on=[log_group]
        )

        return lambda_function

    def create_cloudwatch_alarms(self):
        # Alarm for transaction processor errors
        CloudwatchMetricAlarm(
            self,
            f"transaction-processor-errors-{self.resource_suffix}",
            alarm_name=f"transaction-processor-errors-{self.resource_suffix}",
            comparison_operator="GreaterThanThreshold",
            evaluation_periods=1,
            metric_name="Errors",
            namespace="AWS/Lambda",
            period=300,
            statistic="Sum",
            threshold=1,
            alarm_description="Alert when transaction processor error rate exceeds 1%",
            dimensions={
                "FunctionName": self.transaction_processor.function_name
            },
            treat_missing_data="notBreaching",
            tags=self.common_tags
        )

        # Alarm for pattern analyzer errors
        CloudwatchMetricAlarm(
            self,
            f"pattern-analyzer-errors-{self.resource_suffix}",
            alarm_name=f"pattern-analyzer-errors-{self.resource_suffix}",
            comparison_operator="GreaterThanThreshold",
            evaluation_periods=1,
            metric_name="Errors",
            namespace="AWS/Lambda",
            period=300,
            statistic="Sum",
            threshold=1,
            alarm_description="Alert when pattern analyzer error rate exceeds 1%",
            dimensions={
                "FunctionName": self.pattern_analyzer.function_name
            },
            treat_missing_data="notBreaching",
            tags=self.common_tags
        )

    def create_scheduled_rule(self):
        # EventBridge Rule
        rule = CloudwatchEventRule(
            self,
            f"pattern-analysis-schedule-{self.resource_suffix}",
            name=f"pattern-analysis-schedule-{self.resource_suffix}",
            description="Trigger pattern analysis every 5 minutes",
            schedule_expression="rate(5 minutes)",
            tags=self.common_tags
        )

        # Lambda Permission
        LambdaPermission(
            self,
            f"pattern-analyzer-eventbridge-permission-{self.resource_suffix}",
            statement_id="AllowExecutionFromEventBridge",
            action="lambda:InvokeFunction",
            function_name=self.pattern_analyzer.function_name,
            principal="events.amazonaws.com",
            source_arn=rule.arn
        )

        # EventBridge Target
        CloudwatchEventTarget(
            self,
            f"pattern-analyzer-target-{self.resource_suffix}",
            rule=rule.name,
            arn=self.pattern_analyzer.arn
        )

    def create_api_gateway(self):
        # REST API
        api = ApiGatewayRestApi(
            self,
            f"fraud-detection-api-{self.resource_suffix}",
            name=f"fraud-detection-api-{self.resource_suffix}",
            description="Fraud Detection API",
            tags=self.common_tags
        )

        # Request Validator
        validator = ApiGatewayRequestValidator(
            self,
            f"request-validator-{self.resource_suffix}",
            name=f"request-validator-{self.resource_suffix}",
            rest_api_id=api.id,
            validate_request_body=True,
            validate_request_parameters=True
        )

        # Request Model
        model = ApiGatewayModel(
            self,
            f"transaction-model-{self.resource_suffix}",
            rest_api_id=api.id,
            name="TransactionModel",
            description="Transaction request model",
            content_type="application/json",
            schema=json.dumps({
                "$schema": "http://json-schema.org/draft-04/schema#",
                "type": "object",
                "required": ["transaction_id", "user_id", "amount"],
                "properties": {
                    "transaction_id": {"type": "string"},
                    "user_id": {"type": "string"},
                    "amount": {"type": "number"},
                    "merchant": {"type": "string"},
                    "location": {"type": "string"}
                }
            })
        )

        # /transactions resource
        transactions_resource = ApiGatewayResource(
            self,
            f"transactions-resource-{self.resource_suffix}",
            rest_api_id=api.id,
            parent_id=api.root_resource_id,
            path_part="transactions"
        )

        # POST method
        post_method = ApiGatewayMethod(
            self,
            f"transactions-post-method-{self.resource_suffix}",
            rest_api_id=api.id,
            resource_id=transactions_resource.id,
            http_method="POST",
            authorization="NONE",
            api_key_required=True,
            request_validator_id=validator.id,
            request_models={
                "application/json": model.name
            }
        )

        # Lambda Integration
        integration = ApiGatewayIntegration(
            self,
            f"transactions-integration-{self.resource_suffix}",
            rest_api_id=api.id,
            resource_id=transactions_resource.id,
            http_method=post_method.http_method,
            integration_http_method="POST",
            type="AWS_PROXY",
            uri=self.transaction_processor.invoke_arn
        )

        # Lambda Permission for API Gateway
        LambdaPermission(
            self,
            f"api-gateway-lambda-permission-{self.resource_suffix}",
            statement_id="AllowExecutionFromAPIGateway",
            action="lambda:InvokeFunction",
            function_name=self.transaction_processor.function_name,
            principal="apigateway.amazonaws.com",
            source_arn=f"{api.execution_arn}/*/*"
        )

        # Deployment
        deployment = ApiGatewayDeployment(
            self,
            f"api-deployment-{self.resource_suffix}",
            rest_api_id=api.id,
            depends_on=[post_method, integration],
            lifecycle={
                "create_before_destroy": True
            }
        )

        # Stage
        stage = ApiGatewayStage(
            self,
            f"api-stage-{self.resource_suffix}",
            deployment_id=deployment.id,
            rest_api_id=api.id,
            stage_name="prod",
            xray_tracing_enabled=True,
            tags=self.common_tags
        )

        # API Key
        api_key = ApiGatewayApiKey(
            self,
            f"api-key-{self.resource_suffix}",
            name=f"fraud-detection-api-key-{self.resource_suffix}",
            description="API key for fraud detection system",
            enabled=True,
            tags=self.common_tags
        )

        # Usage Plan
        usage_plan = ApiGatewayUsagePlan(
            self,
            f"usage-plan-{self.resource_suffix}",
            name=f"fraud-detection-usage-plan-{self.resource_suffix}",
            description="Usage plan with 1000 requests per day",
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
            tags=self.common_tags
        )

        # Link API Key to Usage Plan
        ApiGatewayUsagePlanKey(
            self,
            f"usage-plan-key-{self.resource_suffix}",
            key_id=api_key.id,
            key_type="API_KEY",
            usage_plan_id=usage_plan.id
        )

        return api
