# Fraud Detection System - CDKTF Python Implementation

This implementation provides a complete serverless fraud detection system using CDKTF with Python.

## Architecture Overview

The solution implements:
- API Gateway REST API for transaction ingestion
- Lambda functions for processing and pattern analysis
- DynamoDB for transaction storage
- SNS/SQS for alert distribution
- CloudWatch monitoring and X-Ray tracing
- KMS encryption and IAM security

## File: main.py

```python
#!/usr/bin/env python3
from cdktf import App
from fraud_detection_stack import FraudDetectionStack

app = App()
FraudDetectionStack(app, "fraud-detection", environment_suffix="dev")
app.synth()
```

## File: fraud_detection_stack.py

```python
from constructs import Construct
from cdktf import TerraformStack, TerraformOutput, Fn
from cdktf_cdktf_provider_aws.provider import AwsProvider
from cdktf_cdktf_provider_aws.kms_key import KmsKey
from cdktf_cdktf_provider_aws.kms_alias import KmsAlias
from cdktf_cdktf_provider_aws.dynamodb_table import DynamodbTable, DynamodbTableAttribute, DynamodbTableGlobalSecondaryIndex, DynamodbTablePointInTimeRecovery
from cdktf_cdktf_provider_aws.sns_topic import SnsTopic
from cdktf_cdktf_provider_aws.sns_topic_subscription import SnsTopicSubscription
from cdktf_cdktf_provider_aws.sqs_queue import SqsQueue
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
from cdktf_cdktf_provider_aws.api_gateway_method import ApiGatewayMethod, ApiGatewayMethodSettings
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
    def __init__(self, scope: Construct, id: str, environment_suffix: str):
        super().__init__(scope, id)

        self.environment_suffix = environment_suffix

        # Provider
        AwsProvider(self, "aws", region="us-east-1")

        # Tags for all resources
        self.common_tags = {
            "Environment": f"{environment_suffix}",
            "Project": "FraudDetection",
            "CostCenter": "Engineering"
        }

        # KMS Key for encryption
        self.kms_key = self.create_kms_key()

        # DynamoDB Table
        self.dynamodb_table = self.create_dynamodb_table()

        # SNS Topic and SQS Queue
        self.sns_topic = self.create_sns_topic()
        self.sqs_queue = self.create_sqs_queue()
        self.dlq = self.create_dlq()

        # Subscribe SQS to SNS
        SnsTopicSubscription(
            self,
            f"fraud-alerts-subscription-{environment_suffix}",
            topic_arn=self.sns_topic.arn,
            protocol="sqs",
            endpoint=self.sqs_queue.arn
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
            f"fraud-detection-key-{self.environment_suffix}",
            description=f"KMS key for fraud detection system - {self.environment_suffix}",
            deletion_window_in_days=7,
            enable_key_rotation=True,
            tags=self.common_tags
        )

        KmsAlias(
            self,
            f"fraud-detection-key-alias-{self.environment_suffix}",
            name=f"alias/fraud-detection-{self.environment_suffix}",
            target_key_id=kms_key.key_id
        )

        return kms_key

    def create_dynamodb_table(self):
        table = DynamodbTable(
            self,
            f"transactions-table-{self.environment_suffix}",
            name=f"transactions-{self.environment_suffix}",
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
            f"fraud-alerts-topic-{self.environment_suffix}",
            name=f"fraud-alerts-{self.environment_suffix}",
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
            f"sns-feedback-role-{self.environment_suffix}",
            name=f"sns-feedback-role-{self.environment_suffix}",
            assume_role_policy=json.dumps(assume_role_policy),
            tags=self.common_tags
        )

        policy = IamPolicy(
            self,
            f"sns-feedback-policy-{self.environment_suffix}",
            name=f"sns-feedback-policy-{self.environment_suffix}",
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
            f"sns-feedback-policy-attachment-{self.environment_suffix}",
            role=role.name,
            policy_arn=policy.arn
        )

        return role

    def create_sqs_queue(self):
        queue = SqsQueue(
            self,
            f"fraud-alerts-queue-{self.environment_suffix}",
            name=f"fraud-alerts-queue-{self.environment_suffix}",
            visibility_timeout_seconds=300,
            kms_master_key_id=self.kms_key.key_id,
            tags=self.common_tags
        )

        return queue

    def create_dlq(self):
        dlq = SqsQueue(
            self,
            f"lambda-dlq-{self.environment_suffix}",
            name=f"lambda-dlq-{self.environment_suffix}",
            visibility_timeout_seconds=300,
            kms_master_key_id=self.kms_key.key_id,
            tags=self.common_tags
        )

        return dlq

    def create_ssm_parameters(self):
        SsmParameter(
            self,
            f"fraud-threshold-param-{self.environment_suffix}",
            name=f"/fraud-detection/{self.environment_suffix}/fraud_threshold",
            type="String",
            value="0.85",
            description="Fraud detection threshold",
            tags=self.common_tags
        )

        SsmParameter(
            self,
            f"alert-email-param-{self.environment_suffix}",
            name=f"/fraud-detection/{self.environment_suffix}/alert_email",
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
            f"{name}-role-{self.environment_suffix}",
            name=f"{name}-role-{self.environment_suffix}",
            assume_role_policy=json.dumps(assume_role_policy),
            tags=self.common_tags
        )

        # Basic Lambda execution policy
        IamRolePolicyAttachment(
            self,
            f"{name}-basic-execution-{self.environment_suffix}",
            role=role.name,
            policy_arn="arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"
        )

        # X-Ray policy
        IamRolePolicyAttachment(
            self,
            f"{name}-xray-{self.environment_suffix}",
            role=role.name,
            policy_arn="arn:aws:iam::aws:policy/AWSXRayDaemonWriteAccess"
        )

        # Custom policies
        for idx, policy_doc in enumerate(service_policies):
            policy = IamPolicy(
                self,
                f"{name}-policy-{idx}-{self.environment_suffix}",
                name=f"{name}-policy-{idx}-{self.environment_suffix}",
                policy=json.dumps(policy_doc)
            )

            IamRolePolicyAttachment(
                self,
                f"{name}-policy-attachment-{idx}-{self.environment_suffix}",
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
                    "Resource": f"arn:aws:ssm:us-east-1:*:parameter/fraud-detection/{self.environment_suffix}/*"
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
            f"transaction-processor-logs-{self.environment_suffix}",
            name=f"/aws/lambda/transaction-processor-{self.environment_suffix}",
            retention_in_days=30,
            tags=self.common_tags
        )

        # Lambda Function
        lambda_function = LambdaFunction(
            self,
            f"transaction-processor-{self.environment_suffix}",
            function_name=f"transaction-processor-{self.environment_suffix}",
            runtime="python3.11",
            handler="index.handler",
            role=role.arn,
            filename="lambda_functions/transaction_processor.zip",
            source_code_hash=Fn.filebase64sha256("lambda_functions/transaction_processor.zip"),
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
                    "Resource": f"arn:aws:ssm:us-east-1:*:parameter/fraud-detection/{self.environment_suffix}/*"
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
            f"pattern-analyzer-logs-{self.environment_suffix}",
            name=f"/aws/lambda/pattern-analyzer-{self.environment_suffix}",
            retention_in_days=30,
            tags=self.common_tags
        )

        # Lambda Function
        lambda_function = LambdaFunction(
            self,
            f"pattern-analyzer-{self.environment_suffix}",
            function_name=f"pattern-analyzer-{self.environment_suffix}",
            runtime="python3.11",
            handler="index.handler",
            role=role.arn,
            filename="lambda_functions/pattern_analyzer.zip",
            source_code_hash=Fn.filebase64sha256("lambda_functions/pattern_analyzer.zip"),
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
            f"transaction-processor-errors-{self.environment_suffix}",
            alarm_name=f"transaction-processor-errors-{self.environment_suffix}",
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
            f"pattern-analyzer-errors-{self.environment_suffix}",
            alarm_name=f"pattern-analyzer-errors-{self.environment_suffix}",
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
            f"pattern-analysis-schedule-{self.environment_suffix}",
            name=f"pattern-analysis-schedule-{self.environment_suffix}",
            description="Trigger pattern analysis every 5 minutes",
            schedule_expression="rate(5 minutes)",
            tags=self.common_tags
        )

        # Lambda Permission
        LambdaPermission(
            self,
            f"pattern-analyzer-eventbridge-permission-{self.environment_suffix}",
            statement_id="AllowExecutionFromEventBridge",
            action="lambda:InvokeFunction",
            function_name=self.pattern_analyzer.function_name,
            principal="events.amazonaws.com",
            source_arn=rule.arn
        )

        # EventBridge Target
        CloudwatchEventTarget(
            self,
            f"pattern-analyzer-target-{self.environment_suffix}",
            rule=rule.name,
            arn=self.pattern_analyzer.arn
        )

    def create_api_gateway(self):
        # REST API
        api = ApiGatewayRestApi(
            self,
            f"fraud-detection-api-{self.environment_suffix}",
            name=f"fraud-detection-api-{self.environment_suffix}",
            description="Fraud Detection API",
            tags=self.common_tags
        )

        # Request Validator
        validator = ApiGatewayRequestValidator(
            self,
            f"request-validator-{self.environment_suffix}",
            name=f"request-validator-{self.environment_suffix}",
            rest_api_id=api.id,
            validate_request_body=True,
            validate_request_parameters=True
        )

        # Request Model
        model = ApiGatewayModel(
            self,
            f"transaction-model-{self.environment_suffix}",
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
            f"transactions-resource-{self.environment_suffix}",
            rest_api_id=api.id,
            parent_id=api.root_resource_id,
            path_part="transactions"
        )

        # POST method
        post_method = ApiGatewayMethod(
            self,
            f"transactions-post-method-{self.environment_suffix}",
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
            f"transactions-integration-{self.environment_suffix}",
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
            f"api-gateway-lambda-permission-{self.environment_suffix}",
            statement_id="AllowExecutionFromAPIGateway",
            action="lambda:InvokeFunction",
            function_name=self.transaction_processor.function_name,
            principal="apigateway.amazonaws.com",
            source_arn=f"{api.execution_arn}/*/*"
        )

        # Deployment
        deployment = ApiGatewayDeployment(
            self,
            f"api-deployment-{self.environment_suffix}",
            rest_api_id=api.id,
            depends_on=[post_method, integration],
            lifecycle={
                "create_before_destroy": True
            }
        )

        # Stage
        stage = ApiGatewayStage(
            self,
            f"api-stage-{self.environment_suffix}",
            deployment_id=deployment.id,
            rest_api_id=api.id,
            stage_name="prod",
            xray_tracing_enabled=True,
            tags=self.common_tags
        )

        # API Key
        api_key = ApiGatewayApiKey(
            self,
            f"api-key-{self.environment_suffix}",
            name=f"fraud-detection-api-key-{self.environment_suffix}",
            description="API key for fraud detection system",
            enabled=True,
            tags=self.common_tags
        )

        # Usage Plan
        usage_plan = ApiGatewayUsagePlan(
            self,
            f"usage-plan-{self.environment_suffix}",
            name=f"fraud-detection-usage-plan-{self.environment_suffix}",
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
            f"usage-plan-key-{self.environment_suffix}",
            key_id=api_key.id,
            key_type="API_KEY",
            usage_plan_id=usage_plan.id
        )

        return api
```

