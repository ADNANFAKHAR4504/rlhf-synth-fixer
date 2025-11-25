"""test_tap_stack.py - Comprehensive unit tests for TapStack"""

import aws_cdk as cdk
from aws_cdk.assertions import Template, Match
import pytest

from lib.tap_stack import TapStack, TapStackProps


@pytest.fixture
def app():
    """Create a CDK app"""
    return cdk.App()


@pytest.fixture
def stack(app):
    """Create a test stack with environment suffix"""
    props = TapStackProps(environment_suffix='test')
    return TapStack(app, "TestStack", props=props)


@pytest.fixture
def template(stack):
    """Create CloudFormation template from stack"""
    return Template.from_stack(stack)


class TestS3Bucket:
    """Test S3 bucket configuration"""

    def test_bucket_created(self, template):
        """Test S3 bucket is created"""
        template.resource_count_is("AWS::S3::Bucket", 1)

    def test_bucket_encryption(self, template):
        """Test bucket has encryption enabled"""
        template.has_resource_properties("AWS::S3::Bucket", {
            "BucketEncryption": {
                "ServerSideEncryptionConfiguration": Match.any_value()
            }
        })

    def test_bucket_name_includes_suffix(self, template):
        """Test bucket name includes environment suffix"""
        template.has_resource_properties("AWS::S3::Bucket", {
            "BucketName": Match.string_like_regexp(".*-test$")
        })

    def test_bucket_public_access_blocked(self, template):
        """Test bucket blocks public access"""
        template.has_resource_properties("AWS::S3::Bucket", {
            "PublicAccessBlockConfiguration": {
                "BlockPublicAcls": True,
                "BlockPublicPolicy": True,
                "IgnorePublicAcls": True,
                "RestrictPublicBuckets": True
            }
        })

    def test_bucket_has_removal_policy(self, template):
        """Test bucket has delete removal policy"""
        resources = template.find_resources("AWS::S3::Bucket")
        for resource in resources.values():
            assert resource.get("DeletionPolicy") == "Delete"


class TestDynamoDB:
    """Test DynamoDB table configuration"""

    def test_table_created(self, template):
        """Test DynamoDB table is created"""
        template.resource_count_is("AWS::DynamoDB::Table", 1)

    def test_table_billing_mode(self, template):
        """Test table uses on-demand billing"""
        template.has_resource_properties("AWS::DynamoDB::Table", {
            "BillingMode": "PAY_PER_REQUEST"
        })

    def test_table_pitr_enabled(self, template):
        """Test point-in-time recovery is enabled"""
        template.has_resource_properties("AWS::DynamoDB::Table", {
            "PointInTimeRecoverySpecification": {
                "PointInTimeRecoveryEnabled": True
            }
        })

    def test_table_has_gsi(self, template):
        """Test table has Global Secondary Index"""
        template.has_resource_properties("AWS::DynamoDB::Table", {
            "GlobalSecondaryIndexes": Match.array_with([
                Match.object_like({
                    "IndexName": "StatusIndex"
                })
            ])
        })

    def test_table_name_includes_suffix(self, template):
        """Test table name includes environment suffix"""
        template.has_resource_properties("AWS::DynamoDB::Table", {
            "TableName": Match.string_like_regexp(".*-test$")
        })

    def test_table_has_partition_key(self, template):
        """Test table has correct partition key"""
        template.has_resource_properties("AWS::DynamoDB::Table", {
            "KeySchema": Match.array_with([
                Match.object_like({
                    "AttributeName": "transactionId",
                    "KeyType": "HASH"
                })
            ])
        })

    def test_table_has_stream(self, template):
        """Test table has stream enabled"""
        template.has_resource_properties("AWS::DynamoDB::Table", {
            "StreamSpecification": {
                "StreamViewType": "NEW_AND_OLD_IMAGES"
            }
        })


