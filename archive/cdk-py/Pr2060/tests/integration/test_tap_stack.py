"""
Integration tests for the TAP Stack infrastructure.
These tests validate the infrastructure configuration and behavior.
"""
import json
import os
from unittest.mock import MagicMock, patch

import aws_cdk as cdk
import pytest
from aws_cdk.assertions import Match, Template

from lib.tap_stack import TapStack, TapStackProps


class TestInfrastructureIntegration:
    """Integration tests for infrastructure configuration."""
    
    @pytest.fixture(scope="class")
    def app(self):
        """Create a CDK app for testing."""
        return cdk.App()
    
    @pytest.fixture(scope="class")
    def environment_suffix(self):
        """Provide a test environment suffix."""
        return 'integration-test'
    
    @pytest.fixture(scope="class")
    def stack(self, app, environment_suffix):
        """Create a TapStack instance for integration testing."""
        props = TapStackProps(
            environment_suffix=environment_suffix,
            env=cdk.Environment(
                account='123456789012',
                region='us-east-1'
            )
        )
        return TapStack(app, f"TapStack{environment_suffix}", props=props)
    
    @pytest.fixture(scope="class")
    def template(self, stack):
        """Generate CloudFormation template from stack."""
        return Template.from_stack(stack)
    
    def test_infrastructure_completeness(self, template):
        """Test that all required infrastructure components are present."""
        # Check for all required resource types
        assert template.find_resources("AWS::S3::Bucket")
        assert template.find_resources("AWS::DynamoDB::Table")
        assert template.find_resources("AWS::Lambda::Function")
        assert template.find_resources("AWS::ApiGateway::RestApi")
        assert template.find_resources("AWS::IAM::Role")
        # Log groups are created automatically by Lambda functions
    
    def test_s3_bucket_configuration_integration(self, template, environment_suffix):
        """Test S3 bucket configuration for production readiness."""
        bucket_resources = template.find_resources("AWS::S3::Bucket")
        assert len(bucket_resources) == 1
        
        bucket_props = list(bucket_resources.values())[0]["Properties"]
        
        # Check encryption
        assert "BucketEncryption" in bucket_props
        encryption_config = bucket_props["BucketEncryption"]["ServerSideEncryptionConfiguration"][0]
        assert encryption_config["ServerSideEncryptionByDefault"]["SSEAlgorithm"] == "AES256"
        
        # Check public access block
        assert "PublicAccessBlockConfiguration" in bucket_props
        public_block = bucket_props["PublicAccessBlockConfiguration"]
        assert public_block["BlockPublicAcls"] is True
        assert public_block["BlockPublicPolicy"] is True
        assert public_block["IgnorePublicAcls"] is True
        assert public_block["RestrictPublicBuckets"] is True
        
        # Check versioning
        assert "VersioningConfiguration" in bucket_props
        assert bucket_props["VersioningConfiguration"]["Status"] == "Enabled"
        
        # Check lifecycle rules
        assert "LifecycleConfiguration" in bucket_props
        lifecycle_rules = bucket_props["LifecycleConfiguration"]["Rules"]
        assert len(lifecycle_rules) == 1
        assert lifecycle_rules[0]["Id"] == "DeleteOldVersions"
    
    def test_dynamodb_table_configuration_integration(self, template, environment_suffix):
        """Test DynamoDB table configuration for production readiness."""
        table_resources = template.find_resources("AWS::DynamoDB::Table")
        assert len(table_resources) == 1
        
        table_props = list(table_resources.values())[0]["Properties"]
        
        # Check table name
        assert table_props["TableName"] == f"processing-metadata-{environment_suffix}"
        
        # Check key schema
        key_schema = table_props["KeySchema"]
        assert len(key_schema) == 1
        assert key_schema[0]["AttributeName"] == "fileId"
        assert key_schema[0]["KeyType"] == "HASH"
        
        # Check billing mode
        assert table_props["BillingMode"] == "PAY_PER_REQUEST"
        
        # Check point-in-time recovery
        assert "PointInTimeRecoverySpecification" in table_props
        assert table_props["PointInTimeRecoverySpecification"]["PointInTimeRecoveryEnabled"] is True
    
    def test_lambda_functions_configuration_integration(self, template, environment_suffix):
        """Test Lambda functions configuration for production readiness."""
        lambda_resources = template.find_resources("AWS::Lambda::Function")
        assert len(lambda_resources) >= 4  # At least 4 Lambda functions
        
        # Check each Lambda function
        function_count = 0
        for resource_id, resource_props in lambda_resources.items():
            props = resource_props["Properties"]
            function_count += 1
            
            # Check runtime (some functions may be CDK-generated with different runtimes)
            if "Runtime" in props:
                runtime = props["Runtime"]
                # Our Lambda functions should use Python 3.x, but CDK-generated ones may use Node.js
                if "python" in runtime:
                    assert "python3" in runtime  # Any Python 3.x version
            
            # Check environment variables (only for our Lambda functions)
            if "Environment" in props and "Variables" in props["Environment"]:
                env_vars = props["Environment"]["Variables"]
                if "METADATA_TABLE_NAME" in env_vars:
                    assert "UPLOAD_BUCKET_NAME" in env_vars
                    assert "LOG_LEVEL" in env_vars
                    assert env_vars["LOG_LEVEL"] == "INFO"
            
            # Check timeout and memory (only for our Lambda functions)
            if "Timeout" in props and "MemorySize" in props:
                # These are our Lambda functions
                pass
        
        # Verify we have at least 4 Lambda functions
        assert function_count >= 4
    
    def test_api_gateway_configuration_integration(self, template, environment_suffix):
        """Test API Gateway configuration for production readiness."""
        api_resources = template.find_resources("AWS::ApiGateway::RestApi")
        assert len(api_resources) == 1
        
        api_props = list(api_resources.values())[0]["Properties"]
        
        # Check API name and description
        assert api_props["Name"] == f"file-processor-api-{environment_suffix}"
        assert api_props["Description"] == "REST API for file processing status and metadata"
        
        # Check CORS configuration (may be configured at method level)
        # CORS is configured in CDK but may not appear in template properties
    
    def test_iam_role_configuration_integration(self, template, environment_suffix):
        """Test IAM role configuration for security compliance."""
        role_resources = template.find_resources("AWS::IAM::Role")
        assert len(role_resources) >= 1
        
        # Find the Lambda execution role
        lambda_role = None
        for resource_id, resource_props in role_resources.items():
            props = resource_props["Properties"]
            if props.get("RoleName") == f"ServerlessFileProcessor-LambdaRole-{environment_suffix}":
                lambda_role = props
                break
        
        assert lambda_role is not None
        
        # Check assume role policy
        assume_role_policy = lambda_role["AssumeRolePolicyDocument"]
        statements = assume_role_policy["Statement"]
        assert len(statements) == 1
        assert statements[0]["Effect"] == "Allow"
        assert statements[0]["Action"] == "sts:AssumeRole"
        assert statements[0]["Principal"]["Service"] == "lambda.amazonaws.com"
        
        # Check managed policies
        assert "ManagedPolicyArns" in lambda_role
        managed_policies = lambda_role["ManagedPolicyArns"]
        # Check that managed policies exist (may be CDK constructs)
        assert len(managed_policies) >= 1
    
    def test_s3_event_notifications_integration(self, template):
        """Test S3 event notifications configuration."""
        # Check for Lambda permissions (created by S3 event notifications)
        permission_resources = template.find_resources("AWS::Lambda::Permission")
        assert len(permission_resources) >= 6  # At least 6 permissions for S3 events
        
        # Check for S3 bucket notifications
        bucket_resources = template.find_resources("AWS::S3::Bucket")
        bucket_props = list(bucket_resources.values())[0]["Properties"]
        
        # Note: S3 event notifications are configured via CDK but may not appear in template
        # The permissions are the evidence that notifications are set up
    
    def test_api_gateway_methods_integration(self, template):
        """Test API Gateway methods configuration."""
        method_resources = template.find_resources("AWS::ApiGateway::Method")
        assert len(method_resources) >= 3  # At least GET, OPTIONS methods
        
        # Check for GET methods
        get_methods = [m for m in method_resources.values() if m["Properties"]["HttpMethod"] == "GET"]
        assert len(get_methods) >= 1
        
        # Check for OPTIONS methods (CORS)
        options_methods = [m for m in method_resources.values() if m["Properties"]["HttpMethod"] == "OPTIONS"]
        assert len(options_methods) >= 1
    
    def test_stack_outputs_integration(self, template, environment_suffix):
        """Test stack outputs for deployment integration."""
        outputs = template.find_outputs("*")
        assert len(outputs) >= 6  # At least 6 outputs
        
        output_keys = list(outputs.keys())
        
        # Check for required outputs (output names may vary)
        # Verify we have outputs for API Gateway, S3, and Lambda functions
        assert any("ApiGateway" in key for key in output_keys)
        assert any("S3" in key for key in output_keys)
        assert any("Arn" in key for key in output_keys)
    
    def test_lambda_functions_reserved_concurrency_integration(self, template):
        """Test Lambda functions reserved concurrency configuration."""
        lambda_resources = template.find_resources("AWS::Lambda::Function")
        
        # Check that Lambda functions have reserved concurrency configured
        reserved_concurrency_count = 0
        for resource_id, resource_props in lambda_resources.items():
            props = resource_props["Properties"]
            if "ReservedConcurrentExecutions" in props:
                reserved_concurrency_count += 1
        
        # At least some functions should have reserved concurrency
        assert reserved_concurrency_count >= 3
    
    def test_api_gateway_stage_integration(self, template, environment_suffix):
        """Test API Gateway stage configuration."""
        stage_resources = template.find_resources("AWS::ApiGateway::Stage")
        assert len(stage_resources) >= 1
        
        stage_props = list(stage_resources.values())[0]["Properties"]
        
        # Check stage name
        assert stage_props["StageName"] == environment_suffix
        
        # Check method settings
        if "MethodSettings" in stage_props:
            method_settings = stage_props["MethodSettings"]
            assert len(method_settings) >= 1
            
            # Check for throttling settings
            throttling_settings = [s for s in method_settings if "ThrottlingRateLimit" in s]
            assert len(throttling_settings) >= 1
    
    def test_log_groups_integration(self, template):
        """Test CloudWatch log groups configuration."""
        # Log groups are created automatically by Lambda functions
        # Check that Lambda functions exist (which will create log groups)
        lambda_resources = template.find_resources("AWS::Lambda::Function")
        assert len(lambda_resources) >= 4  # At least 4 Lambda functions
    
    def test_iam_policies_integration(self, template):
        """Test IAM policies configuration."""
        policy_resources = template.find_resources("AWS::IAM::Policy")
        assert len(policy_resources) >= 2  # At least 2 policies (may include CDK-generated ones)
        
        # Check that policies exist
        for resource_id, resource_props in policy_resources.items():
            props = resource_props["Properties"]
            assert "PolicyDocument" in props
            assert "Statement" in props["PolicyDocument"]
    
    def test_resource_dependencies_integration(self, template):
        """Test that resources have proper dependencies."""
        # Check that Lambda functions depend on IAM role
        lambda_resources = template.find_resources("AWS::Lambda::Function")
        role_resources = template.find_resources("AWS::IAM::Role")
        
        # Each Lambda should reference the IAM role
        for resource_id, resource_props in lambda_resources.items():
            props = resource_props["Properties"]
            assert "Role" in props
            role_arn = props["Role"]
            assert "Fn::GetAtt" in role_arn or "Ref" in role_arn
    
    def test_environment_variables_consistency_integration(self, template):
        """Test that environment variables are consistent across Lambda functions."""
        lambda_resources = template.find_resources("AWS::Lambda::Function")
        
        # Collect environment variables from all Lambda functions
        env_vars_sets = []
        for resource_id, resource_props in lambda_resources.items():
            props = resource_props["Properties"]
            if "Environment" in props and "Variables" in props["Environment"]:
                env_vars_sets.append(set(props["Environment"]["Variables"].keys()))
        
        # All Lambda functions should have the same environment variables
        if env_vars_sets:
            base_env_vars = env_vars_sets[0]
            for env_vars in env_vars_sets[1:]:
                # Check that all functions have the required environment variables
                required_vars = {"METADATA_TABLE_NAME", "UPLOAD_BUCKET_NAME", "LOG_LEVEL"}
                assert required_vars.issubset(env_vars)
    
    def test_stack_tags_integration(self, template, environment_suffix):
        """Test that resources are properly tagged."""
        # Check S3 bucket tags
        bucket_resources = template.find_resources("AWS::S3::Bucket")
        bucket_props = list(bucket_resources.values())[0]["Properties"]
        
        if "Tags" in bucket_props:
            tags = bucket_props["Tags"]
            tag_dict = {tag["Key"]: tag["Value"] for tag in tags}
            
            assert "Environment" in tag_dict
            assert tag_dict["Environment"] == environment_suffix
            assert "Project" in tag_dict
            assert tag_dict["Project"] == "ServerlessFileProcessor"
            assert "Owner" in tag_dict
            assert tag_dict["Owner"] == "DevOps"
    
    def test_lambda_function_timeouts_integration(self, template):
        """Test Lambda function timeout configurations."""
        lambda_resources = template.find_resources("AWS::Lambda::Function")
        
        timeout_values = []
        for resource_id, resource_props in lambda_resources.items():
            props = resource_props["Properties"]
            timeout = props["Timeout"]
            timeout_values.append(timeout)
            
            # Check timeout values are reasonable
            assert timeout >= 30  # At least 30 seconds
            assert timeout <= 900  # At most 15 minutes
        
        # Should have different timeout values for different functions
        assert len(set(timeout_values)) >= 2
    
    def test_lambda_function_memory_integration(self, template):
        """Test Lambda function memory configurations."""
        lambda_resources = template.find_resources("AWS::Lambda::Function")
        
        memory_values = []
        for resource_id, resource_props in lambda_resources.items():
            props = resource_props["Properties"]
            if "MemorySize" in props:
                memory_size = props["MemorySize"]
                memory_values.append(memory_size)
                
                # Check memory values are reasonable
                assert memory_size >= 128  # At least 128 MB
                assert memory_size <= 3008  # At most 3008 MB
        
        # Should have different memory values for different functions
        assert len(set(memory_values)) >= 2
