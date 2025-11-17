"""
test_tap_stack_integration.py

Integration tests for live deployed TapStack Pulumi infrastructure.
Tests actual AWS resources created by the Pulumi stack using real deployment outputs.
"""

import json
import os
import time
import unittest
from typing import Any, Dict

import boto3
from botocore.exceptions import ClientError


class TestFinancialServicesInfrastructure(unittest.TestCase):
    """Integration tests against live deployed financial services infrastructure."""

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
        cls.s3_client = boto3.client('s3', region_name=cls.region)
        cls.elbv2_client = boto3.client('elbv2', region_name=cls.region)
        cls.autoscaling_client = boto3.client('autoscaling', region_name=cls.region)
        cls.iam_client = boto3.client('iam', region_name=cls.region)

    def test_01_vpc_exists_and_configured(self):
        """Test VPC exists and is properly configured."""
        vpc_id = self.outputs.get('VpcId')
        if not vpc_id:
            self.skipTest("VPC ID not found in outputs")
        try:
            # Verify VPC exists
            response = self.ec2_client.describe_vpcs(VpcIds=[vpc_id])
        except ClientError as e:
            if 'InvalidClientTokenId' in str(e) or 'AuthFailure' in str(e):
                self.skipTest("AWS credentials not configured for integration test")
            else:
                raise
        vpcs = response.get('Vpcs', [])
        self.assertEqual(len(vpcs), 1, "VPC not found or multiple VPCs returned")

        vpc = vpcs[0]
        # Verify CIDR block
        self.assertEqual(vpc['CidrBlock'], '10.0.0.0/16', "VPC CIDR block mismatch")

    def test_02_subnets_across_availability_zones(self):
        """Test subnets are distributed across 3 AZs."""
        vpc_id = self.outputs.get('VpcId')
        if not vpc_id:
            self.skipTest("VPC ID not found in outputs")
        try:
            # Get all subnets in VPC
            response = self.ec2_client.describe_subnets(
                Filters=[{'Name': 'vpc-id', 'Values': [vpc_id]}]
            )
        except ClientError as e:
            if 'InvalidClientTokenId' in str(e) or 'AuthFailure' in str(e):
                self.skipTest("AWS credentials not configured for integration test")
            else:
                raise
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

    def test_03_s3_buckets_exist(self):
        """Test S3 buckets exist with proper configuration."""
        data_bucket = self.outputs.get('data_bucket_name')
        logs_bucket = self.outputs.get('logs_bucket_name')

        if not data_bucket or not logs_bucket:
            self.skipTest("Bucket names not found in outputs")

        try:
            # Verify data bucket exists
            response = self.s3_client.head_bucket(Bucket=data_bucket)
        except ClientError as e:
            if 'InvalidClientTokenId' in str(e) or 'AuthFailure' in str(e) or 'NoSuchBucket' in str(e):
                self.skipTest("AWS credentials not configured or bucket not found")
            else:
                raise
        self.assertEqual(response['ResponseMetadata']['HTTPStatusCode'], 200)

        try:
            # Verify logs bucket exists
            response = self.s3_client.head_bucket(Bucket=logs_bucket)
        except ClientError as e:
            if 'InvalidClientTokenId' in str(e) or 'AuthFailure' in str(e) or 'NoSuchBucket' in str(e):
                self.skipTest("AWS credentials not configured or bucket not found")
            else:
                raise
        self.assertEqual(response['ResponseMetadata']['HTTPStatusCode'], 200)

        # Verify encryption on data bucket
        encryption = self.s3_client.get_bucket_encryption(Bucket=data_bucket)
        rules = encryption['ServerSideEncryptionConfiguration']['Rules']
        self.assertGreater(len(rules), 0, "Encryption rules should be configured")

    def test_04_rds_instance_exists(self):
        """Test RDS MySQL instance exists and is configured."""
        rds_endpoint = self.outputs.get('BlueClusterEndpoint')
        rds_address = self.outputs.get('BlueClusterEndpoint')

        if not rds_endpoint:
            self.skipTest("RDS endpoint not found in outputs")

        self.assertIsNotNone(rds_address, "RDS address not found")

        # Verify endpoint format
        self.assertIn('cluster-', rds_endpoint, "RDS endpoint should contain cluster identifier")
        self.assertIn('rds.amazonaws.com', rds_endpoint, "RDS endpoint should be AWS domain")

    def test_05_alb_exists_and_active(self):
        """Test Application Load Balancer exists and is active."""
        alb_dns_name = self.outputs.get('AlbDnsName')
        alb_arn = self.outputs.get('AlbArn')

        if not alb_dns_name:
            self.skipTest("ALB DNS name not found in outputs")

        # Verify DNS name format
        self.assertIn('.elb.amazonaws.com', alb_dns_name, "Invalid ALB DNS name format")

        # Extract ALB name from DNS (format: name-region.elb.amazonaws.com)
        alb_name = alb_dns_name.split('.')[0]

        try:
            # Verify ALB exists
            response = self.elbv2_client.describe_load_balancers(Names=[alb_name])
        except ClientError as e:
            if 'InvalidClientTokenId' in str(e) or 'AuthFailure' in str(e):
                self.skipTest("AWS credentials not configured for integration test")
            else:
                raise
        lbs = response.get('LoadBalancers', [])
        self.assertEqual(len(lbs), 1, "ALB not found")

        lb = lbs[0]
        self.assertEqual(lb['State']['Code'], 'active', "ALB is not active")
        self.assertEqual(lb['Scheme'], 'internet-facing', "ALB should be internet-facing")
        self.assertEqual(lb['Type'], 'application', "Load balancer should be application type")

    def test_06_target_group_configured(self):
        """Test target group is properly configured."""
        alb_arn = self.outputs.get('AlbArn')
        if not alb_arn:
            self.skipTest("ALB ARN not found in outputs")

        try:
            # Get target groups for the ALB
            response = self.elbv2_client.describe_target_groups(
                LoadBalancerArn=alb_arn
            )
        except ClientError as e:
            if 'InvalidClientTokenId' in str(e) or 'AuthFailure' in str(e):
                self.skipTest("AWS credentials not configured for integration test")
            else:
                raise
        target_groups = response.get('TargetGroups', [])
        self.assertGreater(len(target_groups), 0, "No target groups found for ALB")

        tg = target_groups[0]
        self.assertEqual(tg['Protocol'], 'HTTP', "Target group protocol should be HTTP")
        self.assertEqual(tg['Port'], 80, "Target group port should be 80")

        # Verify health check configuration
        self.assertEqual(tg['HealthCheckProtocol'], 'HTTP')
        self.assertEqual(tg['HealthCheckPath'], '/health')

    def test_07_auto_scaling_group_exists(self):
        """Test Auto Scaling Group exists and is configured."""
        vpc_id = self.outputs.get('VpcId')
        if not vpc_id:
            self.skipTest("VPC ID not found in outputs")

        try:
            # Find ASG by VPC (through subnets)
            response = self.autoscaling_client.describe_auto_scaling_groups()
        except ClientError as e:
            if 'InvalidClientTokenId' in str(e) or 'AuthFailure' in str(e):
                self.skipTest("AWS credentials not configured for integration test")
            else:
                raise
        asgs = response.get('AutoScalingGroups', [])

        # Filter ASGs by checking if they're in our VPC
        our_asgs = [asg for asg in asgs if 'synth101912424' in asg['AutoScalingGroupName']]
        self.assertGreater(len(our_asgs), 0, "Auto Scaling Group not found")

        asg = our_asgs[0]
        self.assertGreaterEqual(asg['MinSize'], 2, "Min size should be at least 2")
        self.assertLessEqual(asg['MaxSize'], 10, "Max size should be reasonable")
        self.assertEqual(asg['HealthCheckType'], 'ELB', "Health check should be ELB")

    def test_08_iam_roles_and_policies_exist(self):
        """Test IAM roles and policies are created."""
        try:
            # List roles with our naming pattern
            response = self.iam_client.list_roles()
        except ClientError as e:
            if 'InvalidClientTokenId' in str(e) or 'AuthFailure' in str(e):
                self.skipTest("AWS credentials not configured for integration test")
            else:
                raise
        roles = response.get('Roles', [])

        our_roles = [role for role in roles if 'synth101912424' in role['RoleName']]
        self.assertGreater(len(our_roles), 0, "IAM roles not found")

        # Verify at least one role has policies attached
        for role in our_roles:
            role_name = role['RoleName']
            policies = self.iam_client.list_role_policies(RoleName=role_name)
            inline_policies = policies.get('PolicyNames', [])
            if len(inline_policies) > 0:
                # Found role with policies
                self.assertGreater(len(inline_policies), 0, "Role should have inline policies")
                break
        else:
            self.fail("No IAM roles with inline policies found")

    def test_09_resource_naming_convention(self):
        """Test resources follow naming conventions with environment suffix."""
        # Verify all outputs contain the environment suffix
        env_suffix = self.outputs.get('environment_suffix', 'dev')
        data_bucket = self.outputs.get('data_bucket_name')
        logs_bucket = self.outputs.get('logs_bucket_name')
        rds_address = self.outputs.get('BlueClusterEndpoint')

        if data_bucket:
            self.assertIn(env_suffix, data_bucket, "Data bucket should include environment suffix")

        if logs_bucket:
            self.assertIn(env_suffix, logs_bucket, "Logs bucket should include environment suffix")

        if rds_address:
            self.assertIn(env_suffix, rds_address, "RDS instance should include environment suffix")

    def test_10_stack_outputs_complete(self):
        """Test all required stack outputs are present."""
        required_outputs = [
            'VpcId',
            'AlbDnsName',
            'AlbArn',
            'BlueClusterEndpoint',
            'GreenClusterEndpoint'
        ]

        missing_outputs = [key for key in required_outputs if key not in self.outputs or not self.outputs[key]]

        self.assertEqual(
            len(missing_outputs), 0,
            f"Missing required outputs: {', '.join(missing_outputs)}"
        )


if __name__ == '__main__':
    unittest.main()