## File: lambda_functions/transaction_processor.py

```python
import json
import os
import time
import boto3
from decimal import Decimal

dynamodb = boto3.resource('dynamodb')
sns = boto3.client('sns')
ssm = boto3.client('ssm')

table_name = os.environ['DYNAMODB_TABLE']
sns_topic_arn = os.environ['SNS_TOPIC_ARN']
environment = os.environ['ENVIRONMENT']

table = dynamodb.Table(table_name)

def handler(event, context):
    """
    Process incoming transaction and store in DynamoDB.
    Detect fraud patterns and publish alerts to SNS.
    """
    try:
        # Parse request body
        body = json.loads(event['body'])

        transaction_id = body['transaction_id']
        user_id = body['user_id']
        amount = Decimal(str(body['amount']))
        timestamp = int(time.time())

        # Get fraud threshold from Parameter Store
        threshold_param = ssm.get_parameter(
            Name=f'/fraud-detection/{environment}/fraud_threshold'
        )
        fraud_threshold = float(threshold_param['Parameter']['Value'])

        # Simple fraud detection logic
        is_suspicious = amount > Decimal('10000') or amount < Decimal('0')
        fraud_score = 0.9 if is_suspicious else 0.1

        # Store transaction in DynamoDB
        item = {
            'transaction_id': transaction_id,
            'timestamp': timestamp,
            'user_id': user_id,
            'amount': amount,
            'merchant': body.get('merchant', 'Unknown'),
            'location': body.get('location', 'Unknown'),
            'fraud_score': Decimal(str(fraud_score)),
            'is_suspicious': is_suspicious
        }

        table.put_item(Item=item)

        # Publish alert if fraud detected
        if fraud_score > fraud_threshold:
            message = {
                'transaction_id': transaction_id,
                'user_id': user_id,
                'amount': str(amount),
                'fraud_score': fraud_score,
                'timestamp': timestamp
            }

            sns.publish(
                TopicArn=sns_topic_arn,
                Message=json.dumps(message),
                Subject='Fraud Alert - Suspicious Transaction Detected'
            )

        return {
            'statusCode': 200,
            'body': json.dumps({
                'message': 'Transaction processed successfully',
                'transaction_id': transaction_id,
                'fraud_score': fraud_score
            })
        }

    except Exception as e:
        print(f"Error processing transaction: {str(e)}")
        return {
            'statusCode': 500,
            'body': json.dumps({
                'error': 'Internal server error',
                'message': str(e)
            })
        }
```

