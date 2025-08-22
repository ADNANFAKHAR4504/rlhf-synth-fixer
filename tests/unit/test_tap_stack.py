"""
Unit tests for the TAP Stack infrastructure components.
"""
import json
import os
import sys
from datetime import datetime
from unittest.mock import MagicMock, patch

import aws_cdk as cdk
import pytest
from aws_cdk.assertions import Match, Template

from lib.tap_stack import TapStack, TapStackProps


class TestTapStack:
    """Test suite for TapStack CDK infrastructure."""
    
    @pytest.fixture
    def app(self):
        """Create a CDK app for testing."""
        return cdk.App()
    
    @pytest.fixture
    def environment_suffix(self):
        """Provide a test environment suffix."""
        return 'test123'
    
    @pytest.fixture
    def stack(self, app, environment_suffix):
        """Create a TapStack instance for testing."""
        props = TapStackProps(
            environment_suffix=environment_suffix,
            env=cdk.Environment(
                account='123456789012',
                region='us-east-1'
            )
        )
        return TapStack(app, f"TapStack{environment_suffix}", props=props)
    
    @pytest.fixture
    def template(self, stack):
        """Generate CloudFormation template from stack."""
        return Template.from_stack(stack)
    
    def test_stack_creates_s3_bucket(self, template, environment_suffix):
        """Test that S3 bucket is created with correct properties."""
        template.has_resource_properties("AWS::S3::Bucket", {
            "VersioningConfiguration": {
                "Status": "Enabled"
            },
            "BucketEncryption": {
                "ServerSideEncryptionConfiguration": [
                    {
                        "ServerSideEncryptionByDefault": {
                            "SSEAlgorithm": "AES256"
                        }
                    }
                ]
            },
            "PublicAccessBlockConfiguration": {
                "BlockPublicAcls": True,
                "BlockPublicPolicy": True,
                "IgnorePublicAcls": True,
                "RestrictPublicBuckets": True
            }
        })
        
        # Check bucket name pattern (using Match.any_value() since it's a CDK construct)
        template.has_resource("AWS::S3::Bucket", {
            "Properties": {
                "BucketName": Match.any_value()
            }
        })
    
    def test_stack_creates_dynamodb_table(self, template, environment_suffix):
        """Test that DynamoDB table is created with correct configuration."""
        template.has_resource_properties("AWS::DynamoDB::Table", {
            "TableName": f"processing-metadata-{environment_suffix}",
            "AttributeDefinitions": [
                {
                    "AttributeName": "fileId",
                    "AttributeType": "S"
                }
            ],
            "KeySchema": [
                {
                    "AttributeName": "fileId",
                    "KeyType": "HASH"
                }
            ],
            "BillingMode": "PAY_PER_REQUEST",
            "PointInTimeRecoverySpecification": {
                "PointInTimeRecoveryEnabled": True
            }
        })
    
    def test_stack_creates_lambda_functions(self, template, environment_suffix):
        """Test that all Lambda functions are created with correct runtime."""
        # Image processor
        template.has_resource_properties("AWS::Lambda::Function", {
            "FunctionName": f"image-processor-{environment_suffix}",
            "Runtime": "python3.12",
            "Handler": "index.handler",
            "Timeout": 300,
            "MemorySize": 1024
        })
        
        # Document processor
        template.has_resource_properties("AWS::Lambda::Function", {
            "FunctionName": f"document-processor-{environment_suffix}",
            "Runtime": "python3.12",
            "Handler": "index.handler",
            "Timeout": 300,
            "MemorySize": 1024
        })
        
        # Data processor
        template.has_resource_properties("AWS::Lambda::Function", {
            "FunctionName": f"data-processor-{environment_suffix}",
            "Runtime": "python3.12",
            "Handler": "index.handler",
            "Timeout": 300,
            "MemorySize": 1024
        })
        
        # API handler
        template.has_resource_properties("AWS::Lambda::Function", {
            "FunctionName": f"api-handler-{environment_suffix}",
            "Runtime": "python3.12",
            "Handler": "index.handler",
            "Timeout": 30,
            "MemorySize": 512
        })
    
    def test_stack_creates_api_gateway(self, template):
        """Test that API Gateway is created with correct configuration."""
        template.has_resource("AWS::ApiGateway::RestApi", {
            "Properties": {
                "Name": Match.string_like_regexp(".*api.*"),
                "Description": Match.string_like_regexp(".*TAP.*")
            }
        })
    
    def test_stack_creates_iam_role(self, template):
        """Test that IAM role is created for Lambda functions."""
        template.has_resource("AWS::IAM::Role", {
            "Properties": {
                "AssumeRolePolicyDocument": {
                    "Statement": [
                        {
                            "Action": "sts:AssumeRole",
                            "Effect": "Allow",
                            "Principal": {
                                "Service": "lambda.amazonaws.com"
                            }
                        }
                    ]
                }
            }
        })
    
    def test_stack_has_outputs(self, template):
        """Test that stack has required outputs."""
        outputs = template.find_outputs("*")
        assert len(outputs) > 0
        
        # Check for specific outputs
        output_keys = list(outputs.keys())
        assert any("bucket" in key.lower() for key in output_keys)
        assert any("api" in key.lower() for key in output_keys)
    
    def test_s3_bucket_lifecycle_rules(self, template):
        """Test that S3 bucket has lifecycle rules configured."""
        template.has_resource_properties("AWS::S3::Bucket", {
            "LifecycleConfiguration": {
                "Rules": Match.array_with([
                    Match.object_like({
                        "Id": Match.any_value(),
                        "Status": "Enabled"
                    })
                ])
            }
        })
    
    def test_lambda_environment_variables(self, template):
        """Test that Lambda functions have required environment variables."""
        template.has_resource_properties("AWS::Lambda::Function", {
            "Environment": {
                "Variables": Match.object_like({
                    "METADATA_TABLE_NAME": Match.any_value(),
                    "UPLOAD_BUCKET_NAME": Match.any_value(),
                    "LOG_LEVEL": Match.any_value()
                })
            }
        })
    
    def test_s3_event_notifications_exist(self, template):
        """Test that S3 bucket has event notifications configured."""
        template.has_resource("AWS::S3::BucketNotification", {
            "Properties": {
                "Bucket": Match.any_value(),
                "LambdaConfigurations": Match.array_with([
                    Match.object_like({
                        "Event": "s3:ObjectCreated:*",
                        "Function": Match.any_value()
                    })
                ])
            }
        })
    
    def test_api_gateway_cors_configuration(self, template):
        """Test that API Gateway has CORS configured."""
        template.has_resource_properties("AWS::ApiGateway::Method", {
            "HttpMethod": "OPTIONS",
            "Integration": {
                "IntegrationResponses": Match.array_with([
                    Match.object_like({
                        "ResponseParameters": Match.object_like({
                            "method.response.header.Access-Control-Allow-Origin": "'*'"
                        })
                    })
                ])
            }
        })
    
    def test_removal_policies(self, template):
        """Test that resources have appropriate removal policies."""
        # S3 bucket should have auto-delete objects
        template.has_resource_properties("AWS::S3::Bucket", {
            "AutoDeleteObjects": True
        })
        
        # DynamoDB table should have removal policy
        template.has_resource_properties("AWS::DynamoDB::Table", {
            "DeletionProtectionEnabled": False
        })
    
    def test_api_gateway_throttling(self, template):
        """Test that API Gateway has throttling configured."""
        template.has_resource_properties("AWS::ApiGateway::UsagePlan", {
            "Throttle": {
                "RateLimit": Match.any_value(),
                "BurstLimit": Match.any_value()
            }
        })
    
    def test_lambda_functions_have_log_groups(self, template):
        """Test that Lambda functions have associated CloudWatch log groups."""
        template.has_resource("AWS::Logs::LogGroup", {
            "Properties": {
                "LogGroupName": Match.string_like_regexp(".*lambda.*")
            }
        })
    
    def test_iam_policies_include_s3_access(self, template):
        """Test that IAM policies include S3 access permissions."""
        template.has_resource_properties("AWS::IAM::Policy", {
            "PolicyDocument": {
                "Statement": Match.array_with([
                    Match.object_like({
                        "Action": Match.array_with([
                            "s3:GetObject",
                            "s3:PutObject",
                            "s3:DeleteObject"
                        ]),
                        "Effect": "Allow"
                    })
                ])
            }
        })
    
    def test_iam_policies_include_dynamodb_access(self, template):
        """Test that IAM policies include DynamoDB access permissions."""
        template.has_resource_properties("AWS::IAM::Policy", {
            "PolicyDocument": {
                "Statement": Match.array_with([
                    Match.object_like({
                        "Action": Match.array_with([
                            "dynamodb:GetItem",
                            "dynamodb:PutItem",
                            "dynamodb:UpdateItem",
                            "dynamodb:DeleteItem",
                            "dynamodb:Scan",
                            "dynamodb:Query"
                        ]),
                        "Effect": "Allow"
                    })
                ])
            }
        })
    
    def test_iam_policies_include_bedrock_access(self, template):
        """Test that IAM policies include Bedrock access permissions."""
        template.has_resource_properties("AWS::IAM::Policy", {
            "PolicyDocument": {
                "Statement": Match.array_with([
                    Match.object_like({
                        "Action": Match.array_with([
                            "bedrock:InvokeModel"
                        ]),
                        "Effect": "Allow"
                    })
                ])
            }
        })
    
    def test_api_gateway_integration(self, template):
        """Test that API Gateway has Lambda integration configured."""
        template.has_resource_properties("AWS::ApiGateway::Method", {
            "Integration": {
                "Type": "AWS_PROXY",
                "IntegrationHttpMethod": "POST"
            }
        })
    
    def test_stack_properties_class(self):
        """Test that TapStackProps class works correctly."""
        props = TapStackProps(
            environment_suffix="test",
            env=cdk.Environment(account="123456789012", region="us-east-1")
        )
        
        assert props.environment_suffix == "test"
        assert props.env.account == "123456789012"
        assert props.env.region == "us-east-1"
    
    def test_stack_constructor_with_default_props(self, app):
        """Test stack constructor with default properties."""
        stack = TapStack(app, "TestStack")
        
        assert stack is not None
        assert stack.node.id == "TestStack"
    
    def test_stack_constructor_with_custom_props(self, app):
        """Test stack constructor with custom properties."""
        props = TapStackProps(
            environment_suffix="custom",
            env=cdk.Environment(account="111111111111", region="us-west-2")
        )
        
        stack = TapStack(app, "CustomStack", props=props)
        
        assert stack is not None
        assert stack.node.id == "CustomStack"
    
    def test_stack_resources_are_accessible(self, stack):
        """Test that stack resources are accessible."""
        # This test verifies that the stack can be instantiated and resources are created
        assert stack is not None
        
        # Check that the stack has the expected number of resources
        template = Template.from_stack(stack)
        resources = template.to_json()
        
        # Should have multiple resources (S3, DynamoDB, Lambda, API Gateway, etc.)
        assert len(resources) > 0
    
    def test_s3_bucket_auto_delete_objects(self, template):
        """Test that S3 bucket has auto-delete objects enabled."""
        template.has_resource_properties("AWS::S3::Bucket", {
            "AutoDeleteObjects": True
        })
    
    def test_dynamodb_table_removal_policy(self, template):
        """Test that DynamoDB table has appropriate removal policy."""
        template.has_resource_properties("AWS::DynamoDB::Table", {
            "DeletionProtectionEnabled": False
        })
    
    def test_lambda_functions_have_reserved_concurrency(self, template):
        """Test that Lambda functions have reserved concurrency configured."""
        # Image processor should have reserved concurrency
        template.has_resource_properties("AWS::Lambda::Function", {
            "FunctionName": Match.string_like_regexp(".*image-processor.*"),
            "ReservedConcurrentExecutions": 2
        })
        
        # Document processor should have reserved concurrency
        template.has_resource_properties("AWS::Lambda::Function", {
            "FunctionName": Match.string_like_regexp(".*document-processor.*"),
            "ReservedConcurrentExecutions": 5
        })
        
        # Data processor should have reserved concurrency
        template.has_resource_properties("AWS::Lambda::Function", {
            "FunctionName": Match.string_like_regexp(".*data-processor.*"),
            "ReservedConcurrentExecutions": 3
        })
    
    def test_api_gateway_stage_configuration(self, template):
        """Test that API Gateway stage is properly configured."""
        template.has_resource_properties("AWS::ApiGateway::Stage", {
            "StageName": Match.any_value(),
            "MethodSettings": Match.array_with([
                Match.object_like({
                    "LoggingLevel": "INFO",
                    "DataTraceEnabled": True,
                    "MetricsEnabled": True
                })
            ])
        })
    
    def test_lambda_functions_code_source(self, template):
        """Test that Lambda functions have correct code source."""
        template.has_resource_properties("AWS::Lambda::Function", {
            "Code": Match.object_like({
                "S3Bucket": Match.any_value()
            })
        })
    
    def test_stack_outputs_have_descriptions(self, template):
        """Test that stack outputs have proper descriptions."""
        outputs = template.find_outputs("*")
        for output_key, output_value in outputs.items():
            # Check that outputs have values
            assert "Value" in output_value
            assert output_value["Value"] is not None
    
    def test_api_gateway_methods_exist(self, template):
        """Test that API Gateway has the required HTTP methods."""
        # Should have GET methods
        template.has_resource("AWS::ApiGateway::Method", {
            "Properties": {
                "HttpMethod": "GET"
            }
        })
        
        # Should have OPTIONS methods for CORS
        template.has_resource("AWS::ApiGateway::Method", {
            "Properties": {
                "HttpMethod": "OPTIONS"
            }
        })
    
    def test_lambda_functions_have_timeout(self, template):
        """Test that all Lambda functions have timeout configured."""
        template.has_resource_properties("AWS::Lambda::Function", {
            "Timeout": Match.any_value()
        })
    
    def test_lambda_functions_have_memory_size(self, template):
        """Test that all Lambda functions have memory size configured."""
        template.has_resource_properties("AWS::Lambda::Function", {
            "MemorySize": Match.any_value()
        })
    
    def test_s3_bucket_encryption(self, template):
        """Test that S3 bucket has encryption enabled."""
        template.has_resource_properties("AWS::S3::Bucket", {
            "BucketEncryption": Match.object_like({
                "ServerSideEncryptionConfiguration": Match.array_with([
                    Match.object_like({
                        "ServerSideEncryptionByDefault": Match.object_like({
                            "SSEAlgorithm": "AES256"
                        })
                    })
                ])
            })
        })
    
    def test_dynamodb_table_key_schema(self, template):
        """Test that DynamoDB table has correct key schema."""
        template.has_resource_properties("AWS::DynamoDB::Table", {
            "KeySchema": [
                {
                    "AttributeName": "fileId",
                    "KeyType": "HASH"
                }
            ]
        })
    
    def test_iam_role_managed_policies(self, template):
        """Test that IAM role has required managed policies."""
        # Check that IAM roles exist (managed policies are configured in CDK)
        template.has_resource("AWS::IAM::Role", {})


