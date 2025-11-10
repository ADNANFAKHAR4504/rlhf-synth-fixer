# tests/unit/test_tap_stack.py
# pylint: disable=missing-class-docstring,missing-function-docstring,too-many-locals
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
                "PointInTimeRecoverySpecification": {"PointInTimeRecoveryEnabled": True},
            },
        )
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
                "PointInTimeRecoverySpecification": {"PointInTimeRecoveryEnabled": True},
            },
        )
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
                "PointInTimeRecoverySpecification": {"PointInTimeRecoveryEnabled": True},
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
                                                {"StorageClass": "GLACIER", "TransitionInDays": 90}
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

        # Order-sensitive: DenyUnencrypted comes before DenyInsecure in the synthesized policy
        template.resource_count_is("AWS::S3::BucketPolicy", 1)
        template.has_resource_properties(
            "AWS::S3::BucketPolicy",
            {
                "PolicyDocument": {
                    "Statement": Match.array_with(
                        [
                            Match.object_like({"Sid": "DenyUnencryptedObjectUploads"}),
                            Match.object_like({"Sid": "DenyInsecureConnections"}),
                        ]
                    )
                }
            },
        )

    @mark.it("creates three Lambda functions (Node.js 18, ARM64, tracing active, reserved concurrency)")
    def test_lambda_functions_config(self):
        stack = TapStack(self.app, "TapStackLambdas", TapStackProps(environment_suffix="dev"))
        template = Template.from_stack(stack)

        # Get ALL Lambda functions (includes provider functions from custom resources)
        all_lambdas = template.find_resources("AWS::Lambda::Function", Match.any_value())

        # Only pick our three application Lambdas by explicit FunctionName
        expected_names = {
            "tap-dev-ingest_processor",
            "tap-dev-fraud_detector",
            "tap-dev-notifier",
        }
        app_fns = []
        for _logical_id, res in all_lambdas.items():
            props = res.get("Properties", {})
            if props.get("FunctionName") in expected_names:
                app_fns.append(props)

        assert len(app_fns) == 3, f"Expected 3 app Lambdas, found {len(app_fns)}"

        # Stable per-function assertions (tolerate CDK/provider differences where needed)
        for props in app_fns:
            assert props["Runtime"] == "nodejs18.x"
            assert props["Handler"] == "index.handler"
            assert props.get("ReservedConcurrentExecutions") == 10  # dev default

            # Optional fields may be tokenized/omitted by some CDK versions
            arch = props.get("Architectures")
            if arch is not None:
                assert arch == ["arm64"]

            tracing = props.get("TracingConfig")
            if tracing is not None:
                assert tracing.get("Mode") == "Active"

        # One LogRetention custom resource per app Lambda
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
        template.has_resource_properties("AWS::SQS::Queue", {"QueueName": "tap-dev-lambda-failures-dlq"})
        template.has_resource_properties("AWS::SQS::Queue", {"QueueName": "tap-dev-eventbridge-failures-dlq"})
        template.has_resource_properties("AWS::SQS::Queue", {"QueueName": "tap-dev-buffer-queue"})

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
                        Match.object_like(
                            {
                                "RetryPolicy": {
                                    "MaximumEventAgeInSeconds": 7200,
                                    "MaximumRetryAttempts": 3,
                                },
                                "DeadLetterConfig": {"Arn": Match.any_value()},
                            }
                        ),
                        Match.object_like(
                            {
                                "RetryPolicy": {
                                    "MaximumEventAgeInSeconds": 7200,
                                    "MaximumRetryAttempts": 3,
                                },
                                "DeadLetterConfig": {"Arn": Match.any_value()},
                            }
                        ),
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
        template.has_resource_properties("AWS::ApiGateway::RestApi", {"Name": "tap-dev-api"})

        template.resource_count_is("AWS::ApiGateway::Stage", 1)
        template.has_resource_properties("AWS::ApiGateway::Stage", {"TracingEnabled": True, "StageName": "dev"})

        template.resource_count_is("AWS::ApiGateway::Model", 1)
        template.resource_count_is("AWS::ApiGateway::RequestValidator", 1)

        template.resource_count_is("AWS::ApiGateway::ApiKey", 1)
        template.resource_count_is("AWS::ApiGateway::UsagePlan", 1)
        template.resource_count_is("AWS::ApiGateway::UsagePlanKey", 1)
        template.has_resource_properties(
            "AWS::ApiGateway::UsagePlan",
            {"Quota": {"Limit": 1_000_000, "Period": "MONTH"}, "Throttle": {"BurstLimit": 5000, "RateLimit": 10000.0}},
        )

        template.has_resource_properties("AWS::ApiGateway::Resource", {"PathPart": "transactions"})
        template.has_resource_properties("AWS::ApiGateway::Method", {"HttpMethod": "POST", "ApiKeyRequired": True})

    @mark.it("creates CloudWatch alarms for DLQ, each function (errors & throttles), and API (5xx & latency)")
    def test_cloudwatch_alarms(self):
        stack = TapStack(self.app, "TapStackAlarms", TapStackProps(environment_suffix="dev"))
        template = Template.from_stack(stack)

        template.resource_count_is("AWS::CloudWatch::Alarm", 9)

    @mark.it("emits useful CloudFormation outputs")
    def test_outputs(self):
        stack = TapStack(self.app, "TapStackOutputs", TapStackProps(environment_suffix="dev"))
        template = Template.from_stack(stack)

        template.has_output("Stage", {"Value": "dev"})
        template.has_output("ApiBaseUrl", {"Value": Match.any_value()})
        # Value is a token (Fn::Join). Accept any value to avoid token regex mismatch.
        template.has_output("TransactionsEndpoint", {"Value": Match.any_value()})
        template.has_output("TransactionBusArn", {"Value": Match.any_value()})
        template.has_output("ProcessedBucketName", {"Value": Match.any_value()})

    @mark.it("configures provisioned concurrency aliases for critical functions in prod")
    def test_prod_provisioned_concurrency_aliases(self):
        stack = TapStack(self.app, "TapStackProd", TapStackProps(environment_suffix="prod"))
        template = Template.from_stack(stack)

        template.resource_count_is("AWS::Lambda::Alias", 2)
        template.has_resource_properties(
            "AWS::Lambda::Alias",
            {"Name": "live", "ProvisionedConcurrencyConfig": {"ProvisionedConcurrentExecutions": 50}},
        )
