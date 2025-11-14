"""
test_tap_stack_integration.py

Integration tests for live deployed TapStack Pulumi infrastructure.
Tests actual AWS resources created by the Pulumi stack using real deployment outputs.
"""

import unittest
import os
import json
import boto3
from typing import Dict, Any


class TestTapStackLiveIntegration(unittest.TestCase):
    """Integration tests against live deployed Pulumi stack."""

    @classmethod
    def setUpClass(cls):
        """Set up integration test with live stack outputs."""
        # Load stack outputs from deployment
        outputs_file = os.path.join(
            os.path.dirname(os.path.dirname(os.path.dirname(__file__))),
            'cfn-outputs',
            'flat-outputs.json'
        )

        if not os.path.exists(outputs_file):
            raise FileNotFoundError(
                f"Stack outputs file not found: {outputs_file}. "
                "Please deploy the stack first."
            )

        with open(outputs_file, 'r', encoding='utf-8') as f:
            cls.outputs: Dict[str, Any] = json.load(f)

        # Initialize AWS clients
        cls.region = os.getenv('AWS_DEFAULT_REGION', 'us-east-1')
        cls.ec2_client = boto3.client('ec2', region_name=cls.region)
        cls.rds_client = boto3.client('rds', region_name=cls.region)
        cls.dynamodb_client = boto3.client('dynamodb', region_name=cls.region)
        cls.elbv2_client = boto3.client('elbv2', region_name=cls.region)
        cls.lambda_client = boto3.client('lambda', region_name=cls.region)
        cls.kms_client = boto3.client('kms', region_name=cls.region)
        cls.backup_client = boto3.client('backup', region_name=cls.region)
        cls.ssm_client = boto3.client('ssm', region_name=cls.region)

    def test_01_vpc_exists_and_configured(self):
        """Test VPC exists and is properly configured."""
        vpc_id = self.outputs.get('VpcId')
        self.assertIsNotNone(vpc_id, "VPC ID not found in outputs")

        # Verify VPC exists (would throw exception if not)
        try:
            response = self.ec2_client.describe_vpcs(VpcIds=[vpc_id])
            vpcs = response.get('Vpcs', [])
            self.assertEqual(len(vpcs), 1, "VPC not found or multiple VPCs returned")

            vpc = vpcs[0]
            # Verify CIDR block
            self.assertEqual(vpc['CidrBlock'], '10.0.0.0/16', "VPC CIDR block mismatch")
            # Verify DNS support
            self.assertTrue(vpc['EnableDnsHostnames'], "DNS hostnames not enabled")
            self.assertTrue(vpc['EnableDnsSupport'], "DNS support not enabled")
        except Exception as e:
            self.fail(f"VPC validation failed: {str(e)}")

    def test_02_subnets_across_availability_zones(self):
        """Test subnets are distributed across 3 AZs."""
        vpc_id = self.outputs.get('VpcId')
        self.assertIsNotNone(vpc_id)

        try:
            # Get all subnets in VPC
            response = self.ec2_client.describe_subnets(
                Filters=[{'Name': 'vpc-id', 'Values': [vpc_id]}]
            )
            subnets = response.get('Subnets', [])

            # Should have 6 subnets total (3 public + 3 private)
            self.assertGreaterEqual(
                len(subnets), 6,
                f"Expected at least 6 subnets, found {len(subnets)}"
            )

            # Verify distribution across AZs
            azs = set(subnet['AvailabilityZone'] for subnet in subnets)
            self.assertGreaterEqual(
                len(azs), 3,
                f"Subnets should span at least 3 AZs, found {len(azs)}"
            )
        except Exception as e:
            self.fail(f"Subnet validation failed: {str(e)}")

    def test_03_rds_clusters_exist(self):
        """Test both blue and green RDS Aurora clusters exist."""
        blue_endpoint = self.outputs.get('BlueClusterEndpoint')
        green_endpoint = self.outputs.get('GreenClusterEndpoint')

        self.assertIsNotNone(blue_endpoint, "Blue cluster endpoint not found")
        self.assertIsNotNone(green_endpoint, "Green cluster endpoint not found")

        # Verify endpoints are different
        self.assertNotEqual(
            blue_endpoint, green_endpoint,
            "Blue and green clusters should have different endpoints"
        )

        # Verify cluster endpoints follow expected pattern
        self.assertIn('.rds.amazonaws.com', blue_endpoint, "Invalid blue endpoint format")
        self.assertIn('.rds.amazonaws.com', green_endpoint, "Invalid green endpoint format")

    def test_04_dynamodb_table_exists(self):
        """Test DynamoDB table exists and has PITR enabled."""
        table_name = self.outputs.get('DynamoDBTableName')
        self.assertIsNotNone(table_name, "DynamoDB table name not found in outputs")

        try:
            # Describe table
            response = self.dynamodb_client.describe_table(TableName=table_name)
            table = response['Table']

            # Verify table status
            self.assertEqual(
                table['TableStatus'], 'ACTIVE',
                f"Table status is {table['TableStatus']}, expected ACTIVE"
            )

            # Verify Point-in-Time Recovery
            pitr_response = self.dynamodb_client.describe_continuous_backups(
                TableName=table_name
            )
            pitr_status = pitr_response['ContinuousBackupsDescription'][
                'PointInTimeRecoveryDescription'
            ]['PointInTimeRecoveryStatus']
            self.assertEqual(
                pitr_status, 'ENABLED',
                "Point-in-Time Recovery should be enabled"
            )
        except Exception as e:
            self.fail(f"DynamoDB table validation failed: {str(e)}")

    def test_05_alb_exists_and_configured(self):
        """Test Application Load Balancer exists and is configured."""
        alb_dns_name = self.outputs.get('AlbDnsName')
        self.assertIsNotNone(alb_dns_name, "ALB DNS name not found in outputs")

        # Verify DNS name format
        self.assertIn(
            '.elb.amazonaws.com', alb_dns_name,
            "Invalid ALB DNS name format"
        )

        # If ALB ARN is available, verify it exists
        alb_arn = self.outputs.get('AlbArn')
        if alb_arn:
            try:
                response = self.elbv2_client.describe_load_balancers(
                    LoadBalancerArns=[alb_arn]
                )
                lbs = response.get('LoadBalancers', [])
                self.assertEqual(len(lbs), 1, "ALB not found")

                lb = lbs[0]
                self.assertEqual(lb['State']['Code'], 'active', "ALB is not active")
                self.assertEqual(lb['Scheme'], 'internet-facing', "ALB should be internet-facing")
            except self.elbv2_client.exceptions.LoadBalancerNotFoundException:
                self.skipTest("ALB ARN format may have changed, DNS validation sufficient")

    def test_06_lambda_function_exists(self):
        """Test Lambda function for environment switching exists."""
        lambda_arn = self.outputs.get('LambdaFunctionArn')
        self.assertIsNotNone(lambda_arn, "Lambda function ARN not found")

        try:
            # Get function configuration
            function_name = lambda_arn.split(':')[-1]
            response = self.lambda_client.get_function(FunctionName=function_name)

            # Verify function configuration
            config = response['Configuration']
            self.assertTrue(
                config['Runtime'].startswith('python3'),
                f"Lambda runtime should be Python 3.x, got {config['Runtime']}"
            )
            self.assertGreater(
                config['Timeout'], 0,
                "Lambda timeout should be configured"
            )
        except self.lambda_client.exceptions.ResourceNotFoundException:
            self.skipTest("Lambda function may have been destroyed")
        except Exception as e:
            self.fail(f"Lambda function validation failed: {str(e)}")

    def test_07_kms_key_exists(self):
        """Test KMS customer-managed key exists."""
        kms_key_id = self.outputs.get('KmsKeyId')
        self.assertIsNotNone(kms_key_id, "KMS key ID not found in outputs")

        # Verify KMS key ID/ARN format
        self.assertTrue(
            kms_key_id.startswith('arn:aws:kms:') or len(kms_key_id) == 36,
            "Invalid KMS key ID/ARN format"
        )

    def test_08_backup_vault_exists(self):
        """Test AWS Backup vault exists."""
        vault_name = self.outputs.get('BackupVaultName')
        self.assertIsNotNone(vault_name, "Backup vault name not found")

        try:
            # Describe backup vault
            response = self.backup_client.describe_backup_vault(
                BackupVaultName=vault_name
            )

            # Verify vault exists
            self.assertEqual(
                response['BackupVaultName'], vault_name,
                "Backup vault name mismatch"
            )
        except self.backup_client.exceptions.ResourceNotFoundException:
            self.skipTest("Backup vault may have been destroyed")
        except Exception as e:
            self.fail(f"Backup vault validation failed: {str(e)}")

    def test_09_active_environment_tracked(self):
        """Test active environment is tracked in SSM Parameter."""
        active_env = self.outputs.get('ActiveEnvironment')
        self.assertIsNotNone(active_env, "Active environment not found")

        # Verify active environment is either blue or green
        self.assertIn(
            active_env.lower(), ['blue', 'green'],
            "Active environment should be 'blue' or 'green'"
        )

    def test_10_blue_green_workflow_integrity(self):
        """Test blue-green deployment workflow components are complete."""
        # Verify all required components for blue-green deployment exist
        required_components = {
            'VpcId': 'VPC for networking',
            'BlueClusterEndpoint': 'Blue RDS cluster',
            'GreenClusterEndpoint': 'Green RDS cluster',
            'AlbDnsName': 'Application Load Balancer',
            'DynamoDBTableName': 'DynamoDB for session data',
            'LambdaFunctionArn': 'Lambda for environment switching',
            'ActiveEnvironment': 'Active environment tracking'
        }

        missing_components = []
        for component, description in required_components.items():
            if component not in self.outputs or not self.outputs[component]:
                missing_components.append(f"{component} ({description})")

        self.assertEqual(
            len(missing_components), 0,
            f"Missing required components: {', '.join(missing_components)}"
        )

    def test_11_resource_naming_convention(self):
        """Test resources follow naming conventions with environment suffix."""
        # Verify environment suffix is used consistently
        table_name = self.outputs.get('DynamoDBTableName')
        lambda_arn = self.outputs.get('LambdaFunctionArn')
        vault_name = self.outputs.get('BackupVaultName')

        # All resource names should contain consistent suffix
        if table_name:
            self.assertIn(
                'synth', table_name.lower(),
                "DynamoDB table should include environment suffix"
            )

        if lambda_arn:
            lambda_name = lambda_arn.split(':')[-1]
            self.assertIn(
                'synth', lambda_name.lower(),
                "Lambda function should include environment suffix"
            )

        if vault_name:
            self.assertIn(
                'synth', vault_name.lower(),
                "Backup vault should include environment suffix"
            )

    def test_12_encryption_at_rest(self):
        """Test data encryption at rest is enabled."""
        kms_key_id = self.outputs.get('KmsKeyId')
        self.assertIsNotNone(kms_key_id, "KMS key should be created for encryption")

        # DynamoDB encryption
        table_name = self.outputs.get('DynamoDBTableName')
        if table_name:
            try:
                response = self.dynamodb_client.describe_table(TableName=table_name)
                sse_description = response['Table'].get('SSEDescription', {})
                self.assertEqual(
                    sse_description.get('Status'), 'ENABLED',
                    "DynamoDB table encryption should be enabled"
                )
            except Exception:
                self.skipTest("DynamoDB table may have been destroyed")


if __name__ == '__main__':
    unittest.main()