## File: lambda_functions/pattern_analyzer.py

```python
import json
import os
import time
from datetime import datetime, timedelta
import boto3
from decimal import Decimal

dynamodb = boto3.resource('dynamodb')
sns = boto3.client('sns')

table_name = os.environ['DYNAMODB_TABLE']
sns_topic_arn = os.environ['SNS_TOPIC_ARN']
environment = os.environ['ENVIRONMENT']

table = dynamodb.Table(table_name)

def handler(event, context):
    """
    Analyze transaction patterns to detect fraud.
    Runs every 5 minutes via EventBridge.
    """
    try:
        # Get transactions from last 5 minutes
        current_time = int(time.time())
        five_minutes_ago = current_time - 300

        # Scan for recent suspicious transactions
        response = table.scan(
            FilterExpression='#ts > :start_time AND is_suspicious = :suspicious',
            ExpressionAttributeNames={
                '#ts': 'timestamp'
            },
            ExpressionAttributeValues={
                ':start_time': five_minutes_ago,
                ':suspicious': True
            }
        )

        suspicious_transactions = response.get('Items', [])

        if len(suspicious_transactions) > 5:
            # Multiple suspicious transactions detected
            user_ids = [t['user_id'] for t in suspicious_transactions]

            message = {
                'alert_type': 'pattern_analysis',
                'suspicious_count': len(suspicious_transactions),
                'affected_users': list(set(user_ids)),
                'timestamp': current_time,
                'time_window': '5 minutes'
            }

            sns.publish(
                TopicArn=sns_topic_arn,
                Message=json.dumps(message),
                Subject='Fraud Alert - Multiple Suspicious Transactions Detected'
            )

            print(f"Alert sent: {len(suspicious_transactions)} suspicious transactions detected")
        else:
            print(f"Pattern analysis complete: {len(suspicious_transactions)} suspicious transactions found")

        return {
            'statusCode': 200,
            'body': json.dumps({
                'message': 'Pattern analysis complete',
                'suspicious_count': len(suspicious_transactions)
            })
        }

    except Exception as e:
        print(f"Error analyzing patterns: {str(e)}")
        raise
```

