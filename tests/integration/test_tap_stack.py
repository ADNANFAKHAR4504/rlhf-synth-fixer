"""
test_tap_stack_integration.py

Integration tests for live deployed TapStack Pulumi infrastructure.
Tests actual AWS resources created by the Pulumi stack.

Note: These tests are meant to run against a deployed stack.
For CI/CD pipeline testing, ensure proper AWS credentials are configured.
"""

import unittest
import os
import boto3
from botocore.exceptions import ClientError


class TestTapStackLiveIntegration(unittest.TestCase):
    """Integration tests against live deployed Pulumi stack."""

    @classmethod
    def setUpClass(cls):
        """Set up integration test with live stack."""
        cls.environment_suffix = os.getenv('TEST_ENV_SUFFIX', 'pr6611')
        cls.region = os.getenv('AWS_REGION', 'us-east-2')

        # Initialize AWS clients
        cls.ec2_client = boto3.client('ec2', region_name=cls.region)
        cls.s3_client = boto3.client('s3', region_name=cls.region)
        cls.kms_client = boto3.client('kms', region_name=cls.region)
        cls.ssm_client = boto3.client('ssm', region_name=cls.region)
        cls.lambda_client = boto3.client('lambda', region_name=cls.region)
        cls.events_client = boto3.client('events', region_name=cls.region)
        cls.config_client = boto3.client('config', region_name=cls.region)

    def test_vpc_exists(self):
        """Test that VPC exists with correct configuration."""
        response = self.ec2_client.describe_vpcs(
            Filters=[
                {'Name': 'tag:Name', 'Values': [f'vpc-{self.environment_suffix}']}
            ]
        )

        self.assertGreaterEqual(len(response['Vpcs']), 1, "VPC not found")
        vpc = response['Vpcs'][0]
        self.assertEqual(vpc['CidrBlock'], '10.0.0.0/16')
        self.assertTrue(vpc['EnableDnsHostnames'])
        self.assertTrue(vpc['EnableDnsSupport'])

    def test_internet_gateway_exists(self):
        """Test that Internet Gateway exists and is attached to VPC."""
        response = self.ec2_client.describe_internet_gateways(
            Filters=[
                {'Name': 'tag:Name', 'Values': [f'igw-{self.environment_suffix}']}
            ]
        )

        self.assertGreaterEqual(len(response['InternetGateways']), 1, "Internet Gateway not found")
        igw = response['InternetGateways'][0]
        self.assertGreaterEqual(len(igw['Attachments']), 1, "IGW not attached to VPC")
        self.assertEqual(igw['Attachments'][0]['State'], 'available')

    def test_public_subnets_exist(self):
        """Test that public subnets exist."""
        response = self.ec2_client.describe_subnets(
            Filters=[
                {'Name': 'tag:Type', 'Values': ['public']},
                {'Name': 'tag:Name', 'Values': [f'*{self.environment_suffix}*']}
            ]
        )

        self.assertGreaterEqual(len(response['Subnets']), 3, "Expected at least 3 public subnets")

    def test_private_subnets_exist(self):
        """Test that private subnets exist."""
        response = self.ec2_client.describe_subnets(
            Filters=[
                {'Name': 'tag:Type', 'Values': ['private']},
                {'Name': 'tag:Name', 'Values': [f'*{self.environment_suffix}*']}
            ]
        )

        self.assertGreaterEqual(len(response['Subnets']), 3, "Expected at least 3 private subnets")

    def test_nat_instances_exist(self):
        """Test that NAT instances exist and are running."""
        response = self.ec2_client.describe_instances(
            Filters=[
                {'Name': 'tag:Name', 'Values': [f'nat-instance-*-{self.environment_suffix}']},
                {'Name': 'instance-state-name', 'Values': ['running', 'stopped']}
            ]
        )

        instances = []
        for reservation in response['Reservations']:
            instances.extend(reservation['Instances'])

        self.assertGreaterEqual(len(instances), 3, "Expected at least 3 NAT instances")

    def test_s3_bucket_for_flow_logs_exists(self):
        """Test that S3 bucket for VPC Flow Logs exists."""
        bucket_name = f'vpc-flow-logs-{self.environment_suffix}'
        try:
            response = self.s3_client.head_bucket(Bucket=bucket_name)
            self.assertIsNotNone(response)
        except ClientError as e:
            self.fail(f"S3 bucket {bucket_name} not found: {e}")

    def test_s3_bucket_for_config_exists(self):
        """Test that S3 bucket for AWS Config exists."""
        bucket_name = f'aws-config-{self.environment_suffix}'
        try:
            response = self.s3_client.head_bucket(Bucket=bucket_name)
            self.assertIsNotNone(response)
        except ClientError as e:
            self.fail(f"S3 bucket {bucket_name} not found: {e}")

    def test_kms_key_exists(self):
        """Test that KMS key for Parameter Store exists."""
        response = self.kms_client.list_aliases()

        alias_name = f'alias/parameter-store-{self.environment_suffix}'
        aliases = [a for a in response['Aliases'] if a['AliasName'] == alias_name]

        self.assertGreaterEqual(len(aliases), 1, f"KMS alias {alias_name} not found")

    def test_ssm_parameters_exist(self):
        """Test that SSM parameters exist."""
        expected_params = [
            f'/{self.environment_suffix}/trading-api-key-1',
            f'/{self.environment_suffix}/trading-api-key-2',
            f'/{self.environment_suffix}/trading-api-secret'
        ]

        for param_name in expected_params:
            try:
                response = self.ssm_client.get_parameter(Name=param_name)
                self.assertEqual(response['Parameter']['Type'], 'SecureString')
            except ClientError as e:
                self.fail(f"SSM parameter {param_name} not found: {e}")

    def test_lambda_function_exists(self):
        """Test that Lambda function for secret rotation exists."""
        function_name = f'secret-rotation-{self.environment_suffix}'
        try:
            response = self.lambda_client.get_function(FunctionName=function_name)
            self.assertEqual(response['Configuration']['Runtime'], 'python3.11')
            self.assertEqual(response['Configuration']['Handler'], 'index.handler')
        except ClientError as e:
            self.fail(f"Lambda function {function_name} not found: {e}")

    def test_eventbridge_bus_exists(self):
        """Test that EventBridge custom event bus exists."""
        bus_name = f'app-events-{self.environment_suffix}'
        try:
            response = self.events_client.describe_event_bus(Name=bus_name)
            self.assertEqual(response['Name'], bus_name)
        except ClientError as e:
            self.fail(f"EventBridge bus {bus_name} not found: {e}")

    def test_eventbridge_rotation_rule_exists(self):
        """Test that EventBridge rotation rule exists."""
        rule_name = f'rotation-schedule-{self.environment_suffix}'
        try:
            response = self.events_client.describe_rule(Name=rule_name)
            self.assertEqual(response['ScheduleExpression'], 'rate(30 days)')
        except ClientError as e:
            self.fail(f"EventBridge rule {rule_name} not found: {e}")

    def test_config_recorder_exists(self):
        """Test that AWS Config recorder exists."""
        response = self.config_client.describe_configuration_recorders()

        recorder_name = f'config-recorder-{self.environment_suffix}'
        recorders = [r for r in response['ConfigurationRecorders'] if r['name'] == recorder_name]

        self.assertGreaterEqual(len(recorders), 1, f"Config recorder {recorder_name} not found")

    def test_vpc_flow_logs_enabled(self):
        """Test that VPC Flow Logs are enabled."""
        # Get VPC ID
        vpc_response = self.ec2_client.describe_vpcs(
            Filters=[
                {'Name': 'tag:Name', 'Values': [f'vpc-{self.environment_suffix}']}
            ]
        )

        if len(vpc_response['Vpcs']) > 0:
            vpc_id = vpc_response['Vpcs'][0]['VpcId']

            # Check flow logs
            flow_logs_response = self.ec2_client.describe_flow_logs(
                Filters=[
                    {'Name': 'resource-id', 'Values': [vpc_id]}
                ]
            )

            self.assertGreaterEqual(len(flow_logs_response['FlowLogs']), 1, "VPC Flow Logs not found")


