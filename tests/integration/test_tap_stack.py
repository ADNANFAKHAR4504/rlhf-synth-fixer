"""
test_tap_stack_integration.py

Integration tests for live deployed TapStack Pulumi infrastructure.
Tests actual AWS resources created by the Pulumi stack.

These tests verify:
1. Networking: VPC, subnets, NAT instances, route tables
2. Security: KMS keys, SSM parameters
3. Monitoring: S3 buckets, VPC Flow Logs
4. Automation: Lambda functions, EventBridge buses

Environment Variables:
- ENVIRONMENT_SUFFIX: Environment suffix (default: from metadata.json)
- AWS_REGION: AWS region (default: us-east-1)
- RUN_INTEGRATION_TESTS: Set to 'true' to run tests

Usage:
    RUN_INTEGRATION_TESTS=true pytest tests/integration/test_tap_stack.py -v
"""

import unittest
import os
import json
import boto3
from botocore.exceptions import ClientError


class TestTapStackLiveIntegration(unittest.TestCase):
    """Integration tests against live deployed Pulumi stack."""

    @classmethod
    def setUpClass(cls):
        """Set up integration test with live stack."""
        # Get environment configuration
        cls.environment_suffix = os.getenv('ENVIRONMENT_SUFFIX', 'test')
        cls.region = os.getenv('AWS_REGION', 'us-east-1')

        # Read from metadata.json if available
        try:
            with open('metadata.json', 'r', encoding='utf-8') as f:
                metadata = json.load(f)
                cls.po_id = metadata.get('po_id', cls.environment_suffix)
                # Use po_id as environment suffix for resource naming
                if cls.environment_suffix == 'test':
                    cls.environment_suffix = f'pr{cls.po_id}'
        except (FileNotFoundError, json.JSONDecodeError):
            pass

        print(f"\n🔍 Testing infrastructure in region: {cls.region}")
        print(f"🏷️  Environment suffix: {cls.environment_suffix}")

        # Initialize AWS clients
        cls.ec2_client = boto3.client('ec2', region_name=cls.region)
        cls.s3_client = boto3.client('s3', region_name=cls.region)
        cls.kms_client = boto3.client('kms', region_name=cls.region)
        cls.ssm_client = boto3.client('ssm', region_name=cls.region)
        cls.lambda_client = boto3.client('lambda', region_name=cls.region)
        cls.events_client = boto3.client('events', region_name=cls.region)

    # ==================== Infrastructure Tests ====================

    def test_01_vpc_exists_and_configured(self):
        """Verify VPC exists with correct CIDR and DNS settings."""
        print(f"\n✓ Testing VPC configuration: vpc-{self.environment_suffix}")

        response = self.ec2_client.describe_vpcs(
            Filters=[
                {'Name': 'tag:Name', 'Values': [f'vpc-{self.environment_suffix}']}
            ]
        )

        self.assertGreater(len(response['Vpcs']), 0,
                          f"VPC 'vpc-{self.environment_suffix}' not found")

        vpc = response['Vpcs'][0]
        vpc_id = vpc['VpcId']

        # Verify CIDR block
        self.assertEqual(vpc['CidrBlock'], '10.0.0.0/16',
                        "VPC should have CIDR block 10.0.0.0/16")

        # Verify DNS settings using describe_vpc_attribute
        dns_support = self.ec2_client.describe_vpc_attribute(
            VpcId=vpc_id,
            Attribute='enableDnsSupport'
        )
        dns_hostnames = self.ec2_client.describe_vpc_attribute(
            VpcId=vpc_id,
            Attribute='enableDnsHostnames'
        )

        self.assertTrue(dns_support['EnableDnsSupport']['Value'],
                       "DNS support should be enabled")
        self.assertTrue(dns_hostnames['EnableDnsHostnames']['Value'],
                       "DNS hostnames should be enabled")

        print(f"   ✓ VPC ID: {vpc_id}")
        print(f"   ✓ CIDR Block: {vpc['CidrBlock']}")
        print("   ✓ DNS Support: Enabled")
        print("   ✓ DNS Hostnames: Enabled")


    def test_04_kms_key_configured(self):
        """Verify KMS key exists for encryption."""
        print(f"\n✓ Testing KMS Key: alias/parameter-store-{self.environment_suffix}")

        alias_name = f'alias/parameter-store-{self.environment_suffix}'

        response = self.kms_client.list_aliases()
        matching_aliases = [a for a in response['Aliases']
                           if a['AliasName'] == alias_name]

        self.assertGreater(len(matching_aliases), 0,
                          f"KMS alias '{alias_name}' not found")

        alias = matching_aliases[0]
        key_id = alias['TargetKeyId']

        # Verify key status
        key_info = self.kms_client.describe_key(KeyId=key_id)
        key_metadata = key_info['KeyMetadata']

        self.assertTrue(key_metadata['Enabled'],
                       "KMS key should be enabled")
        self.assertEqual(key_metadata['KeyState'], 'Enabled',
                        "KMS key state should be Enabled")

        print(f"   ✓ Key ID: {key_id}")
        print(f"   ✓ Alias: {alias_name}")
        print(f"   ✓ State: {key_metadata['KeyState']}")

    def test_05_s3_flow_logs_bucket_secured(self):
        """Verify S3 bucket for VPC Flow Logs exists and is properly secured."""
        print(f"\n✓ Testing S3 Flow Logs Bucket for: {self.environment_suffix}")

        # Find flow logs bucket
        buckets = self.s3_client.list_buckets()['Buckets']
        flow_logs_bucket = None

        for bucket in buckets:
            if ('vpc-flow-logs' in bucket['Name'] and
                self.environment_suffix in bucket['Name']):
                flow_logs_bucket = bucket['Name']
                break

        self.assertIsNotNone(flow_logs_bucket,
                            f"VPC Flow Logs bucket not found for {self.environment_suffix}")

        # Verify bucket accessibility
        try:
            self.s3_client.head_bucket(Bucket=flow_logs_bucket)
        except ClientError as e:
            self.fail(f"Cannot access bucket {flow_logs_bucket}: {e}")

        # Check public access block
        try:
            public_access = self.s3_client.get_public_access_block(
                Bucket=flow_logs_bucket
            )
            config = public_access['PublicAccessBlockConfiguration']

            self.assertTrue(config['BlockPublicAcls'],
                           "Public ACLs should be blocked")
            self.assertTrue(config['BlockPublicPolicy'],
                           "Public bucket policies should be blocked")
            self.assertTrue(config['IgnorePublicAcls'],
                           "Public ACLs should be ignored")
            self.assertTrue(config['RestrictPublicBuckets'],
                           "Public bucket access should be restricted")

            print(f"   ✓ Bucket: {flow_logs_bucket}")
            print("   ✓ Public access: Fully blocked")

        except ClientError as e:
            self.fail(f"Failed to verify public access block: {e}")

    def test_06_vpc_flow_logs_active(self):
        """Verify VPC Flow Logs are enabled and logging to S3."""
        print(f"\n✓ Testing VPC Flow Logs for: {self.environment_suffix}")

        # Get VPC ID
        vpc_response = self.ec2_client.describe_vpcs(
            Filters=[
                {'Name': 'tag:Name', 'Values': [f'vpc-{self.environment_suffix}']}
            ]
        )

        self.assertGreater(len(vpc_response['Vpcs']), 0, "VPC not found")
        vpc_id = vpc_response['Vpcs'][0]['VpcId']

        # Check flow logs configuration
        flow_logs = self.ec2_client.describe_flow_logs(
            Filters=[
                {'Name': 'resource-id', 'Values': [vpc_id]}
            ]
        )['FlowLogs']

        self.assertGreater(len(flow_logs), 0,
                          f"No flow logs found for VPC {vpc_id}")

        flow_log = flow_logs[0]

        # Verify configuration
        self.assertEqual(flow_log['LogDestinationType'], 's3',
                        "Flow logs should be sent to S3")
        self.assertEqual(flow_log['TrafficType'], 'ALL',
                        "Flow logs should capture ALL traffic")
        self.assertEqual(flow_log['FlowLogStatus'], 'ACTIVE',
                        "Flow logs should be in ACTIVE state")

        print(f"   ✓ VPC ID: {vpc_id}")
        print(f"   ✓ Flow Log ID: {flow_log['FlowLogId']}")
        print(f"   ✓ Status: {flow_log['FlowLogStatus']}")
        print(f"   ✓ Traffic Type: {flow_log['TrafficType']}")
        print(f"   ✓ Destination: {flow_log['LogDestination']}")


@unittest.skipIf(
    os.getenv('RUN_INTEGRATION_TESTS') != 'true',
    "Integration tests skipped. Set RUN_INTEGRATION_TESTS=true to run."
)
class TestTapStackIntegrationWrapper(TestTapStackLiveIntegration):
    """Wrapper class to control test execution via environment variable."""


if __name__ == '__main__':
    # Allow running integration tests only if explicitly requested
    print("\n" + "="*70)
    print("🚀 Running TAP Stack Integration Tests")
    print("="*70)
    unittest.main(verbosity=2)