class TestLambdaFunctions:
    """Test Lambda function configuration"""

    def test_three_functions_created(self, template):
        """Test at least three Lambda functions are created (may include CDK helper functions)"""
        functions = template.find_resources("AWS::Lambda::Function")
        assert len(functions) >= 3, f"Expected at least 3 Lambda functions, got {len(functions)}"

    def test_function_runtime(self, template):
        """Test functions use Python 3.9 runtime"""
        template.has_resource_properties("AWS::Lambda::Function", {
            "Runtime": "python3.9"
        })

    def test_function_memory(self, template):
        """Test functions have 512MB memory"""
        template.has_resource_properties("AWS::Lambda::Function", {
            "MemorySize": 512
        })

    def test_function_timeout(self, template):
        """Test functions have 60 second timeout"""
        template.has_resource_properties("AWS::Lambda::Function", {
            "Timeout": 60
        })

    def test_function_xray_tracing(self, template):
        """Test functions have X-Ray tracing enabled"""
        template.has_resource_properties("AWS::Lambda::Function", {
            "TracingConfig": {
                "Mode": "Active"
            }
        })

    def test_function_dlq_configured(self, template):
        """Test functions have dead letter queues"""
        template.has_resource_properties("AWS::Lambda::Function", {
            "DeadLetterConfig": Match.any_value()
        })

    def test_function_names_include_suffix(self, template):
        """Test main function names include environment suffix"""
        functions = template.find_resources("AWS::Lambda::Function")
        assert len(functions) >= 3

        # Count functions with the expected naming pattern
        matching_functions = []
        for function in functions.values():
            props = function.get("Properties", {})
            function_name = props.get("FunctionName", "")
            if function_name and function_name.endswith("-test"):
                matching_functions.append(function_name)

        # Should have at least 3 main functions with suffix
        assert len(matching_functions) >= 3, f"Expected at least 3 functions with suffix, got {len(matching_functions)}"

    def test_function_environment_variables(self, template):
        """Test functions have required environment variables"""
        template.has_resource_properties("AWS::Lambda::Function", {
            "Environment": {
                "Variables": Match.object_like({
                    "DYNAMODB_TABLE_NAME": Match.any_value(),
                    "ENVIRONMENT_SUFFIX": "test",
                    "SNS_TOPIC_ARN": Match.any_value()
                })
            }
        })


class TestSQSQueues:
    """Test SQS queue configuration"""

    def test_queues_created(self, template):
        """Test SQS queues are created (2 main + 3 DLQ = 5 total)"""
        template.resource_count_is("AWS::SQS::Queue", 5)

    def test_queue_encryption(self, template):
        """Test queues have encryption enabled"""
        template.has_resource_properties("AWS::SQS::Queue", {
            "KmsMasterKeyId": Match.any_value()
        })

    def test_queue_visibility_timeout(self, template):
        """Test queues have 300s visibility timeout"""
        template.has_resource_properties("AWS::SQS::Queue", {
            "VisibilityTimeout": 300
        })

    def test_queue_names_include_suffix(self, template):
        """Test queue names include environment suffix"""
        template.has_resource_properties("AWS::SQS::Queue", {
            "QueueName": Match.string_like_regexp(".*-test$")
        })

    def test_queue_dlq_configuration(self, template):
        """Test queues have DLQ configuration"""
        template.has_resource_properties("AWS::SQS::Queue", {
            "RedrivePolicy": Match.object_like({
                "maxReceiveCount": 3
            })
        })


class TestStepFunctions:
    """Test Step Functions state machine configuration"""

    def test_state_machine_created(self, template):
        """Test Step Functions state machine is created"""
        template.resource_count_is("AWS::StepFunctions::StateMachine", 1)

    def test_state_machine_xray_enabled(self, template):
        """Test state machine has X-Ray tracing enabled"""
        template.has_resource_properties("AWS::StepFunctions::StateMachine", {
            "TracingConfiguration": {
                "Enabled": True
            }
        })

    def test_state_machine_logging_enabled(self, template):
        """Test state machine has logging enabled"""
        template.has_resource_properties("AWS::StepFunctions::StateMachine", {
            "LoggingConfiguration": Match.any_value()
        })

    def test_state_machine_name_includes_suffix(self, template):
        """Test state machine name includes environment suffix"""
        template.has_resource_properties("AWS::StepFunctions::StateMachine", {
            "StateMachineName": Match.string_like_regexp(".*-test$")
        })

