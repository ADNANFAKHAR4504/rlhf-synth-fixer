"""
Integration tests for deployed AWS infrastructure
Tests validate actual deployed resources using stack outputs
"""

import json
import os
import unittest
from pathlib import Path
import boto3

OUTPUT_CANDIDATES = []

env_override = os.environ.get('CFN_OUTPUTS_FILE')
if env_override:
    OUTPUT_CANDIDATES.append(Path(env_override))

OUTPUT_CANDIDATES.extend([
    Path(__file__).resolve().parents[2] / 'cfn-outputs' / 'flat-outputs-simple.json',
    Path(__file__).resolve().parents[2] / 'cfn-outputs' / 'flat-outputs.json',
])


def _resolve_outputs_path() -> Path:
    for candidate in OUTPUT_CANDIDATES:
        if candidate.exists():
            return candidate
    raise FileNotFoundError(
        "Stack outputs not found. Looked in: "
        + ", ".join(str(p) for p in OUTPUT_CANDIDATES)
    )


class TestDeployedInfrastructure(unittest.TestCase):
    """Integration tests for deployed AWS infrastructure"""

    @classmethod
    def setUpClass(cls):
        """Load stack outputs and initialize AWS clients"""
        outputs_path = _resolve_outputs_path()

        with outputs_path.open('r') as f:
            cls.outputs = json.load(f)

        # Initialize AWS clients
        cls.ec2_client = boto3.client('ec2', region_name='us-east-1')
        cls.elbv2_client = boto3.client('elbv2', region_name='us-east-1')
        cls.rds_client = boto3.client('rds', region_name='us-east-1')
        cls.s3_client = boto3.client('s3', region_name='us-east-1')

    def test_vpc_exists(self):
        """Test that VPC exists and is available"""
        vpc_id = self.outputs['vpc_id']
        self.assertIsNotNone(vpc_id, "VPC ID should be present in outputs")

        response = self.ec2_client.describe_vpcs(VpcIds=[vpc_id])
        vpcs = response['Vpcs']

        self.assertEqual(len(vpcs), 1, "Expected exactly one VPC")
        self.assertEqual(vpcs[0]['VpcId'], vpc_id)
        self.assertEqual(vpcs[0]['State'], 'available', "VPC should be available")

    def test_alb_exists_and_active(self):
        """Test that Application Load Balancer exists and is active"""
        alb_arn = self.outputs['alb_arn']
        self.assertIsNotNone(alb_arn, "ALB ARN should be present in outputs")

        response = self.elbv2_client.describe_load_balancers(LoadBalancerArns=[alb_arn])
        albs = response['LoadBalancers']

        self.assertEqual(len(albs), 1, "Expected exactly one ALB")
        self.assertEqual(albs[0]['LoadBalancerArn'], alb_arn)
        self.assertEqual(albs[0]['State']['Code'], 'active', "ALB should be active")
        self.assertEqual(albs[0]['Type'], 'application', "Should be application load balancer")

    def test_alb_dns_name_resolves(self):
        """Test that ALB DNS name is valid"""
        alb_dns_name = self.outputs['alb_dns_name']
        self.assertIsNotNone(alb_dns_name, "ALB DNS name should be present in outputs")
        self.assertTrue(alb_dns_name.endswith('.elb.amazonaws.com'), "ALB DNS should end with .elb.amazonaws.com")

        # Verify it matches the describe output
        alb_arn = self.outputs['alb_arn']
        response = self.elbv2_client.describe_load_balancers(LoadBalancerArns=[alb_arn])
        actual_dns = response['LoadBalancers'][0]['DNSName']
        self.assertEqual(alb_dns_name, actual_dns, "DNS name should match")

    def test_rds_cluster_exists(self):
        """Test that RDS Aurora cluster exists and is available"""
        cluster_endpoint = self.outputs['rds_cluster_endpoint']
        self.assertIsNotNone(cluster_endpoint, "RDS cluster endpoint should be present")

        # Extract cluster identifier from endpoint
        cluster_id = cluster_endpoint.split('.')[0]

        response = self.rds_client.describe_db_clusters(
            DBClusterIdentifier=cluster_id
        )
        clusters = response['DBClusters']

        self.assertEqual(len(clusters), 1, "Expected exactly one cluster")
        self.assertEqual(clusters[0]['Engine'], 'aurora-postgresql', "Should be Aurora PostgreSQL")
        self.assertTrue(clusters[0]['StorageEncrypted'], "Storage should be encrypted")

    def test_rds_reader_endpoint_exists(self):
        """Test that RDS reader endpoint is configured"""
        reader_endpoint = self.outputs['rds_reader_endpoint']
        self.assertIsNotNone(reader_endpoint, "RDS reader endpoint should be present")
        self.assertTrue('cluster-ro' in reader_endpoint, "Reader endpoint should contain 'cluster-ro'")

    def test_s3_static_bucket_exists(self):
        """Test that static assets S3 bucket exists"""
        bucket_name = self.outputs['static_assets_bucket']
        self.assertIsNotNone(bucket_name, "Static assets bucket name should be present")

        # Verify bucket exists
        response = self.s3_client.head_bucket(Bucket=bucket_name)
        self.assertEqual(response['ResponseMetadata']['HTTPStatusCode'], 200, "Bucket should exist")

        # Verify encryption is enabled
        encryption = self.s3_client.get_bucket_encryption(Bucket=bucket_name)
        rules = encryption['ServerSideEncryptionConfiguration']['Rules']
        self.assertTrue(len(rules) > 0, "Encryption rules should be configured")

    def test_vpc_has_subnets(self):
        """Test that VPC has public and private subnets"""
        vpc_id = self.outputs['vpc_id']

        response = self.ec2_client.describe_subnets(
            Filters=[{'Name': 'vpc-id', 'Values': [vpc_id]}]
        )
        subnets = response['Subnets']

        # Should have at least 4 subnets (2 public, 2 private across 2 AZs)
        self.assertGreaterEqual(len(subnets), 4, "Should have at least 4 subnets")

        # Verify subnets are in different availability zones
        azs = set([subnet['AvailabilityZone'] for subnet in subnets])
        self.assertGreaterEqual(len(azs), 2, "Subnets should span at least 2 AZs")

    def test_alb_has_security_group(self):
        """Test that ALB has security group configured"""
        alb_arn = self.outputs['alb_arn']

        response = self.elbv2_client.describe_load_balancers(LoadBalancerArns=[alb_arn])
        alb = response['LoadBalancers'][0]

        security_groups = alb.get('SecurityGroups', [])
        self.assertGreater(len(security_groups), 0, "ALB should have at least one security group")

    def test_integration_workflow(self):
        """Test complete infrastructure integration"""
        # Verify all critical outputs are present
        required_outputs = [
            'vpc_id', 'alb_arn', 'alb_dns_name',
            'rds_cluster_endpoint', 'rds_reader_endpoint',
            'static_assets_bucket'
        ]

        for output in required_outputs:
            self.assertIn(output, self.outputs, f"{output} should be in stack outputs")
            self.assertIsNotNone(self.outputs[output], f"{output} should not be None")


if __name__ == '__main__':
    unittest.main()
