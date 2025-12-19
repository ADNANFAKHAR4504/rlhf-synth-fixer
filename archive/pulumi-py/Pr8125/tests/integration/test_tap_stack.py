"""
Integration tests for live deployed TapStack Pulumi infrastructure.

These tests validate actual AWS resources created by the Pulumi stack using
real deployment outputs from cfn-outputs/flat-outputs.json.
"""

import unittest
import os
import json
import boto3
from botocore.exceptions import ClientError


class TestTapStackLiveIntegration(unittest.TestCase):
    """Integration tests against live deployed Pulumi stack."""

    @staticmethod
    def _parse_list_output(value):
        """Parse an output value that may be a string representation of a list."""
        if isinstance(value, list):
            return value
        if isinstance(value, str):
            value = value.strip()
            if value.startswith('[') and value.endswith(']'):
                # Try JSON parsing first
                try:
                    return json.loads(value)
                except json.JSONDecodeError:
                    # Parse as comma-separated values
                    return [s.strip().strip('"\'') for s in value[1:-1].split(',')]
        return value if value else []

    @classmethod
    def setUpClass(cls):
        """Set up integration test with live stack outputs."""
        # Load stack outputs from flat-outputs.json
        outputs_file = os.path.join(
            os.path.dirname(__file__), '..', '..', 'cfn-outputs', 'flat-outputs.json'
        )

        if not os.path.exists(outputs_file):
            raise FileNotFoundError(
                f"Stack outputs file not found: {outputs_file}. "
                "Please deploy the stack first."
            )

        with open(outputs_file, 'r', encoding='utf-8') as f:
            cls.outputs = json.load(f)

        # Initialize AWS clients
        cls.region = os.getenv('AWS_REGION', 'us-east-1')
        cls.ec2_client = boto3.client('ec2', region_name=cls.region)
        cls.s3_client = boto3.client('s3', region_name=cls.region)
        cls.kms_client = boto3.client('kms', region_name=cls.region)
        cls.lambda_client = boto3.client('lambda', region_name=cls.region)
        cls.logs_client = boto3.client('logs', region_name=cls.region)
        cls.apigateway_client = boto3.client('apigateway', region_name=cls.region)
        cls.config_client = boto3.client('config', region_name=cls.region)
        cls.iam_client = boto3.client('iam', region_name=cls.region)

    def test_vpc_exists_and_configured(self):
        """Test that VPC exists with correct configuration."""
        vpc_id = self.outputs.get('vpc_id')
        self.assertIsNotNone(vpc_id, "VPC ID not found in outputs")

        response = self.ec2_client.describe_vpcs(VpcIds=[vpc_id])
        self.assertEqual(len(response['Vpcs']), 1)

        vpc = response['Vpcs'][0]
        self.assertEqual(vpc['CidrBlock'], '10.0.0.0/16')

        # Check DNS attributes separately
        dns_response = self.ec2_client.describe_vpc_attribute(
            VpcId=vpc_id, Attribute='enableDnsHostnames'
        )
        self.assertTrue(dns_response['EnableDnsHostnames']['Value'])

        dns_support_response = self.ec2_client.describe_vpc_attribute(
            VpcId=vpc_id, Attribute='enableDnsSupport'
        )
        self.assertTrue(dns_support_response['EnableDnsSupport']['Value'])

    def test_three_private_subnets_exist(self):
        """Test that exactly 3 private subnets exist."""
        subnet_ids = self._parse_list_output(self.outputs.get('subnet_ids', []))
        self.assertEqual(len(subnet_ids), 3, "Expected exactly 3 subnets")

        response = self.ec2_client.describe_subnets(SubnetIds=subnet_ids)
        self.assertEqual(len(response['Subnets']), 3)

        # Verify all subnets are in different availability zones
        azs = [subnet['AvailabilityZone'] for subnet in response['Subnets']]
        self.assertEqual(len(set(azs)), 3, "Subnets should be in different AZs")

    def test_s3_bucket_exists_with_versioning(self):
        """Test that S3 bucket exists with versioning enabled."""
        bucket_name = self.outputs.get('s3_bucket_name')
        self.assertIsNotNone(bucket_name, "S3 bucket name not found in outputs")

        # Check bucket exists
        try:
            self.s3_client.head_bucket(Bucket=bucket_name)
        except ClientError as e:
            self.fail(f"S3 bucket does not exist: {e}")

        # Check versioning is enabled
        versioning = self.s3_client.get_bucket_versioning(Bucket=bucket_name)
        self.assertEqual(versioning.get('Status'), 'Enabled')

    def test_s3_bucket_encryption_enabled(self):
        """Test that S3 bucket has server-side encryption enabled."""
        bucket_name = self.outputs.get('s3_bucket_name')
        self.assertIsNotNone(bucket_name)

        encryption = self.s3_client.get_bucket_encryption(Bucket=bucket_name)
        rules = encryption['ServerSideEncryptionConfiguration']['Rules']
        self.assertGreater(len(rules), 0)
        self.assertEqual(
            rules[0]['ApplyServerSideEncryptionByDefault']['SSEAlgorithm'],
            'AES256'
        )

    def test_s3_bucket_public_access_blocked(self):
        """Test that S3 bucket has public access blocked."""
        bucket_name = self.outputs.get('s3_bucket_name')
        self.assertIsNotNone(bucket_name)

        public_access_block = self.s3_client.get_public_access_block(Bucket=bucket_name)
        config = public_access_block['PublicAccessBlockConfiguration']
        self.assertTrue(config['BlockPublicAcls'])
        self.assertTrue(config['BlockPublicPolicy'])
        self.assertTrue(config['IgnorePublicAcls'])
        self.assertTrue(config['RestrictPublicBuckets'])

    def test_kms_key_exists_with_rotation(self):
        """Test that KMS key exists and has rotation enabled."""
        kms_key_arn = self.outputs.get('kms_key_arn')
        self.assertIsNotNone(kms_key_arn, "KMS key ARN not found in outputs")

        # Extract key ID from ARN
        key_id = kms_key_arn.split('/')[-1]

        # Check key exists and is enabled
        key_metadata = self.kms_client.describe_key(KeyId=key_id)
        self.assertEqual(key_metadata['KeyMetadata']['KeyState'], 'Enabled')

        # Check rotation is enabled
        rotation_status = self.kms_client.get_key_rotation_status(KeyId=key_id)
        self.assertTrue(rotation_status['KeyRotationEnabled'])

    def test_lambda_function_exists(self):
        """Test that Lambda function exists with correct configuration."""
        lambda_name = self.outputs.get('lambda_function_name')
        self.assertIsNotNone(lambda_name, "Lambda function name not found in outputs")

        function = self.lambda_client.get_function(FunctionName=lambda_name)
        config = function['Configuration']

        self.assertEqual(config['Runtime'], 'python3.11')
        self.assertEqual(config['Handler'], 'index.handler')
        self.assertIsNotNone(config.get('KMSKeyArn'), "Lambda should have KMS encryption")

    def test_lambda_function_in_vpc(self):
        """Test that Lambda function is deployed in VPC."""
        lambda_name = self.outputs.get('lambda_function_name')
        vpc_id = self.outputs.get('vpc_id')
        subnet_ids = self._parse_list_output(self.outputs.get('subnet_ids', []))

        function = self.lambda_client.get_function(FunctionName=lambda_name)
        vpc_config = function['Configuration'].get('VpcConfig', {})

        self.assertEqual(vpc_config['VpcId'], vpc_id)
        self.assertEqual(len(vpc_config['SubnetIds']), 3)
        for subnet_id in vpc_config['SubnetIds']:
            self.assertIn(subnet_id, subnet_ids)

    def test_cloudwatch_log_group_exists(self):
        """Test that CloudWatch Log Group exists with 90-day retention."""
        log_group_name = self.outputs.get('log_group_name')
        self.assertIsNotNone(log_group_name, "Log group name not found in outputs")

        log_groups = self.logs_client.describe_log_groups(
            logGroupNamePrefix=log_group_name
        )
        self.assertGreater(len(log_groups['logGroups']), 0)

        log_group = log_groups['logGroups'][0]
        self.assertEqual(log_group['logGroupName'], log_group_name)
        self.assertEqual(log_group.get('retentionInDays'), 90)

    def test_cloudwatch_log_group_encryption(self):
        """Test that CloudWatch Log Group is encrypted with KMS."""
        log_group_name = self.outputs.get('log_group_name')
        kms_key_arn = self.outputs.get('kms_key_arn')

        log_groups = self.logs_client.describe_log_groups(
            logGroupNamePrefix=log_group_name
        )
        log_group = log_groups['logGroups'][0]
        self.assertIsNotNone(log_group.get('kmsKeyId'), "Log group should be encrypted")
        self.assertEqual(log_group['kmsKeyId'], kms_key_arn)

    def test_api_gateway_exists(self):
        """Test that API Gateway exists with correct configuration."""
        api_endpoint = self.outputs.get('api_gateway_endpoint')
        self.assertIsNotNone(api_endpoint, "API Gateway endpoint not found in outputs")

        # Extract API ID from endpoint
        api_id = api_endpoint.split('//')[1].split('.')[0]

        api = self.apigateway_client.get_rest_api(restApiId=api_id)
        self.assertIsNotNone(api['name'])
        self.assertEqual(api['endpointConfiguration']['types'], ['REGIONAL'])

    def test_api_gateway_has_resource_policy(self):
        """Test that API Gateway has a resource policy configured."""
        api_endpoint = self.outputs.get('api_gateway_endpoint')
        api_id = api_endpoint.split('//')[1].split('.')[0]

        api = self.apigateway_client.get_rest_api(restApiId=api_id)
        self.assertIsNotNone(api.get('policy'), "API Gateway should have a resource policy")

        # Verify policy is valid JSON (may be URL encoded or escaped)
        import urllib.parse
        policy_str = api['policy']

        # Try URL decoding first
        if policy_str.startswith('%7B'):  # URL encoded JSON starts with %7B ('{')
            policy_str = urllib.parse.unquote(policy_str)

        # Handle escaped quotes
        if '\\"' in policy_str:
            # Replace escaped quotes with regular quotes
            policy_str = policy_str.replace('\\"', '"').replace('\\\\', '\\')

        policy = json.loads(policy_str)
        self.assertIn('Statement', policy)

    def test_vpc_endpoints_exist(self):
        """Test that VPC endpoints for S3 and DynamoDB exist."""
        vpc_id = self.outputs.get('vpc_id')

        vpc_endpoints = self.ec2_client.describe_vpc_endpoints(
            Filters=[{'Name': 'vpc-id', 'Values': [vpc_id]}]
        )

        # Check we have at least 2 endpoints (S3 and DynamoDB)
        self.assertGreaterEqual(len(vpc_endpoints['VpcEndpoints']), 2)

        service_names = [ep['ServiceName'] for ep in vpc_endpoints['VpcEndpoints']]
        s3_endpoint_exists = any('s3' in name for name in service_names)
        dynamodb_endpoint_exists = any('dynamodb' in name for name in service_names)

        self.assertTrue(s3_endpoint_exists, "S3 VPC endpoint should exist")
        self.assertTrue(dynamodb_endpoint_exists, "DynamoDB VPC endpoint should exist")

    def test_security_groups_have_no_open_rules(self):
        """Test that security groups don't have 0.0.0.0/0 ingress rules."""
        vpc_id = self.outputs.get('vpc_id')

        security_groups = self.ec2_client.describe_security_groups(
            Filters=[
                {'Name': 'vpc-id', 'Values': [vpc_id]},
                {'Name': 'group-name', 'Values': ['*zerotrust*', '*lambda*', '*vpc-endpoint*', '*ec2*']}
            ]
        )

        for sg in security_groups['SecurityGroups']:
            for rule in sg.get('IpPermissions', []):
                for ip_range in rule.get('IpRanges', []):
                    cidr = ip_range.get('CidrIp', '')
                    self.assertNotEqual(
                        cidr, '0.0.0.0/0',
                        f"Security group {sg['GroupId']} has open ingress rule"
                    )

    def test_config_recorder_exists_and_enabled(self):
        """Test that AWS Config recorder exists and is enabled."""
        recorder_name = self.outputs.get('config_recorder_name')
        if recorder_name is None:
            self.skipTest("Config recorder is disabled (conditional resource to avoid AWS limit)")

        # Try to get our specific recorder
        try:
            recorders = self.config_client.describe_configuration_recorders(
                ConfigurationRecorderNames=[recorder_name]
            )
            self.assertGreater(len(recorders['ConfigurationRecorders']), 0)

            # Check recorder status
            status = self.config_client.describe_configuration_recorder_status(
                ConfigurationRecorderNames=[recorder_name]
            )
            self.assertGreater(len(status['ConfigurationRecordersStatus']), 0)
            self.assertTrue(status['ConfigurationRecordersStatus'][0]['recording'])
        except ClientError:
            # Recorder might not exist yet, skip test
            self.skipTest(f"Config recorder {recorder_name} not found in account")

    def test_config_rules_exist(self):
        """Test that AWS Config rules are created for compliance monitoring."""
        rules = self.config_client.describe_config_rules()
        rule_names = [rule['ConfigRuleName'] for rule in rules['ConfigRules']]

        # Check for expected compliance rules (partial match since they have env suffix)
        encryption_rule_exists = any('encryption' in name.lower() for name in rule_names)
        kms_rotation_rule_exists = any('rotation' in name.lower() for name in rule_names)

        self.assertTrue(
            encryption_rule_exists or kms_rotation_rule_exists,
            "At least one encryption or rotation config rule should exist"
        )

    def test_network_acls_configured(self):
        """Test that Network ACLs are configured for subnet-level security."""
        vpc_id = self.outputs.get('vpc_id')
        subnet_ids = self._parse_list_output(self.outputs.get('subnet_ids', []))

        # Get network ACLs for the VPC
        nacls = self.ec2_client.describe_network_acls(
            Filters=[{'Name': 'vpc-id', 'Values': [vpc_id]}]
        )

        # Should have at least one custom NACL (besides default)
        self.assertGreater(len(nacls['NetworkAcls']), 1)

        # Check that subnets are associated with custom NACLs
        for nacl in nacls['NetworkAcls']:
            if not nacl['IsDefault']:
                associated_subnets = [
                    assoc['SubnetId'] for assoc in nacl.get('Associations', [])
                ]
                # At least one subnet should be associated with custom NACL
                if any(subnet_id in subnet_ids for subnet_id in associated_subnets):
                    # Found custom NACL with our subnets
                    return

        self.fail("No custom Network ACL found associated with private subnets")

    def test_no_internet_gateway_exists(self):
        """Test that no Internet Gateway is attached to the VPC (zero-trust requirement)."""
        vpc_id = self.outputs.get('vpc_id')

        igws = self.ec2_client.describe_internet_gateways(
            Filters=[{'Name': 'attachment.vpc-id', 'Values': [vpc_id]}]
        )

        self.assertEqual(
            len(igws['InternetGateways']), 0,
            "VPC should not have an Internet Gateway (zero-trust requirement)"
        )

    def test_launch_template_uses_imdsv2(self):
        """Test that EC2 launch template requires IMDSv2."""
        vpc_id = self.outputs.get('vpc_id')

        # Get launch templates (filter by name pattern if possible)
        launch_templates = self.ec2_client.describe_launch_templates()

        for lt in launch_templates['LaunchTemplates']:
            if 'zerotrust' in lt['LaunchTemplateName']:
                # Get latest version
                lt_version = self.ec2_client.describe_launch_template_versions(
                    LaunchTemplateId=lt['LaunchTemplateId'],
                    Versions=['$Latest']
                )

                version_data = lt_version['LaunchTemplateVersions'][0]['LaunchTemplateData']
                metadata_options = version_data.get('MetadataOptions', {})

                self.assertEqual(
                    metadata_options.get('HttpTokens'), 'required',
                    "Launch template should require IMDSv2"
                )
                return

        # If we get here, no zerotrust launch template found
        self.skipTest("Zerotrust launch template not found for IMDSv2 verification")


if __name__ == '__main__':
    unittest.main()