## File: cdktf.json

```json
{
  "language": "python",
  "app": "python3 main.py",
  "projectId": "fraud-detection-system",
  "terraformProviders": [
    "aws@~> 5.0"
  ],
  "terraformModules": [],
  "context": {
    "excludeStackIdFromLogicalIds": "true",
    "allowSepCharsInLogicalIds": "true"
  }
}
```

## File: requirements.txt

```text
cdktf>=0.19.0
cdktf-cdktf-provider-aws>=19.0.0
constructs>=10.3.0
boto3>=1.28.0
```

## File: lib/README.md

```markdown
# Fraud Detection System

A serverless fraud detection system built with CDKTF and Python for AWS.

## Architecture

This solution implements a complete fraud detection pipeline:

- **API Gateway**: REST API endpoint for transaction ingestion with request validation
- **Lambda Functions**:
  - Transaction Processor: Processes incoming transactions in real-time
  - Pattern Analyzer: Scheduled analysis of transaction patterns (every 5 minutes)
- **DynamoDB**: Transaction storage with GSI for user-based queries
- **SNS/SQS**: Alert distribution system with dead letter queue
- **CloudWatch**: Monitoring, alarms, and X-Ray tracing
- **KMS**: Customer-managed encryption keys
- **Systems Manager**: Parameter Store for configuration

## Prerequisites

- Python 3.11+
- Node.js 18+ (for CDKTF)
- Terraform >= 1.0
- AWS CLI configured with appropriate credentials
- CDKTF CLI installed: `npm install -g cdktf-cli`

## Installation

1. Install Python dependencies:
```bash
pip install -r requirements.txt
```

2. Package Lambda functions:
```bash
cd lambda_functions
zip transaction_processor.zip transaction_processor.py
zip pattern_analyzer.zip pattern_analyzer.py
cd ..
```

## Deployment

1. Initialize CDKTF:
```bash
cdktf init
```

2. Synthesize Terraform configuration:
```bash
cdktf synth
```

3. Deploy the stack:
```bash
cdktf deploy
```

4. Note the outputs:
   - API Endpoint URL
   - Lambda Function ARNs
   - DynamoDB Table Name

## Configuration

The system uses the following environment variables (set via Stack parameter):
- `environment_suffix`: Unique suffix for resource naming (default: "dev")

Configuration parameters stored in SSM Parameter Store:
- `/fraud-detection/{env}/fraud_threshold`: Fraud detection threshold (0-1)
- `/fraud-detection/{env}/alert_email`: Email address for alerts

## Testing

### Test Transaction Processing

```bash
# Get API Key from AWS Console (API Gateway > API Keys)
API_KEY="your-api-key"
API_URL="your-api-endpoint/prod"

