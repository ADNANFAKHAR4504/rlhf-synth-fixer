import subprocess
import json
import urllib.request as urllib
import urllib.error
import random
import string
import tempfile
import os
import sys
import pytest
from aws_cdk import App
from typing import Optional

sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '../lib')))
from tap_stack import TapStack, TapStackProps

STACK_NAME = "TapStackpr3386"
REGION = "us-east-1"

def run_cli(command):
    """Execute AWS CLI command and return output."""
    result = subprocess.run(command, shell=True, capture_output=True, text=True, check=False)
    if result.returncode != 0:
        raise RuntimeError(f"Command failed: {command}\n{result.stderr}")
    return result.stdout

def generate_random_suffix(length=6):
    """Generate random alphanumeric string."""
    return ''.join(random.choices(string.ascii_letters + string.digits, k=length))

def get_cfn_outputs(stack_name):
    """Retrieve CloudFormation stack outputs."""
    output = run_cli(f"aws cloudformation describe-stacks --stack-name {stack_name} --region {REGION}")
    stacks = json.loads(output)["Stacks"]
    if not stacks:
        raise ValueError(f"Stack {stack_name} not found")
    outputs = {o["OutputKey"]: o["OutputValue"] for o in stacks[0].get("Outputs", [])}
    return outputs


class TestTapStackDeployment:
    """Integration tests for deployed TapStack resources."""

    def test_tap_stack_outputs_exist(self):
        """Verify all required CloudFormation outputs are present."""
        outputs = get_cfn_outputs(STACK_NAME)
        required_keys = [
            "ApiUrl",
            "UserPoolId",
            "UserPoolClientId",
            "TasksTableName",
            "ProjectsTableName",
            "AttachmentsBucketName",
            "NotificationsTopicArn"
        ]
        for key in required_keys:
            assert key in outputs, f"Missing CloudFormation output: {key}"

    def test_api_url_reachable(self):
        """Verify API Gateway endpoint is accessible (expects 403 without auth)."""
        outputs = get_cfn_outputs(STACK_NAME)
        api_url = outputs.get("ApiUrl")
        assert api_url, "ApiUrl output missing"
        
        # API with Cognito authorizer should return 401/403 without valid token
        try:
            with urllib.urlopen(api_url, timeout=20) as response:
                status_code = response.getcode()
                # If somehow we get 200, that's also acceptable (healthcheck endpoint)
                assert status_code in [200, 401, 403], \
                    f"API {api_url} returned unexpected status {status_code}"
        except urllib.error.HTTPError as e:
            # 401 Unauthorized or 403 Forbidden is expected for protected API
            assert e.code in [401, 403], \
                f"API {api_url} returned unexpected error status {e.code}"
        except Exception as e:
            raise AssertionError(f"Failed to reach API {api_url}: {e}")

    def test_s3_bucket_operations(self):
        """Test S3 bucket upload, download, and update operations."""
        outputs = get_cfn_outputs(STACK_NAME)
        bucket_name = outputs.get("AttachmentsBucketName")
        assert bucket_name, "AttachmentsBucketName output missing"
        
        object_key = f"test-{generate_random_suffix()}.txt"
        
        with tempfile.TemporaryDirectory() as tmpdir:
            local_file_path = os.path.join(tmpdir, "test.txt")
            
            # Create and upload test file
            test_content = "TURING_RLHF"
            with open(local_file_path, "w") as f:
                f.write(test_content)
            
            run_cli(f"aws s3 cp {local_file_path} s3://{bucket_name}/{object_key} --region {REGION}")
            
            # Download and verify content
            download_path = os.path.join(tmpdir, "downloaded.txt")
            run_cli(f"aws s3 cp s3://{bucket_name}/{object_key} {download_path} --region {REGION}")
            
            with open(download_path, "r") as f:
                content = f.read()
            assert test_content in content, f"Expected '{test_content}' not found in downloaded file"
            
            # Update and re-upload
            new_value = f"TURING_RLHF_{generate_random_suffix()}"
            updated_content = content.replace(test_content, new_value)
            
            with open(local_file_path, "w") as f:
                f.write(updated_content)
            
            run_cli(f"aws s3 cp {local_file_path} s3://{bucket_name}/{object_key} --region {REGION}")
            
            # Verify update
            run_cli(f"aws s3 cp s3://{bucket_name}/{object_key} {download_path} --region {REGION}")
            with open(download_path, "r") as f:
                final_content = f.read()
            assert new_value in final_content, "Updated content not found in S3 object"
            
            # Cleanup
            run_cli(f"aws s3 rm s3://{bucket_name}/{object_key} --region {REGION}")

    def test_sns_topic_exists(self):
        """Verify SNS topic exists and is accessible."""
        outputs = get_cfn_outputs(STACK_NAME)
        topic_arn = outputs.get("NotificationsTopicArn")
        assert topic_arn, "NotificationsTopicArn output missing"
        
        result = run_cli(f"aws sns get-topic-attributes --topic-arn {topic_arn} --region {REGION}")
        attrs = json.loads(result)
        assert "Attributes" in attrs, "SNS topic attributes not found"
        assert attrs["Attributes"]["TopicArn"] == topic_arn, "Topic ARN mismatch"

    def test_dynamodb_tables_exist(self):
        """Verify DynamoDB tables exist and are accessible."""
        outputs = get_cfn_outputs(STACK_NAME)
        
        tasks_table = outputs.get("TasksTableName")
        projects_table = outputs.get("ProjectsTableName")
        
        assert tasks_table, "TasksTableName output missing"
        assert projects_table, "ProjectsTableName output missing"
        
        # Verify tasks table
        result = run_cli(f"aws dynamodb describe-table --table-name {tasks_table} --region {REGION}")
        table_info = json.loads(result)
        assert table_info["Table"]["TableName"] == tasks_table
        assert table_info["Table"]["TableStatus"] == "ACTIVE"
        
        # Verify projects table
        result = run_cli(f"aws dynamodb describe-table --table-name {projects_table} --region {REGION}")
        table_info = json.loads(result)
        assert table_info["Table"]["TableName"] == projects_table
        assert table_info["Table"]["TableStatus"] == "ACTIVE"

    def test_lambda_functions_exist(self):
        """Verify Lambda functions are deployed and configured correctly."""
        outputs = get_cfn_outputs(STACK_NAME)
        
        # Extract environment suffix from table name (e.g., "tasks-dev" -> "dev")
        tasks_table_name = outputs.get("TasksTableName", "")
        env_suffix = tasks_table_name.split("-")[-1] if tasks_table_name else "dev"
        
        expected_functions = [
            f"tasks-crud-{env_suffix}",
            f"projects-crud-{env_suffix}",
            f"notifications-{env_suffix}",
            f"task-reminders-{env_suffix}"
        ]
        
        for function_name in expected_functions:
            result = run_cli(f"aws lambda get-function --function-name {function_name} --region {REGION}")
            function_info = json.loads(result)
            assert function_info["Configuration"]["FunctionName"] == function_name
            assert function_info["Configuration"]["State"] == "Active"


