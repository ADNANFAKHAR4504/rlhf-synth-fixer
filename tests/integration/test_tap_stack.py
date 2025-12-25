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



    def test_vpc_exists(self):
        if not self.vpc_id:
            self.skipTest("vpc_id not found in stack outputs")
        vpcs = self.ec2.describe_vpcs(VpcIds=[self.vpc_id])["Vpcs"]
        self.assertEqual(vpcs[0]["State"], "available")

    def test_security_group_exists(self):
        if not self.sg_id:
            self.skipTest("security_group_id not found in stack outputs")
        groups = self.ec2.describe_security_groups(GroupIds=[self.sg_id])["SecurityGroups"]
        self.assertEqual(len(groups), 1)

    def test_iam_user_exists(self):
        if not self.user_arn:
            self.skipTest("iam_user_arn not found in stack outputs")
        username = self.user_arn.split("/")[-1]
        response = self.iam.get_user(UserName=username)
        self.assertEqual(response["User"]["Arn"], self.user_arn)

    def test_kms_key_is_enabled(self):
        if not self.kms_key_id:
            self.skipTest("kms_key_id not found in stack outputs")
        key = self.kms.describe_key(KeyId=self.kms_key_id)["KeyMetadata"]
        self.assertTrue(key["Enabled"])
        self.assertIn("secure-web-key", self.kms_alias)


    def test_kms_ciphertext_resource_exists(self):
        # The ciphertext is not directly exposed by KMS, but you can check stack outputs
        encrypted_secret = self.stack.outputs().get("encrypted_app_secret")
        if not encrypted_secret:
            self.skipTest("encrypted_app_secret not found in stack outputs")

        ciphertext = encrypted_secret.value
        self.assertIsInstance(ciphertext, str)
        self.assertTrue(len(ciphertext) > 0, "Ciphertext should be non-empty string")

        # Optionally check base64-encoded pattern (KMS ciphertext is base64-encoded blob)
        try:
            base64.b64decode(ciphertext)
        except Exception as e:
            self.fail(f"Ciphertext is not valid base64: {e}")

    def test_iam_policy_contains_deny_after_expiry(self):
        if not self.user_arn:
            self.skipTest("iam_user_arn not found in stack outputs")

        username = self.user_arn.split("/")[-1]

        # List inline policies attached to user
        policies = self.iam.list_user_policies(UserName=username)["PolicyNames"]
        self.assertIn("AccessKeyRotationPolicy", policies)

        # Get policy document (returns URL-encoded JSON string)
        policy_document_response = self.iam.get_user_policy(
            UserName=username,
            PolicyName="AccessKeyRotationPolicy"
        )
        policy_document = policy_document_response["PolicyDocument"]

        # policy_document is already a dict, check statements
        statements = {stmt["Sid"]: stmt for stmt in policy_document.get("Statement", [])}

        self.assertIn("DenyAllActionsAfterExpiry", statements)

        deny_stmt = statements["DenyAllActionsAfterExpiry"]
        self.assertEqual(deny_stmt["Effect"], "Deny")
        self.assertEqual(deny_stmt["Action"], "*")
        self.assertIn("Condition", deny_stmt)
        condition = deny_stmt["Condition"]
        self.assertIn("DateGreaterThan", condition)
        self.assertIn("aws:CurrentTime", condition["DateGreaterThan"])

        expiry_date = condition["DateGreaterThan"]["aws:CurrentTime"]
        # Simple ISO8601 check
        import re
        iso8601_regex = r"\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z"
        self.assertRegex(expiry_date, iso8601_regex)



if __name__ == "__main__":
    unittest.main()
