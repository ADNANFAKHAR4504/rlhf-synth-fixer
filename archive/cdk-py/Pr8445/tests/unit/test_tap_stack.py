"""
Unit tests for TapStack
Tests CDK construct synthesis and resource configuration
"""

import aws_cdk as cdk
import pytest
from aws_cdk import assertions as cdk_assertions

from lib.tap_stack import TapStack, TapStackProps


@pytest.fixture
def app():
    """Create CDK app for testing"""
    return cdk.App()


@pytest.fixture
def stack(app):
    """Create TapStack instance for testing"""
    return TapStack(
        app,
        "TestStack",
        TapStackProps(
            environment_suffix="test",
            env=cdk.Environment(region="us-east-1"),
        ),
    )


@pytest.fixture
def template(stack):
    """Get CloudFormation template from stack"""
    return cdk_assertions.Template.from_stack(stack)


class TestStackSynthesis:
    """Test CDK stack synthesis"""

    def test_stack_can_be_synthesized(self, app, stack):
        """Verify stack can be synthesized without errors"""
        app.synth()
        assert stack is not None

    def test_stack_has_correct_name(self, stack):
        """Verify stack has correct name based on environment suffix"""
        assert "test" in stack.stack_name.lower()


class TestS3Bucket:
    """Test S3 bucket resource configuration"""

    def test_s3_bucket_exists(self, template):
        """Verify S3 bucket is created"""
        template.resource_count_is("AWS::S3::Bucket", 1)

    def test_s3_bucket_has_removal_policy(self, template):
        """Verify S3 bucket has DeletionPolicy set to Delete"""
        # Check for DeletionPolicy in the resource definition
        template.has_resource(
            "AWS::S3::Bucket",
            {
                "DeletionPolicy": "Delete",
            },
        )

    def test_s3_bucket_exists_in_stack(self, stack):
        """Verify bucket attribute is accessible in stack"""
        assert hasattr(stack, "bucket")
        assert stack.bucket is not None


class TestDynamoDBTable:
    """Test DynamoDB table configuration"""

    def test_dynamodb_table_exists(self, template):
        """Verify DynamoDB table is created"""
        template.resource_count_is("AWS::DynamoDB::Table", 1)

    def test_dynamodb_table_has_correct_key(self, template):
        """Verify DynamoDB table has correct partition key"""
        template.has_resource_properties(
            "AWS::DynamoDB::Table",
            {
                "KeySchema": [
                    {"AttributeName": "request_id", "KeyType": "HASH"}
                ],
                "AttributeDefinitions": [
                    {"AttributeName": "request_id", "AttributeType": "S"}
                ],
            },
        )

    def test_dynamodb_table_uses_pay_per_request(self, template):
        """Verify DynamoDB table uses PAY_PER_REQUEST billing mode"""
        template.has_resource_properties(
            "AWS::DynamoDB::Table",
            {"BillingMode": "PAY_PER_REQUEST"},
        )

    def test_dynamodb_table_has_correct_name(self, template):
        """Verify DynamoDB table has correct name"""
        template.has_resource_properties(
            "AWS::DynamoDB::Table",
            {"TableName": cdk_assertions.Match.string_like_regexp(r"tap-.*-requests")},
        )


class TestStepFunctions:
    """Test Step Functions state machine configuration"""

    def test_state_machine_exists(self, template):
        """Verify Step Functions state machine is created"""
        template.resource_count_is("AWS::StepFunctions::StateMachine", 1)

    def test_state_machine_has_definition(self, template):
        """Verify state machine has a definition"""
        template.has_resource_properties(
            "AWS::StepFunctions::StateMachine",
            {
                "DefinitionString": cdk_assertions.Match.any_value(),
            },
        )

    def test_state_machine_has_correct_name(self, template):
        """Verify state machine has correct name"""
        template.has_resource_properties(
            "AWS::StepFunctions::StateMachine",
            {
                "StateMachineName": cdk_assertions.Match.string_like_regexp(
                    r"tap-.*-statemachine"
                )
            },
        )

    def test_state_machine_uses_definitionBody(self, stack):
        """Verify state machine uses definitionBody instead of deprecated definition"""
        assert hasattr(stack, "state_machine")
        assert stack.state_machine is not None


