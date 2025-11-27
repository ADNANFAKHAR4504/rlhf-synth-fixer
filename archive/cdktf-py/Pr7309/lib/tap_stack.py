"""
Multi-region payment processing infrastructure using CDKTF
Deploys DynamoDB Global Tables, Lambda, Step Functions, API Gateway, S3, KMS, SNS, EventBridge, and CloudWatch
"""
import os
import json
import zipfile
from constructs import Construct
from cdktf import TerraformStack, S3Backend, TerraformOutput
from cdktf_cdktf_provider_aws.provider import AwsProvider
from cdktf_cdktf_provider_aws.data_aws_caller_identity import DataAwsCallerIdentity
from cdktf_cdktf_provider_aws.dynamodb_table import (
    DynamodbTable, DynamodbTableAttribute, DynamodbTableGlobalSecondaryIndex,
    DynamodbTableReplica, DynamodbTablePointInTimeRecovery
)
from cdktf_cdktf_provider_aws.lambda_function import LambdaFunction, LambdaFunctionEnvironment
from cdktf_cdktf_provider_aws.iam_role import IamRole
from cdktf_cdktf_provider_aws.iam_policy import IamPolicy
from cdktf_cdktf_provider_aws.iam_role_policy_attachment import IamRolePolicyAttachment
from cdktf_cdktf_provider_aws.kms_key import KmsKey
from cdktf_cdktf_provider_aws.kms_alias import KmsAlias
from cdktf_cdktf_provider_aws.sns_topic import SnsTopic
from cdktf_cdktf_provider_aws.s3_bucket import S3Bucket
from cdktf_cdktf_provider_aws.s3_bucket_versioning import S3BucketVersioningA
from cdktf_cdktf_provider_aws.sfn_state_machine import SfnStateMachine
from cdktf_cdktf_provider_aws.api_gateway_rest_api import ApiGatewayRestApi, ApiGatewayRestApiEndpointConfiguration
from cdktf_cdktf_provider_aws.api_gateway_resource import ApiGatewayResource
from cdktf_cdktf_provider_aws.api_gateway_method import ApiGatewayMethod
from cdktf_cdktf_provider_aws.api_gateway_integration import ApiGatewayIntegration
from cdktf_cdktf_provider_aws.api_gateway_deployment import ApiGatewayDeployment
from cdktf_cdktf_provider_aws.api_gateway_stage import ApiGatewayStage
from cdktf_cdktf_provider_aws.cloudwatch_event_rule import CloudwatchEventRule
from cdktf_cdktf_provider_aws.cloudwatch_event_target import CloudwatchEventTarget, CloudwatchEventTargetRetryPolicy
from cdktf_cdktf_provider_aws.cloudwatch_metric_alarm import CloudwatchMetricAlarm
from cdktf_cdktf_provider_aws.cloudwatch_dashboard import CloudwatchDashboard
from cdktf_cdktf_provider_aws.lambda_event_source_mapping import LambdaEventSourceMapping
from cdktf_cdktf_provider_aws.lambda_permission import LambdaPermission