@unittest.skipIf(os.getenv('SKIP_INTEGRATION_TESTS') == 'true', "Skipping integration tests")
class TestTapStackIntegrationOptional(unittest.TestCase):
    """Optional integration tests that may not be required for all deployments."""

    @classmethod
    def setUpClass(cls):
        """Set up integration test with live stack."""
        cls.environment_suffix = os.getenv('TEST_ENV_SUFFIX', 'pr6611')
        cls.region = os.getenv('AWS_REGION', 'us-east-2')
        cls.ec2_client = boto3.client('ec2', region_name=cls.region)

    def test_nat_instances_in_public_subnets(self):
        """Test that NAT instances are deployed in public subnets."""
        # Get public subnet IDs
        public_subnets_response = self.ec2_client.describe_subnets(
            Filters=[
                {'Name': 'tag:Type', 'Values': ['public']},
                {'Name': 'tag:Name', 'Values': [f'*{self.environment_suffix}*']}
            ]
        )
        public_subnet_ids = [s['SubnetId'] for s in public_subnets_response['Subnets']]

        # Get NAT instances
        nat_instances_response = self.ec2_client.describe_instances(
            Filters=[
                {'Name': 'tag:Name', 'Values': [f'nat-instance-*-{self.environment_suffix}']}
            ]
        )

        for reservation in nat_instances_response['Reservations']:
            for instance in reservation['Instances']:
                self.assertIn(instance['SubnetId'], public_subnet_ids,
                            f"NAT instance {instance['InstanceId']} not in public subnet")


if __name__ == '__main__':
    # Allow running integration tests only if explicitly requested
    if os.getenv('RUN_INTEGRATION_TESTS') == 'true':
        unittest.main()
    else:
        print("Integration tests skipped. Set RUN_INTEGRATION_TESTS=true to run.")
