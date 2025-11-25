import json
import os
import unittest
import boto3


class TestTapStackIntegration(unittest.TestCase):
    """Integration tests for the TapStack deployed infrastructure"""

    @classmethod
    def setUpClass(cls):
        """Load deployment outputs once for all tests"""
        base_dir = os.path.dirname(os.path.abspath(__file__))
        flat_outputs_path = os.path.join(
            base_dir, '..', '..', 'cfn-outputs', 'flat-outputs.json'
        )

        if os.path.exists(flat_outputs_path):
            with open(flat_outputs_path, 'r', encoding='utf-8') as f:
                cls.outputs = json.load(f)
        else:
            cls.outputs = {}

        # Initialize AWS clients
        cls.s3_client = boto3.client('s3')
        cls.lambda_client = boto3.client('lambda')
        cls.ec2_client = boto3.client('ec2')
        cls.kms_client = boto3.client('kms')
        cls.logs_client = boto3.client('logs')

    def test_s3_bucket_exists_and_encrypted(self):
        """Test that S3 bucket exists and has KMS encryption enabled"""
        # Get bucket name from outputs
        bucket_name = None
        for key, value in self.outputs.items():
            if 'bucket' in key.lower() and 'name' in key.lower():
                bucket_name = value
                break

        if not bucket_name:
            self.skipTest("S3 bucket name not found in outputs")

        # Verify bucket exists and get encryption config
        encryption = self.s3_client.get_bucket_encryption(Bucket=bucket_name)
        rules = encryption['ServerSideEncryptionConfiguration']['Rules']

        # Assert KMS encryption is enabled
        self.assertTrue(
            any(rule['ApplyServerSideEncryptionByDefault']['SSEAlgorithm'] == 'aws:kms'
                for rule in rules),
            "S3 bucket should have KMS encryption enabled"
        )

    def test_s3_bucket_versioning_enabled(self):
        """Test that S3 bucket has versioning enabled"""
        # Get bucket name from outputs
        bucket_name = None
        for key, value in self.outputs.items():
            if 'bucket' in key.lower() and 'name' in key.lower():
                bucket_name = value
                break

        if not bucket_name:
            self.skipTest("S3 bucket name not found in outputs")

        # Verify versioning is enabled
        versioning = self.s3_client.get_bucket_versioning(Bucket=bucket_name)
        self.assertEqual(
            versioning.get('Status'),
            'Enabled',
            "S3 bucket should have versioning enabled"
        )

    def test_s3_bucket_public_access_blocked(self):
        """Test that S3 bucket has all public access blocked"""
        # Get bucket name from outputs
        bucket_name = None
        for key, value in self.outputs.items():
            if 'bucket' in key.lower() and 'name' in key.lower():
                bucket_name = value
                break

        if not bucket_name:
            self.skipTest("S3 bucket name not found in outputs")

        # Verify public access is blocked
        public_access = self.s3_client.get_public_access_block(Bucket=bucket_name)
        config = public_access['PublicAccessBlockConfiguration']

        self.assertTrue(config['BlockPublicAcls'], "BlockPublicAcls should be True")
        self.assertTrue(config['BlockPublicPolicy'], "BlockPublicPolicy should be True")
        self.assertTrue(config['IgnorePublicAcls'], "IgnorePublicAcls should be True")
        self.assertTrue(config['RestrictPublicBuckets'], "RestrictPublicBuckets should be True")

    def test_lambda_function_exists(self):
        """Test that Lambda function exists and is properly configured"""
        # Get Lambda function name from outputs
        function_name = None
        for key, value in self.outputs.items():
            if 'function' in key.lower() and 'name' in key.lower():
                function_name = value
                break

        if not function_name:
            self.skipTest("Lambda function name not found in outputs")

        # Get Lambda function configuration
        config = self.lambda_client.get_function_configuration(FunctionName=function_name)

        # Verify runtime
        self.assertEqual(config['Runtime'], 'python3.11', "Lambda should use Python 3.11")

        # Verify timeout
        self.assertEqual(config['Timeout'], 300, "Lambda timeout should be 5 minutes (300s)")

        # Verify memory
        self.assertEqual(config['MemorySize'], 512, "Lambda memory should be 512 MB")

    def test_lambda_function_in_vpc(self):
        """Test that Lambda function is deployed in VPC"""
        # Get Lambda function name from outputs
        function_name = None
        for key, value in self.outputs.items():
            if 'function' in key.lower() and 'name' in key.lower():
                function_name = value
                break

        if not function_name:
            self.skipTest("Lambda function name not found in outputs")

        # Get Lambda function configuration
        config = self.lambda_client.get_function_configuration(FunctionName=function_name)

        # Verify VPC configuration exists
        self.assertIn('VpcConfig', config, "Lambda should be in VPC")
        self.assertIsNotNone(config['VpcConfig'].get('VpcId'), "Lambda should have VPC ID")
        self.assertGreater(
            len(config['VpcConfig'].get('SubnetIds', [])),
            0,
            "Lambda should have subnet assignments"
        )

    def test_vpc_exists(self):
        """Test that VPC exists with correct configuration"""
        # Get VPC ID from outputs
        vpc_id = None
        for key, value in self.outputs.items():
            if 'vpc' in key.lower() and 'id' in key.lower():
                vpc_id = value
                break

        if not vpc_id:
            self.skipTest("VPC ID not found in outputs")

        # Verify VPC exists
        vpcs = self.ec2_client.describe_vpcs(VpcIds=[vpc_id])
        self.assertEqual(len(vpcs['Vpcs']), 1, "VPC should exist")

    def test_vpc_endpoints_exist(self):
        """Test that required VPC endpoints exist"""
        # Get VPC ID from outputs
        vpc_id = None
        for key, value in self.outputs.items():
            if 'vpc' in key.lower() and 'id' in key.lower():
                vpc_id = value
                break

        if not vpc_id:
            self.skipTest("VPC ID not found in outputs")

        # Get all VPC endpoints
        endpoints = self.ec2_client.describe_vpc_endpoints(
            Filters=[{'Name': 'vpc-id', 'Values': [vpc_id]}]
        )

        # Verify we have at least 4 endpoints (S3, Secrets Manager, KMS, Logs)
        self.assertGreaterEqual(
            len(endpoints['VpcEndpoints']),
            4,
            "Should have at least 4 VPC endpoints"
        )

    def test_cloudwatch_log_group_exists(self):
        """Test that CloudWatch Log Group exists"""
        # Get log group name from outputs or construct from function name
        log_group_name = None
        for key, value in self.outputs.items():
            if 'log' in key.lower() and 'group' in key.lower():
                log_group_name = value
                break

        if not log_group_name:
            # Try to find function name and construct log group name
            function_name = None
            for key, value in self.outputs.items():
                if 'function' in key.lower() and 'name' in key.lower():
                    function_name = value
                    break

            if function_name:
                log_group_name = f"/aws/lambda/{function_name}"

        if not log_group_name:
            self.skipTest("Log group name not found in outputs")

        # Verify log group exists
        log_groups = self.logs_client.describe_log_groups(
            logGroupNamePrefix=log_group_name
        )

        matching_groups = [lg for lg in log_groups['logGroups'] if lg['logGroupName'] == log_group_name]
        self.assertEqual(len(matching_groups), 1, f"Log group {log_group_name} should exist")

        # Verify retention
        log_group = matching_groups[0]
        self.assertEqual(
            log_group.get('retentionInDays'),
            90,
            "Log group retention should be 90 days"
        )

    def test_kms_keys_have_rotation_enabled(self):
        """Test that KMS keys have automatic rotation enabled"""
        # Get KMS key IDs from outputs
        key_ids = []
        for key, value in self.outputs.items():
            if 'key' in key.lower() and ('id' in key.lower() or 'arn' in key.lower()):
                # Extract key ID from ARN if necessary
                if value.startswith('arn:'):
                    key_id = value.split('/')[-1]
                else:
                    key_id = value
                key_ids.append(key_id)

        if not key_ids:
            self.skipTest("No KMS key IDs found in outputs")

        # Verify rotation is enabled for all keys
        for key_id in key_ids:
            try:
                rotation = self.kms_client.get_key_rotation_status(KeyId=key_id)
                self.assertTrue(
                    rotation.get('KeyRotationEnabled', False),
                    f"KMS key {key_id} should have rotation enabled"
                )
            except Exception as e:
                # Skip if key doesn't support rotation (e.g., AWS managed keys)
                if 'NotFoundException' not in str(e):
                    raise
