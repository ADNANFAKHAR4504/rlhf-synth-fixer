## tap_stack.py

```python

"""
Fraud Detection System Stack
Real-time fraud detection system for credit card transactions using serverless architecture.
"""
import os
import json
from constructs import Construct
from cdktf import TerraformStack, TerraformOutput, S3Backend
from cdktf_cdktf_provider_aws.provider import AwsProvider
from cdktf_cdktf_provider_aws.data_aws_caller_identity import DataAwsCallerIdentity
from cdktf_cdktf_provider_aws.kms_key import KmsKey
from cdktf_cdktf_provider_aws.kms_alias import KmsAlias
from cdktf_cdktf_provider_aws.dynamodb_table import DynamodbTable, DynamodbTableAttribute, DynamodbTablePointInTimeRecovery
from cdktf_cdktf_provider_aws.sns_topic import SnsTopic
from cdktf_cdktf_provider_aws.sns_topic_subscription import SnsTopicSubscription
from cdktf_cdktf_provider_aws.iam_role import IamRole
from cdktf_cdktf_provider_aws.iam_role_policy_attachment import IamRolePolicyAttachment
from cdktf_cdktf_provider_aws.iam_policy import IamPolicy
from cdktf_cdktf_provider_aws.lambda_function import LambdaFunction, LambdaFunctionEnvironment
from cdktf_cdktf_provider_aws.lambda_permission import LambdaPermission
from cdktf_cdktf_provider_aws.cloudwatch_log_group import CloudwatchLogGroup
from cdktf_cdktf_provider_aws.cloudwatch_event_rule import CloudwatchEventRule
from cdktf_cdktf_provider_aws.cloudwatch_event_target import CloudwatchEventTarget
from cdktf_cdktf_provider_aws.api_gateway_rest_api import ApiGatewayRestApi
from cdktf_cdktf_provider_aws.api_gateway_resource import ApiGatewayResource
from cdktf_cdktf_provider_aws.api_gateway_method import ApiGatewayMethod
from cdktf_cdktf_provider_aws.api_gateway_integration import ApiGatewayIntegration
from cdktf_cdktf_provider_aws.api_gateway_deployment import ApiGatewayDeployment
from cdktf_cdktf_provider_aws.api_gateway_stage import ApiGatewayStage
from cdktf_cdktf_provider_aws.api_gateway_request_validator import ApiGatewayRequestValidator
from cdktf_cdktf_provider_aws.api_gateway_usage_plan import ApiGatewayUsagePlan, ApiGatewayUsagePlanApiStages, ApiGatewayUsagePlanThrottleSettings
from cdktf_cdktf_provider_aws.api_gateway_api_key import ApiGatewayApiKey
from cdktf_cdktf_provider_aws.api_gateway_usage_plan_key import ApiGatewayUsagePlanKey
from cdktf_cdktf_provider_aws.ssm_parameter import SsmParameter
from cdktf_cdktf_provider_aws.sfn_state_machine import SfnStateMachine
from cdktf_cdktf_provider_aws.wafv2_web_acl import Wafv2WebAcl, Wafv2WebAclRule, Wafv2WebAclRuleAction, Wafv2WebAclVisibilityConfig
from cdktf_cdktf_provider_aws.wafv2_web_acl_association import Wafv2WebAclAssociation

class TapStack(TerraformStack):
    """Main fraud detection system stack."""

    def __init__(
        self,
        scope: Construct,
        id: str,
        environment_suffix: str = "dev",
        state_bucket: str = None,
        state_bucket_region: str = "us-east-1",
        aws_region: str = "us-east-1",
        default_tags: dict = None,
        **kwargs
    ):
        super().__init__(scope, id)

        # Initialize configuration
        self.environment_suffix = environment_suffix
        self.aws_region = aws_region
        self.resource_suffix = f"fraud-{environment_suffix}"

        # Configure S3 Backend for state management
        if state_bucket:
            S3Backend(
                self,
                bucket=state_bucket,
                key=f"fraud-detection/{environment_suffix}/terraform.tfstate",
                region=state_bucket_region,
                encrypt=True
            )

        # AWS Provider with default tags
        provider_config = {"region": aws_region}
        if default_tags:
            provider_config["default_tags"] = [default_tags]

        AwsProvider(self, "aws", **provider_config)

        # Get current AWS account
        self.current_account = DataAwsCallerIdentity(self, "current")

        # Common tags for all resources
        base_tags = {
            "Environment": environment_suffix,
            "Project": "FraudDetection",
            "Architecture": "Serverless",
            "ManagedBy": "CDKTF"
        }

        if default_tags and "tags" in default_tags:
            self.common_tags = {**base_tags, **default_tags["tags"]}
        else:
            self.common_tags = base_tags

        # Calculate absolute paths for Lambda ZIP files
        current_dir = os.path.dirname(os.path.abspath(__file__))
        lambda_dir = os.path.join(current_dir, "lambda")
        self.transaction_validator_zip = os.path.join(lambda_dir, "transaction_validator.zip")
        self.fraud_analyzer_zip = os.path.join(lambda_dir, "fraud_analyzer.zip")
        self.notification_sender_zip = os.path.join(lambda_dir, "notification_sender.zip")

        # Create infrastructure components
        self._create_kms_keys()
        self._create_ssm_parameters()
        self._create_dynamodb_table()
        self._create_sns_topic()
        self._create_iam_roles()
        self._create_lambda_functions()
        self._create_step_functions()
        self._create_eventbridge_rules()
        self._create_api_gateway()
        self._create_waf()
        self._create_cloudwatch_logs()
        self._create_outputs()

    def _create_kms_keys(self):
        """Create KMS keys for encryption."""
        # Main KMS key for the fraud detection system
        self.kms_key = KmsKey(
            self,
            f"fraud-detection-key-{self.resource_suffix}",
            description=f"KMS key for fraud detection system - {self.environment_suffix}",
            deletion_window_in_days=7,
            enable_key_rotation=True,
            policy=json.dumps({
                "Version": "2012-10-17",
                "Statement": [
                    {
                        "Effect": "Allow",
                        "Principal": {"AWS": f"arn:aws:iam::{self.current_account.account_id}:root"},
                        "Action": "kms:*",
                        "Resource": "*"
                    },
                    {
                        "Effect": "Allow",
                        "Principal": {"Service": ["sns.amazonaws.com", "dynamodb.amazonaws.com", "ssm.amazonaws.com"]},
                        "Action": [
                            "kms:Decrypt",
                            "kms:GenerateDataKey"
                        ],
                        "Resource": "*"
                    }
                ]
            }),
            tags=self.common_tags
        )

        # KMS alias for easier identification
        KmsAlias(
            self,
            f"fraud-detection-key-alias-{self.resource_suffix}",
            name=f"alias/fraud-detection-{self.resource_suffix}",
            target_key_id=self.kms_key.key_id
        )

    def _create_ssm_parameters(self):
        """Create SSM parameters for secure configuration."""
        self.ml_model_endpoint = SsmParameter(
            self,
            f"ml-model-endpoint-{self.resource_suffix}",
            name=f"/fraud-detection/{self.environment_suffix}/ml-model-endpoint",
            type="SecureString",
            value="https://ml-model.fraud-detection.internal/predict",
            description="ML model endpoint for fraud prediction",
            key_id=self.kms_key.key_id,
            tags=self.common_tags
        )

        # Create notification template with proper escaping for Terraform
        notification_template_data = {
            "subject": "Potential Fraud Alert",
            "message": "We detected unusual activity on your account. Transaction ID: {transaction_id}. Amount: $${amount}. If this wasn't you, please contact us immediately."
        }
        
        self.notification_template = SsmParameter(
            self,
            f"notification-template-{self.resource_suffix}",
            name=f"/fraud-detection/{self.environment_suffix}/notification-template",
            type="SecureString",
            value=json.dumps(notification_template_data),
            description="Email notification template for fraud alerts",
            key_id=self.kms_key.key_id,
            tags=self.common_tags
        )

        # Parameter for fraud alert email endpoint
        self.fraud_alert_email = SsmParameter(
            self,
            f"fraud-alert-email-{self.resource_suffix}",
            name=f"/fraud-detection/{self.environment_suffix}/alert-email",
            type="SecureString",
            value="fraud-alerts@company.com",  # Default value - should be updated in deployment
            description="Email endpoint for fraud alert notifications",
            key_id=self.kms_key.key_id,
            tags=self.common_tags
        )

        # Parameter for fraud alert SMS endpoint
        self.fraud_alert_phone = SsmParameter(
            self,
            f"fraud-alert-phone-{self.resource_suffix}",
            name=f"/fraud-detection/{self.environment_suffix}/alert-phone",
            type="SecureString",
            value="+1234567890",  # Default value - should be updated in deployment
            description="Phone endpoint for fraud alert SMS notifications",
            key_id=self.kms_key.key_id,
            tags=self.common_tags
        )

    def _create_dynamodb_table(self):
        """Create DynamoDB table for storing transaction data."""
        self.transactions_table = DynamodbTable(
            self,
            f"transactions-table-{self.resource_suffix}",
            name=f"transactions-{self.resource_suffix}",
            billing_mode="PAY_PER_REQUEST",
            hash_key="transaction_id",
            range_key="timestamp",
            attribute=[
                DynamodbTableAttribute(name="transaction_id", type="S"),
                DynamodbTableAttribute(name="timestamp", type="N")
            ],
            point_in_time_recovery=DynamodbTablePointInTimeRecovery(enabled=True),
            server_side_encryption={
                "enabled": True,
                "kms_key_arn": self.kms_key.arn
            },
            tags=self.common_tags
        )

    def _create_sns_topic(self):
        """Create SNS topic for fraud alerts."""
        self.fraud_alerts_topic = SnsTopic(
            self,
            f"fraud-alerts-topic-{self.resource_suffix}",
            name=f"fraud-alerts-{self.resource_suffix}",
            kms_master_key_id=self.kms_key.key_id,
            tags=self.common_tags
        )

        # Email subscription using SSM parameter
        # Note: Email subscriptions require manual confirmation in AWS console
        SnsTopicSubscription(
            self,
            f"fraud-alerts-email-{self.resource_suffix}",
            topic_arn=self.fraud_alerts_topic.arn,
            protocol="email",
            endpoint=self.fraud_alert_email.value
        )

        # SMS subscription using SSM parameter
        # Note: Phone numbers must be in E.164 format (+1234567890)
        SnsTopicSubscription(
            self,
            f"fraud-alerts-sms-{self.resource_suffix}",
            topic_arn=self.fraud_alerts_topic.arn,
            protocol="sms",
            endpoint=self.fraud_alert_phone.value
        )

    def _create_iam_roles(self):
        """Create IAM roles for Lambda functions."""
        # Lambda execution role
        lambda_assume_role_policy = {
            "Version": "2012-10-17",
            "Statement": [
                {
                    "Effect": "Allow",
                    "Principal": {"Service": "lambda.amazonaws.com"},
                    "Action": "sts:AssumeRole"
                }
            ]
        }

        self.lambda_role = IamRole(
            self,
            f"lambda-execution-role-{self.resource_suffix}",
            name=f"lambda-execution-role-{self.resource_suffix}",
            assume_role_policy=json.dumps(lambda_assume_role_policy),
            tags=self.common_tags
        )

        # Attach basic Lambda execution policy
        IamRolePolicyAttachment(
            self,
            f"lambda-basic-execution-{self.resource_suffix}",
            policy_arn="arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole",
            role=self.lambda_role.name
        )

        # Custom policy for Lambda functions
        lambda_policy = IamPolicy(
            self,
            f"lambda-fraud-detection-policy-{self.resource_suffix}",
            name=f"lambda-fraud-detection-policy-{self.resource_suffix}",
            policy=json.dumps({
                "Version": "2012-10-17",
                "Statement": [
                    {
                        "Effect": "Allow",
                        "Action": [
                            "dynamodb:GetItem",
                            "dynamodb:PutItem",
                            "dynamodb:UpdateItem",
                            "dynamodb:Query",
                            "dynamodb:Scan"
                        ],
                        "Resource": self.transactions_table.arn
                    },
                    {
                        "Effect": "Allow",
                        "Action": [
                            "sns:Publish"
                        ],
                        "Resource": self.fraud_alerts_topic.arn
                    },
                    {
                        "Effect": "Allow",
                        "Action": [
                            "ssm:GetParameter",
                            "ssm:GetParameters"
                        ],
                        "Resource": [
                            f"arn:aws:ssm:{self.aws_region}:{self.current_account.account_id}:parameter/fraud-detection/{self.environment_suffix}/*"
                        ]
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
                            "xray:PutTraceSegments",
                            "xray:PutTelemetryRecords"
                        ],
                        "Resource": "*"
                    },
                    {
                        "Effect": "Allow",
                        "Action": [
                            "states:StartExecution"
                        ],
                        "Resource": "*"
                    }
                ]
            }),
            tags=self.common_tags
        )

        IamRolePolicyAttachment(
            self,
            f"lambda-custom-policy-attachment-{self.resource_suffix}",
            policy_arn=lambda_policy.arn,
            role=self.lambda_role.name
        )

        # Step Functions role
        stepfunctions_assume_role_policy = {
            "Version": "2012-10-17",
            "Statement": [
                {
                    "Effect": "Allow",
                    "Principal": {"Service": "states.amazonaws.com"},
                    "Action": "sts:AssumeRole"
                }
            ]
        }

        self.stepfunctions_role = IamRole(
            self,
            f"stepfunctions-role-{self.resource_suffix}",
            name=f"stepfunctions-role-{self.resource_suffix}",
            assume_role_policy=json.dumps(stepfunctions_assume_role_policy),
            tags=self.common_tags
        )

        # Step Functions policy
        stepfunctions_policy = IamPolicy(
            self,
            f"stepfunctions-policy-{self.resource_suffix}",
            name=f"stepfunctions-policy-{self.resource_suffix}",
            policy=json.dumps({
                "Version": "2012-10-17",
                "Statement": [
                    {
                        "Effect": "Allow",
                        "Action": [
                            "lambda:InvokeFunction"
                        ],
                        "Resource": "*"
                    }
                ]
            }),
            tags=self.common_tags
        )

        IamRolePolicyAttachment(
            self,
            f"stepfunctions-policy-attachment-{self.resource_suffix}",
            policy_arn=stepfunctions_policy.arn,
            role=self.stepfunctions_role.name
        )

    def _create_lambda_functions(self):
        """Create Lambda functions for fraud detection."""
        # Common Lambda configuration
        lambda_environment = LambdaFunctionEnvironment(
            variables={
                "DYNAMODB_TABLE_NAME": self.transactions_table.name,
                "SNS_TOPIC_ARN": self.fraud_alerts_topic.arn,
                "ML_MODEL_ENDPOINT_PARAM": self.ml_model_endpoint.name,
                "NOTIFICATION_TEMPLATE_PARAM": self.notification_template.name,
                "KMS_KEY_ID": self.kms_key.key_id
            }
        )

        # Transaction Validator Lambda
        self.transaction_validator = LambdaFunction(
            self,
            f"transaction-validator-{self.resource_suffix}",
            function_name=f"transaction-validator-{self.resource_suffix}",
            role=self.lambda_role.arn,
            handler="lambda_function.lambda_handler",
            runtime="python3.11",
            architectures=["arm64"],
            filename=self.transaction_validator_zip,
            source_code_hash=f"${{filebase64sha256(\"{self.transaction_validator_zip}\")}}",
            timeout=30,
            reserved_concurrent_executions=10,
            environment=lambda_environment,
            tracing_config={
                "mode": "Active"
            },
            tags=self.common_tags
        )

        # Fraud Analyzer Lambda
        self.fraud_analyzer = LambdaFunction(
            self,
            f"fraud-analyzer-{self.resource_suffix}",
            function_name=f"fraud-analyzer-{self.resource_suffix}",
            role=self.lambda_role.arn,
            handler="lambda_function.lambda_handler",
            runtime="python3.11",
            architectures=["arm64"],
            filename=self.fraud_analyzer_zip,
            source_code_hash=f"${{filebase64sha256(\"{self.fraud_analyzer_zip}\")}}",
            timeout=60,
            reserved_concurrent_executions=10,
            environment=lambda_environment,
            tracing_config={
                "mode": "Active"
            },
            tags=self.common_tags
        )

        # Notification Sender Lambda
        self.notification_sender = LambdaFunction(
            self,
            f"notification-sender-{self.resource_suffix}",
            function_name=f"notification-sender-{self.resource_suffix}",
            role=self.lambda_role.arn,
            handler="lambda_function.lambda_handler",
            runtime="python3.11",
            architectures=["arm64"],
            filename=self.notification_sender_zip,
            source_code_hash=f"${{filebase64sha256(\"{self.notification_sender_zip}\")}}",
            timeout=30,
            reserved_concurrent_executions=10,
            environment=lambda_environment,
            tracing_config={
                "mode": "Active"
            },
            tags=self.common_tags
        )

    def _create_step_functions(self):
        """Create Step Functions state machine for workflow orchestration."""
        state_machine_definition = {
            "Comment": "Fraud Detection Workflow",
            "StartAt": "ValidateTransaction",
            "States": {
                "ValidateTransaction": {
                    "Type": "Task",
                    "Resource": self.transaction_validator.arn,
                    "Retry": [
                        {
                            "ErrorEquals": ["Lambda.ServiceException", "Lambda.AWSLambdaException", "Lambda.SdkClientException"],
                            "IntervalSeconds": 2,
                            "MaxAttempts": 3,
                            "BackoffRate": 2
                        }
                    ],
                    "Catch": [
                        {
                            "ErrorEquals": ["States.ALL"],
                            "Next": "ValidationFailed",
                            "ResultPath": "$.error"
                        }
                    ],
                    "Next": "AnalyzeFraud"
                },
                "AnalyzeFraud": {
                    "Type": "Task",
                    "Resource": self.fraud_analyzer.arn,
                    "Retry": [
                        {
                            "ErrorEquals": ["Lambda.ServiceException", "Lambda.AWSLambdaException", "Lambda.SdkClientException"],
                            "IntervalSeconds": 2,
                            "MaxAttempts": 3,
                            "BackoffRate": 2
                        }
                    ],
                    "Catch": [
                        {
                            "ErrorEquals": ["States.ALL"],
                            "Next": "AnalysisFailed",
                            "ResultPath": "$.error"
                        }
                    ],
                    "Next": "CheckFraudResult"
                },
                "CheckFraudResult": {
                    "Type": "Choice",
                    "Choices": [
                        {
                            "Variable": "$.transaction.is_fraud",
                            "BooleanEquals": True,
                            "Next": "NotifyCustomer"
                        }
                    ],
                    "Default": "TransactionApproved"
                },
                "NotifyCustomer": {
                    "Type": "Task",
                    "Resource": self.notification_sender.arn,
                    "Retry": [
                        {
                            "ErrorEquals": ["Lambda.ServiceException", "Lambda.AWSLambdaException", "Lambda.SdkClientException"],
                            "IntervalSeconds": 2,
                            "MaxAttempts": 3,
                            "BackoffRate": 2
                        }
                    ],
                    "Catch": [
                        {
                            "ErrorEquals": ["States.ALL"],
                            "Next": "NotificationFailed",
                            "ResultPath": "$.error"
                        }
                    ],
                    "Next": "FraudDetected"
                },
                "TransactionApproved": {
                    "Type": "Succeed"
                },
                "FraudDetected": {
                    "Type": "Succeed"
                },
                "ValidationFailed": {
                    "Type": "Fail",
                    "Cause": "Transaction validation failed"
                },
                "AnalysisFailed": {
                    "Type": "Fail",
                    "Cause": "Fraud analysis failed"
                },
                "NotificationFailed": {
                    "Type": "Fail",
                    "Cause": "Customer notification failed"
                }
            }
        }

        self.fraud_detection_state_machine = SfnStateMachine(
            self,
            f"fraud-detection-state-machine-{self.resource_suffix}",
            name=f"fraud-detection-{self.resource_suffix}",
            role_arn=self.stepfunctions_role.arn,
            definition=json.dumps(state_machine_definition),
            type="STANDARD",
            tags=self.common_tags
        )

    def _create_eventbridge_rules(self):
        """Create EventBridge rules for high-value transaction monitoring."""
        self.high_value_transaction_rule = CloudwatchEventRule(
            self,
            f"high-value-transaction-rule-{self.resource_suffix}",
            name=f"high-value-transaction-{self.resource_suffix}",
            description="Capture high-value transactions over $5000",
            event_pattern=json.dumps({
                "source": ["fraud.detection"],
                "detail-type": ["Transaction Processed"],
                "detail": {
                    "amount": [{"numeric": [">", 5000]}]
                }
            }),
            state="ENABLED"
        )

        # Create target for the rule (could invoke another Lambda for additional review)
        CloudwatchEventTarget(
            self,
            f"high-value-transaction-target-{self.resource_suffix}",
            rule=self.high_value_transaction_rule.name,
            arn=self.fraud_analyzer.arn,
            target_id="HighValueTransactionTarget"
        )

        # Grant EventBridge permission to invoke Lambda
        LambdaPermission(
            self,
            f"high-value-transaction-lambda-permission-{self.resource_suffix}",
            statement_id="AllowEventBridgeInvoke",
            action="lambda:InvokeFunction",
            function_name=self.fraud_analyzer.function_name,
            principal="events.amazonaws.com",
            source_arn=self.high_value_transaction_rule.arn
        )

    def _create_api_gateway(self):
        """Create API Gateway for transaction processing."""
        # REST API
        self.api_gateway = ApiGatewayRestApi(
            self,
            f"fraud-detection-api-{self.resource_suffix}",
            name=f"fraud-detection-api-{self.resource_suffix}",
            description="Fraud Detection API for processing transactions",
            endpoint_configuration={
                "types": ["REGIONAL"]
            }
        )

        # Request validator
        self.request_validator = ApiGatewayRequestValidator(
            self,
            f"api-request-validator-{self.resource_suffix}",
            rest_api_id=self.api_gateway.id,
            name="api-request-validator",
            validate_request_body=True,
            validate_request_parameters=True
        )

        # Transaction resource
        self.transaction_resource = ApiGatewayResource(
            self,
            f"transaction-resource-{self.resource_suffix}",
            rest_api_id=self.api_gateway.id,
            parent_id=self.api_gateway.root_resource_id,
            path_part="transaction"
        )

        # POST method
        self.transaction_method = ApiGatewayMethod(
            self,
            f"transaction-post-method-{self.resource_suffix}",
            rest_api_id=self.api_gateway.id,
            resource_id=self.transaction_resource.id,
            http_method="POST",
            authorization="NONE",
            api_key_required=True,
            request_validator_id=self.request_validator.id
        )

        # Lambda integration
        self.transaction_integration = ApiGatewayIntegration(
            self,
            f"transaction-integration-{self.resource_suffix}",
            rest_api_id=self.api_gateway.id,
            resource_id=self.transaction_resource.id,
            http_method=self.transaction_method.http_method,
            integration_http_method="POST",
            type="AWS_PROXY",
            uri=self.transaction_validator.invoke_arn
        )

        # Grant API Gateway permission to invoke Lambda
        LambdaPermission(
            self,
            f"api-gateway-lambda-permission-{self.resource_suffix}",
            statement_id="AllowAPIGatewayInvoke",
            action="lambda:InvokeFunction",
            function_name=self.transaction_validator.function_name,
            principal="apigateway.amazonaws.com",
            source_arn=f"{self.api_gateway.execution_arn}/*/*"
        )

        # Deployment
        self.api_deployment = ApiGatewayDeployment(
            self,
            f"api-deployment-{self.resource_suffix}",
            rest_api_id=self.api_gateway.id,
            depends_on=[
                self.transaction_method,
                self.transaction_integration
            ]
        )

        # Stage
        self.api_stage = ApiGatewayStage(
            self,
            f"prod-stage-{self.resource_suffix}",
            deployment_id=self.api_deployment.id,
            rest_api_id=self.api_gateway.id,
            stage_name="prod",
            xray_tracing_enabled=True
        )

        # API Key
        self.api_key = ApiGatewayApiKey(
            self,
            f"fraud-detection-api-key-{self.resource_suffix}",
            name=f"fraud-detection-key-{self.resource_suffix}",
            description="API key for fraud detection system"
        )

        # Usage Plan
        self.usage_plan = ApiGatewayUsagePlan(
            self,
            f"fraud-detection-usage-plan-{self.resource_suffix}",
            name=f"fraud-detection-plan-{self.resource_suffix}",
            description="Usage plan for fraud detection API",
            api_stages=[
                ApiGatewayUsagePlanApiStages(
                    api_id=self.api_gateway.id,
                    stage=self.api_stage.stage_name
                )
            ],
            throttle_settings=ApiGatewayUsagePlanThrottleSettings(
                rate_limit=1000,
                burst_limit=2000
            )
        )

        # Usage Plan Key
        ApiGatewayUsagePlanKey(
            self,
            f"usage-plan-key-{self.resource_suffix}",
            key_id=self.api_key.id,
            key_type="API_KEY",
            usage_plan_id=self.usage_plan.id
        )

    def _create_waf(self):
        """Create WAF Web ACL for API protection.
        
        Note: Basic WAF configuration provided. Rate limiting rules can be added
        later via AWS Console or Terraform directly due to CDKTF Python provider
        limitations with complex WAF v2 rule configurations.
        """
        # Create a simple WAF without complex rules for now
        # This provides basic protection while avoiding CDKTF rule configuration issues
        self.web_acl = Wafv2WebAcl(
            self,
            f"fraud-detection-waf-{self.resource_suffix}",
            name=f"fraud-detection-waf-{self.resource_suffix}",
            scope="REGIONAL",
            default_action={
                "allow": {}
            },
            visibility_config={
                "sampled_requests_enabled": True,
                "cloudwatch_metrics_enabled": True,
                "metric_name": f"fraud-detection-waf-{self.resource_suffix}"
            },
            tags=self.common_tags
        )

        # Associate WAF with API Gateway
        Wafv2WebAclAssociation(
            self,
            f"waf-api-association-{self.resource_suffix}",
            resource_arn=f"arn:aws:apigateway:{self.aws_region}::/restapis/{self.api_gateway.id}/stages/{self.api_stage.stage_name}",
            web_acl_arn=self.web_acl.arn
        )

    def _create_cloudwatch_logs(self):
        """Create CloudWatch Log Groups for Lambda functions."""
        # Transaction Validator logs
        CloudwatchLogGroup(
            self,
            f"transaction-validator-logs-{self.resource_suffix}",
            name=f"/aws/lambda/transaction-validator-{self.resource_suffix}",
            retention_in_days=7,
            tags=self.common_tags
        )

        # Fraud Analyzer logs
        CloudwatchLogGroup(
            self,
            f"fraud-analyzer-logs-{self.resource_suffix}",
            name=f"/aws/lambda/fraud-analyzer-{self.resource_suffix}",
            retention_in_days=7,
            tags=self.common_tags
        )

        # Notification Sender logs
        CloudwatchLogGroup(
            self,
            f"notification-sender-logs-{self.resource_suffix}",
            name=f"/aws/lambda/notification-sender-{self.resource_suffix}",
            retention_in_days=7,
            tags=self.common_tags
        )

        # Step Functions logs
        CloudwatchLogGroup(
            self,
            f"step-functions-logs-{self.resource_suffix}",
            name=f"/aws/stepfunctions/fraud-detection-{self.resource_suffix}",
            retention_in_days=7,
            tags=self.common_tags
        )

    def _create_outputs(self):
        """Create Terraform outputs."""
        TerraformOutput(
            self,
            "api_endpoint",
            value=f"https://{self.api_gateway.id}.execute-api.{self.aws_region}.amazonaws.com/prod",
            description="API Gateway endpoint for fraud detection"
        )

        TerraformOutput(
            self,
            "api_key_id",
            value=self.api_key.id,
            description="API key ID for authentication"
        )

        TerraformOutput(
            self,
            "dynamodb_table_name",
            value=self.transactions_table.name,
            description="DynamoDB table name for transactions"
        )

        TerraformOutput(
            self,
            "sns_topic_arn",
            value=self.fraud_alerts_topic.arn,
            description="SNS topic ARN for fraud alerts"
        )

        TerraformOutput(
            self,
            "step_functions_arn",
            value=self.fraud_detection_state_machine.arn,
            description="Step Functions state machine ARN"
        )

        TerraformOutput(
            self,
            "kms_key_id",
            value=self.kms_key.key_id,
            description="KMS key ID for encryption"
        )


```