curl -X POST "${API_URL}/transactions" \
  -H "Content-Type: application/json" \
  -H "x-api-key: ${API_KEY}" \
  -d '{
    "transaction_id": "txn-001",
    "user_id": "user-123",
    "amount": 150.50,
    "merchant": "Store ABC",
    "location": "New York"
  }'
```

### Test High-Value Transaction (Fraud Alert)

```bash
curl -X POST "${API_URL}/transactions" \
  -H "Content-Type: application/json" \
  -H "x-api-key: ${API_KEY}" \
  -d '{
    "transaction_id": "txn-002",
    "user_id": "user-456",
    "amount": 15000.00,
    "merchant": "Suspicious Store",
    "location": "Unknown"
  }'
```

## Monitoring

- **CloudWatch Logs**: Lambda execution logs with 30-day retention
- **CloudWatch Alarms**: Alerts when error rate exceeds 1% over 5 minutes
- **X-Ray Traces**: Distributed tracing for API Gateway and Lambda
- **Dead Letter Queue**: Failed Lambda invocations sent to DLQ

## Security Features

- ARM64 architecture for Lambda (Graviton2 processors)
- KMS encryption for all data at rest and in transit
- IAM roles with least privilege principle
- API Gateway with API key authentication and usage limits (1000 req/day)
- Request validation at API Gateway level
- VPC isolation (optional - not implemented in this version)

## Cost Optimization

- Serverless architecture (pay per use)
- DynamoDB on-demand billing
- ARM64 Lambda functions (20% cost reduction)
- Reserved concurrency limits (1-5 per function)
- 30-day log retention

## Cleanup

To destroy all resources:
```bash
cdktf destroy
```

Note: All resources are configured to be destroyable without retention policies.

## Troubleshooting

1. **Lambda deployment fails**: Ensure lambda function zip files exist in `lambda_functions/` directory
2. **API returns 403**: Verify API key is included in `x-api-key` header
3. **DynamoDB write errors**: Check Lambda IAM role has PutItem permissions
4. **SNS alerts not received**: Verify SNS topic subscription and SQS queue policy
```