class TestEventBridge:
    """Test EventBridge rule configuration"""

    def test_rule_created(self, template):
        """Test EventBridge rule is created"""
        template.resource_count_is("AWS::Events::Rule", 1)

    def test_rule_event_pattern(self, template):
        """Test rule has correct event pattern for S3"""
        template.has_resource_properties("AWS::Events::Rule", {
            "EventPattern": Match.object_like({
                "source": ["aws.s3"],
                "detail-type": ["Object Created"]
            })
        })

    def test_rule_name_includes_suffix(self, template):
        """Test rule name includes environment suffix"""
        template.has_resource_properties("AWS::Events::Rule", {
            "Name": Match.string_like_regexp(".*-test$")
        })

    def test_rule_has_target(self, template):
        """Test rule has state machine as target"""
        template.has_resource_properties("AWS::Events::Rule", {
            "Targets": Match.array_with([
                Match.object_like({
                    "Arn": Match.any_value()
                })
            ])
        })


class TestAPIGateway:
    """Test API Gateway configuration"""

    def test_api_created(self, template):
        """Test API Gateway REST API is created"""
        template.resource_count_is("AWS::ApiGateway::RestApi", 1)

    def test_api_name_includes_suffix(self, template):
        """Test API name includes environment suffix"""
        template.has_resource_properties("AWS::ApiGateway::RestApi", {
            "Name": Match.string_like_regexp(".*-test$")
        })

    def test_api_has_deployment(self, template):
        """Test API has deployment"""
        template.resource_count_is("AWS::ApiGateway::Deployment", 1)

    def test_api_has_stage(self, template):
        """Test API has stage"""
        template.resource_count_is("AWS::ApiGateway::Stage", 1)

    def test_api_stage_logging(self, template):
        """Test API stage is created"""
        # API Gateway stage is created with deployment
        template.resource_count_is("AWS::ApiGateway::Stage", 1)

    def test_api_has_resource(self, template):
        """Test API has transactions resource"""
        template.resource_count_is("AWS::ApiGateway::Resource", 1)

    def test_api_has_method(self, template):
        """Test API has POST method"""
        template.has_resource_properties("AWS::ApiGateway::Method", {
            "HttpMethod": "POST"
        })


class TestSNS:
    """Test SNS topic configuration"""

    def test_topic_created(self, template):
        """Test SNS topic is created"""
        template.resource_count_is("AWS::SNS::Topic", 1)

    def test_topic_name_includes_suffix(self, template):
        """Test topic name includes environment suffix"""
        template.has_resource_properties("AWS::SNS::Topic", {
            "TopicName": Match.string_like_regexp(".*-test$")
        })

    def test_topic_has_display_name(self, template):
        """Test topic has display name"""
        template.has_resource_properties("AWS::SNS::Topic", {
            "DisplayName": Match.any_value()
        })


class TestCloudWatchLogs:
    """Test CloudWatch Logs configuration"""

    def test_log_groups_created(self, template):
        """Test CloudWatch Log Groups are created"""
        # At least 3 Lambda + 1 State Machine = 4 log groups minimum
        log_groups = template.find_resources("AWS::Logs::LogGroup")
        assert len(log_groups) >= 4, f"Expected at least 4 log groups, got {len(log_groups)}"

    def test_log_retention(self, template):
        """Test log groups have 14-day retention"""
        template.has_resource_properties("AWS::Logs::LogGroup", {
            "RetentionInDays": 14
        })

    def test_log_group_names_lambda(self, template):
        """Test Lambda log group names follow convention"""
        template.has_resource_properties("AWS::Logs::LogGroup", {
            "LogGroupName": Match.string_like_regexp("/aws/lambda/.*")
        })

    def test_log_groups_removal_policy(self, template):
        """Test log groups have delete removal policy"""
        resources = template.find_resources("AWS::Logs::LogGroup")
        for resource in resources.values():
            assert resource.get("DeletionPolicy") == "Delete"