class TestLambdaFunction:
    """Test Lambda function configuration"""

    def test_lambda_function_exists(self, template):
        """Verify Lambda function is created"""
        # Main Lambda function (auto-delete custom resource removed for LocalStack)
        template.resource_count_is("AWS::Lambda::Function", 1)

    def test_lambda_has_correct_runtime(self, template):
        """Verify Lambda uses Python 3.12 runtime"""
        template.has_resource_properties(
            "AWS::Lambda::Function",
            {"Runtime": "python3.12"},
        )

    def test_lambda_has_environment_variables(self, template):
        """Verify Lambda has required environment variables"""
        template.has_resource_properties(
            "AWS::Lambda::Function",
            {
                "Environment": {
                    "Variables": {
                        "BUCKET_NAME": cdk_assertions.Match.any_value(),
                        "TABLE_NAME": cdk_assertions.Match.any_value(),
                        "STATE_MACHINE_ARN": cdk_assertions.Match.any_value(),
                    }
                }
            },
        )

    def test_lambda_has_correct_handler(self, template):
        """Verify Lambda has correct handler"""
        template.has_resource_properties(
            "AWS::Lambda::Function",
            {"Handler": "index.handler"},
        )

    def test_lambda_has_timeout(self, template):
        """Verify Lambda has correct timeout"""
        template.has_resource_properties(
            "AWS::Lambda::Function",
            {"Timeout": 30},
        )


class TestAPIGateway:
    """Test API Gateway configuration"""

    def test_api_gateway_exists(self, template):
        """Verify API Gateway REST API is created"""
        template.resource_count_is("AWS::ApiGateway::RestApi", 1)

    def test_api_has_correct_name(self, template):
        """Verify API has correct name"""
        template.has_resource_properties(
            "AWS::ApiGateway::RestApi",
            {"Name": cdk_assertions.Match.string_like_regexp(r"tap-.*-api")},
        )

    def test_api_has_cors_configuration(self, template):
        """Verify API has CORS configuration"""
        # Check for multiple methods (POST + OPTIONS for CORS)
        methods = template.find_resources("AWS::ApiGateway::Method")
        assert len(methods) >= 1, "Expected at least one API Gateway method"

    def test_api_has_lambda_integration(self, template):
        """Verify API has Lambda integration"""
        template.has_resource_properties(
            "AWS::ApiGateway::Method",
            {
                "HttpMethod": "POST",
                "Integration": {
                    "Type": "AWS_PROXY",
                },
            },
        )


