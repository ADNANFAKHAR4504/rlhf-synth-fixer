# tests/unit/test_tap_stack.py
# pylint: disable=missing-class-docstring,missing-function-docstring
import unittest

import aws_cdk as cdk
from aws_cdk.assertions import Template, Match
from pytest import mark

from lib.tap_stack import TapStack, TapStackProps


@mark.describe("TapStack")
class TestTapStack(unittest.TestCase):
    def setUp(self):
        self.app = cdk.App()

    @mark.it("creates three custom EventBridge buses with expected names")
    def test_event_buses(self):
        stack = TapStack(self.app, "TapStackBuses", TapStackProps(environment_suffix="dev"))
        template = Template.from_stack(stack)

        template.resource_count_is("AWS::Events::EventBus", 3)
        template.has_resource_properties("AWS::Events::EventBus", {"Name": "tap-dev-transaction"})
        template.has_resource_properties("AWS::Events::EventBus", {"Name": "tap-dev-system"})
        template.has_resource_properties("AWS::Events::EventBus", {"Name": "tap-dev-audit"})

    @mark.it("creates DynamoDB tables (on-demand, composite keys, PITR enabled)")
    def test_dynamodb_tables(self):
        stack = TapStack(self.app, "TapStackTables", TapStackProps(environment_suffix="dev"))
        template = Template.from_stack(stack)

        template.resource_count_is("AWS::DynamoDB::Table", 3)

        # Transactions table
        template.has_resource_properties(
            "AWS::DynamoDB::Table",
            {
                "TableName": "tap-dev-transactions",
                "BillingMode": "PAY_PER_REQUEST",
                "KeySchema": Match.array_with(
                    [
                        {"AttributeName": "accountId", "KeyType": "HASH"},
                        {"AttributeName": "ts", "KeyType": "RANGE"},
                    ]
                ),
                "PointInTimeRecoverySpecification": {
                    "PointInTimeRecoveryEnabled": True
                },
            },
        )

        # Rules table
        template.has_resource_properties(
            "AWS::DynamoDB::Table",
            {
                "TableName": "tap-dev-rules",
                "BillingMode": "PAY_PER_REQUEST",
                "KeySchema": Match.array_with(
                    [
                        {"AttributeName": "ruleId", "KeyType": "HASH"},
                        {"AttributeName": "version", "KeyType": "RANGE"},
                    ]
                ),
                "PointInTimeRecoverySpecification": {
                    "PointInTimeRecoveryEnabled": True
                },
            },
        )

        # Audit logs table
        template.has_resource_properties(
            "AWS::DynamoDB::Table",
            {
                "TableName": "tap-dev-audit-logs",
                "BillingMode": "PAY_PER_REQUEST",
                "KeySchema": Match.array_with(
                    [
                        {"AttributeName": "transactionId", "KeyType": "HASH"},
                        {"AttributeName": "ts", "KeyType": "RANGE"},
                    ]
                ),
                "PointInTimeRecoverySpecification": {
                    "PointInTimeRecoveryEnabled": True
                },
            },
        )

    @mark.it("creates secure S3 bucket with versioning, SSL-only, encryption and lifecycle to Glacier")
    def test_s3_bucket_security_and_lifecycle(self):
        stack = TapStack(self.app, "TapStackBucket", TapStackProps(environment_suffix="dev"))
        template = Template.from_stack(stack)

        template.resource_count_is("AWS::S3::Bucket", 1)
        template.has_resource_properties(
            "AWS::S3::Bucket",
            {
                "PublicAccessBlockConfiguration": {
                    "BlockPublicAcls": True,
                    "BlockPublicPolicy": True,
                    "IgnorePublicAcls": True,
                    "RestrictPublicBuckets": True,
                },
                "BucketEncryption": {
                    "ServerSideEncryptionConfiguration": Match.array_with(
                        [{"ServerSideEncryptionByDefault": {"SSEAlgorithm": "AES256"}}]
                    )
                },
                "VersioningConfiguration": {"Status": "Enabled"},
                "LifecycleConfiguration": {
                    "Rules": Match.array_with(
                        [
                            Match.object_like(
                                {
                                    "Transitions": Match.array_with(
                                        [
                                            Match.object_like(
                                                {
                                                    "StorageClass": "GLACIER",
                                                    "TransitionInDays": 90,
                                                }
                                            )
                                        ]
                                    )
                                }
                            )
                        ]
                    )
                },
            },
        )

        # Bucket policy with TLS-only and deny unencrypted uploads
        template.resource_count_is("AWS::S3::BucketPolicy", 1)
        template.has_resource_properties(
            "AWS::S3::BucketPolicy",
            {
                "PolicyDocument": {
                    "Statement": Match.array_with(
                        [
                            Match.object_like({"Sid": "DenyInsecureConnections"}),
                            Match.object_like({"Sid": "DenyUnencryptedObjectUploads"}),
                        ]
                    )
                }
            },
        )

    @mark.it("creates three Lambda functions (Node.js 18, ARM64, tracing active, reserved concurrency)")
    def test_lambda_functions_config(self):
        stack = TapStack(self.app, "TapStackLambdas", TapStackProps(environment_suffix="dev"))
        template = Template.from_stack(stack)

        template.resource_count_is("AWS::Lambda::Function", 3)
        template.has_resource_properties(
            "AWS::Lambda::Function",
            {
                "Runtime": "nodejs18.x",
                "Architectures": ["arm64"],
                "MemorySize": 512,
                "TracingConfig": {"Mode": "Active"},
                "ReservedConcurrentExecutions": 10,
                "Handler": "index.handler",
            },
        )

        # Log retention custom resources (no direct LogGroup creation)
        template.resource_count_is("Custom::LogRetention", 3)

    @mark.it("configures async destinations via EventInvokeConfig to EventBridge (success) and SQS DLQ (failure)")
    def test_lambda_event_invoke_config(self):
        stack = TapStack(self.app, "TapStackInvokeCfg", TapStackProps(environment_suffix="dev"))
        template = Template.from_stack(stack)

        template.resource_count_is("AWS::Lambda::EventInvokeConfig", 3)
        template.has_resource_properties(
            "AWS::Lambda::EventInvokeConfig",
            {
                "MaximumRetryAttempts": 2,
                "MaximumEventAgeInSeconds": 3600,
                "DestinationConfig": {
                    "OnSuccess": {"Destination": Match.any_value()},
                    "OnFailure": {"Destination": Match.any_value()},
                },
            },
        )

    @mark.it("creates DLQs and buffer SQS queue with expected names")
    def test_sqs_queues(self):
        stack = TapStack(self.app, "TapStackQueues", TapStackProps(environment_suffix="dev"))
        template = Template.from_stack(stack)

        template.resource_count_is("AWS::SQS::Queue", 3)
        template.has_resource_properties(
            "AWS::SQS::Queue", {"QueueName": "tap-dev-lambda-failures-dlq"}
        )
        template.has_resource_properties(
            "AWS::SQS::Queue", {"QueueName": "tap-dev-eventbridge-failures-dlq"}
        )
        template.has_resource_properties(
            "AWS::SQS::Queue", {"QueueName": "tap-dev-buffer-queue"}
        )

    @mark.it("creates EventBridge archive (replay) for the transaction bus")
    def test_eventbridge_archive(self):
        stack = TapStack(self.app, "TapStackArchive", TapStackProps(environment_suffix="dev"))
        template = Template.from_stack(stack)

        template.resource_count_is("AWS::Events::Archive", 1)
        template.has_resource_properties(
            "AWS::Events::Archive",
            {
                "ArchiveName": "tap-dev-transaction-archive",
                "RetentionDays": 7,
            },
        )

    @mark.it("creates five content-based EventBridge rules with fan-out targets (Lambda, SQS, EventBus)")
    def test_eventbridge_rules_and_targets(self):
        stack = TapStack(self.app, "TapStackRules", TapStackProps(environment_suffix="dev"))
        template = Template.from_stack(stack)

        template.resource_count_is("AWS::Events::Rule", 5)

        # Example: High-value domestic rule pattern
        template.has_resource_properties(
            "AWS::Events::Rule",
            {
                "Name": "tap-dev-high-value-domestic",
                "EventPattern": Match.object_like(
                    {
                        "source": ["tap.transactions"],
                        "detail": {
                            "amount": [{"numeric": [">=", 1000]}],
                            "currency": ["USD"],
                            "region": ["us-east-1", "us-west-2", "us-east-2", "us-west-1"],
                        },
                    }
                ),
                "Targets": Match.array_with(
                    [
                        # Lambda target with retry policy and DLQ
                        Match.object_like(
                            {
                                "RetryPolicy": {
                                    "MaximumEventAgeInSeconds": 7200,
                                    "MaximumRetryAttempts": 3,
                                },
                                "DeadLetterConfig": {"Arn": Match.any_value()},
                            }
                        ),
                        # SQS target with retry policy and DLQ
                        Match.object_like(
                            {
                                "RetryPolicy": {
                                    "MaximumEventAgeInSeconds": 7200,
                                    "MaximumRetryAttempts": 3,
                                },
                                "DeadLetterConfig": {"Arn": Match.any_value()},
                            }
                        ),
                        # EventBus target (no retry policy supported)
                        Match.object_like({"Arn": Match.any_value()}),
                    ]
                ),
            },
        )

    @mark.it("creates API Gateway with tracing, API key, usage plan, model, validator and POST /transactions")
    def test_api_gateway(self):
        stack = TapStack(self.app, "TapStackApi", TapStackProps(environment_suffix="dev"))
        template = Template.from_stack(stack)

        template.resource_count_is("AWS::ApiGateway::RestApi", 1)
        template.has_resource_properties(
            "AWS::ApiGateway::RestApi", {"Name": "tap-dev-api"}
        )

        # Stage with tracing enabled and stage name
        template.resource_count_is("AWS::ApiGateway::Stage", 1)
        template.has_resource_properties(
            "AWS::ApiGateway::Stage",
            {"TracingEnabled": True, "StageName": "dev"},
        )

        # Model + RequestValidator
        template.resource_count_is("AWS::ApiGateway::Model", 1)
        template.resource_count_is("AWS::ApiGateway::RequestValidator", 1)

        # API Key + Usage Plan (+ binding)
        template.resource_count_is("AWS::ApiGateway::ApiKey", 1)
        template.resource_count_is("AWS::ApiGateway::UsagePlan", 1)
        template.resource_count_is("AWS::ApiGateway::UsagePlanKey", 1)
        template.has_resource_properties(
            "AWS::ApiGateway::UsagePlan",
            {
                "Quota": {"Limit": 1_000_000, "Period": "MONTH"},
                "Throttle": {"BurstLimit": 5000, "RateLimit": 10000.0},
            },
        )

        # Resource for /transactions and POST method
        template.has_resource_properties(
            "AWS::ApiGateway::Resource", {"PathPart": "transactions"}
        )
        template.has_resource_properties(
            "AWS::ApiGateway::Method",
            {"HttpMethod": "POST", "ApiKeyRequired": True},
        )

    @mark.it("creates CloudWatch alarms for DLQ, each function (errors & throttles), and API (5xx & latency)")
    def test_cloudwatch_alarms(self):
        stack = TapStack(self.app, "TapStackAlarms", TapStackProps(environment_suffix="dev"))
        template = Template.from_stack(stack)

        # 1 (DLQ) + 3*2 (errors & throttles) + 2 (API) = 9
        template.resource_count_is("AWS::CloudWatch::Alarm", 9)

    @mark.it("emits useful CloudFormation outputs")
    def test_outputs(self):
        stack = TapStack(self.app, "TapStackOutputs", TapStackProps(environment_suffix="dev"))
        template = Template.from_stack(stack)

        # Spot-check key outputs (values are tokens; we just assert presence)
        template.has_output("Stage", {"Value": "dev"})
        template.has_output("ApiBaseUrl", {"Value": Match.any_value()})
        template.has_output("TransactionsEndpoint", {"Value": Match.string_like_regexp(".*/transactions$")})
        template.has_output("TransactionBusArn", {"Value": Match.any_value()})
        template.has_output("ProcessedBucketName", {"Value": Match.any_value()})

    @mark.it("configures provisioned concurrency aliases for critical functions in prod")
    def test_prod_provisioned_concurrency_aliases(self):
        stack = TapStack(self.app, "TapStackProd", TapStackProps(environment_suffix="prod"))
        template = Template.from_stack(stack)

        # Two aliases (ingest + fraud); notifier has only reserved concurrency
        template.resource_count_is("AWS::Lambda::Alias", 2)
        template.has_resource_properties(
            "AWS::Lambda::Alias",
            {
                "Name": "live",
                "ProvisionedConcurrencyConfig": {
                    "ProvisionedConcurrentExecutions": 50
                },
            },
        )