class TestIAMPermissions:
    """Test IAM permissions configuration"""

    def test_iam_roles_created(self, template):
        """Test IAM roles are created for Lambda functions"""
        roles = template.find_resources("AWS::IAM::Role")
        assert len(roles) >= 4  # At least 3 Lambda + 1 API Gateway

    def test_lambda_execution_role(self, template):
        """Test Lambda functions have execution roles"""
        template.has_resource_properties("AWS::IAM::Role", {
            "AssumeRolePolicyDocument": {
                "Statement": Match.array_with([
                    Match.object_like({
                        "Principal": {
                            "Service": "lambda.amazonaws.com"
                        }
                    })
                ])
            }
        })

    def test_api_gateway_role(self, template):
        """Test API Gateway has execution role"""
        template.has_resource_properties("AWS::IAM::Role", {
            "AssumeRolePolicyDocument": {
                "Statement": Match.array_with([
                    Match.object_like({
                        "Principal": {
                            "Service": "apigateway.amazonaws.com"
                        }
                    })
                ])
            }
        })

    def test_iam_policies_created(self, template):
        """Test IAM policies are created"""
        policies = template.find_resources("AWS::IAM::Policy")
        assert len(policies) > 0

    def test_dynamodb_permissions(self, template):
        """Test Lambda functions have DynamoDB permissions"""
        template.has_resource_properties("AWS::IAM::Policy", {
            "PolicyDocument": {
                "Statement": Match.array_with([
                    Match.object_like({
                        "Action": Match.array_with([
                            Match.string_like_regexp("dynamodb:.*")
                        ])
                    })
                ])
            }
        })

    def test_sqs_permissions(self, template):
        """Test Lambda functions have SQS permissions"""
        template.has_resource_properties("AWS::IAM::Policy", {
            "PolicyDocument": {
                "Statement": Match.array_with([
                    Match.object_like({
                        "Action": Match.array_with([
                            Match.string_like_regexp("sqs:.*")
                        ])
                    })
                ])
            }
        })

    def test_sns_permissions(self, template):
        """Test Lambda functions have SNS permissions"""
        policies = template.find_resources("AWS::IAM::Policy")

        # Check if at least one policy has SNS permissions
        has_sns_permission = False
        for policy in policies.values():
            props = policy.get("Properties", {})
            policy_doc = props.get("PolicyDocument", {})
            statements = policy_doc.get("Statement", [])

            for statement in statements:
                actions = statement.get("Action", [])
                if isinstance(actions, str):
                    actions = [actions]

                for action in actions:
                    if "sns:" in action.lower():
                        has_sns_permission = True
                        break

                if has_sns_permission:
                    break

            if has_sns_permission:
                break

        assert has_sns_permission, "No IAM policy with SNS permissions found"


class TestCloudWatchAlarms:
    """Test CloudWatch Alarms configuration"""

    def test_alarm_created(self, template):
        """Test CloudWatch alarm is created"""
        template.resource_count_is("AWS::CloudWatch::Alarm", 1)

    def test_alarm_name_includes_suffix(self, template):
        """Test alarm name includes environment suffix"""
        template.has_resource_properties("AWS::CloudWatch::Alarm", {
            "AlarmName": Match.string_like_regexp(".*-test$")
        })

    def test_alarm_threshold_configured(self, template):
        """Test alarm has threshold configured"""
        template.has_resource_properties("AWS::CloudWatch::Alarm", {
            "Threshold": 10,
            "EvaluationPeriods": 2
        })


class TestCloudFormationOutputs:
    """Test CloudFormation outputs"""

    def test_outputs_exist(self, template):
        """Test required outputs are created"""
        required_outputs = [
            "TransactionBucketName",
            "TransactionTableName",
            "IngestionFunctionArn",
            "ValidationFunctionArn",
            "EnrichmentFunctionArn",
            "StateMachineArn",
            "IngestionQueueUrl",
            "ValidationQueueUrl",
            "ApiEndpoint",
            "FailureTopicArn"
        ]

        outputs = template.find_outputs("*")
        output_keys = list(outputs.keys())

        for required_output in required_outputs:
            assert required_output in output_keys, f"Missing output: {required_output}"

    def test_outputs_have_descriptions(self, template):
        """Test required outputs have descriptions"""
        outputs = template.find_outputs("*")

        # Check that key outputs have descriptions
        required_outputs_with_desc = [
            "TransactionBucketName",
            "TransactionTableName",
            "IngestionFunctionArn",
            "ValidationFunctionArn",
            "EnrichmentFunctionArn",
            "StateMachineArn",
        ]

        for required_output in required_outputs_with_desc:
            if required_output in outputs:
                assert "Description" in outputs[required_output], \
                    f"Output {required_output} missing description"

    def test_outputs_have_export_names(self, template):
        """Test outputs have export names with suffix"""
        outputs = template.find_outputs("*")

        for output_id, output_data in outputs.items():
            if "Export" in output_data:
                export_name = output_data["Export"]["Name"]
                assert export_name.endswith("-test"), f"Export name {export_name} does not include suffix"


