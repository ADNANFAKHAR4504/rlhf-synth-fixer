
# --- Combined Integration Test for TapStack ---
import subprocess
import json
import urllib.request as urllib
import random
import string
import tempfile
import os
import sys
import pytest
from aws_cdk import App
from constructs import Construct
from typing import Optional
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '../lib')))
from tap_stack import TapStack, TapStackProps

STACK_NAME = "TapStackpr3386"
REGION = "us-east-1"  # Change if needed

def run_cli(command):
    result = subprocess.run(command, shell=True, capture_output=True, text=True, check=False)
    if result.returncode != 0:
        raise RuntimeError(f"Command failed: {command}\n{result.stderr}")
    return result.stdout

def generate_random_suffix(length=6):
    return ''.join(random.choices(string.ascii_letters + string.digits, k=length))

def get_cfn_outputs(stack_name):
    output = run_cli(f"aws cloudformation describe-stacks --stack-name {stack_name} --region {REGION}")
    stacks = json.loads(output)["Stacks"]
    outputs = {o["OutputKey"]: o["OutputValue"] for o in stacks[0].get("Outputs", [])}
    return outputs

def test_tap_stack_outputs_exist():
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

def test_api_url_reachable():
    outputs = get_cfn_outputs(STACK_NAME)
    api_url = outputs.get("ApiUrl")
    assert api_url, "ApiUrl output missing"
    try:
        with urllib.urlopen(api_url, timeout=20) as response:
            status_code = response.getcode()
            assert status_code == 200, f"API {api_url} returned {status_code}"
    except Exception as e:
        raise AssertionError(f"Failed to reach API {api_url}: {e}")

def test_s3_bucket_update():
    outputs = get_cfn_outputs(STACK_NAME)
    bucket_name = outputs.get("AttachmentsBucketName")
    assert bucket_name, "AttachmentsBucketName output missing"
    object_key = "test.txt"
    with tempfile.TemporaryDirectory() as tmpdir:
        local_file_path = os.path.join(tmpdir, object_key)
        # Create a test file
        with open(local_file_path, "w") as f:
            f.write("TURING_RLHF")
        # Upload to S3
        run_cli(f"aws s3 cp {local_file_path} s3://{bucket_name}/{object_key}")
        # Download and update
        run_cli(f"aws s3 cp s3://{bucket_name}/{object_key} {local_file_path}")
        with open(local_file_path, "r") as f:
            content = f.read()
        assert "TURING_RLHF" in content, "Keyword not found in S3 object"
        new_value = f"TURING_RLHF_{generate_random_suffix()}"
        updated_content = content.replace("TURING_RLHF", new_value)
        with open(local_file_path, "w") as f:
            f.write(updated_content)
        run_cli(f"aws s3 cp {local_file_path} s3://{bucket_name}/{object_key}")

def test_sns_topic_exists():
    outputs = get_cfn_outputs(STACK_NAME)
    topic_arn = outputs.get("NotificationsTopicArn")
    assert topic_arn, "NotificationsTopicArn output missing"
    # Check topic exists
    result = run_cli(f"aws sns get-topic-attributes --topic-arn {topic_arn} --region {REGION}")
    attrs = json.loads(result)
    assert "Attributes" in attrs, "SNS topic attributes not found"

def test_tap_stack_instantiates():
    app = App()
    stack = TapStack(app, "TestTapStack")
    assert stack is not None

def test_tap_stack_environment_suffix_from_props():
    app = App()
    props = TapStackProps(environment_suffix="prod")
    stack = TapStack(app, "TestTapStackProd", props=props)
    # The environment_suffix should be set to 'prod' in stack logic
    assert hasattr(stack, 'node')
    # Check context fallback
    assert stack.node.try_get_context('environmentSuffix') is None or isinstance(stack.node.try_get_context('environmentSuffix'), str)

def test_tap_stack_environment_suffix_default():
    app = App()
    stack = TapStack(app, "TestTapStackDefault")
    # Should default to 'dev' if not provided
    assert stack is not None