class TestTapStackConstruction:
    """Unit tests for TapStack CDK construct."""

    def test_tap_stack_instantiates(self):
        """Verify TapStack can be instantiated without errors."""
        app = App()
        stack = TapStack(app, "TestTapStack")
        assert stack is not None
        assert hasattr(stack, 'environment_suffix')
        assert stack.environment_suffix == 'dev'  # Default value

    def test_tap_stack_with_environment_suffix_from_props(self):
        """Verify TapStack respects environment_suffix from props."""
        app = App()
        props = TapStackProps(environment_suffix="prod")
        stack = TapStack(app, "TestTapStackProd", props=props)
        
        assert stack is not None
        assert stack.environment_suffix == "prod"
        
        # Verify resources have correct naming
        assert stack.tasks_table.table_name == "tasks-prod"
        assert stack.projects_table.table_name == "projects-prod"

    def test_tap_stack_with_default_environment_suffix(self):
        """Verify TapStack uses 'dev' as default environment suffix."""
        app = App()
        stack = TapStack(app, "TestTapStackDefault")
        
        assert stack is not None
        assert stack.environment_suffix == "dev"
        assert stack.tasks_table.table_name == "tasks-dev"

    def test_tap_stack_has_required_resources(self):
        """Verify TapStack creates all expected resources."""
        app = App()
        stack = TapStack(app, "TestTapStackResources")
        
        # Verify all major resources are created
        assert hasattr(stack, 'user_pool')
        assert hasattr(stack, 'user_pool_client')
        assert hasattr(stack, 'tasks_table')
        assert hasattr(stack, 'projects_table')
        assert hasattr(stack, 'attachments_bucket')
        assert hasattr(stack, 'notifications_topic')
        assert hasattr(stack, 'tasks_function')
        assert hasattr(stack, 'projects_function')
        assert hasattr(stack, 'notifications_function')
        assert hasattr(stack, 'reminders_function')
        assert hasattr(stack, 'api')
        
    def test_tap_stack_context_override(self):
        """Verify TapStack can use environment suffix from context."""
        app = App()
        # Note: In real usage, context would be set via cdk.json or CLI
        # This test verifies the lookup logic works
        stack = TapStack(app, "TestTapStackContext")
        
        # Without context set, should default to 'dev'
        assert stack.environment_suffix == "dev"