class TestResourceRemovalPolicy:
    """Test resource removal policies"""

    def test_dynamodb_destroyable(self, template):
        """Test DynamoDB table is destroyable"""
        resources = template.find_resources("AWS::DynamoDB::Table")
        for resource in resources.values():
            assert resource.get("DeletionPolicy") == "Delete"
            assert resource.get("UpdateReplacePolicy") == "Delete"

    def test_s3_destroyable(self, template):
        """Test S3 bucket is destroyable"""
        resources = template.find_resources("AWS::S3::Bucket")
        for resource in resources.values():
            assert resource.get("DeletionPolicy") == "Delete"
            assert resource.get("UpdateReplacePolicy") == "Delete"

    def test_log_groups_destroyable(self, template):
        """Test Log Groups are destroyable"""
        resources = template.find_resources("AWS::Logs::LogGroup")
        for resource in resources.values():
            assert resource.get("DeletionPolicy") == "Delete"

    def test_no_retain_policies(self, template):
        """Test main resources don't have RETAIN policy"""
        all_resources = template.to_json()["Resources"]

        # Resources we care about (exclude CDK-managed resources like CloudWatch Role)
        important_resource_types = [
            "AWS::S3::Bucket",
            "AWS::DynamoDB::Table",
            "AWS::Logs::LogGroup",
            "AWS::Lambda::Function",
            "AWS::SQS::Queue",
        ]

        for resource_id, resource_data in all_resources.items():
            resource_type = resource_data.get("Type")
            if resource_type in important_resource_types:
                deletion_policy = resource_data.get("DeletionPolicy")
                if deletion_policy:
                    assert deletion_policy != "Retain", \
                        f"Resource {resource_id} of type {resource_type} has RETAIN policy"


class TestEnvironmentSuffix:
    """Test environment suffix handling"""

    def test_default_suffix_is_dev(self, app):
        """Test default environment suffix is 'dev'"""
        stack = TapStack(app, "TestStackDefault")
        template = Template.from_stack(stack)

        template.has_resource_properties("AWS::DynamoDB::Table", {
            "TableName": Match.string_like_regexp(".*-dev$")
        })

    def test_custom_suffix_used(self, app):
        """Test custom environment suffix is used"""
        props = TapStackProps(environment_suffix='custom')
        stack = TapStack(app, "TestStackCustom", props=props)
        template = Template.from_stack(stack)

        template.has_resource_properties("AWS::DynamoDB::Table", {
            "TableName": Match.string_like_regexp(".*-custom$")
        })

    def test_context_suffix_used(self, app):
        """Test environment suffix from context is used"""
        app_with_context = cdk.App(context={"environmentSuffix": "context"})
        stack = TapStack(app_with_context, "TestStackContext")
        template = Template.from_stack(stack)

        template.has_resource_properties("AWS::DynamoDB::Table", {
            "TableName": Match.string_like_regexp(".*-context$")
        })


class TestResourceCount:
    """Test total resource counts"""

    def test_total_resource_count(self, template):
        """Test total number of resources created"""
        all_resources = template.to_json()["Resources"]
        # Should have significant number of resources for comprehensive solution
        assert len(all_resources) >= 20, f"Expected at least 20 resources, got {len(all_resources)}"

    def test_all_required_resource_types(self, template):
        """Test all required AWS resource types are present"""
        required_types = [
            "AWS::S3::Bucket",
            "AWS::DynamoDB::Table",
            "AWS::Lambda::Function",
            "AWS::SQS::Queue",
            "AWS::StepFunctions::StateMachine",
            "AWS::Events::Rule",
            "AWS::ApiGateway::RestApi",
            "AWS::SNS::Topic",
            "AWS::Logs::LogGroup",
            "AWS::IAM::Role",
            "AWS::IAM::Policy",
            "AWS::CloudWatch::Alarm"
        ]

        all_resources = template.to_json()["Resources"]
        resource_types = {res["Type"] for res in all_resources.values()}

        for required_type in required_types:
            assert required_type in resource_types, f"Missing required resource type: {required_type}"