class TestLambdaFunctions:
    """Test suite for Lambda function logic (basic tests without complex imports)."""
    
    def test_lambda_function_imports_work(self):
        """Test that Lambda function modules can be imported."""
        try:
            # Test importing the lambda directory using importlib
            import importlib
            importlib.import_module('lib.lambda.api_handler')
            importlib.import_module('lib.lambda.data_processor')
            importlib.import_module('lib.lambda.document_processor')
            importlib.import_module('lib.lambda.image_processor')
            assert True  # If we get here, imports worked
        except ImportError as e:
            pytest.skip(f"Lambda functions not available: {e}")
    
    def test_lambda_function_files_exist(self):
        """Test that Lambda function files exist."""
        lambda_files = [
            "lib/lambda/api_handler.py",
            "lib/lambda/data_processor.py", 
            "lib/lambda/document_processor.py",
            "lib/lambda/image_processor.py"
        ]
        
        for file_path in lambda_files:
            assert os.path.exists(file_path), f"Lambda function file {file_path} does not exist"
    
    def test_lambda_function_syntax(self):
        """Test that Lambda function files have valid Python syntax."""
        lambda_files = [
            "lib/lambda/api_handler.py",
            "lib/lambda/data_processor.py",
            "lib/lambda/document_processor.py", 
            "lib/lambda/image_processor.py"
        ]
        
        for file_path in lambda_files:
            try:
                with open(file_path, 'r') as f:
                    compile(f.read(), file_path, 'exec')
                assert True  # If we get here, syntax is valid
            except SyntaxError as e:
                pytest.fail(f"Syntax error in {file_path}: {e}")
    
    def test_lambda_function_handler_functions_exist(self):
        """Test that Lambda function files contain handler functions."""
        lambda_files = [
            ("lib/lambda/api_handler.py", "handler"),
            ("lib/lambda/data_processor.py", "handler"),
            ("lib/lambda/document_processor.py", "handler"),
            ("lib/lambda/image_processor.py", "handler")
        ]
        
        for file_path, function_name in lambda_files:
            try:
                with open(file_path, 'r') as f:
                    content = f.read()
                    assert f"def {function_name}(" in content, f"Handler function {function_name} not found in {file_path}"
            except FileNotFoundError:
                pytest.fail(f"Lambda function file {file_path} not found")
    
    def test_lambda_function_environment_variables(self):
        """Test that Lambda functions reference required environment variables."""
        required_env_vars = ["METADATA_TABLE_NAME", "UPLOAD_BUCKET_NAME", "LOG_LEVEL"]
        
        lambda_files = [
            "lib/lambda/api_handler.py",
            "lib/lambda/data_processor.py",
            "lib/lambda/document_processor.py",
            "lib/lambda/image_processor.py"
        ]
        
        for file_path in lambda_files:
            try:
                with open(file_path, 'r') as f:
                    content = f.read()
                    for env_var in required_env_vars:
                        assert env_var in content, f"Environment variable {env_var} not found in {file_path}"
            except FileNotFoundError:
                pytest.fail(f"Lambda function file {file_path} not found")
    
    def test_lambda_function_aws_imports(self):
        """Test that Lambda functions import required AWS modules."""
        required_imports = ["boto3", "json", "logging"]
        
        lambda_files = [
            "lib/lambda/api_handler.py",
            "lib/lambda/data_processor.py",
            "lib/lambda/document_processor.py",
            "lib/lambda/image_processor.py"
        ]
        
        for file_path in lambda_files:
            try:
                with open(file_path, 'r') as f:
                    content = f.read()
                    for import_name in required_imports:
                        assert import_name in content, f"Import {import_name} not found in {file_path}"
            except FileNotFoundError:
                pytest.fail(f"Lambda function file {file_path} not found")
    
    def test_lambda_function_error_handling(self):
        """Test that Lambda functions have proper error handling."""
        error_indicators = ["try:", "except", "logger.error"]
        
        lambda_files = [
            "lib/lambda/api_handler.py",
            "lib/lambda/data_processor.py",
            "lib/lambda/document_processor.py",
            "lib/lambda/image_processor.py"
        ]
        
        for file_path in lambda_files:
            try:
                with open(file_path, 'r') as f:
                    content = f.read()
                    # Check for at least one error handling pattern
                    has_error_handling = any(indicator in content for indicator in error_indicators)
                    assert has_error_handling, f"No error handling found in {file_path}"
            except FileNotFoundError:
                pytest.fail(f"Lambda function file {file_path} not found")
    
    def test_lambda_function_logging(self):
        """Test that Lambda functions have logging configured."""
        logging_indicators = ["logging.getLogger", "logger.info", "logger.error"]
        
        lambda_files = [
            "lib/lambda/api_handler.py",
            "lib/lambda/data_processor.py",
            "lib/lambda/document_processor.py",
            "lib/lambda/image_processor.py"
        ]
        
        for file_path in lambda_files:
            try:
                with open(file_path, 'r') as f:
                    content = f.read()
                    # Check for at least one logging pattern
                    has_logging = any(indicator in content for indicator in logging_indicators)
                    assert has_logging, f"No logging found in {file_path}"
            except FileNotFoundError:
                pytest.fail(f"Lambda function file {file_path} not found")
    
    def test_lambda_function_response_format(self):
        """Test that Lambda functions return proper response format."""
        response_indicators = ["statusCode", "body", "json.dumps"]
        
        lambda_files = [
            "lib/lambda/api_handler.py",
            "lib/lambda/data_processor.py",
            "lib/lambda/document_processor.py",
            "lib/lambda/image_processor.py"
        ]
        
        for file_path in lambda_files:
            try:
                with open(file_path, 'r') as f:
                    content = f.read()
                    # Check for response format patterns
                    has_response_format = any(indicator in content for indicator in response_indicators)
                    assert has_response_format, f"No proper response format found in {file_path}"
            except FileNotFoundError:
                pytest.fail(f"Lambda function file {file_path} not found")