class TapStack(TerraformStack):
    """
    Multi-region payment processing infrastructure
    """

    def __init__(self, scope: Construct, ns: str, **kwargs):
        super().__init__(scope, ns)

        # Extract parameters
        self.environment_suffix = kwargs.get("environment_suffix", "dev")
        state_bucket = kwargs.get("state_bucket", "default-state-bucket")
        state_bucket_region = kwargs.get("state_bucket_region", "us-east-1")
        self.aws_region = kwargs.get("aws_region", "us-east-1")
        self.regions = kwargs.get("regions", ["us-east-1", "eu-west-1", "ap-southeast-1"])
        default_tags = kwargs.get("default_tags", [{"tags": {}}])

        # Setup provider and backend
        AwsProvider(self, "aws", region=self.aws_region, default_tags=default_tags)

        S3Backend(
            self,
            bucket=state_bucket,
            key=f"tap-stack-{self.environment_suffix}.tfstate",
            region=state_bucket_region
        )

        # Create Lambda deployment package
        self._create_lambda_package()

        # Create regional resources
        self._create_kms_keys()
        self._create_dynamodb_table()
        self._create_iam_roles()
        self._create_lambda_functions()
        self._create_step_functions()
        self._create_sns_topics()
        self._create_s3_buckets()
        self._create_api_gateway()
        self._create_eventbridge_rules()
        self._create_cloudwatch_resources()

        # Create outputs
        self._create_outputs()

    def _create_lambda_package(self):
        """Create Lambda deployment package"""
        # Get absolute path to project root
        project_root = os.path.abspath(os.path.dirname(__file__) + "/..")
        lambda_dir = os.path.join(project_root, "lib", "lambda")
        os.makedirs(lambda_dir, exist_ok=True)

        # Create lambda handler
        handler_code = '''import json
import boto3
import os

dynamodb = boto3.resource('dynamodb')
table_name = os.environ.get('DYNAMODB_TABLE_NAME', '')

def handler(event, context):
    """Process payment transactions"""
    try:
        # Extract transaction details
        transaction_id = event.get('transaction_id', 'unknown')
        amount = event.get('amount', 0)
        currency = event.get('currency', 'USD')

        # Process transaction
        # AWS_REGION is automatically available in Lambda context
        region = os.environ.get('AWS_REGION', 'unknown')
        table = dynamodb.Table(table_name)
        table.put_item(
            Item={
                'transaction_id': transaction_id,
                'amount': amount,
                'currency': currency,
                'status': 'processed',
                'region': region
            }
        )

        return {
            'statusCode': 200,
            'body': json.dumps({
                'message': 'Transaction processed successfully',
                'transaction_id': transaction_id
            })
        }
    except Exception as e:
        return {
            'statusCode': 500,
            'body': json.dumps({
                'message': 'Transaction failed',
                'error': str(e)
            })
        }
'''

        # Write handler code
        handler_path = os.path.join(lambda_dir, "transaction_processor.py")
        with open(handler_path, 'w', encoding='utf-8') as f:
            f.write(handler_code)

        # Create zip file
        self.lambda_zip_path = os.path.join(lambda_dir, "lambda_function.zip")
        with zipfile.ZipFile(self.lambda_zip_path, 'w', zipfile.ZIP_DEFLATED) as zipf:
            zipf.write(handler_path, "transaction_processor.py")

    def _create_kms_keys(self):
        """Create KMS keys for encryption in primary region"""
        # Get current AWS account ID
        caller_identity = DataAwsCallerIdentity(self, "current")

        # Create KMS key for primary region with automatic rotation
        self.kms_key = KmsKey(
            self, f"payment-kms-{self.environment_suffix}",
            description=f"KMS key for payment processing - {self.environment_suffix}",
            enable_key_rotation=True,
            deletion_window_in_days=7,
            policy=json.dumps({
                "Version": "2012-10-17",
                "Statement": [
                    {
                        "Sid": "Enable IAM User Permissions",
                        "Effect": "Allow",
                        "Principal": {
                            "AWS": f"arn:aws:iam::{caller_identity.account_id}:root"
                        },
                        "Action": "kms:*",
                        "Resource": "*"
                    },
                    {
                        "Sid": "Allow services to use the key",
                        "Effect": "Allow",
                        "Principal": {"Service": [
                            "dynamodb.amazonaws.com",
                            "s3.amazonaws.com",
                            "lambda.amazonaws.com",
                            "sns.amazonaws.com"
                        ]},
                        "Action": [
                            "kms:Decrypt",
                            "kms:Encrypt",
                            "kms:GenerateDataKey"
                        ],
                        "Resource": "*"
                    }
                ]
            }),
            tags={
                "Environment": self.environment_suffix,
                "Region": self.aws_region,
                "CostCenter": "payment-processing"
            }
        )

        KmsAlias(
            self, f"payment-kms-alias-{self.environment_suffix}",
            name=f"alias/payment-{self.environment_suffix}",
            target_key_id=self.kms_key.id
        )

    def _create_dynamodb_table(self):
        """Create DynamoDB Global Table with replicas"""
        # Create replicas for other regions
        replicas = []
        for region in self.regions:
            if region != self.aws_region:
                replicas.append(DynamodbTableReplica(region_name=region))

        # Create DynamoDB table with on-demand billing
        self.dynamodb_table = DynamodbTable(
            self, f"payment-transactions-{self.environment_suffix}",
            name=f"payment-transactions-{self.environment_suffix}",
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
                    name="status-index",
                    hash_key="status",
                    range_key="timestamp",
                    projection_type="ALL"
                )
            ],
            stream_enabled=True,
            stream_view_type="NEW_AND_OLD_IMAGES",
            point_in_time_recovery=DynamodbTablePointInTimeRecovery(enabled=True),
            replica=replicas if replicas else None,
            tags={
                "Environment": self.environment_suffix,
                "Region": self.aws_region,
                "CostCenter": "payment-processing"
            }
        )

    def _create_iam_roles(self):
        """Create IAM roles with least privilege"""
        # Lambda execution role
        self.lambda_role = IamRole(
            self, f"lambda-role-{self.environment_suffix}",
            name=f"payment-lambda-role-{self.environment_suffix}",
            assume_role_policy=json.dumps({
                "Version": "2012-10-17",
                "Statement": [{
                    "Effect": "Allow",
                    "Principal": {"Service": "lambda.amazonaws.com"},
                    "Action": "sts:AssumeRole"
                }]
            }),
            tags={
                "Environment": self.environment_suffix,
                "CostCenter": "payment-processing"
            }
        )

        # Lambda policy for DynamoDB access
        lambda_policy = IamPolicy(
            self, f"lambda-policy-{self.environment_suffix}",
            name=f"payment-lambda-policy-{self.environment_suffix}",
            policy=json.dumps({
                "Version": "2012-10-17",
                "Statement": [
                    {
                        "Effect": "Allow",
                        "Action": [
                            "dynamodb:PutItem",
                            "dynamodb:GetItem",
                            "dynamodb:Query",
                            "dynamodb:Scan",
                            "dynamodb:UpdateItem"
                        ],
                        "Resource": [
                            self.dynamodb_table.arn,
                            f"{self.dynamodb_table.arn}/index/*"
                        ]
                    },
                    {
                        "Effect": "Allow",
                        "Action": [
                            "dynamodb:DescribeStream",
                            "dynamodb:GetRecords",
                            "dynamodb:GetShardIterator",
                            "dynamodb:ListStreams"
                        ],
                        "Resource": f"{self.dynamodb_table.arn}/stream/*"
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
                            "kms:Decrypt",
                            "kms:Encrypt",
                            "kms:GenerateDataKey"
                        ],
                        "Resource": self.kms_key.arn
                    }
                ]
            })
        )

        IamRolePolicyAttachment(
            self, f"lambda-policy-attachment-{self.environment_suffix}",
            role=self.lambda_role.name,
            policy_arn=lambda_policy.arn
        )

        # Step Functions execution role
        self.sfn_role = IamRole(
            self, f"sfn-role-{self.environment_suffix}",
            name=f"payment-sfn-role-{self.environment_suffix}",
            assume_role_policy=json.dumps({
                "Version": "2012-10-17",
                "Statement": [{
                    "Effect": "Allow",
                    "Principal": {"Service": "states.amazonaws.com"},
                    "Action": "sts:AssumeRole"
                }]
            }),
            tags={
                "Environment": self.environment_suffix,
                "CostCenter": "payment-processing"
            }
        )

        sfn_policy = IamPolicy(
            self, f"sfn-policy-{self.environment_suffix}",
            name=f"payment-sfn-policy-{self.environment_suffix}",
            policy=json.dumps({
                "Version": "2012-10-17",
                "Statement": [{
                    "Effect": "Allow",
                    "Action": [
                        "lambda:InvokeFunction"
                    ],
                    "Resource": (
                        f"arn:aws:lambda:{self.aws_region}:*:"
                        f"function:payment-processor-{self.environment_suffix}"
                    )
                }]
            })
        )

        IamRolePolicyAttachment(
            self, f"sfn-policy-attachment-{self.environment_suffix}",
            role=self.sfn_role.name,
            policy_arn=sfn_policy.arn
        )

    def _create_lambda_functions(self):
        """Create Lambda functions for transaction processing"""
        self.lambda_function = LambdaFunction(
            self, f"payment-processor-{self.environment_suffix}",
            function_name=f"payment-processor-{self.environment_suffix}",
            role=self.lambda_role.arn,
            handler="transaction_processor.handler",
            runtime="python3.12",
            filename=self.lambda_zip_path,
            memory_size=3072,  # 3GB as specified
            timeout=900,  # 15 minutes as specified
            reserved_concurrent_executions=2,  # Low value to avoid account limits
            environment=LambdaFunctionEnvironment(
                variables={
                    "DYNAMODB_TABLE_NAME": self.dynamodb_table.name,
                    "ENVIRONMENT_SUFFIX": self.environment_suffix
                }
            ),
            tags={
                "Environment": self.environment_suffix,
                "Region": self.aws_region,
                "CostCenter": "payment-processing"
            }
        )

        # Create event source mapping for DynamoDB streams
        LambdaEventSourceMapping(
            self, f"dynamodb-stream-mapping-{self.environment_suffix}",
            event_source_arn=self.dynamodb_table.stream_arn,
            function_name=self.lambda_function.function_name,
            starting_position="LATEST",
            maximum_batching_window_in_seconds=10,
            batch_size=100
        )

    def _create_step_functions(self):
        """Create Step Functions state machine for payment workflow"""
        state_machine_definition = {
            "Comment": "Payment processing workflow with error handling",
            "StartAt": "ValidatePayment",
            "States": {
                "ValidatePayment": {
                    "Type": "Task",
                    "Resource": "arn:aws:states:::lambda:invoke",
                    "Parameters": {
                        "FunctionName": self.lambda_function.arn,
                        "Payload": {
                            "action": "validate",
                            "transaction.$": "$.transaction"
                        }
                    },
                    "Catch": [{
                        "ErrorEquals": ["States.ALL"],
                        "Next": "HandleError",
                        "ResultPath": "$.error"
                    }],
                    "Next": "ProcessPayment"
                },
                "ProcessPayment": {
                    "Type": "Task",
                    "Resource": "arn:aws:states:::lambda:invoke",
                    "Parameters": {
                        "FunctionName": self.lambda_function.arn,
                        "Payload": {
                            "action": "process",
                            "transaction.$": "$.transaction"
                        }
                    },
                    "Catch": [{
                        "ErrorEquals": ["States.ALL"],
                        "Next": "HandleError",
                        "ResultPath": "$.error"
                    }],
                    "Next": "Success"
                },
                "Success": {
                    "Type": "Succeed"
                },
                "HandleError": {
                    "Type": "Fail",
                    "Error": "PaymentProcessingError",
                    "Cause": "Payment processing failed"
                }
            }
        }

        self.state_machine = SfnStateMachine(
            self, f"payment-workflow-{self.environment_suffix}",
            name=f"payment-workflow-{self.environment_suffix}",
            role_arn=self.sfn_role.arn,
            definition=json.dumps(state_machine_definition),
            tags={
                "Environment": self.environment_suffix,
                "Region": self.aws_region,
                "CostCenter": "payment-processing"
            }
        )

    def _create_sns_topics(self):
        """Create SNS topics for alerting"""
        self.sns_topic = SnsTopic(
            self, f"payment-alerts-{self.environment_suffix}",
            name=f"payment-alerts-{self.environment_suffix}",
            kms_master_key_id=self.kms_key.id,
            tags={
                "Environment": self.environment_suffix,
                "Region": self.aws_region,
                "CostCenter": "payment-processing"
            }
        )

    def _create_s3_buckets(self):
        """Create S3 buckets for payment receipts"""
        self.s3_bucket = S3Bucket(
            self, f"payment-receipts-{self.environment_suffix}",
            bucket=f"payment-receipts-{self.environment_suffix}-{self.aws_region}",
            tags={
                "Environment": self.environment_suffix,
                "Region": self.aws_region,
                "CostCenter": "payment-processing"
            }
        )

        # Enable versioning for replication
        S3BucketVersioningA(
            self, f"payment-receipts-versioning-{self.environment_suffix}",
            bucket=self.s3_bucket.id,
            versioning_configuration={"status": "Enabled"}
        )

    def _create_api_gateway(self):
        """Create API Gateway REST API"""
        self.api = ApiGatewayRestApi(
            self, f"payment-api-{self.environment_suffix}",
            name=f"payment-api-{self.environment_suffix}",
            description="Payment processing API",
            endpoint_configuration=ApiGatewayRestApiEndpointConfiguration(
                types=["REGIONAL"]
            ),
            tags={
                "Environment": self.environment_suffix,
                "Region": self.aws_region,
                "CostCenter": "payment-processing"
            }
        )

        # Create API resource
        resource = ApiGatewayResource(
            self, f"payment-resource-{self.environment_suffix}",
            rest_api_id=self.api.id,
            parent_id=self.api.root_resource_id,
            path_part="payments"
        )

        # Create POST method
        method = ApiGatewayMethod(
            self, f"payment-method-{self.environment_suffix}",
            rest_api_id=self.api.id,
            resource_id=resource.id,
            http_method="POST",
            authorization="NONE"
        )

        # Create Lambda integration
        integration = ApiGatewayIntegration(
            self, f"payment-integration-{self.environment_suffix}",
            rest_api_id=self.api.id,
            resource_id=resource.id,
            http_method=method.http_method,
            integration_http_method="POST",
            type="AWS_PROXY",
            uri=self.lambda_function.invoke_arn
        )

        # Grant API Gateway permission to invoke Lambda
        LambdaPermission(
            self, f"api-lambda-permission-{self.environment_suffix}",
            statement_id="AllowAPIGatewayInvoke",
            action="lambda:InvokeFunction",
            function_name=self.lambda_function.function_name,
            principal="apigateway.amazonaws.com",
            source_arn=f"{self.api.execution_arn}/*/*"
        )

        # Create deployment
        deployment = ApiGatewayDeployment(
            self, f"payment-deployment-{self.environment_suffix}",
            rest_api_id=self.api.id,
            depends_on=[method, integration]
        )

        # Create stage
        self.api_stage = ApiGatewayStage(
            self, f"payment-stage-{self.environment_suffix}",
            deployment_id=deployment.id,
            rest_api_id=self.api.id,
            stage_name="prod",
            tags={
                "Environment": self.environment_suffix,
                "Region": self.aws_region,
                "CostCenter": "payment-processing"
            }
        )

    def _create_eventbridge_rules(self):
        """Create EventBridge rules for cross-region event routing"""
        # Create EventBridge rule for payment events
        event_rule = CloudwatchEventRule(
            self, f"payment-event-rule-{self.environment_suffix}",
            name=f"payment-event-rule-{self.environment_suffix}",
            description="Route payment events for failover scenarios",
            event_pattern=json.dumps({
                "source": ["payment.processing"],
                "detail-type": ["Payment Transaction"],
                "detail": {
                    "status": ["failed", "requires_retry"]
                }
            }),
            tags={
                "Environment": self.environment_suffix,
                "Region": self.aws_region,
                "CostCenter": "payment-processing"
            }
        )

        # Add Lambda as target with retry policy
        CloudwatchEventTarget(
            self, f"payment-event-target-{self.environment_suffix}",
            rule=event_rule.name,
            arn=self.lambda_function.arn,
            retry_policy=CloudwatchEventTargetRetryPolicy(
                maximum_event_age_in_seconds=3600,
                maximum_retry_attempts=2
            )
        )

        # Grant EventBridge permission to invoke Lambda
        LambdaPermission(
            self, f"eventbridge-lambda-permission-{self.environment_suffix}",
            statement_id="AllowEventBridgeInvoke",
            action="lambda:InvokeFunction",
            function_name=self.lambda_function.function_name,
            principal="events.amazonaws.com",
            source_arn=event_rule.arn
        )

    def _create_cloudwatch_resources(self):
        """Create CloudWatch alarms and dashboards"""
        # Create alarm for transaction failures
        self.failure_alarm = CloudwatchMetricAlarm(
            self, f"payment-failure-alarm-{self.environment_suffix}",
            alarm_name=f"payment-failure-alarm-{self.environment_suffix}",
            comparison_operator="GreaterThanThreshold",
            evaluation_periods=1,
            metric_name="Errors",
            namespace="AWS/Lambda",
            period=300,
            statistic="Sum",
            threshold=1.0,  # 0.1% of 1000 transactions = 1 error
            alarm_description="Alert when payment transaction failures exceed 0.1% threshold",
            alarm_actions=[self.sns_topic.arn],
            dimensions={
                "FunctionName": self.lambda_function.function_name
            },
            tags={
                "Environment": self.environment_suffix,
                "Region": self.aws_region,
                "CostCenter": "payment-processing"
            }
        )

        # Create CloudWatch dashboard
        dashboard_body = {
            "widgets": [
                {
                    "type": "metric",
                    "properties": {
                        "metrics": [
                            ["AWS/Lambda", "Invocations", {"stat": "Sum", "label": "Total Invocations"}],
                            [".", "Errors", {"stat": "Sum", "label": "Errors"}],
                            [".", "Duration", {"stat": "Average", "label": "Avg Duration"}]
                        ],
                        "period": 300,
                        "stat": "Average",
                        "region": self.aws_region,
                        "title": "Lambda Metrics",
                        "yAxis": {"left": {"min": 0}}
                    }
                },
                {
                    "type": "metric",
                    "properties": {
                        "metrics": [
                            ["AWS/DynamoDB", "ConsumedReadCapacityUnits", {"stat": "Sum"}],
                            [".", "ConsumedWriteCapacityUnits", {"stat": "Sum"}]
                        ],
                        "period": 300,
                        "stat": "Sum",
                        "region": self.aws_region,
                        "title": "DynamoDB Capacity"
                    }
                },
                {
                    "type": "metric",
                    "properties": {
                        "metrics": [
                            ["AWS/ApiGateway", "Count", {"stat": "Sum", "label": "Total Requests"}],
                            [".", "4XXError", {"stat": "Sum", "label": "4XX Errors"}],
                            [".", "5XXError", {"stat": "Sum", "label": "5XX Errors"}]
                        ],
                        "period": 300,
                        "stat": "Sum",
                        "region": self.aws_region,
                        "title": "API Gateway Metrics"
                    }
                }
            ]
        }

        self.dashboard = CloudwatchDashboard(
            self, f"payment-dashboard-{self.environment_suffix}",
            dashboard_name=f"payment-dashboard-{self.environment_suffix}",
            dashboard_body=json.dumps(dashboard_body)
        )

    def _create_outputs(self):
        """Create Terraform outputs"""
        TerraformOutput(
            self, "dynamodb_table_name",
            value=self.dynamodb_table.name,
            description="DynamoDB table name for payment transactions"
        )

        TerraformOutput(
            self, "lambda_function_name",
            value=self.lambda_function.function_name,
            description="Lambda function name for payment processing"
        )

        TerraformOutput(
            self, "api_endpoint",
            value=f"https://{self.api.id}.execute-api.{self.aws_region}.amazonaws.com/{self.api_stage.stage_name}",
            description="API Gateway endpoint URL"
        )

        TerraformOutput(
            self, "state_machine_arn",
            value=self.state_machine.arn,
            description="Step Functions state machine ARN"
        )

        TerraformOutput(
            self, "sns_topic_arn",
            value=self.sns_topic.arn,
            description="SNS topic ARN for payment alerts"
        )

        TerraformOutput(
            self, "s3_bucket_name",
            value=self.s3_bucket.bucket,
            description="S3 bucket name for payment receipts"
        )

        TerraformOutput(
            self, "kms_key_id",
            value=self.kms_key.id,
            description="KMS key ID for encryption"
        )

        TerraformOutput(
            self, "cloudwatch_dashboard_name",
            value=self.dashboard.dashboard_name,
            description="CloudWatch dashboard name"
        )
