# """
# Integration tests for deployed infrastructure.
# These tests verify that the infrastructure was deployed correctly.
# """
# import os
# import boto3
# import pytest


# @pytest.fixture
# def environment_suffix():
#     """Get the environment suffix from environment variables."""
#     return os.environ.get('ENVIRONMENT_SUFFIX', 'dev')


# @pytest.fixture
# def aws_region():
#     """Get the AWS region."""
#     return os.environ.get('AWS_REGION', 'us-east-1')


# @pytest.fixture
# def s3_client():
#     """Create S3 client."""
#     return boto3.client('s3')


# @pytest.fixture
# def iam_client():
#     """Create IAM client.""" 
#     return boto3.client('iam')


# @pytest.fixture
# def lambda_client():
#     """Create Lambda client."""
#     return boto3.client('lambda', region_name='us-west-2')


# def test_artifacts_bucket_exists(s3_client, environment_suffix):
#     """Test that the artifacts bucket was created."""
#     bucket_name = f"dev-artifacts-bucket-{environment_suffix}"
    
#     try:
#         response = s3_client.head_bucket(Bucket=bucket_name)
#         assert response['ResponseMetadata']['HTTPStatusCode'] == 200
#         print(f"✅ Artifacts bucket {bucket_name} exists")
#     except Exception as e:
#         pytest.fail(f"Artifacts bucket {bucket_name} does not exist: {e}")


# def test_deployment_bucket_exists(s3_client, environment_suffix):
#     """Test that the deployment packages bucket was created."""
#     bucket_name = f"dev-deployment-packages-{environment_suffix}"
    
#     try:
#         response = s3_client.head_bucket(Bucket=bucket_name)
#         assert response['ResponseMetadata']['HTTPStatusCode'] == 200
#         print(f"✅ Deployment bucket {bucket_name} exists")
#     except Exception as e:
#         pytest.fail(f"Deployment bucket {bucket_name} does not exist: {e}")


# def test_lambda_execution_role_exists(iam_client, environment_suffix):
#     """Test that the Lambda execution role was created."""
#     role_name = f"dev-lambda-execution-role-{environment_suffix}"
    
#     try:
#         response = iam_client.get_role(RoleName=role_name)
#         assert response['Role']['RoleName'] == role_name
#         print(f"✅ Lambda execution role {role_name} exists")
#     except Exception as e:
#         pytest.fail(f"Lambda execution role {role_name} does not exist: {e}")


# def test_cicd_service_role_exists(iam_client, environment_suffix):
#     """Test that the CI/CD service role was created."""
#     role_name = f"dev-cicd-service-role-{environment_suffix}"
    
#     try:
#         response = iam_client.get_role(RoleName=role_name)
#         assert response['Role']['RoleName'] == role_name
#         print(f"✅ CI/CD service role {role_name} exists")
#     except Exception as e:
#         pytest.fail(f"CI/CD service role {role_name} does not exist: {e}")


# def test_deployment_automation_function_exists(lambda_client, environment_suffix):
#     """Test that the deployment automation Lambda function was created."""
#     function_name = f"dev-deployment-automation-{environment_suffix}"
    
#     try:
#         response = lambda_client.get_function(FunctionName=function_name)
#         assert response['Configuration']['FunctionName'] == function_name
#         print(f"✅ Deployment automation function {function_name} exists")
#     except Exception as e:
#         pytest.fail(f"Deployment automation function {function_name} does not exist: {e}")


# def test_pipeline_trigger_function_exists(lambda_client, environment_suffix):
#     """Test that the pipeline trigger Lambda function was created."""
#     function_name = f"dev-pipeline-trigger-{environment_suffix}"
    
#     try:
#         response = lambda_client.get_function(FunctionName=function_name)
#         assert response['Configuration']['FunctionName'] == function_name
#         print(f"✅ Pipeline trigger function {function_name} exists")
#     except Exception as e:
#         pytest.fail(f"Pipeline trigger function {function_name} does not exist: {e}")


# def test_environment_variables():
#     """Test that required environment variables are set."""
#     required_vars = ['ENVIRONMENT_SUFFIX', 'AWS_REGION']
    
#     for var in required_vars:
#         value = os.environ.get(var)
#         assert value is not None, f"Environment variable {var} is not set"
#         assert value != "", f"Environment variable {var} is empty"
#         print(f"✅ Environment variable {var} = {value}")


# @pytest.mark.skipif(
#     os.environ.get('CI') != '1',
#     reason="Only run in CI environment"
# )
# def test_ci_environment():
#     """Test that we're running in CI environment."""
#     assert os.environ.get('CI') == '1'
#     print("✅ Running in CI environment")


"""
test_tap_stack_integration.py

Integration tests for live deployed TapStack Pulumi infrastructure.
Tests actual AWS resources created by the Pulumi stack.
"""

import unittest
import os
import boto3
import pulumi
from pulumi import automation as auto

"""
test_tap_stack_integration.py

Integration tests for live deployed TapStack Pulumi infrastructure.
Tests actual AWS resources created by the Pulumi stack.
"""


# class TestTapStackLiveIntegration(unittest.TestCase):
#   """Integration tests against live deployed Pulumi stack."""

#   def setUp(self):
#     """Set up integration test with live stack."""
#     self.stack_name = "dev"  # Your live Pulumi stack name (just the env part)
#     self.project_name = "tap-infra"  # Your Pulumi project name
#     self.s3_client = boto3.client('s3')
    
#     # Configure Pulumi to use S3 backend (not Pulumi Cloud)
#     self.pulumi_backend_url = os.getenv('PULUMI_BACKEND_URL', 's3://iac-rlhf-pulumi-states')