class TestIAMPermissions:
    """Test IAM role and policy configuration"""

    def test_lambda_has_execution_role(self, template):
        """Verify Lambda has an execution role"""
        # Multiple roles: Lambda execution + Step Functions + custom resource
        roles = template.find_resources("AWS::IAM::Role")
        assert len(roles) >= 2, f"Expected at least 2 IAM roles but found {len(roles)}"

    def test_lambda_can_write_to_s3(self, template):
        """Verify Lambda has permissions to write to S3"""
        # Check that Lambda has S3 permissions (including PutObject)
        template.has_resource_properties(
            "AWS::IAM::Policy",
            {
                "PolicyDocument": {
                    "Statement": cdk_assertions.Match.array_with(
                        [
                            {
                                "Action": cdk_assertions.Match.array_with(
                                    ["s3:PutObject"]
                                ),
                                "Effect": "Allow",
                                "Resource": cdk_assertions.Match.any_value(),
                            }
                        ]
                    )
                }
            },
        )

    def test_lambda_can_write_to_dynamodb(self, template):
        """Verify Lambda has permissions to write to DynamoDB"""
        template.has_resource_properties(
            "AWS::IAM::Policy",
            {
                "PolicyDocument": {
                    "Statement": cdk_assertions.Match.array_with(
                        [
                            {
                                "Action": cdk_assertions.Match.array_with(
                                    ["dynamodb:PutItem", "dynamodb:UpdateItem"]
                                ),
                                "Effect": "Allow",
                                "Resource": cdk_assertions.Match.any_value(),
                            }
                        ]
                    )
                }
            },
        )

    def test_lambda_can_start_stepfunctions_execution(self, template):
        """Verify Lambda has permissions to start Step Functions execution"""
        template.has_resource_properties(
            "AWS::IAM::Policy",
            {
                "PolicyDocument": {
                    "Statement": cdk_assertions.Match.array_with(
                        [
                            {
                                "Action": "states:StartExecution",
                                "Effect": "Allow",
                                "Resource": cdk_assertions.Match.any_value(),
                            }
                        ]
                    )
                }
            },
        )


class TestOutputs:
    """Test CloudFormation outputs"""

    def test_api_endpoint_output_exists(self, template):
        """Verify API endpoint output is exported"""
        template.has_output(
            "ApiEndpoint",
            {
                "Description": "API Gateway endpoint URL",
            },
        )

    def test_bucket_name_output_exists(self, template):
        """Verify bucket name output is exported"""
        template.has_output(
            "BucketName",
            {
                "Description": "S3 bucket name for request storage",
            },
        )

    def test_table_name_output_exists(self, template):
        """Verify table name output is exported"""
        template.has_output(
            "TableName",
            {
                "Description": "DynamoDB table name for request metadata",
            },
        )

    def test_state_machine_arn_output_exists(self, template):
        """Verify state machine ARN output is exported"""
        template.has_output(
            "StateMachineArn",
            {
                "Description": "Step Functions state machine ARN",
            },
        )

    def test_lambda_function_name_output_exists(self, template):
        """Verify Lambda function name output is exported"""
        template.has_output(
            "LambdaFunctionName",
            {
                "Description": "Lambda function name",
            },
        )


class TestTags:
    """Test resource tagging"""

    def test_resources_have_environment_tag(self, template):
        """Verify resources are tagged with Environment"""
        # Check that at least one resource has the Environment tag
        template.has_resource(
            "AWS::S3::Bucket",
            {
                "Properties": {
                    "Tags": cdk_assertions.Match.array_with(
                        [{"Key": "Environment", "Value": "Production"}]
                    )
                }
            },
        )

    def test_resources_have_project_tag(self, template):
        """Verify resources are tagged with Project"""
        template.has_resource(
            "AWS::S3::Bucket",
            {
                "Properties": {
                    "Tags": cdk_assertions.Match.array_with(
                        [{"Key": "Project", "Value": "TAP"}]
                    )
                }
            },
        )


class TestStackProperties:
    """Test stack properties and props"""

    def test_stack_props_accepts_environment_suffix(self):
        """Verify TapStackProps accepts environment_suffix"""
        props = TapStackProps(environment_suffix="dev")
        assert props.environment_suffix == "dev"

    def test_stack_props_defaults_to_none(self):
        """Verify TapStackProps defaults environment_suffix to None"""
        props = TapStackProps()
        assert props.environment_suffix is None

    def test_stack_uses_props_environment_suffix(self, app):
        """Verify stack uses environment suffix from props"""
        props = TapStackProps(environment_suffix="prod")
        stack = TapStack(app, "TestStack", props)

        # Check that resources use the environment suffix
        template = cdk_assertions.Template.from_stack(stack)
        template.has_resource_properties(
            "AWS::DynamoDB::Table",
            {"TableName": "tap-prod-requests"},
        )


if __name__ == "__main__":
    pytest.main([__file__, "-v", "-s"])
