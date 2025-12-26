# pylint: disable=no-member,missing-function-docstring

import os
import unittest
import requests
import boto3
import base64
from pulumi import automation as auto
from pulumi.automation import LocalWorkspace, Stack




class TestTapStackDeployedResources(unittest.TestCase):
    """Test AWS resources after Pulumi stack is deployed."""

    @classmethod
    def setUpClass(cls):
        cls.stack_name = os.getenv("PULUMI_STACK", "localstack")
        cls.project_name = os.getenv("PULUMI_PROJECT", "TapStack")
        cls.region = os.getenv("AWS_REGION", "us-west-2")

        os.environ["AWS_REGION"] = cls.region

        # When running with LocalStack, the integration test script sets AWS_ACCESS_KEY_ID=test
        # But Pulumi needs real AWS credentials to access the S3 backend where state is stored.
        # We need to temporarily restore real credentials for Pulumi, then set LocalStack credentials for boto3 clients.

        # Save LocalStack test credentials if present
        localstack_access_key = os.getenv("AWS_ACCESS_KEY_ID", "")
        localstack_secret_key = os.getenv("AWS_SECRET_ACCESS_KEY", "")

        # Check if we're running with LocalStack test credentials
        is_localstack = localstack_access_key == "test" and localstack_secret_key == "test"

        if is_localstack:
            # For LocalStack environments, we need real credentials for Pulumi S3 backend access
            # The CI/CD workflow should set these as REAL_AWS_* environment variables
            real_access_key = os.getenv("REAL_AWS_ACCESS_KEY_ID", "")
            real_secret_key = os.getenv("REAL_AWS_SECRET_ACCESS_KEY", "")

            if real_access_key and real_secret_key:
                # Temporarily use real credentials for Pulumi backend access
                os.environ["AWS_ACCESS_KEY_ID"] = real_access_key
                os.environ["AWS_SECRET_ACCESS_KEY"] = real_secret_key
                print("Using real AWS credentials for Pulumi S3 backend access")

        # Use Automation API to select the stack
        ws = auto.LocalWorkspace(work_dir=os.getcwd())
        cls.stack = auto.select_stack(stack_name=cls.stack_name, work_dir=os.getcwd())

        # Restore LocalStack test credentials for boto3 clients
        if is_localstack:
            os.environ["AWS_ACCESS_KEY_ID"] = localstack_access_key
            os.environ["AWS_SECRET_ACCESS_KEY"] = localstack_secret_key
            print("Restored LocalStack test credentials for boto3 clients")

        # Fetch outputs
        outputs = cls.stack.outputs()
        cls.vpc_id = outputs.get("vpc_id").value if outputs.get("vpc_id") else None
        cls.sg_id = outputs.get("security_group_id").value if outputs.get("security_group_id") else None
        cls.user_arn = outputs.get("iam_user_arn").value if outputs.get("iam_user_arn") else None
        cls.access_key_id = outputs.get("access_key_id").value if outputs.get("access_key_id") else None
        cls.kms_key_id = outputs.get("kms_key_id").value if outputs.get("kms_key_id") else None
        cls.kms_alias = outputs.get("kms_alias").value if outputs.get("kms_alias") else None


        # Configure boto3 clients with LocalStack endpoint if available
        aws_endpoint = os.getenv("AWS_ENDPOINT_URL", "")
        client_config = {"region_name": cls.region}

        if aws_endpoint:
            client_config["endpoint_url"] = aws_endpoint
            print(f"Using AWS endpoint: {aws_endpoint}")

        cls.ec2 = boto3.client("ec2", **client_config)
        cls.iam = boto3.client("iam", **client_config)
        cls.kms = boto3.client("kms", **client_config)

if __name__ == "__main__":
    unittest.main()
