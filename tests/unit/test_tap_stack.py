"""
Unit tests for the TAP Stack infrastructure components.
"""
import os
import json
import pytest
from unittest.mock import patch, MagicMock
import aws_cdk as cdk
from aws_cdk.assertions import Template, Match
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
            "BucketName": Match.string_like_regexp(f"serverless-file-processor-{environment_suffix}-.*"),
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
            "Handler": "image_processor.handler",
            "MemorySize": 512,
            "Timeout": 300,
            "ReservedConcurrentExecutions": 10
        })
        
        # Document processor
        template.has_resource_properties("AWS::Lambda::Function", {
            "FunctionName": f"document-processor-{environment_suffix}",
            "Runtime": "python3.12",
            "Handler": "document_processor.handler",
            "MemorySize": 1024,
            "Timeout": 600,
            "ReservedConcurrentExecutions": 5
        })
        
        # Data processor
        template.has_resource_properties("AWS::Lambda::Function", {
            "FunctionName": f"data-processor-{environment_suffix}",
            "Runtime": "python3.12",
            "Handler": "data_processor.handler",
            "MemorySize": 2048,
            "Timeout": 900,
            "ReservedConcurrentExecutions": 3
        })
        
        # API handler
        template.has_resource_properties("AWS::Lambda::Function", {
            "FunctionName": f"api-function-{environment_suffix}",
            "Runtime": "python3.12",
            "Handler": "api_handler.handler",
            "MemorySize": 256,
            "Timeout": 30
        })
    
    def test_stack_creates_api_gateway(self, template, environment_suffix):
        """Test that API Gateway is created with correct configuration."""
        template.has_resource_properties("AWS::ApiGateway::RestApi", {
            "Name": f"file-processor-api-{environment_suffix}",
            "Description": "REST API for file processing status and metadata"
        })
    
    def test_stack_creates_iam_role(self, template, environment_suffix):
        """Test that IAM role is created with correct policies."""
        template.has_resource_properties("AWS::IAM::Role", {
            "RoleName": f"ServerlessFileProcessor-LambdaRole-{environment_suffix}",
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
        })
    
    def test_stack_has_outputs(self, template):
        """Test that stack has required outputs."""
        outputs = template.find_outputs("*")
        output_keys = list(outputs.keys())
        
        # Check for required output patterns
        assert any("ApiGatewayUrl" in key for key in output_keys)
        assert any("S3BucketName" in key for key in output_keys)
        assert any("ImageProcessorArn" in key for key in output_keys)
        assert any("DocumentProcessorArn" in key for key in output_keys)
        assert any("DataProcessorArn" in key for key in output_keys)
        assert any("ApiHandlerArn" in key for key in output_keys)
    
    def test_stack_tags_resources(self, stack, environment_suffix):
        """Test that resources are properly tagged."""
        # Tags are applied at the stack level
        assert stack.tags.tag_values()['Environment'] == environment_suffix
        assert stack.tags.tag_values()['Project'] == 'ServerlessFileProcessor'
        assert stack.tags.tag_values()['Owner'] == 'DevOps'
    
    def test_s3_bucket_lifecycle_rules(self, template):
        """Test that S3 bucket has proper lifecycle rules."""
        template.has_resource_properties("AWS::S3::Bucket", {
            "LifecycleConfiguration": {
                "Rules": [
                    {
                        "Id": "DeleteOldVersions",
                        "NoncurrentVersionExpirationInDays": 30,
                        "AbortIncompleteMultipartUpload": {
                            "DaysAfterInitiation": 1
                        },
                        "Status": "Enabled"
                    }
                ]
            }
        })
    
    def test_lambda_environment_variables(self, template):
        """Test that Lambda functions have correct environment variables."""
        # Find all Lambda functions and check they have environment variables
        template.resource_count_is("AWS::Lambda::Function", 4)
        
        # Each Lambda should have these environment variables
        for _ in range(4):
            template.has_resource_properties("AWS::Lambda::Function", {
                "Environment": {
                    "Variables": Match.object_like({
                        "METADATA_TABLE_NAME": Match.any_value(),
                        "UPLOAD_BUCKET_NAME": Match.any_value(),
                        "LOG_LEVEL": "INFO"
                    })
                }
            })
    
    def test_s3_event_notifications(self, template):
        """Test that S3 bucket has event notifications configured."""
        # Check for Lambda permissions for S3 to invoke functions
        template.resource_count_is("AWS::Lambda::Permission", 6)  # 2 for images, 2 for docs, 2 for data
    
    def test_api_gateway_cors_configuration(self, template):
        """Test that API Gateway has CORS properly configured."""
        # API Gateway should have OPTIONS methods for CORS
        template.has_resource("AWS::ApiGateway::Method", {
            "Properties": {
                "HttpMethod": "OPTIONS"
            }
        })
    
    def test_removal_policies(self, template):
        """Test that resources have DESTROY removal policy for non-production."""
        # S3 bucket should have retain policy set to Delete/Destroy
        template.has_resource("AWS::S3::Bucket", {
            "DeletionPolicy": "Delete"
        })
        
        # DynamoDB table should have retain policy set to Delete/Destroy
        template.has_resource("AWS::DynamoDB::Table", {
            "DeletionPolicy": "Delete"
        })
    
    def test_lambda_retry_configuration(self, stack):
        """Test that Lambda functions have retry configuration."""
        # Verify retry attempts are configured
        assert stack.image_processor.retry_attempts == 2
        assert stack.document_processor.retry_attempts == 2
        assert stack.data_processor.retry_attempts == 2
    
    def test_api_gateway_throttling(self, template):
        """Test that API Gateway has throttling configured."""
        template.has_resource_properties("AWS::ApiGateway::Stage", {
            "MethodSettings": Match.array_with([
                Match.object_like({
                    "ThrottlingRateLimit": 100,
                    "ThrottlingBurstLimit": 200
                })
            ])
        })